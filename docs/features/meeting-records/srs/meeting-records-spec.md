---
type: srs
feature: meeting-records
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/meeting-records/meeting-records-urd.md
  - docs/features/meeting-records/brainstorms/single-source-meeting-records.md
---

# meeting-records — Software Requirements Specification

## 1. Scope

Quản lý meeting record làm nguồn dữ liệu duy nhất của một cuộc họp nội bộ:
tạo/sửa/hủy cuộc họp, quản lý participants và consent ghi âm, đính kèm file
ghi âm/ghi hình, xử lý transcript có trạng thái, biên bản thủ công kèm lịch
sử chỉnh sửa, truy cập theo phạm vi quyền và retention cho file ghi.

__Trong phạm vi:__ meeting record, participants + vai trò, consent ghi âm
từng người, upload media, job transcript, biên bản tay + revision, retention
media, audit truy cập.

__Ngoài phạm vi:__ sinh biên bản bằng AI (`ai-meeting-minutes`), chuyển action
item thành task (`meeting-to-tasks`), ghi âm trực tiếp trong nền tảng (khi
provider được chọn), đồng bộ lịch ngoài (`external-integrations`), thu âm
ngầm hoặc ghi không consent (cấm theo PRD Mục 12).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Chủ trì | người | Tạo cuộc họp, đính kèm file ghi, soạn/xác nhận biên bản | Có |
| Người tham gia | người | Trả lời consent, xem lại transcript/biên bản cuộc họp mình tham gia | Có |
| Quản lý | người | Xem biên bản cuộc họp trong phạm vi quản lý | Có |
| Admin | người | Áp retention, xử lý tranh chấp consent, audit | Có |
| Khách ngoài tổ chức | người | Tham gia họp, consent được chủ trì ghi nhận hộ | Có (không tài khoản) |
| Dịch vụ transcript (AI provider) | ngoài | Bóc transcript từ file ghi | Có — dependency ngoài |
| `contextual-notifications` | hệ thống | Gửi lời mời, xin consent, báo trạng thái job, nhắc biên bản | Có — dependency |
| `account-access` | hệ thống | Xác thực, phiên làm việc, danh bạ người dùng | Có — dependency |
| `org-governance` | hệ thống | Đơn vị/phạm vi dữ liệu, role, audit | Có — dependency |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-meeting-records-001 | Tạo cuộc họp | Khi chủ trì lưu form tạo cuộc họp, hệ thống phải tạo meeting record ở trạng thái SCHEDULED gồm tiêu đề, thời gian bắt đầu/kết thúc, hình thức (trực tiếp hoặc online kèm link), agenda và đơn vị/phạm vi dữ liệu; người tạo mặc định là chủ trì. | P0 | test | PRD Mục 7.13 |
| FR-meeting-records-002 | Sửa và hủy cuộc họp | Khi chủ trì sửa thông tin hoặc hủy cuộc họp, hệ thống phải cập nhật record hoặc chuyển trạng thái CANCELLED; cuộc họp đã hủy vẫn giữ record, media và transcript đã có để audit và retention. Chỉ chủ trì (hoặc admin theo scope) được sửa/hủy. | P0 | test | PRD Mục 7.13 |
| FR-meeting-records-003 | Quản lý participants | Hệ thống phải cho chủ trì thêm/bớt người tham gia từ danh bạ nội bộ, gán vai trò (chủ trì/thành viên) và ghi tên thủ công cho khách ngoài không có tài khoản. Mỗi cuộc họp có đúng 1 chủ trì; đổi chủ trì được và có audit. | P0 | test | PRD Mục 7.13, URD UN-001 |
| FR-meeting-records-004 | Gửi yêu cầu consent ghi âm | Khi participant được thêm vào cuộc họp, hệ thống phải gửi thông báo mời kèm thông tin "cuộc họp có thể được ghi âm" và đặt trạng thái consent của participant đó là PENDING. | P0 | test | PRD Mục 7.13, Mục 9 |
| FR-meeting-records-005 | Ghi nhận consent | Khi participant trả lời, hệ thống phải ghi trạng thái consent ACCEPTED hoặc DECLINED kèm thời điểm; participant được đổi lựa chọn trước giờ bắt đầu cuộc họp. | P0 | test | PRD Mục 7.13, Mục 12 |
| FR-meeting-records-006 | Chặn ghi khi thiếu consent | Nếu còn participant ở trạng thái PENDING hoặc DECLINED, thì hệ thống phải từ chối lưu file ghi hoặc bật cờ ghi âm và báo rõ còn bao nhiêu người chưa đồng ý. | P0 | test | PRD Mục 7.13 "Chưa làm", Mục 12 |
| FR-meeting-records-007 | Upload file ghi | Khi chủ trì tải file ghi lên cuộc họp đã đủ consent, hệ thống phải kiểm tra định dạng (MP3, MP4, M4A, WAV, WEBM), kích thước (tối đa 2 GB mỗi file) và số lượng (tối đa 5 file mỗi cuộc họp) trước khi lưu. | P0 | test | Brainstorm Mục 7.1/7.2 |
| FR-meeting-records-008 | Tạo job transcript | Khi file ghi được lưu thành công, hệ thống phải tạo job xử lý transcript và hiển thị trạng thái (đang xử lý / sẵn sàng / lỗi) trên record. | P0 | test | PRD Mục 7.13 |
| FR-meeting-records-009 | Retry job transcript | Nếu job transcript lỗi, thì hệ thống phải tự động chạy lại tối đa 3 lần (sau 5 phút, 30 phút, 2 giờ); hết số lần thì chuyển FAILED và thông báo chủ trì kèm lựa chọn chạy lại thủ công. | P0 | test | Brainstorm Mục 6.4 |
| FR-meeting-records-010 | Xem và sửa transcript | Khi transcript ở trạng thái READY, hệ thống phải cho người trong phạm vi xem nội dung và cho chủ trì sửa nhãn người nói của từng đoạn; nhãn chỉ gán tới participant của cuộc họp hoặc "chưa xác định". | P0 | test | PRD Mục 7.13, URD UN-009 |
| FR-meeting-records-011 | Soạn biên bản thủ công | Hệ thống phải cho chủ trì soạn và lưu biên bản kể cả khi cuộc họp không có file ghi hoặc transcript lỗi; biên bản tay là đường fallback luôn khả dụng. | P0 | test | PRD Mục 7.13, URD J4 |
| FR-meeting-records-012 | Lịch sử chỉnh sửa biên bản | Mỗi lần lưu biên bản, hệ thống phải tạo một revision mới ghi ai sửa, khi nào và nội dung trước/sau; không ghi đè revision cũ. | P0 | test | PRD Mục 7.13 |
| FR-meeting-records-013 | Truy cập theo phạm vi | Hệ thống phải áp deny-by-default: participant xem được record cuộc họp mình tham gia, quản lý xem trong phạm vi quản lý, người ngoài phạm vi bị từ chối; mọi lượt xem media gốc và lượt truy cập bị từ chối phải ghi audit. | P0 | test | PRD Mục 7.13, Mục 9 |
| FR-meeting-records-014 | Retention file ghi | Khi file ghi đến ngày hết hạn theo chính sách retention, hệ thống phải xóa/vô hiệu file ghi, giữ transcript và biên bản, hiển thị ghi chú "đã xóa theo chính sách lưu trữ" và ghi audit xóa. | P0 | test | PRD Mục 7.13 rủi ro chính |
| FR-meeting-records-015 | Consent khách ngoài | Khi cuộc họp có khách ngoài không tài khoản, hệ thống phải cho chủ trì ghi tên khách và xác nhận "đã xin consent ngoài hệ thống" kèm ghi chú; xác nhận này được tính vào điều kiện đủ consent của FR-006. | P0 | test | Brainstorm Mục 6.4, URD UN-005 |
| FR-meeting-records-016 | Nhắc thiếu biên bản | Khi cuộc họp chuyển ENDED mà chưa có biên bản, hệ thống phải gửi nhắc cho chủ trì qua `contextual-notifications`. | P1 | kiểm tra | Brainstorm Mục 4 P1 |
| FR-meeting-records-017 | Tìm trong transcript | Hệ thống phải cho tìm kiếm theo từ khóa trong transcript READY và nhảy từ đoạn trích trong biên bản tới đoạn transcript tương ứng. | P1 | demo | Brainstorm Mục 4 P1 |
| FR-meeting-records-018 | Đính kèm tài liệu | Hệ thống phải cho đính kèm tài liệu liên quan vào cuộc họp thông qua `document-intake`. | P1 | kiểm tra | Brainstorm Mục 4 P1 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-meeting-records-001 | privacy/consent | 100% file ghi được lưu phải có consent đầy đủ của mọi participant tại thời điểm lưu; không có ngoại lệ ngầm. | P0 | Kiểm audit: join media với consent record cho thấy 0 file thiếu consent trong suốt pilot. |
| NFR-meeting-records-002 | permission | Mọi truy cập meeting record tuân theo participant + organization/role/data-scope, deny-by-default; số incident vượt scope xác nhận là 0 (theo guardrail M-GR-01 PRD Mục 8). | P0 | Access test: user ngoài phạm vi không xem được record; mọi lượt từ chối có audit. |
| NFR-meeting-records-003 | retention | File ghi tự động không còn truy cập được trong vòng 24 giờ sau ngày hết hạn; transcript và biên bản giữ theo chính sách hồ sơ. | P0 | Recovery test: media quá hạn không tải/phát được; record hiển thị ghi chú đã xóa. |
| NFR-meeting-records-004 | audit | Mọi hành động nhạy cảm (upload media, bật cờ ghi âm, sửa biên bản, xem media gốc, xóa media theo retention, xác nhận consent hộ khách) có audit đủ ai/khi/hành động/đối tượng. | P0 | Truy vết audit trail đầy đủ cho 1 cuộc họp mẫu từ tạo đến xóa media. |
| NFR-meeting-records-005 | performance | Job transcript cho file ghi 60 phút hoàn tất trong SLA đề xuất tối đa 60 phút xử lý; trạng thái job luôn hiển thị trong 5 giây khi mở record. | P1 | Đo thời gian từ UPLOADED sang READY trên file chuẩn trong pilot; SLA chính thức chờ OQ-2. |
| NFR-meeting-records-006 | resilience | Khi dịch vụ transcript lỗi hoặc chưa cấu hình, chủ trì vẫn soạn/lưu được biên bản tay và record vẫn hợp lệ. | P0 | Test tắt provider: luồng biên bản tay hoạt động đầy đủ, không mất dữ liệu đã có. |
| NFR-meeting-records-007 | language | Toàn bộ wording giao diện, thông báo và thông báo lỗi dùng tiếng Việt tự nhiên. | P0 | Kiểm tra wording mẫu trong brainstorm Mục 7.3 khớp giao diện. |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-meeting-records-001 | Không được lưu file ghi hoặc bật ghi âm khi còn bất kỳ participant nào ở trạng thái PENDING hoặc DECLINED — kể cả khách ngoài chưa được chủ trì xác nhận hộ. | Upload media / bật cờ ghi âm | FR-meeting-records-006 | PRD Mục 7.13, Mục 12 |
| BR-meeting-records-002 | Participant chỉ đổi được consent trước giờ bắt đầu cuộc họp; đổi sau khi media đã lưu tạo flag tranh chấp cho chủ trì/admin, không tự xóa media. | Participant đổi consent | FR-meeting-records-005 | Brainstorm Mục 6.4 |
| BR-meeting-records-003 | Một cuộc họp có đúng 1 chủ trì; chủ trì mới kế thừa toàn bộ quyền xử lý record. | Đổi vai trò participant | FR-meeting-records-003 | URD Assumptions |
| BR-meeting-records-004 | Khách ngoài tổ chức không có tài khoản thì không có consent record; chủ trì phải xác nhận đã xin consent ngoài hệ thống kèm ghi chú trước khi cuộc họp đủ điều kiện ghi. | Thêm participant khách | FR-meeting-records-015 | Brainstorm OQ-2 (giải pháp tạm) |
| BR-meeting-records-005 | Media hết retention thì xóa media nhưng giữ transcript, biên bản và lịch sử revision; nếu biên bản đang tranh chấp thì escalation cho admin theo legal-hold. | Job retention chạy | FR-meeting-records-014 | Brainstorm Mục 5.4, 6.5 |
| BR-meeting-records-006 | Mọi thay đổi biên bản tạo revision mới, không ghi đè; revision không xóa được bởi user thường. | Lưu biên bản | FR-meeting-records-012 | PRD Mục 7.13 |
| BR-meeting-records-007 | Cuộc họp CANCELLED vẫn giữ nguyên media, transcript, biên bản đã có; retention và audit áp dụng bình thường. | Hủy cuộc họp | FR-meeting-records-002 | Brainstorm Mục 6.4 |
| BR-meeting-records-008 | Nhãn người nói trong transcript chỉ gán tới participant của cuộc họp hoặc đánh dấu "chưa xác định"; không gán tới người ngoài cuộc họp. | Sửa nhãn người nói | FR-meeting-records-010 | Brainstorm Mục 7.1 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-meeting-records-001 | File vượt kích thước | Upload file > 2 GB | major | FR-007 | Form upload báo lỗi, file không lưu | "File vượt quá 2 GB — hãy tải file nhỏ hơn hoặc liên hệ admin"; chọn file khác |
| E-meeting-records-002 | Định dạng không hỗ trợ | Upload file ngoài MP3/MP4/M4A/WAV/WEBM | minor | FR-007 | Form upload báo lỗi | "Định dạng file không được hỗ trợ — chỉ chấp nhận MP3, MP4, M4A, WAV, WEBM" |
| E-meeting-records-003 | Thiếu consent | Lưu media/bật ghi âm khi còn participant PENDING/DECLINED | major | FR-006 | Chặn hành động, hiện số người chưa đồng ý | "Chưa thể ghi âm — còn {N} người tham gia chưa đồng ý ghi âm"; xin lại consent hoặc họp không ghi |
| E-meeting-records-004 | Transcript lỗi hết retry | Job transcript fail sau 3 lần retry | major | FR-009 | Record hiện trạng thái FAILED + thông báo chủ trì | "Không tạo được transcript cho file {tên file} — thử chạy lại hoặc tải file khác"; chạy lại thủ công hoặc biên bản tay |
| E-meeting-records-005 | Ngoài phạm vi truy cập | User không thuộc phạm vi mở record | critical | FR-013 | Trang từ chối truy cập | "Bạn không có quyền xem cuộc họp này"; ghi audit lượt bị từ chối |
| E-meeting-records-006 | Quá số file | Upload file thứ 6 cho 1 cuộc họp | minor | FR-007 | Form upload báo lỗi | "Cuộc họp đã có tối đa 5 file ghi — xóa file cũ trước khi tải thêm" |
| E-meeting-records-007 | Upload gián đoạn | Đóng app/mất mạng giữa upload | minor | FR-007 | File ở trạng thái dở, không tạo job | Upload lại từ đầu; hệ thống dọn phần upload dở theo chính sách tạm |
| E-meeting-records-008 | Consent thu hồi sau khi đã lưu media | Participant từ chối consent khi media đã tồn tại | major | FR-005 | Record hiện flag tranh chấp | Flag cho chủ trì/admin xử lý theo chính sách; không tự xóa âm thầm |
| E-meeting-records-009 | File ghi không có lời nói | Transcript xử lý xong nhưng rỗng | minor | FR-008 | Transcript READY nhưng trống | Cảnh báo "không nhận diện được lời nói"; chủ trì soạn biên bản tay |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-meeting-records-01 | Cuộc họp cần biên bản có transcript khả dụng | Tỷ lệ cuộc họp có media mà transcript đạt READY | ≥ 80% trong pilot (target chính thức chờ OQ-1/OQ-2 PRD) |
| SC-meeting-records-02 | Không file ghi nào thiếu consent | Audit media ↔ consent | 100% media có đủ consent tại thời điểm lưu |
| SC-meeting-records-03 | Lỗi transcript được xử lý, không kẹt | Tỷ lệ job FAILED có thông báo + hành động tiếp theo | 100% |
| SC-meeting-records-04 | Không lộ dữ liệu ngoài phạm vi | Số incident vượt scope xác nhận | 0 (theo M-GR-01 PRD Mục 8) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __MEETING__ — cuộc họp: tiêu đề, thời gian, hình thức, agenda, trạng thái,
  đơn vị/phạm vi, người tạo.
