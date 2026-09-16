---
type: urd
feature: external-integrations
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/external-integrations/brainstorms/provider-agnostic-external-integrations.md
  - docs/_shared/project-profile.md
---

# external-integrations — User Requirements Document

## 1. Purpose

Trao đổi lịch, biểu mẫu, webhook, file hoặc task giữa Town Hown và hệ thống
ngoài theo hợp đồng tích hợp (contract) có cấu hình và audit rõ — giúp
HR/admin bỏ thao tác lặp giữa các công cụ mà vẫn kiểm soát duplicate, stale
data và quyền provider quá rộng.

Feature đang `Trì hoãn — chưa chọn provider` (project profile 2026-09-13):
tài liệu này mô tả khung provider-agnostic; provider cụ thể và từng loại
trao đổi chỉ được bật khi roadmap quyết định.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Tạo lịch phỏng vấn trong hệ thống rồi nhập lại vào calendar công ty; copy form ứng viên bằng tay | Mỗi thay đổi phải cập nhật hai nơi; dễ lệch thông tin | Mất thời gian nhập lặp; hai phía lệch nhau mà không ai biết | Confirmed — PRD Mục 7.35/7.27 (JTBD giảm thao tác lặp) |
| Admin | Không có chỗ xem integration nào đang chạy, lỗi gì, ai đổi cấu hình | Lỗi sync phát hiện muộn qua phản ánh người dùng | Dữ liệu stale kéo dài; mất niềm tin vào số liệu | Confirmed — PRD Mục 7.27 (rủi ro duplicate/stale) |
| Technical/Operations owner | Credential integration rải rác trong config tay; không kiểm soát scope quyền provider | Quyền quá rộng, không có audit ai cấp/đổi | Rủi ro bảo mật; khó thu hồi khi lộ | Inferred — PRD Mục 7.27 (rủi ro quyền provider), Mục 9 |
| DPO/legal nominee | Không có danh mục trường dữ liệu rời hệ thống sang bên ngoài | Không chứng minh được minimization khi audit | Vi phạm privacy gate R-04; chặn rollout | Inferred — PRD Mục 9, Mục 10 R-04/R-08, OQ-6 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Admin | Cấu hình và giám sát integration cho tổ chức | Kết nối đúng, sync ổn định, lỗi thấy ngay | Không biết integration nào hỏng; credential nằm rải rác |
| primary | HR | Dùng kết quả sync trong nghiệp vụ hằng ngày | Dữ liệu hai phía khớp nhau, không nhập lặp | Phải đối chiếu tay khi lệch; không rõ bên nào đúng |
| secondary | Technical/Operations owner | Chọn provider, giữ credential, vận hành retry/dead-letter | Scope quyền tối thiểu, rotation có audit | Contract mơ hồ → tích hợp phải làm lại |
| secondary | DPO/legal nominee | Duyệt trường trao đổi và retention | Dữ liệu ra ngoài có danh mục và chủ sở hữu | Không có field-level visibility |

## 3. Scope Boundaries

### In Scope

- Khung integration provider-agnostic: định nghĩa contract (loại trao đổi,
  hướng, trường được phép, source-of-truth per loại dữ liệu).
- Kết nối/authorize: credential write-only trong catalog
  `platform-configuration`, test connection bắt buộc trước khi bật.
- Sync run có trạng thái + retry/dead-letter + idempotency theo khóa
  (integration, bản ghi nguồn, loại trao đổi).
- Webhook inbound qua hàng chờ + allowlist trường, chữ ký bắt buộc.
- Reconcile thủ công: danh sách chênh lệch, quyết định từng dòng có audit.
- Ngắt/tạm dừng integration an toàn; báo lỗi tới người phụ trách.

### Out of Scope

- Connector marketplace không giới hạn (PRD "Chưa làm").
- Chọn provider cụ thể — thuộc quyết định roadmap (project profile).
- Auto-merge reconcile trong v1 (đề xuất — mọi chênh lệch cần quyết định).
- Deploy/deploy-approval qua webhook — OQ-5 PRD, không phải cổng deploy.
- Logic nghiệp vụ của dữ liệu được sync (thuộc module nguồn: lịch phỏng vấn
  ở `candidate-pipeline`, task ở `workforce-monitoring`...).
