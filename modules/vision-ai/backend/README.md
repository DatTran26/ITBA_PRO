# Vision AI API

FastAPI execution service for ArcFace enrollment/verification and YOLO behavior detection.

## API contract

- `POST /api/face/enroll`: multipart fields `userId` and six repeated `images` files.
- `POST /api/face/verify`: multipart fields `image` and `embeddings`, where `embeddings` is a JSON array of six vectors. Existing four-vector enrollments remain compatible.
- `POST /api/behavior/detect`: multipart field `image`.
- `GET /health`: lightweight health check that does not load either model.

Face verification uses cosine similarity `>= FACE_MATCH_THRESHOLD` and succeeds when at least two stored embeddings match.

## Models and data

Enrollment images are written to `FACE_DATA_DIR/{userId}/`. In Compose, the default host directory is `./data/vision-ai/faces`.

Put behavior weights at `./models/vision-ai/behavior.pt`, or configure `BEHAVIOR_MODEL_PATH`. The YOLO weights must contain one or more configured classes from `BEHAVIOR_LABELS`; stock COCO weights do not provide these application-specific labels.

## Run (local, no Docker)

1. Copy `.env.example` to `.env`.
2. Set `BEHAVIOR_MODEL_PATH` to your YOLO `.pt` (absolute path is fine).
3. From this directory:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Next BFF: `VISION_AI_URL=http://localhost:8001` in `Frontend/.env.local`.

Compose is optional. If you use it, it still injects container paths (`/data/faces`, `/models/behavior.pt`).

