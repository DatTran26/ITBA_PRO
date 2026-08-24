# Vision OCR Engine Module

An independent image text-extraction module with a FastAPI backend and React TypeScript frontend.

## Directory structure

```text
modules/vision-ocr/
├── SKILL.md                          # Skill and prompt specification
├── README.md                         # Module guide
├── backend/                          # FastAPI + Gemini Vision API + pytesseract fallback
│   ├── app/
│   │   ├── api/ocr.py                # Endpoint POST /api/ocr/scan
│   │   ├── core/config.py            # API key and model configuration
│   │   ├── services/ocr_service.py   # Primary OCR service
│   │   └── main.py                   # FastAPI application
│   └── tests/                        # Backend pytest suite
└── frontend/                         # React + TypeScript + Vite frontend
    ├── src/
    │   ├── components/                # App shell, upload, queue, and review workspace
    │   ├── features/ocr/              # Sequential queue reducer and controller hook
    │   ├── hooks/                     # Motion with a reduced-motion fallback
    │   ├── services/ocrService.ts     # Scan API boundary
    │   ├── types/ocr.ts               # TypeScript interfaces
    │   └── __tests__/                 # React Testing Library tests
    ├── package.json
    └── vite.config.ts
```

## Quick start

### Backend

```bash
cd modules/vision-ocr/backend
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd modules/vision-ocr/frontend
npm install
npm run dev
```

The frontend requires Node.js `^20.19.0` or `>=22.12.0` and calls `http://localhost:8000` by default. Set `VITE_API_URL` when the backend runs at another address.

### Frontend quality checks

```bash
cd modules/vision-ocr/frontend
npm test
npm run typecheck
npm run build
```

## Current workspace scope

- Accepts up to five PNG, JPG/JPEG, or WEBP images, each up to 10 MB.
- Processes files sequentially through the synchronous `POST /api/ocr/scan` endpoint.
- Keeps original OCR, HR-edited, and confirmed text as separate values.
- Keeps the queue, images, and text only in the current tab's memory; refreshing clears the session.
- Shows other HRMS modules for information architecture only, without navigation or simulated features.
- Does not show fabricated progress, confidence, source-region mapping, persistence, or cancellation because the backend does not expose those capabilities.
