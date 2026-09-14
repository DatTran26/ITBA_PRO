---
type: brainstorm
feature: question-bank
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md]
---

# Ngân hàng câu hỏi có kiểm duyệt — question-bank

## 1. Idea Seed

Một kho câu hỏi tập trung của tổ chức: mỗi câu hỏi được phân loại theo kỹ
năng, topic, trình độ, loại câu và nguồn gốc; câu hỏi phải qua bước review
của con người trước khi được dùng trong bài đánh giá; mọi câu hỏi giữ được
provenance (ai tạo, từ nguồn nào, thuộc phiên bản nào) và đáp án không bao
giờ lộ ra ngoài phạm vi được cấp.

## 2. Context

HR và interviewer hiện soạn câu hỏi rải rác trong file Word/Excel cá nhân
hoặc soạn trực tiếp vào từng bài test — câu hỏi trùng lặp, không biết câu
nào đã được ai duyệt, đáp án dễ bị lộ khi gửi file qua email, và không thể
tái sử dụng có kiểm soát giữa các đợt tuyển. Nguồn ITBAAI hiện đã có nền
question bank (CRUD, bulk import, provenance qua schema riêng) — đây là
bằng chứng triển khai, chưa phải bằng chứng nhu cầu. Feature này là nền của
toàn bộ lát cắt assessment: `assessment-authoring` lấy câu hỏi từ đây,
`ai-question-generation` đổ câu hỏi đã duyệt vào đây, và `employee-evaluation`
về sau cũng dùng chung. Nếu ngân hàng câu hỏi không có review/status thì mọi
bài đánh giá phát hành đều mang rủi ro câu lỗi hoặc lộ đáp án.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Câu hỏi nằm rải rác trong file cá nhân, không biết câu nào đã duyệt, hay trùng | Một kho duy nhất: tìm theo kỹ năng/trình độ, biết trạng thái duyệt |
| Interviewer | Soạn câu cho phiên/bài nhưng không có kho dùng lại, phải viết lại | Lấy câu đã approved theo kỹ năng cần đánh giá |
| Reviewer (business owner mảng) | Không có kênh duyệt câu hỏi chính thức; câu sai vẫn vào bài | Hàng chờ review rõ ràng + quyền approve/reject có ghi nhận |
| Admin | Không kiểm soát được taxonomy và ai được đổi đáp án | Quản lý taxonomy, phân quyền, truy vết thay đổi |
| Ứng viên / người làm bài | Câu hỏi lỗi, đáp án lộ làm kết quả sai lệch | Bài làm từ câu đã qua kiểm duyệt, không thấy đáp án |

## 4. Capabilities Breakdown

### P0 — must have

- CRUD câu hỏi đầy đủ: tạo, xem, sửa, xóa (xóa có kiểm soát — câu đã được
  dùng trong bài đã phát hành thì chuyển sang "ngừng dùng" thay vì xóa hẳn).
- Phân loại theo taxonomy của tổ chức: kỹ năng, topic, trình độ, loại câu
  (trắc nghiệm một đáp án / nhiều đáp án / đúng-sai / tự luận), và độ khó
  do con người gán.
- Tìm kiếm và lọc: theo từ khóa trong nội dung, kỹ năng, topic, trình độ,
  loại câu, trạng thái review, nguồn.
- Luồng review: câu hỏi mới/sửa lớn ở trạng thái chờ duyệt; reviewer
  approve hoặc reject kèm ghi chú; chỉ câu "đã duyệt" mới được kéo vào bài
  đánh giá.
- Source reference/provenance trên mỗi câu: nguồn (soạn tay / import / AI
  sinh từ tài liệu nào), người tạo, người duyệt, phiên bản.
- Đáp án và giải thích chỉ hiển thị cho vai trò được cấp; người làm bài
  không bao giờ thấy qua bất kỳ surface nào.
- Version: mỗi lần sửa câu đã duyệt tạo phiên bản mới, giữ lịch sử phiên
  bản để truy vết bài đánh giá đã dùng câu ở phiên bản nào.

### P1 — should have

