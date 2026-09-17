# Kịch bản thuyết trình Town Hown — 7 slide

> Đối tượng: giảng viên, hội đồng phản biện, nhà đầu tư.
> Thời lượng mục tiêu: 7–9 phút. Nguồn: `PRODUCT.md`, `docs/downtown/prd.md`,
> `docs/_product/roadmap.md`, `docs/downtown/security.md`, `docs/downtown/architecture.md`,
> `modules/README.md`. Không tìm thấy kịch bản thuyết trình cũ trong repo —
> kịch bản này được xây mới từ các tài liệu nguồn trên.
> Nguyên tắc xuyên suốt: AI chỉ đề xuất và phân tích; người có thẩm quyền quyết định.
> Mọi số liệu chưa có trong tài liệu đều được đánh dấu là **mục tiêu/giả định**.

---

## Slide 1 — Vấn đề: Quy trình nhân sự đang sống trong quá nhiều công cụ rời

**Thông điệp chính:** Doanh nghiệp không thiếu dữ liệu nhân sự — họ thiếu một
luồng dữ liệu đáng tin, liên thông từ đầu đến cuối.

**Nội dung hiển thị trên slide:**

- 8h30 sáng: chị Hà (HR) mở 180 CV trong hộp mail, Excel ghi trạng thái bằng tay.
- Hồ sơ nhân viên rải rác: file scan, Drive, email — cùng một dữ liệu nhập lại nhiều lần.
- Đối chiếu CV–JD thủ công: đọc từng hồ sơ, chấm điểm cảm tính, dễ sót ứng viên giỏi.
- Họp xong có quyết định nhưng đầu việc "bay màu" — không ai nhớ ai phụ trách.
- **Câu hỏi lớn:** Làm sao một hồ sơ đi từ CV đến quyết định — không thất lạc, có người chịu trách?

**Gợi ý hình ảnh:** Màn hình làm việc của HR chia nhỏ thành nhiều cửa sổ
(email, Excel, Drive, chat) với các mũi tên copy–paste đứt gãy; hoặc ảnh bàn
làm việc ngập giấy tờ. Dòng câu hỏi cuối đặt ở banner nổi bật.

**Lời thoại (~60 giây):**

> Hãy tưởng tượng một buổi sáng của chị Hà, phụ trách tuyển dụng ở một công ty
> 150 người. 180 CV nằm trong hộp mail. Trạng thái ứng viên được ghi tay vào
> Excel. Hồ sơ nhân viên nằm rải rác giữa file scan, Drive và giấy tờ trên bàn.
> Khi cần đối chiếu CV với JD, chị đọc từng file và chấm điểm theo cảm tính —
> ứng viên giỏi có thể bị bỏ sót chỉ vì CV trình bày khác chuẩn. Cuộc họp chiều
> qua có ba quyết định, nhưng đến hôm nay không ai nhớ ai phụ trách việc gì. Và
> khi giám đốc hỏi "tuyển đến đâu rồi?", chị phải mất hai ngày tổng hợp tay.
> Vấn đề không phải thiếu dữ liệu — mà là dữ liệu không đi cùng nhau. Vậy làm
> sao một hồ sơ đi từ CV đến quyết định mà không bị thất lạc?

**Chuyển tiếp:** "Đó chính là câu hỏi Town Hown được xây để trả lời."

---

## Slide 2 — Giải pháp: Town Hown

**Thông điệp chính:** Một nền tảng HRMS thống nhất — AI làm phần việc lặp lại
có cấu trúc, con người giữ quyền quyết định cuối cùng.

**Nội dung hiển thị trên slide:**

- Town Hown: nền tảng HRMS tích hợp AI — một luồng dữ liệu từ CV đến quyết định.
- Khách hàng: doanh nghiệp ~50–300 người (*giả định*); người dùng: HR, interviewer, quản lý, ứng viên.
- Luồng nghiệp vụ: nhu cầu tuyển → CV → đánh giá → phỏng vấn → offer → onboarding → hồ sơ nhân viên.
- Khác biệt cốt lõi: mọi đề xuất AI có giải thích, có nguồn — người có thẩm quyền xác nhận hoặc ghi đè.
- Mọi hành động nhạy cảm có audit: ai làm, khi nào, vì sao, trước–sau ra sao.

