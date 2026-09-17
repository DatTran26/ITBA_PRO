## Report: rec-left

- Features: `candidate-matching` (PRD 7.7, Must v1), `interview-evaluation`
  (PRD 7.10, Must v1), `employee-onboarding` (PRD 7.12, Should — không
  cam kết v1).
- Files written/updated:
  - `docs/features/candidate-matching/srs/candidate-matching-spec.md` (mới)
  - `docs/features/candidate-matching/srs/candidate-matching-erd.md` (mới, 10 entities/14 rels)
  - `docs/features/interview-evaluation/interview-evaluation-urd.md` (mới)
  - `docs/features/interview-evaluation/srs/interview-evaluation-spec.md` (mới)
  - `docs/features/interview-evaluation/srs/interview-evaluation-erd.md` (mới, 12 entities/17 rels)
  - `docs/features/employee-onboarding/employee-onboarding-urd.md` (mới)
  - `docs/features/employee-onboarding/srs/employee-onboarding-spec.md` (mới)
  - `docs/features/employee-onboarding/srs/employee-onboarding-erd.md` (mới, 11 entities/15 rels)
  - Brainstorm nguồn giữ nguyên; `candidate-matching` URD có sẵn được tái dùng.
- OQ resolved: 40/40 đóng ([x] 36 + [~] 4); đề xuất chờ owner xác nhận: ~30
  (chủ yếu Head of HR, Product owner, Recruitment owner, DPO).
- OQ hold/OOS: `candidate-matching` OQ-8 (gợi ý vị trí khác) + OQ-9 (báo cáo
  bias/fairness); `employee-onboarding` OQ-7 (tự cấp tài khoản hệ thống
  ngoài — chờ `external-integrations`). Chia sẻ kết quả PV cho ứng viên:
  resolved "không trong v1" chờ quyết định riêng (DPO).
- check-erd.mjs: PASS — 34 files, 32 mermaid blocks, 0 errors (3 ERD mới
  đều PASS).
- Mermaid verify: toolchain-missing-manual-check — `mmdc` không có trên máy
  (Chrome for Testing có sẵn nhưng binary mmdc thiếu) → compile-check fail
  do môi trường. Đã tự soi: `check-erd.mjs` PASS (kiểm entity/FK/quan hệ),
  label an toàn renderer PASS, semantic warnings trên interview-evaluation
  là false-positive kiểu `created_by`/`decided_by` (gold standard
  question-bank có cùng cảnh báo) — FK tồn tại, chỉ khác convention tên.
  Ghi nhận: `mermaid-verify: toolchain thiếu — tự soi thủ công`.
- 🔶 Quyết định thay user đáng chú ý:
  - `interview-evaluation`: đảo quyết định vòng = bản ghi mới trỏ
    `supersedes_id` + `is_current`, không sửa bản gốc (OQ-5, đề xuất chờ
    Head of HR); interviewer KHÔNG tự chuyển pipeline — sửa hành vi
    reverse-source cũ (FR-RC-03), quyết định vòng chỉ do vai trò được cấp
    ghi vào `ROUND_DECISION` rồi phát sự kiện.
  - `employee-onboarding`: đóng case đòi điều kiện kép — task bắt buộc
    xong VÀ `EMPLOYEE_PROFILE` `HOAT_DONG` (OQ-3); "đã đến nhận việc" mô
    hình là một task checklist; checklist trống được bắt đầu khi HR xác
    nhận rõ + audit (OQ-4); giới hạn tự đề xuất 50 task/case, offset
    1–14 ngày, nhắc tối đa 5, reopen 30 ngày, 50 mẫu/tổ chức (OQ-5).
  - `candidate-matching`: score 0–100, threshold mặc định 60, không
    auto-reject, auto-run tạo run chờ-review — đề xuất chờ Head of HR.
  - PRD OQ-6: cả 3 feature đề xuất retention theo retention hồ sơ tuyển
    dụng/nhân sự chung — chờ DPO; trước duyệt chỉ synthetic data.
- Vấn đề/blocker: không blocker. Lưu ý: `employee-onboarding` phụ thuộc
  sự kiện offer chấp nhận (`offer-management`), conversion
  (`employee-profiles`), tài khoản (`account-access`) — đã khai trong
  Dependencies của spec.
