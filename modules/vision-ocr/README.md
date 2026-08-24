# 📖 Hướng Dẫn Sử Dụng & Tài Liệu Kỹ Thuật — Vision OCR Engine

**Vision OCR Engine** là module độc lập chuyên trích xuất văn bản siêu tốc (~5 giây) từ hình ảnh, hỗ trợ cả **chữ in**, **chữ viết tay**, **bảng biểu (Markdown table)** và **mã số/ký tự đặc biệt**.

---

## 🌟 Tính Năng Nổi Bật

1. **Dual Engine Architecture (Cơ chế Kép)**:
   - **Chính (Primary)**: Google Gemini Vision VLM (API REST HTTPs async via `httpx`).
   - **Dự phòng (Local Fallback)**: Tự động chuyển sang `pytesseract` + `Pillow` khi mất mạng hoặc API gặp sự cố.
2. **Trích xuất Đa dạng**:
   - Trích xuất chính xác chữ in, chữ viết tay nghiêng/khó đọc.
   - Giữ nguyên định dạng bảng (Markdown `| col1 | col2 |`).
   - Giữ nguyên cấu trúc xuống dòng, ký tự đặc biệt, mã hóa.
3. **Giao diện Người dùng (React + TypeScript + TailwindCSS)**:
   - Kéo & Thả ảnh (Drag & Drop) hoặc click chọn file.
   - Xem trước thumbnail ảnh trực quan.
   - Indicator trạng thái đang xử lý (`⚡ AI Vision đang trích xuất chữ từ ảnh (~5s)...`).
   - 📋 Nút **Sao chép Văn bản** (Copy Clipboard kèm thông báo thành công).
   - 💾 Nút **Tải file .TXT** (Download kết quả).
   - 🔄 Nút **Quét ảnh khác** (Reset state).

---

## 📂 Cấu Trúc Thư Mục Module

```text
modules/vision-ocr/
├── SKILL.md                          # Quy chuẩn Prompt & Specification cho AI Agent
├── README.md                         # Hướng dẫn sử dụng & Tài liệu kỹ thuật
├── backend/                          # Module Backend (FastAPI + Python)
│   ├── app/
│   │   ├── api/ocr.py                # Endpoint POST /api/ocr/scan
│   │   ├── core/config.py            # Quản lý API Key, Model & MIME Types
│   │   ├── services/ocr_service.py   # Xử lý Gemini Vision & Pytesseract Fallback
│   │   └── main.py                   # FastAPI app entrypoint & CORS
│   ├── tests/                        # Bộ unit & integration tests (pytest)
│   │   ├── test_ocr_api.py
│   │   └── test_ocr_service.py
│   ├── .env.example                  # Template biến môi trường
│   └── requirements.txt              # Thư viện phụ thuộc
└── frontend/                         # Module Frontend (React + TypeScript)
    ├── src/
    │   ├── components/
    │   │   └── OCRScannerPage.tsx    # Giao diện chính Drag & Drop OCR
    │   ├── services/
    │   │   └── ocrService.ts         # Service kết nối API backend
    │   ├── types/
    │   │   └── ocr.ts                # TypeScript Interfaces
    │   └── __tests__/
    │       └── OCRScannerPage.test.tsx # Unit tests UI
    └── package.json
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Local

### 1. Cấu hình Backend (FastAPI)

```bash
# Chuyển vào thư mục backend
cd modules/vision-ocr/backend

# Cài đặt các thư viện Python phụ thuộc
pip install -r requirements.txt

# Tạo file .env từ template
cp .env.example .env
```

Mở file `.env` và điền **Gemini API Key** của bạn:
```env
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash
```

Khởi chạy server backend:
```bash
python -m uvicorn app.main:app --reload --port 8000
```
Backend sẽ chạy tại: `http://127.0.0.1:8000` (Swagger UI: `http://127.0.0.1:8000/docs`).

---

### 2. Cấu hình Frontend (React + TypeScript)

```bash
# Chuyển vào thư mục frontend
cd modules/vision-ocr/frontend

# Cài đặt các gói npm phụ thuộc
npm install

# Khởi chạy dev server
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:3000`.

---

## 🔌 API Reference (Tài Liệu Endpoint)

### Endpoint: Quét & Trích xuất Văn bản
- **URL**: `POST /api/ocr/scan`
- **Content-Type**: `multipart/form-data`
- **Định dạng file hỗ trợ**: `PNG`, `JPG`, `JPEG`, `WEBP`
- **Dung lượng tối đa**: `10 MB`

#### Body Parameter:
| Field | Type | Description |
|---|---|---|
| `file` | `UploadFile` | File ảnh cần trích xuất chữ |

#### Example Response (HTTP 200 OK):
```json
{
  "text": "Nội dung văn bản được trích xuất từ ảnh...\n| Cột 1 | Cột 2 |\n| --- | --- |\n| Giá trị 1 | Giá trị 2 |",
  "image_b64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "status": "success"
}
```

#### Status Codes:
- `200 OK`: Trích xuất chữ thành công.
- `400 Bad Request`: Định dạng file không hỗ trợ hoặc file rỗng.
- `413 Payload Too Large`: Dung lượng file vượt quá 10 MB.
- `500 Internal Server Error`: Lỗi hệ thống.

---

## 🛠️ Chế Độ Offline Fallback (Local Tesseract)

Nếu không có `GEMINI_API_KEY` hoặc máy tính mất kết nối Internet, hệ thống tự động chuyển sang **Tesseract OCR local**:
- Trên Windows, hệ thống tự động nhận diện file thực thi tại: `C:\Program Files\Tesseract-OCR\tesseract.exe`.
- Nếu chưa cài Tesseract, tải installer tại: [Tesseract at UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki).

---

## 🧪 Kiểm Thử (Testing)

### Chạy Backend Tests:
```bash
cd modules/vision-ocr/backend
pytest
```

### Chạy Frontend Tests:
```bash
cd modules/vision-ocr/frontend
npm test
```
