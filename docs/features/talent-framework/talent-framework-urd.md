---
type: urd
feature: talent-framework
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/talent-framework/brainstorms/skill-taxonomy-and-position-expectations.md, docs/_reverse/talent-and-crm/reverse-spec.md]
---

# talent-framework — User Requirements Document

## 1. Purpose

Cho HR và quản lý một khung kỹ năng chung của tổ chức — taxonomy kỹ năng,
thang cấp độ và kỳ vọng theo vị trí — được business owner duyệt trước khi
thành chuẩn, để recruitment, assessment và phát triển nhân viên nói cùng
một ngôn ngữ năng lực thay vì mỗi nơi tự định nghĩa.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Mỗi JD/bài đánh giá tự viết yêu cầu kỹ năng dạng text tự do | Không trùng tên gọi lẫn mức độ giữa các vị trí và tài liệu | Không so sánh được ứng viên với vị trí, không tái sử dụng yêu cầu | Confirmed — PRD Mục 7.32 (taxonomy kỹ năng, level, yêu cầu vị trí) |
| Quản lý | Cần nói "vị trí này cần năng lực gì, ở mức nào" với team | Không có khung kỳ vọng đã duyệt để làm căn cứ chung | Kỳ vọng truyền miệng, mỗi người hiểu một kiểu | Confirmed — PRD Mục 7.32 (mức kỳ vọng theo vị trí); JTBD-MGR-01 |
| Business owner (Head of HR/người được ủy quyền) | Taxonomy/level do từng người tự đặt, không ai chịu trách nhiệm | Không có governance: ai tạo, ai duyệt, khi nào thành chuẩn | Khung sai được dùng làm chuẩn, kết quả đánh giá/gap bị tranh chấp (R-13) | Confirmed — PRD Mục 7.32 (rủi ro), Mục 10 R-13, OQ-11; Observed: reverse spec `talent-and-crm` OQ-TL-01/OQ-TL-02 |
| Interviewer / người tạo bài đánh giá | Gắn câu hỏi/bài theo "kỹ năng" gõ tay | Không biết kỹ năng có đúng chuẩn tổ chức không | Phân loại lệch, lọc và thống kê vô nghĩa | Assumption — suy từ vai trò "ngôn ngữ chung" của PRD Mục 4 |
| Nhân viên | Không biết vị trí mình kỳ vọng những kỹ năng nào | Không có nơi tra khung kỳ vọng chính thức | Không chủ động được hướng phát triển | Confirmed — JTBD-EMP-01; Assumption — suy từ phạm vi "dùng chung" của PRD Mục 7.32 |
| Admin | Danh mục rời rạc, kỹ năng trùng tên, không biết ai đổi gì | Không truy vết được thay đổi trên dữ liệu chuẩn | Mất kiểm soát chất lượng taxonomy | Confirmed — PRD Mục 9 (audit boundary) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Vận hành taxonomy và khung kỳ vọng vị trí hằng ngày | Tạo/sửa kỹ năng và khung có kiểm soát, qua duyệt, thành chuẩn chung | Mỗi nơi tự đặt tên/mức; không biết bản nào là chuẩn |
| secondary | Business owner (Head of HR hoặc người được gán theo mảng/vị trí) | Nhận yêu cầu duyệt kỹ năng/khung thuộc phạm vi phụ trách | Hàng chờ rõ ràng, quyết định có ghi nhận và truy vết | Không có quy trình duyệt chính thức; trách nhiệm khung vô chủ |
| secondary | Quản lý | Xác định kỳ vọng cho vị trí trong team, đề xuất kỹ năng mới | Khung vị trí của team mình đúng và được công bố | Phải nhờ HR cho từng thay đổi nhỏ; đề xuất không có kênh |
| secondary | Admin | Cấu hình taxonomy, gán owner, truy vết | Kiểm soát và audit mọi thay đổi khung | Không biết ai đã đổi gì trên dữ liệu chuẩn |
| secondary | Interviewer / người tạo bài đánh giá | Chọn kỹ năng/level khi gắn câu hỏi, bài, JD | Chỉ chọn được từ danh mục đã công bố | Gõ tự do, lệch chuẩn |
| secondary | Nhân viên | Xem khung kỳ vọng của vị trí mình | Biết chính thức vị trí cần gì ở mức nào | Không có nơi tra |
| out | Ứng viên | Gián tiếp qua JD/bài đánh giá | — | Không có nhu cầu trực tiếp với feature này |

