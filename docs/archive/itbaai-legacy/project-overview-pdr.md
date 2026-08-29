# Tổng quan sản phẩm ITBAAI

## Vị trí trong Town Hown

ITBAAI là phân hệ tuyển dụng và đánh giá năng lực của tầm nhìn HRMS Town Hown.
Tầm nhìn bao trùm nằm ở [`../../PRODUCT.md`](../../PRODUCT.md); tài liệu này chỉ
sở hữu mục tiêu, boundary và thuật ngữ của ứng dụng đang có source.

## Vấn đề cần giải quyết

Recruiter và interviewer cần tạo bài đánh giá nhất quán, thu kết quả, hiểu điểm
mạnh/yếu và tiếp tục quy trình tuyển dụng mà không phải ghép nhiều công cụ rời.
Candidate cần một trải nghiệm làm bài rõ ràng, truy cập được bằng link và không
bị lộ dữ liệu nội bộ. Admin cần kiểm soát cấu hình, quyền và chi phí AI.

## Người dùng

| Vai trò | Mục tiêu chính | Boundary |
| --- | --- | --- |
| Candidate | Làm bài, gửi câu trả lời, xem kết quả được phép | Chỉ truy cập assessment qua token/contract public |
| Recruiter/HR | Tạo bài, quản lý ứng viên/pipeline, lịch và kết quả | Dữ liệu theo ownership/scope được cấp |
| Interviewer | Xem phiên được phân công, ghi nhận đánh giá | Không mặc nhiên có quyền quản trị tuyển dụng |
| Admin | Quản lý user, template, settings, version và usage | Hành động nhạy cảm phải có auth/audit phù hợp |

Role name và enforcement thực tế thuộc schema, auth helpers và route boundaries;
không dùng bảng này thay authorization code/RLS.

## Domain sản phẩm

### Assessment lifecycle

- Recruiter tạo/cấu hình bài test và câu hỏi.
- Hệ thống phát hành link/token cho candidate.
- Candidate làm bài và gửi kết quả.
- Objective questions có thể chấm tự động; essay/manual grading giữ review của
  người có trách nhiệm.
- AI tạo insight/follow-up để interviewer tham khảo.

### Recruitment lifecycle

- Application gắn candidate với vị trí tuyển dụng.
- Pipeline transition tuân theo state machine trung tâm.
- CV extraction/scoring hỗ trợ sàng lọc nhưng không thay quyết định của HR.
- Interview schedule/session/recording và kết quả phải truy nguyên về application.
- Override hoặc phục hồi trạng thái quan trọng cần giữ actor/reason khi domain
  contract yêu cầu.

### Talent model

Persons, positions, skills và groups tạo ngữ cảnh cho assessment, yêu cầu năng
lực và phân tích gap. Score là dữ liệu dẫn xuất, không thay thế evidence gốc.

### Question bank và Document AI

Tài liệu được nhập, trích text, phân topic, review rồi dùng để sinh câu hỏi.
Generated content phải giữ source reference và vẫn cần con người kiểm duyệt trước
khi dùng trong assessment quan trọng.

### Communication

Email template/SMTP/log hỗ trợ gửi nội dung theo ngữ cảnh. Delivery status là
thông tin vận hành; nội dung/recipient vẫn chịu policy dữ liệu cá nhân.

## Nguyên tắc AI

- AI là trợ lý, không phải người ra quyết định tuyển dụng/kỷ luật.
- Kết quả phải phân biệt fact, derived score và model suggestion.
- Khi có thể, insight phải chỉ tới evidence nguồn để người dùng kiểm tra.
- Cho phép review/override ở quyết định có tác động đến con người.
- Không gửi dữ liệu vượt nhu cầu tới provider; credential chỉ tồn tại server-side.
- Model output phải được parse/validate trước khi lưu hoặc hiển thị như structured
  data.

## Ràng buộc bảo mật và dữ liệu

- Candidate public token chỉ cấp quyền tối thiểu cần cho bài test.
- Authenticated action phải kiểm tra quyền ở server/data boundary.
- RLS bảo vệ dữ liệu Supabase; service role không được xuất hiện ở client.
- CV, recording, email và hồ sơ đánh giá là dữ liệu nhạy cảm; retention/access
  cần theo chính sách tổ chức trước production rollout.
- Audit record và operational log là hai loại dữ liệu khác nhau.

## Non-goals của tài liệu này

- Không cam kết mọi route/source folder là production-ready.
- Không liệt kê endpoint, table, file hoặc dependency version.
- Không thay roadmap, plan hoặc release evidence.
- Không định nghĩa pháp lý/retention thay cho chính sách được tổ chức phê duyệt.

## Cách xác minh hiện trạng

| Câu hỏi | Bằng chứng |
| --- | --- |
| Feature có UI/API chưa? | `src/app/dashboard`, `src/app/api`, public routes |
| Business rule được enforce ở đâu? | domain helper, route handler, migration/RLS |
| Schema/policy hiện tại? | `supabase/migrations` |
| Provider/config đang dùng? | `package.json`, `src/lib`, environment key usage |
| Có được deploy không? | `.gitlab-ci.yml`, Dockerfile, release history |
| Đã verify tới đâu? | tests/checks thực chạy và plan/report liên quan |

## Acceptance principles

Một capability chỉ nên được mô tả là hoàn tất khi contract có executable owner,
validation phù hợp đã chạy và tài liệu user/setup/security liên quan không còn
mâu thuẫn. Nhãn phase hoặc percentage trong tài liệu lịch sử không đủ làm bằng
chứng hoàn tất.
