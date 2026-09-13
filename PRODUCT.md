# PRODUCT — Hệ thống HRMS tích hợp AI

> **Trạng thái tài liệu:** Hợp đồng sản phẩm mục tiêu của Town Hown. Tài liệu
> này mô tả phạm vi và ràng buộc nghiệp vụ, không khẳng định mọi module đã được
> triển khai. Phân hệ đang có source là ITBAAI; xem
> [`docs/downtown/README.md`](docs/downtown/README.md)
> để đối chiếu hiện trạng kỹ thuật.

## Quan hệ giữa tầm nhìn và ứng dụng hiện có

- Town Hown là HRMS bao trùm tài khoản, nhân sự, tuyển dụng, họp, công việc,
  báo cáo, tích hợp, Document AI và đánh giá năng lực.
- `Frontend` và `Backend` hiện thực phần tuyển dụng, kiểm tra/đánh giá,
  question bank, Document AI, email và một phần quản lý năng lực.
- Tính năng trong tài liệu này là **mục tiêu sản phẩm** cho đến khi có source,
  migration và validation tương ứng trong ứng dụng.
- AI chỉ hỗ trợ đề xuất và phân tích; người có thẩm quyền vẫn chịu trách nhiệm
  với quyết định nhân sự.

## 1. Module tài khoản, tổ chức và phân quyền

- Đăng nhập, đăng xuất và quản lý tài khoản.
- Quản lý công ty, chi nhánh, phòng ban, chức danh và sơ đồ tổ chức.
- Phân quyền theo vai trò: quản trị viên, HR, lãnh đạo, quản lý, nhân viên và ứng viên.
- Giới hạn phạm vi dữ liệu theo phòng ban và cấp quản lý.
- Lưu nhật ký đăng nhập, truy cập và thay đổi dữ liệu.

## 2. Module quản lý nhân sự

- Quản lý hồ sơ nhân viên và thông tin liên hệ.
- Quản lý hợp đồng, chức danh, phòng ban và người quản lý trực tiếp.
- Quản lý trạng thái nhân sự: thử việc, chính thức, tạm nghỉ và nghỉ việc.
- Lưu trữ tài liệu nhân sự theo quyền truy cập.
- Tra cứu danh bạ nhân viên trong doanh nghiệp.

### Chức năng AI

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

### Phát hiện hút thuốc trong khu vực làm việc

- Phát hiện hành vi hoặc vật thể liên quan đến hút thuốc trong vùng quan sát.
- Cho phép cấu hình khu vực cấm hút thuốc theo từng camera hoặc phòng.
- Cho phép thiết lập ngưỡng confidence tối thiểu và số frame/giây liên tục trước khi tạo cảnh báo.
- Cho phép lưu ảnh bằng chứng hoặc đoạn video ngắn khi phát hiện sự kiện.
- Cho phép manager xác nhận sự kiện là đúng, sai hoặc cần kiểm tra thêm, kèm ghi chú kết quả xử lý.
- Cho phép bỏ qua cảnh báo sai để phục vụ thống kê chất lượng model.

#### Chức năng AI/Computer Vision

- Nhận diện người có dấu hiệu hút thuốc; nhận diện vật thể nghi vấn như điếu thuốc hoặc khói nếu model hỗ trợ.
- Kết hợp nhiều frame liên tiếp để giảm false positive.
- Đánh dấu vùng ảnh liên quan đến cảnh báo và trả confidence cho từng sự kiện.
- Không tự kết luận nhân viên vi phạm nếu chưa có manager xác nhận.

### Phát hiện rời vị trí quá lâu

- Cho phép admin cấu hình vị trí làm việc hoặc vùng quan sát cho từng camera.
- Cho phép đánh dấu vùng ghế ngồi, bàn làm việc hoặc khu vực cần có nhân sự.
- Theo dõi trạng thái có người/không có người trong vùng quan sát.
- Cho phép cấu hình thời gian rời vị trí tối thiểu trước khi cảnh báo và khung giờ áp dụng theo ca làm việc.
- Không cảnh báo ngoài giờ làm việc, giờ nghỉ hoặc khoảng thời gian đã cấu hình.
- Cho phép manager xem lịch sử rời vị trí theo phòng, camera hoặc khung giờ.
- Cho phép xác nhận cảnh báo là hợp lệ, không hợp lệ hoặc có lý do chính đáng.

#### Chức năng AI/Computer Vision

- Phát hiện người trong vùng quan sát và theo dõi sự hiện diện theo thời gian.
- Phân biệt rời vị trí ngắn hạn và rời vị trí quá ngưỡng.
- Ghi nhận thời điểm bắt đầu vắng mặt, thời điểm quay lại và tổng thời gian rời vị trí trong phiên quan sát.
- Tạo cảnh báo khi thời gian vắng mặt vượt ngưỡng.
- Không tự đánh giá thái độ, năng suất hoặc phẩm chất cá nhân của nhân viên.

### Giao diện quan sát realtime cho quản lý

