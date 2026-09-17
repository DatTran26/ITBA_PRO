# Vision OCR & Decree 30 Studio Engine Module

An independent Document AI module featuring advanced image text extraction, AI drafting copilot, deep legal RAG with web search grounding, and administrative document promulgation compliant with **Decree 30/2020/NĐ-CP** (Nghị định 30/2020/NĐ-CP).

## Directory Structure

```text
modules/vision-ocr/
├── SKILL.md                          # Skill and prompt specification
├── README.md                         # Detailed module guide
├── backend/                          # FastAPI + Gemini Vision VLM + Pytesseract + Legal RAG
│   ├── app/
│   │   ├── api/ocr.py                # REST endpoints (/scan, /nd30/*, /export-nd30)
│   │   ├── core/config.py            # API keys, Gemini model fallbacks, upload limits
│   │   ├── services/
│   │   │   ├── ocr_service.py        # Gemini Vision OCR with Pytesseract fallback
│   │   │   ├── document_copilot.py   # AI Drafting Copilot with in-place positional replacement
│   │   │   ├── document_deep_rag.py  # Deep RAG + Google Web Search Grounding
│   │   │   ├── nd30_validator.py     # 9 mandatory components audit & seal check
│   │   │   ├── nd30_exporter.py      # python-docx exporter matching Decree 30 layout
│   │   │   ├── nd30_ai_generator.py  # AI auto-draft generator
│   │   │   └── nd30_knowledge_graph.py # Legal Knowledge Graph (Graph RAG)
│   │   └── main.py                   # FastAPI application
│   └── tests/                        # Pytest suite
└── frontend/                         # React + TypeScript + Vite frontend
    ├── src/
    │   ├── components/                # App shell, upload, queue, ND30 Studio modal
    │   ├── features/ocr/              # Sequential queue reducer and controller hook
    │   ├── hooks/                     # Animation & reduced motion hooks
    │   ├── services/ocrService.ts     # Scan & Studio API boundaries
    │   ├── types/ocr.ts               # TypeScript interfaces
    │   └── __tests__/                 # Test suite
    ├── package.json
    └── vite.config.ts
```

---

## Core Capabilities

### 1. Multi-Engine Vision OCR (`POST /api/ocr/scan`)
- **Primary:** Google Gemini Vision VLM with visual grounding bounding boxes.
- **Fallback:** Local Pytesseract supporting Vietnamese (`vie`) and English (`eng`).
- **Grounded Blocks:** Returns bounding boxes `[x, y, w, h]` for interactive visual inspection.

### 2. AI Drafting Copilot (`POST /api/ocr/nd30/copilot`)
- **Natural Instruction Execution:** Accepts user requests like *"bổ sung số CCCD của tôi là 001234567890, tên Lê Trung Kiên, sinh ngày 12/03/1990"*.
- **Positional In-place Replacement:** Replaces placeholder markers or existing values directly within the target clauses, preserving document structure.
- **Multi-Model Failover:** Automatically fails over (`gemini-3.6-flash` ➔ `gemini-3.5-flash` ➔ `gemini-3.5-flash-lite` ➔ `gemini-flash-latest`) to withstand Free Tier `429 Rate Limit`.

### 3. AI Deep RAG + Real-time Web Search Grounding (`POST /api/ocr/nd30/deep-rag`)
- Automatically identifies document category and structural gaps against Decree 30.
- Queries real-time legal regulations and statutes using Google Search Grounding.
- Synthesizes a 100% complete, legally sound administrative draft.

### 4. Decree 30/2020/NĐ-CP Audit & Promulgation Studio
- **9 Mandatory Components Audit (`POST /api/ocr/nd30/validate`):**
  1. Quốc hiệu & Tiêu ngữ
  2. Tên cơ quan, tổ chức ban hành
  3. Số, ký hiệu văn bản
  4. Địa danh và thời gian ban hành
  5. Tên loại & Trích yếu nội dung
  6. Nội dung (Căn cứ pháp lý & Các điều khoản)
  7. Chức vụ, họ tên & Thẩm quyền ký (KT., TL., TUQ.)
  8. Dấu, chữ ký số cơ quan (kiểm định dấu đỏ tròn pháp nhân)
  9. Nơi nhận
- **Compliance Scoring:** Computes an audit score (0-100) and highlights actionable warnings or errors.
- **Visual A4 Paper Simulation:** Renders live document preview conforming to standard paper margins and administrative seal placement.
- **Word (.docx) Export (`POST /api/ocr/export-nd30`):** Generates standardized `.docx` files with proper fonts (Times New Roman), margins, and table headers.

### 5. Legal Knowledge Graph (`GET /api/ocr/nd30/knowledge-graph`)
- Interactive Graph RAG mapping articles, legal bases, signature authorities, and seal management regulations.

### 6. Bidirectional Synchronization
- Instant, seamless synchronization between:
  `Workspace Editor ↔ AI Copilot ↔ AI Deep RAG ↔ Decree 30 Studio (nd30Data) ↔ DOCX Promulgation`.

---

## Quickstart Guide

### Backend Setup (Port 8000)

1. Navigate to the backend directory:
   ```bash
   cd modules/vision-ocr/backend
   ```
2. Activate your Python virtual environment:
   ```powershell
   # Windows
   .venv\Scripts\activate
   # Linux/macOS
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables in `.env`:
   ```ini
   GEMINI_API_KEY=your_gemini_api_key_here
   TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe # optional on Windows
   ```
5. Start the FastAPI server:
   ```powershell
   $env:PYTHONIOENCODING="utf-8"
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Integration (Next.js Dashboard)

The full Vision OCR & Decree 30 Studio is integrated into the Next.js frontend at:
- **Route:** `http://localhost:3000/dashboard/ocr`
- **Code:** `Frontend/src/app/dashboard/ocr/`

To launch the frontend dev server:
```powershell
cd Frontend
npm run dev
```

---

## API Summary Table

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ocr/scan` | Multi-image OCR scan with Gemini Vision + Pytesseract |
| `POST` | `/api/ocr/nd30/copilot` | AI Drafting Copilot with multi-model failover & in-place replacement |
| `POST` | `/api/ocr/nd30/deep-rag` | AI Deep RAG + Google Search Grounding legal synthesis |
| `POST` | `/api/ocr/nd30/validate` | 9 mandatory components audit & seal/signature verification |
| `POST` | `/api/ocr/nd30/auto-generate` | Auto-draft generation from raw OCR text |
| `POST` | `/api/ocr/export-nd30` | Export Word (.docx) conforming to Decree 30 standard |
| `GET` | `/api/ocr/nd30/knowledge-graph` | Decree 30 Knowledge Graph network data |
