---
type: urd
feature: question-bank
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md, docs/features/question-bank/brainstorms/question-bank-governance.md]
---

# question-bank — User Requirements Document

## 1. Purpose

Cho HR một kho câu hỏi tập trung, đã được kiểm duyệt và truy nguyên được,
để soạn bài đánh giá không còn phụ thuộc file cá nhân rời rạc và không mang
rủi ro câu lỗi/lộ đáp án vào tay ứng viên.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Soạn câu hỏi trong Word/Excel cá nhân hoặc gõ trực tiếp vào từng bài test | Không biết câu nào đã duyệt, trùng nhau, đáp án lộ qua file gửi email | Bài đánh giá chất lượng không đồng đều, mất thời gian soạn lại, rủi ro lộ đáp án | Confirmed — PRD Mục 7.19; nguồn ITBAAI đã có nền question bank (reverse spec `knowledge-and-question-bank`) |
| Interviewer | Được giao soạn câu cho phiên đánh giá | Không có kho dùng lại, phải viết từ đầu | Mất thời gian, câu hỏi không nhất quán giữa các phiên | Confirmed — PRD Mục 7.19, JTBD-INT-01 |
| Reviewer | Không có hàng chờ duyệt chính thức | Câu chưa kiểm tra vẫn vào bài | Câu sai/lệch chuẩn đến tay người làm bài | Assumption — suy từ invariant human-in-the-loop (PRD Mục 12) |
| Admin | Không kiểm soát ai được xem/đổi đáp án | Đáp án có thể lộ ra ngoài phạm vi | Vi phạm tính công bằng của đánh giá | Confirmed — PRD Mục 9 (quyền/audit là constraint) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Vận hành kho câu hỏi và soạn bài cho tuyển dụng/đánh giá | Có kho câu hỏi chất lượng, truy nguyên được, kéo vào bài nhanh | Câu hỏi rải rác, trùng, không rõ trạng thái duyệt, sợ lộ đáp án |
| secondary | Interviewer | Được giao soạn/chọn câu cho phiên hoặc bài | Lấy câu đã duyệt đúng kỹ năng cần | Phải viết lại từ đầu, không có bộ lọc |
| secondary | Reviewer (business owner mảng) | Được giao duyệt câu hỏi | Hàng chờ review rõ ràng, duyệt có ghi nhận | Không có quy trình duyệt chính thức |
| secondary | Admin | Quản trị taxonomy và quyền truy cập | Kiểm soát ai sửa/duyệt/xem đáp án | Không truy vết được thay đổi đáp án |
| out | Ứng viên/người làm bài | Chỉ tiếp xúc câu qua bài đánh giá | (gián tiếp) bài làm từ câu đã duyệt | Không có nhu cầu trực tiếp với feature này |

## 3. Scope Boundaries

### In Scope

- Tạo/xem/sửa/xóa câu hỏi với phân loại theo kỹ năng, topic, trình độ, loại
  câu và nguồn.
- Luồng gửi duyệt → reviewer approve/yêu cầu chỉnh → câu "Đã duyệt" mới
  được chọn vào bài đánh giá.
- Tìm kiếm/lọc câu theo taxonomy và trạng thái.
- Phiên bản câu hỏi và provenance (nguồn, người tạo, người duyệt).
- Ngừng dùng câu hỏi; bảo vệ đáp án theo quyền.
- Bulk import câu hỏi theo file mẫu (đưa câu vào "Bản nháp", vẫn qua
  review).

### Out of Scope

- Marketplace/chia sẻ câu hỏi giữa các tổ chức (PRD "Chưa làm").
- Sinh câu hỏi bằng AI — thuộc `ai-question-generation` (feature này chỉ
  tiếp nhận câu đã duyệt từ đó).
- Soạn cấu trúc bài đánh giá, thời lượng, phát hành link — thuộc
  `assessment-authoring`.
