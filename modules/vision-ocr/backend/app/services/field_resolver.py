"""
Field Resolver — Vision OCR Advisory Flow
==========================================
Đối chiếu Field Schema của loại văn bản với hồ sơ người dùng,
tự động điền các field có thể lấy từ profile, chỉ hỏi phần còn thiếu.

Thiết kế:
  - Nhận UserProfile từ request (Frontend lấy từ Supabase auth session).
  - Không truy cập DB trực tiếp — module độc lập, dễ test.
  - source_hint trong FieldDef xác định mapping profile → field.
  - Trả về filled_fields (đã có giá trị) và missing_fields (cần hỏi user).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional

from app.services.field_schema import get_schema, FieldDef

logger = logging.getLogger(__name__)


# ─── UserProfile — ánh xạ từ Supabase auth session ───────────────────────────

@dataclass
class UserProfile:
    """
    Thông tin hồ sơ người dùng lấy từ Supabase auth session / user metadata.
    Frontend truyền qua request body — server không truy cập DB.
    """
    full_name: str = ""
    email: str = ""
    id_number: str = ""          # CCCD/CMND
    dob: str = ""                # Ngày sinh (dd/mm/yyyy)
    organization: str = ""       # Tên cơ quan/công ty
    department: str = ""         # Phòng/ban
    title: str = ""              # Chức vụ
    location: str = ""           # Địa danh thường dùng (Hà Nội, TP.HCM...)
    phone: str = ""
    address: str = ""

    @classmethod
    def from_dict(cls, data: dict) -> "UserProfile":
        """Parse từ dict (request body)."""
        return cls(
            full_name=data.get("full_name", "") or data.get("name", ""),
            email=data.get("email", ""),
            id_number=data.get("id_number", "") or data.get("cccd", ""),
            dob=data.get("dob", "") or data.get("date_of_birth", ""),
            organization=data.get("organization", "") or data.get("company", ""),
            department=data.get("department", ""),
            title=data.get("title", "") or data.get("position", ""),
            location=data.get("location", "") or data.get("city", ""),
            phone=data.get("phone", "") or data.get("phone_number", ""),
            address=data.get("address", ""),
        )

    def get_by_hint(self, source_hint: str) -> str:
        """
        Lấy giá trị từ profile theo source_hint.
        Format: "profile.<field_name>"
        """
        if not source_hint or not source_hint.startswith("profile."):
            return ""
        attr = source_hint.replace("profile.", "")
        return getattr(self, attr, "") or ""


# ─── FieldResolverResult ──────────────────────────────────────────────────────

@dataclass
class FieldResolverResult:
    doc_type: str
    filled_fields: dict[str, str]           # Các field đã có giá trị (tự điền + user đã nhập)
    missing_fields: list[FieldDef]          # Các field còn thiếu, cần hỏi user
    prefilled_keys: list[str]               # Keys được tự điền từ profile (hiển thị badge)
    is_complete: bool                       # True khi tất cả required field đã có giá trị

    def to_dict(self) -> dict:
        schema = get_schema(self.doc_type)
        all_fields = schema.fields if schema else self.missing_fields
        return {
            "doc_type": self.doc_type,
            "filled_fields": self.filled_fields,
            "resolved_values": self.filled_fields,
            "missing_fields": [f.to_dict() for f in self.missing_fields],
            "prefilled_keys": self.prefilled_keys,
            "is_complete": self.is_complete,
            "fields": [f.to_dict() for f in all_fields],
        }


# ─── Main service ─────────────────────────────────────────────────────────────

class FieldResolver:
    """
    Đối chiếu Field Schema với UserProfile và partial_answers,
    trả về danh sách field đã điền và field còn thiếu.
    """

    def resolve(
        self,
        doc_type: str,
        user_profile: UserProfile,
        partial_answers: dict[str, str] | None = None,
    ) -> FieldResolverResult:
        """
        Giải quyết field cho một loại văn bản.

        Args:
            doc_type: Loại văn bản (e.g. "QUYẾT ĐỊNH").
            user_profile: Hồ sơ người dùng từ Supabase auth.
            partial_answers: Các field người dùng đã điền thủ công (key → value).

        Returns:
            FieldResolverResult với filled_fields, missing_fields, is_complete.
        """
        schema = get_schema(doc_type)
        if not schema:
            logger.warning(f"FieldResolver: No schema for doc_type='{doc_type}'")
            return FieldResolverResult(
                doc_type=doc_type,
                filled_fields={},
                missing_fields=[],
                prefilled_keys=[],
                is_complete=False,
            )

        answers = dict(partial_answers or {})
        filled: dict[str, str] = {}
        prefilled_keys: list[str] = []
        missing: list[FieldDef] = []

        for field_def in schema.fields:
            key = field_def.key

            # 1. Ưu tiên giá trị do user đã điền thủ công
            if key in answers and answers[key].strip():
                filled[key] = answers[key].strip()
                continue

            # 2. Thử lấy từ profile theo source_hint
            if field_def.source_hint:
                profile_value = user_profile.get_by_hint(field_def.source_hint)
                if profile_value.strip():
                    filled[key] = profile_value.strip()
                    prefilled_keys.append(key)
                    continue

            # 3. Field còn thiếu
            if field_def.required:
                missing.append(field_def)
            else:
                # Optional field — để trống, không báo thiếu
                filled[key] = ""

        is_complete = len(missing) == 0

        return FieldResolverResult(
            doc_type=doc_type,
            filled_fields=filled,
            missing_fields=missing,
            prefilled_keys=prefilled_keys,
            is_complete=is_complete,
        )

    def merge_answers(
        self,
        previous_result: FieldResolverResult,
        new_answers: dict[str, str],
        user_profile: UserProfile,
    ) -> FieldResolverResult:
        """
        Merge thêm câu trả lời mới từ user vào kết quả trước.
        Gọi khi user submit FieldForm bổ sung.
        """
        merged_answers = dict(previous_result.filled_fields)
        merged_answers.update(new_answers)
        return self.resolve(previous_result.doc_type, user_profile, merged_answers)
