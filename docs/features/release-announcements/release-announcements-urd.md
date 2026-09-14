---
type: urd
feature: release-announcements
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/release-announcements/brainstorms/approved-release-announcements.md, docs/_reverse/platform-communications-and-governance/reverse-spec.md]
---

# release-announcements — User Requirements Document

## 1. Purpose

Cho admin một kênh công bố thay đổi sản phẩm chính thức ngay trong ứng
dụng — thông báo phiên bản được soạn, duyệt, lên lịch và đo tỷ lệ đọc có
kiểm soát — để người dùng nội bộ luôn biết thay đổi nào ảnh hưởng đến mình,
thay vì chỉ nghe truyền miệng hoặc tự phát hiện. Đây là bản ghi nghiệp vụ
về thay đổi sản phẩm, không phải Git release/tag kỹ thuật (PRD Mục 7.36).

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Admin | Thay đổi sản phẩm chỉ được truyền đạt qua chat/email/truyền miệng | Không có kênh chính thức trong app; không biết ai đã đọc; không truy vết được thông báo nào gắn với phiên bản nào | Người dùng lệch thông tin về quy trình mới, complaint khi hành vi đổi, không chứng minh được đã thông báo | Confirmed — PRD Mục 7.36; Observed: reverse spec `platform-communications-and-governance` FR-PL-05 (versions + read markers đã có nền triển khai) |
| Người dùng nội bộ (HR, quản lý, nhân viên, interviewer) | Sản phẩm đổi nhưng không được báo; không phân biệt được thông báo mới với đã xem | Thiếu kênh nhận biết thay đổi ảnh hưởng trực tiếp đến việc của mình | Thao tác theo quy trình cũ, bất ngờ khi hành vi thay đổi | Confirmed — PRD Mục 7.36 ("người dùng nhận biết nội dung chưa đọc") |
| Reviewer (người được gán quyền duyệt) | Không có hàng chờ duyệt thông báo chính thức | Thông báo sai/chưa rõ có thể đến tay toàn bộ người dùng | Mất niềm tin vào kênh công bố | Assumption — suy từ invariant human-in-the-loop (PRD Mục 12) và luồng duyệt của brainstorm |
| Product owner / quản lý | Không có số liệu tiếp nhận thay đổi | Không đo được thông báo quan trọng có được đọc không | Không ra quyết định truyền thông được bằng căn cứ | Assumption — suy từ "Đo thành công" của PRD Mục 7.36 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Admin | Vận hành nền tảng, phụ trách truyền đạt thay đổi sản phẩm | Soạn, lên lịch, công bố và thu hồi thông báo phiên bản có kiểm soát; đo được tỷ lệ đọc | Không có kênh chính thức, không biết ai đã đọc, không truy vết được thông báo–phiên bản |
| secondary | Reviewer (người được gán quyền duyệt) | Được giao kiểm tra nội dung trước khi công bố | Hàng chờ duyệt rõ ràng, quyết định duyệt/trả có ghi nhận | Không có quy trình duyệt chính thức |
| secondary | Người dùng nội bộ | Làm việc hàng ngày trên sản phẩm | Thấy thông báo chưa đọc ngay trong app, đọc nội dung ảnh hưởng đến mình, đánh dấu đã đọc | Không biết sản phẩm đổi gì, đổi khi nào |
| secondary | Product owner / quản lý | Ra quyết định truyền thông thay đổi | Số liệu đọc theo thông báo | Không có dữ liệu tiếp nhận |
| out | Ứng viên | Chỉ dùng public link đánh giá, không có tài khoản nội bộ | — | Không thuộc đối tượng nhận thông báo nội bộ |

## 3. Scope Boundaries

### In Scope

- Soạn thông báo phiên bản: tiêu đề, nội dung thay đổi, nhãn phiên bản
  hiển thị, đối tượng nhận, mức quan trọng.
