---
type: urd
feature: account-access
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/account-access/brainstorms/account-lifecycle-access.md, docs/_reverse/platform-communications-and-governance/reverse-spec.md]
---

# account-access — User Requirements Document

## 1. Purpose

Cho mọi vai trò nội bộ của tổ chức khách hàng một danh tính và phiên làm
việc an toàn: được admin mời, tự kích hoạt và tự khôi phục mật khẩu, đăng
nhập vào đúng tổ chức/phạm vi được cấp, và bị vô hiệu hóa kịp thời khi
không còn thuộc tổ chức.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Người dùng nội bộ (HR, quản lý, nhân viên, interviewer) | Truy cập nhiều công cụ rời hoặc file chia sẻ, mỗi nơi một tài khoản | Không rõ mình đang hành động trong tổ chức/phạm vi nào; quên mật khẩu phải nhờ IT/admin | Chậm truy cập, thao tác nhầm phạm vi, phụ thuộc admin cho việc nhỏ | Confirmed — PRD Mục 7.1, JTBD-HR-01/JTBD-ADM-01 |
| Admin | Cấp tài khoản thủ công qua từng công cụ | Không biết ai đang có quyền truy cập, không chứng minh được cho khách hàng | Mất kiểm soát truy cập, audit fail | Confirmed — PRD Mục 7.1, Mục 3 JTBD-ADM-01 |
| Cựu nhân viên (gián tiếp) | Tài khoản còn sống sau nghỉ việc trên các công cụ rời | Quyền truy cập không bị thu hồi kịp thời | Lộ dữ liệu nhân sự/ứng viên sau nghỉ việc | Assumption — suy từ rủi ro "sai phạm vi tổ chức" PRD Mục 7.1 |
| Security/audit owner | Không có lịch sử truy cập tối thiểu | Không điều tra được lượt đăng nhập nghi vấn | Không chứng minh được ranh giới truy cập | Observed: reverse spec FR-PL-01/FR-PL-06 (session routing, activity log đã có nền) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Người dùng nội bộ (mọi vai trò) | Được mời vào tổ chức, làm việc hàng ngày trên workspace | Vào đúng workspace của tổ chức mình nhanh, tự phục vụ khi quên mật khẩu | Quên mật khẩu phải nhờ admin; phiên hết hạn không rõ lý do; sợ vào nhầm tổ chức |
| secondary | Admin | Bootstrap và vận hành tài khoản cho tổ chức | Mời/suspend/deactivate tài khoản theo đúng tổ chức, biết trạng thái từng tài khoản | Không kiểm soát được ai đang truy cập; xử lý thủ công lặp lại |
| secondary | Security/audit owner | Điều tra sự cố truy cập | Sự kiện truy cập tối thiểu truy vết được | Không có log ai đăng nhập lúc nào |
| out | Ứng viên | Không có tài khoản; vào qua link được cấp của module nghiệp vụ | (gián tiếp) trải nghiệm link rõ ràng | Không thuộc feature này |

## 3. Scope Boundaries

### In Scope

- Admin mời tài khoản nội bộ theo tổ chức (họ tên, email, vai trò ban đầu,
  đơn vị); gửi lại lời mời khi link hết hạn.
- Kích hoạt tài khoản qua link một lần dùng có hạn; đặt mật khẩu lần đầu.
- Đăng nhập/đăng xuất bằng email + mật khẩu; kiểm tra trạng thái tài
  khoản và quan hệ tổ chức ngay trong xác thực; khóa tạm sau sai nhiều
  lần; captcha khi nghi ngờ.
- Quên/đặt lại mật khẩu qua link có hạn, chống dò tài khoản; đổi mật
  khẩu khi đang đăng nhập; thu hồi phiên khi đổi/reset.
- Trạng thái tài khoản: invited, active, suspended, deactivated; admin
  suspend/deactivate/reactivate; không xóa cứng tài khoản.
- Hồ sơ người dùng tối thiểu: họ tên, email định danh, vai trò hiển thị,
  đơn vị; user tự sửa họ tên/ảnh đại diện.
- Sự kiện truy cập tối thiểu (đăng nhập thành công/thất bại, reset, thu
  hồi phiên) phục vụ truy vết — audit nghiệp vụ chi tiết thuộc
  `org-governance`.
- Danh sách phiên đang hoạt động và tự thu hồi từng phiên (P1).

### Out of Scope

