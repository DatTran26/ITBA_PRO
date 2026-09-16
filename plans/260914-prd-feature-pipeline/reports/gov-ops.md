# Report: gov-ops

- **Features:** `release-announcements` (PRD 7.36, Could), `ai-usage-monitoring`
  (PRD 7.37, Should)
- **Files written:**
  - `docs/features/release-announcements/release-announcements-urd.md` (mới)
  - `docs/features/release-announcements/srs/release-announcements-spec.md` (mới)
  - `docs/features/release-announcements/srs/release-announcements-erd.md` (mới)
  - `docs/features/ai-usage-monitoring/brainstorms/ai-usage-cost-observability.md` (mới)
  - `docs/features/ai-usage-monitoring/ai-usage-monitoring-urd.md` (mới)
  - `docs/features/ai-usage-monitoring/srs/ai-usage-monitoring-spec.md` (mới)
  - `docs/features/ai-usage-monitoring/srs/ai-usage-monitoring-erd.md` (mới)
  - Brainstorm `approved-release-announcements.md` đã có sẵn — chỉ dùng làm
    nguồn, không sửa.
- **OQ resolved:** 17 `[x]` (release-announcements: 4 URD + 4 spec; ai-usage-
  monitoring: 8 brainstorm + 7 URD + 7 spec — cùng bộ câu hỏi lặp lại theo
  pipeline). Đề xuất chờ owner: tất cả (Admin lead / Security owner / Product
  owner / Technical owner).
- **OQ hold/OOS:** retention (OQ-6 PRD — DPO) `[~]` ở cả 2 feature; sửa sau
  công bố + nhắc đọc lại (P1/P2) và auto-suy nội dung từ commit (OQ-5 PRD)
  ở release-announcements; anomaly detection + quota cứng (P2) ở
  ai-usage-monitoring.
- **Mermaid verify:** cả 2 ERD `PASS` check-erd.mjs. mermaid-verify.mjs chạy
  được: compile FAIL do thiếu Chrome (toolchain — giống mọi file repo kể cả
  gold standard); 2+4 cảnh báo "NGHĨA" là heuristic tên FK (`created_by`,
  `reviewer_id`, `updated_by`, `decided_by`) không khớp pattern `*_id` — FK
  tồn tại thật, cùng loại cảnh báo với gold standard question-bank → giữ
  nguyên convention. Tự soi syntax đã kiểm.
- **🔶 Quyết định thay user đáng chú ý:**
  - release-announcements: chặn tự duyệt khi ≥2 người giữ quyền; nhãn phiên
    bản = chuỗi admin nhập, KHÔNG bắt khớp Git tag (OQ-5 PRD còn mở → không
    ràng buộc deploy authority); đối tượng v1 = toàn bộ + theo vai trò; hạn
    hiển thị người dùng mới 90 ngày, "đọc đúng hạn" 7 ngày — tất cả gắn nhãn
    đề xuất chờ owner.
  - ai-usage-monitoring: "cảnh báo thủ công" giải là admin tự đặt ngưỡng + tự
    xử lý, hệ thống chỉ flag (không tự khóa/chặn — bám PRD "Chưa làm" + R-14);
    chi phí chốt bất biến tại thời điểm ghi; breakdown theo người chỉ cho
    admin/được cấp kèm nhãn vận hành (quản lý cố ý không có surface — chống
    lạm dụng đánh giá nhân sự); ngưỡng reconcile đề xuất 5%.
- **Vấn đề/blocker (cho Max, không phải file của tôi):**
  - 8 file `*-erd.md` của agent khác đang là CRLF → check-erd.mjs báo "0
    mermaid blocks" (false pass): account-access, ai-meeting-minutes,
    assessment-authoring, employee-profiles, offer-management,
    recruitment-planning, talent-framework, workforce-monitoring. Cần Max
    normalize line ending hoặc yêu cầu agent ghi LF.
  - `document-intake-erd.md` FAIL 5 lỗi label quan hệ thiếu quote — file của
    agent khác, không đụng.
