---
type: brainstorm
feature: ai-usage-monitoring
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/platform-communications-and-governance/reverse-spec.md]
---

# Giám sát mức dùng AI và chi phí cho vận hành — ai-usage-monitoring

## 1. Idea Seed

Mọi request AI đi qua nền tảng (trích xuất CV/tài liệu, sinh câu hỏi,
tóm tắt biên bản, đối chiếu ứng viên, OCR) phải để lại một usage record:
ai thực hiện, ở feature nào, loại thao tác gì, provider/model nào, bao
nhiêu token vào/ra, chi phí ước tính bao nhiêu, thành công hay lỗi —
KHÔNG ghi nội dung prompt/response. Admin tổng hợp theo kỳ, xem
breakdown theo thao tác/người dùng/model, nhập đơn giá theo provider,
đặt ngưỡng cảnh báo và xử lý bất thường bằng tay. Log này phục vụ vận
hành và ngân sách — tuyệt đối không trở thành dữ liệu đánh giá nhân sự.

## 2. Context

AI provider tính phí theo token; khi không có usage record, tổ chức
không biết tiền đang đi vào thao tác nào, không reconcile được với hóa
đơn cuối tháng, và không phát hiện spike bất thường (vòng lặp retry lỗi,
cấu hình model sai, lạm dụng). PRD ghi nhận đây là rủi ro chi phí R-14:
"AI usage thiếu hoặc tăng bất thường" — response là cảnh báo + review
quota/policy, KHÔNG phải tự khóa người dùng. Nguồn ITBAAI đã có bảng
AI_USAGE và route đọc usage (reverse spec
`platform-communications-and-governance`, ERD `USERS consumes AI_USAGE`)
— đây là bằng chứng triển khai, chưa phải bằng chứng nhu cầu. PRD Mục
7.37 xếp feature này `Should` — slice mở rộng sau lát cắt v1; phụ thuộc
`org-governance` (quyền/audit) và `platform-configuration` (nơi đặt
pricing setting). Rủi ro chính theo PRD: số liệu thiếu, redact sai (lộ
payload vào log) hoặc số liệu bị dùng ngoài mục đích vận hành — tức
thiết kế phải chủ động ngăn cả hai hướng lạm dụng.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Admin | Không biết chi phí AI đến từ đâu; không reconcile được hóa đơn; spike phát hiện muộn | Usage record đầy đủ, breakdown theo thao tác/người/model, đơn giá cấu hình được, cảnh báo vượt ngưỡng |
| Product owner / operations | Không có căn cứ quyết định ngân sách và quota AI | Tổng hợp theo kỳ đáng tin để review policy |
| Security / DPO | Log vận hành có thể chứa PII hoặc bị lạm dụng đánh giá người | Bảo đảm log chỉ chứa metadata kỹ thuật, phạm vi xem hạn chế, mục đích được công bố |
| Quản lý | (cố ý ngoài scope) Không được dùng mức dùng AI để chấm điểm nhân viên | — |
| Người dùng nội bộ | Chỉ là nguồn phát sinh request; không có nhu cầu trực tiếp | — |

## 4. Capabilities Breakdown

### P0 — must have

- Ghi usage record cho mọi AI request đi qua nền tảng: feature nguồn,
  loại thao tác, provider, model, token vào/ra, trạng thái (thành công /
  lỗi / không đo được), chi phí ước tính, người dùng, đơn vị, thời điểm
  — KHÔNG ghi payload, prompt hay nội dung response.
- Chi phí ước tính chốt tại thời điểm ghi theo đơn giá đang hiệu lực;
  request thiếu token data từ provider được đánh dấu "không đo được"
  thay vì đoán số.
- Tổng hợp theo kỳ (ngày/tuần/tháng): tổng request, token, chi phí ước
  tính; breakdown theo feature, loại thao tác, model và người dùng.
- Pricing setting: đơn giá theo provider + model (giá/token vào, giá/
  token ra), hiệu lực theo ngày, admin cập nhật có audit; giá mới chỉ áp
  cho record mới.
- Ngưỡng cảnh báo thủ công: admin đặt ngưỡng theo metric (chi phí / số
  request / token) và kỳ (ngày/tuần/tháng), phạm vi toàn tổ chức hoặc
  theo feature; hệ thống flag cảnh báo khi vượt; admin xem, drill và
  đóng kèm ghi chú. Hệ thống KHÔNG tự khóa hay chặn request.