- Luồng trạng thái đầy đủ: nháp → chờ duyệt → đã duyệt → đã công bố →
  lưu trữ; từ chối trả về nháp kèm ghi chú; chỉ nháp được xóa.
- Lên lịch công bố trong tương lai hoặc công bố ngay.
- Người dùng: danh sách thông báo đang công bố trong phạm vi đối tượng
  của mình, badge chưa đọc, xem nội dung, read marker theo từng người.
- Theo dõi tỷ lệ đọc trên tập người dùng mục tiêu.
- Thu hồi/lưu trữ thông báo đã công bố kèm lý do bắt buộc và audit cho
  các action nhạy cảm (gửi duyệt, duyệt/từ chối, công bố, thu hồi).

### Out of Scope

- Tự động suy nội dung thông báo từ commit/Git tag, hoặc thay thế release
  automation (PRD Mục 7.36 "Chưa làm"; OQ-5 PRD về deployment authority
  vẫn mở).
- Nhắc lại người chưa đọc qua notification — P1, phụ thuộc
  `contextual-notifications`.
- Sửa nội dung sau công bố — P1 (đề xuất sửa có audit + đánh dấu "đã
  chỉnh sửa", OQ-4 của brainstorm).
- Mẫu thông báo tái sử dụng, thống kê đọc theo vai trò/thời gian — P2.
- Đối chiếu hiển thị với Git tag/image thực tế đang chạy — P2, chỉ hiển
  thị chứ không suy nội dung.
- Đối tượng nhận theo đơn vị/chi nhánh — P2 (v1: toàn bộ hoặc theo vai
  trò).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Admin | Khi một thay đổi sản phẩm sắp có hiệu lực | Soạn thông báo đầy đủ: tiêu đề, nội dung, nhãn phiên bản, đối tượng nhận, mức quan trọng | Thông báo ở trạng thái nháp sẵn sàng gửi duyệt | Critical | Confirmed — PRD Mục 7.36 (draft); brainstorm Mục 4 |
| UN-002 | Admin | Khi thông báo đã soạn xong | Gửi duyệt cho reviewer thay vì tự công bố ngay | Thông báo vào hàng chờ của người có quyền duyệt, người soạn không tự duyệt | Critical | Confirmed — PRD Mục 7.36 (approved); luồng duyệt cụ thể là Assumption |
| UN-003 | Reviewer | Khi có thông báo chờ duyệt | Xem toàn bộ nội dung + đối tượng nhận rồi duyệt hoặc trả về kèm ghi chú | Quyết định được ghi nhận (ai, khi nào, lý do nếu trả) | Critical | Confirmed — PRD Mục 7.36 (approved); vai trò reviewer là OQ-3 brainstorm |
| UN-004 | Admin | Khi thông báo đã duyệt | Chọn công bố ngay hoặc đặt lịch công bố trong tương lai | Thông báo chuyển đã công bố đúng thời điểm mong muốn | High | Confirmed — PRD Mục 7.36 (lịch công bố) |
| UN-005 | Người dùng nội bộ | Khi đăng nhập vào sản phẩm | Thấy ngay số thông báo chưa đọc và mở danh sách thông báo dành cho mình | Không bỏ sót thay đổi ảnh hưởng đến mình | Critical | Confirmed — PRD Mục 7.36 (read marker, "nhận biết nội dung chưa đọc") |
| UN-006 | Người dùng nội bộ | Khi đã đọc thông báo | Hệ thống ghi nhận đã đọc; vẫn xem lại được khi cần | Badge giảm, lịch sử đọc không mất | High | Confirmed — PRD Mục 7.36 (read marker) |
| UN-007 | Admin | Khi thông báo đã công bố không khớp phiên bản thực tế | Thu hồi thông báo kèm lý do, ẩn khỏi người dùng nhưng vẫn truy vết được | Thông báo sai không còn hiển thị, audit đủ | Critical | Confirmed — PRD Mục 7.36 (rủi ro chính: lệch phiên bản đang chạy) |
| UN-008 | Admin | Khi cần biết thông báo quan trọng đã được đọc chưa | Xem số người mục tiêu, số đã đọc, tỷ lệ đọc theo thông báo | Quyết định có nhắc/truyền thông thêm hay không | High | Confirmed — PRD Mục 7.36 (đo thành công) |
| UN-009 | Admin | Khi cần truy vết ai đã làm gì trên thông báo | Audit đầy đủ cho gửi duyệt/duyệt/từ chối/công bố/thu hồi | Truy vết được mọi action nhạy cảm | High | Confirmed — PRD Mục 9 (audit boundary), Mục 7.2 |
| UN-010 | Người dùng mới | Khi tài khoản được tạo sau ngày công bố | Vẫn thấy thông báo còn hạn hiển thị | Không bỏ sót thay đổi gần đây | Medium | Assumption — đề xuất brainstorm (hạn hiển thị 90 ngày) |

## 5. Prioritized User Journeys

### Journey 1: Soạn → duyệt → công bố thông báo phiên bản

- **User:** Admin (và reviewer ở bước duyệt)
- **Importance:** Critical
- **Trigger:** Một thay đổi sản phẩm sắp hoặc vừa có hiệu lực và admin cần
  thông báo chính thức.
- **Expected outcome:** Thông báo ở trạng thái "đã công bố" đúng thời
  điểm mong muốn, đã qua duyệt của con người.
- **Related needs:** UN-001, UN-002, UN-003, UN-004

1) Admin tạo nháp: nhập tiêu đề, nội dung thay đổi, nhãn phiên bản,
   đối tượng nhận, mức quan trọng.
