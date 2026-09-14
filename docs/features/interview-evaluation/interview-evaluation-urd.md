---
type: urd
feature: interview-evaluation
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/interview-evaluation/brainstorms/structured-evaluation-and-ai-summary.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md]
---

# interview-evaluation — User Requirements Document

## 1. Purpose

Cho interviewer một phiếu đánh giá theo khung tiêu chí thống nhất — điểm
từng tiêu chí, nhận xét, evidence và khuyến nghị — nộp đúng hạn, và cho
HR một bản tóm tắt AI giữ nguyên ý kiến bất đồng cùng trích nguồn về
từng phiếu gốc, để quyết định vòng phỏng vấn luôn là quyết định của con
người có căn cứ truy vết được.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Interviewer | Ghi nhận xét vào file cá nhân, chat hoặc không ghi sau buổi phỏng vấn | Không có khung chung, hay quên, không có hạn rõ | Đánh giá không nhất quán giữa các phiên, HR phải đuổi xin nhận xét | Confirmed — PRD Mục 7.10, JTBD-INT-01 |
| HR | Tự tổng hợp ý kiến nhiều interviewer bằng tay | Ý kiến bất đồng bị mất dấu, không nhớ ai nói gì | Quyết định đạt/trượt thiếu căn cứ truy vết | Confirmed — PRD Mục 7.10 (rủi ro chính), Mục 6.1 "quyết định có evidence" |
| HR | Trong nguồn cũ, một kết quả pass/fail đầu tiên tự chốt pipeline | Phiếu của một interviewer được ngầm coi là quyết định tuyển | Quyết định sai khi còn vòng/người đánh giá khác | Observed: reverse spec FR-RC-06, GAP-RC-02, OQ-RC-01 |
| Quản lý | Muốn biết vì sao ứng viên đạt/trượt | Không có nơi xem căn cứ quyết định | Không giải thích được cho team và cho chính mình | Assumption — suy từ JTBD-MGR-01 |
| Ứng viên | Kết quả phỏng vấn là hộp đen | Không biết quyết định dựa trên gì | Trải nghiệm thiếu công bằng | Confirmed — PRD Mục 3 (JTBD-CAN-01) |
| Admin | Phiếu đánh giá chứa nhận xét nhạy cảm về con người | Không kiểm soát ai xem phiếu/tóm tắt | Lộ đánh giá ngoài phạm vi, khiếu nại privacy | Confirmed — PRD Mục 9 (consent/access/retention) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Interviewer | Được gán vào phiên phỏng vấn và phải ghi đánh giá sau buổi | Form theo khung quen thuộc, lưu nháp được, nộp một lần, được nhắc đúng hạn | Viết tự do mất thời gian, hay quên, không biết nộp cho ai |
| secondary | HR | Điều phối vòng tuyển và ra quyết định vòng | Thấy ai đã nộp/thiếu, có tóm tắt AI giữ bất đồng để quyết nhanh mà có căn cứ | Đuổi phiếu từng người, tổng hợp tay, mất ý kiến bất đồng |
| secondary | HR lead / người được cấp quyết định | Ghi quyết định vòng cho phiên | Quyết định có căn cứ, kích pipeline đúng lúc | Quyết định bị một phiếu đơn lẻ chốt thay |
| secondary | Quản lý | Xem kết quả vòng của ứng viên vào đơn vị | Hiểu căn cứ quyết định trong phạm vi quyền | Không truy cập được evidence |
| secondary | Admin | Kiểm soát quyền xem phiếu và retention | Nhận xét về con người chỉ lộ đúng phạm vi, có audit | Không truy vết được lượt xem |
| out | Ứng viên | Chịu kết quả quyết định | (gián tiếp) quyết định công bằng có căn cứ | Không thao tác trong feature; không được chia sẻ phiếu trong v1 |

## 3. Scope Boundaries

### In Scope

- Phiếu đánh giá theo rubric của phiên: mỗi interviewer (participant đã
  chấp nhận) một phiếu — điểm từng tiêu chí, nhận xét theo tiêu chí,
  nhận xét tổng và khuyến nghị tổng bắt buộc.
- Evidence trên phiếu: ghi chú, link, file đính kèm, tham chiếu
  recording/transcript khi có.
- Lưu nháp, submit có xác nhận và idempotent; phiếu khóa sau nộp; trả về
  yêu cầu bổ sung kèm lý do và nộp lại có lịch sử.
