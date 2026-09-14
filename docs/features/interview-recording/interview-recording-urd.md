---
type: urd
feature: interview-recording
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md, docs/features/interview-recording/brainstorms/consent-gated-recording-and-summary.md]
---

# interview-recording - User Requirements Document

## 1. Purpose

Giúp interviewer giảm ghi chép thủ công trong buổi phỏng vấn và giúp HR truy
nguyên được evidence (recording, transcript, bản tóm tắt đã review) gắn với
phiên phỏng vấn và application — trong khi ứng viên luôn được hỏi consent và
dữ liệu được bảo vệ bởi chính sách truy cập/retention đã công bố.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Interviewer | Vừa hỏi vừa ghi chú tay trong buổi phỏng vấn | Chia sự tập trung, sót ý, mất thời gian viết lại biên bản sau buổi | Đánh giá viết sau dựa trên trí nhớ, thiếu evidence trích được | Assumption (PRD 7.24 "giảm ghi chép") |
| HR | Kết quả phỏng vấn chỉ có form đánh giá, không có nguồn gốc | Không đối chiếu được "ai nói gì" khi cần review hoặc khi ứng viên tranh chấp | Quyết định thiếu căn cứ kiểm chứng được | Confirmed (PRD 7.24) |
| Ứng viên | Không biết buổi phỏng vấn có bị ghi không | Dữ liệu cá nhân (giọng nói, câu trả lời) bị thu mà không rõ mục đích/thời hạn | Trải nghiệm thiếu minh bạch, rủi ro khiếu nại | Confirmed (PRD Mục 9, Mục 12 invariant consent) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Interviewer | Được giao phiên phỏng vấn trong `interview-management`, cần ghi evidence và đưa vào đánh giá | Ghi hợp lệ, nhận transcript + summary, xác nhận rồi trích vào evaluation | Vừa hỏi vừa ghi chú; không muốn thao tác consent rườm rà; cần biết trạng thái xử lý |
| secondary | HR | Review kết quả phỏng vấn, xử lý tranh chấp, xuất evidence | Truy nguyên recording/transcript/summary gắn session/application trong đúng scope | Không có nguồn gốc để đối chiếu; sợ truy cập lộ quyền |
| secondary | Ứng viên | Tham gia phỏng vấn, là chủ thể bị ghi | Được hỏi rõ ràng trước khi ghi, biết dữ liệu đi đâu | Lo bị ghi lén; không rõ thời gian lưu |
| secondary | Quản lý | Cần nghe lại một phần buổi trong phạm vi quyền | Truy cập đúng data-scope, có kiểm soát | Không biết mình được xem tới đâu |
| secondary | Admin | Cấu hình provider, retention, điều tra sự cố | Một chỗ cấu hình có kiểm soát, audit đầy đủ | Cấu hình phân tán, lỗi xử lý âm thầm |

## 3. Scope Boundaries

### In Scope

- Hỏi/ghi nhận/quản lý consent ghi âm của ứng viên theo phiên phỏng vấn.
- Ghi âm trong phiên và tải file audio sau buổi, gắn đúng session.
- Tạo transcript và bản tóm tắt đề xuất bằng AI; trạng thái xử lý rõ ràng.
- Interviewer review + xác nhận summary; trích evidence vào đánh giá.
- Hiển thị/truy cập/xuất theo data-scope với audit đầy đủ.
- Áp dụng retention: hết hạn lưu trữ/xóa; rút consent → chặn truy cập và xóa
  theo policy.
- Báo lỗi và retry xử lý không mất file gốc.

### Out of Scope

- Ghi mặc định không thông báo/không hỏi (cấm theo PRD).
- AI kết luận pass/fail hoặc tự đưa nội dung vào quyết định.
- Ghi video, live transcript, phân tích cảm xúc (P2/roadmap).
- Quản lý lịch phỏng vấn, form đánh giá (thuộc `interview-management`,
  `interview-evaluation`).
- Chính sách retention/consent chi tiết — do Product + DPO duyệt ở OQ-6 sản
  phẩm, feature chỉ thực thi policy đã duyệt.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Interviewer | Bắt đầu buổi phỏng vấn đã lên lịch | Biết ngay session đã có consent chưa và xin consent trong 1 thao tác nếu chưa | Consent được ghi nhận có audit trước khi ghi; không ghi được khi chưa có | Critical | Confirmed (PRD: consent trước recording) |