- __MEETING_PARTICIPANT__ — người tham gia cuộc họp: vai trò (chủ trì/thành
  viên/khách ngoài), trạng thái tham gia, trạng thái consent ghi âm và thời
  điểm trả lời, ghi chú consent hộ cho khách.
- __MEETING_MEDIA__ — file ghi âm/ghi hình đính kèm: tên file, định dạng,
  dung lượng, trạng thái xử lý, ngày hết hạn retention.
- __TRANSCRIPT__ — transcript của một media: trạng thái xử lý, nội dung,
  số lần retry.
- __TRANSCRIPT_SEGMENT__ — đoạn transcript: thứ tự, mốc thời gian, nội dung,
  nhãn người nói gán tới participant.
- __MINUTES__ — biên bản cuộc họp: nội dung, trạng thái (nháp/đã xác nhận),
  người xác nhận.
- __MINUTES_REVISION__ — phiên bản chỉnh sửa biên bản: ai sửa, khi nào, nội
  dung trước/sau.
- __APP_USER__, __ORG_UNIT__ — entity ngoài feature (account-access,
  org-governance), chỉ tham chiếu khóa ngoại.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Luồng chính:__ tạo cuộc họp → mời participants + xin consent → đủ consent
  → upload media → job transcript → transcript READY → chủ trì xem/sửa nhãn
  người nói → soạn/lưu biên bản → record hoàn chỉnh trong phạm vi.