- Đối chiếu kỳ với hóa đơn provider: tổng hợp token/chi phí theo model
  trong kỳ để admin so với con số provider; đánh dấu kỳ "đã reconcile"
  hoặc "lệch cần điều tra".
- Phân quyền xem: chỉ vai trò admin/được cấp mở được màn usage; breakdown
  theo người dùng chỉ phục vụ điều tra vận hành.

### P1 — should have

- Export CSV số liệu usage theo kỳ/bộ lọc, có audit ai xuất.
- Đẩy cảnh báo vượt ngưỡng qua `contextual-notifications` khi feature đó
  sẵn sàng (v1 chỉ là danh sách cảnh báo trong màn admin).
- Drill-down một người dùng sang các thao tác — chỉ admin, hiển thị kèm
  nhãn "chỉ dùng cho điều tra vận hành".
- Đánh dấu xử lý các record "không đo được" (thiếu token data) để đo độ
  phủ của usage log.

### P2 — nice to have

- Ngưỡng mềm theo người dùng/feature (chỉ cảnh báo, không chặn).
- Gợi ý anomaly tự động: spike so với trung bình trượt 7/30 ngày.
- Liên kết nhanh sang provider console; nhập bảng giá từ nguồn provider
  thay vì tay.
- Quota cứng theo tổ chức — phụ thuộc quyết định policy, hiện nằm ngoài
  phạm vi (PRD "Chưa làm": tự khóa người dùng).

## 5. Core Flows (Happy Path)

### 5.1 Ghi usage khi một AI request chạy

1) Một feature nghiệp vụ (vd `cv-intake`, `ai-question-generation`) gọi
   AI provider qua điểm chung của nền tảng.
2) Request hoàn tất hoặc thất bại → hệ thống ghi usage record: feature,
   thao tác, provider/model, token vào/ra, trạng thái, người dùng, thời
   điểm — loại bỏ payload.
3) Chi phí ước tính = token × đơn giá hiệu lực của provider+model; nếu
   provider không trả token → trạng thái "không đo được", chi phí rỗng.
4) Record mới được kiểm tra với các ngưỡng đang bật: vượt → tạo cảnh báo
   mở; không vượt → không làm gì. Request nghiệp vụ không bao giờ bị
   chặn bởi bước này.

```
Feature nghiệp vụ          Điểm ghi usage chung            Màn admin
─────────────────────────────────────────────────────────────────────
Gọi AI provider
        │
        ▼
┌─────────────────┐
│ Provider trả    │── lỗi / thiếu token ──▶ status "lỗi" hoặc
│ kết quả + token │                          "không đo được"
└────────┬────────┘
         ▼
┌──────────────────────────────┐
│ Ghi usage record (metadata,  │
│ KHÔNG payload)               │
└────────┬─────────────────────┘
         ▼
┌──────────────────────────────┐
│ Chi phí = token × đơn giá    │
│ hiệu lực tại thời điểm ghi   │
└────────┬─────────────────────┘
         ▼
   ── Vượt ngưỡng đang bật? ──┐
     │                        │
   Có ▼                     Không ▼
┌──────────────┐         (không làm gì)
│ Cảnh báo MỞ  │──── hiện trong danh sách ────▶ admin xem/drill/đóng
└──────────────┘    cảnh báo của admin
```

### 5.2 Admin xem tổng quan và breakdown

1) Admin mở "Mức dùng AI" → chọn kỳ (ngày/tuần/tháng + khoảng thời gian).
2) Thấy tổng request, token, chi phí ước tính và xu hướng so với kỳ
   trước.
3) Chuyển breakdown theo feature / thao tác / model / người dùng.
4) Phát hiện điểm bất thường → drill sang danh sách record của nhóm đó
   (vẫn chỉ metadata) → đánh dấu để điều tra hoặc mở cảnh báo tay.

### 5.3 Cấu hình đơn giá (pricing setting)

1) Admin mở phần "Đơn giá AI" → thêm/sửa giá cho provider+model: giá/
   token vào, giá/token ra, tiền tệ, ngày hiệu lực.