- Hạn nộp phiếu và nhắc khi sắp/quá hạn; trạng thái nộp theo phiên
  (x/y) cho HR.
- AI tóm tắt theo yêu cầu của HR: điểm trung bình theo tiêu chí, đồng
  thuận, bất đồng giữ nguyên kèm trích nguồn, evidence nổi bật, danh
  sách phiếu nguồn/phiếu thiếu; summary có phiên bản + model/version.
- HR review tóm tắt cạnh phiếu gốc: chấp nhận (có thể sửa), tạo lại;
  mọi tóm tắt ở "chờ review" tới khi HR xử lý.
- Quyết định vòng của con người (đạt / không đạt / cần thêm vòng) kèm
  căn cứ — kích sự kiện cho `candidate-pipeline`.
- Quyền theo scope: interviewer chỉ thấy phiếu của mình; audit truy cập.

### Out of Scope

- AI ra quyết định pass/fail cuối cùng (PRD "Chưa làm"; invariant Mục
  12) — tóm tắt chỉ là hỗ trợ review.
- Lập lịch, gán participant, nhận/từ chối phiên — thuộc
  `interview-management`; feature này chỉ nhận phiên "đã diễn ra".
- Ghi âm/transcript — thuộc `interview-recording`; feature này chỉ tham
  chiếu làm evidence.
- Chuyển stage application — thuộc `candidate-pipeline`; feature này chỉ
  phát sự kiện quyết định đã review.
- Chia sẻ kết quả/feedback cho ứng viên — v1 không chia sẻ (OQ-7).
- Chấm bài đánh giá trắc nghiệm/tự luận — thuộc `assessment-grading`.
- Định nghĩa khung kỹ năng — thuộc `talent-framework`; rubric phỏng vấn
  chỉ tham chiếu.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Interviewer | Sau khi phiên mình tham gia đã diễn ra | Form đánh giá theo rubric thống nhất: điểm từng tiêu chí + nhận xét + khuyến nghị tổng | Ghi đánh giá nhất quán mà không phải tự nghĩ cấu trúc | Critical | Confirmed — PRD Mục 7.10 (evaluation form theo khung thống nhất) |
| UN-002 | Interviewer | Khi chưa kịp hoàn thành phiếu | Lưu nháp bất cứ lúc nào và quay lại tiếp tục | Không mất nội dung đã ghi | High | Assumption — suy từ luồng draft/submit PRD Mục 7.10 |
| UN-003 | Interviewer | Khi nộp đánh giá | Submit một lần có xác nhận, không sợ nộp trùng; phiếu khóa sau nộp | Phiếu đã nộp là bản chính thức, chỉ mở lại khi HR trả về | Critical | Confirmed — PRD Mục 7.10 (result, submit); brainstorm Mục 4 |
| UN-004 | Interviewer | Khi sắp/quá hạn nộp | Được nhắc trước hạn và biết hạn nộp rõ ràng | Phiếu được nộp đúng hạn | High | Confirmed — PRD Mục 7.10 (đo thành công: đúng hạn) |
| UN-005 | Interviewer | Khi cần dẫn chứng cho nhận xét | Đính kèm link/file/tham chiếu transcript làm evidence | Nhận xét có căn cứ kiểm chứng được | High | Confirmed — PRD Mục 7.10 (note, evidence) |
| UN-006 | HR | Khi theo dõi một phiên | Thấy ai đã nộp, ai còn thiếu, phiếu nào quá hạn | Không phải hỏi từng interviewer | Critical | Confirmed — PRD Mục 7.10 (đo: phiên có đánh giá đầy đủ) |
| UN-007 | HR | Khi cần tổng hợp nhiều phiếu | AI tóm tắt giữ nguyên bất đồng kèm trích nguồn về từng phiếu gốc | Tổng hợp nhanh mà không mất ý kiến khác biệt | Critical | Confirmed — PRD Mục 7.10 (summary; rủi ro mất bất đồng) |
| UN-008 | HR | Khi tóm tắt chưa đúng hoặc có phiếu mới | Chỉnh sửa/chấp nhận/tạo lại tóm tắt; tóm tắt luôn trỏ phiếu nguồn | Bản hiệu lực do con người kiểm soát | Critical | Confirmed — PRD Mục 12 (AI output có review/override) |
| UN-009 | HR (vai trò được cấp) | Khi đủ căn cứ để quyết | Ghi quyết định vòng đạt/không đạt/cần thêm vòng kèm căn cứ, kích pipeline | Quyết định của con người mới đưa application đi tiếp | Critical | Confirmed — PRD Mục 7.10 (HR review trước quyết định); sửa GAP-RC-02 |
| UN-010 | HR | Khi phiếu thiếu nội dung cần thiết | Trả về phiếu kèm lý do để interviewer bổ sung và nộp lại | Phiếu đủ chất lượng trước khi tổng hợp | Medium | Assumption — suy từ luồng review của PRD Mục 7.10 |
| UN-011 | Admin/Quản lý | Khi xem phiếu và tóm tắt | Truy cập đúng data-scope; interviewer chỉ thấy phiếu của mình | Nhận xét về con người không lộ ngoài phạm vi | Critical | Confirmed — PRD Mục 9 (access/audit) |
| UN-012 | HR | Khi so sánh ý kiến các interviewer | Bảng điểm theo tiêu chí × interviewer của cùng phiên | Nhận biết bất đồng trực quan | Medium | Assumption — mở rộng hợp lý từ "tổng hợp" PRD Mục 7.10 |

