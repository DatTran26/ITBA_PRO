---
type: urd
feature: assessment-templates
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/assessment-templates/brainstorms/assessment-template-lifecycle.md, docs/_reverse/assessment-and-grading/reverse-spec.md]
---

# assessment-templates — User Requirements Document

## 1. Purpose

Cho HR một thư viện mẫu bài đánh giá tái sử dụng — cấu hình khung (vị trí,
trình độ, đối tượng, số câu, thời lượng, quy tắc chấm, mô tả) đã qua kiểm
soát chất lượng — để tạo bài mới nhất quán mà không cấu hình lại từ đầu,
đồng thời ngăn mẫu lỗi/lỗi thời được dùng hàng loạt. Đây là feature
`Should` — slice mở rộng, không nằm trong cam kết v1 (PRD Mục 7.31, Mục
6.1).

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Mỗi lần mở tuyển cho cùng loại vị trí phải cấu hình lại bài từ đầu | Thời lượng, số câu, đối tượng, thang điểm lệch giữa các lần tạo | Bài đánh giá không nhất quán, dễ phải hủy vì cấu hình sai | Confirmed — PRD Mục 7.31 ("giảm lỗi cấu hình lặp lại") |
| Admin | Mẫu do từng người tự tạo, rải rác, không ai kiểm soát | Mẫu chung có cấu hình sai mà được dùng hàng loạt | Nhiều bài lỗi cùng lúc, mất niềm tin vào mẫu | Confirmed — PRD Mục 7.31 (rủi ro chính); brainstorm Mục 9 |
| HR | Mẫu cũ (JD/thang điểm đã đổi) vẫn xuất hiện khi tạo bài | Không biết mẫu nào còn chuẩn | Vô tình dùng mẫu lỗi thời | Confirmed — brainstorm Mục 9 (rủi ro mẫu lỗi thời); liên quan R-11 |
| Interviewer (đồng tác giả) | Được giao soạn bài nhưng không có khung chuẩn | Tự cấu hình theo cách riêng | Bài lệch chuẩn tổ chức | Confirmed — PRD Mục 3 (JTBD-INT-01) |
| Nhân viên / ứng viên | Nhận bài cấu hình sai (thiếu thời gian, sai đối tượng) | Bài làm không đo đúng | Trải nghiệm kém, kết quả tranh chấp | Assumption — hệ quả của mẫu sai lan rộng (PRD Mục 7.31) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Tạo bài đánh giá lặp lại cho các vị trí/trình độ quen thuộc | Chọn mẫu chuẩn → điền sẵn → chỉ chỉnh phần khác | Cấu hình lại từ đầu mỗi lần; sợ dùng nhầm mẫu lỗi |
| secondary | Admin | Quản trị chất lượng mẫu chung của tổ chức | Công bố mẫu chung đã review; thu hồi mẫu lỗi thời | Không kiểm soát được chất lượng/vòng đời mẫu chung |
| secondary | Interviewer (đồng tác giả) | Được giao soạn bài cho mảng phụ trách | Dùng mẫu chung làm điểm khởi đầu nhất quán | Thiếu khung cấu hình chuẩn |
| secondary | Reviewer mẫu chung (admin/business owner được chỉ định) | Duyệt mẫu trước khi công bố chung | Hàng chờ mẫu chờ duyệt có ghi nhận | Chưa rõ ai có thẩm quyền duyệt mẫu (OQ-1/OQ-2) |
| out | Nhân viên / ứng viên | Làm bài tạo từ mẫu | (gián tiếp) nhận bài đúng chuẩn | Không thao tác trong feature này |

## 3. Scope Boundaries

### In Scope

- Tạo/xem/sửa/xóa mẫu cấu hình bài đánh giá: tên, mô tả, vị trí áp dụng,
  trình độ, đối tượng làm bài (ứng viên/nhân viên), số câu hỏi, thời
  lượng, quy tắc chấm, mô tả JD và hướng dẫn bài test kèm theo.
