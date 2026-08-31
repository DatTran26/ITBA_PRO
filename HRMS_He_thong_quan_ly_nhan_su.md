# Hồ sơ yêu cầu nguồn — HRMS và ITBAAI

> **Tài liệu provenance, không phải nguồn hiện hành.** Nội dung bên dưới lưu
> yêu cầu theo từng thời điểm/phase để truy nguyên phạm vi ban đầu. Product
> contract hiện hành nằm ở [`PRODUCT.md`](PRODUCT.md); hiện trạng triển khai nằm
> ở [`docs/downtown/README.md`](docs/downtown/README.md).
> Các nhãn như “DONE”, phase và ngày tháng chỉ phản ánh ngữ cảnh lịch sử của
> đoạn tương ứng.

# Init req \- DONE

# **Mô tả dự án website tạo bài test phỏng vấn IT/BA có AI hỗ trợ**

## **1\. Mục tiêu hệ thống**

Xây dựng một website đơn giản phục vụ quy trình sàng lọc và hỗ trợ phỏng vấn ứng viên IT/BA.

Hệ thống cho phép:

* Người phụ trách tuyển dụng chọn vị trí/phân loại level ứng viên như Fresher, Middle, Senior  
* Hệ thống tự tạo bộ 10 câu hỏi trắc nghiệm phù hợp  
* Gửi link bài test cho ứng viên  
* Ứng viên làm bài trong thời gian giới hạn 15 phút  
* Sau khi submit, hệ thống chấm điểm và hiển thị kết quả ngay  
* AI phân tích kết quả làm bài và gợi ý thêm các câu hỏi phỏng vấn chuyên sâu để interviewer sử dụng trong vòng phỏng vấn tiếp theo

---

## **2\. Đối tượng sử dụng**

Có 2 nhóm người dùng chính:

### **2.1. Recruiter / Interviewer / Admin**

Người tạo bài test và xem kết quả ứng viên.

### **2.2. Candidate**

Người nhận link, làm bài test và xem kết quả sau khi nộp bài.

---

## **3\. Luồng nghiệp vụ chính**

### **Bước 1: Tạo bài test**

Recruiter vào hệ thống và nhập các thông tin:

* Vị trí tuyển dụng (ví dụ: Backend Developer, Frontend Developer, QA, DevOps...)  
* Level ứng viên (Fresher / Middle / Senior)  
* Có thể thêm mô tả ngắn về yêu cầu tuyển dụng hoặc skill cần đánh giá

Sau đó hệ thống sẽ tự generate:

* 10 câu hỏi trắc nghiệm  
* Nội dung phù hợp với vị trí và level đã chọn  
* Mỗi câu có các phương án trả lời rõ ràng

### **Bước 2: Tạo link làm bài**

Sau khi bộ câu hỏi được tạo xong:

* Hệ thống sinh ra 1 link riêng cho ứng viên  
* Recruiter gửi link này cho ứng viên qua email / chat / tin nhắn

### **Bước 3: Ứng viên làm bài**

Khi mở link:

* Ứng viên thấy thông tin bài test  
* Có đồng hồ đếm ngược 15 phút  
* Ứng viên trả lời 10 câu hỏi  
* Có nút Submit để nộp bài  
* Nếu hết 15 phút thì hệ thống tự động submit

### **Bước 4: Hiển thị kết quả**

Ngay sau khi submit:

* Ứng viên có thể thấy kết quả cơ bản  
* Recruiter có thể xem chi tiết:  
  * Tổng điểm  
  * Số câu đúng / sai  
  * Đáp án ứng viên đã chọn  
  * Đáp án đúng

### **Bước 5: AI phân tích và gợi ý phỏng vấn**

Dựa trên kết quả bài test, AI sẽ:

* Phân tích điểm mạnh / điểm yếu của ứng viên  
* Đưa ra một số insight ban đầu  
* Gợi ý bộ câu hỏi follow-up để interviewer hỏi sâu hơn trong buổi phỏng vấn

Ví dụ:

* Ứng viên mạnh về JavaScript cơ bản nhưng yếu về async handling  
* Ứng viên hiểu React cơ bản nhưng thiếu kiến thức về performance optimization  
* Hệ thống đề xuất 5–10 câu hỏi phỏng vấn tiếp theo tương ứng

---

## **4\. Chức năng chính**

## **4.1. Phần dành cho Admin / Recruiter**

* Đăng nhập hệ thống  
* Tạo bài test mới  
* Chọn vị trí và level  
* Generate bộ câu hỏi  
* Xem / chỉnh sửa câu hỏi trước khi gửi nếu cần  
* Tạo link gửi ứng viên  
* Xem danh sách các bài test đã tạo  
* Xem danh sách ứng viên đã làm bài  
* Xem kết quả chi tiết từng ứng viên  
* Xem phần AI insight và interview follow-up questions

## **4.2. Phần dành cho Candidate**

* Truy cập bằng link  
* Xem hướng dẫn làm bài  
* Làm 10 câu trắc nghiệm trong 15 phút  
* Submit bài  
* Xem kết quả sau khi hoàn thành

## **4.3. Chức năng AI**

* Sinh câu hỏi trắc nghiệm theo:  
  * Job role  
  * Candidate level  
  * Skill focus  
* Chấm và phân tích kết quả  
* Tạo insight về ứng viên  
* Đề xuất bộ câu hỏi phỏng vấn tiếp theo

