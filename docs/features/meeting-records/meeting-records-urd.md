---
type: urd
feature: meeting-records
status: draft
updated: 2026-09-13
links:
  - docs/downtown/prd.md
  - docs/features/meeting-records/brainstorms/single-source-meeting-records.md
---

# meeting-records - User Requirements Document

## 1. Purpose

Cho chủ trì một nguồn dữ liệu duy nhất của cuộc họp — thông tin, người tham
gia, file ghi, transcript, biên bản và lịch sử chỉnh sửa — để xác nhận kết
quả họp mà không phải gom từ nhiều công cụ; đồng thời bảo đảm ghi âm chỉ xảy
ra khi có consent và mọi truy cập nằm trong phạm vi quyền.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Chủ trì | Lịch ở calendar, file ghi trên máy cá nhân, biên bản trong Word gửi email/chat | Dữ liệu cuộc họp rải rác, không có nguồn duy nhất để chốt kết quả | Mất thời gian tổng hợp, quyết định bị sót hoặc không truy nguyên được | Confirmed — PRD Mục 2, Mục 7.13 |
| Người tham gia | Không biết file ghi ở đâu, không xem lại được nội dung | Thiếu minh bạch; không biết mình có bị ghi âm không | Không tự kiểm chứng được nội dung họp; rủi ro privacy | Confirmed — PRD Mục 9 (consent/retention) |
| Quản lý | Phải hỏi lại từng người về quyết định đã chốt | Không có kênh xem biên bản trong phạm vi quyền | Chậm ra quyết định, khó kiểm soát cam kết | Confirmed — PRD JTBD-MGR-01 |
| Admin | File ghi âm nằm rải rác không chính sách | Không kiểm soát retention và truy cập | Rủi ro compliance khi dữ liệu nhạy cảm giữ quá hạn | Confirmed — PRD Mục 7.13 rủi ro chính |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Chủ trì (nhân viên/quản lý tạo cuộc họp) | Tạo và chốt kết quả cuộc họp nội bộ | Một record đầy đủ để xác nhận kết quả họp | Dữ liệu rải rác, tổng hợp thủ công, sót quyết định |
| secondary | Người tham gia (nhân viên) | Được mời họp, có thể bị ghi âm | Xem lại nội dung + kiểm soát consent của mình | Không xem lại được, không biết trạng thái ghi âm |
| secondary | Quản lý | Cần truy nguyên quyết định của đội | Xem biên bản đúng phạm vi quyền | Phải hỏi thủ công, thiếu bằng chứng đã chốt |
| secondary | Admin | Vận hành chính sách retention/audit | File ghi nhạy cảm được kiểm soát | Không biết file nào tồn tại, giữ bao lâu |

## 3. Scope Boundaries

### In Scope

- Tạo/sửa/hủy cuộc họp với agenda, participants và vai trò trong họp.
- Consent ghi âm theo từng người tham gia trước khi lưu/bật ghi.
- Upload file ghi âm/ghi hình và xử lý transcript có trạng thái.
- Biên bản thủ công + lịch sử chỉnh sửa (revision) đầy đủ.
- Truy cập theo participant + organization/role/data-scope; retention cho media.

### Out of Scope

- Sinh biên bản bằng AI (thuộc `ai-meeting-minutes`).
- Chuyển action item thành task (thuộc `meeting-to-tasks`).
- Thu âm ngầm hoặc ghi không consent (cấm theo PRD Mục 12).
- Đồng bộ lịch với hệ thống ngoài (thuộc `external-integrations`, chưa chọn
  provider).
- Ghi âm trực tiếp trong nền tảng (P2, khi provider được chọn).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Chủ trì | Khi tạo một cuộc họp nội bộ | Một meeting record duy nhất chứa thông tin, agenda và danh sách người tham gia | Cuộc họp có chỗ lưu chuẩn, đúng phạm vi | Critical | Confirmed — PRD 7.13 |
| UN-002 | Chủ trì | Sau/trong cuộc họp có file ghi | Đính kèm file audio/video vào record và biết file đang được xử lý | File lưu đúng chỗ, trạng thái rõ | Critical | Confirmed — PRD 7.13 |
| UN-003 | Chủ trì | Khi file ghi đã xử lý | Có transcript gắn với cuộc họp để đối chiếu khi viết/xác nhận biên bản | Transcript sẵn sàng để dùng | Critical | Confirmed — PRD 7.13 |
| UN-004 | Người tham gia | Khi được mời vào cuộc họp có ghi âm | Biết cuộc họp sẽ ghi âm và quyết định đồng ý/từ chối | Consent của tôi được ghi nhận trước khi ghi | Critical | Confirmed — PRD Mục 9, 12 |
| UN-005 | Chủ trì | Khi chuẩn bị ghi âm | Biết còn ai chưa đồng ý để xử lý trước | Không ghi âm khi thiếu consent | Critical | Confirmed — PRD 7.13 "Chưa làm" |
| UN-006 | Chủ trì | Khi biên bản được sửa nhiều lần | Xem lại ai sửa gì, khi nào | Lịch sử revision truy vết được | High | Confirmed — PRD 7.13 |
| UN-007 | Người tham gia | Sau cuộc họp | Xem lại transcript/biên bản của cuộc họp mình tham gia | Tự kiểm chứng nội dung đã chốt | High | Confirmed — PRD 7.13 phạm vi quyền |
| UN-008 | Quản lý | Khi cần kiểm tra quyết định của đội | Xem biên bản cuộc họp trong phạm vi quản lý | Thấy đúng dữ liệu, không vượt quyền | High | Confirmed — PRD JTBD-MGR-01 |
| UN-009 | Chủ trì | Khi transcript sai tên người nói | Sửa nhãn người nói trước khi dùng | Transcript phản ánh đúng ai nói | Medium | Assumption — suy từ rủi ro gán sai người PRD 7.14 |
| UN-010 | Admin | Khi vận hành dữ liệu nhạy cảm | Áp retention cho file ghi và audit truy cập | Media tự xóa đúng hạn, truy cập có log | High | Confirmed — PRD Mục 9 |