- Chấm và thống kê chất lượng câu từ kết quả làm bài — thuộc
  `assessment-grading` (độ khó thực nghiệm là hướng P2).
- Định nghĩa khung kỹ năng/trình độ — thuộc `talent-framework`; feature
  này chỉ tham chiếu.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi chuẩn bị bài đánh giá cho một vị trí | Tìm được câu hỏi đã duyệt theo kỹ năng/trình độ/loại câu trong một kho duy nhất | Kéo đúng câu vào bài mà không phải hỏi đồng nghiệp hay mở file cũ | Critical | Confirmed — PRD Mục 7.19 |
| UN-002 | HR | Khi soạn câu hỏi mới | Tạo câu đầy đủ: nội dung, loại, đáp án/hướng dẫn chấm, giải thích, phân loại | Câu ở "Bản nháp" sẵn sàng gửi duyệt | Critical | Confirmed — PRD Mục 7.19 (CRUD, taxonomy) |
| UN-003 | HR | Khi có nhiều câu hỏi sẵn trong file | Import hàng loạt theo file mẫu, biết rõ dòng nào lỗi vì sao | Câu hợp lệ vào "Bản nháp", dòng lỗi có lý do để sửa | High | Confirmed — nguồn ITBAAI đã có bulk import (reverse spec FR-KB-01); mức độ ưu tiên v1 là Assumption |
| UN-004 | Reviewer | Khi có câu hỏi chờ duyệt | Một hàng chờ liệt kê câu chờ review với đủ nội dung/đáp án/phân loại/cảnh báo trùng | Quyết định duyệt hoặc yêu cầu chỉnh có ghi chú, được ghi nhận | Critical | Confirmed — PRD Mục 7.19 (review/status); vai trò reviewer cụ thể là OQ-1 |
| UN-005 | HR | Khi câu hỏi đã duyệt cần sửa | Sửa được mà không phá bài đã phát hành; sửa lớn tự tạo phiên bản mới chờ duyệt | Bài cũ giữ snapshot, bản mới qua review trước khi thay thế | High | Assumption — suy từ yêu cầu version + snapshot của PRD Mục 7.19/7.22 |
| UN-006 | Admin | Khi cần kiểm tra ai xem/đổi đáp án | Truy vết được quyền và lịch sử thay đổi trên câu hỏi | Audit đầy đủ, đáp án chỉ lộ cho vai trò được cấp | Critical | Confirmed — PRD Mục 9 (audit boundary), Mục 7.19 (rủi ro lộ đáp án) |
| UN-007 | HR | Khi tạo câu trùng với câu đã có | Được cảnh báo câu gần giống trước khi lưu | Quyết định có tạo mới không một cách có thông tin | Medium | Assumption — suy từ rủi ro "câu hỏi trùng" của PRD Mục 7.19 |
| UN-008 | HR | Khi câu hỏi sai hoặc lỗi thời | Đánh dấu ngừng dùng kèm lý do, không xóa được nếu đã nằm trong bài phát hành | Câu ẩn khỏi chọn mới, bài cũ giữ nguyên, vẫn truy vết được | High | Confirmed — PRD Mục 7.19 (rủi ro câu lỗi); cơ chế cụ thể là Assumption |
| UN-009 | HR | Khi muốn biết câu nào đang được dùng | Xem được câu đang nằm trong bao nhiêu bài, lần dùng cuối | Phát hiện câu "chết" hoặc câu bị lạm dụng để ngừng dùng | Medium | Assumption — mở rộng hợp lý từ "tái sử dụng" của PRD Mục 7.19 |

## 5. Prioritized User Journeys

### Journey 1: Soạn và đưa câu hỏi vào kho đã duyệt

- **User:** HR
- **Importance:** Critical
- **Trigger:** HR cần bổ sung câu hỏi cho một kỹ năng/trình độ trước kỳ
  tuyển.
- **Expected outcome:** Câu hỏi mới ở trạng thái "Đã duyệt", sẵn sàng được
  kéo vào bài đánh giá.