**Gợi ý hình ảnh:** Sơ đồ pipeline một dòng ngang
`Nhu cầu → CV → Assessment → Phỏng vấn → Offer → Onboarding`, với biểu tượng
"con người duyệt" (shield/checkpoint) ở các điểm quyết định. Một nhánh nhỏ:
`Cuộc họp → biên bản → task` chảy vào cùng nền tảng.

**Lời thoại (~55 giây):**

> Town Hown là một nền tảng HRMS tích hợp AI: thay vì mười công cụ rời, toàn bộ
> hành trình từ nhu cầu tuyển dụng, tiếp nhận CV, đánh giá năng lực, phỏng vấn,
> offer cho tới onboarding và hồ sơ nhân viên nằm trong một luồng dữ liệu duy
> nhất. Đối tượng chúng tôi hướng tới là doanh nghiệp vừa và nhỏ — nơi đội HR
> mỏng nhưng khối lượng công việc không nhỏ. Điểm khác biệt quan trọng nhất
> không phải "có AI", mà là cách AI được kiểm soát: mọi đề xuất của AI đều kèm
> giải thích và liên kết về dữ liệu nguồn, và luôn có một người có thẩm quyền
> xác nhận, chỉnh sửa hoặc ghi đè kèm lý do. AI làm việc nặng — con người chịu
> trách nhiệm.

**Chuyển tiếp:** "Nghe trừu tượng thì dễ — vậy cụ thể nó làm được gì? Chúng tôi
chọn bốn nhóm tính năng tiêu biểu nhất."

---

## Slide 3 — Tính năng nổi bật: 4 nhóm thay vì 39 tính năng

**Thông điệp chính:** Bốn nhóm tính năng đủ chứng minh giá trị — mỗi nhóm giải
quyết một vết đau thật trong câu chuyện của chị Hà.

**Nội dung hiển thị trên slide (lưới 2×2, mỗi thẻ 3 dòng):**

| Nhóm | Vấn đề | Cách hoạt động | Giá trị |
| --- | --- | --- | --- |
| **Tuyển dụng thông minh** | Đọc, chấm CV thủ công; hồ sơ kẹt trạng thái, thất lạc giữa các vòng. | OCR trích trường CV; điểm phù hợp CV–JD có giải thích; pipeline chuyển trạng thái có kiểm soát. | Sàng lọc nhanh, nhất quán; HR xác nhận, ghi đè, khôi phục ứng viên kèm lý do. |
| **Đánh giá năng lực** | Soạn đề thủ công, câu hỏi không gắn JD; kết quả thiếu ngữ cảnh phỏng vấn. | AI sinh câu hỏi từ JD/tài liệu → ngân hàng câu hỏi → bài test → chấm điểm, phân tích mạnh–yếu. | Đánh giá có evidence; AI gợi ý câu hỏi follow-up riêng cho từng ứng viên. |
| **Chấm công khuôn mặt** *(module độc lập)* | Chấm công quẹt thẻ hộ, gian lận giờ giấc khó phát hiện và kiểm chứng. | Nhận diện khuôn mặt ArcFace thời gian thực kèm chống giả mạo kép: quang học và chuyển động. | Điểm danh chính xác, chống ảnh in và video phát lại; đang trong lộ trình tích hợp. |
| **AI xử lý tài liệu & cuộc họp** | Nhập tay giấy tờ scan; cuộc họp có quyết định nhưng không thành công việc. | OCR tiếng Việt trích trường kèm độ tin cậy; transcript họp → biên bản AI → task trên Kanban. | Giảm nhập liệu; mọi đầu việc có owner, hạn và liên kết về nguồn cuộc họp. |

