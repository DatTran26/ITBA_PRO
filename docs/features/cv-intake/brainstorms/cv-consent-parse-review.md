---
type: brainstorm
feature: cv-intake
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_product/roadmap.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md, docs/_reverse/recruitment-and-interviews/gaps.md]
---

# Tiếp nhận CV có consent, trích xuất có xác nhận — cv-intake

## 1. Idea Seed

Một đầu vào thống nhất cho hồ sơ ứng viên: CV đến từ nhiều kênh (HR tải
lên, ứng viên tự nộp qua form, sau này là integration), mỗi CV đều kèm
consent và provenance rõ ràng; hệ thống trích xuất dữ liệu thành đề xuất có
confidence và vị trí nguồn trong file, HR xác nhận/sửa trước khi trở thành
facts của hồ sơ ứng viên; CV xác nhận xong tạo application vào vị trí đang
mở. CV không bao giờ bị kẹt ở trạng thái đang xử lý vô thời hạn, và không
thu thập dữ liệu từ nguồn không có consent.

## 2. Context

HR hiện nhận CV qua email/Zalo rồi nhập tay thông tin ứng viên vào hệ thống
hoặc sheet — mất thời gian, dễ sai, không rõ CV đến từ đâu và ứng viên đã
đồng ý xử lý dữ liệu chưa. Nguồn ITBAAI đã có pipeline upload CV
(PDF/DOCX tối đa 10 MB, tạo person + application, phân tích bằng AI) — bằng
chứng triển khai, chưa phải bằng chứng nhu cầu, và reverse spec ghi nhận ba
khiếm khuyết trực tiếp: CV có thể kẹt ở PROCESSING sau lỗi (GAP-RC-03),
trùng person/application chỉ dò theo email (GAP-RC-06), và điểm AI dưới
ngưỡng đang tự đẩy application sang rejected (xung đột invariant
human-in-the-loop ở PRD Mục 12). Feature này là đầu vào của toàn bộ lát cắt
tuyển dụng v1: `candidate-matching`, `candidate-pipeline`,
`interview-management` đều chỉ chạy đúng khi facts ứng viên đã được con
người xác nhận. Roadmap xếp `cv-intake` ở Now để vá nhánh kẹt PROCESSING;
đây cũng là cửa ngõ consent đầu tiên của dữ liệu ứng viên nên phụ thuộc
chính sách retention/consent (OQ-6 PRD) — trước khi policy được duyệt chỉ
dùng dữ liệu synthetic (PRD Mục 9).

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR/Recruiter | Nhận CV qua nhiều kênh rời, nhập tay vào hệ thống, không biết CV nào đã xử lý | Một cửa tiếp nhận có trạng thái rõ; trích xuất sẵn để chỉ xác nhận, không gõ lại |
| Ứng viên | Nộp CV qua email không rõ ai đọc, dữ liệu bị dùng thế nào | Form nộp rõ ràng, biết mục đích xử lý và đồng ý có ghi nhận |
| Reviewer/HR lead | Dữ liệu parse sai đi thẳng vào hồ sơ như fact | Hàng chờ review: thấy file gốc + đề xuất + confidence, sửa trước khi xác nhận |
| Quản lý | Không biết CV đang kẹt ở đâu, bao nhiêu CV chưa xử lý | Trạng thái và backlog rõ ràng, cảnh báo CV kẹt/lỗi |
| Admin/DPO nominee | CV chứa PII, consent/retention chưa rõ | Mọi CV có consent + provenance; rút consent và retention theo policy |

## 4. Capabilities Breakdown

### P0 — must have

- Tiếp nhận CV 2 kênh: HR tải lên trong app (có thể nhiều file một lần) và
  ứng viên tự nộp qua form công khai gắn một vị trí đang mở.
- Consent bắt buộc: ứng viên nộp phải đồng ý mục đích xử lý + phiên bản
  chính sách hiện hành, ghi thời điểm và kênh; HR tải hộ phải khai báo
  nguồn (ví dụ: ứng viên gửi email, giới thiệu nội bộ) và xác nhận đã có
  chấp thuận — không có consent/provenance hợp lệ thì từ chối tiếp nhận.
