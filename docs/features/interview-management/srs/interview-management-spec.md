---
type: srs
feature: interview-management
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/interview-management/brainstorms/session-scheduling-and-interviewer-acceptance.md
  - docs/features/interview-management/interview-management-urd.md
  - docs/_reverse/recruitment-and-interviews/reverse-spec.md
---

# interview-management — Software Requirements Specification

## 1. Scope

SRS này cover việc lập lịch và điều phối phiên phỏng vấn: tạo phiên từ
application đang ở bước phỏng vấn (vòng, thời gian, hình thức, địa
điểm/link), phân công interviewer hợp lệ, thư mời kèm session context,
phản hồi chấp nhận/từ chối/đề xuất đổi lịch, xác nhận và gán lại phiên,
đổi lịch/hủy có lý do kèm thông báo lại đồng bộ, ghi nhận kết quả diễn
ra và audit toàn bộ thay đổi. KHÔNG cover: tối ưu lịch tự động đa múi
giờ (PRD Mục 7.9 "Chưa làm"), đồng bộ calendar ngoài
(`external-integrations`), ứng viên tự chọn slot (P2), ghi đánh giá sau
buổi (`interview-evaluation`), ghi âm (`interview-recording`), và quyết
định chuyển stage của application (`candidate-pipeline` — feature này chỉ
đọc bước và phát sự kiện "phiên được tạo").

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Tạo/đổi/hủy phiên, gán interviewer, ghi nhận kết quả diễn ra | Có |
| Interviewer | người | Nhận thư mời có context, chấp nhận/từ chối/đề xuất đổi lịch, xem phiên của mình | Có |
| Observer | người | Xem context phiên được gán, không bắt buộc phản hồi (P1) | Có |
| Ứng viên | người | Nhận thông báo lịch/nhắc/cập nhật qua kênh liên hệ | Có (chỉ nhận thông báo, không giao diện) |
| Quản lý | người | Xem lịch phiên trong data-scope | Có (read-only) |
| Admin | người | Kiểm tra quyền truy cập và audit | Có |
| `candidate-pipeline` | hệ thống (feature khác) | Cung cấp trạng thái bước cho phép tạo phiên; nhận sự kiện "phiên được tạo" | Không (nguồn và consumer sự kiện) |
| `contextual-notifications` / `operational-email` | hệ thống (feature khác) | Gửi thư mời, thông báo lịch, nhắc, cập nhật đổi/hủy | Không (kênh gửi) |
| `cv-intake` / `document-review` / `recruitment-planning` / `question-bank` | hệ thống (feature khác) | Nguồn context: CV đã xác nhận, JD, câu hỏi đã duyệt | Không (nguồn dữ liệu) |
| `interview-evaluation` | hệ thống (feature khác) | Nhận phiên đã diễn ra để ghi đánh giá | Không (consumer) |
| `interview-recording` | hệ thống (feature khác) | Ghi âm khi có consent | Không (feature Should riêng) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-interview-management-001 | Tạo phiên từ application đến bước | Khi application đang ở bước phỏng vấn của `candidate-pipeline`, hệ thống phải cho HR tạo phiên với vòng (số nguyên ≥1), thời gian bắt đầu/kết thúc, hình thức (trực tuyến/trực tiếp/điện thoại) và địa điểm hoặc link họp tương ứng; application chưa đến bước thì chặn kèm trạng thái hiện tại | P0 | test | PRD Mục 7.9; brainstorm Mục 5.1 (D1); URD UN-001 |
| FR-interview-management-002 | Phân công interviewer hợp lệ | Khi gán participant, hệ thống phải chỉ cho chọn người có vai trò interviewer còn hiệu lực trong tổ chức/phạm vi; ít nhất một interviewer bắt buộc trước khi gửi thư mời | P0 | test | Observed: reverse spec FR-RC-04; brainstorm Mục 7.1; URD UN-007 |
| FR-interview-management-003 | Gửi thư mời kèm context tối thiểu | Khi phiên được tạo, hệ thống phải gửi thư mời cho từng interviewer kèm session context gồm tối thiểu CV đã xác nhận và JD vị trí; câu hỏi gợi ý đã duyệt và kết quả/ghi chú các vòng trước hiển thị khi có | P0 | test | PRD Mục 7.9 (session context); URD UN-002 |
| FR-interview-management-004 | Phản hồi ba lựa chọn | Khi interviewer mở thư mời, hệ thống phải cho chấp nhận, từ chối kèm lý do, hoặc đề xuất đổi lịch kèm khung giờ đề xuất; trang phản hồi luôn hiển thị giờ đang hiệu lực của phiên | P0 | test | Observed: reverse spec FR-RC-05; brainstorm Mục 5.1; URD UN-002 |
| FR-interview-management-005 | Xác nhận và cần gán lại | Khi có ít nhất một interviewer chấp nhận và thời gian còn hiệu lực, hệ thống phải chuyển phiên sang "đã xác nhận"; khi tất cả interviewer từ chối, phiên chuyển "cần gán lại" và nổi trong danh sách việc của HR | P0 | test | brainstorm Mục 5.1 (D4), 6.3; URD UN-003 |
| FR-interview-management-006 | Thông báo lịch cho ứng viên | Khi phiên được tạo/xác nhận/đổi/hủy, hệ thống phải gửi thông báo cho ứng viên qua kênh liên hệ đã đăng ký trong hồ sơ, kèm giờ, hình thức, địa điểm/link và thông tin cần chuẩn bị; thiếu kênh liên hệ hợp lệ thì chặn xác nhận và báo HR | P0 | test | PRD Mục 7.9; brainstorm Mục 7.1; URD UN-004 |
| FR-interview-management-007 | Nhắc lịch trước giờ hẹn | Hệ thống phải nhắc interviewer và ứng viên trước giờ hẹn (24 giờ và 1 giờ — đề xuất, OQ-3) qua `contextual-notifications` | P0 | test | brainstorm Mục 4, 7.2; URD UN-004 |
| FR-interview-management-008 | Đổi lịch có lý do và xác nhận lại | Khi đổi lịch phiên chưa kết thúc, hệ thống phải yêu cầu lý do, cập nhật giờ mới, đưa toàn bộ participant về "chờ phản hồi" cho giờ mới, gửi thông báo đổi cho participant + ứng viên và giữ lịch sử giờ cũ → giờ mới | P0 | test | brainstorm Mục 5.2; URD Journey 2 |
| FR-interview-management-009 | Hủy phiên có lý do | Khi hủy phiên chưa kết thúc, hệ thống phải yêu cầu lý do, chuyển phiên sang "đã hủy", gửi thông báo hủy kèm lý do cho participant + ứng viên và đánh dấu evaluation nháp liên quan (nếu có) là phiên đã hủy | P0 | test | brainstorm Mục 5.4; URD Journey 4 |
| FR-interview-management-010 | Ghi nhận kết quả diễn ra | Khi buổi phỏng vấn kết thúc, hệ thống phải cho HR/interviewer được cấp ghi nhận "hoàn thành", "ứng viên vắng" hoặc "hủy sát giờ"; phiên hoàn thành trở thành đầu vào cho `interview-evaluation` | P0 | test | PRD Mục 7.9 (luồng chính); Observed: reverse spec FR-RC-06; URD UN-006 |
| FR-interview-management-011 | Phát sự kiện phiên cho pipeline | Khi phiên được tạo/xác nhận lần đầu, hệ thống phải phát sự kiện nghiệp vụ để `candidate-pipeline` chuyển application sang `INTERVIEW_SCHEDULED`; lỗi kích transition không được hủy phiên đã tạo | P0 | test | brainstorm Mục 8; PRD Mục 7.8/7.9 |
| FR-interview-management-012 | Audit thay đổi phiên | Hệ thống phải ghi lịch sử mọi thay đổi: tạo, đổi lịch (giờ cũ → mới), gán/gỡ participant, hủy, ghi nhận kết quả — kèm actor, thời điểm và lý do khi bắt buộc | P0 | test | brainstorm Mục 4 (audit); PRD Mục 9 |
| FR-interview-management-013 | Kiểm quyền theo data-scope | Mọi đọc/ghi trên phiên và context phải kiểm organization/role/data-scope; người ngoài phạm vi bị từ chối và sự kiện ghi audit | P0 | test | Observed: reverse spec GAP-RC-05; PRD Mục 9; URD UN-010 |
| FR-interview-management-014 | Kiểm thời gian hợp lệ | Khi lưu/đổi phiên, hệ thống phải từ chối giờ kết thúc không sau giờ bắt đầu và giờ bắt đầu trong quá khứ; thời lượng vượt 4 giờ (đề xuất) bị chặn kèm gợi ý chia phiên | P0 | test | brainstorm Mục 7.1/7.2 |
| FR-interview-management-015 | Trạng thái gửi thông báo | Hệ thống phải hiển thị cho HR trạng thái gửi của thư mời/thông báo (đã gửi, lỗi, đang retry) và báo HR khi hết retry | P0 | demo | brainstorm Mục 6.4, 9 (rủi ro provider) |
| FR-interview-management-016 | Panel và observer | Hệ thống phải cho gán nhiều interviewer (≤5 đề xuất) và observer (≤3 đề xuất) trên một phiên; observer xem context nhưng không bắt buộc phản hồi | P1 | test | brainstorm Mục 4 (P1); URD Mục 3 |
| FR-interview-management-017 | Đề xuất đổi lịch hai chiều | Khi interviewer gửi đề xuất đổi lịch, hệ thống phải đưa đề xuất cho HR xem, cho HR chốt giờ mới (chạy lại FR-interview-management-008) hoặc từ chối đề xuất kèm phản hồi cho người đề xuất | P1 | test | brainstorm Mục 5.2, 4 (P1); URD UN-009 |
| FR-interview-management-018 | Cảnh báo trùng lịch | Khi interviewer được gán đã có phiên "đã xác nhận" trùng khung giờ, hệ thống phải cảnh báo cho HR trước khi lưu nhưng không chặn | P1 | test | brainstorm Mục 4 (P1); OQ-4 đã giải |
| FR-interview-management-019 | Cảnh báo vòng trước chưa đánh giá | Khi tạo phiên vòng {n} trong khi vòng {n-1} của cùng application chưa có kết quả đánh giá, hệ thống phải cảnh báo cho HR nhưng không chặn | P1 | demo | brainstorm Mục 6.5; URD Mục 6 |
| FR-interview-management-020 | Nhắc phiên chờ xác nhận | Khi phiên ở "chờ xác nhận" đến gần giờ hẹn (24 giờ — đề xuất) hoặc quá hạn phản hồi thư mời (48 giờ — đề xuất), hệ thống phải nhắc interviewer và báo HR; phiên quá giờ hẹn chưa xác nhận được đánh dấu "quá hạn xác nhận" | P1 | test | brainstorm Mục 4 (P1), 6.4; URD UN-003 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-interview-management-001 | reliability | Mọi thay đổi phiên sau xác nhận phải có thông báo đến đủ participant + ứng viên; lỗi kênh gửi được retry và hiển thị trạng thái, không rollback phiên | P0 | 100% sự kiện đổi/hủy có delivery record đủ bên trong pilot (bám rủi ro chính PRD Mục 7.9) |
| NFR-interview-management-002 | security | Truy cập phiên/context deny-by-default theo organization/role/data-scope trên mọi surface (màn hình, trang phản hồi, API) | P0 | 0 sự cố xem phiên/context vượt scope được xác nhận (bám M-GR-01, GAP-RC-05) |
| NFR-interview-management-003 | auditability | 100% thay đổi phiên (tạo/đổi/gán/gỡ/hủy/kết quả) có vết actor, thời điểm, trước → sau, lý do khi bắt buộc | P0 | Truy vết được 100% sự kiện trên mẫu phiên kiểm tra |
| NFR-interview-management-004 | usability | Toàn bộ giao diện, thư mời và thông báo tiếng Việt; mọi thời điểm hiển thị theo múi giờ người xem và lưu kèm múi giờ tổ chức | P0 | Kiểm tra mẫu wording brainstorm Mục 7.3; phiên tạo bởi người ở múi giờ khác hiển thị đúng cho cả hai |
| NFR-interview-management-005 | performance | Danh sách phiên/lịch và trang phản hồi thư mời tải nhanh ở quy mô pilot | P1 | 95% lượt mở ≤3 giây ở quy mô ≤500 phiên/tháng/tổ chức (đề xuất — OQ-9) |
| NFR-interview-management-006 | data-retention | Phiên, participant và context giữ theo retention hồ sơ tuyển dụng; thông báo chứa dữ liệu ứng viên tối thiểu cần thiết | P1 | Chính sách xóa/anonymize cùng application; chờ quyết định retention chung (PRD OQ-6) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-interview-management-001 | Chỉ application đang ở bước phỏng vấn của pipeline mới được tạo phiên | Khi HR bấm tạo phiên | FR-interview-management-001 | brainstorm Mục 5.1 (D1); PRD Mục 7.8/7.9 |
| BR-interview-management-002 | Chỉ người có vai trò interviewer còn hiệu lực trong tổ chức/phạm vi được gán vào phiên | Khi chọn/gán participant | FR-interview-management-002 | Observed: reverse spec FR-RC-04; brainstorm Mục 7.1 |
| BR-interview-management-003 | Phiên chỉ "đã xác nhận" khi ≥1 interviewer chấp nhận và giờ còn hiệu lực; tất cả từ chối → "cần gán lại" | Khi participant phản hồi hoặc giờ hết hiệu lực | FR-interview-management-005 | brainstorm Mục 5.1 (D4), 6.3 |
| BR-interview-management-004 | Context tối thiểu (CV đã xác nhận + JD) phải đầy đủ trước khi gửi thư mời | Khi tạo phiên gửi thư mời | FR-interview-management-003 | brainstorm Mục 7.1, 9 (rủi ro thiếu context) |
| BR-interview-management-005 | Đổi lịch/hủy/từ chối thư mời bắt buộc lý do; đổi lịch đưa participant về "chờ phản hồi" cho giờ mới | Khi thực hiện các hành động đó | FR-interview-management-008, FR-interview-management-009, FR-interview-management-004 | brainstorm Mục 5.2/5.4, 7.1 |
| BR-interview-management-006 | Mọi thay đổi phiên sau xác nhận phải thông báo lại đủ participant + ứng viên — không có thay đổi "im lặng" | Khi phiên đổi/hủy sau xác nhận | FR-interview-management-008, FR-interview-management-009 | PRD Mục 7.9 (rủi ro chính) |
| BR-interview-management-007 | Trùng lịch interviewer chỉ cảnh báo, không chặn — HR giữ quyết định | Khi lưu phiên có interviewer trùng giờ | FR-interview-management-018 | brainstorm OQ-4 đã giải |
| BR-interview-management-008 | Thông báo ứng viên chỉ gửi khi hồ sơ có kênh liên hệ hợp lệ; thiếu thì chặn xác nhận và báo HR bổ sung | Khi xác nhận phiên | FR-interview-management-006 | brainstorm Mục 6.5, 7.1 |
| BR-interview-management-009 | Lỗi gửi thông báo không hủy thay đổi phiên đã ghi; retry theo kênh và báo HR khi hết retry | Khi kênh notification lỗi | FR-interview-management-015 | brainstorm Mục 6.4, 9 |
| BR-interview-management-010 | Giới hạn đề xuất v1: ≤5 interviewer + ≤3 observer/phiên, thời lượng ≤4 giờ, đổi lịch ≤3 lần, hạn phản hồi thư mời 48 giờ, nhắc 24 giờ + 1 giờ trước hẹn | Khi vượt ngưỡng tương ứng | FR-interview-management-014, FR-interview-management-016, FR-interview-management-020 | brainstorm Mục 7.2; OQ-3 đã giải (đề xuất) |
| BR-interview-management-011 | Trang phản hồi thư mời luôn phản hồi cho giờ đang hiệu lực — phản hồi trên link cũ không ghi cho giờ đã đổi | Khi interviewer mở thư mời cũ | FR-interview-management-004 | brainstorm Mục 6.4 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-interview-management-001 | Application chưa đến bước phỏng vấn | Tạo phiên trên application ở stage khác | major | FR-interview-management-001 | "Ứng viên chưa đến bước phỏng vấn — không thể tạo phiên" + trạng thái hiện tại | Chờ/chuyển stage trên pipeline |
| E-interview-management-002 | Gán người không hợp lệ | Gán người thiếu vai trò interviewer hoặc đã bị vô hiệu | major | FR-interview-management-002 | "{Người} không có vai trò interviewer hoặc đã bị vô hiệu hóa" | Chọn người khác trong danh sách hợp lệ |
| E-interview-management-003 | Thời gian không hợp lệ | Giờ kết thúc ≤ giờ bắt đầu, giờ trong quá khứ, hoặc vượt 4 giờ | minor | FR-interview-management-014 | "Giờ kết thúc phải sau giờ bắt đầu và không nằm trong quá khứ" | Sửa khung giờ |
| E-interview-management-004 | Thiếu địa điểm/link theo hình thức | Phiên trực tuyến thiếu link hoặc trực tiếp thiếu địa điểm | minor | FR-interview-management-001 | "Phiên {hình thức} cần {địa điểm \| link họp} trước khi gửi thư mời" | Bổ sung trường tương ứng |
| E-interview-management-005 | Thiếu lý do bắt buộc | Hủy/đổi lịch/từ chối thư mời chưa nhập lý do | minor | FR-interview-management-008, FR-interview-management-009 | "Vui lòng nhập lý do để thông báo cho người tham gia" | Nhập lý do rồi xác nhận |
| E-interview-management-006 | Thiếu kênh liên hệ ứng viên | Xác nhận phiên khi hồ sơ không có kênh hợp lệ | major | FR-interview-management-006 | "Chưa có kênh liên hệ của ứng viên — bổ sung trước khi xác nhận phiên" | HR bổ sung liên hệ trong hồ sơ |
| E-interview-management-007 | Thao tác trên phiên đã kết thúc/hủy | Đổi/gán/hủy trên phiên "hoàn thành" hoặc "đã hủy" | minor | FR-interview-management-008, FR-interview-management-009 | "Phiên này đã {hoàn thành \| hủy} — không thể thay đổi" | Tạo phiên mới nếu cần |
| E-interview-management-008 | Không có quyền xem phiên | Người ngoài data-scope truy cập phiên/context | major | FR-interview-management-013 | "Bạn không có quyền xem phiên phỏng vấn này" | Xin cấp quyền; sự kiện ghi audit |
| E-interview-management-009 | Thư mời/thông báo không gửi được | Kênh notification lỗi khi gửi thư mời | major | FR-interview-management-015 | Phiên vẫn "chờ xác nhận"; HR thấy trạng thái gửi lỗi | Retry tự động; hết retry báo HR gửi thủ công |
| E-interview-management-010 | Sửa đồng thời một phiên | Hai HR lưu thay đổi cùng lúc | minor | FR-interview-management-008 | "Phiên vừa được {người} cập nhật — tải lại" | Tải lại, sửa trên bản mới |
| E-interview-management-011 | Vượt giới hạn participant/đổi lịch | Gán >5 interviewer/>3 observer, hoặc đổi lịch lần thứ 4 | minor | FR-interview-management-016, FR-interview-management-014 | "Phiên chỉ cho tối đa {n} {vai trò}" / "Đã đổi lịch {n} lần — hủy và tạo phiên mới" | Giảm participant hoặc hủy + tạo phiên mới |
| E-interview-management-012 | Participant bị vô hiệu giữa chừng | Interviewer bị vô hiệu tài khoản sau khi gán | major | FR-interview-management-002, FR-interview-management-005 | Participant đánh dấu không còn hiệu lực; phiên kiểm lại điều kiện xác nhận | Nếu rơi về "cần gán lại" → HR gán người mới |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-interview-management-01 | Phiên diễn ra đúng lịch | Tỷ lệ phiên "đã xác nhận" hoàn thành đúng giờ hoặc được đổi/hủy có báo trước | ≥90% trong pilot (đề xuất — chờ chốt cùng OQ-2 PRD) |
| SC-interview-management-02 | Không phiên thiếu context | Tỷ lệ phiên "đã xác nhận" có ≥1 interviewer chấp nhận + context tối thiểu (CV + JD) | 100% |
| SC-interview-management-03 | Đổi/hủy luôn đồng bộ mọi bên | Tỷ lệ sự kiện đổi/hủy có delivery record tới đủ participant + ứng viên | 100% |
| SC-interview-management-04 | Không phiên treo chờ phản hồi | Thời gian trung bình từ tạo phiên đến "đã xác nhận"; số phiên "quá hạn xác nhận" | Giảm dần trong pilot; mốc chính thức chờ OQ-2 PRD |
| SC-interview-management-05 | Không lộ dữ liệu ứng viên | Số incident xem phiên/context vượt scope được xác nhận | 0 (bám M-GR-01) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Interview session__ — phiên phỏng vấn của một application: vòng, giờ,
  hình thức, địa điểm/link, trạng thái vòng đời, kết quả diễn ra, context
  tham chiếu (CV/JD) và đếm đổi lịch.
