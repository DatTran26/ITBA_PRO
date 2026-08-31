# Project Features & Implementation Notes

> **Working notes, không phải source truth.** Một số mục mô tả branch hoặc file
> chưa tồn tại trong source hiện tại. Xác minh từng claim bằng `rg`, migration và
> route owner trước khi dùng để lập kế hoạch hoặc báo cáo trạng thái.

> **Rule:** File `note.md` này chỉ được sử dụng khi có yêu cầu ghi chú trực tiếp từ người dùng. Tất cả các tính năng hoặc thay đổi được yêu cầu ghi chú từ người dùng sẽ được cập nhật và lưu trữ trực tiếp tại file `note.md` này để tiện theo dõi và ghi nhớ. Khi một nhánh chức năng đã được yêu cầu merge (hợp nhất), xóa bỏ toàn bộ thông tin/ghi chú liên quan đến tính năng đó khỏi file `note.md` để đảm bảo file luôn gọn gàng và chỉ tập trung vào các nhánh chưa được hợp nhất.

---

## 1. Favourite Questions Library (Tab Yêu thích)

> **Nhánh phát triển:** `feat/question-bank-favourites`

### Giao diện (UI)

* **Tab Favourites (`QuestionBankFavouritesTab`):**
  * Tích hợp vào màn hình quản lý Question Bank (`QuestionBankClient`).
  * Hiển thị danh sách các câu hỏi đã được lưu làm yêu thích của tổ chức.
  * Hỗ trợ bộ lọc tìm kiếm (`q`), lọc độ khó (`level`) và lọc theo phòng ban (`department`).
  * Hiển thị các chỉ số thống kê (KPI) gồm: tổng số câu hỏi yêu thích, số lượng câu hỏi thuộc Junior, Middle, Senior.
* **Tích hợp bảng câu hỏi chính (`QuestionBankTable`):**
  * Bổ sung icon Trái tim tương tác trong cột Actions của bảng câu hỏi.
  * Trái tim màu đỏ (đầy) biểu thị câu hỏi đã được yêu thích, trái tim màu xám (rỗng) biểu thị chưa được lưu.
  * Bấm vào trái tim để lưu/hủy yêu thích ngay tại chỗ.
* **Tích hợp Pipeline AI (`AiQuestionCard`):**
  * Hỗ trợ đánh dấu yêu thích khi sinh câu hỏi tự động từ tài liệu bằng AI trước khi nhấn duyệt (approve).

### Backend & Database

* **Database Migration (`supabase/migrations/20260604000001_favourite_questions.sql`):**
  * Tạo bảng `favourite_questions` liên kết ngoại `question_bank_id` (`on delete cascade`).
  * Kích hoạt Row-Level Security (RLS) để cô lập dữ liệu theo `organization_id` của từng tổ chức.
* **API Route (`src/app/api/question-bank/favourites/route.ts`):**
  * `GET`: Lấy danh sách câu hỏi yêu thích có phân trang và bộ lọc.
  * `POST`: Lưu câu hỏi từ bank vào danh sách yêu thích (hạn chế trùng lặp).
  * `DELETE`: Xóa câu hỏi khỏi danh sách yêu thích.
* **AI Question Approve Handler (`src/app/api/document-sources/[id]/approve/route.ts`):**
  * Tự động phát hiện cờ `is_favourite: true` từ client để ghi nhận trực tiếp vào bảng `favourite_questions` khi phê duyệt.

---

## 2. Interview Room (Phòng Phỏng vấn)

> **Nhánh phát triển:** `dev` (Commit `79d0a58` và `fe0ce74`)

### Giao diện (UI)

* **Giao diện Phỏng vấn (`src/app/dashboard/interview-room/[sessionId]/interview-room-session-client.tsx`):**
  * Tích hợp tính năng ghi âm trực tiếp (Audio Recording) trong phòng phỏng vấn.
  * Hiển thị thời gian ghi âm (recording timer) và các trạng thái ghi âm động.
  * Bổ sung nút bấm kích hoạt phân tích AI (AI Analysis) sau khi cuộc phỏng vấn kết thúc.
  * Hiển thị kết quả Transcription (Bản ghi chép hội thoại) và báo cáo AI Evaluation (Đánh giá từ AI) ngay trên giao diện.

### Backend & Database

