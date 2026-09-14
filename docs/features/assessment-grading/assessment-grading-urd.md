---
type: urd
feature: assessment-grading
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/assessment-grading/brainstorms/human-reviewed-grading-and-skill-insight.md, docs/_reverse/assessment-and-grading/reverse-spec.md]
---

# assessment-grading — User Requirements Document

## 1. Purpose

Biến submission đã chốt thành kết quả đánh giá đáng tin và có evidence: câu
khách quan được chấm ngay, câu tự luận được con người chấm theo hướng dẫn
chấm, điểm tổng luôn khớp với từng phần chấm, AI chỉ đề xuất phân tích, và
không kết quả nào đi vào quyết định khi chưa có reviewer xác nhận.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Reviewer (grader) | Chấm câu tự luận bằng cách đọc từng bài và tự nhớ tiêu chí | Không có hướng dẫn chấm kèm câu; mỗi người chấm một kiểu; không biết còn thiếu bài nào | Điểm không nhất quán giữa ứng viên, khó bảo vệ khi bị tranh chấp | Observed: reverse spec `assessment-and-grading` (FR-AS-04 overlay chờ chấm); GAP-AS-04 rubric thiếu governance |
| HR | Chỉ có điểm tổng, không có breakdown | Không biết ứng viên mạnh/yếu ở kỹ năng nào, phải tự đọc lại bài | Quyết định chậm và thiếu evidence | Confirmed — PRD Mục 7.23 (score breakdown, skill evidence) |
| HR | Điểm hiển thị không đồng bộ khi ai đó sửa tay | Không tin được con số trước mặt | Quyết định sai, phải kiểm tra lại thủ công | Confirmed — PRD Mục 7.23 (rủi ro chính) |
| Author bài đánh giá | Không kiểm soát ai được chấm/override/phát hành | Thao tác nhạy cảm không có lý do, không truy vết | Tranh chấp tính công bằng của đánh giá | Confirmed — PRD Mục 7.22 (regrade/override: author công bố + lý do + audit) |
| Ứng viên | Kết quả xuất hiện khi chưa ai review | Thấy điểm/nhận xét chưa được kiểm chứng | Trải nghiệm không công bằng, khiếu nại | Confirmed — PRD Mục 12 (human-in-the-loop), Mục 7.22 (quyền xem kết quả do author công bố) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Reviewer (HR/interviewer được giao chấm) | Được phân công chấm submission trong hàng chờ | Chấm nhanh, nhất quán, biết rõ còn thiếu gì; xác nhận kết quả trước khi phát hành | Thiếu hướng dẫn chấm; không biết hàng chờ còn bao nhiêu; sợ sai điểm tổng khi chỉnh tay |
| secondary | HR | Tổng hợp kết quả để đưa vào quyết định pipeline, xuất báo cáo | Kết quả đã review + breakdown kỹ năng + export hợp lệ | Điểm tổng trần không đủ; sợ dùng kết quả chưa review |
| secondary | Author bài đánh giá | Công bố vai trò chấm/override/phát hành và phần kết quả được xem | Quy tắc được thực thi đúng, có audit | Chính sách lệch giữa công bố và thực thi |
| secondary | Quản lý/Head of HR | Giám sát chất lượng chấm, quyết định follow-up | Insight đã review dẫn tới hành động | Không có tín hiệu đáng tin để hành động |
| secondary | Ứng viên/nhân viên | Chờ kết quả bài đánh giá | Nhận đúng phần được công bố, đã qua review | Kết quả chậm hoặc chưa review đã lộ |
| out | Admin | Điều tra sự cố, cấu hình provider | Truy vết đầy đủ | (gián tiếp) |

## 3. Scope Boundaries

### In Scope

- Tiếp nhận submission từ `candidate-assessment`, tách câu khách quan/cần
  chấm tay.
- Chấm tự động câu khách quan; hàng chờ chấm tay kèm hướng dẫn chấm.
- Chấm tay có điểm + nhận xét + người chấm; recompute điểm từ một nguồn.
- Breakdown theo câu và kỹ năng; trạng thái chấm rõ ràng.
- AI insight đề xuất có provenance; reviewer xác nhận/override có lý do và
  audit; phát hành theo công bố; note reviewer.
- Regrade có kiểm soát (phiên bản mới + lý do + audit); export PDF/CSV khi
  được phép; follow-up từ kết quả.

### Out of Scope

- Làm bài/nộp bài (thuộc `candidate-assessment`).
- Tạo bài, chọn câu, cấu hình rubric của bài (thuộc `assessment-authoring`,
  `question-bank`, `assessment-templates`).
- AI tự quyết định tuyển dụng/thăng chức hoặc tự pass/fail (PRD "Chưa làm",
  invariant Mục 12).