- Danh sách mẫu có phân loại và hai phạm vi: "Mẫu chung" (tổ chức) và
  "Mẫu của tôi" (cá nhân); lọc theo vị trí/trình độ/đối tượng.
- Vòng đời mẫu: bản nháp → chờ review → đã công bố → ngừng dùng; mẫu
  chung bắt buộc qua review của admin/business owner được chỉ định trước
  khi công bố; mẫu cá nhân công bố trong phạm vi riêng không cần review.
- Áp mẫu khi tạo bài (`assessment-authoring`): chỉ mẫu "Đã công bố" được
  chọn; cấu hình sao chép độc lập; ghi nhận bài-sinh-từ-mẫu để truy vết
  và khoanh vùng khi mẫu lỗi.
- Cảnh báo/chặn dùng mẫu "Chờ review"/"Ngừng dùng"; ngừng dùng kèm lý do,
  bài đã tạo giữ nguyên.
- Sửa lớn mẫu chung đang công bố → quay về "Chờ review".
- Nhân bản mẫu, đề xuất mẫu chung từ mẫu cá nhân, thống kê lượt dùng.

### Out of Scope

- Soạn bài, chọn câu hỏi, phát hành link — thuộc `assessment-authoring`
  (feature này chỉ cung cấp mẫu đã công bố để áp).
- Danh sách câu hỏi cố định trong mẫu — mẫu v1 chỉ chứa cấu hình khung
  (P2 trong brainstorm).
- Quản lý vị trí/JD và taxonomy trình độ — thuộc `recruitment-planning`/
  `talent-framework`; feature này chỉ tham chiếu.
- Marketplace/chia sẻ mẫu giữa tổ chức — PRD "Chưa làm".
- Version mẫu (so sánh/khôi phục bản cũ) — P2.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi tạo bài cho loại vị trí đã làm nhiều lần | Chọn mẫu "Đã công bố" để điền sẵn cấu hình vào bài mới | Bản nháp bài có sẵn cấu hình chuẩn (bản sao độc lập), chỉ chỉnh phần khác | Critical | Confirmed — PRD Mục 7.31 luồng "chọn mẫu khi tạo bài"; brainstorm Mục 5.2 |
| UN-002 | HR | Khi có cấu hình hay dùng | Lưu thành mẫu cá nhân tái sử dụng cho riêng mình | Mẫu của mình hiện trong tab riêng, dùng lại ngay | High | Confirmed — PRD Mục 7.31 (phân biệt mẫu chung/cá nhân) |
| UN-003 | HR / admin | Khi một mẫu nên thành chuẩn tổ chức | Gửi mẫu cho reviewer duyệt công bố chung | Mẫu chung đã qua review mới hiện cho mọi người | Critical | Confirmed — PRD Mục 7.31 (rủi ro mẫu dùng hàng loạt); brainstorm Mục 5.1 |
| UN-004 | Reviewer | Khi có mẫu chờ công bố | Hàng chờ liệt kê mẫu chờ review với đủ cấu hình để đối chiếu | Quyết định công bố/yêu cầu chỉnh có ghi nhận | Critical | Confirmed — brainstorm Mục 5.1; reviewer cụ thể chờ OQ-1/OQ-2 |
| UN-005 | Admin | Khi mẫu chung lỗi hoặc lỗi thời | Đánh dấu "Ngừng dùng" kèm lý do, ẩn khỏi chọn mới | Mẫu không còn được dùng tạo bài; bài đã tạo giữ nguyên | Critical | Confirmed — PRD Mục 7.31 (rủi ro mẫu lỗi thời dùng hàng loạt) |
| UN-006 | HR | Khi mở danh sách mẫu | Lọc theo vị trí/trình độ/đối tượng và tách mẫu chung/của tôi | Tìm đúng mẫu nhanh, không nhầm mẫu người khác | High | Confirmed — PRD Mục 7.31 (phân loại, phân biệt) |
| UN-007 | HR | Khi mẫu đang chọn chưa được công bố | Được cảnh báo trạng thái trước khi dùng | Không vô tình dùng mẫu "Chờ review"/"Ngừng dùng" | High | Confirmed — brainstorm Mục 4 (P0) |
| UN-008 | Admin | Khi điều tra loạt bài lỗi cùng cấu hình | Truy vết mẫu nào đã sinh ra những bài nào | Khoanh vùng bài ảnh hưởng khi mẫu lỗi | High | Confirmed — brainstorm Mục 4 (P0 "ghi nhận mẫu nào sinh ra bài nào") |
| UN-009 | HR | Khi mẫu cá nhân của mình đáng làm mẫu chung | Đề xuất mẫu của mình cho admin duyệt | Đường đề xuất rõ, không phải nhờ admin tạo lại | Medium | Confirmed — brainstorm Mục 4 (P1) |
| UN-010 | Admin | Khi rà soát thư viện mẫu | Xem lượt dùng mỗi mẫu để phát hiện mẫu "chết"/lỗi thời | Quyết định ngừng dùng có dữ liệu | Medium | Confirmed — brainstorm Mục 4 (P1) |
| UN-011 | HR | Khi muốn chỉnh từ một mẫu chung | Nhân bản mẫu chung thành mẫu cá nhân để sửa | Bản sao riêng chỉnh tự do, không ảnh hưởng mẫu gốc | Medium | Confirmed — brainstorm Mục 4 (P1) |

