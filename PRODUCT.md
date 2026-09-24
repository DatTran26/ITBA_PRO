# PRODUCT — Hệ thống HRMS tích hợp AI

> **Trạng thái tài liệu:** Hợp đồng sản phẩm mục tiêu của DOWN TOWN. Tài liệu
> này mô tả phạm vi và ràng buộc nghiệp vụ, không khẳng định mọi module đã được
> triển khai. Phân hệ đang có source là ITBAAI; xem
> [`docs/downtown/README.md`](docs/downtown/README.md)
> để đối chiếu hiện trạng kỹ thuật.

## Quan hệ giữa tầm nhìn và ứng dụng hiện có

- DOWN TOWN là HRMS bao trùm tài khoản, nhân sự, tuyển dụng, họp, công việc,
  báo cáo, tích hợp, Document AI, đánh giá năng lực, chấm công sinh trắc học và giám sát thị giác máy tính (Computer Vision).
- `Frontend`, `Backend` và các module Vision AI (`modules/vision-ai/backend`, `modules/face-attendance`) hiện thực phần:
  - Tuyển dụng, kiểm tra/đánh giá, question bank, Document AI, email và quản lý năng lực.
  - Xác thực sinh trắc học khuôn mặt (Face Biometric Authentication / Face ID Sign In - Register - Dev Logout) và quản lý khuôn mặt nhân viên (`/dashboard/faces`, `/dashboard/my-face`).
  - Điểm danh, chấm công bằng nhận diện khuôn mặt (`/dashboard/attendance`), quản lý ca làm việc và tổng hợp công hàng ngày.
  - Giám sát phát hiện hành vi vi phạm tại nơi làm việc (`/dashboard/behavior`), bảng điều khiển đa màn hình (Dual Video Monitors) với live bounding box overlay, nhật ký runtime và quản trị mô hình AI (`/dashboard/model-controller`).
- Tính năng trong tài liệu này là **mục tiêu sản phẩm** cho đến khi có source,
  migration và validation tương ứng trong ứng dụng.
- AI chỉ hỗ trợ đề xuất và phân tích; người có thẩm quyền vẫn chịu trách nhiệm
  với quyết định nhân sự.

## 1. Module tài khoản, tổ chức và phân quyền

- Đăng nhập, đăng xuất và quản lý tài khoản người dùng.
- Quản lý công ty, chi nhánh, phòng ban, chức danh và sơ đồ tổ chức.
- Phân quyền theo vai trò: quản trị viên (admin, super_admin), HR, lãnh đạo, quản lý, nhân viên và ứng viên.
- Giới hạn phạm vi dữ liệu theo phòng ban và cấp quản lý.
- Lưu nhật ký đăng nhập, truy cập và thay đổi dữ liệu (`activity-logs`, `face_audit_logs`).

### Xác thực sinh trắc học khuôn mặt (Face Biometric Authentication)

- **Đăng ký tài khoản (Sign Up) tích hợp Face Enrollment bắt buộc:**
  - Quy trình đăng ký tài khoản người dùng gắn liền với việc thu thập và đăng ký sinh trắc học khuôn mặt.
  - Thu thập đủ **6 góc độ khuôn mặt chuẩn hóa**:
    1. Nhìn thẳng (`Front` — nhìn trực diện vào camera).
    2. Quay trái (`Left` — xoay mặt 15–30 độ sang trái).
    3. Quay phải (`Right` — xoay mặt 15–30 độ sang phải).
    4. Hơi ngước cằm (`Looking up` — nâng cằm nhẹ).
    5. Hơi cúi đầu (`Looking down` — hạ đầu nhẹ).
    6. Biểu cảm tự nhiên / mỉm cười (`Natural / Smile` — mỉm cười hoặc thả lỏng tự nhiên).
  - Hỗ trợ 2 chế độ chụp tiện lợi qua webcam:
    - *Chế độ tự động 1 chạm (1-touch auto capture):* Tự động đếm ngược 3 giây cho mỗi góc mặt, chuyển góc tiếp theo sau khi chụp thành công.
    - *Chế độ chụp thủ công:* Cho phép chụp lại hoặc tải lên tệp ảnh từng góc riêng biệt.
  - Kiểm tra tính hợp lệ của ảnh đầu vào (định dạng JPEG/PNG/WebP, kích thước hợp lệ, đảm bảo phát hiện được khuôn mặt rõ nét).
  - Trích xuất 6 vector đặc trưng 512 chiều chuẩn hóa L2 bằng mô hình ArcFace (InsightFace).
  - **Cơ chế Rollback an toàn:** Nếu bước trích xuất embedding hoặc lưu trữ dữ liệu khuôn mặt gặp sự cố, tài khoản vừa tạo trên Supabase Auth/database sẽ tự động bị xóa bỏ (rollback hoàn toàn), đảm bảo không tồn tại tài khoản chưa hoàn tất đăng ký sinh trắc học.
  - Hỗ trợ lưu trữ kép: Vector đặc trưng được mã hóa lưu trữ trên cơ sở dữ liệu (`user_face_embeddings`) và đồng thời sao lưu trên thư mục lưu trữ cục bộ (`data/vision-ai/faces/{profileName}__{userId}/`).

- **Đăng nhập bằng nhận diện khuôn mặt (Face ID Sign In):**
  - Xác thực nhanh chóng, không chạm qua webcam tại trang đăng nhập (`/login`).
  - Chụp ảnh khuôn mặt trực tiếp, gửi về Python Vision AI để trích xuất vector đặc trưng probe.
  - So khớp Cosine Similarity với 6 vector đặc trưng đã đăng ký của tài khoản:
    - Đạt chuẩn xác thực khi có ít nhất 2 góc mặt vượt qua ngưỡng khớp quy định (`faceMatchThreshold`, mặc định `0.75`).
  - Hỗ trợ tính năng tự động quét lại (Auto-scan retry) tối đa 3 lần nếu lần đầu chưa đạt ngưỡng do góc nghiêng hoặc ánh sáng.
  - **Cơ chế dự phòng (Fallback):** Khi webcam không khả dụng hoặc xác thực khuôn mặt không thành công sau các lần thử, người dùng có thể linh hoạt chuyển sang đăng nhập bằng email & mật khẩu truyền thống kết hợp bảo vệ Turnstile Captcha.

- **Quản lý dữ liệu khuôn mặt nhân viên (`/dashboard/faces` & `/dashboard/my-face`):**
  - *Quản lý tập trung dành cho Admin/HR (`/dashboard/faces`):*
    - Xem danh sách toàn bộ nhân sự, trạng thái đã đăng ký (Enrolled) hoặc chưa đăng ký khuôn mặt.
    - Xem chi tiết số lượng ảnh đã lưu, tình trạng vector embeddings, tổng dung lượng lưu trữ trên hệ thống.
    - Cho phép quản trị viên đăng ký bổ sung, cập nhật hoặc xóa dữ liệu khuôn mặt của nhân viên khi có yêu cầu hợp lệ.
  - *Quản lý khuôn mặt cá nhân (`/dashboard/my-face`):*
    - Nhân viên chủ động theo dõi trạng thái sinh trắc học của tài khoản mình.
    - Cho phép tự cập nhật lại bộ ảnh 6 góc mặt (Self-enrollment) khi có thay đổi ngoại hình hoặc muốn cải thiện độ chính xác nhận diện.

- **Cơ chế Dev Authentication & Quản lý phiên an toàn:**
  - Hỗ trợ đăng nhập tắt an toàn cho môi trường phát triển cục bộ (`/api/dev-login`).
  - Đăng xuất an toàn Dev Logout (`/api/dev-logout`): Xóa sạch cookie phiên `dev_user`, vô hiệu hóa trạng thái đăng nhập, đảm bảo an toàn dữ liệu trên môi trường test.

### Chức năng AI

- Trích xuất vector đặc trưng 512 chiều (512-dim embedding) bằng mạng nơ-ron sâu ArcFace (InsightFace `buffalo_l`).
- Thuật toán so khớp cosine similarity đa vector với ngưỡng động, đảm bảo độ trễ xác thực dưới 500ms.
- Tự động định vị và crop khuôn mặt lớn nhất trong khung hình, loại bỏ nhiễu nền xung quanh.

## 2. Module quản lý nhân sự

- Quản lý hồ sơ nhân viên và thông tin liên hệ.
- Quản lý hợp đồng, chức danh, phòng ban và người quản lý trực tiếp.
- Quản lý trạng thái nhân sự: thử việc, chính thức, tạm nghỉ và nghỉ việc.
- Lưu trữ tài liệu nhân sự theo quyền truy cập.
- Tra cứu danh bạ nhân viên trong doanh nghiệp.

### Quản lý chấm công bằng khuôn mặt (Facial Recognition Attendance)

