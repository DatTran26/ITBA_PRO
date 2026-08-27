from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE
from app.services.ocr_service import OCRUnavailableError, extract_text_from_image

router = APIRouter(prefix="/api/ocr", tags=["ocr"])


@router.post("/scan")
async def scan_image(file: UploadFile = File(...)):
    """Accept an image (PNG, JPG, JPEG, WEBP) and return extracted text JSON."""
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}. Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}",
        )

    image_bytes = await file.read()
    if len(image_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size: {MAX_UPLOAD_SIZE // (1024 * 1024)} MB",
        )

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    try:
        return await extract_text_from_image(image_bytes, content_type)
    except OCRUnavailableError as exc:
        raise HTTPException(
            status_code=503,
            detail="OCR service temporarily unavailable",
        ) from exc
