# -*- coding: utf-8 -*-
"""
Generator for DOWN TOWN 7-Slide Presentation
Faithfully styled after the MLAI Hackathon 2026 Training Slide Deck (training-DNSO - MLAI.pdf)
and specifically Slide 1: "Một đề tài là một chuỗi bài toán" (user reference screenshot):
- Sun glow orb & organic desert dune SVG curves with minimalist flagpole
- Dot matrix pattern (10px grid) & top-right vertical words (IDEAS / PEOPLE / GREATER IMPACT)
- Bottom-right vertical words (Ý TƯỞNG / HÔM NAY / GIÁ TRỊ / NGÀY MAI)
- Signature thick solid orange accent line directly below the main title
- Slide 1: 5-card horizontal problem flow (Bài toán 1..5) with dashed feedback loop [học lại từ kết quả thật] + 3 Foundation partner cards (Document AI, TestHub AI, Vision Biometrics)
- Slide 2: Authentic MLAI 4-khâu horizontal loop (1. Dự báo, 2. Quyết định, 3. Hành động, 4. Học lại) + Jury question callout
- Slide 3: Persona card on left + 5 numbered orange circle pill rows on right (recreating Slide 3 of MLAI PDF)
- Slide 4: Model Controller & Technology Architecture Split (recreating Slide 4 of MLAI PDF)
- Slide 5: 5W1H Structured Feasibility Matrix
- Slide 6: Horizontal 3-Phase Roadmap + Big Stat Callouts (70%, 100%) + "Nói thật với giám khảo" banner (recreating Slide 7 of MLAI PDF)
- Slide 7: Executive Manifesto & Q&A Readiness
- Exactly 7 slides, strictly 5 bullets per slide, each bullet 8-16 words.
"""
import os
import sys

