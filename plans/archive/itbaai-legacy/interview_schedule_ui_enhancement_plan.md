# UI Enhancement Plan — Interview Scheduling Screen

## 1. Mục tiêu

Tài liệu này mô tả kế hoạch nâng cấp UI cho màn hình **Điều phối Phỏng vấn / Schedule Interview** để:
- phù hợp hơn với nghiệp vụ tuyển dụng đã chốt
- hỗ trợ HR điều phối lịch hiệu quả
- hỗ trợ Interviewer nhận task rõ ràng
- hiển thị đủ ngữ cảnh ra quyết định như CV score, test result, JD, trạng thái pipeline
- sẵn sàng mở rộng cho các hành động như reschedule, cancel, no-show, multi-round interview

---

## 2. Bối cảnh nghiệp vụ đã chốt

### 2.1. Role liên quan
- **HR** là owner chính của bước **Schedule Interview**
- **Interviewer** là người được assign để thực hiện phỏng vấn và submit kết quả
- **Admin** có quyền override toàn bộ
- **Recruitment** không phải role chính trong màn hình này

### 2.2. Quy tắc quan trọng
- **1 interview schedule = 1 candidate/application**
- Một candidate/application có thể có **nhiều vòng phỏng vấn**
- Quyết định cuối cùng có thể dựa trên:
  - CV screening result
  - test result
  - interview result
- Test là một bước riêng trong nghiệp vụ, nhưng **test status/result cần được hiển thị trong màn Schedule Interview**
- Interviewer là **internal system role có login**, không dùng external public token link trong MVP

---

## 3. Đánh giá màn hình hiện tại

### 3.1. Điểm mạnh
- Giao diện hiện tại đẹp, hiện đại, rõ trọng tâm
- Có chia layout trái/phải dễ hiểu
- Có sẵn các field nền tảng:
  - chọn interviewer
  - chọn thời gian
  - chọn hình thức/location
  - ghi chú nội bộ
- CTA chính nổi bật

### 3.2. Điểm thiếu nghiệp vụ
Màn hình hiện tại còn thiếu các thành phần quan trọng sau:
- Interview round
- Candidate email / phone
- CV score / AI summary
- Test status / test score / test link status
- Quick access đến CV / JD / test result
- Duration / end time
- Candidate current stage
- Lịch sử phỏng vấn các round trước
- Conflict check UI
- Schedule status
- Save draft / reschedule / cancel / no-show actions
- Warning/validation khi chưa có test bắt buộc

---

## 4. Mục tiêu UI sau nâng cấp

UI sau nâng cấp cần đạt các mục tiêu sau:

### 4.1. Nhanh để vận hành
HR có thể:
- chọn ứng viên
- xem nhanh thông tin quan trọng
- tạo lịch trong ít thao tác
- không phải mở quá nhiều màn khác nhau

### 4.2. Đủ ngữ cảnh để ra quyết định
Trước khi schedule, HR phải thấy được:
- ứng viên là ai
- đang ở stage nào
- CV score bao nhiêu
- test đã làm chưa
- test có đạt hay không
- JD nào đang áp dụng

### 4.3. Dễ mở rộng
Màn hình cần được thiết kế để sau này hỗ trợ:
- multi-round interview
- reschedule
- cancel
- no-show
- calendar integration
- confirmation workflow

---

## 5. Cấu trúc màn hình đề xuất

### 5.1. Layout tổng thể
Giữ cấu trúc **2 cột** như hiện tại, nhưng nâng cấp nội dung bên trong.

#### Cột trái — Candidate Queue
Dùng để:
- tìm kiếm ứng viên
- lọc ứng viên đủ điều kiện schedule
- hiển thị trạng thái nhanh
- chuyển nhanh giữa các candidate

#### Cột phải — Scheduling Workspace
Dùng để:
- xem summary ứng viên
- cấu hình lịch phỏng vấn
- xem context liên quan (CV / test / JD)
- submit / save / cancel

---

## 6. Cột trái — Candidate Queue Enhancement

### 6.1. Header
Hiển thị:
- tiêu đề: **Ứng viên đủ điều kiện phỏng vấn**
- stage filter hiện tại, ví dụ:
  - `Shortlisted`
  - `Ready for Interview`