- Multi-provider routing cùng loại (P2).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Admin | Khi thiết lập integration mới | Tạo integration từ loại contract có sẵn, định trường trao đổi và source-of-truth rõ | Integration có contract kiểm soát được, không nhập freestyle | Must | PRD Mục 7.27 (theo cấu hình và audit rõ) |
| UN-002 | Admin | Khi nhập credential provider | Credential chỉ nhập một chiều, test connection xác nhận trước khi bật | Không lộ credential; chỉ integration đã kiểm chứng được chạy | Must | PRD Mục 9; brainstorm Mục 5.1 |
| UN-003 | HR | Khi dữ liệu nghiệp vụ đổi (vd lịch PV được duyệt) | Hệ thống tự đẩy sang bên ngoài theo contract, không nhập lại | Giảm thao tác lặp; hai phía đồng nhất | Must | PRD Mục 7.27 (giảm thao tác lặp) |
| UN-004 | Admin | Khi sync lỗi hoặc hết retry | Thấy dead-letter kèm lý do, resend được sau khi sửa | Không mục nào mất âm thầm | Must | PRD Mục 7.27 (xử lý lỗi), R-07/R-12 |
| UN-005 | Admin/HR | Khi hai phía lệch dữ liệu | Chạy reconcile, thấy danh sách chênh và quyết định từng dòng có audit | Chênh lệch được đóng có chủ | Must | PRD Mục 7.27 (reconcile trong luồng chính) |
| UN-006 | Admin | Khi webhook inbound tới | Chỉ request hợp lệ qua chữ ký được nhận, vào hàng chờ theo allowlist | Không ghi trái phép; replay không tạo duplicate | Must | Rủi ro PRD + brainstorm D2/D4 |
| UN-007 | Technical/Operations | Khi đổi/rotation credential | Rotation có audit; credential lộ thì thu hồi + disable + rà log | Giảm blast radius khi lộ | Should | PRD Mục 9; brainstorm Mục 9 |
| UN-008 | DPO | Khi audit dữ liệu ra ngoài | Xem được contract nào cho phép trường nào, payload snapshot tối thiểu | Chứng minh minimization được | Should | PRD Mục 9, R-04, OQ-6 |
| UN-009 | Admin | Khi ngắt integration | Hàng chờ dừng có log, webhook bỏ qua, credential giữ để bật lại | Ngắt không mất vết, không gửi tiếp ngầm | Must | brainstorm Mục 6.2/6.4 |
| UN-010 | HR | Khi được báo kết quả sync/dead-letter | Nhận thông báo tổng kết và lỗi cần xử lý | Không phải tự đi kiểm tra | Should | brainstorm P1; dependency `contextual-notifications` |
| UN-011 | Admin | Khi webhook replay hoặc chạy lại run | Hệ thống tự bỏ qua duplicate theo khóa idempotent | 0 duplicate | Must | PRD rủi ro duplicate; R-12 |
| UN-012 | Admin | Khi chưa chọn provider (hiện tại) | Cấu hình giữ trạng thái nháp, giao diện nói rõ đang chờ provider | Không ai bật nhầm integration chưa kiểm chứng | Should | Project profile (Trì hoãn) |

## 5. Prioritized User Journeys

### Journey 1: Thiết lập integration mới (đúng và kiểm chứng)

- **User:** Admin
- **Importance:** must have
- **Trigger:** Tổ chức quyết định nối một công cụ ngoài (vd calendar).
- **Expected outcome:** Integration ACTIVE với contract + credential đã kiểm
  chứng, sẵn sàng sync.
- **Related needs:** UN-001, UN-002, UN-012

1) Admin chọn loại contract (calendar/form/webhook/file/task), đặt tên,
   chọn hướng và khai báo source-of-truth per loại dữ liệu.
2) Nhập credential/endpoint qua field bảo mật; chạy test connection.
3) Đạt → bật integration; lỗi → sửa và test lại (không thể bật khi chưa
   kiểm chứng).

**Independent verification:** Tạo integration ở môi trường test với provider
giả → bật được sau test đạt; cố bật khi test lỗi → bị chặn.

### Journey 2: Sync outbound tự động

- **User:** HR (gián tiếp — hệ thống làm)
- **Importance:** must have
- **Trigger:** Sự kiện nghiệp vụ hợp lệ (vd lịch phỏng vấn được duyệt).
- **Expected outcome:** Bên ngoài nhận đúng một bản ghi theo contract, có
  vết trong sync log.
- **Related needs:** UN-003, UN-011, UN-004

1) Sự kiện tạo mục sync mang khóa idempotent.
2) Worker gọi provider; thành công → SENT; lỗi tạm → retry 5p/30p/2h;
   hết lượt → FAILED + báo người phụ trách.
3) Replay/retry không tạo duplicate nhờ khóa idempotent.

**Independent verification:** Trigger một sự kiện → đối phương nhận 1 bản
ghi; replay webhook/retry → vẫn 1 bản ghi, log ghi duplicate-skipped.