- **Related needs:** UN-001, UN-002, UN-004

1) HR tạo câu hỏi: chọn loại, nhập nội dung, đáp án/hướng dẫn chấm, gán
   kỹ năng + trình độ + topic.
2) Lưu "Bản nháp" → gửi duyệt.
3) Reviewer mở hàng chờ, xem câu cùng cảnh báo trùng (nếu có), duyệt.
4) Câu chuyển "Đã duyệt", hiện trong danh sách chọn câu của
   `assessment-authoring`.

**Independent verification:** Chọn một câu vừa hoàn tất journey — kiểm tra
trên giao diện chọn câu của bài đánh giá thấy câu đó, và bản ghi câu có đủ
người tạo + người duyệt + nguồn.

### Journey 2: Tìm và tái sử dụng câu hỏi đã duyệt

- **User:** HR
- **Importance:** Critical
- **Trigger:** HR đang soạn bài đánh giá và cần câu theo kỹ năng mục tiêu.
- **Expected outcome:** HR lọc ra đúng nhóm câu "Đã duyệt" và đưa vào bài
  mà không rời màn hình soạn bài.
- **Related needs:** UN-001, UN-006

1) Trong màn chọn câu, HR lọc theo kỹ năng → trình độ → loại câu.
2) Xem nhanh nội dung (và đáp án nếu có quyền), chọn câu.
3) Hệ thống tham chiếu câu kèm phiên bản hiện tại vào bài.

**Independent verification:** Với một bài nháp bất kỳ, đối chiếu danh sách
câu đã chọn với bản ghi ngân hàng — mọi câu đều "Đã duyệt" và ghi đúng
phiên bản tại thời điểm chọn.

### Journey 3: Reviewer xử lý hàng chờ duyệt

- **User:** Reviewer
- **Importance:** High
- **Trigger:** Có câu hỏi mới hoặc phiên bản sửa lớn chờ duyệt.
- **Expected outcome:** Mỗi câu chờ duyệt có quyết định rõ ràng (duyệt /
  yêu cầu chỉnh kèm ghi chú), không câu nào treo vô thời hạn.
- **Related needs:** UN-004, UN-006

1) Reviewer mở hàng chờ review, sắp theo thời gian gửi.
2) Mở từng câu: xem nội dung, đáp án, phân loại, nguồn, cảnh báo trùng.
3) "Duyệt" hoặc "Yêu cầu chỉnh" kèm ghi chú → người tạo nhận được phản
   hồi để sửa.

**Independent verification:** Lấy 10 câu đã qua hàng chờ — 100% có bản ghi
quyết định (ai duyệt/yêu cầu chỉnh, khi nào, ghi chú nếu có).

### Journey 4: Import câu hỏi từ file mẫu

- **User:** HR
- **Importance:** High
- **Trigger:** Tổ chức có sẵn bộ câu hỏi trong file cần đưa vào kho.
- **Expected outcome:** Câu hợp lệ vào "Bản nháp" mang nguồn "import",
  dòng lỗi được liệt kê rõ để sửa.
- **Related needs:** UN-003, UN-007

1) HR tải file theo mẫu công bố.
2) Hệ thống kiểm tra từng dòng, báo kết quả x/n thành công kèm lỗi từng
   dòng.
3) HR sửa dòng lỗi, tải lại; các câu đã tạo chờ gửi duyệt như thường.

**Independent verification:** Import một file có cố ý vài dòng lỗi — dòng
hợp lệ tạo câu, dòng lỗi báo đúng số dòng và lý do.

### Journey 5: Xử lý câu hỏi lỗi/hết dùng

- **User:** HR (hoặc admin)
- **Importance:** Medium
- **Trigger:** Phát hiện câu sai nội dung hoặc lệch chuẩn tài liệu.
- **Expected outcome:** Câu ngừng được chọn cho bài mới nhưng bài đã phát
  hành không bị ảnh hưởng.
