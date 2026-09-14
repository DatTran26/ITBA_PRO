---
type: urd
feature: assessment-authoring
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/assessment-authoring/brainstorms/assessment-build-and-publish.md, docs/_reverse/assessment-and-grading/reverse-spec.md]
---

# assessment-authoring — User Requirements Document

## 1. Purpose

Cho HR/interviewer một cách tạo và phát hành bài đánh giá nhất quán, đúng
mục tiêu và kiểm soát được: bài chỉ gồm câu đã duyệt, cấu hình đầy đủ qua
checklist, xem trước được như người làm bài, và phát hành qua link có hạn
và giới hạn lượt — thay vì soạn tay rồi gửi link không kiểm soát.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Soạn bài test mới cho mỗi đợt tuyển bằng cách gõ trực tiếp hoặc copy bài cũ | Cấu hình lệch giữa các lần (thời lượng, số câu), không ai kiểm tra trước khi gửi ứng viên | Bài phải hủy khi phát hiện sai, xin ứng viên làm lại — mất thời gian và uy tín | Confirmed — PRD Mục 7.21 (rủi ro "bài test không đo đúng job/level") |
| HR | Phát link bài cho ứng viên qua token chia sẻ | Token không rõ hạn, không thu hồi được, không giới hạn lượt | Link bị phát tán, người không được mời làm bài, kết quả nhiễu | Observed: reverse spec `assessment-and-grading` (GAP-AS-03, OQ-AS-01) |
| Interviewer | Được giao soạn bài cho mảng kỹ năng mình phụ trách | Không có khung chuẩn, phải tự cấu hình và tự viết/tìm câu | Bài không nhất quán giữa các phiên, chất lượng tùy người | Confirmed — PRD Mục 3 (JTBD-INT-01), Mục 7.21 |
| HR | Muốn đổi nội dung bài sau khi đã gửi link | Không rõ bài đã phát hành có bị sửa ngầm khi người khác đang làm | Hai ứng viên có thể làm hai đề khác nhau — tranh chấp công bằng | Assumption — suy từ yêu cầu snapshot bất biến (PRD Mục 7.22) |
| Admin | Không truy vết được ai phát hành/sửa bài và link nào | Thay đổi cấu hình sau phát hành không có lý do | Không điều tra được khi có khiếu nại | Confirmed — PRD Mục 9 (audit), Mục 7.22 (override có lý do và audit) |
| Ứng viên | Nhận bài cấu hình sai hoặc link không rõ hạn | Không biết luật chơi trước khi làm | Trải nghiệm kém, khiếu nại quy trình | Confirmed — PRD Mục 3 (JTBD-CAN-01), Mục 7.22 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR (author) | Vận hành đánh giá trong pipeline tuyển dụng và đánh giá nội bộ | Tạo bài đúng mục tiêu, phát hành qua link kiểm soát được, không phải hủy vì cấu hình sai | Soạn lại từ đầu mỗi lần; link không hạn; không biết bài có lỗi trước khi phát |
| secondary | Interviewer (đồng tác giả) | Được giao soạn bài cho phiên/mảng phụ trách | Soạn từ mẫu và câu đã duyệt, preview trước khi phát hành | Thiếu khung chuẩn, sợ cấu hình sai |
| secondary | Admin | Quản trị quyền và audit | Kiểm soát ai được phát hành, truy vết thay đổi | Không truy vết được hành động phát hành/link |
| secondary | Reviewer (tùy chọn) | Xem bài trước phát hành khi tổ chức yêu cầu | Hàng chờ/xem trước có ghi nhận | Chưa có quy trình — P2 |
| out | Ứng viên / nhân viên | Làm bài qua link/tài khoản | (gián tiếp) nhận bài đúng chuẩn | Không thao tác trong feature này — làm bài ở `candidate-assessment` |

## 3. Scope Boundaries

### In Scope

