---
type: brainstorm
feature: operational-email
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/platform-communications-and-governance/reverse-spec.md]
---

# Email nghiệp vụ từ mẫu có kiểm soát — operational-email

## 1. Idea Seed

Một kênh gửi email nghiệp vụ có kiểm soát cho HR và admin: soạn từ mẫu đã
được duyệt, biến tự điền từ đúng ngữ cảnh nghiệp vụ (ứng viên, offer, nhân
sự), người nhận được kiểm tra từ hồ sơ thay vì gõ tay, có gửi thử trước khi
gửi thật, gửi đơn lẻ hoặc hàng loạt có cổng kiểm soát, và mọi email giữ
trạng thái giao nhận để truy vết — không ai phải copy dữ liệu nhạy cảm vào
hòm mail cá nhân.

## 2. Context

HR hiện gửi email mời phỏng vấn, thông báo kết quả vòng, follow-up offer và
thông điệp vận hành từ hòm mail cá nhân hoặc soạn tay: phải copy tên, lịch,
link từ hệ thống sang email — dễ sai người nhận, sai phiên bản nội dung, lộ
dữ liệu nhạy cảm và không ai biết email đã gửi hay chưa. Nguồn ITBAAI đã có
nền email đầy đủ: template, recipient lookup, single/bulk send, SMTP
config/test và logs, credential SMTP được mã hóa (reverse spec
`platform-communications-and-governance` FR-PL-03, FR-PL-04) — đây là bằng
chứng triển khai, chưa phải bằng chứng nhu cầu.

Feature này khác `contextual-notifications`: notifications là thông báo tự
động theo event nghiệp vụ, còn operational-email là email do con người chủ
động soạn/gửi từ mẫu đã duyệt. Hai feature dùng chung hạ tầng SMTP và quy
ước delivery/retry (OQ-10 sản phẩm). Đây là feature `Should` — nằm ngoài
cam kết v1, là slice mở rộng sau lát cắt recruitment.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Soạn email tuyển dụng tay, copy dữ liệu từ hồ sơ, không biết email đã đến chưa | Gửi từ mẫu đã duyệt, biến tự điền, có log giao nhận |
| Admin | Không kiểm soát ai được gửi email gì, SMTP nằm rải rác | Cấu hình provider tập trung, phân quyền gửi/duyệt mẫu, test connection |
| Người duyệt mẫu (HR lead/admin) | Mẫu email do từng người tự soạn, lỗi vẫn được dùng | Hàng chờ duyệt mẫu + trạng thái mẫu rõ ràng |
| Ứng viên / nhân viên (người nhận) | Email rời rạc, thiếu hoặc sai thông tin | Nhận email nhất quán, đúng dữ liệu, đúng người |
| DPO/legal nominee | Email có thể lộ dữ liệu nhạy cảm | Biến được phép là whitelist, mọi gửi có audit |

## 4. Capabilities Breakdown

### P0 — must have

- Quản lý mẫu email: tạo/sửa mẫu kèm biến, phân loại theo ngữ cảnh nghiệp
  vụ; trạng thái Bản nháp → Chờ duyệt → Đã duyệt → Ngừng dùng; chỉ mẫu
  "Đã duyệt" mới được dùng gửi.
- Phiên bản mẫu: sửa mẫu đã duyệt tạo phiên bản mới chờ duyệt; email log
  ghi nhận đúng phiên bản đã dùng (tránh gửi sai version).
- Soạn từ ngữ cảnh: chọn mẫu + đối tượng nghiệp vụ (ứng viên/application,
  offer, nhân sự) → biến tự điền từ hồ sơ; biến bắt buộc thiếu thì chặn
  gửi.
- Kiểm tra người nhận: resolve từ hồ sơ; địa chỉ nhập tay ngoài hồ sơ phải
  qua xác nhận riêng và có audit.
- Preview bắt buộc: nội dung cuối đã điền biến + danh sách người nhận
  trước khi gửi.
