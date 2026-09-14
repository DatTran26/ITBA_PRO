---
type: urd
feature: interview-management
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/interview-management/brainstorms/session-scheduling-and-interviewer-acceptance.md
  - docs/_reverse/recruitment-and-interviews/reverse-spec.md
---

# interview-management — User Requirements Document

## 1. Purpose

Cho HR một nơi duy nhất để đặt lịch, phân công interviewer và chốt phiên
phỏng vấn có đủ context — và cho interviewer một thư mời rõ ràng để chấp
nhận, từ chối hoặc đề xuất đổi lịch — để không buổi phỏng vấn nào bị lỡ
vì lịch nằm rải rác trong email/chat và không ai thiếu CV/JD trước giờ
vào phòng.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Phối hợp lịch qua email/chat và lịch cá nhân | Gõ lại thời gian nhiều lần, không biết ai đã xác nhận, khi lịch đổi thì một bên nào đó không được báo | Phiên bị lỡ, ứng viên đến sai giờ, application kẹt ở bước phỏng vấn | Confirmed — PRD Mục 7.9 (rủi ro chính: lịch đổi nhưng notification/context không đồng bộ) |
| Interviewer | Nhận lịch rời qua tin nhắn | Không có CV đã xác nhận, JD hay câu hỏi trước buổi | Chuẩn bị kém, hỏi lệch trọng tâm, đánh giá thiếu căn cứ | Confirmed — PRD Mục 3 (JTBD-INT-01), Mục 7.9 (session context) |
| Ứng viên | Nhận giờ hẹn qua điện thoại/email rời | Thông tin mơ hồ, đổi lịch không được báo lại | Trải nghiệm tuyển dụng xấu, bỏ lỡ buổi hẹn | Confirmed — PRD Mục 3 (JTBD-CAN-01) |
| Quản lý | Muốn nắm lịch phỏng vấn tuần của team | Không có chỗ xem tập trung trong phạm vi mình | Không biết team đang quá tải hay trống lịch | Confirmed — PRD Mục 3 (JTBD-MGR-01) |
| Admin | Quyền xem lịch phỏng vấn khác nhau giữa API và màn hình | Người không được cấp vẫn thấy dữ liệu ứng viên | Lộ thông tin nhạy cảm ngoài phạm vi | Observed: reverse spec GAP-RC-05 (API role và RLS matrix lệch nhau); PRD Mục 9 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Điều phối phỏng vấn cho các application đã đến bước trong pipeline | Tạo phiên một lần, thấy trạng thái phản hồi của interviewer, mọi thay đổi tự thông báo lại đủ bên | Phối hợp lặp qua email/chat, không biết ai đã xác nhận, gửi thiếu context |
| secondary | Interviewer | Được gán vào phiên phỏng vấn | Một thư mời có đủ CV/JD/câu hỏi và nút chấp nhận/từ chối/đề xuất đổi lịch | Lịch rời, thiếu context trước buổi |
| secondary | Ứng viên | Được mời phỏng vấn | Nhận lịch rõ (giờ, hình thức, địa điểm/link, người phỏng vấn) và được báo khi đổi | Lịch mơ hồ, đổi không báo |
| secondary | Quản lý | Giám sát lịch phỏng vấn trong phạm vi | Xem lịch phiên theo data-scope | Không có góc nhìn tập trung |
| secondary | Admin | Kiểm tra quyền truy cập phiên | Truy cập theo organization/role/scope nhất quán, có audit | Quyền lệch giữa màn hình và dữ liệu |

## 3. Scope Boundaries

### In Scope

- Tạo phiên phỏng vấn từ application đang ở bước phỏng vấn trong
  `candidate-pipeline`: vòng, thời gian bắt đầu/kết thúc, hình thức
  (trực tuyến/trực tiếp/điện thoại), địa điểm hoặc link họp.
- Phân công một hoặc nhiều interviewer (và observer ở mức P1); chỉ người
  có vai trò interviewer còn hiệu lực mới được gán.
- Thư mời interviewer với phản hồi ba lựa chọn: chấp nhận / từ chối kèm
  lý do / đề xuất đổi lịch kèm khung giờ.
- Thông báo lịch cho ứng viên qua kênh liên hệ đã đăng ký; nhắc trước
  giờ hẹn.
