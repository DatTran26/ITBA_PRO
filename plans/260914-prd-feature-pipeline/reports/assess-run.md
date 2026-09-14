# Report: assess-run

## Features

| Feature | MoSCoW | Artifacts delivered |
|---------|--------|---------------------|
| candidate-assessment | Must | spec + ERD (brainstorm + URD đã có sẵn) |
| assessment-grading | Must | brainstorm + URD + spec + ERD (đủ 4) |
| interview-recording | Should | spec + ERD (brainstorm + URD đã có sẵn); ghi rõ slice mở rộng, không nằm trong cam kết v1 |

## Files written/updated

- `docs/features/candidate-assessment/srs/candidate-assessment-spec.md` (mới)
- `docs/features/candidate-assessment/srs/candidate-assessment-erd.md` (mới; đã chuẩn hóa LF)
- `docs/features/assessment-grading/brainstorms/human-reviewed-grading-and-skill-insight.md` (mới)
- `docs/features/assessment-grading/assessment-grading-urd.md` (mới)
- `docs/features/assessment-grading/srs/assessment-grading-spec.md` (mới)
- `docs/features/assessment-grading/srs/assessment-grading-erd.md` (mới)
- `docs/features/interview-recording/srs/interview-recording-spec.md` (mới)
- `docs/features/interview-recording/srs/interview-recording-erd.md` (mới)
- `plans/260914-prd-feature-pipeline/reports/assess-run.md` (file này)

Không sửa file ngoài phạm vi sở hữu; không git mutation.

## OQ resolved count / proposed-owner count

- candidate-assessment spec: 8 OQ — tất cả Resolved, trong đó 6 "đề xuất" chờ owner (token lifecycle, giới hạn attempt, concurrent-device, result visibility, SLA recovery, retention).
- assessment-grading: 8 OQ — tất cả Resolved: 7 "đề xuất" chờ owner (rubric, threshold/override, regrade-sau-phát-hành, chuẩn lý do + SLA, hiệu năng, export, retention), 1 Out of scope v1 (độ khó thực nghiệm về question-bank).
- interview-recording: 7 OQ — tất cả Resolved "đề xuất" chờ owner (kênh consent, nền ghi trong phiên, SLA xử lý, giới hạn file, panel consent, retention OQ-6 PRD, quyền xuất file gốc).

Tổng: 23 OQ resolved, 20 proposed-owner, 1 out-of-scope v1. Không còn `[ ]` trống.

## OQ hold / out-of-scope list

- OQ-8 assessment-grading: độ khó thực nghiệm của câu trả về `question-bank` — Out of scope v1 (P2).
- Retention/consent chính thức (cả 3 feature) phụ thuộc OQ-6 PRD — chỉ dữ liệu synthetic trước khi privacy gate đạt.
- interview-recording: video + live transcript — Out of scope v1 (P2/roadmap).

## Mermaid verification result

- `check-erd.mjs docs/features`: owned files PASS — candidate-assessment (11 entities/15 rels), assessment-grading (13/19), interview-recording (10/14). Lỗi duy nhất thuộc `document-intake` (feature khác sở hữu, không nằm trong scope).
- `mermaid-verify.mjs`: compile = FAIL do toolchain — `mmdc` và Chrome for Testing không có trong môi trường; nhãn renderer = PASS, ngữ nghĩa (FK/cardinality) = PASS cả 3 file. Đã soi tay cú pháp mermaid theo hướng dẫn của brief.

## Notable decisions made on behalf of the user (tất cả đánh dấu "đề xuất")

- candidate-assessment: token/link có expiry + thu hồi, attempt limit và concurrent-device do author công bố; autosave chỉ tính sau ACK; receipt gồm submission id + server timestamp; expiry/reopen/regrade/override cần actor được công bố + lý do + audit.
- assessment-grading: rubric v1 = "hướng dẫn chấm" của câu trong snapshot (không rubric bank riêng); không auto pass/fail — ngưỡng chỉ tham chiếu; regrade sau phát hành được phép kèm cờ "đã phát hành đã thay đổi"; lý do 10–500 ký tự; SLA hàng chờ 3 ngày làm việc; CSV ≤50.000 dòng; auto-grade ≤5 phút; insight retry 3 lần.
- interview-recording: consent theo session qua 2 kênh (thư mời + trong phiên), append-only kèm content_version; định dạng mp3/m4a/wav/webm/ogg, 500 MB, 4 giờ, 5 recording/session; SLA xử lý 30 phút; retention mặc định 90 ngày (chờ OQ-6); file gốc chỉ xuất khi policy cho phép; đoạn trích giữ nguyên trong evaluation kèm cờ "nguồn đã rút/xóa".

## Blockers

- Renderer Mermaid (mmdc/Chrome) thiếu — chỉ kiểm được cú pháp + ngữ nghĩa, chưa render được SVG.
- Pilot dữ liệu thật (recording, kết quả chấm, submission) bị chặn bởi OQ-6 PRD + privacy gate.
- Contract phụ thuộc: snapshot có đáp án/hướng dẫn chấm từ `candidate-assessment`/`question-bank`; session/participant từ `interview-management`; vai trò grader/data-scope từ `org-governance`.