## 3. Scope Boundaries

### In Scope

- Taxonomy kỹ năng 2 tầng (nhóm kỹ năng → kỹ năng): tạo/xem/sửa kèm kiểm
  tra trùng/gần giống trước khi lưu.
- Thang cấp độ chung của tổ chức và mô tả hành vi của từng kỹ năng ở từng
  mức.
- Khung kỳ vọng vị trí: gắn kỹ năng đã công bố + level yêu cầu + cờ bắt
  buộc; mỗi vị trí tối đa 1 khung đang hiệu lực.
- Vòng đời có duyệt cho kỹ năng và khung: bản-nháp → chờ-duyệt → đã-công-bố
  → ngừng-dùng; chỉ bản đã công bố được tham chiếu làm chuẩn.
- Business owner bắt buộc cho vị trí trước khi công bố khung.
- Ngừng dùng thay cho xóa khi đối tượng đang được tham chiếu; tham chiếu
  cũ giữ nguyên hiển thị.
- Đề xuất kỹ năng từ quản lý qua luồng duyệt của owner.
- Nhập taxonomy ban đầu từ file mẫu; nhân bản khung vị trí.
- Phân quyền theo organization/role/data-scope; audit mọi thay đổi; nhân
  viên xem khung của vị trí mình (chỉ đọc).

### Out of Scope

- Áp khung kỹ năng lên quyết định lương/thăng chức tự động (PRD "Chưa làm").
- Quản lý vị trí/phòng ban/cơ cấu tổ chức — thuộc `org-governance` và
  `employee-profiles`; feature này chỉ gắn kỳ vọng lên vị trí có sẵn.
- Ghi nhận kỹ năng của từng nhân viên và đánh giá level — thuộc
  `employee-profiles` (hồ sơ năng lực) và `employee-evaluation`.
- Tính độ phủ/khoảng trống kỹ năng — thuộc `skill-gap-analysis`.
- Gắn câu hỏi/bài đánh giá theo kỹ năng — consumer là `question-bank`/
  `assessment-authoring`; feature này chỉ cung cấp danh mục chuẩn.