2) "Gửi duyệt" — thông báo chuyển "chờ duyệt" vào hàng chờ reviewer.
3) Reviewer xem toàn bộ nội dung → duyệt, hoặc trả về kèm ghi chú (về
   nháp để admin sửa gửi lại).
4) Thông báo đã duyệt: admin bấm "công bố ngay" hoặc đặt lịch; đến lịch
   hệ thống tự chuyển "đã công bố".
5) Người dùng thuộc đối tượng nhận thấy badge và thông báo trong danh
   sách.

**Independent verification:** Lấy một thông báo "đã công bố" bất kỳ —
kiểm tra có bản ghi duyệt (ai duyệt, khi nào), đúng đối tượng nhận, và
nhãn phiên bản hiển thị khớp thông tin admin xác nhận.

### Journey 2: Người dùng nhận biết và xác nhận đã đọc

- **User:** Người dùng nội bộ
- **Importance:** Critical
- **Trigger:** Đăng nhập sau khi có thông báo mới được công bố.
- **Expected outcome:** Người dùng thấy và đọc thông báo ảnh hưởng đến
  mình; hệ thống ghi read marker.
- **Related needs:** UN-005, UN-006

1) Người dùng thấy badge số chưa đọc trên khu vực thông báo.
2) Mở danh sách: thông báo đang công bố thuộc đối tượng của mình, chưa
   đọc được đánh dấu.
3) Mở từng thông báo → đọc nội dung → hệ thống ghi read marker.
4) Badge giảm; thông báo đã đọc vẫn xem lại được.

**Independent verification:** Với một tài khoản thử nghiệm thuộc đối
tượng nhận — đăng nhập thấy badge đúng số, mở đọc xong badge giảm đúng,
và read marker ghi đúng người + thời điểm.

### Journey 3: Thu hồi thông báo lệch phiên bản thực tế

- **User:** Admin
- **Importance:** High
- **Trigger:** Phát hiện thông báo đã công bố không khớp phiên bản đang
  chạy (deploy bị rollback, nội dung sai).
- **Expected outcome:** Thông báo ẩn khỏi người dùng ngay, giữ vết lý do
  và người thu hồi.