**Gợi ý hình ảnh:** Lưới 2×2 card với icon riêng (CV/scorecard, clipboard-test,
khuôn mặt, tài liệu→kanban). Mỗi card 3 dòng: *Vấn đề → Cách → Giá trị*.

**Lời thoại (~70 giây):**

> Thứ nhất, tuyển dụng thông minh: hệ thống đọc CV bằng OCR, trích xuất kỹ
> năng–kinh nghiệm, chấm điểm phù hợp với JD *và giải thích từng thành phần
> điểm*. Ứng viên dưới ngưỡng không bị loại tự động — họ vào danh sách HR xem
> xét, và HR luôn ghi đè được kèm lý do. Thứ hai, đánh giá năng lực: AI sinh
> câu hỏi từ JD hoặc tài liệu nội bộ vào ngân hàng câu hỏi, tạo bài test, chấm
> điểm và phân tích điểm mạnh–yếu — rồi gợi ý câu hỏi phỏng vấn follow-up cho
> từng ứng viên. Thứ ba, chấm công bằng khuôn mặt: một module độc lập dùng
> ArcFace nhận diện thời gian thực với hai lớp chống giả mạo — ảnh in hay video
> phát lại đều không qua được. Cuối cùng, AI xử lý tài liệu và cuộc họp: OCR
> tiếng Việt trích trường từ CCCD, hợp đồng kèm độ tin cậy để người kiểm tra;
> cuộc họp được chép lời, AI đề xuất biên bản và đầu việc — chủ trì xác nhận
> xong, task tự hiện trên Kanban của đúng người phụ trách.

**Chuyển tiếp:** "Đằng sau bốn nhóm này là một lựa chọn kiến trúc rất có chủ
đích — xoay quanh một nguyên tắc duy nhất."

---

## Slide 4 — Công nghệ và điểm khác biệt: Human-in-the-loop là thiết kế, không phải khẩu hiệu

**Thông điệp chính:** Công nghệ được chọn để giữ một cam kết — AI đề xuất có
bằng chứng, người quyết định có trách nhiệm truy vết được.

**Nội dung hiển thị trên slide:**

- Nền tảng: Next.js + Supabase (PostgreSQL, xác thực, Row-Level Security giới hạn dữ liệu theo quyền).
- AI pipeline: OCR thị giác (Gemini Vision, fallback Tesseract), LLM phân tích–sinh nội dung, Whisper chép lời.
- Sinh trắc & thị giác: ArcFace vector 512 chiều; Computer Vision giám sát chạy service Python riêng.
- Human-in-the-loop: mọi đề xuất AI có độ tin cậy, nguồn gốc, người duyệt — audit đầy đủ.
- Khác HRMS truyền thống: luồng liên thông đầu-cuối và AI giải thích được — không tự động hóa mù.

**Gợi ý hình ảnh:** Sơ đồ kiến trúc 3 lớp đơn giản:
`Giao diện → API/BFF → Supabase + AI providers`. Đặt icon "con người duyệt" tại
các cổng (sau OCR, sau matching, sau biên bản, sau cảnh báo CV). Chú thích nhỏ:
"RLS = mỗi người chỉ thấy dữ liệu trong phạm vi quyền".

**Lời thoại (~60 giây):**

> Về kỹ thuật, Town Hown là một web app Next.js trên nền Supabase — PostgreSQL
> với Row-Level Security, nghĩa là mỗi người chỉ thấy dữ liệu trong phạm vi
> quyền của mình, ngay ở tầng dữ liệu chứ không chỉ ở giao diện. AI gồm ba lớp:
> mô hình thị giác để OCR tài liệu tiếng Việt, mô hình ngôn ngữ để đối chiếu
> CV–JD, sinh câu hỏi, tóm tắt; và Whisper để chép lời cuộc họp. Riêng nhận
> diện khuôn mặt dùng ArcFace — chuyển khuôn mặt thành vector 512 chiều để so
> khớp. Nhưng điều chúng tôi muốn nhấn mạnh là nguyên tắc Human-in-the-loop:
> AI output được coi là *chưa tin cậy* cho tới khi con người xác nhận — mọi đề
> xuất có độ tin cậy, có đường dẫn về trang/vùng dữ liệu nguồn, và mọi quyết
> định ghi lại ai duyệt, khi nào, vì sao. HRMS truyền thống lưu dữ liệu; Town
> Hown lưu cả lý do của quyết định.

