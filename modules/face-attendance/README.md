# 👤 Module Face Attendance & Anti-Spoofing (Town Hown HRMS)

Hệ thống Điểm danh Khuôn mặt Thời gian thực tích hợp Chống Giả mạo kép (Dual Anti-Spoofing) và Trích xuất Vector ArcFace 512-D được đóng gói độc lập theo chuẩn module của dự án `down-town`.

---

## 📁 Cấu Trúc Module

```text
modules/face-attendance/
├── SKILL.md                          # Đặc tả kỹ thuật và chỉ dẫn tích hợp cho AI Agent
├── README.md                         # Hướng dẫn chi tiết & tài liệu API
├── backend/                          # FastAPI Backend Server
│   ├── app/
│   │   ├── api/
│   │   │   └── face_attendance.py    # Các REST endpoints /api/face/*
│   │   ├── core/
│   │   │   └── config.py             # Cấu hình môi trường, DB, threshold
│   │   ├── services/
│   │   │   ├── face_service.py       # InsightFace ArcFace 512-D & PDF/Image decoder
│   │   │   ├── antispoofing_service.py # Dual Liveness (Texture/Frequency + Motion/EAR)
│   │   │   └── attendance_service.py # SQLite CRUD, Vector search 1:N & attendance logging
│   │   └── main.py                   # Ứng dụng FastAPI & CORS
│   ├── tests/
│   │   └── test_face_attendance.py   # Bộ kiểm thử Pytest
│   ├── requirements.txt
│   └── .env.example
└── frontend/                         # React + TypeScript + Vite Frontend
    ├── src/
    │   ├── components/               # Giao diện (CameraFeed, LivenessIndicator, FaceAttendanceWorkspace...)
    │   ├── services/                 # API Client giao tiếp backend
    │   ├── types/                    # TypeScript interfaces
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── styles.css
    ├── package.json
    └── vite.config.ts
```

---

## 🌟 Chức Năng Nổi Bật

1. **Nhận diện khuôn mặt thời gian thực**:
   - Trích xuất vector đặc trưng khuôn mặt 512 chiều chuẩn hóa L2 bằng mô hình **ArcFace (InsightFace)**.
   - So khớp 1:N siêu tốc (< 2ms) bằng Cosine Similarity trên SQLite hoặc Qdrant Vector DB.
2. **Thuật toán Chống giả mạo kép (Dual Anti-Spoofing)**:
   - **Silent Optical Analysis**: Đo độ nét và nhiễu moiré qua phổ tần số Laplacian (phát hiện ảnh in), phân tích tán xạ sắc thái mô da thật (YCrCb), lọc phản xạ chói lóa màn hình điện tử (HSV).
   - **Interactive Motion Analysis**: Đo tỉ lệ Eye Aspect Ratio (EAR) nhận diện chớp mắt thật, đo độ biến thiên tọa độ vi chuyển động (chống replay video/ảnh tĩnh), sinh thử thách ngẫu nhiên (chớp mắt, nghiêng đầu, mỉm cười).
3. **Đăng ký hồ sơ linh hoạt**:
   - Tự động bóc tách ảnh thẻ chân dung từ tệp hồ sơ CV (PDF nhiều trang hoặc ảnh chụp PNG/JPG/WebP).
4. **Quản lý & Thống kê chấm công**:
   - Ghi nhận lịch sử check-in, thiết bị quét, điểm số tin cậy và cảnh báo gian lận.

---

## 🚀 Hướng Dẫn Khởi Chạy Độc Lập (Standalone)

### 1. Khởi động Backend (FastAPI)

```bash
cd D:\MyProject\down-town\modules\face-attendance\backend

# Tạo môi trường ảo và cài đặt dependencies
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt

# Khởi chạy server FastAPI
python -m uvicorn app.main:app --reload --port 8000
```
*API Swagger Docs sẽ sẵn sàng tại: `http://localhost:8000/docs`*

### 2. Khởi động Frontend (React + Vite)

```bash
cd D:\MyProject\down-town\modules\face-attendance\frontend

# Cài đặt thư viện
npm install

# Khởi chạy giao diện phát triển
npm run dev
```
*Truy cập giao diện tại: `http://localhost:5174`*

---

## 🔌 Hướng Dẫn Kéo Thả Tích Hợp Vào `down-town`

### Cách 1: Tích hợp Backend vào FastAPI Gateway của down-town
Tại file `main.py` của Backend down-town, chỉ cần import và gắn router:
```python
from modules.face_attendance.backend.app.api.face_attendance import router as face_attendance_router

app.include_router(face_attendance_router)
```

### Cách 2: Tích hợp Frontend Component vào Next.js / React của down-town
Sao chép hoặc import component `FaceAttendanceWorkspace` vào trang quản trị chấm công:
```tsx
import { FaceAttendanceWorkspace } from '@/modules/face-attendance/frontend/src/components/FaceAttendanceWorkspace';

export default function AttendancePage() {
  return (
    <div className="container mx-auto py-6">
      <FaceAttendanceWorkspace />
    </div>
  );
}
```

---

## 📡 Danh Sách API REST

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| `POST` | `/api/face/check-in` | Điểm danh qua đa khung hình webcam kèm Anti-Spoofing |
| `POST` | `/api/face/register-cv` | Đăng ký khuôn mặt từ file CV (PDF hoặc Ảnh) |
| `POST` | `/api/face/liveness-challenge` | Sinh thử thách cử động ngẫu nhiên |
| `GET` | `/api/face/employees` | Lấy danh sách nhân sự kèm avatar |
| `GET` | `/api/face/logs` | Lấy lịch sử chấm công gần nhất |
| `GET` | `/api/face/summary` | Thống kê số lượng có mặt / vắng / cảnh báo giả mạo |