---

## **5\. Dữ liệu đầu vào và đầu ra**

### **Input**

Từ recruiter:

* Job position  
* Candidate level  
* Optional: job description, required skills

Từ candidate:

* Câu trả lời cho 10 câu hỏi trắc nghiệm

### **Output**

Cho recruiter:

* Bộ câu hỏi được generate  
* Link test cho ứng viên  
* Kết quả làm bài  
* AI insight  
* Gợi ý câu hỏi phỏng vấn tiếp theo

Cho candidate:

* Điểm số cơ bản sau khi nộp bài

---

## **6\. Màn hình dự kiến**

### **6.1. Admin Dashboard**

* Danh sách bài test  
* Nút tạo bài test mới

### **6.2. Create Test Page**

* Chọn vị trí  
* Chọn level  
* Nhập kỹ năng hoặc mô tả  
* Nút generate questions

### **6.3. Question Review Page**

* Hiển thị 10 câu hỏi đã tạo  
* Có thể chỉnh sửa / xác nhận  
* Nút tạo link test

### **6.4. Candidate Test Page**

* Thông tin bài test  
* Đồng hồ đếm ngược  
* Danh sách câu hỏi  
* Nút submit

### **6.5. Result Page**

* Điểm số  
* Đúng / sai từng câu  
* Nhận xét tổng quan

### **6.6. AI Analysis Page**

* Insight ứng viên  
* Các chủ đề cần hỏi sâu  
* Danh sách câu hỏi gợi ý cho interviewer

---

## **7\. Quy tắc nghiệp vụ chính**

* Mỗi bài test gồm đúng 10 câu hỏi  
* Thời gian làm bài là 15 phút  
* Hết thời gian thì tự submit  
* Mỗi link test chỉ gắn với 1 ứng viên hoặc 1 lượt làm bài  
* Kết quả hiển thị ngay sau khi nộp  
* AI chỉ gợi ý câu hỏi phỏng vấn sau khi đã có kết quả bài test  
* Câu hỏi được generate phải bám theo role và level đã chọn

---

## **8\. Yêu cầu phi chức năng**

* Giao diện đơn giản, dễ dùng  
* Tương thích tốt trên desktop và mobile  
* Tốc độ load nhanh  
* Dữ liệu bài test và kết quả cần được lưu lại  
* Có cơ chế tránh refresh làm mất dữ liệu trong lúc làm bài  
* Cần đảm bảo link test không bị dùng sai mục đích hoặc truy cập trái phép

---

## **9\. Gợi ý scope MVP**

Phiên bản đầu tiên chỉ cần làm gọn như sau:

* Admin login  
* Tạo bài test theo role \+ level  
* AI generate 10 câu hỏi  
* Sinh link cho ứng viên  
* Ứng viên làm bài trong 15 phút  
* Submit và chấm điểm ngay  
* Hiển thị kết quả cơ bản  
* AI đưa ra insight và câu hỏi phỏng vấn follow-up

Chưa cần ở giai đoạn đầu:

* Phân quyền phức tạp  
* Nhiều loại câu hỏi ngoài trắc nghiệm  
* Anti-cheat nâng cao  
* Báo cáo thống kê quá sâu  
* Tích hợp email automation phức tạp

---

## **10\. Mô tả ngắn gọn để gửi engineer**

We need a simple web-based interview testing platform for IT candidates.  
The recruiter selects a job role and candidate level (Fresher / Middle / Senior), then the system generates 10 multiple-choice questions automatically. A test link is created and sent to the candidate. The candidate answers within 15 minutes and submits the test. Right after submission, the system shows the result immediately. Based on the candidate’s answers, AI analyzes strengths/weaknesses and suggests follow-up interview questions and candidate insights for the interviewer.

# Mar 16th \- Phase 1

.**Bổ sung requirement cho website tạo bài test phỏng vấn IT/BA có AI hỗ trợ**

## **1\. Mục tiêu bổ sung**

Mở rộng hệ thống hiện tại để hỗ trợ sâu hơn cho interviewer trong quá trình chuẩn bị câu hỏi, lưu trữ bộ câu hỏi dùng lại, đánh giá ứng viên sau phỏng vấn, và xuất báo cáo nhanh.

Các mục tiêu bổ sung gồm:

* Cho phép interviewer **re-generate** lại bộ câu hỏi hoặc từng câu hỏi riêng lẻ

* Cho phép lưu bộ câu hỏi đã tạo vào kho **Favourite Questions**

* Cho phép interviewer tạo nhanh **bộ câu hỏi follow-up mới** dựa trên kết quả AI phân tích của một ứng viên

* Cho phép interviewer ghi chú trực tiếp trên hồ sơ kết quả ứng viên

* Cho phép ghi âm toàn bộ buổi phỏng vấn và dùng AI để tạo summary \+ đánh giá mức độ phù hợp

* Cho phép chỉnh sửa lại AI summary sau khi AI generate

* Cho phép xuất nhanh file báo cáo PDF để phục vụ việc report nội bộ

* Cho phép interviewer đánh dấu trạng thái ứng viên là **Pass / Fail**

---

## **2\. Luồng nghiệp vụ bổ sung**

### **2.1. Re-generate câu hỏi ở màn hình tạo câu hỏi**

Tại màn hình tạo câu hỏi phỏng vấn, sau khi hệ thống đã generate bộ câu hỏi:

* Recruiter / Interview có thể chọn:

  * Re-generate toàn bộ bài test

  * Re-generate từng câu hỏi riêng lẻ

Khi nhấn nút **Re-generate**:

* Hệ thống mở một modal để hỏi nhu cầu thay đổi

* Trong modal có 2 cách thao tác:

  1. Người dùng nhập thêm prompt để AI generate lại theo yêu cầu cụ thể

  2. Người dùng không nhập prompt và nhấn generate nhanh, hệ thống sẽ dùng lại context cũ của lần tạo câu hỏi trước

Cách thức này áp dụng cho cả:

* Re-generate toàn bộ bài test

* Re-generate từng câu hỏi

### **2.2. Lưu bộ câu hỏi vào Favourite**

Sau khi bộ câu hỏi đã được tạo xong và người dùng hài lòng với kết quả:

* Người dùng có thể lưu bộ câu hỏi này vào kho Favourite

* Khi lưu, hệ thống gắn metadata để phân loại theo:

  * Level

  * Phòng ban / Department

Mục đích:

* Tái sử dụng các bộ câu hỏi tốt trong các lần tuyển dụng sau

* Giảm thời gian generate lại từ đầu

### **2.3. Tạo follow-up questions mới từ kết quả ứng viên**

Tại màn hình chi tiết kết quả của một ứng viên:

* Sau khi AI đã phân tích bài test xong, interviewer có thể nhấn nút để tạo nhanh bộ câu hỏi tiếp theo cho một session phỏng vấn mới  
* Vẫn có tính năng edit lại follow-up questions khi cần (như tính năng 2.2)

* Bộ câu hỏi này phải bám vào:

  * Kết quả bài test hiện tại

  * AI insight về điểm mạnh / điểm yếu

  * Các dấu hiệu ứng viên có thể đang che giấu hoặc chưa thể hiện rõ năng lực

Mục tiêu:

* Hỗ trợ interviewer khai thác sâu hơn tiềm năng thật

* Phát hiện điểm yếu hoặc khoảng trống kiến thức chưa lộ ra trong bài test đầu tiên

### **2.4. Ghi chú ứng viên**

Tại màn hình chi tiết kết quả của một ứng viên:

* Có thêm một field **Note** dạng optional

* Interviewer có thể nhập ghi chú thủ công về ứng viên

* Có thể nhấn Save để lưu lại

* Sau khi đã lưu vẫn có thể edit lại note

Ví dụ note:

* Thái độ tốt, giao tiếp ổn

* Có dấu hiệu học thuộc câu trả lời

* Cần kiểm tra sâu thêm về system design

### **2.5. Ghi âm buổi phỏng vấn \+ AI summary**

Tại màn hình chi tiết kết quả của một ứng viên:

* Có thêm tính năng ghi âm toàn bộ buổi phỏng vấn

* Sau khi kết thúc ghi âm, hệ thống xử lý audio và dùng AI để:

  * Tóm tắt nội dung cuộc phỏng vấn

  * Rút ra các điểm nổi bật

  * Đánh giá mức độ phù hợp tổng thể của ứng viên với JD ban đầu của job này

Sau khi AI generate summary:

* Interviewer có thể edit lại summary

* Mục đích là để sửa nhanh các phần AI hiểu sai hoặc bổ sung thêm thông tin quan trọng

### **2.6. Xuất báo cáo PDF**

Tại màn hình chi tiết kết quả của một ứng viên:

* Có nút xuất nhanh file báo cáo PDF

* Nội dung báo cáo được tổng hợp từ:

  * Kết quả bài test

  * AI summary của buổi phỏng vấn

  * Đánh giá mức độ phù hợp với job

  * Note của interviewer nếu có

Mục đích:

* Phục vụ việc report nhanh cho cấp trên

* Tạo tài liệu đánh giá ứng viên có thể chia sẻ nội bộ

### **2.7. Gắn trạng thái Pass / Fail cho ứng viên**

Tại màn hình detail kết quả ứng viên:

* Interviewer có thể chọn trạng thái:

  * Pass

  * Fail

* Trạng thái này được lưu vào hồ sơ ứng viên của bài test tương ứng

* Dùng để theo dõi kết quả sàng lọc và hỗ trợ quản lý pipeline tuyển dụng

---

## **3\. Chức năng bổ sung**

### **3.1. Phần dành cho Admin / Recruiter / Interviewer**

Bổ sung các chức năng sau:

* Re-generate toàn bộ bộ câu hỏi

* Re-generate từng câu hỏi riêng lẻ

* Nhập prompt bổ sung khi re-generate

* Re-generate nhanh bằng context cũ

* Lưu bộ câu hỏi vào Favourite

* Phân loại Favourite theo level và department

* Tạo bộ câu hỏi follow-up mới từ kết quả AI phân tích của ứng viên

* Ghi chú ứng viên

* Chỉnh sửa ghi chú ứng viên

* Ghi âm buổi phỏng vấn

* Xử lý audio để AI tạo summary

* Chỉnh sửa AI summary

* Xuất báo cáo PDF

* Đánh dấu ứng viên Pass / Fail

### **3.2. Chức năng AI bổ sung**

Ngoài các chức năng AI hiện có, hệ thống cần hỗ trợ thêm:

* AI re-generate bộ câu hỏi dựa trên prompt mới hoặc context cũ

* AI re-generate từng câu hỏi riêng lẻ mà vẫn giữ đúng role / level / mục tiêu đánh giá