- CRUD bài đánh giá ở trạng thái nháp với đầy đủ cấu hình nghiệp vụ: mục
  tiêu (vị trí/JD), trình độ, đối tượng, thời lượng, quy tắc chấm, hướng
  dẫn, chính sách hiển thị kết quả.
- Áp mẫu cấu hình đã công bố (`assessment-templates`) thành bản sao độc
  lập; ghi nhận bài-sinh-từ-mẫu để truy vết.
- Soạn đề từ ngân hàng câu hỏi: chỉ câu "Đã duyệt", sắp thứ tự, gán điểm,
  cảnh báo câu ngừng dùng/phiên bản mới.
- Preview người làm bài (ẩn đáp án) và checklist bắt buộc trước phát hành.
- Phát hành + quản lý link/token: hạn, giới hạn lượt, thu hồi kèm lý do;
  đóng bài; vòng đời bản nháp → đã phát hành → đã đóng.
- Sửa sau phát hành giới hạn ở field không ảnh hưởng đề, có lý do + audit;
  thay đổi đề qua nhân bản thành bản nháp mới.
- Provenance: nguồn bài (tạo tay/từ mẫu), người tạo, người phát hành,
  thời điểm, snapshot câu theo phiên bản.

### Out of Scope

- Làm bài, autosave, timer, submit, biên nhận và khôi phục attempt — thuộc
  `candidate-assessment` (feature này chỉ công bố chính sách để bên đó
  thực thi).
- Chấm điểm, phân tích, regrade, phát hành kết quả chi tiết — thuộc
  `assessment-grading`.
- Soạn/review câu hỏi và taxonomy — thuộc `question-bank`; sinh câu bằng
  AI — thuộc `ai-question-generation` (feature này chỉ điều hướng tới).
- Quản lý mẫu (vòng đời, review, công bố) — thuộc `assessment-templates`;
  feature này chỉ tiêu thụ mẫu đã công bố.
- Adaptive testing, section có thời lượng riêng, random đề theo ma trận —
  PRD "Chưa làm".
- Reopen/regrade/override attempt — hành động thuộc `candidate-assessment`/
  `assessment-grading`; feature này chỉ đảm bảo chính sách author công bố
  tồn tại để các hành động đó đối chiếu.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi mở một vị trí tuyển cần đánh giá | Tạo bài đánh giá gắn mục tiêu (vị trí/trình độ/đối tượng) trong một màn cấu hình duy nhất | Bản nháp bài đầy đủ cấu hình nghiệp vụ, không phải ghép từ nhiều nơi | Critical | Confirmed — PRD Mục 7.21 (test config) |