- __Luồng consent:__ participant nhận mời → trả lời ACCEPTED/DECLINED → đổi
  được trước giờ họp → đổi sau khi đã có media tạo flag tranh chấp.
- __Luồng retention:__ media đến hạn → xóa media → giữ transcript/biên bản →
  audit xóa → hiển thị ghi chú.
- __Luồng lỗi:__ thiếu consent chặn upload; job FAILED sau 3 retry → báo chủ
  trì → chạy lại thủ công hoặc biên bản tay.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- Danh sách cuộc họp trong phạm vi của user.
- Form tạo/sửa cuộc họp (tiêu đề, thời gian, hình thức, agenda, phạm vi).
- Chi tiết meeting record: participants + trạng thái consent, danh sách media
  + trạng thái job, transcript viewer có sửa nhãn người nói, biên bản +
  lịch sử revision, ghi chú retention.
- Màn trả lời consent của participant.
- Màn từ chối truy cập (ngoài phạm vi).

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Recording chỉ khi có consent đầy đủ; cấm thu âm ngầm | PRD Mục 7.13 "Chưa làm", Mục 12 — Product/DPO |
| Mọi module tuân theo organization/role/data-scope và audit boundary | PRD Mục 9 — Security owner |
| Recording/transcript cần retention policy được duyệt trước dữ liệu thật; OQ-3/OQ-6 mở thì chỉ dữ liệu synthetic | PRD Mục 9 — Product + DPO/legal |
| AI output (transcript) không phải fact — chỉ là nguồn để biên bản được xác nhận | PRD Mục 12 — Product owner |
| Tiếng Việt là ngôn ngữ ưu tiên | PRD Mục 9 — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| `account-access`: đăng nhập, danh bạ người dùng nội bộ | Platform | Toàn bộ feature |
| `org-governance`: đơn vị/phạm vi, role, audit | Platform | Kiểm soát truy cập, audit |
| `contextual-notifications`: gửi lời mời, xin consent, báo job, nhắc biên bản | Platform | Consent flow, thông báo trạng thái |
| AI provider transcript được cấu hình qua `platform-configuration` | Admin/Operations | FR-008/009 — chưa có thì chỉ biên bản tay |
| `document-intake` (đính kèm tài liệu) | Document AI | FR-018 (P1) |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Giới hạn 2 GB/file, 5 file/cuộc họp, 100 participants, retry 3 lần (5 phút → 30 phút → 2 giờ), retention media 90 ngày là mức thận trọng hợp lý | FR-007, FR-009, FR-014 — cần chốt lại theo OQ-1/OQ-3 |
| Một cuộc họp có đúng 1 chủ trì | FR-003, luồng xác nhận biên bản |
| Khách ngoài xử lý bằng ghi tên + chủ trì xác nhận consent hộ | FR-015 — nếu cần consent record riêng thì đổi data model |
| Quản lý trong scope xem transcript nhưng media gốc chỉ participant + chủ trì | FR-013 — chờ OQ-4 |
| Transcript phase đầu chỉ cần tiếng Việt | NFR-007, OQ-5 brainstorm |

