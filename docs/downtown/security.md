---
type: security-policy
status: active
updated: 2026-08-27
links:
  - README.md
  - prd.md
  - architecture.md
  - operations.md
---

# Bảo mật và quyền riêng tư Town Hown

## Mục tiêu bảo vệ

Town Hown xử lý hồ sơ nhân viên/ứng viên, CV, assessment, transcript, recording,
email, tài liệu tổ chức và quyết định có tác động đến con người. Security model
ưu tiên confidentiality, authorization theo phạm vi, provenance, auditability và
khả năng human review.

## Báo cáo lỗ hổng

- Không mở public issue cho lỗ hổng chưa vá.
- Dùng private vulnerability reporting của repository hosting nếu được bật;
  nếu chưa có, liên hệ maintainer qua kênh nội bộ đã phê duyệt.
- Cung cấp impact, phạm vi, bước tái hiện tối thiểu và fix đề xuất nếu có.
- Không gửi production secret hoặc dữ liệu cá nhân thật trong báo cáo.

Version được hỗ trợ phải dựa trên release thực tế đang vận hành; không dùng bảng
version mẫu hoặc nhãn phase làm support policy.

## Trust model

Các input sau luôn là untrusted:

- request body, params, query và public token;
- browser/local storage/client state;
- uploaded document, CV, audio/video và transcript;
- AI/provider response;
- email template variable và webhook payload;
- database row/provider event chưa qua parser boundary.

Luồng mục tiêu:

```text
unknown input -> parse/validate -> authorize -> domain action
              -> persist/audit -> minimal response
```

## Identity và authorization

1. Middleware hỗ trợ session/route protection, không thay authorization.
2. API/server action kiểm tra identity, role, ownership và organization/data
   scope cho từng action.
3. RLS là lớp bảo vệ dữ liệu cuối cho access qua Supabase user client.
4. Service role chỉ server-side cho action cần bypass RLS đã authorize cụ thể.
5. Public assessment token chỉ cấp quyền tối thiểu cho resource được chia sẻ.
6. Export/report/notification phải áp cùng phạm vi quyền với màn hình/API nguồn.

Không dựa vào việc UI ẩn button, route khó đoán hoặc UUID để bảo vệ dữ liệu.

## Secret policy

- Không commit `.env*`, API key, service-role key, SMTP password, SSH private key
  hoặc database credential.
- Không đặt secret trong `NEXT_PUBLIC_*`; các biến đó có thể vào client bundle.
- Không log, chụp màn hình hoặc đưa secret vào docs/test fixture.
- CI variable phải protected/masked và giới hạn theo environment.
- Khi nghi ngờ lộ secret: revoke/rotate trước, điều tra sau; cleanup Git history
  theo quy trình được phê duyệt.

Secret server-side chính hiện được source tham chiếu gồm Supabase service role,
AI provider key và SMTP credential. Tên/value thực tế thuộc secret manager và
runtime configuration, không thuộc tài liệu.

## Dữ liệu nhạy cảm

| Nhóm | Rủi ro | Guardrail |
| --- | --- | --- |
| Hồ sơ nhân viên/ứng viên | Lộ PII, dùng sai mục đích | Least privilege, purpose limitation, audit |
| CV/tài liệu | Malware, OCR sai, retention quá lâu | Validate file, review output, retention policy |
| Assessment/score | Phân biệt đối xử, lộ đáp án | Evidence, reviewer override, restricted export |
| Recording/transcript | Thu thập không consent, lộ nội dung | Explicit consent, access và deletion controls |
| Email/notification | Gửi sai người hoặc lộ context | Recipient validation, minimal content, logs |
| Work monitoring | Giám sát xâm phạm quyền riêng tư | Published policy, employee visibility, non-goals |

Production rollout cần policy về lawful purpose, consent, retention, deletion,
access request và incident notification theo thị trường áp dụng. PRD chưa xác
nhận compliance jurisdiction; xem OQ-3 và OQ-6.

## AI safety

- AI chỉ hỗ trợ trích xuất, đề xuất, scoring, tóm tắt và soạn nội dung.
- AI không tự động tuyển, loại, kỷ luật hoặc kết luận phẩm chất con người.
- Structured output phải parse/validate; malformed/partial output có error path.
- Insight quan trọng phải chỉ tới evidence/source khi có thể.
- Người có thẩm quyền review/override; override cần reason/audit khi contract yêu
  cầu.
