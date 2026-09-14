# Report: doc-ai

- **Features:** `document-review` (PRD 7.18, Must v1), `document-library`
  (PRD 7.30, Should), `vision-ocr` (PRD 7.39, Should — module standalone)
- **Files written:**
  - `docs/features/document-review/brainstorms/human-confirmed-extraction-publish.md` (mới)
  - `docs/features/document-review/document-review-urd.md` (mới)
  - `docs/features/document-review/srs/document-review-spec.md` (mới)
  - `docs/features/document-review/srs/document-review-erd.md` (mới)
  - `docs/features/document-library/brainstorms/versioned-knowledge-source-library.md` (mới)
  - `docs/features/document-library/document-library-urd.md` (mới)
  - `docs/features/document-library/srs/document-library-spec.md` (mới)
  - `docs/features/document-library/srs/document-library-erd.md` (mới)
  - `docs/features/vision-ocr/brainstorms/session-scoped-ocr-review.md` (mới)
  - `docs/features/vision-ocr/vision-ocr-urd.md` (mới)
  - `docs/features/vision-ocr/srs/vision-ocr-spec.md` (mới)
  - `docs/features/vision-ocr/srs/vision-ocr-erd.md` (mới)
- **OQ resolved:** document-review 21 `[x]` (7 brainstorm + 7 URD + 7 spec
  — cùng bộ câu hỏi lặp theo pipeline) + 2 `[~]`; document-library 18
  `[x]` (6 + 6 + 6) + 3 `[~]`; vision-ocr 8 `[x]` (4 brainstorm + 4 URD)
  + 2 `[~]` — spec vision-ocr gom quyết định vào bảng "Quyết định đề
  xuất/câu hỏi chờ owner" (5 dòng: OQ-1→OQ-4 + gate tích hợp) thay vì
  lặp lại danh sách. Đề xuất chờ owner gồm: OQ-13 privacy/provider
  (DPO/legal), OQ-6/OQ-KB-02 retention, OQ-9 đồng bộ/republish khi
  nguồn đổi, ngưỡng confidence, SLA review, nhãn nguồn engine OCR,
  giới hạn retry.
- **OQ hold/OOS:** retention phiên bản tài liệu + file gốc `[~]` chờ
  DPO (OQ-6); auto-đồng bộ nội dung phát sinh khi nguồn thay phiên bản
  `[~]` chờ owner (OQ-9 — hiện chỉ flag `needs_recheck`); vision-ocr OOS
  theo đúng PRD "Chưa làm": lưu trữ/lịch sử, đăng nhập/quyền, field cấu
  trúc + confidence + vùng nguồn, đẩy sang module nghiệp vụ, tích hợp
  pipeline (chỉ sau gate Mục 12).
- **Mermaid verify:** cả 3 ERD `PASS` check-erd.mjs (document-review 8E/
  10R, document-library 8E/12R, vision-ocr 2E/1R). `mermaid-verify.mjs`:
  toolchain thiếu — tự soi thủ công (compile FAIL do thiếu mmdc/Chrome,
  giống mọi file repo kể cả gold standard). Cảnh báo "NGHĨA" là
  heuristic tên FK: document-review 3 (self-ref `EXTRACTION_RESULT`,
  `USERS→REVIEW_ACTION/REVIEW_ASSIGNMENT` — FK `actor_id`/`assignee_id`
  tồn tại thật); document-library 5 (`current_version_id`,
  `merged_into_id`, `actor_id`, `owner_id`, `approved_by` — FK đều có);
  vision-ocr 0 cảnh báo. Giữ nguyên convention FK-mang-tên-vai trò như
  gold standard.
- **🔶 Quyết định thay user đáng chú ý:**
  - document-review: tách `REVIEW_ACTION` khỏi `REVIEW_ASSIGNMENT` —
    assignment là trạng thái phân công, action là vết quyết định bất
    biến (audit); "publish" chỉ tạo `PUBLICATION` ở trạng thái sẵn sàng,
    việc đưa lên thư viện là của `document-library` (chống chồng quyền);
    ngưỡng confidence tự duyệt KHÔNG tồn tại — mọi kết quả phải qua
    người xác nhận (nguyên tắc human-in-the-loop).
  - document-library: `current_version_id` trên `SOURCE_DOCUMENT` là
    con trỏ duy nhất tới bản "đã duyệt" — bảo đảm 1 bản hiệu lực; nội
    dung phát sinh khóa bất biến vào `version_id` tại thời điểm sinh
    (reverse spec KB), khi bản bị thay thế chỉ flag `needs_recheck`
    chứ không ghi đè; phiên bản đang được tham chiếu không xóa hẳn.
  - vision-ocr: ERD chỉ 2 entity transient in-memory (`OCR_SESSION`,
    `OCR_JOB`) — cố ý không persist, không tham chiếu entity ngoài; ba
    bản text là attribute của job thay vì entity riêng (bám source);
    thêm `engine_used` làm đề xuất cho nhãn nguồn fallback (OQ-3); chỉ
    dữ liệu không nhạy cảm/synthetic tới provider ngoài khi OQ-13 chưa
    duyệt, dữ liệu thật đi fallback nội bộ (R-16).
- **Vấn đề/blocker (cho Max, không phải file của tôi):**
  - `document-intake-erd.md` FAIL check-erd.mjs 5 lỗi label quan hệ
    thiếu quote (`: tao`, `: ghi_nhan`, `: tai_len`, `: thuc_hien`) —
    file của agent khác, không đụng.
  - `vision-ocr` hiện không có owner xác nhận 3 đề xuất UX nhỏ (cảnh
    báo rời trang, nhãn nguồn engine, cảnh báo sau 3 retry) — chờ
    Product/Document AI owner; hành vi hiện tại của module vẫn đúng
    mini-brief nếu không duyệt.
