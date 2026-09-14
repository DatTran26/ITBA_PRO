---
type: brainstorm
feature: ai-question-generation
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/knowledge-and-question-bank/reverse-spec.md]
---

# Sinh câu hỏi bám tài liệu có con người duyệt — ai-question-generation

## 1. Idea Seed

Sinh câu hỏi nháp từ một tài liệu nguồn đã được duyệt trong thư viện, theo
topic/kỹ năng/trình độ/loại câu mà người dùng chọn. Mỗi câu sinh ra đều
kèm provenance: tài liệu nào, phiên bản nào, đoạn trích evidence nào, job
nào tạo ra. Con người xem từng câu cùng evidence, sửa nếu cần, rồi chọn
đưa vào ngân hàng hoặc loại kèm lý do — AI không bao giờ tự phát hành câu
hỏi vào ngân hàng. Khi tài liệu nguồn có bản mới, các câu liên quan được
đánh dấu "cần rà soát" thay vì tự đồng bộ.

## 2. Context

HR/interviewer muốn bộ câu hỏi bám sát tài liệu chuẩn của tổ chức (giáo
trình, quy trình, JD) nhưng soạn tay từ tài liệu rất chậm. Nguồn ITBAAI đã
chứng minh pipeline document-source → extract-topics → approve →
generate-questions (reverse spec `knowledge-and-question-bank`, FR-KB-02)
và rule "generated question là draft không đáng tin cho đến khi human
review" — bằng chứng triển khai. Các câu hỏi mở của nguồn cũng là rủi ro
cần đóng: ai approve (OQ-KB-01), retention (OQ-KB-02), trùng/chất lượng
(GAP-KB-04), quota provider (OQ-KB-04).

Feature này là `Should` (PRD Mục 7.20) — slice mở rộng, KHÔNG nằm trong
cam kết v1. Phụ thuộc `document-intake`/`document-review` (tài liệu đã
xử lý, đã duyệt) và `question-bank` (nơi câu được duyệt đổ vào). Rủi ro
chính: hallucination hoặc câu không khớp evidence — vì vậy mỗi câu phải
trỏ được đoạn trích nguồn và luôn qua review của con người trước khi vào
bank (invariant human-in-the-loop, PRD Mục 12). R-11 (tài liệu đổi, câu
vẫn trỏ bản cũ) và OQ-9 (đổi tài liệu thì sync hay review) được xử lý
bằng cờ "cần rà soát" thay vì tự đồng bộ.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR / content editor | Soạn câu từ tài liệu dài rất chậm, dễ lệch chuẩn | Sinh nhanh bộ câu nháp bám tài liệu, chọn lọc đưa vào bank |
| Reviewer | Sợ câu AI bịa/không khớp tài liệu mà vẫn vào bank | Xem từng câu kèm evidence đoạn trích, duyệt/sửa/loại có lý do |
| Admin | Không kiểm soát job AI chạy/chi phí/ai được sinh | Theo dõi job, quota, audit việc sinh và duyệt câu |
| Ứng viên / người làm bài | Câu hỏi AI lỗi, lệch chuẩn tài liệu | (gián tiếp) chỉ gặp câu đã qua hai lớp review của con người |

## 4. Capabilities Breakdown

### P0 — must have

- Chọn nguồn sinh: tài liệu đã duyệt trong `document-library` (chốt đúng
  phiên bản) và/hoặc topic trích xuất từ tài liệu đó.
- Review topic trước khi sinh: topic do AI trích xuất được liệt kê để
  người dùng duyệt/chỉnh/chọn — không sinh trên topic chưa xem.
- Cấu hình job sinh: loại câu, số câu mục tiêu, trình độ, kỹ năng gán sẵn;
  job có trạng thái, tiến độ, lỗi và retry có kiểm soát.
- Khu vực câu nháp sinh ra (staging): nội dung, loại, lựa chọn, đáp án,
  giải thích + evidence (đoạn trích nguồn, vị trí trong tài liệu), phân
  loại đề xuất — mọi câu mặc định "Chờ review".
