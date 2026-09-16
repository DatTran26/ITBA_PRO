"""
OCR Service — Gemini Vision API (primary) with PaddleOCR + Tesseract fallbacks.

Primary path:
  1. Encode image to Base64.
  2. POST to Gemini Vision REST API for text extraction.

Fallback path A (Gemini API error):
  3. Use PaddleOCR (Vietnamese, local) — returns text AND grounded bounding-box blocks.

Fallback path B (PaddleOCR not installed):
  4. Use pytesseract + Pillow — text only, no bounding boxes.
"""

from __future__ import annotations

import base64
import io
import logging

import httpx
from PIL import Image

from app.core.config import GEMINI_API_KEY, GEMINI_API_URL

logger = logging.getLogger(__name__)


class OCRUnavailableError(RuntimeError):
    """Raised when neither the primary nor fallback OCR engine can run."""


VISION_PROMPT = (
    "You are an expert OCR engine. Accurately transcribe ALL visible text from "
    "this image, including:\n"
    "- Printed text\n"
    "- Handwritten text\n"
    "- Table contents (preserve structure with | separators)\n"
    "- Numbers, dates, codes\n"
    "- Headers, footers, watermarks\n\n"
    "Rules:\n"
    "1. Preserve the original language — do NOT translate.\n"
    "2. Maintain line breaks and paragraph structure.\n"
    "3. For tables, use markdown table format.\n"
    "4. If text is unclear, mark it as [unclear].\n"
    "5. Return ONLY the extracted text, no commentary."
)


async def extract_text_from_image(
    image_bytes: bytes,
    mime_type: str,
) -> dict:
    """Return ``{"text": ..., "image_b64": ..., "status": ..., "blocks": [...]}``.

    ``blocks`` is a list of grounded text blocks with normalized bounding-box
    coordinates (0.0–1.0 relative to image size). Available only when PaddleOCR
    is used (Gemini path returns an empty list since Gemini does not expose bbox).
    """
    b64_str = base64.b64encode(image_bytes).decode("utf-8")
    image_data_uri = f"data:{mime_type};base64,{b64_str}"

    blocks: list[dict] = []

    try:
        text = await _call_gemini_vision(b64_str, mime_type)
    except Exception as gemini_exc:
        logger.warning(
            "Gemini Vision API failed (%s), falling back to PaddleOCR",
            type(gemini_exc).__name__,
        )
        try:
            text, blocks = _paddle_ocr_fallback(image_bytes)
        except Exception as paddle_exc:
            logger.warning(
                "PaddleOCR failed (%s), trying pytesseract",
                type(paddle_exc).__name__,
            )
            try:
                text = _local_ocr_fallback(image_bytes)
            except Exception as local_exc:
                logger.error(
                    "All OCR engines failed (Gemini: %s; Paddle: %s; Tesseract: %s)",
                    type(gemini_exc).__name__,
                    type(paddle_exc).__name__,
                    type(local_exc).__name__,
                )
                raise OCRUnavailableError(
                    "No OCR engine could process the image"
                ) from local_exc

    return {
        "text": text,
        "image_b64": image_data_uri,
        "status": "success",
        "blocks": blocks,
    }


async def _call_gemini_vision(b64_image: str, mime_type: str) -> str:
    """Send a Base64-encoded image to the Gemini Vision API and return text."""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": VISION_PROMPT},
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_image,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 8192,
        },
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            GEMINI_API_URL,
            params={"key": GEMINI_API_KEY},
            json=payload,
        )
        response.raise_for_status()

    data = response.json()
    try:
        candidates = data["candidates"]
        text = candidates[0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as err:
        raise RuntimeError(f"Unexpected Gemini response structure: {err}") from err

    return text.strip()


def _paddle_ocr_fallback(image_bytes: bytes) -> tuple[str, list[dict]]:
    """
    PaddleOCR fallback — returns (full_text, grounded_blocks).

    Uses PaddleOCR with Vietnamese language model (lang='vi').
    Each block includes a normalized bounding-box for Visual Grounding on the frontend.
    """
    try:
        import numpy as np
        import cv2
        from paddleocr import PaddleOCR
        from app.services.ocr_grounding import parse_paddle_to_grounded_blocks
    except ImportError as exc:
        raise RuntimeError("PaddleOCR / OpenCV not installed") from exc

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise RuntimeError("Could not decode image bytes with OpenCV")

    img_height, img_width = img.shape[:2]

    ocr = PaddleOCR(use_angle_cls=True, lang="vi", show_log=False)
    result = ocr.ocr(img, cls=True)

    all_lines: list = []
    if result:
        for page in result:
            if page:
                all_lines.extend(page)

    grounded = parse_paddle_to_grounded_blocks(all_lines, img_width, img_height)

    # Serialize grounded blocks to plain dicts for JSON response
    blocks = [
        {
            "id": b.id,
            "text": b.text,
            "confidence": b.confidence,
            "bbox": b.bbox,
            "field_key": b.field_key,
        }
        for b in grounded
    ]

    text = "\n".join(b.text for b in grounded) if grounded else ""
    return text, blocks


def _tesseract_fallback(image_bytes: bytes) -> str:
    """Best-effort local OCR using pytesseract + Pillow (no bounding boxes)."""
    try:
        import os
        import pytesseract

        tesseract_win_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(tesseract_win_path):
            pytesseract.pytesseract.tesseract_cmd = tesseract_win_path
    except ImportError as exc:
        logger.error("pytesseract is not installed")
        raise RuntimeError("Local OCR unavailable") from exc

    try:
        img = Image.open(io.BytesIO(image_bytes))
        text: str = pytesseract.image_to_string(img, lang="vie+eng")
        return text.strip() if text.strip() else "[No text detected by local OCR]"
    except Exception as exc:
        logger.error("Tesseract OCR failed (%s)", type(exc).__name__)
        raise RuntimeError("Local OCR failed") from exc


def _local_ocr_fallback(image_bytes: bytes) -> str:
    """Backward-compatible local OCR fallback used by existing tests/callers."""
    return _tesseract_fallback(image_bytes)
