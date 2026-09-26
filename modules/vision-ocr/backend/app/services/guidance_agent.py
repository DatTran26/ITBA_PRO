"""
Guidance Agent — Vision OCR Advisory Flow
==========================================
RAG hội thoại xác định loại văn bản và hướng dẫn quy trình cho người dùng bắt đầu từ số 0.

Thiết kế:
  - Stateless server: Frontend gửi full conversation_history mỗi request.
  - Tái dùng ND30KnowledgeGraph.DOCUMENT_TYPES + detect_document_type() đã có.
  - Dùng Gemini (multi-model failover) để xử lý mơ hồ và hỏi thêm.
  - Trả về GuidanceResponse chuẩn hóa để Frontend điều hướng bước tiếp theo.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field, asdict
from typing import Literal, Optional

import httpx

from app.core.config import GEMINI_API_KEY
from app.services.nd30_knowledge_graph import ND30KnowledgeGraph
from app.services.field_schema import get_schema, list_supported_types, FieldDef

logger = logging.getLogger(__name__)

FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
]

NextAction = Literal["ask_more", "go_to_field_resolver", "show_process_guide"]


# ─── Response types ───────────────────────────────────────────────────────────

@dataclass
class GuidanceMessage:
    role: Literal["user", "assistant"]
    content: str

    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content}


@dataclass
class DocumentTypeResolution:
    doc_type: Optional[str]           # None nếu chưa xác định
    confidence: float                  # 0.0 – 1.0
    reason: str                        # giải thích ngắn gọn


@dataclass
class GuidanceResponse:
    message: str                       # AI trả lời/hỏi thêm (hiển thị trong chat)
    doc_type: Optional[str]            # None khi chưa xác định
    required_fields: list[dict]        # Field schema của loại đó (nếu đã xác định)
    is_resolved: bool                  # True khi đã xác định đủ loại VB
    next_action: NextAction
    resolution_confidence: float = 0.0
    process_steps: list[str] = field(default_factory=list)  # Các bước người dùng cần làm

    def to_dict(self) -> dict:
        return {
            "message": self.message,
            "doc_type": self.doc_type,
            "required_fields": self.required_fields,
            "is_resolved": self.is_resolved,
            "next_action": self.next_action,
            "resolution_confidence": self.resolution_confidence,
            "process_steps": self.process_steps,
        }


# ─── System prompt ─────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """Bạn là chuyên viên tư vấn văn thư hành chính của hệ thống ITBA OCR, chuyên giúp người dùng xác định đúng loại văn bản họ cần làm theo Nghị định 30/2020/NĐ-CP.

CÁC LOẠI VĂN BẢN BẠN CÓ THỂ TƯ VẤN:
{doc_types_list}

NHIỆM VỤ CỦA BẠN:
1. Lắng nghe mô tả vấn đề/tình huống của người dùng.
2. Xác định chính xác loại văn bản phù hợp nhất từ danh sách trên.
3. Nếu chưa đủ thông tin, hỏi thêm 1-2 câu súc tích để làm rõ.
4. Khi đã xác định được, thông báo rõ ràng tên loại văn bản, mục đích và các bước cơ bản người dùng cần thực hiện.

NGUYÊN TẮC:
- Luôn trả lời bằng tiếng Việt, văn phong thân thiện, chuyên nghiệp.
- Không giới thiệu loại văn bản ngoài danh sách trên.
- Nếu yêu cầu hoàn toàn ngoài phạm vi văn thư hành chính, lịch sự từ chối và hướng dẫn đúng.
- Khi đã xác định loại văn bản: kết thúc tin nhắn bằng dòng đặc biệt: [RESOLVED: <TÊN_LOẠI_VB>]
  Ví dụ: [RESOLVED: BẢN TƯỜNG TRÌNH]
- Khi chưa xác định đủ: kết thúc bằng [PENDING]