* AI tạo bộ câu hỏi follow-up mới dựa trên kết quả cụ thể của từng ứng viên

* AI transcript / summarize nội dung phỏng vấn từ file ghi âm

* AI đánh giá mức độ phù hợp tổng thể của ứng viên so với JD ban đầu

---

## **4\. Dữ liệu đầu vào và đầu ra bổ sung**

### **Input**

Từ recruiter / interviewer:

* Prompt bổ sung khi re-generate

* Lựa chọn re-generate toàn bộ hoặc từng câu hỏi

* Thông tin phân loại Favourite:

  * Level

  * Department

* Note về ứng viên

* File audio hoặc dữ liệu ghi âm cuộc phỏng vấn

* Hành động chọn Pass / Fail

Từ hệ thống / context cũ:

* Job role

* Candidate level

* Job description / required skills đã nhập trước đó

* Bộ câu hỏi đã generate trước

* Kết quả bài test của ứng viên

* AI insight hiện có

* JD ban đầu của job

### **Output**

Cho recruiter / interviewer:

* Bộ câu hỏi mới sau khi re-generate

* Câu hỏi đơn lẻ mới sau khi re-generate

* Favourite question set đã lưu

* Bộ câu hỏi follow-up mới cho session tiếp theo

* Note đã lưu

* AI summary từ audio phỏng vấn

* Đánh giá mức độ phù hợp tổng thể

* File báo cáo PDF

* Trạng thái ứng viên Pass / Fail

---

## **5\. Màn hình bổ sung / cập nhật**

### **5.1. Question Review Page**

Bổ sung:

* Nút **Re-generate Full Test**

* Nút **Re-generate Question** tại từng câu hỏi

* Modal nhập prompt khi re-generate

* Nút generate nhanh không cần nhập prompt

* Nút **Save to Favourite**

* Field chọn hoặc hiển thị metadata:

  * Level

  * Department

### **5.2. Candidate Result Detail Page**

Bổ sung:

* Nút **Generate Follow-up Questions**

* Khu vực **Note** cho interviewer

* Nút Save / Edit note

* Khu vực **Interview Recording**

  * Start recording

  * Stop recording

  * Trạng thái processing

* Khu vực **AI Interview Summary**

  * Nội dung summary

  * Nút edit summary

* Khu vực **Candidate Overall Fit Evaluation**

* Nút **Export PDF Report**

* Trường trạng thái **Pass / Fail**

### **5.3. Favourite Question Library Page**

Có thể bổ sung thêm một màn hình hoặc tab riêng:

* Danh sách các bộ câu hỏi yêu thích đã lưu

* Có phân loại theo:

  * Level

  * Department

* Có thể xem lại để tái sử dụng ở lần tạo test sau

---

## **6\. Quy tắc nghiệp vụ bổ sung**

### **6.1. Re-generate**

* Người dùng có thể re-generate toàn bộ bài test hoặc từng câu hỏi riêng lẻ

* Nếu người dùng nhập prompt mới, AI phải ưu tiên prompt mới đó

* Nếu người dùng không nhập prompt, AI phải dùng lại context cũ của lần generate trước

* Khi re-generate từng câu hỏi, hệ thống chỉ thay thế đúng câu được chọn, không làm thay đổi các câu khác

* Nội dung re-generate vẫn phải bám theo role, level và mục tiêu đánh giá ban đầu

### **6.2. Favourite**

* Chỉ các bộ câu hỏi đã generate xong mới được lưu vào Favourite

* Một bộ Favourite phải được gắn ít nhất:

  * Level

  * Department

* Favourite được lưu để dùng lại ở các lần tạo test sau

### **6.3. Follow-up Questions**

* Chỉ được tạo follow-up questions sau khi đã có kết quả bài test và AI analysis của ứng viên

* Bộ câu hỏi follow-up mới phải dựa trên dữ liệu thực tế của đúng ứng viên đó

* Mục tiêu của bộ follow-up là khai thác sâu điểm mạnh, điểm yếu, lỗ hổng kiến thức, và khả năng ứng viên đang che giấu

### **6.4. Note**

* Note là optional

* Note chỉ dành cho recruiter / interviewer nội bộ

* Note có thể tạo mới, chỉnh sửa và lưu lại nhiều lần

### **6.5. Recording \+ AI Summary**

* Ghi âm được gắn với một ứng viên cụ thể

* Sau khi ghi âm xong, hệ thống mới bắt đầu xử lý AI summary

* AI summary có thể được interviewer chỉnh sửa lại trước khi dùng cho report

* Đánh giá overall fit phải bám theo JD ban đầu của job đang tuyển

### **6.6. Export PDF**

* File PDF được tạo từ dữ liệu mới nhất tại thời điểm export

* Nội dung báo cáo nên lấy từ:

  * Thông tin ứng viên

  * Kết quả bài test

  * AI analysis

  * AI interview summary

  * Note

  * Pass / Fail status

### **6.7. Pass / Fail**

* Mỗi ứng viên trong mỗi bài test cần có 1 trạng thái kết quả cuối cùng

* Trạng thái mặc định có thể để trống trước khi interviewer quyết định

* Khi đã chọn Pass / Fail, hệ thống lưu lại để phục vụ quản lý tuyển dụng

---

## **7\. Yêu cầu phi chức năng bổ sung**

* Re-generate phải có thời gian phản hồi hợp lý