- AI gợi ý kỹ năng/level từ JD; thư viện khung theo ngành (hướng P2).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi bổ sung một kỹ năng vào taxonomy | Tạo kỹ năng với tên, nhóm, mô tả và mô tả hành vi từng level; được cảnh báo nếu tên trùng/gần giống kỹ năng đã có | Kỹ năng ở "Chờ duyệt", không trùng lặp vô thức | Critical | Confirmed — PRD Mục 7.32 (taxonomy, rủi ro trùng); brainstorm Mục 5.1 |
| UN-002 | HR / quản lý | Khi cần chuẩn hóa kỳ vọng cho một vị trí | Gắn kỹ năng đã công bố vào vị trí kèm level yêu cầu và cờ bắt buộc, qua duyệt của owner | Khung vị trí "Đã công bố" là chuẩn tham chiếu duy nhất của vị trí | Critical | Confirmed — PRD Mục 7.32 (yêu cầu vị trí, cờ bắt buộc); Observed: reverse spec `talent-and-crm` FR-TL-02 |
| UN-003 | Business owner | Khi có kỹ năng/khung chờ duyệt | Một hàng chờ liệt kê đầy đủ nội dung cần duyệt; quyết định công bố hoặc yêu cầu chỉnh kèm ghi chú | Mọi phần của khung đi qua duyệt có người chịu trách nhiệm | Critical | Confirmed — PRD Mục 7.32 (rủi ro owner), R-13, OQ-11 |
| UN-004 | Interviewer / người tạo bài | Khi gắn kỹ năng cho câu hỏi/bài/JD | Chỉ chọn được kỹ năng "Đã công bố" trong taxonomy | Dữ liệu downstream bám một chuẩn duy nhất | Critical | Confirmed — PRD Mục 4 (dùng chung persons/positions/skills); brainstorm Mục 8 |
| UN-005 | Nhân viên | Khi muốn biết vị trí mình kỳ vọng gì | Xem khung kỳ vọng đã công bố của vị trí mình, chỉ đọc | Nhân viên tự tra được yêu cầu chính thức | High | Confirmed — JTBD-EMP-01; brainstorm Mục 3 |
| UN-006 | HR | Khi khung/kỹ năng đã công bố cần chỉnh | Sửa được nhưng bản chỉnh quay về chờ duyệt; bản đang công bố vẫn là chuẩn tới khi bản mới được duyệt | Thay đổi có kiểm soát, không gãy tham chiếu đang dùng | High | Confirmed — brainstorm Mục 5.3; Assumption — suy từ yêu cầu review |
| UN-007 | HR / owner | Khi kỹ năng/khung sai hoặc hết giá trị | Đánh dấu "Ngừng dùng" kèm lý do; cấm xóa khi đang được tham chiếu | Ẩn khỏi chọn mới, lịch sử và tham chiếu cũ không bị viết lại | High | Confirmed — brainstorm Mục 6.1 (D5); Assumption — suy từ yêu cầu truy vết |
| UN-008 | Quản lý | Khi phát hiện thiếu kỹ năng trong taxonomy | Gửi đề xuất kỹ năng mới cho owner duyệt thay vì tự tạo song song | Taxonomy không bị phân tán ngoài luồng | Medium | Confirmed — brainstorm Mục 4 (P1); Assumption — suy từ rủi ro taxonomy phân tán |
| UN-009 | HR | Khi khởi tạo taxonomy cho tổ chức mới | Nhập hàng loạt kỹ năng từ file mẫu thay vì tạo tay | Taxonomy ban đầu vào nhanh, vẫn qua duyệt | Medium | Assumption — mở rộng hợp lý của capability taxonomy; nguồn chỉ chứng minh quan hệ skill (reverse spec `talent-and-crm`) |
| UN-010 | Admin | Khi cần điều tra thay đổi trên khung | Truy vết ai tạo/sửa/duyệt/ngừng dùng, khi nào, nội dung trước/sau | Audit đầy đủ trên dữ liệu chuẩn | Critical | Confirmed — PRD Mục 9 (audit boundary) |
| UN-011 | HR | Khi cần khung cho vị trí tương tự vị trí đã có | Nhân bản khung vị trí có sẵn rồi chỉnh | Giảm soạn lại từ đầu | Low | Confirmed — brainstorm Mục 4 (P1) |

## 5. Prioritized User Journeys

### Journey 1: Đưa kỹ năng mới vào taxonomy chuẩn

- **User:** HR
- **Importance:** Critical
- **Trigger:** HR cần bổ sung kỹ năng cho một mảng trước khi soạn khung vị
  trí hoặc bài đánh giá.
- **Expected outcome:** Kỹ năng ở trạng thái "Đã công bố", xuất hiện trong
  danh mục chuẩn để các module khác chọn.
- **Related needs:** UN-001, UN-003, UN-004

1) HR mở "Khung kỹ năng" → "Thêm kỹ năng" → điền tên, nhóm, mô tả và mô
   tả hành vi cho từng level trên thang chung.
2) Hệ thống kiểm tra trùng/gần giống: nếu có kỹ năng tương tự, hiện gợi ý
   để HR chọn dùng sẵn hoặc xác nhận tạo mới.
3) HR gửi duyệt → kỹ năng chuyển "Chờ duyệt" vào hàng chờ của business
   owner.
