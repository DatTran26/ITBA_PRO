# 🎙️ KỊCH BẢN THUYẾT TRÌNH ĐÔI (2 NGƯỜI): DỰ ÁN DOWN TOWN
**Đề tài:** Hệ điều hành Doanh nghiệp số Quản trị Nhân sự Tích hợp AI (AI-First HRMS)  
**Đơn vị:** Nhóm DOWN TOWN — Khoa Công nghệ Thông tin, Đại học Công nghệ TP.HCM (HUTECH)  
**Cuộc thi:** Cuộc thi Xây dựng Hệ điều hành Doanh nghiệp số AI (Vòng Bán kết Online)  
**Khẩu hiệu:** SÁNG TẠO — ỨNG DỤNG — DẪN ĐẦU CHUYỂN ĐỔI SỐ  
**Thời lượng chuẩn:** 6 – 7 phút thuyết trình + 5 phút hỏi đáp phản biện  
**File trình chiếu:** `thuyet_trinh_7_slide.html` (Xem trực tiếp: http://localhost:8089/thuyet_trinh_7_slide.html)

---

## 👥 PHÂN VAI & PHÂN CHIA NHIỆM VỤ

| Vai trò | Thành viên đảm nhiệm | Trách nhiệm chính |
| :--- | :--- | :--- |
| **Người 1 (P1)** | **Product Lead / Trưởng nhóm** | Mở màn cuốn hút, nêu nỗi đau thực tế của doanh nghiệp, triết lý 4 khâu vận hành, tính khả thi kinh doanh 5W1H, lộ trình thương mại và chốt hạ thông điệp sứ mệnh. |
| **Người 2 (P2)** | **Tech Lead / Kỹ sư AI** | Trình bày chuyên sâu 4 trụ cột công nghệ lõi (Document AI OCR, TestHub khảo thí, FastFace 6 góc, YOLOv8) và kiến trúc điều phối thông minh Model Controller (Hybrid On-premise). |

---

## 🎬 KỊCH BẢN CHI TIẾT TỪNG SLIDE

---

### 🌟 TRANG ĐẦU (COVER SLIDE): NHÓM DOWN TOWN — HUTECH
* **Người trình bày:** **Người 1 (Product Lead)**  
* **Thời lượng:** ~35 giây  
* **Hành động & Ngôn ngữ cơ thể:** Đứng thẳng, tươi cười, hướng mắt bao quát toàn bộ Hội đồng Giám khảo, hai tay mở tự nhiên, giọng nói tự tin, hào sảng.

> **[P1 - Lời thoại]:**  
> "Kính chào Hội đồng Ban Giám khảo, Quý Thầy Cô Khoa Công nghệ Thông tin trường Đại học HUTECH cùng toàn thể các đội thi!  
> 
> Chúng tôi là nhóm **DOWN TOWN**. Hôm nay, đại diện cho tinh thần *'Sáng tạo — Ứng dụng — Dẫn đầu chuyển đổi số'*, nhóm xin được trình bày đề tài: **DOWN TOWN — Hệ điều hành Quản trị Nhân sự AI-First khép kín 4 khâu**, một giải pháp giải quyết triệt để sự đứt gãy trong dòng chảy vận hành nhân sự số của doanh nghiệp Việt Nam hiện nay."  
> 
> *(P1 hướng tay về phía màn hình chiếu)*  
> *"Sau đây, xin kính mời Ban Giám khảo cùng bước vào bài toán thực tế mà chúng tôi bắt đầu."*

👉 **[Hành động]:** **Bấm phím `Right Arrow` (hoặc Click) chuyển sang SLIDE 1.**

---

### 📌 SLIDE 1: Một Đề Tài Là Một Chuỗi Bài Toán Nhân Sự
* **Người trình bày:** **Người 1 (Product Lead)**  
* **Thời lượng:** ~50 giây  
* **Hành động & Ngôn ngữ cơ thể:** Giọng nói trầm xuống, thể hiện sự đồng cảm với nỗi đau thực tế của người làm nhân sự; nhấn mạnh vào các con số lãng phí.

> **[P1 - Lời thoại]:**  
> "Kính thưa Hội đồng, hãy hình dung một buổi sáng thứ Hai điển hình của chị Lan – Trưởng phòng Nhân sự tại một doanh nghiệp quy mô 150 người.  
> 
> Vừa bước vào phòng, chị phải mở cùng lúc **5 cửa sổ làm việc rời rạc**: Zalo để tải hàng chục file CV, Excel để rà soát bảng công, phần mềm máy quét vân tay vừa báo lỗi, email thì ngập tràn khiếu nại về chấm công muộn, và một sấp hồ sơ quyết định bổ nhiệm đang chờ thẩm định thể thức pháp lý.  
> 
> Thực tế cho thấy, **doanh nghiệp không hề thiếu phần mềm**, nhưng họ đang lãng phí hơn **30% thời gian** mỗi ngày chỉ để làm chiếc 'cầu nối thủ công' sao chép dữ liệu giữa các phần mềm độc lập. Khi quy mô tăng gấp đôi, chuỗi vận hành này sẽ ngay lập tức bị tê liệt và đứt gãy."  
> 
> *(P1 nhấn mạnh câu chuyển ý)*  
> *"Vậy làm thế nào để hàn gắn các mắt xích đứt gãy này thành một dòng chảy duy nhất và có khả năng tự học? DOWN TOWN chính là lời giải trọn vẹn!"*

👉 **[Hành động]:** **Bấm chuyển sang SLIDE 2.**

---

### 📌 SLIDE 2: Bốn Khâu Của Mọi Đề Tài: Dự Báo, Quyết Định, Hành Động Và Học Lại
* **Người trình bày:** **Người 1 (Product Lead)**  
* **Thời lượng:** ~55 giây  
* **Hành động & Ngôn ngữ cơ thể:** Giọng nói dứt khoát, dùng tay chỉ vào biểu đồ vòng lặp 4 khâu trên slide.

> **[P1 - Lời thoại]:**  
> "Khác với các phần mềm HRMS truyền thống vốn chỉ là những bảng biểu CRUD tĩnh để nhập liệu, DOWN TOWN được chúng tôi kiến trúc theo đúng **chuẩn mực 4 khâu của một Hệ điều hành thông minh**:  
> 
> 1. **Khâu Dự báo:** AI chủ động trích xuất thông tin, phát hiện các bất thường về chấm công và ước lượng năng lực ứng viên từ dữ liệu thô.  
> 2. **Khâu Quyết định:** Hệ thống đề xuất gợi ý xếp hạng theo quy tắc minh bạch, giữ vai trò trợ lý thông minh và để con người giữ quyền phê duyệt cuối cùng (*Human-in-the-loop*).  
> 3. **Khâu Hành động:** Biến quyết định thành kết quả ngoài đời thực chỉ bằng **1 click chuột** — tự động gửi thư mời phỏng vấn, ban hành văn bản pháp quy chuẩn Nghị định 30, hoặc cập nhật thẳng vào bảng lương.  
> 4. Và điểm tạo nên sự khác biệt vượt trội nhất chính là **Khâu Học lại:** Mỗi thao tác chấp thuận hay chỉnh sửa của người quản lý đều trở thành dữ liệu phản hồi vàng, giúp các mô hình AI tự tối ưu hóa và thông minh hơn mỗi ngày.  
> 
> *(P1 quay sang Người 2, giơ tay mời)*  
> *"Để giúp Hội đồng nhìn thấy rõ các công nghệ AI này đã được hiện thực hóa vào sản phẩm thực tế như thế nào, sau đây xin mời bạn Tech Lead của nhóm trình bày chi tiết."*

👉 **[Hành động]:** **Người 1 lùi lại nửa bước. Người 2 bước lên vị trí chính, gật đầu chào Giám khảo và bấm chuyển sang SLIDE 3.**

---

### 📌 SLIDE 3: Bốn Trụ Cột Vận Hành Giải Quyết Trọn Vẹn Chuỗi Tác Nghiệp Trọng Yếu
* **Người trình bày:** **Người 2 (Tech Lead / AI Engineer)**  
* **Thời lượng:** ~60 giây  
* **Hành động & Ngôn ngữ cơ thể:** Tác phong đĩnh đạc, tự tin về kỹ thuật, mắt nhìn thẳng, giọng dứt khoát, tràn đầy năng lượng thực chiến.

> **[P2 - Lời thoại]:**  
> "Kính thưa Ban Giám khảo, tại DOWN TOWN, chúng tôi không vẽ AI trên slide mà đã hiện thực hóa thành **4 trụ cột công nghệ cụ thể đã có mã nguồn chạy thử nghiệm (Functional Prototype)**:  
> 
> * **Thứ nhất — Tuyển dụng với Document AI & Nghị định 30:** Quét và bóc tách dữ liệu CV, hợp đồng chỉ trong đúng **2.3 giây** bằng Google Gemini Vision VLM có khung đối chiếu trực quan (*Visual Grounding*), đồng thời tự động thẩm định 9 thành phần thể thức văn bản hành chính theo chuẩn Nghị định 30/2020/NĐ-CP.  
> * **Thứ hai — Khảo thí tự động với TestHub AI:** Tự động sinh đề thi trắc nghiệm thích ứng chuyên môn IT/BA theo từng level chỉ trong **15 phút**, có phòng phỏng vấn Speech-to-Text Whisper AI ghi nhận giọng nói và chấm điểm tự động.  
> * **Thứ ba — Điểm danh sinh trắc học FastFace:** Nhận diện khuôn mặt đa góc nghiêng (6 góc độ) siêu nhạy chỉ **0.3 giây**, tích hợp cơ chế Dual Anti-Spoofing ngăn chặn triệt để gian lận bằng ảnh in hay màn hình điện thoại.  
> * **Thứ tư — Giám sát an toàn nơi làm việc với YOLOv8:** Theo dõi vi phạm quy chuẩn văn phòng trong thời gian thực bằng camera thị giác máy tính on-premise."  
> 
> *(P2 chuyển ý)*  
> *"Tuy nhiên, câu hỏi đặt ra là: Vận hành cùng lúc 4 module AI phức tạp này, làm sao để hệ thống không ngốn hàng ngàn USD tiền API mỗi tháng và bảo đảm an toàn dữ liệu nội bộ? Câu trả lời nằm ở kiến trúc sau đây."*

👉 **[Hành động]:** **Bấm chuyển sang SLIDE 4.**

---

### 📌 SLIDE 4: Bảy Bài Toán Nối Nhau Trong Một Đề Tài: Kiến Trúc Model Controller
* **Người trình bày:** **Người 2 (Tech Lead / AI Engineer)**  
* **Thời lượng:** ~60 giây  
* **Hành động & Ngôn ngữ cơ thể:** Hướng tay về sơ đồ luồng dữ liệu Model Controller; giọng hào hứng, thể hiện sự am hiểu sâu sắc về kiến trúc phần cứng.

> **[P2 - Lời thoại]:**  
> "Điểm tự hào lớn nhất về mặt kỹ thuật của DOWN TOWN chính là **Cơ chế điều phối thông minh Model Controller** theo mô hình lai *Hybrid Architecture*:  
> 
> Chúng tôi **hoàn toàn không phụ thuộc thụ động vào OpenAI hay bên thứ ba**.  
> * Đối với các tác vụ có tần suất hoạt động liên tục 24/7 như Face ID điểm danh hay YOLOv8 nhận diện hành vi, Model Controller định tuyến xử lý **100% On-premise cục bộ** trên máy chủ nội bộ. Điều này mang lại 2 giá trị sống còn: **Chi phí API bằng 0** và **Dữ liệu sinh trắc học, hình ảnh nhân sự được bảo mật tuyệt đối**, không bị gửi ra Internet.  
> * Chỉ khi cần xử lý các tác vụ phân tích ngôn ngữ phức tạp như thẩm định luật hay sinh đề thi chuyên sâu, hệ thống mới mã hóa ẩn danh dữ liệu và định tuyến tới các LLM lớn trên Cloud.  
> 
> Nhờ đó, tổng chi phí duy trì hạ tầng máy chủ cho một doanh nghiệp 200 nhân sự chỉ dao động **dưới 2 triệu đồng/tháng** — rẻ hơn rất nhiều so với chi phí thuê nhân sự nhập liệu thủ công."  
> 
> *(P2 quay sang Người 1)*  
> *"Và để chứng minh tính khả thi kinh doanh cùng lộ trình đưa giải pháp này ra thị trường, xin mời bạn Product Lead tiếp tục chia sẻ."*

👉 **[Hành động]:** **Người 2 nhường lại vị trí trung tâm cho Người 1. Người 1 bước lên và bấm chuyển sang SLIDE 5.**

---

### 📌 SLIDE 5: Bàn Tròn Khả Thi 5W1H: Kỹ Thuật, Vận Hành, Chi Phí Và Pháp Lý
* **Người trình bày:** **Người 1 (Product Lead)**  
* **Thời lượng:** ~50 giây  
* **Hành động & Ngôn ngữ cơ thể:** Phong thái tự tin của một nhà quản trị sản phẩm, nói mạch lạc, dứt khoát từng luận điểm.

> **[P1 - Lời thoại]:**  
> "Cảm ơn Tech Lead. Kính thưa Ban Giám khảo, một giải pháp công nghệ tốt chỉ có ý nghĩa khi nó giải quyết được bài toán kinh doanh thực tế. Chúng tôi đã thẩm định DOWN TOWN qua **ma trận khả thi 5W1H toàn diện**:  
> 
> * **Về Khách hàng mục tiêu (Who):** Tập trung vào các doanh nghiệp vừa và nhỏ (SME) từ 50 đến 1000 nhân sự — nhóm khách hàng đang chịu nỗi đau chuyển đổi số lớn nhất nhưng không đủ ngân sách mua giải pháp đắt đỏ của nước ngoài.  
> * **Về Kỹ thuật (How):** Nền tảng Next.js 16 kết hợp FastAPI và hàng đợi phân tán đảm bảo xử lý mượt mà hàng ngàn request đồng thời.  
> * **Về Vận hành (When/Where):** Giao diện được tối ưu theo triết lý *'One-Click Action'*, bộ phận HR chỉ mất **2 giờ làm quen** là có thể làm chủ hoàn toàn hệ thống.  
> * **Về Pháp lý (Compliance):** Chúng tôi tuân thủ nghiêm ngặt **Nghị định 13/2023 về Bảo vệ dữ liệu cá nhân** với cơ chế xin quyền rõ ràng, và chuẩn hóa văn bản theo **Nghị định 30/2020/NĐ-CP**."  
> 
> *(P1 chuyển ý)*  
> *"Vậy lộ trình hiện thực hóa và cam kết hiệu quả của chúng tôi được đo lường bằng những con số nào?"*

👉 **[Hành động]:** **Bấm chuyển sang SLIDE 6.**

---

### 📌 SLIDE 6: Làm Trọn Bốn Bài, Rút Gọn Ba Bài: Lộ Trình Hiện Thực Hóa
* **Người trình bày:** **Người 1 (Product Lead)**  
* **Thời lượng:** ~50 giây  
* **Hành động & Ngôn ngữ cơ thể:** Nhìn thẳng vào Giám khảo, giọng chắc nịch, nhấn mạnh các mốc thời gian và con số KPI.

> **[P1 - Lời thoại]:**  
> "Nhóm DOWN TOWN xác lập lộ trình triển khai rõ ràng qua 3 giai đoạn trong năm 2026:  
> 
> * **Quý 2/2026:** Triển khai thử nghiệm thực tế (Pilot) tại **3 doanh nghiệp đối tác**, tập trung thẩm định độ chính xác của 2 khâu nóng nhất: Tuyển dụng (OCR) và Chấm công (FastFace).  
> * **Quý 3/2026:** Hoàn thiện module Thị giác máy tính YOLOv8 và tối ưu hóa hệ thống khảo thí TestHub AI.  
> * **Quý 4/2026:** Chính thức đóng gói thương mại hóa (SaaS / Private On-premise) cho các doanh nghiệp SME.  
> 
> Giá trị mà DOWN TOWN mang lại được cam kết cụ thể bằng các chỉ số đo lường thực tế: **Cắt giảm 70% thời gian sàng lọc hồ sơ**, rút ngắn thời gian chốt bảng công từ **3 ngày xuống còn 15 phút**, và triệt tiêu hoàn toàn sai sót đối soát bảng lương."  
> 
> *(P1 nâng cao tone giọng chuẩn bị kết bài)*  
> *"Và để khép lại bài thuyết trình hôm nay, nhóm xin gửi tới Hội đồng thông điệp cốt lõi định hình nên sứ mệnh của DOWN TOWN."*

👉 **[Hành động]:** **Bấm chuyển sang SLIDE 7.**

---

### 📌 SLIDE 7: DOWN TOWN: Tương Lai Của Quản TrI Nhân Sự Kỷ Nguyên Trí Tuệ Nhân Tạo
* **Người trình bày:** **Cả 2 Người (Người 1 chốt thông điệp chính, Người 2 cùng bước lên chào kết)**  
* **Thời lượng:** ~45 giây  
* **Hành động & Ngôn ngữ cơ thể:** Hai người đứng song song ngang hàng nhau, thể hiện tinh thần đồng đội thống nhất và sẵn sàng phản biện.

> **[P1 - Lời thoại]:**  
> "Kính thưa Hội đồng Giám khảo,  
> **DOWN TOWN không bán một phần mềm quản lý nhân sự tĩnh.** Chúng tôi mang đến cho doanh nghiệp một **Hệ điều hành nhân sự tự học khép kín 4 khâu** — nơi AI và con người cộng sinh chặt chẽ để giải phóng sức lao động thủ công và kiến tạo giá trị thực.  
> 
> Toàn bộ giao diện quản trị, mã nguồn API và mô hình AI mà chúng tôi trình bày hôm nay đều đã sẵn sàng chạy thực nghiệm trên máy chủ cục bộ, sẵn sàng demo trực tiếp ngay tại hội đồng."  
> 
> **[P2 - Lời thoại]:**  
> "Đội ngũ DOWN TOWN xin chân thành cảm ơn Ban Giám khảo và Quý Thầy Cô đã chú ý lắng nghe!"  
> 
> **[Cả 2 người đồng thanh]:**  
> *"Chúng tôi rất sẵn lòng và hào hứng đón nhận các câu hỏi đóng góp từ Hội đồng!"*  
> 
> *(Cả 2 cùng cúi đầu chào lịch sự, mỉm cười tự tin chờ hiệu lệnh câu hỏi từ Giám khảo).*

---

## 🎯 PHẦN PHỤ LỤC: KỊCH BẢN PHÂN CÔNG HỎI ĐÁP (Q&A BACKUP)

### ❓ Câu hỏi 1 (Giám khảo hỏi về tính cấp thiết / Nghiệp vụ):
> **Giám khảo:** *"Nếu bỏ AI đi thì phòng nhân sự truyền thống vẫn đang chạy bình thường, tại sao doanh nghiệp bắt buộc phải chuyển đổi sang DOWN TOWN?"*
* **Người phụ trách trả lời:** **Người 1 (Product Lead)**
* **Ý chính trả lời:**  
  *"Dạ thưa Thầy/Cô, doanh nghiệp không chết vì thiếu công cụ mà đang kiệt quệ vì chi phí cơ hội và sai sót vận hành tích lũy. Khi quy mô từ 50 tăng lên 200 nhân sự, việc phụ thuộc vào Excel và thao tác thủ công sẽ làm gãy chuỗi quản trị; DOWN TOWN khép kín 4 khâu giúp giải phóng 70% thời gian nhập liệu để HR tập trung vào đào tạo và phát triển con người."*

---

### ❓ Câu hỏi 2 (Giám khảo hỏi về Kiến trúc / Công nghệ):
> **Giám khảo:** *"Tại sao các bạn lại tự xây dựng module Thị giác máy tính và Khảo thí thay vì tích hợp các API có sẵn như OpenAI hay giải pháp có sẵn trên thị trường?"*
* **Người phụ trách trả lời:** **Người 2 (Tech Lead)**
* **Ý chính trả lời:**  
  *"Dạ thưa Ban Giám khảo, các giải pháp rời rạc trên thị trường biến dữ liệu doanh nghiệp thành các ốc đảo độc lập và tốn chi phí bản quyền khổng lồ mỗi tháng. Việc tự chủ kiến trúc với cơ chế Model Controller giúp DOWN TOWN ưu tiên chạy các mô hình nguồn mở như FastFace và YOLOv8 cục bộ On-premise để bảo mật tuyệt đối dữ liệu sinh trắc học và giữ chi phí vận hành ở mức gần như bằng 0."*

---

### ❓ Câu hỏi 3 (Giám khảo hỏi về Khả năng thử nghiệm thực tế):
> **Giám khảo:** *"Dự án này các bạn đã làm được đến đâu hay chỉ mới dừng lại ở mức ý tưởng thiết kế giao diện?"*
* **Người phụ trách trả lời:** **Người 2 (Tech Lead) mở máy tính demo:**
* **Ý chính trả lời:**  
  *"Dạ thưa Thầy/Cô, toàn bộ dự án đã là một Functional Prototype hoàn chỉnh. Hiện tại máy chủ Backend FastAPI đang chạy tại cổng 8000, giao diện Next.js chạy tại cổng 3000. Chúng em đã tích hợp thành công Gemini Vision OCR quét văn bản 2.3 giây và nhận diện khuôn mặt trực tiếp qua webcam. Em xin phép được thao tác demo trực tiếp ngay trên màn hình để Thầy/Cô kiểm chứng ạ!"*

---

### 💡 MẸO NHỎ ĐỂ ĐẠT ĐIỂM TUYỆT ĐỐI KHI THUYẾT TRÌNH:
1. **Phím tắt hỗ trợ:** Trong lúc thuyết trình trên trình duyệt tại `http://localhost:8089/thuyet_trinh_7_slide.html`, có thể nhấn phím **`N`** bất kỳ lúc nào để mở/đóng ngăn kịch bản bí mật (Presenter Drawer) ngay dưới chân slide nếu cần nhắc bài.
2. **Giao tiếp mắt (Eye contact):** 70% thời gian nhìn vào Ban Giám khảo, chỉ 30% thời gian nhìn màn hình để xác nhận slide đã chuyển đúng.
3. **Chuyển giao nhịp nhàng:** Khi Người 1 nói dứt câu chuyển giao (*"Sau đây xin mời Tech Lead..."*), Người 2 lập tức bước lên và bắt nhịp trong vòng 1 giây, tránh khoảng lặng chết (dead air).