## 5. Prioritized User Journeys

### Journey 1: Dùng mẫu khi tạo bài đánh giá

- **User:** HR (hoặc interviewer có quyền tạo bài)
- **Importance:** Critical
- **Trigger:** Cần tạo bài cho vị trí/trình độ đã có mẫu.
- **Expected outcome:** Bản nháp bài được điền sẵn cấu hình chuẩn từ mẫu;
  bài ghi nhận mẫu gốc để truy vết.
- **Related needs:** UN-001, UN-006, UN-007

1) Trong `assessment-authoring` chọn "Tạo từ mẫu" → hệ thống gợi ý mẫu
   "Đã công bố" phù hợp theo vị trí/trình độ/đối tượng.
2) Chọn mẫu → cấu hình mẫu sao chép vào bản nháp (độc lập với mẫu gốc).
3) HR chỉnh phần riêng → soạn đề và phát hành theo luồng
   `assessment-authoring`; bài ghi nhận mẫu đã dùng.

**Independent verification:** Tạo một bài từ mẫu X — bản ghi bài trỏ mẫu
X; sửa/ngừng dùng mẫu X sau đó không làm đổi cấu hình bài đã tạo.

### Journey 2: Đưa một mẫu thành mẫu chung đã duyệt

- **User:** HR + reviewer (admin/business owner)
- **Importance:** Critical
- **Trigger:** Một mẫu (mới tạo hoặc mẫu cá nhân đề xuất) nên thành chuẩn
  tổ chức.
- **Expected outcome:** Mẫu chung "Đã công bố" hiện cho mọi người có quyền
  tạo bài, có bản ghi duyệt đầy đủ.
- **Related needs:** UN-003, UN-004, UN-009

1) Người tạo điền đủ cấu hình mẫu → "Gửi duyệt công bố chung" → mẫu
   chuyển "Chờ review".
2) Reviewer mở hàng chờ → đối chiếu đối tượng/trình độ/thời lượng/quy
   tắc chấm → "Công bố" hoặc "Yêu cầu chỉnh" kèm ghi chú.
3) Mẫu được công bố hiện trong tab "Mẫu chung"; yêu cầu chỉnh → người
   tạo sửa gửi lại.

**Independent verification:** Lấy 10 mẫu chung đang "Đã công bố" — 100%
có bản ghi quyết định (ai duyệt, khi nào, ghi chú nếu có).

### Journey 3: Ngừng dùng mẫu lỗi/lỗi thời

- **User:** Admin
- **Importance:** High
- **Trigger:** Phát hiện mẫu chung sai cấu hình hoặc JD/thang điểm lỗi
  thời.