| UN-002 | Interviewer | Trong/sau buổi phỏng vấn | Ghi âm phiên hoặc tải file audio gắn đúng session | Recording được lưu, vào hàng xử lý, không mất file | Critical | Confirmed (PRD 7.24) |
| UN-003 | Interviewer | Sau khi recording xử lý xong | Đọc transcript, nghe lại file gốc, sửa và xác nhận bản tóm tắt AI | Bản tóm tắt "đã review" làm evidence được; người khác biết ai đã xác nhận | Critical | Confirmed (PRD: summary review) |
| UN-004 | Interviewer | Khi viết đánh giá trong `interview-evaluation` | Trích đoạn transcript/summary đã review vào note đánh giá kèm nguồn | Đánh giá có evidence truy nguyên về đoạn gốc | High | Assumption (từ "liên kết evidence với session/application") |
| UN-005 | HR | Khi review kết quả hoặc xử lý tranh chấp | Mở recording/transcript/summary của session trong data-scope của mình | Xem/nghe được đầy đủ, lượt truy cập được audit | Critical | Confirmed (PRD: truy nguyên kết quả) |
| UN-006 | HR | Khi cần đưa evidence ra ngoài hệ thống (báo cáo, đối chiếu) | Xuất transcript/summary (file gốc theo policy) trong đúng quyền | File xuất hợp lệ, lượt xuất có audit | High | Confirmed (PRD: export) |
| UN-007 | Ứng viên | Trước/trong buổi phỏng vấn | Được hỏi đồng ý ghi với nội dung rõ ràng (mục đích, ai xem, lưu bao lâu); có quyền từ chối/rút | Không bị ghi khi chưa đồng ý; từ chối vẫn được phỏng vấn bình thường | Critical | Confirmed (invariant consent, PRD Mục 12) |
| UN-008 | HR/Admin | Khi ứng viên rút consent hoặc dữ liệu hết hạn | Dữ liệu chuyển trạng thái chờ xóa/lưu trữ theo policy, chặn truy cập mới | Không ai truy cập được dữ liệu đã rút/hết hạn; có audit | High | Confirmed (PRD: retention/access policy) |
| UN-009 | Interviewer/Admin | Khi xử lý transcript/summary lỗi hoặc quá lâu | Được báo rõ trạng thái lỗi, có đường retry, file gốc an toàn | Không mất dữ liệu; biết khi nào xong hoặc phải làm gì | High | Assumption (luồng xử lý async) |
| UN-010 | Admin | Khi thiết lập feature | Cấu hình provider AI + retention/access policy ở một chỗ, có audit | Policy áp dụng nhất quán cho mọi recording | Medium | Assumption (PRD Mục 9) |

## 5. Prioritized User Journeys

### Journey 1: Ghi và review một phiên phỏng vấn có consent

- **User:** Interviewer
- **Importance:** Critical
- **Trigger:** Phiên phỏng vấn được xác nhận trong `interview-management` và
  sắp diễn ra.
- **Expected outcome:** Recording có consent, transcript + summary được tạo,
  interviewer xác nhận summary, evidence gắn với session/application.
- **Related needs:** UN-001, UN-002, UN-003, UN-004

1) Mở phiên phỏng vấn → thấy trạng thái consent ("đã đồng ý" hoặc "chưa hỏi").
2) Nếu chưa hỏi: bấm "Xin phép ghi âm" → đọc/gửi nội dung consent → ứng viên
   đồng ý → hệ thống ghi nhận.
3) Bấm "Bắt đầu ghi" → phỏng vấn → "Dừng ghi" (hoặc sau buổi tải file lên).
4) Nhận thông báo/hiển thị "Sẵn sàng" → mở trang review → nghe lại, đọc
   transcript, sửa bản tóm tắt đề xuất → bấm "Xác nhận".
5) Trong form đánh giá, trích đoạn transcript/summary làm evidence.

**Independent verification:** Chọn một session có recording "đã-review": mở
session → thấy consent record, file recording, transcript, summary đã xác nhận
với người xác nhận + thời điểm; mở evaluation → thấy đoạn trích kèm liên kết
về đoạn gốc.

### Journey 2: Ứng viên được hỏi consent và có thể từ chối

- **User:** Ứng viên
- **Importance:** Critical
- **Trigger:** Trước buổi phỏng vấn (qua thư mời) hoặc ngay trong phiên khi
  interviewer xin phép.
- **Expected outcome:** Ứng viên hiểu mình sắp bị ghi, đồng ý hoặc từ chối có
  ghi nhận; từ chối thì buổi vẫn diễn ra, chỉ không có recording.
- **Related needs:** UN-007, UN-001