- **Related needs:** UN-007, UN-009

1) Admin mở thông báo "đã công bố" → "Thu hồi/lưu trữ" → nhập lý do
   bắt buộc.
2) Thông báo chuyển "lưu trữ": biến mất khỏi danh sách người dùng.
3) Màn admin vẫn xem được thông báo kèm lý do + ai thu hồi; (đề xuất)
   tạo thông báo đính chính qua lại luồng duyệt nếu cần.

**Independent verification:** Thu hồi một thông báo trên môi trường thử
— tài khoản người dùng không còn thấy thông báo, màn admin hiện đủ lý
do + người thu hồi + thời điểm trong audit.

### Journey 4: Theo dõi tỷ lệ đọc của thông báo quan trọng

- **User:** Admin
- **Importance:** High
- **Trigger:** Thông báo quan trọng đã công bố và cần biết mức tiếp nhận.
- **Expected outcome:** Admin thấy số người mục tiêu, số đã đọc, tỷ lệ
  đọc; quyết định có truyền thông thêm.
- **Related needs:** UN-008, UN-009

1) Admin mở bảng theo dõi, lọc thông báo quan trọng đang công bố.
2) Xem số người mục tiêu / đã đọc / tỷ lệ; lọc theo kỳ hoặc trạng thái.
3) Tỷ lệ đọc thấp quá hạn đọc → admin cân nhắc nhắc lại (P1) hoặc kênh
   khác — hệ thống không tự gửi lại.

**Independent verification:** Trên một thông báo có người đọc và người
chưa đọc — số liệu hiển thị khớp với đếm read marker thực tế trên tập
người dùng mục tiêu đang hoạt động.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Gửi duyệt thiếu trường bắt buộc | Admin không hiểu vì sao bị chặn | Thông báo liệt kê đúng các field còn thiếu | Journey 1 / UN-001 |
| Admin cố tự duyệt thông báo mình soạn | Vòng kiểm soát bị phá | Chặn tự duyệt khi tổ chức có ≥2 người giữ quyền duyệt (đề xuất) | UN-002 |
| Đặt lịch công bố trong quá khứ | Lịch không bao giờ chạy | Chặn + báo thời điểm phải sau hiện tại | Journey 1 / UN-004 |
| Đến lịch nhưng tác vụ công bố lỗi | Thông báo trễ mà không ai biết | Cảnh báo "đã quá lịch công bố" trên màn admin; đường "công bố ngay" dự phòng | UN-004 |
| Người dùng bấm đóng thông báo quan trọng mà chưa đọc | Tưởng đã đọc nhưng thực tế chưa | Vẫn tính chưa đọc — chỉ mở xem nội dung mới ghi marker | Journey 2 / UN-006 |
| Người dùng không thuộc đối tượng nhận | Thấy thông báo không liên quan | Thông báo ẩn hoàn toàn khỏi danh sách và badge | UN-005 |
| Xóa thông báo không phải nháp | Mất evidence đã công bố | Chặn xóa — chỉ nháp được xóa; trạng thái khác chỉ lưu trữ | UN-009 |
| Thu hồi thiếu lý do | Không truy vết được vì sao rút | Bắt buộc lý do ≥10 ký tự | Journey 3 / UN-007 |
| Trùng nhãn phiên bản giữa 2 thông báo | Nhầm phiên bản | Cho phép nhưng cảnh báo trùng nhãn khi soạn | UN-001 |
| Người dùng mới sau ngày công bố | Bỏ sót thay đổi gần đây | Thông báo còn hạn hiển thị (đề xuất 90 ngày) vẫn hiện chưa đọc | UN-010 |
| Tổ chức chưa có thông báo nào | Không biết bắt đầu đâu | Empty state gợi ý tạo thông báo đầu tiên; người dùng không thấy badge | Journey 1 |

## 7. User-side Constraints

