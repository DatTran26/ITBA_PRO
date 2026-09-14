---
type: brainstorm
feature: assessment-templates
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md, docs/_reverse/assessment-and-grading/reverse-spec.md, docs/_reverse/assessment-and-grading/states.md]
---

# Vòng đời mẫu bài đánh giá tái sử dụng — assessment-templates

## 1. Idea Seed

Lưu cấu hình bài đánh giá (vị trí, trình độ, đối tượng, số câu hỏi, thời
lượng, quy tắc chấm, mô tả) thành mẫu tái sử dụng. Mẫu đi qua review rồi
publish; khi tạo bài mới, HR chọn mẫu để điền sẵn cấu hình rồi chỉnh bản dùng
riêng. Phân biệt mẫu chung (admin công bố, mọi người thấy) và mẫu cá nhân
(chỉ người tạo thấy).

## 2. Context

HR đang tạo bài đánh giá lặp lại cho cùng vị trí/trình độ và phải nhập lại
toàn bộ cấu hình — dễ sai lệch giữa các lần tạo (thời lượng, số câu, đối
tượng). Nguồn hiện có đã có khái niệm mẫu gồm: tên, mô tả, vị trí, trình độ,
số câu hỏi, thời lượng, đối tượng (ứng viên/nhân viên), mô tả JD, mô tả bài
test và cờ mẫu chung do admin tạo. Pain thật: một mẫu cấu hình sai mà được
dùng hàng loạt sẽ tạo ra nhiều bài lỗi cùng lúc — vì vậy mẫu chung cần bước
review trước khi publish. Feature này là đầu vào cấu hình cho
`assessment-authoring` và là phụ thuộc để giao bài đồng loạt trong
`employee-evaluation`.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Mỗi lần mở tuyển phải cấu hình lại bài từ đầu, dễ sai khác giữa các lần | Chọn mẫu đã chuẩn → điền sẵn → chỉ chỉnh phần khác |
| Admin | Mẫu rời rạc do từng người tự tạo, không ai kiểm soát chất lượng mẫu chung | Công bố mẫu chung đã review; thu hồi mẫu lỗi thời |
| Interviewer (đồng tác giả) | Được giao soạn bài nhưng thiếu khung cấu hình chuẩn | Dùng mẫu chung làm điểm khởi đầu nhất quán |
| Nhân viên / ứng viên | Bài nhận được cấu hình sai (thiếu thời gian, sai đối tượng) | Nhận bài đúng chuẩn vì mẫu đã qua review |

## 4. Capabilities Breakdown

### P0 — must have

- Tạo/sửa mẫu với các thông tin nghiệp vụ: tên mẫu, mô tả, vị trí áp dụng,
  trình độ, đối tượng làm bài (ứng viên/nhân viên), số câu hỏi, thời lượng,
  quy tắc chấm ghi nhận, mô tả JD và mô tả bài test kèm theo.
- Danh sách mẫu có phân loại: lọc theo vị trí, trình độ, đối tượng; tách
  tab "Mẫu chung" và "Mẫu của tôi".
- Vòng đời mẫu: bản nháp → chờ review → đã công bố → ngừng dùng; mẫu chung
  bắt buộc qua review trước khi công bố (người review là business owner do
  admin chỉ định — xem OQ-2).
- Dùng mẫu khi tạo bài: chọn mẫu → hệ thống điền sẵn cấu hình vào bản bài
  mới → người tạo chỉnh bản dùng riêng mà không đổi mẫu gốc.
- Phân quyền: ai cũng đọc được mẫu chung + mẫu của mình; người tạo sửa/xóa
  mẫu cá nhân của mình; admin sửa/xóa được mọi mẫu và là người duy nhất
  chuyển mẫu thành mẫu chung.
- Cảnh báo khi dùng mẫu đang "chờ review" hoặc đã "ngừng dùng".
- Ghi nhận mẫu nào đã sinh ra bài nào (truy vết khi phát hiện mẫu lỗi).

### P1 — should have

