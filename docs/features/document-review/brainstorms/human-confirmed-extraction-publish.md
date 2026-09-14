---
type: brainstorm
feature: document-review
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/document-intake/srs/document-intake-spec.md, docs/_reverse/knowledge-and-question-bank/reverse-spec.md]
---

# Trích xuất có confidence và xác nhận trước khi publish — document-review

## 1. Idea Seed

Khi một file đã qua cổng tiếp nhận và được xử lý, hệ thống bóc tách text
bằng OCR (ưu tiên tiếng Việt) và trích xuất các field có cấu trúc, mỗi
field kèm confidence và vị trí nguồn trên tài liệu gốc. Một reviewer (HR
hoặc người được giao) mở màn review: nhìn thấy tài liệu gốc và từng field
đề xuất, sửa những chỗ đọc sai, xác nhận từng field hoặc toàn bộ, rồi
publish — chỉ từ lúc này dữ liệu mới được coi là fact và đẩy sang module
nghiệp vụ (cv-intake, document-library, hồ sơ...). Không field nào tự
ghi đè hồ sơ nghiệp vụ khi chưa qua review của con người.

## 2. Context

Đây là feature thứ hai của theme Document AI và thuộc 15 capability `Must`
của lát cắt v1 (PRD Mục 6.1, 7.18). `document-intake` đã chốt phần cổng
vào: file hợp lệ được lưu, processing job có trạng thái, output được bàn
giao cho module đích. Phần còn thiếu — và là phần rủi ro nhất — là biến
output OCR/trích xuất thành dữ liệu đáng tin: OCR tiếng Việt dễ sai dấu,
sai số, sai ngày tháng; nếu kết quả đọc máy được đẩy thẳng vào hồ sơ ứng
viên hay thư viện nguồn thì sai sót trở thành fact (rủi ro R-05 của PRD:
"OCR/source data sai thành fact"). Nguồn ITBAAI đã có nền document
pipeline (extraction job, provenance, human approval — reverse spec
`knowledge-and-question-bank`) chứng minh khả năng triển khai, chưa phải
bằng chứng nhu cầu. Người tiêu thụ trực tiếp của kết quả đã xác nhận là
`cv-intake` (facts ứng viên), `document-library` (text nguồn đã duyệt) và
sau đó `ai-question-generation`. Chỉ số đo liên quan: M-IN-03 của PRD —
"tỷ lệ field extraction đề xuất được HR giữ nguyên".

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR (reviewer chính) | Phải nhập tay lại toàn bộ thông tin từ file scan; sợ tin kết quả OCR mà không kiểm được | Màn đối chiếu ảnh/tài liệu gốc với field đề xuất, sửa nhanh chỗ sai, xác nhận rồi publish |
| Reviewer được giao (không phải người tải) | Không biết file nào đang chờ mình review, không có hàng chờ rõ | Hàng chờ review theo file đã xử lý xong, có trạng thái |
| Admin | Job xử lý xong nhưng không ai review → tài liệu "treo" giữa đường | Thấy backlog review, gán/reassign reviewer |
| Module tiêu thụ (cv-intake, document-library) | Nhận dữ liệu chưa rõ đã được con người kiểm chứng chưa | Chỉ nhận payload đã publish kèm provenance |
| Người trong tài liệu (ứng viên/nhân viên) | Dữ liệu của mình bị ghi sai vì OCR | (gián tiếp) facts về mình được con người xác nhận trước khi dùng |

## 4. Capabilities Breakdown

### P0 — must have

- Nhận output đã xử lý xong từ `document-intake` (file + job hoàn tất) và
  tạo một kết quả trích xuất (extraction) ở trạng thái "Chờ review".
- OCR text đầy đủ của tài liệu, ưu tiên tiếng Việt, giữ cấu trúc dòng/
  đoạn/bảng; phần không đọc được được đánh dấu thay vì đoán bừa.
- Trích xuất field có cấu trúc theo loại tài liệu đã xác nhận ở intake
  (vd CV: họ tên, liên hệ, kinh nghiệm; giấy tờ: số, ngày, nơi cấp) —
  danh sách field mục tiêu theo loại tài liệu là cấu hình nghiệp vụ.
- Mỗi field kèm: giá trị đề xuất, điểm confidence, vị trí nguồn (trang/
  vùng trên tài liệu gốc) để reviewer nhảy tới evidence.