- Test-send: gửi thử tới chính mình/địa chỉ nội bộ, đánh dấu rõ là thử,
  không tính vào giao nhận nghiệp vụ.
- Single send và bulk send: bulk có eligibility gate (chỉ người nhận thỏa
  tiêu chí ngữ cảnh), preview danh sách bắt buộc, giới hạn số lượng.
- Delivery log từng người nhận: mẫu + phiên bản, người gửi, trạng thái,
  mốc thời gian, lỗi cuối.
- Idempotent send: batch + recipient là khóa duy nhất; bấm gửi hai lần
  hoặc retry không gửi trùng.
- Retry theo lịch rồi dead-letter FAILED; resend sau khi sửa nguyên nhân;
  manual fallback (liên hệ kênh khác) được ghi nhận.
- Cấu hình SMTP/provider: test connection, credential mã hóa phía server,
  không trả plaintext, rollback được.
- Phân quyền: soạn mẫu / duyệt mẫu / gửi / gửi hàng loạt / cấu hình SMTP
  theo vai trò trong `org-governance`.
- Minimal payload: biến chỉ lấy từ whitelist trường được duyệt; chặn trường
  nhạy cảm (lương, điểm đánh giá, giấy tờ tùy thân).
- Audit đầy đủ: tạo/sửa/duyệt/ngừng mẫu, mỗi lần gửi, thay cấu hình.

### P1 — should have

- Bounce handling: ghi trạng thái BOUNCED + lý do, báo người gửi.
- Resend chỉ phần người nhận FAILED của một batch.
- Thông báo in-app cho người gửi khi batch kết thúc hoặc có FAILED (qua
  `contextual-notifications`).
- Lọc/tìm log theo mẫu, người gửi, trạng thái, ngữ cảnh.

### P2 — nice to have

- Lên lịch gửi trước.
- Đính kèm file (đề xuất loại khỏi v1 để giảm rủi ro payload).
- Marketing automation/campaign, đa kênh OTT — ngoài phạm vi (PRD "Chưa
  làm").

## 5. Core Flows (Happy Path)

### 5.1 Tạo và duyệt mẫu email

1) Người soạn tạo mẫu: tên, ngữ cảnh áp dụng (ví dụ "lịch phỏng vấn",
   "offer"), tiêu đề, nội dung kèm biến từ whitelist trường.
2) Lưu "Bản nháp" → "Gửi duyệt" → chuyển "Chờ duyệt".
3) Người duyệt xem mẫu + danh sách biến dùng → "Duyệt" hoặc "Yêu cầu
   chỉnh" kèm ghi chú.
4) Mẫu "Đã duyệt" xuất hiện khi soạn email. Sửa mẫu đã duyệt → tạo phiên
   bản mới "Chờ duyệt"; phiên bản cũ vẫn dùng được tới khi bản mới được
   duyệt.
5) Mẫu sai/hết dùng → "Ngừng dùng": ẩn khỏi chọn mẫu, email đã gửi giữ
   nguyên phiên bản đã dùng.

### 5.2 Gửi email đơn từ ngữ cảnh nghiệp vụ

1) Trong màn ứng viên/offer, HR chọn "Gửi email" → chọn mẫu đã duyệt khớp
   ngữ cảnh.
2) Hệ thống điền biến từ hồ sơ; biến bắt buộc thiếu → cảnh báo chặn.
3) Người nhận resolve từ hồ sơ (mặc định email ứng viên); cho thêm CC nội
   bộ; địa chỉ ngoài hồ sơ phải xác nhận riêng.
4) Preview nội dung cuối + người nhận → (tùy chọn) "Gửi thử" tới chính
   mình → "Gửi".
5) Email vào hàng chờ → gửi qua SMTP → log SENT; lỗi → retry → FAILED
   báo người gửi.