## 5. Prioritized User Journeys

### Journey 1: Chủ trì tạo record đầy đủ cho cuộc họp có ghi âm

- **User:** Chủ trì
- **Importance:** Critical
- **Trigger:** Cuộc họp được lên lịch
- **Expected outcome:** Meeting record có participants + consent đầy đủ + media
  + transcript sẵn sàng + biên bản lưu cùng một chỗ
- **Related needs:** UN-001, UN-002, UN-003, UN-005, UN-006

1) Tạo cuộc họp với tiêu đề, thời gian, agenda, phạm vi.
2) Thêm participants; hệ thống gửi lời mời kèm yêu cầu consent ghi âm.
3) Theo dõi danh sách consent; xử lý người chưa đồng ý trước khi ghi.
4) Tải file ghi lên record; thấy trạng thái "đang xử lý transcript".
5) Nhận thông báo transcript sẵn sàng; xem và sửa nhãn người nói.
6) Soạn/lưu biên bản; mọi chỉnh sửa tạo revision.

**Independent verification:** Mở meeting record thấy đủ participants, media,
transcript READY và biên bản kèm lịch sử revision — không cần hỏi ai.

### Journey 2: Người tham gia kiểm soát consent và xem lại nội dung

- **User:** Người tham gia
- **Importance:** Critical
- **Trigger:** Nhận thông báo mời họp có ghi âm
- **Expected outcome:** Consent được ghi nhận; sau họp xem lại được nội dung
- **Related needs:** UN-004, UN-007

1) Mở thông báo mời, đọc thông tin cuộc họp và mục ghi âm.
2) Chọn đồng ý hoặc từ chối ghi âm; nhận xác nhận lựa chọn.
3) Sau họp, mở meeting record, xem transcript và biên bản trong phạm vi.

**Independent verification:** Trạng thái consent của user hiển thị đúng lựa
chọn; user mở được transcript/biên bản của cuộc họp mình tham gia và bị chặn
ở cuộc họp không thuộc phạm vi.

### Journey 3: Quản lý truy nguyên quyết định trong phạm vi

- **User:** Quản lý
- **Importance:** High
- **Trigger:** Cần kiểm tra quyết định đã chốt trong họp của đội
- **Expected outcome:** Xem được biên bản thuộc phạm vi, không thấy ngoài phạm vi
- **Related needs:** UN-008

1) Mở danh sách cuộc họp thuộc phạm vi quản lý.
2) Chọn cuộc họp → xem biên bản (và transcript nếu chính sách cho phép).
3) Thấy lượt xem của mình được audit khi nội dung nhạy cảm.

**Independent verification:** Quản lý thấy biên bản cuộc họp trong scope và
không tìm thấy/mở được cuộc họp ngoài scope.

### Journey 4: Chủ trì xử lý khi transcript lỗi hoặc thiếu consent

- **User:** Chủ trì
- **Importance:** Medium
- **Trigger:** Job transcript FAILED hoặc vẫn còn người chưa consent
- **Expected outcome:** Biết rõ trạng thái lỗi và bước xử lý tiếp theo
- **Related needs:** UN-002, UN-003, UN-005

1) Nhận thông báo transcript lỗi / chặn ghi âm vì thiếu consent.
2) Đọc lý do (còn {N} người chưa đồng ý / file lỗi) trên record.
3) Chạy lại job, tải file khác, hoặc viết biên bản tay — record vẫn hợp lệ.

