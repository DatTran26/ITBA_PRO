---
type: urd
feature: contextual-notifications
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/contextual-notifications/brainstorms/unified-notification-center.md, docs/_reverse/platform-communications-and-governance/reverse-spec.md]
---

# contextual-notifications — User Requirements Document

## 1. Purpose

Cho mọi người dùng một trung tâm thông báo theo ngữ cảnh: khi có việc được
giao, hạn đổi, lịch phỏng vấn, bài đánh giá, offer hoặc request chờ duyệt,
đúng người nhận được tin đúng kênh — in-app cho người dùng nội bộ, email
cho ứng viên — và việc gửi/nhận đều truy vết được thay vì nhắc tay rải rác
qua nhiều nền tảng.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Nhắc interviewer và ứng viên qua email/chat cá nhân trên nhiều nền tảng | Không biết ai đã nhận, dễ sót người khi lịch đổi | Mất thời gian nhắc tay, phiên phỏng vấn bị miss | Confirmed — PRD Mục 7.26; brainstorm Mục 2 |
| Interviewer | Lịch phỏng vấn nằm trong hòm mail/chat cá nhân | Tin trôi, không có nhắc giờ thống nhất | Đến trễ hoặc miss phiên được phân công | Confirmed — PRD Mục 7.26, JTBD-INT-01 |
| Quản lý | Request phê duyệt đến qua nhiều kênh rời | Không biết có gì đang chờ mình duyệt | Request treo, quy trình tuyển/duyệt chậm | Confirmed — PRD Mục 7.26 (phê duyệt), JTBD-MGR-01 |
| Nhân viên | Việc được giao/đổi hạn báo qua chat | Không biết hạn mới, dễ bỏ sót | Task quá hạn, bị nhắc thủ công | Confirmed — PRD Mục 7.26, JTBD-EMP-01 |
| Ứng viên | Không có tài khoản hệ thống | Dễ miss lịch phỏng vấn/bài đánh giá/offer | Trải nghiệm tuyển dụng kém, nguy cơ mất ứng viên | Confirmed — PRD Mục 7 (hành trình ứng viên), JTBD-CAN-01 |
| Admin | Email hệ thống lỗi không ai hay | Không phát hiện gửi thất bại | Người nhận không được báo mà không ai biết để xử lý | Assumption — suy từ rủi ro PRD Mục 7.26 và R-12 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Người dùng nội bộ nhận thông báo (nhân viên, interviewer, quản lý, HR) | Làm việc trong hệ thống hàng ngày, có việc/lịch/phê duyệt liên quan đến mình | Biết đúng việc cần làm và thời hạn mà không phải canh nhiều kênh | Tin trôi trong email/chat, không có chỗ hợp nhất, không biết hạn mới |
| secondary | Ứng viên | Không có tài khoản, chỉ nhận qua email | Nhận lịch/bài đánh giá/offer rõ ràng, đúng giờ, có đường vào xem | Email rời rạc, dễ miss, không rõ nguồn |
| secondary | HR | Người điều phối, chịu trách nhiệm khi người nhận miss | Biết ai đã được gửi gì, phát hiện gửi lỗi để liên hệ kênh khác | Không có log giao nhận, phải nhắc tay |
| secondary | Admin | Giám sát vận hành thông báo | Kiểm soát loại bắt buộc, phát hiện email lỗi hàng loạt, truy vết | Email lỗi âm thầm, không có delivery log |
| out | Hệ thống ngoài (chat/OTT) | Kênh thông báo mở rộng | — | Ngoài phạm vi v1 |

## 3. Scope Boundaries

### In Scope

- Ghi nhận thông báo in-app theo event nghiệp vụ: giao việc, đổi hạn, lịch
  phỏng vấn mới/đổi/nhắc, giao bài đánh giá, offer, request chờ phê duyệt,
  biên bản cần xác nhận.