* Audio recording cần được lưu an toàn và gắn đúng với ứng viên

* AI summary không được ghi đè mất bản interviewer đã chỉnh sửa nếu người dùng đã bấm lưu

* PDF export cần tạo nhanh, dễ tải xuống và hiển thị đúng định dạng

* Favourite library cần dễ tìm kiếm và tái sử dụng

* Dữ liệu note, summary edit, Pass / Fail cần được lưu bền vững

---

# Phase 2

### **2.2. Lưu bộ câu hỏi vào Favourite**

Sau khi bộ câu hỏi đã được tạo xong và người dùng hài lòng với kết quả:

* Người dùng có thể lưu bộ câu hỏi này vào kho Favourite

* Khi lưu, hệ thống gắn metadata để phân loại theo:

  * Level

  * Phòng ban / Department

Mục đích:

* Tái sử dụng các bộ câu hỏi tốt trong các lần tuyển dụng sau

* Giảm thời gian generate lại từ đầu

### **2.5. Ghi âm buổi phỏng vấn \+ AI summary**

Tại màn hình chi tiết kết quả của một ứng viên:

* Có thêm tính năng ghi âm toàn bộ buổi phỏng vấn

* Sau khi kết thúc ghi âm, hệ thống xử lý audio và dùng AI để:

  * Tóm tắt nội dung cuộc phỏng vấn

  * Rút ra các điểm nổi bật

  * Đánh giá mức độ phù hợp tổng thể của ứng viên với JD ban đầu của job này

Sau khi AI generate summary:

* Interviewer có thể edit lại summary

* Mục đích là để sửa nhanh các phần AI hiểu sai hoặc bổ sung thêm thông tin quan trọng

### **2.6. Xuất báo cáo PDF**

Tại màn hình chi tiết kết quả của một ứng viên:

* Có nút xuất nhanh file báo cáo PDF

* Nội dung báo cáo được tổng hợp từ:

  * Kết quả bài test

  * AI summary của buổi phỏng vấn

  * Đánh giá mức độ phù hợp với job

  * Note của interviewer nếu có

Mục đích:

* Phục vụ việc report nhanh cho cấp trên

* Tạo tài liệu đánh giá ứng viên có thể chia sẻ nội bộ

# Phase 3 \- Lọc CV

# **TÀI LIỆU MÔ TẢ YÊU CẦU**

## **Hệ thống: AI CV Screening & Recruitment Workflow**

## **1\. Mục tiêu hệ thống**

Xây dựng một hệ thống hỗ trợ HR:

* Tự động thu thập và phân tích CV bằng AI  
* Đánh giá mức độ phù hợp với JD  
* Tối ưu quy trình tuyển dụng từ CV → Interview → Offer → Onboard  
* Giảm thời gian screening thủ công  
* Chuẩn hóa pipeline tuyển dụng

---

## **2\. Đối tượng sử dụng**

| Role | Mô tả |
| ----- | ----- |
| HR | Upload CV, quản lý pipeline, gửi offer |
| Interviewer | Nhận lịch, phỏng vấn, đánh giá |
| Auditor | Quản lý và đánh giá các bài test năng lực nội bộ |
| Admin (optional) | Quản lý hệ thống |

---

## **3\. Tổng quan luồng nghiệp vụ**

Upload CV → AI phân tích → Match với JD → Score → Filter → HR review → Schedule Interview → Interview → Result (Pass/Fail) → Offer → Onboard

---

## **4\. Sơ đồ workflow trạng thái (quan trọng)**

### **4.1. State Machine**

![][image1]

---

### **4.2. Mô tả chuyển trạng thái**

| From | To | Điều kiện |
| ----- | ----- | ----- |
| New | Screened | AI xử lý xong |
| Screened | Rejected | Score \< threshold |
| Screened | Shortlisted | Score đạt yêu cầu |
| Shortlisted | Interview Scheduled | HR lên lịch |
| Interview Scheduled | Interviewed | Đã phỏng vấn |
| Interviewed | Passed | Interview đạt |
| Interviewed | Failed | Interview không đạt |
| Passed | Offered | HR gửi offer |
| Offered | Onboarded | Candidate accept |

---

### **4.3. Quy tắc quan trọng**

* Rejected có thể được HR restore → Shortlisted  
* HR có thể override AI score  
* Không cho phép skip bước (ví dụ: từ Screened → Offered)

---

## **5\. Các module chính**

**5.1. CV Upload & Parsing**

### **Mô tả**

HR upload CV bằng drag & drop

### **Input**

* File CV (PDF, DOCX)  
* JD tương ứng

### **Xử lý**

* OCR \+ NLP trích xuất:  
  * Tên  
  * Email  
  * SĐT  
  * Kinh nghiệm  
  * Skill  
  * Công ty đã làm  
  * Thời gian làm việc

### **Output**

* Structured CV data (JSON)

### **Yêu cầu**

* Hỗ trợ tiếng Việt và tiếng Anh  
* Hỗ trợ CV scan

---

## **5.2. AI Matching & Scoring**

### **Mô tả**

So sánh CV với JD

### **Output**

* Match score (0–100%)  
* Breakdown:  
  * Skill match  
  * Experience match  
  * Domain match

### **Ví dụ**

Total: 78%

* Skill: 80%  
* Experience: 70%  
* Domain: 85%

---

## **5.3. Candidate Pipeline Management**