- Session context tối thiểu: CV đã xác nhận + JD vị trí; kèm câu hỏi gợi
  ý đã duyệt và ghi chú/kết quả các vòng trước khi có.
- Xác nhận phiên khi có ít nhất một interviewer chấp nhận; "cần gán lại"
  khi tất cả từ chối.
- Đổi lịch và hủy phiên bắt buộc lý do, thông báo lại toàn bộ
  participant + ứng viên, lịch sử trước/sau.
- Ghi nhận kết quả diễn ra: hoàn thành / ứng viên vắng / hủy sát giờ —
  đầu vào cho `interview-evaluation`.
- Audit ai tạo, đổi lịch, gán/gỡ participant, ghi nhận kết quả.
- Cảnh báo trùng lịch interviewer (mềm, không chặn) và nhắc phiên chờ
  xác nhận quá lâu (nhóm P1).

### Out of Scope

- Tối ưu lịch tự động đa múi giờ (PRD Mục 7.9 "Chưa làm").
- Đồng bộ calendar bên ngoài — thuộc `external-integrations` khi provider
  được chọn.
- Ứng viên tự chọn slot (self-scheduling) — P2, cần cổng ứng viên có xác
  thực.
- Ghi đánh giá sau buổi — thuộc `interview-evaluation`; feature này chỉ
  ghi nhận phiên đã diễn ra/vắng.
- Ghi âm phiên — thuộc `interview-recording` (consent được truyền nội
  dung trong thư mời, việc ghi nhận và chặn ghi không nằm ở đây).
- Quyết định chuyển stage của application — thuộc `candidate-pipeline`;
  feature này chỉ phát sự kiện "phiên được tạo" để pipeline chuyển
  `INTERVIEW_SCHEDULED` và đọc trạng thái bước để cho phép tạo phiên.
- Đề xuất interviewer theo kỹ năng — P2, phụ thuộc `talent-framework`.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi application đến bước phỏng vấn | Tạo phiên một lần với vòng, giờ, hình thức, địa điểm/link và interviewer hợp lệ — không phải dàn xếp qua nhiều kênh | Phiên ở "chờ xác nhận", thư mời đi kèm context đủ | Critical | Confirmed — PRD Mục 7.9 (lịch, participants, assignment); Observed: reverse spec FR-RC-04 |
| UN-002 | Interviewer | Khi nhận thư mời phỏng vấn | Xem đủ context (CV đã xác nhận, JD, câu hỏi gợi ý, kết quả vòng trước) và phản hồi bằng một thao tác: chấp nhận / từ chối kèm lý do / đề xuất giờ khác | Phản hồi được ghi nhận ngay, HR thấy trạng thái | Critical | Confirmed — PRD Mục 7.9 (acceptance, session context); Observed: reverse spec FR-RC-05 |
| UN-003 | HR | Khi chờ interviewer phản hồi | Thấy ai đã chấp nhận/từ chối/chưa phản hồi; được báo khi tất cả từ chối hoặc chờ quá lâu | Không phiên nào treo vô hình trước giờ hẹn | Critical | Confirmed — PRD Mục 7.9; brainstorm Mục 9 (rủi ro phiên treo) |
| UN-004 | Ứng viên | Khi được mời phỏng vấn | Nhận thông báo lịch rõ ràng (giờ, hình thức, địa điểm/link, người phỏng vấn, việc cần chuẩn bị) qua kênh đã đăng ký | Đến đúng giờ đúng chỗ, được báo khi đổi | Critical | Confirmed — PRD Mục 3 (JTBD-CAN-01), Mục 7.9 |
| UN-005 | HR | Khi lịch thay đổi sau xác nhận | Đổi lịch/hủy phiên với lý do bắt buộc và hệ thống tự thông báo lại mọi bên | Không ai đến sai giờ vì không được báo | Critical | Confirmed — PRD Mục 7.9 (rủi ro chính) |
| UN-006 | HR/interviewer | Khi buổi phỏng vấn kết thúc | Ghi nhận phiên đã diễn ra, ứng viên vắng hay hủy sát giờ | Phiên sẵn sàng cho bước đánh giá; vắng thì có thể xếp lại | Critical | Confirmed — PRD Mục 7.9 (luồng chính); Observed: reverse spec FR-RC-06 |
| UN-007 | HR | Khi gán interviewer cho phiên | Chỉ chọn được người có vai trò interviewer còn hiệu lực; được cảnh báo khi trùng lịch phiên khác | Không gán nhầm người thiếu quyền xem dữ liệu ứng viên | High | Observed: reverse spec FR-RC-04 (kiểm active/role); brainstorm Mục 4 (P1) |
| UN-008 | Quản lý | Khi cần biết lịch phỏng vấn của team | Xem danh sách/lịch phiên trong data-scope, lọc theo vị trí/interviewer/tuần | Nắm được tải và tiến độ mà không vượt quyền | High | Confirmed — PRD Mục 3 (JTBD-MGR-01) |
| UN-009 | HR | Khi interviewer đề xuất giờ khác | Xem đề xuất, chốt giờ mới hoặc từ chối đề xuất; participant xác nhận lại giờ mới | Đổi lịch hai chiều có kiểm soát | High | Confirmed — brainstorm Mục 4 (P1), Mục 5.2 |
| UN-010 | Admin | Khi kiểm tra truy cập phiên | Mọi màn hình/API đọc phiên đều chịu một bộ kiểm quyền theo scope | Không lộ dữ liệu ứng viên ngoài phạm vi | Critical | Observed: reverse spec GAP-RC-05; PRD Mục 9 |