- Social login, SSO/federation với nhà cung cấp danh tính của khách hàng
  — chưa có quyết định (PRD Mục 7.1 "Chưa làm", OQ-6).
- Xác thực đa yếu tố (MFA) — hướng P2, mở theo OQ-2.
- Tài khoản cho ứng viên — ứng viên truy cập qua link/token của
  `candidate-assessment`, `offer-management`.
- Gán vai trò/phạm vi dữ liệu và nhật ký audit nghiệp vụ — thuộc
  `org-governance`; feature này chỉ cung cấp tài khoản + trạng thái.
- Vòng đời nhân sự (nghỉ việc, điều chuyển) — thuộc
  `employment-lifecycle`; feature này chỉ là điểm thu hồi quyền truy cập.
- Xóa vĩnh viễn tài khoản — v1 chỉ deactivate để giữ truy vết.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Admin | Khi có nhân sự mới cần truy cập | Mời tài khoản theo đúng tổ chức, kèm vai trò ban đầu và đơn vị; biết lời mời đã kích hoạt chưa | Tài khoản được cấp đúng chỗ, link mời có hạn, trạng thái rõ ràng | Critical | Confirmed — PRD Mục 7.1 (luồng "được tạo/mời → xác thực") |
| UN-002 | Người dùng nội bộ | Khi nhận email mời | Mở link, đặt mật khẩu lần đầu và vào workspace ngay mà không cần ai hỗ trợ | Kích hoạt xong có phiên làm việc đúng tổ chức | Critical | Confirmed — PRD Mục 7.1 |
| UN-003 | Người dùng nội bộ | Khi đăng nhập hàng ngày | Đăng nhập bằng email + mật khẩu, hệ thống tự đưa mình vào đúng tổ chức/phạm vi | Không bao giờ vào được workspace ngoài tổ chức được cấp | Critical | Confirmed — PRD Mục 7.1 (rủi ro chính), Mục 9 (org/role/scope constraint) |
| UN-004 | Người dùng nội bộ | Khi quên mật khẩu | Tự nhận link đặt lại qua email và đặt mật khẩu mới mà không cần admin | Khôi phục truy cập trong vài phút; mọi phiên cũ bị vô hiệu | Critical | Confirmed — PRD Mục 7.1 (reset mật khẩu) |
| UN-005 | Người dùng nội bộ | Khi phiên hết hạn hoặc đổi thiết bị | Hiểu vì sao bị đưa về đăng nhập và đăng nhập lại dễ dàng | Không mất ngữ cảnh đang làm; biết phiên đã kết thúc | High | Assumption — suy từ "kết thúc/khôi phục phiên" PRD Mục 7.1 |
| UN-006 | Admin | Khi nhân sự nghỉ việc hoặc vi phạm | Suspend tạm thời hoặc deactivate vĩnh viễn, phiên đang sống bị thu hồi ngay | Quyền truy cập mất hiệu lực ngay, có ghi nhận ai làm/khi nào | Critical | Confirmed — PRD Mục 7.1 (trạng thái tài khoản) |
| UN-007 | Người dùng nội bộ | Khi đổi mật khẩu chủ động | Đổi trong lúc đăng nhập có xác nhận mật khẩu hiện tại; các thiết bị khác tự đăng xuất | Mật khẩu mới áp dụng, phiên cũ không còn | High | Assumption — chuẩn vòng đời mật khẩu, chưa có trong PRD tường minh |
| UN-008 | Người dùng nội bộ | Khi muốn cập nhật thông tin hiển thị | Sửa họ tên và ảnh đại diện của mình; email/vai trò/đơn vị do admin quản | Hồ sơ hiển thị đúng mà không cần admin | Medium | Confirmed — PRD Mục 7.1 (hồ sơ người dùng tối thiểu) |
| UN-009 | Admin | Khi lời mời hết hạn hoặc gửi nhầm email | Gửi lại lời mời hoặc hủy lời mời chưa kích hoạt | Không bị kẹt tài khoản INVITED vô hạn | High | Assumption — suy từ rủi ro vận hành lời mời |
| UN-010 | Security/audit owner | Khi điều tra truy cập | Xem được sự kiện đăng nhập thành công/thất bại, reset mật khẩu, thu hồi phiên theo tài khoản và thời gian | Truy vết được vòng đời truy cập của một tài khoản | High | Observed: reverse spec FR-PL-06 (activity log đã có nền); mức tối thiểu là Assumption |
| UN-011 | Người dùng nội bộ | Khi nghi có phiên lạ trên thiết bị khác | Xem danh sách phiên đang hoạt động của mình và thu hồi phiên lạ | Tự kiểm soát thiết bị đang đăng nhập | Medium | Assumption — hướng P1 trong brainstorm |