```
HR                        Hệ thống                            SMTP/Người nhận
─────────────────────────────────────────────────────────────────────────────
Chọn ngữ cảnh + mẫu đã duyệt
        │
        ▼
┌──────────────────────────┐
│ Điền biến từ hồ sơ       │
│ + resolve người nhận     │
└───────────┬──────────────┘
            ▼
   ── Biến bắt buộc đủ? ──┐
   │                     │
  Thiếu ▶ chặn + báo     │
   │      field thiếu    │
  Đủ ▼                   │
┌──────────────────────────┐
│ Preview nội dung cuối +  │
│ danh sách người nhận     │
└───────────┬──────────────┘
            ▼
   ── HR xác nhận gửi? ──┐
   │                     │
  Hủy ▶ thoát            │
   │                     │
 Xác nhận ▼              │
   ├─ "Gửi thử"? ─▶ test-send tới nội bộ (đánh dấu THỬ)
   ▼
Tạo delivery (khóa idempotent batch+recipient)
   │
   ▼
SMTP gửi ── lỗi ─▶ retry 5p/30p/2h ── hết ─▶ FAILED
   │                                            │
   ▼                                            ▼
 SENT → DELIVERED                    báo người gửi → resend/manual fallback
```

### 5.3 Gửi hàng loạt có eligibility gate

1) HR chọn nhóm đối tượng theo tiêu chí ngữ cảnh (ví dụ: ứng viên đạt vòng
   1 của vị trí X) → hệ thống lọc danh sách người nhận hợp lệ.
2) Preview bắt buộc: số lượng, danh sách, người bị loại và lý do (thiếu
   email, không đủ điều kiện, tài khoản deactivate).
3) HR xác nhận → tạo batch; mỗi người nhận là một delivery có khóa
   idempotent riêng → gửi tuần tự → log từng người.
4) Kết thúc: tổng kết SENT/FAILED; cho resend chỉ phần FAILED.

### 5.4 Xử lý email thất bại (manual fallback)

1) Log lọc FAILED/BOUNCED → xem lý do, địa chỉ, mẫu đã dùng.
2) Sửa email trong hồ sơ người nhận → resend từ dead-letter; hoặc ghi
   nhận đã liên hệ kênh khác (manual fallback) để đóng vết xử lý.

### 5.5 Admin cấu hình SMTP và kiểm tra

1) Admin nhập cấu hình provider → "Test connection" → kết quả rõ ràng.
2) Lưu: credential mã hóa phía server, màn hình chỉ hiện dạng che.
3) Cấu hình sai/lỗi → rollback về cấu hình trước; mọi thay đổi có audit.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Mẫu đã được duyệt? | Cho phép dùng để gửi | Chỉ lưu nháp/gửi duyệt, không gửi được |
| D2 | 5.1 | Sửa mẫu đã duyệt là sửa lớn (tiêu đề/nội dung/biến)? | Tạo phiên bản mới "Chờ duyệt" | Sửa nhỏ giữ trạng thái |
| D3 | 5.2 | Biến bắt buộc đã đủ dữ liệu? | Cho preview/gửi | Chặn, liệt kê biến thiếu |
| D4 | 5.2 | Địa chỉ nhập tay ngoài hồ sơ? | Yêu cầu xác nhận riêng + ghi audit | Resolve từ hồ sơ thì gửi thẳng qua preview |
| D5 | 5.3 | Người nhận qua eligibility gate? | Đưa vào danh sách gửi | Loại khỏi batch, hiện lý do |
| D6 | 5.2/5.3 | SMTP trả lỗi? | Retry 5p/30p/2h rồi FAILED + báo người gửi | Mark SENT |
| D7 | 5.3 | Batch có một phần FAILED? | Cho resend chỉ phần FAILED | Không gửi lại phần đã SENT |
| D8 | 5.5 | Test connection thành công? | Cho lưu cấu hình mới | Báo lỗi, giữ cấu hình cũ |