4) Owner mở kỹ năng, kiểm tra nội dung → "Công bố" hoặc "Yêu cầu chỉnh"
   kèm ghi chú.
5) Kỹ năng "Đã công bố" hiện trong danh mục chuẩn; các module khác chỉ
   chọn được kỹ năng ở trạng thái này.

**Independent verification:** Chọn một kỹ năng vừa công bố — kiểm tra trên
màn chọn kỹ năng của một khung vị trí (hoặc module downstream) thấy đúng
kỹ năng đó, và bản ghi có đủ người tạo + người công bố + thời điểm.

### Journey 2: Công bố khung kỳ vọng cho một vị trí

- **User:** HR (soạn) + business owner (duyệt)
- **Importance:** Critical
- **Trigger:** Một vị trí trọng yếu cần khung kỹ năng chính thức trước kỳ
  tuyển/đánh giá.
- **Expected outcome:** Vị trí có đúng 1 khung "Đã công bố" làm chuẩn cho
  JD, assessment và `skill-gap-analysis`.
- **Related needs:** UN-002, UN-003, UN-004

1) HR/quản lý mở vị trí → tab "Khung kỳ vọng" → thêm kỹ năng từ danh mục
   đã công bố, chọn level yêu cầu, đánh dấu "bắt buộc" nếu cần.
2) Hệ thống kiểm tra: vị trí đã có business owner, khung ≥1 kỹ năng,
   không trùng kỹ năng, mọi dòng có level.
3) Gửi duyệt → owner của vị trí xem toàn khung → "Công bố" hoặc "Yêu cầu
   chỉnh".
4) Khung "Đã công bố" thay khung cũ (nếu có) làm chuẩn hiệu lực; nhân
   viên giữ vị trí xem được khung của mình.

**Independent verification:** Với một vị trí vừa công bố khung — kiểm tra
vị trí chỉ có 1 khung hiệu lực, mọi dòng có level yêu cầu, và bản ghi duyệt
ghi đúng business owner + thời điểm công bố.

### Journey 3: Business owner xử lý hàng chờ duyệt

- **User:** Business owner
- **Importance:** High
- **Trigger:** Có kỹ năng mới, khung vị trí mới hoặc bản chỉnh chờ duyệt.
- **Expected outcome:** Mọi mục chờ duyệt có quyết định rõ (công bố / yêu
  cầu chỉnh kèm ghi chú), không mục nào treo vô thời hạn.
- **Related needs:** UN-003, UN-006

1) Owner mở hàng chờ duyệt, sắp theo thời gian gửi.
2) Mở từng mục: xem nội dung, người đề xuất, tham chiếu hiện có.
3) "Công bố" hoặc "Yêu cầu chỉnh" kèm ghi chú → người soạn nhận phản hồi.

**Independent verification:** Lấy 10 mục đã qua hàng chờ — 100% có bản ghi
quyết định (ai duyệt/yêu cầu chỉnh, khi nào, ghi chú nếu có).

### Journey 4: Sửa khung đã công bố và ngừng dùng

- **User:** HR / owner
- **Importance:** High
- **Trigger:** Kỳ vọng vị trí thay đổi, hoặc kỹ năng sai/lỗi thời cần rút.
- **Expected outcome:** Bản chỉnh qua duyệt trước khi thay chuẩn; đối tượng
  ngừng dùng ẩn khỏi chọn mới nhưng tham chiếu cũ giữ nguyên.
- **Related needs:** UN-006, UN-007

1) Người soạn mở khung/kỹ năng đã công bố → chỉnh → gửi duyệt → bản chỉnh
   ở "Chờ duyệt" trong khi bản cũ vẫn là chuẩn.
2) Owner duyệt bản mới → thay thế làm chuẩn hiệu lực.
3) Với đối tượng hết giá trị: đánh dấu "Ngừng dùng" kèm lý do → ẩn khỏi
   chọn mới, tham chiếu cũ hiển thị nhãn "đã ngừng dùng".