**Chuyển tiếp:** "Công nghệ nghe có vẻ nặng — vậy tính khả thi triển khai thực
tế ra sao?"

---

## Slide 5 — 5W1H và tính khả thi

**Thông điệp chính:** Khả thi vì không xây từ con số 0 — nền ứng dụng đã chạy,
phạm vi v1 được cắt nhỏ có chủ đích, rủi ro có cổng kiểm soát.

**Nội dung hiển thị trên slide:**

- **What/Why:** HRMS tích hợp AI cho B2B — giảm nhập liệu tay, truy vết quyết định, kiểm soát quyền dữ liệu.
- **Who:** HR/recruiter, interviewer, quản lý–lãnh đạo, nhân viên, ứng viên, admin.
- **Where/When:** web app tiếng Việt, Docker trên VPS doanh nghiệp (staging → production); 3 giai đoạn: pilot → mở rộng → tối ưu.
- **Khả thi kỹ thuật & vận hành:** nền recruitment/assessment/Document AI đã chạy; module độc lập, hàng đợi nền, fallback thủ công.
- **Khả thi chi phí & pháp lý:** hạ tầng gọn, AI theo usage có giám sát; consent–retention duyệt trước dữ liệu thật.

**Gợi ý hình ảnh:** Bảng 5W1H gọn ở nửa trái; ma trận 2×2 "Khả thi" ở nửa phải
(Kỹ thuật / Vận hành / Chi phí / Pháp lý–bảo mật) với tick xanh và ghi chú nhỏ
"điều kiện cần duyệt" ở ô pháp lý.

**Lời thoại (~65 giây):**

> Tóm tắt nhanh theo 5W1H: Town Hown là HRMS tích hợp AI cho doanh nghiệp B2B,
> giải quyết bài toán nhập liệu tay và thiếu truy vết quyết định. Người dùng là
> toàn bộ chuỗi nhân sự — từ HR, interviewer tới quản lý, nhân viên và ứng viên.
> Sản phẩm chạy trên web, tiếng Việt ưu tiên, triển khai Docker trên VPS của
> doanh nghiệp theo môi trường staging rồi production. Về khả thi: thứ nhất,
> *kỹ thuật* — chúng tôi không bắt đầu từ số 0; phần tuyển dụng, đánh giá,
> Document AI và email đã có nền chạy thật. *Vận hành* — các module AI nặng
> chạy độc lập qua hàng đợi nền, lỗi không làm sập hệ thống và luôn có đường
> xử lý thủ công. *Chi phí* — hạ tầng gọn, chi phí AI tính theo mức dùng và có
> module giám sát usage riêng. *Pháp lý* — đây là phần chúng tôi nói thẳng:
> chính sách consent và retention phải được duyệt trước khi chạy dữ liệu thật,
> nên pilot chỉ dùng dữ liệu synthetic hoặc có đồng ý hợp lệ.

**Chuyển tiếp:** "Khả thi không chỉ là lời nói — đây là lộ trình cụ thể và cách
chúng tôi đo kết quả."

---

## Slide 6 — Roadmap và hiệu quả kỳ vọng

**Thông điệp chính:** Ba giai đoạn có outcome rõ ràng; KPI đo được — và chúng
tôi đánh dấu trung thực đâu là mục tiêu cần kiểm chứng.

**Nội dung hiển thị trên slide:**