- Review từng câu: duyệt (đưa vào `question-bank` ở trạng thái "Chờ
  review" — tiếp tục qua luồng duyệt chung), sửa rồi duyệt, hoặc loại kèm
  lý do; cảnh báo câu gần giống đã có trong bank.
- Provenance đầy đủ trên câu được đưa vào bank: nguồn "sinh bởi AI", tài
  liệu + phiên bản + đoạn trích, job, người review, phần đã sửa.
- Cờ "cần rà soát": khi tài liệu nguồn có phiên bản mới được duyệt, câu
  sinh từ bản cũ (kể cả đã vào bank) được đánh dấu để owner rà soát —
  không tự đồng bộ nội dung (OQ-9 PRD).
- Audit: job sinh, quyết định duyệt/loại, sửa trước duyệt đều có vết.

### P1 — should have

- Sinh bổ sung trên cùng cấu hình ("tạo thêm 10 câu nữa") và sinh lại sau
  khi chỉnh cấu hình.
- Thao tác hàng loạt trong staging: loại nhiều câu kèm một lý do, duyệt
  nhiều câu đã kiểm tra; lọc theo job/trạng thái.
- Cảnh báo near-duplicate giữa câu sinh với câu bank hiện có (kế thừa cơ
  chế `question-bank`).
- Thống kê chất lượng job: tỷ lệ duyệt/sửa/loại theo cấu hình để điều
  chỉnh prompt/cấu hình lần sau.

### P2 — nice to have

- Sinh từ nhiều tài liệu gộp hoặc từ topic liên tài liệu.
- Đề xuất taxonomy mới (kỹ năng/topic chưa có) cho owner phê duyệt.
- So sánh chất lượng giữa các lần chạy/cấu hình (A/B).
- Marketplace chia sẻ bộ câu sinh giữa tổ chức — ngoài phạm vi (PRD
  "Chưa làm" ở `question-bank`).

## 5. Core Flows (Happy Path)

### 5.1 Chọn nguồn → review topic → cấu hình → chạy job → nhận câu nháp

1) HR mở "Sinh câu hỏi từ tài liệu" → chọn tài liệu trong
   `document-library` (chỉ tài liệu "Đã duyệt", chốt phiên bản hiện tại).
2) Hệ thống liệt kê topic trích xuất từ tài liệu → HR duyệt/chỉnh/chọn
   topic phạm vi sinh.
3) Cấu hình job: loại câu, số câu mục tiêu, trình độ, kỹ năng → chạy job
   (async, có trạng thái/tiến độ).
4) Job hoàn tất → staging nhận bộ câu nháp "Chờ review" kèm evidence đoạn
   trích; job lỗi → trạng thái lỗi + retry.

```
HR                          Hệ thống                          AI provider
─────────────────────────────────────────────────────────────────────────────
Chọn tài liệu "Đã duyệt"
        │
        ▼
Review topic trích xuất ──▶ liệt kê topic, chờ duyệt/chỉnh
        │ (chọn topic phạm vi)
        ▼
Cấu hình job: loại, số câu,
trình độ, kỹ năng
        │
        ▼ "Chạy"
   job: đang-chạy ──────────▶ gọi provider sinh câu theo topic
        │                            │
        │                       ┌────┴─────┐
        │                    thành công   lỗi/timeout
        │                       │            │
        ▼                       ▼            ▼
   hoàn-tất ◀──────── staging +N câu    trạng thái lỗi
   (staging hiện câu   "Chờ review"     → retry (tối đa)
   "Chờ review"        kèm evidence)    → hết retry: báo lỗi,
                                        giữ cấu hình chạy lại
```

### 5.2 Review câu sinh → đưa vào ngân hàng

1) Reviewer mở staging của job → xem từng câu: nội dung, lựa chọn, đáp
   án, giải thích + đoạn trích evidence + cảnh báo trùng (nếu có).
2) Quyết định từng câu: "Duyệt" / "Sửa rồi duyệt" / "Loại" kèm lý do.
3) Câu duyệt → tạo `QUESTION` trong `question-bank` ở "Chờ review" mang
   nguồn "sinh bởi AI" + provenance đầy đủ → qua luồng duyệt chung của
   bank để thành "Đã duyệt".
4) Câu loại → giữ trong staging với lý do (tham khảo cho lần sinh sau),
   không vào bank.