1) Nhận/đọc nội dung xin phép ghi âm (mục đích, ai xem, lưu bao lâu).
2) Quyết định đồng ý → phiên được phép ghi; hoặc từ chối → hệ thống khoá ghi,
   interviewer ghi chú tay.
3) Sau buổi có thể rút đồng ý đã cho → dữ liệu bị chặn và xếp lịch xóa.

**Independent verification:** Với một session ứng viên từ chối: kiểm tra nút
ghi/tải file bị khoá, consent record "từ chối" có thời điểm, và không tồn tại
recording nào của session đó.

### Journey 3: HR truy nguyên và xuất evidence

- **User:** HR
- **Importance:** High
- **Trigger:** Cần review kết quả phỏng vấn hoặc đối chiếu khi có tranh chấp.
- **Expected outcome:** Xem/nghe/xuất được evidence trong data-scope, lượt
  truy cập có audit; ngoài scope bị từ chối rõ ràng.
- **Related needs:** UN-005, UN-006, UN-008

1) Mở application/session → tab evidence → thấy recording/transcript/summary
   đã review.
2) Nghe file gốc hoặc đọc transcript; mở được đoạn trích từ evaluation về
   nguồn.
3) Bấm "Xuất" → chọn loại dữ liệu được policy cho phép → nhận file, lượt
   xuất ghi audit.

**Independent verification:** Đăng nhập HR trong scope: mở được evidence và
thấy audit log ghi lượt xem/xuất; đăng nhập HR ngoài scope: bị chặn với thông
báo rõ và có audit từ chối.

### Journey 4: Xử lý lỗi xử lý recording

- **User:** Interviewer (admin hỗ trợ)
- **Importance:** Medium
- **Trigger:** AI provider lỗi/timeout khi tạo transcript hoặc summary.
- **Expected outcome:** Trạng thái "lỗi xử lý" hiển thị rõ, file gốc còn
  nguyên, retry được, admin được báo khi hết retry.
- **Related needs:** UN-009, UN-002

1) Recording chuyển "Lỗi xử lý" → interviewer nhận thông báo kèm nguyên nhân
   mức nghiệp vụ.
2) Bấm "Thử xử lý lại" → vào lại hàng xử lý; thành công → về "Sẵn sàng".
3) Hết retry tự động lẫn thủ công → admin nhận cảnh báo để xử lý theo runbook.

**Independent verification:** Với một recording "lỗi-xử-lý": file gốc vẫn mở
được, nút retry hoạt động, admin thấy cảnh báo có session/recording liên quan.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Ứng viên từ chối consent | Interviewer không ghi được | Nút ghi/tải file khoá kèm lý do; gợi ý ghi chú tay | Journey 2 / UN-007 |
| Chưa hỏi consent mà muốn tải file sau buổi | Không tải được ngay | Bắt buộc hoàn tất consent trước khi nhận file | Journey 2 / UN-001 |
| Mất mạng/đóng trình duyệt giữa buổi ghi | Sợ mất phần đã ghi | Mở lại session thấy trạng thái và phần dữ liệu còn lại; tiếp tục hoặc tải phần dở | Journey 1 / UN-002 |
| File tải lên sai định dạng/quá lớn | Upload bị từ chối | Thông báo nêu định dạng + giới hạn cụ thể | Journey 1 / UN-002 |
| Xử lý quá SLA | Không biết khi nào có transcript | Hiển thị "xử lý chậm", báo khi xong; admin nhận cảnh báo | Journey 4 / UN-009 |
| Người ngoài scope mở link recording | Truy cập bị chặn | Thông báo không có quyền + ghi audit | Journey 3 / UN-005 |
| Consent bị rút sau khi đã ghi | Evidence không còn truy cập được | Trạng thái "chờ xóa", đoạn trích trong evaluation đánh dấu nguồn đã rút | Journey 2,3 / UN-008 |
| Dữ liệu hết hạn retention | Không còn mở được | Trạng thái lưu trữ/xóa theo policy; bản đã trích trong evaluation giữ nguyên kèm ghi chú | Journey 3 / UN-008 |
| Hai người cùng sửa summary | Mất thay đổi của một người | Người lưu sau thấy cảnh báo tải lại bản mới nhất | Journey 1 / UN-003 |

## 7. User-side Constraints

- Giao diện tiếng Việt ưu tiên (PRD Mục 9); nội dung consent phải đọc được
  bởi ứng viên không chuyên HR.
- Chỉ truy cập được khi có tài khoản + đúng organization/role/data-scope;
  ứng viên không có tài khoản — tương tác consent qua thư mời/trong phiên.
