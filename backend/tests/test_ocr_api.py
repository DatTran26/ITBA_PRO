"""Unit and integration tests for FastAPI OCR API endpoints."""

import io
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app

client = TestClient(app)


def create_dummy_image_bytes(fmt: str = "PNG") -> bytes:
    """Generate a small dummy image in memory."""
    buf = io.BytesIO()
    img = Image.new("RGB", (100, 100), color="white")
    img.save(buf, format=fmt)
    return buf.getvalue()


def test_health_check():
    """Verify health check endpoint returns 200 OK."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_scan_unsupported_mime_type():
    """Verify 400 Bad Request when uploading unsupported file type."""
    files = {"file": ("test.txt", b"hello world", "text/plain")}
    response = client.post("/api/ocr/scan", files=files)
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_scan_empty_file():
    """Verify 400 Bad Request when uploading an empty file."""
    files = {"file": ("empty.png", b"", "image/png")}
    response = client.post("/api/ocr/scan", files=files)
    assert response.status_code == 400


@patch("app.api.ocr.extract_text_from_image", new_callable=AsyncMock)
def test_scan_image_success(mock_extract):
    """Verify successful OCR scan response structure."""
    mock_extract.return_value = {
        "text": "Sample Extracted Text",
        "image_b64": "data:image/png;base64,dummy",
        "status": "success",
    }

    img_bytes = create_dummy_image_bytes("PNG")
    files = {"file": ("sample.png", img_bytes, "image/png")}
    response = client.post("/api/ocr/scan", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["text"] == "Sample Extracted Text"
    assert "data:image/png;base64" in data["image_b64"]