- Bulk import câu hỏi từ file (CSV/Excel theo mẫu) có kiểm tra từng dòng,
  báo lỗi theo dòng, dòng lỗi không chặn dòng hợp lệ.
- Phát hiện trùng/near-duplicate khi tạo hoặc import: cảnh báo câu gần
  giống để người tạo quyết định.
- Thống kê tái sử dụng: câu nào được dùng trong bao nhiêu bài, lần cuối
  dùng — để phát hiện câu "chết" hoặc câu bị lạm dụng (lộ đáp án qua lặp).
- Đánh dấu câu yêu thích/thường dùng của từng người.

### P2 — nice to have

- Marketplace/chia sẻ câu hỏi giữa các tổ chức — ngoài phạm vi v1 (PRD
  "Chưa làm").
- Độ khó thực nghiệm: suy ra từ thống kê chấm (`assessment-grading`) thay
  vì chỉ gán tay.
- Đề xuất gộp câu trùng theo AI sau khi đủ dữ liệu sử dụng.

## 5. Core Flows (Happy Path)

### 5.1 Tạo câu hỏi → review → approve → sẵn sàng dùng

1) HR/interviewer vào "Ngân hàng câu hỏi" → "Thêm câu hỏi" → chọn loại câu
   → nhập nội dung, đáp án/lựa chọn, giải thích, gán kỹ năng/topic/trình
   độ.
2) Lưu: câu ở trạng thái "Bản nháp"; người tạo bấm "Gửi duyệt" → câu
   chuyển "Chờ review" và xuất hiện trong hàng chờ của reviewer.
3) Reviewer mở câu → xem nội dung + đáp án + phân loại + cảnh báo trùng
   (nếu có) → "Duyệt" hoặc "Yêu cầu chỉnh" kèm ghi chú.
4) Câu được duyệt chuyển "Đã duyệt" → xuất hiện khi `assessment-authoring`
   chọn câu hỏi.
5) Sửa câu đã duyệt: sửa nhỏ (chính tả, format) giữ trạng thái; sửa lớn
   (đổi nội dung/đáp án/trình độ) → tạo phiên bản mới ở "Chờ review", phiên
   bản cũ vẫn "Đã duyệt" cho tới khi bản mới được duyệt.

```
Người soạn                    Hệ thống                       Reviewer
─────────────────────────────────────────────────────────────────────────────
Tạo câu hỏi + phân loại
        │
        ▼
   "Bản nháp" ── chỉnh tự do ──┐
        │                       │
        ▼ "Gửi duyệt"           │
   "Chờ review"                 │
        │                       │
        ▼                       ▼
              ┌─────────────────────────────────┐
              │ Reviewer xem nội dung + đáp án  │
              │ + phân loại + cảnh báo trùng    │
              └───────────────┬─────────────────┘
                              ▼
                 ── Đồng ý duyệt? ──┐
                    │               │
                  Có ▼            Không ▼
             "Đã duyệt"      "Chờ review" + ghi chú
             (kéo vào bài     yêu cầu chỉnh → người
              đánh giá được)   soạn sửa → gửi lại
                    │
                    ▼
        Sửa lớn sau khi duyệt → phiên bản mới
        "Chờ review"; bản cũ vẫn "Đã duyệt"

Câu lỗi/hết dùng ──▶ "Ngừng dùng": ẩn khỏi chọn câu,
 bài đã phát hành trước đó giữ nguyên phiên bản đã dùng.
```

### 5.2 Tìm và chọn câu hỏi đưa vào bài đánh giá

1) Trong `assessment-authoring`, người tạo bài mở "Chọn từ ngân hàng" →
   lọc theo kỹ năng/trình độ/loại/trạng thái (mặc định chỉ hiện "Đã duyệt").
2) Chọn câu → câu được tham chiếu vào bài kèm phiên bản hiện tại; bài ghi
   nhận danh sách câu đã chọn.
3) Nếu câu đang chọn sau đó bị "Ngừng dùng" hoặc có phiên bản mới được
   duyệt → bài đã phát hành giữ nguyên snapshot; bài còn nháp thì hiện
   cảnh báo để người tạo cập nhật.

