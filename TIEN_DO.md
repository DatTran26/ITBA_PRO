# Tiến độ Down_Town_Pj — Document AI / Computer Vision (Hieu)

Nhánh: `develop-hieu` (working tree, **chưa commit**).  
Kiến trúc khóa: **B** — trang quản trị trên Next.js hiện có; Python chỉ chạy OCR/CV.  
Anti_2 đã tắt (trùng session Anti_1) — không còn trong vòng điều phối.

| Nhiệm vụ / tiến độ | Kết quả, ghi chú |
| --- | --- |
| Thành lập team & Setup | Đã xong. Leader, Codex, Anti_1 (Anti_2 tắt). |
| Chọn kiến trúc AI | **Đã khóa B.** Web (Next.js) + Python Inference (FastAPI). BFF Pattern. |
| OCR Phase 1 (Đóng gói) | **PASS.** OCR API + Next BFF + `/dashboard/document-ai/ocr`. `image_b64` đã bỏ, dùng `after()`. |
| Vision AI: Python Inference Layer | **PASS (Phase A).** InsightFace buffalo_l, FastAPI. YOLO Behavior (smoke, empty_seat). FACE_DATA_DIR bind-mount. |
| Vision AI: Next BFF & UI | **PASS (Phase B).** Face Enroll, Attendance Check-in/out, Behavior Review. Constraints checked: Browser không gọi Python trực tiếp, ảnh mặt lưu local disk, behavior default `pending_review`, role leader/admin/super_admin. |
| Vision AI: Database & Migrations | **PASS.** Bảng `user_face_embeddings`, `attendance_sessions`, `violation_alerts` cập nhật; RLS và Policies đã thêm vào Supabase. |
| Verify E2E trên Docker / trình duyệt | **Chưa xong.** Cần máy có Docker để chạy compose và verify luồng đầy đủ. |
| Merge vào `develop` | **Chưa làm.** Đợi Leader xác nhận commit. |

## Cách chạy (khi Docker sẵn)

1. Apply migrations:
   - `Backend/supabase/migrations/20260912000000_document_ocr_image_formats.sql`
   - `Backend/supabase/migrations/20260912193500_face_and_behavior.sql`
   - `Backend/supabase/migrations/20260912210000_attendance_and_violation_review.sql`
2. Cấu hình `.env`: `GEMINI_API_KEY`, `VISION_OCR_URL=http://vision-ocr-api:8000`, `VISION_AI_URL=http://vision-ai-api:8000`
3. `docker compose up --build web vision-ocr-api vision-ai-api`
4. Login `admin` / `leader` / `super_admin` → Menu Workplace / Recruitment để test OCR, Face, Attendance, Behavior.