- **Expected outcome:** Mẫu ẩn khỏi mọi danh sách chọn; bài đã tạo từ mẫu
  giữ nguyên; có thể khoanh vùng bài ảnh hưởng.
- **Related needs:** UN-005, UN-008

1) Admin mở mẫu → "Ngừng dùng" → nhập lý do.
2) Mẫu ẩn khỏi gợi ý và tab mẫu chung; danh sách bài-sinh-từ-mẫu vẫn
  truy vết được để khoanh vùng.
3) Khi cần dùng lại → mở lại qua "Chờ review" (mẫu chung phải duyệt
   lại).

**Independent verification:** Ngừng dùng một mẫu đã sinh 3 bài — màn tạo
bài không còn chọn được mẫu đó, 3 bài giữ nguyên cấu hình và truy vết
được liên kết mẫu.

### Journey 4: Tạo và quản lý mẫu cá nhân

- **User:** HR
- **Importance:** High
- **Trigger:** HR có cấu hình hay dùng muốn lưu lại.
- **Expected outcome:** Mẫu cá nhân "Đã công bố" trong phạm vi riêng,
  sửa/xóa tự do; chỉ mình thấy.
- **Related needs:** UN-002, UN-011

1) Tạo mẫu → điền cấu hình → lưu phạm vi "cá nhân" → thẳng "Đã công bố"
   trong tab "Mẫu của tôi".
2) Sửa/xóa bất kỳ lúc nào; nhân bản từ mẫu chung để có bản riêng chỉnh.

**Independent verification:** Tạo mẫu cá nhân — người khác (không phải
admin) không thấy mẫu đó trong tab nào; chính mình áp được vào bài mới.

### Journey 5: Sửa mẫu chung đang công bố

- **User:** Admin (hoặc reviewer)
- **Importance:** Medium
- **Trigger:** Cần cập nhật mẫu chung theo chuẩn mới.
- **Expected outcome:** Sửa nhỏ giữ công bố; sửa lớn quay về "Chờ
  review" trước khi có hiệu lực trở lại.
- **Related needs:** UN-003, UN-005

1) Admin sửa mẫu chung: đổi mô tả/tên → lưu, giữ "Đã công bố".
2) Đổi đối tượng/trình độ/quy tắc chấm/vị trí áp dụng → mẫu quay "Chờ
   review" → reviewer duyệt lại → "Đã công bố".

**Independent verification:** Sửa lớn một mẫu chung — trong thời gian chờ
duyệt lại, mẫu vẫn dùng được ở bản đã công bố hay bị ẩn phải rõ ràng
(đề xuất: giữ bản đã công bố tới khi bản mới được duyệt — xem OQ-4).

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Gửi duyệt mẫu chung thiếu field bắt buộc | Không hiểu vì sao bị chặn | Thông báo liệt kê field còn thiếu | Journey 2 / UN-003 |
| Trùng tên mẫu trong cùng phạm vi | Lưu không được | "Đã có mẫu tên \"{tên}\" trong phạm vi này — chọn tên khác" | UN-002, UN-003 |
| Chọn mẫu đang "Chờ review" để tạo bài | Dùng mẫu chưa kiểm chứng | Cảnh báo trạng thái, cho quyết định có ý thức; mẫu "Ngừng dùng" thì chặn | Journey 1 / UN-007 |
| Mẫu bị ngừng dùng trong lúc đang mở form tạo bài | Sợ mất công | Bản sao cấu hình đã copy vẫn lưu được + thông báo mẫu gốc đã ngừng | Journey 1 / UN-001 |
| Sửa mẫu cá nhân của người khác | Tưởng có quyền | Từ chối: "Bạn không có quyền sửa mẫu này" (admin là ngoại lệ) | Journey 4 |
| Xóa mẫu đã sinh nhiều bài | Mất liên kết truy vết | Khuyến nghị "Ngừng dùng"; bài giữ ghi chú "tạo từ mẫu đã xóa" | Journey 3 / UN-008 |
| Hai người (owner + admin) cùng sửa một mẫu | Người lưu sau ghi đè | Cảnh báo "mẫu vừa được {người} cập nhật — tải lại" | UN-002 |
| Mẫu của nhân sự nghỉ việc | Mẫu chết không ai quản | Giữ nguyên; admin quyết định chuyển ownership hoặc ngừng dùng | UN-005 |
| Tổ chức chưa có mẫu chung | Không biết bắt đầu | Empty state: "Chưa có mẫu chung nào — tạo mẫu riêng hoặc đề xuất quản trị viên công bố" | Journey 2 |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt; nội dung mẫu hỗ trợ tiếng Việt đầy đủ.
- Người dùng phải đăng nhập và thuộc tổ chức/phạm vi được cấp; ai có
  quyền tạo bài đánh giá thì đọc/dùng được mẫu chung.