| UN-002 | HR | Khi đã có mẫu chuẩn cho loại bài này | Chọn mẫu để điền sẵn cấu hình rồi chỉnh phần khác | Bản nháp có sẵn cấu hình mẫu (bản sao độc lập), biết bài sinh từ mẫu nào | High | Confirmed — PRD Mục 7.31 luồng "chọn mẫu khi tạo bài"; brainstorm `assessment-templates` Mục 5.2 |
| UN-003 | HR | Khi soạn đề | Chỉ chọn được câu "Đã duyệt" từ ngân hàng, sắp thứ tự, gán điểm, thấy tổng điểm | Đề hoàn chỉnh từ câu hỏi đã kiểm duyệt | Critical | Confirmed — PRD Mục 7.21 (question composition), Mục 12 (human-in-the-loop) |
| UN-004 | HR | Khi đề có câu bị ngừng dùng hoặc bản mới | Được cảnh báo và hướng xử lý trước phát hành | Không phát hành bài chứa câu ngừng dùng; có quyền chọn cập nhật phiên bản | Critical | Confirmed — PRD Mục 7.19/7.21; brainstorm Mục 6.1 (D3, D4) |
| UN-005 | HR | Trước khi phát hành | Xem bài như người làm bài sẽ thấy (không đáp án) và checklist mục còn thiếu | Tự tin bài đúng trước khi đến tay ứng viên | Critical | Confirmed — PRD Mục 7.21 (preview, "review → publish") |
| UN-006 | HR | Khi phát hành cho một đợt | Tạo link có hạn và giới hạn lượt, gửi cho đối tượng, thu hồi khi cần | Link kiểm soát được vòng đời, thu hồi có lý do | Critical | Confirmed — PRD Mục 7.21 (token/link); Observed: OQ-AS-01, GAP-AS-03 |
| UN-007 | HR | Khi đợt đánh giá kết thúc | Đóng bài để ngừng nhận attempt mới mà không phá attempt đang chạy | Trạng thái "Đã đóng" rõ ràng, người đang làm vẫn nộp được | High | Assumption — suy từ vòng đời bài + hợp đồng attempt của PRD Mục 7.22 |
| UN-008 | HR | Khi cần sửa bài đã phát hành | Sửa được thông tin nhẹ (tên, hướng dẫn, hạn link) có lý do; đổi đề thì nhân bản | Bài đã phát hành không bị sửa ngầm; bản mới tách bạch | Critical | Confirmed — PRD Mục 7.22 (snapshot bất biến); brainstorm Mục 6.1 (D6) |
| UN-009 | Admin | Khi điều tra khiếu nại về bài/link | Truy vết ai tạo/phát hành/sửa bài, ai tạo/thu hồi link, lý do | Audit đầy đủ trên bài và link | High | Confirmed — PRD Mục 9, Mục 7.22 |
| UN-010 | HR | Khi muốn biết link đã dùng thế nào | Xem số attempt đã tạo trên từng link | Biết link nào còn/hết lượt để thu hồi hoặc tạo thêm | Medium | Assumption — suy từ giới hạn lượt + theo dõi attempt (PRD Mục 7.22) |
| UN-011 | HR | Khi cần đánh giá nhân viên nội bộ | Chọn đối tượng "nhân viên" và giao qua tài khoản thay link public | Nhân viên làm bài gắn danh tính nội bộ | Medium | Confirmed — PRD Mục 7.22 (theo token/quyền); cơ chế giao là đề xuất (OQ-4 brainstorm) |
| UN-012 | Interviewer | Khi được giao soạn bài | Dùng mẫu chung + câu đã duyệt để soạn nhanh mà không lệch chuẩn | Bài nhất quán với chuẩn tổ chức | High | Confirmed — PRD Mục 3 (JTBD-INT-01), Mục 7.21 |

## 5. Prioritized User Journeys

### Journey 1: Tạo và phát hành bài đánh giá cho vị trí tuyển

- **User:** HR
- **Importance:** Critical
- **Trigger:** Một vị trí mở yêu cầu bài đánh giá trước/sau phỏng vấn.
- **Expected outcome:** Bài "Đã phát hành" với snapshot đề chốt và link có
  hạn + giới hạn lượt, sẵn sàng gửi ứng viên.
- **Related needs:** UN-001, UN-003, UN-005, UN-006

1) HR tạo bài mới: đặt tên, chọn vị trí/JD mục tiêu, trình độ, đối tượng
   "ứng viên".
2) Cấu hình thời lượng, quy tắc chấm, hướng dẫn, chính sách hiển thị kết
   quả (mặc định chỉ biên nhận).
3) Mở "Chọn từ ngân hàng" → lọc theo kỹ năng/trình độ → chọn câu "Đã
   duyệt" → sắp thứ tự, gán điểm.
4) Preview bài như người làm bài; checklist phát hành đạt → "Phát hành".
5) Tạo link (hạn 30 ngày, tối đa 50 lượt) → sao chép/gửi cho đợt ứng viên.

**Independent verification:** Lấy một bài vừa phát hành — kiểm tra bản ghi
bài ở "Đã phát hành" có đủ snapshot câu theo phiên bản + link có hạn và
giới hạn lượt; mở link ở surface `candidate-assessment` thấy đúng hướng
dẫn và đề đã chốt, không thấy đáp án.

### Journey 2: Tạo bài từ mẫu chung