## 5. Prioritized User Journeys

### Journey 1: Interviewer ghi và nộp phiếu đánh giá

- **User:** Interviewer
- **Importance:** Critical
- **Trigger:** Phiên mà interviewer là participant đã chấp nhận chuyển
  "đã diễn ra".
- **Expected outcome:** Phiếu đủ trường bắt buộc ở trạng thái "đã nộp",
  khóa sửa, HR thấy trạng thái nộp cập nhật.
- **Related needs:** UN-001, UN-002, UN-003, UN-005

1) Interviewer mở phiên đã diễn ra → "Ghi đánh giá" → form theo rubric
   của phiên.
2) Chấm điểm từng tiêu chí, viết nhận xét, đính kèm evidence khi cần;
   lưu nháp tự do.
3) Nhập nhận xét tổng và chọn khuyến nghị → "Nộp đánh giá" → xác nhận.
4) Phiếu chuyển "đã nộp", khóa chỉnh sửa; trạng thái phiên cập nhật
   x/y.

**Independent verification:** Chọn một phiếu vừa nộp — kiểm tra phiếu
không sửa được nữa, có đủ điểm mọi tiêu chí + nhận xét tổng + khuyến
nghị, và màn phiên của HR hiển thị đúng số phiếu đã nộp.

### Journey 2: HR tổng hợp bằng AI và review tóm tắt

- **User:** HR
- **Importance:** Critical
- **Trigger:** Phiên có ít nhất một phiếu "đã nộp".
- **Expected outcome:** Bản tóm tắt "đã chấp nhận" làm bản hiệu lực của
  phiên, luôn trỏ về các phiếu nguồn và ghi rõ phiếu còn thiếu.
- **Related needs:** UN-006, UN-007, UN-008

1) HR mở phiên → "Tổng hợp AI" → chờ job sinh tóm tắt "chờ review".
2) Đọc tóm tắt: điểm trung bình theo tiêu chí, đồng thuận, bất đồng kèm
   trích nguồn, evidence nổi bật, danh sách phiếu nguồn/thiếu.
3) Đối chiếu phiếu gốc cạnh tóm tắt → "Chấp nhận" (có thể sửa trước)
   hoặc "Tạo lại" khi có phiếu mới.

**Independent verification:** Trên một phiên có ≥2 phiếu chấm khác nhau
ở cùng tiêu chí — kiểm tra tóm tắt được chấp nhận có mục bất đồng ghi
đúng hai ý kiến kèm trỏ về hai phiếu gốc.

### Journey 3: HR ghi quyết định vòng

- **User:** HR (vai trò được cấp)
- **Importance:** Critical
- **Trigger:** HR đã xem phiếu/tóm tắt và đủ căn cứ quyết.
- **Expected outcome:** Quyết định vòng ghi nhận kèm căn cứ + người
  quyết định; pipeline nhận sự kiện để chuyển stage phù hợp.
- **Related needs:** UN-009

1) HR mở phiên → "Ghi quyết định" → chọn đạt / không đạt / cần thêm
   vòng → nhập nhận xét căn cứ → xác nhận.
