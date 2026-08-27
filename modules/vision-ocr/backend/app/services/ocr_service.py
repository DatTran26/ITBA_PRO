"""
OCR Service — Gemini Vision API with local pytesseract fallback.

Primary path:
  1. Encode image to Base64.
  2. POST to Gemini Vision REST API for text extraction.

Fallback path (offline / API error):
  3. Use pytesseract + Pillow for local OCR.
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
    """Return ``{"text": ..., "image_b64": ..., "status": ...}``."""
    b64_str = base64.b64encode(image_bytes).decode("utf-8")
    image_data_uri = f"data:{mime_type};base64,{b64_str}"

    try:
        text = await _call_gemini_vision(b64_str, mime_type)
    except Exception as gemini_exc:
        logger.warning(
            "Gemini Vision API failed (%s), falling back to local OCR",
            type(gemini_exc).__name__,
        )
        try:
            text = _local_ocr_fallback(image_bytes)
        except Exception as local_exc:
            logger.error(
                "All OCR engines failed (Gemini: %s; local: %s)",
                type(gemini_exc).__name__,
                type(local_exc).__name__,
            )
            raise OCRUnavailableError(
                "No OCR engine could process the image"
            ) from local_exc

    return {
        "text": text,
        "image_b64": image_data_uri,
        "status": "success",
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


def _local_ocr_fallback(image_bytes: bytes) -> str:
    """Best-effort local OCR using pytesseract + Pillow."""
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
        logger.error("Local OCR failed (%s)", type(exc).__name__)
        raise RuntimeError("Local OCR failed") from exc
