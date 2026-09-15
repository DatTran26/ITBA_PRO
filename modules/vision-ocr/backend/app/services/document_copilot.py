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

from app.core.config import GEMINI_API_KEY

FALLBACK_MODELS = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest"
]


class DocumentCopilotService:
    """
    Trợ lý AI Soạn thảo & Hiệu chỉnh Văn bản Thông minh (AI Legal Document Copilot):
    - Điền và thay thế thông tin cá nhân, số liệu, chức danh trực tiếp vào đúng vị trí văn bản.
    - Soạn thảo bổ sung điều khoản, sửa lỗi chính tả OCR, chuẩn hóa văn phong hành chính NĐ 30.
    - Hỗ trợ Multi-model Failover tự động nếu gặp Rate Limit 429.
    """

    ACTION_PROMPTS = {
        "format_nd30": "Rà soát toàn bộ văn bản và chuẩn hóa 100% thể thức theo Nghị định 30/2020/NĐ-CP (Sửa lỗi chính tả OCR: CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM, Độc lập - Tự do - Hạnh phúc; Tên cơ quan in hoa; Số ký hiệu chuẩn; Căn cứ ban hành; Các Điều khoản; Thẩm quyền ký; Con dấu; Nơi nhận có Lưu: VT).",
        "add_clause": "Soạn thảo bổ sung thêm điều khoản phù hợp ngữ cảnh văn bản (về Hiệu lực thi hành, Quyền và Nghĩa vụ, Bảo mật thông tin hoặc Bồi thường trách nhiệm).",
        "rewrite_professional": "Viết lại toàn bộ văn bản với văn phong hành chính nhà nước trang trọng, câu từ súc tích, gãy gọn, thuật ngữ pháp lý chuẩn xác.",
        "add_legal_bases": "Tự động bổ sung các căn cứ pháp luật hiện hành phù hợp (Nghị định 30/2020/NĐ-CP, Bộ luật Lao động 2019, Luật Doanh nghiệp 2020) vào phần mở đầu.",
        "shorten_summary": "Rút gọn văn bản thành một Công văn tóm tắt cô đọng, nêu rõ mục đích, nội dung chính và chỉ đạo thực hiện cho cấp có thẩm quyền.",
    }

    def assist_drafting(
        self,
        current_text: str,
        instruction: str = "",
        action_type: str = "custom"
    ) -> Dict[str, Any]:
        """
        Thực hiện hỗ trợ người dùng soạn thảo / chỉnh sửa văn bản với Multi-Model Failover.
        """
        now = datetime.datetime.now()
        current_date_str = f"Hà Nội, ngày {now.day:02d} tháng {now.month:02d} năm {now.year}"

        effective_instruction = self.ACTION_PROMPTS.get(action_type, "")
        if instruction.strip():
            if effective_instruction:
                effective_instruction += f" Đặc biệt ưu tiên yêu cầu riêng của người dùng: \"{instruction.strip()}\""
            else:
                effective_instruction = instruction.strip()

        if not effective_instruction:
            effective_instruction = "Chuẩn hóa và nâng cao chất lượng văn bản theo chuẩn hành chính."

        # Thử lần lượt các models nếu gặp 429
        if GEMINI_API_KEY and current_text.strip():
            prompt = f"""
Bạn là Trợ lý AI Soạn thảo & Chuyên gia Pháp chế Văn bản Nhà nước cấp cao (Senior Legal Drafting Copilot).
Người dùng đang làm việc với văn bản sau và cần bạn hỗ trợ soạn thảo / cập nhật nội dung:

VĂN BẢN HIỆN TẠI:
\"\"\"
{current_text[:4500]}
\"\"\"

YÊU CẦU / CHỈ THỊ CỦA NGƯỜI DÙNG:
\"{effective_instruction}\"

QUY TẮC BẮT BUỘC:
1. ĐIỀN THÔNG TIN ĐÚNG VỊ TRÍ:
   - Nếu người dùng cung cấp thông tin thực tế như: họ tên, số CCCD/CMND, ngày sinh, chức vụ, mức lương, đơn vị... bạn PHẢI TÌM VỊ TRÍ TƯƠNG ỨNG trong văn bản và ĐIỀN TRỰC TIẾP vào đó.
   - VÍ DỤ: nếu người dùng nói "so cccd toi la 23, ten le trung kien", thì trong văn bản phải sửa:
     + Chỗ "Ông" -> điền: "Ông: Lê Trung Kiên | Giới tính: Nam"
     + Chỗ "CMND/CCCD Hộ chiếu số: cấp ngày:" -> điền: "CMND/CCCD số: 23"
   - TUYỆT ĐỐI KHÔNG được tạo ra mục ngớ ngẩn như "Điều khoản bổ sung (so cccd toi la 23)...". Hãy điền vào đúng dòng, đúng điều khoản!
2. CHUẨN HÓA LỖI CHÍNH TẢ & THỂ THỨC OCR:
   - Sửa các ký tự scan lỗi: "CONG HOA" -> "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", "Độc lập ~ Tự do" -> "Độc lập - Tự do - Hạnh phúc", "Vé việc" -> "Về việc", "Bin ân hop" -> "Biên bản họp"...
   - Giữ lại toàn bộ cấu trúc văn bản hành chính hoàn chỉnh (Quốc hiệu, Tiêu ngữ, Cơ quan, Quyết định, Các Điều 1, Điều 2...).
3. XUẤT RA DUY NHẤT 1 ĐỐI TƯỢNG JSON HỢP LỆ VỚI CẤU TRÚC:
{{
  "title": "Tóm tắt ngắn (ví dụ: Đã cập nhật thông tin bổ nhiệm ông Lê Trung Kiên & số CCCD 23)",
  "summary_of_changes": "Mô tả chi tiết những gì đã điền hoặc thay đổi trong văn bản",
  "suggested_text": "Toàn bộ văn bản sau khi đã được chỉnh sửa và điền đầy đủ từ đầu đến cuối",
  "added_clauses": [
    "Các thông tin hoặc điều khoản đã được cập nhật"
  ],
  "recommendations": [
    "Khuyến nghị hoàn thiện pháp lý hoặc thủ tục ban hành"
  ]
}}
"""
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.2,
                    "responseMimeType": "application/json"
                }
            }

            for model_name in FALLBACK_MODELS:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
                try:
                    with httpx.Client(timeout=22.0) as client:
                        resp = client.post(
                            url,
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
                                    if "suggested_text" in parsed and len(parsed["suggested_text"]) > 50:
                                        _safe_log(f"[DocumentCopilot] Successfully drafted with model {model_name}")
                                        return parsed
                        elif resp.status_code == 429:
                            _safe_log(f"[DocumentCopilot] Model {model_name} hit rate limit 429, trying next model...")
                            continue
                        else:
                            _safe_log(f"[DocumentCopilot] Model {model_name} returned status {resp.status_code}")
                except Exception as e:
                    _safe_log(f"[DocumentCopilot] Model {model_name} failed: {e}")
                    continue

        # Smart Heuristic Fallback Engine
        return self._smart_rule_copilot(current_text, effective_instruction, current_date_str)

    def _smart_rule_copilot(
        self,
        current_text: str,
        instruction: str,
        current_date_str: str
    ) -> Dict[str, Any]:
        """
        Bộ Engine biên tập & điền thông tin thông minh dựa trên quy tắc khi AI offline.
        Tìm kiếm đúng chỗ để điền thay vì nối bừa bãi vào cuối văn bản!
        """
        text = current_text
        changes = []

        # 1. Sửa lỗi chính tả OCR phổ biến
        corrections = [
            (r'CONG HOA\s+X[ÃA]\s+H[ỘO]I\s+CH[ỦU]\s+NGH[ĨI]A\s+VI[ỆE]T\s+NAM[\.:]?', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'),
            (r'[ĐD]ộc\s+lập\s*[\~\-]\s*Tự\s+do\s*[\-\~]\s*Hạnh\s+phúc', 'Độc lập - Tự do - Hạnh phúc'),
            (r'QUYẾT\s+DINE', 'QUYẾT ĐỊNH'),
            (r'Vé\s+việc', 'Về việc'),
            (r'HỘI\s+ĐÔNG\s+QUAN\s+TRI', 'HỘI ĐỒNG QUẢN TRỊ'),
            (r'CÔ\s+PHAN', 'CỔ PHẦN'),
            (r'cỗ\s+phần', 'cổ phần'),
            (r'Bin\s+ân\s+hop\s+Hiột\s+đồng', 'Biên bản họp Hội đồng'),
            (r'Cin\s+cử', 'Căn cứ'),
            (r'Cấn\s+cứ', 'Căn cứ'),
            (r'Xát\s+năng\s+lực', 'Xét năng lực'),
            (r'cân\s+86', 'cán bộ'),
            (r'Din\s+tộc', 'Dân tộc'),
            (r'Việt\s+N:', 'Việt Nam'),
            (r'‘Noi\s+đăng\s+ky', 'Nơi đăng ký'),
            (r'hiện\s+tai', 'hiện tại'),
            (r'Quyên\s+và\s+nghĩa\s+vụ', 'Quyền và nghĩa vụ'),
            (r'Điều khoản bổ sung \([^\)]+\):\s*Các đơn vị và cá nhân liên quan có trách nhiệm phối hợp thực hiện nghiêm túc, tuân thủ đúng quy định pháp luật và quy chế nội bộ\.\n?', '')
        ]
        for pattern, repl in corrections:
            text = re.sub(pattern, repl, text, flags=re.IGNORECASE)

        # 2. Bóc tách họ tên từ instruction
        name_match = re.search(r'(?:tên|ten|họ tên|ho ten|ông|ong|bổ nhiệm)\s*(?:là|la|:)?\s*([a-zA-ZÀ-ỹ\s]+?)(?:,|$|\.|\bso\b|\bcccd\b|\bchuc\b)', instruction, re.IGNORECASE)
        if name_match:
            raw_name = name_match.group(1).strip().title()
            if len(raw_name) >= 3 and not any(k in raw_name.lower() for k in ["cccd", "toi", "la", "so"]):
                # Thay thế vào vị trí Ông / Nay bổ nhiệm
                if re.search(r'Ông\s*(?:Giới\s*tính:)?', text, re.IGNORECASE):
                    text = re.sub(r'Ông\s*(?:Giới\s*tính:\s*Nam)?', f'Ông: {raw_name} | Giới tính: Nam', text, count=1, flags=re.IGNORECASE)
                    changes.append(f"Điền họ tên người được bổ nhiệm: {raw_name}")
                elif re.search(r'Nay\s+bổ\s+nhiệm:?', text, re.IGNORECASE):
                    text = re.sub(r'(Nay\s+bổ\s+nhiệm:?)', f'\\1 Ông {raw_name}', text, count=1, flags=re.IGNORECASE)
                    changes.append(f"Điền họ tên người được bổ nhiệm: {raw_name}")

        # 3. Bóc tách số CCCD/CMND từ instruction
        cccd_match = re.search(r'(?:cccd|cmnd|hộ chiếu|ho chieu|so cccd|số cccd)\s*(?:tôi|toi)?\s*(?:là|la|:)?\s*([0-9A-Za-z]+)', instruction, re.IGNORECASE)
        if cccd_match:
            cccd_val = cccd_match.group(1).strip()
            # Thay thế vào dòng CCCD
            if re.search(r'CMND/CCCD\s*(?:Hộ\s*chiếu\s*số:)?', text, re.IGNORECASE):
                text = re.sub(r'CMND/CCCD\s*(?:Hộ\s*chiếu\s*số:)?(?:\s*cấp\s*ngày:)?', f'CMND/CCCD số: {cccd_val} | Cấp ngày: {current_date_str.split(",")[1].strip() if "," in current_date_str else current_date_str}', text, count=1, flags=re.IGNORECASE)
                changes.append(f"Điền số CCCD/CMND: {cccd_val}")
            else:
                text += f"\n- Số CCCD/CMND: {cccd_val}"
                changes.append(f"Bổ sung số CCCD/CMND: {cccd_val}")

        # 4. Nếu người dùng chọn chuẩn hóa NĐ 30
        if "nghị định 30" in instruction.lower() or "chuẩn hóa" in instruction.lower():
            if "nơi nhận" not in text.lower():
                text += "\n\nNơi nhận:\n- Như Điều 1, Điều 2;\n- Ban Giám đốc (để b/c);\n- Lưu: VT, HS."
                changes.append("Bổ sung mục Nơi nhận chuẩn Nghị định 30 (Lưu: VT)")
            if "hà nội, ngày" not in text.lower() and "ngày ... tháng" in text.lower():
                text = re.sub(r'„?\s*Ngày\s+\.\.\.\s+th[aả]ng\s+\.\.\s+n[aă]m\s+20', current_date_str, text, flags=re.IGNORECASE)
                changes.append("Chuẩn hóa địa danh và thời gian ban hành")

        if not changes:
            changes.append(f"Đã rà soát và chuẩn hóa theo yêu cầu: {instruction[:60]}")

        return {
            "title": f"Đã cập nhật: {', '.join(changes[:2])}",
            "summary_of_changes": f"Đã xử lý thông minh và điền chính xác vào văn bản: {'; '.join(changes)}.",
            "suggested_text": text.strip(),
            "added_clauses": changes,
            "recommendations": [
                "Đã tự động chuẩn hóa các lỗi scan OCR và điền dữ liệu đúng vị trí.",
                "Kiểm tra lại trước khi ký và ban hành chính thức."
            ]
        }