2) Hệ thống ghi quyết định và phát sự kiện; `candidate-pipeline` chuyển
   PASSED/FAILED hoặc giữ stage khi cần thêm vòng.
3) Phiếu của phiên khóa vĩnh viễn.

**Independent verification:** Kiểm tra một quyết định vừa ghi — có đủ
người quyết định, thời điểm, căn cứ; và trên pipeline, transition tương
ứng ghi nguồn là quyết định này (không phải phiếu interviewer đơn lẻ).

### Journey 4: Trả về phiếu yêu cầu bổ sung

- **User:** HR → Interviewer
- **Importance:** High
- **Trigger:** Phiếu đã nộp nhưng thiếu nội dung cần thiết (nhận xét
  mỏng, thiếu evidence), phiên chưa có quyết định.
- **Expected outcome:** Phiếu về "bị trả về" kèm lý do; interviewer
  sửa và nộp lại; history giữ cả hai lần nộp.
- **Related needs:** UN-010, UN-003

1) HR mở phiếu đã nộp → "Yêu cầu bổ sung" → nhập lý do → phiếu về "bị
   trả về", interviewer được thông báo.
2) Interviewer mở lại phiếu, chỉnh sửa, nộp lần hai.
3) History giữ cả hai lần nộp kèm lý do trả về.

**Independent verification:** Trả về một phiếu rồi nộp lại — bản ghi
phiếu hiện hai sự kiện nộp và một sự kiện trả về kèm lý do, theo đúng
thứ tự thời gian.

### Journey 5: Xử lý phiếu quá hạn

- **User:** Interviewer, HR
- **Importance:** Medium
- **Trigger:** Phiếu chưa nộp khi đến/quá hạn nộp.
- **Expected outcome:** Interviewer được nhắc; HR thấy phiếu "quá hạn";
  quyết định vòng vẫn ghi được trên phần phiếu có sẵn với ghi chú thiếu.
- **Related needs:** UN-004, UN-006, UN-009

1) Đến trước hạn, hệ thống nhắc interviewer; quá hạn chưa nộp, phiếu
   đánh dấu "quá hạn" và hiện trong danh sách thiếu của HR.
2) Interviewer vẫn nộp được — phiếu ghi "nộp trễ".
3) HR quyết định được trên các phiếu có sẵn; quyết định ghi rõ "thiếu
   phiếu của {người}".

**Independent verification:** Cho một phiếu quá hạn chưa nộp — HR thấy
cờ quá hạn, vẫn ghi được quyết định vòng, và bản ghi quyết định có ghi
chú phiếu thiếu.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Submit khi thiếu trường bắt buộc | Không hiểu vì sao bị chặn | Thông báo liệt kê đúng field thiếu (tiêu chí chưa chấm, nhận xét tổng, khuyến nghị) | Journey 1 / UN-003 |
| Người không phải participant của phiên cố ghi phiếu | Form hiện cho sai người | Từ chối + "Bạn không được gán vào phiên phỏng vấn này" | UN-001, UN-011 |
| Sửa phiếu đã nộp | Mất tính chính thức của phiếu | Chặn + "Phiếu đã được nộp — chỉ sửa khi HR trả về" | Journey 1 / UN-003 |
| Submit trùng (double-click/retry) | Hai phiếu cho một interviewer | Submit idempotent — một phiếu "đã nộp" duy nhất | Journey 1 / UN-003 |
| Tổng hợp AI khi chưa có phiếu nào | Job chạy trên dữ liệu trống | Nút mờ + "cần ít nhất một phiếu đã nộp" | Journey 2 / UN-007 |
| Job AI lỗi/timeout | Không có tóm tắt | Job trạng thái lỗi + thử lại; phiếu gốc luôn xem được (đường thủ công) | Journey 2 / UN-008 |
| Phiếu mới nộp sau khi tóm tắt đã tạo | Tóm tắt thiếu một ý kiến | Cảnh báo "phiếu {người} nộp sau khi tóm tắt" + gợi ý tạo lại | Journey 2 / UN-008 |
| Trả về phiếu khi phiên đã có quyết định | Vòng lặp vô nghĩa | Chặn trả về sau quyết định — phiếu đã khóa vĩnh viễn | Journey 4 / UN-010 |
| Quyết định khi còn thiếu phiếu | Vội quyết mất ý kiến | Cho quyết nhưng bắt buộc ghi nhận "thiếu phiếu của {người}" trong căn cứ | Journey 5 / UN-009 |
| Application đổi stage trước khi quyết định | Transition vô nghĩa | Vẫn ghi quyết định, nhưng báo HR khi kích transition không hợp lệ | Journey 3 / UN-009 |
| Rubric đổi khi đang có phiếu nháp | Hai phiếu theo hai khung khác nhau | Phiếu khóa rubric tại thời điểm mở + cảnh báo khi rubric mới khác | UN-001 |
| Người xem ngoài data-scope | Xem nhận xét về con người vượt quyền | Từ chối + ghi audit lượt truy cập bị từ chối | UN-011 |
| Phiên bị hủy sau khi phiếu đã nộp | Phiếu treo không rõ | Phiếu giữ nguyên + đánh dấu "phiên đã hủy" | Journey 1 |

