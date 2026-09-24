"""
Test Suite — Vision OCR Advisory Flow (Luồng A)
================================================
Tests:
  1. GuidanceAgent: resolve đúng loại văn bản từ mô tả rõ ràng
  2. GuidanceAgent: hỏi thêm khi mô tả mơ hồ
  3. FieldResolver: is_complete khi profile đủ thông tin
  4. FieldResolver: missing_fields khi thiếu trích yếu
  5. DocumentGenerator: build payload đúng schema
  6. ND30Validator score so sánh Luồng A (structured) vs Luồng B (OCR inferred)
"""

import pytest
from unittest.mock import patch, MagicMock

from app.services.field_schema import get_schema, list_supported_types, FIELD_SCHEMAS
from app.services.field_resolver import FieldResolver, UserProfile
from app.services.document_generator import DocumentGeneratorService


# ─── Test 0: Field Schema Registry ───────────────────────────────────────────

class TestFieldSchemaRegistry:
    def test_supported_types_not_empty(self):
        types = list_supported_types()
        assert len(types) >= 6, "Phải có ít nhất 6 loại văn bản được hỗ trợ"

    def test_known_types_exist(self):
        for doc_type in ["QUYẾT ĐỊNH", "CÔNG VĂN", "BÁO CÁO", "TỜ TRÌNH", "BIÊN BẢN", "BẢN TƯỜNG TRÌNH"]:
            schema = get_schema(doc_type)
            assert schema is not None, f"Thiếu schema cho: {doc_type}"
            assert len(schema.fields) > 0, f"Schema {doc_type} không có field nào"

    def test_all_required_fields_have_labels(self):
        for doc_type, schema in FIELD_SCHEMAS.items():
            for f in schema.fields:
                if f.required:
                    assert f.label, f"{doc_type}.{f.key}: required field thiếu label"
                    assert f.description, f"{doc_type}.{f.key}: required field thiếu description"

    def test_schema_to_dict(self):
        schema = get_schema("QUYẾT ĐỊNH")
        d = schema.to_dict()
        assert d["doc_type"] == "QUYẾT ĐỊNH"
        assert isinstance(d["fields"], list)
        assert len(d["fields"]) > 0


# ─── Test 1: GuidanceAgent — resolve rõ ràng ─────────────────────────────────

class TestGuidanceAgentResolve:
    def test_tuong_trinh_keyword(self):
        """Từ khóa 'tường trình tai nạn' → resolve BẢN TƯỜNG TRÌNH (offline, không cần Gemini)."""
        from app.services.guidance_agent import GuidanceAgent
        agent = GuidanceAgent()

        # Offline path: detect_document_type trong ND30KnowledgeGraph
        response = None
        with patch.object(agent, '_call_gemini_with_fallback', side_effect=Exception("No API")):
            # Phải dùng keyword matching, không cần Gemini
            from app.services.nd30_knowledge_graph import ND30KnowledgeGraph
            kg = ND30KnowledgeGraph()
            detected = kg.detect_document_type("Tôi cần làm bản tường trình về tai nạn giao thông")
            assert detected == "BẢN TƯỜNG TRÌNH", f"Expected BẢN TƯỜNG TRÌNH, got {detected}"

    def test_nghi_phep_keyword(self):
        from app.services.nd30_knowledge_graph import ND30KnowledgeGraph
        kg = ND30KnowledgeGraph()
        detected = kg.detect_document_type("Tôi muốn xin nghỉ phép 3 ngày")
        assert detected == "GIẤY NGHỈ PHÉP"

    def test_guidance_response_structure(self):
        """GuidanceAgent.process trả về GuidanceResponse đúng schema."""
        from app.services.guidance_agent import GuidanceAgent
        agent = GuidanceAgent()

        # Mock Gemini để trả về response giả định
        mock_text = "Tôi đã xác định được bạn cần làm BẢN TƯỜNG TRÌNH. [RESOLVED: BẢN TƯỜNG TRÌNH]"
        with patch.object(agent, '_call_gemini_with_fallback', return_value=mock_text):
            response = agent.process("Tôi bị tai nạn và cần viết tường trình")

        assert response.is_resolved == True
        assert response.doc_type == "BẢN TƯỜNG TRÌNH"
        assert response.next_action == "go_to_field_resolver"
        assert len(response.required_fields) > 0

    def test_ambiguous_message_pending(self):
        """Tin nhắn mơ hồ → is_resolved = False, next_action = 'ask_more'."""
        from app.services.guidance_agent import GuidanceAgent
        agent = GuidanceAgent()

        mock_text = "Bạn có thể mô tả chi tiết hơn không? Bạn gặp vấn đề gì? [PENDING]"
        with patch.object(agent, '_call_gemini_with_fallback', return_value=mock_text):
            response = agent.process("Tôi cần một loại giấy tờ nào đó")

        assert response.is_resolved == False
        assert response.next_action == "ask_more"
        assert response.doc_type is None