- Chỉ gửi dữ liệu tối thiểu cần thiết tới provider.
- Không dùng model output như fact chỉ vì JSON hợp lệ.

## File và Document AI

- Kiểm tra loại, size, access và storage boundary trước xử lý.
- Raw file, extracted text, topic/field và published business data là stage riêng.
- HTML/text từ file/AI phải sanitize theo output context.
- Signed/public URL phù hợp độ nhạy và thời gian truy cập.
- Retry/idempotency tránh duplicate artifact.
- Confidence thấp hoặc conflict phải đưa vào human review.

## Email và integrations

- SMTP credential chỉ resolve ở server.
- Validate recipient, template và variable trước send.
- Webhook/calendar/provider connection dùng scope tối thiểu.
- Verify authenticity của incoming event theo provider contract.
- Có idempotency/reconciliation cho retry và out-of-order event.
- Delivery log không chứa credential và không tự chứng minh business action hoàn
  tất.

## Logging và audit

Operational log phục vụ chẩn đoán; audit record phục vụ truy nguyên nghiệp vụ.

- Operational log: request/action/outcome/duration/status, redact secret/PII.
- Audit: actor, target, before/after, reason, timestamp cho action quan trọng.
- AI usage: model/feature/usage metadata, không raw confidential prompt mặc định.
- Email log: recipient/status/template reference, giới hạn nội dung nhạy cảm.

Không thay audit bằng application log dễ mất/rotate.

## Rủi ro hiện hành cần ưu tiên

Reverse audit 2026-08-27 ghi nhận các vấn đề cần task bảo mật riêng:

- Public assessment loader/policy có thể đưa `correct_answer` vào browser trước
  submission; xem [assessment gaps](../_reverse/assessment-and-grading/gaps.md).
- Result submission chưa chứng minh server enforce schedule, capacity và unique
  attempt trước insert; client-side guard không đủ làm security boundary.
- Một số recruitment route dùng admin/service access sau broad role gate; cần
  đối chiếu ownership/tenant scope với RLS và role matrix chính thức; xem
  [recruitment gaps](../_reverse/recruitment-and-interviews/gaps.md).
- Hai DB utilities từng chứa connection string literal đã được đổi sang
  `DATABASE_URL`. Credential liên quan vẫn phải revoke/rotate ngoài source; việc
  xoá literal không làm credential cũ mất hiệu lực.

Không tự động sửa các business/security contract này trong task tái cấu trúc;
cần threat model, tests và owner approval tương ứng.

## Deployment security debt

Pipeline GitLab legacy chưa được phép coi là production automation vì:

- không được root single-repo discovery đúng working directory;
- branch filter không khớp GitFlow;
- dynamic host-key collection/tắt strict verification làm yếu SSH trust;
- privileged `.env` được tạo/copy mà chưa có permission/cleanup được chứng minh;
- registry authentication có nguy cơ lộ credential trong process/log.

Yêu cầu hardening nằm trong [Operations](operations.md).

## Security review gate

Thay đổi cần security review khi chạm:

- role, scope, auth/session, public token hoặc service role;
- RLS/schema migration/data export;
- CV, recording, document, email hoặc sensitive analytics;
- AI provider/prompt/data sharing;
- webhook, calendar, SMTP hoặc external integration;
- CI, secret, container, reverse proxy hoặc production environment.

Checklist:

- Threat/asset/actor đã xác định?
- Server/data authorization nhất quán?
- Dữ liệu tối thiểu và retention rõ?
- Log/export không lộ secret/PII?
- Failure/rollback/revoke path tồn tại?
- Human review có thực chất?
- Validation gồm unauthorized/forbidden/malformed/provider failure?

## Incident response tối thiểu

1. Cô lập incident và bảo toàn evidence đã redact.
2. Revoke/rotate credential nếu có khả năng lộ.
3. Xác định actor/data/environment/time window.
4. Chặn tiếp tục truy cập hoặc rollback an toàn.
5. Xác minh recovery và audit gap.
6. Thông báo theo policy/pháp lý đã được phê duyệt.
7. Ghi post-incident decision và cập nhật invariant/runbook owner.
