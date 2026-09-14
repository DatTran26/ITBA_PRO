---
type: srs
feature: contextual-notifications
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/contextual-notifications/brainstorms/unified-notification-center.md, docs/features/contextual-notifications/contextual-notifications-urd.md, docs/_reverse/platform-communications-and-governance/reverse-spec.md]
---

# contextual-notifications — Software Requirements Specification

## 1. Scope

Trung tâm thông báo theo ngữ cảnh của sản phẩm: nhận event nghiệp vụ từ các
module (giao việc, đổi hạn, lịch phỏng vấn, bài đánh giá, offer, phê duyệt),
xác định đúng người nhận, phát qua kênh phù hợp (in-app cho người nội bộ,
email cho ứng viên và theo preference) và lưu vết giao nhận để truy vết.
Feature này là `Must` — nằm trong cam kết lát cắt pilot v1 (PRD Mục 6.1,
Feature Map #26).

Trong scope: catalog loại event + template hệ thống, recipient resolution có
kiểm tra, trung tâm thông báo in-app (bell + trang), kênh email payload tối
thiểu, dedup, retry + dead-letter email, delivery log, preference tối thiểu
và loại bắt buộc do admin định, nhắc lịch, card kanban từ thông báo loại
lịch, cập nhật/hủy theo vòng đời entity, retention 90 ngày (đề xuất).

Ngoài scope: soạn/gửi email nghiệp vụ thủ công và quản lý mẫu email do
người dùng viết (`operational-email`), cấu hình SMTP/provider
(`operational-email`, `platform-configuration`), marketing automation và
broadcast không theo event (PRD Mục 7.26 "Chưa làm"), kênh OTT/SMS, digest
định kỳ, dashboard phân tích đọc (P2), quản lý board kanban
(`kanban-workspaces`).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Người dùng nội bộ (nhân viên, interviewer, quản lý, HR) | người | Nhận và xử lý thông báo đúng việc/đúng hạn | Có |
| Ứng viên | người | Nhận email thông báo/lịch/offer qua địa chỉ trong hồ sơ | Có (chỉ kênh email) |
| HR | người | Theo dõi delivery, xử lý email thất bại | Có |
| Admin | người | Định loại bắt buộc, giám sát lỗi, truy vết log | Có |
| Module nghiệp vụ phát sinh event (pipeline, interview, assessment, offer, kanban, minutes, governance) | hệ thống | Đẩy event vào điểm dispatch | Có (là nguồn event) |
| `account-access` | hệ thống | Trạng thái tài khoản (active/deactivated) | Có (dependency) |
| `org-governance` | hệ thống | Quyết định quyền/phạm vi của người nhận và người xem log | Có (dependency) |
| `operational-email` / `platform-configuration` | hệ thống | Kênh SMTP và cấu hình provider | Có (dependency) |
| `kanban-workspaces` | hệ thống | Hiển thị card tạo từ thông báo loại lịch | Có (dependency — feature Should) |
| SMTP provider | ngoài | Giao email | Có (dependency) |
| Kênh OTT (SMS/Zalo) | ngoài | Thông báo đa kênh | Không (P2) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-contextual-notifications-001 | Ghi nhận thông báo từ event nghiệp vụ | Khi một event thuộc catalog được công bố phát sinh, hệ thống phải tạo bản ghi thông báo cho từng người nhận hợp lệ theo template của loại event đó. | P0 | test | PRD Mục 7.26 (luồng chính); brainstorm 5.1 |
| FR-contextual-notifications-002 | Xác định và kiểm tra người nhận | Khi xử lý event, hệ thống phải resolve người nhận từ ngữ cảnh entity (assignee, interviewer, requester, owner, người bị tác động) và kiểm tra người nhận hợp lệ (tài khoản còn active, hoặc ứng viên có email hợp lệ trong hồ sơ); nếu không resolve được thì phải bỏ qua việc gửi, ghi log và báo người khởi tạo/admin. | P0 | test | PRD Mục 7.26 (recipient context, rủi ro gửi sai người); R-08 |
| FR-contextual-notifications-003 | Template theo loại event | Mỗi loại event phải có template nội dung do hệ thống quản lý, điền biến từ ngữ cảnh (tên entity, thời hạn, người tác động); nếu thiếu biến bắt buộc thì không được gửi và phải ghi lỗi cấu hình báo admin. | P0 | test | PRD Mục 7.26 (template); brainstorm 5.1 |
| FR-contextual-notifications-004 | Trung tâm thông báo in-app | Hệ thống phải cung cấp bell hiển thị 10 thông báo mới nhất kèm badge số chưa đọc, và trang thông báo cho phép lọc theo loại, xem lịch sử, đánh dấu đã đọc và archive. | P0 | demo | brainstorm 4 (P0); URD UN-001 |
| FR-contextual-notifications-005 | Dedup theo entity + loại | Khi event mới phát sinh mà đã có thông báo cùng entity và cùng loại, hệ thống phải cập nhật nội dung mới nhất và đặt lại trạng thái chưa đọc thay vì tạo thông báo trùng. | P0 | test | brainstorm D1 |
| FR-contextual-notifications-006 | Phân kênh theo loại người nhận | Khi gửi, hệ thống phải phân kênh: người nhận không có tài khoản (ứng viên) chỉ nhận email; người nội bộ luôn nhận in-app và nhận email khi preference bật hoặc loại thuộc danh sách bắt buộc của admin. | P0 | test | brainstorm D2, D3; URD UN-003/004 |
| FR-contextual-notifications-007 | Email payload tối thiểu | Email thông báo chỉ được chứa teaser + link xem chi tiết; nếu nội dung chứa trường dữ liệu nhạy cảm ngoài danh sách cho phép thì phải chặn và ghi lỗi cấu hình template. | P0 | kiểm tra | PRD Mục 7.26 (rủi ro lộ dữ liệu); R-08 |
| FR-contextual-notifications-008 | Retry và dead-letter email | Khi SMTP trả lỗi, hệ thống phải retry theo lịch 5 phút/30 phút/2 giờ; nếu hết lượt thì chuyển delivery sang FAILED (dead-letter), giữ bản ghi để xử lý thủ công và báo admin + người khởi tạo. | P0 | test | brainstorm D6; R-07/R-12; OQ-10 đề xuất |
| FR-contextual-notifications-009 | Delivery log truy vết | Mọi delivery phải có bản ghi: người nhận, loại, kênh, trạng thái, số lần thử, các mốc thời gian và lỗi cuối; admin và người khởi tạo xem được trong phạm vi cho phép. | P0 | kiểm tra | PRD Mục 7.26 (theo dõi delivery và lỗi); R-12 |
| FR-contextual-notifications-010 | Xử lý event idempotent | Hệ thống phải xử lý mỗi event theo khóa duy nhất; nếu cùng một event được phát lại thì không được tạo thông báo/email trùng. | P0 | test | R-12 (gửi trùng); brainstorm 6.4 |
| FR-contextual-notifications-011 | Preference theo loại | Người dùng phải bật/tắt được kênh email theo từng loại thông báo; loại admin đánh dấu bắt buộc phải hiển thị khóa và không cho tắt; in-app luôn nhận. | P0 | demo | PRD Mục 7.26 (preference tối thiểu); brainstorm D3 |
| FR-contextual-notifications-012 | Nhắc lịch trước giờ | Với loại lịch, hệ thống phải bắn thông báo nhắc trước giờ theo mốc mặc định do admin đặt (đề xuất 24 giờ + 1 giờ), cho người dùng chỉnh trong khoảng cho phép (đề xuất 5 phút đến 7 ngày). | P0 | test | brainstorm P0, D-quy ước reminder; URD UN-002 |
| FR-contextual-notifications-013 | Đồng bộ khi entity bị hủy | Khi entity đã từng bắn thông báo bị hủy, hệ thống phải đổi nội dung thông báo cũ thành "đã hủy", gỡ card kanban liên quan và tạo thông báo hủy mới cho cùng người nhận. | P0 | test | brainstorm D7; URD UN-008 |
| FR-contextual-notifications-014 | Card kanban từ thông báo lịch | Khi thông báo thuộc loại lịch được tạo cho người nội bộ, hệ thống phải tạo một card trên kanban cá nhân của người đó; người dùng cũng pin được thông báo khác thành card. | P1 | demo | brainstorm P0/P1; phụ thuộc `kanban-workspaces` |
| FR-contextual-notifications-015 | Quiet hours cho email | Khi email được tạo trong khung 22:00–06:00, hệ thống phải giữ gửi tới 06:00, trừ loại urgent (lịch phỏng vấn đổi/hủy trong ≤ 2 giờ trước giờ họp — đề xuất) được gửi ngay; in-app không bị giữ. | P1 | test | brainstorm D5 |
| FR-contextual-notifications-016 | Retention và archive | Thông báo quá 90 ngày (đề xuất) phải tự chuyển archive, vẫn xem được trong tab lịch sử; archive không xóa delivery log. | P1 | test | brainstorm 4; OQ-6 sản phẩm |
| FR-contextual-notifications-017 | Ngừng gửi khi tài khoản deactivate | Khi người nhận nội bộ bị deactivate, hệ thống phải ngừng tạo thông báo và email mới cho người đó nhưng giữ nguyên lịch sử. | P0 | test | brainstorm 6.5; PRD Mục 9 |
| FR-contextual-notifications-018 | Cập nhật gần thời gian thực | Khi có thông báo mới cho người đang mở ứng dụng, badge và danh sách phải cập nhật không cần tải lại trang; trạng thái đã đọc đồng bộ giữa các thiết bị. | P1 | demo | brainstorm P0, 6.4 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-contextual-notifications-001 | performance | Thông báo in-app hiển thị tới người nhận đang online trong ≤ 3 giây kể từ khi event được ghi nhận (đề xuất). | P0 | ≥ 95% notification in-app xuất hiện trong ngưỡng trong tháng pilot |
| NFR-contextual-notifications-002 | security | Không thông báo nào được gửi khi người nhận không hợp lệ/không resolve được; email không chứa dữ liệu nhạy cảm; deny by default khi kiểm tra quyền lỗi. | P0 | 0 delivery tới recipient invalid; 0 incident payload nhạy cảm (bám M-GR-01, R-08) |
| NFR-contextual-notifications-003 | reliability | Không event nào mất âm thầm: event hợp lệ luôn kết thúc ở trạng thái đã ghi nhận, FAILED có người được báo, retry không tạo trùng. | P0 | 0 event trong catalog không có bản ghi kết quả; 0 email trùng cho cùng khóa event |
| NFR-contextual-notifications-004 | auditability | Mọi event, delivery và can thiệp (resend, thay preference bắt buộc) đều truy vết được ai/gì/khi nào/kết quả. | P0 | 100% delivery có log đủ trường; kiểm tra mẫu mỗi release |
| NFR-contextual-notifications-005 | usability | Mọi nội dung thông báo, email và thông báo lỗi là tiếng Việt tự nhiên, nêu rõ việc/hạn/người liên quan. | P0 | Kiểm tra mẫu template mỗi loại trước release |
| NFR-contextual-notifications-006 | privacy | Thông báo và log chỉ giữ theo retention đã duyệt; người xem log không thấy nội dung ngoài phạm vi quyền. | P0 | 0 bản ghi notification quá retention còn ở trạng thái active; chờ OQ-6 sản phẩm chốt |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-contextual-notifications-001 | Email chỉ chứa teaser + link; cấm trường nhạy cảm (điểm đánh giá, lương, đáp án, nội dung hồ sơ chi tiết). | Render email | FR-contextual-notifications-007 | PRD Mục 7.26; R-08 |
| BR-contextual-notifications-002 | Người nhận phải resolve từ entity và còn hợp lệ; không resolve được thì không gửi, ghi log, báo người khởi tạo/admin. | Dispatch event | FR-contextual-notifications-002 | PRD Mục 7.26; R-08/R-12 |
| BR-contextual-notifications-003 | Ứng viên (không tài khoản) chỉ nhận qua email tới địa chỉ trong hồ sơ. | Phân kênh | FR-contextual-notifications-006 | brainstorm D2 |
| BR-contextual-notifications-004 | Retry email tối đa 3 lần theo lịch 5 phút/30 phút/2 giờ; hết lượt thành FAILED dead-letter (đề xuất chờ OQ-10). | SMTP lỗi | FR-contextual-notifications-008 | brainstorm 7.2; R-07 |
| BR-contextual-notifications-005 | Dedup chỉ theo entity + loại; luôn giữ nội dung mới nhất và đặt lại chưa đọc. | Event lặp cùng entity | FR-contextual-notifications-005 | brainstorm D1 |
| BR-contextual-notifications-006 | Quiet hours email 22:00–06:00; whitelist urgent là lịch phỏng vấn đổi/hủy ≤ 2 giờ trước giờ họp (đề xuất). | Tạo delivery email | FR-contextual-notifications-015 | brainstorm D5; OQ-3 đề xuất |
| BR-contextual-notifications-007 | Loại bắt buộc email do admin định không cho người dùng tắt; mặc định loại lịch phỏng vấn và offer thuộc bắt buộc (đề xuất). | Quản trị loại/preference | FR-contextual-notifications-011 | brainstorm P0; rủi ro Mục 9 |
| BR-contextual-notifications-008 | Mỗi event xử lý theo khóa idempotent duy nhất (nguồn + loại + entity + người nhận); event phát lại không tạo trùng. | Nhận event | FR-contextual-notifications-010 | R-12 |
| BR-contextual-notifications-009 | Mốc nhắc lịch mặc định 24 giờ + 1 giờ; người dùng chỉnh trong khoảng 5 phút đến 7 ngày (đề xuất). | Lên lịch nhắc | FR-contextual-notifications-012 | brainstorm 7.2; OQ-1 đề xuất |
| BR-contextual-notifications-010 | Thông báo quá 90 ngày tự archive; tài khoản deactivate ngừng nhận mới, giữ lịch sử. | Định kỳ/deactivate | FR-contextual-notifications-016, FR-contextual-notifications-017 | brainstorm 4, 6.5; OQ-6 sản phẩm |
| BR-contextual-notifications-011 | Notification không tự ý tạo quyết định nghiệp vụ: mọi thông báo chỉ phản ánh event đã xảy ra ở module nguồn. | Render nội dung | FR-contextual-notifications-001, FR-contextual-notifications-003 | PRD Mục 12 (human-in-the-loop) |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-contextual-notifications-001 | Không resolve được người nhận | Event tới nhưng entity thiếu assignee/owner hoặc ứng viên thiếu email hợp lệ; nếu xảy ra thì hệ thống phải bỏ gửi, ghi log và báo người khởi tạo/admin | major | FR-contextual-notifications-002 | Bản ghi lỗi trong delivery log + thông báo cho người khởi tạo | Người khởi tạo bổ sung người nhận/email trong hồ sơ rồi phát lại event |
| E-contextual-notifications-002 | SMTP lỗi/hết hạn mức | Provider trả lỗi khi gửi email; nếu lỗi thì hệ thống phải retry theo lịch rồi FAILED khi hết lượt | major | FR-contextual-notifications-008 | Delivery FAILED kèm lỗi cuối; thông báo tới admin + người khởi tạo | Sửa địa chỉ/provider rồi resend từ dead-letter; liên hệ kênh khác |
| E-contextual-notifications-003 | Email bounce | Địa chỉ hợp lệ về hình thức nhưng bị từ chối phía nhận; nếu bounce thì hệ thống phải ghi FAILED kèm lý do và báo người khởi tạo | major | FR-contextual-notifications-008, FR-contextual-notifications-009 | Delivery FAILED (bounce) trong log | Cập nhật email hồ sơ, resend hoặc đổi kênh liên hệ |
| E-contextual-notifications-004 | Template thiếu biến | Ngữ cảnh event không đủ biến bắt buộc của template; nếu thiếu thì không được gửi và phải ghi lỗi cấu hình | major | FR-contextual-notifications-003 | Lỗi cấu hình báo admin trong log | Module nguồn bổ sung ngữ cảnh hoặc admin sửa template |
| E-contextual-notifications-005 | Nội dung email chứa trường nhạy cảm | Template/biến vi phạm danh sách trường cho phép; nếu vi phạm thì phải chặn gửi và ghi lỗi | critical | FR-contextual-notifications-007 | Delivery bị chặn, lỗi cấu hình báo admin | Sửa template chỉ giữ teaser + link |
| E-contextual-notifications-006 | Tài khoản người nhận deactivate | Người nhận nội bộ không còn active khi event tới; nếu xảy ra thì phải bỏ gửi và ghi log | minor | FR-contextual-notifications-002, FR-contextual-notifications-017 | Delivery SUPPRESSED trong log | Không cần xử lý; HR phân công lại người khác nếu cần |
| E-contextual-notifications-007 | Không lưu được preference | Lỗi khi lưu cài đặt thông báo; nếu thất bại thì phải báo rõ và giữ preference cũ | minor | FR-contextual-notifications-011 | Thông báo lỗi tại màn cài đặt | Thử lại sau; preference cũ vẫn áp dụng |
| E-contextual-notifications-008 | Card kanban không tạo được | `kanban-workspaces` chưa sẵn hoặc lỗi khi tạo card; nếu thất bại thì thông báo vẫn phải gửi bình thường và lỗi card được ghi riêng | minor | FR-contextual-notifications-014 | Thông báo vẫn hiện; lỗi card trong log | Người dùng pin thủ công sau |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-contextual-notifications-01 | Thông báo nghiệp vụ được giao thành công | Tỷ lệ delivery đạt trạng thái thành công (in-app ghi nhận + email SENT/DELIVERED) / tổng delivery hợp lệ, rolling 30 ngày | ≥ 99% in-app, ≥ 95% email (đề xuất — chờ OQ-2/OQ-10 sản phẩm) |
| SC-contextual-notifications-02 | Đúng người nhận | Số delivery gửi tới recipient invalid hoặc sai ngữ cảnh được phát hiện | 0 |
| SC-contextual-notifications-03 | Truy vết đầy đủ | Tỷ lệ event trong catalog có delivery log đủ người nhận/kênh/trạng thái | 100% |
| SC-contextual-notifications-04 | Không lộ dữ liệu qua email | Số incident payload nhạy cảm xác nhận | 0 (guardrail M-GR-01) |
| SC-contextual-notifications-05 | Không trùng/mất thông báo | Số notification/email trùng cho cùng khóa event; số event hợp lệ không có bản ghi kết quả | 0 |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- **BUSINESS_EVENT** — event nghiệp vụ được phát vào dispatch: khóa
  idempotent, loại event, entity nguồn (loại + mã), thời điểm, trạng thái
  xử lý.
- **NOTIFICATION_TYPE** — catalog loại thông báo: mã loại, template tiêu
  đề/nội dung/email, cờ bắt buộc email, kênh mặc định, nhóm urgent.
- **NOTIFICATION** — một thông báo cho một người nhận: loại, người nhận,
  entity tham chiếu, tiêu đề/nội dung đã render, trạng thái
  UNREAD/READ/ARCHIVED, mốc thời gian.
- **NOTIFICATION_DELIVERY** — một lần giao theo kênh (in-app/email) của một
  notification: địa chỉ đích, trạng thái QUEUED/SENT/DELIVERED/FAILED/
  SUPPRESSED, lỗi cuối, mốc thời gian.
- **DELIVERY_ATTEMPT** — mỗi lần thử gửi của một delivery email: số lần,
  kết quả, lỗi, thời điểm.
- **NOTIFICATION_PREFERENCE** — preference của một người dùng cho một loại:
  bật/tắt email, mốc nhắc lịch riêng.
- **KANBAN_CARD** (tham chiếu ngoài, thuộc `kanban-workspaces`) — card tạo
  từ thông báo loại lịch hoặc pin thủ công.
- **USERS** (tham chiếu ngoài, thuộc `account-access`/`org-governance`) —
  người nhận và người cấu hình.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- Dispatch event: event phát sinh → resolve người nhận → dedup → render
  template → phân kênh → ghi delivery → retry/FAILED khi lỗi.
- Người dùng xử lý: badge nhảy → mở bell/trang → đọc → đi tới màn hình
  liên quan → archive khi cần.
- Entity hủy: thông báo cũ đổi "đã hủy" → gỡ card → bắn thông báo hủy.
- Xử lý FAILED: báo admin/người khởi tạo → xem log → sửa địa chỉ → resend
  hoặc liên hệ kênh khác.
- Cấu hình: admin định loại bắt buộc và mốc nhắc mặc định; người dùng
  chỉnh preference của mình.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- Bell/dropdown 10 thông báo mới nhất + badge chưa đọc.
- Trang thông báo: lọc theo loại, tab chưa đọc/lịch sử, hành động đánh dấu
  đọc/archive/pin thành card.
- Màn cài đặt thông báo: danh sách loại với toggle email, khóa loại bắt
  buộc, chỉnh mốc nhắc lịch.
- Màn delivery log cho admin/HR: lọc trạng thái/kênh/người nhận, chi tiết
  lỗi và hành động resend.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Kiểm tra quyền người nhận/người xem log theo organization/role/data-scope, deny by default | PRD Mục 9; Security owner |
| Email chỉ payload tối thiểu; recipient validation bắt buộc — vi phạm chặn rollout kênh ngoài | PRD Mục 10 R-08; Operations + Security owner |
| Idempotency + retry/dead-letter + manual fallback cho mọi gửi tự động | PRD Mục 10 R-07/R-12; Operations owner |
| Notification chỉ phản ánh event đã xảy ra — không tự quyết định nghiệp vụ | PRD Mục 12 (human-in-the-loop) |
| Tiếng Việt là ngôn ngữ ưu tiên cho nội dung và thông báo lỗi | PRD Mục 9 |
| Retention/consent cho email và log theo chính sách đã duyệt; OQ-6 mở thì chỉ dữ liệu synthetic khi pilot | PRD Mục 9, R-04; Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Trạng thái tài khoản và hồ sơ email người dùng (`account-access`, PRD #1) | account-access owner | Không kiểm tra recipient hợp lệ, không gửi được nội bộ |
| Quyết định quyền/phạm vi (`org-governance`, PRD #2) | org-governance owner | Không phân quyền được người nhận và người xem log |
| Kênh SMTP + cấu hình provider (`operational-email`/`platform-configuration`) | Operations owner | Không có kênh email cho ứng viên |
| Event source từ các module nghiệp vụ (pipeline, interview, assessment, offer, kanban, minutes, governance) | Owner từng module | Không có event để dispatch |
| Kanban cá nhân (`kanban-workspaces`) | kanban-workspaces owner | FR-014 card tự động không hiển thị (P1 — degrade sang pin thủ công) |
| SLA/retry/bounce/fallback email chính thức (PRD OQ-10) | Technical/Operations owner | BR-004 và SC-01 ở mức đề xuất |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| SMTP đã cấu hình và hoạt động trước khi bật kênh email | FR-006/008 không đạt; ứng viên không nhận được gì |
| Mọi nhân sự có email hợp lệ trong hồ sơ; ứng viên có email từ `cv-intake` | E-contextual-notifications-001/003 tăng, USC-002 không đạt |
| Các module phát event vào điểm dispatch với đủ ngữ cảnh recipient | FR-001/002 không dùng được, catalog trống |
| Ngưỡng urgent ≤ 2 giờ, quiet hours 22:00–06:00, nhắc lịch 5 phút–7 ngày, retention 90 ngày là đề xuất hợp lý | BR-006/009/010 và USC phải chỉnh sau khi owner chốt |
| In-app realtime dùng nền sẵn có của nền tảng | FR-018 cần phương án polling, NFR-001 không đạt |

## 12. Open Questions

- [x] OQ-1: Khoảng min/max mốc nhắc lịch người dùng chỉnh? — Resolved (đề
  xuất): 5 phút đến 7 ngày; mặc định 24 giờ + 1 giờ — chờ Product owner
  (kế thừa URD OQ-1).
- [x] OQ-2: Card kanban tự động rơi cột nào? — Resolved (đề xuất): cột
  mặc định đầu tiên của board cá nhân — chờ owner `kanban-workspaces`
  (kế thừa URD OQ-2).
- [x] OQ-3: Ngưỡng "sát giờ" urgent vượt quiet hours? — Resolved (đề
  xuất): ≤ 2 giờ trước phiên — chờ Product owner (kế thừa URD OQ-3).
- [x] OQ-4: SLA, retry, idempotency, bounce và fallback cho email thông
  báo? — Resolved (đề xuất): retry 5 phút/30 phút/2 giờ rồi FAILED
  dead-letter; gửi theo khóa idempotent; bounce/FAILED ghi log + báo
  admin và người khởi tạo; fallback thủ công qua delivery log — chờ
  Technical/Operations owner (PRD OQ-10, OQ-PL-03).
- [x] OQ-5: Retention thông báo và delivery log? — Resolved (đề xuất):
  notification 90 ngày tự archive; delivery log theo audit policy — chờ
  DPO/legal (PRD OQ-6).
- [x] OQ-6: Loại thông báo nào mặc định bắt buộc email? — Resolved (đề
  xuất): lịch phỏng vấn và offer — chờ Product owner/Admin lead.
- [x] OQ-7: Digest định kỳ và kênh OTT? — Resolved: đưa vào P2 roadmap,
  không thuộc v1 (kế thừa URD OQ-5).
- [x] OQ-8: Catalog event chính thức của v1 gồm những loại nào? —
  Resolved (đề xuất): giao/đổi hạn task, lịch PV mới/đổi/nhắc/hủy, giao
  bài đánh giá, offer gửi/được chấp nhận/từ chối, request chờ duyệt,
  biên bản cần xác nhận, email FAILED — chờ owner từng module xác nhận
  khi đặc tả event source.