- Kiểm tra file: chỉ PDF/DOCX, tối đa 10 MB mỗi file (xác nhận từ nguồn
  ITBAAI), file phải mở/đọc được; file lỗi bị từ chối kèm lý do.
- Xử lý có trạng thái: mỗi CV đi qua `Chờ xử lý → Đang xử lý → Chờ xác
  nhận → Đã xác nhận`, nhánh lỗi `Thất bại` có thể thử lại — không có
  trạng thái treo vô thời hạn (vá GAP-RC-03).
- Trích xuất đề xuất: tách CV thành field có cấu trúc (liên hệ, học vấn,
  kinh nghiệm, kỹ năng, chứng chỉ), mỗi field kèm confidence và vị trí
  nguồn trong file để đối chiếu.
- Review của con người: HR thấy file gốc cạnh field đề xuất, sửa/xác nhận
  từng field hoặc xác nhận hàng loạt; chỉ sau xác nhận mới ghi vào hồ sơ
  ứng viên — mọi field giữ provenance (AI đề xuất hay con người sửa).
- Dò trùng người: trùng email/định danh với person đã có → cảnh báo và HR
  quyết định gộp vào hồ sơ cũ hay tạo mới (vá GAP-RC-06).
- Tạo application: sau khi xác nhận, tạo application ở trạng thái mới gắn
  vị trí đang mở, ghi history nguồn tiếp nhận.
- Thiếu dữ liệu: field bắt buộc thiếu hoặc confidence thấp được đánh dấu;
  HR bổ sung trước khi tạo application.
- Audit: ai tải/nộp, ai sửa, ai xác nhận, khi nào — truy vết được.

### P1 — should have

- Retry xử lý có giới hạn + chuyển sang nhập tay khi parse thất bại hẳn:
  CV vẫn giữ file gốc, HR nhập field thủ công rồi xác nhận bình thường.
- Cảnh báo CV kẹt/quá hạn review cho owner và quản lý (qua
  `contextual-notifications`).
- Gửi xác nhận đã nhận hồ sơ cho ứng viên khi nộp qua form (template của
  `operational-email`/`contextual-notifications`).
- Lọc hàng chờ review theo vị trí, kênh nguồn, mức confidence thấp.
- Ứng viên rút consent → đánh dấu và kích hoạt quy trình xử lý theo policy
  retention (chi tiết chờ OQ-6 PRD).

### P2 — nice to have

- Kênh integration (form ngoài, webhook từ job board) — bị chặn bởi
  `external-integrations` chưa chọn provider (roadmap Later).
- Parse CV ảnh/scan — thuộc `document-intake`/`document-review` +
  `vision-ocr` khi tích hợp được duyệt.
- Đề xuất vị trí phù hợp cho CV không gắn vị trí (pool) — cần
  `candidate-matching`.
- Đo chất lượng parser theo phiên bản model để quyết định nâng cấp
  (liên quan M-IN-03).

## 5. Core Flows (Happy Path)

### 5.1 HR tải CV → trích xuất → xác nhận → tạo application

1) HR mở "Tiếp nhận CV" → chọn vị trí đang mở (hoặc để "chưa gán vị trí")
   → kéo 1 hoặc nhiều file PDF/DOCX → khai báo nguồn và xác nhận ứng viên
   đã đồng ý chia sẻ hồ sơ.
2) Hệ thống kiểm tra file; file hợp lệ tạo bản ghi CV ở `Chờ xử lý` kèm
   provenance (người tải, kênh, nguồn khai báo, thời điểm).
3) Bộ xử lý chuyển CV sang `Đang xử lý` → trích xuất field kèm confidence
   và vị trí nguồn → chuyển `Chờ xác nhận`, đưa vào hàng chờ review.
4) HR mở review: file gốc bên trái, field đề xuất bên phải; sửa sai, điền
   field thiếu, xác nhận.
