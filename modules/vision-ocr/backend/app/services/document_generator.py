"""
Document Generator Service — Vision OCR Advisory Flow
======================================================
Chọn template NĐ30 tương ứng và fill dữ liệu có nhãn tường minh vào đúng field.
Input có cấu trúc rõ ràng từ FieldResolver → Validator score cao hơn đáng kể so với luồng OCR.

Thiết kế:
  - Nhận filled_fields từ FieldResolver (mọi field đều có label rõ ràng).
  - Build ND30ExportPayload đúng schema — không suy luận vị trí.
  - Đánh dấu input_mode = "structured" để nd30_exporter biết dùng luồng A.
  - Xử lý đặc thù cho từng loại văn bản (articles parsing, bases list...).
"""

from __future__ import annotations

import datetime
import logging
from dataclasses import dataclass
from typing import Literal, Optional

from app.services.field_schema import get_schema

logger = logging.getLogger(__name__)

InputMode = Literal["structured", "ocr_inferred"]


# ─── GeneratedDocument ────────────────────────────────────────────────────────

@dataclass
class GeneratedDocument:
    doc_type: str
    export_payload: dict              # ND30ExportPayload-compatible dict
    input_mode: InputMode             # "structured" → luồng A (ít lỗi)
    validation_ready: bool            # True nếu tất cả required field đã điền
    missing_required: list[str]       # Tên field còn thiếu (nếu có)
    generation_warnings: list[str]    # Cảnh báo nhỏ (field optional còn trống...)
    preview_markdown: str = ""

    def to_dict(self) -> dict:
        return {
            "doc_type": self.doc_type,
            "export_payload": self.export_payload,
            "input_mode": self.input_mode,
            "validation_ready": self.validation_ready,
            "missing_required": self.missing_required,
            "generation_warnings": self.generation_warnings,
            "preview_markdown": self.preview_markdown,
        }


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _today_location_date(location: str = "Hà Nội") -> str:
    """Tạo chuỗi địa danh-ngày mặc định."""
    now = datetime.datetime.now()
    return f"{location}, ngày {now.day:02d} tháng {now.month:02d} năm {now.year}"


def _parse_list_field(value: str) -> list[str]:
    """
    Parse textarea list thành list[str].
    Hỗ trợ định dạng: "- item1;\n- item2;" hoặc "item1\nitem2".
    """
    if not value:
        return []
    lines = [
        line.strip().lstrip("-").lstrip("•").strip().rstrip(";").strip()
        for line in value.splitlines()
        if line.strip() and line.strip() not in ("-", "•")
    ]
    return [ln for ln in lines if ln]


def _parse_articles(value: str) -> list[dict]:
    """
    Parse nội dung điều khoản thành list[{title, content}].
    Hỗ trợ định dạng: "Điều 1: ...\nĐiều 2: ..."
    """
    if not value:
        return [{"title": "Điều 1", "content": ""}]

    import re
    # Tìm các Điều có đánh số
    pattern = re.compile(r"(Điều\s+\d+[:\.\s])", re.IGNORECASE)
    parts = pattern.split(value)

    articles = []
    if len(parts) <= 1:
        # Không có format Điều X — wrap toàn bộ vào Điều 1
        return [{"title": "Điều 1", "content": value.strip()}]

    i = 1
    while i < len(parts):
        title = parts[i].strip().rstrip(":")
        content = parts[i + 1].strip() if i + 1 < len(parts) else ""
        articles.append({"title": title, "content": content})
        i += 2

    return articles if articles else [{"title": "Điều 1", "content": value.strip()}]


# ─── Main service ─────────────────────────────────────────────────────────────