## 5. Prioritized User Journeys

### Journey 1: Được mời và kích hoạt tài khoản

- **User:** Người dùng nội bộ (được admin mời)
- **Importance:** Critical
- **Trigger:** Admin gửi lời mời với họ tên, email, vai trò ban đầu, đơn vị.
- **Expected outcome:** Người được mời đặt mật khẩu lần đầu và vào đúng
  workspace của tổ chức.
- **Related needs:** UN-001, UN-002, UN-009

1) Admin tạo lời mời; hệ thống gửi email kèm link kích hoạt có hạn.
2) Người được mời mở link còn hạn, nhập mật khẩu mới đạt chính sách.
3) Tài khoản chuyển active, phiên đầu tiên được tạo, vào workspace.
4) Nếu link hết hạn: trang báo rõ và đường dẫn yêu cầu admin gửi lại.

**Independent verification:** Chọn một lời mời vừa hoàn tất — tài khoản
đang active, người đó đăng nhập được và chỉ thấy workspace của tổ chức
đã mời.

### Journey 2: Đăng nhập vào đúng workspace

- **User:** Người dùng nội bộ
- **Importance:** Critical
- **Trigger:** Người dùng mở trang đăng nhập của tổ chức.
- **Expected outcome:** Đăng nhập thành công vào đúng tổ chức/phạm vi;
  mọi nhánh từ chối đều có thông điệp rõ nhưng không lộ thông tin dò
  tài khoản.
- **Related needs:** UN-003, UN-005

1) Nhập email + mật khẩu; qua captcha nếu đang bị nghi ngờ.
2) Sai thông tin → thông báo chung, bộ đếm tăng; đủ ngưỡng → khóa tạm.
3) Đúng → kiểm tra trạng thái tài khoản (chưa kích hoạt/bị vô hiệu hóa
   → từ chối với thông điệp phù hợp).
4) Kiểm tra tài khoản thuộc tổ chức đang truy cập → không thuộc → từ
   chối với thông điệp chung.
5) Hợp lệ → tạo phiên, vào workspace.

**Independent verification:** Đăng nhập bằng tài khoản thuộc tổ chức A
vào cổng tổ chức B — bị từ chối; đăng nhập đúng cổng thấy đúng
workspace A.

### Journey 3: Tự đặt lại mật khẩu

- **User:** Người dùng nội bộ
- **Importance:** Critical
- **Trigger:** Người dùng quên mật khẩu tại trang đăng nhập.
- **Expected outcome:** Nhận link đặt lại qua email, đặt mật khẩu mới,
  mọi phiên cũ bị thu hồi; không lộ email có tồn tại hay không.
- **Related needs:** UN-004, UN-005

1) Chọn "Quên mật khẩu", nhập email → hệ thống trả lời chung bất kể
   email tồn tại hay không.
2) Email hợp lệ nhận link có hạn (tối đa số lần gửi theo giờ).
3) Mở link còn hạn → đặt mật khẩu mới → toàn bộ phiên cũ bị thu hồi.
4) Đăng nhập lại bằng mật khẩu mới.

**Independent verification:** Xin reset cho một email có thật và một
email bịa — phản hồi trên màn hình giống hệt nhau; chỉ hộp thư của
email có thật nhận link.

### Journey 4: Admin vô hiệu hóa tài khoản

- **User:** Admin
- **Importance:** High
- **Trigger:** Nhân sự nghỉ việc hoặc có nghi vấn truy cập trái phép.
- **Expected outcome:** Tài khoản mất truy cập ngay, phiên đang sống bị
  thu hồi, hành động có ghi nhận; không thể vô hiệu hóa admin cuối cùng
  của tổ chức.
- **Related needs:** UN-006, UN-010

1) Admin chọn tài khoản → suspend (tạm) hoặc deactivate (kết thúc),
   nhập lý do.
2) Hệ thống chuyển trạng thái, thu hồi mọi phiên đang sống, ghi sự kiện.
3) Suspend có thể mở lại; deactivate không đảo ngược — cùng email muốn
   dùng lại phải mời mới.

