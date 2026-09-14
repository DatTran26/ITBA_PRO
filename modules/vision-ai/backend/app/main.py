import json
import re
import shutil
from datetime import datetime, timezone
from threading import Lock
from time import perf_counter
from pathlib import Path
from typing import Annotated

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool

from app.config import (
    FACE_DATA_DIR,
    FACE_MATCH_THRESHOLD,
    get_face_data_dir,
    get_violation_data_dir,
    set_face_data_dir,
    get_vision_config,
    update_vision_config,
)
from app.services import (
    detect_behaviors,
    extract_face_embedding,
    verify_face,
    get_face_model,
    get_behavior_model,
)

app = FastAPI(title="Vision AI API", version="0.1.0")

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
USER_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,128}$")
INVALID_PATH_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
EVIDENCE_COOLDOWN_SECONDS = 10
_evidence_lock = Lock()
_evidence_saved_at: dict[str, float] = {}


def _active_face_dir() -> Path:
    current = globals().get("FACE_DATA_DIR")
    if current is not None:
        return Path(current)
    return get_face_data_dir()


def _profile_directory_name(profile_name: str, user_id: str) -> str:
    safe_name = INVALID_PATH_CHARS.sub("_", profile_name).strip(" .")[:80]
    return f"{safe_name or user_id}__{user_id}"


def _find_face_directories(user_id: str) -> list[Path]:
    data_dir = _active_face_dir()
    candidates = [data_dir / user_id]
    if data_dir.exists():
        candidates.extend(data_dir.glob(f"*__{user_id}"))
    return list(dict.fromkeys(candidates))


def _find_face_directory(user_id: str) -> Path | None:
    return next((path for path in _find_face_directories(user_id) if path.is_dir()), None)


def _save_violation_evidence(
    content: bytes,
    detections: list[dict],
    user_id: str,
    profile_name: str,
    model_path: str | None,
    suffix: str,
) -> str | None:
    violations = [item for item in detections if item.get("isViolation")]
    if not violations:
        return None

    key = f"{user_id}:{model_path or 'default'}"
    now = perf_counter()
    with _evidence_lock:
        if now - _evidence_saved_at.get(key, 0) < EVIDENCE_COOLDOWN_SECONDS:
            return None
        _evidence_saved_at[key] = now

    timestamp = datetime.now(timezone.utc)
    profile_dir = get_violation_data_dir() / _profile_directory_name(profile_name, user_id) / timestamp.strftime("%Y-%m-%d")
    profile_dir.mkdir(parents=True, exist_ok=True)
    stem = timestamp.strftime("%H%M%S_%f")
    image_path = profile_dir / f"{stem}{suffix}"
    image_path.write_bytes(content)
    (profile_dir / f"{stem}.json").write_text(
        json.dumps({"userId": user_id, "profileName": profile_name, "detections": violations}, indent=2),
        encoding="utf-8",
    )
    return str(image_path.resolve())


async def read_image(upload: UploadFile) -> bytes:
    if upload.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are supported")
    content = await upload.read()
    if not content:
        raise HTTPException(status_code=400, detail="Image is empty")
    return content


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/face/storage-config")
async def get_storage_config():
    data_dir = _active_face_dir()
    users = []
    total_images = 0
    total_bytes = 0
    if data_dir.exists():
        for item in data_dir.iterdir():
            if item.is_dir():
                metadata = {}
                try:
                    metadata = json.loads((item / "profile.json").read_text(encoding="utf-8"))
                except (FileNotFoundError, json.JSONDecodeError):
                    pass
                imgs = [f.name for f in item.iterdir() if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}]
                total_images += len(imgs)
                user_bytes = sum(f.stat().st_size for f in item.iterdir() if f.is_file())
                total_bytes += user_bytes
                users.append({
                    "userId": metadata.get("userId", item.name),
                    "profileName": metadata.get("profileName", item.name.split("__", 1)[0]),
                    "imageCount": len(imgs),
                    "hasEmbeddings": (item / "embeddings.npy").exists(),
                    "sizeBytes": user_bytes,
                })
    return {
        "storagePath": str(data_dir.resolve()),
        "exists": data_dir.exists(),
        "totalUsers": len(users),
        "totalImages": total_images,
        "totalSizeBytes": total_bytes,
        "users": users,
    }