- Trung tâm thông báo: bell hiển thị 10 thông báo mới nhất + badge chưa đọc,
  trang thông báo có lọc theo loại, đánh dấu đã đọc và archive.
- Xác định và kiểm tra người nhận từ ngữ cảnh nghiệp vụ (assignee,
  interviewer, requester, owner, người bị tác động); không resolve được
  thì không gửi và có log.
- Template nội dung theo từng loại event do hệ thống quản lý.
- Kênh email cho người không có tài khoản (ứng viên) và cho nội bộ theo
  preference; email chỉ chứa teaser + link, không dữ liệu nhạy cảm.
- Dedup: cùng entity + cùng loại thì cập nhật nội dung mới nhất và đặt lại
  trạng thái chưa đọc thay vì tạo thông báo trùng.
- Delivery log + retry email (5 phút/30 phút/2 giờ) + trạng thái FAILED
  có báo admin và người khởi tạo.
- Preference tối thiểu: người dùng bật/tắt email theo loại; admin định loại
  bắt buộc gửi email.
- Nhắc lịch trước giờ họp với mốc mặc định do admin đặt, người dùng chỉnh
  trong khoảng cho phép.
- Loại "lịch" tự tạo card trên kanban cá nhân; entity bị hủy thì gỡ card,
  đổi nội dung thông báo cũ thành "đã hủy" và bắn thông báo hủy mới.
- Retention thông báo 90 ngày (đề xuất) tự archive; tài khoản nghỉ việc
  ngừng nhận thông báo mới nhưng giữ lịch sử.

### Out of Scope

- Marketing automation, broadcast/spam gửi hàng loạt không theo event
  nghiệp vụ (PRD Mục 7.26 "Chưa làm").
- Soạn và gửi email nghiệp vụ thủ công từ mẫu do người dùng viết — thuộc
  `operational-email`; feature này chỉ dùng template hệ thống theo loại
  event.
- Cấu hình SMTP/provider và mẫu email nghiệp vụ — thuộc `operational-email`
  và `platform-configuration`.
- Kênh OTT (SMS/Zalo) cho ứng viên — hướng P2.
- Digest tổng hợp định kỳ qua email — hướng P2.
- Dashboard phân tích tỷ lệ đọc theo loại/vai trò — hướng P2.
- Quản lý board/column kanban — thuộc `kanban-workspaces`; feature này chỉ
  tạo/gỡ card từ thông báo loại lịch.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Nhân viên | Khi được giao task hoặc task của mình đổi hạn | Thấy ngay thông báo trong hệ thống kèm tên việc, người giao và hạn | Không bỏ sót việc và hạn mới | Critical | Confirmed — PRD Mục 7.26 |
| UN-002 | Interviewer | Khi có lịch phỏng vấn mới/đổi hoặc sắp tới giờ | Được báo kịp thời qua kênh mình theo dõi, có nhắc trước giờ | Không miss/đến trễ phiên phỏng vấn | Critical | Confirmed — PRD Mục 7.26; brainstorm Mục 2 |
| UN-003 | Ứng viên | Khi được giao bài đánh giá, lịch phỏng vấn hoặc offer | Nhận email rõ ràng, đúng giờ, có link vào xem/làm | Trải nghiệm tuyển dụng liền mạch, không miss bước | Critical | Confirmed — PRD Mục 7.26, JTBD-CAN-01 |
| UN-004 | Người dùng nội bộ | Khi muốn kiểm soát kênh nhận | Bật/tắt email theo từng loại thông báo; hiểu loại nào bắt buộc | Kiểm soát được nhiễu mà không miss loại quan trọng | High | Confirmed — PRD Mục 7.26 (preference tối thiểu) |
| UN-005 | Quản lý | Khi có request chờ mình phê duyệt | Được thông báo kịp thời kèm người yêu cầu và nội dung cần duyệt | Request không treo vì không ai hay | High | Confirmed — PRD Mục 7.26, JTBD-MGR-01 |
| UN-006 | HR | Khi email tới ứng viên/nhân sự gửi thất bại | Được báo lỗi kèm địa chỉ và lý do để liên hệ kênh khác | Người nhận vẫn được báo bằng đường khác | High | Confirmed — rủi ro R-12, PRD Mục 10 |
| UN-007 | Admin | Khi cần kiểm soát vận hành thông báo | Truy vết ai đã được gửi gì, kênh nào, trạng thái gì; định loại bắt buộc email | Delivery log đầy đủ, loại quan trọng không bị tắt | High | Confirmed — PRD Mục 7.26 (send/log), Mục 9 (audit) |
| UN-008 | Người nhận | Khi entity (lịch/task/offer) bị hủy sau khi đã được báo | Được báo hủy rõ ràng, không hành động theo thông tin cũ | Không đến họp/làm việc theo lịch đã hủy | High | Confirmed — brainstorm Mục 5.4, D7 |
| UN-009 | Người dùng nội bộ | Khi quay lại sau thời gian vắng mặt | Xem lại lịch sử thông báo đã đọc/archive theo loại | Không mất dấu việc đã được báo trước đó | Medium | Confirmed — brainstorm Mục 5.2 |