## 5. Prioritized User Journeys

### Journey 1: Tạo phiên → interviewer phản hồi → xác nhận → diễn ra

- **User:** HR
- **Importance:** Critical
- **Trigger:** Application đang ở bước phỏng vấn trong pipeline.
- **Expected outcome:** Phiên được tạo, interviewer phản hồi, phiên chuyển
  "đã xác nhận", mọi bên được thông báo đồng bộ, buổi diễn ra đúng lịch
  và được ghi nhận.
- **Related needs:** UN-001, UN-002, UN-003, UN-004, UN-006

1) HR mở application → «Tạo phiên phỏng vấn» → chọn vòng, thời gian,
   hình thức, địa điểm/link → gán interviewer trong danh sách hợp lệ.
2) Hệ thống gửi thư mời kèm context cho từng interviewer và thông báo
   lịch cho ứng viên.
3) Interviewer mở thư mời → xem context → chấp nhận / từ chối kèm lý do /
   đề xuất giờ khác.
4) Khi có ít nhất một interviewer chấp nhận và giờ còn hiệu lực → phiên
   "đã xác nhận"; nếu tất cả từ chối → phiên "cần gán lại" và HR được báo.
5) Trước giờ hẹn hệ thống nhắc interviewer và ứng viên.
6) Sau buổi, HR/interviewer ghi nhận "hoàn thành" hoặc "ứng viên vắng" →
   phiên sẵn sàng cho `interview-evaluation`.

**Independent verification:** Chọn một phiên vừa "đã xác nhận" — kiểm tra
có ≥1 participant ở trạng thái "chấp nhận", bản ghi gửi thông báo tới đủ
participant + ứng viên, và context đính kèm có CV đã xác nhận + JD.

### Journey 2: Đổi lịch phiên đã xác nhận

- **User:** HR (kích) / Interviewer (đề xuất)
- **Importance:** High
- **Trigger:** Xung đột lịch hoặc interviewer đề xuất giờ khác.
- **Expected outcome:** Phiên cập nhật giờ mới, participant xác nhận lại,
  ứng viên được báo đổi, history giữ cả giờ cũ lẫn giờ mới kèm lý do.
- **Related needs:** UN-005, UN-009, UN-002

1) HR mở phiên → «Đổi lịch» → chọn giờ mới, nhập lý do (hoặc interviewer
   gửi đề xuất đổi lịch và HR chốt).
2) Hệ thống cập nhật phiên, đưa participant về "chờ phản hồi" cho giờ mới
   và gửi thông báo đổi lịch cho interviewer + ứng viên.
3) Khi đủ chấp nhận lại → phiên "đã xác nhận" với giờ mới.

**Independent verification:** Đổi lịch một phiên đã xác nhận — kiểm tra
thông báo đổi đã gửi tới 100% participant + ứng viên, history có dòng
ghi giờ cũ → giờ mới kèm lý do, và participant về "chờ phản hồi" cho đến
khi xác nhận lại.

### Journey 3: Interviewer từ chối và gán lại

- **User:** Interviewer / HR
- **Importance:** High
- **Trigger:** Interviewer từ chối thư mời kèm lý do.
- **Expected outcome:** HR được báo; nếu không còn ai chấp nhận thì phiên
  "cần gán lại" và nổi trong danh sách việc của HR cho tới khi gán được
  người mới.