# ─── Test 2: FieldResolver ────────────────────────────────────────────────────

class TestFieldResolver:
    def setup_method(self):
        self.resolver = FieldResolver()

    def _full_profile(self) -> UserProfile:
        return UserProfile(
            full_name="Nguyễn Văn An",
            organization="CÔNG TY CỔ PHẦN ABC",
            department="Phòng Nhân sự",
            title="Trưởng phòng",
            location="Hà Nội",
            id_number="001234567890",
            dob="12/03/1990",
            phone="0901234567",
            address="123 Nguyễn Huệ, Quận 1, TP.HCM",
        )

    def _empty_profile(self) -> UserProfile:
        return UserProfile()

    def test_ban_tuong_trinh_full_profile(self):
        """Profile đầy đủ + trích yếu điền sẵn → is_complete = True."""
        profile = self._full_profile()
        partial = {
            "subject": "Về việc va chạm giao thông ngày 20/9/2026",
            "articles": "Vào lúc 8h ngày 20/9/2026, tôi đã...",
            "kinh_gui": "Ban Giám đốc",
        }
        result = self.resolver.resolve("BẢN TƯỜNG TRÌNH", profile, partial)
        assert result.is_complete == True, f"Missing: {[f.key for f in result.missing_fields]}"
        assert "full_name" in result.filled_fields
        assert result.filled_fields["full_name"] == "Nguyễn Văn An"

    def test_ban_tuong_trinh_empty_profile_missing_fields(self):
        """Profile trống → nhiều missing_fields."""
        profile = self._empty_profile()
        result = self.resolver.resolve("BẢN TƯỜNG TRÌNH", profile, {})
        assert result.is_complete == False
        missing_keys = [f.key for f in result.missing_fields]
        assert "full_name" in missing_keys
        assert "id_number" in missing_keys

    def test_prefilled_keys_tracked(self):
        """Các field lấy từ profile phải được đánh dấu trong prefilled_keys."""
        profile = self._full_profile()
        result = self.resolver.resolve("QUYẾT ĐỊNH", profile, {})
        # company_name lấy từ profile.organization → phải có trong prefilled_keys
        assert "company_name" in result.prefilled_keys

    def test_partial_answers_override_profile(self):
        """partial_answers phải ghi đè giá trị profile."""
        profile = self._full_profile()
        partial = {"company_name": "CÔNG TY CỔ PHẦN XYZ KHÁC"}
        result = self.resolver.resolve("QUYẾT ĐỊNH", profile, partial)
        assert result.filled_fields.get("company_name") == "CÔNG TY CỔ PHẦN XYZ KHÁC"
        # Không phải giá trị từ profile
        assert result.filled_fields.get("company_name") != "CÔNG TY CỔ PHẦN ABC"

    def test_nghi_phep_complete(self):
        """Giấy nghỉ phép — điền đủ required fields."""
        profile = self._full_profile()
        partial = {
            "kinh_gui": "Ban Giám đốc",
            "leave_reason": "Nghỉ việc riêng",
            "leave_from": "25/09/2026",
            "leave_to": "26/09/2026",
            "leave_days": "02 ngày",
            "location_date": "Hà Nội, ngày 22 tháng 9 năm 2026",
        }
        result = self.resolver.resolve("GIẤY NGHỈ PHÉP", profile, partial)
        assert result.is_complete == True, f"Missing: {[f.key for f in result.missing_fields]}"


# ─── Test 3: DocumentGeneratorService ────────────────────────────────────────