- Ngôn ngữ giao diện và nội dung thông báo tiếng Việt là ưu tiên (PRD
  Mục 9).
- Người dùng phải đăng nhập và thuộc tổ chức/phạm vi được cấp; thông báo
  chỉ hiển thị trong phạm vi đối tượng nhận — đây là ràng buộc quyền,
  không phải tùy chọn hiển thị (PRD Mục 9).
- Mọi thông báo đến tay người dùng phải đã qua duyệt của con người —
  không có đường tắt công bố trực tiếp (invariant human-in-the-loop, PRD
  Mục 12).
- Nhãn phiên bản là chuỗi hiển thị do admin nhập và chịu trách nhiệm đối
  chiếu với phiên bản kỹ thuật — hệ thống không tự suy từ commit/deploy
  (PRD Mục 7.36 "Chưa làm"; OQ-5 PRD).
- Màn quản trị (soạn, duyệt, theo dõi) thiết kế cho desktop; danh sách +
  nội dung thông báo cho người dùng dùng được trên mọi thiết bị đăng nhập
  được.
- Feature là slice mở rộng (MoSCoW `Could`) — không nằm trong cam kết
  pilot v1; khi triển khai phải tôn trọng cùng ràng buộc quyền/audit như
  feature Must.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Reviewer là vai trò nghiệp vụ được gán quyền "duyệt thông báo" qua org-governance, không nhất thiết là super admin | Nếu chỉ super admin duyệt → hàng chờ nghẽn | Assumption — cần owner chốt | Đã giải ở brainstorm OQ-3 — chờ Admin lead xác nhận |
| Chặn tự duyệt khi tổ chức có ≥2 người giữ quyền duyệt | Nếu cho tự duyệt → mất lớp kiểm soát | Assumption | Đã giải ở brainstorm OQ-3 — chờ Admin lead xác nhận |
| Đối tượng nhận v1 = toàn bộ người dùng + theo vai trò; theo đơn vị/chi nhánh để P2 | Nếu cần lọc theo đơn vị ngay → thiếu khả năng nhắm đối tượng | Assumption | Đã giải ở brainstorm OQ-2 — chờ Product owner xác nhận |
| Tỷ lệ đọc tính trên tập người dùng mục tiêu đang hoạt động tại thời điểm đo; "đọc đúng hạn" của thông báo quan trọng = 7 ngày | Nếu cách tính khác → chỉ số đo thành công lệch | Assumption | Đã giải ở brainstorm OQ-5 — chờ Product owner (liên quan OQ-2 PRD) |
| Nhãn phiên bản không bắt khớp Git tag — là chuỗi hiển thị do admin nhập | Nếu buộc khớp → phải tích hợp deploy authority đang mở (OQ-5 PRD) | Assumption — bám PRD "Chưa làm" | Đã giải ở brainstorm OQ-1 — chờ Admin lead/Technical owner |
| Hạn hiển thị thông báo cho người dùng mới = 90 ngày kể từ công bố | Nếu khác → người dùng mới thấy quá nhiều hoặc quá ít thông báo cũ | Assumption | Cùng gói giới hạn chờ owner chốt (OQ-4 tài liệu này) |
| Retention thông báo + read marker theo quyết định OQ-6 PRD (đề xuất 24 tháng) | Nếu ngắn hơn → mất vết tỷ lệ đọc lịch sử | Assumption — chờ DPO | Theo dõi OQ-6 PRD; trước đó chỉ dữ liệu synthetic |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Người dùng mục tiêu đọc thông báo quan trọng đúng hạn | Chưa có — xác lập bằng đo trên các thông báo quan trọng đầu tiên trong 1 tháng đầu dùng | ≥80% đọc trong 7 ngày kể từ công bố (đề xuất — chờ OQ-2 PRD chốt target) | Tỷ lệ người mục tiêu có read marker ≤7 ngày sau công bố / người mục tiêu đang hoạt động | 1 tháng sau khi bật feature |
| USC-002 | Mọi thông báo đến tay người dùng đều đã qua duyệt | 0% (hiện không có kênh) | 100% thông báo "đã công bố" có bản ghi duyệt hợp lệ | Tỷ lệ thông báo đã công bố có review decision của người khác người soạn | Liên tục |
| USC-003 | Thông báo lệch phiên bản được xử lý kịp thời | Chưa có — xác lập bằng số vụ lệch ghi nhận trong 1 tháng | 100% thông báo lệch được thu hồi trong ≤1 ngày làm việc kể từ phát hiện | Thời gian từ ghi nhận lệch đến thu hồi | 1 tháng sau khi bật feature |
| USC-004 | Action nhạy cảm truy vết được | 0 audit hiện có | 100% action duyệt/từ chối/công bố/thu hồi có đủ ai-khi nào-lý do | Đối chiếu audit trên mẫu thông báo kiểm tra | Liên tục, review hàng tháng |
| USC-005 | Người dùng không bị ngập thông báo | Chưa có — xác lập bằng số thông báo công bố/tuần trong 1 tháng | Tỷ lệ đọc trung bình không giảm dưới 50% trên mọi thông báo | Tỷ lệ đọc trung bình theo thông báo | 1 tháng sau khi bật feature |

