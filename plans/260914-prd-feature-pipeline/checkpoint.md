# Checkpoint — Pipeline /brainstorm → /urd → /srs → /erd cho Feature Map PRD

> **HOÀN TẤT + ĐÃ COMMIT 2026-09-14** — 39/39 feature đủ 4 artifact, check-erd
> 0 lỗi, changelog đã ghi. Đã commit: `b945cdb` (docs/features), `d358a0f`
> (plans/reports/audit); merge `12e54b5` origin/develop. Final review đã đóng —
> verify sau commit: `final-review-check` PASS 0 P0, `check-erd` 39/39.
> Quality follow-up hiện hành nằm tại [`quality-audit.md`](quality-audit.md)
> (185 open OQ chờ triage + vision-ocr contract chờ Product/BA); phần còn lại
> của file này là snapshot lịch sử lúc pipeline tạm dừng.
> Snapshot lúc tạm dừng: **2026-09-14**. Đọc file này để resume.
> Hợp đồng chung cho mọi worker: `plans/260914-prd-feature-pipeline/agent-brief.md`.

## 1. Mục tiêu

Sinh đủ 4 artifact cho tất cả 39 feature trong Feature Map của `docs/downtown/prd.md`:

1. `docs/features/{feature}/brainstorms/{idea-slug}.md`
2. `docs/features/{feature}/{feature}-urd.md`
3. `docs/features/{feature}/srs/{feature}-spec.md`
4. `docs/features/{feature}/srs/{feature}-erd.md`

Autonomous mode: mọi OQ phải đóng — `[x] Resolved` hoặc `Resolved (đề xuất) — chờ {owner} xác nhận`, hoặc `[~] Out of scope v1`. Không để `[ ]` trần.

## 2. Đội hình worker (13 agent, ownership tuyệt đối theo feature)

| Agent | Features | Trạng thái |
|---|---|---|
| id-core | account-access, org-governance, platform-configuration | files xong (chưa confirm report) |
| gov-ops | release-announcements, ai-usage-monitoring | ✅ DONE — report `reports/gov-ops.md` |
| rec-intake | recruitment-planning, cv-intake, candidate-matching | đang chạy khi pause |
| rec-pipeline | candidate-pipeline, interview-management, interview-evaluation | đang chạy khi pause |
| rec-hire | offer-management, employee-onboarding | đang chạy khi pause |
| core-hr | employee-profiles, employment-lifecycle | đang chạy khi pause |
| meetings | ai-meeting-minutes, meeting-to-tasks, kanban-workspaces | đang chạy khi pause |
| doc-ai | document-review, document-library, vision-ocr | ✅ DONE — report `reports/doc-ai.md` |
| assess-author | ai-question-generation, assessment-templates, assessment-authoring | files xong (chưa confirm report) |
| assess-run | candidate-assessment, assessment-grading, interview-recording | ✅ DONE — report `reports/assess-run.md` |
| talent | talent-framework, employee-evaluation, skill-gap-analysis | đang chạy khi pause |
| insights | contextual-notifications, operational-email, external-integrations | đang chạy khi pause |
| monitor | workforce-monitoring, cv-event-monitoring | files xong; agent bị kill trước khi ghi report |

## 3. Trạng thái trên disk (nguồn sự thật lúc pause)

Format `b u s e` = số file brainstorm/urd/spec/erd. `1111` = đủ.

### Đủ 4 artifact (29/39)

account-access, ai-meeting-minutes, ai-question-generation, ai-usage-monitoring,
assessment-authoring, assessment-grading, assessment-templates, candidate-assessment,
candidate-pipeline, contextual-notifications, cv-event-monitoring, cv-intake,
document-intake*, document-library, document-review, employee-profiles,
interview-management, interview-recording, management-reporting*, meeting-records*,
meeting-to-tasks, offer-management, org-governance, question-bank* (gold standard),
recruitment-planning, release-announcements, talent-framework, vision-ocr,
workforce-monitoring

(* = đã hoàn tất từ trước đợt này)

### Còn thiếu khi pause (10 feature, ~28 file)

| Feature | Có sẵn | Còn cần | Owner cũ |
|---|---|---|---|
| candidate-matching | brainstorm+urd | spec, erd | rec-intake |
| platform-configuration | brainstorm+urd | spec, erd | id-core |
| employee-evaluation | brainstorm | urd, spec, erd | talent |
| employee-onboarding | brainstorm | urd, spec, erd | rec-hire |
| employment-lifecycle | brainstorm | urd, spec, erd | core-hr |
| interview-evaluation | brainstorm | urd, spec, erd | rec-pipeline |
| operational-email | brainstorm | urd, spec, erd | insights |
| external-integrations | — | đủ 4 | insights |
| kanban-workspaces | — | đủ 4 | meetings |
| skill-gap-analysis | — (dir chưa tồn tại) | đủ 4 | talent |