- Đánh giá năng lực nhân viên theo khung (thuộc `employee-evaluation` —
  feature này chỉ cung cấp kết quả đã review làm đầu vào).
- Báo cáo tổng hợp liên domain (thuộc `management-reporting`).
- Ngân hàng rubric được phê duyệt riêng (đề xuất phase sau — xem OQ-1).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Reviewer | Khi có submission mới cần chấm | Một hàng chờ liệt kê các câu cần chấm tay kèm câu trả lời và hướng dẫn chấm | Biết chính xác còn bao nhiêu câu, chấm theo cùng một chuẩn | Critical | Confirmed — PRD Mục 7.23 (manual grade); Observed: FR-AS-03/04 |
| UN-002 | Reviewer | Khi chấm xong một câu | Điểm và nhận xét được ghi nhận kèm danh tính và thời điểm; điểm tổng tự cập nhật | Không phải tính lại tay; bài nào đủ chấm tự chuyển trạng thái | Critical | Confirmed — PRD Mục 7.23 (recompute); Observed: FR-AS-05/06 |
| UN-003 | Reviewer | Khi không đồng ý với điểm/nhận định | Override được với lý do bắt buộc, biết hệ thống giữ lại giá trị gốc | Điều chỉnh có trách nhiệm, truy vết được trước/sau | Critical | Confirmed — PRD Mục 7.22 (override + lý do + audit) |
| UN-004 | Reviewer | Khi xem kết quả đã chấm | AI insight hiển thị như đề xuất có nguồn, không tự trở thành kết quả | Dùng insight để nghĩ nhanh hơn nhưng vẫn là người quyết | High | Confirmed — PRD Mục 7.23 (AI insight), Mục 12; Observed: GAP-AS-05 |
| UN-005 | HR | Khi cần đưa kết quả vào quyết định | Chỉ kết quả "đã-review" được coi là hợp lệ để dùng; breakdown kỹ năng drill về câu gốc | Quyết định có evidence kiểm chứng được | Critical | Confirmed — PRD Mục 7.23, điều kiện hoàn thành v1 |
| UN-006 | HR | Khi cần báo cáo/đối chiếu bên ngoài | Xuất PDF/CSV khi được phép, trong đúng scope, có audit | File xuất hợp lệ, không lộ ngoài phạm vi | High | Confirmed — PRD Mục 7.23 (PDF/CSV khi được phép) |
| UN-007 | Author | Khi cấu hình bài | Quyết định ai được chấm/override/phát hành và phần kết quả được xem | Quyền thực thi đúng công bố | High | Confirmed — PRD Mục 7.22 |
| UN-008 | Reviewer/HR | Khi phát hiện chấm sai sau khi đã chấm | Regrade được với lý do, giữ lịch sử, điểm tính lại | Sai được sửa minh bạch, không mất vết | High | Confirmed — PRD Mục 7.22 (regrade); Observed: OQ-AS-02 |
| UN-009 | HR/Quản lý | Khi kết quả cần hành động tiếp | Tạo follow-up từ kết quả đã review (vòng bổ sung, yêu cầu làm lại) | Follow-up có owner và trạng thái, gắn nguồn submission | Medium | Observed: FR-AS-07 (follow-up sessions); mức ưu tiên là Assumption |
| UN-010 | Ứng viên | Sau khi nộp bài | Chỉ thấy phần kết quả đã phát hành theo công bố | Không thấy nội dung chưa review | High | Confirmed — PRD Mục 7.22 |

## 5. Prioritized User Journeys

### Journey 1: Chấm một submission có câu tự luận đến khi đủ điều kiện review

- **User:** Reviewer
- **Importance:** Critical
- **Trigger:** Submission mới từ `candidate-assessment` chứa câu tự luận.
- **Expected outcome:** Mọi câu manual được chấm, điểm tổng recompute, kết
  quả ở "đã-chấm" sẵn sàng xác nhận.
- **Related needs:** UN-001, UN-002

1) Mở hàng chờ chấm → thấy submission với số câu chờ.
2) Mở từng câu: xem đề snapshot + câu trả lời + hướng dẫn chấm → nhập điểm
   + nhận xét → lưu.
3) Câu cuối được lưu → hệ thống recompute → submission "đã-chấm" với
   breakdown theo câu/kỹ năng.

**Independent verification:** Lấy một submission vừa "đã-chấm" — kiểm tra
mọi câu manual có bản ghi điểm + người chấm + thời điểm, và tổng điểm bằng
đúng tổng các phần chấm cộng lại.

### Journey 2: Reviewer xác nhận kết quả trước khi phát hành

- **User:** Reviewer
- **Importance:** Critical
- **Trigger:** Submission ở "đã-chấm" và AI insight đã sẵn sàng (hoặc lỗi).
- **Expected outcome:** Kết quả "đã-review" — có/không override — với vết
  đầy đủ; chỉ sau đó mới được phát hành.
