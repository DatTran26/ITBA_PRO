---
type: srs
feature: account-access
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/account-access/brainstorms/account-lifecycle-access.md
  - docs/features/account-access/account-access-urd.md
  - docs/_reverse/platform-communications-and-governance/reverse-spec.md
---

# account-access — Software Requirements Specification

## 1. Scope

SRS này cover vòng đời danh tính và phiên làm việc của người dùng nội bộ trong
một tổ chức: admin mời tài khoản, kích hoạt qua link có hạn, đăng nhập/đăng
xuất bằng email + mật khẩu, đặt lại/đổi mật khẩu, trạng thái tài khoản
(invited/active/suspended/deactivated), hồ sơ người dùng tối thiểu, quản lý
phiên và sự kiện truy cập tối thiểu phục vụ truy vết. KHÔNG cover: gán vai
trò/phạm vi dữ liệu và nhật ký audit nghiệp vụ (`org-governance`), SSO/federation
và MFA (chưa có quyết định — PRD Mục 7.1 "Chưa làm"), tài khoản ứng viên
(truy cập qua link/token của `candidate-assessment`, `offer-management`),
vòng đời nhân sự (`employment-lifecycle` — feature này chỉ là điểm thu hồi
quyền truy cập), và xóa vĩnh viễn tài khoản.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Người dùng nội bộ (HR, quản lý, nhân viên, interviewer, admin) | người | Kích hoạt, đăng nhập vào đúng tổ chức, tự khôi phục mật khẩu, quản lý phiên | Có |
| Admin | người | Mời/suspend/reactivate/deactivate tài khoản trong tổ chức mình, biết trạng thái từng tài khoản | Có |
| Security/audit owner | người | Truy vết sự kiện truy cập của một tài khoản | Có |
| Ứng viên | người | Truy cập bằng link được cấp của module nghiệp vụ | Không (không có tài khoản — PRD Mục 3) |
| `org-governance` | hệ thống (feature khác) | Đọc trạng thái tài khoản để gán quyền; yêu cầu thu hồi phiên khi kết thúc gán | Không (consumer/nhà cung cấp lẫn nhau) |
| `platform-configuration` / `operational-email` | hệ thống (feature khác) | Cung cấp kênh email gửi link mời/reset | Không (dependency) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-account-access-001 | Mời tài khoản nội bộ | Khi admin tạo lời mời với họ tên, email, vai trò ban đầu và đơn vị, hệ thống phải kiểm tra email hợp lệ và chưa tồn tại trong tổ chức, tạo tài khoản ở trạng thái INVITED và gửi email mời kèm link kích hoạt một lần dùng | P0 | test | PRD Mục 7.1 (luồng "được tạo/mời"); URD UN-001 |
| FR-account-access-002 | Gửi lại và hủy lời mời | Khi lời mời hết hạn hoặc gửi nhầm, hệ thống phải cho admin gửi lại (phát hành link mới, vô hiệu link cũ) hoặc hủy lời mời chưa kích hoạt | P1 | test | brainstorm Mục 5.1, 6.4; URD UN-009 |
| FR-account-access-003 | Kích hoạt tài khoản | Khi người được mời mở link còn hạn và chưa dùng rồi đặt mật khẩu đạt chính sách, hệ thống phải đánh dấu link USED, chuyển tài khoản sang ACTIVE và tạo phiên đầu tiên vào đúng tổ chức | P0 | test | PRD Mục 7.1; URD UN-002 |
| FR-account-access-004 | Đăng nhập có kiểm tra phạm vi | Khi người dùng đăng nhập bằng email + mật khẩu, hệ thống phải so khớp thông tin, kiểm tra trạng thái tài khoản và kiểm tra tài khoản thuộc tổ chức đang truy cập trước khi tạo phiên; mọi nhánh từ chối trước xác thực trạng thái phải dùng thông điệp chung | P0 | test | PRD Mục 7.1 (rủi ro chính), Mục 9; URD UN-003 |
| FR-account-access-005 | Khóa tạm và captcha | Nếu một tài khoản sai mật khẩu 5 lần liên tiếp thì hệ thống phải khóa đăng nhập 15 phút; sau 3 lần sai liên tiếp hệ thống phải yêu cầu xác minh không-phải-robot (captcha) trước khi thử tiếp | P0 | test | brainstorm Mục 5.2, 7.2 (ngưỡng đề xuất — OQ-3) |
| FR-account-access-006 | Quên/đặt lại mật khẩu | Khi người dùng yêu cầu đặt lại mật khẩu, hệ thống phải trả lời chung bất kể email tồn tại; nếu email hợp lệ thì phát hành link đặt lại một lần dùng có hạn, giới hạn số link theo giờ; khi đặt lại thành công phải thu hồi toàn bộ phiên hiện có | P0 | test | PRD Mục 7.1 (reset mật khẩu); URD UN-004 |
| FR-account-access-007 | Đổi mật khẩu khi đang đăng nhập | Khi người dùng đổi mật khẩu trong phiên, hệ thống phải yêu cầu mật khẩu hiện tại, kiểm tra mật khẩu mới khác hiện tại và đạt chính sách, rồi thu hồi mọi phiên khác (giữ phiên hiện tại) | P0 | test | brainstorm Mục 6.5; URD UN-007 |
| FR-account-access-008 | Đăng xuất và hết hạn phiên | Khi người dùng đăng xuất, hệ thống phải thu hồi phiên hiện tại; khi phiên không hoạt động quá ngưỡng idle hoặc quá tuổi tuyệt đối, hệ thống phải hết hạn phiên và đưa người dùng về đăng nhập kèm lý do ở thao tác kế tiếp | P0 | test | PRD Mục 7.1 ("kết thúc/khôi phục phiên"); URD UN-005 |
| FR-account-access-009 | Quản lý trạng thái tài khoản | Hệ thống phải cho admin chuyển tài khoản giữa các trạng thái: suspend (mở lại được) và deactivate (không đảo ngược), kèm thu hồi mọi phiên đang sống và ghi sự kiện; khi hành động làm mất admin cuối cùng của tổ chức thì phải chặn | P0 | test | PRD Mục 7.1 (trạng thái tài khoản); URD UN-006 |
| FR-account-access-010 | Hồ sơ người dùng tối thiểu | Hệ thống phải giữ hồ sơ tối thiểu: họ tên, email định danh, vai trò hiển thị, đơn vị, ảnh đại diện; người dùng tự sửa họ tên và ảnh đại diện, còn email/vai trò/đơn vị do admin quản | P0 | demo | PRD Mục 7.1; URD UN-008 |
| FR-account-access-011 | Sự kiện truy cập tối thiểu | Hệ thống phải ghi sự kiện truy cập tối thiểu: đăng nhập thành công/thất bại, phát hành/dùng link, đặt lại/đổi mật khẩu, thu hồi phiên, suspend/deactivate — kèm tài khoản, thời điểm và người thực hiện (nếu là admin) | P0 | kiểm tra | PRD Mục 9 (audit boundary); reverse spec FR-PL-06; URD UN-010 |
| FR-account-access-012 | Danh sách và thu hồi phiên | Hệ thống phải cho người dùng xem các phiên đang hoạt động của mình và thu hồi từng phiên lẻ | P1 | demo | brainstorm Mục 4 (P1); URD UN-011 |
| FR-account-access-013 | Buộc đổi mật khẩu lần đầu | Nếu admin tạo tài khoản trực tiếp (không qua link mời) thì hệ thống phải buộc người dùng đổi mật khẩu ở lần đăng nhập đầu tiên | P1 | test | brainstorm Mục 4 (P1) |
| FR-account-access-014 | Đổi email đăng nhập | Khi đổi email đăng nhập, hệ thống phải gửi xác nhận tới địa chỉ mới và chỉ áp dụng sau khi xác nhận | P1 | test | brainstorm Mục 4 (P1) |
| FR-account-access-015 | Khôi phục phiên sau đăng nhập lại | Khi người dùng đăng nhập lại sau hết hạn, hệ thống phải tạo phiên mới và đưa về màn hình đang xem nếu còn hợp lệ trong phạm vi | P1 | demo | brainstorm Mục 5.4; URD UN-005 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-account-access-001 | security | Ranh giới tổ chức là deny-by-default: không có quan hệ tài khoản ↔ tổ chức hợp lệ thì không có phiên, trên mọi surface | P0 | 0 sự cố truy cập vượt tổ chức được xác nhận (guardrail bám M-GR-01) |
| NFR-account-access-002 | security | Chống dò tài khoản: phản hồi quên mật khẩu và đăng nhập sai không tiết lộ email tồn tại, trạng thái hay quan hệ tổ chức | P0 | Kiểm tra thủ công các nhánh từ chối cho ra cùng thông điệp/timing tương đương |
| NFR-account-access-003 | security | Thu hồi truy cập có hiệu lực kịp thời: tài khoản suspended/deactivated hoặc phiên bị thu hồi mất truy cập ngay ở thao tác kế tiếp | P0 | Suspend một tài khoản đang đăng nhập — request kế tiếp bị từ chối |
| NFR-account-access-004 | auditability | 100% sự kiện truy cập tối thiểu (FR-account-access-011) truy vết được theo tài khoản và khoảng thời gian | P0 | Đối chiếu chuỗi hành động trên một tài khoản mẫu với sự kiện ghi nhận |
| NFR-account-access-005 | performance | Người dùng đăng nhập thành công và thấy workspace của mình trong thời gian chấp nhận được ở quy mô pilot | P1 | 95% lượt đăng nhập hợp lệ hoàn tất trong ≤3 giây (đề xuất — OQ-3) |
| NFR-account-access-006 | usability | Toàn bộ giao diện, email mời/reset và thông báo lỗi bằng tiếng Việt tự nhiên; màn xác thực dùng được trên desktop và mobile | P0 | Kiểm tra wording theo bảng mẫu; màn auth render đúng trên 2 loại thiết bị |
| NFR-account-access-007 | data-retention | Sự kiện truy cập và phiên đã kết thúc được giữ theo retention đã công bố; không xóa cứng tài khoản trong v1 | P1 | Retention đề xuất 12 tháng rolling — chờ DPO duyệt (OQ-5, liên quan OQ-6 PRD) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-account-access-001 | Không có đăng ký công khai — tài khoản chỉ được tạo qua lời mời của admin trong tổ chức | Mọi yêu cầu tạo tài khoản | FR-account-access-001 | PRD Mục 3 (B2B); brainstorm Mục 2 |
| BR-account-access-002 | Email là định danh duy nhất trong phạm vi một tổ chức, không phân biệt hoa thường | Khi mời/đổi email | FR-account-access-001, FR-account-access-014 | brainstorm Mục 7.1 |
| BR-account-access-003 | Link kích hoạt/reset là một lần dùng và có hạn; phát hành link mới cùng loại vô hiệu link cũ | Khi phát hành/dùng link | FR-account-access-003, FR-account-access-006 | brainstorm Mục 7.1, 6.3 |
| BR-account-access-004 | Mọi thay đổi mật khẩu thành công (đặt lại hoặc đổi) phải thu hồi các phiên hiện có khác | Sau khi đổi/reset mật khẩu | FR-account-access-006, FR-account-access-007 | brainstorm Mục 5.3, 6.5 |
| BR-account-access-005 | Tài khoản ở INVITED/SUSPENDED/DEACTIVATED không được cấp phiên | Khi xác thực | FR-account-access-004 | brainstorm Mục 6.2 |
| BR-account-access-006 | Không được suspend/deactivate admin cuối cùng của tổ chức | Khi admin thao tác trên tài khoản admin | FR-account-access-009 | brainstorm Mục 6.1 (D7) |
| BR-account-access-007 | V1 không xóa cứng tài khoản — chỉ deactivate để giữ truy vết | Khi có yêu cầu xóa tài khoản | FR-account-access-009 | brainstorm Mục 6.5 |
| BR-account-access-008 | Thông điệp từ chối trước khi so khớp mật khẩu phải chung; thông điệp trạng thái chỉ hiện sau khi email+mật khẩu đã khớp | Mọi nhánh từ chối đăng nhập | FR-account-access-004, FR-account-access-005 | brainstorm Mục 5.2, 7.3; URD Mục 7 |
| BR-account-access-009 | Ứng viên không có tài khoản trong feature này — truy cập qua link/token của module nghiệp vụ | Mọi yêu cầu đăng nhập của ứng viên | FR-account-access-004 | PRD Mục 3; URD Mục 3 |
| BR-account-access-010 | Gán/kết thúc quyền nghiệp vụ do `org-governance` thực hiện; khi gán kết thúc hoặc tài khoản bị vô hiệu thì phiên đang sống phải bị thu hồi | Sự kiện kết thúc gán/vô hiệu tài khoản | FR-account-access-009 | brainstorm org-governance Mục 5.5; PRD Mục 9 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-account-access-001 | Sai email/mật khẩu | So khớp thất bại | minor | FR-account-access-004 | Hiện "Email hoặc mật khẩu không đúng"; +1 bộ đếm | Nhập lại; quên mật khẩu |
| E-account-access-002 | Tài khoản khóa tạm | Sai đủ 5 lần liên tiếp | major | FR-account-access-005 | Hiện "Tài khoản tạm khóa do nhập sai nhiều lần — thử lại sau {số} phút" | Chờ hết khóa hoặc đặt lại mật khẩu |
| E-account-access-003 | Tài khoản chưa kích hoạt | Đăng nhập khi INVITED | minor | FR-account-access-004 | Hiện "Tài khoản chưa kích hoạt — kiểm tra email mời hoặc liên hệ quản trị viên" | Mở link mời hoặc nhờ admin gửi lại |
| E-account-access-004 | Tài khoản bị vô hiệu hóa | Đăng nhập khi SUSPENDED/DEACTIVATED | major | FR-account-access-004, FR-account-access-009 | Hiện "Tài khoản của bạn đã bị vô hiệu hóa — liên hệ quản trị viên" | Admin xử lý trạng thái |
| E-account-access-005 | Link hết hạn/đã dùng | Mở link invite/reset không còn hiệu lực | major | FR-account-access-003, FR-account-access-006 | Trang "Link này đã hết hạn hoặc đã được sử dụng — yêu cầu gửi link mới" | Xin link mới / admin gửi lại lời mời |
| E-account-access-006 | Email đã tồn tại | Admin mời email đã có trong tổ chức | minor | FR-account-access-001 | Hiện "Email này đã có tài khoản trong tổ chức" | Kiểm tra tài khoản hiện có |
| E-account-access-007 | Mật khẩu không đạt chính sách | Đặt mật khẩu yếu hoặc nhập lại không khớp | minor | FR-account-access-003, FR-account-access-006, FR-account-access-007 | Hiện "Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số" / "Mật khẩu nhập lại không khớp" | Sửa tại form, link vẫn dùng được |
| E-account-access-008 | Vô hiệu hóa admin cuối cùng | Suspend/deactivate admin duy nhất còn lại | critical | FR-account-access-009 | Hiện "Không thể vô hiệu hóa — đây là quản trị viên cuối cùng của tổ chức" | Gán thêm admin trước |
| E-account-access-009 | Email mời/reset không gửi được | SMTP lỗi hoặc email vào spam | major | FR-account-access-001, FR-account-access-006 | Trạng thái gửi thất bại hiển thị cho admin; người dùng vẫn thấy phản hồi chung | Admin gửi lại; kiểm tra cấu hình SMTP (`platform-configuration`) |
| E-account-access-010 | Vượt giới hạn xin link reset | Quá 3 link/giờ/email | minor | FR-account-access-006 | Vẫn hiện phản hồi chung như thường | Chờ hết giờ hoặc admin hỗ trợ |
| E-account-access-011 | Mật khẩu hiện tại sai khi đổi | Nhập sai mật khẩu hiện tại | minor | FR-account-access-007 | Hiện "Mật khẩu hiện tại không đúng" | Nhập lại hoặc dùng quên mật khẩu |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-account-access-01 | Người được mời kích hoạt thành công | Tỷ lệ lời mời có kích hoạt / lời mời đã gửi | ≥90% trong 72 giờ (định hướng — chờ OQ-2 PRD) |
| SC-account-access-02 | Tự khôi phục mật khẩu không cần admin | Reset hoàn tất / yêu cầu reset hợp lệ | ≥95% sau 1 tháng pilot |
| SC-account-access-03 | Không truy cập vượt phạm vi tổ chức | Số incident vượt org/role/scope (M-GR-01) | 0 sự cố xác nhận (guardrail cứng) |
| SC-account-access-04 | Thu hồi truy cập kịp thời khi nghỉ việc | Tỷ lệ tài khoản deactivated trong 24 giờ từ sự kiện nghỉ việc | 100% (đề xuất — chờ sponsor) |
| SC-account-access-05 | Người dùng hiểu trạng thái phiên | Tỷ lệ chuyển về đăng nhập có thông báo nguyên nhân rõ | ≥90% (đề xuất) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Người dùng (USER)__ — tài khoản nội bộ của một tổ chức: email định danh,
  họ tên, ảnh đại diện, trạng thái vòng đời, đơn vị hiển thị; entity nền được
  mọi feature khác tham chiếu.