- Màn review đối chiếu: một bên là tài liệu gốc (ảnh/PDF), một bên là
  danh sách field; field confidence thấp được tô nổi và sắp lên đầu.
- Sửa field trong màn review; giữ cả giá trị máy đề xuất lẫn giá trị sau
  sửa để có diff và đo mức chỉnh sửa (M-IN-03).
- Xác nhận field (từng field hoặc "xác nhận tất cả còn lại" sau khi đã
  rà soát); field bắt buộc theo loại tài liệu phải được xác nhận hoặc
  điền thủ công trước khi publish.
- Publish: khi đủ điều kiện, đóng gói kết quả đã xác nhận kèm provenance
  (file nguồn, phiên bản engine/model, ai xác nhận, khi nào) đẩy sang
  module đích; publish có bản ghi và không tự động lặp lại.
- Hàng chờ review: danh sách tài liệu "Chờ review"/"Đang review" theo
  ngữ cảnh và người được giao; báo người được giao khi có việc.
- Trả về xử lý lại: reviewer có thể đánh dấu "trích xuất không dùng
  được" để tạo yêu cầu xử lý lại (job mới) thay vì sửa tay toàn bộ.
- Audit: ai xác nhận field nào, sửa gì, publish khi nào, sang module nào.

### P1 — should have

- Gán reviewer cho tài liệu chờ review (admin hoặc tự phân theo ngữ
  cảnh); nhắc khi chờ quá ngưỡng.
- Chạy lại trích xuất trên cùng file khi engine/model đổi — tạo kết quả
  mới, giữ kết quả cũ và vết review đã có.
- So sánh giữa hai lần trích xuất (diff giữa extraction cũ và mới).
- Bộ lọc hàng chờ theo loại tài liệu, độ confidence trung bình, ngữ cảnh.

### P2 — nice to have

- Gợi ý giá trị field từ dữ liệu đã có trong hệ thống (vd mã ứng viên
  đã tồn tại) để reviewer chọn thay vì gõ.
- Thống kê chất lượng trích xuất theo loại tài liệu/engine để tinh chỉnh
  cấu hình field và ngưỡng confidence.
- Học từ sửa của reviewer để cải thiện trích xuất sau (cần owner duyệt).

## 5. Core Flows (Happy Path)

### 5.1 Nhận output → review → xác nhận → publish

1) `document-intake` đánh dấu job hoàn tất và bàn giao file + ngữ cảnh
   (FR-document-intake-014); hệ thống tạo kết quả trích xuất "Chờ review"
   và đưa vào hàng chờ của reviewer phù hợp.
2) Reviewer mở tài liệu từ hàng chờ: thấy tài liệu gốc, text OCR và
   danh sách field đề xuất kèm confidence; field thấp-confidence nổi bật.
3) Reviewer rà từng field: bấm vào field → tài liệu gốc nhảy tới vùng
   nguồn; giữ nguyên nếu đúng, sửa nếu sai, điền tay nếu máy bỏ sót.
4) Khi đủ field bắt buộc đã xác nhận → reviewer bấm "Xác nhận và đưa vào
   sử dụng" → hệ thống chốt kết quả, publish sang module đích, ghi audit.
5) Module đích (vd cv-intake) nhận payload đã xác nhận + provenance; file
   chuyển trạng thái "Đã publish" trong danh sách.

```
document-intake            document-review                     Module đích
─────────────────────────────────────────────────────────────────────────────
Job DONE + file            Kết quả trích xuất "Chờ review"
        │                         │
        └────── bàn giao ────────▶│
                                  ▼
                    ┌─────────────────────────────┐
                    │ Reviewer mở màn đối chiếu:  │
                    │ tài liệu gốc ↔ field đề xuất│
                    │ + confidence + vùng nguồn   │
                    └──────────────┬──────────────┘
                                   ▼
                    ── Field đúng? ──┐
                       │             │
                     Sai ▼         Đúng ▼
                   sửa giá trị   xác nhận field
                   (giữ cả hai   (ghi ai, khi nào)
                    bản để diff)      │
                       └──────────────┘
                                   ▼
              ── Đủ field bắt buộc đã xác nhận? ──┐
                 │                                │
               Chưa ▶ ở "Đang review",           Có ▼
               reviewer tiếp tục        "Đã xác nhận" → Publish
                                                 │
                                                 ▼
                              Payload + provenance ──▶ cv-intake /
                              (engine, người xác      document-library
                               nhận, diff)
```