### Journey 3: Reconcile chênh lệch

- **User:** Admin hoặc HR được gán
- **Importance:** must have
- **Trigger:** Nghi ngờ lệch dữ liệu hoặc chạy reconcile định kỳ.
- **Expected outcome:** Mọi chênh lệch có quyết định ghi audit; phía sai
  được sửa qua sync mới.
- **Related needs:** UN-005, UN-004

1) Chọn integration + khoảng thời gian → hệ thống so khớp theo khóa map.
2) Danh sách chênh: chỉ-ở-ta / chỉ-ở-họ / khác giá trị, kèm source-of-truth.
3) Từng dòng: áp dụng (sửa phía không phải truth) / giữ / bỏ qua kèm ghi chú.
4) Quyết định ghi audit; mục "áp dụng" tạo sync run mới.

**Independent verification:** Tạo chênh lệch cố ý ở provider giả → reconcile
liệt kê đúng; quyết định "áp dụng" → bản ghi phía kia được sửa và log đủ vết.

### Journey 4: Xử lý dead-letter

- **User:** Admin
- **Importance:** must have
- **Trigger:** Báo lỗi sync FAILED.
- **Expected outcome:** Nguyên nhân được sửa, mục resend thành công hoặc
  đóng vết có lý do.
- **Related needs:** UN-004, UN-007

1) Mở dead-letter → xem lý do và payload tóm tắt.
2) Sửa nguyên nhân (credential, endpoint, dữ liệu nguồn) → resend mục FAILED.
3) Hoặc đánh dấu "xử lý ngoài" kèm ghi chú → đóng vết.

**Independent verification:** Làm một mục FAILED → resend sau khi sửa →
SENT; kiểm tra không duplicate và audit đủ.

### Journey 5: Rotation credential khi nghi lộ

- **User:** Technical/Operations owner
- **Importance:** should have
- **Trigger:** Nghi credential lộ hoặc theo kỳ rotation.
- **Expected outcome:** Credential cũ thu hồi, integration test lại và chạy
  với credential mới, audit đủ.
- **Related needs:** UN-007, UN-009

1) Disable integration → thu hồi credential phía provider.
2) Nhập credential mới (write-only) → test connection đạt → bật lại.
3) Rà log sync trong cửa sổ nghi lộ; mục FAILED resend lại.

**Independent verification:** Rotation trong môi trường test → sync tiếp tục
bình thường; credential cũ bị provider từ chối.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Test connection lỗi khi cấu hình | Không bật được integration | Lỗi provider nói rõ lý do; hướng sửa cấu hình | Journey 1 / UN-002 |
| Webhook tới khi integration DISABLED | Bên ngoài vẫn gọi | Request bị bỏ qua kèm log; không lỗi 5xx lặp | UN-009 |
| Credential hết hạn giữa chừng | Sync lỗi xác thực liên tục | Báo rõ "xác thực thất bại — kiểm tra credential"; retry không vô hạn | Journey 4 / UN-007 |
| Payload inbound chứa trường ngoài contract | Dữ liệu lạ chèn vào | Trường ngoài contract bị cắt + ghi log field-drop | UN-006/UN-008 |
| Hai bản ghi nguồn map cùng một bản ghi ngoài | Reconcile mơ hồ | Liệt kê nhóm xung đột, bắt buộc chọn một | Journey 3 / UN-005 |
| Replay webhook hàng loạt | Tạo duplicate | Khóa idempotent chặn; log duplicate-skipped | Journey 2 / UN-011 |
| Chưa chọn provider nhưng admin cố bật | Bật nhầm integration rỗng | Chặn bật khi contract/credential chưa đủ; giao diện báo "đang chờ provider" | UN-012 |
| Reconcile quyết định nhầm hướng sửa | Ghi đè dữ liệu đúng | Preview trước khi áp dụng; source-of-truth hiển thị rõ; audit cho phép truy ngược | Journey 3 / UN-005 |

## 7. User-side Constraints

- Admin cấu hình integration phải có quyền riêng (tách khỏi quyền xem) —
  deny-by-default qua `org-governance`.
- Mọi credential nhập qua field bảo mật; không ai đọc lại plaintext kể cả
  người nhập.
- Endpoint outbound bắt buộc https; chặn host nội bộ (SSRF guard — đề xuất).
- Reconcile chỉ người được gán quyền mới quyết định; quyết định không sửa
  được sau khi ghi (append-only).
- Dữ liệu nhạy cảm trong contract cần DPO duyệt trước khi trường đó được
  phép trao đổi (OQ-6).