- Recording/transcript/summary là dữ liệu nhạy cảm: tuân theo retention và
  access policy được duyệt (OQ-6 sản phẩm); trước khi duyệt chỉ dùng dữ liệu
  thử.
- Người dùng chủ yếu trên desktop web trong giờ làm việc; ứng viên có thể
  đọc consent trên mobile (thư mời).
- AI chỉ tạo đề xuất; quyết định và nội dung dùng làm evidence luôn do con
  người xác nhận.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Session/phân công interviewer đã có từ `interview-management`; feature chỉ gắn evidence | Nếu chưa có, feature phải tự quản lý session → scope phình | Assumption (PRD deps 9,10) | Xác nhận khi `interview-management` chi tiết hóa |
| Consent hỏi được qua thư mời trước buổi và/hoặc trong phiên | Nếu chỉ một kênh được chấp nhận, flow xin consent thay đổi | Assumption | Chờ OQ-4 (brainstorm) |
| Đường "ghi trong phiên" có sẵn nền kỹ thuật; nếu không thì tải file là đường chuẩn | Nếu không có, P0 "ghi trong phiên" thành P1 | Assumption | Chờ OQ-6 (brainstorm) |
| Ứng viên có kênh liên hệ (email) để nhận nội dung consent trước buổi | Nếu không, consent chỉ hỏi được trong phiên | Assumption (dựa `cv-intake`) | Kiểm tra dữ liệu liên hệ ứng viên |
| Policy retention/access sẽ được duyệt trước pilot dữ liệu thật | Nếu chưa duyệt → chỉ pilot synthetic | Confirmed direction (PRD Mục 9-10, OQ-6) | Theo dõi OQ-6 sản phẩm |
| Evaluation form cho phép đính evidence trích nguồn | Nếu không, đoạn trích chỉ là text copy | Assumption | Xác nhận với `interview-evaluation` |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Recording được xử lý và review trong SLA | Chưa có — xác lập bằng đo pilot trên các session đủ consent | ≥80% trong SLA 30 phút xử lý + review trước khi evaluation đóng (đề xuất — chờ OQ-3) | Tỷ lệ recording "đã-review" trong SLA / tổng recording đủ consent | Hàng tháng trong pilot |
| USC-002 | Mọi recording đều có consent hợp lệ | 0 (chưa có feature) | 100% — guardrail bắt buộc | Số recording thiếu consent record hợp lệ | Liên tục |
| USC-003 | Interviewer giảm thời gian viết biên bản | Chưa có — xác lập bằng khảo sát/ước lượng thời gian ghi chú hiện tại trong 2 tuần pilot đầu | Giảm rõ so baseline (mức số chờ chốt cùng sponsor) | Thời gian trung bình từ kết thúc buổi → evaluation "đã review" | Sau 4 tuần pilot |
| USC-004 | HR truy nguyên được evidence khi cần | Chưa có — xác lập bằng số phiên có evidence hiện nay | 100% phiên có recording "đã-review" truy nguyên được từ evaluation | Tỷ lệ phiên có evidence gắn session/application mở được trong scope | Hàng tháng |
| USC-005 | Không sự cố vượt quyền truy cập recording | 0 | 0 — guardrail | Số incident truy cập ngoài data-scope được xác nhận | Liên tục |

## 10. Open Questions

- [ ] OQ-1 (kế thừa brainstorm OQ-1 / sản phẩm OQ-6): retention/consent chính
  thức cho recording, transcript, summary và evaluation — thời hạn, ai xem,
  quy trình rút/xóa, legal hold?
- [ ] OQ-2 (brainstorm OQ-2): giới hạn đề xuất — định dạng file, 500 MB, 4
  giờ/session, 5 recording/session, retry 3 lần — được duyệt chưa?
- [ ] OQ-3 (brainstorm OQ-3): SLA xử lý + review và target tỷ lệ trong SLA?
- [ ] OQ-4 (brainstorm OQ-4): kênh consent bắt buộc (thư mời / trong phiên /
  cả hai) và consent theo session hay theo quy trình?
- [ ] OQ-5 (brainstorm OQ-5): panel interview — consent của từng người bị ghi
  xử lý thế nào?
- [ ] OQ-6 (brainstorm OQ-6): nền "ghi trong phiên" có sẵn hay bắt buộc đường
  tải file?
- [ ] OQ-7 (brainstorm OQ-7): ai được xuất file gốc và định dạng xuất nào
  được cho phép?