- **Pilot/MVP:** chuỗi tuyển dụng đầu-cuối — tiếp nhận CV, đánh giá ứng viên, phỏng vấn, phân quyền, audit.
- **Mở rộng:** onboarding, hồ sơ nhân viên, chấm công khuôn mặt, cuộc họp → biên bản → task.
- **Tối ưu:** báo cáo quản trị liên domain, tích hợp lịch/webhook, AI nâng cao, Computer Vision sự kiện.
- **KPI mục tiêu** *(giả định)*: thời gian xử lý CV, time-to-hire, tỷ lệ hoàn thành test, % trường AI giữ nguyên.
- **Guardrail:** 0 sự cố vượt quyền; quyết định bị đảo do AI sai không được tăng sau rollout.

**Gợi ý hình ảnh:** Timeline 3 làn ngang (Pilot → Mở rộng → Tối ưu) với cờ
outcome mỗi giai đoạn; bên dưới bảng KPI có cột "Baseline → Target" để trống
ghi "TBD — đo trong pilot". Dán nhãn rõ "mục tiêu, chưa phải kết quả đo được".

**Lời thoại (~60 giây):**

> Roadmap chia ba giai đoạn. *Pilot* tập trung chứng minh một hành trình: từ
> tiếp nhận CV qua đánh giá, phỏng vấn tới quyết định có người review — kèm
> phân quyền và audit ngay từ đầu. *Mở rộng* nối phần còn lại của đời sống
> nhân sự: onboarding, hồ sơ nhân viên, chấm công khuôn mặt, và biến cuộc họp
> thành công việc trên Kanban. *Tối ưu* là báo cáo quản trị liên domain, tích
> hợp lịch và hệ thống ngoài, AI nâng cao và Computer Vision giám sát sự kiện.
> Về KPI, chúng tôi *không bịa số*: các chỉ số như thời gian xử lý một CV,
> thời gian tuyển, tỷ lệ hoàn thành bài test, hay tỷ lệ trường do AI trích
> xuất được HR giữ nguyên — tất cả là **mục tiêu sẽ đo trong pilot**. Hai
> guardrail đã chốt từ đầu: không một sự cố vượt quyền nào được chấp nhận, và
> tỷ lệ quyết định bị đảo vì AI gợi ý sai không được phép tăng.

**Chuyển tiếp:** "Vậy nếu chỉ được nhớ ba điều sau buổi hôm nay — đó là ba điều gì?"

---

## Slide 7 — Kết luận: AI làm việc nặng, con người giữ quyền

**Thông điệp chính:** Town Hown = một luồng nhân sự đáng tin từ đầu đến cuối —
và một kế hoạch kiểm chứng thật thay vì lời hứa.

**Nội dung hiển thị trên slide:**

- **Liên thông:** một luồng dữ liệu từ CV, tài liệu, cuộc họp, bài test đến quyết định và công việc.
- **Kiểm soát:** AI đề xuất có nguồn và giải thích; người duyệt, ghi đè, audit đầy đủ.
- **Khả thi:** nền đã chạy, v1 cắt nhỏ có chủ đích, pilot đo được trước khi mở rộng.
- **Bước tiếp theo:** chạy pilot với doanh nghiệp đối tác → đo KPI → cải tiến theo phản hồi.
- **Kết:** *"AI không thay con người quyết định — Town Hown giúp người quyết định nhanh và chắc hơn."*

**Gợi ý hình ảnh:** Ba cột giá trị (liên thông / kiểm soát / khả thi) với icon
đơn giản; câu kết đặt font lớn ở cuối slide; góc nhỏ QR/link demo nếu có.

**Lời thoại (~50 giây):**