- **Quy trình Check-in / Check-out tự động qua nhận diện khuôn mặt:**
  - Nhân viên truy cập giao diện chấm công (`/dashboard/attendance`) và kích hoạt webcam hoặc camera giám sát tại nơi làm việc.
  - Hệ thống tự động phát hiện khuôn mặt probe, trích xuất vector đặc trưng và gửi tới backend so khớp với dữ liệu khuôn mặt đã đăng ký (Single Source of Truth từ Face Store / `user_face_embeddings`).
  - So khớp Cosine Similarity thời gian thực với độ tin cậy cao; chỉ chấp nhận điểm danh khi khuôn mặt trùng khớp với tài khoản đăng nhập.
  - **Kiểm soát logic phiên làm việc (Session Integrity):**
    - Ngăn chặn check-in trùng lặp nếu nhân viên đang có phiên hoạt động chưa check-out.
    - Bắt buộc phải có phiên check-in hợp lệ trước khi thực hiện check-out.
- **Quản lý ca làm việc (Attendance Shifts):**
  - Cấu hình các ca làm việc linh hoạt theo nhu cầu doanh nghiệp (`attendance_shifts`):
    - *STANDARD:* Ca hành chính tiêu chuẩn (08:30 – 17:30, thời gian ân hạn 15 phút).
    - *MORNING:* Ca sáng linh hoạt (07:30 – 11:30, thời gian ân hạn 10 phút).
    - *AFTERNOON:* Ca chiều linh hoạt (13:00 – 17:00, thời gian ân hạn 10 phút).
  - Cấu hình thời gian ân hạn (grace period) trước khi hệ thống đánh dấu đi muộn.
- **Ghi nhận lịch sử và bằng chứng điểm danh (`attendance_sessions`):**
  - Ghi nhận chính xác mốc thời gian `check_in_at` và `check_out_at`.
  - Lưu trữ độ tin cậy nhận diện của từng lượt: `check_in_similarity` và `check_out_similarity`.
  - Lưu ảnh chụp bằng chứng (snapshot) tại thời điểm check-in và check-out phục vụ đối soát, kiểm tra khi cần.
  - Tự động tính toán tổng thời gian làm việc thực tế trong phiên (`work_duration_minutes`).
  - Ghi nhận trạng thái phiên (`status`: valid, manual_override, disputed) và vị trí camera/thiết bị (`location`).
- **Tự động tổng hợp dữ liệu công hàng ngày (`attendance_daily_summary`):**
  - Tự động tổng hợp giờ vào đầu tiên (`first_check_in`) và giờ ra cuối cùng (`last_check_out`) trong ngày làm việc.
  - Tính tổng số giờ làm việc thực tế (`total_working_hours`).
  - Tự động đối chiếu với ca làm việc để gắn cờ đi muộn (`is_late`) hoặc về sớm (`is_early_leave`).
  - Ghi nhận trạng thái công trong ngày (`daily_status`: present, late, early_leave, absent, excused).
- **Cơ chế dự phòng lưu trữ cục bộ (Local Fallback Resilience):**
  - Khi hệ thống cơ sở dữ liệu Supabase tạm thời gián đoạn kết nối, hệ thống tự động chuyển sang lưu trữ phiên chấm công vào tệp JSON cục bộ (`data/vision-ai/attendance-sessions.json`), đảm bảo trải nghiệm điểm danh của nhân viên luôn thông suốt 100%.
- **Giao diện Dashboard quản lý chấm công (`/dashboard/attendance`):**
  - Khung quan sát webcam trực tiếp kèm các nút thao tác nhanh: Bật/Tắt camera, Chụp ảnh, Check-in, Check-out.
  - Bảng nhật ký phiên chấm công trực quan: hiển thị họ tên nhân viên, thời gian vào/ra, điểm số tương đồng cosine similarity (%), trạng thái hợp lệ.
  - Phân quyền dữ liệu chặt chẽ: Nhân viên thông thường chỉ xem lịch sử chấm công của bản thân; Quản trị viên và Quản lý HR được xem và xuất báo cáo toàn bộ nhân sự.

### Chức năng AI

- Nhận diện danh tính khuôn mặt thời gian thực qua ArcFace (InsightFace), tốc độ so khớp < 500ms.
- Tự động phát hiện khuôn mặt hợp lệ, cảnh báo khi hình ảnh quá tối, quá mờ hoặc có nhiều người trong khung hình.
- Trích xuất thông tin từ hồ sơ và giấy tờ để đề xuất điền biểu mẫu.
- Phát hiện dữ liệu còn thiếu hoặc có dấu hiệu không nhất quán.
- Hỗ trợ tìm kiếm hồ sơ bằng câu hỏi ngôn ngữ tự nhiên theo quyền của người dùng.

## 3. Module tuyển dụng và onboarding

- Tạo yêu cầu tuyển dụng và chuyển cấp có thẩm quyền phê duyệt.
- Quản lý vị trí tuyển dụng và mô tả công việc.
- Tiếp nhận, lưu trữ và theo dõi trạng thái hồ sơ ứng viên.
- Quản lý lịch phỏng vấn, người phỏng vấn và nhận xét.
- Gửi thông báo kết quả và thư mời nhận việc.
- Chuyển ứng viên trúng tuyển thành nhân viên.
- Tạo checklist onboarding: giấy tờ, thiết bị, tài khoản, đào tạo và người phụ trách.

### Pipeline tuyển dụng

- Quản lý ứng viên theo các trạng thái: `New → Screened → Shortlisted/Rejected → Interview Scheduled → Interviewed → Passed/Failed → Offered → Accepted/Rejected → Onboarded`.
- Chỉ cho phép chuyển trạng thái theo đúng quy trình đã cấu hình.
- Lưu người thực hiện, thời điểm, ghi chú và trạng thái trước/sau của mỗi lần chuyển.
- Cho phép HR khôi phục ứng viên từ Rejected về Shortlisted.
- Cho phép HR ghi đè điểm hoặc đề xuất của AI; bắt buộc lưu lý do điều chỉnh.
- Sắp xếp ứng viên theo điểm phù hợp.
- Lọc ứng viên theo điểm, kỹ năng, kinh nghiệm, domain và trạng thái.
- Hỗ trợ thao tác hàng loạt như chuyển danh sách cần xem xét hoặc loại nhiều hồ sơ sau khi HR xác nhận.

### Matching, filtering và scoring

- Tạo điểm phù hợp tổng thể giữa CV và JD.
- Phân rã điểm theo kỹ năng, kinh nghiệm và lĩnh vực chuyên môn.
- Hiển thị căn cứ dữ liệu cho từng thành phần điểm.
- Cho phép cấu hình ngưỡng sàng lọc theo vị trí tuyển dụng.
- Ứng viên dưới ngưỡng được đưa vào danh sách HR cần xem xét, không tự động nhận quyết định cuối cùng.
- HR có quyền thay đổi kết quả sàng lọc và khôi phục ứng viên.

### Offer management

- Tạo và lưu phiên bản offer cho ứng viên đã đạt.
- Gửi offer và ghi nhận người gửi, thời điểm gửi.
- Theo dõi trạng thái: đã gửi, đã xem, đã chấp nhận hoặc đã từ chối.
- Chuyển ứng viên đã chấp nhận offer sang onboarding.

### Chức năng AI

- Đọc CV và trích xuất kỹ năng, kinh nghiệm, học vấn.
- Đối chiếu CV với yêu cầu tuyển dụng và đề xuất mức độ phù hợp.
- Giải thích điểm phù hợp theo kỹ năng, kinh nghiệm và lĩnh vực chuyên môn.
- Phát hiện hồ sơ thiếu thông tin.
- Hỗ trợ soạn mô tả công việc và câu hỏi phỏng vấn.
- Tóm tắt nhận xét phỏng vấn để HR tham khảo.

## 4. Module quản lý cuộc họp bằng AI

- Tạo cuộc họp và quản lý danh sách người tham gia.
- Ghi âm trực tiếp hoặc tải lên tệp âm thanh, video hay bản chép lời.
- Lưu biên bản, tệp đính kèm và lịch sử chỉnh sửa.
- Cho phép người chủ trì kiểm tra và xác nhận kết quả xử lý.

### Chức năng AI

- Chuyển giọng nói trong cuộc họp thành văn bản.
- Tạo bản tóm tắt nội dung cuộc họp.
- Trích xuất quyết định, vấn đề còn mở, rủi ro và đầu việc.
- Nhận diện tên người, thời hạn và mức ưu tiên được đề cập.
- Đối chiếu tên với danh bạ nhân viên; cảnh báo khi trùng tên hoặc không xác định được người.
- Đề xuất người phụ trách và nội dung nhiệm vụ.

## 5. Module quản lý công việc và Kanban Board

- Tạo workspace theo phòng ban, nhóm hoặc dự án.
- Quản lý Kanban Board và các cột trạng thái công việc.
- Tạo thẻ việc với người giao, người phụ trách, hạn hoàn thành, độ ưu tiên và tệp đính kèm.
- Sau khi chủ trì xác nhận biên bản, tự động tạo thẻ việc từ nội dung cuộc họp.
- Hiển thị thẻ việc trong workspace của người được phân công.
- Cập nhật trạng thái, bình luận, đính kèm kết quả và yêu cầu duyệt.
- Nhắc việc sắp đến hạn và cảnh báo việc quá hạn.
- Lưu lịch sử thay đổi và bàn giao công việc.