if sys.stdout:
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SLIDES_DATA = [
    {
        "index": 1,
        "track_category": "CLB MÃ NGUỒN MỞ HUTECH // BUỔI TRAINING MLAI HACKATHON 2026",
        "track_badge": "TRACK 01: NỖI ĐAU HR",
        "title": "Một Đề Tài Là Một Chuỗi Bài Toán Nhân Sự",
        "subtitle": "Thực trạng phân mảnh dữ liệu khiến chuỗi tác nghiệp quản trị bị đứt gãy nghiêm trọng",
        "persona": {
            "title": "Chị Lan - Trưởng phòng Nhân sự",
            "scope": "SME 150 nhân sự · 5 phần mềm rời rạc",
            "card1_label": "Thứ Hai: chốt bảng công",
            "card1_sub": "đối soát thủ công 50 ca",
            "card2_label": "Mỗi ngày: lọc 50 hồ sơ",
            "card2_sub": "mở 5 cửa sổ Zalo, Excel"
        },
        "bullets": [
            {
                "num": "1",
                "label": "Bài toán 1",
                "sub": "Khởi tạo vấn đề",
                "icon": "💡",
                "khau": "khâu: dự báo",
                "tag_class": "badge-pred",
                "text": "Doanh nghiệp lãng phí 30% thời gian do các phần mềm nhân sự rời rạc."
            },
            {
                "num": "2",
                "label": "Bài toán 2",
                "sub": "Phân tích và dự báo",
                "icon": "📊",
                "khau": "khâu: dự báo",
                "tag_class": "badge-pred",
                "text": "Dữ liệu phân mảnh làm tê liệt khả năng dự báo và ra quyết định."
            },
            {
                "num": "3",
                "label": "Bài toán 3",
                "sub": "Thiết kế giải pháp",
                "icon": "⚙️",
                "khau": "khâu: quyết định",
                "tag_class": "badge-dec",
                "text": "Quy trình lọc hồ sơ thủ công gây quá tải và bỏ sót ứng viên giỏi."
            },
            {
                "num": "4",
                "label": "Bài toán 4",
                "sub": "Triển khai tác nghiệp",
                "icon": "👥",
                "khau": "khâu: hành động",
                "tag_class": "badge-act",
                "text": "Chấm công truyền thống dễ gian lận và tốn hàng chục giờ đối soát."
            },
            {
                "num": "5",
                "label": "Bài toán n",
                "sub": "Tạo giá trị thực tiễn",
                "icon": "🎯",
                "khau": "khâu: học lại",
                "tag_class": "badge-learn",
                "text": "Hệ thống thiếu cơ chế học lại khiến các sai sót lặp đi lặp lại."
            }
        ],
        "judge_question": "Bỏ AI đi thì phòng nhân sự truyền thống vẫn đang hoạt động bình thường, tại sao doanh nghiệp bắt buộc phải thay đổi?",
        "judge_answer": "Doanh nghiệp không chết vì thiếu công cụ mà đang kiệt quệ vì chi phí cơ hội và sai sót vận hành tích lũy. Khi quy mô tăng gấp đôi, việc phụ thuộc vào thao tác thủ công sẽ làm gãy chuỗi quản trị; DOWN TOWN khép kín 4 khâu giúp giải phóng 70% thời gian để HR tập trung vào phát triển con người.",
        "honest_reality": "Khảo sát thực trạng dựa trên tập mẫu 25 doanh nghiệp SME tại TP.HCM. Thời gian lãng phí và tỷ lệ gian lận được đo lường dựa trên nhật ký công việc thực tế, chưa áp dụng cho các tập đoàn đa quốc gia có hệ sinh thái SAP/Oracle hoàn chỉnh.",
        "speaker_time": "55 giây",
        "speaker_voice": "Speaker 1 (Product Lead)",
        "script": "Kính thưa Hội đồng Giám khảo, hãy hình dung một buổi sáng thứ Hai của chị Lan – Trưởng phòng Nhân sự một doanh nghiệp 150 người. Chị phải mở cùng lúc 5 cửa sổ: Zalo nhận CV, Excel đối soát công, máy chấm công vân tay báo lỗi, và hàng chục email khiếu nại. Chuỗi 4 khâu từ Dự báo, Quyết định, Hành động đến Học lại hoàn toàn bị đứt gãy. Doanh nghiệp không thiếu phần mềm, họ thiếu một sợi dây liên kết thông minh.",
        "transition_hook": "Vậy làm thế nào để hàn gắn 4 mắt xích bị đứt gãy này thành một dòng chảy duy nhất và có khả năng tự học? DOWN TOWN chính là lời giải trọn vẹn."
    },
    {
        "index": 2,
        "track_category": "MỞ ĐẦU // KHUNG CHUNG",
        "track_badge": "TRACK 02: GIẢI PHÁP",
        "title": "Bốn Khâu Của Mọi Đề Tài: Dự Báo, Quyết Định, Hành Động Và Học Lại",
        "subtitle": "Nền tảng HRMS tích hợp AI đầu tiên đưa vòng lặp phản hồi thực tế vào lõi vận hành",
        "persona": {
            "title": "Ban Lãnh đạo & Đội ngũ Nhân sự trên một hệ thống hợp nhất",
            "scope": "Nền tảng One-Stop HRMS · Tích hợp thời gian thực · Dữ liệu xuyên suốt",
            "card1_label": "Khâu 1 & 2: Dự báo & Quyết định",
            "card1_sub": "gợi ý thông minh minh bạch",
            "card2_label": "Khâu 3 & 4: Hành động & Học lại",
            "card2_sub": "khép kín vòng lặp tối ưu"
        },
        "bullets": [
            {
                "khau": "khâu: dự báo",
                "tag_class": "badge-pred",
                "text": "Khâu dự báo: AI tự động phân tích hồ sơ và ước lượng năng lực."
            },
            {
                "khau": "khâu: quyết định",
                "tag_class": "badge-dec",
                "text": "Khâu quyết định: Gợi ý xếp hạng ứng viên theo quy tắc nghiệp vụ minh bạch."
            },
            {
                "khau": "khâu: hành động",
                "tag_class": "badge-act",
                "text": "Khâu hành động: Tự động gửi thư mời và đồng bộ dữ liệu sang Kanban."
            },
            {
                "khau": "khâu: học lại",
                "tag_class": "badge-learn",
                "text": "Khâu học lại: Thao tác duyệt thực tế liên tục tối ưu hóa mô hình AI."
            },
            {
                "khau": "nền tảng chung",
                "tag_class": "badge-sys",
                "text": "Nền tảng hợp nhất giải quyết triệt để tình trạng phân mảnh dữ liệu nội bộ."
            }
        ],
        "judge_question": "Bỏ mô hình AI đi thì sản phẩm còn ra quyết định được không?",
        "judge_answer": "Nếu câu trả lời là 'vẫn được', chuỗi của bạn chưa có khâu 1; nếu là 'không còn gì cả', chuỗi chưa có khâu 2 và 3. Tại DOWN TOWN, hệ thống vẫn vận hành nghiệp vụ chuẩn mực khi tắt AI nhờ nguyên tắc Human-in-the-loop, AI chỉ đóng vai trò trợ lý đề xuất.",
        "honest_reality": "Khâu Học Lại hiện tại sử dụng cơ chế gom mẫu phản hồi (Human Feedback Loop) để cập nhật ngưỡng lọc và tái tinh chỉnh định kỳ hàng tháng, chưa thực hiện fine-tuning trọng số trực tiếp theo thời gian thực (online learning) nhằm bảo đảm tính ổn định tuyệt đối của hệ thống.",
        "speaker_time": "60 giây",
        "speaker_voice": "Speaker 1 (Product Lead)",
        "script": "Để giải quyết tận gốc bài toán, DOWN TOWN được kiến trúc theo chuẩn 4 khâu của một hệ thống thông minh. Ở khâu Dự báo, AI trích xuất thông tin chưa biết. Ở khâu Quyết định, con người kết hợp cùng gợi ý của máy để phê duyệt. Khâu Hành động biến quyết định thành kết quả ngoài đời thực chỉ bằng một nút bấm. Và điểm khác biệt nhất nằm ở khâu Học lại: mỗi thao tác chấp nhận hay từ chối của HR đều trở thành dữ liệu vàng giúp mô hình thông minh hơn mỗi ngày.",
        "transition_hook": "Sau đây, xin mời Tech Lead trình bày chi tiết chuỗi 4 bài toán thực thi mà DOWN TOWN đã hiện thực hóa vào sản phẩm."
    },
    {
        "index": 3,
        "track_category": "TÁC NGHIỆP // CHUỖI BÀI TOÁN THỰC THI",
        "track_badge": "TRACK 03: TÍNH NĂNG LÕI",
        "title": "Bốn Trụ Cột Vận Hành Giải Quyết Trọn Vẹn Chuỗi Tác Nghiệp Trọng Yếu",
        "subtitle": "Hiện thực hóa công nghệ AI vào 4 bài toán cụ thể: Tuyển dụng, Khảo thí, Chấm công, Họp hành",
        "persona": {
            "title": "Chuyên viên Tuyển dụng & Giám sát Vận hành",
            "scope": "Thao tác trực tiếp · Xử lý hàng ngày · Tối ưu hiệu suất làm việc",
            "card1_label": "Tuyển dụng: 2.3s OCR",
            "card1_sub": "trích xuất và chấm điểm tức thì",
            "card2_label": "Chấm công: FastFace",
            "card2_sub": "nhận diện 6 góc dưới 0.3s"
        },
        "bullets": [
            {
                "khau": "khâu: dự báo",
                "tag_class": "badge-pred",
                "text": "Tuyển dụng: Trích xuất thông tin hồ sơ bằng OCR chuẩn xác trong hai giây."
            },
            {
                "khau": "khâu: quyết định",
                "tag_class": "badge-dec",
                "text": "Khảo thí: Tự động sinh đề và chấm thi trắc nghiệm trong mười lăm phút."
            },
            {
                "khau": "khâu: hành động",
                "tag_class": "badge-act",
                "text": "Chấm công: Nhận diện khuôn mặt đa góc nghiêng ngăn chặn gian lận điểm danh."
            },
            {
                "khau": "khâu: học lại",
                "tag_class": "badge-learn",
                "text": "Thị giác máy tính: Giám sát an toàn khu vực làm việc bằng YOLOv8."
            }
        ],
        "judge_question": "Tại sao các bạn chọn tự xây dựng module Thị giác máy tính và Khảo thí thay vì tích hợp các giải pháp có sẵn trên thị trường?",
        "judge_answer": "Các giải pháp rời rạc trên thị trường biến dữ liệu doanh nghiệp thành các ốc đảo độc lập và tốn chi phí bản quyền khổng lồ. Việc tự chủ kiến trúc giúp DOWN TOWN tối ưu hóa tài nguyên phần cứng, dữ liệu luân chuyển trực tiếp giữa chấm công, đánh giá năng lực và phân công công việc mà không phát sinh độ trễ hay rò rỉ thông tin.",
        "honest_reality": "Tỷ lệ nhận diện giọng nói tiếng Việt đạt 92% trong phòng họp cách âm tiêu chuẩn dưới 40dB. Trong môi trường văn phòng ồn ào có tiếng máy móc, độ chính xác giảm xuống 83%, hệ thống sẽ tự động kích hoạt bộ lọc nhiễu âm thanh Spectral Gating.",
        "speaker_time": "70 giây",
        "speaker_voice": "Speaker 2 (Tech Lead)",
        "script": "Kính thưa Hội đồng, DOWN TOWN hiện thực hóa bằng các trụ cột công nghệ rõ ràng. Thứ nhất, module Document AI quét và phân tích CV trong đúng 2.3 giây. Thứ hai, hệ thống TestHub sinh đề thi thích ứng 15 phút đánh giá đúng năng lực ứng viên. Thứ ba, camera FastFace nhận diện 6 góc khuôn mặt cực nhạy, chống giả mạo bằng ảnh in. Và thứ tư, hệ thống thị giác máy tính YOLOv8 giám sát an toàn khu vực làm việc.",
        "transition_hook": "Để vận hành mượt mà các trụ cột đó mà vẫn bảo đảm chi phí tối thiểu cho doanh nghiệp, chúng tôi đã thiết kế một cơ chế điều phối mô hình đặc biệt."
    },
    {
        "index": 4,
        "track_category": "KIẾN TRÚC // CHUỖI BÀI TOÁN NỐI NHAU",
        "track_badge": "TRACK 04: CÔNG NGHỆ",
        "title": "Bảy Bài Toán Nối Nhau Trong Một Đề Tài: Kiến Trúc Model Controller",
        "subtitle": "Cơ chế điều phối thông minh kết hợp linh hoạt giữa On-premise cục bộ và Cloud Foundation Models",
        "persona": {
            "title": "Đội ngũ Kỹ sư AI & Quản trị Hệ thống Hạ tầng",
            "scope": "Kiến trúc Hybrid AI · Phân luồng tác vụ · Tối ưu hóa chi phí phần cứng",
            "card1_label": "Local Engine: GPU 0.3s",
            "card1_sub": "FastFace & YOLOv8 on-premise",
            "card2_label": "Cloud Models: Tiết kiệm",
            "card2_sub": "định tuyến thông minh theo tải"
        },
        "bullets": [
            {
                "khau": "khâu: dự báo",
                "tag_class": "badge-pred",
                "text": "Bộ điều phối thông minh tự động lựa chọn mô hình cục bộ hoặc đám mây."
            },
            {
                "khau": "khâu: quyết định",
                "tag_class": "badge-dec",
                "text": "Xử lý chấm công và thị giác máy tính chạy cục bộ với độ trễ thấp."
            },
            {
                "khau": "khâu: hành động",
                "tag_class": "badge-act",
                "text": "Tối ưu hóa tài nguyên phần cứng giúp doanh nghiệp tiết kiệm chi phí vận hành."
            },
            {
                "khau": "khâu: học lại",
                "tag_class": "badge-learn",
                "text": "Triển khai trên máy chủ nội bộ giúp bảo vệ tối đa bí mật kinh doanh."
            }
        ],
        "judge_question": "Sự khác biệt cốt lõi giữa DOWN TOWN so với các phần mềm HRMS lâu năm như Base.vn hay 1Office là gì?",
        "judge_answer": "Các phần mềm hiện nay chủ yếu là hệ thống CRUD số hóa quy trình nhập liệu thủ công; con người vẫn phải đọc và quyết định mọi thứ. DOWN TOWN là AI-First HRMS nhúng suy luận thông minh vào từng mắt xích tác nghiệp, có khả năng tự động học từ quyết định của con người để liên tục nâng cao hiệu suất.",
        "honest_reality": "Tốc độ nhận diện dưới 0.3 giây được đo lường trên máy chủ trang bị GPU NVIDIA RTX 4060. Khi chạy hoàn toàn trên CPU Intel Core i7 thế hệ 12 không card đồ họa rời, thời gian xử lý vector khuôn mặt là 1.1 giây, vẫn hoàn toàn đáp ứng tốt nhu cầu chấm công thực tế của văn phòng.",
        "speaker_time": "60 giây",
        "speaker_voice": "Speaker 2 (Tech Lead)",
        "script": "Điểm tự hào lớn nhất về mặt kỹ thuật của DOWN TOWN là cơ chế Model Controller. Chúng tôi không phụ thuộc thụ động vào OpenAI hay bất kỳ bên thứ ba nào. Hệ thống ưu tiên chạy các mô hình nguồn mở tối ưu cục bộ như FastFace và YOLOv8 on-premise để bảo mật dữ liệu tuyệt đối với chi phí bằng 0. Khi cần xử lý các tác vụ phức tạp, Model Controller mới định tuyến ra các LLM lớn có mã hóa ẩn danh.",
        "transition_hook": "Một hệ thống công nghệ ấn tượng là chưa đủ, tính khả thi toàn diện trên bài toán kinh doanh thực tế được chứng minh ra sao?"
    },
    {
        "index": 5,
        "track_category": "KHẢ THI // MA TRẬN 5W1H TOÀN DIỆN",
        "track_badge": "TRACK 05: ĐÁNH GIÁ 5W1H",
        "title": "Bàn Tròn Khả Thi 5W1H: Kỹ Thuật, Vận Hành, Chi Phí Và Pháp Lý",
        "subtitle": "Phân tích đa chiều chứng minh khả năng áp dụng thực tế ngay lập tức cho doanh nghiệp",
        "persona": {
            "title": "Tổng Giám đốc (CEO) & Giám đốc Tài chính (CFO)",
            "scope": "Hội đồng Quản trị · Phê duyệt ngân sách · Đánh giá ROI chuyển đổi số",
            "card1_label": "Chi phí: Tiết kiệm 80%",
            "card1_sub": "mô hình On-premise tối ưu",
            "card2_label": "Vận hành: 2 giờ làm quen",
            "card2_sub": "giao diện trực quan thân thiện"
        },
        "bullets": [
            {
                "khau": "nền tảng chung",
                "tag_class": "badge-sys",
                "text": "Khách hàng mục tiêu: Doanh nghiệp SME từ 50 đến 1000 nhân sự chuyển đổi số."
            },
            {
                "khau": "khâu: dự báo",
                "tag_class": "badge-pred",
                "text": "Phạm vi: Chuẩn hóa trọn vẹn luồng dữ liệu từ tuyển dụng đến quản trị."
            },
            {
                "khau": "khâu: quyết định",
                "tag_class": "badge-dec",
                "text": "Kỹ thuật: Xây dựng trên NextJS, FastAPI, PostgreSQL cùng hàng đợi Redis xử lý nhanh."
            },
            {
                "khau": "khâu: hành động",
                "tag_class": "badge-act",
                "text": "Vận hành: Giao diện trực quan giúp nhân sự làm quen trong vòng hai giờ."
            },
            {
                "khau": "khâu: học lại",
                "tag_class": "badge-learn",
                "text": "Pháp lý: Tuân thủ nghiêm ngặt Nghị định 13 bảo vệ dữ liệu sinh trắc học."
            }
        ],
        "judge_question": "Doanh nghiệp SME nguồn lực mỏng, làm sao họ gánh nổi chi phí duy trì phần cứng và API hàng tháng?",
        "judge_answer": "DOWN TOWN áp dụng mô hình kiến trúc Hybrid tối ưu chi phí: các tác vụ tần suất cao như chấm công Face ID và lọc CV chạy mô hình mã nguồn mở cục bộ không tốn chi phí API. Tổng chi phí duy trì hạ tầng máy chủ cho một doanh nghiệp 200 nhân sự chỉ dưới 2 triệu đồng/tháng, rẻ hơn rất nhiều so với việc thuê thêm 2 nhân sự vận hành thủ công.",
        "honest_reality": "Mô hình chi phí và thời gian đào tạo 2 giờ được kiểm chứng trên nhóm người dùng thử nghiệm có kỹ năng tin học văn phòng cơ bản. Đối với các đơn vị sản xuất có công nhân lớn tuổi, giai đoạn đầu cần bố trí thêm nhân sự hướng dẫn trực tiếp tại điểm danh trong 3 ngày đầu tiên.",
        "speaker_time": "65 giây",
        "speaker_voice": "Speaker 2 (Tech Lead)",
        "script": "Chúng tôi phân tích tính khả thi theo ma trận 5W1H toàn diện. Về Kỹ thuật, stack NextJS, FastAPI và Redis đảm bảo khả năng chịu tải hàng ngàn request đồng thời. Về Vận hành, UX được tối giản theo tư duy One-click action, nhân viên chỉ mất 2 giờ để sử dụng thành thạo. Về Chi phí, kiến trúc lai giúp doanh nghiệp SME tiết kiệm 80% ngân sách so với các giải pháp quốc tế. Và về Pháp lý, cơ chế consent minh bạch giúp doanh nghiệp hoàn toàn yên tâm trước quy định bảo vệ dữ liệu cá nhân.",
        "transition_hook": "Với nền móng khả thi vững chắc đó, lộ trình đưa DOWN TOWN vào thực tế và các chỉ số đo lường hiệu quả được xác lập như thế nào?"
    },
    {
        "index": 6,
        "track_category": "LỘ TRÌNH // HIỆU QUẢ KỲ VỌNG & KPIS",
        "track_badge": "TRACK 06: ROADMAP 2026",
        "title": "Làm Trọn Bốn Bài, Rút Gọn Ba Bài: Lộ Trình Hiện Thực Hóa",
        "subtitle": "Cam kết phát triển có kiểm soát đi kèm hệ thống chỉ số KPI đo lường giá trị thực",
        "persona": {
            "title": "Ban Điều phối Dự án & 3 Khách hàng Doanh nghiệp Tiên phong",
            "scope": "Thử nghiệm thực địa · Đo lường ROI · Đánh giá mức độ hài lòng",
            "card1_label": "Mục tiêu 1: Cắt giảm 70%",
            "card1_sub": "thời gian sàng lọc CV",
            "card2_label": "Mục tiêu 2: Giảm 100%",
            "card2_sub": "gian lận chấm công điểm danh"
        },
        "bullets": [
            {
                "khau": "nền tảng chung",
                "tag_class": "badge-sys",
                "text": "Quý hai 2026: Thử nghiệm phiên bản tối thiểu cho ba doanh nghiệp đối tác."
            },
            {
                "khau": "khâu: dự báo",
                "tag_class": "badge-pred",
                "text": "Quý ba 2026: Tích hợp hoàn chỉnh mô hình thị giác AI và xử lý họp."
            },
            {
                "khau": "khâu: quyết định",
                "tag_class": "badge-dec",
                "text": "Quý bốn 2026: Thương mại hóa và ra mắt tính năng dự báo biến động."
            },
            {
                "khau": "khâu: hành động",
                "tag_class": "badge-act",
                "text": "Tiết kiệm 70% thời gian sàng lọc hồ sơ cho bộ phận nhân sự."
            },
            {
                "khau": "khâu: học lại",
                "tag_class": "badge-learn",
                "text": "Chấm dứt hoàn toàn gian lận điểm danh và sai lệch bảng lương."
            }
        ],
        "judge_question": "Nếu trong 1 tháng đầu tiên thử nghiệm tại doanh nghiệp pilot mà độ chính xác nhận diện không đạt, nhóm xử lý thế nào?",
        "judge_answer": "Chúng tôi đã thiết kế sẵn cơ chế Fallback và Active Learning: Khi độ tin cậy của mô hình dưới 80%, hệ thống tự động gắn cờ cho HR can thiệp thủ công và lưu mẫu lỗi vào hàng đợi học lại. Nhờ đó, quy trình vận hành của doanh nghiệp không bao giờ bị đình trệ và mô hình sẽ nhanh chóng hội tụ sau 2 tuần hiệu chỉnh dữ liệu nội bộ.",
        "honest_reality": "Chỉ số tiết kiệm 70% thời gian tuyển dụng và giảm 100% gian lận chấm công hiện là kết quả đo lường trên môi trường mô phỏng 500 CV và 100 lượt điểm danh thử nghiệm. Con số thực tế tại từng doanh nghiệp có thể dao động tùy thuộc vào mức độ chuẩn hóa dữ liệu ban đầu.",
        "speaker_time": "60 giây",
        "speaker_voice": "Speaker 1 (Product Lead)",
        "script": "Lộ trình triển khai của DOWN TOWN gồm 3 chặng đường rõ ràng. Quý 2/2026, chúng tôi triển khai Pilot thực tế tại 3 doanh nghiệp đối tác để thẩm định khâu Tuyển dụng và Chấm công. Quý 3/2026, hoàn thiện module Vision AI và xử lý giọng nói. Quý 4/2026, chính thức thương mại hóa dịch vụ. Hiệu quả được chứng minh bằng các con số thực tế: cắt giảm 70% thời gian lọc CV, rút ngắn thời gian chốt bảng công từ 3 ngày xuống còn 15 phút.",
        "transition_hook": "Và để khép lại bài trình bày hôm nay, xin gửi tới Hội đồng thông điệp cốt lõi định hình nên sứ mệnh của DOWN TOWN."
    },
    {
        "index": 7,
        "track_category": "TỔNG KẾT // SẴN SÀNG PHẢN BIỆN",
        "track_badge": "TRACK 07: KẾT LUẬN & Q&A",
        "title": "DOWN TOWN: Tương Lai Của Quản Trị Nhân Sự Kỷ Nguyên Trí Tuệ Nhân Tạo",
        "subtitle": "Không chỉ là phần mềm lưu trữ, mà là hệ điều hành nhân sự thông minh có khả năng tự học",
        "persona": {
            "title": "Hội đồng Ban Giám khảo & Nhóm Sáng lập Dự án DOWN TOWN",
            "scope": "Phản biện trực tiếp · Đạo đức dữ liệu · Cam kết phát triển bền vững",
            "card1_label": "Hệ điều hành: 4 khâu",
            "card1_sub": "khép kín dòng chảy quản trị",
            "card2_label": "Sẵn sàng Demo: 100%",
            "card2_sub": "mã nguồn và dữ liệu thực chứng"
        },
        "bullets": [
            {
                "khau": "nền tảng chung",
                "tag_class": "badge-sys",
                "text": "DOWN TOWN định nghĩa lại cách thức doanh nghiệp tương tác với dữ liệu nhân sự."
            },
            {
                "khau": "khâu: dự báo",
                "tag_class": "badge-pred",
                "text": "Giải phóng bộ phận nhân sự khỏi các tác vụ thủ công lặp đi lặp lại."
            },
            {
                "khau": "khâu: quyết định",
                "tag_class": "badge-dec",
                "text": "Mô hình kinh doanh linh hoạt giúp doanh nghiệp tối ưu chi phí đầu tư."
            },
            {
                "khau": "khâu: hành động",
                "tag_class": "badge-act",
                "text": "Cam kết bảo vệ dữ liệu cá nhân theo các tiêu chuẩn an toàn quốc tế."
            },
            {
                "khau": "khâu: học lại",
                "tag_class": "badge-learn",
                "text": "Đội ngũ sẵn sàng trả lời các câu hỏi phản biện chuyên sâu từ hội đồng."
            }
        ],
        "judge_question": "Nếu được đầu tư 500 triệu đồng ngay hôm nay, ưu tiên số 1 của nhóm trong 3 tháng tới là gì?",
        "judge_answer": "Chúng tôi dành 60% ngân sách để chuẩn hóa dữ liệu và kiểm thử thực địa tại 5 doanh nghiệp sản xuất nhằm chứng minh giá trị ROI giảm chi phí vận hành; 40% còn lại đầu tư hoàn thiện chứng chỉ an toàn thông tin ISO/IEC 27001 và bảo vệ dữ liệu sinh trắc học để sẵn sàng thương mại hóa quy mô lớn.",
        "honest_reality": "DOWN TOWN được xây dựng với tinh thần thực học - thực làm, toàn bộ tính năng trình bày hôm nay đều đã có mã nguồn chạy thử nghiệm (functional prototype), sẵn sàng demo trực tiếp ngay tại hội đồng phản biện.",
        "speaker_time": "50 giây",
        "speaker_voice": "Speaker 1 (Product Lead)",
        "script": "Kính thưa Hội đồng Giám khảo, DOWN TOWN không chỉ là một bài thi Hackathon hay một phần mềm quản lý nhân sự tĩnh. Chúng tôi mang đến một hệ điều hành nhân sự tự học, nơi AI và con người cộng sinh chặt chẽ để kiến tạo giá trị thực. Toàn bộ mã nguồn, mô hình và dữ liệu đã sẵn sàng trên máy chủ thử nghiệm. Chúng tôi xin chân thành cảm ơn và sẵn sàng lắng nghe mọi câu hỏi đóng góp từ quý vị.",
        "transition_hook": "Xin trân trọng cảm ơn Hội đồng Giám khảo. Nhóm xin phép bắt đầu phiên hỏi đáp phản biện."
    }
]


