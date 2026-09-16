---
type: srs
feature: candidate-assessment
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/candidate-assessment/brainstorms/server-controlled-assessment-taking.md
  - docs/features/candidate-assessment/candidate-assessment-urd.md
  - docs/_reverse/assessment-and-grading/reverse-spec.md
---

# candidate-assessment — Software Requirements Specification

## 1. Scope

SRS này cover trải nghiệm làm bài đánh giá của ứng viên (qua token/link) và
nhân viên (qua tài khoản): xác minh quyền truy cập phía server, màn hướng dẫn
có xác nhận, timer theo giờ server, autosave có server acknowledgement, khôi
phục attempt sau gián đoạn, submit idempotent kèm biên nhận, snapshot đề bất
biến, theo dõi attempt và các thao tác quản trị (gia hạn/thu hồi/mở lại) có
lý do và audit. Đây là feature `Must` trong lát cắt v1; recovery, expiry và
duplicate-submit là release gate của pilot (PRD R-06). KHÔNG cover: tạo/cấu
hình/phát hành bài (`assessment-authoring`), chấm điểm và phân tích
(`assessment-grading`), gửi thông báo kênh ngoài (`contextual-notifications`),
proctoring/giám sát xâm phạm quyền riêng tư (PRD "Chưa làm").

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Ứng viên | người | Làm và nộp bài qua link token, biết rõ trạng thái lưu/nộp, có biên nhận | Có |
| Nhân viên | người | Làm đánh giá nội bộ qua tài khoản với cùng bảo đảm như ứng viên | Có |
| HR | người | Theo dõi attempt, đối chiếu biên nhận, gia hạn/thu hồi/mở lại trong quyền được công bố | Có |
| Author bài đánh giá | người | Công bố quyền xem kết quả, số attempt, expiry; quy tắc được thực thi đúng | Có (qua cấu hình do `assessment-authoring` phát hành) |
| `assessment-authoring` | hệ thống (feature khác) | Phát hành bài, snapshot đề, token/link và cấu hình | Không (nguồn dữ liệu đầu vào) |
| `account-access` | hệ thống (feature khác) | Xác thực danh tính nhân viên làm bài | Không (dependency) |
| `contextual-notifications` | hệ thống (feature khác) | Kênh thông báo trạng thái nếu được bật | Không (dependency) |
| `assessment-grading` | hệ thống (feature khác) | Nhận submission đã chốt để chấm | Không (consumer đầu ra) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-candidate-assessment-001 | Xác minh quyền truy cập phía server | Khi người dùng mở link/tải bài, hệ thống phải kiểm tra phía server: token tồn tại, chưa thu hồi, còn hạn, còn lượt attempt và bài còn phát hành (với nhân viên: tài khoản hợp lệ và được giao bài); từ chối phải nêu đúng lý do nghiệp vụ và không lộ nội dung bài | P0 | test | PRD Mục 7.22 (access); URD UN-001 |
| FR-candidate-assessment-002 | Màn hướng dẫn có xác nhận | Trước khi mở attempt, hệ thống phải hiển thị thời lượng, số câu, quy định nộp và chính sách xem kết quả do author công bố, và chỉ bắt đầu khi người làm bài xác nhận | P0 | demo | PRD Mục 7.22 (instruction); URD UN-002 |
| FR-candidate-assessment-003 | Mở attempt theo giờ server | Khi người làm bài xác nhận bắt đầu, hệ thống phải tạo attempt ghi mốc bắt đầu và deadline theo giờ server, gắn snapshot đề tại thời điểm mở, và trả về đề không chứa đáp án | P0 | test | PRD Mục 7.22 (server time, snapshot); brainstorm Mục 5.1 |
| FR-candidate-assessment-004 | Timer do server kiểm soát | Hệ thống phải tính thời gian còn lại theo giờ server; client chỉ hiển thị đếm ngược đồng bộ định kỳ và không được tự quyết hết giờ | P0 | test | PRD Mục 7.22 (submission dùng thời gian server); URD UN-003 |
| FR-candidate-assessment-005 | Autosave có server acknowledgement | Khi câu trả lời thay đổi, hệ thống phải gửi theo nhịp autosave và chỉ đánh dấu "đã lưu" khi server xác nhận; nếu thất bại phải hiển thị "chưa lưu được" và tự thử lại khi có kết nối | P0 | test | PRD Mục 7.22 (autosave có server ack); URD UN-004 |
| FR-candidate-assessment-006 | Khôi phục bản đã xác nhận gần nhất | Khi người làm bài mở lại attempt đang mở (đóng tab, mất mạng, đổi thiết bị), hệ thống phải trả về snapshot đề, toàn bộ câu trả lời đã được server xác nhận gần nhất và thời gian còn lại theo giờ server | P0 | test | PRD Mục 7.22 (recovery — release gate); URD UN-005 |
| FR-candidate-assessment-007 | Snapshot đề bất biến | Đề mà attempt nhận phải là snapshot bất biến tại thời điểm mở attempt; thay đổi câu hỏi nguồn sau đó không làm đề đang làm thay đổi | P0 | test | PRD Mục 7.22 (snapshot bất biến); URD Mục 8 |
| FR-candidate-assessment-008 | Submit idempotent + biên nhận | Khi nhận submit hợp lệ lần đầu, hệ thống phải đóng attempt và tạo đúng một submission kèm biên nhận (mã + thời điểm nộp theo giờ server); mọi submit lại sau đó (double-click, retry, thiết bị khác, mở lại link) phải trả về cùng biên nhận, không tạo submission thứ hai | P0 | test | PRD Mục 7.22 (submit idempotent, receipt — release gate); URD UN-006, UN-007 |
| FR-candidate-assessment-009 | Server tự đóng khi hết giờ | Khi giờ server quá deadline của attempt, hệ thống phải tự đóng attempt; toàn bộ câu trả lời đã ack là bài nộp và client nhận trạng thái đã đóng khi kết nối lại | P0 | test | PRD Mục 7.22 (server time, expiry — release gate); brainstorm Mục 5.2 |
| FR-candidate-assessment-010 | Không lộ đáp án/dữ liệu nội bộ | Mọi dữ liệu trả về surface người làm bài (tải đề, autosave, recovery, review, kết quả) phải chỉ chứa nội dung câu hỏi và lựa chọn — tuyệt đối không kèm đáp án đúng, giải thích hay metadata chấm điểm | P0 | test | PRD Mục 7.22; Observed: GAP-AS-06; URD UN-008 |
| FR-candidate-assessment-011 | Giới hạn số attempt | Hệ thống phải chặn mở attempt mới khi đã đạt số attempt tối đa theo cấu hình author công bố (mặc định đề xuất 1 — xem OQ-1); nếu đã từng nộp thì trả về biên nhận thay vì lỗi | P0 | test | PRD Mục 7.22 (attempt do author công bố); Observed: OQ-AS-05 |
| FR-candidate-assessment-012 | Theo dõi attempt phía HR | Hệ thống phải cho HR trong scope xem danh sách attempt theo bài: trạng thái (đang làm/đã nộp/hết giờ/bị thu hồi), mốc bắt đầu/nộp theo giờ server và mã biên nhận | P0 | demo | PRD Mục 7.22; URD UN-010 |
| FR-candidate-assessment-013 | Gia hạn/thu hồi/mở lại có lý do và audit | Khi vai trò được author công bố thực hiện gia hạn token, thu hồi token/attempt hoặc mở lại attempt, hệ thống phải bắt buộc lý do, ghi nhận người thực hiện, thời điểm và giá trị trước/sau; vai trò không được công bố không thấy thao tác | P0 | test | PRD Mục 7.22 (expiry/reopen/override — author công bố + lý do + audit); URD UN-009 |
| FR-candidate-assessment-014 | Hiển thị kết quả theo công bố | Sau khi nộp, hệ thống chỉ được hiển thị phần kết quả author đã công bố cho người làm bài — tối thiểu là trạng thái đã nộp + biên nhận; điểm/nhận xét chỉ khi được phép | P0 | test | PRD Mục 7.22 (quyền xem kết quả do author công bố); URD UN-012 |
| FR-candidate-assessment-015 | Tiến độ và màn review trước nộp | Hệ thống phải hiển thị số câu đã trả lời/tổng số, cho đánh dấu câu xem lại và màn review liệt kê trạng thái từng câu trước khi xác nhận nộp | P1 | demo | brainstorm Mục 4 (P1); URD Journey 1 |
| FR-candidate-assessment-016 | Cảnh báo sắp hết giờ/hết hạn | Hệ thống phải cảnh báo người làm bài tại các mốc sắp hết giờ (đề xuất 10 phút và 1 phút cuối — xem OQ-4) và sắp hết hạn token | P1 | demo | brainstorm Mục 4 (P1) |
| FR-candidate-assessment-017 | Hai thiết bị cùng một attempt | Khi attempt đang mở được truy cập từ thiết bị khác, hệ thống phải thông báo và áp dụng chính sách một phiên giữ bài — đề xuất thiết bị sau tiếp quản và khóa thiết bị trước (xem OQ-2) | P1 | test | brainstorm Mục 6.4; URD Mục 6 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-candidate-assessment-001 | data-integrity | Không mất câu trả lời đã được server xác nhận trong mọi tình huống gián đoạn/hết giờ/recovery | P0 | 0 submission mất answer đã ack — guardrail M-GR-03, kiểm chứng qua recovery test mỗi release (release gate R-06) |
| NFR-candidate-assessment-002 | security | Payload surface người làm bài là whitelist field — không chứa đáp án/giải thích/metadata chấm; deny-by-default với mọi truy cập ngoài token/tài khoản hợp lệ | P0 | 0 incident lộ đáp án được xác nhận (bám M-GR-01); test regression "không có correct_answer" pass |
| NFR-candidate-assessment-003 | reliability | Attempt tồn tại độc lập với phiên client: đóng tab, mất mạng, đổi thiết bị không hủy attempt trước deadline | P0 | Recovery test: mở lại sau gián đoạn khôi phục đúng bản ack gần nhất + giờ còn lại — release gate |
| NFR-candidate-assessment-004 | auditability | Mọi sự kiện mở/nộp attempt, thao tác gia hạn/thu hồi/mở lại và phát biên nhận phải truy vết được (ai, khi nào, lý do) | P0 | 100% submission có receipt hợp lệ; 100% admin action có bản ghi lý do + người thực hiện |
| NFR-candidate-assessment-005 | usability | Toàn bộ surface người làm bài tiếng Việt, viết cho người không chuyên công nghệ; chạy trên trình duyệt phổ biến hiện hành | P0 | Kiểm tra thủ công màn hướng dẫn/làm bài/biên nhận trên 2 trình duyệt phổ biến |
| NFR-candidate-assessment-006 | performance | Xác nhận autosave đủ nhanh để trạng thái "đã lưu" không gây nghi ngờ | P1 | 95% lượt ack trong ≤3 giây ở mạng băng thông thường (giá trị đề xuất — xem OQ-4) |
| NFR-candidate-assessment-007 | data-retention | Attempt, answer, submission và biên nhận được giữ theo retention được duyệt | P1 | Thời hạn theo quyết định retention — chờ OQ-6 PRD; trước đó chỉ dữ liệu synthetic |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-candidate-assessment-001 | Mọi mốc thời gian quyết định (bắt đầu, deadline, hết giờ, hết hạn, thời điểm nộp) tính theo giờ server — giờ client không bao giờ là căn cứ | Khi mở attempt, đồng bộ timer, đóng attempt, nhận submit | FR-candidate-assessment-003, -004, -009 | PRD Mục 7.22 (submission dùng thời gian server) |
| BR-candidate-assessment-002 | Một attempt tạo tối đa một submission; mọi submit lại trả cùng biên nhận — không ngoại lệ | Khi nhận bất kỳ submit nào | FR-candidate-assessment-008 | PRD Mục 7.22 (submit idempotent); R-06 |
| BR-candidate-assessment-003 | Câu trả lời chỉ được coi là đã lưu khi có server acknowledgement; bản khôi phục là bản đã ack gần nhất, phần chưa ack được báo là không khôi phục được | Khi autosave, khi khôi phục attempt | FR-candidate-assessment-005, -006 | PRD Mục 7.22 |
| BR-candidate-assessment-004 | Snapshot đề gắn với attempt là bất biến trong suốt vòng đời attempt | Khi câu hỏi nguồn thay đổi trong lúc attempt mở | FR-candidate-assessment-007 | PRD Mục 7.22 (snapshot bất biến) |
| BR-candidate-assessment-005 | Đáp án đúng, giải thích và metadata chấm không bao giờ xuất hiện trên surface người làm bài — kể cả API, cache, preview, export | Khi render/trả dữ liệu cho người làm bài | FR-candidate-assessment-010 | PRD Mục 7.22, Mục 9; GAP-AS-06 |
| BR-candidate-assessment-006 | Gia hạn, thu hồi, mở lại attempt và mọi thay đổi expiry/attempt chỉ thực hiện được bởi vai trò author đã công bố, bắt buộc lý do và có audit | Khi HR/admin thao tác trên token/attempt | FR-candidate-assessment-013 | PRD Mục 7.22 (expiry/reopen/override) |
| BR-candidate-assessment-007 | Token hết hạn giữa chừng không đá người làm ra: attempt đang mở chạy tới deadline riêng của attempt; chỉ chặn tạo attempt mới | Khi token quá hạn trong lúc attempt mở | FR-candidate-assessment-001, -003 | brainstorm Mục 6.4 |
| BR-candidate-assessment-008 | Vượt số attempt cho phép → không tạo attempt mới; nếu đã từng nộp thì trả lại biên nhận cũ | Khi mở link/bắt đầu sau khi hết lượt | FR-candidate-assessment-011 | PRD Mục 7.22 (rủi ro submit trùng/token chia sẻ) |
| BR-candidate-assessment-009 | Phần kết quả hiển thị sau nộp đúng bằng công bố của author — không hơn, không kém | Khi render màn kết quả sau nộp | FR-candidate-assessment-014 | PRD Mục 7.22 |
| BR-candidate-assessment-010 | Attempt bị thu hồi chặn submit mới; nếu đã từng nộp thì vẫn trả biên nhận cũ | Khi nhận submit trên attempt "bị-thu-hồi" | FR-candidate-assessment-008, -013 | brainstorm Mục 6.1 (D6) |
| BR-candidate-assessment-011 | Bài bị đóng/thu hồi phát hành không hủy attempt đang mở — attempt hoàn tất theo snapshot; chỉ chặn attempt mới | Khi author đóng bài trong lúc có attempt mở | FR-candidate-assessment-003, -007 | brainstorm Mục 6.5 (đề xuất — OQ-3) |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-candidate-assessment-001 | Token không hợp lệ/đã thu hồi | Mở link có token không tồn tại hoặc đã bị thu hồi | major | FR-candidate-assessment-001 | Trang lỗi "Link làm bài không hợp lệ hoặc đã bị thu hồi — liên hệ người phụ trách để được cấp lại" | Ứng viên liên hệ HR cấp lại; không tạo attempt |
| E-candidate-assessment-002 | Token hết hạn | Mở link sau hạn token | major | FR-candidate-assessment-001 | Trang "Link làm bài đã hết hạn vào {DD/MM} — liên hệ người phụ trách để gia hạn" | HR gia hạn có lý do → mở lại được |
| E-candidate-assessment-003 | Hết lượt attempt | Bắt đầu khi đã đạt số attempt tối đa | minor | FR-candidate-assessment-011 | Thông báo "Bạn đã dùng hết số lượt làm bài cho link này"; nếu đã nộp hiện lại biên nhận | Không tạo attempt; HR xem xét mở lại theo quyền |
| E-candidate-assessment-004 | Autosave thất bại liên tục | Mất mạng/lỗi server khi lưu câu trả lời | major | FR-candidate-assessment-005 | Câu hiện "Chưa lưu được câu trả lời — đang thử lại, vui lòng không đóng trang" | Tự retry khi có kết nối; phần chưa ack không khôi phục được nếu attempt đóng |
| E-candidate-assessment-005 | Hết giờ giữa bài | Giờ server quá deadline attempt | major | FR-candidate-assessment-009 | Màn "Đã hết thời gian làm bài — phần trả lời đã lưu được hệ thống ghi nhận" | Attempt đóng theo giờ server; phần đã ack là bài nộp |
| E-candidate-assessment-006 | Submit trùng | Double-click, retry, nộp lại sau khi đã nộp | minor | FR-candidate-assessment-008 | Trả cùng biên nhận "Bài đã được nộp lúc {HH:mm DD/MM} — mã biên nhận {code}" | Không cần — hành vi đúng theo thiết kế idempotent |
| E-candidate-assessment-007 | Nộp khi attempt bị thu hồi | Submit trên attempt HR vừa thu hồi | major | FR-candidate-assessment-013 | Thông báo "Lượt làm bài này đã bị thu hồi — liên hệ người phụ trách" | Liên hệ HR; nếu đã từng nộp vẫn nhận biên nhận cũ |
| E-candidate-assessment-008 | Thiết bị khác đang giữ attempt | Mở link trên thiết bị hai khi attempt đang mở | minor | FR-candidate-assessment-017 | Cảnh báo "Bài đang được làm ở một phiên khác — tiếp tục sẽ chuyển lượt làm về thiết bị này" | Xác nhận tiếp quản → thiết bị cũ khóa; hoặc quay lại |
| E-candidate-assessment-009 | Bài đã đóng phát hành | Mở link khi bài không còn phát hành | major | FR-candidate-assessment-001 | Trang lỗi nêu bài đã đóng + hướng dẫn liên hệ HR | Không tạo attempt; HR xử lý theo quy trình |
| E-candidate-assessment-010 | Rớt mạng đúng lúc submit | Client không nhận được biên nhận dù server đã ghi submission | major | FR-candidate-assessment-008 | Khi kết nối lại, mở link/nộp lại → nhận cùng biên nhận | Idempotent — submission đã ghi, trả biên nhận hiện có |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-candidate-assessment-01 | Người bắt đầu hoàn tất bài hợp lệ có biên nhận | Submission hợp lệ có receipt / attempt đã bắt đầu (M-IN-02) | Target chờ sponsor chốt OQ-1/OQ-2 PRD |
| SC-candidate-assessment-02 | Không mất câu trả lời đã được server xác nhận | Số submission mất answer đã ack qua recovery test + incident log (M-GR-03) | 0 — guardrail bắt buộc mỗi release |
| SC-candidate-assessment-03 | Submit trùng không tạo submission thứ hai | Tỷ lệ nộp lại trả cùng biên nhận trong test duplicate-submit | 100% — release gate |
| SC-candidate-assessment-04 | Không lộ đáp án ra surface người làm bài | Số incident payload chứa đáp án/field nội bộ được xác nhận | 0 — guardrail bám M-GR-01 |
| SC-candidate-assessment-05 | Mọi submission truy vết được | Tỷ lệ submission có biên nhận (mã + giờ server) hợp lệ | 100% |
| SC-candidate-assessment-06 | Thao tác quản trị có kiểm soát | Tỷ lệ gia hạn/thu hồi/mở lại có lý do + người thực hiện + audit | 100% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Bài đánh giá__ — tham chiếu từ `assessment-authoring`: định danh, tổ chức,
  trạng thái phát hành.