- Chỉ mẫu "Đã công bố" được áp vào bài mới — mẫu cá nhân công bố trong
  phạm vi riêng, mẫu chung phải qua review.
- Chỉ admin (hoặc business owner được chỉ định) công bố mẫu chung; owner
  sửa mẫu mình, admin sửa được mọi mẫu.
- Áp mẫu là bản sao độc lập — mẫu không liên kết sống với bài đã tạo.
- Màn quản lý mẫu (bảng lọc, hàng chờ) thiết kế cho desktop; không yêu
  cầu mobile cho feature này.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Mẫu chỉ chứa cấu hình khung, không gồm bộ câu hỏi cố định | Nếu mẫu gồm câu → phải xử lý snapshot câu trong mẫu | Confirmed — brainstorm Mục 8, align phạm vi `question-bank`/`assessment-authoring` | — |
| Mẫu chung cần 1 cấp duyệt: admin hoặc business owner được admin chỉ định | Nếu cần nhiều cấp → hàng chờ phức tạp hơn | Assumption — đề xuất | Chốt ở OQ-1/OQ-2 (chờ Head of HR/Admin lead) |
| "Sửa lớn" = đổi đối tượng/trình độ/quy tắc chấm/vị trí áp dụng | Ngưỡng khác → duyệt quá nặng/lỏng | Assumption — đề xuất | Chốt ở OQ-4 |
| Bản mẫu đã công bố vẫn dùng được trong khi bản sửa lớn chờ duyệt | Nếu ẩn ngay → mẫu hay dùng biến mất đột ngột | Assumption — đề xuất | Chốt ở OQ-4 |
| Vị trí áp dụng chọn từ danh mục vị trí của tổ chức, cho phép để trống = mẫu mọi vị trí | Nếu nhập tự do → không lọc/gợi ý theo vị trí được | Assumption — đề xuất | Chốt ở OQ-8 (chờ Head of HR) |
| Quy tắc chấm = mô tả tự do + 2 field có cấu trúc tối thiểu (thang điểm, điểm đạt) | Nếu thuần tự do → `assessment-grading` không đọc được | Assumption — đề xuất | Chốt ở OQ-10 (chờ Assessment owner) |
| Giới hạn số (tên ≤150, mô tả ≤2.000, số câu 1–200, thời lượng 5–240, mẫu cá nhân ≤50/người, mẫu chung ≤200/tổ chức) là chuẩn draft | Đổi validation | Assumption | Chốt ở OQ-7/OQ-9 |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Bài tạo từ mẫu không phải hủy do sai cấu hình | Chưa có — xác lập bằng audit hủy bài trong 1 tháng | ≥95% bài từ mẫu không bị hủy vì cấu hình (chốt cùng OQ-2 PRD) | Tỷ lệ bài có template_id không bị hủy vì cấu hình | 1 tháng sau khi bật |
| USC-002 | Mẫu chung luôn đã qua review | 0% | 100% mẫu chung "Đã công bố" có bản ghi duyệt | Audit quyết định công bố | Liên tục |
| USC-003 | Mức tái sử dụng mẫu | Chưa có — xác lập 1 tháng đầu | ≥60% bài mới tạo từ mẫu | Tỷ lệ bài có template_id / tổng bài | 1 tháng sau khi bật |
| USC-004 | Mẫu lỗi thời bị chặn kịp thời | Chưa có | 0 bài mới tạo từ mẫu "Ngừng dùng" | Audit nguồn mẫu của bài mới | Liên tục |
| USC-005 | Hàng chờ review mẫu không treo | Chưa có — xác lập qua tháng đầu | Mẫu chờ duyệt được quyết định trong ≤3 ngày làm việc (đề xuất) | Thời gian gửi duyệt → quyết định đầu tiên | 1 tháng sau khi bật |