### 6.2. Search bar
Placeholder nên rõ hơn:
- `Tìm theo tên, email, vị trí, JD...`

### 6.3. Candidate card
Mỗi candidate card nên hiển thị tối thiểu:
- avatar / initials
- full name
- applied position
- email
- CV score
- test status
- current stage
- số vòng phỏng vấn đã có (nếu có)

#### Ví dụ cấu trúc card
- Tên ứng viên
- Vị trí ứng tuyển
- Email
- `CV 78`
- `Test: Completed (82)`
- `Stage: Shortlisted`

### 6.4. Visual states
Candidate card nên có các state:
- default
- selected
- disabled
- warning (thiếu test bắt buộc)
- completed (đã có lịch)

---

## 7. Cột phải — Scheduling Workspace Enhancement

### 7.1. Khối A — Candidate Summary
Đây là khối đầu tiên ngay trên form.

#### Thông tin nên hiển thị
- avatar
- full name
- applied position
- email
- phone
- current application stage
- CV score
- test status
- test score nếu có
- badge xác minh hoặc badge matching status nếu cần

#### Action nhanh nên có
- `View CV`
- `View JD`
- `View Test Result`
- `View Timeline`

---

### 7.2. Khối B — Decision Context Panel
Một panel nhỏ giúp HR có đủ context trước khi schedule.

#### Nội dung đề xuất
- **CV Score**
- **Top strengths**
- **Top weaknesses**
- **Test assignment status**
- **Test result**
- **Previous round result** nếu đã từng phỏng vấn

#### Lợi ích
- không phải mở candidate detail riêng
- giảm sai sót điều phối
- hỗ trợ ra quyết định nhanh

---

### 7.3. Khối C — Interview Setup Form
Đây là phần chính của màn hình.

#### Field bắt buộc
- **Interviewer**
- **Interview Round**
- **Date**
- **Start Time**
- **Duration** hoặc **End Time**
- **Interview Type**
- **Location / Meeting Link**
- **Internal Note**

#### Field khuyến nghị thêm
- Time zone
- Reminder setting
- Candidate confirmation status
- Interviewer confirmation status

---

## 8. Danh sách field chi tiết

### 8.1. Interviewer
#### Loại input
- searchable dropdown

#### Hiển thị item trong dropdown
- avatar
- tên
- email công ty
- phòng ban / chuyên môn
- available / busy status nếu có

#### Validation
- bắt buộc chọn
- interviewer phải là user active

---

### 8.2. Interview Round
#### Option mặc định
- Round 1
- Round 2
- Final
- Custom

#### Mục đích
- hỗ trợ nhiều vòng phỏng vấn
- phân biệt lịch sử interview

---

### 8.3. Date / Time / Duration
#### Đề xuất
Tách thành:
- Interview Date
- Start Time
- Duration

Hệ thống tự tính:
- End Time

#### Lý do
- dễ nhập hơn
- tránh sai logic giờ bắt đầu/kết thúc
- thống nhất với các system lịch

#### Option duration nhanh
- 30 phút
- 45 phút
- 60 phút
- 90 phút

---

### 8.4. Interview Type
#### Option
- Online
- Offline
- Phone Screening

#### Rule hiển thị động
- Nếu **Online**:
  - hiện field `Meeting Link`
- Nếu **Offline**:
  - hiện field `Office / Address / Room`
- Nếu **Phone Screening**:
  - hiện field `Phone instruction / Contact note`

---

### 8.5. Internal Note
#### Nội dung
Dành cho HR truyền ngữ cảnh cho Interviewer, ví dụ:
- trọng tâm cần hỏi
- điểm cần xác minh
- note về CV/test result
- thông tin liên hệ

#### Không nên
- nhét quá nhiều text không liên quan
- dùng như nơi lưu kết quả phỏng vấn

---

### 8.6. Schedule Status
Không chỉ có `Scheduled`, nên hỗ trợ các trạng thái riêng của lịch:

- `Draft`
- `Scheduled`
- `Rescheduled`
- `Cancelled`
- `Completed`
- `No Show`

#### Lưu ý
**Schedule status** phải tách biệt với **application status**.

