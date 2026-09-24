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

Put behavior weights at `./models/vision-ai/behavior.pt`, or configure `BEHAVIOR_MODEL_PATH`. On Compose/VPS the same files are mounted at `/models`. Accepted names:

- smoking: `smoking.pt`, `smoking.onnx`, `behavior.pt`, `behavior.onnx`, `best.pt`, `best.onnx`
- empty seat: `leaving.pt`, `leaving.onnx`, then the behavior fallback

The YOLO weights must contain one or more configured classes from `BEHAVIOR_LABELS`; stock COCO weights do not provide these application-specific labels.

VPS operators copy those files to `/opt/ITBA-OCR/<env>/models/vision-ai/` after deploy. Do not commit `.pt` or `.onnx` files. The first Face ID call downloads InsightFace `buffalo_l` into the InsightFace volume.

## Run (local, no Docker)

1. Copy `.env.example` to `.env`.
2. Set `BEHAVIOR_MODEL_PATH` to your YOLO `.pt` (absolute path is fine).
3. From this directory:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Next BFF: `VISION_AI_URL=http://localhost:8001` in `Frontend/.env.local`.

Compose is optional. If you use it, it still injects container paths (`/data/faces`, `/models/behavior.pt`).

## Windows launcher

`Backend/scripts/run-local.cmd` starts the Next.js app, Vision AI on port 8001,
and OCR on port 8000. Before running it, create the local Vision AI environment
at `modules/vision-ai/backend/.venv` and configure `.env` with the path to the
approved YOLO `.pt` weights. The starter path is
`models/vision-ai/behavior.pt` relative to the repository root.

The supplied behavior models must contain the labels configured in
`BEHAVIOR_LABELS`; generic COCO weights are not sufficient for workplace
smoking or empty-seat detection.