- __Snapshot đề__ — bản đề bất biến gắn attempt: cấu hình thời lượng, chính
  sách xem kết quả, số attempt tối đa tại thời điểm phát hành.
- __Câu hỏi snapshot / lựa chọn snapshot__ — nội dung câu và phương án tại
  snapshot; không chứa đáp án đúng trên surface người làm bài.
- __Token truy cập__ — link/token do authoring phát hành: trạng thái, hạn, số
  attempt tối đa, người nhận, lý do thu hồi.
- __Attempt__ — một lượt làm bài: trạng thái, mốc giờ server bắt đầu/deadline/
  nộp, gắn token (ứng viên) hoặc tài khoản (nhân viên).
- __Câu trả lời__ — đáp án đã chọn / nội dung tự luận theo câu, kèm dấu xác
  nhận server gần nhất.
- __Submission + biên nhận__ — một bản ghi duy nhất mỗi attempt: mã biên nhận,
  thời điểm nộp theo giờ server, khóa idempotent.
- __Thao tác quản trị__ — gia hạn/thu hồi/mở lại: ai, khi nào, lý do, giá trị
  trước/sau.

Chi tiết quan hệ + thuộc tính ở `srs/candidate-assessment-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Mở link → xác minh server → hướng dẫn/xác nhận → mở attempt →
  làm bài autosave → review → submit → biên nhận.
- __Flow 2:__ Gián đoạn (đóng tab/mất mạng/đổi thiết bị) → mở lại → khôi phục
  bản ack gần nhất + giờ còn lại → tiếp tục.
- __Flow 3:__ Truy cập không hợp lệ (hết hạn/hết lượt/đã nộp/thu hồi) → trang
  lý do hoặc biên nhận cũ; không attempt mới.
- __Flow 4:__ Hết giờ → server tự đóng attempt → phần đã ack là bài nộp →
  client nhận trạng thái khi online.
- __Flow 5:__ HR theo dõi attempt → gia hạn/thu hồi/mở lại với lý do bắt buộc
  → audit → ứng viên thấy trạng thái mới.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __entry-error__ — trang lỗi link (hết hạn/thu hồi/hết lượt/đã đóng) nêu đúng
  lý do + hướng dẫn liên hệ HR.
- __instruction__ — hướng dẫn bài (thời lượng, số câu, quy định, chính sách
  xem kết quả) + nút "Bắt đầu làm bài".
- __taking__ — màn làm bài: câu hỏi + lựa chọn, timer đếm ngược, trạng thái
  lưu từng câu, progress.
- __review-submit__ — danh sách câu đã/chưa trả lời + đánh dấu xem lại + xác
  nhận nộp.
- __receipt__ — biên nhận nộp: mã + thời điểm giờ hệ thống + phần kết quả
  được công bố (nếu có).
- __hr-attempt-list__ — danh sách attempt của bài với lọc trạng thái, mốc giờ,
  biên nhận.
- __hr-attempt-action__ — thao tác gia hạn/thu hồi/mở lại kèm ô lý do bắt
  buộc.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Submission dùng giờ server; autosave có ack; recovery bản ack gần nhất; snapshot bất biến; submit idempotent; receipt | PRD Mục 7.22 (contract cứng) — Assessment owner |
| Expiry/reopen/override chỉ theo công bố của author + lý do + audit | PRD Mục 7.22 — Assessment owner |
| Recovery, expiry, duplicate-submit là release gate pilot | PRD Mục 7.22 + R-06 — Assessment owner |
| Không giám sát xâm phạm quyền riêng tư (proctoring ngoài scope) | PRD Mục 7.22 "Chưa làm" — Product owner |
| Truy cập nhân viên theo organization/role/data-scope | PRD Mục 9 — Security owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |
| AI không tự quyết định thay con người (invariant) | PRD Mục 12 — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Bài đánh giá đã phát hành + snapshot đề + token/link + cấu hình (thời lượng, attempt limit, expiry, chính sách xem kết quả, vai trò được công bố) | `assessment-authoring` | Toàn bộ luồng mở attempt |
| Câu hỏi nguồn đã review (nguồn của snapshot) | `question-bank` | Chất lượng snapshot |
| Xác thực + org/role/data-scope cho nhân viên và HR | `account-access`, `org-governance` | Đường nhân viên, màn theo dõi HR |
| Kênh thông báo trạng thái (tùy chọn) | `contextual-notifications` | Nhắc hạn/thông báo nộp — không chặn contract lõi |
| Điểm nhận submission để chấm | `assessment-grading` | Consumer đầu ra — không chặn nghiệp vụ làm bài |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Token/link và cấu hình do `assessment-authoring` phát hành; feature này chỉ tiêu thụ và thực thi | FR-candidate-assessment-001/-003 phải tự phát hành bài — scope phình |
| Nhân viên làm bài qua tài khoản với cùng contract timer/autosave/submit như ứng viên | Cần nhánh policy riêng cho attempt nội bộ (OQ-7 brainstorm) |
| Mặc định người làm bài không xem đáp án/giải thích sau nộp, trừ khi author công bố | FR-candidate-assessment-014 cần surface kết quả chi tiết hơn |
| Ngưỡng đề xuất (autosave 20 giây, hạn token 7 ngày, grace 0 giây, cảnh báo 10/1 phút, tự luận 5.000 ký tự, attempt mặc định 1) được owner chấp nhận | Các giá trị Mục FR/NFR đổi theo quyết định (OQ-4, OQ-1) |
| Hai thiết bị cùng attempt: thiết bị sau tiếp quản | FR-candidate-assessment-017 đổi thành chặn thiết bị sau (OQ-2) |
| Một attempt = một phiên giữ bài tại một thời điểm | BR về song song thiết bị phải thiết kế lại |

## 12. Open Questions

- [x] OQ-1: Chính sách token (expiry mặc định, attempt limit, revocation) do
  author từng bài hay policy tổ chức chốt? — Resolved (đề xuất): author công
  bố theo từng bài trong khung policy tổ chức do `platform-configuration`
  quản lý; mặc định đề xuất 1 attempt/token và hạn 7 ngày — chờ Assessment
  owner xác nhận (kế thừa brainstorm OQ-1 / OQ-AS-01, OQ-AS-05).
- [x] OQ-2: Hai thiết bị cùng attempt — chặn thiết bị sau hay cho tiếp quản?
  — Resolved (đề xuất): cho tiếp quản kèm cảnh báo và khóa phiên cũ — chờ
  Assessment owner xác nhận (brainstorm OQ-3).
- [x] OQ-3: Bài bị đóng/thu hồi phát hành giữa chừng — attempt đang mở hoàn
  tất hay đóng theo? — Resolved (đề xuất): attempt đang mở hoàn tất theo
  snapshot, chỉ chặn attempt mới (BR-candidate-assessment-011) — chờ
  Assessment owner xác nhận (brainstorm OQ-5).
- [x] OQ-4: Các ngưỡng đề xuất (autosave 20 giây, hạn token 7 ngày, grace
  submit 0 giây, cảnh báo 10/1 phút, tự luận 5.000 ký tự) có được chấp nhận
  làm chuẩn v1? — Resolved (đề xuất): áp dụng làm giá trị v1 trong spec —
  chờ Assessment owner xác nhận (brainstorm OQ-6).
- [x] OQ-5: Có bắt buộc định danh (email/mã ứng viên) khi bắt đầu bài qua
  token để chống chia sẻ link? — Resolved (đề xuất): không bắt buộc mặc
  định; author được công bố tùy chọn yêu cầu định danh theo từng bài — chờ
  Assessment owner xác nhận (brainstorm OQ-4).
- [x] OQ-6: Attempt của nhân viên nội bộ có cùng expiry/attempt-limit với
  ứng viên? — Resolved (đề xuất): cùng contract; chính sách nội bộ khác (nếu
  có) do Head of HR quyết ở OQ-8 PRD, không làm feature lệch contract
  (brainstorm OQ-7, liên quan OQ-8 PRD).
- [~] OQ-7: Ứng viên có được xem đáp án/giải thích sau khi nộp? — Out of
  scope v1: mặc định không; chỉ hiển thị phần author công bố (điểm/nhận xét
  nếu được phép), không bao giờ lộ đáp án đúng (brainstorm OQ-2 / OQ-AS-03).