### 6.2 Scenario Matrix

| Vai trò | Mẫu bản nháp | Mẫu chờ duyệt | Mẫu đã duyệt | Mẫu ngừng dùng |
|---|---|---|---|---|
| Người soạn (HR được quyền) | xem/sửa/gửi duyệt/xóa | xem, sửa theo ghi chú | dùng để gửi, sửa → phiên bản mới | xem lịch sử |
| Người duyệt mẫu | — | xem + duyệt/yêu cầu chỉnh | xem, đề xuất ngừng | xem |
| HR có quyền gửi | — | — | chọn để gửi đơn/bulk | — |
| Admin | xem/sửa mọi mẫu | xem + duyệt | xem/dùng/ngừng dùng | xem/khôi phục |

### 6.3 State Transitions

```
mẫu email: bản-nháp → chờ-duyệt → đã-duyệt → ngừng-dùng
               ↑         │
               └─────────┘ (yêu cầu chỉnh)
đã-duyệt ── sửa lớn ──▶ phiên bản mới ở chờ-duyệt

email message: QUEUED → SENT → DELIVERED
                  ↘ (hết retry) FAILED → (resend) QUEUED
                  ↘ BOUNCED (provider báo bounce)

batch: NHÁP → ĐANG-GỬI → HOÀN-TẤT / HOÀN-TẤT-CÓ-LỖI
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| mẫu email | — | bản-nháp | tạo mới | — |
| mẫu email | bản-nháp | chờ-duyệt | người soạn "Gửi duyệt" | — |
| mẫu email | chờ-duyệt | đã-duyệt | người duyệt "Duyệt" | — |
| mẫu email | chờ-duyệt | chờ-duyệt | "Yêu cầu chỉnh" → sửa gửi lại | có (lặp) |
| mẫu email | đã-duyệt | chờ-duyệt | phiên bản mới từ sửa lớn | có (bản cũ vẫn hiệu lực) |
| mẫu email | mọi trạng thái | ngừng-dùng | người có quyền ngừng kèm lý do | có (khôi phục → chờ-duyệt) |
| email message | — | QUEUED | xác nhận gửi (kể cả test-send) | — |
| email message | QUEUED | SENT | SMTP chấp nhận | — |
| email message | SENT | DELIVERED | xác nhận giao/bounce pass | — |
| email message | QUEUED/SENT | BOUNCED | provider báo bounce | có (resend sau sửa địa chỉ) |
| email message | QUEUED | FAILED | hết lượt retry | có (resend thủ công → QUEUED) |
| batch | NHÁP | ĐANG-GỬI | xác nhận sau preview | — |
| batch | ĐANG-GỬI | HOÀN-TẤT / HOÀN-TẤT-CÓ-LỖI | mọi delivery kết thúc | — |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| SMTP down giữa batch | phần đã gửi SENT, phần chưa gửi QUEUED | provider hồi phục → tiếp tục QUEUED + retry | hết retry → FAILED phần còn lại |
| Người gửi đóng trình duyệt giữa soạn | bản nháp email chưa gửi (nếu đã lưu) | mở lại soạn tiếp | không gửi nửa vời |
| Bấm gửi hai lần/double submit | khóa idempotent batch+recipient | chỉ một delivery tồn tại | không tạo trùng |
| Người duyệt mở mẫu trong lúc người soạn vừa sửa | người duyệt xem bản cũ | khi duyệt → kiểm phiên bản, cảnh báo nếu đã đổi | — |
| Batch xong nhưng ứng viên đổi email sau đó | log giữ địa chỉ tại thời điểm gửi | resend dùng địa chỉ hồ sơ mới | — |

### 6.5 Other Edge Cases

- Mẫu đang được dùng trong batch đang gửi bị "Ngừng dùng": batch đang chạy
  hoàn tất phần QUEUED; batch mới không chọn được mẫu này.
- Người nhận trùng trong một batch (hai application cùng email): gộp một
  delivery + cảnh báo trong preview.
- Biến render ra giá trị rỗng không bắt buộc: hiển thị cảnh báo trong
  preview, cho người gửi quyết định.
- Empty state: tổ chức chưa có mẫu → gợi ý tạo mẫu đầu tiên; chưa có SMTP
  → chặn gửi, hướng dẫn admin cấu hình.
- Người nhận là nhân sự đã nghỉ (deactivate): loại khỏi eligibility, hiện
  lý do trong preview.
- Hai người cùng sửa một mẫu: bản lưu sau ghi đè, cảnh báo "mẫu vừa được
  {người} cập nhật — tải lại".
- Email gửi đúng người nhưng sai ngữ cảnh (nhầm application): không thu
  hồi được email — ghi sự cố, gửi email đính chính, audit.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên mẫu | bắt buộc, duy nhất trong tổ chức, tối đa 120 ký tự |
| Ngữ cảnh áp dụng của mẫu | bắt buộc, chọn từ danh sách ngữ cảnh công bố |
| Tiêu đề email | bắt buộc, tối đa 200 ký tự, cho phép biến |
| Nội dung email | bắt buộc, tối đa 20.000 ký tự, chỉ chứa biến trong whitelist |
| Biến | định dạng `{ten_bien}`; chỉ biến thuộc whitelist trường được duyệt |
| Người nhận | bắt buộc ≥1; resolve từ hồ sơ hoặc nhập tay có xác nhận riêng; định dạng email hợp lệ |
| CC | chỉ địa chỉ nội bộ trong tổ chức, tối đa 10 |
| Test-send | chỉ gửi tới chính mình hoặc địa chỉ nội bộ, tối đa 5 địa chỉ |
| Bulk send | bắt buộc qua eligibility gate + preview; tối đa 200 người nhận/batch (đề xuất) |
| Gửi duyệt mẫu | chỉ khi đủ trường bắt buộc và không có biến ngoài whitelist |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Độ dài tiêu đề | 200 ký tự | — | chặn lưu/gửi |
| Độ dài nội dung mẫu | 20.000 ký tự | — | chặn lưu |
| Số biến mỗi mẫu | 30 | — | chặn thêm biến |
| Người nhận mỗi batch | 200 | mỗi lần gửi | chặn, gợi ý chia nhóm |
| Số CC | 10 | mỗi email | chặn thêm |
| Địa chỉ test-send | 5 | mỗi lần thử | chặn |
| Email retry | 3 lần | 5p → 30p → 2h | FAILED + báo người gửi (đề xuất chờ OQ-10) |
| Số mẫu chờ duyệt hiển thị | 50/trang | — | phân trang |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Gửi khi thiếu biến bắt buộc | "Email chưa đủ dữ liệu cho biến: {danh sách biến} — bổ sung hồ sơ trước khi gửi" | E-? |
| Chọn mẫu chưa duyệt | "Mẫu này chưa được duyệt — chỉ mẫu đã duyệt mới gửi được" | E-? |
| Biến ngoài whitelist | "Biến {tên} không nằm trong danh sách trường được phép dùng trong email" | E-? |
| Người nhận không hợp lệ | "Người nhận {tên} không có email hợp lệ trong hồ sơ" | E-? |
| Địa chỉ ngoài hồ sơ chưa xác nhận | "Địa chỉ này không có trong hồ sơ — xác nhận bạn muốn gửi tới {địa chỉ}" | E-? |
| Vượt giới hạn batch | "Một lần gửi tối đa 200 người nhận — chia nhỏ danh sách" | E-? |
| Chưa cấu hình SMTP | "Chưa có cấu hình email — liên hệ admin để thiết lập trước khi gửi" | E-? |
| Email FAILED hết retry | "Email tới {địa chỉ} gửi thất bại sau 3 lần thử: {lý do}" | E-? |
| Test connection lỗi | "Không kết nối được máy chủ email: {lý do} — kiểm tra lại cấu hình" | E-? |
| Không có quyền gửi hàng loạt | "Bạn không có quyền gửi email hàng loạt" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Lưu nháp mẫu | "Đã lưu bản nháp mẫu email" |
| Gửi duyệt mẫu | "Đã gửi mẫu cho người duyệt" |
| Duyệt mẫu | "Mẫu email đã được duyệt và sẵn sàng sử dụng" |
| Gửi thử | "Đã gửi email thử tới {địa chỉ} — kiểm tra hòm thư trước khi gửi thật" |
| Gửi đơn | "Email đã được đưa vào hàng chờ gửi tới {người nhận}" |
| Gửi hàng loạt | "Đã gửi {x}/{n} email — xem nhật ký để biết chi tiết" |
| Test connection OK | "Kết nối máy chủ email thành công" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Preview bulk | "Sẽ gửi tới {n} người — {y} người bị loại: {lý do}" |
| Người nhận trùng | "Đã gộp {n} địa chỉ trùng trong danh sách gửi" |
| Mẫu có phiên bản mới | "Mẫu này vừa có phiên bản mới được duyệt — email sau sẽ dùng bản mới" |
| Người duyệt yêu cầu chỉnh | "Mẫu cần chỉnh: {ghi chú của người duyệt}" |
| Batch có lỗi | "{x} email gửi thất bại — lọc nhật ký FAILED để xử lý" |
| Email thử | "Đây là email gửi thử từ {tổ chức} — nội dung như người nhận thật sẽ thấy" |
| Empty state mẫu | "Chưa có mẫu email nào — tạo mẫu đầu tiên để bắt đầu gửi" |

## 8. Assumptions

- SMTP/provider email do admin cấu hình trong feature này (không phụ thuộc
  sẵn có ngoài); credential chỉ nằm phía server, mã hóa.
- Người nhận nghiệp vụ (ứng viên, nhân sự) có email trong hồ sơ do
  `cv-intake`/`employee-profiles`/`account-access` quản lý.
- Whitelist trường được phép làm biến do owner nghiệp vụ + DPO duyệt; mặc
  định chỉ trường liên hệ/lịch/trạng thái công khai trong quy trình.
- Eligibility gate của bulk dùng tiêu chí ngữ cảnh nghiệp vụ có sẵn (vòng
  tuyển, trạng thái, vị trí) — không phải bộ lọc tự do tùy ý.
- Mọi người gửi/duyệt có vai trò do `org-governance` cấp; quyền "gửi hàng
  loạt" tách riêng quyền "gửi đơn".
- `contextual-notifications` đã có để báo kết quả batch/FAILED cho người
  gửi; nếu chưa thì fallback hiển thị trực tiếp trong log.
- Retry/SLA/bounce/fallback theo đề xuất chung của OQ-10 sản phẩm — chưa
  phải cam kết cuối.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Gửi sai người (nhầm ứng viên/địa chỉ cũ) | thỉnh thoảng | lộ thông tin tuyển dụng, mất uy tín với ứng viên (R-08/R-12) | recipient resolve từ hồ sơ + preview bắt buộc + xác nhận riêng cho địa chỉ ngoài |
| Gửi sai phiên bản mẫu (bản cũ/lỗi) | thỉnh thoảng | ứng viên nhận thông tin sai, phải đính chính | chỉ mẫu "Đã duyệt" được gửi; version ghi vào log; ngừng dùng chặn chọn mới |
| Lộ dữ liệu nhạy cảm qua biến/payload | thỉnh thoảng | vi phạm privacy, khiếu nại ứng viên/nhân viên | whitelist biến, chặn trường nhạy cảm, audit ai gửi gì |
| Bulk gửi nhầm nhóm đối tượng | hiếm | email hàng loạt tới người không liên quan | eligibility gate bắt buộc + preview danh sách + giới hạn 200/batch + quyền gửi hàng loạt riêng |
| SMTP lỗi/quota → email nghiệp vụ fail hàng loạt | hiếm | ứng viên miss lịch/offer, HR không biết | retry + FAILED báo người gửi + dead-letter resend + fallback kênh khác |
| Gửi trùng do retry/double submit | thỉnh thoảng | người nhận nhận 2 email giống nhau, thiếu chuyên nghiệp | khóa idempotent batch+recipient |
| Mẫu lỗi được duyệt rồi dùng hàng loạt | thỉnh thoảng | lỗi lan ra nhiều người nhận | test-send trước, preview, ngừng dùng nhanh, audit người duyệt |
| Credential SMTP lộ khi đọc cấu hình | hiếm | bị dùng gửi email giả mạo | mã hóa server-side, không trả plaintext, audit truy cập cấu hình (reverse FR-PL-04) |

## 10. Success Criteria (preliminary)

- Tỷ lệ email nghiệp vụ giao thành công (SENT/DELIVERED) — target chốt
  theo OQ-10 sản phẩm.
- 100% email gửi ra có delivery log đủ (mẫu + phiên bản, người nhận, người
  gửi, trạng thái).
- 100% email dùng mẫu "Đã duyệt"; 0 email gửi từ mẫu chưa duyệt.
- 0 email chứa trường ngoài whitelist; 0 incident gửi sai người do nhập
  tay chưa xác nhận.

## 11. Open Questions

- [x] OQ-1: Ai là người duyệt mẫu hợp lệ — admin, HR lead hay cả hai?
  — Resolved (đề xuất): HR lead hoặc admin có quyền "duyệt mẫu" do
  `org-governance` gán — chờ Product owner xác nhận.
- [x] OQ-2: SLA, retry, idempotency, bounce và fallback cho email?
  — Resolved (đề xuất): retry 5 phút/30 phút/2 giờ → FAILED dead-letter;
  idempotent theo batch+recipient; bounce ghi trạng thái + báo người gửi;
  fallback thủ công (resend sau sửa địa chỉ hoặc ghi nhận liên hệ kênh
  khác) — chờ Technical/Operations owner (PRD OQ-10, OQ-PL-03).
- [x] OQ-3: Bulk send giới hạn và eligibility gate định nghĩa thế nào?
  — Resolved (đề xuất): tối đa 200 người nhận/batch; eligibility theo
  tiêu chí ngữ cảnh nghiệp vụ + preview bắt buộc — chờ Product owner.
- [x] OQ-4: Email v1 có đính kèm file không? — Resolved (đề xuất):
  không, để giảm rủi ro payload — chờ Product owner nếu có nhu cầu
  offer/contract đính kèm.
- [x] OQ-5: Retention email log và consent người nhận? — Resolved (đề
  xuất): log giao nhận giữ theo audit policy; nội dung email render chỉ
  giữ siêu dữ liệu + snapshot tối thiểu — chờ DPO/legal (PRD OQ-6).
- [x] OQ-6: Whitelist trường được phép làm biến do ai duyệt? — Resolved
  (đề xuất): owner nghiệp vụ đề nghị, DPO/legal duyệt nhóm trường nhạy
  cảm bị cấm — chờ DPO/legal.
- [x] OQ-7: SMTP key rotation và quy trình khôi phục credential? —
  Resolved (đề xuất): rotation thủ công qua màn cấu hình có audit; lộ
  credential → thu hồi, đổi key mới, rà log gửi — chờ Technical/Operations
  owner (OQ-PL-02).
- [x] OQ-8: Địa chỉ nhập tay ngoài hồ sơ có được phép? — Resolved (đề
  xuất): được nhưng bắt buộc xác nhận riêng + audit, không dùng cho bulk
  — chờ Product owner.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd operational-email` — capture user perspective
- `/brd operational-email` — business case
- `/prd-epic operational-email` — product scope
