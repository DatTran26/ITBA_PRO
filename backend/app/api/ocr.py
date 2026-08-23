"""POST /api/ocr/scan — accept an image and return extracted text."""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE
from app.services.ocr_service import extract_text_from_image

router = APIRouter(prefix="/api/ocr", tags=["ocr"])


@router.post("/scan")
async def scan_image(file: UploadFile = File(...)):
    """
    Accept an image (PNG, JPG, JPEG, WEBP), extract text via
    Gemini Vision API with local OCR fallback, and return JSON:

    ```json
    {
      "text": "...",
      "image_b64": "data:image/png;base64,...",
      "status": "success"
    }
    ```
    """

    # --- Validate MIME type ------------------------------------------------- #
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type: {content_type}. "
                f"Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}"
            ),
        )

    # --- Read & validate size ----------------------------------------------- #
    image_bytes = await file.read()
    if len(image_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size: {MAX_UPLOAD_SIZE // (1024 * 1024)} MB",
        )

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # --- Extract text ------------------------------------------------------- #
    result = await extract_text_from_image(image_bytes, content_type)
    return result