## 5. Prioritized User Journeys

### Journey 1: Nhân viên nhận và xử lý thông báo việc được giao

- **User:** Nhân viên (người dùng nội bộ)
- **Importance:** Critical
- **Trigger:** Quản lý giao task mới hoặc đổi hạn task hiện có.
- **Expected outcome:** Nhân viên thấy thông báo ngay trong hệ thống, mở
  đúng màn hình công việc và không bỏ sót hạn.
- **Related needs:** UN-001, UN-004

1) Event "giao task"/"đổi hạn" phát sinh từ `kanban-workspaces`.
2) Hệ thống xác định người nhận là assignee, tạo thông báo in-app theo
   template của loại.
3) Badge bell của nhân viên nhảy số ngay; nếu loại này bật email hoặc bắt
   buộc thì email teaser + link cũng được gửi.
4) Nhân viên mở bell, click item: thông báo chuyển đã đọc và đi tới task.
5) Khi task đổi hạn lần nữa, thông báo cũ được cập nhật nội dung mới nhất
   và đặt lại chưa đọc (không tạo dòng trùng).

**Independent verification:** Giao một task cho tài khoản thử — trong tài
khoản đó thấy badge tăng, item đúng tên task/hạn/người giao; đổi hạn task
và kiểm tra vẫn chỉ có một thông báo với nội dung hạn mới.

### Journey 2: Interviewer nhận lịch phỏng vấn và được nhắc giờ

- **User:** Interviewer
- **Importance:** Critical
- **Trigger:** HR xác nhận một phiên phỏng vấn có interviewer này tham gia.
- **Expected outcome:** Interviewer được báo khi có lịch, khi lịch đổi và
  được nhắc trước giờ họp; lịch hiện như một việc cần làm trong workspace
  cá nhân.
- **Related needs:** UN-002, UN-008

1) `interview-management` xác nhận phiên → event "lịch PV mới" bắn cho
   interviewer (in-app + email theo preference).
2) Thông báo loại lịch tự tạo card trên kanban cá nhân của interviewer.
3) Trước giờ họp theo mốc đã cấu hình (mặc định 24 giờ và 1 giờ), hệ thống
   bắn thông báo nhắc.
4) Nếu phiên đổi giờ: thông báo cũ cập nhật nội dung mới + đặt lại chưa
   đọc; nếu phiên hủy: card bị gỡ, thông báo cũ đổi thành "đã hủy" và có
   thông báo hủy mới.

**Independent verification:** Tạo một phiên phỏng vấn có interviewer thử —
tài khoản interviewer có thông báo + card; đổi giờ và kiểm tra nội dung
cập nhật; hủy phiên và kiểm tra card biến mất cùng thông báo "đã hủy".