- Manager xem danh sách phòng hoặc camera được cấp quyền.
- Hiển thị stream realtime hoặc preview đã tối ưu từ camera.
- Hiển thị trạng thái từng camera: online, offline, đang xử lý, có cảnh báo.
- Hiển thị cảnh báo realtime khi có sự kiện nghi vấn kèm ảnh hoặc đoạn video bằng chứng.
- Cho phép manager xác nhận, từ chối hoặc đánh dấu cần kiểm tra thêm, kèm ghi chú.
- Cho phép lọc sự kiện theo camera, phòng, loại vi phạm, thời gian và trạng thái xử lý.
- Chỉ hiển thị camera và sự kiện thuộc phạm vi quản lý được phân quyền.

#### Chức năng AI/Computer Vision

- Overlay bounding box hoặc vùng phát hiện lên khung hình khi có cảnh báo.
- Hiển thị confidence của model và thời lượng hành vi.
- Cảnh báo khi model không đủ chắc chắn và cần người xem xác minh.
- Không tự động chuyển sự kiện thành kết luận vi phạm chính thức.

### Cấu hình hệ thống cho quản trị viên

- Admin quản lý camera, phòng, vùng quan sát và model sử dụng.
- Cho phép chọn model phát hiện hút thuốc và model phát hiện rời vị trí cho từng camera.
- Cho phép cấu hình confidence threshold và thời gian tối thiểu để tạo cảnh báo.
- Cho phép cấu hình FPS xử lý, độ phân giải frame và số lượng frame lấy mẫu.
- Cho phép cấu hình thời lượng video bằng chứng trước và sau sự kiện.
- Cho phép bật/tắt từng loại phát hiện theo từng camera và kiểm tra thử model trước khi áp dụng chính thức.
- Cho phép xem log lỗi model, lỗi stream và lỗi gửi sự kiện lên HRMS.

#### Chức năng AI/Computer Vision

- Cho phép kiểm thử model với ảnh hoặc video mẫu.
- Hiển thị số lượng cảnh báo đúng/sai sau khi manager xác nhận và tỷ lệ false positive theo camera, model.
- Đề xuất điều chỉnh ngưỡng nếu một camera tạo quá nhiều cảnh báo sai.
- Không tự động thay đổi cấu hình model nếu chưa có admin xác nhận.

### Quản lý sự kiện vi phạm

- Mỗi sự kiện được lưu dưới dạng bản ghi riêng: loại sự kiện, camera, phòng, thời điểm, duration, confidence và trạng thái xử lý.
- Lưu ảnh minh chứng hoặc video ngắn nếu chính sách cho phép.
- Gắn sự kiện với phòng, camera và ca làm việc nếu có dữ liệu.
- Cho phép manager xác nhận hoặc loại bỏ sự kiện kèm lý do.
- Cho phép chuyển sự kiện thành nhiệm vụ kiểm tra trên Kanban nếu cần.
- Cho phép gửi thông báo cho quản lý phụ trách.
- Cho phép xuất báo cáo sự kiện theo thời gian, phòng hoặc loại cảnh báo.
- Lưu lịch sử toàn bộ thao tác xem, xác nhận, chỉnh sửa và xử lý sự kiện.

Trạng thái sự kiện: `Detected` → `Pending Review` → `Confirmed` / `False Positive` /
`Need More Context` → `Resolved` / `Dismissed`.

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
| MVP | Quản lý camera theo phòng; cấu hình vùng quan sát ROI; threshold/confidence tuning; cooldown cảnh báo; evidence snapshot/clip; human review; đồng bộ event lên HRMS; dashboard sự kiện; log model version/config |
| Phase 2 | Nhận diện PPE (mũ, áo bảo hộ); phát hiện điện thoại trong khu vực cấm; phát hiện xâm nhập khu vực hạn chế; đếm người trong phòng; heatmap khu vực thường vi phạm; active learning từ cảnh báo sai |
| Không đưa vào | Nhận diện danh tính nhân viên bằng mặt; theo dõi cảm xúc/khuôn mặt; chấm điểm năng suất qua camera; theo dõi liên tục từng cá nhân; tự động kỷ luật khi phát hiện |

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
- Không ghi phím, chụp màn hình bí mật, theo dõi thiết bị hoặc vị trí cá nhân ngoài phạm vi đã được thông báo và cho phép.
- Không phân tích đời tư hoặc dữ liệu không liên quan đến công việc.
- Không dùng AI để tự động kỷ luật, sa thải hoặc đưa ra kết luận bất lợi về nhân viên.
- Khu vực có camera phải được công khai kèm mục đích sử dụng dữ liệu; không quan sát ngoài phạm vi đã công bố.
- Không nhận diện danh tính, phân tích cảm xúc/phẩm chất hoặc theo dõi liên tục từng cá nhân qua camera.
- Sự kiện do mô hình Computer Vision phát hiện chỉ là cảnh báo; phải có người quản lý xác nhận trước khi ghi nhận.
- Chỉ lưu dữ liệu camera cần thiết cho mục đích đã công bố; ưu tiên sự kiện và clip ngắn thay vì video liên tục.
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
- Chỉ metadata và bằng chứng ngắn được gửi từ CV Backend về HRMS khi có sự kiện; không truyền toàn bộ video realtime.
- Sự kiện gửi từ CV Backend thất bại phải được thử lại có giới hạn; không tạo sự kiện trùng cho cùng một hành vi liên tục.