- __Link truy cập (ACCESS_LINK)__ — link mời/đặt lại mật khẩu một lần dùng có
  hạn và trạng thái issued/used/expired.
- __Phiên (SESSION)__ — phiên làm việc được tạo sau xác thực, có hạn idle và
  tuyệt đối, bị thu hồi khi logout/đổi mật khẩu/vô hiệu tài khoản.
- __Sự kiện truy cập (ACCESS_EVENT)__ — vết tối thiểu của đăng nhập, link,
  mật khẩu và thay đổi trạng thái phục vụ truy vết.
- __Tổ chức (ORGANIZATION)__ — tenant sở hữu tài khoản; entity do
  `org-governance` sở hữu, chỉ tham chiếu.

Chi tiết quan hệ + thuộc tính ở `srs/account-access-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Admin mời → email link → đặt mật khẩu lần đầu → ACTIVE + phiên.
- __Flow 2:__ Đăng nhập → captcha nếu nghi ngờ → so khớp → trạng thái → quan
  hệ tổ chức → phiên; mọi nhánh từ chối có thông điệp phù hợp.
- __Flow 3:__ Quên mật khẩu → phản hồi chung → link có hạn → đặt mật khẩu mới
  → thu hồi toàn bộ phiên.
- __Flow 4:__ Đăng xuất/hết hạn idle → phiên kết thúc → đăng nhập lại khôi
  phục ngữ cảnh.
- __Flow 5:__ Admin suspend/deactivate → thu hồi phiên → ghi sự kiện; mở lại
  suspend hoặc mời mới sau deactivate.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __login__ — đăng nhập theo cổng tổ chức, captcha khi nghi ngờ.
- __forgot-password / reset-password__ — xin link và đặt mật khẩu mới.
- __activate-account__ — đặt mật khẩu lần đầu qua link mời.
- __admin-user-list__ — danh sách tài khoản + trạng thái + mời/suspend/deactivate.
- __profile-security__ — hồ sơ tối thiểu, đổi mật khẩu, danh sách phiên.
- __link-expired__ — trang link hết hạn với đường dẫn xin link mới.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Sản phẩm B2B: tài khoản được cấp bởi tổ chức, không đăng ký công khai | PRD Mục 3, Mục 5 — Product owner |
| Mọi truy cập tuân theo organization/role/data-scope; deny-by-default | PRD Mục 9 — Security owner |
| Human-in-the-loop và audit cho hành động nhạy cảm (suspend/deactivate) | PRD Mục 9, Mục 12 — Security owner |
| Email là kênh định danh và nhận link — phụ thuộc hạ tầng gửi email | brainstorm Mục 8 — Operations owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |
| Ngôn ngữ giao diện tiếng Việt ưu tiên | PRD Mục 9 — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Tổ chức/đơn vị và catalog vai trò để gán khi mời | `org-governance` | FR-account-access-001 không gán được đơn vị/vai trò |
| Kênh email gửi link mời/reset (SMTP) | `platform-configuration` / `operational-email` | Journey kích hoạt và reset bị chặn |
| Thu hồi phiên khi gán kết thúc | `org-governance` gọi vào | Quyền thừa tồn tại trong phiên sống |
| Trigger deactivate khi nghỉ việc | `employment-lifecycle` (roadmap) | Tài khoản cựu nhân viên còn sống |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Mỗi tài khoản gắn đúng 1 tổ chức; người thuộc nhiều tổ chức có nhiều tài khoản | FR-account-access-004 cần bước chọn tổ chức sau đăng nhập |
| Các ngưỡng: sai 5 lần → khóa 15 phút; captcha sau 3 lần; link mời 72 giờ; link reset 1 giờ; tối đa 3 link reset/giờ; idle 8 giờ; phiên tuyệt đối 30 ngày | FR-account-access-005/006/008 và wording đổi ngưỡng |
| Chính sách mật khẩu tối thiểu: ≥8 ký tự, có chữ và số | FR-account-access-007 và E-account-access-007 đổi |
| Phiên là khái niệm nghiệp vụ; cơ chế kỹ thuật (token, lưu trữ) để kiến trúc quyết | Không ảnh hưởng requirement |
| Email mời/reset đi qua kênh email nghiệp vụ của sản phẩm | FR-account-access-001/006 cần kênh riêng |

## 12. Open Questions

- [x] OQ-1: Chính sách mật khẩu chính thức? — Resolved (đề xuất): tối thiểu
  8 ký tự gồm chữ và số; không rotation, không cấm dùng lại trong v1 —
  chờ Security owner xác nhận.
- [x] OQ-2: MFA bắt buộc cho admin trong v1? — Resolved (đề xuất): không
  bắt buộc trong v1/pilot, đưa vào lộ trình P2 — chờ Security owner xác
  nhận (PRD không yêu cầu MFA).
- [x] OQ-3: Các ngưỡng đề xuất (5 lần sai → khóa 15 phút; captcha sau 3
  lần; link mời 72 giờ; link reset 1 giờ; idle 8 giờ; phiên tuyệt đối 30
  ngày; đăng nhập ≤3 giây)? — Resolved (đề xuất): giữ các giá trị trên làm
  chuẩn v1 — chờ sponsor/Product owner xác nhận.
- [x] OQ-4: SLA/retry/bounce cho email mời/reset (PRD OQ-10)? — Resolved
  (đề xuất): kế thừa chính sách của `operational-email`; khi gửi thất bại,
  admin thấy trạng thái và gửi lại — chờ Technical/Operations owner.
- [x] OQ-5: Retention cho phiên và sự kiện truy cập (PRD OQ-6)? — Resolved
  (đề xuất): sự kiện truy cập giữ 12 tháng rolling thống nhất với audit của
  `org-governance`; phiên kết thúc xóa khỏi danh sách hoạt động ngay; khi
  tài khoản deactivate vẫn giữ sự kiện để truy vết — chờ DPO/legal xác nhận.
- [~] OQ-6: SSO/federation trong pilot? — Out of scope v1: PRD Mục 7.1
  "Chưa làm"; luồng mời nội bộ email+mật khẩu vẫn cần kể cả khi có SSO sau
  này — chờ quyết định SSO riêng của Product owner.
- [x] OQ-7: Một email tồn tại ở nhiều tổ chức? — Resolved: được — email
  duy nhất trong phạm vi một tổ chức; cùng email ở tổ chức khác là tài
  khoản khác với mật khẩu độc lập, bám mô hình B2B multi-tenant — chờ
  Product owner xác nhận.

## 13. develop-hieu implemented slice: biometric account access

This branch adds the implemented Face ID account-access slice on top of the
base account lifecycle.

- `/login` keeps the normal email/password sign-in flow and adds Face ID Sign
  In through a webcam capture.
- `/login` also exposes the Register tab. New account registration requires
  full name, email, password, password confirmation, and six normalized face
  captures before the account is created.
- New registered users default to role `user`. Admins and super admins grant
  the final system role later from user management.
- The browser only talks to Next.js BFF routes. Next.js calls the Python Vision
  AI service through `VISION_AI_URL`; the browser never calls Python directly
  and never receives server secrets.
- Face enrollment and verification use ArcFace/InsightFace embeddings produced
  by the Vision AI service. Face data is stored on local disk under
  `FACE_DATA_DIR`, using profile-named folders such as
  `Profile Name__userId`.
- `/dashboard/my-face` lets an authenticated user register, refresh, or delete
  their own biometric profile.
- `/dashboard/faces` remains the admin-facing face management surface.
- Local development can fall back to the face-store registry when
  `SUPABASE_SERVICE_ROLE_KEY` is not configured. Production keeps Supabase
  auth/admin as the source of account creation.

Boundaries for this slice:

- Face ID sign-in is a local biometric convenience flow, not a replacement for
  production Supabase session hardening.
- Liveness and anti-spoofing beyond the current capture/embedding flow remain
  future work.