## 7. User-side Constraints

- Ngôn ngữ giao diện và thông báo tiếng Việt (PRD Mục 9).
- Chỉ participant đã chấp nhận của phiên "đã diễn ra" mới ghi được phiếu;
  interviewer chỉ xem phiếu của chính mình — điều kiện tiên quyết.
- Phiếu đã nộp là bất biến với interviewer; chỉ HR mở lại qua "trả về"
  có lý do; mọi phiếu khóa vĩnh viễn khi phiên có quyết định.
- AI chỉ hỗ trợ: tóm tắt luôn "chờ review" tới khi HR xử lý; không có
  đường nào để AI output tự thành quyết định (invariant PRD Mục 12).
- Quyết định vòng bắt buộc kết quả + căn cứ và chỉ vai trò được cấp ghi
  — điều kiện tiên quyết trước khi pipeline đi tiếp.
- Phiếu, tóm tắt, quyết định chứa nhận xét về con người — truy cập theo
  data-scope, lượt xem có audit; không chia sẻ cho ứng viên trong v1.
- Màn hình chính desktop (form tiêu chí, bảng so sánh, review tóm tắt);
  interviewer có thể ghi trên thiết bị thường dùng nhưng không yêu cầu
  mobile riêng cho v1.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Hạn nộp phiếu 48 giờ sau giờ kết thúc phiên; nộp trễ vẫn hợp lệ nhưng mang cờ | Nếu hạn khác → nhắc sai nhịp; nếu nộp trễ bị chặn → mất ý kiến | Assumption — đã giải OQ-1 (đề xuất) | Recruitment owner xác nhận |