- **User:** HR hoặc interviewer
- **Importance:** High
- **Trigger:** Tổ chức đã có mẫu công bố cho loại bài cần tạo.
- **Expected outcome:** Bản nháp có sẵn cấu hình chuẩn từ mẫu, author chỉ
  chỉnh phần riêng và chọn câu.
- **Related needs:** UN-002, UN-012

1) Tại màn tạo bài chọn "Tạo từ mẫu" → danh sách mẫu "Đã công bố" gợi ý
   theo vị trí/trình độ/đối tượng.
2) Chọn mẫu → cấu hình điền sẵn vào bản nháp (bản sao độc lập) → chỉnh
   phần khác nếu cần.
3) Chọn câu như Journey 1 → phát hành; bài ghi nhận mẫu gốc để truy vết.

**Independent verification:** Tạo một bài từ mẫu X — bản ghi bài có
`template` trỏ X, cấu hình khớp mẫu trừ phần author chủ động sửa, và sửa
mẫu X sau đó không đổi bài đã tạo.

### Journey 3: Quản lý link trong đợt đánh giá

- **User:** HR
- **Importance:** High
- **Trigger:** Bài đã phát hành, cần gửi nhiều đợt hoặc phát hiện link bị
  lộ.
- **Expected outcome:** Mỗi đợt có link riêng (hạn + lượt); link lộ bị thu
  hồi có lý do mà không phá attempt đang chạy.
- **Related needs:** UN-006, UN-010

1) Trên bài "Đã phát hành" tạo link cho đợt mới (hạn, giới hạn lượt, ghi
   chú đợt).
2) Theo dõi số attempt trên từng link; link gần hết lượt → tạo link mới.
3) Phát hiện link lộ → "Thu hồi" + nhập lý do → link chặn attempt mới,
   attempt đang làm vẫn hoàn tất.

**Independent verification:** Thu hồi một link đang có attempt chạy — link
không tạo được attempt mới, attempt đang chạy vẫn submit được và bản ghi
thu hồi có đủ người + lý do + thời điểm.

### Journey 4: Sửa bài đã phát hành

- **User:** HR
- **Importance:** High
- **Trigger:** Phát hiện lỗi hướng dẫn/tên bài hoặc cần đổi đề sau khi đã
  phát hành.
- **Expected outcome:** Sửa nhẹ qua audit có lý do; đổi đề qua bản nháp
  nhân bản, bài cũ giữ nguyên snapshot.
- **Related needs:** UN-008, UN-009

1) Sửa nhẹ: đổi hướng dẫn → nhập lý do → lưu (audit trước/sau).
2) Đổi đề: "Nhân bản" → bản nháp mới → chỉnh câu/cấu hình → phát hành
   link mới; bài gốc đóng khi cần.

**Independent verification:** Với một bài đã có attempt — kiểm tra attempt
cũ vẫn hiển thị đề tại thời điểm phát hành (snapshot không đổi), còn bản
nhân mới là bài độc lập.

### Journey 5: Đóng bài sau đợt đánh giá

- **User:** HR
- **Importance:** Medium
- **Trigger:** Đợt đánh giá kết thúc hoặc bài hết giá trị.
- **Expected outcome:** Bài "Đã đóng" không nhận attempt mới; attempt đang
  chạy hoàn tất theo giờ còn lại.
- **Related needs:** UN-007

1) Author bấm "Đóng bài" → xác nhận số attempt đang chạy → đóng.
2) Mọi link của bài ngừng nhận attempt mới.