### Chức năng AI

- Chuẩn hóa mô tả nhiệm vụ thành nội dung rõ ràng và có kết quả mong đợi.
- Đề xuất hạn hoàn thành và mức ưu tiên dựa trên nội dung cuộc họp.
- Phát hiện đầu việc trùng lặp hoặc chưa có người phụ trách.
- Tóm tắt tiến độ công việc theo ngày hoặc tuần.

## 6. Module dashboard và báo cáo quản trị

- Tổng hợp số lượng công việc theo phòng ban, dự án và trạng thái.
- Theo dõi việc sắp đến hạn, quá hạn và chờ phê duyệt.
- Theo dõi công việc được tạo từ từng cuộc họp.
- Báo cáo tuyển dụng, onboarding và biến động nhân sự.
- Thống kê dữ liệu chấm công, thời lượng làm việc, tỷ lệ đi muộn/về sớm theo phòng ban và nhân sự.
- Thống kê các sự kiện vi phạm nội quy nơi làm việc (hút thuốc, rời vị trí) theo phòng ban, vị trí camera và trạng thái phê duyệt.
- Theo dõi tổng số CV, tỷ lệ vượt qua từng vòng và tỷ lệ tuyển thành công.
- Theo dõi thời gian tuyển dụng trung bình và tỷ lệ chuyển đổi giữa các trạng thái.
- Theo dõi kết quả bài kiểm tra theo vị trí, phòng ban, chủ đề và trình độ.
- Theo dõi xu hướng tiến bộ qua các kỳ đánh giá nội bộ.
- Cho phép lãnh đạo xem dữ liệu theo đúng phạm vi được phân quyền.

### Chức năng AI

- Tạo bản tóm tắt điều hành từ dữ liệu hệ thống.
- Phát hiện xu hướng, điểm bất thường và rủi ro chậm tiến độ.
- Trả lời câu hỏi quản trị bằng ngôn ngữ tự nhiên dựa trên dữ liệu được cấp quyền.
- Đề xuất nội dung cần quản lý kiểm tra; không tự kết luận vi phạm.

## 7. Module giám sát vận hành nhân viên dành cho quản lý

> Đây là feature mở rộng, chưa bắt buộc thuộc phiên bản đầu tiên.

- Theo dõi tiến độ công việc, công việc quá hạn và kết quả bàn giao.
- Theo dõi khối lượng việc đã được phân công theo thời gian.
- Theo dõi việc tham gia và thực hiện các quy trình nghiệp vụ trong hệ thống.
- Ghi nhận các sự kiện vận hành được doanh nghiệp công bố và cho phép thu thập.
- Tạo cảnh báo để quản lý kiểm tra khi có dấu hiệu chậm tiến độ hoặc quy trình bị gián đoạn.
- Cho phép nhân viên xem dữ liệu hoạt động liên quan đến chính mình khi chính sách doanh nghiệp cho phép.

### Chức năng AI

- Phân tích dữ liệu công việc để phát hiện dấu hiệu cần quản lý chú ý.
- Tóm tắt tình trạng vận hành của đội nhóm.
- Giải thích dữ liệu và nguồn dẫn đến từng cảnh báo.
- Không tự động chấm điểm phẩm chất, kết luận sai phạm hoặc ra quyết định kỷ luật.

## 8. Module thông báo và tích hợp

- Gửi thông báo trong hệ thống và qua email.
- Thông báo khi được giao việc, thay đổi hạn, sắp quá hạn hoặc có yêu cầu phê duyệt.
- Kết nối lịch họp và lịch phỏng vấn.
- Gửi link bài kiểm tra, hạn nộp và thông báo kết quả theo chính sách được cấu hình.
- Gửi cho interviewer thông tin ứng viên, CV, JD và thời gian phỏng vấn.
- Tiếp nhận dữ liệu qua biểu mẫu, tệp tin, API hoặc webhook.
- Đồng bộ nhiệm vụ với công cụ làm việc bên ngoài khi được cấu hình.
- Theo dõi trạng thái gửi và lỗi tích hợp.

### Chức năng AI

- Tạo nội dung thông báo ngắn gọn theo ngữ cảnh.
- Phân loại thông báo theo mức độ ưu tiên.

## 9. Module Document AI — xử lý file và OCR tự động

Module này cung cấp năng lực xử lý tài liệu dùng chung cho hồ sơ nhân viên, tuyển dụng, onboarding, cuộc họp và quản lý công việc.

### Tiếp nhận và quản lý file

- Tải lên một file hoặc nhiều file cùng lúc.
- Tiếp nhận PDF, DOCX, XLSX, PPTX, TXT, PNG, JPG, JPEG, TIFF, BMP và WEBP.
- Tiếp nhận file từ giao diện, biểu mẫu, email, API hoặc webhook.
- Lưu file gốc, tên file, loại tài liệu, người tải lên, thời điểm tải và module nguồn.
- Cho phép gắn file với ứng viên, nhân viên, vị trí tuyển dụng, cuộc họp, nhiệm vụ hoặc workspace.
- Quản lý phiên bản khi một tài liệu được tải lên lại hoặc thay thế.
- Tìm kiếm, xem trước, tải xuống và xóa file theo quyền được cấp.

### Nhận diện và phân loại tài liệu

- Tự nhận diện định dạng thực tế của file thay vì chỉ dựa vào phần mở rộng.
- Phân biệt PDF có lớp văn bản, PDF scan và PDF lai.
- Phân loại tài liệu: CV, CCCD, hợp đồng, bằng cấp, chứng chỉ, đơn từ, biểu mẫu, biên bản họp và tài liệu khác.
- Cho phép người dùng sửa lại loại tài liệu khi hệ thống phân loại sai.
- Phát hiện file trùng dựa trên nội dung hoặc mã kiểm tra file.
- Cảnh báo file bị hỏng, đặt mật khẩu, không đọc được hoặc không thuộc định dạng hỗ trợ.

### Bóc tách nội dung file

- Trích xuất trực tiếp văn bản từ PDF có lớp văn bản.
- Bóc tách nội dung từ DOCX, XLSX và PPTX theo cấu trúc tương ứng.
- Giữ thông tin nguồn theo trang, đoạn, sheet, ô hoặc slide khi có thể.
- Tự chuyển sang OCR đối với trang PDF không có đủ nội dung văn bản.
- Xử lý PDF lai theo từng trang: trang có text được trích xuất trực tiếp, trang scan được OCR.
- Chuẩn hóa Unicode, khoảng trắng, xuống dòng và ký tự không hợp lệ sau khi trích xuất.
- Cho phép xuất kết quả thành văn bản, dữ liệu có cấu trúc hoặc DOCX có thể chỉnh sửa.

### OCR tiếng Việt

- OCR chữ in tiếng Việt và tiếng Anh từ ảnh hoặc PDF scan.
- Tiền xử lý ảnh: xoay đúng chiều, cân nghiêng, tăng tương phản, giảm nhiễu và cắt vùng tài liệu.
- Tự chọn luồng OCR theo loại tài liệu và chất lượng hình ảnh.
- Ưu tiên OCR chữ in đối với tài liệu scan rõ.
- Chuyển sang engine phù hợp hơn khi tài liệu là chữ viết tay hoặc bản scan chất lượng thấp.
- Dùng mô hình thị giác đối với CCCD, biểu mẫu hoặc tài liệu có bố cục phức tạp khi cần hiểu vị trí các trường.
- Trả về độ tin cậy cho toàn tài liệu, từng trang và từng trường dữ liệu khi có thể.
- Đánh dấu vùng có độ tin cậy thấp để người dùng kiểm tra.

### Trích xuất dữ liệu có cấu trúc

- Trích xuất trường dữ liệu từ CV: họ tên, email, số điện thoại, kỹ năng, kinh nghiệm, học vấn và chứng chỉ.
- Trích xuất trường dữ liệu từ CCCD: họ tên, số định danh, ngày sinh, giới tính, quê quán, địa chỉ và ngày hết hạn nếu có.
- Trích xuất trường dữ liệu từ hợp đồng: các bên, loại hợp đồng, chức danh, ngày hiệu lực, ngày hết hạn và điều khoản cần lưu ý.
- Trích xuất trường dữ liệu từ bằng cấp/chứng chỉ: tên văn bằng, đơn vị cấp, ngày cấp và thời hạn.
- Trích xuất trường dữ liệu từ biểu mẫu onboarding và đơn từ nội bộ.
- Cho phép cấu hình mẫu trường cần trích xuất theo từng loại tài liệu.
- Trả kết quả dưới dạng dữ liệu có cấu trúc để các module nghiệp vụ tiếp nhận.
- Lưu liên kết từ mỗi trường trích xuất tới trang hoặc vùng tài liệu nguồn.

### Kiểm tra và xác nhận kết quả