def validate_bullets():
    all_valid = True
    for s in SLIDES_DATA:
        b_list = s['bullets']
        expected_len = 4 if s['index'] in (3, 4) else 5
        if len(b_list) != expected_len:
            print(f"[!] ERROR: Slide {s['index']} has {len(b_list)} bullets, expected {expected_len}!")
            all_valid = False
        for i, b in enumerate(b_list):
            words = b['text'].strip().split()
            w_count = len(words)
            if not (8 <= w_count <= 16):
                print(f"[!] WARNING: Slide {s['index']} bullet {i+1} has {w_count} words: '{b['text']}'")
    if all_valid:
        print("[+] Bullets validate cleanly!")
    return all_valid


def render_slide_body(s):
    idx = s['index']
    b = s['bullets']

    # SLIDE 1: Faithfully recreate "Một đề tài là một chuỗi bài toán" from user_reference.png
    if idx == 1:
        return f"""
        <div class="slide1-hero-container">
            <div class="slide1-main-split" style="grid-template-columns: 0.85fr 1.15fr; gap: 24px; align-items: center; min-height: 520px;">
                <!-- LEFT COLUMN: Lead Description & Core Philosophy -->
                <div class="slide1-col-left" style="gap: 16px;">
                    <div class="slide1-lead-box" style="background: #ffffff; border: 1.5px solid #fed7aa; border-left: 5px solid var(--primary-orange); border-radius: 12px; padding: 20px 22px; box-shadow: 0 4px 16px rgba(234, 88, 12, 0.06);">
                        <span style="font-family: var(--font-mono); font-size: 9.5px; font-weight: 700; color: var(--primary-orange); letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 8px;">NGUYÊN LÝ THIẾT KẾ DÒNG CHẢY</span>
                        <p class="slide1-lead-p" style="font-size: 14.5px; line-height: 1.6; color: var(--navy-slate);">
                            Một đề tài không bao giờ là những giải pháp rời rạc. DOWN TOWN liên kết chặt chẽ thành một dòng chảy duy nhất: từ <strong>Dự báo</strong>, <strong>Quyết định</strong>, tới <strong>Hành động</strong> và <strong>Học lại</strong> từ dữ liệu vận hành thực tế.
                        </p>
                    </div>

                    <div class="slide1-value-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <span style="font-size: 16px;">⚡</span>
                            <strong style="font-size: 12.5px; color: var(--navy-deep);">Mục Tiêu Giải Quyết Triệt Để</strong>
                        </div>
                        <p style="font-size: 11.5px; color: #64748b; line-height: 1.55;">
                            Giải phóng <strong>70% thời gian</strong> thao tác giấy tờ, loại bỏ hoàn toàn đứt gãy giữa các bộ phận tuyển dụng — khảo thí — chấm công, đồng thời trao quyền cho nhà quản trị bằng góc nhìn tổng thể thời gian thực.
                        </p>
                    </div>
                </div>

                <!-- RIGHT COLUMN: 5 Process Cards with Icons & Orange Return Loop -->
                <div class="slide1-col-right">
                    <div class="process-cards-sequence">
                        <div class="proc-step-card">
                            <span class="proc-icon">{b[0]['icon']}</span>
                            <strong class="proc-name">{b[0]['label']}</strong>
                            <span class="proc-desc">{b[0]['sub']}</span>
                            <p class="proc-bullet-text">{b[0]['text']}</p>
                        </div>
                        <div class="proc-arrow">→</div>

                        <div class="proc-step-card">
                            <span class="proc-icon">{b[1]['icon']}</span>
                            <strong class="proc-name">{b[1]['label']}</strong>
                            <span class="proc-desc">{b[1]['sub']}</span>
                            <p class="proc-bullet-text">{b[1]['text']}</p>
                        </div>
                        <div class="proc-arrow">→</div>

                        <div class="proc-step-card">
                            <span class="proc-icon">{b[2]['icon']}</span>
                            <strong class="proc-name">{b[2]['label']}</strong>
                            <span class="proc-desc">{b[2]['sub']}</span>
                            <p class="proc-bullet-text">{b[2]['text']}</p>
                        </div>
                        <div class="proc-arrow">→</div>

                        <div class="proc-step-card">
                            <span class="proc-icon">{b[3]['icon']}</span>
                            <strong class="proc-name">{b[3]['label']}</strong>
                            <span class="proc-desc">{b[3]['sub']}</span>
                            <p class="proc-bullet-text">{b[3]['text']}</p>
                        </div>
                        <div class="proc-arrow">→</div>

                        <div class="proc-step-card">
                            <span class="proc-icon">{b[4]['icon']}</span>
                            <strong class="proc-name">{b[4]['label']}</strong>
                            <span class="proc-desc">{b[4]['sub']}</span>
                            <p class="proc-bullet-text">{b[4]['text']}</p>
                        </div>
                    </div>

                    <!-- DASHED RETURN LOOP WITH PILL BADGE -->
                    <div class="feedback-loop-container">
                        <div class="feedback-dashed-line"></div>
                        <div class="feedback-pill-badge">học lại từ kết quả thật</div>
                    </div>
                </div>
            </div>
        </div>
        """

    # SLIDE 2: Authentic MLAI 4-Stage Horizontal Loop (recreating scratch/page_2.png)
    elif idx == 2:
        return f"""
        <div class="slide-layout-flow">
            <!-- 4 PROMINENT FLOW STEP CARDS -->
            <div class="mlai-4stages-cards">
                <div class="stage-large-card">
                    <div class="stage-num-title">1. Dự báo</div>
                    <p class="stage-question">Mô hình ước lượng cái gì mà hiện chưa biết?</p>
                    <div class="stage-bullet-note"><strong>Thực thi:</strong> {b[0]['text']}</div>
                </div>
                <div class="stage-arrow">➔</div>

                <div class="stage-large-card">
                    <div class="stage-num-title">2. Quyết định</div>
                    <p class="stage-question">Ai chọn, dựa vào ràng buộc và mục tiêu nào?</p>
                    <div class="stage-bullet-note"><strong>Thực thi:</strong> {b[1]['text']}</div>
                </div>
                <div class="stage-arrow">➔</div>

                <div class="stage-large-card">
                    <div class="stage-num-title">3. Hành động</div>
                    <p class="stage-question">Sản phẩm làm gì ngoài đời, bấm nút nào thì thay đổi gì?</p>
                    <div class="stage-bullet-note"><strong>Thực thi:</strong> {b[2]['text']}</div>
                </div>
                <div class="stage-arrow">➔</div>

                <div class="stage-large-card">
                    <div class="stage-num-title">4. Học lại</div>
                    <p class="stage-question">Kết quả thật quay về mô hình bằng đường nào?</p>
                    <div class="stage-bullet-note"><strong>Thực thi:</strong> {b[3]['text']}</div>
                </div>
            </div>

            <!-- AUTHENTIC DASHED RETURN LOOP -->
            <div class="recurrent-loop-bar">
                <span class="loop-arrow-left">⮤</span>
                <span class="loop-text">dữ liệu mới, sai số, phản hồi của người dùng thật liên tục cập nhật mô hình</span>
                <span class="loop-arrow-right">⮡</span>
            </div>

            <!-- 5TH BULLET: UNIFIED PLATFORM BANNER -->
            <div class="unified-platform-callout">
                <span class="up-badge">NỀN TẢNG CHUNG</span>
                <p class="up-text">{b[4]['text']}</p>
            </div>
        </div>
        """

    # SLIDE 3: Recreating scratch/page_3.png (Left Persona Card + Right Numbered Pill Rows)
    elif idx == 3:
        pills_html = "".join([f"""
                    <div class="mlai-pill-row">
                        <span class="orange-circle-num">{i+1}</span>
                        <div class="pill-content">
                            <span class="pill-body-span">{item['text']}</span>
                        </div>
                    </div>""" for i, item in enumerate(b)])

        return f"""
        <div class="slide-grid-2col" style="align-items: center; min-height: 480px;">
            <!-- LEFT: PERSONA CARD WITH CIRCULAR AVATAR & 2 MICRO CARDS -->
            <div class="col-left">
                <div class="mlai-persona-card" style="box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); border: 1.5px solid #fed7aa;">
                    <div class="persona-avatar-circle">👤</div>
                    <h2 class="persona-card-name">{s['persona']['title']}</h2>
                    <p class="persona-card-scope">{s['persona']['scope']}</p>

                    <div class="persona-micro-cards-row" style="margin-top: 14px;">
                        <div class="p-micro-card">
                            <span class="p-micro-icon">⚡</span>
                            <div>
                                <strong class="p-micro-title">{s['persona']['card1_label']}</strong>
                                <span class="p-micro-sub">{s['persona']['card1_sub']}</span>
                            </div>
                        </div>
                        <div class="p-micro-card">
                            <span class="p-micro-icon">📷</span>
                            <div>
                                <strong class="p-micro-title">{s['persona']['card2_label']}</strong>
                                <span class="p-micro-sub">{s['persona']['card2_sub']}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT: 4 ROUNDED WHITE PILLS WITH NUMBERED ORANGE CIRCLES -->
            <div class="col-right">
                <div class="mlai-pills-list">
                    {pills_html}
                </div>
            </div>
        </div>
        """

    # SLIDE 4: Architecture & Model Controller (recreating scratch/page_4.png)
    elif idx == 4:
        pills_html = "".join([f"""
                    <div class="mlai-pill-row">
                        <span class="orange-circle-num">{i+1}</span>
                        <div class="pill-content"><span class="pill-body-span">{item['text']}</span></div>
                        <span class="stage-tag {item['tag_class']}">{item['khau']}</span>
                    </div>""" for i, item in enumerate(b)])

        return f"""
        <div class="slide-grid-2col" style="align-items: center; min-height: 480px;">
            <!-- LEFT: ARCHITECTURE FLOW & BENCHMARKS -->
            <div class="col-left">
                <div class="tech-diagram-card">
                    <div class="tech-diagram-header">
                        <span class="tech-chip">ARCHITECTURE</span>
                        <h3 class="tech-title">Cơ Chế Điều Phối Model Controller</h3>
                    </div>
                    <div class="arch-box-flow">
                        <div class="arch-node onprem-node">
                            <strong>🖥️ Local Engine (On-premise)</strong>
                            <span>FastFace & YOLOv8 · 0 Đồng Token · Bảo mật 100%</span>
                        </div>
                        <div class="arch-switch">⇅ Tự động chuyển mạch thông minh</div>
                        <div class="arch-node cloud-node">
                            <strong>☁️ Cloud Foundation Models</strong>
                            <span>Mã hóa ẩn danh · Soạn thảo NĐ 30 & Sinh đề thi</span>
                        </div>
                    </div>
                    <div class="latency-benchmarks">
                        <div class="bench-item"><span>GPU RTX 4060:</span> <strong>0.3s / lượt</strong></div>
                        <div class="bench-item"><span>CPU Intel i7:</span> <strong>1.1s / lượt</strong></div>
                    </div>
                </div>
            </div>

            <!-- RIGHT: TECH BULLETS -->
            <div class="col-right">
                <div class="mlai-pills-list">
                    {pills_html}
                </div>
            </div>
        </div>
        """

    # SLIDE 5: 5W1H Structured Feasibility Matrix
    elif idx == 5:
        return f"""
        <div class="slide-layout-matrix">
            <div class="matrix-5rows-card">
                <div class="matrix-row">
                    <div class="matrix-label"><span class="m-tag">WHO</span><strong>Khách Hàng</strong></div>
                    <p class="matrix-text">{b[0]['text']}</p>
                    <span class="matrix-status">SME 50-1000 NV</span>
                </div>
                <div class="matrix-row">
                    <div class="matrix-label"><span class="m-tag">WHAT</span><strong>Phạm Vi</strong></div>
                    <p class="matrix-text">{b[1]['text']}</p>
                    <span class="matrix-status">Dữ Liệu Xuyên Suốt</span>
                </div>
                <div class="matrix-row">
                    <div class="matrix-label"><span class="m-tag">HOW</span><strong>Kỹ Thuật</strong></div>
                    <p class="matrix-text">{b[2]['text']}</p>
                    <span class="matrix-status">NextJS & FastAPI</span>
                </div>
                <div class="matrix-row">
                    <div class="matrix-label"><span class="m-tag">OPS</span><strong>Vận Hành</strong></div>
                    <p class="matrix-text">{b[3]['text']}</p>
                    <span class="matrix-status">Làm Quen 2 Giờ</span>
                </div>
                <div class="matrix-row">
                    <div class="matrix-label"><span class="m-tag">LAW</span><strong>Pháp Lý</strong></div>
                    <p class="matrix-text">{b[4]['text']}</p>
                    <span class="matrix-status">Nghị Định 13/CP</span>
                </div>
            </div>
        </div>
        """

    # SLIDE 6: 3-Phase Roadmap & Big Stat KPI Callouts (recreating scratch/page_7.png)
    elif idx == 6:
        return f"""
        <div class="slide-layout-roadmap">
            <!-- 3 HORIZONTAL MILESTONES -->
            <div class="roadmap-timeline">
                <div class="timeline-step">
                    <div class="time-pill">QUÝ 2 / 2026</div>
                    <h4 class="time-title">Pilot Thử Nghiệm</h4>
                    <p class="time-text">{b[0]['text']}</p>
                </div>
                <div class="timeline-connector">➔</div>
                <div class="timeline-step">
                    <div class="time-pill">QUÝ 3 / 2026</div>
                    <h4 class="time-title">Tích Hợp Vision AI</h4>
                    <p class="time-text">{b[1]['text']}</p>
                </div>
                <div class="timeline-connector">➔</div>
                <div class="timeline-step">
                    <div class="time-pill">QUÝ 4 / 2026</div>
                    <h4 class="time-title">Thương Mại Hóa</h4>
                    <p class="time-text">{b[2]['text']}</p>
                </div>
            </div>

            <!-- BIG STAT CALLOUTS -->
            <div class="kpi-stats-row">
                <div class="stat-card">
                    <div class="stat-big-num">70%</div>
                    <div class="stat-meta">
                        <strong class="stat-headline">Tiết Kiệm Thời Gian Lọc CV</strong>
                        <p class="stat-desc">{b[3]['text']}</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-big-num">100%</div>
                    <div class="stat-meta">
                        <strong class="stat-headline">Loại Bỏ Gian Lận Chấm Công</strong>
                        <p class="stat-desc">{b[4]['text']}</p>
                    </div>
                </div>
            </div>
        </div>
        """

    # SLIDE 7: Conclusion Climax & Q&A Readiness
    elif idx == 7:
        return f"""
        <div class="slide-grid-2col" style="align-items: center; min-height: 480px;">
            <div class="col-left">
                <div class="vision-manifesto-card">
                    <span class="manifesto-badge">SỨ MỆNH CỐT LÕI</span>
                    <h2 class="manifesto-title">Hệ Điều Hành Nhân Sự Thông Minh Có Khả Năng Tự Học</h2>
                    <p class="manifesto-quote">"DOWN TOWN không bán phần mềm quản lý nhân sự tĩnh, chúng tôi trao cho doanh nghiệp một hệ điều hành nhân sự tự học khép kín 4 khâu, biến dữ liệu con người thành lợi thế cạnh tranh vượt trội."</p>
                    <div class="manifesto-pillars">
                        <span>✓ Khép kín 4 khâu</span>
                        <span>✓ On-premise an toàn</span>
                        <span>✓ Human-in-the-loop</span>
                    </div>
                </div>
            </div>

            <div class="col-right">
                <div class="mlai-pills-list">
                    <div class="mlai-pill-row">
                        <span class="orange-circle-num">1</span>
                        <div class="pill-content"><span class="pill-body-span">{b[0]['text']}</span></div>
                        <span class="stage-tag {b[0]['tag_class']}">{b[0]['khau']}</span>
                    </div>
                    <div class="mlai-pill-row">
                        <span class="orange-circle-num">2</span>
                        <div class="pill-content"><span class="pill-body-span">{b[1]['text']}</span></div>
                        <span class="stage-tag {b[1]['tag_class']}">{b[1]['khau']}</span>
                    </div>
                    <div class="mlai-pill-row">
                        <span class="orange-circle-num">3</span>
                        <div class="pill-content"><span class="pill-body-span">{b[2]['text']}</span></div>
                        <span class="stage-tag {b[2]['tag_class']}">{b[2]['khau']}</span>
                    </div>
                    <div class="mlai-pill-row">
                        <span class="orange-circle-num">4</span>
                        <div class="pill-content"><span class="pill-body-span">{b[3]['text']}</span></div>
                        <span class="stage-tag {b[3]['tag_class']}">{b[3]['khau']}</span>
                    </div>
                    <div class="mlai-pill-row">
                        <span class="orange-circle-num">5</span>
                        <div class="pill-content"><span class="pill-body-span">{b[4]['text']}</span></div>
                        <span class="stage-tag {b[4]['tag_class']}">{b[4]['khau']}</span>
                    </div>
                </div>
            </div>
        </div>
        """

    return ""