- Nhân bản mẫu (từ mẫu chung tạo bản cá nhân để chỉnh).
- Gợi ý mẫu theo vị trí/trình độ đang chọn khi tạo bài.
- Thống kê lượt dùng mỗi mẫu để admin phát hiện mẫu "chết" hoặc mẫu hot.
- Đổi mẫu cá nhân thành đề xuất mẫu chung (gửi admin duyệt thay vì admin tự
  tạo từ đầu).

### P2 — nice to have

- Marketplace/chia sẻ mẫu giữa nhiều tổ chức — ngoài phạm vi v1.
- Version mẫu (so sánh bản cũ/mới, khôi phục).
- Mẫu kèm bộ câu hỏi cố định thay vì chỉ cấu hình khung.

## 5. Core Flows (Happy Path)

### 5.1 Tạo mẫu → review → công bố

1) HR/admin vào "Mẫu bài đánh giá" → "Tạo mẫu mới" → điền thông tin cấu hình
   (tên, vị trí, trình độ, đối tượng, số câu, thời lượng, quy tắc chấm...).
2) Lưu: mẫu cá nhân → thẳng "Đã công bố" trong phạm vi của mình; muốn thành
   mẫu chung → gửi admin review.
3) Admin (hoặc business owner được chỉ định) mở mẫu chờ review → kiểm cấu
   hình → "Công bố" hoặc "Yêu cầu chỉnh" kèm ghi chú.
4) Mẫu chung đã công bố hiện trong tab "Mẫu chung" cho mọi người có quyền
   tạo bài.

### 5.2 Dùng mẫu khi tạo bài đánh giá

1) HR bắt đầu tạo bài (trong `assessment-authoring`) → hệ thống gợi danh
   sách mẫu phù hợp theo vị trí/trình độ/đối tượng.
2) Chọn mẫu → cấu hình mẫu điền sẵn vào bản bài mới (bản sao, không liên
   kết sống với mẫu).
3) HR chỉnh bản dùng riêng (đổi số câu, thời lượng...) → lưu bài → hệ thống
   ghi nhận bài này sinh từ mẫu nào.
4) Nếu mẫu vừa chọn đang "chờ review" hoặc "ngừng dùng" → cảnh báo trước
   khi cho dùng.

```
Người tạo mẫu                Hệ thống                       Người review (admin)
─────────────────────────────────────────────────────────────────────────────
Tạo mẫu + điền cấu hình
        │
        ▼
── Mẫu cho ai? ──┐
   │             │
 cá nhân      mẫu chung
   │             │ gửi review
   ▼             ▼
Đã công bố   Chờ review ──▶ ┌──────────────────────┐
(phạm vi                    │ Admin đọc cấu hình,  │
người tạo)                  │ kiểm đối tượng/trình │
                            │ độ/thời lượng        │
                            └──────────┬───────────┘
                                       ▼
                          ── Đồng ý công bố? ──┐
                            │                  │
                          Có ▼                Không ▼
                    Đã công bố (mẫu chung)  Chờ review
                    mọi người thấy/dùng     + ghi chú yêu cầu chỉnh
                            │                    │
                            │              người tạo sửa → gửi lại
                            ▼
        ┌───────────────────────────────────────────────┐
        │ HR tạo bài: chọn mẫu → điền sẵn cấu hình      │
        │ → chỉnh bản dùng riêng → lưu bài              │
        │ (ghi nhận bài sinh từ mẫu nào)                │
        └───────────────────────────────────────────────┘

Mẫu lỗi thời/lỗi ──▶ admin "Ngừng dùng": mẫu ẩn khỏi gợi ý,
 bài đã tạo trước đó giữ nguyên cấu hình riêng.
```

### 5.3 Chỉnh sửa và ngừng dùng mẫu

1) Người tạo sửa mẫu cá nhân của mình bất kỳ lúc nào; admin sửa được mọi mẫu.
2) Sửa mẫu chung đang "Đã công bố" → tùy chọn: sửa nhỏ giữ trạng thái, sửa
   lớn (đổi đối tượng/trình độ/quy tắc chấm) → quay về "Chờ review" (xem
   OQ-4 về ngưỡng "sửa lớn").
3) Mẫu sai/lỗi thời → admin đánh dấu "Ngừng dùng": ẩn khỏi gợi ý và tab mẫu
   chung; các bài đã tạo từ mẫu giữ nguyên (đã là bản sao riêng).