- __Session participant__ — interviewer/observer được gán: vai trò trong
  phiên, trạng thái phản hồi, lý do từ chối, thời điểm phản hồi.
- __Reschedule proposal__ — đề xuất đổi lịch của participant: khung giờ
  đề xuất, ghi chú, trạng thái xử lý của HR.
- __Session event__ — lịch sử thay đổi phiên: loại sự kiện, actor, lý do,
  giá trị trước → sau.
- __Session question__ — câu hỏi gợi ý đã duyệt gắn vào phiên làm
  context.
- __Application / User / Question / CV document__ — tham chiếu từ
  `candidate-pipeline`, `org-governance`, `question-bank` và `cv-intake`.

Chi tiết quan hệ + thuộc tính ở `srs/interview-management-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Tạo phiên → thư mời + context → phản hồi → "đã xác nhận" /
  "cần gán lại" → nhắc → ghi nhận kết quả.
- __Flow 2:__ Đổi lịch: lý do → participant xác nhận lại → thông báo đổi
  đủ bên → "đã xác nhận" giờ mới.
- __Flow 3:__ Từ chối và gán lại: từ chối kèm lý do → kiểm còn chấp nhận
  → "cần gán lại" → gán mới → vòng phản hồi lặp.
- __Flow 4:__ Hủy phiên: lý do → "đã hủy" → thông báo hủy đủ bên → đánh
  dấu evaluation nháp nếu có.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __session-list__ — danh sách/lịch phiên trong scope, lọc theo vị
  trí/interviewer/trạng thái/tuần.
- __session-create__ — form tạo phiên: vòng, giờ, hình thức, địa
  điểm/link, chọn interviewer hợp lệ.
- __session-detail__ — chi tiết phiên: participant + trạng thái phản hồi,
  context, action đổi/hủy/ghi nhận, lịch sử.
- __interview-invite-response__ — trang phản hồi thư mời của interviewer:
  context + chấp nhận/từ chối/đề xuất đổi lịch.
- __session-reassign__ — danh sách phiên "cần gán lại" của HR.
- __reschedule-review__ — màn xem đề xuất đổi lịch và chốt/từ chối.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Truy cập phiên/context theo organization/role/data-scope + audit | PRD Mục 9 — Security owner |
| Context chỉ từ dữ liệu đã xác nhận (CV, JD, câu hỏi đã duyệt) | PRD Mục 7.6/7.5/7.19 — Product owner |
| Không tối ưu lịch tự động đa múi giờ trong v1 | PRD Mục 7.9 "Chưa làm" — Product owner |
| Ứng viên không có giao diện quản lý phiên v1; chỉ thông báo/nhắc | Brainstorm OQ-2/OQ-6 đã giải — chờ Product owner |
| Consent ghi âm và enforcement thuộc `interview-recording` | PRD Mục 7.24 — Product owner |
| Dữ liệu phiên/context theo consent/retention; chỉ synthetic trước privacy gate | PRD Mục 9, OQ-3/OQ-6 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Application ở bước phỏng vấn + nhận sự kiện `INTERVIEW_SCHEDULED` | `candidate-pipeline` | FR-interview-management-001, FR-interview-management-011 |
| Vai trò interviewer + trạng thái active + data-scope | `org-governance` / `account-access` | FR-interview-management-002, FR-interview-management-013 |
| CV đã xác nhận + kênh liên hệ ứng viên | `cv-intake` / `document-review` | FR-interview-management-003, FR-interview-management-006 |
| JD vị trí | `recruitment-planning` | FR-interview-management-003 |
| Câu hỏi gợi ý đã duyệt | `question-bank` | FR-interview-management-003 (phần gợi ý) |
| Kênh gửi thư mời/thông báo/nhắc có delivery log | `contextual-notifications` / `operational-email` | FR-interview-management-006/007/015 |
| Nhận phiên hoàn thành làm đầu vào | `interview-evaluation` | Chuỗi đánh giá sau buổi |
| Đồng bộ calendar ngoài (P2) | `external-integrations` | Không chặn v1 — provider chưa chọn |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Giới hạn BR-interview-management-010 là mặc định cấu hình được | FR-014/016/020 và validation đổi ngưỡng |
| Ứng viên v1 không xác nhận tham gia trong hệ thống | Thêm surface/trạng thái xác nhận hai chiều |
| Số vòng là trường trên phiên, không giới hạn cứng v1 | FR-001 validation đổi |
| Một phiên thuộc đúng một application; application có thể có nhiều phiên | ERD và liên kết evaluation đổi |
| Kênh liên hệ ứng viên lấy từ hồ sơ `cv-intake` đã xác nhận | FR-006 cần nguồn liên hệ khác |
| Notification provider có retry và delivery log | FR-015 tự dựng trạng thái gửi |

## 12. Open Questions

- [x] OQ-1: Số vòng phỏng vấn một/ba/cấu hình được? — Resolved (đề
  xuất): số vòng là trường trên phiên, nhiều vòng cho phép; cấu hình số
  vòng chuẩn theo vị trí là roadmap — chờ Head of HR (brainstorm OQ-1;
  OQ-RC-01).
- [x] OQ-2: Ứng viên xác nhận tham gia trong hệ thống? — Resolved (đề
  xuất): v1 chỉ thông báo + nhắc, HR ghi nhận vắng/hoàn thành — chờ
  Product owner.
- [x] OQ-3: Giới hạn (5 interviewer, 3 observer, 4 giờ, đổi lịch 3 lần,
  phản hồi 48 giờ, nhắc 24/1 giờ)? — Resolved (đề xuất): mặc định cấu
  hình được — chờ Product owner.
- [x] OQ-4: Trùng lịch interviewer chặn hay cảnh báo? — Resolved: cảnh
  báo mềm (brainstorm OQ-4).
- [x] OQ-5: Consent ghi âm trong thư mời? — Resolved: có thể kèm nội
  dung xin consent; enforcement thuộc `interview-recording`.
- [~] OQ-6: Self-scheduling cho ứng viên? — Out of scope v1 (brainstorm
  OQ-6).
- [x] OQ-7: HR xem phiên theo record tự tạo hay data-scope? — Resolved:
  theo data-scope `org-governance` — chờ Admin lead/Security (OQ-RC-02).
- [x] OQ-8: Retention phiên/context? — Resolved (đề xuất): theo retention
  hồ sơ tuyển dụng chung, xóa/anonymize cùng application — chờ DPO/legal
  (PRD OQ-6).
- [x] OQ-9: Quy mô phiên/tháng cho ngưỡng hiệu năng? — Resolved (đề
  xuất): ≤500 phiên/tháng/tổ chức làm giả định quy mô pilot — chờ Product
  owner xác nhận.
