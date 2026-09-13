import json
import re
import shutil
from pathlib import Path
from typing import Annotated

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from app.config import FACE_DATA_DIR, FACE_MATCH_THRESHOLD
from app.services import detect_behaviors, extract_face_embedding, verify_face

app = FastAPI(title="Vision AI API", version="0.1.0")

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
USER_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


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


@app.post("/api/face/enroll")
async def enroll_face(
    user_id: Annotated[str, Form(alias="userId")],
    images: Annotated[list[UploadFile], File()],
):
    if not USER_ID_PATTERN.fullmatch(user_id):
        raise HTTPException(status_code=400, detail="Invalid userId")
    if len(images) != 4:
        raise HTTPException(status_code=400, detail="Exactly 4 images are required")

    contents = [await read_image(image) for image in images]
    try:
        embeddings = [extract_face_embedding(content) for content in contents]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    user_dir = FACE_DATA_DIR / user_id
    if user_dir.exists():
        shutil.rmtree(user_dir)
    user_dir.mkdir(parents=True, exist_ok=True)
    np.save(user_dir / "embeddings.npy", np.asarray(embeddings, dtype=np.float32))
    for index, (upload, content) in enumerate(zip(images, contents, strict=True), start=1):
        suffix = Path(upload.filename or "").suffix.lower()
        if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
            suffix = ".jpg"
        (user_dir / f"{index}{suffix}").write_bytes(content)

    return {"userId": user_id, "embeddings": embeddings}


@app.delete("/api/face/enroll/{user_id}")
async def delete_face_enrollment(user_id: str):
    if not USER_ID_PATTERN.fullmatch(user_id):
        raise HTTPException(status_code=400, detail="Invalid userId")
    user_dir = FACE_DATA_DIR / user_id
    if user_dir.exists():
        shutil.rmtree(user_dir)
    return {"deleted": True, "userId": user_id}


@app.post("/api/face/verify")
async def verify_face_image(
    image: Annotated[UploadFile, File()],
    embeddings: Annotated[str, Form()],
):
    try:
        stored_embeddings = json.loads(embeddings)
        if not isinstance(stored_embeddings, list) or len(stored_embeddings) != 4:
            raise ValueError("Exactly 4 stored embeddings are required")
        probe = extract_face_embedding(await read_image(image))
        match, match_count, scores = verify_face(probe, stored_embeddings)
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {
        "match": match,
        "matchCount": match_count,
        "threshold": FACE_MATCH_THRESHOLD,
        "similarities": scores,
    }


@app.post("/api/behavior/detect")
async def detect_behavior(image: Annotated[UploadFile, File()]):
    try:
        detections = detect_behaviors(await read_image(image))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"detections": detections}
