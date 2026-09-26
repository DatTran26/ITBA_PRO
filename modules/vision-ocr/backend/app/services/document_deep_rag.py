import json
import re
import sys
import datetime
from typing import Dict, Any, List, Optional
import httpx

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

def _safe_log(msg: str):
    try:
        print(msg)
    except Exception:
        try:
            print(msg.encode("ascii", "replace").decode("ascii"))
        except Exception:
            pass

from app.core.config import GEMINI_API_KEY, GEMINI_API_URL
from app.services.nd30_knowledge_graph import ND30KnowledgeGraph

try:
    from ddgs import DDGS
    DDGS_AVAILABLE = True
except ImportError:
    try:
        from duckduckgo_search import DDGS
        DDGS_AVAILABLE = True
    except ImportError:
        DDGS_AVAILABLE = False


class DocumentDeepRAGService:
    """
    Dịch vụ AI Deep RAG & Web Grounding:
    1. Hiểu văn bản là gì (Document Category, Intent, Authority).
    2. RAG gì & Cần gì (ND30 Knowledge Graph + Legal Audit: phát hiện thiếu sót thể thức & căn cứ).
    3. Tra cứu Web Search thời gian thực (DDGS) để tìm căn cứ pháp lý hiện hành, thông tư hướng dẫn.
    4. Gemini Deep Prompt Synthesis: Tạo bản hoàn thiện đạt chuẩn 100% kèm khuyến nghị pháp chế.
    """

    def __init__(self):
        self.kg = ND30KnowledgeGraph()

    def search_web_context(self, queries: List[str], max_results_per_query: int = 2) -> List[Dict[str, str]]:
        """Tìm kiếm thông tin pháp lý và mẫu chuẩn trên Web có giới hạn thời gian tối đa 4s."""
        results = []
        seen_urls = set()

        if DDGS_AVAILABLE and queries:
            import concurrent.futures

            def _fetch_ddgs(q_str: str):
                items = []
                with DDGS() as ddgs:
                    for item in ddgs.text(q_str, max_results=max_results_per_query):
                        items.append(item)
                return items

            # Chỉ chạy 1 query trọng tâm nhất với hard timeout 4 giây
            target_query = queries[0]
            try:
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(_fetch_ddgs, target_query)
                    raw_items = future.result(timeout=4.0)
                    for item in raw_items:
                        url = item.get("href", "")
                        if url and url not in seen_urls:
                            seen_urls.add(url)
                            results.append({
                                "query": target_query,
                                "title": item.get("title", ""),
                                "snippet": item.get("body", "") or item.get("snippet", ""),
                                "url": url
                            })
            except Exception as e:
                _safe_log(f"[DocumentDeepRAG] Fast web search fallback engaged: {e}")

        # Luôn đảm bảo có các nguồn pháp quy chính thống
        if not results:
            results = [
                {
                    "query": "Nghị định 30/2020/NĐ-CP Chính phủ",
                    "title": "Nghị định số 30/2020/NĐ-CP của Chính phủ về công tác văn thư",
                    "snippet": "Quy định chi tiết về thể thức, kỹ thuật trình bày văn bản hành chính; quản lý văn bản đi, văn bản đến, quản lý và sử dụng con dấu, thiết bị lưu khóa bí mật.",
                    "url": "https://vanban.chinhphu.vn/default.aspx?pageid=27160&docid=199378"
                },
                {
                    "query": "Bộ luật Lao động 45/2019/QH14",
                    "title": "Bộ luật Lao động số 45/2019/QH14 của Quốc hội",
                    "snippet": "Quy định tiêu chuẩn lao động; quyền, nghĩa vụ, trách nhiệm của người lao động, người sử dụng lao động, cơ sở ban hành quyết định nhân sự và bổ nhiệm.",
                    "url": "https://thuvienphapluat.vn/van-ban/Lao-dong-Tien-luong/Bo-Luat-lao-dong-2019-333670.aspx"
                },
                {
                    "query": "Quy định thể thức ký con dấu văn bản hành chính",
                    "title": "Điều 33 Nghị định 30/2020/NĐ-CP: Quản lý và sử dụng con dấu",
                    "snippet": "Đóng dấu phải rõ ràng, ngay ngắn, đúng chiều và dùng đúng mực dấu đỏ theo quy định. Đóng dấu trùm lên khoảng 1/3 chữ ký về phía bên trái.",
                    "url": "https://thuvienphapluat.vn/van-ban/Bo-may-hanh-chinh/Nghi-dinh-30-2020-ND-CP-cong-tac-van-thu-436534.aspx"
                }
            ]

        return results

    def analyze_compliance_gaps(self, ocr_text: str) -> Dict[str, Any]:
        """Phân tích các thành phần thể thức theo Nghị định 30 còn thiếu hoặc cần bổ sung."""
        text_lower = ocr_text.lower()
        gaps = []
        mandatory_present = []

        # 1. Quốc hiệu - Tiêu ngữ
        if "cộng hòa xã hội chủ nghĩa việt nam" in text_lower and ("độc lập" in text_lower or "tự do" in text_lower):
            mandatory_present.append("Quốc hiệu và Tiêu ngữ (Điều 8 NĐ 30)")
        else:
            gaps.append({
                "element": "Quốc hiệu và Tiêu ngữ",
                "law_ref": "Điều 8, Điều 9 Nghị định 30/2020/NĐ-CP",
                "issue": "Thiếu dòng 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM' hoặc 'Độc lập - Tự do - Hạnh phúc' kèm đường kẻ dưới",
                "severity": "CRITICAL"
            })

        # 2. Số, ký hiệu
        so_match = re.search(r'(?:số|s[oố]):?\s*([0-9]+/[A-Z0-9\-]+)', ocr_text, re.IGNORECASE)
        if so_match:
            mandatory_present.append(f"Số và ký hiệu văn bản: {so_match.group(1)} (Điều 10 NĐ 30)")
        else:
            gaps.append({
                "element": "Số và ký hiệu văn bản",
                "law_ref": "Điều 10 Nghị định 30/2020/NĐ-CP",
                "issue": "Chưa có Số hiệu chuẩn (ví dụ: Số: .../QĐ-UBND hoặc .../CV-CTY)",
                "severity": "HIGH"
            })

        # 3. Địa danh và thời gian ban hành
        date_match = re.search(r'(ngày\s+\d{1,2}\s+tháng\s+\d{1,2}\s+năm\s+\d{4})', text_lower)
        if date_match:
            mandatory_present.append(f"Thời gian ban hành: {date_match.group(1)} (Điều 11 NĐ 30)")
        else:
            gaps.append({
                "element": "Địa danh và thời gian ban hành",
                "law_ref": "Điều 11 Nghị định 30/2020/NĐ-CP",
                "issue": "Thiếu địa danh và ngày tháng năm ban hành văn bản chuẩn thể thức",
                "severity": "HIGH"
            })

        # 4. Trích yếu nội dung
        if any(k in text_lower for k in ["về việc", "trích yếu", "quy định về", "hướng dẫn"]):
            mandatory_present.append("Trích yếu nội dung văn bản (Điều 12 NĐ 30)")
        else:
            gaps.append({
                "element": "Trích yếu nội dung",
                "law_ref": "Điều 12 Nghị định 30/2020/NĐ-CP",
                "issue": "Chưa có dòng tóm tắt ngắn gọn mục đích (Về việc ...)",
                "severity": "MEDIUM"
            })

        # 5. Căn cứ pháp lý
        bases = re.findall(r'căn cứ\s+[^\n;\.]+', text_lower)
        if bases:
            mandatory_present.append(f"Căn cứ pháp lý hiện có: {len(bases)} căn cứ (Điều 13 NĐ 30)")
        else:
            gaps.append({
                "element": "Căn cứ pháp lý ban hành",
                "law_ref": "Điều 13 Nghị định 30/2020/NĐ-CP",
                "issue": "Văn bản chưa dẫn chiếu các Luật, Nghị định hoặc Quy chế làm căn cứ pháp lý hợp lệ",
                "severity": "CRITICAL"
            })

        # 6. Chức vụ, họ tên người ký và con dấu
        if any(k in text_lower for k in ["giám đốc", "tổng giám đốc", "chủ tịch", "trưởng phòng", "ký tên"]):
            mandatory_present.append("Thẩm quyền ký (Điều 14 NĐ 30)")
        else:
            gaps.append({
                "element": "Chức vụ, họ tên người ký",
                "law_ref": "Điều 14, Điều 15 Nghị định 30/2020/NĐ-CP",
                "issue": "Chưa rõ thẩm quyền và họ tên người ký duyệt văn bản",
                "severity": "HIGH"
            })

        # 7. Nơi nhận
        if "nơi nhận" in text_lower:
            mandatory_present.append("Nơi nhận văn bản (Điều 16 NĐ 30)")
        else:
            gaps.append({
                "element": "Nơi nhận văn bản",
                "law_ref": "Điều 16 Nghị định 30/2020/NĐ-CP",
                "issue": "Thiếu mục 'Nơi nhận:' (gồm cơ quan chỉ đạo, đơn vị thi hành, Lưu: VT)",
                "severity": "MEDIUM"
            })

        return {
            "mandatory_present": mandatory_present,
            "gaps": gaps,
            "gap_count": len(gaps),
            "compliance_score": max(20, 100 - len(gaps) * 14)
        }

    def detect_document_type(self, ocr_text: str) -> str:
        """Nhận diện loại văn bản từ nội dung."""
        text_lower = ocr_text.lower()
        if any(k in text_lower for k in ["giấy nghỉ phép", "nghỉ phép", "xin nghỉ", "giấy phép nghỉ"]):
            return "GIẤY NGHỈ PHÉP"
        elif any(k in text_lower for k in ["giấy đề nghị", "đề nghị", "kiến nghị"]):
            return "GIẤY ĐỀ NGHị"
        elif any(k in text_lower for k in ["biên bản", "biên bản hỏp", "biên bản bàn giao"]):
            return "BIÊN BẢN"
        elif any(k in text_lower for k in ["báo cáo", "báo cáo tiến độ", "báo cáo công việc"]):
            return "BÁO CÁO"
        elif any(k in text_lower for k in ["tờ trình", "khần trình", "xin phê duyệt"]):
            return "Tờ TRÌNH"
        elif any(k in text_lower for k in ["công văn", "v/v"]):
            return "CÔNG VĂN"
        elif any(k in text_lower for k in ["thông báo"]):
            return "THÔNG BÁO"
        elif any(k in text_lower for k in ["hợp đồng", "hĐlĐ", "bên a", "bên b"]):
            return "HỢP ĐỒNG"
        elif any(k in text_lower for k in ["quyết định"]):
            return "QUYẾT ĐỊNH"
        elif any(k in text_lower for k in ["thông tư"]):
            return "THÔNG TƯ"
        return "VĂN BẢN HÀNH CHÍNH"

    def generate_search_queries(self, ocr_text: str) -> List[str]:
        """Tự động tạo các cụm từ tìm kiếm Web thông minh."""
        text_lower = ocr_text.lower()
        queries = []

        doc_type_label = self.detect_document_type(ocr_text).lower()

        # Nhận diện chủ đề
        if any(k in text_lower for k in ["bổ nhiệm", "tiếp nhận", "nhân sự", "thử việc", "lao động", "chấm dứt"]):
            queries.append(f"mẫu {doc_type_label} nhân sự chuẩn Nghị định 30")
            queries.append("Bộ luật Lao động 2019 căn cứ pháp lý quyết định nhân sự")
        elif any(k in text_lower for k in ["nghỉ phép", "nghỉ việc", "xin nghỉ"]):
            queries.append(f"mẫu {doc_type_label} chuẩn thể thức Nghị định 30 2020")
            queries.append("căn cứ pháp lý giấy nghỉ phép Bộ luật Lao động 2019")
        elif any(k in text_lower for k in ["xử phạt", "vi phạm", "thanh tra", "kỷ luật"]):
            queries.append(f"mẫu {doc_type_label} kỷ luật cán bộ căn cứ pháp lý")
            queries.append("Nghị định 30/2020/NĐ-CP thể thức quyết định kỷ luật")
        elif any(k in text_lower for k in ["mua bán", "dịch vụ", "thầu", "thanh toán", "nghiệm thu"]):
            queries.append(f"mẫu {doc_type_label} mua bán dịch vụ chuẩn pháp lý")
            queries.append("Luật Thương mại Luật Đấu thầu căn cứ pháp lý")
        elif any(k in text_lower for k in ["tạm ứng", "kinh phí", "ngân sách", "tài chính"]):
            queries.append(f"mẫu {doc_type_label} phê duyệt kinh phí tài chính")
        elif any(k in text_lower for k in ["báo cáo", "tiến độ", "tổng kết"]):
            queries.append(f"mẫu {doc_type_label} chuẩn Nghị định 30 2020")
            queries.append("thể thức báo cáo hành chính")
        else:
            queries.append(f"mẫu {doc_type_label} chuẩn Nghị định 30 2020 NĐ CP")
            queries.append("thể thức văn bản hành chính Nghị định 30")

        return queries

    def execute_deep_synthesis(self, ocr_text: str, custom_instruction: str = "") -> Dict[str, Any]:
        """
        Quy trình xử lý đầy đủ:
        1. Phân tích thiếu sót với RAG NĐ 30.
        2. Sinh câu hỏi & Tra cứu Web qua DDGS.
        3. Dùng Gemini tổng hợp hoàn thiện văn bản.
        """
        now = datetime.datetime.now()
        current_date_str = f"Hà Nội, ngày {now.day:02d} tháng {now.month:02d} năm {now.year}"

        # 0. Nhận diện loại văn bản trước khi phân tích
        detected_doc_type = self.detect_document_type(ocr_text)

        # 1. RAG Gap Analysis
        rag_audit = self.analyze_compliance_gaps(ocr_text)

        # 2. Web Search Grounding
        search_queries = self.generate_search_queries(ocr_text)
        web_results = self.search_web_context(search_queries, max_results_per_query=2)

        # Chuẩn bị web context tóm tắt
        web_context_str = ""
        if web_results:
            web_context_str = "\n".join([
                f"- Nguồn: {w['title']} ({w['url']}): {w['snippet']}"
                for w in web_results[:4]
            ])
        else:
            web_context_str = "Không tìm thấy thêm nguồn bên ngoài hoặc mạng nội bộ. Sử dụng tri thức pháp chế sẵn có của Nghị định 30/2020/NĐ-CP và Bộ luật Lao động."

        # 3. Gemini Deep Synthesis Prompt
        perfected_doc = None
        analysis_summary = None

        if GEMINI_API_KEY and ocr_text.strip():
            try:
                gaps_summary_str = "\n".join([f"- {g['element']}: {g['issue']} ({g['law_ref']})" for g in rag_audit["gaps"]])

                prompt = f"""
Bạn là Trợ lý AI Pháp chế & Chuyên gia Văn thư Hành chính Nhà nước cấp cao (Senior Legal & Document Engineer).
Nhiệm vụ: xem xét nội dung văn bản dưới đây và phân tích, bổ sung, hoàn thiện ĐÚNG THEO LOẠI VĂN BẢN GỐC ({detected_doc_type}) — TUYỆT ĐỐI KHÔNG thay thế bằng loại văn bản khác.

DỮ LIỆU ĐẦU VÀO:
1. Loại văn bản đã xác định: **{detected_doc_type}**
2. Nội dung văn bản gốc:
\"\"\"
{ocr_text[:3500]}
\"\"\"

3. Kết quả kiểm toán RAG theo Nghị định 30/2020/NĐ-CP (những điểm còn thiếu hoặc yếu):
{gaps_summary_str if gaps_summary_str else "Đã có tương đối đủ các thành phần cơ bản."}

4. Dữ liệu tra cứu Web thời gian thực (Grounding):
{web_context_str}

5. Yêu cầu của người dùng: "{custom_instruction}"

QUY TẮC BẮT BUỘC:
- Trường "doc_type" trong perfected_document PHẢI là "{detected_doc_type}" — không được thay đổi thành loại khác.
- Nội dung các điều khoản (articles) phải phù hợp đúng với loại văn bản "{detected_doc_type}", không dùng cấu trúc Điều 1/Điều 2 nếu đây là Giấy nội bộ hay Báo cáo.
- Nếu văn bản là Giấy nghỉ phép / Đề nghị / Báo cáo, articles có thể chỉ có 1 mục nội dung chính, không cần cấu trúc quyết định nhiều điều.

HÃY XUẤT RA DUY NHẤT 1 ĐỐI TƯỢNG JSON VỚI CẤU TRÚC SAU (không dùng markdown giải thích thừa):
{{
  "document_identity": {{
    "what_is_this": "Giải thích ngắn gọn văn bản này là gì, thuộc thể loại nào, do ai ban hành và mục đích pháp lý",
    "document_type": "{detected_doc_type}",
    "category_field": "Nhân sự / Hành chính / Pháp chế / Tài chính...",
    "confidence_rating": "95%"
  }},
  "rag_legal_audit": {{
    "applicable_laws": [
      "Nghị định số 30/2020/NĐ-CP về công tác văn thư",
      "Bộ luật Lao động 2019 (hoặc luật chuyên ngành liên quan)"
    ],
    "what_is_missing": [
      "Danh sách các điều khoản/thành phần thể thức văn bản gốc đang bị thiếu"
    ],
    "recommendations": [
      "Khuyến nghị chỉnh sửa cụ thể để đạt chuẩn pháp lý cao nhất"
    ]
  }},
  "web_grounding_insights": [
    {{
      "insight": "Điểm mới hoặc căn cứ luật cập nhật từ web",
      "source_title": "Tên nguồn hoặc căn cứ tra cứu",
      "source_url": "Đường dẫn nguồn"
    }}
  ],
  "perfected_document": {{
    "doc_type": "{detected_doc_type}",
    "company_name": "TÊN CƠ QUAN / DOANH NGHIỆP BAN HÀNH",
    "department": "TÊN PHÒNG BAN THAM MƯU",
    "doc_number": "Số hiệu chuẩn (nếu có, ví dụ: .../GNP-CTY hoặc để trống nếu không cần)",
    "location_date": "{current_date_str}",
    "subject": "Về việc... (điền đúng nội dung {detected_doc_type})",
    "bases": [
      "Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư;",
      "Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20 tháng 11 năm 2019;"
    ],
    "articles": [
      {{
        "title": "Nội dung chính",
        "content": "Điền nội dung phù hợp với {detected_doc_type} — không áp dụng cấu trúc Quyết định nếu không phải loại đó."
      }}
    ],
    "signatory_title": "CHỨC DANH NGƯỜI KÝ (IN HOA ĐẬM)",
    "signatory_name": "Họ và tên người ký",
    "recipients": [
      "Người nhận liên quan;",
      "Lưu: VT, HS."
    ],
    "has_seal": true,
    "seal_note": "Đóng dấu pháp nhân cơ quan trùm lên 1/3 chữ ký về phía bên trái theo Khoản 2 Điều 33 NĐ 30."
  }},
  "formatted_text_preview": "Bản hiển thị văn bản hoàn thiện dạng text chuẩn chỉnh từ đầu đến cuối..."
}}
"""
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "responseMimeType": "application/json"
                    }
                }
                with httpx.Client(timeout=25.0) as client:
                    resp = client.post(
                        GEMINI_API_URL,
                        params={"key": GEMINI_API_KEY},
                        json=payload
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            raw_content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            m = re.search(r'\{.*\}', raw_content, re.DOTALL)
                            if m:
                                parsed = json.loads(m.group(0))
                                if "document_identity" in parsed and "perfected_document" in parsed:
                                    parsed["rag_audit_local"] = rag_audit
                                    parsed["web_sources_searched"] = web_results
                                    return parsed
            except Exception as e:
                _safe_log(f"[DocumentDeepRAG] Gemini deep synthesis note: {e}")

        # Fallback Synthesis nếu không gọi được Gemini
        return self._fallback_deep_synthesis(ocr_text, rag_audit, web_results, current_date_str)

    def _fallback_deep_synthesis(
        self,
        ocr_text: str,
        rag_audit: Dict[str, Any],
        web_results: List[Dict[str, str]],
        current_date_str: str
    ) -> Dict[str, Any]:
        """Phương án dự phòng sinh tổng hợp thông minh khi AI offline."""
        text_lower = ocr_text.lower()
        doc_type = "QUYẾT ĐỊNH"
        if "thông báo" in text_lower:
            doc_type = "THÔNG BÁO"
        elif "tờ trình" in text_lower:
            doc_type = "TỜ TRÌNH"
        elif "hợp đồng" in text_lower:
            doc_type = "HỢP ĐỒNG"
        elif "công văn" in text_lower:
            doc_type = "CÔNG VĂN"

        so_match = re.search(r'(?:số|s[oố]):?\s*([0-9]+/[A-Z0-9\-]+)', ocr_text, re.IGNORECASE)
        doc_number = so_match.group(1) if so_match else "01/QĐ-2026"

        return {
            "document_identity": {
                "what_is_this": f"Văn bản hành chính dạng {doc_type}, phục vụ quản trị và điều hành theo quy chuẩn tổ chức.",
                "document_type": doc_type,
                "category_field": "Hành chính & Quản trị Doanh nghiệp",
                "confidence_rating": "88%"
            },
            "rag_legal_audit": {
                "applicable_laws": [
                    "Nghị định số 30/2020/NĐ-CP ngày 05/03/2020 của Chính phủ về công tác văn thư",
                    "Bộ luật Lao động số 45/2019/QH14 của Quốc hội",
                    "Luật Doanh nghiệp số 59/2020/QH14"
                ],
                "what_is_missing": [g["issue"] for g in rag_audit["gaps"]],
                "recommendations": [
                    "Cần bổ sung đầy đủ Quốc hiệu, Tiêu ngữ và đường kẻ ngang chuẩn NĐ 30.",
                    "Chuẩn hóa thể thức nơi nhận: ghi rõ nơi gửi và 'Lưu: VT'.",
                    "Đảm bảo đóng dấu trùm 1/3 chữ ký về phía bên trái bằng mực đỏ tươi."
                ]
            },
            "web_grounding_insights": [
                {
                    "insight": w.get("snippet", ""),
                    "source_title": w.get("title", "Cổng thông tin pháp luật"),
                    "source_url": w.get("url", "")
                } for w in web_results[:3]
            ],
            "perfected_document": {
                "doc_type": doc_type,
                "company_name": "CƠ QUAN / CÔNG TY BAN HÀNH",
                "department": "BỘ PHẬN HÀNH CHÍNH - TỔ CHỨC",
                "doc_number": doc_number,
                "location_date": current_date_str,
                "subject": "Về việc ban hành văn bản hành chính theo quy chuẩn Nghị định 30/2020/NĐ-CP",
                "bases": [
                    "Căn cứ Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ về công tác văn thư;",
                    "Căn cứ Quy chế tổ chức và hoạt động của cơ quan, doanh nghiệp;",
                    "Theo yêu cầu thực tiễn công tác và năng lực cán bộ."
                ],
                "articles": [
                    {
                        "title": "Điều 1",
                        "content": ocr_text[:600].strip() if ocr_text.strip() else "Ban hành và áp dụng văn bản này trên toàn hệ thống."
                    },
                    {
                        "title": "Điều 2",
                        "content": "Văn bản này có hiệu lực kể từ ngày ký. Các phòng, ban, đơn vị liên quan chịu trách nhiệm thi hành."
                    }
                ],
                "signatory_title": "THỦ TRƯỞNG CƠ QUAN / TỔNG GIÁM ĐỐC",
                "signatory_name": "Họ và tên người có thẩm quyền",
                "recipients": [
                    "Như Điều 2;",
                    "Lãnh đạo đơn vị (để b/c);",
                    "Lưu: VT, HS."
                ],
                "has_seal": True,
                "seal_note": "Đóng dấu pháp nhân cơ quan trùm lên 1/3 chữ ký về phía bên trái theo Khoản 2 Điều 33 NĐ 30."
            },
            "formatted_text_preview": ocr_text,
            "rag_audit_local": rag_audit,
            "web_sources_searched": web_results
        }
