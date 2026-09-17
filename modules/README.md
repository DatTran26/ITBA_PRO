# 📦 Town Hown — Danh Mục Modules AI Độc Lập

Thư mục `modules/` chứa các khối chức năng AI độc lập (Plug-and-Play Vertical Slices) của hệ thống HRMS Town Hown (`down-town`). Mỗi module được thiết kế khép kín (Self-contained) gồm **Backend FastAPI**, **Frontend React/TypeScript**, đặc tả kỹ thuật **SKILL.md** và tài liệu hướng dẫn **README.md**, cho phép:
- Chạy độc lập (Standalone) để kiểm thử hoặc phát triển cô lập.
- Kéo-thả (Drag & Drop) tích hợp trực tiếp vào `Frontend/` (Next.js) và `Backend/` (FastAPI / Supabase) của Town Hown.

---

## 📑 Danh Sách Các Modules

| Module | Tên Chức Năng | Công Nghệ Chính | Tài Liệu Chi Tiết | Đặc Tả Kỹ Thuật (Agent Skill) |
|---|---|---|---|---|
| [`vision-ocr/`](./vision-ocr) | **Document AI Vision OCR & Decree 30 Studio** | Google Gemini Vision VLM, Pytesseract, Graph RAG, Google Search Grounding, python-docx | [Xem README](./vision-ocr/README.md) | [SKILL.md](./vision-ocr/SKILL.md) |
| [`face-attendance/`](./face-attendance) | **Điểm Danh Sinh Trắc Học & Chống Giả Mạo** | InsightFace ArcFace 512-D, Dual Anti-Spoofing, SQLite / Qdrant | [Xem README](./face-attendance/README.md) | [SKILL.md](./face-attendance/SKILL.md) |

---

## 1. 🔍 Module Vision OCR & Decree 30 Studio (`modules/vision-ocr`)

* **Mục đích:** Bóc tách văn bản, chữ viết tay, bảng biểu từ ảnh tài liệu/PDF scan phục vụ Document AI, hồ sơ ứng viên, hợp đồng và tự động hóa soạn thảo - thẩm định - ban hành văn bản hành chính theo chuẩn **Nghị định 30/2020/NĐ-CP**.

### 🌟 Các Tính Năng Nổi Bật:

1. **Trích xuất văn bản đa tầng (Vision OCR Engine):**
   - Tích hợp **Google Gemini Vision VLM** với cơ chế tự động fallback sang **Pytesseract** (hỗ trợ song ngữ Tiếng Việt `vie` và Tiếng Anh `eng`).
   - Nhận diện vùng văn bản trực quan (**Visual Grounding Bounding Boxes**) cho phép click chọn và đối chiếu từng khối văn bản trên ảnh gốc.

2. **Trợ lý Soạn thảo & Hiệu chỉnh AI (AI Drafting Copilot):**
   - **Hiểu chỉ thị ngôn ngữ tự nhiên:** Người dùng chỉ cần ra lệnh tự nhiên (ví dụ: *"bổ sung số CCCD của tôi là 001234567890, tên Lê Trung Kiên, sinh ngày 12/03/1990"*).
   - **Thay thế đúng vị trí (Positional In-place Replacement):** AI tự động định vị đúng vị trí thông tin trong các điều khoản hoặc trường thông tin cá nhân để thay thế, không chèn nối đuôi vào cuối tài liệu.
   - **Multi-Model Failover:** Tự động chuyển đổi linh hoạt qua danh sách mô hình (`gemini-3.6-flash` ➔ `gemini-3.5-flash` ➔ `gemini-3.5-flash-lite` ➔ `gemini-flash-latest`), xử lý triệt để lỗi giới hạn hạn ngạch Free Tier `429 Rate Limit`.

3. **AI Deep RAG & Tìm kiếm Web (Search Grounding):**
   - Tự động nhận diện bản chất văn bản (loại quyết định, thông báo, quy chế, hợp đồng).
   - Tra cứu và đối chiếu văn bản pháp luật hiện hành qua **Google Search Grounding**, đảm bảo nội dung cập nhật theo quy định pháp quy mới nhất.
   - Tự động hoàn thiện hồ sơ dự thảo chuẩn mực gồm cơ quan ban hành, căn cứ pháp lý, các điều khoản và nơi nhận.