---

## 9. Phần Test Result cần bổ sung

Do hệ thống cho phép assign test và dùng kết quả test làm dữ liệu hỗ trợ quyết định, màn hình schedule cần có phần hiển thị test.

### 9.1. Dữ liệu cần hiển thị
- Test assigned: Yes / No
- Test name
- Test submission status
- Test score
- Test pass/fail
- Matched by email: Yes / No
- Submitted at

### 9.2. Quy tắc hiển thị
- Nếu job **không yêu cầu test**:
  - hiển thị `Test not required`
- Nếu job **yêu cầu test nhưng chưa có kết quả**:
  - hiển thị warning
- Nếu test result đã có:
  - hiển thị score + trạng thái

### 9.3. Interaction đề xuất
- button `Assign Test`
- button `View Test Result`
- button `Open Candidate Test Link` (nếu business cho phép)

---

## 10. Quick Actions nên có trên màn

### 10.1. Trước khi tạo lịch
- View CV
- View JD
- View Test Result
- Assign Test

### 10.2. Sau khi tạo lịch
- Reschedule
- Cancel Interview
- Mark No Show
- View Interview History
- Open Interview Detail

---

## 11. Hành động chính ở footer màn hình

### 11.1. CTA hiện tại
- `XÁC NHẬN LÊN LỊCH PHỎNG VẤN`

### 11.2. CTA nên bổ sung
- `Lưu nháp`
- `Hủy`
- `Xóa lịch` (chỉ khi phù hợp)
- `Dời lịch` (với lịch đã tạo)

### 11.3. CTA hierarchy đề xuất
- Primary: `Xác nhận lịch`
- Secondary: `Lưu nháp`
- Tertiary: `Hủy`

---

## 12. Validation UI / UX cần có

### 12.1. Validation bắt buộc
- interviewer bắt buộc
- date bắt buộc
- time bắt buộc
- interview type bắt buộc
- location/link bắt buộc theo type

### 12.2. Validation nghiệp vụ
- chỉ candidate ở trạng thái hợp lệ mới được schedule
- interviewer không được trùng lịch
- candidate không được có lịch active trùng giờ cho cùng application
- không tạo lịch ở quá khứ

### 12.3. Validation test
- nếu test là bắt buộc, cần có UI thể hiện rõ:
  - không đủ điều kiện schedule
  - hoặc cho phép HR override kèm lý do

---

## 13. Conflict Check UX

### 13.1. Khi interviewer bị trùng lịch
Hiển thị inline alert:
- `Interviewer đã có lịch từ 10:00–11:00 cùng ngày`

### 13.2. Khi candidate đã có lịch
Hiển thị alert:
- `Ứng viên này đã có lịch phỏng vấn round 1 vào ngày ...`

### 13.3. Action gợi ý
- chọn interviewer khác
- đổi giờ
- mở lịch cũ để xem

---

## 14. Timeline / History nên có

### 14.1. Interview history
Hiển thị lịch sử các vòng:
- round
- interviewer
- time
- result
- schedule status

### 14.2. Activity log
Hiển thị:
- created by
- created at
- updated by
- updated at
- rescheduled by
- cancel reason
- reschedule reason

---

## 15. Trạng thái màn hình cần thiết kế

### 15.1. Empty state
- chưa chọn candidate
- không có candidate đủ điều kiện
- không có interviewer khả dụng

### 15.2. Loading state
- đang load candidate
- đang load interviewer options
- đang validate conflict
- đang submit schedule

### 15.3. Error state
- submit lỗi
- interviewer không hợp lệ
- không tạo được lịch
- không load được test result

### 15.4. Success state
- tạo lịch thành công
- cập nhật stage thành công
- hiển thị next action rõ ràng

---

## 16. Responsive / Mobile considerations

Màn này có nhiều thông tin, nên mobile phải tối ưu lại.

### 16.1. Desktop
Giữ layout 2 cột như hiện tại.

### 16.2. Tablet
- cột trái collapse nhỏ hơn
- candidate list có thể mở dạng drawer

### 16.3. Mobile
Không nên giữ layout 2 cột song song.