## 10. Open Questions

- [x] OQ-1: Nhãn phiên bản có bắt buộc khớp Git tag/image release không?
  — Resolved (đề xuất): không — nhãn là chuỗi hiển thị do admin nhập;
  nghiệp vụ đồng bộ với release kỹ thuật do admin đảm bảo; deployment
  authority còn là OQ-5 của PRD nên v1 không ràng buộc tích hợp — chờ
  Admin lead/Technical owner xác nhận.
- [x] OQ-2: Đối tượng nhận gồm những lựa chọn nào? — Resolved (đề xuất):
  v1 = toàn bộ người dùng + theo vai trò; theo đơn vị/chi nhánh để P2 —
  chờ Product owner xác nhận.
- [x] OQ-3: Ai là reviewer hợp lệ và có chặn tự duyệt không? — Resolved
  (đề xuất): vai trò "duyệt thông báo" gán qua org-governance; v1 chặn
  tự duyệt khi tổ chức có ≥2 người giữ quyền duyệt — chờ Admin lead
  xác nhận.
- [x] OQ-4: Các giới hạn số (150 ký tự tiêu đề, 10.000 ký tự nội dung,
  90 ngày hạn hiển thị cho người dùng mới, 7 ngày "đọc đúng hạn", 5
  phút chu kỳ kiểm tra lịch) có được owner chấp nhận làm chuẩn không? —
  Resolved (đề xuất): chấp nhận làm giá trị vận hành ban đầu, tinh chỉnh
  sau 1 tháng đo thực tế — chờ Admin lead xác nhận.
- [~] OQ-5: Cho sửa nội dung sau khi đã công bố không? — Out of scope
  v1: thuộc P1 của brainstorm (sửa có audit + đánh dấu "đã chỉnh sửa",
  tùy chọn "bắt buộc đọc lại"); v1 xử lý sai sót bằng thu hồi + thông
  báo đính chính mới.
- [~] OQ-6: Tự động gợi ý nội dung thông báo từ danh sách thay đổi kỹ
  thuật? — Out of scope v1: PRD nêu rõ "Chưa làm: tự động suy release
  note từ commit hoặc thay release automation"; OQ-5 PRD (deployment
  authority) phải đóng trước khi xét đối chiếu hiển thị ở P2.
- [~] OQ-7: Retention thông báo và read marker giữ bao lâu? — Out of
  scope feature: thuộc OQ-6 PRD (DPO/legal duyệt retention chung);
  đề xuất 24 tháng và trước pilot chỉ dùng dữ liệu synthetic.