- Hiển thị tài liệu gốc và dữ liệu trích xuất cạnh nhau.
- Cho phép người dùng sửa từng trường trước khi lưu vào hồ sơ chính thức.
- Hiển thị trường có độ tin cậy thấp, trường bị thiếu và trường có dữ liệu mâu thuẫn.
- Không tự ghi đè dữ liệu nhân sự đã được xác nhận.
- Lưu người kiểm tra, thời điểm xác nhận, giá trị trước/sau khi sửa và nguồn tài liệu.
- Cho phép từ chối kết quả, yêu cầu OCR lại hoặc chuyển sang xử lý thủ công.

### Phát hiện và bảo vệ thông tin nhạy cảm

- Phát hiện CCCD/CMND, mã số thuế, số tài khoản, số điện thoại, email, tên người và địa chỉ.
- Cho phép che, làm mờ hoặc loại bỏ thông tin nhạy cảm trước khi gửi tới dịch vụ AI bên thứ ba.
- Cảnh báo khi người dùng chuẩn bị chia sẻ hoặc tải xuống tài liệu có dữ liệu nhạy cảm.
- Áp dụng quyền xem và tải xuống riêng theo loại tài liệu.
- Lưu nhật ký truy cập, tải xuống, OCR, trích xuất, chỉnh sửa và chia sẻ tài liệu.

### Hàng đợi xử lý file

- Đưa tác vụ OCR, chuyển định dạng và trích xuất file vào hàng đợi xử lý nền.
- Trả mã tác vụ ngay sau khi tiếp nhận file để giao diện không phải chờ toàn bộ quá trình.
- Hiển thị trạng thái: chờ xử lý, đang xử lý, hoàn tất, thất bại và đã hủy.
- Hiển thị phần trăm tiến độ, bước đang chạy và thời gian xử lý.
- Cho phép hủy tác vụ chưa hoàn thành.
- Cho phép thử lại tác vụ bị lỗi mà không cần tải lại file nếu file gốc còn hiệu lực.
- Thông báo cho người dùng khi tác vụ hoàn tất hoặc thất bại.
- Cho phép xem và tải kết quả sau khi hoàn tất.
- Lưu lỗi kỹ thuật và nguyên nhân nghiệp vụ để hỗ trợ xử lý sự cố.

### Chức năng AI

- Phân loại tài liệu tự động.
- Lựa chọn luồng bóc tách hoặc OCR phù hợp.
- Trích xuất thông tin thành dữ liệu có cấu trúc.
- Tóm tắt nội dung tài liệu dài.
- Phát hiện dữ liệu thiếu, mâu thuẫn hoặc có dấu hiệu bất thường.
- Đối chiếu thông tin giữa CV, CCCD, hợp đồng và hồ sơ nhân viên.
- Đề xuất module hoặc hồ sơ mà tài liệu cần được gắn vào.
- Tạo nội dung tìm kiếm để người dùng hỏi đáp trên kho tài liệu theo quyền truy cập.
- Không tự xác nhận tính pháp lý hoặc tính xác thực của giấy tờ.

### Liên kết với các module khác

- Module quản lý nhân sự nhận dữ liệu đã xác nhận từ CCCD, hợp đồng, bằng cấp và chứng chỉ.
- Module tuyển dụng nhận dữ liệu CV và tạo hồ sơ ứng viên nháp.
- Module onboarding kiểm tra bộ giấy tờ còn thiếu và tạo nhiệm vụ bổ sung trên Kanban.
- Module cuộc họp sử dụng tài liệu đính kèm làm nguồn bổ sung cho biên bản và đầu việc.
- Module Kanban gắn tài liệu nguồn, kết quả xử lý hoặc yêu cầu người phụ trách xác minh.
- Module dashboard thống kê số file đã xử lý, file lỗi, file chờ xác nhận và thời gian xử lý.

## 10. Module kiểm tra và đánh giá năng lực

Module hỗ trợ hai loại bài kiểm tra: đánh giá ứng viên trong tuyển dụng và đánh giá kiến thức nhân viên nội bộ.

### Loại bài kiểm tra

- `Candidate Assessment`: đánh giá ứng viên theo vị trí tuyển dụng, JD, level và kỹ năng yêu cầu.
- `Internal Knowledge Test`: đánh giá nhân viên theo tài liệu, quy trình hoặc chuẩn kiến thức nội bộ.
- Mỗi loại bài có chính sách riêng về người làm, quyền xem kết quả, tạm dừng và cách sử dụng điểm.

### AI sinh câu hỏi

- Sinh câu hỏi theo vị trí tuyển dụng, phòng ban, level, kỹ năng, chủ đề hoặc JD.
- Sinh câu hỏi từ tài liệu được xử lý bởi Document AI.
- Tóm tắt tài liệu thành các chủ đề để leader duyệt trước khi sinh câu hỏi.
- Cho phép chọn một phần chủ đề hoặc phạm vi tài liệu làm nguồn.
- Sinh câu trắc nghiệm, câu mở và câu hỏi tình huống.
- Sinh đáp án đúng, phần giải thích, mức độ và chủ đề tương ứng.
- Liên kết mỗi câu hỏi sinh từ tài liệu với đoạn, trang hoặc vùng nguồn.
- Cho phép sửa nội dung, đáp án, mức độ, chủ đề và nguồn tham khảo trước khi sử dụng.
- Cho phép sinh lại toàn bộ bài hoặc riêng một câu hỏi.
- Khi sinh lại, người dùng có thể nhập prompt mới hoặc dùng lại ngữ cảnh cũ.
- Sinh lại một câu không được tự động thay đổi các câu còn lại.

### Ngân hàng câu hỏi

- Lưu câu hỏi và bộ câu hỏi đã được duyệt vào ngân hàng.
- Lưu bộ câu hỏi vào Favourite để tái sử dụng.
- Phân loại theo vị trí, phòng ban, level, kỹ năng, chủ đề và nguồn tài liệu.
- Tìm kiếm, lọc, sửa, xóa, khôi phục và nhân bản câu hỏi.
- Lưu lịch sử ai tạo, ai sửa, nội dung thay đổi và thời điểm thay đổi.
- Nhập từng câu hỏi bằng biểu mẫu.
- Nhập hàng loạt từ file mẫu có hướng dẫn.
- Kiểm tra dữ liệu bắt buộc và cảnh báo câu hỏi trùng khi import.
- Cho phép người dùng bỏ qua, ghi đè hoặc vẫn lưu mới sau khi xem cảnh báo trùng.
- Câu hỏi thuộc bài test đã phát hành phải giữ nguyên snapshot, không thay đổi theo bản trong ngân hàng.

### Cấu hình bài kiểm tra

- Đặt tên, mô tả, đối tượng làm bài và hạn nộp.
- Cấu hình số lượng câu hỏi và thời gian làm bài theo từng bài test.
- Chọn một level hoặc trộn Junior, Middle và Senior theo tỷ lệ.
- Chọn chủ đề, kỹ năng và phạm vi kiến thức cần đánh giá.
- Cấu hình trọng số điểm theo độ khó khi cần.
- Tự lấy câu hỏi từ ngân hàng theo cấu hình.
- Cho phép leader xem, đổi câu và xác nhận trước khi phát hành.
- Cảnh báo khi ngân hàng không đủ câu; đề xuất giảm số câu, đổi chủ đề hoặc thay đổi tỷ lệ level.
- Giao bài cho một ứng viên, một nhân viên hoặc một nhóm nhân viên.
- Tạo link và quyền truy cập riêng cho từng đối tượng làm bài.

### Trải nghiệm làm bài

- Hiển thị hướng dẫn, thời hạn và thời gian còn lại.
- Hỗ trợ câu trắc nghiệm, câu mở và câu hỏi tình huống.
- Lưu câu trả lời tạm thời để không mất dữ liệu khi refresh hoặc gián đoạn kết nối ngắn.
- Cho phép tạm dừng và tiếp tục nếu bài test còn thời gian và chính sách của loại bài cho phép.
- Tự động nộp khi hết thời gian.
- Cho phép người dùng chủ động nộp trước hạn.
- Xáo trộn thứ tự câu hỏi và đáp án theo cấu hình.
- Hiển thị tiến độ số câu đã trả lời và chưa trả lời.

### Chấm điểm và kết quả

- Chấm tự động câu trắc nghiệm.
- Cho phép leader/interviewer chấm thủ công câu mở.
- Tính tổng điểm và điểm theo trọng số.
- Phân tích kết quả theo level, chủ đề và kỹ năng.
- Hiển thị số câu đúng/sai và đáp án người làm đã chọn theo quyền được cấu hình.
- Với nhân viên nội bộ, hiển thị chủ đề mạnh/yếu và nội dung cần ôn lại.
- Lưu lịch sử bài test, lần làm, người chấm và kết quả.
- Cho phép recruiter/interviewer ghi chú và chỉnh sửa ghi chú ứng viên.
- Cho phép interviewer đánh dấu Pass hoặc Fail sau khi xem đầy đủ kết quả.

### AI phân tích và follow-up