## 4. Việc còn lại khi resume

1. **Spawn lại worker cho 10 feature trên** — dùng cùng prompt pattern: bắt đọc
   `agent-brief.md` trước, giao ownership rõ ràng, report về `reports/{name}.md`.
   Gợi ý gom: (a) `external-integrations` + `operational-email`; (b) `kanban-workspaces`;
   (c) `skill-gap-analysis` + `employee-evaluation`; (d) `employment-lifecycle`;
   (e) `employee-onboarding`; (f) `interview-evaluation` + `candidate-matching` +
   `platform-configuration`. Hoặc 3 agent: rec-leftover / hr-leftover / misc.
2. **Fix `document-intake-erd.md`** — check-erd FAIL 5 lỗi: label quan hệ thiếu
   quote (file có sẵn từ trước, không worker nào sở hữu → Max sửa khi verify).
3. **Normalize CRLF → LF** cho toàn bộ `docs/features/**/*-erd.md`: tool write xuất
   CRLF khiến `check-erd.mjs` false-pass ("0 mermaid blocks"). 8 file đã bị phát hiện:
   account-access, ai-meeting-minutes, assessment-authoring, employee-profiles,
   offer-management, recruitment-planning, talent-framework, workforce-monitoring —
   nhưng nên normalize tất cả rồi mới chạy verify.
4. **Chạy verify**: `node plans/260914-prd-feature-pipeline/check-erd.mjs docs/features`
   — phải 0 errors. `mermaid-verify.mjs` không dùng được (thiếu mmdc/Chrome — đã xác
   nhận); check-erd.mjs là checker thay thế, ngoài ra soi tay 2-token attribute.
5. **Đếm lại artifacts**: mọi feature phải đủ 4 file; so với Feature Map PRD (39).
6. **Spot-check chất lượng**: OQ không còn `[ ]` trần; frontmatter đúng; MoSCoW
   Should/Could ghi "không thuộc cam kết v1"; human-in-the-loop invariant.
7. **Changelog**: append dòng vào `docs/_shared/changelog.md` (Max giữ quyền ghi —
   brief cấm worker đụng file này).
8. **Báo cáo cuối** cho user.

## 5. Ràng buộc đã thiết lập (nhắc lại)

- KHÔNG sửa `docs/downtown/prd.md`, `docs/_shared/*`, `docs/_product/*`, code
  `Frontend/`/`Backend/`/`modules/` (vision-ocr chỉ được đọc để lấy fact).
- KHÔNG git mutation, không commit/push.
- Doc tiếng Việt, văn phong BA; không `§`/`¶`; ID prefix `FR-{feature}-NNN` v.v.
- Templates: `_templates/{brainstorm,urd,srs-spec,diagram-erd}.md` ở root repo.
- Gold standard: `docs/features/question-bank/` (đủ 4 file).
- Provenance: `docs/_reverse/` — chỉ cite `Observed: reverse spec {cluster}`.

## 6. Quyết định đáng chú ý đã ghi nhận từ report

- candidate-assessment: server-time authoritative, autosave chỉ tính sau ACK,
  submit idempotent + receipt, expiry/reopen/regrade/override cần actor + lý do + audit.
- assessment-grading: không auto pass/fail; `GRADE_ITEM.version_no + is_current`
  hiện thực regrade không ghi đè.
- interview-recording: `RECORDING.consent_id` bắt buộc (không consent không ghi);
  retention đề xuất 90 ngày chờ OQ-6.
- document-review: mọi output OCR phải qua người xác nhận, không ngưỡng tự duyệt.
- vision-ocr: ERD 2 entity transient (session-only); PII chỉ qua fallback nội bộ
  tới khi OQ-13 được DPO/legal duyệt.
- release-announcements: chặn tự duyệt khi ≥2 người giữ quyền; nhãn phiên bản không
  ràng buộc Git tag.
- ai-usage-monitoring: hệ thống chỉ flag, không khóa/chặn; breakdown theo người chỉ
  cho admin kèm nhãn vận hành.
- OQ tổng (3 report đầu): ~50 resolved; đa số là "đề xuất chờ owner" (DPO/legal,
  Product owner, Head of HR, Technical/Operations, Admin lead, Security owner).