### 5.3 Tài liệu nguồn có phiên bản mới → rà soát câu

1) `document-library` công bố phiên bản mới của tài liệu đã từng sinh câu.
2) Hệ thống đánh dấu "cần rà soát" trên các câu trỏ bản cũ (staging và câu
   đã vào bank) + thông báo owner.
3) Owner mở danh sách cần rà soát → xem câu cùng diff phiên bản → quyết
   định: giữ (bỏ cờ), sửa theo bản mới (tạo phiên bản câu mới qua luồng
   bank), hoặc ngừng dùng câu.

### 5.4 Job lỗi / chạy lại

1) Job lỗi (provider timeout, output sai định dạng): trạng thái lỗi + lý
   do; câu đã sinh được phần nào giữ nguyên trong staging.
2) Retry: chạy lại toàn job hoặc chỉ phần câu thiếu — không nhân đôi câu
   đã có (idempotent theo job).
3) Hết retry → báo lỗi rõ, giữ cấu hình để chạy lại sau khi provider ổn.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Tài liệu đã "Đã duyệt" và có text trích xuất? | Cho chọn làm nguồn | Không hiện trong danh sách nguồn |
| D2 | 5.1 | Topic đã được người duyệt/chọn phạm vi? | Cho cấu hình job | Chặn chạy job, yêu cầu duyệt topic |
| D3 | 5.1/5.4 | Job gọi provider thành công? | Đổ câu nháp vào staging | Ghi lỗi, cho retry có kiểm soát |
| D4 | 5.2 | Câu có evidence đoạn trích khớp nội dung? | Reviewer tự tin duyệt | Reviewer loại kèm lý do "không khớp nguồn" |
| D5 | 5.2 | Câu gần giống đã có trong bank? | Cảnh báo + reviewer quyết định duyệt hay loại | Duyệt bình thường |
| D6 | 5.2 | Reviewer chọn "Duyệt"? | Tạo QUESTION "Chờ review" trong bank + provenance | "Loại": giữ staging + lý do |
| D7 | 5.3 | Tài liệu nguồn có phiên bản mới được duyệt? | Đánh dấu "cần rà soát" + thông báo owner | Không làm gì |

### 6.2 Scenario Matrix

| Vai trò | Job của mình | Job của người khác | Câu staging chờ review | Câu đã vào bank |
|---|---|---|---|---|
| HR/content editor | tạo/chạy/retry/xem | xem (phạm vi tổ chức) | — | xem theo quyền bank |
| Reviewer | xem | xem | xem + duyệt/sửa/loại | xem |
| Admin | xem/hủy mọi job | xem/hủy | xem + duyệt/sửa/loại | xem |
| Người làm bài | — | — | — | chỉ gặp câu "Đã duyệt" qua bài |

### 6.3 State Transitions

