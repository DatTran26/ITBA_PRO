# UC-TL-01 — Quản lý hồ sơ năng lực

- **Actor:** HR/admin.
- **Precondition:** Person và skill tồn tại trong scope actor.
- **Flow:** mở profile → thêm/cập nhật person-skill level → lưu → xem gap.
- **Exception:** invalid relation/unauthorized được từ chối bởi BFF/RLS.
- **Postcondition:** Person skill relation là source cho scoring.
- **Evidence:** `Backend/supabase/migrations/20260331000000_crm_layer_schema.sql:32`.