class TestDocumentGenerator:
    def setup_method(self):
        self.gen = DocumentGeneratorService()

    def _quyet_dinh_fields(self) -> dict:
        return {
            "company_name": "CÔNG TY CỔ PHẦN ABC",
            "department": "Phòng Nhân sự",
            "doc_number": "15/QĐ-ABC",
            "location_date": "Hà Nội, ngày 22 tháng 9 năm 2026",
            "subject": "Về việc bổ nhiệm Trưởng phòng Kinh doanh",
            "bases": "- Bộ luật Lao động 2019;\n- Điều lệ Công ty;",
            "articles": "Điều 1: Bổ nhiệm ông Nguyễn Văn An làm Trưởng phòng Kinh doanh.\nĐiều 2: Quyết định này có hiệu lực từ ngày ký.",
            "signatory_title": "TM. HỘI ĐỒNG QUẢN TRỊ\nCHỦ TỊCH",
            "signatory_name": "TRẦN THỊ BÌNH",
            "recipients": "- Như Điều 3;\n- Lưu: VT, NS.",
        }

    def test_quyet_dinh_generates_correctly(self):
        result = self.gen.generate("QUYẾT ĐỊNH", self._quyet_dinh_fields())
        assert result.input_mode == "structured"
        assert result.validation_ready == True
        assert result.export_payload["doc_type"] == "QUYẾT ĐỊNH"
        assert isinstance(result.export_payload["articles"], list)
        assert len(result.export_payload["articles"]) >= 2  # Điều 1, Điều 2
        assert isinstance(result.export_payload["bases"], list)

    def test_missing_required_fields_detected(self):
        """Thiếu subject → validation_ready = False."""
        fields = {k: v for k, v in self._quyet_dinh_fields().items() if k != "subject"}
        result = self.gen.generate("QUYẾT ĐỊNH", fields)
        assert result.validation_ready == False
        assert any("Trích yếu" in m or "subject" in m.lower() for m in result.missing_required)

    def test_articles_parsed_correctly(self):
        fields = self._quyet_dinh_fields()
        result = self.gen.generate("QUYẾT ĐỊNH", fields)
        articles = result.export_payload["articles"]
        # Điều 1 và Điều 2 phải được tách riêng
        assert any("Điều 1" in a.get("title", "") or "Điều 1" in a.get("content", "") for a in articles)

    def test_ban_tuong_trinh_payload(self):
        fields = {
            "kinh_gui": "Ban Giám đốc",
            "full_name": "Nguyễn Văn An",
            "dob": "12/03/1990",
            "position": "Nhân viên",
            "id_number": "001234567890",
            "address": "123 Nguyễn Huệ, TP.HCM",
            "subject": "Về việc va chạm giao thông",
            "articles": "Vào lúc 8h ngày 20/9/2026...",
            "location_date": "Hà Nội, ngày 22 tháng 9 năm 2026",
            "signatory_name": "Nguyễn Văn An",
        }
        result = self.gen.generate("BẢN TƯỜNG TRÌNH", fields)
        assert result.validation_ready == True
        assert result.export_payload["doc_type"] == "BẢN TƯỜNG TRÌNH"
        # Thông tin cá nhân phải được nhúng vào content
        content = result.export_payload["articles"][0]["content"]
        assert "Nguyễn Văn An" in content
        assert "001234567890" in content


# ─── Test 4: Validator score A vs B ──────────────────────────────────────────