- Phân tích điểm mạnh, điểm yếu và khoảng trống kiến thức.
- Đối chiếu kết quả Candidate Assessment với CV và JD.
- Sinh câu hỏi phỏng vấn follow-up theo kết quả cụ thể của từng ứng viên.
- Cho phép chỉnh sửa hoặc sinh lại các câu hỏi follow-up.
- Gợi ý nội dung nhân viên cần đọc lại sau bài đánh giá nội bộ.
- Chỉ đưa ra nhận định tham khảo; không tự quyết định Pass/Fail, tuyển dụng, KPI, lương hoặc thăng chức.

### Ghi âm và đánh giá phỏng vấn

- Ghi âm buổi phỏng vấn và gắn đúng với ứng viên, vị trí tuyển dụng và interviewer.
- Chuyển audio thành transcript và tóm tắt nội dung.
- Cho phép interviewer chỉnh sửa summary trước khi xác nhận.
- Đối chiếu nội dung phỏng vấn, CV, JD và kết quả bài test để đề xuất mức độ phù hợp.
- Lưu riêng bản AI tạo và bản đã được interviewer xác nhận.
- Xuất báo cáo PDF gồm thông tin ứng viên, kết quả bài test, AI analysis, interview summary, ghi chú và trạng thái Pass/Fail.

### Hồ sơ đánh giá nhân viên

- Lưu lịch sử đánh giá kiến thức theo thời gian.
- Theo dõi xu hướng tiến bộ và chủ đề mạnh/yếu.
- Cho phép leader lưu ghi chú đánh giá nội bộ.
- Hiển thị nội dung cần ôn tập và liên kết về tài liệu nguồn.
- Cung cấp dữ liệu tham khảo cho review thử việc, KPI, lương hoặc thăng chức.
- Xuất báo cáo PDF hoặc Excel theo quyền được cấp.

### Chức năng chống gian lận

- Giới hạn số lượt làm và thời hạn sử dụng link.
- Xáo trộn câu hỏi và đáp án.
- Cảnh báo khi người làm rời tab nếu chính sách bài test bật tính năng này.
- Phát hiện thao tác dán nội dung đối với trường câu trả lời được cấu hình.
- Cho phép giới hạn thời gian từng câu khi cần.
- Không quay video, chụp màn hình hoặc theo dõi bí mật người làm bài.

## 11. Module Computer Vision — giám sát sự kiện vi phạm trong môi trường làm việc

> Đây là feature mở rộng, chưa bắt buộc thuộc phiên bản đầu tiên.
> Module này chạy bằng một **Python Computer Vision Backend riêng**, tối ưu cho
> xử lý realtime từ camera, sau đó chỉ gửi **sự kiện vi phạm đã được phát hiện**
> về hệ thống HRMS/Web chính. Đây là một hệ thống ngoài, tích hợp để đưa dữ liệu
> vào dashboard của hệ thống chính — logic xử lý video nằm hoàn toàn bên service riêng.

Module hỗ trợ quản lý giám sát một số khu vực làm việc đã được doanh nghiệp công
bố và cho phép quan sát. Hệ thống nhận luồng camera theo phòng/khu vực, xử lý
bằng mô hình Computer Vision để phát hiện các hành vi như **hút thuốc** và
**rời vị trí quá lâu**, sau đó tạo sự kiện cảnh báo để quản lý kiểm tra. Hệ
thống không dùng để theo dõi bí mật hoặc tự động kỷ luật nhân viên.

### Kiến trúc tổng quát

- Hệ thống Computer Vision chạy tách biệt với website chính.
- Website HRMS không xử lý trực tiếp video realtime để tránh độ trễ.
- Python CV Backend nhận luồng camera RTSP/IP Camera/Webcam.
- Backend xử lý nén frame, lấy mẫu frame, chạy model phát hiện hành vi.
- Khi có sự kiện nghi vấn, backend gửi dữ liệu sự kiện về website HRMS qua API, webhook hoặc message queue.
- Website HRMS chỉ hiển thị sự kiện, dashboard, bằng chứng và trạng thái xử lý.
- Manager quan sát realtime qua UI riêng của CV service hoặc luồng stream đã tối ưu.
- Admin cấu hình camera, phòng, model, ngưỡng phát hiện và chính sách cảnh báo.

```text
Camera trong phòng → Python CV Backend riêng → frame sampling/compression
→ model hút thuốc + model rời vị trí → event detection → evidence snapshot/clip
→ API / Webhook / Queue → HRMS Website → Manager review / Dashboard / Report
```

### Quản lý camera, phòng và khu vực quan sát

- Quản lý danh sách camera theo công ty, chi nhánh, tầng, phòng và khu vực.
- Cho phép admin thêm, sửa, xóa và kiểm tra trạng thái camera.
- Hỗ trợ camera IP, RTSP stream hoặc webcam nội bộ.
- Gắn mỗi camera với một `Room`, `Workspace` hoặc khu vực làm việc cụ thể.
- Hiển thị trạng thái camera: đang hoạt động, mất kết nối, lỗi xác thực hoặc tạm dừng.
- Cho phép bật/tắt giám sát và cấu hình khung giờ hoạt động theo từng camera.
- Lưu lịch sử thay đổi cấu hình camera.

#### Chức năng AI/Computer Vision

- Kiểm tra camera có trả frame hợp lệ hay không.
- Phát hiện chất lượng hình ảnh quá thấp, quá tối, quá mờ hoặc mất khung hình.
- Tự cảnh báo khi camera bị lệch góc, mất tín hiệu hoặc không đủ chất lượng để phát hiện.
- Không tự động kích hoạt giám sát camera nếu chưa được admin cấu hình và xác nhận.

### Backend Computer Vision realtime

- Backend xử lý video realtime được xây dựng riêng bằng Python.
- Hỗ trợ xử lý nhiều camera đồng thời theo cấu hình tài nguyên.
- Tối ưu luồng xử lý bằng frame sampling, resize, batch inference hoặc GPU nếu có.
- Cho phép cấu hình FPS xử lý, nén frame hoặc stream cho từng camera.
- Lưu trạng thái xử lý của từng camera: đang chạy, đang dừng, lỗi model, lỗi stream hoặc quá tải.
- Cho phép khởi động lại worker xử lý camera mà không ảnh hưởng toàn bộ hệ thống.
- Có cơ chế hàng đợi nội bộ để xử lý sự kiện và gửi lên HRMS.

#### Chức năng AI/Computer Vision

- Nhận frame từ camera và tiền xử lý ảnh trước khi đưa vào model.
- Chạy model phát hiện hút thuốc và model phát hiện người rời vị trí quá lâu.
- Theo dõi đối tượng theo thời gian để tránh cảnh báo sai do một frame đơn lẻ.
- Tạo sự kiện khi hành vi vượt ngưỡng thời gian hoặc confidence đã cấu hình.
- Trả về bounding box, loại hành vi, confidence, camera, thời điểm và bằng chứng liên quan.

### Phát hiện hút thuốc trong khu vực làm việc (Smoking Detection)

- Nhận diện hành vi hút thuốc theo thời gian thực tại nơi làm việc bằng mô hình thị giác máy tính YOLOv8 (`rc_v1_yolov8` hoặc `models/vision-ai/smoking.pt`).
- Đối tượng phát hiện bao gồm khói (`smoke`), điếu thuốc (`cigarette`) và hành vi đưa tay hút thuốc tại bàn làm việc hoặc khu vực cấm.
- Thiết lập ngưỡng tin cậy phát hiện mặc định (`confidence: 0.50`, `iouThreshold: 0.45`), có thể tinh chỉnh linh hoạt theo từng camera hoặc phòng.
- Kết hợp theo dõi liên tục qua nhiều khung hình (frame tracking) để loại bỏ hiện tượng cảnh báo giả (false positive) do đồ vật có hình dáng tương tự (bút, ống hút).
- Khi phát hiện vi phạm, hệ thống tự động lưu frame ảnh bằng chứng độ phân giải cao và trích xuất thông tin bounding box.
- Cho phép người quản lý kiểm tra, xác nhận vi phạm (`approved`) hoặc bác bỏ cảnh báo sai (`rejected`) trực tiếp trên dashboard kèm ghi chú xử lý.

#### Chức năng AI/Computer Vision

- Nhận diện và phân loại nhãn `smoke`, `cigarette` với độ chính xác cao dựa trên kiến trúc YOLOv8.
- Trả về tọa độ bounding box chính xác `[x1, y1, x2, y2]`, nhãn vi phạm, điểm số tin cậy (confidence score) và thời gian suy luận (processing latency tính bằng mili-giây).
- Không tự động kết luận vi phạm chính thức nếu chưa có sự phê duyệt của người quản lý có thẩm quyền.

### Phát hiện rời vị trí quá lâu (Prolonged Absence / Away-from-Desk / Seat Occupancy)

