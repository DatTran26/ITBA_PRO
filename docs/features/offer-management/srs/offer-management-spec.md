---
type: srs
feature: offer-management
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/offer-management/brainstorms/offer-version-approval-response.md
  - docs/features/offer-management/offer-management-urd.md
---

# offer-management — Software Requirements Specification

## 1. Scope

SRS này cover luồng offer cho ứng viên đạt của một tổ chức: tạo offer từ
application `PASSED`, soạn nội dung thành phiên bản, gửi duyệt → quyết định
có ghi nhận, gửi đúng ứng viên qua email chứa link xem có hạn, theo dõi đã
gửi/đã xem, ghi nhận chấp nhận/từ chối (tự phục vụ hoặc HR ghi thay), hết
hạn, thu hồi, đồng bộ stage pipeline và phát sự kiện cho onboarding — kèm
audit đầy đủ và bảo vệ dữ liệu lương/điều khoản theo quyền.

Lưu ý MoSCoW: feature ở mức **Should** — KHÔNG nằm trong cam kết lát cắt v1
(15 feature Must); đây là slice mở rộng hire-to-onboard (PRD Mục 6.1, 7.11).

KHÔNG cover: e-signature/legal workflow (PRD "Chưa làm" cho tới khi chọn
provider), soạn/gửi email nghiệp vụ (`operational-email`) và thông báo
(`contextual-notifications`), chuyển đổi thành nhân viên + checklist
(`employee-onboarding` — feature này chỉ phát sự kiện offer chấp nhận), quyết
định đạt/loại và stage pipeline (`candidate-pipeline`, `interview-evaluation`),
mẫu offer/đàm phán nhiều vòng/AI soạn offer (hướng P1/P2).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Soạn, gửi duyệt, gửi offer, theo dõi, ghi thay phản hồi, thu hồi | Có |
| Người duyệt offer (HR lead/quản lý có thẩm quyền) | người | Duyệt hoặc từ chối duyệt phiên bản offer, có ghi nhận | Có |
| Ứng viên | người (ngoài tổ chức, không tài khoản) | Xem offer qua link có hạn, chấp nhận/từ chối một lần | Có (chỉ surface link công khai) |
| Quản lý | người | Xem trạng thái offer trong phạm vi quyền (không xem điều khoản) | Có (read-only) |
| Admin | người | Truy vết audit, chuyển hàng chờ duyệt khi vắng | Có |
| `candidate-pipeline` | hệ thống (feature khác) | Nhận transition OFFERED/ACCEPTED/OFFER_REJECTED; cung cấp application | Không (consumer/provider qua sự kiện) |
| `interview-evaluation` | hệ thống (feature khác) | Điều kiện tiên quyết: application đạt sau review đánh giá | Không (nguồn điều kiện) |
| `employee-onboarding` | hệ thống (feature khác) | Nhận sự kiện "offer chấp nhận" để bắt đầu chuyển đổi | Không (consumer sự kiện) |
| `contextual-notifications` / `operational-email` | hệ thống (feature khác) | Kênh gửi email offer + nhắc hạn | Không (kênh vận chuyển) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-offer-management-001 | Tạo offer từ application đạt | Khi HR mở application đang `PASSED` và chọn "Tạo offer", hệ thống phải tạo offer mới ở trạng thái "Nháp", prefill ứng viên, vị trí và email liên hệ; nếu application không `PASSED` hoặc đã có offer đang mở thì phải chặn và báo lý do | P0 | test | PRD Mục 7.11; URD UN-001; điều kiện `PASSED` là đề xuất OQ-2 |
| FR-offer-management-002 | Soạn nội dung offer có cấu trúc | Hệ thống phải cho nhập và lưu phiên bản "Nháp" gồm: vị trí, phòng ban, mức lương/thù lao (con số hoặc cờ "thỏa thuận" + ghi chú), ngày bắt đầu dự kiến, hạn phản hồi, phúc lợi/ghi chú, nội dung thư mời | P0 | demo | PRD Mục 7.11 (version); URD UN-002 |
| FR-offer-management-003 | Gửi duyệt phiên bản offer | Khi HR bấm "Gửi duyệt", nếu phiên bản đủ trường bắt buộc thì hệ thống phải chuyển phiên bản sang "Chờ duyệt" và đưa vào hàng chờ của người duyệt kèm thông báo; nếu thiếu trường thì phải liệt kê field thiếu và giữ "Nháp" | P0 | test | PRD Mục 7.11 (approval); URD UN-003 |
| FR-offer-management-004 | Quyết định phê duyệt | Khi người duyệt quyết định trên phiên bản "Chờ duyệt", hệ thống phải ghi nhận "Đã duyệt" hoặc "Từ chối duyệt" kèm ghi chú (bắt buộc khi từ chối), người duyệt và thời điểm; phiên bản bị từ chối duyệt không được gửi và không tự mở lại | P0 | test | PRD Mục 7.11; URD UN-003 |
| FR-offer-management-005 | Phiên bản offer bất biến sau gửi | Khi offer cần sửa nội dung sau khi đã gửi, hệ thống phải tạo phiên bản mới ở "Nháp" (phiên bản đã gửi không sửa được), và phiên bản mới phải qua duyệt lại trước khi gửi lại | P0 | test | PRD Mục 7.11 (version); URD UN-008 |
| FR-offer-management-006 | Gửi offer đúng người | Khi HR bấm "Gửi offer", hệ thống phải kiểm tra phiên bản đang "Đã duyệt" và email người nhận khớp ứng viên của application (hoặc email ứng viên được cập nhật có xác nhận), rồi tạo link xem offer có hạn truy cập và gửi email mời xem; email không chứa lương/điều khoản | P0 | test | PRD Mục 7.11 (send, rủi ro sai người nhận); URD UN-004 |
| FR-offer-management-007 | Theo dõi trạng thái xem | Khi ứng viên mở link hợp lệ lần đầu, hệ thống phải ghi nhận thời điểm xem đầu tiên và số lần xem, chuyển offer sang "Đã xem"; mỗi lần mở sau chỉ tăng số lần xem | P0 | test | PRD Mục 7.11 (status); URD UN-005 |
| FR-offer-management-008 | Ứng viên phản hồi qua link | Khi ứng viên chọn "Chấp nhận" hoặc "Từ chối" (kèm lý do tùy chọn) và xác nhận trên link còn hiệu lực, hệ thống phải ghi nhận phản hồi kèm phiên bản đã xem, thời điểm, kênh "tự phản hồi"; phản hồi chỉ ghi một lần (idempotent) | P0 | test | PRD Mục 7.11 (response); URD UN-006; kênh là đề xuất OQ-1 |
| FR-offer-management-009 | HR ghi nhận phản hồi thay | Khi ứng viên phản hồi ngoài hệ thống, HR trong scope phải ghi được phản hồi thay kèm kênh nhận (điện thoại/email/trực tiếp) và lý do ghi thay bắt buộc; hệ thống xử lý trạng thái như phản hồi tự phục vụ | P0 | test | URD UN-007; brainstorm Mục 5.3 |
| FR-offer-management-010 | Hết hạn tự động | Khi offer "Đã gửi"/"Đã xem" quá hạn phản hồi mà chưa có phản hồi, hệ thống phải tự chuyển offer sang "Hết hạn", vô hiệu link và thông báo HR/owner; hệ thống phải cảnh báo "sắp hết hạn" trước hạn (đề xuất 2 ngày) | P0 | test | PRD Mục 7.11 (status); URD UN-005 |
| FR-offer-management-011 | Thu hồi offer | Khi HR thu hồi offer chưa chấp nhận kèm lý do bắt buộc, hệ thống phải chuyển offer sang "Đã thu hồi", vô hiệu mọi link đang sống và ghi audit; offer đã chấp nhận phải chặn thu hồi | P0 | test | URD UN-009; brainstorm Mục 5.5 |
| FR-offer-management-012 | Đồng bộ stage pipeline | Khi offer chuyển "Đã gửi", "Đã chấp nhận" hoặc "Đã từ chối", hệ thống phải phát transition tương ứng `OFFERED`/`ACCEPTED`/`OFFER_REJECTED` qua state machine của `candidate-pipeline` (nguồn "từ offer"), không tự ý đổi stage bằng đường khác | P0 | test | PRD Mục 7.11 (luồng chính); reverse spec FR-RC-07 |
| FR-offer-management-013 | Phát sự kiện offer chấp nhận | Khi offer chuyển "Đã chấp nhận", hệ thống phải phát sự kiện nghiệp vụ để `employee-onboarding` bắt đầu chuyển đổi và `contextual-notifications` báo owner liên quan | P0 | test | PRD Mục 7.11 (luồng chính "chuyển onboarding") |
| FR-offer-management-014 | Audit toàn bộ vòng đời | Hệ thống phải ghi vết cho mọi sự kiện: tạo, sửa phiên bản, gửi duyệt, quyết định duyệt, gửi, lần xem đầu, phản hồi (kênh + người ghi), nhắc, hết hạn, thu hồi — kèm actor, thời điểm, phiên bản liên quan | P0 | kiểm tra | PRD Mục 9; URD UN-010 |
| FR-offer-management-015 | Nhắc ứng viên chưa phản hồi | Khi offer "Đã gửi"/"Đã xem" sắp hết hạn, hệ thống phải cho HR gửi nhắc qua cùng kênh, tối đa 2 lần trước hạn phản hồi (giá trị đề xuất) | P1 | test | brainstorm Mục 4 (P1); URD Journey 3 |
| FR-offer-management-016 | Chuyển hàng chờ duyệt | Khi người duyệt vắng, admin/HR lead phải chuyển được offer "Chờ duyệt" sang người duyệt khác có thẩm quyền, có ghi nhận việc chuyển | P1 | demo | brainstorm Mục 6.5; OQ-3 |
| FR-offer-management-017 | Xem trước như ứng viên | Hệ thống phải cho HR xem trước phiên bản offer đúng như ứng viên sẽ thấy trước khi gửi | P1 | demo | brainstorm Mục 4 (P1) |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-offer-management-001 | security | Link xem offer có hạn truy cập và vô hiệu ngay khi offer thu hồi/hết hạn/đã phản hồi/có phiên bản mới; nội dung offer không lộ trong email hay với link đã vô hiệu | P0 | Kiểm thử mở link trong từng tình huống vô hiệu đều thấy trang thông báo, không thấy nội dung |
| NFR-offer-management-002 | security | Lương/điều khoản là dữ liệu hạn chế: deny-by-default cho vai trò chưa được cấp; quản lý chỉ thấy trạng thái | P0 | 0 sự cố lộ điều khoản cho người không có quyền được xác nhận (bám M-GR-01) |
| NFR-offer-management-003 | auditability | Mọi hành động nhạy cảm (duyệt, gửi, ghi thay phản hồi, thu hồi, chuyển hàng chờ) có vết ai/khi nào/trước-sau | P0 | Truy vết được 100% sự kiện trên offer kiểm tra bất kỳ |
| NFR-offer-management-004 | privacy | Dữ liệu offer theo consent/retention của hồ sơ tuyển dụng; trước khi DPO duyệt policy chỉ dùng dữ liệu synthetic | P0 | Không có dữ liệu ứng viên thật khi OQ-3/OQ-6 PRD còn mở (PRD Mục 9) |
| NFR-offer-management-005 | performance | Trang xem offer cho ứng viên tải được trên mobile | P1 | 95% lượt mở link hiển thị nội dung trong ≤3 giây (giá trị đề xuất — chờ OQ-5) |
| NFR-offer-management-006 | usability | Toàn bộ giao diện, email và trang offer tiếng Việt tự nhiên | P0 | Kiểm tra mẫu email/trang offer hiển thị đúng tiếng Việt có dấu |
| NFR-offer-management-007 | reliability | Gửi email offer thất bại không làm offer treo; trạng thái "Đã gửi" chỉ ghi khi giao nhận thành công hoặc có cơ chế retry + báo lỗi | P1 | Khi kênh email lỗi, offer ở "Đã duyệt" + lỗi giao nhận hiển thị, HR gửi lại được (bám R-07/R-12 PRD) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-offer-management-001 | Chỉ tạo offer cho application đang `PASSED` và chưa có offer đang mở; mỗi application tối đa 1 offer đang mở | Khi HR chọn "Tạo offer" | FR-offer-management-001 | brainstorm Mục 6.1 (D1); OQ-2 |
| BR-offer-management-002 | Chỉ phiên bản "Đã duyệt" mới được gửi cho ứng viên — không có ngoại lệ | Khi "Gửi offer" | FR-offer-management-006 | PRD Mục 12 (human-in-the-loop); Mục 7.11 |
| BR-offer-management-003 | Phiên bản đã gửi là bất biến; mọi sửa sau gửi phải tạo phiên bản mới qua duyệt lại | Khi sửa offer đã gửi | FR-offer-management-005 | PRD Mục 7.11 (version); brainstorm Mục 5.4 |
| BR-offer-management-004 | Email offer chỉ chứa link xem có hạn — không chứa lương/điều khoản | Khi dựng nội dung email gửi offer/nhắc | FR-offer-management-006 | brainstorm Mục 8; bám R-08 PRD |
| BR-offer-management-005 | Phản hồi chỉ ghi nhận một lần; phản hồi đầu tiên theo thời điểm ghi là phản hồi hiệu lực | Khi có phản hồi thứ hai (bất kể kênh) | FR-offer-management-008, FR-offer-management-009 | brainstorm Mục 6.4 |
| BR-offer-management-006 | Ghi thay phản hồi bắt buộc kênh nhận + lý do; chỉ HR trong scope được ghi | Khi HR "Ghi nhận phản hồi" | FR-offer-management-009 | brainstorm Mục 5.3; PRD Mục 9 |
| BR-offer-management-007 | Thu hồi bắt buộc lý do và chỉ áp dụng offer chưa chấp nhận; link vô hiệu ngay khi thu hồi | Khi HR "Thu hồi offer" | FR-offer-management-011 | brainstorm Mục 6.1 (D8) |
| BR-offer-management-008 | Quá hạn phản hồi mà chưa phản hồi → offer tự "Hết hạn"; hệ thống không tự gia hạn — gia hạn = phiên bản mới duyệt lại gửi lại | Khi đến hạn phản hồi | FR-offer-management-010 | brainstorm Mục 5.5 |
| BR-offer-management-009 | Gửi/accept/từ chối offer đồng bộ stage qua `candidate-pipeline`; thu hồi/hết hạn KHÔNG tự đổi stage (HR quyết định trên pipeline) | Khi offer đổi trạng thái tương ứng | FR-offer-management-012 | brainstorm Mục 8; candidate-pipeline brainstorm Mục 6.2 |
| BR-offer-management-010 | Link cũ của phiên bản đã gửi trước đó vô hiệu ngay khi phiên bản mới được gửi | Khi "Gửi lại offer" phiên bản mới | FR-offer-management-005 | brainstorm Mục 5.4 |
| BR-offer-management-011 | Offer nháp chưa từng gửi duyệt được xóa (giữ vết audit); offer đã từng gửi chỉ được thu hồi, không xóa | Khi yêu cầu xóa offer | FR-offer-management-014 | brainstorm Mục 6.5 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-offer-management-001 | Application chưa đủ điều kiện | "Tạo offer" khi application không `PASSED` hoặc đã có offer mở | major | FR-offer-management-001 | Hiện "Chỉ tạo offer cho ứng viên đang ở trạng thái «Đạt phỏng vấn»" hoặc "đang có một offer chưa kết thúc" | HR xử lý offer hiện có hoặc chờ đủ điều kiện |
| E-offer-management-002 | Thiếu trường khi gửi duyệt | "Gửi duyệt" trên phiên bản thiếu trường bắt buộc | minor | FR-offer-management-003 | Form hiện lỗi từng field + "Vui lòng điền đủ thông tin offer trước khi gửi duyệt: {danh sách field}" | Bổ sung rồi gửi lại |
| E-offer-management-003 | Gửi phiên bản chưa duyệt | "Gửi offer" trên phiên bản "Nháp"/"Chờ duyệt"/"Từ chối duyệt" | major | FR-offer-management-006 | Hiện "Phiên bản này chưa được duyệt — offer phải được duyệt trước khi gửi" | Chờ duyệt hoặc tạo phiên bản mới |
| E-offer-management-004 | Email người nhận không khớp | Email gửi khác email ứng viên của application | critical | FR-offer-management-006 | Hiện "Email người nhận không khớp hồ sơ ứng viên — kiểm tra lại trước khi gửi" | HR kiểm/cập nhật email ứng viên rồi gửi |
| E-offer-management-005 | Link hết hạn/vô hiệu | Ứng viên mở link của offer hết hạn/thu hồi/đã thay phiên bản | major | FR-offer-management-010, FR-offer-management-011 | Trang "Offer này đã hết hạn hoặc không còn hiệu lực — vui lòng liên hệ {tên công ty/HR}" | Ứng viên liên hệ HR; HR gia hạn phiên bản mới |
| E-offer-management-006 | Phản hồi trùng | Phản hồi trên offer đã có phản hồi | minor | FR-offer-management-008 | Hiện "Phản hồi của bạn đã được ghi nhận trước đó — cảm ơn bạn" | Giữ phản hồi đầu, không ghi đè |
| E-offer-management-007 | Thu hồi thiếu lý do / offer đã chấp nhận | "Thu hồi" không lý do hoặc trên offer "Đã chấp nhận" | major | FR-offer-management-011 | Hiện "Vui lòng nhập lý do thu hồi offer" hoặc "Offer đã được ứng viên chấp nhận — không thể thu hồi" | Nhập lý do / xử lý thủ công ngoài hệ thống |
| E-offer-management-008 | Gửi offer khi email lỗi | Kênh email fail khi "Gửi offer" | major | FR-offer-management-006; NFR-007 | Offer ở "Đã duyệt" + trạng thái giao nhận lỗi | Retry kênh; kiểm `operational-email` log; gửi lại |
| E-offer-management-009 | Sửa đồng thời một phiên bản | Người thứ hai lưu khi phiên bản vừa được cập nhật | minor | FR-offer-management-002 | Hiện "Offer vừa được {người} cập nhật — tải lại để xem bản mới nhất" | Tải lại, sửa trên bản mới |
| E-offer-management-010 | Truy cập ngoài phạm vi | Người dùng xem offer/application ngoài scope hoặc xem điều khoản không có quyền | major | FR-offer-management-014; NFR-002 | Hiện "Bạn không có quyền thao tác offer thuộc vị trí này"; ghi audit truy cập từ chối | Xin cấp quyền qua admin |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-offer-management-01 | Offer đi nhanh từ quyết định đạt tới ứng viên | Thời gian trung bình từ `PASSED` đến "Đã gửi" | ≤1 ngày làm việc sau 1 tháng pilot (đề xuất — chờ OQ-2 PRD) |
| SC-offer-management-02 | Mọi offer gửi đều qua duyệt | Tỷ lệ lần gửi có phiên bản "Đã duyệt" + người duyệt | 100% |
| SC-offer-management-03 | Ứng viên phản hồi kịp thời | Tỷ lệ offer có phản hồi trước hạn / offer đã gửi | ≥70% sau 1 quý pilot (đề xuất — chờ OQ-1/OQ-2 PRD) |
| SC-offer-management-04 | Không offer treo | Tỷ lệ offer quá hạn tự "Hết hạn" + có owner xử lý ≤3 ngày làm việc | 100% |
| SC-offer-management-05 | Không gửi sai người/version | Số incident gửi sai người nhận hoặc phiên bản chưa duyệt | 0 (guardrail, bám M-GR-01/R-08) |
| SC-offer-management-06 | Truy vết đầy đủ | Tỷ lệ offer có đủ vết soạn→duyệt→gửi→xem→phản hồi | 100% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Offer__ — một đề nghị tuyển dụng cho một application: trạng thái vòng đời,
  phiên bản hiệu lực, người tạo, tổ chức.
