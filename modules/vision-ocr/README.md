# Vision OCR Engine Module

Bộ module độc lập trích xuất văn bản từ ảnh siêu tốc (FastAPI Backend + React TypeScript Frontend).

## Cấu trúc thư mục

```text
modules/vision-ocr/
├── SKILL.md                          # Tài liệu Skill & Prompt quy chuẩn
├── README.md                         # Hướng dẫn module
├── backend/                          # Backend FastAPI + Gemini Vision API + pytesseract fallback
│   ├── app/
│   │   ├── api/ocr.py                # Endpoint POST /api/ocr/scan
│   │   ├── core/config.py            # Cấu hình API key & model
│   │   ├── services/ocr_service.py   # Service OCR chính
│   │   └── main.py                   # App FastAPI
│   └── tests/                        # Tests pytest cho backend
└── frontend/                         # Frontend React + TypeScript + TailwindCSS
    ├── src/
    │   ├── components/OCRScannerPage.tsx # Component Drag & Drop + Text Area
    │   ├── services/ocrService.ts     # Service gọi API scan
    │   ├── types/ocr.ts               # Interfaces
    │   └── __tests__/                 # Tests React Testing Library
    └── package.json
```

## Chạy nhanh

### Backend:
```bash
cd modules/vision-ocr/backend
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend:
```bash
cd modules/vision-ocr/frontend
npm install
npm run dev
```