## 12. Open Questions

- [ ] OQ-1: Retention chính thức cho file ghi, transcript và biên bản?
  (kế thừa URD OQ-1; liên quan OQ-6 PRD — DPO/legal)
- [ ] OQ-2: Khách ngoài tổ chức cần cơ chế consent riêng không, hay xác nhận
  hộ của chủ trì là đủ? (kế thừa URD OQ-2 — DPO/legal)
- [ ] OQ-3: Giới hạn file chính thức (kích thước, định dạng, số file mỗi cuộc
  họp)? (kế thừa URD OQ-3)
- [ ] OQ-4: Ai được xem media gốc ngoài chủ trì/participant — quản lý trong
  scope hay admin khi audit? (kế thừa URD OQ-4)
- [ ] OQ-5: Transcript có cần đa ngôn ngữ ngay phase đầu? (kế thừa URD OQ-5)
- [ ] OQ-6: SLA xử lý transcript chính thức là bao lâu? (liên quan OQ-2 PRD)
- [ ] OQ-7: Cuộc họp đã ENDED nhưng biên bản bị tranh chấp thì ai có authority
  chốt — chủ trì, quản lý hay admin? [NEEDS CLARIFICATION: quy trình xử lý
  tranh chấp biên bản khi chủ trì và participant bất đồng]