**Independent verification:** Ngừng dùng một kỹ năng đang nằm trong khung
đã công bố — khung vẫn hiệu lực và dòng kỹ năng hiển thị "đã ngừng dùng",
còn màn chọn kỹ năng mới không còn hiện kỹ năng này.

### Journey 5: Quản lý đề xuất kỹ năng mới

- **User:** Quản lý
- **Importance:** Medium
- **Trigger:** Quản lý cần kỹ năng chưa có trong taxonomy cho khung vị trí
  của team.
- **Expected outcome:** Đề xuất đi qua duyệt của owner và trở thành kỹ năng
  chuẩn, không tạo kỹ năng song song.
- **Related needs:** UN-008

1) Quản lý gửi đề xuất kỹ năng (tên, nhóm gợi ý, mô tả, lý do cần).
2) Owner xem đề xuất → duyệt thành kỹ năng chuẩn (vào luồng chờ-duyệt như
   kỹ năng thường) hoặc từ chối kèm lý do.
3) Quản lý nhận kết quả và dùng kỹ năng đã công bố trong khung.

**Independent verification:** Với một đề xuất được duyệt — kỹ năng mới có
provenance ghi nguồn "đề xuất của quản lý" + người duyệt.

### Journey 6: Nhân viên tra khung kỳ vọng vị trí mình

- **User:** Nhân viên
- **Importance:** Medium
- **Trigger:** Nhân viên muốn biết vị trí của mình yêu cầu kỹ năng nào ở
  mức nào.
- **Expected outcome:** Xem được khung "Đã công bố" của vị trí mình, chỉ
  đọc.
- **Related needs:** UN-005

1) Nhân viên mở hồ sơ/vị trí của mình → xem khung kỳ vọng: danh sách kỹ
   năng, level yêu cầu, cờ bắt buộc.
2) Kỹ năng đã ngừng dùng trong khung hiển thị nhãn tương ứng.

**Independent verification:** Đăng nhập bằng nhân viên giữ vị trí có khung
đã công bố — thấy đúng nội dung khung, không có nút sửa; nhân viên ở vị trí
khác không thấy được khi ngoài scope.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Gửi duyệt khung cho vị trí chưa có business owner | Không hiểu vì sao bị chặn | Thông báo "Vị trí này chưa có người phụ trách khung kỹ năng — gán người phụ trách trước khi công bố" | Journey 2 / UN-002 |
| Tạo kỹ năng trùng tên kỹ năng đã có | Sợ tạo trùng | Gợi ý "Đã có kỹ năng {tên}" + chọn dùng sẵn hoặc xác nhận tạo mới | Journey 1 / UN-001 |
| Khung thiếu level yêu cầu hoặc trùng kỹ năng | Gửi duyệt bị trả | Thông báo chỉ rõ dòng lỗi để sửa trước khi gửi | Journey 2 / UN-002 |
| Kỹ năng đã ngừng dùng còn nằm trong khung cũ | Lo khung bị lỗi | Khung vẫn hiệu lực; dòng hiển thị "đã ngừng dùng"; khi sửa khung được nhắc gỡ/thay | Journey 4 / UN-007 |
| Owner nghỉ việc khi có yêu cầu chờ duyệt | Yêu cầu treo không ai xử lý | Cảnh báo "khung không có owner"; admin gán owner mới, yêu cầu chuyển sang | Journey 3 / UN-003 |
| Xóa kỹ năng đang được tham chiếu | Mất dữ liệu lịch sử | Chặn xóa, hướng dẫn "Ngừng dùng"; chỉ xóa được khi chưa có tham chiếu | Journey 4 / UN-007 |
| Xóa nhóm kỹ năng còn chứa kỹ năng | Mất phân loại hàng loạt | Chặn xóa, yêu cầu chuyển kỹ năng sang nhóm khác trước | UN-001 |
| Hai người cùng sửa một kỹ năng/khung | Người lưu sau ghi đè | Cảnh báo "{tên} vừa được {người} cập nhật — tải lại để xem bản mới nhất" | UN-006 |
| Vị trí chưa từng có khung | Không biết trạng thái | Hiển thị "Chưa có khung kỳ vọng" + lối tạo; module downstream không chọn được vị trí này làm chuẩn | Journey 2 |
| Taxonomy trống (tổ chức mới) | Không biết bắt đầu | Empty state gợi ý tạo kỹ năng đầu tiên hoặc nhập từ danh sách | Journey 1 / UN-009 |
| Owner duyệt nội dung do chính mình soạn | Nghi ngờ tính độc lập | Cho phép nhưng audit ghi nhận "tự duyệt" để rà soát | UN-003 (đề xuất — OQ-4) |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt là ưu tiên; tên/mô tả kỹ năng hỗ trợ đầy
  đủ dấu tiếng Việt.