KHÔNG được bịa đặt thông tin pháp lý không có trong Nghị định 30."""


def _build_system_prompt() -> str:
    kg = ND30KnowledgeGraph()
    supported = list_supported_types()
    doc_list = "\n".join(f"  - {t}" for t in supported)
    return _SYSTEM_PROMPT.format(doc_types_list=doc_list)


# ─── Main service ─────────────────────────────────────────────────────────────

class GuidanceAgent:
    """
    RAG hội thoại xác định loại văn bản.
    Stateless: nhận conversation_history từ client mỗi request.
    """

    def __init__(self):
        self._kg = ND30KnowledgeGraph()
        self._system_prompt = _build_system_prompt()

    # ── Public API ────────────────────────────────────────────────────────────

    def process(
        self,
        user_message: str,
        conversation_history: list[dict] | None = None,
    ) -> GuidanceResponse:
        """
        Xử lý tin nhắn mới của người dùng.

        Args:
            user_message: Tin nhắn mới nhất từ người dùng.
            conversation_history: Lịch sử hội thoại trước đó
                                  (list of {"role": "user"|"assistant", "content": str}).
                                  Stateless — client gửi lại toàn bộ mỗi request.

        Returns:
            GuidanceResponse với message, doc_type, required_fields, next_action.
        """
        history = conversation_history or []

        # Bước 0: Nhận diện phản hồi khẳng định theo ngữ cảnh (Contextual Affirmation)
        # Khi người dùng trả lời ngắn: "ok", "đúng", "ừ", "vâng", "đồng ý"... sau khi trợ lý đã gợi ý loại văn bản
        affirmative_words = {
            "ok", "oke", "okey", "okay", "đúng", "dung", "đúng rồi", "dung roi",
            "ừ", "u", "uh", "ừm", "vâng", "vang", "chính xác", "chinh xac",
            "đồng ý", "dong y", "yes", "yep", "chuẩn", "chuan", "tiếp tục", "làm đi",
            "nhất trí", "nhat tri", "làm luôn", "lam luon", "giúp tôi", "giup toi", "chuẩn rồi"
        }
        clean_msg = user_message.strip().lower().rstrip("!.,?")
        is_affirmative = (
            clean_msg in affirmative_words
            or any(clean_msg.startswith(w + " ") for w in ["ok", "oke", "okay", "ừ", "vâng", "đúng rồi", "chuẩn", "đồng ý"])
        )
        if is_affirmative and history:
            for prev_msg in reversed(history):
                content = prev_msg.get("content", "")
                for supported_type in list_supported_types():
                    if supported_type.lower() in content.lower():
                        return self._build_resolved_response(
                            supported_type,
                            user_message,
                            f"Tuyệt vời! Tôi sẽ hướng dẫn bạn chuẩn bị biểu mẫu **{supported_type}** chuẩn thể thức Nghị định 30/2020/NĐ-CP ngay bây giờ."
                        )

        # Bước 1: Thử detect trực tiếp từ knowledge graph (nhanh, offline)
        # Lưu ý: detect_document_type mặc định trả về "CÔNG VĂN" nếu không match gì,
        # nên chỉ tin cậy khi user thực sự nhắc đến từ khóa tương ứng.
        quick_type = self._kg.detect_document_type(user_message)
        is_reliable_match = False
        if quick_type and quick_type != "DANH SÁCH VĂN BẢN" and get_schema(quick_type):
            if quick_type == "CÔNG VĂN":
                t_lower = user_message.lower()
                tn_lower = self._kg._normalize(user_message)
                is_reliable_match = "công văn" in t_lower or "cong van" in tn_lower
            else:
                is_reliable_match = True

        if is_reliable_match:
            # Xác định đủ tin cậy từ keyword matching
            return self._build_resolved_response(quick_type, user_message)

        # Bước 2: Gọi Gemini để xử lý trường hợp mơ hồ
        messages = self._build_gemini_messages(history, user_message)
        ai_text = self._call_gemini_with_fallback(messages)

        # Bước 3: Parse kết quả từ Gemini
        return self._parse_ai_response(ai_text, user_message)

    # ── Private helpers ───────────────────────────────────────────────────────

    def _build_gemini_messages(
        self,
        history: list[dict],
        new_user_message: str,
    ) -> list[dict]:
        """Xây dựng danh sách messages cho Gemini API."""
        messages = []
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            # Gemini dùng "model" thay vì "assistant"
            gemini_role = "model" if role == "assistant" else "user"
            messages.append({"role": gemini_role, "parts": [{"text": content}]})
        # Thêm tin nhắn mới
        messages.append({"role": "user", "parts": [{"text": new_user_message}]})
        return messages

    def _call_gemini_with_fallback(self, messages: list[dict]) -> str:
        """Gọi Gemini với multi-model failover."""
        system_instruction = {"parts": [{"text": self._system_prompt}]}

        for model in FALLBACK_MODELS:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/models/"
                f"{model}:generateContent?key={GEMINI_API_KEY}"
            )
            payload = {
                "system_instruction": system_instruction,
                "contents": messages,
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 1024,
                },
            }
            try:
                with httpx.Client(timeout=5.0) as client:
                    resp = client.post(url, json=payload)
                if resp.status_code == 429:
                    logger.warning(f"Guidance Agent: Rate limit on {model}, trying next...")
                    continue
                resp.raise_for_status()
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception as exc:
                logger.warning(f"Guidance Agent: {model} failed — {exc}")
                continue

        # Fallback hoàn toàn offline
        return self._offline_fallback()

    def _parse_ai_response(self, ai_text: str, original_message: str) -> GuidanceResponse:
        """Parse response từ Gemini, tìm marker [RESOLVED:...] hoặc [PENDING]."""
        # Tìm [RESOLVED: <DOC_TYPE>]
        import re
        resolved_match = re.search(r"\[RESOLVED:\s*([^\]]+)\]", ai_text, re.IGNORECASE)
        pending_match = re.search(r"\[PENDING\]", ai_text, re.IGNORECASE)

        # Xóa markers khỏi message hiển thị
        clean_message = re.sub(r"\[(RESOLVED:[^\]]*|PENDING)\]", "", ai_text).strip()

        if resolved_match:
            doc_type_raw = resolved_match.group(1).strip().upper()
            schema = get_schema(doc_type_raw)
            if schema:
                return self._build_resolved_response(doc_type_raw, original_message, clean_message)

        # Chưa xác định hoặc Gemini không trả về marker rõ ràng
        return GuidanceResponse(
            message=clean_message or ai_text,
            doc_type=None,
            required_fields=[],
            is_resolved=False,
            next_action="ask_more",
            resolution_confidence=0.0,
            process_steps=[],
        )

    def _build_resolved_response(
        self,
        doc_type: str,
        original_message: str,
        ai_message: str | None = None,
    ) -> GuidanceResponse:
        """Tạo GuidanceResponse khi đã xác định loại văn bản."""
        schema = get_schema(doc_type)
        if not schema:
            logger.warning(f"GuidanceAgent: No schema found for doc_type='{doc_type}'")
            return self._pending_response("Xin lỗi, tôi chưa hỗ trợ loại văn bản này. Bạn có thể mô tả chi tiết hơn không?")

        process_steps = self._get_process_steps(doc_type)

        message = ai_message or (
            f"✅ Tôi đã xác định được bạn cần làm **{doc_type}**.\n\n"
            f"📋 **{schema.description}**\n\n"
            f"Tiếp theo, hệ thống sẽ giúp bạn điền thông tin cần thiết. "
            f"Một số thông tin có thể được tự điền từ hồ sơ tài khoản của bạn."
        )

        return GuidanceResponse(
            message=message,
            doc_type=doc_type,
            required_fields=[f.to_dict() for f in schema.fields],
            is_resolved=True,
            next_action="go_to_field_resolver",
            resolution_confidence=0.95,
            process_steps=process_steps,
        )

    def _pending_response(self, message: str) -> GuidanceResponse:
        return GuidanceResponse(
            message=message,
            doc_type=None,
            required_fields=[],
            is_resolved=False,
            next_action="ask_more",
            resolution_confidence=0.0,
        )

    def _offline_fallback(self) -> str:
        """Fallback khi tất cả model đều thất bại."""
        supported = list_supported_types()
        types_str = ", ".join(supported[:5]) + "..."
        return (
            f"Xin lỗi, tôi tạm thời không thể kết nối. "
            f"Bạn có thể cho biết bạn cần loại văn bản nào trong danh sách sau không? "
            f"{types_str}\n[PENDING]"
        )

    def _get_process_steps(self, doc_type: str) -> list[str]:
        """Trả về các bước quy trình cơ bản cho từng loại văn bản."""
        common_steps = [
            "Điền thông tin vào form được tạo tự động",
            "Xem trước văn bản trên giao diện mô phỏng A4",
            "Kiểm tra thể thức theo Nghị định 30 (tự động)",
            "Xuất file Word (.docx) chuẩn thể thức",
        ]

        doc_specific: dict[str, list[str]] = {
            "QUYẾT ĐỊNH": [
                "Chuẩn bị căn cứ pháp lý (Bộ luật Lao động, điều lệ công ty...)",
                "Xác định nội dung các Điều khoản (Điều 1, Điều 2...)",
                *common_steps,
            ],
            "BẢN TƯỜNG TRÌNH": [
                "Chuẩn bị thông tin cá nhân (CCCD, địa chỉ, chức vụ)",
                "Ghi nhớ diễn biến sự việc theo trình tự thời gian",
                *common_steps,
            ],
            "GIẤY NGHỈ PHÉP": [
                "Xác định ngày nghỉ và lý do nghỉ phép",
                "Sắp xếp bàn giao công việc (nếu cần)",
                *common_steps,
            ],
            "BIÊN BẢN": [
                "Xác nhận thông tin cuộc họp (thời gian, địa điểm, thành phần)",
                "Tổng hợp nội dung thảo luận và kết luận",
                *common_steps,
            ],
        }

        return doc_specific.get(doc_type, common_steps)