- Theo dõi trạng thái hiện diện của nhân viên tại bàn làm việc hoặc khu vực được chỉ định bằng mô hình YOLO (`models/vision-ai/leaving.pt` hoặc `behavior.pt`).
- Phát hiện các trạng thái vi phạm: ghế trống (`empty_seat`), bàn làm việc không người (`un-occupied_desk`) với ngưỡng tin cậy mặc định (`confidence: 0.25`, `iouThreshold: 0.45`).
- Cho phép quản trị viên cấu hình vị trí bàn làm việc, vùng quan sát (ROI) và gán hồ sơ nhân viên được theo dõi (`monitored profile`).
- Thiết lập ngưỡng thời gian vắng mặt tối đa cho phép trước khi kích hoạt cảnh báo (ví dụ: quá 15 phút ngoài khung giờ giải lao/nghỉ trưa).
- Tự động bỏ qua giám sát ngoài giờ làm việc, ngày nghỉ hoặc trong các khung giờ nghỉ đã được cấu hình trước.
- Manager dễ dàng tra cứu lịch sử rời vị trí, tổng thời gian vắng mặt trong ca và xem xét các trường hợp có lý do chính đáng (họp nội bộ, công tác, việc khẩn cấp).

#### Chức năng AI/Computer Vision

- Phát hiện người, ghế ngồi và bàn làm việc trong vùng quan sát; theo dõi sự hiện diện liên tục theo chuỗi thời gian.
- Phân biệt giữa việc rời bàn ngắn hạn (vài phút) và rời vị trí kéo dài vượt ngưỡng cho phép.
- Ghi nhận chính xác mốc thời gian bắt đầu vắng mặt, thời điểm quay trở lại và tổng thời lượng rời vị trí.
- Tuyệt đối không tự động đánh giá thái độ, năng suất hay phẩm chất cá nhân của nhân sự.

### Giao diện giám sát đa màn hình thời gian thực (Dual Video Monitors Dashboard — `/dashboard/behavior`)

- Hỗ trợ bảng điều khiển giám sát đa màn hình đồng thời, hiển thị song song 2 monitor trực quan:
  - **Smoking Monitor:** Giám sát chuyên dụng phát hiện hành vi hút thuốc.
  - **Away-from-Desk Monitor:** Giám sát chuyên dụng phát hiện vắng mặt / rời bàn làm việc.
- Hỗ trợ nguồn phát linh hoạt cho từng monitor:
  - *Camera trực tiếp:* Kết nối trực tiếp webcam/camera giám sát qua WebRTC/getUserMedia, cho phép chọn camera cụ thể theo danh sách thiết bị (`deviceId`).
  - *Tệp video mẫu:* Hỗ trợ tải lên video thử nghiệm (`MP4`, `WebM`, `QuickTime`) phục vụ kiểm thử và mô phỏng trước khi triển khai thực tế.
- Gắn hồ sơ nhân viên được theo dõi (`monitored profile`): liên kết camera/màn hình với một nhân sự cụ thể trong hệ thống để tự động định danh đối tượng khi có vi phạm.
- **Lớp phủ nhận diện trực tiếp (Realtime Live Bounding Box Overlay):**
  - Hiển thị bounding box vẽ trực tiếp bằng SVG đè lên khung hình video stream đang phát.
  - Phân loại màu sắc nhận diện trực quan:
    - *Màu đỏ (`#F87171`):* Phát hiện vi phạm nghiêm trọng (Hút thuốc, điếu thuốc).
    - *Màu vàng (`#FBBF24`):* Cảnh báo vi phạm rời bàn làm việc / ghế trống.
    - *Màu xanh ngọc (`#36DDAB`):* Trạng thái an toàn, không có vi phạm.
  - Hiển thị nhãn phát hiện kèm phần trăm tin cậy sắc nét ngay trên đỉnh bounding box.
- **Nhật ký runtime tốc độ cao theo từng monitor (Fast Per-Monitor Runtime Logs):**
  - Bảng log cuộn thời gian thực độc lập cho từng monitor, ghi nhận chi tiết: mốc thời gian (hh:mm:ss), số lượng bounding box phát hiện, độ trễ mạng API (ms), thời gian suy luận AI (`processingMs`), danh sách nhãn phát hiện.
- **Cơ chế quét linh hoạt (Scan Control):**
  - Điều khiển Start / Pause / Resume / Stop cho từng monitor riêng biệt.
  - Chu kỳ quét tự động mỗi 1 giây (`1000ms`) khi đang phát trực tiếp.
  - Hỗ trợ nút quét thủ công tức thì (`Scan Now`) để lấy kết quả ngay tại thời điểm quan sát.

### Cơ chế lưu trữ bằng chứng & Cooldown chống quá tải (Evidence Storage & Anti-Spam Cooldown)

- Khi phát hiện vi phạm (`isViolation = true`), Python backend tự động lưu frame ảnh bằng chứng vào thư mục phân cấp theo tên hồ sơ và ngày tháng: `data/vision-ai/violations/{profileName}__{userId}/{YYYY-MM-DD}/{HHMMSS_ffffff}.jpg`.
- Lưu kèm file metadata JSON mô tả chi tiết danh sách đối tượng vi phạm, nhãn, tọa độ bounding box và độ tin cậy.
- **Cơ chế khóa Cooldown 10 giây (`EVIDENCE_COOLDOWN_SECONDS = 10`):** Giới hạn tối thiểu 10 giây giữa 2 lần lưu ảnh bằng chứng liên tiếp cho cùng một nhân viên và mô hình, ngăn chặn việc ghi đĩa ồ ạt và tránh tạo hàng loạt bản ghi trùng lặp cho cùng một hành vi liên tục.

### Quản lý và kiểm duyệt sự kiện vi phạm (Violation Lifecycle Management)

- Mỗi sự kiện vi phạm được ghi nhận thành một bản ghi trong bảng `violation_alerts`:
  - `track_id`: Mã định danh duy nhất của sự kiện vi phạm.
  - `rule_id`: Khóa ngoại liên kết tới danh mục quy tắc nội quy (`violation_rules`).
  - `user_id`: Khóa ngoại liên kết tới nhân sự bị phát hiện vi phạm.
  - `violation_type`: Loại vi phạm (`smoking`, `empty_desk`, `phone_usage`, `unauthorized_access`).
  - `severity`: Mức độ nghiêm trọng (`Critical`, `High`, `Medium`, `Low`).
  - `camera_location`: Tên camera và vị trí quan sát (ví dụ: `Smoking Monitor / Camera 0`).
  - `evidence_url`: Đường dẫn tệp ảnh bằng chứng trên hệ thống lưu trữ.
  - `detections_json`: Chi tiết bounding box, nhãn, điểm số tin cậy, tên hồ sơ được theo dõi.
  - `status`: Trạng thái kiểm duyệt (`pending_review`, `approved`, `rejected`).
- **Quy trình kiểm duyệt trực tiếp trên giao diện Dashboard:**
  - Danh sách vi phạm chờ duyệt hiển thị ngay dưới các màn hình giám sát tại `/dashboard/behavior`.
  - Quản lý xem xét hình ảnh, thông tin phát hiện và đưa ra quyết định bằng 1 cú nhấp chuột:
    - Nhấn **Approve** để phê duyệt vi phạm chính thức (chuyển trạng thái sang `approved`).
    - Nhấn **Reject** để bác bỏ cảnh báo sai (chuyển trạng thái sang `rejected`).
  - Ghi nhận nhật ký phê duyệt vào bảng `violation_action_logs` (`action_by`, `action_type`, `comment`, `created_at`).

### Module Quản trị Model Controller (`/dashboard/model-controller`)

- Giao diện quản trị cao cấp dành riêng cho Super Admin, cho phép cấu hình và điều khiển toàn bộ tham số AI thời gian thực mà không cần khởi động lại dịch vụ backend:
- **Cấu hình mô hình khuôn mặt ArcFace (InsightFace):**
  - Lựa chọn phiên bản mô hình trích xuất đặc trưng:
    - `buffalo_l`: Mô hình khuyến nghị, độ chính xác nhận diện 512 chiều cao nhất.
    - `buffalo_m`: Cân bằng tối ưu giữa tốc độ CPU và độ chính xác.
    - `buffalo_s`: Phiên bản gọn nhẹ, tốc độ xử lý nhanh.
    - `buffalo_sc`: Biến thể siêu nhỏ gọn cho thiết bị phần cứng hạn chế.
  - Cấu hình ngưỡng so khớp khuôn mặt `faceMatchThreshold` (mặc định `0.75`, dải tùy chỉnh 0.10 – 1.00).