| Rubric v1: 3–10 tiêu chí, thang 1–5, một bộ mặc định tổ chức gán theo vị trí/vòng khi cần; quyền soạn là HR lead/admin | Nếu thang/tiêu chí khác → điểm không so sánh được | Assumption — đã giải OQ-2 (đề xuất) | Head of HR xác nhận (liên quan OQ-11 PRD) |
| HR được quyết định khi còn thiếu phiếu, miễn ghi nhận phiếu thiếu trong căn cứ | Nếu bắt buộc đủ phiếu → vòng tuyển kẹt khi interviewer bỏ phiếu | Assumption — đã giải OQ-3 (đề xuất) | Head of HR xác nhận |
| Phiếu khóa rubric tại thời điểm mở; rubric đổi chỉ ảnh hưởng phiếu mở sau | Nếu bắt theo rubric mới → phiếu nháp phải làm lại | Assumption — đã giải OQ-4 (đề xuất) | Product owner xác nhận |
| Đảo quyết định = bản ghi mới kèm lý do, quyết định gốc giữ làm lịch sử | Nếu cho sửa trực tiếp → mất vết quyết định ban đầu | Assumption — đã giải OQ-5 (đề xuất) | Head of HR xác nhận |
| Interviewer chỉ thấy phiếu của mình; HR/HR lead trong scope xem đủ; không ẩn danh tác giả trong v1 | Nếu interviewer được xem lẫn nhau → rò rỉ nhận xét nội bộ | Assumption — đã giải OQ-6 (đề xuất) | Head of HR xác nhận |
| AI tóm tắt chạy khi HR bấm, từ phiếu đã nộp tại thời điểm chạy | Nếu tự chạy → tóm tắt lỗi thời khi phiếu nộp sau | Assumption — bám provenance PRD Mục 12 | — |
| Không chia sẻ kết quả/feedback cho ứng viên trong v1 | Nếu cần chia sẻ → thiếu surface và policy nội dung | Assumption — đã giải OQ-7 | Product owner xác nhận khi có nhu cầu |
| Retention phiếu/tóm tắt/quyết định theo retention hồ sơ tuyển dụng chung | Nếu retention khác → thiếu chính sách xóa riêng | Assumption — đã giải OQ-8 (PRD OQ-6) | DPO duyệt policy retention |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Phiên phỏng vấn có đánh giá đầy đủ đúng hạn | Chưa có — xác lập bằng tỷ lệ phiếu nộp trong 48 giờ trong 1 tháng pilot | Tỷ lệ phiên đủ phiếu đúng hạn đạt mức sponsor duyệt (chờ OQ-2 sản phẩm) | Phiên có đủ phiếu "đã nộp" trước hạn / phiên đã diễn ra | 1 tháng sau pilot |
| USC-002 | Quyết định vòng luôn là của con người có căn cứ | 0% trước feature | 100% quyết định có người quyết định + căn cứ + thời điểm; 0 quyết định do AI/tự động | Kiểm tra mẫu quyết định + audit | Liên tục |
| USC-003 | Tóm tắt AI không làm mất ý kiến | Chưa có — xác lập trong pilot | 100% tóm tắt có mục bất đồng kèm trích nguồn và danh sách phiếu nguồn/thiếu | Kiểm tra mẫu tóm tắt đã chấp nhận | Hàng tháng |
| USC-004 | Một phiếu interviewer không tự chốt pipeline | 0 sự cố | 0 transition pipeline chỉ từ phiếu đơn lẻ chưa qua quyết định HR (sửa GAP-RC-02) | Giám sát nguồn transition trên pipeline | Liên tục |
| USC-005 | HR không phải đuổi phiếu thủ công | Chưa có — xác lập bằng số lần nhắc tay ngoài hệ thống trong pilot | ≥80% phiếu được nộp sau nhắc tự động mà không cần HR liên hệ trực tiếp (đề xuất) | Tỷ lệ phiếu nộp sau sự kiện nhắc của hệ thống | 1 tháng sau pilot |

## 10. Open Questions

- [x] OQ-1: Hạn nộp phiếu và chính sách nộp trễ — Resolved (đề xuất):
  48 giờ sau giờ kết thúc phiên; nộp trễ vẫn hợp lệ nhưng mang cờ "nộp
  trễ" — chờ Recruitment owner xác nhận.
- [x] OQ-2: Cấu trúc rubric và quyền soạn — Resolved (đề xuất): 3–10
  tiêu chí, thang 1–5, mặc định tổ chức gán theo vị trí/vòng; HR
  lead/admin soạn — chờ Head of HR xác nhận (liên quan OQ-11 PRD).
- [x] OQ-3: Quyết định khi còn thiếu phiếu — Resolved (đề xuất): HR
  được quyết định trên phiếu có sẵn, bắt buộc ghi nhận phiếu thiếu trong
  căn cứ — chờ Head of HR xác nhận.
- [x] OQ-4: Rubric đổi giữa chừng — Resolved (đề xuất): phiếu khóa
  rubric tại thời điểm mở, rubric mới chỉ áp cho phiếu mở sau — chờ
  Product owner xác nhận.
- [x] OQ-5: Đảo quyết định — Resolved (đề xuất): ghi đảo là bản ghi mới
  kèm lý do bắt buộc, quyết định gốc giữ làm lịch sử; chỉ vai trò được
  cấp — chờ Head of HR xác nhận.
- [x] OQ-6: Ai xem phiếu người khác — Resolved (đề xuất): interviewer
  chỉ thấy phiếu của mình; HR/HR lead trong data-scope xem đầy đủ có
  audit; không ẩn danh tác giả trong v1 — chờ Head of HR xác nhận.
- [x] OQ-7: Chia sẻ kết quả cho ứng viên — Resolved: không chia sẻ
  trong v1; khi có nhu cầu cần quyết định riêng về nội dung được lộ.
- [x] OQ-8: Retention phiếu/tóm tắt/quyết định — Resolved (đề xuất):
  theo retention hồ sơ tuyển dụng chung; trước khi DPO duyệt chỉ dùng
  dữ liệu synthetic (PRD OQ-6, Mục 9).