2) Lưu → ghi audit (ai, khi nào, giá cũ/mới); giá mới áp cho usage
   record ghi từ ngày hiệu lực trở đi.
3) Model chưa có giá → record vẫn ghi token nhưng chi phí hiển thị
   "chưa có giá" để admin biết phải bổ sung.

### 5.4 Xử lý cảnh báo vượt ngưỡng

1) Admin đặt ngưỡng (vd chi phí/tháng toàn tổ chức; request/ngày theo
   feature `cv-intake`).
2) Khi số liệu kỳ hiện tại vượt ngưỡng → cảnh báo "mở" xuất hiện trong
   danh sách.
3) Admin mở cảnh báo → xem số liệu vi phạm → drill breakdown → xác định
   nguyên nhân (spike thật, lỗi vòng lặp, model sai giá).
4) Đóng cảnh báo kèm ghi chú bắt buộc (đã xử lý / báo động giả / đã điều
   chỉnh ngưỡng); hành động khắc phục (đổi policy, báo owner feature,
   chỉnh provider config) diễn ra ngoài hệ thống hoặc qua feature liên
   quan — KHÔNG qua khóa tài khoản.

### 5.5 Đối chiếu kỳ với hóa đơn provider

1) Cuối kỳ (tháng), admin mở "Đối chiếu" → chọn tháng → hệ thống liệt kê
   tổng token/chi phí ước tính theo provider+model.
2) Admin nhập/đối chiếu con số trên hóa đơn provider.
3) Chênh lệch trong ngưỡng (đề xuất 5%) → đánh dấu kỳ "đã reconcile";
   vượt ngưỡng → đánh dấu "lệch" và điều tra coverage (record thiếu,
   "không đo được" nhiều, giá sai).

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Provider trả đủ token usage? | Ghi token + tính chi phí | Ghi status "không đo được", chi phí rỗng |
| D2 | 5.1 | Request AI thành công? | status "thành công" | status "lỗi" — vẫn ghi record, token có thể thiếu |
| D3 | 5.1/5.4 | Số liệu kỳ hiện tại vượt ngưỡng đang bật? | Tạo cảnh báo "mở" | Không làm gì — request KHÔNG bị chặn ở mọi nhánh |
| D4 | 5.2 | Người xem có quyền xem breakdown theo người dùng? | Hiện nhóm theo người + nhãn "chỉ dùng cho điều tra vận hành" | Chỉ hiện breakdown theo feature/thao tác/model |
| D5 | 5.3 | Model của record đã có đơn giá hiệu lực? | Tính chi phí bình thường | Ghi token, chi phí "chưa có giá" |
| D6 | 5.4 | Admin đóng cảnh báo? | Bắt buộc ghi chú ≥10 ký tự → "đã đóng" | Giữ "mở"/"đang xem" |
| D7 | 5.5 | Chênh lệch ước tính vs hóa đơn trong ngưỡng? | Đánh dấu kỳ "đã reconcile" | Đánh dấu "lệch" + hướng dẫn điều tra coverage |
| D8 | 5.2 | Người xuất CSV có quyền export? | Tạo file + ghi audit | Chặn + báo không có quyền |

### 6.2 Scenario Matrix

| Vai trò | Dashboard tổng hợp | Breakdown theo người dùng | Đơn giá & ngưỡng | Cảnh báo | Export |
|---|---|---|---|---|---|
| Admin | xem | xem + drill (kèm nhãn vận hành) | xem/sửa | xem/xử lý/đóng | được |
| Product owner / operations (được cấp) | xem | không | xem | xem | được (đề xuất) |
| Security / DPO (được cấp) | xem | xem để kiểm tra redact | xem | xem | được |
| Quản lý | không | không | không | không | không |
| Nhân viên / HR thường | không | không | không | không | không |

### 6.3 State Transitions

