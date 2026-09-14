import io
import json
from pathlib import Path
from unittest.mock import patch

import numpy as np
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.services import _resolve_behavior_model_path, verify_face

client = TestClient(app)


def image_bytes() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (8, 8), "white").save(buffer, format="PNG")
    return buffer.getvalue()


def upload(name: str = "face.png"):
    return name, image_bytes(), "image/png"


def test_health():
    assert client.get("/health").json() == {"status": "ok"}


def test_verify_requires_two_matching_embeddings():
    probe = [1.0, 0.0]
    stored = [[1.0, 0.0], [0.9, 0.1], [0.0, 1.0], [-1.0, 0.0]]
    match, count, _ = verify_face(probe, stored)
    assert match is True
    assert count == 2


def test_enroll_saves_six_images(tmp_path: Path):
    with (
        patch("app.main.FACE_DATA_DIR", tmp_path),
        patch("app.main.extract_face_embedding", return_value=[1.0, 0.0]),
    ):
        response = client.post(
            "/api/face/enroll",
            data={"userId": "user-1"},
            files=[("images", upload(f"face-{index}.png")) for index in range(6)],
        )
    assert response.status_code == 200
    assert len(response.json()["embeddings"]) == 6
    assert len(list((tmp_path / "user-1").glob("*.png"))) == 6
    assert np.load(tmp_path / "user-1" / "embeddings.npy").shape == (6, 2)


def test_verify_endpoint():
    embeddings = [[1.0, 0.0]] * 2 + [[0.0, 1.0]] * 4
    with patch("app.main.extract_face_embedding", return_value=[1.0, 0.0]):
        response = client.post(
            "/api/face/verify",
            data={"embeddings": json.dumps(embeddings)},
            files={"image": upload()},
        )
    assert response.status_code == 200
    assert response.json()["match"] is True
    assert response.json()["matchCount"] == 2


def test_behavior_filters_are_returned_by_service():
    detection = {"label": "smoke", "confidence": 0.9, "bbox": [1, 2, 3, 4]}
    with patch("app.main.detect_behaviors", return_value=[detection]):
        response = client.post("/api/behavior/detect", files={"image": upload()})
    assert response.status_code == 200
    assert response.json() == {"detections": [detection]}


def test_behavior_detect_returns_503_when_weights_missing():
    with patch("app.main.detect_behaviors", side_effect=FileNotFoundError("Behavior weights missing")):
        response = client.post("/api/behavior/detect", files={"image": upload()})
    assert response.status_code == 503


def test_behavior_model_path_accepts_copied_quotes(tmp_path: Path):
    model_path = tmp_path / "behavior.pt"
    assert _resolve_behavior_model_path(f'  "{model_path}"  ') == model_path


def test_enroll_rejects_path_traversal():
    response = client.post(
        "/api/face/enroll",
        data={"userId": "../outside"},
        files=[("images", upload()) for _ in range(6)],
    )
    assert response.status_code == 400


def test_delete_enrollment_removes_local_images(tmp_path: Path):
    user_dir = tmp_path / "user-1"
    user_dir.mkdir()
    (user_dir / "1.png").write_bytes(image_bytes())
    with patch("app.main.FACE_DATA_DIR", tmp_path):
        response = client.delete("/api/face/enroll/user-1")
    assert response.status_code == 200
    assert not user_dir.exists()