### Journey 3: Ứng viên nhận email nghiệp vụ

- **User:** Ứng viên
- **Importance:** Critical
- **Trigger:** HR giao bài đánh giá, xác nhận lịch phỏng vấn hoặc gửi offer
  cho ứng viên.
- **Expected outcome:** Ứng viên nhận email đúng địa chỉ trong hồ sơ, nội
  dung teaser rõ ràng có link vào làm bài/xem thông tin.
- **Related needs:** UN-003, UN-006

1) Event nghiệp vụ tới ứng viên → hệ thống resolve địa chỉ email từ hồ sơ
   ứng viên (không có tài khoản → chỉ kênh email).
2) Email được tạo từ template của loại, chỉ chứa teaser + link, không dữ
   liệu nhạy cảm.
3) Gửi qua SMTP có tracking; lỗi thì retry 5 phút/30 phút/2 giờ; hết lượt
   thì FAILED và báo admin + người khởi tạo.
4) HR nhìn delivery log thấy trạng thái SENT/DELIVERED/FAILED để chủ động
   nhắc khi cần.

**Independent verification:** Giao bài đánh giá cho ứng viên thử — delivery
log ghi đúng địa chỉ hồ sơ, trạng thái chuyển QUEUED sang SENT; email mở
ra chỉ có teaser + link, không lộ điểm/nội dung đánh giá.

### Journey 4: HR/admin phát hiện và xử lý email FAILED

- **User:** HR hoặc admin
- **Importance:** High
- **Trigger:** Email tới người nhận thất bại sau hết lượt retry.
- **Expected outcome:** Người phụ trách biết email nào lỗi, cho ai, vì sao —
  và có đường xử lý thủ công.
- **Related needs:** UN-006, UN-007

1) Delivery chuyển FAILED sau retry → thông báo in-app tới admin và người
   khởi tạo kèm địa chỉ + lý do.
2) HR mở delivery log, lọc trạng thái FAILED, xem địa chỉ và lỗi cuối.
3) HR kiểm tra/sửa email trong hồ sơ người nhận hoặc liên hệ kênh khác;
   có thể yêu cầu gửi lại sau khi sửa.

**Independent verification:** Cố tình dùng một địa chỉ không tồn tại — sau
chuỗi retry log ghi FAILED, admin và người khởi tạo nhận được thông báo lỗi
kèm địa chỉ đích.

### Journey 5: Người dùng chỉnh preference thông báo

- **User:** Người dùng nội bộ
- **Importance:** Medium
- **Trigger:** Người dùng muốn giảm email hoặc đổi mốc nhắc lịch.
- **Expected outcome:** Preference được lưu theo từng loại; loại admin đánh
  bắt buộc không tắt được.
- **Related needs:** UN-004

1) Vào cài đặt thông báo → danh sách loại với toggle email (in-app luôn
   nhận).
2) Loại bắt buộc hiển thị khóa, không tắt được.
3) Chỉnh mốc nhắc lịch trong khoảng cho phép → lưu → áp dụng cho lịch sau.

