import json
import re
import datetime
from typing import Dict, Any, Optional
import httpx

from app.core.config import GEMINI_API_KEY, GEMINI_API_URL

class ND30AIGenerator:
    """
    AI Generator: Tự động trích xuất và kiến tạo văn bản hành chính
    chuẩn Nghị định 30/2020/NĐ-CP từ dữ liệu OCR hoặc thông tin kịch bản HR.
    """

    def generate_draft(self, ocr_text: str, custom_instruction: str = "") -> Dict[str, Any]:
        """
        Dùng Gemini REST API để phân tích cấu trúc văn bản OCR và tạo cấu trúc NĐ 30.
        Có fallback regex/rule-based parser nếu AI gọi không thành công.
        """
        now = datetime.datetime.now()
        current_date_str = f"Hà Nội, ngày {now.day:02d} tháng {now.month:02d} năm {now.year}"

        if GEMINI_API_KEY and ocr_text.strip():
            try:
                prompt = f"""
Bạn là chuyên gia soạn thảo và pháp chế văn bản hành chính Nhà nước theo Nghị định 30/2020/NĐ-CP của Chính phủ.
Dưới đây là văn bản trích xuất từ ảnh scan OCR của phòng Nhân sự / Hành chính:
\"\"\"
{ocr_text[:3000]}
\"\"\"

Yêu cầu bổ sung từ người dùng (nếu có): "{custom_instruction}"

Nhiệm vụ của bạn:
1. Đọc kỹ văn bản scan và trích xuất/kiến tạo thành một văn bản hành chính hoàn chỉnh chuẩn Nghị định 30/2020/NĐ-CP.
2. Xác định chính xác loại văn bản (QUYẾT ĐỊNH, THÔNG BÁO, TỜ TRÌNH, BIÊN BẢN, CÔNG VĂN...).
3. Chuẩn hóa Quốc hiệu, Tiêu ngữ, Số hiệu, Địa danh ngày tháng, Trích yếu, Căn cứ pháp lý, Các Điều/Khoản nội dung, Chức vụ người ký, Con dấu pháp nhân cơ quan và Nơi nhận.

BẮT BUỘC trả về duy nhất 1 đối tượng JSON theo cấu trúc sau (không kèm markdown thừa):
{{
  "doc_type": "QUYẾT ĐỊNH",
  "company_name": "TÊN CƠ QUAN / CÔNG TY BAN HÀNH",
  "department": "PHÒNG NHÂN SỰ",
  "doc_number": "01/QĐ-NS",
  "location_date": "{current_date_str}",
  "subject": "Về việc tiếp nhận và bổ nhiệm cán bộ",
  "bases": [
    "Căn cứ Bộ luật Lao động số 45/2019/QH14 ngày 20 tháng 11 năm 2019;",
    "Căn cứ Điều lệ tổ chức và hoạt động của Công ty;",
    "Xét đề nghị của Trưởng phòng Nhân sự;"
  ],
  "articles": [
    {{
      "title": "Điều 1",
      "content": "Tiếp nhận và bổ nhiệm..."
    }},
    {{
      "title": "Điều 2",
      "content": "Quyết định này có hiệu lực kể từ ngày ký. Các phòng ban và cá nhân có tên tại Điều 1 chịu trách nhiệm thi hành Quyết định này."
    }}
  ],
  "signatory_title": "TỔNG GIÁM ĐỐC",
  "signatory_name": "Họ và tên người ký",
  "recipients": [
    "Như Điều 2",
    "Ban Giám đốc (để b/c)",
    "Lưu: VT, NS"
  ],
  "has_seal": true,
  "seal_note": "Đóng con dấu tròn pháp nhân của cơ quan, tổ chức trùm lên 1/3 chữ ký về phía bên trái."
}}
"""
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "responseMimeType": "application/json"
                    }
                }
                with httpx.Client(timeout=30.0) as client:
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
                            # Parse JSON
                            m = re.search(r'\{.*\}', raw_content, re.DOTALL)
                            if m:
                                parsed = json.loads(m.group(0))
                                if isinstance(parsed, dict) and "doc_type" in parsed:
                                    return parsed
            except Exception as e:
                print(f"[ND30AIGenerator] Gemini draft generation error: {e}, falling back to rule engine.")

        # Fallback rule-based generator
        return self._fallback_rule_generator(ocr_text, current_date_str)

    def _fallback_rule_generator(self, ocr_text: str, date_str: str) -> Dict[str, Any]:
        """Bộ trích xuất thông minh bằng Regex và Logic tri thức NĐ 30."""
        text_lower = ocr_text.lower()

        doc_type = "QUYẾT ĐỊNH"
        if "thông báo" in text_lower:
            doc_type = "THÔNG BÁO"
        elif "tờ trình" in text_lower:
            doc_type = "TỜ TRÌNH"
        elif "biên bản" in text_lower:
            doc_type = "BIÊN BẢN"
        elif "công văn" in text_lower:
            doc_type = "CÔNG VĂN"

        # Trích xuất số hiệu
        so_match = re.search(r'(?:số|s[oố]):?\s*([0-9]+/[A-Z0-9\-]+)', ocr_text, re.IGNORECASE)
        doc_number = so_match.group(1) if so_match else "01/QĐ-NS"

        # Trích xuất tên công ty / cơ quan
        co_quan = "CÔNG TY CỔ PHẦN CÔNG NGHỆ TOWN HOWN"
        lines = [l.strip() for l in ocr_text.split('\n') if l.strip()]
        for line in lines[:5]:
            if any(k in line.upper() for k in ["CÔNG TY", "TỔNG CÔNG TY", "ỦY BAN", "TẬP ĐOÀN", "TRƯỜNG"]):
                co_quan = line.strip().upper()
                break

        # Tách nội dung điều khoản
        articles = []
        article_matches = list(re.finditer(r'(Điều\s+\d+[\.:]?\s*)([^\n]+(?:\n(?!(?:Điều\s+\d+|Nơi nhận)).+)*)', ocr_text, re.IGNORECASE))
        if article_matches:
            for m in article_matches[:5]:
                title = m.group(1).strip().rstrip(':')
                content = m.group(2).strip()
                articles.append({"title": title, "content": content})
        else:
            clean_body = ocr_text[:1200].strip() if ocr_text.strip() else "Ban hành theo quy chế và văn bản hành chính."
            articles = [
                {"title": "Điều 1", "content": clean_body},
                {"title": "Điều 2", "content": "Quyết định có hiệu lực kể từ ngày ký. Các đơn vị, phòng ban liên quan chịu trách nhiệm thi hành."}
            ]

        # Trích xuất người ký
        signatory_title = "TỔNG GIÁM ĐỐC"
        signatory_name = "Nguyễn Văn An"
        for line in lines[-10:]:
            upper = line.upper()
            if any(k in upper for k in ["GIÁM ĐỐC", "CHỦ TỊCH", "TRƯỞNG PHÒNG", "HIỆU TRƯỞNG"]):
                signatory_title = line.strip().upper()
            elif re.match(r'^[A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+){1,4}$', line):
                signatory_name = line.strip()

        raw_result = {
            "doc_type": doc_type,
            "organ_name": co_quan,
            "company_name": co_quan,
            "department": "PHÒNG NHÂN SỰ",
            "doc_code": doc_number,
            "doc_number": doc_number,
            "location": "Hà Nội",
            "date_str": date_str,
            "location_date": date_str,
            "subject": f"Về việc ban hành văn bản {doc_type.lower()} theo hồ sơ",
            "bases": [
                "Căn cứ Bộ luật Lao động số 45/2019/QH14;",
                "Căn cứ Điều lệ tổ chức và hoạt động của Công ty;",
                "Theo đề nghị của Trưởng phòng Tổ chức - Hành chính;"
            ],
            "legal_bases": [
                "Căn cứ Bộ luật Lao động số 45/2019/QH14;",
                "Căn cứ Điều lệ tổ chức và hoạt động của Công ty;",
                "Theo đề nghị của Trưởng phòng Tổ chức - Hành chính;"
            ],
            "articles": articles,
            "signer_title": signatory_title,
            "signatory_title": signatory_title,
            "signer_name": signatory_name,
            "signatory_name": signatory_name,
            "recipients": ["Như Điều 2", "Ban Giám đốc", "Lưu: VT, NS"],
            "has_seal": True,
            "seal_note": "Đóng dấu tròn pháp nhân cơ quan trùm lên 1/3 chữ ký về phía bên trái."
        }
        return self._normalize_nd30_dict(raw_result, date_str)

    def _normalize_nd30_dict(self, data: Dict[str, Any], date_str: str) -> Dict[str, Any]:
        """Chuẩn hoá đồng bộ các trường theo chuẩn Nghị định 30."""
        organ = data.get("organ_name") or data.get("company_name") or "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOWN-TOWN"
        code = data.get("doc_code") or data.get("doc_number") or "01/QĐ-HR"
        dt = data.get("date_str") or data.get("location_date") or date_str
        s_title = data.get("signer_title") or data.get("signatory_title") or "TỔNG GIÁM ĐỐC"
        s_name = data.get("signer_name") or data.get("signatory_name") or "Nguyễn Văn An"
        bases = data.get("legal_bases") or data.get("bases") or ["Căn cứ Điều lệ tổ chức và hoạt động Công ty;"]

        data["organ_name"] = organ
        data["company_name"] = organ
        data["doc_code"] = code
        data["doc_number"] = code
        data["date_str"] = dt
        data["location_date"] = dt
        data["location"] = data.get("location") or "Hà Nội"
        data["signer_title"] = s_title
        data["signatory_title"] = s_title
        data["signer_name"] = s_name
        data["signatory_name"] = s_name
        data["legal_bases"] = bases
        data["bases"] = bases
        data["has_seal"] = True
        return data