- **Related needs:** UN-008, UN-009

1) Người có quyền mở câu → "Ngừng dùng" → nhập lý do.
2) Câu ẩn khỏi mọi danh sách chọn; bài nháp đang chứa câu hiện cảnh báo.
3) Bản ghi câu vẫn xem được lịch sử để truy vết.

**Independent verification:** Ngừng dùng một câu đang nằm trong bài đã
phát hành — bài đó vẫn giữ nguyên snapshot câu, còn màn chọn câu không còn
hiện câu này.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Gửi duyệt câu thiếu trường bắt buộc | Người tạo không hiểu vì sao bị chặn | Thông báo liệt kê đúng các field còn thiếu | Journey 1 / UN-002 |
| Câu tự luận không có đáp án cố định | Người tạo bối rối field đáp án | Loại tự luận yêu cầu "hướng dẫn chấm" thay đáp án | UN-002 |
| Import file sai mẫu/vượt giới hạn | Mất công chuẩn bị file | Từ chối file kèm lý do giới hạn cụ thể (định dạng, 5 MB, 500 dòng) | Journey 4 / UN-003 |
| Reviewer duyệt trong lúc người tạo vừa sửa | Duyệt nhầm bản cũ | Hệ thống cảnh báo câu vừa đổi trước khi ghi nhận quyết định | Journey 3 / UN-004 |
| Xóa câu đã nằm trong bài phát hành | Mất evidence bài cũ | Chặn xóa, hướng dẫn "Ngừng dùng" thay thế | Journey 5 / UN-008 |
| Kỹ năng/topic của câu bị gỡ khỏi taxonomy | Câu không còn lọc được đúng | Câu hiện cảnh báo "phân loại không còn hợp lệ" để gán lại | UN-001 |
| Người xem không có quyền đáp án | Thấy thiếu thông tin nhưng không hiểu | Phần đáp án ẩn hẳn + thông báo khi cố truy cập | UN-006 |
| Hai người cùng sửa một câu | Người lưu sau ghi đè | Cảnh báo "câu vừa được {người} cập nhật" trước khi mất dữ liệu | Journey 1 / UN-002 |
| Kho trống (tổ chức mới) | Không biết bắt đầu đâu | Empty state gợi ý tạo câu đầu tiên hoặc import | Journey 1 |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt là ưu tiên; nội dung câu hỏi hỗ trợ tiếng
  Việt đầy đủ (dấu, ký tự đặc biệt).
- Người dùng nội bộ phải đăng nhập và thuộc tổ chức/phạm vi được cấp;
  người làm bài không có giao diện ngân hàng câu hỏi.
- Đáp án/giải thích chỉ hiển thị với vai trò được cấp — đây là điều kiện
  tiên quyết của mọi màn hình liên quan câu hỏi.
- Chỉ câu "Đã duyệt" mới được đưa vào bài đánh giá — không có ngoại lệ.
- Import yêu cầu file theo đúng mẫu đã công bố; người dùng cần lấy được
  file mẫu ngay trong màn hình import.
- Thiết bị: màn hình desktop là chính cho soạn/review câu (bảng lọc, hàng
  chờ); không yêu cầu mobile cho v1.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Reviewer là vai trò nghiệp vụ trong tổ chức, được gán quyền qua org-governance (không phải chỉ admin) | Nếu chỉ admin duyệt → hàng chờ nghẽn, reviewer mảng không có quyền | Assumption — cần owner chốt | Chốt ở OQ-1 (liên quan OQ-11 PRD) |