- Người dùng phải đăng nhập và thuộc tổ chức/phạm vi được cấp; không có
  surface công khai cho taxonomy.
- Chỉ bản "Đã công bố" được các module khác tham chiếu làm chuẩn — không
  có ngoại lệ, kể cả nội dung import hay đề xuất.
- Khung kỹ năng là chuẩn tham chiếu, không phải công cụ quyết định: không
  dùng khung để tự động kết luận lương/thăng chức/kỷ luật (invariant
  human-in-the-loop, PRD Mục 12).
- Mỗi vị trí cần có business owner trước khi công bố khung — không cho
  "công bố tạm không owner".
- Màn hình desktop là chính cho soạn/duyệt khung (bảng, hàng chờ); không
  yêu cầu mobile cho first release của feature.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Taxonomy là chung cho toàn tổ chức (1 tenant = 1 khung), khác biệt giữa phòng thể hiện qua khung vị trí | Nếu cần khung riêng từng phòng → thiếu scope phân tán taxonomy | Assumption — bám brainstorm Mục 8 | Chốt cùng Head of HR (OQ-1) |
| Business owner duyệt taxonomy/level/weight/threshold là Head of HR hoặc người Head of HR gán theo mảng/vị trí | Nếu authority khác → quy trình duyệt gán sai người, khung vô chủ (R-13) | Resolved-đề xuất — chờ Head of HR xác nhận | Chốt ở OQ-1 (liên quan OQ-11 PRD) |
| Thang level chung 5 mức áp cho mọi kỹ năng; tên/mô tả mức do Head of HR công bố | Nếu cần thang riêng theo nhóm → so sánh level giữa kỹ năng sai lệch | Resolved-đề xuất — chờ Head of HR | Chốt ở OQ-2 |
| Vị trí (position) đã tồn tại từ `employee-profiles`/`org-governance`; feature chỉ gắn kỳ vọng | Nếu chưa có vị trí → khung không có chỗ gắn | Confirmed — phụ thuộc Feature Map (2, 3) | Đối chiếu khi `employee-profiles` đặc tả |
| Mỗi vị trí đúng 1 business owner phụ trách khung; thiếu owner chặn công bố | Nếu cho nhiều owner → trách nhiệm không rõ | Assumption — bám brainstorm Mục 8 | Chốt ở OQ-3 |
| Tham chiếu cũ giữ nguyên khi kỹ năng/khung ngừng dùng (JD, bài test, kỹ năng nhân viên không viết lại) | Nếu bắt buộc migrate → khối lượng sửa lịch sử lớn | Assumption — bám invariant truy vết | Chốt ở OQ-7 |
| Giới hạn số (500 kỹ năng, 30 kỹ năng/khung, 50 nhóm, 100 ký tự tên) là chuẩn first release | Nếu quá chặt → user bức xúc; quá lỏng → taxonomy phình | Resolved-đề xuất — chờ Head of HR | Chốt ở OQ-6 |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Vị trí trọng yếu có khung kỹ năng được phê duyệt | 0% (chưa có khung chính thức) | ≥80% vị trí trọng yếu do Head of HR chọn — target chính thức chờ OQ-2 PRD | Tỷ lệ vị trí trọng yếu có khung "Đã công bố" | 1 tháng sau rollout feature |
| USC-002 | Mọi kỹ năng/khung đang là chuẩn đều đi qua duyệt có owner | Chưa có — xác lập bằng kiểm tra provenance trong 1 tháng đầu | 100% | Tỷ lệ kỹ năng/khung "Đã công bố" có bản ghi quyết định của owner | Liên tục |
| USC-003 | Người soạn không tạo trùng kỹ năng vô thức | Chưa có — xác lập bằng audit gợi ý trùng sau 1 tháng | ≥90% cảnh báo gần giống được xử lý có ý thức (dùng sẵn hoặc xác nhận tạo mới) | Tỷ lệ cảnh báo trùng có hành động xác nhận | 1 tháng sau rollout |
| USC-004 | Module downstream chỉ tham chiếu bản đã công bố | — | 100% | Tỷ lệ tham chiếu kỹ năng/khung ở trạng thái "Đã công bố" | Liên tục, kiểm tra mỗi release |
| USC-005 | Hàng chờ duyệt không treo | Chưa có — xác lập bằng đo thời gian chờ trong 1 tháng đầu | Mục chờ duyệt có quyết định trong ≤5 ngày làm việc (đề xuất — OQ-6) | Thời gian từ "gửi duyệt" đến quyết định đầu tiên | 1 tháng sau rollout |