### **Trạng thái**

* New  
* Screened  
* Rejected  
* Shortlisted  
* Interview Scheduled  
* Interviewed  
* Passed  
* Failed  
* Offered  
* Onboarded

### **Tính năng**

* Sort theo score  
* Filter theo:  
  * Score  
  * Skill  
* Bulk reject

---

## **5.4. Auto Filtering**

### **Mô tả**

HR có thể set threshold:

Ví dụ:

* Auto reject nếu score \< 50%

### **Hành vi**

* CV dưới threshold → vào Rejected  
* HR có thể override

---

## **5.5. Interview Scheduling**

### **Flow**

1. HR chọn candidate  
2. Click "Schedule Interview"  
3. Chọn:  
   * Interviewer  
   * Time  
   * Note  
4. HR:  
   * Gọi điện xác nhận ngoài hệ thống  
   * Mark "Scheduled"

---

## **5.6. Notification System**

### **Email gửi interviewer**

* Candidate info  
* CV  
* JD  
* Thời gian phỏng vấn

---

## **5.7. Interview Integration**

### **Mô tả**

Kết nối với hệ thống Interview Assistant Tool hiện tại

### **Yêu cầu**

* Có API hoặc deep link  
* Truyền:  
  * Candidate info  
  * JD

---

## **5.8. Interview Result**

### **Sau phỏng vấn**

Interviewer update:

* Pass  
* Fail  
* Note

---

## **5.9. Offer Management**

### **HR thực hiện**

* Gửi offer  
* Update trạng thái:  
  * Offered  
  * Accepted  
  * Rejected

---

## **5.10. Onboarding**

### **Khi ứng viên accept**

* Mark: Onboarded  
* Kết thúc pipeline

---

## **6\. Dashboard (khuyến nghị)**

* Tổng số CV  
* % pass rate  
* Time-to-hire  
* Conversion theo từng stage

---

## **7\. Non-functional Requirements**

### **Performance**

* Upload CV: \< 5s/file  
* AI parsing: \< 10s

### **Scalability**

* 1000+ CV/ngày

### **Security**

* Phân quyền truy cập  
* Bảo vệ dữ liệu CV

---

## **8\. Risk & lưu ý**

1. CV parsing phức tạp  
   → cần xử lý nhiều format khác nhau  
2. AI scoring dễ sai  
   → cần kết hợp rule-based  
3. UX phải đơn giản  
   → HR không có thời gian học tool

---

## **9\. MVP Scope**

Nên build trước:

* Upload CV  
* AI parse \+ score  
* Filter \+ reject  
* Pipeline cơ bản  
* Schedule interview (basic)

# Phase 4 \- BE feedbacks

|   |
| :---- |

**HITEK SOFTWARE JSC**

**Phase 4 \- BE feedbacks**

**Project:**  Hitek Testhub

**Document Type:**  Requirement Document

**Version:**  1.0

**Date:**  09/05/2026

**Classification:**  Internal, Do not distribute externally

**Table of Contents**