* **Database Migration (`supabase/migrations/20260604000000_interview_recording.sql`):**
  * Thêm các trường dữ liệu mới vào bảng `interview_sessions`: `recording_url` (đường dẫn file ghi âm), `transcript` (nội dung hội thoại dịch từ ghi âm), và `ai_summary` (báo cáo đánh giá tổng hợp của AI).
  * Tạo storage bucket riêng tư tên `'interview-recordings'` để lưu trữ file âm thanh phỏng vấn (giới hạn file 100MB, chỉ chấp nhận định dạng âm thanh webm, wav, mp3, mp4, ogg, m4a).
  * Thiết lập chính sách bảo mật RLS trên storage bucket chỉ cho phép người dùng có vai trò phù hợp (`hr`, `recruiter`, `interviewer`, `admin`, `super_admin`) truy cập/tải lên.
* **API Recording Upload (`src/app/api/recruitment/interview-room/sessions/[id]/recording/route.ts`):**
  * Tiếp nhận file âm thanh từ Client và upload vào storage bucket `'interview-recordings'`. Cập nhật `recording_url` tương ứng cho session.
* **API AI Analyze (`src/app/api/recruitment/interview-room/sessions/[id]/analyze/route.ts`):**
  * Trích xuất file ghi âm từ storage, gửi qua OpenAI Whisper hoặc Gemini API để tiến hành Speech-to-Text (Transcription).
  * Chạy mô hình ngôn ngữ lớn để phân tích câu trả lời của ứng viên, đánh giá điểm mạnh/điểm yếu và chấm điểm năng lực, lưu kết quả vào cột `ai_summary` và `transcript`.

### PDF Export Report

* **PDF Generator (`src/lib/generate-result-pdf.ts`):**
  * Hỗ trợ xuất báo cáo PDF chính thức cho buổi phỏng vấn.
  * Đính kèm chi tiết kết quả cuộc hội thoại, điểm số các câu hỏi, bản ghi chép chi tiết (`transcript`) và nhận xét chuyên sâu từ AI (`ai_summary`).

---

## 3. Sidebar Navigation Bug & Home Landing Page Refinement

> **Nhánh phát triển:** `dev`

### Giao diện (UI) & Trải nghiệm (UX)

* **Khắc phục lỗi hiển thị Sidebar:** Cập nhật hàm `renderSidebar()` để quản lý động các class hiển thị `lg:block` và `hidden` khi chuyển đổi giữa các tab. Sidebar giờ đây được ẩn đi một cách triệt để và mượt mà khi người dùng quay về các tab không có sidebar như Trang chủ (`home`).
* **Nâng cấp Trang chủ (Home Landing Page):** Thiết kế lại giao diện trang chủ thành một Dashboard tuyển dụng cao cấp theo đúng chuẩn thiết kế "Deep Intelligence":
  * Thêm Hero Banner giới thiệu hệ thống AI Kép hiện đại.
  * Hiển thị bảng số liệu KPI trực quan (Số lượng CV, Match Score trung bình, Số lượng phòng phỏng vấn AI, Số lượng câu hỏi động đã tạo).
  * Tích hợp khung mô phỏng tương tác "Trải nghiệm trích xuất CV AI" chạy hiệu ứng thanh tiến trình thực tế kèm kết quả phân tích giả lập dạng popup cực kỳ mượt mà.
  * Thiết kế Bento Grid trình bày các tính năng nổi bật: Phòng phỏng vấn AI Whisper và Thư viện câu hỏi yêu thích.

---

## 4. Tài Khoản & Vai Trò (Account & Roles Management)

> **Nhánh phát triển:** `dev`

### Giao diện (UI) & Trải nghiệm (UX)

* **Tab Tài Khoản & Vai Trò (`roles`):**
  * Tích hợp tab "Tài Khoản & Vai Trò" vào header chính của Hitek TestHub.
  * Thiết kế thanh điều hướng sidebar bên trái hiển thị trực quan 6 vai trò hệ thống: Super Admin, Admin, Leader, HR, Recruiter, Interviewer.
  * Hiển thị nội dung chi tiết quyền hạn tương ứng của vai trò đang chọn: mô tả tổng quan, badge định danh, các sidebar group, trang hiển thị (`name`, `path`, `desc`, `features`).
  * Tài khoản kiểm thử staging lấy từ secret manager của đội — không lưu email/mật khẩu trong source.
  * Tích hợp Ma Trận Quyền Truy Cập (Access Matrix) hiển thị đối chiếu chi tiết quyền thao tác trên các phân hệ chức năng.
* **Tối ưu hóa Điều hướng:**
  * Hoàn thiện cơ chế dọn dẹp container sidebar (`innerHTML = ''`, `display = 'none'`) giúp sửa hoàn toàn lỗi layout sidebar bị hiển thị thừa khi chuyển đổi giữa các tab có/không sử dụng sidebar (Home, Todo, Roles).