- **Related needs:** UN-003, UN-004, UN-005

1) Mở trang kết quả: breakdown, điểm tổng, AI insight (đề xuất + model/
   version), note.
2) Nếu cần điều chỉnh → override điểm/nhận định → nhập lý do → recompute.
3) Bấm "Xác nhận kết quả" → "đã-review" → vai trò được phép phát hành phần
   author công bố.

**Independent verification:** Chọn một kết quả "đã-phát-hành" bất kỳ — truy
vết ngược: bản ghi xác nhận của reviewer (ai, khi nào), mọi override có lý
do, và phần người làm bài thấy đúng bằng công bố.

### Journey 3: HR xuất và dùng kết quả trong quyết định

- **User:** HR
- **Importance:** High
- **Trigger:** Cần báo cáo kết quả hoặc đối chiếu cho quyết định pipeline.
- **Expected outcome:** Xuất được đúng loại dữ liệu được phép trong scope;
  lượt xuất có audit.
- **Related needs:** UN-005, UN-006

1) Lọc danh sách kết quả "đã-review" theo bài/vị trí.
2) Mở kết quả: đọc breakdown kỹ năng, drill về câu/câu trả lời gốc.
3) "Xuất" → chọn PDF/CSV → nhận file, lượt xuất ghi nhận.

**Independent verification:** Xuất một file CSV — kiểm tra chỉ chứa bản ghi
trong data-scope của người xuất và audit log có lượt xuất tương ứng.

### Journey 4: Regrade khi phát hiện chấm sai

- **User:** Reviewer (vai trò được công bố)
- **Importance:** High
- **Trigger:** Phát hiện một câu/bài bị chấm sai — kể cả sau khi đã phát
  hành.
- **Expected outcome:** Phiên bản chấm mới thay thế có lý do; lịch sử giữ
  nguyên; nếu đã phát hành thì được đánh dấu để quyết định phát hành lại.
- **Related needs:** UN-003, UN-008

1) Mở kết quả → "Chấm lại" câu/bài → nhập lý do.
2) Mục chấm mở lại → grader chấm → recompute.
3) Nếu kết quả đã phát hành và điểm đổi → hệ thống đánh dấu "đã phát hành
   đã thay đổi".

**Independent verification:** Regrade một câu trên kết quả đã phát hành —
kiểm tra phiên bản cũ còn đọc được, điểm mới đã recompute, audit có lý do +
người thực hiện, và cờ "đã thay đổi" hiển thị.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Xác nhận kết quả khi còn câu chưa chấm | Không hiểu vì sao bị chặn | Thông báo đếm số câu còn thiếu, dẫn về hàng chờ | Journey 1 / UN-001 |
| AI insight lỗi/không sinh được | Lo kết quả bị ảnh hưởng | Trạng thái "insight lỗi" riêng, kết quả chấm vẫn đầy đủ, có đường tạo lại | Journey 2 / UN-004 |
| Override quên nhập lý do | Không lưu được | Chặn lưu + yêu cầu lý do tối thiểu | UN-003 |
| Hai grader cùng chấm một câu | Người lưu sau mất thay đổi | Cảnh báo "bản vừa được cập nhật" trước khi ghi đè | Journey 1 / UN-002 |
| Reviewer xác nhận trong lúc có regrade | Xác nhận trên bản cũ | Cảnh báo "kết quả vừa đổi — tải lại" trước khi ghi nhận | Journey 2,4 / UN-008 |
| Câu tự luận không có hướng dẫn chấm | Grader không có chuẩn | Hiển thị cảnh báo "câu chưa có hướng dẫn chấm" và ghi nhận tình trạng | Journey 1 / UN-001 |
| Truy cập/xuất ngoài data-scope | Bị chặn không rõ lý do | Thông báo không có quyền + ghi audit | UN-005, UN-006 |
| Submission bị hủy/thu hồi sau khi vào hàng chờ | Chấm công cốc | Loại khỏi hàng chờ, đánh dấu "không cần chấm" | UN-001 |
| Hàng chờ trống | Không biết còn việc không | "Không có bài nào đang chờ chấm" | Journey 1 |

## 7. User-side Constraints

- Giao diện tiếng Việt ưu tiên; grader/reviewer chủ yếu trên desktop trong
  giờ làm việc.
- Mọi người dùng phải đăng nhập và thuộc organization/role/data-scope được
  cấp; ứng viên không có giao diện chấm — chỉ nhận phần kết quả đã phát
  hành.
- Điểm/hướng dẫn chấm/đáp án là dữ liệu nội bộ — không bao giờ lộ ra surface
  người làm bài.
- AI insight không thể tự thay đổi điểm, trạng thái hay quyết định — đây là
  điều kiện tiên quyết của mọi flow (invariant PRD Mục 12).
- Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt.
- Regrade/override/phát hành là action nhạy cảm: luôn kèm lý do + audit, và
  chỉ trong phạm vi author đã công bố.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Submission đến kèm snapshot có đáp án + hướng dẫn chấm phía server | Nếu thiếu → không auto-grade/rubric được | Assumption — contract với `candidate-assessment`/`question-bank` | Xác nhận khi hai feature đó chốt spec |
| Rubric v1 = hướng dẫn chấm của câu trong snapshot | Nếu business đòi rubric bank riêng → phải thêm quản trị rubric | Assumption (OQ-1 brainstorm, GAP-AS-04) | Owner chốt OQ-1 |
| Grader/reviewer là vai trò gán qua org-governance, author công bố theo bài | Nếu chỉ admin được chấm → hàng chờ nghẽn | Assumption | Owner chốt cùng OQ-2 |
| Không auto pass/fail trong v1 — ngưỡng chỉ là tham chiếu | Nếu muốn auto-quyết → vi phạm invariant | Confirmed direction — PRD Mục 12, Mục 7.23 "Chưa làm" | — |
| Insight lỗi không chặn nghiệp vụ chấm | Nếu insight bắt buộc → submission treo khi provider lỗi | Assumption | — |
| "Phát hành kết quả" = mở phần đã công bố; kênh báo thuộc notifications | Nếu phát hành gồm gửi kết quả chủ động → cần contract notifications | Assumption | Đối chiếu `contextual-notifications` |
| Follow-up v1 là bản ghi có owner/trạng thái, không tự tạo lịch/bài mới | Nếu cần tự động tạo session → phụ thuộc interview-management | Assumption (FR-AS-07 chỉ chứng minh CRUD) | Owner xác nhận |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Submission có kết quả đã review kịp thời cho quyết định | Chưa có — xác lập bằng đo pilot theo test version | Thời gian trung bình submission → "đã-review" giảm rõ so baseline (mốc chờ sponsor — OQ-1/OQ-2 PRD) | Thời gian từ submission đến kết quả đã review (PRD Mục 7.23) | Hàng tháng trong pilot |
| USC-002 | Mọi kết quả phát hành đều đã qua con người xác nhận | 0% | 100% — guardrail | Tỷ lệ kết quả phát hành có bản ghi reviewer xác nhận | Liên tục |
| USC-003 | Không quyết định nào do AI tự sinh | 0 | 0 — guardrail bám M-GR-02 | Số quyết định bị đảo do AI suggestion sai / quyết định có AI suggestion | Liên tục, theo rollout |
| USC-004 | Điểm hiển thị luôn khớp phần chấm | Chưa có | 100% aggregate = tổng grade item sau mọi recompute | Regression test "aggregate khớp" + incident lệch điểm | Mỗi release |
| USC-005 | Override/regrade có trách nhiệm | Chưa có | 100% có lý do + người thực hiện + giá trị trước/sau | Kiểm audit mẫu hàng tháng | Hàng tháng |

## 10. Open Questions

- [x] OQ-1 (brainstorm OQ-1 / OQ-AS-02, GAP-AS-04): rubric v1 là gì? —
  Resolved (đề xuất): "hướng dẫn chấm" của câu trong snapshot; rubric bank
  riêng để phase sau — chờ Assessment owner + Head of HR xác nhận.
- [x] OQ-2 (brainstorm OQ-2 / OQ-AS-04): threshold pass/fail và quyền
  override? — Resolved (đề xuất): không auto pass/fail v1; ngưỡng là tham
  chiếu do author công bố; override bởi vai trò được công bố + lý do.
- [x] OQ-3 (brainstorm OQ-3): regrade sau phát hành? — Resolved (đề xuất):
  được phép có lý do + phiên bản mới + đánh dấu "đã phát hành đã thay đổi".
- [x] OQ-4 (brainstorm OQ-4): chuẩn lý do override/regrade? — Resolved (đề
  xuất): 10–500 ký tự bắt buộc.
- [x] OQ-5 (brainstorm OQ-5): SLA hàng chờ chấm? — Resolved (đề xuất): 3
  ngày làm việc/submission.
- [x] OQ-6 (brainstorm OQ-6): giới hạn export? — Resolved (đề xuất): PDF/
  CSV, CSV ≤50.000 dòng, theo quyền + audit.
- [x] OQ-7 (brainstorm OQ-7, liên quan OQ-6 PRD): retention kết quả/insight/
  lịch sử override? — Resolved (đề xuất): theo retention chung chờ OQ-6
  PRD; pilot chỉ dữ liệu synthetic trước khi duyệt.
- [~] OQ-8 (brainstorm OQ-8): độ khó thực nghiệm trả về `question-bank`? —
  Out of scope v1: hướng P2.