4. **Trung tâm Thẩm định & Ban hành Nghị định 30/2020/NĐ-CP:**
   - **Bóc tách 9 thành phần thể thức bắt buộc:**
     1. Quốc hiệu và Tiêu ngữ (căn giữa, font chữ đứng/đậm, gạch chân).
     2. Tên cơ quan, tổ chức ban hành văn bản.
     3. Số, ký hiệu văn bản (chuẩn quy ước số/năm/loại-cơquan).
     4. Địa danh và thời gian ban hành văn bản.
     5. Tên loại và trích yếu nội dung văn bản.
     6. Nội dung văn bản (các căn cứ pháp lý và hệ thống điều khoản rõ ràng).
     7. Chức vụ, họ tên và chữ ký của người có thẩm quyền (KT., TL., TUQ.).
     8. Dấu, chữ ký số của cơ quan, tổ chức (kiểm tra dấu tròn đỏ pháp nhân, thẩm quyền ban hành).
     9. Nơi nhận (nơi nhận chỉ đạo, nơi thực hiện, nơi lưu trữ).
   - **Kiểm định Thể thức & Chấm điểm (Audit Scoring):** Đánh giá điểm tuân thủ trên thang 100 điểm kèm danh sách khuyến nghị hiệu chỉnh chi tiết (Severity Warning / Error).
   - **Mô phỏng bản in A4 trực quan:** Xem trước trang in A4 chuẩn NĐ 30, hiển thị con dấu đỏ hành chính và chữ ký số.
   - **Xuất văn bản Word (.docx) chuyên nghiệp:** Tự động tạo file Word chuẩn lề (trên 20-25mm, dưới 20-25mm, trái 30-35mm, phải 15-20mm), font Times New Roman, bảng căn chỉnh nơi nhận và chữ ký chuẩn mực.

5. **Đồ thị Tri thức Pháp lý (ND30 Graph RAG):**
   - Trực quan hóa các mối liên kết thực thể (Entity Graph) giữa Cơ quan ban hành, Thẩm quyền ký, Con dấu pháp nhân, Luật Doanh nghiệp, Luật Cán bộ Công chức và Nghị định 30/2020/NĐ-CP.

6. **Cơ chế Đồng bộ Hai Chiều (Bidirectional Sync):**
   - Dữ liệu đồng bộ tức thời và liền mạch: **Workspace Editor ↔ AI Copilot ↔ AI Deep RAG ↔ Decree 30 Studio (`nd30Data`) ↔ File Word DOCX**.

---

## 2. 👤 Module Face Attendance & Anti-Spoofing (`modules/face-attendance`)

* **Mục đích:** Điểm danh sinh trắc học thời gian thực qua webcam, tự động đối chiếu nhân sự và ngăn chặn gian lận (ảnh in, màn hình điện thoại, video phát lại).
* **Backend:** FastAPI (`/api/face/*`), mô hình ArcFace 512-D (InsightFace), thuật toán Dual Anti-spoofing (Silent Optical + Interactive Motion/EAR), cơ sở dữ liệu SQLite/Qdrant.
* **Frontend:** React + TypeScript với luồng webcam live, guide overlay, bảng đo chỉ số Anti-spoofing, modal đăng ký từ CV và bảng lịch sử chấm công.
* **Tài liệu thiết kế cấp dự án:** [`docs/superpowers/specs/2026-09-14-biometric-face-attendance-design.md`](../docs/superpowers/specs/2026-09-14-biometric-face-attendance-design.md).

---

## 🔌 Quy Ước Kéo Thả (Drag & Drop Integration)

### Tích hợp Backend:
Gắn trực tiếp router của module vào file `main.py` của Backend Town Hown:
```python
# Tích hợp OCR & Decree 30 Studio
from modules.vision_ocr.backend.app.api.ocr import router as ocr_router
app.include_router(ocr_router)

# Tích hợp Face Attendance
from modules.face_attendance.backend.app.api.face_attendance import router as face_router
app.include_router(face_router)
```

### Tích hợp Frontend:
Import component giao diện hoàn chỉnh vào các trang của `Frontend/`:
```tsx
// Trang bóc tách văn bản & Soạn thảo chuẩn NĐ 30
import { OCRScannerPage } from '@/modules/vision-ocr/frontend/src/components/OCRScannerPage';

// Hoặc sử dụng trực tiếp trong Dashboard Next.js:
// Đường dẫn: /dashboard/ocr -> Frontend/src/app/dashboard/ocr/ocr-client.tsx

// Trang điểm danh nhân viên
import { FaceAttendanceWorkspace } from '@/modules/face-attendance/frontend/src/components/FaceAttendanceWorkspace';
```

---

## 🛠 Hướng Dẫn Chạy Cục Bộ (Local Quickstart)

### Khởi chạy Backend OCR:
```powershell
cd modules/vision-ocr/backend
# Kích hoạt môi trường ảo Python
.venv\Scripts\activate
# Khởi chạy server FastAPI tại port 8000
$env:PYTHONIOENCODING="utf-8"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Khởi chạy Frontend:
```powershell
cd Frontend
npm run dev
# Mở trình duyệt tại: http://localhost:3000/dashboard/ocr
```