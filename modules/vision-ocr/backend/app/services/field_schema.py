"""
Field Schema Registry — Vision OCR Advisory Flow
==================================================
Chuẩn hóa Field Schema cho 8 loại văn bản hành chính phổ biến nhất theo Nghị định 30/2020/NĐ-CP.

Mỗi FieldDef bao gồm:
  - key          : tên trường duy nhất, map sang ND30ExportPayload
  - label        : tên hiển thị tiếng Việt cho người dùng
  - required     : bắt buộc hay không
  - description  : hướng dẫn ngắn cho người dùng
  - source_hint  : đường dẫn vào UserProfile nếu có thể tự điền (e.g. "profile.full_name")
  - input_type   : kiểu input gợi ý cho frontend ("text" | "textarea" | "date" | "list")
  - group        : nhóm hiển thị trên form
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional


# ─── Primitive types ──────────────────────────────────────────────────────────

InputType = Literal["text", "textarea", "date", "list"]
FieldGroup = Literal["co_quan", "noi_dung", "ky_duyet", "noi_nhan", "ca_nhan"]


@dataclass
class FieldDef:
    key: str
    label: str
    required: bool
    description: str
    input_type: InputType = "text"
    group: FieldGroup = "noi_dung"
    source_hint: Optional[str] = None  # e.g. "profile.full_name", "profile.organization"
    placeholder: str = ""

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "label": self.label,
            "required": self.required,
            "description": self.description,
            "input_type": self.input_type,
            "group": self.group,
            "source_hint": self.source_hint,
            "placeholder": self.placeholder,
        }


@dataclass
class FieldSchema:
    doc_type: str
    description: str
    cite: str
    fields: list[FieldDef] = field(default_factory=list)

    def get_required_keys(self) -> list[str]:
        return [f.key for f in self.fields if f.required]

    def get_field(self, key: str) -> Optional[FieldDef]:
        return next((f for f in self.fields if f.key == key), None)

    def to_dict(self) -> dict:
        return {
            "doc_type": self.doc_type,
            "description": self.description,
            "cite": self.cite,
            "fields": [f.to_dict() for f in self.fields],
        }


# ─── Common field templates (tái dùng nhiều loại VB) ─────────────────────────

def _quoc_hieu_fields() -> list[FieldDef]:
    """Quốc hiệu, Tiêu ngữ — luôn cố định, không cần người dùng điền."""
    return []  # Backend tự điền chuẩn NĐ30


def _co_quan_fields() -> list[FieldDef]:
    return [
        FieldDef(
            key="company_name",
            label="Tên cơ quan ban hành",
            required=True,
            description="Tên đầy đủ của cơ quan/đơn vị ban hành văn bản (in hoa).",
            input_type="text",
            group="co_quan",
            source_hint="profile.organization",
            placeholder="Ví dụ: CÔNG TY CỔ PHẦN ABC",
        ),
        FieldDef(
            key="department",
            label="Phòng/Ban trực thuộc",
            required=False,
            description="Phòng ban cụ thể nếu văn bản phát hành từ đơn vị con.",
            input_type="text",
            group="co_quan",
            source_hint="profile.department",
            placeholder="Ví dụ: Phòng Nhân sự",
        ),
        FieldDef(
            key="doc_number",
            label="Số và Ký hiệu văn bản",
            required=True,
            description="Số thứ tự và ký hiệu theo quy định. Ví dụ: 15/QĐ-UBND",
            input_type="text",
            group="co_quan",
            source_hint=None,
            placeholder="Ví dụ: 15/QĐ-ABC",
        ),
        FieldDef(
            key="location_date",
            label="Địa danh và Ngày ban hành",
            required=True,
            description="Địa danh nơi ban hành và ngày tháng năm. Ví dụ: Hà Nội, ngày 22 tháng 9 năm 2026",
            input_type="text",
            group="co_quan",
            source_hint="profile.location",
            placeholder="Hà Nội, ngày 22 tháng 9 năm 2026",
        ),
    ]


def _ky_duyet_fields(authority_hint: str = "TM.") -> list[FieldDef]:
    return [
        FieldDef(
            key="signatory_title",
            label="Chức vụ người ký",
            required=True,
            description=f"Thẩm quyền ký văn bản. Thường bắt đầu bằng {authority_hint} (Thay mặt), KT. (Ký thay), TL. (Thừa lệnh), TUQ. (Thừa ủy quyền).",
            input_type="text",
            group="ky_duyet",
            source_hint="profile.title",
            placeholder=f"{authority_hint} GIÁM ĐỐC",
        ),
        FieldDef(
            key="signatory_name",
            label="Họ và tên người ký",
            required=True,
            description="Họ và tên đầy đủ của người ký (in hoa).",
            input_type="text",
            group="ky_duyet",
            source_hint="profile.full_name",
            placeholder="NGUYỄN VĂN AN",
        ),
    ]


def _noi_nhan_field() -> FieldDef:
    return FieldDef(
        key="recipients",
        label="Nơi nhận",
        required=True,
        description="Danh sách nơi nhận văn bản. Mỗi dòng một nơi nhận. Phải có dòng 'Lưu: VT,...'",
        input_type="list",
        group="noi_nhan",
        source_hint=None,
        placeholder="- Ban Giám đốc;\n- Phòng Nhân sự;\n- Lưu: VT, P.HC.",
    )


# ─── Field Schema Registry ────────────────────────────────────────────────────

FIELD_SCHEMAS: dict[str, FieldSchema] = {

    "QUYẾT ĐỊNH": FieldSchema(
        doc_type="QUYẾT ĐỊNH",
        description="Văn bản quyết định của thủ trưởng cơ quan về nhân sự, tổ chức, khen thưởng, kỷ luật hoặc các vấn đề quản lý.",
        cite="Điều 7 NĐ 30/2020/NĐ-CP & Phụ lục I (Mẫu 1.2 & 1.3)",
        fields=[
            *_co_quan_fields(),
            FieldDef(
                key="subject",
                label="Trích yếu nội dung (Về việc...)",
                required=True,
                description="Nội dung ngắn gọn của quyết định. Ví dụ: Về việc bổ nhiệm Trưởng phòng Kinh doanh.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="Về việc ...",
            ),
            FieldDef(
                key="bases",
                label="Căn cứ ban hành",
                required=True,
                description="Danh sách căn cứ pháp lý. Mỗi dòng một căn cứ, kết thúc bằng dấu chấm phẩy (;).",
                input_type="list",
                group="noi_dung",
                source_hint=None,
                placeholder="- Bộ luật Lao động 2019;\n- Điều lệ Công ty;",
            ),
            FieldDef(
                key="articles",
                label="Nội dung các Điều khoản",
                required=True,
                description="Nội dung chi tiết từng Điều. Ví dụ: Điều 1: Bổ nhiệm ông/bà... Điều 2: Hiệu lực...",
                input_type="textarea",
                group="noi_dung",
                source_hint=None,
                placeholder="Điều 1: ...\nĐiều 2: Quyết định này có hiệu lực kể từ ngày ký.\nĐiều 3: ...",
            ),
            *_ky_duyet_fields("TM."),
            _noi_nhan_field(),
        ],
    ),

    "CÔNG VĂN": FieldSchema(
        doc_type="CÔNG VĂN",
        description="Văn bản trao đổi công việc giữa các cơ quan, tổ chức về một vấn đề cụ thể.",
        cite="Điều 7, Điều 8 & Phụ lục I (Mẫu 1.5)",
        fields=[
            *_co_quan_fields(),
            FieldDef(
                key="subject",
                label="Trích yếu (V/v ...)",
                required=True,
                description="Tóm tắt nội dung sau chữ V/v. Ví dụ: V/v báo cáo tình hình nhân sự quý III/2026.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="V/v ...",
            ),
            FieldDef(
                key="kinh_gui",
                label="Kính gửi",
                required=True,
                description="Tên cơ quan/cá nhân nhận công văn, người trực tiếp giải quyết.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="Ban Giám đốc Công ty Cổ phần XYZ",
            ),
            FieldDef(
                key="articles",
                label="Nội dung công văn",
                required=True,
                description="Nội dung đầy đủ của công văn. Viết theo văn phong hành chính.",
                input_type="textarea",
                group="noi_dung",
                source_hint=None,
                placeholder="Kính thưa...\n\nNội dung...\n\nKính đề nghị...",
            ),
            *_ky_duyet_fields("KT."),
            _noi_nhan_field(),
        ],
    ),

    "BÁO CÁO": FieldSchema(
        doc_type="BÁO CÁO",
        description="Văn bản tổng hợp, phản ánh tình hình thực hiện công việc, nhiệm vụ theo định kỳ hoặc theo yêu cầu.",
        cite="Điều 7 NĐ 30/2020/NĐ-CP & Phụ lục I (Mẫu 1.4)",
        fields=[
            *_co_quan_fields(),
            FieldDef(
                key="subject",
                label="Trích yếu báo cáo",
                required=True,
                description="Nội dung ngắn gọn của báo cáo. Ví dụ: Báo cáo kết quả thực hiện kế hoạch quý III năm 2026.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="Báo cáo kết quả ...",
            ),
            FieldDef(
                key="kinh_gui",
                label="Kính gửi",
                required=True,
                description="Cơ quan/người nhận báo cáo.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="Ban Giám đốc Công ty",
            ),
            FieldDef(
                key="articles",
                label="Nội dung báo cáo",
                required=True,
                description="Nội dung đầy đủ: I. Tình hình thực hiện, II. Kết quả đạt được, III. Đề xuất kiến nghị.",
                input_type="textarea",
                group="noi_dung",
                source_hint=None,
                placeholder="I. TÌNH HÌNH THỰC HIỆN\n\nII. KẾT QUẢ ĐẠT ĐƯỢC\n\nIII. ĐỀ XUẤT KIẾN NGHỊ",
            ),
            *_ky_duyet_fields("TL."),
            _noi_nhan_field(),
        ],
    ),

    "TỜ TRÌNH": FieldSchema(
        doc_type="TỜ TRÌNH",
        description="Văn bản trình cấp trên xem xét, phê duyệt một đề án, phương án, kế hoạch hoặc vấn đề cụ thể.",
        cite="Điều 7 NĐ 30/2020/NĐ-CP & Phụ lục I (Mẫu 1.4)",
        fields=[
            *_co_quan_fields(),
            FieldDef(
                key="subject",
                label="Trích yếu tờ trình",
                required=True,
                description="Nội dung ngắn gọn. Ví dụ: Về việc đề nghị phê duyệt kế hoạch đào tạo nhân sự năm 2026.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="Về việc đề nghị ...",
            ),
            FieldDef(
                key="kinh_gui",
                label="Kính gửi",
                required=True,
                description="Cơ quan/cấp có thẩm quyền phê duyệt.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="Ban Giám đốc Công ty Cổ phần XYZ",
            ),
            FieldDef(
                key="bases",
                label="Căn cứ trình",
                required=True,
                description="Cơ sở pháp lý và thực tiễn để trình.",
                input_type="list",
                group="noi_dung",
                source_hint=None,
                placeholder="- Kế hoạch phát triển năm 2026;\n- Đề nghị của Phòng Nhân sự;",
            ),
            FieldDef(
                key="articles",
                label="Nội dung đề xuất",
                required=True,
                description="Lý do, nội dung chi tiết và đề nghị cụ thể.",
                input_type="textarea",
                group="noi_dung",
                source_hint=None,
                placeholder="I. SỰ CẦN THIẾT\n\nII. NỘI DUNG ĐỀ XUẤT\n\nIII. KIẾN NGHỊ",
            ),
            *_ky_duyet_fields("TM."),
            _noi_nhan_field(),
        ],
    ),

    "BIÊN BẢN": FieldSchema(
        doc_type="BIÊN BẢN",
        description="Văn bản ghi nhận diễn biến và kết quả của cuộc họp, sự việc, kiểm tra hoặc bàn giao.",
        cite="Điều 7 NĐ 30/2020/NĐ-CP & Phụ lục I (Mẫu 1.9)",
        fields=[
            *_co_quan_fields(),
            FieldDef(
                key="subject",
                label="Trích yếu biên bản",
                required=True,
                description="Nội dung ngắn gọn. Ví dụ: Biên bản họp Ban Giám đốc ngày 22/9/2026.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="Biên bản cuộc họp ...",
            ),
            FieldDef(
                key="meeting_time",
                label="Thời gian, Địa điểm",
                required=True,
                description="Thời gian bắt đầu và địa điểm diễn ra cuộc họp/sự việc.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="8h00, ngày 22/9/2026, tại Phòng họp số 2",
            ),
            FieldDef(
                key="attendees",
                label="Thành phần tham dự",
                required=True,
                description="Danh sách người tham dự, Chủ tọa, Thư ký ghi biên bản.",
                input_type="textarea",
                group="noi_dung",
                source_hint=None,
                placeholder="Chủ tọa: Ông Nguyễn Văn A - Giám đốc\nThư ký: Bà Trần Thị B - P.HC\nThành viên: ...",
            ),
            FieldDef(
                key="articles",
                label="Nội dung cuộc họp / diễn biến",
                required=True,
                description="Nội dung chi tiết theo diễn biến thực tế, kết luận và phân công thực hiện.",
                input_type="textarea",
                group="noi_dung",
                source_hint=None,
                placeholder="I. NỘI DUNG THẢO LUẬN\n\nII. KẾT LUẬN\n\nIII. PHÂN CÔNG THỰC HIỆN",
            ),
            FieldDef(
                key="end_time",
                label="Thời gian kết thúc",
                required=True,
                description="Thời gian cuộc họp/sự việc kết thúc.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="10h30, ngày 22/9/2026",
            ),
            FieldDef(
                key="signatory_title",
                label="Chủ tọa",
                required=True,
                description="Chức vụ và họ tên chủ tọa ký biên bản.",
                input_type="text",
                group="ky_duyet",
                source_hint="profile.title",
                placeholder="GIÁM ĐỐC",
            ),
            FieldDef(
                key="signatory_name",
                label="Tên Chủ tọa",
                required=True,
                description="Họ và tên người chủ tọa (in hoa).",
                input_type="text",
                group="ky_duyet",
                source_hint="profile.full_name",
                placeholder="NGUYỄN VĂN AN",
            ),
            FieldDef(
                key="secretary_name",
                label="Tên Thư ký",
                required=True,
                description="Họ và tên thư ký ghi biên bản.",
                input_type="text",
                group="ky_duyet",
                source_hint=None,
                placeholder="TRẦN THỊ BÌNH",
            ),
        ],
    ),

    "BẢN TƯỜNG TRÌNH": FieldSchema(
        doc_type="BẢN TƯỜNG TRÌNH",
        description="Văn bản của cá nhân trình bày sự việc đã xảy ra (tai nạn, va chạm, sự cố, vi phạm...) theo trình tự thời gian.",
        cite="Điều 7, Điều 8, Điều 10 NĐ 30/2020/NĐ-CP",
        fields=[
            FieldDef(
                key="kinh_gui",
                label="Kính gửi",
                required=True,
                description="Người/Cơ quan nhận bản tường trình (Trưởng bộ phận, Ban Giám đốc...).",
                input_type="text",
                group="co_quan",
                source_hint=None,
                placeholder="Ban Giám đốc Công ty Cổ phần XYZ",
            ),
            FieldDef(
                key="full_name",
                label="Họ và tên người tường trình",
                required=True,
                description="Họ và tên đầy đủ.",
                input_type="text",
                group="ca_nhan",
                source_hint="profile.full_name",
                placeholder="Nguyễn Văn An",
            ),
            FieldDef(
                key="dob",
                label="Ngày sinh",
                required=True,
                description="Ngày tháng năm sinh.",
                input_type="date",
                group="ca_nhan",
                source_hint="profile.dob",
                placeholder="12/03/1990",
            ),
            FieldDef(
                key="position",
                label="Chức vụ / Nghề nghiệp",
                required=True,
                description="Chức danh công việc hiện tại.",
                input_type="text",
                group="ca_nhan",
                source_hint="profile.title",
                placeholder="Nhân viên Phòng Kế toán",
            ),
            FieldDef(
                key="id_number",
                label="Số CCCD / CMND",
                required=True,
                description="Số Căn cước công dân hoặc CMND còn hiệu lực.",
                input_type="text",
                group="ca_nhan",
                source_hint="profile.id_number",
                placeholder="001234567890",
            ),
            FieldDef(
                key="address",
                label="Địa chỉ thường trú",
                required=True,
                description="Địa chỉ thường trú đầy đủ.",
                input_type="text",
                group="ca_nhan",
                source_hint="profile.address",
                placeholder="123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
            ),
            FieldDef(
                key="subject",
                label="Sự việc tường trình",
                required=True,
                description="Tiêu đề tóm tắt sự việc. Ví dụ: Về việc va chạm giao thông ngày 20/9/2026.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="Về việc ...",
            ),
            FieldDef(
                key="articles",
                label="Diễn biến chi tiết sự việc",
                required=True,
                description="Mô tả đầy đủ, trung thực theo trình tự thời gian. Kết thúc bằng cam kết thông tin đúng sự thật.",
                input_type="textarea",
                group="noi_dung",
                source_hint=None,
                placeholder="Vào lúc ... giờ, ngày ..., tôi đã...\n\n...\n\nTôi xin cam đoan những thông tin trên là hoàn toàn đúng sự thật và chịu trách nhiệm trước pháp luật.",
            ),
            FieldDef(
                key="location_date",
                label="Địa danh, Ngày làm tường trình",
                required=True,
                description="Nơi và thời điểm làm bản tường trình.",
                input_type="text",
                group="ky_duyet",
                source_hint="profile.location",
                placeholder="Hà Nội, ngày 22 tháng 9 năm 2026",
            ),
            FieldDef(
                key="signatory_name",
                label="Họ và tên người làm tường trình",
                required=True,
                description="Người ký và chịu trách nhiệm nội dung.",
                input_type="text",
                group="ky_duyet",
                source_hint="profile.full_name",
                placeholder="Nguyễn Văn An",
            ),
        ],
    ),

    "GIẤY NGHỈ PHÉP": FieldSchema(
        doc_type="GIẤY NGHỈ PHÉP",
        description="Đơn xin nghỉ phép của nhân viên gửi Ban Giám đốc và Phòng Nhân sự.",
        cite="Điều 7 NĐ 30/2020/NĐ-CP & Phụ lục I (Mẫu 1.10)",
        fields=[
            FieldDef(
                key="company_name",
                label="Tên công ty / đơn vị",
                required=True,
                description="Tên cơ quan/đơn vị nơi làm việc.",
                input_type="text",
                group="co_quan",
                source_hint="profile.organization",
                placeholder="CÔNG TY CỔ PHẦN ABC",
            ),
            FieldDef(
                key="kinh_gui",
                label="Kính gửi",
                required=True,
                description="Người nhận đơn (Ban Giám đốc, Trưởng phòng, Phòng HR...).",
                input_type="text",
                group="co_quan",
                source_hint=None,
                placeholder="Ban Giám đốc và Phòng Nhân sự",
            ),
            FieldDef(
                key="full_name",
                label="Họ và tên nhân viên",
                required=True,
                description="Họ và tên đầy đủ của người xin nghỉ.",
                input_type="text",
                group="ca_nhan",
                source_hint="profile.full_name",
                placeholder="Nguyễn Văn An",
            ),
            FieldDef(
                key="position",
                label="Chức vụ",
                required=True,
                description="Chức danh/vị trí công việc hiện tại.",
                input_type="text",
                group="ca_nhan",
                source_hint="profile.title",
                placeholder="Nhân viên Kinh doanh",
            ),
            FieldDef(
                key="department",
                label="Bộ phận công tác",
                required=True,
                description="Phòng/ban làm việc.",
                input_type="text",
                group="ca_nhan",
                source_hint="profile.department",
                placeholder="Phòng Kinh doanh",
            ),
            FieldDef(
                key="leave_reason",
                label="Lý do xin nghỉ",
                required=True,
                description="Lý do cụ thể. Ví dụ: Nghỉ việc riêng, Nghỉ ốm, Nghỉ thăm thân...",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="Nghỉ việc riêng / Nghỉ ốm ...",
            ),
            FieldDef(
                key="leave_from",
                label="Từ ngày",
                required=True,
                description="Ngày bắt đầu nghỉ.",
                input_type="date",
                group="noi_dung",
                source_hint=None,
                placeholder="25/09/2026",
            ),
            FieldDef(
                key="leave_to",
                label="Đến ngày",
                required=True,
                description="Ngày kết thúc nghỉ (ngày cuối cùng nghỉ).",
                input_type="date",
                group="noi_dung",
                source_hint=None,
                placeholder="26/09/2026",
            ),
            FieldDef(
                key="leave_days",
                label="Tổng số ngày nghỉ",
                required=True,
                description="Số ngày nghỉ phép (bao gồm hoặc không bao gồm ngày nghỉ cuối tuần).",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="02 ngày",
            ),
            FieldDef(
                key="handover_to",
                label="Bàn giao công việc cho",
                required=False,
                description="Họ tên nhân sự thay thế trong thời gian nghỉ (nếu có).",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="Trần Thị Bình",
            ),
            FieldDef(
                key="phone",
                label="Số điện thoại liên hệ khi cần",
                required=False,
                description="SĐT liên hệ trong thời gian nghỉ phép.",
                input_type="text",
                group="noi_dung",
                source_hint="profile.phone",
                placeholder="0901 234 567",
            ),
            FieldDef(
                key="location_date",
                label="Địa danh, Ngày làm đơn",
                required=True,
                description="Nơi và ngày làm đơn xin nghỉ.",
                input_type="text",
                group="ky_duyet",
                source_hint="profile.location",
                placeholder="Hà Nội, ngày 22 tháng 9 năm 2026",
            ),
            FieldDef(
                key="signatory_name",
                label="Họ và tên người làm đơn",
                required=True,
                description="Ký và ghi rõ họ tên.",
                input_type="text",
                group="ky_duyet",
                source_hint="profile.full_name",
                placeholder="Nguyễn Văn An",
            ),
        ],
    ),

    "THÔNG BÁO": FieldSchema(
        doc_type="THÔNG BÁO",
        description="Văn bản phổ biến chủ trương, chính sách, quyết định hoặc kết luận cuộc họp đến các đơn vị, cá nhân liên quan.",
        cite="Điều 7 NĐ 30/2020/NĐ-CP",
        fields=[
            *_co_quan_fields(),
            FieldDef(
                key="subject",
                label="Trích yếu thông báo",
                required=True,
                description="Nội dung ngắn gọn của thông báo.",
                input_type="text",
                group="noi_dung",
                source_hint=None,
                placeholder="Thông báo về ...",
            ),
            FieldDef(
                key="articles",
                label="Nội dung thông báo",
                required=True,
                description="Nội dung đầy đủ của thông báo.",
                input_type="textarea",
                group="noi_dung",
                source_hint=None,
                placeholder="Nội dung thông báo...",
            ),
            *_ky_duyet_fields("TM."),
            _noi_nhan_field(),
        ],
    ),
}


# ─── Public helpers ───────────────────────────────────────────────────────────

def get_schema(doc_type: str) -> Optional[FieldSchema]:
    """Lấy Field Schema cho một loại văn bản. Case-insensitive."""
    normalized = doc_type.strip().upper()
    return FIELD_SCHEMAS.get(normalized)


def list_supported_types() -> list[str]:
    """Trả về danh sách các loại văn bản được hỗ trợ."""
    return list(FIELD_SCHEMAS.keys())


def get_schema_dict(doc_type: str) -> Optional[dict]:
    """Trả về schema dạng dict để serialize qua API."""
    schema = get_schema(doc_type)
    return schema.to_dict() if schema else None
