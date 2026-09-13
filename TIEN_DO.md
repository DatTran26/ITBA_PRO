# Tiến độ Down_Town_Pj — Document AI / Computer Vision (Hieu)

Nhánh: `develop-hieu`. Kiến trúc **B**: Next.js admin UI; Python chỉ HTTP FastAPI. Anti_2 tắt.

| Nhiệm vụ / tiến độ | Kết quả, ghi chú |
| --- | --- |
| Thành lập team & Setup | Xong. Leader, Codex, Anti_1. |
| Chọn kiến trúc AI | Khóa B. BFF Pattern. |
| OCR Phase 1 (Đóng gói) | PASS. `/dashboard/document-ai/ocr`. |
| Vision AI: Python | PASS. InsightFace buffalo_l. Thiếu `behavior.pt` → detect 503, không crash. |
| Vision AI: Next BFF & UI | PASS. Faces / Attendance / Behavior. Browser không gọi Python. `pending_review`. |
| Vision AI: Migrations | File PASS. **Chưa apply lên Supabase**: `Frontend/.env.local` có `DATABASE_URL=` trống. Chạy SQL editor hoặc điền URL rồi `python scripts/apply_vision_migrations.py`. |
| Verify E2E | Một phần. Next :3000: BFF 401; `/dashboard/faces|attendance|behavior|document-ai/ocr` 307 → `/login`; login 200. Docker Desktop **engine chưa lên** → chưa `compose up`. Chưa E2E login session (browser a11y trống + không nhập password). |
| Merge vào `develop` | Merge local `develop-hieu` → `develop` (xem commit). **Chưa push** remote. |

## Chạy

1. Apply 3 file trong `Backend/supabase/migrations/` (20260912*).
2. `.env.local`: `VISION_OCR_URL=http://localhost:8000`, `VISION_AI_URL=http://localhost:8001`.
3. YOLO custom: `src/models/vision-ai/behavior.pt` (không commit).
4. `npm run dev` trong `Frontend`. Compose khi Docker engine sẵn: `docker compose up --build web vision-ocr-api vision-ai-api`.

## Ngoài P0 (chưa làm)

WebRTC/RTSP, dwell, liveness, Telegram, face thay password, OCR Phase 2, HR face CRUD.