- **Related needs:** UN-003, UN-002, UN-001

1) Interviewer từ chối kèm lý do → participant đó "từ chối", HR nhận
   thông báo.
2) Còn interviewer khác đã chấp nhận → phiên giữ "đã xác nhận"; không còn
   ai → phiên "cần gán lại".
3) HR gán interviewer mới → thư mời mới gửi đi; ứng viên được cập nhật
   nếu thông tin buổi đổi.

**Independent verification:** Tạo phiên một interviewer rồi cho từ chối —
phiên phải chuyển "cần gán lại", xuất hiện trong danh sách việc của HR và
không tự quay về "chờ xác nhận" cho tới khi gán mới.

### Journey 4: Hủy phiên

- **User:** HR
- **Importance:** Medium
- **Trigger:** Vị trí đóng, ứng viên rút hồ sơ hoặc kế hoạch thay đổi.
- **Expected outcome:** Phiên "đã hủy" kèm lý do, mọi bên được báo hủy,
  evaluation nháp liên quan được đánh dấu phiên đã hủy.
- **Related needs:** UN-005, UN-004

1) HR chọn «Hủy phiên» → bắt buộc lý do → xác nhận.
2) Phiên "đã hủy"; thông báo hủy gửi toàn bộ participant + ứng viên;
   lịch sử ghi lại.
3) Ứng viên/application có thể được xếp phiên mới khi HR tạo lại.

**Independent verification:** Hủy một phiên đã xác nhận — kiểm tra 100%
participant + ứng viên có bản ghi thông báo hủy kèm lý do, và phiên không
còn cho phép thao tác đổi/gán.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Tạo phiên cho application chưa đến bước phỏng vấn | Thao tác bị chặn không rõ lý do | "Ứng viên chưa đến bước phỏng vấn — không thể tạo phiên" + nêu trạng thái hiện tại | Journey 1 / UN-001 |
| Gán người không có vai trò interviewer hoặc đã bị vô hiệu | Người thiếu quyền thấy dữ liệu ứng viên | Không hiện trong danh sách chọn; nếu cố gán: "{Người} không có vai trò interviewer hoặc đã bị vô hiệu hóa" | Journey 1 / UN-007 |
| Interviewer không phản hồi trước giờ hẹn | Phiên treo, HR không hay | Hết hạn phản hồi (48 giờ đề xuất) → nhắc; phiên "chờ xác nhận" quá giờ hẹn → đánh dấu "quá hạn xác nhận" cho HR xử lý | Journey 3 / UN-003 |
| Tất cả interviewer từ chối | Phiên không thể diễn ra | Phiên "cần gán lại", nổi trong danh sách việc HR | Journey 3 / UN-003 |
| Đổi lịch/hủy thiếu lý do | Participant không hiểu vì sao đổi | "Vui lòng nhập lý do để thông báo cho người tham gia" | Journey 2, 4 / UN-005 |
| Ứng viên thiếu kênh liên hệ hợp lệ | Không gửi được lịch | "Chưa có kênh liên hệ của ứng viên — bổ sung trước khi xác nhận phiên" | Journey 1 / UN-004 |
| Hai HR cùng sửa một phiên | Người lưu sau ghi đè | "Phiên vừa được {người} cập nhật — tải lại" trước khi mất dữ liệu | Journey 2 / UN-005 |
| Interviewer mở thư mời cũ sau khi phiên đã đổi giờ | Phản hồi cho giờ cũ | Trang phản hồi luôn hiển thị giờ mới nhất; phản hồi ghi cho giờ đang hiệu lực | Journey 2 / UN-002 |
| Đề xuất đổi lịch đến khi phiên đã bị hủy | Đề xuất treo | Đề xuất tự đóng "không còn hiệu lực" và báo người đề xuất | Journey 2 / UN-009 |
| Application bị chuyển trạng thái (vd bị loại) khi phiên chưa diễn ra | Phiên lệch với pipeline | Phiên hiện cảnh báo "application đã đổi trạng thái", HR quyết hủy hoặc giữ | Journey 4 / UN-005 |
| Tạo phiên vòng sau khi vòng trước chưa có đánh giá | Đánh giá thiếu nền | Cảnh báo "Vòng {n-1} chưa có đánh giá — bạn vẫn có thể tạo phiên vòng {n}" (không chặn) | Journey 1 / UN-001 |
| Interviewer bị vô hiệu tài khoản giữa chừng | Phiên thiếu người | Participant đánh dấu không còn hiệu lực, phiên kiểm lại điều kiện xác nhận và báo HR nếu rơi về "cần gán lại" | Journey 3 / UN-007 |
| Empty state — application chưa có phiên | Không biết bắt đầu | "Chưa có phiên phỏng vấn nào — tạo phiên đầu tiên" | Journey 1 |