**Independent verification:** Tắt email cho một loại, tạo event loại đó —
chỉ có in-app, không có delivery email; thử tắt loại bắt buộc — bị chặn
với giải thích rõ.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Người dùng offline/đóng app khi event bắn | Không thấy ngay | Thông báo tích lũy UNREAD, hiện khi mở lại; email vẫn được gửi | Journey 1 / UN-001 |
| Email ứng viên sai/bounce | Ứng viên không nhận được | FAILED sau retry, báo admin + người khởi tạo để liên hệ kênh khác | Journey 3, 4 / UN-006 |
| Entity bị hủy sau khi đã báo | Người nhận có thể hành động theo tin cũ | Thông báo cũ đổi "đã hủy", card gỡ, có thông báo hủy mới | Journey 2 / UN-008 |
| Tài khoản nội bộ bị deactivate | Người nhận không còn làm việc | Ngừng bắn thông báo/email mới; lịch sử giữ nguyên | UN-001 |
| Hai event cùng entity sát nhau | Người nhận bị spam dòng trùng | Dedup cập nhật một thông báo duy nhất với nội dung mới nhất | Journey 1 / UN-001 |
| Event bắn trong quiet hours (22:00–06:00) | Email đến đêm khuya | Email giữ tới 06:00; loại urgent (lịch PV đổi/hủy sát giờ) vẫn gửi ngay; in-app không bị giữ | UN-002 |
| Ứng viên không mở email | HR không biết đã đọc chưa | Trạng thái dừng ở SENT trong log; HR chủ động nhắc | Journey 3 / UN-006 |
| Không resolve được người nhận từ entity | Thông báo có thể gửi sai | Không tạo thông báo, ghi log và báo người khởi tạo/admin | UN-006 |
| Người dùng đọc trên hai thiết bị | Badge lệch giữa thiết bị | Đọc ở một thiết bị thì thiết bị kia đồng bộ READ | Journey 1 |
| Preference email tắt hết | Người dùng miss loại quan trọng | Loại bắt buộc do admin định vẫn gửi email, không tắt được | Journey 5 / UN-004 |

## 7. User-side Constraints

- Giao diện và nội dung thông báo tiếng Việt là ưu tiên (PRD Mục 9).
- Nhận thông báo in-app yêu cầu tài khoản còn active trong tổ chức; tài
  khoản deactivate không nhận thông báo mới.
- Ứng viên không có tài khoản chỉ nhận qua email, tới địa chỉ trong hồ sơ.
- Email thông báo chỉ chứa teaser + link; người nhận phải đăng nhập (hoặc
  dùng link được cấp như link bài đánh giá) để xem chi tiết — không hiển
  thị dữ liệu nhạy cảm trong email.
- Người dùng chỉ thấy thông báo của chính mình; admin xem delivery log ở
  mức siêu dữ liệu (ai, loại, kênh, trạng thái) không xem nội dung ngoài
  phạm vi.
- Thiết bị: web desktop là chính; bell/badge hoạt động gần thời gian thực
  khi đang mở ứng dụng.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| SMTP/provider email đã được cấu hình qua `platform-configuration`/`operational-email` và đang hoạt động | Không có kênh email → ứng viên không nhận được gì | Assumption — nguồn ITBAAI đã có SMTP config/test (reverse FR-PL-03/04) | Xác nhận khi `operational-email` hoàn tất |