def render_cover_slide():
    return f"""
        <section class="slide-canvas slide-cover-canvas active-slide" id="slide-1" data-slide-index="1">
            <!-- BACKGROUND ART LAYER FROM HUTECH POSTER THEME -->
            <div class="mlai-bg-art">
                <div class="bg-dot-matrix bg-dot-matrix-tr"></div>
                <div class="bg-dot-matrix bg-dot-matrix-bl"></div>
                <div class="bg-sun-orb" style="right: 80px; top: -70px; width: 420px; height: 420px; background: radial-gradient(circle, rgba(2, 132, 199, 0.18) 0%, rgba(234, 88, 12, 0.15) 50%, rgba(246, 239, 231, 0) 72%);"></div>
                <svg class="bg-dunes-svg" viewBox="0 0 1440 280" preserveAspectRatio="none">
                    <path d="M0 190 Q 360 170, 720 200 T 1440 160 L 1440 280 L 0 280 Z" fill="#e0f2fe" opacity="0.4"/>
                    <path d="M0 220 Q 420 190, 880 220 T 1440 185 L 1440 280 L 0 280 Z" fill="#fef3c7" opacity="0.5"/>
                    <path d="M0 250 Q 520 220, 980 245 T 1440 215 L 1440 280 L 0 280 Z" fill="#edd0b3" opacity="0.45"/>
                    <path d="M 460 245 Q 860 225, 1440 195" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="8 6" fill="none" opacity="0.6"/>
                </svg>
                <div class="bg-top-right-credo">
                    <span>HUTECH</span>
                    <span>KHOA CNTT</span>
                    <span>AI CONTEST 2026</span>
                </div>
                <div class="bg-bottom-right-credo">
                    <span>ĐỘI THI</span>
                    <span>DOWN TOWN</span>
                    <span>DOWN TOWN</span>
                    <span>HRMS AI</span>
                </div>
            </div>

            <!-- COVER SLIDE CONTENT -->
            <div class="cover-container">
                <!-- TOP BADGE ROW: HUTECH & CONTEST STAGE -->
                <div class="cover-top-row">
                    <div class="hutech-brand-badge">
                        <div class="hutech-logo-shield">
                            <span>HUTECH</span>
                        </div>
                        <div class="hutech-dept-info">
                            <span class="hutech-univ-name">ĐẠI HỌC CÔNG NGHỆ TP.HCM</span>
                            <strong class="hutech-dept-title">KHOA CÔNG NGHỆ THÔNG TIN</strong>
                        </div>
                    </div>

                    <div class="contest-round-badge">
                        <span class="round-dot-live"></span>
                        <div class="round-text-group">
                            <span class="round-name">VÒNG BÁN KẾT (ONLINE)</span>
                            <strong class="round-date">19h00 · Ngày 17/09/2026</strong>
                        </div>
                    </div>
                </div>

                <!-- HERO CENTER SECTION -->
                <div class="cover-hero-center" style="margin: auto 0; padding: 20px 0; gap: 14px;">
                    <div class="contest-eyebrow-pill">
                        <span class="eyebrow-star">★</span>
                        <span>CUỘC THI XÂY DỰNG HỆ ĐIỀU HÀNH DOANH NGHIỆP SỐ AI</span>
                        <span class="eyebrow-star">★</span>
                    </div>

                    <div class="contest-slogan-text">
                        SÁNG TẠO — ỨNG DỤNG — DẪN ĐẦU CHUYỂN ĐỔI SỐ
                    </div>

                    <div class="project-title-cluster" style="gap: 6px;">
                        <h1 class="project-main-title" style="font-size: 64px;">DOWN TOWN</h1>
                        <div class="title-glow-bar" style="width: 280px; height: 6px;"></div>
                        <h2 class="project-subtitle-vn" style="font-size: 21px;">
                            HỆ ĐIỀU HÀNH DOANH NGHIỆP SỐ QUẢN TRỊ NHÂN SỰ TÍCH HỢP AI
                        </h2>
                        <p class="project-subtitle-en" style="font-size: 13.5px;">
                            AI-First Human Resource Management Operating System · Kiến Trúc Khép Kín 4 Khâu
                        </p>
                    </div>

                    <!-- TEAM IDENTIFIER CARD -->
                    <div class="team-hero-card" style="margin-top: 10px; padding: 12px 28px;">
                        <div class="team-badge-left">
                            <span class="team-icon">🚀</span>
                            <div class="team-title-wrap">
                                <span class="team-sub-label">NHÓM DỰ THI</span>
                                <strong class="team-name-highlight" style="font-size: 20px;">DOWN TOWN</strong>
                            </div>
                        </div>
                        <div class="team-divider" style="height: 38px;"></div>
                        <div class="team-members-info">
                            <span class="team-univ-label" style="font-size: 12.5px;">Khoa Công Nghệ Thông Tin — Trường Đại học Công Nghệ TP.HCM (HUTECH)</span>
                            <span class="team-stack-label">Next.js 16 · FastAPI · Google Gemini Vision VLM · FastFace 512-D · YOLOv8</span>
                        </div>
                    </div>
                </div>

                <!-- COVER FOOTER BAR -->
                <footer class="cover-footer">
                    <div class="cover-f-left">
                        <span class="f-dot"></span>
                        <span>HỆ SINH THÁI KHÉP KÍN 4 KHÂU: DỰ BÁO ➔ QUYẾT ĐỊNH ➔ HÀNH ĐỘNG ➔ HỌC LẠI</span>
                    </div>
                    <div class="cover-f-right">
                        <span>hutech.edu.vn/khoacntt</span>
                        <span>·</span>
                        <span>NHÓM DOWN TOWN</span>
                    </div>
                </footer>
            </div>

            <!-- PRESENTER NOTES (COLLAPSIBLE DRAWER) -->
            <div class="presenter-drawer" id="notes-1">
                <div class="drawer-header-row">
                    <div class="drawer-speaker-info">
                        <span class="speaker-icon">🎙️</span>
                        <strong class="speaker-name">Đội ngũ DOWN TOWN</strong>
                        <span class="speaker-time-pill">⏱ Chuẩn: 30 giây</span>
                    </div>
                    <span class="drawer-shortcut-hint">Phím tắt <strong>[N]</strong> ẩn/hiện kịch bản</span>
                </div>
                <div class="drawer-body-content">
                    <p class="speaker-script-p"><strong>Lời thoại mở đầu:</strong> "Kính chào Hội đồng Ban Giám khảo và Quý Thầy Cô Khoa Công nghệ Thông tin HUTECH! Chúng tôi là nhóm DOWN TOWN. Hôm nay, nhóm xin đại diện mang đến Cuộc thi Xây dựng Hệ điều hành Doanh nghiệp số AI đề tài: DOWN TOWN — Hệ điều hành Quản trị Nhân sự AI-First khép kín 4 khâu, giải quyết triệt để sự đứt gãy trong quy trình vận hành nhân sự số của doanh nghiệp."</p>
                    <p class="speaker-hook-p"><strong>Câu nối chuyển slide (Transition Hook):</strong> 👉 <em>"Sau đây, xin kính mời Ban Giám khảo cùng bước vào dòng chảy bài toán cốt lõi của đề tài."</em></p>
                </div>
            </div>
        </section>
    """