## 10. Open Questions

- [x] OQ-1: Ai duyệt taxonomy, level, weight và threshold kỹ năng — một
  business owner chung hay tách theo mảng? — Resolved (đề xuất): business
  owner là Head of HR; Head of HR có thể gán owner theo mảng kỹ năng/vị
  trí, admin thực hiện gán trên hệ thống — chờ Head of HR xác nhận (PRD
  OQ-11, R-13; OQ-TL-01/OQ-TL-02 reverse spec).
- [x] OQ-2: Thang level chung mấy mức và có cho thang riêng theo nhóm kỹ
  năng không? — Resolved (đề xuất): thang chung 5 mức áp cho mọi kỹ năng,
  tên/mô tả từng mức do Head of HR công bố; không thang riêng trong first
  release — chờ Head of HR xác nhận.
- [x] OQ-3: Ai được tạo/sửa kỹ năng trực tiếp và ai gán business owner
  cho vị trí? — Resolved (đề xuất): HR và admin tạo trực tiếp; quản lý đi
  qua luồng đề xuất; admin (hoặc Head of HR) gán owner cho vị trí — chờ
  Head of HR xác nhận.
- [x] OQ-4: Owner có được tự duyệt nội dung do chính mình soạn không? —
  Resolved (đề xuất): được phép; audit ghi nhận "tự duyệt" để rà soát định
  kỳ — chờ Head of HR xác nhận.
- [x] OQ-5: "Vị trí trọng yếu" trong chỉ số thành công định nghĩa thế nào
  và target bao nhiêu? — Resolved (đề xuất): danh sách vị trí trọng yếu do
  Head of HR chọn trong phạm vi rollout; target % chờ OQ-1/OQ-2 PRD chốt.
- [x] OQ-6: Giới hạn đề xuất (500 kỹ năng, 30 kỹ năng/khung, 50 nhóm, SLA
  duyệt 5 ngày) có được duyệt? — Resolved (đề xuất): giữ ngưỡng đề xuất —
  chờ Head of HR xác nhận.
- [x] OQ-7: Khi thang level chung đổi sau khi đã dùng rộng, dữ liệu cũ xử
  lý thế nào? — Resolved (đề xuất): thang bị khóa khi đã có tham chiếu;
  đổi thang thực hiện qua quy trình migrate riêng có duyệt, không sửa trực
  tiếp — chờ Head of HR xác nhận.
- [x] OQ-8: Kỹ năng đã ngừng dùng có được phục hồi trực tiếp về đã-công-bố
  không? — Resolved: không — phục hồi đưa kỹ năng về "Chờ duyệt" để owner
  duyệt lại trước khi làm chuẩn trở lại.