| Mọi nhân sự có tài khoản + email hợp lệ; ứng viên có email trong hồ sơ CV | Recipient resolution fail hàng loạt | Assumption | Kiểm tra với `cv-intake`/`account-access` khi tích hợp |
| Các module nghiệp vụ phát sinh event vào điểm dispatch chung của feature | Không có event → không thông báo nào được tạo | Assumption — cần catalog event khi các module khác đặc tả | Chốt catalog event theo từng module phát hành |
| Kanban cá nhân tồn tại sau khi `kanban-workspaces` hoàn tất UI | Card tự động không có nơi hiển thị | Assumption — `kanban-workspaces` là Should, chưa chắc trong v1 | Giữ card là P1; chốt cột đích ở OQ-2 |
| In-app real-time dùng nền realtime sẵn có của hệ thống | Badge không cập nhật tức thì | Assumption | Xác nhận kiến trúc khi triển khai |
| Ngưỡng urgent "sát giờ" = 2 giờ trước phiên; khoảng chỉnh nhắc lịch = 5 phút đến 7 ngày | Email khẩn bị giữ qua đêm hoặc người dùng đặt mốc vô lý | Assumption (đề xuất) | Chốt ở OQ-3/OQ-1 — chờ Product owner |
| Retention thông báo 90 ngày phù hợp audit và privacy | Log quá ngắn để điều tra hoặc quá dài vi phạm retention | Assumption (đề xuất) | Chốt theo OQ-6 sản phẩm — chờ DPO/legal |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Người nội bộ nhận được thông báo in-app đúng việc, đúng người | Chưa có — xác lập bằng đo delivery log trong 1 tháng pilot | ≥ 99% thông báo in-app tạo thành công tới đúng recipient (đề xuất) | Tỷ lệ notification in-app có trạng thái đã ghi nhận / tổng event hợp lệ | 1 tháng sau pilot |
| USC-002 | Email nghiệp vụ được giao thành công | Chưa có — xác lập bằng delivery log trong 1 tháng pilot | ≥ 95% email đạt SENT/DELIVERED (đề xuất, chờ OQ-10 sản phẩm) | Tỷ lệ delivery email SENT hoặc DELIVERED / tổng email được tạo | 1 tháng sau pilot |
| USC-003 | Interviewer không miss phiên vì không được báo | Chưa có — xác lập bằng đối chiếu số phiên miss/nguyên nhân trong pilot | 0 phiên miss do không nhận được thông báo | Số phiên interviewer vắng/trễ mà delivery log không có thông báo hợp lệ | Mỗi tháng pilot |
| USC-004 | Mọi event nghiệp vụ đều truy vết được việc gửi | 0% (hiện không có log) | 100% event trong catalog có delivery log đủ người nhận/kênh/trạng thái | Kiểm tra mẫu event theo loại mỗi release | Liên tục |
| USC-005 | Không lộ dữ liệu nhạy cảm qua email thông báo | 0 sự cố | 0 incident xác nhận (guardrail, bám M-GR-01) | Số incident payload/scope được xác nhận | Liên tục |

## 10. Open Questions

- [x] OQ-1: Khoảng min/max cho mốc nhắc lịch người dùng được chỉnh?
  — Resolved (đề xuất): 5 phút đến 7 ngày trước giờ họp; mặc định 24 giờ
  + 1 giờ do admin đặt — chờ Product owner xác nhận.
- [x] OQ-2: Card kanban tự động của loại lịch rơi vào cột nào trên board
  cá nhân? — Resolved (đề xuất): cột mặc định đầu tiên của board cá nhân
  (inbox/sắp tới), cho phép người dùng di chuyển — chờ owner
  `kanban-workspaces` xác nhận khi feature đó đặc tả.
- [x] OQ-3: "Sát giờ" trong loại urgent vượt quiet hours là bao lâu?
  — Resolved (đề xuất): lịch phỏng vấn đổi/hủy trong ≤ 2 giờ trước giờ
  họp — chờ Product owner xác nhận.
- [x] OQ-4: Target tỷ lệ thông báo giao thành công? — Resolved (đề xuất):
  ≥ 99% in-app, ≥ 95% email SENT/DELIVERED đo rolling 30 ngày — chờ OQ-2
  sản phẩm và OQ-10 chốt SLA email.
- [~] OQ-5: Có cần digest định kỳ qua email? — Out of scope v1: thuộc P2
  roadmap, PRD xếp ngoài "Phạm vi v1".
- [x] OQ-6: SLA/retry/idempotency/bounce/fallback cho email thông báo?
  — Resolved (đề xuất): retry 5 phút/30 phút/2 giờ rồi FAILED; gửi theo
  khóa idempotent; bounce/FAILED ghi log + báo admin và người khởi tạo;
  fallback thủ công qua delivery log (sửa địa chỉ, liên hệ kênh khác)
  — chờ Technical/Operations owner xác nhận (PRD OQ-10).
- [x] OQ-7: Retention cho thông báo và delivery log? — Resolved (đề xuất):
  thông báo 90 ngày tự archive vẫn xem ở lịch sử; delivery log giữ theo
  audit policy tối thiểu bằng chu kỳ điều tra — chờ DPO/legal chốt trong
  OQ-6 sản phẩm.
