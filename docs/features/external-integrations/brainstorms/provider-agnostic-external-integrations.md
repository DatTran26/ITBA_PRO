---
type: brainstorm
feature: external-integrations
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/_shared/project-profile.md
  - docs/features/platform-configuration/srs/platform-configuration-spec.md
---

# external-integrations — Brainstorm (provider-agnostic)

## 1. Idea Seed

Cho phép trao đổi lịch, biểu mẫu, webhook, file hoặc task với hệ thống ngoài
theo cấu hình và audit rõ — giúp HR/admin giảm thao tác lặp giữa các công cụ,
trong khi kiểm soát được duplicate, stale data và quyền provider quá rộng.

## 2. Context

- PRD Mục 7.27 (priority Should): phạm vi v1 là "calendar và integration
  contract được owner chọn trước" — tức cần một lớp hợp đồng tích hợp do
  owner xác định, KHÔNG phải connector marketplace không giới hạn.
- Project profile ghi rõ: `external-integrations | Trì hoãn — chưa chọn
  provider | 2026-09-13 | /roadmap`. Vì vậy bộ tài liệu này được viết
  provider-agnostic: định nghĩa khung contract, quy tắc source-of-truth,
  idempotency và reconcile — provider cụ thể chỉ được chọn khi roadmap mở.
- Feature này là `Should`, không nằm trong lát cắt pilot v1.
- Liên quan chặt: `platform-configuration` giữ credential/endpoint của từng
  integration trong catalog (secret write-only, masked); `org-governance`
  cung cấp quyền cấu hình + audit; `contextual-notifications` báo lỗi sync;
  các module nghiệp vụ (lịch phỏng vấn trong `candidate-pipeline`, task trong
  `workforce-monitoring`...) là nguồn/đích của dữ liệu sync.
- Rủi ro PRD chỉ ra: duplicate, stale data, quyền provider quá rộng — suy ra
  ba trụ cột thiết kế: idempotency, source-of-truth per loại dữ liệu, và
  scope tối thiểu cho credential.
- PRD OQ-5 (deployment authority) và OQ-6 (retention/consent dữ liệu nhạy
  cảm) đang mở — feature này đóng vai trò bám theo: webhook endpoint không
  phải cổng deploy; dữ liệu từ bên ngoài chỉ giữ tối thiểu cho reconcile.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Nhập lại lịch phỏng vấn vào calendar công ty; copy form ứng viên tay | Lịch/dữ liệu tự chảy sang công cụ đang dùng, không nhập lặp |
| Admin | Không biết integration nào đang chạy, lỗi ở đâu, ai đã đổi cấu hình | Một chỗ xem trạng thái sync, lỗi, và vết thay đổi |
| Technical/Operations owner | Credential integration rải rác, quyền provider quá rộng không ai kiểm soát | Credential tập trung, scope tối thiểu, test được trước khi bật |
| DPO/legal nominee | Không biết dữ liệu nào rời hệ thống sang bên ngoài, giữ bao lâu | Field-level visibility + retention/consent rõ ràng |

## 4. Capabilities Breakdown

### P0 — must have
- Định nghĩa integration theo hợp đồng (contract): loại trao đổi (calendar/
  form/webhook/file/task), hướng (outbound/inbound), scope dữ liệu,
  source-of-truth per loại dữ liệu — provider cụ thể điền vào khi được chọn.
- Kết nối + authorize: nhập credential qua field bảo mật (giá trị nằm trong
  `platform-configuration` catalog), test connection bắt buộc trước khi bật.
- Sync run có trạng thái: tạo run → validate → gửi/nhận → ghi kết quả từng
  bản ghi; retry theo lịch, hết lượt vào dead-letter.
- Idempotency: khóa duy nhất theo (integration, bản ghi nguồn, loại trao
  đổi) — replay webhook hay chạy lại run không tạo duplicate.
- Reconcile thủ công: bảng chênh lệch hai phía, HR/admin xác nhận từng dòng
  (áp dụng/giữ/bỏ qua) — KHÔNG auto-merge.
- Audit đầy đủ: cấu hình, authorize, mỗi sync run, quyết định reconcile.
- Ngắt integration an toàn: tắt → hàng chờ dừng, webhook bỏ qua có log,
  credential có thể thu hồi.

### P1 — should have
- Báo lỗi sync/dead-letter tới người phụ trách qua `contextual-notifications`.
- Retry/backoff cấu hình được theo integration trong giới hạn an toàn.
- Export báo cáo reconcile theo kỳ.

### P2 — nice to have
- Nhiều provider cùng loại (vd 2 calendar) với routing theo org unit.
- Tự động đề xuất reconcile từ lịch sử quyết định.
- Webhook subscription tự đăng ký khi provider hỗ trợ.

## 5. Core Flows (Happy Path)