**Independent verification:** Đóng một bài có 1 attempt đang chạy — mở
link tạo attempt mới bị chặn với lý do "bài đã đóng", attempt cũ vẫn nộp
được.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Phát hành khi checklist thiếu mục | Không hiểu vì sao bị chặn | Thông báo liệt kê đúng mục thiếu, dẫn tới bước cần bổ sung | Journey 1 / UN-005 |
| Câu trong bài nháp bị ngừng dùng | Mất công soạn lại | Cảnh báo trên bài nháp + chặn phát hành + gợi ý thay câu | UN-004 |
| Câu có phiên bản mới được duyệt | Đề có thể dùng bản cũ | Cảnh báo "câu có phiên bản mới", cho cập nhật trước phát hành | UN-004 |
| Mẫu đã chọn bị ngừng dùng sau đó | Lo cấu hình bị ảnh hưởng | Bản sao trong bài giữ nguyên; chỉ thông báo mẫu gốc đã ngừng | Journey 2 / UN-002 |
| Vị trí/kỹ năng mục tiêu bị gỡ khỏi danh mục | Bài không còn lọc đúng | Cảnh báo "mục tiêu không còn hợp lệ", yêu cầu gán lại trước phát hành | UN-001 |
| Thu hồi link khi có người đang làm | Sợ phá bài người đang làm | Attempt đang chạy tiếp tục; chỉ chặn attempt mới | Journey 3 / UN-006 |
| Sửa đề trên bài đã phát hành | Muốn sửa nhanh nhưng bị chặn | Thông báo giải thích + điều hướng "Nhân bản" | Journey 4 / UN-008 |
| Hai author cùng sửa bài nháp | Người lưu sau mất dữ liệu | Cảnh báo "bài vừa được {người} cập nhật — tải lại" | Journey 1 / UN-001 |
| Tổ chức chưa có câu đã duyệt | Không biết bắt đầu đâu | Empty state dẫn tới ngân hàng câu hỏi hoặc sinh câu AI | Journey 1 / UN-003 |
| Đóng bài khi còn attempt đang chạy | Sợ mất bài của người đang làm | Xác nhận hiển thị số attempt đang chạy; attempt vẫn hoàn tất | Journey 5 / UN-007 |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt; nội dung bài/hướng dẫn hỗ trợ tiếng Việt
  đầy đủ (dấu, ký tự đặc biệt).
- Author phải đăng nhập, thuộc tổ chức/phạm vi được cấp và có quyền tạo/
  phát hành bài đánh giá; người làm bài không có giao diện authoring.
- Chỉ câu "Đã duyệt" được đưa vào đề — điều kiện tiên quyết, không ngoại
  lệ.
- Preview và mọi surface của feature không hiển thị đáp án/giải thích cho
  vai trò không được cấp; surface link không bao giờ trả đáp án.
- Link phát hành bắt buộc có hạn + giới hạn lượt; giờ server là chuẩn đối
  chiếu hạn (align `candidate-assessment`).
- Mọi thay đổi sau phát hành và mọi thao tác link (tạo/thu hồi/đóng) bắt
  buộc lý do và ghi audit.
- Màn soạn đề (lọc câu, sắp thứ tự, gán điểm) thiết kế cho desktop; không
  yêu cầu mobile cho v1.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Phát hành bài không cần approver thứ hai trong v1; checklist + preview là rào chắn | Nếu cần duyệt 2 cấp → thêm hàng chờ và vai trò reviewer bắt buộc | Assumption — đề xuất | Chốt ở OQ-1 (chờ Product owner) |
