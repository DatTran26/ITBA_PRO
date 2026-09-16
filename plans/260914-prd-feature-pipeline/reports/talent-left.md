## Report: talent-left

- Features: `employee-evaluation` (PRD 7.33, Should), `skill-gap-analysis`
  (PRD 7.34, Should — thư mục mới, đủ 4 artifact).
- Files written/updated:
  - `docs/features/employee-evaluation/employee-evaluation-urd.md` (mới)
  - `docs/features/employee-evaluation/srs/employee-evaluation-spec.md` (mới)
  - `docs/features/employee-evaluation/srs/employee-evaluation-erd.md` (mới, 17 entities/25 rels)
  - `docs/features/skill-gap-analysis/brainstorms/skill-coverage-and-gap-review.md` (mới)
  - `docs/features/skill-gap-analysis/skill-gap-analysis-urd.md` (mới)
  - `docs/features/skill-gap-analysis/srs/skill-gap-analysis-spec.md` (mới)
  - `docs/features/skill-gap-analysis/srs/skill-gap-analysis-erd.md` (mới, 12 entities/21 rels)
  - Brainstorm `employee-evaluation` có sẵn giữ nguyên (không viết lại).
- OQ resolved: 15/15 đóng ([x]); đề xuất chờ owner xác nhận: 11
  (employee-evaluation: cadence/visibility — chờ Product owner OQ-8 PRD;
  reviewer mặc định — chờ Head of HR; quy tắc chuyển đổi — chờ Head of HR
  OQ-11/R-13; ngưỡng số — chờ Head of HR; retention — chờ DPO.
  skill-gap-analysis: định nghĩa "nhóm" — chờ Product owner; phạm vi xem
  kết quả — chờ Product owner OQ-8; owner công thức + công thức v1 +
  ngưỡng — chờ Head of HR; retention — chờ DPO).
- OQ hold/OOS: không có OQ treo; đánh dấu OOS rõ — ranking công khai,
  quyết định nhân sự tự động, nhóm ad-hoc, AI đề xuất/tóm tắt, dashboard
  xu hướng (`management-reporting`), kanban action (`kanban-workspaces`).
- check-erd.mjs: PASS — 35 files, 35 mermaid blocks, 0 errors (cả 2 ERD
  owned PASS; các lỗi repo cũ đã hết sau đợt sửa của agents khác).
- Mermaid verify: toolchain-missing-manual-check — `mmdc` không có trên
  máy (Chrome for Testing có sẵn nhưng binary mmdc thiếu) → compile-check
  fail do môi trường, giống gold standard question-bank. Đã tự soi:
  `check-erd.mjs` PASS; nhãn renderer an toàn PASS; ngữ nghĩa PASS sạch
  cảnh báo sau khi đổi tên FK trỏ USER/self-ref thành `*_user_id` /
  `previous_evaluation_result_id` / `replaced_by_gap_run_id` /
  `gap_skill_result_id`; `erDiagram` header đúng, attribute 2 token, label
  quan hệ đều có nháy, không `;`/`&`/`<`/`>` trong label, cardinality và
  hướng FK đúng (N:N qua `GAP_RUN_MEMBER`; self-ref `EVALUATION_RESULT` và
  `GAP_RUN` có label). Ghi nhận: `mermaid-verify: toolchain thiếu — tự
  soi thủ công`.
- 🔶 Quyết định thay user đáng chú ý:
  - Cadence employee-evaluation: hỗ trợ cả theo-kỳ lẫn theo-nhu-cầu;
    visibility = nhân viên xem phần công bố, quản lý/HR trong scope, không
    ranking — đề xuất chờ Product owner (PRD OQ-8).
  - Reviewer mặc định = quản lý trực tiếp, HR được phân công lại,
    reviewer ≠ người được đánh giá — chờ Head of HR.
  - Quy tắc chuyển điểm→level (`LEVEL_SUGGESTION_RULE`/`BAND`) và công
    thức coverage (`COVERAGE_RULE`) đều là đối tượng có vòng đời duyệt của
    business owner (Head of HR) — chốt R-13/OQ-11; run/campaign ghi phiên
    bản quy tắc đã áp.
  - Kỹ năng không có bài đo: ghi nhận thủ công bắt buộc evidence + lý do;
    thiếu evidence → "chưa-đánh-giá", không suy level 0.
  - Action trong skill-gap chỉ tạo từ run "đã-xác-nhận" (human-in-the-loop
    cứng, bám metric PRD 7.34); run là snapshot immutable, thay thế bằng
    run mới có liên kết.
  - Coverage chỉ tính level "đã xác nhận" từ `employee-profiles`;
    level tự khai không vào mẫu số.
- Vấn đề/blocker: không blocker. Lưu ý cho coordinator: (1) cả 2 ERD
  tham chiếu `EMPLOYEE_SKILL`/`SKILL_EVALUATION` qua FK khái niệm
  (`employee_skill_id`) — khóa thực của `EMPLOYEE_SKILL` là cặp
  profile+skill theo ERD `employee-profiles`, cần quyết định ánh xạ khi
  thiết kế vật lý; (2) `GAP_RUN.unit_id` là tham chiếu đơn vị sang
  `org-governance` dạng attribute, không phải entity — cần contract đọc
  org unit khi triển khai; (3) không commit/push theo quy định.