> Tóm lại, Town Hown mang lại ba giá trị. Một, *liên thông*: dữ liệu đi một
> mạch từ CV, tài liệu, cuộc họp, bài test tới quyết định và công việc — không
> còn nhập lại, không còn thất lạc. Hai, *kiểm soát*: AI chỉ đề xuất, luôn kèm
> nguồn và giải thích; con người duyệt, sửa hoặc ghi đè, và mọi thứ có audit.
> Ba, *khả thi*: nền hệ thống đã chạy thật, phạm vi v1 được cắt nhỏ để pilot đo
> được trước khi mở rộng. Bước tiếp theo của chúng tôi là chạy pilot với một
> doanh nghiệp đối tác, đo bộ KPI vừa trình bày và cải tiến theo phản hồi. Vì
> chúng tôi tin: **AI không thay con người quyết định — Town Hown giúp con
> người quyết định nhanh và chắc hơn.**

**Chuyển tiếp:** "Cảm ơn hội đồng đã lắng nghe — chúng em xin sẵn sàng cho phần
phản biện."

---

# Phụ lục

## Tổng thời gian thuyết trình dự kiến

| Slide | Thời lượng lời thoại | Tích lũy |
| --- | --- | --- |
| 1 — Vấn đề | ~60s | 1:00 |
| 2 — Giải pháp | ~55s | 1:55 |
| 3 — Tính năng | ~70s | 3:05 |
| 4 — Công nghệ | ~60s | 4:05 |
| 5 — 5W1H & khả thi | ~65s | 5:10 |
| 6 — Roadmap & KPI | ~60s | 6:10 |
| 7 — Kết luận | ~50s | ~7:00 |

**Tổng: ~7 phút**, còn dư 2–3 phút trong khung 7–10 phút cho chuyển tiếp chậm,
demo nhanh một màn hình hoặc câu hỏi làm rõ ngắn.

## Phân chia lời thoại cho 2 người trình bày

- **Người 1 (Storyteller/Product):** Slide 1 → 3 (~3 phút). Vai trò: kể câu
  chuyện vấn đề, giới thiệu giải pháp và 4 nhóm tính năng — phần "tại sao" và
  "làm được gì".
- **Người 2 (Technical/Delivery):** Slide 4 → 7 (~4 phút). Vai trò: kiến trúc,
  tính khả thi, roadmap/KPI và kết luận — phần "làm thế nào" và "chứng minh ra
  sao".
- Điểm bàn giao: cuối Slide 3, câu chuyển tiếp "Đằng sau bốn nhóm này là một
  lựa chọn kiến trúc rất có chủ đích" là tín hiệu Người 2 nhận lời.

## Dữ liệu/bằng chứng còn thiếu nhóm cần bổ sung

1. **Baseline & target KPI** (PRD `OQ-1`, `OQ-2`): chưa có số liệu đo thực tế —
  toàn bộ KPI trên slide 6 đang là mục tiêu, cần dữ liệu pilot để điền cột
  baseline/target.
2. **Bằng chứng nhu cầu thị trường** (`OQ-7`): economic buyer (Head of HR) mới
  là giả định; cần interview/pilot xác nhận pain và willingness-to-pay trước
  khi claim nhu cầu.
3. **Phạm vi pháp lý** (`OQ-3`): chưa chốt compliance áp dụng (Việt Nam/PDPA hay
  khác) — trên slide chỉ nói "chính sách consent/retention cần duyệt".
4. **Chính sách dữ liệu** (`OQ-6`, `OQ-12`, `OQ-13`): retention/xóa cho CV,
  recording, transcript; chính sách khu vực camera và mức che/lọc ảnh giấy tờ
  trước khi gửi AI provider bên ngoài.
5. **Con số chi phí AI thực tế**: có module `ai-usage-monitoring` nhưng chưa có
  số usage thật — cần đo pilot trước khi trình bày cost model (`OQ-4` pricing
  cũng còn mở).
6. **Contract CV service** (roadmap `OQ-1`): endpoint/event schema của service
  Computer Vision ngoài repo đang build — chưa demo được end-to-end.
7. **Provider tích hợp ngoài** (`OQ-2` roadmap): chưa chọn calendar/webhook
  provider — slide 6 chỉ nêu định hướng.