### 5.2 Trích xuất không dùng được → xử lý lại

1) Reviewer thấy kết quả nhiễu (ảnh mờ, sai loại tài liệu, engine đọc
   hỏng) → chọn "Yêu cầu xử lý lại" kèm lý do.
2) Hệ thống giữ kết quả hiện tại ở trạng thái "Chờ xử lý lại", tạo job
   xử lý mới trên cùng file qua `document-intake`.
3) Kết quả mới về → tạo extraction mới "Chờ review"; reviewer tiếp tục
   trên bản mới, bản cũ vẫn truy vết được.
4) Nếu đã xử lý lại quá số lần cho phép → báo admin, cho đường nhập tay
   hoàn toàn (tất cả field ở trạng thái "điền thủ công").

### 5.3 Publish sang module đích

1) Khi publish, hệ thống kiểm module đích theo ngữ cảnh file (CV →
   cv-intake; tài liệu nguồn → document-library).
2) Gói payload: các field đã xác nhận + text đầy đủ đã duyệt + provenance
   (file, job, engine/model version, reviewer, thời điểm).
3) Ghi publish event; nếu module đích không nhận được (lỗi kỹ thuật) →
   giữ trạng thái "Chờ publish", báo người vận hành, cho gửi lại — không
   để kết quả "mất" sau khi reviewer đã xác nhận.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Field có confidence dưới ngưỡng cảnh báo? | Tô nổi + đưa lên đầu danh sách, bắt buộc reviewer nhìn vào trước khi xác nhận | Hiển thị bình thường, reviewer vẫn xác nhận từng field |
| D2 | 5.1 | Đủ field bắt buộc đã xác nhận khi bấm publish? | Cho publish, đóng gói payload + provenance | Chặn publish, liệt kê field bắt buộc còn thiếu/chưa xác nhận |
| D3 | 5.1 | Reviewer sửa giá trị field? | Giữ giá trị máy đề xuất + giá trị đã sửa, đánh dấu field "đã sửa", đưa vào diff | Chỉ xác nhận giữ nguyên |
| D4 | 5.2 | Kết quả trích xuất dùng được để review? | Reviewer làm việc bình thường | "Yêu cầu xử lý lại" kèm lý do → job mới |
| D5 | 5.2 | Đã xử lý lại quá số lần cho phép (đề xuất 2)? | Báo admin, mở chế độ nhập tay toàn bộ field | Tạo job xử lý lại tiếp |
| D6 | 5.3 | Module đích nhận publish thành công? | Ghi publish event, trạng thái "Đã publish" | Giữ "Chờ publish", báo vận hành, cho gửi lại |
| D7 | 5.1 | Reviewer mở tài liệu đang có người khác review? | Cảnh báo "đang được {người} review", chọn xem-only hoặc nhận lại khi được nhả | Mở bình thường |
| D8 | 5.1 | File bị rút/cách ly lại ở intake khi đang review? | Khóa màn review, báo reviewer, không cho publish | Không ảnh hưởng |

### 6.2 Scenario Matrix

| Vai trò | Chờ review | Đang review (của mình) | Đang review (của người khác) | Đã publish | Chờ xử lý lại |
|---|---|---|---|---|---|
| HR/reviewer được giao | xem, nhận review | xem/sửa/xác nhận/publish/trả xử lý lại | xem-only (cảnh báo) | xem + provenance | xem lý do |
| HR khác (cùng phạm vi) | xem | xem-only | xem-only | xem | xem |
| Admin | xem, gán reviewer | xem, reassign | xem, reassign | xem | xem, đẩy job, mở nhập tay |
| Người tải file | xem trạng thái | xem trạng thái | xem trạng thái | xem kết quả theo quyền | xem trạng thái |

### 6.3 State Transitions