- **Quản trị Multi-Model YOLO phát hiện hành vi:**
  - Quản lý danh sách mô hình hành vi hoạt động đồng thời trong hệ thống.
  - Cấu hình đường dẫn tệp trọng số mô hình (`modelPath`), hỗ trợ cơ chế chuẩn hóa đường dẫn thông minh (tự động loại bỏ dấu ngoặc kép thừa, chuyển đổi dấu gạch chéo Windows/Linux).
  - Tự động kiểm tra tính hợp lệ và trạng thái tồn tại của tệp trọng số trên ổ đĩa (`modelExists`), hiển thị chỉ báo trực quan.
  - Bật / tắt hoạt động của từng mô hình thông qua nút gạt (`enabled`).
  - Tinh chỉnh tham số suy luận: Ngưỡng tin cậy `confidence` (0.00 – 1.00) và ngưỡng giao thoa `iouThreshold`.
  - Tùy chỉnh danh sách nhãn nhận diện mục tiêu (`labels`) cấu thành hành vi vi phạm.
  - **Thư viện cấu hình mẫu (Model Templates) tích hợp sẵn:**
    - *Phone Usage Detection:* Cấu hình phát hiện sử dụng điện thoại di động trong khu vực làm việc (nhãn: `phone`, `cell phone`, `phone_use`, ngưỡng confidence `0.40`).
    - *Sleeping / Inactivity Detection:* Cấu hình phát hiện ngủ gật hoặc bất động kéo dài tại bàn làm việc (nhãn: `sleeping`, `head_down`, `inattentive`, ngưỡng confidence `0.35`).
- **Quản lý đường dẫn lưu trữ và giám sát dung lượng (Storage Governance):**
  - Cấu hình linh hoạt đường dẫn thư mục lưu trữ khuôn mặt (`faceStoragePath`) và thư mục lưu trữ bằng chứng vi phạm (`violationStoragePath`).
  - Bảng thống kê tài nguyên thời gian thực: trạng thái thư mục, tổng số nhân sự đã đăng ký sinh trắc học, tổng số lượng tệp ảnh, tổng dung lượng lưu trữ trên đĩa (Bytes, KB, MB).

### Đồng bộ dữ liệu lên website HRMS

- CV Backend gửi sự kiện đã phát hiện lên website HRMS qua API hoặc webhook.
- Website HRMS lưu sự kiện vào module giám sát vận hành.
- Dashboard HRMS thống kê số sự kiện theo phòng, camera, loại cảnh báo và trạng thái.
- Cho phép tạo thông báo trong hệ thống cho manager và liên kết sự kiện với Kanban để tạo nhiệm vụ xử lý.
- Cho phép lãnh đạo xem báo cáo theo phạm vi được phân quyền.
- Cho phép đồng bộ trạng thái xác nhận từ HRMS ngược lại CV Backend nếu cần.
- Có cơ chế retry khi gửi sự kiện thất bại; ghi log toàn bộ request gửi từ CV Backend sang HRMS.

Dữ liệu sự kiện gửi về HRMS:

```json
{
  "event_type": "smoking_detected",
  "camera_id": "CAM-ROOM-01",
  "room_id": "ROOM-A",
  "detected_at": "2026-08-24T16:21:00+07:00",
  "confidence": 0.87,
  "duration_seconds": 8,
  "evidence_image_url": "...",
  "evidence_video_url": "...",
  "model_version": "smoking-detector-v1",
  "status": "pending_review"
}
```

### Dashboard và báo cáo Computer Vision

- Thống kê số sự kiện theo ngày, tuần, tháng; theo phòng, camera và loại sự kiện.
- Thống kê tỷ lệ sự kiện đã xác nhận và cảnh báo sai.
- Theo dõi camera có nhiều cảnh báo bất thường và model có tỷ lệ false positive cao.
- Hiển thị thời gian xử lý trung bình của manager và số sự kiện đang chờ kiểm tra.
- Cho phép lọc dữ liệu theo phạm vi quản lý và xuất báo cáo PDF/Excel theo quyền.

#### Chức năng AI

- Tóm tắt tình hình sự kiện theo ngày hoặc tuần.
- Phát hiện camera hoặc khu vực có số cảnh báo tăng bất thường.
- Đề xuất manager kiểm tra các sự kiện có confidence thấp nhưng lặp lại nhiều lần.
- Không tự kết luận vi phạm lao động hoặc đề xuất kỷ luật.

### Bằng chứng, lưu trữ và truy vết

- Lưu frame ảnh hoặc video clip ngắn liên quan đến sự kiện; metadata sự kiện tách biệt với file bằng chứng.
- Cho phép cấu hình thời gian lưu trữ và tự động xóa bằng chứng sau thời hạn lưu giữ.
- Ghi nhận model version, camera, phòng, thời điểm, confidence và người xử lý.
- Cho phép truy vết từ sự kiện về camera, frame hoặc clip nguồn.
- Cho phép đánh dấu sự kiện sai để cải thiện đánh giá model.
- Chỉ người có quyền mới được xem hoặc tải bằng chứng.

### Phạm vi đề xuất

| Nhóm | Chức năng |
| --- | --- |
| **Đã hoàn thiện (MVP / P0)** | • Xác thực sinh trắc học khuôn mặt ArcFace 512-D (Đăng ký tài khoản bắt buộc 6 góc mặt; Đăng nhập Face ID qua webcam; Cơ chế Dev Logout an toàn; Quản lý khuôn mặt `/dashboard/faces` và `/dashboard/my-face`).<br>• Chấm công bằng nhận diện khuôn mặt (`/dashboard/attendance`: Check-in / Check-out tự động, quản lý ca làm việc, tính công hàng ngày, dự phòng lưu trữ ngoại tuyến).<br>• Giám sát phát hiện hành vi vi phạm nơi làm việc bằng YOLO (Hút thuốc, Rời vị trí làm việc quá lâu).<br>• Giao diện giám sát đa màn hình Dual Video Monitors (`/dashboard/behavior`): live video streaming, overlay bounding box màu sắc thời gian thực, bảng runtime log chi tiết theo từng monitor, chu kỳ quét tự động và thủ công.<br>• Cơ chế lưu trữ bằng chứng vi phạm và khóa Cooldown 10s chống ghi đĩa ồ ạt.<br>• Quy trình kiểm duyệt vi phạm (Pending Review → Approve / Reject) kèm nhật ký hành động.<br>• Module Model Controller (`/dashboard/model-controller`): quản trị tham số AI thời gian thực, cấu hình ArcFace & Multi-Model YOLO, kiểm tra weights, template mô hình mới, quản trị dung lượng lưu trữ. |
| **Phase 2 (Mở rộng)** | • Phát hiện sử dụng điện thoại trong giờ làm việc (`phone_usage`).<br>• Phát hiện ngủ gật hoặc bất động kéo dài tại bàn làm việc (`sleeping_detection`).<br>• Nhận diện trang bị bảo hộ lao động PPE (mũ, áo phản quang, khẩu trang).<br>• Phát hiện xâm nhập khu vực hạn chế hoặc phòng máy chủ trái phép.<br>• Đếm mật độ người trong phòng và tạo bản đồ nhiệt (Heatmap) khu vực thường xuyên phát sinh vi phạm.<br>• Cơ chế Active Learning: tự động tinh chỉnh và huấn luyện lại mô hình từ dữ liệu các cảnh báo bị bác bỏ (rejected alerts). |
| **Không đưa vào** | • Nhận diện khuôn mặt bí mật ngoài phạm vi đã công bố và không có sự đồng thuận của nhân viên.<br>• Theo dõi cảm xúc, biểu cảm hoặc phân tích tâm lý của nhân viên qua camera.<br>• Tự động chấm điểm phẩm chất cá nhân hoặc đánh giá năng suất lao động hoàn toàn qua camera.<br>• Theo dõi liên tục từng cá nhân ngoài giờ làm việc hoặc ngoài phạm vi khu vực được phân công.<br>• Tự động kỷ luật, trừ lương hoặc sa thải nhân viên mà không có sự kiểm tra, xác minh và phê duyệt của con người. |

### Ràng buộc kỹ thuật của module

- Camera mất kết nối phải được phát hiện và cảnh báo; model lỗi hoặc quá tải không được làm sập toàn bộ hệ thống.
- Mỗi camera có worker xử lý độc lập hoặc cơ chế cô lập lỗi, tự khởi động lại khi lỗi tạm thời.
- Giới hạn số camera xử lý đồng thời theo tài nguyên CPU/GPU.
- Không gửi toàn bộ video realtime lên HRMS; chỉ gửi metadata, ảnh hoặc clip bằng chứng khi có sự kiện.
- Sự kiện gửi thất bại phải retry có giới hạn; không tạo nhiều sự kiện trùng cho cùng một hành vi liên tục và có cooldown sau mỗi cảnh báo.
- Lưu version model, threshold và cấu hình tại thời điểm phát hiện; thay đổi cấu hình có hiệu lực có kiểm soát và lưu lịch sử.

## Ràng buộc hệ thống

### Ràng buộc về AI

- AI chỉ đưa ra đề xuất; quyết định tuyển dụng, phân công, đánh giá hoặc cảnh báo nhạy cảm phải có người có thẩm quyền xác nhận.
- Người dùng phải xem và chỉnh sửa được kết quả AI trước khi phát hành.
- Kết quả AI phải liên kết được với dữ liệu nguồn để kiểm tra.
- Khi không xác định chắc chắn tên người hoặc nội dung nhiệm vụ, hệ thống phải yêu cầu xác nhận thay vì tự động giao việc.
- Câu hỏi, đáp án, điểm phù hợp, phân tích năng lực và follow-up do AI tạo phải cho phép người có thẩm quyền kiểm tra và chỉnh sửa.
- AI không được tự quyết định loại ứng viên, Pass/Fail, KPI, tăng lương hoặc thăng chức.