```
generation job: đăng-ký → đang-chạy → hoàn-tất
                       │        └→ lỗi → (retry ≤3) → đang-chạy
                       │             └→ hết retry → thất-bại
                       └→ hủy (admin/owner)
câu sinh (staging): chờ-review → đã-duyệt-đưa-bank (tạo QUESTION chờ-review)
                             → bị-loại (kèm lý do)
câu đã vào bank: theo vòng đời question-bank; khi nguồn đổi bản → cờ cần-rà-soát
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| job | — | đăng-ký | tạo job sau khi chọn nguồn/topic/cấu hình | — |
| job | đăng-ký | đang-chạy | bấm chạy | — |
| job | đang-chạy | hoàn-tất | provider trả đủ câu hợp lệ | — |
| job | đang-chạy | lỗi | provider timeout/output sai | có (retry) |
| job | lỗi | thất-bại | hết retry | không (chạy job mới) |
| job | đăng-ký/đang-chạy | hủy | owner/admin hủy | không |
| câu sinh | — | chờ-review | job hoàn tất đổ staging | — |
| câu sinh | chờ-review | đã-duyệt-đưa-bank | reviewer "Duyệt" (sau khi sửa nếu cần) | không |
| câu sinh | chờ-review | bị-loại | reviewer "Loại" kèm lý do | có (khôi phục về chờ-review — đề xuất) |
| câu trong bank | bình thường | cần-rà-soát | tài liệu nguồn có phiên bản mới được duyệt | có (owner xác nhận giữ/sửa/ngừng) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Người dùng đóng trình duyệt trong khi job đang chạy | job async tiếp tục, staging nhận câu khi xong | mở lại xem trạng thái/staging | không mất job |
| Provider timeout/output sai format giữa job | job trạng thái lỗi + câu đã sinh được phần nào | retry toàn job hoặc phần thiếu | không nhân đôi câu đã có |
| 2 reviewer xử lý cùng staging | quyết định ghi nhận theo người nhanh hơn | người sau thấy "câu đã được {người} xử lý" | không ghi đè quyết định |
| Tài liệu đổi phiên bản trong lúc job đang chạy | job chốt phiên bản nguồn tại thời điểm đăng ký | câu sinh ra trỏ bản cũ → sau đó bị cờ cần-rà-soát | — |
| Câu đã duyệt đưa bank nhưng bank review "yêu cầu chỉnh" | QUESTION ở "Chờ review" + ghi chú | sửa trong bank như câu thường | provenance giữ nguyên |

### 6.5 Other Edge Cases

- Tài liệu chưa duyệt hoặc chưa có text trích xuất (`document-review`
  chưa xong): không xuất hiện trong danh sách nguồn.
- Tài liệu không trích được topic nào: không chạy được job cho đến khi
  topic được duyệt/tạo thủ công — cho phép sinh theo toàn văn với cảnh
  báo phạm vi rộng (đề xuất).
- Provider trả output sai định dạng/thiếu đáp án: câu lỗi format không vào
  staging (ghi lỗi theo câu), câu hợp lệ vẫn nhận.
- Staging còn câu "Chờ review" khi job mới chạy cùng tài liệu: cảnh báo
  trùng giữa các job, reviewer quyết định.
- Câu sinh chứa dữ liệu nhạy cảm từ tài liệu: review bắt buộc phát hiện;
  loại kèm lý do; báo owner tài liệu nếu lặp lại (đề xuất).
- Tổ chức mới chưa có tài liệu duyệt: empty state dẫn tới
  `document-intake`/`document-library`.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tài liệu nguồn | bắt buộc; phải ở trạng thái "Đã duyệt" trong `document-library`; chốt phiên bản tại đăng ký job |
| Topic phạm vi | bắt buộc ≥1 topic đã duyệt, hoặc chọn "toàn văn" kèm cảnh báo |
| Loại câu sinh | bắt buộc; cùng 4 loại của `question-bank`: trắc nghiệm một đáp án, nhiều đáp án, đúng/sai, tự luận |
| Số câu mục tiêu mỗi job | số nguyên 1–50 |
| Trình độ | bắt buộc; 6 mức chuẩn (intern→lead) |
| Kỹ năng gán sẵn | bắt buộc ≥1, chọn từ taxonomy `talent-framework` |
| Lý do loại câu | bắt buộc khi "Loại", tối đa 500 ký tự |
| Nội dung câu sau sửa | theo rule `question-bank`: không rỗng, ≤2.000 ký tự |
| Câu duyệt đưa bank | phải đủ trường bắt buộc của loại câu (đáp án đúng hoặc hướng dẫn chấm) trước khi duyệt |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Số câu mỗi job | 50 câu | mỗi job | chặn cấu hình >50 |
| Job chạy đồng thời | 1 job | mỗi tổ chức | job mới xếp hàng chờ |
| Số job mỗi người | 10 job | mỗi ngày | chặn tạo job, báo quota |
| Retry job lỗi | 3 lần | mỗi job | hết retry → "thất-bại" |
| Thời gian giữ staging | 90 ngày | mỗi câu chờ-review | quá hạn → tự chuyển "bị-loại" lý do hết hạn |
| Câu staging mỗi tổ chức | 2.000 câu | — | chặn job mới, gợi ý dọn staging |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Tài liệu chưa duyệt | "Tài liệu này chưa được duyệt — chỉ sinh câu từ tài liệu đã duyệt" | E-? |
| Chưa duyệt topic | "Vui lòng duyệt và chọn topic phạm vi trước khi sinh câu" | E-? |
| Job đang chạy khác | "Đang có một job sinh câu chạy — chờ hoàn tất hoặc hủy job đó" | E-? |
| Quota job trong ngày | "Bạn đã đạt giới hạn 10 job sinh câu trong ngày — thử lại ngày mai" | E-? |
| Job thất bại sau retry | "Job sinh câu thất bại sau {n} lần thử — kiểm tra lại tài liệu hoặc chạy lại sau" | E-? |
| Câu thiếu trường khi duyệt | "Câu này thiếu {trường} — sửa trước khi duyệt vào ngân hàng" | E-? |
| Loại câu thiếu lý do | "Vui lòng nhập lý do loại câu" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Job đăng ký | "Đã tạo job sinh câu — đang xử lý trong nền" |
| Job hoàn tất | "Job hoàn tất: {n} câu nháp chờ review" |
| Duyệt câu | "Câu đã duyệt và chuyển vào hàng chờ review của ngân hàng" |
| Duyệt hàng loạt | "Đã duyệt {x}/{n} câu vào ngân hàng" |
| Rà soát xong | "Đã xác nhận {n} câu khớp phiên bản tài liệu mới" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Câu có evidence | "Nguồn: \"{tài liệu}\" phiên bản {v} — {đoạn trích}" |
| Cảnh báo trùng | "Câu này gần giống {n} câu đã có trong ngân hàng" |
| Cần rà soát | "Tài liệu nguồn có phiên bản mới — {n} câu cần rà soát lại" |
| Câu đã xử lý bởi người khác | "Câu này vừa được {người} {duyệt/loại}" |
| Staging sắp hết hạn | "{n} câu chờ review sắp quá 90 ngày — xử lý trước khi tự loại" |
| Empty state | "Chưa có tài liệu đã duyệt — tải và duyệt tài liệu trong thư viện trước" |

## 8. Assumptions

- Nguồn sinh chỉ là tài liệu "Đã duyệt" trong `document-library` (chốt
  phiên bản) — bám pipeline document-intake/review và R-11.
- "Duyệt" câu sinh = đưa vào `question-bank` ở "Chờ review" (nguồn "sinh
  bởi AI"), KHÔNG thành "Đã duyệt" ngay — bank review là cổng duy nhất
  tạo câu "Đã duyệt", đồng nhất luồng review cho mọi nguồn (align giả
  định `question-bank`: "cùng một luồng review, chỉ khác nguồn").
- Reviewer ở staging và reviewer của bank là cùng vai trò nghiệp vụ được
  `org-governance` cấp — người duyệt staging có thể khác người duyệt bank
  (hai lớp kiểm tra cho nội dung AI).
- Topic trích xuất phải được con người duyệt/chọn trước khi sinh (bám
  states reverse: Extracted → Approved → QuestionsGenerated).
- Mỗi câu sinh giữ evidence đoạn trích + vị trí trong tài liệu — nếu
  provider không trả được đoạn trích, câu vẫn vào staging nhưng đánh dấu
  "không có evidence" để reviewer cân nhắc (đề xuất — xem OQ-4).
- Khi tài liệu đổi phiên bản: cờ "cần rà soát" + owner quyết định, không
  tự đồng bộ/sửa câu — giải OQ-9 PRD theo hướng review của con người.
- Giới hạn số ở Mục 7.2 là đề xuất (nguồn chưa chốt quota — OQ-KB-04).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| AI hallucination — câu không khớp evidence (rủi ro chính PRD) | thường | câu sai vào bank, vào bài, đánh giá lệch chuẩn | bắt buộc evidence đoạn trích trên câu; review bắt buộc trước khi vào bank; bank review lớp hai; loại kèm lý do |
| Tài liệu đổi nhưng câu vẫn trỏ bản cũ (R-11) | thỉnh thoảng | câu lệch chuẩn tài liệu hiện hành | chốt phiên bản nguồn; cờ "cần rà soát" khi có bản mới; owner rà soát — không tự sync |
| Review chỉ bấm duyệt không đọc (rubber-stamp) | thỉnh thoảng | cổng review vô nghĩa, rủi ro như tự phát hành | hiển thị evidence bắt buộc trong màn review; đo tỷ lệ sửa/loại; bank review lớp hai (M-GR-02 guardrail) |
| Job sinh trùng câu đã có trong bank | thường | bank nhiễu, reviewer mất thời gian | cảnh báo near-duplicate trong staging trước khi duyệt |
| Provider lỗi/quota vượt → job treo, chi phí bất thường | thỉnh thoảng | feature không dùng được, vượt ngân sách AI | quota job/ngày, 1 job đồng thời, retry có giới hạn, `ai-usage-monitoring` quan sát (OQ-KB-04) |
| Câu sinh chứa nội dung nhạy cảm từ tài liệu | hiếm | lộ dữ liệu nội bộ vào bank/bài | chỉ sinh từ tài liệu đã duyệt; review bắt buộc; báo owner khi lặp |
| Staging tồn đọng không ai xử lý | thường | kho câu nháp ảo, khó kiểm soát | staging có hạn 90 ngày → tự loại; thống kê job; dashboard tồn chờ |

## 10. Success Criteria (preliminary)

- Tỷ lệ câu AI được approve sau review — mục tiêu theo PRD Mục 7.20; con
  số chờ OQ-2 của PRD.
- 100% câu vào bank từ feature này mang provenance đầy đủ (tài liệu +
  phiên bản + job + người duyệt staging).
- 100% câu AI trong bài phát hành đã qua hai lớp review (staging + bank).
- 0 câu AI vào bank không qua review (invariant — không tự phát hành).
- Tỷ lệ job hoàn tất không cần retry thủ công — đo độ ổn provider.

## 11. Open Questions

- [x] OQ-1: Câu AI duyệt xong vào bank ở trạng thái nào — "Chờ review"
  hay "Đã duyệt"? — Resolved (đề xuất): vào "Chờ review" — bank review là
  cổng duy nhất tạo câu "Đã duyệt", đồng nhất luồng cho mọi nguồn — chờ
  Product owner xác nhận.
- [x] OQ-2: Ai được sinh câu và ai review staging (OQ-KB-01)? — Resolved
  (đề xuất): HR/content editor sinh; reviewer là vai trò nghiệp vụ do
  `org-governance` cấp (khuyến nghị khác người duyệt bank nếu có đủ nhân
  sự) — chờ Head of HR xác nhận (liên quan OQ-11 PRD).
- [x] OQ-3: Tài liệu đổi phiên bản thì tự sync hay owner review (OQ-9
  PRD)? — Resolved (đề xuất): không tự sync — cờ "cần rà soát" + thông
  báo owner, owner quyết định giữ/sửa/ngừng dùng — chờ Technical/
  Operations owner xác nhận.
- [x] OQ-4: Câu không có đoạn trích evidence có được phép duyệt? —
  Resolved (đề xuất): vẫn vào staging nhưng đánh dấu "không có evidence";
  reviewer được khuyến nghị loại hoặc sửa gán đoạn trích trước khi duyệt —
  chờ Product owner xác nhận.
- [x] OQ-5: Giới hạn quota (50 câu/job, 10 job/ngày/người, retry ×3,
  staging 90 ngày/2.000 câu) có làm chuẩn? — Resolved (đề xuất): dùng làm
  chuẩn draft — chờ Product owner + Admin lead xác nhận (OQ-KB-04).
- [x] OQ-6: Câu "bị-loại" và staging hết hạn giữ bao lâu (retention,
  OQ-KB-02)? — Resolved (đề xuất): giữ 90 ngày cho audit/tham khảo rồi
  xóa; câu đã vào bank theo retention của `question-bank` — chờ DPO/legal
  xác nhận (liên quan OQ-6 PRD).
- [x] OQ-7: Topic có được sửa tay khi AI trích sai? — Resolved: có —
  reviewer duyệt/chỉnh/chọn topic trước khi sinh, merge/split theo cơ chế
  đã có của `document-library` — không cần owner riêng (bám reverse
  FR-KB-03).

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd ai-question-generation` — capture user perspective
- `/brd ai-question-generation` — business case
- `/prd-epic ai-question-generation` — product scope