| Sửa lớn = đổi nội dung/đáp án/trình độ → phiên bản mới chờ review; sửa nhỏ giữ trạng thái | Nếu ngưỡng khác → quy trình duyệt quá nặng hoặc quá lỏng | Assumption | Chốt ở OQ-2 |
| Giới hạn số (2.000 ký tự, 10 lựa chọn, 500 dòng/5 MB, 50 kết quả/trang) là chuẩn v1 | Nếu quá chặt → user bức xúc; quá lỏng → import nặng | Assumption | Chốt ở OQ-7 |
| Câu hỏi thuộc sở hữu 1 tổ chức, không chia sẻ chéo trong v1 | Nếu cần share → thiếu scope marketplace | Confirmed — PRD Mục 7.19 "Chưa làm" | — |
| File mẫu import được công bố kèm feature (CSV/Excel) | Nếu chưa có mẫu → import không dùng được | Assumption | Chốt định dạng ở OQ-5 |
| Câu AI sinh vào kho qua cùng luồng review, chỉ khác nguồn | Nếu có luồng riêng → review 2 nơi | Assumption — bám invariant human review | Đối chiếu khi `ai-question-generation` đặc tả |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | HR tìm và kéo câu đã duyệt vào bài mà không cần nguồn ngoài hệ thống | Chưa có — xác lập bằng quan sát 5 phiên soạn bài đầu tiên trong 1 tháng pilot | ≥80% câu trong bài lấy từ kho (không soạn ngoài) | Tỷ lệ câu trong bài có tham chiếu ngân hàng / tổng câu | 1 tháng sau pilot |
| USC-002 | Mọi câu trong bài phát hành đều đã qua review | 0% (hiện không có review) | 100% | Tỷ lệ câu trong bài phát hành có trạng thái "Đã duyệt" + provenance đủ | Liên tục, review hàng tháng |
| USC-003 | Reviewer xử lý hàng chờ không để câu treo | Chưa có — xác lập bằng đo thời gian chờ trung bình trong 1 tháng pilot | Câu chờ review được quyết định trong ≤3 ngày làm việc | Thời gian từ "gửi duyệt" đến quyết định đầu tiên | 1 tháng sau pilot |
| USC-004 | Người làm bài không bao giờ thấy đáp án | 0 sự cố | 0 sự cố lộ đáp án được xác nhận | Số incident bảo mật liên quan đáp án (bám M-GR-01) | Liên tục |
| USC-005 | HR không lãng phí soạn trùng câu đã có | Chưa có — xác lập bằng audit trùng sau 1 tháng | ≥90% cảnh báo trùng được người tạo xử lý có ý thức (dùng câu cũ hoặc xác nhận tạo mới) | Tỷ lệ cảnh báo near-duplicate có hành động xác nhận | 1 tháng sau pilot |

## 10. Open Questions

- [ ] OQ-1: Ai là reviewer hợp lệ cho câu hỏi — admin, HR lead, hay
  business owner từng mảng kỹ năng? (liên quan OQ-11 PRD, OQ-KB-01
  reverse spec)
- [ ] OQ-2: Ngưỡng "sửa lớn" buộc tạo phiên bản mới chờ review — chỉ đổi
  nội dung/đáp án/trình độ, hay cả đổi kỹ năng/topic?
- [ ] OQ-3: Cơ chế phát hiện trùng v1 — trùng tuyệt đối theo nội dung hay
  near-duplicate; ai chốt ngưỡng "gần giống"? (OQ-KB-03)
- [ ] OQ-4: Tài liệu nguồn có bản mới được duyệt thì câu hỏi trỏ tới bị
  đánh dấu "cần rà soát" tự động hay chỉ cảnh báo cho owner? (R-11, OQ-9
  PRD)
- [ ] OQ-5: Định dạng file mẫu bulk import (cột bắt buộc) do ai công bố
  và version file mẫu quản lý thế nào?
- [ ] OQ-6: Retention cho câu hỏi đã ngừng dùng/xóa — giữ bao lâu cho
  audit và truy vết bài cũ? (OQ-KB-02, OQ-6 PRD)
- [ ] OQ-7: Các giới hạn (2.000 ký tự, 10 lựa chọn, 500 dòng/5 MB, 50
  kết quả/trang) có được owner chấp nhận làm chuẩn v1 không?