4) Người dùng mở lại mẫu đã "Ngừng dùng" vẫn xem được lịch sử nhưng không
   dùng tạo bài mới.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Mẫu được gửi làm mẫu chung? | Chuyển "Chờ review" tới admin/business owner | Công bố ngay trong phạm vi cá nhân |
| D2 | 5.1 | Reviewer đồng ý công bố? | "Đã công bố", hiện tab Mẫu chung | Ở "Chờ review" + ghi chú yêu cầu chỉnh |
| D3 | 5.2 | Mẫu đang chọn có trạng thái "Chờ review"/"Ngừng dùng"? | Cảnh báo + chặn dùng (Ngừng dùng) hoặc cảnh báo cho quyết định (Chờ review) | Cho dùng bình thường |
| D4 | 5.3 | Sửa mẫu chung là "sửa lớn" (đổi đối tượng/trình độ/quy tắc chấm)? | Quay về "Chờ review" | Giữ "Đã công bố" |
| D5 | 5.3 | Người sửa là owner của mẫu cá nhân hoặc admin? | Cho sửa | Từ chối: "Bạn không có quyền sửa mẫu này" |

### 6.2 Scenario Matrix

| Vai trò | Phạm vi mẫu | Xem | Sửa | Xóa | Công bố chung |
|---|---|---|---|---|---|
| HR | mẫu của mình | ✓ | ✓ | ✓ | gửi review |
| HR | mẫu chung đã công bố | ✓ (dùng tạo bài) | — | — | — |
| HR | mẫu cá nhân của người khác | — | — | — | — |
| Admin | mẫu chung | ✓ | ✓ | ✓ | ✓ trực tiếp |
| Admin | mọi mẫu cá nhân | ✓ | ✓ | ✓ | — |
| Interviewer | mẫu chung | ✓ (nếu được quyền tạo bài) | — | — | — |

### 6.3 State Transitions