class TestValidatorScoreComparison:
    """
    Đo Validator score giữa Luồng A (structured) vs Luồng B (OCR inferred).
    Điểm từ Luồng A phải cao hơn hoặc bằng Luồng B để chứng minh cải thiện.
    """

    def _get_structured_payload(self) -> dict:
        """Luồng A — payload với field chuẩn hóa từ DocumentGenerator."""
        gen = DocumentGeneratorService()
        result = gen.generate("QUYẾT ĐỊNH", {
            "company_name": "CÔNG TY CỔ PHẦN ABC",
            "department": "Phòng Nhân sự",
            "doc_number": "15/QĐ-ABC",
            "location_date": "Hà Nội, ngày 22 tháng 9 năm 2026",
            "subject": "Về việc bổ nhiệm Trưởng phòng Kinh doanh",
            "bases": "- Bộ luật Lao động 2019;\n- Điều lệ Công ty;",
            "articles": "Điều 1: Bổ nhiệm ông Nguyễn Văn An.\nĐiều 2: Quyết định có hiệu lực từ ngày ký.\nĐiều 3: Phòng Nhân sự thi hành.",
            "signatory_title": "TM. HỘI ĐỒNG QUẢN TRỊ\nCHỦ TỊCH",
            "signatory_name": "TRẦN THỊ BÌNH",
            "recipients": "- Như Điều 3;\n- Lưu: VT, NS.",
        })
        return result.export_payload

    def _get_ocr_inferred_payload(self) -> dict:
        """Luồng B — payload từ OCR (thiếu một số field, không chuẩn hóa)."""
        return {
            "doc_type": "QUYẾT ĐỊNH",
            "company_name": "Cty ABC",  # Không in hoa chuẩn
            "doc_number": "",           # Thiếu số ký hiệu
            "location_date": "ngày 22/9/2026",  # Thiếu địa danh
            "subject": "bổ nhiệm",      # Không đầy đủ
            "bases": [],                # Thiếu căn cứ
            "articles": [{"title": "", "content": "bổ nhiệm..."}],  # Không có Điều
            "signatory_title": "",      # Thiếu thẩm quyền
            "signatory_name": "",       # Thiếu tên
            "recipients": [],           # Thiếu nơi nhận
        }

    def test_structured_score_higher_than_ocr(self):
        """Điểm Validator từ Luồng A phải >= Luồng B."""
        from app.services.nd30_validator import ND30Validator
        validator = ND30Validator()

        structured_payload = self._get_structured_payload()
        ocr_payload = self._get_ocr_inferred_payload()

        structured_result = validator.validate(structured_payload, "")
        ocr_result = validator.validate(ocr_payload, "")

        structured_score = structured_result.score if hasattr(structured_result, "score") else structured_result.get("score", 0)
        ocr_score = ocr_result.score if hasattr(ocr_result, "score") else ocr_result.get("score", 0)

        print(f"\n[Validator Score] Luồng A (structured): {structured_score}/100")
        print(f"[Validator Score] Luồng B (OCR inferred): {ocr_score}/100")
        print(f"[Cải thiện]: +{structured_score - ocr_score} điểm")

        assert structured_score >= ocr_score, (
            f"Điểm Luồng A ({structured_score}) phải >= Luồng B ({ocr_score})"
        )

    def test_structured_score_above_threshold(self):
        """Luồng A phải đạt ít nhất 70/100 khi điền đầy đủ."""
        from app.services.nd30_validator import ND30Validator
        validator = ND30Validator()

        payload = self._get_structured_payload()
        result = validator.validate(payload, "")
        score = result.score if hasattr(result, "score") else result.get("score", 0)

        assert score >= 70, (
            f"Luồng A với dữ liệu đầy đủ phải đạt >= 70/100, hiện tại: {score}/100"
        )


# ─── Test 5: nd30_exporter dual stream ───────────────────────────────────────

class TestND30ExporterDualStream:
    def test_export_structured_has_attribute(self):
        """export_structured trả về buffer với input_mode = 'structured'."""
        from app.services.nd30_exporter import ND30Exporter
        exporter = ND30Exporter()
        data = {
            "doc_type": "QUYẾT ĐỊNH",
            "company_name": "CÔNG TY ABC",
            "department": "Phòng NS",
            "doc_number": "01/QĐ",
            "location_date": "Hà Nội, ngày 22 tháng 9 năm 2026",
            "subject": "Về việc bổ nhiệm",
            "bases": ["Căn cứ Điều lệ;"],
            "articles": [{"title": "Điều 1", "content": "Bổ nhiệm..."}],
            "signatory_title": "GIÁM ĐỐC",
            "signatory_name": "NGUYỄN VĂN AN",
            "recipients": ["Lưu: VT."],
            "input_mode": "structured",
        }
        buf = exporter.export_structured(data)
        assert buf.input_mode == "structured"
        assert buf.requires_manual_review == False

    def test_export_from_ocr_has_warning_flag(self):
        """export_from_ocr trả về buffer với requires_manual_review = True."""
        from app.services.nd30_exporter import ND30Exporter
        exporter = ND30Exporter()
        data = {
            "doc_type": "QUYẾT ĐỊNH",
            "company_name": "Công ty ABC",
            "subject": "bổ nhiệm",
            "articles": [{"title": "", "content": "nội dung..."}],
            "recipients": ["Lưu VT"],
        }
        buf = exporter.export_from_ocr(data)
        assert buf.requires_manual_review == True
        assert buf.input_mode == "ocr_inferred"

    def test_export_auto_routes_by_input_mode(self):
        """export() auto-detect theo data['input_mode']."""
        from app.services.nd30_exporter import ND30Exporter
        exporter = ND30Exporter()
        base_data = {
            "doc_type": "QUYẾT ĐỊNH",
            "subject": "test",
            "articles": [{"title": "", "content": "..."}],
            "recipients": ["Lưu VT"],
        }
        buf_a = exporter.export({**base_data, "input_mode": "structured"})
        buf_b = exporter.export({**base_data, "input_mode": "ocr_inferred"})
        assert buf_a.input_mode == "structured"
        assert buf_b.input_mode == "ocr_inferred"
