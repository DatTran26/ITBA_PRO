---
type: report
worker: hr-work-left
updated: 2026-09-14
---

# Báo cáo worker hr-work-left

## Owned features

- `employment-lifecycle` (PRD Mục 7.4 — `Could`, không thuộc v1)
- `kanban-workspaces` (PRD Mục 7.16 — `Should`, không thuộc v1)

## Files đã viết/cập nhật

### employment-lifecycle

- `docs/features/employment-lifecycle/employment-lifecycle-urd.md` (mới)
- `docs/features/employment-lifecycle/srs/employment-lifecycle-spec.md` (mới)
- `docs/features/employment-lifecycle/srs/employment-lifecycle-erd.md` (mới)
- `docs/features/employment-lifecycle/brainstorms/contract-and-status-transitions.md`
  — đã đọc và bảo toàn nguyên trạng, KHÔNG chỉnh sửa.

### kanban-workspaces (tất cả mới)

- `docs/features/kanban-workspaces/brainstorms/kanban-board-and-handover-approval.md`
- `docs/features/kanban-workspaces/kanban-workspaces-urd.md`
- `docs/features/kanban-workspaces/srs/kanban-workspaces-spec.md`
- `docs/features/kanban-workspaces/srs/kanban-workspaces-erd.md`

### Report

- `plans/260914-prd-feature-pipeline/reports/hr-work-left.md` (file này)

Không chỉnh sửa PRD, `docs/_shared`, `docs/_product`, feature khác, mã
nguồn hay Git history.

## Open Questions

- Số OQ đã resolve: 21 (11 employment-lifecycle + 10 kanban-workspaces).
- Số OQ "Resolved (đề xuất)" chờ owner xác nhận: 15
  - employment-lifecycle: 8 (catalog loại thay đổi + tài liệu/checklist
    mặc định, SLA duyệt 2 ngày, nhắc 7/30 ngày, tối đa 1 thay đổi treo,
    backdate ≤90 ngày, checklist ≤20 đầu việc, attachment ≤10 MB,
    retention — chờ Head of HR / DPO/legal / Product owner theo OQ).
  - kanban-workspaces: 7 (reviewer mặc định, evidence không bắt buộc, 4
    nhóm trạng thái cố định, ai tạo workspace/board, bộ giới hạn số,
    retention — chờ Product owner / DPO/legal).
- Hold / out-of-scope:
  - `[~]` employment-lifecycle OQ-10: tự sinh thay đổi từ sự kiện khác
    (đánh giá, hết hạn hợp đồng tự động) — Out of scope v1.
  - `[~]` employment-lifecycle OQ-11: đồng bộ payroll/bên ngoài — Out of
    scope v1 (thuộc `external-integrations`/`payroll-export`).
  - `[~]` kanban-workspaces OQ-8: watchers/subtask/giao cho nhóm — P1/P2.
  - `[~]` kanban-workspaces OQ-9: đồng bộ công cụ ngoài — Out of scope v1
    (`external-integrations`).
  - `[~]` kanban-workspaces OQ-10: timeline/Gantt/portfolio đa board —
    Out of scope v1 (PRD "Chưa làm").
- Không còn OQ `[ ]` trần nào trong các file của worker.

## Validation

- `node plans/260914-prd-feature-pipeline/check-erd.mjs docs/features`:
  **PASS toàn repo — 39 files, 39 mermaid blocks, 0 errors.**
  - employment-lifecycle: 11 entities, 19 rels — PASS.
  - kanban-workspaces: 14 entities, 25 rels — PASS.
- `mermaid-verify` (`.claude/scripts/mermaid-verify.mjs`): **toolchain
  thiếu — tự soi thủ công.** `mmdc` không có trong môi trường (compile
  check không chạy được; Chrome for Testing có nhưng mmdc chưa cài). Lint
  nhãn renderer: PASS cả hai file. Ngữ nghĩa: PASS kèm cảnh báo không chặn
  (7 + 10) trên các FK đặt theo vai trò (`created_by`, `assignee_id`,
  `reviewer_id`, ...) — cùng pattern false-positive mà ERD upstream
  `meeting-to-tasks` cũng gặp (3 cảnh báo); mọi quan hệ đều có cột FK
  chống lưng, đã soi thủ công đối chiếu spec.
- Line endings: cả 7 file .md mới đã chuẩn hoá CRLF → LF.

## Quyết định thay user

- employment-lifecycle: `LIFECYCLE_CHANGE.new_manager_id` trỏ
  `EMPLOYEE_PROFILE` (không phải `USER`) — bám convention tự tham chiếu
  `EMPLOYEE_PROFILE.manager_id` của `employee-profiles`; tách rõ
  `EMPLOYMENT.status` (vòng đời) khỏi `EMPLOYEE_PROFILE.status` (bản ghi);
  `document-intake` là cổng file duy nhất; một thay đổi treo/việc làm;
  trạng thái chỉ đổi qua thay đổi có hiệu lực được duyệt.
- kanban-workspaces: giữ nguyên contract `WORKSPACE`/`BOARD`/`TASK` mà
  `meeting-to-tasks` đã tham chiếu; cột = cách nhìn, trạng thái = sự thật
  (4 nhóm cố định; vào CHO_DUYET/HOAN_TAT chỉ qua bàn giao + duyệt);
  HANDOVER là entity riêng (ghi chú kết quả bắt buộc, evidence tùy chọn,
  bàn giao lại sau từ chối); cờ `source_stale` do upstream sở hữu, feature
  này chỉ đọc; reviewer mặc định = người tạo task (đề xuất, chờ Product
  owner).

## Blockers

- Không có blocker chặn tiến độ.
- Lưu ý môi trường: `mmdc` chưa cài — nếu pipeline yêu cầu compile-check
  mermaid thật, cần `npm i -g @mermaid-js/mermaid-cli` (hoặc tương đương)
  trước khi chạy lại `mermaid-verify`.
- Các OQ "đề xuất" cần Head of HR / Product owner / DPO xác nhận trước
  khi chốt dùng dữ liệu thật.