## 7. User-side Constraints

- Giao diện và thông báo tiếng Việt; mọi thời điểm hiển thị theo múi giờ
  của người xem, lưu kèm múi giờ tổ chức.
- Chỉ người dùng nội bộ có role/data-scope phù hợp mới tạo/sửa/xem phiên;
  ứng viên chỉ nhận thông báo/nhắc qua kênh liên hệ, không có giao diện
  quản lý phiên trong v1.
- Thư mời interviewer phải kèm context tối thiểu (CV đã xác nhận + JD)
  trước khi gửi — người dùng không thể gửi thư mời rỗng context.
- Đổi lịch, hủy phiên, từ chối thư mời đều bắt buộc lý do — không có
  đường tắt bỏ qua.
- Giới hạn đề xuất v1: ≤5 interviewer + ≤3 observer mỗi phiên, thời lượng
  ≤4 giờ, đổi lịch ≤3 lần, hạn phản hồi thư mời 48 giờ (chờ Product
  owner chốt — OQ-3).
- Màn hình desktop là chính cho HR; interviewer có thể phản hồi trên
  thiết bị di động qua trang phản hồi đơn giản.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Trạng thái bước phỏng vấn của application do `candidate-pipeline` quyết định; feature này chỉ đọc và phát sự kiện | Nếu phải tự quyết stage → hai nguồn chân lý | Confirmed — brainstorm Mục 8; PRD Mục 7.8/7.9 | — |
| Danh sách interviewer hợp lệ (vai trò + active + phạm vi) do `org-governance`/`account-access` cung cấp | Nếu phải tự quản → trùng logic quyền | Confirmed — PRD Mục 7.1/7.2; brainstorm Mục 8 | Kiểm chứng khi đặc tả contract org-governance |
| Context phiên chỉ tham chiếu dữ liệu đã xác nhận (CV từ `cv-intake`/`document-review`, JD từ `recruitment-planning`, câu hỏi đã duyệt từ `question-bank`) | Nếu tham chiếu dữ liệu thô → interviewer thấy dữ liệu chưa kiểm chứng | Confirmed — brainstorm Mục 8; PRD Mục 7.6/7.19 | — |
| Thông báo đi qua `contextual-notifications`/`operational-email`; kênh ứng viên lấy từ hồ sơ liên hệ `cv-intake` | Nếu tự gửi → lệch delivery log | Assumption — bám Feature Map dependency | Kiểm chứng khi `contextual-notifications` đặc tả |
| Ứng viên v1 chỉ nhận thông báo/nhắc, không xác nhận tham gia trong hệ thống; HR ghi nhận vắng/hoàn thành | Nếu cần xác nhận hai chiều → thêm surface ứng viên | Assumption — brainstorm OQ-2 đã giải (đề xuất) | Chờ Product owner xác nhận |
| Giới hạn 7.2 (5 interviewer, 3 observer, 4 giờ, đổi lịch 3 lần, phản hồi 48 giờ, nhắc 24 giờ/1 giờ) là mặc định cấu hình được | Nếu khác → UX và validation đổi | Assumption — brainstorm OQ-3 đã giải (đề xuất) | Chờ Product owner xác nhận |
| Số vòng phỏng vấn là trường trên phiên; không giới hạn cứng trong v1 | Nếu chuẩn cố định 3 vòng → validation thay đổi | Assumption — brainstorm OQ-1 đã giải (đề xuất); OQ-RC-01 | Chờ Head of HR xác nhận |
| Consent ghi âm truyền nội dung trong thư mời; ghi nhận/thực thi consent thuộc `interview-recording` | Nếu gộp → hai feature chồng scope | Confirmed — brainstorm OQ-5; PRD Mục 7.24 | — |
| HR xem phiên theo data-scope của `org-governance`, không chỉ record tự tạo | Nếu chỉ record tự tạo → quản lý không giám sát được | Assumption — brainstorm OQ-7 đã giải; OQ-RC-02 | Chờ Admin lead/Security xác nhận |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Phiên diễn ra đúng lịch đã xác nhận | Chưa có — xác lập bằng đo tỷ lệ trong 1 tháng pilot đầu | ≥90% phiên "đã xác nhận" diễn ra đúng giờ hoặc được đổi/hủy có báo trước (mốc đề xuất — chờ chốt cùng OQ-2 PRD) | Phiên hoàn thành đúng lịch / phiên đã xác nhận trong kỳ | 1 tháng sau pilot |
| USC-002 | Không phiên nào thiếu context khi đến giờ | 0% (hiện không có context chuẩn) | 100% phiên "đã xác nhận" có ≥1 interviewer chấp nhận + context tối thiểu (CV + JD) | Kiểm tra phiên đã xác nhận trong kỳ | Liên tục |
| USC-003 | Đổi lịch/hủy luôn đến được mọi bên | Chưa có — xác lập bằng audit gửi thông báo trong pilot | 100% sự kiện đổi/hủy có bản ghi thông báo tới đủ participant + ứng viên | Đối chiếu sự kiện đổi/hủy với delivery log | Liên tục |
| USC-004 | Phiên không treo chờ phản hồi | Chưa có — xác lập bằng đo thời gian chờ trong pilot | Phiên "chờ xác nhận" được xử lý (chấp nhận/gán lại/đổi/hủy) trước giờ hẹn; thời gian từ "đến bước" đến "đã xác nhận" giảm dần | Thời gian trung bình từ tạo phiên đến xác nhận; số phiên quá hạn xác nhận | 1 tháng sau pilot |
| USC-005 | Không lộ dữ liệu ứng viên ngoài phạm vi | 0 sự cố | 0 sự cố xem phiên/context vượt scope được xác nhận | Số incident truy cập phiên vượt scope (bám M-GR-01) | Liên tục |