## 10. Open Questions

- [x] OQ-1: Mẫu chung cần bao nhiêu cấp duyệt (liên quan OQ-11 PRD)? —
  Resolved (đề xuất): 1 cấp — admin hoặc business owner được admin chỉ
  định; mẫu cho đối tượng "nhân viên" khuyến nghị business owner duyệt —
  chờ Head of HR xác nhận.
- [x] OQ-2: Ai được chỉ định làm reviewer cho mẫu chung ngoài admin? —
  Resolved (đề xuất): admin mặc định; admin chỉ định business owner theo
  mảng qua `org-governance` — chờ Admin lead xác nhận.
- [x] OQ-3: Mẫu cho đối tượng "nhân viên" có quy trình duyệt khác? —
  Resolved (đề xuất): cùng quy trình, nhưng reviewer khuyến nghị là
  business owner — chờ Head of HR xác nhận.
- [x] OQ-4: Thế nào là "sửa lớn" và bản cũ có còn dùng được khi chờ
  duyệt lại? — Resolved (đề xuất): sửa lớn = đổi đối tượng/trình độ/quy
  tắc chấm/vị trí áp dụng; bản đã công bố vẫn dùng được tới khi bản mới
  được duyệt (mô hình phiên bản như `question-bank`) — chờ Product owner
  xác nhận.
- [x] OQ-5: Xử lý sửa đồng thời (owner + admin)? — Resolved: cảnh báo
  "mẫu vừa được {người} cập nhật — tải lại", không merge tự động — align
  pattern `question-bank`.
- [x] OQ-6: Mẫu cá nhân của nhân sự nghỉ việc? — Resolved (đề xuất): giữ
  nguyên; admin chuyển ownership hoặc ngừng dùng — chờ Admin lead xác
  nhận.
- [x] OQ-7: Độ dài tối đa tên mẫu/mô tả? — Resolved (đề xuất): tên
  ≤150 ký tự, mô tả ≤2.000, hướng dẫn bài test ≤5.000 — chờ Product
  owner xác nhận.
- [x] OQ-8: "Vị trí áp dụng" chọn từ danh mục hay nhập tự do? — Resolved
  (đề xuất): chọn từ danh mục vị trí của tổ chức (`recruitment-planning`),
  cho phép để trống = mẫu mọi vị trí — chờ Head of HR xác nhận.
- [x] OQ-9: Min/max số câu, thời lượng, giới hạn số mẫu? — Resolved (đề
  xuất): số câu 1–200, thời lượng 5–240 phút, mẫu cá nhân ≤50/người,
  mẫu chung ≤200/tổ chức — chờ Product owner xác nhận.
- [x] OQ-10: Quy tắc chấm chỉ mô tả tự do hay có cấu trúc? — Resolved
  (đề xuất): mô tả tự do + 2 field có cấu trúc tối thiểu (thang điểm
  tổng, điểm đạt) để `assessment-grading` dùng — chờ Assessment owner
  xác nhận.
- [x] OQ-11: Target cho "tỷ lệ bài tạo từ mẫu không bị hủy do sai cấu
  hình"? — Resolved: chưa có baseline — xác lập bằng audit trong 1 tháng;
  target chờ OQ-2 PRD.