### 5.1 Cấu hình và kết nối integration

1) Admin tạo integration từ catalog loại (calendar/form/webhook/file/task),
   chọn hướng và đặt tên.
2) Hệ thống sinh contract: loại dữ liệu, trường được phép trao đổi,
   source-of-truth per loại, scope quyền tối thiểu.
3) Admin nhập credential/endpoint qua field bảo mật (lưu vào catalog
   `platform-configuration`).
4) Test connection: bắt buộc đạt mới được bật.
5) Bật integration → trạng thái hoạt động, sẵn sàng nhận/phát sync.

```
Chọn loại → định contract → nhập credential (write-only)
   → test connection → [đạt] bật integration → sync sẵn sàng
                     → [lỗi] sửa cấu hình, test lại
```

### 5.2 Sync outbound (hệ thống → bên ngoài)

1) Sự kiện nghiệp vụ hợp lệ (vd lịch phỏng vấn được duyệt) tạo mục sync vào
   hàng chờ của integration.
2) Mỗi mục mang khóa idempotent (integration + bản ghi nguồn + loại).
3) Worker gọi provider; thành công → SENT; lỗi → retry theo lịch; hết lượt
   → FAILED dead-letter + báo người phụ trách.
4) Mọi kết quả ghi vào sync log kèm payload tóm tắt (minimal payload).

### 5.3 Reconcile thủ công

1) Admin/HR chạy reconcile cho integration + khoảng thời gian.
2) Hệ thống so khớp bản ghi hai phía theo khóa map → danh sách chênh lệch
   (chỉ có ở ta / chỉ có ở họ / khác giá trị).
3) Từng dòng: chọn áp dụng sửa ở phía nguồn-sai (theo source-of-truth),
   giữ nguyên, hoặc bỏ qua kèm ghi chú.
4) Quyết định ghi audit; mục "áp dụng" tạo sync run mới.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | Cấu hình | Test connection đạt? | Cho phép bật integration | Giữ "chưa kiểm chứng", chặn sync |
| D2 | Sync | Mục hàng chờ có khóa idempotent đã xử lý? | Bỏ qua (ghi log duplicate-skipped) | Xử lý bình thường |
| D3 | Sync | Provider trả lỗi tạm (timeout/5xx)? | Retry theo lịch | Lỗi cuối → FAILED dead-letter |
| D4 | Webhook inbound | Chữ ký/token hợp lệ? | Nhận vào hàng chờ xử lý | Từ chối + ghi audit attempt |
| D5 | Reconcile | Giá trị khác giữa hai phía? | Vào danh sách chênh chờ quyết định | Đánh dấu khớp |
| D6 | Reconcile | Source-of-truth là bên ngoài cho loại dữ liệu này? | Quyết định "áp dụng" sửa bản ghi hệ thống | Quyết định "áp dụng" tạo sync outbound sửa provider |
| D7 | Ngắt integration | Còn mục QUEUED? | Hủy hàng chờ có log, webhook bỏ qua | Đã rỗng → tắt ngay |

### 6.2 Scenario Matrix

| From State | To State | Rule | Action | Result |
|------------|----------|------|--------|--------|
| Draft | Active | Test connection đạt + đủ contract | Bật integration | Sync được phép |
| Active | Paused | Admin tạm dừng | Dừng dispatch, giữ hàng chờ | Sync nghỉ, resume được |
| Active/Paused | Disabled | Admin ngắt | Hủy hàng chờ + log, webhook bỏ qua | Không sync; credential vẫn giữ |
| Disabled | Draft | Cấu hình lại | Yêu cầu test connection mới | Vòng đời mới |
| QUEUED | SENT | Provider chấp nhận | Ghi log + delivered ref | Hoàn tất |
| QUEUED | RETRYING | Lỗi tạm | Hẹn lại theo lịch | Chờ lần thử sau |
| RETRYING | FAILED | Hết lượt retry | Dead-letter + báo người phụ trách | Chờ xử lý thủ công |
| FAILED | QUEUED | Resend sau khi sửa | Tạo lần thử mới cùng khóa idempotent | Gửi lại không trùng |

### 6.3 State Transitions