### 5.3 Bulk import câu hỏi

1) HR tải file theo mẫu → hệ thống kiểm tra từng dòng (đủ trường, loại câu
   hợp lệ, phân loại tồn tại, cảnh báo trùng).
2) Báo kết quả theo dòng: dòng hợp lệ tạo câu ở "Bản nháp" (nguồn: import),
   dòng lỗi liệt kê lý do để sửa file tải lại.
3) Câu import vẫn phải qua review như câu soạn tay — import không bypass
   kiểm duyệt.

### 5.4 Ngừng dùng câu hỏi

1) Câu sai/hết giá trị → người có quyền đánh dấu "Ngừng dùng" kèm lý do.
2) Câu ẩn khỏi mọi danh sách chọn; các bài đã phát hành giữ snapshot câu
   đã dùng; bản ghi câu vẫn xem được lịch sử để truy vết.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Câu có phiên bản gần giống đã tồn tại (trùng)? | Cảnh báo + cho người tạo xem câu trùng, quyết định tạo mới hay dùng câu cũ | Cho lưu bình thường |
| D2 | 5.1 | Reviewer đồng ý duyệt? | "Đã duyệt", có thể kéo vào bài | Ở "Chờ review" + ghi chú yêu cầu chỉnh |
| D3 | 5.1 | Sửa câu đã duyệt là "sửa lớn" (nội dung/đáp án/trình độ)? | Tạo phiên bản mới "Chờ review" | Sửa nhỏ: giữ "Đã duyệt", ghi phiên bản phụ |
| D4 | 5.2 | Câu trong bài nháp bị "Ngừng dùng" hoặc có bản mới được duyệt? | Cảnh báo trên bài nháp, chặn phát hành nếu câu ngừng dùng | Không làm gì với bài đã phát hành |
| D5 | 5.3 | Dòng import hợp lệ? | Tạo câu "Bản nháp" nguồn import | Ghi lỗi theo dòng, không tạo |
| D6 | 5.4 | Câu đã được dùng trong bài đã phát hành? | Chỉ cho "Ngừng dùng", chặn xóa | Cho xóa hẳn |
| D7 | tất cả | Người xem có quyền thấy đáp án/giải thích? | Hiển thị đáp án + giải thích | Chỉ hiện nội dung câu, ẩn phần đáp án |

### 6.2 Scenario Matrix

| Vai trò | Câu bản nháp của mình | Câu chờ review | Câu đã duyệt | Câu ngừng dùng |
|---|---|---|---|---|
| HR/interviewer (người tạo) | xem/sửa/gửi duyệt/xóa | xem, sửa theo ghi chú | xem (đáp án theo quyền), sửa → tạo phiên bản mới | xem lịch sử |
| Reviewer | — | xem + duyệt/yêu cầu chỉnh | xem, có thể đề xuất ngừng dùng | xem |
| Admin | xem/sửa mọi câu | xem + duyệt | xem/sửa/ngừng dùng | xem/khôi phục |
| Người làm bài | — | — | chỉ thấy nội dung trong bài, KHÔNG thấy đáp án | — |

### 6.3 State Transitions