**Independent verification:** Suspend một tài khoản đang đăng nhập — ở
thao tác kế tiếp người đó bị đưa về trang đăng nhập và không đăng nhập
lại được.

### Journey 5: Đổi mật khẩu và quản lý phiên

- **User:** Người dùng nội bộ
- **Importance:** Medium
- **Trigger:** Người dùng chủ động đổi mật khẩu hoặc nghi phiên lạ.
- **Expected outcome:** Mật khẩu mới áp dụng sau khi xác nhận mật khẩu
  hiện tại; các phiên khác bị thu hồi; người dùng xem và thu hồi được
  từng phiên đang hoạt động.
- **Related needs:** UN-007, UN-011

1) Mở phần bảo mật tài khoản → nhập mật khẩu hiện tại + mật khẩu mới.
2) Thành công → phiên hiện tại giữ, mọi phiên khác bị thu hồi.
3) Xem danh sách phiên → thu hồi phiên không nhận ra.

**Independent verification:** Đăng nhập trên 2 thiết bị, đổi mật khẩu ở
thiết bị 1 — thiết bị 2 bị đăng xuất ở thao tác kế tiếp.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Link mời/reset hết hạn hoặc đã dùng | Người dùng không hiểu vì sao không đặt được mật khẩu | Trang báo "link hết hạn hoặc đã sử dụng" + đường dẫn yêu cầu link mới | Journey 1, 3 / UN-002, UN-004 |
| Nhập email không tồn tại ở form quên mật khẩu | Kẻ xấu dò được email hợp lệ | Phản hồi giống hệt trường hợp email tồn tại | Journey 3 / UN-004 |
| Sai mật khẩu nhiều lần liên tiếp | Bị khóa tạm không hiểu lý do | Thông báo rõ "tạm khóa do nhập sai nhiều lần — thử lại sau N phút" | Journey 2 / UN-003 |
| Tài khoản chưa kích hoạt cố đăng nhập | Bối rối vì đã có email mời | Thông báo "chưa kích hoạt — kiểm tra email mời" | Journey 1, 2 / UN-002 |
| Tài khoản suspended/deactivated đăng nhập | Cần biết phải liên hệ ai | Thông báo "đã bị vô hiệu hóa — liên hệ quản trị viên" | Journey 4 / UN-006 |
| Email mời/reset không tới (spam, SMTP lỗi) | Không kích hoạt/reset được | Admin gửi lại lời mời; người dùng xin lại link trong giới hạn | Journey 1, 3 / UN-009 |
| Admin suspend/deactivate admin cuối cùng của tổ chức | Tổ chức mất khả năng quản trị | Chặn hành động với thông báo rõ | Journey 4 / UN-006 |
| Đăng nhập đồng thời nhiều thiết bị | Lo phiên lạ không kiểm soát | Danh sách phiên + thu hồi từng phiên (P1) | Journey 5 / UN-011 |
| Admin mời nhầm email | Tài khoản INVITED treo | Hủy lời mời chưa kích hoạt hoặc deactivate rồi mời lại | Journey 1 / UN-009 |
| Người dùng xin reset khi tài khoản suspended | Không rõ vì sao không nhận được email | Phản hồi chung; admin xử lý trực tiếp trạng thái | Journey 3, 4 / UN-004, UN-006 |

## 7. User-side Constraints

- Giao diện tiếng Việt là ưu tiên; toàn bộ wording lỗi/email bằng tiếng
  Việt tự nhiên.
- Người dùng nội bộ phải có tài khoản thuộc đúng 1 tổ chức được mời;
  không có đăng ký công khai.
- Email là định danh duy nhất và là kênh nhận link — phụ thuộc hạ tầng
  gửi email do `platform-configuration`/`operational-email` vận hành.
- Người dùng chỉ tự sửa được họ tên/ảnh đại diện; email, vai trò, đơn vị
  do admin quản qua `org-governance`.
- Ứng viên không có giao diện đăng nhập của feature này.
- Mọi thông điệp từ chối xác thực phải chung, không lộ email tồn tại,
  trạng thái hay quan hệ tổ chức (trừ thông điệp trạng thái sau khi
  email+mật khẩu đã khớp).
- Màn đăng nhập/kích hoạt/reset dùng được trên trình duyệt desktop và
  mobile; quản trị người dùng ưu tiên desktop.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Mỗi tài khoản gắn đúng 1 tổ chức; người thuộc nhiều tổ chức có nhiều tài khoản | Nếu cần 1 tài khoản nhiều org → phải có bước chọn tổ chức sau đăng nhập | Assumption — phù hợp mô hình B2B tenant | Chốt khi spec hóa quan hệ tài khoản ↔ tổ chức |
