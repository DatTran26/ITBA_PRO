"""Unit tests for OCR service logic and fallback mechanisms."""

from unittest.mock import AsyncMock, patch
import pytest
from app.services.ocr_service import extract_text_from_image, _local_ocr_fallback


@pytest.mark.asyncio
@patch("app.services.ocr_service._call_gemini_vision", new_callable=AsyncMock)
async def test_extract_text_gemini_success(mock_gemini):
    """Test primary path when Gemini Vision API call succeeds."""
    mock_gemini.return_value = "Gemini OCR Text"
    dummy_bytes = b"fake-image-bytes"

    result = await extract_text_from_image(dummy_bytes, "image/png")

    assert result["status"] == "success"
    assert result["text"] == "Gemini OCR Text"
    assert "data:image/png;base64," in result["image_b64"]
    mock_gemini.assert_called_once()


@pytest.mark.asyncio
@patch("app.services.ocr_service._local_ocr_fallback")
@patch("app.services.ocr_service._call_gemini_vision", new_callable=AsyncMock)
async def test_extract_text_fallback_on_error(mock_gemini, mock_fallback):
    """Test fallback path when Gemini Vision API raises an exception."""
    mock_gemini.side_effect = Exception("API connection timeout")
    mock_fallback.return_value = "Fallback OCR Text"
    dummy_bytes = b"fake-image-bytes"

    result = await extract_text_from_image(dummy_bytes, "image/jpeg")

    assert result["status"] == "success"
    assert result["text"] == "Fallback OCR Text"
    mock_fallback.assert_called_once_with(dummy_bytes)


def test_local_ocr_fallback_handling():
    """Test that local OCR fallback handles arbitrary bytes without crashing."""
    result = _local_ocr_fallback(b"invalid-image-data")
    assert isinstance(result, str)