```
Integration: DRAFT → ACTIVE → PAUSED → DISABLED
                  ↘ (test lại) DRAFT
SyncItem: QUEUED → SENT
                ↘ RETRYING → FAILED → QUEUED (resend)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| INTEGRATION | DRAFT | ACTIVE | test connection đạt + bật | có (pause/disable) |
| INTEGRATION | ACTIVE | PAUSED | admin tạm dừng | có |
| INTEGRATION | ACTIVE/PAUSED | DISABLED | admin ngắt | có (về DRAFT, test lại) |
| SYNC_ITEM | QUEUED | SENT | provider chấp nhận | không |
| SYNC_ITEM | QUEUED | RETRYING | lỗi tạm | có (vòng retry) |
| SYNC_ITEM | RETRYING | FAILED | hết lượt | có (resend thủ công) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Provider down giữa run | Mục chưa gửi ở QUEUED/RETRYING | Provider phục hồi → worker tiếp tục | Hết retry → FAILED |
| Webhook replay/bomb | Khóa idempotent chặn duplicate | Mục hợp lệ xử lý một lần | Log duplicate-skipped |
| Credential hết hạn/bị thu hồi | Run lỗi xác thực liên tục | Admin đổi credential → test → resume | Mục FAILED resend được |
| Integration bị ngắt khi đang chạy | Hàng chờ hủy có log | Bật lại → tạo run mới | Không gửi tiếp mục cũ |
| Reconcile bỏ dở | Chênh lệch chưa quyết định giữ nguyên | Mở lại tiếp tục | Quyết định từng phần đã lưu |

### 6.5 Other Edge Cases

- Hai bản ghi nguồn cùng map tới một bản ghi ngoài → reconcile liệt kê nhóm
  xung đột, bắt buộc chọn một.
- Webhook tới khi integration DISABLED → bỏ qua kèm log (không 5xx flood).
- Payload inbound chứa trường ngoài contract → cắt bỏ + ghi log field-drop.
- Source-of-truth mâu thuẫn khi đổi contract → chênh lệch cũ giữ snapshot
  rule tại thời điểm tạo.
- Đồng hồ lệch (clock skew) khi so watermark → reconcile dùng khoảng thời
  gian do người dùng chọn, không dựa vào timestamp tuyệt đối.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên integration | Bắt buộc, duy nhất trong tổ chức, 3-100 ký tự |
| Endpoint/URL | Bắt buộc với webhook/file; phải https; chặn host nội bộ (SSRF guard — đề xuất) |
| Credential | Write-only, không trả plaintext; đổi mới ghi revision |
| Contract scope | Chỉ chứa trường trong whitelist loại dữ liệu đó; trường nhạy cảm cần DPO duyệt |
| Webhook secret | Tự sinh khi tạo endpoint inbound; hiển thị một lần |
| Reconcile note | Bắt buộc khi chọn "bỏ qua" trên chênh lệch |

### 7.2 Limits & Quotas (đề xuất — chờ Technical/Operations owner)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Retry sync | 3 lần: 5 phút / 30 phút / 2 giờ | Mỗi mục | Hết lượt → FAILED dead-letter |
| Webhook inbound | 60 request/phút/integration | Trượt 60s | 429 + ghi log |
| Kích thước payload một mục | 256 KB | Mỗi mục | Từ chối + log field-drop |
| Số mục một sync run | 500 | Mỗi run | Chia run tiếp theo |
| Giữ reconcile report | 90 ngày | Sau tạo | Ẩn khỏi danh sách (audit vẫn giữ) |
| Giữ sync log | Theo audit policy | — | Chờ OQ-6 |

### 7.3 Wording samples

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Test connection lỗi | "Không kết nối được hệ thống ngoài: {lý do} — kiểm tra lại cấu hình" | E-EXT-01 |
| Webhook sai chữ ký | "Yêu cầu webhook bị từ chối do chữ ký không hợp lệ" | E-EXT-02 |
| Hết retry | "Đồng bộ {loại} thất bại sau 3 lần thử: {lý do} — cần xử lý thủ công" | E-EXT-03 |
| Integration bị ngắt | "Integration đã bị ngắt — mục đồng bộ này sẽ không được gửi" | E-EXT-04 |
| Trường ngoài contract | "Trường {tên} không nằm trong hợp đồng dữ liệu của integration này" | E-EXT-05 |

#### Success messages

| Tình huống | Wording |
|---|---|
| Bật integration | "Integration đã được bật — dữ liệu sẽ đồng bộ theo hợp đồng đã cấu hình" |
| Sync run xong | "Đợt đồng bộ hoàn tất: {n} thành công, {m} lỗi" |
| Reconcile xong | "Đã ghi nhận {n} quyết định đối soát" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Chưa chọn provider | "Tính năng này đang chờ chọn provider — cấu hình hiện là bản nháp" |
| Duplicate bị chặn | "Mục này đã được xử lý trước đó (khóa trùng) — bỏ qua" |

## 8. Assumptions

- Provider cụ thể CHƯA được chọn (project profile 2026-09-13): toàn bộ
  contract/entity giữ ở mức provider-agnostic; khi chọn provider, chỉ cần
  bổ sung adapter + field mapping, không thay đổi khung.
- Calendar là loại đầu tiên được nói tên trong PRD → contract mẫu trong tài
  liệu lấy calendar làm ví dụ, nhưng schema không gắn cứng vào calendar.
- Credential integration nằm trong catalog `platform-configuration` (cùng
  hợp đồng secret write-only) — đề xuất, chờ Operations owner.
- Webhook inbound chỉ nhận trên endpoint https do hệ thống cấp, có chữ ký —
  đề xuất bảo mật tối thiểu.
- Reconcile luôn thủ công (PRD nói "reconcile" trong luồng chính, không nói
  auto-merge) — đề xuất: không auto-merge trong v1.
- Deployment authority OQ-5: integration webhook KHÔNG phải cổng deploy;
  mọi inbound write đều qua hàng chờ + contract, không gọi thẳng nghiệp vụ.
- Dữ liệu nhạy cảm từ bên ngoài chỉ giữ tối thiểu cho reconcile (OQ-6);
  field-level allowlist per contract là cơ chế chính.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Chọn provider xong mới phát hiện contract thiếu trường | thỉnh thoảng | Phải sửa contract + migrate sync log, trễ roadmap | Contract version hóa; field mapping tách riêng; review với owner trước khi chốt |
| Duplicate do webhook replay/retry | thường | Lịch/task bị tạo trùng, HR mất niềm tin | Khóa idempotent bắt buộc; log duplicate-skipped |
| Stale data hai phía lệch nhau | thường | Nhân sự/ứng viên nhận thông tin sai | Reconcile định kỳ + báo chênh lệch |
| Quyền provider quá rộng (scope OAuth thừa) | thỉnh thoảng | Rủi ro bảo mật, vi phạm nguyên tắc tối thiểu | Contract khai báo scope tối thiểu; review khi bật |
| Credential lộ/bị thu hồi | hiếm | Trao đổi dữ liệu trái phép | Rotation thủ công + audit; thu hồi → disable integration |
| Provider đổi API/breaking change | thỉnh thoảng | Sync hỏng hàng loạt | Adapter tách riêng; test connection định kỳ; dead-letter rõ |
| Reconcile quyết định sai hướng sửa | thỉnh thoảng | Ghi đè dữ liệu đúng bằng dữ liệu cũ | Preview trước khi áp dụng; source-of-truth hiển thị rõ; audit từng dòng |

## 10. Success Criteria (preliminary)

- Tỷ lệ sync thành công không cần sửa thủ công — đo chính của PRD (mốc đề
  xuất ≥95% — chờ OQ-10 vì phụ thuộc provider).
- 0 duplicate tạo ra từ replay/retry (khóa idempotent hiệu lực 100%).
- 100% chênh lệch reconcile có quyết định ghi audit.
- 100% integration ACTIVE đã qua test connection; 0 credential đọc ra
  plaintext.

## 11. Open Questions

- [x] OQ-1: Provider nào được chọn cho v1? — Out of scope v1: project
  profile ghi "Trì hoãn — chưa chọn provider"; tài liệu giữ provider-
  agnostic, quyết định chọn provider thuộc roadmap.
- [x] OQ-2: Các loại trao đổi nào trong contract v1? — Resolved (đề xuất):
  theo PRD "calendar và integration contract được owner chọn trước" — khung
  hỗ trợ calendar/form/webhook/file/task, bật từng loại theo quyết định
  owner — chờ Product/Operations owner.
- [x] OQ-3: Webhook inbound có được phép ghi thẳng dữ liệu nghiệp vụ? —
  Resolved (đề xuất): không — inbound qua hàng chờ + contract allowlist,
  nghiệp vụ module quyết định áp dụng — chờ Technical owner (liên quan
  OQ-5 PRD deployment authority).
- [x] OQ-4: Retention/consent cho dữ liệu sync và payload log? — Resolved
  (đề xuất): sync log theo audit policy; payload snapshot tối thiểu phục vụ
  reconcile; dữ liệu nhạy cảm theo allowlist DPO — chờ DPO/legal (OQ-6 PRD).
- [x] OQ-5: Ai là source-of-truth cho từng loại dữ liệu? — Resolved (đề
  xuất): khai báo per contract theo loại (vd lịch phỏng vấn: hệ thống là
  truth cho thời gian/phòng; bên ngoài là truth cho RSVP) — chờ owner
  nghiệp vụ từng module.
- [x] OQ-6: Auto-merge reconcile? — Resolved (đề xuất): không trong v1 —
  mọi chênh lệch cần quyết định thủ công có audit — chờ Product owner.
- [x] OQ-7: Retry/backoff chuẩn? — Resolved (đề xuất): 5p/30p/2h → dead-
  letter, thống nhất với operational-email/contextual-notifications — chờ
  Technical/Operations owner (OQ-10 PRD).
- [x] OQ-8: Credential/secret của integration giữ ở đâu? — Resolved (đề
  xuất): trong catalog `platform-configuration` (write-only, masked,
  versioned) — chờ Operations owner.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd external-integrations` — capture user perspective
- `/brd external-integrations` — business case
- `/prd external-integrations` — product scope