def build_html():
    slides_html = render_cover_slide()
    for s in SLIDES_DATA:
        body_content = render_slide_body(s)
        slide_idx = s['index'] + 1

        slide_html = f"""
        <section class="slide-canvas" id="slide-{slide_idx}" data-slide-index="{slide_idx}">
            <!-- BACKGROUND ART LAYER FROM USER REFERENCE SCREENSHOT -->
            <div class="mlai-bg-art">
                <!-- Dot matrix grids -->
                <div class="bg-dot-matrix bg-dot-matrix-tr"></div>
                <div class="bg-dot-matrix bg-dot-matrix-bl"></div>

                <!-- Luminous orange sun rising on horizon -->
                <div class="bg-sun-orb"></div>

                <!-- Organic Sand Dune Curves with Flagpole -->
                <svg class="bg-dunes-svg" viewBox="0 0 1440 280" preserveAspectRatio="none">
                    <!-- Layer 1: Distant soft dune -->
                    <path d="M0 190 Q 360 170, 720 200 T 1440 160 L 1440 280 L 0 280 Z" fill="#fcf0e2" opacity="0.65"/>
                    <!-- Layer 2: Mid dune -->
                    <path d="M0 220 Q 420 190, 880 220 T 1440 185 L 1440 280 L 0 280 Z" fill="#f7dfc6" opacity="0.55"/>
                    <!-- Layer 3: Foreground dune -->
                    <path d="M0 250 Q 520 220, 980 245 T 1440 215 L 1440 280 L 0 280 Z" fill="#edd0b3" opacity="0.45"/>
                    <!-- White dashed trail -->
                    <path d="M 460 245 Q 860 225, 1440 195" stroke="#ffffff" stroke-width="3.5" stroke-dasharray="8 6" fill="none" opacity="0.8"/>
                    <!-- Minimalist flagpole on right hill -->
                    <line x1="1395" y1="190" x2="1395" y2="135" stroke="#1e293b" stroke-width="2.5"/>
                    <polygon points="1395,135 1430,148 1395,161" fill="#ea580c"/>
                </svg>

                <!-- Top-Right Vertical Typography Stack -->
                <div class="bg-top-right-credo">
                    <span>IDEAS</span>
                    <span>PEOPLE</span>
                    <span>GREATER IMPACT</span>
                </div>

                <!-- Bottom-Right Vertical Typography Stack -->
                <div class="bg-bottom-right-credo">
                    <span>Ý TƯỞNG</span>
                    <span>HÔM NAY</span>
                    <span>GIÁ TRỊ</span>
                    <span>NGÀY MAI</span>
                </div>
            </div>

            <!-- SLIDE TOP HEADER -->
            <header class="slide-top-header">
                <div class="category-eyebrow">
                    <span class="category-name">{s['track_category']}</span>
                    <div class="category-underline"></div>
                </div>
                <div class="track-badge-pill">
                    <span class="badge-dot"></span>
                    <span class="badge-text">{s['track_badge']}</span>
                </div>
            </header>

            <!-- SLIDE MAIN TITLE -->
            <div class="slide-title-block">
                <h1 class="slide-title">{s['title']}</h1>
                <div class="title-accent-bar"></div>
            </div>

            <!-- BESPOKE SLIDE BODY CONTENT -->
            {body_content}

            <!-- AUTHENTIC MLAI FOOTER (MATCHING USER REFERENCE SCREENSHOT) -->
            <footer class="slide-footer-mlai">
                <div class="footer-left-mlai">
                    <span class="footer-bar-mlai"></span>
                    <span class="footer-text-mlai">CÔNG NGHỆ · CỘNG ĐỒNG · GIÁ TRỊ THẬT</span>
                </div>
                <div class="footer-center-mlai">
                    <span class="footer-page-num">{s['index']} / 7</span>
                </div>
                <div class="footer-right-mlai">
                    <span class="footer-slogan-mlai">HACK TO A BRIGHTER TOMORROW</span>
                    <span class="footer-bar-mlai"></span>
                </div>
            </footer>

            <!-- PRESENTER NOTES (COLLAPSIBLE DRAWER) -->
            <div class="presenter-drawer" id="notes-{slide_idx}">
                <div class="drawer-header-row">
                    <div class="drawer-speaker-info">
                        <span class="speaker-icon">🎙️</span>
                        <strong class="speaker-name">{s['speaker_voice']}</strong>
                        <span class="speaker-time-pill">⏱ Chuẩn: {s['speaker_time']}</span>
                    </div>
                    <span class="drawer-shortcut-hint">Phím tắt <strong>[N]</strong> ẩn/hiện kịch bản</span>
                </div>
                <div class="drawer-body-content">
                    <p class="speaker-script-p"><strong>Lời thoại thuyết trình:</strong> "{s['script']}"</p>
                    <p class="speaker-hook-p"><strong>Câu nối chuyển slide (Transition Hook):</strong> 👉 <em>"{s['transition_hook']}"</em></p>
                </div>
            </div>
        </section>
        """
        slides_html += slide_html

    full_html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DOWN TOWN AI-First HRMS - Bài Thuyết Trình 7 Slide (MLAI Hackathon Design)</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-outer: #f6efe7;
            --bg-gradient: radial-gradient(ellipse at 80% 10%, #fef5ec 0%, #fbf8f5 55%, #f5e9dc 100%);
            --slide-bg: #ffffff;
            
            --primary-orange: #ea580c;
            --primary-orange-light: #fff3eb;
            --primary-orange-border: rgba(234, 88, 12, 0.22);
            
            --navy-deep: #0f172a;
            --navy-slate: #1e293b;
            --navy-text: #334155;
            --navy-muted: #64748b;
            --navy-light-border: #e2e8f0;
            
            --tag-pred: #ea580c;
            --tag-dec: #0284c7;
            --tag-act: #16a34a;
            --tag-learn: #9333ea;
            --tag-sys: #475569;

            --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }}

        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}

        body {{
            background: var(--bg-outer);
            background-image: var(--bg-gradient);
            color: var(--navy-deep);
            font-family: var(--font-sans);
            min-height: 100vh;
            line-height: 1.42;
            -webkit-font-smoothing: antialiased;
            overflow-x: hidden;
        }}

        /* TOP TOOLBAR */
        .top-toolbar {{
            position: sticky;
            top: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 28px;
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--navy-light-border);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        }}

        .toolbar-brand {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}

        .brand-logo-badge {{
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #ea580c, #f97316);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 800;
            font-size: 14px;
            box-shadow: 0 3px 10px rgba(234, 88, 12, 0.3);
        }}

        .brand-title-text {{
            font-size: 13.5px;
            font-weight: 800;
            color: var(--navy-deep);
        }}

        .brand-sub-badge {{
            font-family: var(--font-mono);
            font-size: 9.5px;
            font-weight: 700;
            background: var(--primary-orange-light);
            color: var(--primary-orange);
            border: 1px solid var(--primary-orange-border);
            padding: 2px 7px;
            border-radius: 5px;
        }}

        .toolbar-center {{
            display: flex;
            align-items: center;
            gap: 8px;
        }}

        .slide-dot {{
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #cbd5e1;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }}

        .slide-dot.active {{
            background: var(--primary-orange);
            transform: scale(1.35);
            box-shadow: 0 0 8px rgba(234, 88, 12, 0.5);
        }}

        .toolbar-actions {{
            display: flex;
            align-items: center;
            gap: 8px;
        }}

        .tool-btn {{
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 6px 14px;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 7px;
            font-family: var(--font-sans);
            font-size: 12.5px;
            font-weight: 600;
            color: var(--navy-slate);
            cursor: pointer;
            transition: all 0.18s;
        }}

        .tool-btn:hover {{
            background: #f8fafc;
            border-color: var(--primary-orange);
            color: var(--primary-orange);
        }}

        .tool-btn.active {{
            background: var(--primary-orange-light);
            border-color: var(--primary-orange);
            color: var(--primary-orange);
        }}

        /* PRESENTATION CANVAS (16:9 RATIO) */
        .presentation-wrapper {{
            padding: 20px 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }}

        .slide-canvas {{
            width: 100%;
            max-width: 1240px;
            aspect-ratio: 16 / 9;
            background: #ffffff;
            border-radius: 20px;
            padding: 22px 36px 16px 36px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            box-shadow: 0 20px 50px rgba(217, 119, 6, 0.08), 0 4px 16px rgba(15, 23, 42, 0.04);
            border: 1px solid rgba(234, 88, 12, 0.16);
            position: relative;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }}

        /* BACKGROUND ARTWORK (IDENTICAL TO USER REFERENCE SCREENSHOT) */
        .mlai-bg-art {{
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
        }}

        .bg-dot-matrix {{
            position: absolute;
            width: 120px;
            height: 90px;
            background-image: radial-gradient(rgba(234, 88, 12, 0.25) 1.5px, transparent 1.5px);
            background-size: 11px 11px;
        }}

        .bg-dot-matrix-tr {{ top: 16px; right: 80px; opacity: 0.8; }}
        .bg-dot-matrix-bl {{ bottom: 16px; left: 36px; opacity: 0.55; }}

        /* Soft rising orange sun on the horizon */
        .bg-sun-orb {{
            position: absolute;
            right: 32%;
            bottom: 30px;
            width: 140px;
            height: 140px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(251, 146, 60, 0.6) 0%, rgba(251, 146, 60, 0) 70%);
            filter: blur(14px);
            opacity: 0.85;
        }}

        /* Dune Landscape Curves */
        .bg-dunes-svg {{
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 180px;
        }}

        /* Top-Right Vertical Typography */
        .bg-top-right-credo {{
            position: absolute;
            top: 22px;
            right: 36px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 2px;
            font-family: var(--font-sans);
            font-size: 8px;
            font-weight: 700;
            color: #94a3b8;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }}

        /* Bottom-Right Vertical Typography */
        .bg-bottom-right-credo {{
            position: absolute;
            bottom: 42px;
            right: 36px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 2px;
            font-family: var(--font-sans);
            font-size: 8px;
            font-weight: 700;
            color: #94a3b8;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }}

        .slide-canvas > *:not(.mlai-bg-art) {{ position: relative; z-index: 1; }}

        /* MODE SLIDE VS DOC */
        body.mode-slide .slide-canvas {{ display: none; }}
        body.mode-slide .slide-canvas.active-slide {{
            display: flex;
            animation: slideEntrance 0.24s cubic-bezier(0.16, 1, 0.3, 1);
        }}

        @keyframes slideEntrance {{
            from {{ opacity: 0; transform: translateY(6px) scale(0.99); }}
            to {{ opacity: 1; transform: translateY(0) scale(1); }}
        }}

        body.mode-doc .slide-canvas {{
            display: flex !important;
            margin-bottom: 36px;
            aspect-ratio: auto;
            min-height: 640px;
        }}

        /* HEADER & TITLE */
        .slide-top-header {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2px;
        }}

        .category-eyebrow {{
            display: inline-flex;
            flex-direction: column;
            gap: 3px;
        }}

        .category-name {{
            font-family: var(--font-mono);
            font-size: 10.5px;
            font-weight: 700;
            color: var(--navy-muted);
            letter-spacing: 1px;
            text-transform: uppercase;
        }}

        .category-underline {{
            width: 36px;
            height: 2.5px;
            background: var(--primary-orange);
            border-radius: 2px;
        }}

        .track-badge-pill {{
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: #ffffff;
            border: 1px solid var(--primary-orange-border);
            padding: 3.5px 11px;
            border-radius: 999px;
            box-shadow: 0 2px 6px rgba(234, 88, 12, 0.06);
        }}

        .badge-dot {{
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--primary-orange);
            box-shadow: 0 0 5px var(--primary-orange);
        }}

        .badge-text {{
            font-family: var(--font-sans);
            font-size: 10.5px;
            font-weight: 700;
            color: var(--primary-orange);
        }}

        .slide-title-block {{
            margin-top: 2px;
            margin-bottom: 10px;
        }}

        .slide-title {{
            font-size: 24px;
            font-weight: 800;
            color: var(--navy-deep);
            line-height: 1.2;
            letter-spacing: -0.4px;
        }}

        .title-accent-bar {{
            width: 220px;
            height: 4px;
            background: var(--primary-orange);
            border-radius: 99px;
            margin-top: 6px;
        }}

        /* TWO-COLUMN GRID */
        .slide-grid-2col {{
            display: grid;
            grid-template-columns: 1fr 1.05fr;
            gap: 18px;
            align-items: start;
        }}

        .col-left, .col-right {{
            display: flex;
            flex-direction: column;
            gap: 8px;
        }}

        /* ==================== SLIDE 1 SPECIFIC HERO STYLES (EXACT USER SCREENSHOT) ==================== */
        .slide1-hero-container {{
            display: flex;
            flex-direction: column;
            gap: 8px;
        }}

        .slide1-main-split {{
            display: grid;
            grid-template-columns: 0.85fr 1.15fr;
            gap: 18px;
            align-items: center;
        }}

        .slide1-col-left {{
            display: flex;
            flex-direction: column;
            gap: 12px;
        }}

        .slide1-lead-p {{
            font-size: 13.5px;
            color: var(--navy-slate);
            line-height: 1.5;
        }}

        .section-micro-eyebrow {{
            font-family: var(--font-mono);
            font-size: 9px;
            font-weight: 700;
            color: var(--navy-muted);
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 6px;
        }}

        .pillars-3cards-row {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
        }}

        .pillar-card {{
            background: #ffffff;
            border: 1px solid #f1e9df;
            border-radius: 10px;
            padding: 9px 8px;
            display: flex;
            flex-direction: column;
            gap: 3px;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
            transition: all 0.15s;
        }}

        .pillar-card:hover {{
            transform: translateY(-2px);
            border-color: var(--primary-orange);
            box-shadow: 0 6px 16px rgba(234, 88, 12, 0.08);
        }}

        .pillar-brand {{
            font-size: 11px;
            font-weight: 800;
            color: var(--navy-deep);
            letter-spacing: 0.5px;
        }}

        .pillar-slogan {{
            font-size: 9.5px;
            color: var(--navy-muted);
            line-height: 1.35;
        }}

        /* 5-Card Process Sequence (Center-Right) */
        .slide1-col-right {{
            display: flex;
            flex-direction: column;
            gap: 8px;
        }}

        .process-cards-sequence {{
            display: flex;
            align-items: center;
            gap: 6px;
        }}

        .proc-step-card {{
            flex: 1;
            background: #ffffff;
            border: 1px solid #f0e6dc;
            border-radius: 12px;
            padding: 10px 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 3px;
            box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
            transition: all 0.18s;
        }}

        .proc-step-card:hover {{
            transform: translateY(-2px);
            border-color: var(--primary-orange);
            box-shadow: 0 8px 20px rgba(234, 88, 12, 0.1);
        }}

        .proc-icon {{
            font-size: 16px;
            line-height: 1;
        }}

        .proc-name {{
            font-size: 10.5px;
            font-weight: 800;
            color: var(--navy-deep);
        }}

        .proc-desc {{
            font-size: 8.5px;
            color: var(--navy-muted);
            line-height: 1.25;
            margin-bottom: 2px;
        }}

        .proc-bullet-text {{
            font-size: 8.5px;
            color: var(--navy-slate);
            line-height: 1.25;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }}

        .proc-arrow {{
            color: var(--primary-orange);
            font-size: 14px;
            font-weight: 800;
        }}

        /* Dashed Return Loop with Pill Badge */
        .feedback-loop-container {{
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: 4px;
        }}

        .feedback-dashed-line {{
            position: absolute;
            left: 20px;
            right: 20px;
            top: 50%;
            height: 18px;
            border-bottom: 2px dashed var(--primary-orange);
            border-left: 2px dashed var(--primary-orange);
            border-right: 2px dashed var(--primary-orange);
            border-radius: 0 0 10px 10px;
            z-index: 0;
        }}

        .feedback-pill-badge {{
            position: relative;
            z-index: 1;
            background: linear-gradient(135deg, #ea580c, #f97316);
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 14px;
            border-radius: 999px;
            box-shadow: 0 2px 8px rgba(234, 88, 12, 0.25);
            letter-spacing: 0.3px;
        }}

        /* ==================== SLIDE 2 SPECIFIC FLOW STYLES (RECREATING PAGE 2) ==================== */
        .slide-layout-flow {{
            display: flex;
            flex-direction: column;
            gap: 8px;
        }}

        .mlai-4stages-cards {{
            display: grid;
            grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
            align-items: center;
            gap: 8px;
        }}

        .stage-large-card {{
            background: #ffffff;
            border: 1px solid #f0e6dc;
            border-radius: 12px;
            padding: 12px 12px;
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
            display: flex;
            flex-direction: column;
            gap: 4px;
        }}

        .stage-num-title {{
            font-size: 14px;
            font-weight: 800;
            color: var(--navy-deep);
        }}

        .stage-question {{
            font-size: 10.5px;
            color: var(--navy-muted);
            line-height: 1.35;
        }}

        .stage-bullet-note {{
            font-size: 9.5px;
            color: var(--navy-slate);
            background: #fdf8f4;
            border: 1px solid #fae4d0;
            border-radius: 6px;
            padding: 4px 7px;
            margin-top: 2px;
            line-height: 1.35;
        }}

        .stage-arrow {{
            color: var(--primary-orange);
            font-size: 18px;
            font-weight: 800;
        }}

        .recurrent-loop-bar {{
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            background: #fff8f2;
            border: 1.5px dashed rgba(234, 88, 12, 0.4);
            border-radius: 8px;
            padding: 5px 14px;
        }}

        .loop-text {{
            font-size: 10px;
            font-weight: 700;
            color: var(--primary-orange);
            letter-spacing: 0.3px;
        }}

        .loop-arrow-left, .loop-arrow-right {{
            color: var(--primary-orange);
            font-size: 13px;
            font-weight: 800;
        }}

        .unified-platform-callout {{
            display: flex;
            align-items: center;
            gap: 10px;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 6px 12px;
        }}

        .up-badge {{
            font-family: var(--font-mono);
            font-size: 9px;
            font-weight: 700;
            color: #ffffff;
            background: var(--tag-sys);
            padding: 2px 7px;
            border-radius: 4px;
            white-space: nowrap;
        }}

        .up-text {{
            font-size: 11px;
            color: var(--navy-slate);
        }}

        .judge-box-page2 {{
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-left: 4px solid var(--navy-deep);
            border-radius: 8px;
            padding: 8px 14px;
            font-size: 10px;
            color: var(--navy-slate);
            line-height: 1.4;
        }}

        /* ==================== SLIDE 3 SPECIFIC STYLES (RECREATING PAGE 3) ==================== */
        .mlai-persona-card {{
            background: #ffffff;
            border: 1px solid #f0e6dc;
            border-radius: 14px;
            padding: 14px 16px;
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.03);
            display: flex;
            flex-direction: column;
            gap: 6px;
        }}

        .persona-avatar-circle {{
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #ffedd5;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            border: 1.5px solid #fed7aa;
        }}

        .persona-card-name {{
            font-size: 15px;
            font-weight: 800;
            color: var(--navy-deep);
        }}

        .persona-card-scope {{
            font-size: 10.5px;
            color: var(--navy-muted);
        }}

        .persona-micro-cards-row {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 6px;
        }}

        .p-micro-card {{
            background: #fdf8f3;
            border: 1px solid #fae4d0;
            border-radius: 8px;
            padding: 7px 9px;
            display: flex;
            align-items: center;
            gap: 7px;
        }}

        .p-micro-icon {{ font-size: 14px; }}
        .p-micro-title {{ font-size: 10px; font-weight: 700; color: var(--navy-deep); display: block; }}
        .p-micro-sub {{ font-size: 8.5px; color: var(--navy-muted); display: block; }}

        .mlai-pills-list {{
            display: flex;
            flex-direction: column;
            gap: 6px;
        }}

        .mlai-pill-row {{
            background: #ffffff;
            border: 1px solid #f0e6dc;
            border-radius: 999px;
            padding: 7px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 3px 10px rgba(15, 23, 42, 0.03);
            transition: all 0.15s;
        }}

        .mlai-pill-row:hover {{
            border-color: var(--primary-orange);
            transform: translateX(3px);
            box-shadow: 0 5px 14px rgba(234, 88, 12, 0.08);
        }}

        .orange-circle-num {{
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: var(--primary-orange);
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }}

        .pill-content {{
            flex: 1;
            font-size: 10.5px;
            line-height: 1.35;
        }}

        .pill-title-strong {{
            color: var(--navy-deep);
            margin-right: 4px;
        }}

        .pill-body-span {{
            color: var(--navy-slate);
        }}

        /* ==================== SLIDE 4 SPECIFIC ARCHITECTURE STYLES ==================== */
        .tech-diagram-card {{
            background: #ffffff;
            border: 1px solid #f0e6dc;
            border-radius: 12px;
            padding: 11px 14px;
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.03);
        }}

        .tech-diagram-header {{
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 7px;
        }}

        .tech-chip {{
            font-family: var(--font-mono);
            font-size: 8.5px;
            font-weight: 700;
            background: #eff6ff;
            color: #1d4ed8;
            padding: 2px 6px;
            border-radius: 4px;
        }}

        .tech-title {{
            font-size: 12.5px;
            font-weight: 800;
            color: var(--navy-deep);
        }}

        .arch-box-flow {{
            display: flex;
            flex-direction: column;
            gap: 5px;
        }}

        .arch-node {{
            border-radius: 7px;
            padding: 6px 10px;
            display: flex;
            flex-direction: column;
            gap: 1px;
        }}

        .onprem-node {{
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
        }}

        .onprem-node strong {{ font-size: 10.5px; color: #166534; }}
        .onprem-node span {{ font-size: 9px; color: #15803d; }}

        .cloud-node {{
            background: #eff6ff;
            border: 1px solid #bfdbfe;
        }}

        .cloud-node strong {{ font-size: 10.5px; color: #1e40af; }}
        .cloud-node span {{ font-size: 9px; color: #1d4ed8; }}

        .arch-switch {{
            text-align: center;
            font-family: var(--font-mono);
            font-size: 8.5px;
            font-weight: 700;
            color: var(--primary-orange);
        }}

        .latency-benchmarks {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-top: 7px;
            padding-top: 6px;
            border-top: 1px dashed #e2e8f0;
        }}

        .bench-item {{
            font-size: 9.5px;
            color: var(--navy-slate);
            display: flex;
            justify-content: space-between;
        }}

        .bench-item strong {{ color: var(--primary-orange); font-family: var(--font-mono); }}

        /* ==================== SLIDE 5 SPECIFIC 5W1H MATRIX STYLES ==================== */
        .slide-layout-matrix {{
            display: flex;
            flex-direction: column;
            gap: 8px;
        }}

        .matrix-5rows-card {{
            background: #ffffff;
            border: 1px solid #f0e6dc;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.03);
        }}

        .matrix-row {{
            display: grid;
            grid-template-columns: 120px 1fr 130px;
            align-items: center;
            gap: 12px;
            padding: 8px 14px;
            border-bottom: 1px solid #f1f5f9;
        }}

        .matrix-row:last-child {{ border-bottom: none; }}

        .matrix-label {{
            display: flex;
            align-items: center;
            gap: 6px;
        }}

        .m-tag {{
            font-family: var(--font-mono);
            font-size: 8.5px;
            font-weight: 700;
            background: #ffedd5;
            color: var(--primary-orange);
            padding: 1.5px 5px;
            border-radius: 4px;
        }}

        .matrix-label strong {{ font-size: 11px; color: var(--navy-deep); }}

        .matrix-text {{
            font-size: 10.5px;
            color: var(--navy-slate);
            line-height: 1.35;
        }}

        .matrix-status {{
            font-family: var(--font-mono);
            font-size: 9.5px;
            font-weight: 700;
            color: #0369a1;
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            padding: 2.5px 8px;
            border-radius: 999px;
            text-align: center;
        }}

        /* ==================== SLIDE 6 SPECIFIC ROADMAP STYLES ==================== */
        .slide-layout-roadmap {{
            display: flex;
            flex-direction: column;
            gap: 8px;
        }}

        .roadmap-timeline {{
            display: grid;
            grid-template-columns: 1fr auto 1fr auto 1fr;
            align-items: center;
            gap: 8px;
        }}

        .timeline-step {{
            background: #ffffff;
            border: 1px solid #f0e6dc;
            border-radius: 12px;
            padding: 10px 12px;
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.03);
            display: flex;
            flex-direction: column;
            gap: 3px;
        }}

        .time-pill {{
            font-family: var(--font-mono);
            font-size: 9px;
            font-weight: 700;
            color: var(--primary-orange);
            background: #fff7ed;
            padding: 2px 7px;
            border-radius: 4px;
            display: inline-block;
            align-self: flex-start;
        }}

        .time-title {{
            font-size: 12.5px;
            font-weight: 800;
            color: var(--navy-deep);
        }}

        .time-text {{
            font-size: 9.5px;
            color: var(--navy-slate);
            line-height: 1.3;
        }}

        .timeline-connector {{
            color: var(--primary-orange);
            font-size: 16px;
            font-weight: 800;
        }}

        .kpi-stats-row {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }}

        .stat-card {{
            background: #ffffff;
            border: 1px solid #f0e6dc;
            border-radius: 12px;
            padding: 10px 16px;
            display: flex;
            align-items: center;
            gap: 14px;
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.03);
        }}

        .stat-big-num {{
            font-size: 38px;
            font-weight: 800;
            color: var(--primary-orange);
            line-height: 1;
            font-family: var(--font-mono);
        }}

        .stat-meta {{
            display: flex;
            flex-direction: column;
            gap: 2px;
        }}

        .stat-headline {{
            font-size: 12px;
            font-weight: 800;
            color: var(--navy-deep);
        }}

        .stat-desc {{
            font-size: 9.5px;
            color: var(--navy-slate);
            line-height: 1.3;
        }}

        /* ==================== SLIDE 7 SPECIFIC VISION STYLES ==================== */
        .vision-manifesto-card {{
            background: linear-gradient(135deg, #0f172a, #1e293b);
            border-radius: 14px;
            padding: 14px 16px;
            color: #ffffff;
            display: flex;
            flex-direction: column;
            gap: 6px;
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.15);
        }}

        .manifesto-badge {{
            font-family: var(--font-mono);
            font-size: 8.5px;
            font-weight: 700;
            background: rgba(234, 88, 12, 0.25);
            color: #fb923c;
            padding: 2px 7px;
            border-radius: 4px;
            align-self: flex-start;
        }}

        .manifesto-title {{
            font-size: 13.5px;
            font-weight: 800;
            line-height: 1.25;
            color: #ffffff;
        }}

        .manifesto-quote {{
            font-size: 10px;
            color: #cbd5e1;
            line-height: 1.4;
            font-style: italic;
        }}

        .manifesto-pillars {{
            display: flex;
            gap: 8px;
            margin-top: 3px;
        }}

        .manifesto-pillars span {{
            font-size: 9px;
            font-weight: 600;
            color: #fed7aa;
            background: rgba(255, 255, 255, 0.08);
            padding: 2px 7px;
            border-radius: 4px;
        }}

        /* ==================== COMMON CALLOUTS & BANNERS ==================== */
        .dual-callouts-row {{
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 10px;
            align-items: stretch;
        }}

        .judge-q-card {{
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-left: 3.5px solid var(--navy-deep);
            border-radius: 10px;
            padding: 9px 12px;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.02);
        }}

        .judge-q-card-compact {{
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-left: 3.5px solid var(--navy-deep);
            border-radius: 8px;
            padding: 7px 11px;
            font-size: 9.5px;
            color: var(--navy-slate);
            line-height: 1.35;
        }}

        .card-badge-label {{
            font-family: var(--font-mono);
            font-size: 8.5px;
            font-weight: 700;
            color: var(--navy-muted);
            margin-bottom: 2px;
        }}

        .q-title {{
            font-size: 10.5px;
            font-weight: 700;
            color: var(--navy-deep);
            margin-bottom: 2px;
        }}

        .a-body {{
            font-size: 10px;
            color: var(--navy-slate);
            line-height: 1.35;
        }}

        /* Recreating the signature peach banner with thick orange left border from Slide 7 of MLAI PDF */
        .reality-banner-mlai {{
            background: #fff4ed;
            border: 1px solid #fed7aa;
            border-left: 4px solid var(--primary-orange);
            border-radius: 8px;
            padding: 7px 11px;
            font-size: 9.5px;
            color: #7c2d12;
            line-height: 1.35;
        }}

        .reality-banner-compact {{
            background: #fff4ed;
            border: 1px solid #fed7aa;
            border-left: 4px solid var(--primary-orange);
            border-radius: 8px;
            padding: 7px 11px;
            font-size: 9.5px;
            color: #7c2d12;
            line-height: 1.35;
        }}

        .reality-orange-tag {{
            color: var(--primary-orange);
            font-weight: 800;
        }}

        .stage-tag {{
            font-family: var(--font-mono);
            font-size: 8.5px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
        }}

        .badge-pred {{ background: #fff7ed; color: var(--tag-pred); border: 1px solid #fed7aa; }}
        .badge-dec {{ background: #f0f9ff; color: var(--tag-dec); border: 1px solid #bae6fd; }}
        .badge-act {{ background: #f0fdf4; color: var(--tag-act); border: 1px solid #bbf7d0; }}
        .badge-learn {{ background: #faf5ff; color: var(--tag-learn); border: 1px solid #e9d5ff; }}
        .badge-sys {{ background: #f8fafc; color: var(--tag-sys); border: 1px solid #e2e8f0; }}

        /* ==================== FOOTER (AUTHENTIC USER SCREENSHOT) ==================== */
        .slide-footer-mlai {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 10px;
            border-top: 1px solid #f1e9df;
            margin-top: 4px;
        }}

        .footer-left-mlai, .footer-right-mlai {{
            display: flex;
            align-items: center;
            gap: 7px;
        }}

        .footer-bar-mlai {{
            width: 18px;
            height: 2px;
            background: var(--primary-orange);
            border-radius: 1px;
        }}

        .footer-text-mlai {{
            font-family: var(--font-mono);
            font-size: 9px;
            font-weight: 700;
            color: var(--navy-muted);
            letter-spacing: 0.8px;
        }}

        .footer-page-num {{
            font-family: var(--font-mono);
            font-size: 10.5px;
            font-weight: 800;
            color: var(--primary-orange);
        }}

        .footer-slogan-mlai {{
            font-family: var(--font-mono);
            font-size: 9px;
            font-weight: 700;
            color: var(--navy-muted);
            letter-spacing: 0.8px;
        }}

        /* PRESENTER NOTES DRAWER */
        .presenter-drawer {{
            display: none;
            background: #ffffff;
            border: 1px solid #fed7aa;
            border-top: 3px solid var(--primary-orange);
            border-radius: 10px;
            padding: 10px 14px;
            margin-top: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
            animation: drawerOpen 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }}

        .presenter-drawer.open {{ display: block; }}

        @keyframes drawerOpen {{
            from {{ opacity: 0; transform: translateY(-4px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}

        .drawer-header-row {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px dashed #fed7aa;
        }}

        .drawer-speaker-info {{
            display: flex;
            align-items: center;
            gap: 6px;
        }}

        .speaker-name {{ font-size: 11px; color: var(--navy-deep); }}

        .speaker-time-pill {{
            font-family: var(--font-mono);
            font-size: 9px;
            font-weight: 700;
            background: #fff7ed;
            color: var(--primary-orange);
            padding: 1px 6px;
            border-radius: 4px;
        }}

        .drawer-shortcut-hint {{
            font-size: 9.5px;
            color: var(--navy-muted);
        }}

        .drawer-body-content {{
            display: flex;
            flex-direction: column;
            gap: 3px;
        }}

        .speaker-script-p {{
            font-size: 10.5px;
            color: var(--navy-slate);
            line-height: 1.4;
        }}

        .speaker-hook-p {{
            font-size: 10px;
            color: var(--primary-orange);
            line-height: 1.35;
        }}

        /* FULLSCREEN ADJUSTMENTS */
        body.is-fullscreen {{
            background: #0f172a;
        }}

        body.is-fullscreen .top-toolbar {{
            display: none;
        }}

        body.is-fullscreen .presentation-wrapper {{
            padding: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }}

        body.is-fullscreen .slide-canvas {{
            max-width: 96vw;
            max-height: 94vh;
            border-radius: 12px;
        }}

        /* ==================== COVER SLIDE STYLES (HUTECH CONTEST) ==================== */
        .slide-cover-canvas {{
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 24px 42px 18px 42px !important;
            position: relative;
            overflow: hidden;
        }}

        .cover-container {{
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            position: relative;
            z-index: 10;
        }}

        .cover-top-row {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(226, 232, 240, 0.85);
        }}

        .hutech-brand-badge {{
            display: flex;
            align-items: center;
            gap: 12px;
        }}

        .hutech-logo-shield {{
            width: 44px;
            height: 44px;
            background: linear-gradient(135deg, #1e40af, #0284c7);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #facc15;
            font-weight: 900;
            font-size: 9px;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 14px rgba(30, 64, 175, 0.25);
            border: 2px solid #facc15;
        }}

        .hutech-dept-info {{
            display: flex;
            flex-direction: column;
            gap: 1px;
            text-align: left;
        }}

        .hutech-univ-name {{
            font-family: var(--font-mono);
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }}

        .hutech-dept-title {{
            font-size: 14px;
            font-weight: 800;
            color: #1e3a8a;
            letter-spacing: 0.2px;
        }}

        .contest-round-badge {{
            display: flex;
            align-items: center;
            gap: 10px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            padding: 6px 14px;
            border-radius: 99px;
        }}

        .round-dot-live {{
            width: 9px;
            height: 9px;
            background: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 8px #10b981;
            animation: pulseDot 1.5s infinite;
        }}

        @keyframes pulseDot {{
            0% {{ transform: scale(0.9); opacity: 0.8; }}
            50% {{ transform: scale(1.3); opacity: 1; }}
            100% {{ transform: scale(0.9); opacity: 0.8; }}
        }}

        .round-text-group {{
            display: flex;
            flex-direction: column;
            text-align: left;
        }}

        .round-name {{
            font-family: var(--font-mono);
            font-size: 9.5px;
            font-weight: 700;
            color: #1d4ed8;
        }}

        .round-date {{
            font-size: 11px;
            font-weight: 800;
            color: #0f172a;
        }}

        .cover-hero-center {{
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            margin: auto 0;
            gap: 8px;
        }}

        .contest-eyebrow-pill {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(90deg, #fff7ed, #fef2f2);
            border: 1px solid #fed7aa;
            color: var(--primary-orange);
            padding: 4px 18px;
            border-radius: 99px;
            font-size: 11.5px;
            font-weight: 800;
            letter-spacing: 0.6px;
            box-shadow: 0 2px 8px rgba(234, 88, 12, 0.08);
        }}

        .eyebrow-star {{
            color: #f59e0b;
            font-size: 12px;
        }}

        .contest-slogan-text {{
            font-family: var(--font-mono);
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            letter-spacing: 2px;
            text-transform: uppercase;
        }}

        .project-title-cluster {{
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
        }}

        .project-main-title {{
            font-size: 58px;
            font-weight: 900;
            color: #0f172a;
            line-height: 1;
            letter-spacing: -1.5px;
            background: linear-gradient(135deg, #0f172a 30%, #ea580c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }}

        .title-glow-bar {{
            width: 260px;
            height: 5px;
            background: linear-gradient(90deg, #1e40af, #ea580c);
            border-radius: 99px;
            margin: 4px 0 6px 0;
        }}

        .project-subtitle-vn {{
            font-size: 19px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: -0.2px;
        }}

        .project-subtitle-en {{
            font-size: 12.5px;
            color: #64748b;
            font-weight: 500;
            letter-spacing: 0.3px;
        }}

        .team-hero-card {{
            display: inline-flex;
            align-items: center;
            gap: 16px;
            background: #ffffff;
            border: 1.5px solid #fed7aa;
            border-radius: 14px;
            padding: 9px 24px;
            box-shadow: 0 8px 24px rgba(234, 88, 12, 0.08);
            margin-top: 4px;
        }}

        .team-badge-left {{
            display: flex;
            align-items: center;
            gap: 9px;
        }}

        .team-icon {{
            font-size: 22px;
        }}

        .team-title-wrap {{
            display: flex;
            flex-direction: column;
            text-align: left;
        }}

        .team-sub-label {{
            font-family: var(--font-mono);
            font-size: 9px;
            font-weight: 700;
            color: #94a3b8;
            letter-spacing: 0.6px;
        }}

        .team-name-highlight {{
            font-size: 18px;
            font-weight: 900;
            color: var(--primary-orange);
            letter-spacing: 0.5px;
            font-family: var(--font-mono);
        }}

        .team-divider {{
            width: 1px;
            height: 34px;
            background: #fed7aa;
        }}

        .team-members-info {{
            display: flex;
            flex-direction: column;
            text-align: left;
            gap: 2px;
        }}

        .team-univ-label {{
            font-size: 11.5px;
            font-weight: 700;
            color: #1e293b;
        }}

        .team-stack-label {{
            font-family: var(--font-mono);
            font-size: 9.5px;
            color: #64748b;
        }}

        .cover-3pillars-row {{
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 6px;
        }}

        .cover-pillar-card {{
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px 14px;
            display: flex;
            align-items: center;
            gap: 11px;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
            transition: transform 0.2s, border-color 0.2s;
        }}

        .cover-pillar-card:hover {{
            transform: translateY(-2px);
            border-color: #cbd5e1;
        }}

        .cover-p-icon {{
            width: 36px;
            height: 36px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
        }}

        .cover-p-text {{
            display: flex;
            flex-direction: column;
            gap: 2px;
            text-align: left;
        }}

        .cover-p-text strong {{
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.2px;
        }}

        .cover-p-text span {{
            font-size: 9.5px;
            color: #64748b;
            line-height: 1.35;
        }}

        .cover-footer {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 10px;
            border-top: 1px solid rgba(226, 232, 240, 0.85);
            font-family: var(--font-mono);
            font-size: 9.5px;
            font-weight: 700;
            color: #64748b;
        }}

        .cover-f-left {{
            display: flex;
            align-items: center;
            gap: 6px;
        }}

        .f-dot {{
            width: 6px;
            height: 6px;
            background: var(--primary-orange);
            border-radius: 50%;
        }}

        .cover-f-right {{
            display: flex;
            align-items: center;
            gap: 8px;
        }}
    </style>
</head>
<body class="mode-slide">
    <!-- TOP TOOLBAR -->
    <nav class="top-toolbar">
        <div class="toolbar-brand">
            <div class="brand-logo-badge">TH</div>
            <div>
                <span class="brand-title-text">DOWN TOWN HRMS</span>
                <span class="brand-sub-badge">NHÓM DOWN TOWN · HUTECH</span>
            </div>
        </div>

        <div class="toolbar-center">
            <button class="slide-dot active" onclick="goToSlide(1)" title="Trang Đầu: Nhóm DOWN TOWN"></button>
            <button class="slide-dot" onclick="goToSlide(2)" title="Track 01: Chuỗi Bài Toán"></button>
            <button class="slide-dot" onclick="goToSlide(3)" title="Track 02: Vòng Lặp 4 Khâu"></button>
            <button class="slide-dot" onclick="goToSlide(4)" title="Track 03: Giải Pháp & Tác Vụ"></button>
            <button class="slide-dot" onclick="goToSlide(5)" title="Track 04: Kiến Trúc Model Controller"></button>
            <button class="slide-dot" onclick="goToSlide(6)" title="Track 05: Đánh Giá Khả Thi 5W1H"></button>
            <button class="slide-dot" onclick="goToSlide(7)" title="Track 06: Lộ Trình & Hiệu Quả"></button>
            <button class="slide-dot" onclick="goToSlide(8)" title="Track 07: Tổng Kết & Q&A"></button>
        </div>

        <div class="toolbar-actions">
            <button class="tool-btn" id="btn-notes" onclick="toggleNotes()">
                <span>🎙️</span> <span>Ghi chú [N]</span>
            </button>
            <button class="tool-btn" id="btn-mode" onclick="toggleMode()">
                <span>📄</span> <span>Dạng Doc [M]</span>
            </button>
            <button class="tool-btn" id="btn-fullscreen" onclick="toggleFullscreen()">
                <span>⛶</span> <span>Toàn màn hình [F]</span>
            </button>
        </div>
    </nav>

    <!-- PRESENTATION CONTAINER -->
    <main class="presentation-wrapper">
        {slides_html}
    </main>

    <!-- CLIENT SCRIPT -->
    <script>
        let currentSlide = 1;
        const totalSlides = 8;
        let isDocMode = false;
        let showNotes = false;

        function updateSlideView() {{
            if (isDocMode) return;
            
            document.querySelectorAll('.slide-canvas').forEach((el, i) => {{
                if (i + 1 === currentSlide) {{
                    el.classList.add('active-slide');
                }} else {{
                    el.classList.remove('active-slide');
                }}
            }});

            document.querySelectorAll('.slide-dot').forEach((dot, i) => {{
                if (i + 1 === currentSlide) {{
                    dot.classList.add('active');
                }} else {{
                    dot.classList.remove('active');
                }}
            }});
        }}

        function goToSlide(n) {{
            if (n >= 1 && n <= totalSlides) {{
                currentSlide = n;
                updateSlideView();
            }}
        }}

        function nextSlide() {{
            if (currentSlide < totalSlides) {{
                currentSlide++;
                updateSlideView();
            }}
        }}

        function prevSlide() {{
            if (currentSlide > 1) {{
                currentSlide--;
                updateSlideView();
            }}
        }}

        function toggleNotes() {{
            showNotes = !showNotes;
            document.querySelectorAll('.presenter-drawer').forEach(d => {{
                if (showNotes) d.classList.add('open');
                else d.classList.remove('open');
            }});
            document.getElementById('btn-notes').classList.toggle('active', showNotes);
        }}

        function toggleMode() {{
            isDocMode = !isDocMode;
            document.body.classList.toggle('mode-doc', isDocMode);
            document.body.classList.toggle('mode-slide', !isDocMode);
            document.getElementById('btn-mode').classList.toggle('active', isDocMode);
            if (!isDocMode) updateSlideView();
        }}

        function toggleFullscreen() {{
            if (!document.fullscreenElement) {{
                document.documentElement.requestFullscreen().catch(err => alert(err.message));
                document.body.classList.add('is-fullscreen');
            }} else {{
                if (document.exitFullscreen) {{
                    document.exitFullscreen();
                    document.body.classList.remove('is-fullscreen');
                }}
            }}
        }}

        document.addEventListener('fullscreenchange', () => {{
            if (!document.fullscreenElement) {{
                document.body.classList.remove('is-fullscreen');
            }}
        }});

        // KEYBOARD SHORTCUTS
        document.addEventListener('keydown', (e) => {{
            if (e.key === 'ArrowRight' || e.key === 'Space') {{
                e.preventDefault();
                nextSlide();
            }} else if (e.key === 'ArrowLeft') {{
                e.preventDefault();
                prevSlide();
            }} else if (e.key === 'f' || e.key === 'F') {{
                toggleFullscreen();
            }} else if (e.key === 'n' || e.key === 'N') {{
                toggleNotes();
            }} else if (e.key === 'm' || e.key === 'M') {{
                toggleMode();
            }} else if (e.key >= '1' && e.key <= '8') {{
                goToSlide(parseInt(e.key));
            }}
        }});

        // INIT
        updateSlideView();
    </script>
</body>
</html>
"""
    return full_html


def main():
    if not validate_bullets():
        print("[!] Validation failed. Exiting.")
        sys.exit(1)

    html_content = build_html()

    target_ttrinh = r"D:\MyProject\TTrinh\thuyet_trinh_7_slide.html"
    target_downtown = r"d:\MyProject\down-town\thuyet_trinh_7_slide.html"

    with open(target_ttrinh, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[+] Saved presentation HTML to: {target_ttrinh} ({len(html_content.encode('utf-8'))} bytes)")

    with open(target_downtown, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[+] Saved presentation HTML to: {target_downtown} ({len(html_content.encode('utf-8'))} bytes)")


if __name__ == "__main__":
    main()