@app.post("/api/face/storage-config")
async def update_storage_config(storage_path: Annotated[str, Form(alias="storagePath")]):
    clean_path = storage_path.strip().strip('"').strip("'")
    if not clean_path:
        raise HTTPException(status_code=400, detail="Path cannot be empty")
    try:
        global FACE_DATA_DIR
        FACE_DATA_DIR = set_face_data_dir(clean_path)
        return {
            "ok": True,
            "storagePath": str(FACE_DATA_DIR.resolve()),
            "message": f"Updated face storage directory to {FACE_DATA_DIR.resolve()}",
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid path: {exc}") from exc


@app.get("/api/vision/controller/config")
async def get_controller_config():
    return {
        "ok": True,
        "config": get_vision_config(),
        "storage": await get_storage_config(),
    }


@app.post("/api/vision/controller/config")
async def update_controller_config(payload: dict):
    updated = update_vision_config(payload)
    global FACE_DATA_DIR
    FACE_DATA_DIR = get_face_data_dir()
    # Clear cached models so updated parameters take effect immediately
    try:
        get_face_model.cache_clear()
    except Exception:
        pass
    try:
        get_behavior_model.cache_clear()
    except Exception:
        pass
    return {
        "ok": True,
        "message": "Vision AI model settings updated",
        "config": updated,
        "storage": await get_storage_config(),
    }


@app.post("/api/face/enroll")
async def enroll_face(
    user_id: Annotated[str, Form(alias="userId")],
    images: Annotated[list[UploadFile], File()],
    profile_name: Annotated[str | None, Form(alias="profileName")] = None,
):
    if not USER_ID_PATTERN.fullmatch(user_id):
        raise HTTPException(status_code=400, detail="Invalid userId")
    if len(images) != 6:
        raise HTTPException(status_code=400, detail="Exactly 6 images are required")

    contents = [await read_image(image) for image in images]
    try:
        embeddings = [extract_face_embedding(content) for content in contents]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    for existing_dir in _find_face_directories(user_id):
        if existing_dir.exists():
            shutil.rmtree(existing_dir)
    clean_profile_name = (profile_name or user_id).strip() or user_id
    user_dir = _active_face_dir() / _profile_directory_name(clean_profile_name, user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    (user_dir / "profile.json").write_text(
        json.dumps({"userId": user_id, "profileName": clean_profile_name}, indent=2),
        encoding="utf-8",
    )
    np.save(user_dir / "embeddings.npy", np.asarray(embeddings, dtype=np.float32))
    for index, (upload, content) in enumerate(zip(images, contents, strict=True), start=1):
        suffix = Path(upload.filename or "").suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
            suffix = ".jpg"
        (user_dir / f"{index}{suffix}").write_bytes(content)

    return {"userId": user_id, "profileName": clean_profile_name, "storagePath": str(user_dir.resolve()), "embeddings": embeddings}


@app.delete("/api/face/enroll/{user_id}")
async def delete_face_enrollment(user_id: str):
    if not USER_ID_PATTERN.fullmatch(user_id):
        raise HTTPException(status_code=400, detail="Invalid userId")
    for user_dir in _find_face_directories(user_id):
        if user_dir.exists():
            shutil.rmtree(user_dir)
    return {"deleted": True, "userId": user_id}


@app.post("/api/face/verify")
async def verify_face_image(
    image: Annotated[UploadFile, File()],
    embeddings: Annotated[str | None, Form()] = None,
    user_id: Annotated[str | None, Form(alias="userId")] = None,
):
    try:
        stored_embeddings = None
        if embeddings:
            try:
                parsed = json.loads(embeddings)
                if isinstance(parsed, list) and len(parsed) in {4, 6}:
                    stored_embeddings = parsed
            except Exception:
                pass

        if stored_embeddings is None and user_id:
            user_dir = _find_face_directory(user_id)
            user_npy = user_dir / "embeddings.npy" if user_dir else None
            if user_npy and user_npy.exists():
                stored_embeddings = np.load(user_npy).tolist()

        if stored_embeddings is None or not isinstance(stored_embeddings, list) or len(stored_embeddings) not in {4, 6}:
            raise ValueError("Exactly 4 or 6 stored embeddings are required")

        probe = extract_face_embedding(await read_image(image))
        match, match_count, scores = verify_face(probe, stored_embeddings)
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {
        "match": match,
        "matchCount": match_count,
        "threshold": get_vision_config()["faceMatchThreshold"],
        "similarities": scores,
    }


@app.post("/api/behavior/detect")
async def detect_behavior(
    image: Annotated[UploadFile, File()],
    model_path: Annotated[str | None, Form(alias="modelPath")] = None,
    user_id: Annotated[str | None, Form(alias="userId")] = None,
    profile_name: Annotated[str | None, Form(alias="profileName")] = None,
):
    if user_id and not USER_ID_PATTERN.fullmatch(user_id):
        raise HTTPException(status_code=400, detail="Invalid userId")
    content = await read_image(image)
    started = perf_counter()
    try:
        detections = await run_in_threadpool(detect_behaviors, content, model_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    evidence_path = None
    if user_id and profile_name:
        suffix = Path(image.filename or "").suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
            suffix = ".jpg"
        evidence_path = _save_violation_evidence(
            content,
            detections,
            user_id,
            profile_name.strip() or user_id,
            model_path,
            suffix,
        )
    return {
        "detections": detections,
        "evidencePath": evidence_path,
        "processingMs": round((perf_counter() - started) * 1000, 1),
    }