- Người dùng cuối không thấy credential, chỉ thấy trạng thái kết nối.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Provider chưa chọn — khung phải provider-agnostic | Nếu đã chọn ngầm, contract sẽ phải gắn cứng provider | Đã xác nhận — project profile 2026-09-13 | Khi roadmap chọn provider → bổ sung adapter + field mapping |
| Calendar là loại đầu tiên trong contract v1 | Nếu loại khác trước, thứ tự bật đổi | Đề xuất — PRD nói "calendar và integration contract" | Product owner chốt loại ưu tiên khi mở |
| Credential integration nằm trong catalog `platform-configuration` | Nếu không, hai nơi lưu secret | Đề xuất — cùng hợp đồng write-only/masked | Operations owner xác nhận |
| Reconcile v1 thủ công, không auto-merge | Nếu cần auto-merge, phải thiết kế conflict policy | Đề xuất — an toàn cho v1 | Product owner xác nhận |
| Webhook inbound không ghi thẳng nghiệp vụ | Nếu được phép, rủi ro ghi trái phép tăng | Đề xuất — bám OQ-5 PRD | Technical owner xác nhận |
| Retry 5p/30p/2h thống nhất với các feature gửi khác | Nếu khác, lịch retry từng integration đổi | Đề xuất — chờ OQ-10 | Technical/Operations xác nhận |
| Nguồn dữ liệu sync do module nghiệp vụ sở hữu | Nếu không, feature này phải sở hữu thêm mapping nghiệp vụ | Đã xác nhận — theo feature map PRD | Cross-ref từng module khi implement |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Sync chạy không cần sửa tay | Chưa có tích hợp | ≥95% mục SENT không cần can thiệp (đề xuất — chờ OQ-10/provider) | Tỷ lệ SENT/tổng mục trong sync log | Sau 1 tháng bật integration đầu tiên |
| USC-002 | Không duplicate từ replay/retry | — | 0 bản ghi trùng theo khóa idempotent | Đếm duplicate-skipped vs bản ghi tạo | Liên tục |
| USC-003 | Chênh lệch reconcile có chủ | — | 100% dòng chênh có quyết định trong ≤5 ngày làm việc (đề xuất) | Audit reconcile report | Mỗi kỳ reconcile |
| USC-004 | Credential an toàn | — | 0 lần credential đọc ra plaintext; 100% rotation có audit | Kiểm tra API surface + audit log | Trước khi bật provider đầu tiên |
| USC-005 | Integration chỉ chạy khi kiểm chứng | — | 0 integration ACTIVE chưa qua test connection | Query trạng thái vs test log | Trước rollout |

## 10. Open Questions

- [x] OQ-1: Provider nào được chọn? — Out of scope v1: project profile ghi
  "Trì hoãn — chưa chọn provider" (2026-09-13); quyết định thuộc roadmap.
- [x] OQ-2: Loại trao đổi nào bật đầu tiên? — Resolved (đề xuất): calendar
  theo PRD, các loại khác bật theo quyết định owner — chờ Product owner.
- [x] OQ-3: Webhook inbound ghi thẳng nghiệp vụ? — Resolved (đề xuất):
  không — qua hàng chờ + allowlist, module nghiệp vụ quyết định áp dụng —
  chờ Technical owner (bám OQ-5 PRD).
- [x] OQ-4: Retention/consent cho dữ liệu sync (OQ-6 PRD)? — Resolved (đề
  xuất): sync log theo audit policy; payload snapshot tối thiểu; trường
  nhạy cảm qua allowlist DPO — chờ DPO/legal.
- [x] OQ-5: Source-of-truth per loại dữ liệu? — Resolved (đề xuất): khai
  báo trong contract; module nghiệp vụ là truth cho dữ liệu nó sở hữu —
  chờ owner từng module xác nhận khi chọn provider.
- [x] OQ-6: Auto-merge reconcile? — Resolved (đề xuất): không trong v1 —
  chờ Product owner.
- [x] OQ-7: Retry/dead-letter chuẩn? — Resolved (đề xuất): 5p/30p/2h →
  FAILED, thống nhất các feature gửi — chờ Technical/Operations (OQ-10).
- [x] OQ-8: Secret của integration để ở đâu? — Resolved (đề xuất): catalog
  `platform-configuration`, write-only + masked + versioned — chờ
  Operations owner.
- [x] OQ-9: Ai quyết định reconcile? — Resolved (đề xuất): admin/HR được
  gán quyền "đối soát" per integration — chờ Product owner.
- [x] OQ-10: Webhook endpoint ai cấp và quản? — Resolved (đề xuất): hệ
  thống tự sinh endpoint + secret khi tạo integration inbound; hiển thị
  secret một lần — chờ Technical owner.