| Sửa sau phát hành giới hạn field không ảnh hưởng đề; đổi đề qua nhân bản | Nếu cho sửa đề → phá snapshot, tranh chấp công bằng | Assumption — bám PRD Mục 7.22 | Chốt ở OQ-1 |
| Link bắt buộc hạn + giới hạn lượt + thu hồi (giải OQ-AS-01) | Nếu link không giới hạn → rủi ro phát tán như nguồn cũ | Assumption — đề xuất | Chốt ở OQ-2 |
| Chính sách xem kết quả do author công bố, mặc định chỉ biên nhận | Nếu mặc định hiện điểm → lộ thông tin trước khi HR review | Assumption — đề xuất | Chốt ở OQ-5 |
| Vị trí/JD mục tiêu chọn từ danh mục của tổ chức | Nếu nhập tự do → không gợi ý/lọc theo mục tiêu được | Assumption — đề xuất | Chốt ở OQ-4 |
| Giới hạn số (200 câu, 240 phút, 90 ngày, 1.000 lượt, 20 link) là chuẩn v1 | Nếu quá chặt/lỏng → đổi validation | Assumption | Chốt ở OQ-3 |
| Attempt và enforcement link thuộc `candidate-assessment`; feature này chỉ phát hành chính sách | Nếu bên kia thiếu contract → link không được thực thi | Confirmed — phân chia scope Feature Map #21/#22 | Theo dõi spec `candidate-assessment` |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Bài phát hành được hoàn tất mà không hủy do cấu hình sai | Chưa có — xác lập bằng audit hủy bài trong 1 tháng pilot | ≥95% bài phát hành không bị hủy vì cấu hình sai (con số chốt cùng OQ-2 PRD) | Tỷ lệ bài phát hành có ≥1 submission hợp lệ và không bị hủy | 1 tháng sau pilot |
| USC-002 | Đề phát hành toàn câu đã duyệt có snapshot | 0% (hiện không có kiểm soát) | 100% | Tỷ lệ câu trong bài phát hành có trạng thái "Đã duyệt" + phiên bản chốt | Liên tục |
| USC-003 | Link luôn trong tầm kiểm soát | 0% | 100% link có hạn + giới hạn lượt + trạng thái | Audit thuộc tính link trên mọi bài phát hành | Liên tục |
| USC-004 | Không sự cố sửa ngầm đề đã phát hành | Chưa có | 0 sự cố snapshot thay đổi sau phát hành | Kiểm tra đối chiếu snapshot attempt vs đề hiện tại | Mỗi release |
| USC-005 | HR soạn nhanh nhờ mẫu/ngân hàng thay vì từ đầu | Chưa có — xác lập bằng quan sát 5 lần tạo bài đầu | ≥60% bài tạo từ mẫu hoặc ≥80% câu lấy từ ngân hàng | Tỷ lệ bài có template_id / câu có tham chiếu bank | 1 tháng sau pilot |

## 10. Open Questions

- [x] OQ-1: Phát hành bài có cần approver thứ hai không? — Resolved (đề
  xuất): v1 không; author tự phát hành sau checklist + preview; reviewer
  thứ hai là tùy chọn P2 — chờ Product owner xác nhận.
- [x] OQ-2: Token/link cần expiry, revocation, attempt limit chính thức
  thế nào (OQ-AS-01)? — Resolved (đề xuất): cả ba bắt buộc — hạn ≤90 ngày,
  giới hạn 1–1.000 lượt, thu hồi kèm lý do — chờ Product owner xác nhận.
- [x] OQ-3: Các giới hạn (200 câu, 240 phút, 90 ngày, 1.000 lượt, 20
  link/bài) có làm chuẩn v1? — Resolved (đề xuất): dùng làm chuẩn draft —
  chờ Product owner xác nhận.
- [x] OQ-4: Đối tượng "nhân viên" giao bài qua link hay tài khoản? —
  Resolved (đề xuất): mặc định giao qua tài khoản (P1, phối hợp
  `candidate-assessment`); link public vẫn khả dụng khi author chủ động
  chọn — chờ Product owner xác nhận.
- [x] OQ-5: Người làm bài được xem gì sau nộp (OQ-AS-03)? — Resolved (đề
  xuất): 3 mức author chọn (chỉ biên nhận / điểm tổng / điểm + nhận xét),
  mặc định chỉ biên nhận, không bao giờ hiện đáp án đúng — chờ Product
  owner + Head of HR xác nhận.
- [x] OQ-6: Bài đã đóng có được mở lại? — Resolved (đề xuất): được, bởi
  author/admin kèm lý do + audit — chờ Product owner xác nhận.
- [x] OQ-7: Target định lượng USC-001? — Resolved: chưa có baseline —
  xác lập bằng audit hủy bài trong 1 tháng pilot; target chờ OQ-2 PRD.
