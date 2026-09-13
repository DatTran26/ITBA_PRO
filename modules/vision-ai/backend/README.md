# Vision AI API

FastAPI execution service for ArcFace enrollment/verification and YOLO behavior detection.

## API contract

- `POST /api/face/enroll`: multipart fields `userId` and four repeated `images` files.
- `POST /api/face/verify`: multipart fields `image` and `embeddings`, where `embeddings` is a JSON array of exactly four vectors.
- `POST /api/behavior/detect`: multipart field `image`.
- `GET /health`: lightweight health check that does not load either model.

Face verification uses cosine similarity `>= FACE_MATCH_THRESHOLD` and succeeds when at least two of four embeddings match.

## Models and data

Enrollment images are written to `FACE_DATA_DIR/{userId}/`. In Compose, the default host directory is `./data/vision-ai/faces`.

Put behavior weights at `./models/vision-ai/behavior.pt`, or configure `BEHAVIOR_MODEL_PATH`. The YOLO weights must contain one or more configured classes from `BEHAVIOR_LABELS`; stock COCO weights do not provide these application-specific labels.

## Run

```bash
docker compose up --build vision-ai-api
```

The service is internal to Compose on `http://vision-ai-api:8000` and is intended to be called by the Next.js BFF.

