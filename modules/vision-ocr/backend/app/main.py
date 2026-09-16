from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ocr import router as ocr_router
from app.core.config import CORS_ALLOWED_ORIGINS

app = FastAPI(
    title="Vision OCR Engine API",
    description="Multimodal Vision OCR — Gemini Vision with pytesseract fallback",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr_router)


from fastapi.responses import HTMLResponse, RedirectResponse

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>Vision OCR Engine - Downtown HRMS</title>
        <style>
            body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 520px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
            h1 { font-size: 22px; margin-top: 0; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 9999px; color: #4ade80; font-size: 12px; font-weight: 600; margin-bottom: 20px; }
            .status-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
            .links { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
            .btn { display: block; text-align: center; padding: 12px 16px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; transition: all 0.2s; }
            .btn-primary { background: #3b82f6; color: white; }
            .btn-primary:hover { background: #2563eb; }
            .btn-secondary { background: #334155; color: #e2e8f0; }
            .btn-secondary:hover { background: #475569; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="status"><span class="status-dot"></span> Backend API Đang Hoạt Động (Port 8000)</div>
            <h1>⚡ Vision OCR Engine</h1>
            <p>Đây là <strong>REST API Backend</strong> (FastAPI). Để dùng giao diện người dùng tương tác, vui lòng truy cập giao diện Frontend bên dưới:</p>
            <div class="links">
                <a href="http://localhost:5173" class="btn btn-primary" target="_blank">🌐 Mở Giao diện Vision OCR Studio (Port 5173)</a>
                <a href="http://localhost:3000/dashboard/ocr" class="btn btn-secondary" target="_blank">🏢 Mở Downtown HRMS OCR (Port 3000)</a>
                <a href="/docs" class="btn btn-secondary">📖 Xem Tài liệu API Swagger (/docs)</a>
            </div>
        </div>
    </body>
    </html>
    """

@app.get("/health")
async def health_check():
    return {"status": "ok"}

