# 📦 Town Hown — Danh Mục Modules AI Độc Lập

Thư mục `modules/` chứa các khối chức năng AI độc lập (Plug-and-Play Vertical Slices) của hệ thống HRMS Town Hown (`down-town`). Mỗi module được thiết kế khép kín (Self-contained) gồm **Backend FastAPI**, **Frontend React/TypeScript**, đặc tả kỹ thuật **SKILL.md** và tài liệu hướng dẫn **README.md**, cho phép:
- Chạy độc lập (Standalone) để kiểm thử hoặc phát triển cô lập.
- Kéo-thả (Drag & Drop) tích hợp trực tiếp vào `Frontend/` (Next.js) và `Backend/` (FastAPI / Supabase) của Town Hown.

---

## 📑 Danh Sách Các Modules

| Module | Tên Chức Năng | Công Nghệ Chính | Tài Liệu Chi Tiết | Đặc Tả Kỹ Thuật (Agent Skill) |
|---|---|---|---|---|
| [`vision-ocr/`](./vision-ocr) | **Document AI Vision OCR** | Google Gemini Vision VLM, Pytesseract, React Queue | [Xem README](./vision-ocr/README.md) | [SKILL.md](./vision-ocr/SKILL.md) |
| [`face-attendance/`](./face-attendance) | **Điểm Danh Khuôn Mặt & Chống Giả Mạo** | InsightFace ArcFace 512-D, Dual Anti-Spoofing, SQLite | [Xem README](./face-attendance/README.md) | [SKILL.md](./face-attendance/SKILL.md) |

---

## 1. 🔍 Module Vision OCR (`modules/vision-ocr`)
* **Mục đích:** Bóc tách văn bản, chữ viết tay, bảng biểu từ ảnh tài liệu/PDF scan phục vụ Document AI, hồ sơ ứng viên và hợp đồng.
* **Backend:** FastAPI (`POST /api/ocr/scan`) tích hợp Gemini 3.6 Flash với fallback Pytesseract.
* **Frontend:** React + TypeScript hàng đợi xử lý tuần tự (Job Queue) và bảng đối chiếu ảnh/kết quả OCR.
* **Tài liệu thiết kế cấp dự án:** [`docs/superpowers/specs/2026-08-24-document-ai-workspace-design.md`](../docs/superpowers/specs/2026-08-24-document-ai-workspace-design.md).

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
# Tích hợp OCR
from modules.vision_ocr.backend.app.api.ocr import router as ocr_router
app.include_router(ocr_router)

# Tích hợp Face Attendance
from modules.face_attendance.backend.app.api.face_attendance import router as face_router
app.include_router(face_router)
```

### Tích hợp Frontend:
Import component giao diện hoàn chỉnh vào các trang của `Frontend/`:
```tsx
// Trang bóc tách văn bản
import { OCRScannerPage } from '@/modules/vision-ocr/frontend/src/components/OCRScannerPage';

// Trang điểm danh nhân viên
import { FaceAttendanceWorkspace } from '@/modules/face-attendance/frontend/src/components/FaceAttendanceWorkspace';
```