from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ocr import router as ocr_router

app = FastAPI(
    title="Vision OCR Engine API",
    description="Multimodal Vision OCR — Gemini Vision with pytesseract fallback",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ocr_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