```
câu hỏi: bản-nháp → chờ-review → đã-duyệt → ngừng-dùng
              ↑          │            │
              └──────────┘            │ (sửa lớn → phiên bản mới → chờ-review)
              (yêu cầu chỉnh)         │
đã-duyệt ── ngừng-dùng ──(khôi phục)──▶ chờ-review
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| câu hỏi | — | bản-nháp | tạo mới hoặc import | — |
| câu hỏi | bản-nháp | chờ-review | người tạo "Gửi duyệt" | — |
| câu hỏi | chờ-review | đã-duyệt | reviewer "Duyệt" | — |
| câu hỏi | chờ-review | chờ-review | reviewer "Yêu cầu chỉnh" → người tạo sửa gửi lại | có (lặp) |
| câu hỏi | đã-duyệt | chờ-review | phiên bản mới từ sửa lớn được duyệt thay thế bản cũ | có |
| câu hỏi | đã-duyệt/chờ-review/bản-nháp | ngừng-dùng | người có quyền đánh dấu ngừng kèm lý do | có (khôi phục → chờ-review) |
| câu hỏi | bản-nháp | (xóa hẳn) | chưa dùng trong bài nào | không |
| phiên bản câu hỏi | — | hiệu lực | được duyệt | không (bất biến sau khi bài đã dùng) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Người tạo đóng trình duyệt giữa lúc soạn | câu "Bản nháp" đã lưu lần cuối (hoặc mất phần chưa lưu) | mở lại câu nháp tiếp tục | nháp không ai mở quá lâu vẫn giữ |
| Import file lớn, ngắt giữa chừng | job import có trạng thái; dòng đã xử lý đã ghi | báo kết quả theo dòng đã xử lý; tải lại file chạy lại phần lỗi | job thất bại → trạng thái lỗi + log |
| 2 người cùng sửa 1 câu | bản lưu sau ghi đè | cảnh báo "câu vừa được {người} cập nhật — tải lại" | không merge tự động |
| Câu bị "Ngừng dùng" khi đang nằm trong bài nháp ai đó đang soạn | bài nháp giữ tham chiếu | khi phát hành bài → chặn + cảnh báo câu ngừng dùng | người tạo bài thay câu |
| Reviewer mở câu chờ duyệt nhưng người tạo vừa sửa lại | reviewer đang xem bản cũ | khi reviewer bấm duyệt → kiểm phiên bản, cảnh báo nếu đã đổi | — |

### 6.5 Other Edge Cases

- Câu hỏi thuộc kỹ năng/topic bị đổi tên hoặc gỡ khỏi taxonomy: câu giữ
  nguyên nhưng hiện cảnh báo "phân loại không còn hợp lệ" để gán lại.
- Empty state: tổ chức chưa có câu nào → gợi ý tạo câu đầu tiên hoặc import.
- Câu tự luận không có đáp án đúng cố định: vẫn bắt buộc "hướng dẫn chấm"
  thay đáp án, để `assessment-grading` có căn cứ cho chấm tay.
- Xóa câu chưa từng dùng nhưng đã từng được duyệt: vẫn cho xóa nhưng giữ
  vết trong audit (ai xóa, nội dung cuối).
- Câu của người đã nghỉ việc: dữ liệu giữ nguyên; admin quyết định chuyển
  ownership hoặc ngừng dùng hàng loạt.
- Tìm kiếm theo từ khóa trúng phần đáp án: chỉ trả kết quả cho người có
  quyền xem đáp án; người không có quyền chỉ tìm trên nội dung câu.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Nội dung câu hỏi | bắt buộc, không rỗng, tối đa 2.000 ký tự |
| Loại câu | bắt buộc; 1 trong: trắc nghiệm một đáp án, trắc nghiệm nhiều đáp án, đúng/sai, tự luận |
| Lựa chọn (trắc nghiệm) | 2–10 lựa chọn; một đáp án: đúng 1 đáp án đúng; nhiều đáp án: ≥1 đáp án đúng |
| Đáp án đúng | bắt buộc với câu khách quan; câu tự luận bắt buộc "hướng dẫn chấm" |
| Giải thích | tùy chọn, tối đa 2.000 ký tự |
| Kỹ năng | bắt buộc ≥1, chọn từ taxonomy `talent-framework` của tổ chức |
| Trình độ | bắt buộc; 1 trong 6 mức: intern, fresher, junior, mid, senior, lead (thống nhất với `assessment-templates`) |
| Topic | tùy chọn, tối đa 10 topic mỗi câu |
| Gửi duyệt | chỉ khi đủ trường bắt buộc của loại câu |
| File import | định dạng theo mẫu công bố; mỗi dòng kiểm tra độc lập |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Độ dài nội dung câu | 2.000 ký tự | — | chặn lưu, báo số ký tự vượt |
| Số lựa chọn trắc nghiệm | 2–10 | mỗi câu | chặn lưu khi <2 hoặc >10 |
| Số topic mỗi câu | 10 | — | chặn gán thêm |
| Dung lượng file import | 5 MB | mỗi file | từ chối file, báo giới hạn |
| Số dòng file import | 500 dòng | mỗi file | từ chối file, gợi ý chia nhỏ |
| Kết quả tìm kiếm hiển thị | 50 câu/trang | — | phân trang |
| Số phiên bản giữ lại mỗi câu | không giới hạn (audit) | — | — |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Thiếu trường bắt buộc khi gửi duyệt | "Vui lòng điền đủ thông tin bắt buộc trước khi gửi duyệt: {danh sách field}" | E-? |
| Câu trắc nghiệm thiếu đáp án đúng | "Câu trắc nghiệm cần ít nhất một đáp án đúng" | E-? |
| File import vượt giới hạn | "File vượt quá 5 MB hoặc 500 dòng — chia nhỏ file rồi tải lại" | E-? |
| Dòng import lỗi | "Dòng {n}: {lý do} — dòng này chưa được tạo" | E-? |
| Xóa câu đã dùng trong bài đã phát hành | "Câu hỏi đã được dùng trong bài đánh giá đã phát hành — chỉ có thể ngừng dùng" | E-? |
| Không có quyền xem đáp án | "Bạn không có quyền xem đáp án của câu hỏi này" | E-? |
| Phát hành bài có câu ngừng dùng | "Bài có {n} câu đã ngừng dùng — thay câu trước khi phát hành" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Lưu bản nháp | "Đã lưu bản nháp câu hỏi" |
| Gửi duyệt | "Đã gửi câu hỏi cho người duyệt" |
| Duyệt câu | "Câu hỏi đã được duyệt và sẵn sàng dùng trong bài đánh giá" |
| Import xong | "Đã tạo {x}/{n} câu hỏi từ file — {y} dòng lỗi cần kiểm tra" |
| Ngừng dùng | "Câu hỏi đã ngừng dùng — các bài đã phát hành không bị ảnh hưởng" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Cảnh báo trùng | "Có {n} câu hỏi gần giống đã tồn tại — xem trước khi tạo mới" |
| Reviewer yêu cầu chỉnh | "Câu hỏi cần chỉnh: {ghi chú của người duyệt}" |
| Câu có phiên bản mới | "Câu này vừa có phiên bản mới được duyệt — cập nhật bài nháp nếu cần" |
| Sửa đồng thời | "Câu hỏi vừa được {người} cập nhật — tải lại để xem bản mới nhất" |
| Empty state | "Chưa có câu hỏi nào — tạo câu đầu tiên hoặc nhập từ file mẫu" |
| Nguồn câu hỏi | "Nguồn: {soạn thủ công, nhập từ file hoặc sinh bởi AI từ \"{tài liệu}\"} — tạo bởi {người}, duyệt bởi {người}" |

## 8. Assumptions

- Taxonomy kỹ năng/trình độ do `talent-framework`/`org-governance` cung
  cấp; question-bank chỉ tham chiếu, không tự định nghĩa kỹ năng.
- Reviewer là vai trò nghiệp vụ trong tổ chức (business owner mảng hoặc
  HR lead), được gán quyền bởi `org-governance` — giống mô hình reviewer
  của `assessment-templates`.
- Câu hỏi là tài sản nội bộ của tổ chức: mọi câu thuộc 1 tổ chức, không
  chia sẻ giữa tổ chức trong v1.
- Câu từ `ai-question-generation` vào ngân hàng đều đi qua cùng luồng
  review — nguồn khác nhau nhưng trạng thái giống nhau.
- Phiên bản câu được tham chiếu bởi bài đã phát hành là bất biến (snapshot
  tại thời điểm phát hành thuộc `assessment-authoring`/`candidate-assessment`).
- Giới hạn số liệu ở Mục 7.2 là giá trị đề xuất thận trọng (file mẫu,
  độ dài text) — cần owner chốt, ghi Assumption vì nguồn chỉ chứng minh
  CRUD + bulk import + provenance chứ chưa chốt ngưỡng.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Đáp án bị lộ (search, export, share màn hình, cache) → gian lận bài đánh giá | thỉnh thoảng | kết quả tuyển/đánh giá sai lệch, mất uy tín quy trình | deny-by-default trên phần đáp án; tìm kiếm không quét vùng đáp án cho người thiếu quyền; audit ai xem đáp án |
| Câu trùng lặp tích lũy làm kho nhiễu, HR chọn nhầm câu cũ | thường | bài đánh giá kém chất lượng, mất thời gian dọn kho | cảnh báo near-duplicate khi tạo/import; thống kê tái sử dụng; trạng thái ngừng dùng |
| Không ai thực sự review — câu chưa duyệt vẫn lọt vào bài | thỉnh thoảng | câu lỗi đi thẳng tới ứng viên, complaint chất lượng | chỉ câu "Đã duyệt" mới chọn được; hàng chờ review có owner |
| Taxonomy phân tán (mỗi người tự gõ kỹ năng) → lọc vô nghĩa | thường | không tìm được câu, tái sử dụng thất bại | gán từ taxonomy chung, chặn nhập tự do; ai duyệt taxonomy là OQ (PRD OQ-11) |
| Tài liệu nguồn thay đổi nhưng câu vẫn trỏ bản cũ | thỉnh thoảng | câu hỏi lệch chuẩn tài liệu hiện hành (rủi ro R-11 của PRD) | provenance theo phiên bản nguồn; báo khi nguồn có bản mới được duyệt |
| Migration/import dữ liệu cũ sai định dạng → hàng loạt câu lỗi | thỉnh thoảng | phải dọn tay, trễ lịch pilot | validate theo dòng, file mẫu công bố, giới hạn dung lượng |

## 10. Success Criteria (preliminary)

- Tỷ lệ câu hỏi "Đã duyệt" được tái sử dụng hợp lệ trong ≥1 bài đánh giá
  — mục tiêu theo PRD Mục 7.19; con số chờ OQ-2 của PRD sản phẩm.
- 100% câu được dùng trong bài phát hành đều ở trạng thái "Đã duyệt" và có
  provenance đầy đủ.
- Tỷ lệ câu trùng được phát hiện trước khi lưu — đo qua cảnh báo near-
  duplicate được xác nhận.
- 0 sự cố lộ đáp án cho người không có quyền (guardrail, bám M-GR-01).

## 11. Open Questions

- [ ] OQ-1: Ai là reviewer hợp lệ cho câu hỏi — admin, HR lead, hay
  business owner từng mảng kỹ năng? (liên quan OQ-11 PRD và OQ-KB-01 của
  reverse spec)
- [ ] OQ-2: Ngưỡng "sửa lớn" buộc tạo phiên bản mới chờ review — chỉ đổi
  nội dung/đáp án/trình độ, hay cả đổi kỹ năng/topic?
- [ ] OQ-3: Cơ chế phát hiện trùng v1 là gì — trùng tuyệt đối theo nội
  dung, hay near-duplicate (và ai chốt ngưỡng "gần giống")? (OQ-KB-03)
- [ ] OQ-4: Khi tài liệu nguồn (mà câu AI sinh ra trỏ tới) có phiên bản
  mới được duyệt, câu hỏi hiện có bị đánh dấu "cần rà soát" tự động hay
  chỉ hiện cảnh báo cho owner? (R-11 PRD, OQ-9 PRD)
- [ ] OQ-5: Định dạng file mẫu bulk import (cột nào bắt buộc) do ai công
  bố và version file mẫu quản lý thế nào?
- [ ] OQ-6: Retention cho câu hỏi đã ngừng dùng/xóa — giữ bao lâu cho
  audit và truy vết bài cũ? (OQ-KB-02, OQ-6 PRD)
- [ ] OQ-7: Các giới hạn Mục 7.2 (2.000 ký tự, 10 lựa chọn, 500 dòng/5 MB)
  có được owner chấp nhận làm chuẩn v1 không?

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd question-bank` — capture user perspective
- `/brd question-bank` — business case
- `/prd-epic question-bank` — product scope
