import io
import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np
from fastapi.testclient import TestClient
from PIL import Image

from app.main import app
from app.services import _resolve_behavior_model_path, detect_behaviors, verify_face

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
            data={"userId": "user-1", "profileName": "Test User"},
            files=[("images", upload(f"face-{index}.png")) for index in range(6)],
        )
    assert response.status_code == 200
    assert len(response.json()["embeddings"]) == 6
    profile_dir = tmp_path / "Test User__user-1"
    assert len(list(profile_dir.glob("*.png"))) == 6
    assert json.loads((profile_dir / "profile.json").read_text())["profileName"] == "Test User"
    assert np.load(profile_dir / "embeddings.npy").shape == (6, 2)


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


def test_identify_picks_best_matching_user():
    gallery = [
        {"userId": "user-a", "embeddings": [[0.0, 1.0]] * 6},
        {"userId": "user-b", "embeddings": [[1.0, 0.0]] * 6},
    ]
    with patch("app.main.extract_face_embedding", return_value=[1.0, 0.0]):
        response = client.post(
            "/api/face/identify",
            data={"gallery": json.dumps(gallery)},
            files={"image": upload()},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["match"] is True
    assert body["userId"] == "user-b"


def test_behavior_filters_are_returned_by_service():
    detection = {"label": "smoke", "confidence": 0.9, "bbox": [1, 2, 3, 4], "isViolation": True}
    with patch("app.main.detect_behaviors", return_value=[detection]):
        response = client.post("/api/behavior/detect", files={"image": upload()})
    assert response.status_code == 200
    assert response.json()["detections"] == [detection]
    assert response.json()["processingMs"] >= 0


def test_behavior_detect_returns_503_when_weights_missing():
    with patch("app.main.detect_behaviors", side_effect=FileNotFoundError("Behavior weights missing")):
        response = client.post("/api/behavior/detect", files={"image": upload()})
    assert response.status_code == 503


def test_behavior_saves_violation_evidence_by_profile(tmp_path: Path):
    detection = {"label": "smoke", "confidence": 0.9, "bbox": [1, 2, 3, 4], "isViolation": True}
    with (
        patch("app.main.detect_behaviors", return_value=[detection]),
        patch("app.main.get_violation_data_dir", return_value=tmp_path),
        patch.dict("app.main._evidence_saved_at", {}, clear=True),
    ):
        response = client.post(
            "/api/behavior/detect",
            data={"userId": "user-1", "profileName": "Test User"},
            files={"image": upload()},
        )
    assert response.status_code == 200
    evidence_path = Path(response.json()["evidencePath"])
    assert evidence_path.parent.parent.name == "Test User__user-1"
    assert evidence_path.exists()
    assert evidence_path.with_suffix(".json").exists()


def test_behavior_returns_non_violation_boxes_for_overlay():
    box = SimpleNamespace(
        cls=np.asarray([0]),
        conf=np.asarray([0.8]),
        xyxy=np.asarray([[1.0, 2.0, 30.0, 40.0]]),
    )
    result = SimpleNamespace(boxes=[box], names={0: "Working"})
    model = SimpleNamespace(predict=lambda **_: [result])
    with (
        patch("app.services.get_behavior_model", return_value=model),
        patch("app.services.decode_image", return_value=np.zeros((8, 8, 3))),
    ):
        detections = detect_behaviors(b"image")
    assert detections == [{
        "label": "Working",
        "confidence": 0.8,
        "bbox": [1.0, 2.0, 30.0, 40.0],
        "isViolation": False,
    }]


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
    user_dir = tmp_path / "Test User__user-1"
    user_dir.mkdir()
    (user_dir / "profile.json").write_text(json.dumps({"userId": "user-1", "profileName": "Test User"}))
    (user_dir / "1.png").write_bytes(image_bytes())
    with patch("app.main.FACE_DATA_DIR", tmp_path):
        response = client.delete("/api/face/enroll/user-1")
    assert response.status_code == 200
    assert not user_dir.exists()


def test_storage_config_endpoints(tmp_path: Path):
    with patch("app.main.FACE_DATA_DIR", tmp_path):
        res = client.get("/api/face/storage-config")
        assert res.status_code == 200
        assert "storagePath" in res.json()
        assert res.json()["totalUsers"] == 0

    new_dir = tmp_path / "custom_faces"
    with (
        patch("app.config.VISION_CONTROLLER_CONFIG_FILE", tmp_path / "cfg.json"),
        patch("app.config.FACE_STORAGE_CONFIG_FILE", tmp_path / "cfg.json"),
    ):
        res_update = client.post("/api/face/storage-config", data={"storagePath": str(new_dir)})
        assert res_update.status_code == 200
        assert res_update.json()["ok"] is True
        assert new_dir.exists()

        # Test controller endpoints
        res_ctrl = client.get("/api/vision/controller/config")
        assert res_ctrl.status_code == 200
        assert 0.1 <= res_ctrl.json()["config"]["faceMatchThreshold"] <= 1.0

        res_ctrl_update = client.post(
            "/api/vision/controller/config",
            json={"faceMatchThreshold": 0.82, "behaviorConfidence": 0.35},
        )
        assert res_ctrl_update.status_code == 200
        assert res_ctrl_update.json()["config"]["faceMatchThreshold"] == 0.82
        assert res_ctrl_update.json()["config"]["behaviorConfidence"] == 0.35

        res_ctrl_models = client.post(
            "/api/vision/controller/config",
            json={
                "behaviorModels": [
                    {
                        "id": "smoke_detection",
                        "name": "Smoke",
                        "modelPath": "models/smoke.pt",
                        "confidence": 0.6,
                        "iouThreshold": 0.5,
                        "labels": ["smoke"],
                    },
                    {
                        "id": "seat_occupancy",
                        "name": "Seat",
                        "modelPath": "models/seat.pt",
                        "confidence": 0.3,
                        "iouThreshold": 0.4,
                        "labels": ["empty_seat"],
                    },
                ]
            },
        )
        assert res_ctrl_models.status_code == 200
        saved_models = res_ctrl_models.json()["config"]["behaviorModels"]
        assert len(saved_models) == 2
        assert saved_models[0]["iouThreshold"] == 0.5
        assert saved_models[1]["iouThreshold"] == 0.4