**Independent verification:** Record hiển thị trạng thái lỗi rõ ràng và cho
phép retry/viết tay mà không mất dữ liệu đã có.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Còn participant chưa đồng ý ghi âm | Chủ trì không ghi/lưu media được | Thông báo rõ còn ai chưa đồng ý; đường xử lý: xin lại consent hoặc họp không ghi | J1, J4 / UN-005 |
| File upload quá lớn/sai định dạng | Không đính kèm được | Lỗi rõ nguyên nhân + giới hạn cụ thể | J1 / UN-002 |
| Job transcript lỗi hết retry | Không có transcript | Trạng thái FAILED + thông báo cho chủ trì + nút chạy lại; vẫn viết được biên bản tay | J4 / UN-003 |
| Participant từ chối consent nhưng file đã lỡ lưu | Tranh chấp privacy | Flag cho chủ trì/admin xử lý theo chính sách; không tự xóa âm thầm | J2 / UN-004 |
| Người ngoài phạm vi mở link record | Không xem được | Từ chối truy cập rõ ràng | J3 / UN-008 |
| Media hết retention | Không nghe lại được file gốc | Thấy ghi chú "đã xóa theo chính sách"; transcript/biên bản vẫn còn | J3 / UN-010 |
| Khách ngoài tổ chức tham gia | Không có consent record trong hệ thống | Chủ trì ghi tên + xác nhận đã xin consent ngoài hệ thống | J1 / UN-005 |
| Cuộc họp hủy sau khi đã có media | Dữ liệu còn lại | Record chuyển CANCELLED, giữ để audit, retention vẫn áp dụng | J1 / UN-001 |

## 7. User-side Constraints

- Ngôn ngữ giao diện: tiếng Việt là chính (PRD Mục 9).
- Kênh: web nội bộ, cần tài khoản Town Hown (phụ thuộc `account-access`).
- File ghi bị giới hạn kích thước/định dạng — user cần thông báo rõ giới hạn.
- Người ngoài tổ chức không có tài khoản → không tự quản consent được.
- Quyền xem theo participant + data-scope; deny-by-default.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Transcript dùng AI provider cấu hình sẵn trong `platform-configuration` | Không tạo được transcript nếu chưa có provider | Assumption — chưa xác nhận provider | Chốt provider trước slice Meetings & Work |
| Retention media đề xuất 90 ngày | Sai chính sách lưu trữ, rủi ro compliance | Assumption — chờ PRD OQ-6 | DPO/legal duyệt retention |
| Một cuộc họp có đúng 1 chủ trì | Luồng xác nhận biên bản mơ hồ nếu nhiều chủ trì | Assumption — theo persona PRD | Xác nhận với HR pilot |
| Khách ngoài ghi tên thủ công + chủ trì xác nhận consent hộ | Thiếu bằng chứng consent khách ngoài | Assumption — OQ-2 brainstorm | Hỏi DPO/legal |
| Quản lý trong scope được xem transcript nhưng media gốc chỉ participant + chủ trì | Lộ nội dung nhạy cảm nếu mở rộng | Assumption — OQ-4 brainstorm | Chốt chính sách xem media |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Cuộc họp cần biên bản có transcript khả dụng | Chưa có — xác lập bằng thống kê record trong 1 tháng pilot | ≥ 80% cuộc họp có ghi âm có transcript READY | Tỷ lệ meeting có media mà transcript đạt READY | Hàng tháng trong pilot |
| USC-002 | Chủ trì tìm lại quyết định/biên bản không cần hỏi người khác | Chưa có — xác lập bằng khảo sát chủ trì trong 1 tháng pilot | ≥ 90% biên bản xem lại qua record | Tỷ lệ biên bản được mở trong hệ thống | Hàng tháng trong pilot |
| USC-003 | Không có media nào được lưu khi thiếu consent | 0 sự cố (mặc định) | 100% media có đủ consent tại thời điểm lưu | Audit consent ↔ media | Liên tục |
| USC-004 | Transcript lỗi được chủ trì biết và xử lý | Chưa có — xác lập bằng log job trong 1 tháng pilot | 100% job FAILED có thông báo + hành động tiếp theo (retry/biên bản tay) | Log job vs thông báo | Hàng tháng |

## 10. Open Questions

- [ ] OQ-1: Retention chính thức cho file ghi, transcript và biên bản? (kế
  thừa brainstorm OQ-1, liên quan PRD OQ-6)
- [ ] OQ-2: Cơ chế consent cho khách ngoài tổ chức? (kế thừa brainstorm OQ-2)
- [ ] OQ-3: Giới hạn file chính thức (kích thước, định dạng, số file)? (kế
  thừa brainstorm OQ-3)
- [ ] OQ-4: Ai được xem media gốc ngoài chủ trì/participant? (kế thừa
  brainstorm OQ-4)
- [ ] OQ-5: Transcript có cần đa ngôn ngữ ngay phase đầu? (kế thừa
  brainstorm OQ-5)