```
AI_USAGE_LOG:    (ghi) → ĐÃ_GHI  [bất biến — không sửa/xóa ngoài retention]

AI_USAGE_ALERT:  MỞ → ĐANG_XEM → ĐÃ_ĐÓNG (kèm ghi chú)
                    ↑_______|  (admin mở lại xem tiếp)

Kỳ đối chiếu:    CHUA_DOI_CHIEU → DA_DOI_CHIEU | LECH_CAN_DIEU_TRA
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| Usage record | — | đã ghi | AI request hoàn tất/thất bại | không (bất biến) |
| Cảnh báo | — | mở | số liệu kỳ vượt ngưỡng | — |
| Cảnh báo | mở | đang xem | admin mở xem lần đầu | — |
| Cảnh báo | đang xem | đã đóng | admin đóng kèm ghi chú | không |
| Cảnh báo | đang xem | đang xem | admin mở lại xem tiếp | có (lặp) |
| Kỳ đối chiếu | — | chưa đối chiếu | sang kỳ mới | — |
| Kỳ đối chiếu | chưa đối chiếu | đã đối chiếu / lệch | admin xác nhận chênh lệch | có (đối chiếu lại) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Provider trả thiếu token usage | Record status "không đo được" | Đếm vào thống kê coverage; không đoán số | không |
| Tác vụ tổng hợp kỳ lỗi giữa chừng | Tổng hợp đến mốc cuối đã xử lý | Chạy lại idempotent từ mốc đó | không tạo bản ghi trùng |
| Admin đổi giá giữa kỳ | Record cũ giữ chi phí đã chốt | Record mới áp giá mới từ ngày hiệu lực | không tính lại record cũ |
| 2 admin sửa cùng dòng giá đồng thời | Bản lưu sau ghi đè | Cảnh báo "đơn giá vừa được {người} cập nhật" | audit giữ cả hai lượt |
| Ngưỡng bị tắt trong lúc đang có cảnh báo mở | Cảnh báo mở vẫn còn | Admin đóng tay kèm ghi chú; không cảnh báo mới từ ngưỡng đã tắt | không tự đóng hàng loạt |
| Export file lớn bị ngắt | Job export có trạng thái | Tải lại/chạy lại export | file tạm xóa theo hạn |

### 6.5 Other Edge Cases

- Feature nghiệp vụ mới chưa có trong danh mục thao tác: usage record
  vẫn ghi với mã feature thô; danh mục hiển thị "chưa phân loại" để
  admin cập nhật mapping.
- Tổ chức chưa có request AI nào: dashboard hiện empty state, hướng dẫn
  kiểm tra điểm ghi usage chung.
- Một request lỗi lặp hàng trăm lần tạo spike: cảnh báo theo ngưỡng
  request/ngày bắt được; breakdown theo thao tác cho thấy điểm lặp.
- Dữ liệu synthetic/test trộn vào usage thật: (đề xuất) record mang cờ
  nguồn môi trường để loại khỏi số liệu reconcile.
- Người dùng bị vô hiệu hóa tài khoản: usage record lịch sử giữ nguyên
  để truy vết; breakdown theo người đánh dấu "tài khoản đã đóng".
- Model/provider đổi tên phía provider: giá cũ giữ nguyên theo khóa
  provider+model cũ; admin thêm dòng giá mới — không ghi đè lịch sử.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Đơn giá token vào/ra | bắt buộc ≥0, số thập phân; tiền tệ bắt buộc theo danh mục (VND, USD) |
| Ngày hiệu lực đơn giá | bắt buộc; không chồng khoảng hiệu lực trên cùng provider+model |
| Ngưỡng cảnh báo | bắt buộc >0; metric ∈ chi phí/số request/token; kỳ ∈ ngày/tuần/tháng |
| Phạm vi ngưỡng | toàn tổ chức hoặc đúng 1 feature trong danh mục |
| Ghi chú đóng cảnh báo | bắt buộc, ≥10 ký tự |
| Khoảng thời gian xem | bắt buộc, tối đa 12 tháng/lần truy vấn |
| Kỳ đối chiếu | chọn đúng 1 tháng đã kết thúc hoặc đang chạy |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Chu kỳ kiểm tra ngưỡng | 15 phút (đề xuất) | liên tục | cảnh báo trễ tối đa 1 chu kỳ |
| Số dòng danh sách record | 50/trang (đề xuất) | — | phân trang |
| Giới hạn export CSV | 100.000 dòng (đề xuất) | mỗi lượt | chặn, gợi ý thu hẹp bộ lọc/kỳ |
| Retention usage log | 24 tháng (đề xuất — chờ OQ-6 PRD) | — | chỉ metadata không payload |
| Ngưỡng chênh reconcile | 5% (đề xuất) | mỗi kỳ | vượt → đánh dấu "lệch" |
| Số ngưỡng đang bật | 20/tổ chức (đề xuất) | — | chặn thêm, gợi ý gộp ngưỡng |
| Khoảng truy vấn breakdown | 12 tháng | mỗi lần | chặn, yêu cầu thu hẹp |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Ngưỡng thiếu/không hợp lệ | "Nhập ngưỡng lớn hơn 0 và chọn đủ metric, kỳ, phạm vi" | E-? |
| Đơn giá chồng hiệu lực | "Đã có đơn giá cho {provider}/{model} trùng khoảng hiệu lực — kiểm tra lại ngày" | E-? |
| Đóng cảnh báo thiếu ghi chú | "Nhập ghi chú xử lý (tối thiểu 10 ký tự) trước khi đóng cảnh báo" | E-? |
| Không có quyền xem usage | "Bạn không có quyền xem dữ liệu mức dùng AI" | E-? |
| Export vượt giới hạn | "Bộ lọc hiện tại có hơn 100.000 dòng — thu hẹp kỳ hoặc điều kiện rồi xuất lại" | E-? |
| Khoảng truy vấn quá dài | "Khoảng thời gian tối đa 12 tháng — chọn lại" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Lưu đơn giá | "Đã lưu đơn giá cho {provider}/{model} — áp dụng từ {ngày}" |
| Lưu ngưỡng | "Đã bật cảnh báo khi {metric} vượt {giá trị}/{kỳ}" |
| Đóng cảnh báo | "Đã đóng cảnh báo" |
| Reconcile thành công | "Kỳ {tháng} đã đối chiếu khớp với hóa đơn" |
| Export xong | "Đã tạo file {tên} — {n} dòng" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Cảnh báo mới | "Có {n} cảnh báo mức dùng AI đang mở" |
| Record không đo được | "{n}% request trong kỳ không đo được token — kiểm tra tích hợp provider" |
| Model chưa có giá | "{model} chưa có đơn giá — chi phí chưa ước tính được" |
| Nhãn breakdown theo người | "Dữ liệu theo người chỉ dùng cho điều tra vận hành — không dùng đánh giá nhân sự" |
| Reconcile lệch | "Kỳ {tháng} lệch {x}% so với hóa đơn — kiểm tra record thiếu hoặc đơn giá" |
| Empty state | "Chưa có dữ liệu mức dùng AI trong kỳ này" |

## 8. Assumptions

- `org-governance` cung cấp role/scope/audit; `account-access` cung cấp
  danh tính người dùng; `platform-configuration` là surface đặt đơn giá
  và ngưỡng (đề xuất nhúng vào nhóm cấu hình "AI").
- Mọi AI request của nền tảng đi qua một điểm ghi usage chung ở provider
  boundary — feature này định nghĩa dữ liệu ghi, không tự instrument
  từng feature.
- Đơn giá do admin nhập tay theo bảng giá provider công bố; không
  auto-fetch v1 (đề xuất — OQ-3).
- Chi phí ước tính chốt tại thời điểm ghi record và không tính lại khi
  giá đổi — reconcile với hóa đơn cần số ổn định (đề xuất — OQ-4).
- Usage record chỉ chứa metadata kỹ thuật; request_ref là tham chiếu
  nghiệp vụ tối thiểu (vd mã job), không chứa nội dung tài liệu/CV.
- Breakdown theo người dùng chỉ mở cho vai trò được cấp; quản lý không
  có surface usage trong v1 vì rủi ro đánh giá nhân sự (đề xuất — OQ-2).
- Các giới hạn số ở Mục 7.2 là giá trị đề xuất — chờ owner chốt (OQ-8
  của URD/spec).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Số liệu usage bị dùng đánh giá hiệu suất/quyết định nhân sự | thỉnh thoảng | Vi phạm cam kết PRD ("không biến log thành dữ liệu HR"), mất niềm tin nhân viên, rủi ro pháp lý | Không surface cho quản lý; nhãn mục đích trên breakdown theo người; công bố policy; audit ai xem (R-14 response) |
| Payload/nội dung AI lọt vào usage log | thỉnh thoảng | Lộ PII trong log vận hành, vi phạm privacy gate | Chỉ ghi metadata whitelist; kiểm tra redact trong review; không field text tự do |
| Provider không trả token cho một số request | thường | Chi phí ước tính thiếu, reconcile lệch | Status "không đo được" + chỉ số coverage; đo % record hợp lệ (đo thành công PRD) |
| Đơn giá lỗi thời | thường | Chi phí ước tính sai lệch ngân sách | Ngày hiệu lực + audit; reconcile định kỳ phát hiện lệch; cảnh báo "chưa có giá" |
| Spike usage do lỗi vòng lặp/retry phát hiện muộn | thỉnh thoảng | Hóa đơn đội chi phí bất ngờ | Ngưỡng theo request/ngày theo feature; cảnh báo trong ≤1 chu kỳ kiểm tra |
| Retention chưa được DPO duyệt (OQ-6 PRD) | thường | Không dùng dữ liệu thật được | Chỉ metadata không payload; synthetic trước privacy gate |
| Ngưỡng đặt quá lỏng/chặt | thường | Cảnh báo ngập (bỏ qua) hoặc câm (không phát hiện) | Review ngưỡng sau 1 tháng; bắt đầu với ít ngưỡng trọng yếu |

## 10. Success Criteria (preliminary)

- Tỷ lệ AI request có usage record hợp lệ và reconcile được — đo thành
  công của PRD Mục 7.37; đề xuất ≥99% request có record, ≥95% record đo
  được token.
- 100% cảnh báo được admin xem và đóng kèm ghi chú trong ≤3 ngày làm
  việc (đề xuất).
- Chênh lệch reconcile định kỳ trong ngưỡng đã công bố (đề xuất 5%)
  hoặc có ghi nhận nguyên nhân.
- 0 sự cố payload/PII xuất hiện trong usage log (guardrail, bám M-GR-01).
- 0 trường hợp số liệu usage được dùng trong quyết định nhân sự được
  xác nhận (guardrail theo PRD "Chưa làm").

## 11. Open Questions

- [x] OQ-1: "Cảnh báo thủ công" của PRD nghĩa là gì — hệ thống có tự
  động gì không? — Resolved: admin tự cấu hình ngưỡng và tự xử lý; hệ
  thống chỉ flag cảnh báo trong màn admin, không tự khóa/chặn (bám PRD
  "Chưa làm" + response R-14); gửi notification là P1.
- [x] OQ-2: Ai được xem breakdown theo người dùng? — Resolved (đề xuất):
  chỉ admin/vai trò được cấp; quản lý không có surface v1 vì rủi ro
  đánh giá nhân sự — chờ Security owner xác nhận.
- [x] OQ-3: Nguồn đơn giá lấy từ đâu? — Resolved (đề xuất): admin nhập
  tay theo bảng giá provider, hiệu lực theo ngày; không auto-fetch v1 —
  chờ Admin lead xác nhận.
- [x] OQ-4: Chi phí ước tính có tính lại khi giá đổi? — Resolved (đề
  xuất): không — chi phí chốt tại thời điểm ghi record; giá mới chỉ áp
  record mới — chờ Admin lead xác nhận.
- [x] OQ-5: Request lỗi/timeout có ghi usage không? — Resolved: có —
  ghi record status "lỗi"; thiếu token thì đánh dấu "không đo được" để
  đo coverage.
- [x] OQ-6: Có quota cứng tự chặn request khi vượt ngân sách? — Resolved
  (đề xuất): không v1 — chỉ cảnh báo + policy review (R-14); quota cứng
  là quyết định policy sau, P2 — chờ Product owner.
- [x] OQ-7: Ngưỡng chênh lệch reconcile chấp nhận được? — Resolved (đề
  xuất): ≤5% giữa ước tính và hóa đơn — chờ Admin lead xác nhận.
- [~] OQ-8: Retention usage log giữ bao lâu? — Out of scope feature:
  theo OQ-6 PRD (DPO duyệt retention chung); đề xuất 24 tháng cho
  metadata, trước pilot chỉ dữ liệu synthetic.
- [~] OQ-9: Anomaly detection tự động (ML) thay ngưỡng tay? — Out of
  scope v1: P2; v1 chỉ ngưỡng tay + so với kỳ trước.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd ai-usage-monitoring` — capture user perspective
- `/brd ai-usage-monitoring` — business case
- `/prd-epic ai-usage-monitoring` — product scope