```
mẫu: bản-nháp → chờ-review → đã-công-bố → ngừng-dùng
                    ↑            │ (sửa lớn)
                    └────────────┘
mẫu cá nhân: bản-nháp → đã-công-bố (phạm vi cá nhân) → ngừng-dùng
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| mẫu cá nhân | — | đã-công-bố | người tạo lưu mẫu cho mình | — |
| mẫu chung | bản-nháp | chờ-review | gửi admin/business owner duyệt | — |
| mẫu chung | chờ-review | đã-công-bố | reviewer bấm "Công bố" | — |
| mẫu chung | chờ-review | chờ-review | reviewer yêu cầu chỉnh → owner sửa gửi lại | có |
| mẫu chung | đã-công-bố | chờ-review | sửa lớn (đối tượng/trình độ/quy tắc chấm) | có (sau review lại) |
| mẫu (cả hai) | đã-công-bố | ngừng-dùng | admin/owner đánh dấu ngừng | có (mở lại → chờ-review với mẫu chung) |
| bài-từ-mẫu | — | bản sao độc lập | chọn mẫu khi tạo bài | không (không liên kết sống) |

### 6.5 Other Edge Cases

- Mẫu chung bị "Ngừng dùng" trong khi HR đang mở form tạo bài đã chọn mẫu đó:
  bản dùng đã copy cấu hình → vẫn lưu được, hiện thông báo mẫu gốc đã ngừng.
- Hai người cùng sửa một mẫu cá nhân (owner + admin): người lưu sau ghi đè —
  cần cảnh báo "mẫu vừa được {người} cập nhật" (xem OQ-5).
- Xóa mẫu đã sinh ra nhiều bài: hệ thống giữ liên kết truy vết trên bài
  (bài vẫn ghi "tạo từ mẫu đã xóa") — khuyến nghị "Ngừng dùng" thay vì xóa
  khi mẫu đã được dùng.
- Mẫu cá nhân của nhân sự nghỉ việc: mẫu giữ nguyên, admin quyết định chuyển
  thành mẫu chung hoặc ngừng dùng (xem OQ-6).
- Empty state: chưa có mẫu chung nào → tab hiển thị gợi ý "Chưa có mẫu chung
  — bạn có thể tạo mẫu riêng hoặc đề xuất admin công bố".

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên mẫu | bắt buộc, không trùng trong cùng phạm vi (cá nhân) / toàn hệ thống (mẫu chung); độ dài tối đa chờ Product owner xác nhận tại OQ-7 |
| Vị trí áp dụng | bắt buộc; nguồn danh mục vị trí chờ Product owner xác nhận tại OQ-8 |
| Trình độ | bắt buộc; một trong các mức seniority chuẩn của khung kỹ năng (intern/fresher/junior/mid/senior/lead) |
| Đối tượng làm bài | bắt buộc; ứng viên hoặc nhân viên (mặc định: ứng viên) |
| Số câu hỏi | số nguyên dương; mặc định 10; min/max chờ Product owner xác nhận tại OQ-9 |
| Thời lượng | phút, số nguyên dương; mặc định 30; min/max chờ Product owner xác nhận tại OQ-9 |
| Quy tắc chấm | ghi nhận dạng mô tả (thang điểm, cách quy đổi) — v1 chưa ép công thức máy tính (OQ-10) |
| Gửi review mẫu chung | chỉ khi mẫu đã đủ các field bắt buộc |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Trình độ hợp lệ | 6 mức (intern, fresher, junior, mid, senior, lead) | — | chặn nhập ngoài danh sách |
| Đối tượng hợp lệ | 2 (ứng viên, nhân viên) | — | chặn giá trị khác |
| Số câu hỏi mặc định | 10 | — | chỉ là default khi tạo mẫu |
| Thời lượng mặc định | 30 phút | — | chỉ là default khi tạo mẫu |
| Số mẫu tối đa mỗi người/tổ chức | Chờ Product owner xác nhận tại OQ-9 | — | chặn tạo mới + gợi ý ngừng dùng mẫu cũ |
| Giới hạn số câu/thời lượng | Chờ Product owner xác nhận tại OQ-9 | — | chặn lưu với thông báo lỗi |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Thiếu field bắt buộc | "Vui lòng điền đủ thông tin bắt buộc: {danh sách field}" | E-? |
| Trùng tên mẫu | "Đã có mẫu tên \"{tên}\" trong phạm vi này — chọn tên khác" | E-? |
| Sửa mẫu không có quyền | "Bạn không có quyền sửa mẫu này" | E-? |
| Dùng mẫu đã ngừng | "Mẫu này đã ngừng dùng — chọn mẫu khác" | E-? |
| Không lưu được mẫu | "Không lưu được mẫu — thử lại sau" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Tạo mẫu cá nhân | "Đã lưu mẫu \"{tên}\"" |
| Gửi review mẫu chung | "Đã gửi mẫu \"{tên}\" cho quản trị viên duyệt" |
| Công bố mẫu chung | "Mẫu \"{tên}\" đã được công bố chung" |
| Áp mẫu vào bài mới | "Đã điền cấu hình từ mẫu \"{tên}\" — bạn có thể chỉnh lại cho phù hợp" |
| Ngừng dùng | "Mẫu \"{tên}\" đã ngừng dùng — các bài đã tạo không bị ảnh hưởng" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Mẫu đang chờ review | "Mẫu này đang chờ duyệt để công bố chung" |
| Reviewer yêu cầu chỉnh | "Mẫu \"{tên}\" cần chỉnh: {ghi chú của người duyệt}" |
| Mẫu vừa bị sửa bởi người khác | "Mẫu vừa được {người} cập nhật — tải lại để xem bản mới nhất" |
| Empty state mẫu chung | "Chưa có mẫu chung nào — bạn có thể tạo mẫu riêng hoặc đề xuất quản trị viên công bố" |
| Bài tạo từ mẫu | "Bài này được tạo từ mẫu \"{tên}\"" |

## 8. Assumptions

- Mẫu chỉ chứa cấu hình khung bài (không gồm danh sách câu hỏi cố định) —
  câu hỏi nằm ở `question-bank`/`assessment-authoring`.
- Mỗi bài tạo từ mẫu là bản sao độc lập: sửa mẫu sau đó không đổi bài đã
  tạo, và ngược lại.
- Quyền "admin sửa/xóa mọi mẫu, owner sửa mẫu mình, ai cũng đọc mẫu chung +
  mẫu mình" đã có sẵn trong nguồn và giữ nguyên.
- Ai có quyền tạo bài đánh giá thì đọc/dùng được mẫu chung.
- Việc công bố mẫu chung là quyết định nghiệp vụ có reviewer (admin hoặc
  business owner được chỉ định) — không tự động công bố.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Mẫu chung có cấu hình sai được dùng hàng loạt | thỉnh thoảng | nhiều bài lỗi cùng lúc, phải hủy/sửa hàng loạt, mất niềm tin vào mẫu | bắt buộc review trước khi công bố chung; truy vết bài-sinh-từ-mẫu để khoanh vùng |
| Mẫu lỗi thời (JD/thang điểm cũ) vẫn được chọn | thường | bài đánh giá sai chuẩn hiện hành | trạng thái "ngừng dùng" + cảnh báo + định kỳ rà soát mẫu (thống kê lượt dùng) |
| Không ai sở hữu chất lượng mẫu chung | thỉnh thoảng | mẫu chung tồi vào, mọi người quay lại tự tạo — feature mất giá trị | admin/business owner duyệt mẫu chung; quy trình đề xuất từ mẫu cá nhân |
| Người dùng lạm dụng mẫu cá nhân thay vì đề xuất mẫu chung | thỉnh thoảng | cấu hình phân tán, không chuẩn hóa được | P1: đề xuất mẫu chung từ mẫu cá nhân; thống kê để admin chủ động công bố |
| Trùng tên/trùng mẫu gần giống nhau | thường | HR chọn nhầm mẫu | validate trùng tên theo phạm vi; lọc theo vị trí/trình độ/đối tượng |

## 10. Success Criteria (preliminary)

- Tỷ lệ bài tạo từ mẫu không phải hủy do sai cấu hình — target chờ Product
  owner xác nhận tại OQ-11.
- Tỷ lệ bài mới được tạo từ mẫu (thay vì cấu hình tay) — đo mức tái sử dụng.
- Tỷ lệ mẫu chung có reviewer xác nhận trước khi công bố = 100%.

## 11. Open Questions

- [ ] OQ-1: Mẫu chung cần bao nhiêu cấp duyệt — chỉ admin, hay thêm business
  owner mảng (vd Head of HR duyệt mẫu cho đánh giá nhân viên)? Liên quan
  OQ-11 của PRD sản phẩm.
- [ ] OQ-2: Ai được chỉ định làm reviewer cho mẫu chung ngoài admin?
- [ ] OQ-3: Mẫu cho đối tượng "nhân viên" có quy trình duyệt khác mẫu cho
  ứng viên không (vì dính đánh giá nội bộ)?
- [ ] OQ-4: Thế nào là "sửa lớn" buộc quay về chờ review — đổi đối
  tượng/trình độ/quy tắc chấm, hay bất kỳ field nào?
- [ ] OQ-5: Xử lý sửa đồng thời (owner + admin cùng sửa): chặn, cảnh báo,
  hay cho ghi đè?
- [ ] OQ-6: Mẫu cá nhân của nhân sự nghỉ việc: giữ, chuyển ownership, hay
  tự ngừng dùng?
- [ ] OQ-7: Độ dài tối đa tên mẫu/mô tả?
- [ ] OQ-8: "Vị trí áp dụng" chọn từ danh sách vị trí của tổ chức
  (`employee-profiles`/`talent-framework`) hay nhập tự do?
- [ ] OQ-9: Min/max cho số câu hỏi, thời lượng; giới hạn số mẫu mỗi
  người/tổ chức?
- [ ] OQ-10: Quy tắc chấm trong mẫu chỉ là mô tả tự do, hay cần field có
  cấu trúc (thang điểm, điểm đạt) để `assessment-grading` dùng?
- [ ] OQ-11: Target định lượng cho "tỷ lệ bài tạo từ mẫu không bị hủy do
  sai cấu hình"?

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd assessment-templates` — capture user perspective
- `/brd assessment-templates` — business case
- `/prd-epic assessment-templates` — product scope