```
kết quả trích xuất:
  chờ-review → đang-review → đã-xác-nhận → đã-publish
       │           │             │
       │           ▼             ▼ (module đích lỗi)
       │      chờ-xử-lý-lại   chờ-publish → (gửi lại) → đã-publish
       │           │
       └───────────┘ (kết quả mới về → extraction mới ở chờ-review)
đang-review → chờ-review (reviewer nhả/nhường hoặc reassign)
field: đề-xuất → đã-xác-nhận
       đề-xuất → đã-sửa → đã-xác-nhận
       đề-xuất → điền-thủ-công → đã-xác-nhận
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| kết quả trích xuất | — | chờ-review | output job được bàn giao | — |
| kết quả trích xuất | chờ-review | đang-review | reviewer mở/nhận | có (nhả về chờ-review) |
| kết quả trích xuất | đang-review | đã-xác-nhận | reviewer xác nhận đủ field bắt buộc | không |
| kết quả trích xuất | đã-xác-nhận | đã-publish | module đích nhận thành công | không |
| kết quả trích xuất | đã-xác-nhận | chờ-publish | gửi sang module đích thất bại | có (gửi lại) |
| kết quả trích xuất | chờ-publish | đã-publish | gửi lại thành công | không |
| kết quả trích xuất | đang-review/chờ-review | chờ-xử-lý-lại | reviewer "Yêu cầu xử lý lại" | có (bản mới về → chờ-review) |
| field | đề-xuất | đã-xác-nhận | reviewer xác nhận không sửa | — |
| field | đề-xuất | đã-sửa | reviewer nhập giá trị khác | — |
| field | đã-sửa | đã-xác-nhận | reviewer xác nhận bản sửa | — |
| field | đề-xuất | điền-thủ-công | máy không đề xuất, reviewer tự điền | — |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Reviewer đóng trình duyệt giữa lúc review | field đã xác nhận/sửa đã lưu; kết quả ở "đang-review" | Mở lại tiếp tục từ field chưa xác nhận | Hết phiên thì nhả về "chờ-review" cho người khác nhận |
| Provider OCR lỗi giữa job | job thất bại ở intake, không có output để review | Không tạo kết quả review; theo luồng retry của document-intake | — |
| Publish thất bại (module đích down) | kết quả "đã-xác-nhận" → "chờ-publish" | Gửi lại thủ công/tự động, idempotent — không publish trùng | Báo vận hành nếu quá ngưỡng |
| 2 reviewer cùng mở 1 tài liệu | người đầu giữ phiên review | người sau xem-only + cảnh báo | Reassign bởi admin |
| File bị cách ly/rút ở intake khi đang review | kết quả bị khóa, không publish | Nếu file được giải phóng → mở lại; nếu bị xóa → đánh dấu hủy | Giữ audit của phần đã review |

### 6.5 Other Edge Cases

- Tài liệu không có text (ảnh trắng, scan hỏng): kết quả trích xuất rỗng
  nhưng vẫn vào hàng chờ với cờ "không đọc được nội dung" — reviewer
  quyết định nhập tay hoặc yêu cầu xử lý lại/tải lại file.
- Loại tài liệu ở intake bị chọn sai → field mục tiêu không khớp nội
  dung: reviewer đổi loại tài liệu trong màn review (ghi nhận thay đổi)
  để hệ thống nạp đúng bộ field, hoặc trả xử lý lại.
- Field lặp (nhiều mục kinh nghiệm trong CV): mỗi lần lặp là một nhóm
  field riêng, reviewer thêm/bớt nhóm thủ công.
- Người tải file và reviewer là một người: được phép (quy mô pilot nhỏ),
  nhưng bản ghi provenance vẫn tách vai trò "người tải" và "người xác
  nhận" để audit.
- Nội dung nhạy cảm trong field (số định danh, lương): hiển thị theo
  quyền trên ngữ cảnh; người xem-only không thấy phần bị hạn chế.
- Empty state hàng chờ: "Không có tài liệu nào chờ review" + gợi ý kiểm
  tra danh sách file đang xử lý ở intake.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Giá trị field đã sửa | không rỗng với field bắt buộc; tôn trọng kiểu dữ liệu của field (ngày, số, danh sách) |
| Field bắt buộc theo loại tài liệu | phải có giá trị và ở trạng thái đã xác nhận trước khi publish |
| Lý do "Yêu cầu xử lý lại" | bắt buộc, tối đa 500 ký tự |
| Đổi loại tài liệu trong review | chỉ chọn trong danh sách loại đã công bố của intake; ghi nhận thay đổi |
| Số nhóm field lặp | tối đa 20 nhóm mỗi tài liệu (đề xuất) |
| Reassign reviewer | chỉ admin hoặc reviewer đang giữ; ghi lý do |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Ngưỡng confidence cảnh báo | 0,70 | mỗi field | field tô nổi, đưa lên đầu hàng review (đề xuất — OQ-1) |
| Số lần xử lý lại tối đa | 2 | mỗi tài liệu | báo admin, mở nhập tay (đề xuất — OQ-2) |
| Hàng chờ hiển thị | 50 tài liệu/trang | — | phân trang + lọc |
| Thời gian giữ phiên "đang-review" không hoạt động | 60 phút | mỗi phiên | nhả về "chờ-review" (đề xuất — OQ-3) |
| Nhắc tài liệu chờ review | 1 ngày làm việc | mỗi tài liệu | thông báo người được giao + admin (đề xuất — OQ-3) |
| Số lần gửi lại publish | 3 | mỗi kết quả | báo admin xử lý tay (đề xuất — OQ-4) |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Publish khi thiếu field bắt buộc | "Chưa thể đưa vào sử dụng — còn {n} field bắt buộc chưa xác nhận: {danh sách field}" | E-? |
| Field bắt buộc bị bỏ trống | "Field {tên} là bắt buộc — điền giá trị hoặc đánh dấu không có trong tài liệu" | E-? |
| Tài liệu đang được người khác review | "Tài liệu đang được {người} review — bạn chỉ có thể xem" | E-? |
| Publish thất bại | "Chưa gửi được kết quả sang {module} — hệ thống sẽ giữ trạng thái chờ gửi, không mất dữ liệu đã xác nhận" | E-? |
| File bị khóa từ intake | "File nguồn đang bị khóa/cách ly — tạm dừng review tài liệu này" | E-? |
| Hết lượt xử lý lại | "Đã xử lý lại {n} lần không cải thiện — chuyển sang nhập thủ công hoặc liên hệ admin" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Xác nhận một field | "Đã xác nhận field {tên}" |
| Publish thành công | "Đã đưa {n} field vào sử dụng — kết quả đã gửi sang {module}" |
| Yêu cầu xử lý lại | "Đã ghi nhận yêu cầu xử lý lại — tài liệu sẽ quay lại hàng chờ khi có kết quả mới" |
| Sửa field | "Đã lưu chỉnh sửa — giá trị gốc của máy vẫn được giữ để đối chiếu" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Field confidence thấp | "Field này máy đọc chưa chắc — kiểm tra vùng tô sáng trên tài liệu" |
| Phần không đọc được | "Đoạn này không đọc được — điền thủ công nếu cần" |
| Nhả review | "Bạn đã nhường tài liệu này về hàng chờ — người khác có thể nhận review" |
| Empty state hàng chờ | "Không có tài liệu nào chờ review — các file đang xử lý sẽ xuất hiện ở đây khi xong" |
| Provenance | "Trích xuất bởi {engine/phiên bản} từ \"{file}\" — xác nhận bởi {người} lúc {thời điểm}" |

## 8. Assumptions

- Output của `document-intake` bàn giao đủ thông tin: file, ngữ cảnh,
  loại tài liệu đã xác nhận, job id — document-review không tự suy ngữ
  cảnh.
- Danh sách field mục tiêu theo loại tài liệu là cấu hình nghiệp vụ do
  owner công bố (vd CV có bộ field riêng); v1 chỉ cần vài loại phổ biến
  (CV, giấy tờ định danh, tài liệu nguồn text).
- Reviewer là người dùng nội bộ có quyền trên ngữ cảnh của file; vai trò
  "reviewer" được gán qua `org-governance` giống mô hình question-bank.
- Engine OCR/trích xuất là dependency có provider ngoài; bản spec chỉ
  yêu cầu hỗ trợ tiếng Việt + trả confidence + vùng nguồn — việc chọn
  provider và chính sách gửi file PII ra ngoài chờ quyết định (OQ-13
  PRD, OQ-6 spec).
- Giá trị confidence là thang 0–1 do engine trả; ngưỡng 0,70 và các giới
  hạn ở Mục 7.2 là đề xuất thận trọng cần owner chốt (OQ-1).
- Một tài liệu tại một thời điểm chỉ có một phiên review hoạt động; sửa
  đồng thời được chặn bằng khóa phiên thay vì merge.
- Field "đã xác nhận" trong một phiên vẫn có thể mở lại sửa trước khi
  publish; sau publish là bất biến (muốn đổi → luồng sửa ở module đích).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| OCR/extraction sai nhưng được xác nhận bởi quá trình (reviewer bấm qua) | thường | facts sai vào hồ sơ ứng viên/thư viện — quyết định tuyển trên dữ liệu sai (R-05) | field confidence thấp bắt buộc nhìn vùng nguồn; "xác nhận tất cả" chỉ sau khi đã rà field bắt buộc; đo mức sửa trung bình (M-IN-03) |
| Reviewer tin máy quá mức — không ai thực sự đối chiếu | thỉnh thoảng | review trở thành hình thức, mất giá trị human-in-the-loop | provenance bắt buộc; đo tỷ lệ field giữ nguyên vs sửa — bất thường 100% giữ nguyên là tín hiệu kiểm tra |
| Hàng chờ review nghẽn vì thiếu người được giao | thường | tài liệu "treo" giữa intake và module đích, chậm pipeline tuyển | nhắc sau 1 ngày, admin thấy backlog và reassign |
| Provider OCR ngoài nhận file chứa PII khi chính sách chưa duyệt | thỉnh thoảng | vi phạm privacy gate, phải dừng dùng dữ liệu thật | chặn theo OQ-13/OQ-6: chỉ file không nhạy cảm/synthetic tới provider ngoài khi chưa duyệt; fallback nội bộ cho phần còn lại |
| Publish trùng/lặp sang module đích khi retry | hiếm | facts trùng trong hồ sơ nghiệp vụ | publish idempotent theo kết quả + module đích; trạng thái "chờ-publish" rõ ràng |
| Ngưỡng field bắt buộc quá nặng → reviewer bỏ qua bằng cách điền đại | thỉnh thoảng | dữ liệu rác mang nhãn "đã xác nhận" | bộ field tối thiểu theo loại; theo dõi tỷ lệ điền-thủ-công bất thường |
| File nguồn bị rút/xóa sau khi đã publish | hiếm | payload không còn evidence gốc để đối chiếu | provenance giữ tham chiếu + bản text đã duyệt; retention file chờ OQ-6 sản phẩm |

## 10. Success Criteria (preliminary)

- Tỷ lệ field được extraction đề xuất mà reviewer giữ nguyên (M-IN-03)
  — con số mục tiêu chờ OQ-2 sản phẩm; baseline xác lập trong pilot.
- 100% payload publish ra module đích đều có reviewer + provenance đầy
  đủ; 0 field tự ghi vào hồ sơ khi chưa xác nhận.
- Thời gian trung bình một tài liệu ở hàng chờ review ≤ 1 ngày làm việc
  (đề xuất).
- Mức chỉnh sửa trung bình mỗi field được đo và giảm dần theo phiên bản
  engine (định hướng, không cam kết con số).

## 11. Open Questions

- [x] OQ-1: Ngưỡng confidence để tô nổi/ưu tiên field là bao nhiêu —
  Resolved (đề xuất): 0,70 cho cờ cảnh báo, vẫn cho xác nhận sau khi
  nhìn vùng nguồn — chờ Document AI owner xác nhận.
- [x] OQ-2: Tối đa bao nhiêu lần "xử lý lại" trước khi chuyển nhập tay —
  Resolved (đề xuất): 2 lần, sau đó admin quyết định — chờ Document AI
  owner xác nhận.
- [x] OQ-3: SLA nhắc/giữ phiên review — Resolved (đề xuất): nhắc sau 1
  ngày làm việc, nhả phiên sau 60 phút không hoạt động — chờ Operations
  owner xác nhận.
- [x] OQ-4: Publish sang module đích — đồng bộ hay qua hàng chờ; giới
  hạn gửi lại — Resolved (đề xuất): publish có trạng thái "chờ-publish"
  + gửi lại tối đa 3 lần idempotent — chờ Technical owner xác nhận.
- [x] OQ-5: Ai được gán làm reviewer cho một loại tài liệu — Resolved
  (đề xuất): người dùng nội bộ có quyền trên ngữ cảnh, admin phân công;
  mặc định người tải nếu không cấu hình — chờ Admin lead xác nhận.
- [x] OQ-6: Chính sách gửi file chứa PII tới provider OCR bên ngoài và
  mức che/lọc bắt buộc — Resolved (đề xuất): khi chưa có duyệt, chỉ file
  không nhạy cảm/synthetic được gửi provider ngoài; file PII dùng engine
  nội bộ hoặc chờ — chờ DPO/legal xác nhận (PRD OQ-13, R-16).
- [x] OQ-7: Retention của text trích xuất, vùng nguồn và diff review —
  Resolved (đề xuất): gắn vòng đời với file nguồn ở intake, xóa cùng
  chính sách retention file — chờ DPO/legal (PRD OQ-6).

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd document-review` — capture user perspective
- `/brd document-review` — business case
- `/prd-epic document-review` — product scope
