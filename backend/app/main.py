"""Vision OCR Engine — FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.ocr import router as ocr_router

app = FastAPI(
    title="Vision OCR Engine API",
    description="Ultra-fast multimodal Vision OCR — Gemini Vision with local fallback",
    version="0.1.0",
)

# Allow React dev server and any origin during development
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
    """Liveness probe."""
    return {"status": "ok"}