[**1\. Vấn đề và mục tiêu	3**](#heading=)

[Vấn đề hiện tại	3](#heading=)

[Mục tiêu kinh doanh	3](#heading=)

[Phạm vi đợt này (MVP)	3](#heading=)

[**2\. Chức năng 1 — AI tự sinh câu hỏi từ tài liệu	3**](#heading=)

[2.1. Người dùng và giá trị	3](#heading=)

[2.2. Cách hoạt động	3](#heading=)

[2.3. Yêu cầu chính	4](#heading=)

[2.4. Ví dụ minh hoạ	4](#heading=)

[**3\. Chức năng 2 — Phân loại bài test theo trình độ	4**](#heading=)

[3.1. Người dùng và giá trị	4](#heading=)

[3.2. Cách hoạt động	4](#heading=)

[3.3. Yêu cầu chính	5](#heading=)

[3.4. Quy ước phân loại trình độ (gợi ý)	5](#heading=)

[**4\. Chức năng 3 — Nhập câu hỏi thủ công	5**](#heading=)

[4.1. Người dùng và giá trị	5](#heading=)

[4.2. Cách hoạt động	5](#heading=)

[4.3. Yêu cầu chính	5](#heading=)

[**5\. Backlog Phase 2 (sẽ làm sau khi MVP ổn)	6**](#heading=)

[5.1. Hồ sơ đánh giá member (giá trị cao nhất sau MVP)	6](#heading=)

[5.2. Quản lý ngân hàng câu hỏi lâu dài	6](#heading=)

[5.3. Bảng xếp hạng theo kỳ test	6](#heading=)

[5.4. Dashboard so sánh nội bộ	6](#heading=)

[5.5. Chống gian lận nâng cao	6](#heading=)

[5.6. Đọc lại tài liệu sau test	6](#heading=)

[5.7. Đồng bộ khi tài liệu cập nhật	7](#heading=)

[5.8. Xuất báo cáo PDF cho HR	7](#heading=)

[**6\. Out of Scope	7**](#heading=)

## **1\. Vấn đề và mục tiêu**

### **Vấn đề hiện tại**

Mỗi team đều có bộ tài liệu chuẩn nội bộ (quy tắc làm việc, training, kiến thức chuyên môn) — vài chục đến vài trăm trang. Để biết member nắm được tài liệu này hay chưa, leader phải **tự ngồi soạn đề kiểm tra** rất tốn thời gian và khó duy trì định kỳ.

Hệ quả:

• Không có cơ sở dữ liệu để đánh giá năng lực kiến thức của team

• Khi review thử việc / lương / promote, leader phải đánh giá cảm tính

• Member không có công cụ tự kiểm tra mức độ hiểu của mình so với chuẩn

### **Mục tiêu kinh doanh**

• **Giảm 70% thời gian** soạn đề kiểm tra cho leader (so với làm thủ công)

• **Chuẩn hoá** việc đánh giá kiến thức member theo định kỳ tháng / quý

• Tạo dữ liệu nền cho **review thử việc, KPI, đánh giá lương / promote** ở các phase sau

• Giúp member chủ động cải thiện qua kết quả test

### **Phạm vi đợt này (MVP)**

3 nhóm chức năng cốt lõi:

• AI tự sinh bộ câu hỏi từ tài liệu nguồn (soạn và input bằng text)

• Phân loại bài test theo trình độ (Junior / Middle / Senior)

• Nhập câu hỏi thủ công (khi cần soạn ngoài AI)

Các tính năng nâng cao (hồ sơ đánh giá member, dashboard so sánh, ranking, ...) → backlog Phase 2 (xem mục 5). Các tính năng không làm → mục 6\.

## **2\. Chức năng 1 — AI tự sinh câu hỏi từ tài liệu**

### **2.1. Người dùng và giá trị**

• **Người dùng**: leader / quản lý team

• **Giá trị**: từ vài chục file tài liệu nguồn → hệ thống tự đề xuất bộ câu hỏi sẵn sàng dùng, leader chỉ cần duyệt thay vì soạn từ đầu

### **2.2. Cách hoạt động**

Quy trình 3 bước:

• **Nạp tài liệu**: leader chọn nguồn — upload file, link Google Drive, hoặc trỏ tới thư mục tài liệu nội bộ

• **Tóm tắt**: hệ thống đọc và tóm tắt tài liệu thành các điểm chính theo từng chủ đề; leader có thể duyệt / chỉnh / loại bỏ chủ đề trước khi sinh đề

• **Sinh câu hỏi và đưa vào ngân hàng**: hệ thống tạo câu hỏi từ phần đã duyệt; leader xem lại, sửa nếu cần, rồi xác nhận đưa vào ngân hàng câu hỏi của TestHub

### **2.3. Yêu cầu chính**

• Mỗi câu hỏi phải dẫn được đến đoạn tài liệu gốc (để member tra cứu khi sai)

• Leader luôn có quyền duyệt cuối: sửa nội dung câu, sửa đáp án, đổi mức độ, hoặc xoá

• Hỗ trợ chọn phạm vi (chỉ một số chủ đề) và mức độ mong muốn

• Khi tài liệu cập nhật, leader có thể chạy lại quy trình để bộ câu hỏi không bị lỗi thời

### **2.4. Ví dụ minh hoạ**

Để hình dung kết quả, các loại câu hệ thống có thể tạo:

• **Mức cơ bản**: câu trắc nghiệm kiểm tra việc nhớ quy định

• **Mức trung**: tình huống áp dụng quy định (đưa ra đoạn ngắn, hỏi vi phạm điểm nào)

• **Mức nâng cao**: tình huống phải đánh giá / đề xuất hướng xử lý

## **3\. Chức năng 2 — Phân loại bài test theo trình độ**

### **3.1. Người dùng và giá trị**

• **Người dùng**: leader (tạo bài test) \+ member (làm bài)

• **Giá trị**: bài test đúng với đối tượng — không hỏi quá khó hoặc quá dễ. Có thể đánh giá toàn diện 1 member bằng cách trộn nhiều mức độ trong 1 bài.

### **3.2. Cách hoạt động**

Khi leader tạo bài test:

• Đặt tên, mô tả, hạn nộp

• Chọn 1 trong 2 cách:

• **Một mức độ**: cả bài đều ở 1 mức (Junior / Middle / Senior)

• **Trộn nhiều mức độ**: chia tỷ lệ theo nhu cầu (mặc định 30% Junior — 50% Middle — 20% Senior)

• Chọn chủ đề muốn kiểm tra (tuỳ chọn)

• Đặt số câu và thời gian làm

• Hệ thống tự bốc câu hỏi từ ngân hàng theo cấu hình; leader có thể đổi câu nếu chưa vừa ý

• Gửi bài test cho member (theo cá nhân hoặc theo team)

Khi member làm bài:

• Nhận thông báo và link

• Thời gian được đếm ngược, hết giờ tự nộp

• Câu hỏi và đáp án được sắp ngẫu nhiên (chống nhìn bài giữa các member)

• Câu trắc nghiệm chấm tự động; câu mở do leader chấm tay

Khi xem kết quả:

• Tổng điểm và phân tích theo mức độ \+ theo chủ đề

• Member biết được mình yếu chủ đề nào để ôn lại

• Leader xem được bức tranh tổng thể của member

### **3.3. Yêu cầu chính**

• Mỗi câu chỉ thuộc một mức độ

• Khi ngân hàng không đủ câu cho cấu hình → cảnh báo và đề xuất giảm số câu hoặc đổi chủ đề

• Có thể bật trọng số: câu mức cao tính nhiều điểm hơn (tuỳ chọn)

• Member có thể tạm dừng và làm tiếp nếu chưa hết giờ

### **3.4. Quy ước phân loại trình độ (gợi ý)**

• **Junior**: nhớ quy tắc cơ bản

• **Middle**: áp dụng quy tắc vào tình huống cụ thể, phát hiện vi phạm

• **Senior**: đánh giá đánh đổi (trade-off), thiết kế / đề xuất giải pháp khi gặp vấn đề mới

Quy ước này có thể tuỳ chỉnh theo từng team.

## **4\. Chức năng 3 — Nhập câu hỏi thủ công**

### **4.1. Người dùng và giá trị**

• **Người dùng**: leader / người soạn câu hỏi

• **Giá trị**: bổ sung câu khi không muốn dùng AI (VD câu đặc thù, câu chỉ leader mới biết, câu đến từ kinh nghiệm thực tế của dự án)

### **4.2. Cách hoạt động**

Hai cách nhập:

• **Nhập từng câu**: form đơn giản, điền câu hỏi, đáp án, mức độ, chủ đề; lưu vào ngân hàng

• **Nhập hàng loạt**: tải file mẫu (định dạng đơn giản, có hướng dẫn), điền nhiều câu, upload lên; hệ thống kiểm tra và báo các câu lỗi / câu trùng để chỉnh trước khi lưu

### **4.3. Yêu cầu chính**

• Có file mẫu kèm hướng dẫn để người không rành tech vẫn dùng được

• Khi upload, hệ thống cảnh báo câu trùng câu đã có (so sánh nội dung) để leader quyết định bỏ qua / ghi đè / vẫn lưu mới

• Mỗi câu bắt buộc có: nội dung, đáp án, mức độ

• Tuỳ chọn: chủ đề, giải thích, nguồn tham khảo (giúp member tra cứu khi sai)

## **5\. Backlog Phase 2 (sẽ làm sau khi MVP ổn)**

Các tính năng đã được trao đổi nhưng để **phase sau** nhằm giữ MVP gọn và ra mắt nhanh.

### **5.1. Hồ sơ đánh giá member (giá trị cao nhất sau MVP)**

Mỗi member có hồ sơ tổng hợp dài hạn, lưu lịch sử làm bài \+ chỉ số đánh giá. Dùng cho:

• **Review thử việc**: chốt pass / fail có cơ sở dữ liệu thay vì cảm tính

• **Tính KPI quý**: cung cấp 1 chỉ số đánh giá kiến thức đóng góp vào KPI tổng

• **Review lương / promote**: leader có dữ liệu cứng (xu hướng tiến bộ, mức độ đạt được) khi đề xuất với BOD

• **Member tự cải thiện**: thấy điểm mạnh / yếu, biết phải ôn lại phần nào

Hồ sơ gồm: lịch sử bài test, xu hướng theo thời gian, chủ đề mạnh / yếu, gợi ý của hệ thống (chỉ là tham khảo, quyết định cuối vẫn ở leader / HR), ghi chú riêng của leader, xuất PDF / Excel cho HR.

### **5.2. Quản lý ngân hàng câu hỏi lâu dài**

• Sửa / xoá / khôi phục / nhân bản câu hỏi đã có trong ngân hàng

• Lịch sử thay đổi (ai sửa, sửa gì, lúc nào)

• Câu đang nằm trong bài test đã giao thì không bị thay đổi (giữ tính công bằng)

### **5.3. Bảng xếp hạng theo kỳ test**

• Top member có điểm cao nhất theo tháng / quý

• **Lưu ý**: cần thống nhất với HR / quản lý xem có nên public xếp hạng không, để tránh tạo áp lực ngược trong văn hoá team

### **5.4. Dashboard so sánh nội bộ**

• Trang lịch sử cá nhân cho member tự xem

• Dashboard cho leader so sánh các member trong team theo thời gian

• Theo dõi tiến bộ kỳ trước → kỳ sau

### **5.5. Chống gian lận nâng cao**

• Phát hiện dán nội dung từ bên ngoài cho câu code

• Cảnh báo khi member rời tab trong lúc làm bài

• Giới hạn thời gian từng câu (nếu cần)

### **5.6. Đọc lại tài liệu sau test**

• Khi member sai câu → 1 cú click mở đúng đoạn tài liệu gốc liên quan

• Hệ thống tự gợi ý "phần cần ôn" cho lần test sau

### **5.7. Đồng bộ khi tài liệu cập nhật**

• Khi tài liệu nguồn được sửa → leader được nhắc cập nhật bộ câu hỏi

• Hệ thống đánh dấu các câu hỏi thuộc đoạn đã đổi để rà soát lại

### **5.8. Xuất báo cáo PDF cho HR**

• Sau khi chấm xong 1 bài test, xuất PDF kết quả member: thông tin \+ điểm \+ nhận xét, theo mẫu chuẩn HR

## **6\. Out of Scope**

• **Quay video / chụp màn hình lúc làm bài** (proctoring): liên quan quyền riêng tư, không phù hợp test nội bộ

• **Đa tổ chức / kiểu SaaS**: TestHub là công cụ nội bộ, không phải dịch vụ thương mại

• **Ứng dụng mobile native**: web responsive đã đủ

• **Hệ thống điểm thưởng / huy hiệu (gamification)**: dễ tạo bias đánh giá năng lực, không phải mục tiêu công cụ

*Hitek Software JSC · Phase 4 \- BE feedbacks v1.0 · 09/05/2026*

[image1]: <data:image/png;base64,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>