8. **Dữ liệu demo**: mọi demo/screenshot phải dùng dữ liệu synthetic hoặc có
  đồng ý hợp lệ — cần chuẩn bị bộ dữ liệu giả lập trước buổi trình bày.
9. **Kịch bản thuyết trình cũ**: không tồn tại trong repo để đối chiếu — nếu
  nhóm có bản trước đây, cần hợp nhất thông điệp.

## Năm câu hỏi phản biện và trả lời mẫu

**Q1 — "Điểm mới của Town Hown so với các ATS/HRMS đã có trên thị trường là gì?"**

> Chúng tôi không claim là "HRMS đầu tiên có AI". Điểm khác biệt nằm ở hai chỗ:
> một, luồng dữ liệu *liên thông đầu-cuối* — một sự kiện như CV, biên bản họp
> hay bài test chảy tiếp thành quyết định, task và báo cáo mà không phải nhập
> lại; hai, mọi đề xuất AI đều có provenance, độ tin cậy và human review bắt
> buộc — tức là quyết định nhân sự *truy vết được lý do*, điều các hệ thống
> ghi nhận trạng thái thuần túy không làm.

**Q2 — "Chi phí triển khai và vận hành là bao nhiêu?"**

> Kiến trúc được thiết kế gọn: một ứng dụng Next.js + Supabase đóng gói Docker
> chạy trên VPS — không yêu cầu hạ tầng phức tạp. Chi phí AI tính theo mức dùng
> và hệ thống đã có module giám sát usage/chi phí để kiểm soát ngân sách. Con
> số cụ thể chúng tôi sẽ đo trong pilot thay vì đưa ra ước lượng chưa kiểm
> chứng.

**Q3 — "Dữ liệu sinh trắc học khuôn mặt và dữ liệu nhạy cảm được bảo vệ thế nào?"**

> Module chấm công làm việc trên vector đặc trưng 512 chiều phục vụ so khớp, và
> module giám sát camera được thiết kế *không* nhận diện danh tính cá nhân. Với
> dữ liệu nhạy cảm nói chung: phân quyền theo vai trò và phạm vi ngay tầng dữ
> liệu, mã hóa khi truyền và lưu trữ, audit mọi truy cập, và che/lọc thông tin
> nhạy cảm trước khi gửi dịch vụ AI bên thứ ba. Chúng tôi cũng nói thẳng:
> chính sách consent và retention phải được duyệt trước khi hệ thống chạy dữ
> liệu sinh trắc thật — trước đó chỉ dùng dữ liệu synthetic.

**Q4 — "Nếu AI sai — ví dụ OCR đọc sai CCCD hay matching chấm nhầm — thì sao?"**

> Theo thiết kế, output của AI là *untrusted* cho tới khi con người xác nhận:
> mọi trường trích xuất có độ tin cậy và đường dẫn về vùng tài liệu gốc để đối
> chiếu, confidence thấp bị đánh dấu bắt buộc review. Chất lượng AI không phải
> lời hứa mà là KPI đo được — tỷ lệ trường được HR giữ nguyên so với phải sửa
> (`M-IN-03`), và tỷ lệ quyết định bị đảo do gợi ý AI sai (`M-GR-02`) được theo
> dõi riêng; nếu sai tăng, rollout dừng lại.

**Q5 — "Hệ thống có mở rộng được không, và bền vững về mặt sản phẩm ra sao?"**

> Về kỹ thuật: các tác vụ nặng (OCR, xử lý video) chạy hàng đợi nền hoặc service
> riêng — ví dụ mỗi camera có worker cô lập lỗi — nên mở rộng không làm nghẽn
> web chính. Về sản phẩm: v1 chỉ cam kết 15 capability tạo thành một hành trình
> kiểm chứng được, mở rộng theo từng lát cắt có owner và gate. Chúng tôi cũng
> trung thực rằng nhu cầu buyer vẫn đang được xác nhận — đó chính là lý do
> roadmap bắt đầu bằng pilot đo KPI chứ không phải cam kết thương mại ngay.