- __Phiên bản offer__ — snapshot nội dung (vị trí, lương, ngày bắt đầu, hạn
  phản hồi, thư mời) của một phiên bản; bất biến sau khi gửi.
- __Quyết định duyệt__ — duyệt/từ chối duyệt trên một phiên bản, người duyệt,
  ghi chú, thời điểm.
- __Lượt gửi (delivery)__ — một lần gửi phiên bản cho ứng viên: kênh, email
  người nhận, link/hạn truy cập, thời điểm xem đầu, số lần xem, số lần nhắc.
- __Phản hồi offer__ — chấp nhận/từ chối kèm phiên bản đã xem, kênh (tự phản
  hồi / ghi thay), người ghi, ghi chú, thời điểm.
- __Application / User__ — tham chiếu từ `candidate-pipeline` và
  `org-governance` (không sở hữu ở đây).

Chi tiết quan hệ + thuộc tính ở `srs/offer-management-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Tạo offer từ `PASSED` → soạn → gửi duyệt → duyệt → gửi ứng viên.
- __Flow 2:__ Ứng viên mở link → xem (ghi "đã xem") → chấp nhận/từ chối →
  đồng bộ pipeline → sự kiện onboarding khi chấp nhận.
- __Flow 3:__ HR ghi nhận phản hồi thay kèm kênh + lý do.
- __Flow 4:__ Tạo phiên bản mới sau gửi → duyệt lại → gửi lại → link cũ vô
  hiệu.
- __Flow 5:__ Thu hồi có lý do; hết hạn tự động → gia hạn hoặc đóng.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __offer-list__ — danh sách offer theo trạng thái/vị trí, cảnh báo sắp hết
  hạn.
- __offer-editor__ — soạn/sửa phiên bản offer có cấu trúc (điều khoản ẩn theo
  quyền).
- __offer-approval-queue__ — hàng chờ "Chờ duyệt" của người duyệt.
- __offer-detail__ — timeline vòng đời: phiên bản, duyệt, gửi, xem, phản hồi.
- __candidate-offer-view__ — trang ứng viên xem offer + nút chấp nhận/từ chối
  (mobile-first) + trạng thái hết hạn/thu hồi.
- __offer-send-confirm__ — màn xác nhận cuối: phiên bản, email người nhận,
  hạn phản hồi trước khi gửi.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Mọi offer thuộc 1 tổ chức; truy cập theo organization/role/data-scope | PRD Mục 9 — Security owner |
| Chỉ con người soạn/duyệt/gửi/ghi nhận; không có quyết định tự động | PRD Mục 12 (human-in-the-loop) — Product owner |
| Audit cho action nhạy cảm (duyệt, gửi, ghi thay, thu hồi) | PRD Mục 9 — Security owner |
| E-signature/legal workflow chưa làm — chờ chọn provider | PRD Mục 7.11 — Product owner |
| Email không chứa dữ liệu hạn chế; kiểm người nhận trước gửi | PRD R-08/R-12 — Operations + Security owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |
| Feature là Should — không kéo vào cam kết v1 | PRD Mục 6.1, Mục 7 — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Application ở `PASSED` + state machine nhận transition OFFERED/ACCEPTED/OFFER_REJECTED | `candidate-pipeline` | Tạo offer và đồng bộ stage |
| Đánh giá phỏng vấn đã review (điều kiện ứng viên đạt) | `interview-evaluation` | Điều kiện tiên quyết tạo offer |
| Kênh email gửi offer + nhắc hạn | `operational-email` / `contextual-notifications` | Gửi offer tới ứng viên (FR-006/015) |
| Vai trò "người duyệt offer" + phạm vi quyền | `org-governance` | Luồng duyệt và scope dữ liệu hạn chế |
| Điểm nhận sự kiện "offer chấp nhận" | `employee-onboarding` | Chuyển tiếp onboarding (FR-013) |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Điều kiện tạo offer = `PASSED` duy nhất (không gate số vòng) | FR-offer-management-001 phải thêm kiểm tra vòng đủ |
| Ứng viên phản hồi qua link self-service; ghi thay là fallback | FR-offer-management-008 thừa; FR-009 thành luồng chính |
| Một cấp duyệt, vai trò qua `org-governance` | FR-offer-management-004/016 cần đa tầng duyệt |
| Thu hồi/hết hạn không tự đổi stage pipeline | BR-offer-management-009 phải thêm transition ngược |
| Giới hạn (7 ngày phản hồi, 10 phiên bản, nhắc 2 lần, link +7 ngày) là chuẩn | Validation + FR-offer-management-010/015 đổi ngưỡng |
| Email gửi qua `operational-email`/`contextual-notifications` có delivery log | NFR-offer-management-007 phải tự quản lý giao nhận |

## 12. Open Questions

- [x] OQ-1: Kênh phản hồi của ứng viên và audit (OQ-RC-03)? — Resolved (đề
  xuất): link xem offer có hạn, phản hồi một lần + ghi thay kèm kênh/lý do —
  chờ Product owner xác nhận.
- [x] OQ-2: Điều kiện tạo offer (gate vòng phỏng vấn, GAP-RC-01)? — Resolved
  (đề xuất): application `PASSED` là điều kiện duy nhất — chờ Recruitment
  owner xác nhận.
- [x] OQ-3: Cấp duyệt offer? — Resolved (đề xuất): một cấp bởi vai trò có
  thẩm quyền; chuyển hàng chờ khi vắng — chờ Head of HR xác nhận.
- [x] OQ-4: Phạm vi xem lương/điều khoản? — Resolved (đề xuất): dữ liệu hạn
  chế (HR scope + người duyệt + đúng ứng viên); quản lý chỉ trạng thái — chờ
  DPO/legal xác nhận.
- [x] OQ-5: Giới hạn (hạn phản hồi 7 ngày/khung 1–30, 10 phiên bản, nhắc 2
  lần, link +7 ngày)? — Resolved (đề xuất): mặc định v1 — chờ Product owner.
- [x] OQ-6: Retention offer/phản hồi/access log? — Resolved (đề xuất): theo
  retention hồ sơ tuyển dụng; trước DPO duyệt chỉ synthetic (PRD OQ-6).
- [~] OQ-7: E-signature? — Out of scope v1: PRD Mục 7.11 "Chưa làm" cho tới
  khi chọn provider.
