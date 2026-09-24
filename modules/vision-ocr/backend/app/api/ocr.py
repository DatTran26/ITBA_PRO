from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.core.config import ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE
from app.services.nd30_exporter import ND30Exporter
from app.services.nd30_validator import ND30Validator
from app.services.nd30_ai_generator import ND30AIGenerator
from app.services.ocr_service import OCRUnavailableError, extract_text_from_image
from app.services.guidance_agent import GuidanceAgent
from app.services.field_resolver import FieldResolver, UserProfile
from app.services.document_generator import DocumentGeneratorService
from app.services.field_schema import get_schema_dict, list_supported_types

router = APIRouter(prefix="/api/ocr", tags=["ocr"])

_nd30_exporter = ND30Exporter()
_nd30_validator = ND30Validator()
_nd30_ai_generator = ND30AIGenerator()
_guidance_agent = GuidanceAgent()
_field_resolver = FieldResolver()
_doc_generator = DocumentGeneratorService()



@router.post("/scan")
async def scan_image(file: UploadFile = File(...)):
    """Accept an image (PNG, JPG, JPEG, WEBP) and return extracted text + grounded blocks JSON.

    Response schema:
        {
          "text":      str,          // full plain-text transcript
          "image_b64": str,          // data-URI for preview rendering
          "status":    "success",
          "blocks": [               // grounded bounding-box blocks (may be empty for Gemini path)
            {
              "id":         str,
              "text":       str,
              "confidence": float,
              "bbox": { "x": float, "y": float, "w": float, "h": float },
              "field_key":  str | null
            }
          ]
        }
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size: {MAX_UPLOAD_SIZE // (1024 * 1024)} MB",
        )

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    try:
        return await extract_text_from_image(image_bytes, content_type)
    except OCRUnavailableError as exc:
        raise HTTPException(
            status_code=503,
            detail="OCR service temporarily unavailable",
        ) from exc


@router.post("/nd30/auto-generate")
async def nd30_auto_generate(payload: dict):
    """
    AI tự động phân tích trích xuất văn bản OCR và tạo dự thảo
    văn bản hành chính chuẩn Nghị định 30/2020/NĐ-CP kèm báo cáo đối soát thể thức.
    """
    ocr_text = payload.get("ocr_text", "")
    instruction = payload.get("instruction", "")

    draft = _nd30_ai_generator.generate_draft(ocr_text, instruction)
    report = _nd30_validator.validate(draft, ocr_text)

    return {
        "draft": draft,
        "report": report
    }


@router.post("/nd30/validate")
async def nd30_validate(payload: dict):
    """
    Kiểm tra và đánh giá thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP:
    - 9 thành phần thể thức bắt buộc
    - Tiêu chí con dấu, chữ ký số và thẩm quyền ban hành
    - Điểm số tuân thủ và cảnh báo/lỗi chi tiết
    """
    doc_data = payload.get("document") or payload.get("draft") or payload
    raw_ocr = payload.get("raw_ocr_text", "")
    report = _nd30_validator.validate(doc_data, raw_ocr)
    return report


@router.post("/export-nd30")
async def export_nd30(data: dict):

    """
    Generate a .docx file compliant with Decree 30/2020/ND-CP.

    Request body (JSON):
        {
          "doc_type":        str,   // e.g. "QUYẾT ĐỊNH"
          "company_name":    str,
          "department":      str,
          "doc_number":      str,
          "location_date":   str,
          "subject":         str,
          "bases":           list[str],
          "articles":        list[{"title": str, "content": str}],
          "signatory_title": str,
          "signatory_name":  str,
          "recipients":      list[str]
        }

    Returns the .docx file as an attachment download.
    """
    if not data:
        raise HTTPException(status_code=400, detail="Request body is required")

    try:
        docx_buffer = _nd30_exporter.export(data)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate document: {exc}",
        ) from exc

    import re
    import unicodedata
    import urllib.parse

    raw_doc_type = str(data.get("doc_type") or "VanBan")
    raw_num = str(data.get("doc_number") or data.get("doc_code") or "")

    def _slugify(text: str) -> str:
        nfkd = unicodedata.normalize("NFKD", text)
        ascii_val = "".join(c for c in nfkd if not unicodedata.combining(c))
        return re.sub(r"[^a-zA-Z0-9_\-]", "", ascii_val.replace(" ", "_").replace("/", "_"))

    safe_type = _slugify(raw_doc_type) or "VanBan"
    safe_num = _slugify(raw_num)
    safe_filename = f"{safe_type}_{safe_num}.docx" if safe_num else f"{safe_type}.docx"
    encoded_filename = urllib.parse.quote(f"{raw_doc_type}_{raw_num}.docx" if raw_num else f"{raw_doc_type}.docx")

    return StreamingResponse(
        docx_buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"; filename*=UTF-8\'\'{encoded_filename}'
        },
    )


@router.get("/nd30/knowledge-graph")
async def get_nd30_knowledge_graph():
    """Returns the full Decree 30 Knowledge Graph nodes, connections, and categories."""
    from app.services.nd30_knowledge_graph import ND30KnowledgeGraph
    kg = ND30KnowledgeGraph()

    nodes = [
        {
            "id": "d7_the_thuc",
            "label": "Điều 7 - Thể thức 29 loại văn bản",
            "category": "decree_article",
            "count": 29,
            "x": 480,
            "y": 170,
            "connections": ["d8_the_thuc", "phu_luc_3"],
            "details": "Quy định 29 loại văn bản hành chính: Nghị quyết, quyết định, chỉ thị, quy chế, quy định, thông báo, hướng dẫn, chương trình, kế hoạch, phương án, đề án, dự án, báo cáo, biên bản, tờ trình, hợp đồng, công văn, công điện, bản ghi nhớ, bản thỏa thuận, giấy ủy quyền, giấy mời, giấy giới thiệu, giấy nghỉ phép, phiếu gửi, phiếu chuyển, phiếu báo, thư công.",
        },
        {
            "id": "d8_the_thuc",
            "label": "Điều 8 - 9 Thành phần chính",
            "category": "decree_article",
            "count": 12,
            "x": 360,
            "y": 200,
            "connections": ["phu_luc_1", "d13_ky_ban_hanh"],
            "details": "9 Thành phần thể thức chính: 1. Quốc hiệu & Tiêu ngữ, 2. Tên cơ quan ban hành, 3. Số ký hiệu, 4. Địa danh ngày tháng, 5. Tên loại & Trích yếu, 6. Nội dung, 7. Chức vụ chữ ký, 8. Dấu/chữ ký số, 9. Nơi nhận.",
        },
        {
            "id": "d13_ky_ban_hanh",
            "label": "Điều 13 - Thẩm quyền ký & Mực xanh",
            "category": "decree_article",
            "count": 10,
            "x": 620,
            "y": 360,
            "connections": ["d8_the_thuc", "d32_con_dau"],
            "details": "Chữ ký dùng MỰC MÀU XANH đối với bản giấy. Hình thức ký: TM. (Thay mặt), KT. (Ký thay), TL. (Thừa lệnh), TUQ. (Thừa ủy quyền).",
        },
        {
            "id": "d25_sao_van_ban",
            "label": "Điều 25-27 - Sao y, Sao lục, Trích sao",
            "category": "decree_article",
            "count": 15,
            "x": 180,
            "y": 400,
            "connections": ["phu_luc_1", "vector_chunks"],
            "details": "Sao y (từ giấy sang giấy/điện tử), Sao lục (từ bản sao y), Trích sao (tạo lại phần nội dung cần trích sao). BẢN SAO Y/SAO LỤC/TRÍCH SAO CÓ GIÁ TRỊ PHÁP LÝ NHƯ BẢN CHÍNH.",
        },
        {
            "id": "d32_con_dau",
            "label": "Điều 32-33 - Quản lý con dấu & Giáp lai",
            "category": "decree_article",
            "count": 14,
            "x": 660,
            "y": 480,
            "connections": ["d13_ky_ban_hanh", "phu_luc_1"],
            "details": "Đóng dấu trùm lên khoảng 1/3 chữ ký về PHÍA BÊN TRÁI. Dấu giáp lai đóng ở mép phải, MỖI DẤU ĐÓNG TỐI ĐA 05 TỜ VĂN BẢN.",
        },
        {
            "id": "phu_luc_1",
            "label": "Phụ lục I - Kỹ thuật trình bày & Lề trang",
            "category": "decree_article",
            "count": 20,
            "x": 300,
            "y": 440,
            "connections": ["d8_the_thuc"],
            "details": "Khổ A4 (210x297mm). Lề trên/dưới 20-25mm, trái 30-35mm, phải 15-20mm. Phông Times New Roman TCVN 6909:2001, màu đen. Đánh số trang lề trên ở giữa từ số 1 (không hiển thị trang 1).",
        },
        {
            "id": "phu_luc_2",
            "label": "Phụ lục II - Quy tắc Viết hoa",
            "category": "decree_article",
            "count": 18,
            "x": 140,
            "y": 280,
            "connections": ["phu_luc_1"],
            "details": "Quy tắc viết hoa danh từ riêng chỉ tên người, tên địa lý, tên cơ quan tổ chức. Viết hoa đặc biệt: 'Nhà nước', 'Nhân dân', 'Bác', 'Đảng'.",
        },
        {
            "id": "phu_luc_3",
            "label": "Phụ lục III - Bảng Viết tắt & Mẫu 1.1-3.2",
            "category": "decree_article",
            "count": 29,
            "x": 460,
            "y": 380,
            "connections": ["d7_the_thuc", "quyet_dinh", "cong_van"],
            "details": "Bảng chữ viết tắt 29 loại văn bản (NQ, QĐ, CT, BC, TTr, HĐ, CĐ, GM, GGT, GNP...) và chi tiết các Mẫu trình bày từ Mẫu 1.1 đến Mẫu 3.2.",
        },
        {
            "id": "phu_luc_4",
            "label": "Phụ lục IV - Mẫu dấu ĐẾN & Sổ văn bản",
            "category": "decree_article",
            "count": 12,
            "x": 520,
            "y": 500,
            "connections": ["d32_con_dau"],
            "details": "Kích thước dấu ĐẾN: 35mm x 50mm khắc sẵn. Quy định sổ đăng ký văn bản đi, đến và phiếu giải quyết văn bản đến.",
        },
        {
            "id": "phu_luc_5",
            "label": "Phụ lục V - Lập Danh mục hồ sơ & Nộp lưu",
            "category": "decree_article",
            "count": 10,
            "x": 320,
            "y": 540,
            "connections": ["d25_sao_van_ban"],
            "details": "Mẫu Danh mục hồ sơ ban hành đầu năm, Mục lục hồ sơ nộp lưu (02 bản), Biên bản giao nhận hồ sơ lưu trữ.",
        },
        {
            "id": "phu_luc_6",
            "label": "Phụ lục VI - Hệ thống tài liệu điện tử",
            "category": "decree_article",
            "count": 16,
            "x": 120,
            "y": 520,
            "connections": ["vector_chunks"],
            "details": "Quy định mã định danh cơ quan (OrganId 13 ký tự), mã hồ sơ (FileCode), năm hình thành (FileCatalog 4 số), định dạng PDF v1.4 trở lên.",
        },
        {
            "id": "quyet_dinh",
            "label": "Quyết định (cá biệt) - Mẫu 1.2",
            "category": "doc_type",
            "count": 20,
            "x": 220,
            "y": 140,
            "connections": ["d7_the_thuc", "d8_the_thuc"],
            "details": "Mẫu 1.2 & 1.3 Phụ lục I. Thể thức bao gồm: Căn cứ ban hành, các Điều khoản (Điều 1, Điều 2...), Nơi nhận, Chữ ký và Con dấu pháp nhân.",
        },
        {
            "id": "cong_van",
            "label": "Công văn hành chính - Mẫu 1.5",
            "category": "doc_type",
            "count": 18,
            "x": 680,
            "y": 180,
            "connections": ["d7_the_thuc", "d8_the_thuc"],
            "details": "Mẫu 1.5 Phụ lục I. Có phần Kính gửi rõ ràng, trích yếu sau chữ V/v, kết thúc bằng nơi nhận và thẩm quyền ký.",
        },
        {
            "id": "thong_bao",
            "label": "Thông báo nội bộ & công khai",
            "category": "doc_type",
            "count": 14,
            "x": 380,
            "y": 90,
            "connections": ["d7_the_thuc"],
            "details": "Phổ biến chủ trương, chính sách, kết luận cuộc họp, phân công nhiệm vụ theo chuẩn quy định NĐ 30.",
        },
        {
            "id": "bien_ban",
            "label": "Biên bản cuộc họp / sự việc",
            "category": "doc_type",
            "count": 12,
            "x": 580,
            "y": 90,
            "connections": ["d7_the_thuc"],
            "details": "Ghi nhận thời gian, địa điểm, thành phần tham dự, diễn biến nội dung và kết luận, chữ ký chủ tọa/thư ký.",
        },
        {
            "id": "vector_chunks",
            "label": "ChromaDB Vector Store (76 Pages Data)",
            "category": "vector_store",
            "count": 76,
            "x": 420,
            "y": 460,
            "connections": ["phu_luc_1", "phu_luc_6"],
            "details": "Kho dữ liệu 76 trang Nghị định 30/2020/NĐ-CP được mã hóa thành các vector embeddings 768 chiều phục vụ RAG retrieval.",
        },
        {
            "id": "rag_evaluator",
            "label": "RAG Evaluator & Faithfulness",
            "category": "system",
            "count": 8,
            "x": 240,
            "y": 580,
            "connections": ["vector_chunks"],
            "details": "Bộ đánh giá tự động 3 tiêu chí: Completeness (11 khối thể thức), Faithfulness (bám sát 38 điều NĐ 30), Relevance.",
        },
    ]

    return {
        "title": "Decree 30/2020/ND-CP Knowledge Graph",
        "nodes": nodes,
        "document_types": kg.DOCUMENT_TYPES,
        "technical_specs": kg.TECHNICAL_SPECS,
    }


@router.post("/nd30/graph-rag/query")
async def query_nd30_graph_rag(payload: dict):
    """Run Graph RAG entity extraction and context retrieval from Decree 30."""
    query_text = payload.get("query", "").strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Query text is required")

    from app.services.graph_rag import SimpleGraphRAG

    rag = SimpleGraphRAG()
    entities = rag.process(query_text)
    conditions = rag.extract_nd30_conditions(query_text)

    return {
        "query": query_text,
        "entities": [
            {"entity": e.entity, "type": e.entity_type, "context": e.context}
            for e in entities
        ],
        "rag_context": conditions,
    }


@router.post("/nd30/deep-synthesis")
async def nd30_deep_synthesis(payload: dict):
    """
    AI Deep RAG + Web Search Grounding + Prompt Synthesis:
    1. Hiểu văn bản là gì (Document Category & Intent)
    2. Đối chiếu Graph RAG Nghị định 30 xác định thành phần thiếu/cần
    3. Tra cứu Web Search thời gian thực lấy thông tư, nghị định và căn cứ mới nhất
    4. Gemini tổng hợp và kiến tạo bản văn bản hoàn thiện 100%
    """
    ocr_text = payload.get("ocr_text", "").strip()
    if not ocr_text:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp nội dung văn bản OCR (ocr_text)")

    custom_instruction = payload.get("custom_instruction", "")

    try:
        from app.services.document_deep_rag import DocumentDeepRAGService

        deep_rag_service = DocumentDeepRAGService()
        result = deep_rag_service.execute_deep_synthesis(ocr_text, custom_instruction)
        return result
    except Exception as exc:
        # Fallback an toan neu co ngoai le he thong
        import datetime
        now = datetime.datetime.now()
        date_str = f"Hà Nội, ngày {now.day:02d} tháng {now.month:02d} năm {now.year}"
        from app.services.document_deep_rag import DocumentDeepRAGService
        svc = DocumentDeepRAGService()
        audit = svc.analyze_compliance_gaps(ocr_text)
        return svc._fallback_deep_synthesis(ocr_text, audit, [], date_str)


@router.post("/nd30/copilot")
async def nd30_copilot(payload: dict):
    """
    AI Legal Document Copilot:
    Trợ lý AI hỗ trợ người dùng soạn thảo, bổ sung điều khoản, sửa đổi văn phong,
    chuẩn hóa thể thức hành chính theo yêu cầu tương tác.
    """
    current_text = payload.get("text", "") or payload.get("current_text", "")
    if not current_text.strip():
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp văn bản cần soạn thảo (text)")

    instruction = payload.get("instruction", "")
    action_type = payload.get("action_type", "custom")

    try:
        from app.services.document_copilot import DocumentCopilotService

        copilot = DocumentCopilotService()
        result = copilot.assist_drafting(current_text, instruction, action_type)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Copilot error: {exc}") from exc


# ═══════════════════════════════════════════════════════════════════════════════
# ADVISORY FLOW — Luồng tư vấn & tạo văn bản từ template (Bổ sung mới)
# ═══════════════════════════════════════════════════════════════════════════════


@router.post("/guidance/chat")
async def guidance_chat(payload: dict):
    """
    [Luồng A — Advisory] RAG hội thoại xác định loại văn bản.

    Stateless: client gửi full conversation_history mỗi request.

    Request body::
        {
          "message": str,                    // Tin nhắn mới của người dùng
          "conversation_history": [          // Lịch sử hội thoại trước đó (optional)
            {"role": "user", "content": str},
            {"role": "assistant", "content": str}
          ]
        }

    Response::
        {
          "message": str,           // AI trả lời/hỏi thêm
          "doc_type": str | null,   // Loại văn bản đã xác định (null nếu chưa)
          "required_fields": [...], // Field schema nếu đã xác định
          "is_resolved": bool,      // True khi xác định xong loại VB
          "next_action": str,       // "ask_more" | "go_to_field_resolver"
          "process_steps": [str]    // Các bước người dùng cần làm
        }
    """
    user_message = (payload.get("message") or "").strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Vui lòng nhập tin nhắn (message).")

    conversation_history = payload.get("conversation_history") or payload.get("history") or []

    try:
        response = _guidance_agent.process(user_message, conversation_history)
        return response.to_dict()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Guidance Agent error: {exc}") from exc


@router.post("/fields/resolve")
async def resolve_fields(payload: dict):
    """
    [Luồng A — Advisory] Field Resolver: đối chiếu schema với hồ sơ user.

    Tự điền field có source_hint matching với profile, chỉ trả về missing_fields cần hỏi user.

    Request body::
        {
          "doc_type": str,                   // Loại văn bản (từ GuidanceAgent)
          "user_profile": {                  // Hồ sơ user từ Supabase auth session
            "full_name": str,
            "organization": str,
            "title": str,
            "department": str,
            "location": str,
            "id_number": str,
            "dob": str,
            "phone": str,
            "address": str
          },
          "partial_answers": {}              // Các field user đã điền (optional)
        }

    Response::
        {
          "doc_type": str,
          "filled_fields": {},               // Field đã có giá trị
          "missing_fields": [...],           // Field còn thiếu (cần hỏi user)
          "prefilled_keys": [...],           // Keys tự điền từ profile
          "is_complete": bool
        }
    """
    doc_type = (payload.get("doc_type") or "").strip().upper()
    if not doc_type:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp doc_type.")

    schema = get_schema_dict(doc_type)
    if not schema:
        supported = list_supported_types()
        raise HTTPException(
            status_code=400,
            detail=f"Loại văn bản '{doc_type}' chưa được hỗ trợ. Hỗ trợ: {', '.join(supported)}"
        )

    profile_data = payload.get("user_profile") or {}
    user_profile = UserProfile.from_dict(profile_data)
    partial_answers = payload.get("partial_answers") or {}

    try:
        result = _field_resolver.resolve(doc_type, user_profile, partial_answers)
        return result.to_dict()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Field Resolver error: {exc}") from exc


@router.post("/generate")
async def generate_document(payload: dict):
    """
    [Luồng A — Advisory] Document Generation Engine: tạo văn bản từ template NĐ30.

    Nhận filled_fields đã gắn nhãn, build ND30ExportPayload không suy luận vị trí.
    Validator score từ luồng này cao hơn đáng kể so với luồng OCR.

    Request body::
        {
          "doc_type": str,                   // Loại văn bản
          "filled_fields": {}                // Tất cả field đã được điền (từ FieldResolver + user)
        }

    Response::
        {
          "doc_type": str,
          "export_payload": {},              // Sẵn sàng cho nd30_exporter
          "input_mode": "structured",
          "validation_ready": bool,
          "missing_required": [...],
          "generation_warnings": [...]
        }
    """
    doc_type = (payload.get("doc_type") or "").strip().upper()
    if not doc_type:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp doc_type.")

    filled_fields = payload.get("filled_fields") or payload.get("values") or {}

    try:
        result = _doc_generator.generate(doc_type, filled_fields)
        return result.to_dict()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Document Generator error: {exc}") from exc


@router.get("/guidance/schemas")
async def get_supported_schemas():
    """
    [Advisory] Trả về danh sách loại văn bản được hỗ trợ và Field Schema tương ứng.
    Frontend dùng để hiển thị dropdown chọn loại VB.
    """
    from app.services.field_schema import FIELD_SCHEMAS
    return {
        "supported_types": list_supported_types(),
        "schemas": {
            doc_type: schema.to_dict()
            for doc_type, schema in FIELD_SCHEMAS.items()
        }
    }