| Các ngưỡng đề xuất: sai 5 lần → khóa 15 phút; captcha sau 3 lần; link mời 72 giờ; link reset 1 giờ; tối đa 3 link reset/giờ; phiên idle 8 giờ; phiên tuyệt đối 30 ngày | Nếu sponsor chỉnh → wording và limit đổi | Assumption — đề xuất hợp lý chờ duyệt | Chốt ở OQ-3 |
| Chính sách mật khẩu tối thiểu: ≥8 ký tự, có chữ và số | Nếu security owner yêu cầu mạnh hơn → form và wording đổi | Assumption | Chốt ở OQ-1 |
| SMTP/email đã vận hành cho kênh mời/reset | Nếu chưa → toàn bộ journey 1/3 chặn | Observed: reverse spec FR-PL-03/FR-PL-04 (email module có nền) | Xác nhận vận hành qua `platform-configuration` |
| Không xóa cứng tài khoản trong v1, chỉ deactivate | Nếu compliance yêu cầu xóa → cần quy trình xóa có kiểm soát | Assumption — bám truy vết audit | Chốt trong chính sách retention (OQ-5, OQ-6 PRD) |
| Ứng viên không có tài khoản hệ thống | Nếu ứng viên cần đăng nhập → phạm vi mở rộng lớn | Confirmed — PRD Mục 3 (persona), brainstorm | — |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Người được mời kích hoạt tài khoản thành công | Chưa có — xác lập trong 1 tháng pilot đầu | ≥90% lời mời kích hoạt trong 72 giờ (định hướng; chờ OQ-2 PRD) | Tỷ lệ lời mời có kích hoạt / lời mời đã gửi | 1 tháng sau pilot |
| USC-002 | Người dùng tự khôi phục mật khẩu không cần admin | Chưa có | ≥95% yêu cầu reset hoàn tất mà không cần admin can thiệp | Reset hoàn tất / yêu cầu reset hợp lệ | 1 tháng sau pilot |
| USC-003 | Không truy cập vượt phạm vi tổ chức | 0 sự cố | 0 sự cố xác nhận (guardrail cứng) | Số incident vượt org/role/scope — bám M-GR-01 PRD | Liên tục |
| USC-004 | Admin thu hồi truy cập kịp thời khi nghỉ việc | Chưa có | 100% tài khoản của người nghỉ việc được deactivate cùng ngày ghi nhận | Tỷ lệ tài khoản deactivated trong 24 giờ từ sự kiện nghỉ việc | Hàng tháng trong pilot |
| USC-005 | Người dùng hiểu vì sao bị đăng xuất | Chưa có | ≥90% phiên hết hạn/thu hồi hiển thị lý do rõ; không complaint "mất phiên không lý do" | Tỷ lệ chuyển về đăng nhập có thông báo nguyên nhân | 1 tháng sau pilot |

## 10. Open Questions

- [ ] OQ-1: Chính sách mật khẩu chính thức (độ dài tối thiểu, charset,
  cấm dùng lại, rotation) do ai duyệt — security owner hay product
  owner?
- [ ] OQ-2: MFA có bắt buộc cho vai trò admin trong v1/pilot không, hay
  để P2?
- [ ] OQ-3: Các ngưỡng đề xuất (5 lần sai → khóa 15 phút; captcha sau 3
  lần; link mời 72 giờ; link reset 1 giờ; idle 8 giờ; phiên tuyệt đối
  30 ngày) — sponsor duyệt hay chỉnh?
- [ ] OQ-4: Kênh email mời/reset cần SLA, retry, bounce và fallback nào
  (liên quan OQ-10 PRD)?
- [ ] OQ-5: Retention cho dữ liệu phiên và lịch sử sự kiện truy cập —
  giữ bao lâu, xóa thế nào khi tài khoản deactivate (liên quan OQ-6
  PRD)?
- [ ] OQ-6: SSO/federation có trong cam kết khách hàng pilot không — nếu
  có, thứ tự ưu tiên so với email + mật khẩu?
- [ ] OQ-7: Có cho phép 1 email tồn tại ở nhiều tổ chức (nhiều tài
  khoản) với cùng mật khẩu không, hay email phải duy nhất toàn hệ
  thống?