## 10. Open Questions

- [x] OQ-1: Pipeline yêu cầu một, ba hay số vòng phỏng vấn cấu hình được?
  — Resolved (đề xuất): v1 lưu số vòng trên từng phiên và cho phép nhiều
  vòng; cấu hình số vòng chuẩn theo vị trí là roadmap mở rộng — chờ Head
  of HR xác nhận (kế thừa brainstorm OQ-1; OQ-RC-01).
- [x] OQ-2: Ứng viên có phải xác nhận tham gia trong hệ thống không? —
  Resolved (đề xuất): v1 chỉ thông báo + nhắc; HR ghi nhận vắng/hoàn
  thành; xác nhận hai chiều là P2 — chờ Product owner xác nhận.
- [x] OQ-3: Các giới hạn Mục 7.2 có là chuẩn v1 không? — Resolved (đề
  xuất): dùng 5 interviewer, 3 observer, 4 giờ/phiên, đổi lịch 3 lần, hạn
  phản hồi 48 giờ, nhắc 24 giờ/1 giờ làm mặc định cấu hình được — chờ
  Product owner xác nhận.
- [x] OQ-4: Trùng lịch interviewer nên chặn hay cảnh báo? — Resolved:
  cảnh báo mềm, HR giữ quyết định (tránh chặn nhầm panel/phiên ngắn).
- [x] OQ-5: Consent ghi âm có đi kèm thư mời không? — Resolved: thư mời
  có thể kèm nội dung xin consent; ghi nhận và thực thi consent thuộc
  `interview-recording` (PRD Mục 7.24).
- [~] OQ-6: Có cho ứng viên tự chọn slot (self-scheduling)? — Out of
  scope v1: cần trang ứng viên có xác thực và quy tắc slot, chưa có trong
  "Phạm vi v1" PRD Mục 7.9.
- [x] OQ-7: HR xem phiên do mình tạo hay toàn bộ trong scope? — Resolved:
  theo data-scope của `org-governance` — kế thừa OQ-RC-02, chờ Admin
  lead/Security xác nhận cấu hình scope.
- [x] OQ-8: Retention cho dữ liệu phiên và thư mời (chứa CV/JD ứng viên)?
  — Resolved (đề xuất): phiên và context giữ theo retention hồ sơ tuyển
  dụng chung; xóa/anonymize cùng application — chờ DPO/legal (PRD OQ-6).