### Ràng buộc về quyền riêng tư và giám sát

- Doanh nghiệp phải công khai loại dữ liệu được thu thập, mục đích sử dụng, người được xem và thời hạn lưu giữ.
- Dữ liệu sinh trắc học khuôn mặt chỉ được thu thập khi có sự đồng thuận, tự nguyện của nhân viên phục vụ xác thực đăng nhập tài khoản và điểm danh chấm công; nhân viên có quyền yêu cầu xóa bỏ hoặc đăng ký lại dữ liệu sinh trắc học của mình.
- Không ghi phím, chụp màn hình bí mật, theo dõi thiết bị hoặc vị trí cá nhân ngoài phạm vi đã được thông báo và cho phép.
- Không phân tích đời tư hoặc dữ liệu không liên quan đến công việc.
- Không dùng AI để tự động kỷ luật, sa thải hoặc đưa ra kết luận bất lợi về nhân viên.
- Khu vực có camera phải được công khai kèm mục đích sử dụng dữ liệu; không quan sát ngoài phạm vi đã công bố.
- Nhận diện danh tính bằng sinh trắc học khuôn mặt chỉ áp dụng cho mục đích xác thực tài khoản và điểm danh chấm công với sự đồng thuận của nhân viên. Đối với camera giám sát hành vi tại nơi làm việc, hệ thống gắn profile giám sát theo phân công khu vực/bàn làm việc được cấu hình trước; tuyệt đối không quét khuôn mặt bí mật để theo dõi liên tục từng cá nhân, không phân tích cảm xúc hoặc chấm điểm phẩm chất nhân viên.
- Sự kiện do mô hình Computer Vision phát hiện chỉ là cảnh báo; phải có người quản lý xác nhận trước khi ghi nhận.
- Chỉ lưu dữ liệu camera cần thiết cho mục đích đã công bố; ưu tiên sự kiện và ảnh bằng chứng thay vì video liên tục.
- Nhân viên cần có cơ chế phản hồi hoặc yêu cầu đính chính dữ liệu khi phù hợp.

### Ràng buộc về dữ liệu và bảo mật

- Phân quyền theo vai trò, phòng ban và phạm vi quản lý.
- Mã hóa dữ liệu nhạy cảm khi truyền và khi lưu trữ.
- Ghi nhật ký các thao tác truy cập, chỉnh sửa, phân công và phê duyệt.
- Chỉ gửi dữ liệu tối thiểu cần thiết tới dịch vụ AI bên thứ ba.
- Dữ liệu cuộc họp, CV và hồ sơ nhân viên phải có chính sách lưu giữ và xóa rõ ràng.
- Bằng chứng hình ảnh/video từ camera phải có thời hạn lưu giữ, tự động xóa sau thời hạn và phân quyền xem/tải nghiêm ngặt.
- Mọi lượt xem, tải xuống hoặc xác nhận sự kiện camera phải được ghi nhật ký.
- Dữ liệu sử dụng để trình diễn phải được giả lập, ẩn danh hoặc có sự đồng ý hợp lệ.

### Ràng buộc về xử lý file và OCR

- Phải kiểm tra MIME type, phần mở rộng, kích thước và tính toàn vẹn của file trước khi xử lý.
- File tải lên phải được quét mã độc và lưu ngoài vùng có thể thực thi trực tiếp.
- Tên file phải được chuẩn hóa; không được dùng tên file do người dùng cung cấp làm đường dẫn lưu trữ trực tiếp.
- Phải giới hạn dung lượng file, số trang, số file mỗi lần tải và thời gian xử lý theo cấu hình hệ thống.
- File đặt mật khẩu, file hỏng hoặc định dạng không hỗ trợ phải trả về lỗi rõ ràng.
- PDF có lớp văn bản phải được ưu tiên trích xuất trực tiếp; chỉ chạy OCR khi không có đủ văn bản hoặc người dùng yêu cầu.
- PDF lai phải được quyết định trích xuất/OCR theo từng trang.
- Kết quả OCR có độ tin cậy thấp phải được đánh dấu và yêu cầu người dùng xác nhận.
- Chữ viết tay, ảnh mờ, ảnh nghiêng và tài liệu bố cục phức tạp không được tự động ghi vào hồ sơ chính thức nếu chưa qua kiểm tra.
- Không được dùng bước sửa chính tả hoặc mô hình ngôn ngữ để âm thầm thay đổi nội dung OCR; mọi nội dung đã hiệu chỉnh phải truy vết được về bản OCR gốc.
- Dữ liệu trích xuất phải giữ liên kết tới file, trang hoặc vùng nguồn để kiểm chứng.
- File gốc, kết quả OCR, dữ liệu đã xác nhận và lịch sử chỉnh sửa phải được quản lý như các phiên bản riêng biệt.

### Ràng buộc về hàng đợi xử lý

- Trạng thái tác vụ phải được lưu bền vững và không mất khi dịch vụ khởi động lại.
- Một file không được tạo nhiều tác vụ giống nhau ngoài ý muốn; tác vụ phải có cơ chế nhận diện xử lý trùng.
- Tác vụ lỗi tạm thời phải hỗ trợ thử lại có giới hạn; lỗi dữ liệu không hợp lệ không được thử lại vô hạn.
- Hủy tác vụ phải dừng ở điểm an toàn và không tạo kết quả dở dang thành dữ liệu chính thức.
- File tạm và kết quả trung gian phải tự xóa theo thời hạn lưu giữ.
- Tác vụ của các công ty hoặc người dùng khác nhau phải được cô lập theo quyền truy cập.
- Hệ thống phải giới hạn số tác vụ đồng thời để tránh OCR hoặc mô hình AI làm cạn tài nguyên.
- Nhật ký tác vụ phải ghi người tạo, module nguồn, trạng thái, lỗi, thời gian bắt đầu và kết thúc.

### Ràng buộc nghiệp vụ

- Một nhân viên phải được liên kết đúng với tài khoản, phòng ban và tuyến quản lý trước khi nhận việc tự động.
- Mọi nhiệm vụ sinh từ cuộc họp phải lưu cuộc họp nguồn, người xác nhận và thời điểm xác nhận.
- Thay đổi người phụ trách, thời hạn hoặc trạng thái phải được lưu lịch sử.
- Người dùng chỉ được xem cuộc họp, hồ sơ, công việc và báo cáo thuộc phạm vi được cấp quyền.
- Số câu hỏi và thời gian làm bài phải cấu hình được theo từng bài test, không được cố định toàn hệ thống.
- Bài test hỗ trợ cả ứng viên và nhân viên nội bộ; mỗi loại phải có chính sách truy cập và sử dụng kết quả riêng.
- Người làm có thể tạm dừng và tiếp tục nếu bài còn hiệu lực và chính sách bài test cho phép.
- Bài test đã phát hành phải giữ nguyên snapshot câu hỏi, đáp án, trọng số và cấu hình chấm điểm.
- Khi hết thời gian, hệ thống phải tự động nộp các câu trả lời đã lưu.
- AI hoặc ngưỡng điểm chỉ được dùng để sàng lọc sơ bộ; HR có quyền override và khôi phục ứng viên.
- Kết quả phải hỗ trợ tổng điểm và phân tích theo level, chủ đề hoặc kỹ năng.
- Thay đổi điểm, Pass/Fail hoặc trạng thái tuyển dụng phải lưu người thực hiện, thời điểm và lý do khi cần.
- Kết quả đánh giá nhân viên chỉ là dữ liệu tham khảo; không được tự động quyết định KPI, lương, thăng chức hoặc kỷ luật.
- Quá trình đăng ký tài khoản bắt buộc phải hoàn tất thu thập đủ 6 góc mặt chuẩn hóa và trích xuất thành công vector đặc trưng; trường hợp lỗi phải tự động hủy tạo tài khoản (rollback) để bảo toàn tính toàn vẹn dữ liệu.
- Điểm danh chấm công bằng khuôn mặt yêu cầu điểm tương đồng Cosine Similarity đạt ngưỡng tối thiểu được cấu hình; phiên check-in phải hoàn tất trước khi check-out và hệ thống phải tự động tổng hợp bảng công hàng ngày.
- Bằng chứng hình ảnh vi phạm thị giác máy tính phải áp dụng cơ chế khóa cooldown (10 giây) để tránh ghi đĩa ồ ạt; cảnh báo chỉ được chuyển thành vi phạm chính thức sau khi được người quản lý có thẩm quyền phê duyệt (Approve).
- Chỉ metadata và bằng chứng ngắn được gửi từ CV Backend về HRMS khi có sự kiện; không truyền toàn bộ video realtime.
- Sự kiện gửi từ CV Backend thất bại phải được thử lại có giới hạn; không tạo sự kiện trùng cho cùng một hành vi liên tục.