5) Xác nhận xong: facts ghi vào hồ sơ ứng viên (tạo person mới hoặc gộp
   hồ sơ cũ nếu chọn gộp), CV chuyển `Đã xác nhận`, application mới được
   tạo ở trạng thái đầu pipeline và ghi history.

```
HR/Ứng viên                 Hệ thống                          Bộ xử lý CV
────────────────────────────────────────────────────────────────────────────
Nộp CV + khai báo nguồn
   (consent/ đồng ý)
        │
        ▼
  Kiểm tra file ── không hợp lệ ──▶ Từ chối + lý do
        │ hợp lệ                                    (giữ nguyên, cho nộp lại)
        ▼
   "Chờ xử lý" ──────────────────────────────▶ lấy job
        │                                          │
        │                                          ▼
        │                                     "Đang xử lý"
        │                                          │
        │                      ┌─── lỗi/timeout ───┤
        │                      ▼                   ▼
        │                 "Thất bại"          trích xuất field
        │                 (còn lượt          + confidence
        │                  thử lại)                │
        │                      │                   ▼
        │                      └── thử lại ──▶ "Chờ xác nhận"
        │                                          │
        ▼                                          ▼
                    ┌──────────────────────────────────────┐
                    │ HR review: file gốc + field đề xuất  │
                    │ field thiếu/confidence thấp được đánh│
                    │ dấu; trùng person → cảnh báo gộp     │
                    └──────────────────┬───────────────────┘
                                       ▼
                          ── HR xác nhận đủ field? ──┐
                             │                       │
                           Có ▼                     Không ▼
                     "Đã xác nhận"              lưu sửa đổi,
                     facts vào hồ sơ            giữ "Chờ xác nhận"
                     + tạo application          để xử lý tiếp
```

### 5.2 Ứng viên tự nộp qua form

1) Ứng viên mở link nộp hồ sơ của một vị trí đang mở → đọc thông tin mục
   đích xử lý dữ liệu → tick đồng ý → điền thông tin liên hệ tối thiểu →
   tải CV → gửi.
2) Hệ thống ghi consent (mục đích, phiên bản chính sách, thời điểm, kênh
   form), kiểm tra file, tạo CV `Chờ xử lý` với provenance "form ứng viên".
3) Ứng viên nhận xác nhận đã nộp; CV đi tiếp vào hàng chờ trích xuất và
   review như kênh HR — không có đường tắt bỏ qua review của con người.

### 5.3 Xử lý CV kẹt hoặc lỗi

1) CV ở `Đang xử lý` quá ngưỡng thời gian hoặc bước xử lý trả lỗi → hệ
   thống chuyển `Thất bại`, ghi lý do, còn lượt thử lại.
2) HR bấm "Thử lại" → CV về `Chờ xử lý`, tăng bộ đếm lần thử.
3) Hết lượt thử → CV giữ `Thất bại`, mở chế độ nhập tay: HR đọc file gốc,
   nhập field, xác nhận như bình thường — application vẫn tạo được, ghi
   provenance "nhập tay".

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1/5.2 | File hợp lệ (đúng PDF/DOCX, ≤10 MB, đọc được)? | Tạo bản ghi CV `Chờ xử lý` | Từ chối file, báo lý do, không tạo bản ghi |
| D2 | 5.2 | Ứng viên đã đồng ý điều khoản xử lý dữ liệu? | Ghi consent rồi nhận CV | Chặn nộp — không tiếp nhận hồ sơ |
| D3 | 5.1 | HR khai báo nguồn và xác nhận có chấp thuận của ứng viên? | Nhận file, ghi provenance nguồn | Chặn hoặc đánh dấu "thiếu consent" chờ bổ sung |
| D4 | 5.1/5.3 | Trích xuất thành công? | `Chờ xác nhận` + đưa vào hàng chờ | `Thất bại` + lý do; còn lượt thì cho thử lại |
| D5 | 5.3 | CV `Đang xử lý` quá ngưỡng thời gian? | Chuyển `Thất bại` (timeout), báo owner | Tiếp tục chờ trong ngưỡng |
| D6 | 5.1 | Phát hiện person trùng định danh (email)? | Cảnh báo + HR chọn gộp vào hồ sơ cũ | Tạo person mới bình thường |
| D7 | 5.1 | Đủ field bắt buộc và HR xác nhận? | Ghi facts + tạo application | Giữ `Chờ xác nhận`, liệt kê field còn thiếu |
| D8 | 5.1 | Vị trí đích còn mở tuyển và còn headcount? | Tạo application vào vị trí | Cảnh báo vị trí đã đóng/đủ — HR chọn vị trí khác hoặc để hồ sơ ở pool |
| D9 | 5.3 | Đã hết lượt thử lại? | Mở chế độ nhập tay (manual fallback) | Cho "Thử lại" |