class DocumentGeneratorService:
    """
    Tạo ND30ExportPayload từ filled_fields đã gắn nhãn tường minh.
    Không suy luận vị trí — mỗi field → đúng slot trong template.
    """

    def generate(
        self,
        doc_type: str,
        filled_fields: dict[str, str],
    ) -> GeneratedDocument:
        """
        Tạo văn bản từ filled_fields.

        Args:
            doc_type: Loại văn bản (e.g. "QUYẾT ĐỊNH").
            filled_fields: Dict key→value từ FieldResolver (đã validate).

        Returns:
            GeneratedDocument với export_payload sẵn sàng cho nd30_exporter.
        """
        schema = get_schema(doc_type)
        if not schema:
            return GeneratedDocument(
                doc_type=doc_type,
                export_payload={},
                input_mode="structured",
                validation_ready=False,
                missing_required=[f"Loại văn bản '{doc_type}' chưa được hỗ trợ"],
                generation_warnings=[],
            )

        missing_required: list[str] = []
        generation_warnings: list[str] = []

        # Kiểm tra required fields
        for field_def in schema.fields:
            if field_def.required and not filled_fields.get(field_def.key, "").strip():
                missing_required.append(field_def.label)

        # Build payload theo từng loại văn bản
        payload = self._build_payload(doc_type, filled_fields, generation_warnings)
        payload["input_mode"] = "structured"  # marker cho exporter

        validation_ready = len(missing_required) == 0
        preview_md = self._build_markdown_preview(payload)

        return GeneratedDocument(
            doc_type=doc_type,
            export_payload=payload,
            input_mode="structured",
            validation_ready=validation_ready,
            missing_required=missing_required,
            generation_warnings=generation_warnings,
            preview_markdown=preview_md,
        )

    def _build_markdown_preview(self, payload: dict) -> str:
        """Tạo bản xem trước Markdown chuẩn thể thức Nghị định 30/2020/NĐ-CP."""
        doc_type = payload.get("doc_type", "VĂN BẢN").strip()
        company = payload.get("company_name", "").strip()
        department = payload.get("department", "").strip()
        location_date = payload.get("location_date", "").strip()
        doc_number = payload.get("doc_number", "").strip()
        subject = payload.get("subject", "").strip()
        kinh_gui = payload.get("kinh_gui", "").strip()
        bases = payload.get("bases", [])
        articles = payload.get("articles", [])
        signatory_title = payload.get("signatory_title", "").strip()
        signatory_name = payload.get("signatory_name", "").strip()
        recipients = payload.get("recipients", [])

        lines = [
            "**CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM**  \n**Độc lập - Tự do - Hạnh phúc**  \n*---------------*",
        ]

        header_lines = []
        if company:
            header_lines.append(f"**{company.upper()}**")
        if department:
            header_lines.append(f"*{department}*")
        if doc_number:
            header_lines.append(f"Số: {doc_number}")

        if header_lines:
            lines.append("  \n".join(header_lines))

        if location_date:
            lines.append(f"*{location_date}*")

        lines.append("")
        lines.append(f"# {doc_type.upper()}")

        if kinh_gui:
            lines.append(f"**Kính gửi:** {kinh_gui}")

        if subject:
            lines.append(f"*{subject}*")

        lines.append("")

        if bases:
            for b in bases:
                lines.append(f"- *{b}*")
            lines.append("")

        for art in articles:
            title = art.get("title", "").strip()
            content = art.get("content", "").strip()
            if title:
                lines.append(f"**{title}**")
            if content:
                lines.append(content)
            lines.append("")

        lines.append("---")
        footer_sections = []
        if recipients:
            rec_list = "\n".join(f"- {r}" for r in recipients)
            footer_sections.append(f"**Nơi nhận:**\n{rec_list}")

        signer_block = []
        if signatory_title:
            signer_block.append(f"**{signatory_title.upper()}**")
        signer_block.append("*(Ký, ghi rõ họ tên)*")
        if signatory_name:
            signer_block.append(f"\n\n**{signatory_name}**")
        footer_sections.append("\n".join(signer_block))

        lines.append("\n\n".join(footer_sections))

        return "\n\n".join(lines)

    # ── Payload builders per doc type ─────────────────────────────────────────

    def _build_payload(
        self,
        doc_type: str,
        f: dict[str, str],
        warnings: list[str],
    ) -> dict:
        """Dispatch payload building theo loại văn bản."""
        builders = {
            "QUYẾT ĐỊNH": self._build_quyet_dinh,
            "CÔNG VĂN": self._build_cong_van,
            "BÁO CÁO": self._build_bao_cao,
            "TỜ TRÌNH": self._build_to_trinh,
            "BIÊN BẢN": self._build_bien_ban,
            "BẢN TƯỜNG TRÌNH": self._build_ban_tuong_trinh,
            "GIẤY NGHỈ PHÉP": self._build_giay_nghi_phep,
            "THÔNG BÁO": self._build_thong_bao,
        }
        builder = builders.get(doc_type, self._build_generic)
        return builder(f, warnings)

    def _common_header(self, f: dict, warnings: list) -> dict:
        """Phần header chung: cơ quan, số ký hiệu, địa danh."""
        location_date = f.get("location_date", "").strip()
        if not location_date:
            location = f.get("location", "Hà Nội")
            location_date = _today_location_date(location)
            warnings.append("Địa danh-ngày tự động điền ngày hôm nay. Vui lòng kiểm tra.")

        return {
            "doc_type": f.get("doc_type", ""),
            "company_name": f.get("company_name", ""),
            "department": f.get("department", ""),
            "doc_number": f.get("doc_number", ""),
            "location_date": location_date,
        }

    def _common_footer(self, f: dict) -> dict:
        """Phần footer chung: ký duyệt, nơi nhận."""
        recipients_raw = f.get("recipients", "")
        recipients = _parse_list_field(recipients_raw) if isinstance(recipients_raw, str) else recipients_raw
        if not recipients:
            recipients = ["Lưu: VT."]

        return {
            "signatory_title": f.get("signatory_title", ""),
            "signatory_name": f.get("signatory_name", ""),
            "recipients": recipients,
        }

    def _build_quyet_dinh(self, f: dict, warnings: list) -> dict:
        payload = {
            **self._common_header({**f, "doc_type": "QUYẾT ĐỊNH"}, warnings),
            "subject": f.get("subject", ""),
            "bases": _parse_list_field(f.get("bases", "")),
            "articles": _parse_articles(f.get("articles", "")),
            **self._common_footer(f),
        }
        if not payload["bases"]:
            warnings.append("Chưa có căn cứ ban hành. Nên bổ sung trước khi xuất.")
        return payload

    def _build_cong_van(self, f: dict, warnings: list) -> dict:
        content = f.get("articles", "")
        kinh_gui = f.get("kinh_gui", "")
        if kinh_gui:
            content = f"Kính gửi: {kinh_gui}\n\n{content}"
        return {
            **self._common_header({**f, "doc_type": "CÔNG VĂN"}, warnings),
            "subject": f.get("subject", ""),
            "bases": [],
            "articles": [{"title": "", "content": content}],
            **self._common_footer(f),
        }

    def _build_bao_cao(self, f: dict, warnings: list) -> dict:
        return {
            **self._common_header({**f, "doc_type": "BÁO CÁO"}, warnings),
            "subject": f.get("subject", ""),
            "bases": [],
            "articles": _parse_articles(f.get("articles", "")),
            **self._common_footer(f),
        }

    def _build_to_trinh(self, f: dict, warnings: list) -> dict:
        return {
            **self._common_header({**f, "doc_type": "TỜ TRÌNH"}, warnings),
            "subject": f.get("subject", ""),
            "bases": _parse_list_field(f.get("bases", "")),
            "articles": _parse_articles(f.get("articles", "")),
            **self._common_footer(f),
        }

    def _build_bien_ban(self, f: dict, warnings: list) -> dict:
        content_parts = []
        if f.get("meeting_time"):
            content_parts.append(f"Thời gian, địa điểm: {f['meeting_time']}")
        if f.get("attendees"):
            content_parts.append(f"Thành phần tham dự:\n{f['attendees']}")
        if f.get("articles"):
            content_parts.append(f.get("articles", ""))
        if f.get("end_time"):
            content_parts.append(f"Thời gian kết thúc: {f['end_time']}")

        secretary_name = f.get("secretary_name", "")

        return {
            **self._common_header({**f, "doc_type": "BIÊN BẢN"}, warnings),
            "subject": f.get("subject", ""),
            "bases": [],
            "articles": [{"title": "", "content": "\n\n".join(content_parts)}],
            "signatory_title": f.get("signatory_title", "CHỦ TỌA"),
            "signatory_name": f.get("signatory_name", ""),
            "secretary_name": secretary_name,
            "recipients": [],
        }

    def _build_ban_tuong_trinh(self, f: dict, warnings: list) -> dict:
        # Bản tường trình: không có cơ quan ban hành, chỉ có thông tin cá nhân
        location_date = f.get("location_date", _today_location_date())
        personal_info = []
        if f.get("full_name"):
            personal_info.append(f"Họ và tên: {f['full_name']}")
        if f.get("dob"):
            personal_info.append(f"Ngày sinh: {f['dob']}")
        if f.get("position"):
            personal_info.append(f"Chức vụ: {f['position']}")
        if f.get("id_number"):
            personal_info.append(f"Số CCCD/CMND: {f['id_number']}")
        if f.get("address"):
            personal_info.append(f"Địa chỉ: {f['address']}")

        kinh_gui = f.get("kinh_gui", "")
        content = f.get("articles", "")

        full_content = ""
        if kinh_gui:
            full_content += f"Kính gửi: {kinh_gui}\n\n"
        if personal_info:
            full_content += "\n".join(personal_info) + "\n\n"
        if content:
            full_content += content

        return {
            "doc_type": "BẢN TƯỜNG TRÌNH",
            "company_name": "",
            "department": "",
            "doc_number": "",
            "location_date": location_date,
            "subject": f.get("subject", "Về việc tường trình sự việc"),
            "bases": [],
            "articles": [{"title": "", "content": full_content}],
            "signatory_title": f.get("position", ""),
            "signatory_name": f.get("signatory_name", f.get("full_name", "")),
            "recipients": [kinh_gui] if kinh_gui else ["Ban Giám đốc"],
            "kinh_gui": kinh_gui,
        }

    def _build_giay_nghi_phep(self, f: dict, warnings: list) -> dict:
        # Build nội dung đơn xin nghỉ phép
        content_parts = []
        personal_info = []
        if f.get("full_name"):
            personal_info.append(f"Họ và tên: {f.get('full_name', '')}")
        if f.get("position"):
            personal_info.append(f"Chức vụ: {f.get('position', '')}")
        if f.get("department"):
            personal_info.append(f"Bộ phận: {f.get('department', '')}")
        if personal_info:
            content_parts.append("\n".join(personal_info))

        leave_info = []
        if f.get("leave_reason"):
            leave_info.append(f"Lý do: {f.get('leave_reason', '')}")
        if f.get("leave_days"):
            leave_info.append(f"Số ngày nghỉ: {f.get('leave_days', '')}")
        if f.get("leave_from") and f.get("leave_to"):
            leave_info.append(f"Thời gian nghỉ: Từ ngày {f.get('leave_from', '')} đến ngày {f.get('leave_to', '')}")
        if f.get("phone"):
            leave_info.append(f"SĐT liên hệ khi cần: {f.get('phone', '')}")
        if f.get("handover_to"):
            leave_info.append(f"Bàn giao công việc cho: {f.get('handover_to', '')}")
        if leave_info:
            content_parts.append("\n".join(leave_info))

        content_parts.append("Kính mong Ban Giám đốc và Phòng Nhân sự xem xét và chấp thuận.\nTôi xin trân trọng cảm ơn!")

        kinh_gui = f.get("kinh_gui", "Ban Giám đốc và Phòng Nhân sự")
        raw_loc_date = (f.get("location_date") or "").strip()
        if not raw_loc_date:
            location_date = _today_location_date()
        elif "ngày" not in raw_loc_date.lower():
            location_date = _today_location_date(raw_loc_date)
        else:
            location_date = raw_loc_date

        return {
            "doc_type": "GIẤY NGHỈ PHÉP",
            "company_name": f.get("company_name", ""),
            "department": "",
            "doc_number": "",
            "location_date": location_date,
            "subject": f"Về việc xin nghỉ phép{(' - ' + f.get('leave_reason')) if f.get('leave_reason') else ''}",
            "bases": [],
            "articles": [{"title": "", "content": "\n\n".join(content_parts)}],
            "signatory_title": f.get("position", ""),
            "signatory_name": f.get("signatory_name", f.get("full_name", "")),
            "recipients": [kinh_gui, "Lưu: VT, P.NS."],
            "kinh_gui": kinh_gui,
        }

    def _build_thong_bao(self, f: dict, warnings: list) -> dict:
        return {
            **self._common_header({**f, "doc_type": "THÔNG BÁO"}, warnings),
            "subject": f.get("subject", ""),
            "bases": [],
            "articles": _parse_articles(f.get("articles", "")),
            **self._common_footer(f),
        }

    def _build_generic(self, f: dict, warnings: list) -> dict:
        """Fallback cho loại văn bản chưa có builder riêng."""
        warnings.append(f"Loại văn bản này chưa có template chuyên biệt. Đã sử dụng format chung.")
        return {
            **self._common_header(f, warnings),
            "subject": f.get("subject", ""),
            "bases": _parse_list_field(f.get("bases", "")),
            "articles": _parse_articles(f.get("articles", "")),
            **self._common_footer(f),
        }