#### Đề xuất mobile
- Step 1: chọn candidate
- Step 2: xem summary + context
- Step 3: nhập schedule form
- Step 4: confirm

#### Lưu ý
- nút CTA luôn fixed bottom
- giảm text phụ
- card thông tin chia accordion
- ưu tiên scannable UI

---

## 17. Accessibility / usability

### 17.1. Cần hỗ trợ
- label rõ ràng
- keyboard navigation cho dropdown/date picker
- focus states rõ
- contrast đủ tốt
- icon có tooltip nếu cần

### 17.2. Nên tránh
- placeholder thay cho label thật
- icon-only action không có text
- dùng màu làm tín hiệu duy nhất

---

## 18. Data mapping với backend

Màn hình nên map tối thiểu với các entity sau:

- `job_applications`
- `interview_schedules`
- `interview_results`
- `candidate_cvs`
- `job_requisitions`
- `application_test_assignments`
- `application_test_results`
- `application_stage_histories`

---

## 19. API / action level expectation

UI nên chuẩn bị cho các action:
- fetch shortlist candidates
- fetch candidate summary
- fetch JD summary
- fetch test status/result
- fetch interviewer options
- create interview schedule
- reschedule interview
- cancel interview
- mark no-show
- fetch interview history

---

## 20. Phased implementation plan

### P1 — Must Have
- Candidate summary (email, stage, CV score)
- Interview round
- Date + start time + duration
- Interview type + conditional location field
- Test status + test score
- Quick links: CV / JD / Test Result
- Basic validation
- Schedule status = Scheduled
- Create interview schedule

### P2 — Should Have
- Save Draft
- Reschedule
- Cancel
- Interview history
- Conflict warning
- Previous round summary
- Candidate confirmation / interviewer confirmation states

### P3 — Nice to Have
- Calendar integration
- Auto reminders
- Availability visualization
- Inline timeline
- Interview scorecard template
- Multi-step mobile wizard

---

## 21. Acceptance criteria cho UI nâng cấp

Màn hình được xem là đạt khi:

- HR có thể chọn candidate và xem nhanh đủ ngữ cảnh trước khi schedule
- HR có thể chọn interviewer, round, date/time, type, location, note
- UI hiển thị được test status/result nếu có
- UI chặn hoặc cảnh báo các trường hợp không hợp lệ
- Sau khi submit, candidate chuyển sang `Interview Scheduled`
- Interviewer có thể nhìn thấy task được assign ở khu vực riêng
- Có thể hỗ trợ tối thiểu việc reschedule/cancel trong thiết kế, dù chưa cần fully implement ở MVP

---

## 22. Đề xuất UI text / labels

### Candidate Summary
- Ứng viên
- Vị trí ứng tuyển
- Email
- Số điện thoại
- Trạng thái
- Điểm CV
- Kết quả test

### Form
- Người phỏng vấn
- Vòng phỏng vấn
- Ngày phỏng vấn
- Giờ bắt đầu
- Thời lượng
- Hình thức phỏng vấn
- Link họp
- Địa điểm
- Ghi chú cho người phỏng vấn
- Ghi chú nội bộ

### Actions
- Xác nhận lên lịch phỏng vấn
- Lưu nháp
- Dời lịch
- Hủy lịch
- Xem CV
- Xem JD
- Xem kết quả test
- Gán bài test

---

## 23. Kết luận

Màn hình hiện tại đã có nền tảng giao diện tốt, nhưng để đi vào nghiệp vụ thật thì cần bổ sung:
- ngữ cảnh ứng viên
- ngữ cảnh test
- round/time tốt hơn
- state/action sau khi tạo lịch
- validation và history

Hướng đúng là:
- giữ layout hiện tại
- bổ sung các khối dữ liệu và hành động quan trọng
- không đập lại toàn bộ UI
- ưu tiên các field và interaction giúp HR ra quyết định nhanh, đúng, đủ context

---

## 24. Bản chốt ngắn

- HR là owner của bước Schedule Interview
- 1 interview schedule gắn với 1 candidate/application
- Test result cần hiển thị trong màn scheduling
- Interview round, duration, status, history là các thành phần cần bổ sung
- UI nên hỗ trợ reschedule/cancel/no-show ngay từ thiết kế