### 6.2 Scenario Matrix

| Kênh nộp | Consent/provenance | Kết quả tiếp nhận |
|---|---|---|
| HR tải lên | Có khai báo nguồn + xác nhận chấp thuận | Nhận, provenance "HR tải — {nguồn}" |
| HR tải lên | Chưa khai báo nguồn | Chặn tại form, yêu cầu bổ sung trước khi nhận |
| Form ứng viên | Tick đồng ý điều khoản | Nhận, ghi consent đầy đủ |
| Form ứng viên | Không tick đồng ý | Không cho gửi — nút gửi vô hiệu |
| Integration (P2) | Nguồn đã đăng ký consent ở hệ thống ngoài | Nhận nếu contract được duyệt — chờ `external-integrations` |
| Bất kỳ | Ứng viên đã rút consent trước đó | Cảnh báo HR, xử lý theo policy (OQ) |

### 6.3 State Transitions

```
CV: chờ-xử-lý → đang-xử-lý → chờ-xác-nhận → đã-xác-nhận
        ↑          │              │
        │          ▼              │ (HR bổ sung field rồi xác nhận)
        │      thất-bại ──(thử lại, còn lượt)──┘
        │          │
        └──(thử lại)──┘        thất-bại hết lượt → nhập tay → chờ-xác-nhận
đã-xác-nhận → application được tạo (trạng thái đầu pipeline — xem candidate-pipeline)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| CV | — | chờ-xử-lý | file hợp lệ được tiếp nhận | — |
| CV | chờ-xử-lý | đang-xử-lý | bộ xử lý nhận job | — |
| CV | đang-xử-lý | chờ-xác-nhận | trích xuất xong, có field đề xuất | — |
| CV | đang-xử-lý | thất-bại | lỗi xử lý hoặc timeout | có (thử lại → chờ-xử-lý) |
| CV | chờ-xác-nhận | đã-xác-nhận | HR xác nhận đủ field bắt buộc | không (sửa sau bằng chỉnh hồ sơ, có audit) |
| CV | thất-bại | chờ-xác-nhận | HR nhập tay đủ field | — |
| Consent | — | có-hiệu-lực | ứng viên đồng ý / HR khai báo chấp thuận | — |
| Consent | có-hiệu-lực | đã-rút | ứng viên rút qua kênh được công bố | không (ghi nhận, xử lý theo policy) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Ứng viên đóng trình duyệt giữa form | consent chưa ghi, file chưa nhận — không có bản ghi | mở lại link nộp lại từ đầu | không có |
| Upload file lớn bị ngắt mạng | không có bản ghi CV | tải lại file | phần file tạm dọn theo hạn |
| Provider trích xuất timeout/lỗi | CV `Thất bại` + lý do + số lần thử | "Thử lại" → `Chờ xử lý` | hết lượt → mở nhập tay |
| CV kẹt `Đang xử lý` (job rơi) | bản ghi vẫn `Đang xử lý` cũ | giám sát timeout tự chuyển `Thất bại` | vá GAP-RC-03: mọi nhánh lỗi phải reset trạng thái |
| 2 HR cùng mở review 1 CV | bản lưu sau ghi đè field | cảnh báo "CV vừa được {người} cập nhật" | không merge tự động |
| HR xác nhận CV nhưng vị trí vừa đóng | facts đã ghi vào hồ sơ, application chưa tạo | chọn vị trí khác hoặc giữ hồ sơ pool | không mất dữ liệu đã xác nhận |

### 6.5 Other Edge Cases

- File PDF là ảnh scan (không có text layer): trích xuất trả confidence 0
  toàn bộ → CV vẫn tới `Chờ xác nhận` nhưng toàn field trống, gợi ý nhập
  tay; OCR ảnh thuộc `document-review`/`vision-ocr`, không phải v1.
- CV nộp 2 lần cho cùng vị trí: application trùng bị cảnh báo; HR chọn giữ
  bản mới nhất hoặc gộp.
- Ứng viên nộp CV không gắn vị trí (link pool chung): cho vào pool ứng
  viên, chưa tạo application — chính sách pool còn OQ.
- Field bắt buộc tối thiểu để tạo application: họ tên + ít nhất một kênh
  liên hệ (email hoặc điện thoại) — ngưỡng này là giả định, chốt ở OQ.
- CV chứa thông tin nhạy cảm ngoài cần thiết (số định danh, sức khỏe):
  không chủ động trích xuất các field này; nằm trong file gốc vẫn theo
  quyền truy cập hồ sơ.
- Người tải CV là tài khoản đã bị khóa/nghỉ việc: dữ liệu giữ nguyên,
  provenance không đổi.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| File CV | bắt buộc; định dạng PDF hoặc DOCX; ≤10 MB; mở đọc được |
| Vị trí đích | bắt buộc với form ứng viên (link đã gắn vị trí); HR tải được để "chưa gán" |
| Consent ứng viên | bắt buộc tick đồng ý trước khi gửi; ghi mục đích + phiên bản chính sách + thời điểm |
| Nguồn hồ sơ (HR tải) | bắt buộc chọn: ứng viên gửi trực tiếp / giới thiệu nội bộ / đối tác / khác kèm ghi chú |
| Họ tên ứng viên | bắt buộc trước khi xác nhận; không rỗng |
| Liên hệ | bắt buộc ≥1 trong email (định dạng hợp lệ) hoặc số điện thoại trước khi xác nhận |
| Field trích xuất | mỗi field có confidence 0–1 và vị trí nguồn; field sửa tay ghi nguồn "HR" |
| Quyết định gộp trùng | bắt buộc chọn gộp hoặc tạo mới khi có cảnh báo trùng |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Dung lượng file CV | 10 MB | mỗi file | từ chối file, báo giới hạn |
| Định dạng file | PDF, DOCX | — | từ chối, báo định dạng hỗ trợ |
| Số file mỗi lần HR tải | 20 file | mỗi lượt | từ chối phần vượt, báo số file tối đa |
| Thời gian xử lý 1 CV | 10 phút | mỗi lần chạy | timeout → `Thất bại` (Assumption, chốt ở OQ-3) |
| Số lần thử lại xử lý | 3 lần | mỗi CV | hết lượt → chỉ còn nhập tay (Assumption) |
| Ngưỡng confidence "cần kiểm tra" | <0,8 | mỗi field | đánh dấu vàng trong màn review (Assumption) |
| Kết quả hàng chờ review | 50 CV/trang | — | phân trang |
| Retention CV/consent | theo policy | — | chưa chốt — OQ-6 PRD; chỉ synthetic trước khi duyệt |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| File sai định dạng | "Chỉ nhận file PDF hoặc DOCX — kiểm tra lại định dạng file" | E-? |
| File quá lớn | "File vượt quá 10 MB — nén hoặc tải file khác" | E-? |
| File hỏng/không đọc được | "Không đọc được file — thử mở file trên máy rồi tải lại" | E-? |
| Thiếu consent (form) | "Bạn cần đồng ý cho chúng tôi xử lý dữ liệu hồ sơ trước khi gửi" | E-? |
| Thiếu nguồn (HR tải) | "Chọn nguồn nhận hồ sơ và xác nhận ứng viên đã đồng ý chia sẻ" | E-? |
| Xử lý thất bại | "Không trích xuất được dữ liệu từ file này — thử lại hoặc nhập tay" | E-? |
| Hết lượt thử lại | "File đã thử xử lý 3 lần không thành công — chuyển sang nhập tay" | E-? |
| Thiếu field bắt buộc khi xác nhận | "Cần đủ họ tên và ít nhất một liên hệ (email hoặc điện thoại) trước khi xác nhận" | E-? |
| Vị trí đã đóng | "Vị trí này đã đóng tuyển — chọn vị trí khác hoặc giữ hồ sơ trong danh sách chung" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Ứng viên nộp xong | "Đã nhận hồ sơ của bạn — chúng tôi sẽ liên hệ qua thông tin bạn cung cấp" |
| HR tải xong | "Đã tiếp nhận {n} file — đang trích xuất dữ liệu" |
| Xác nhận CV | "Đã xác nhận dữ liệu và tạo hồ sơ ứng viên" |
| Tạo application | "Ứng viên đã vào vị trí {tên vị trí} ở trạng thái Mới" |
| Thử lại | "Đã đưa file vào hàng chờ xử lý lại" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Confidence thấp | "{n} trường có độ tin cậy thấp — kiểm tra kỹ trước khi xác nhận" |
| Trùng ứng viên | "Email này đã có hồ sơ {tên} — gộp vào hồ sơ cũ hay tạo hồ sơ mới?" |
| Consent note | "Ứng viên đồng ý xử lý dữ liệu hồ sơ theo chính sách phiên bản {v} — {thời điểm}" |
| Nhập tay | "File không trích xuất được — bạn đang nhập tay, dữ liệu vẫn được ghi nguồn rõ ràng" |
| Empty state hàng chờ | "Chưa có CV nào chờ xác nhận" |

## 8. Assumptions

- V1 có 2 kênh thật: HR tải trong app và form ứng viên công khai theo vị
  trí; kênh integration chỉ khi `external-integrations` sẵn sàng (roadmap
  Later) — PRD Mục 7.6 nhắc "upload/form/integration" nhưng provider chưa
  chọn.
- Form ứng viên yêu cầu đăng nhập/định danh ngoài consent tick — giả định
  dùng link công khai + captcha tương đương, chính sách chống spam là OQ.
- Field bắt buộc tối thiểu để xác nhận = họ tên + 1 liên hệ; danh sách
  field chuẩn của hồ sơ ứng viên do `employee-profiles`/talent model định
  nghĩa, cv-intake tham chiếu.
- "Tạo application" đặt application ở trạng thái đầu pipeline (`Mới`); mọi
  quyết định sang trạng thái sau (screen/reject) là việc của con người qua
  `candidate-pipeline` — AI chỉ đề xuất, KHÔNG auto-reject (sửa xung đột
  ghi nhận ở reverse spec rule 1, bám invariant PRD Mục 12).
- Ngưỡng timeout 10 phút, retry 3 lần, confidence 0,8, 20 file/lượt là giá
  trị đề xuất thận trọng — nguồn chỉ xác nhận 10 MB + PDF/DOCX
  (FR-RC-01), chưa chốt ngưỡng (OQ-RC-05 reverse spec).
- Consent rút về sau chỉ đánh dấu + theo policy retention — cơ chế xóa/ẩn
  dữ liệu chờ OQ-6 PRD.
- Ứng viên nộp lại CV cho cùng vị trí: giữ nhiều CV trên cùng hồ sơ,
  application tham chiếu CV mới nhất đã xác nhận.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Parse sai (tên, email, kinh nghiệm) được coi là fact | thường | sai thông tin ứng viên, liên hệ sai người, quyết định trên dữ liệu lỗi (R-05 PRD) | bắt buộc review con người; confidence + vị trí nguồn; đo M-IN-03 |
| CV kẹt `Đang xử lý` làm mất đầu vào pipeline | thỉnh thoảng | ứng viên không được xử lý, HR tưởng đã xong | timeout → `Thất bại` + retry + nhập tay; vá GAP-RC-03 là mục tiêu Now |
| Thu thập hồ sơ không có consent → vi phạm bảo vệ dữ liệu | thỉnh thoảng | khiếu nại/pháp lý, mất uy tín (R-04 PRD) | chặn nộp khi thiếu consent; HR phải khai báo nguồn; audit provenance |
| Trùng hồ sơ người (nhiều email/định danh) → ứng viên bị tách rời lịch sử | thường | một người nhiều hồ sơ, đánh giá thiếu ngữ cảnh | cảnh báo trùng + quyết định gộp của con người (GAP-RC-06) |
| Retention/consent policy chưa duyệt (OQ-3/OQ-6 PRD) | thường | không được dùng dữ liệu thật, pilot chậm | chỉ synthetic trước gate; DPO duyệt trước khi bật |
| Form công khai bị spam/file độc hại | thỉnh thoảng | hàng chờ nhiễu, rủi ro bảo mật | chống spam tối thiểu + kiểm file; giới hạn 20 file/lượt kênh HR |
| HR bỏ qua review vì hàng chờ dài | thỉnh thoảng | facts chưa xác nhận vẫn vào pipeline | application chỉ tạo sau `Đã xác nhận`; cảnh báo backlog |

## 10. Success Criteria (preliminary)

- Tỷ lệ CV được HR xác nhận mà không phải nhập lại nhiều — mục tiêu theo
  PRD Mục 7.6; con số chờ OQ-2 PRD sản phẩm.
- M-IN-03: tỷ lệ field được HR giữ nguyên / field extraction đề xuất —
  đo theo phiên bản parser.
- 0 CV ở `Đang xử lý`/`Thất bại` quá SLA mà không có owner hoặc đường xử
  lý (guardrail vá GAP-RC-03).
- 100% CV tiếp nhận có consent/provenance đầy đủ (kênh, nguồn, thời điểm).
- 100% field ghi vào hồ sơ ứng viên có provenance (AI đề xuất / HR sửa /
  nhập tay) và reviewer.

## 11. Open Questions

- [ ] OQ-1: Retention và quy trình rút consent cho CV — giữ bao lâu, rút
  thì xóa/ẩn/đánh dấu, ai là DPO duyệt? (liên quan OQ-6, OQ-3 PRD — giữ
  mở, KHÔNG tự chốt)
- [ ] OQ-2: Ngưỡng timeout và số lần retry cho xử lý CV — 10 phút/3 lần
  đề xuất có được owner chấp nhận? (OQ-RC-05 reverse spec)
- [ ] OQ-3: Field bắt buộc tối thiểu để tạo application — "họ tên + 1
  liên hệ" có đúng chuẩn Head of HR?
- [ ] OQ-4: CV không gắn vị trí (pool chung) — v1 có nhận pool không hay
  mọi CV phải gắn vị trí đang mở? (OQ-RC-04 reverse spec)
- [ ] OQ-5: Form công khai cần chống spam/định danh mức nào (captcha,
  giới hạn nộp theo IP)?
- [ ] OQ-6: Cơ chế dò trùng ngoài email (số điện thoại, tên + ngày sinh) —
  ai chốt bộ định danh khớp? (GAP-RC-06, OQ-RC-04)
- [ ] OQ-7: Consent wording/phiên bản chính sách do ai công bố và version
  hóa thế nào? (owner: DPO/legal nominee)
- [ ] OQ-8: Khi ứng viên rút consent, application đang chạy dừng hay chạy
  tiếp với dữ liệu tối thiểu? (liên quan OQ-6 PRD)

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd cv-intake` — capture user perspective
- `/brd cv-intake` — business case
- `/prd-epic cv-intake` — product scope
