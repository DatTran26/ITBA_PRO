---
type: srs
feature: assessment-grading
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/assessment-grading/brainstorms/human-reviewed-grading-and-skill-insight.md
  - docs/features/assessment-grading/assessment-grading-urd.md
  - docs/_reverse/assessment-and-grading/reverse-spec.md
---

# assessment-grading — Software Requirements Specification

## 1. Scope

SRS này cover việc biến submission đã chốt (từ `candidate-assessment`) thành
kết quả đánh giá đã qua con người xác nhận: tách câu khách quan/cần chấm tay,
chấm tự động, hàng chờ chấm thủ công có hướng dẫn chấm, recompute điểm một
nguồn, breakdown theo câu/kỹ năng, AI insight đề xuất có provenance, reviewer
xác nhận/override có lý do và audit, regrade có kiểm soát, phát hành kết quả
theo công bố, note reviewer, export PDF/CSV khi được phép và follow-up. Đây
là feature `Must` trong lát cắt v1. KHÔNG cover: làm/nộp bài
(`candidate-assessment`), soạn bài/rubric (`assessment-authoring`,
`question-bank`), đánh giá năng lực nhân viên theo khung
(`employee-evaluation`), báo cáo tổng hợp (`management-reporting`), và mọi
quyết định tuyển/thăng chức tự động bởi AI (PRD "Chưa làm", Mục 12).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Reviewer/Grader (HR/interviewer được giao) | người | Chấm câu manual theo hướng dẫn chấm, xác nhận/override kết quả có lý do | Có |
| HR | người | Xem kết quả đã review + breakdown, phát hành, xuất, tạo follow-up | Có |
| Author bài đánh giá | người | Công bố vai trò chấm/override/phát hành và phần kết quả được xem | Có (qua cấu hình do `assessment-authoring` phát hành) |
| Ứng viên/nhân viên | người | Nhận phần kết quả đã phát hành | Không (không có giao diện chấm; chỉ chịu ràng buộc phát hành) |
| Admin | người | Điều tra sự cố, giám sát provider insight | Có (điều tra có audit) |
| `candidate-assessment` | hệ thống (feature khác) | Cung cấp submission bất biến + snapshot | Không (nguồn đầu vào) |
| `question-bank` | hệ thống (feature khác) | Đáp án/hướng dẫn chấm/kỹ năng của câu nguồn | Không (nguồn qua snapshot) |
| AI provider | ngoài | Sinh insight đề xuất | Không (server-side dependency qua `platform-configuration`) |
| `contextual-notifications` | hệ thống (feature khác) | Kênh nhắc hàng chờ/báo kết quả | Không (dependency) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-assessment-grading-001 | Tiếp nhận submission | Khi submission được chốt từ `candidate-assessment`, hệ thống phải tạo bản ghi kết quả gắn snapshot, tách câu khách quan và câu cần chấm tay, và đặt trạng thái chấm ban đầu | P0 | test | PRD Mục 7.23 (luồng chính); Observed: FR-AS-03 |
| FR-assessment-grading-002 | Chấm tự động câu khách quan | Hệ thống phải chấm ngay các câu trắc nghiệm/đúng-sai theo đáp án của snapshot và ghi điểm từng câu | P0 | test | PRD Mục 7.23 (objective grade); Observed: FR-AS-03/06 |
| FR-assessment-grading-003 | Hàng chờ chấm thủ công | Hệ thống phải đưa mỗi câu tự luận vào hàng chờ chấm hiển thị đề snapshot, câu trả lời và hướng dẫn chấm của câu; hàng chờ cho biết số câu còn thiếu và cho lọc/phân công theo grader | P0 | demo | PRD Mục 7.23 (manual grade); Observed: FR-AS-04; URD UN-001 |
| FR-assessment-grading-004 | Chấm tay có trách nhiệm | Khi grader lưu điểm một câu, hệ thống phải kiểm điểm trong thang câu, ghi nhận xét (theo cấu hình), người chấm và thời điểm | P0 | test | PRD Mục 7.23; URD UN-002 |
| FR-assessment-grading-005 | Recompute một nguồn | Sau mọi thay đổi chấm (chấm mới, regrade, override), điểm tổng, breakdown và trạng thái phải được tính lại qua một đường recompute duy nhất — không cho phép vá điểm tổng ở nơi khác | P0 | test | PRD Mục 7.23 (rủi ro chính); Observed: FR-AS-05/06 |
| FR-assessment-grading-006 | Score breakdown và skill evidence | Hệ thống phải hiển thị điểm theo từng câu, nhóm theo kỹ năng của câu trong snapshot, phần auto/manual và tổng; mỗi con số drill được về câu/câu trả lời gốc | P0 | demo | PRD Mục 7.23 (score breakdown, skill evidence); URD UN-005 |
| FR-assessment-grading-007 | Trạng thái chấm rõ ràng | Hệ thống phải duy trì trạng thái kết quả (chờ-chấm-tay, đang-chấm, đã-chấm, đã-review, đã-phát-hành) và chỉ chuyển "đã-chấm" khi mọi câu manual đã chấm xong | P0 | test | Observed: FR-AS-03/06 (grading_status); URD Journey 1 |
| FR-assessment-grading-008 | AI insight đề xuất có provenance | Khi đủ điều kiện, hệ thống phải tạo phân tích AI (điểm mạnh, điểm cần kiểm tra, gợi ý follow-up) ở trạng thái đề xuất, gắn model/version và thời điểm; insight không được tự ghi điểm, đổi trạng thái hay quyết định | P0 | test | PRD Mục 7.23 (AI insight), Mục 12; Observed: GAP-AS-05; URD UN-004 |
| FR-assessment-grading-009 | Reviewer xác nhận kết quả | Khi kết quả "đã-chấm", reviewer phải xem breakdown + insight và xác nhận trước khi kết quả được phát hành hoặc dùng trong quyết định; hệ thống ghi người xác nhận và thời điểm | P0 | test | PRD Mục 7.23 (reviewer xác nhận), Mục 12; URD UN-005 |
| FR-assessment-grading-010 | Override có lý do và audit | Khi reviewer override điểm/nhận định, hệ thống phải bắt buộc lý do, giữ giá trị trước/sau, ghi người thực hiện + thời điểm, recompute lại tổng và đánh dấu phần bị override | P0 | test | PRD Mục 7.22 (override: author công bố + lý do + audit); URD UN-003 |
| FR-assessment-grading-011 | Phát hành kết quả theo công bố | Hệ thống chỉ được phát hành kết quả "đã-review" và chỉ phần author đã công bố cho từng đối tượng; ghi nhận người phát hành, thời điểm và phạm vi phát hành | P0 | test | PRD Mục 7.23 (phát hành kết quả được phép), Mục 7.22; URD UN-005, UN-010 |
| FR-assessment-grading-012 | Regrade có kiểm soát | Khi vai trò được author công bố yêu cầu chấm lại câu/bài, hệ thống phải bắt buộc lý do, tạo phiên bản chấm mới (giữ phiên bản cũ), mở lại mục chấm và recompute; nếu kết quả đã phát hành và điểm thay đổi phải đánh dấu "đã phát hành đã thay đổi" | P0 | test | PRD Mục 7.22 (regrade); Observed: OQ-AS-02; URD UN-008 |
| FR-assessment-grading-013 | Export PDF/CSV khi được phép | Hệ thống phải cho vai trò được cấp trong data-scope xuất kết quả "đã-review" ra PDF/CSV; lượt xuất ghi audit (ai, khi nào, phạm vi, định dạng) | P1 | test | PRD Mục 7.23 (PDF/CSV khi được phép); URD UN-006 |
| FR-assessment-grading-014 | Note reviewer | Hệ thống phải cho reviewer/HR ghi chú kèm kết quả, hiển thị cho đúng nhóm quyền và giữ trong audit | P1 | demo | PRD Mục 7.23 (note) |
| FR-assessment-grading-015 | Follow-up từ kết quả | Hệ thống phải cho tạo follow-up (vòng đánh giá/phỏng vấn bổ sung, yêu cầu làm lại) gắn submission và kết quả đã review, có owner và trạng thái theo dõi | P1 | demo | PRD Mục 7.23 (tạo follow-up); Observed: FR-AS-07; URD UN-009 |
| FR-assessment-grading-016 | Nhắc hàng chờ treo | Khi submission ở hàng chờ quá SLA cấu hình (đề xuất 3 ngày làm việc — xem OQ-4), hệ thống phải nhắc grader/owner và đánh dấu trong báo cáo treo | P1 | demo | brainstorm Mục 4 (P1); URD UN-001 |
| FR-assessment-grading-017 | Chống ghi đè chấm đồng thời | Khi hai grader lưu cùng một mục chấm hoặc reviewer xác nhận trên bản đã đổi, hệ thống phải cảnh báo "vừa được cập nhật" và yêu cầu tải lại trước khi ghi | P0 | test | brainstorm Mục 6.4; URD Mục 6 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-assessment-grading-001 | consistency | Điểm tổng/breakdown luôn khớp tổng các phần chấm sau mọi recompute — kể cả sau override/regrade | P0 | Regression test "aggregate = tổng grade item" pass mỗi release; 0 incident lệch điểm được xác nhận |
| NFR-assessment-grading-002 | human-in-the-loop | AI insight không tự ghi điểm, tự đổi trạng thái hay tự quyết định; mọi kết quả phát hành đều có reviewer xác nhận | P0 | 100% kết quả phát hành có bản ghi xác nhận; 0 quyết định pass/fail tự sinh (bám M-GR-02) |
| NFR-assessment-grading-003 | auditability | Mọi lượt chấm, override, regrade, xác nhận, phát hành và export phải truy vết được (ai, khi nào, lý do, trước/sau) | P0 | Truy vết được 100% sự kiện trên mẫu kết quả kiểm tra bất kỳ |
| NFR-assessment-grading-004 | security | Kết quả, đáp án, hướng dẫn chấm và insight theo organization/role/data-scope; deny-by-default; người làm bài chỉ thấy phần đã phát hành | P0 | 0 incident truy cập vượt scope được xác nhận (bám M-GR-01) |
| NFR-assessment-grading-005 | performance | Chấm tự động và mở hàng chờ đủ nhanh cho nhịp làm việc của grader | P1 | 95% submission có câu khách quan được chấm trong ≤5 phút sau khi chốt (giá trị đề xuất — xem OQ-5) |
| NFR-assessment-grading-006 | reliability | Lỗi AI provider không chặn nghiệp vụ chấm; retry có giới hạn và báo admin | P1 | Insight lỗi không làm submission treo; admin nhận cảnh báo khi hết retry |
| NFR-assessment-grading-007 | data-retention | Kết quả, lịch sử chấm/override và insight giữ theo retention được duyệt | P1 | Theo quyết định retention — chờ OQ-6 PRD; trước đó chỉ dữ liệu synthetic |
| NFR-assessment-grading-008 | usability | Giao diện chấm tiếng Việt, một câu một màn đủ context (đề + trả lời + hướng dẫn chấm) | P1 | Kiểm tra thủ công flow chấm hoàn chỉnh không cần mở màn khác để xem hướng dẫn chấm |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-assessment-grading-001 | Câu tự luận không được tính đúng/sai khi submission đến — phải qua hàng chờ chấm của con người | Khi tách câu sau tiếp nhận | FR-assessment-grading-001, -003 | Observed: reverse spec business rule 1 |
| BR-assessment-grading-002 | Điểm tổng chỉ được sinh từ một đường recompute duy nhất sau mỗi thay đổi chấm — cấm patch điểm độc lập | Khi chấm/regrade/override | FR-assessment-grading-005 | Observed: reverse spec business rule 2; PRD Mục 7.23 (rủi ro chính) |
| BR-assessment-grading-003 | Override và regrade chỉ thực hiện được bởi vai trò author công bố, bắt buộc lý do, giữ trước/sau và audit | Khi override/regrade | FR-assessment-grading-010, -012 | PRD Mục 7.22 (override/regrade) |
| BR-assessment-grading-004 | AI insight là đề xuất: không tự ghi điểm, tự đổi trạng thái hay tự quyết định; chỉ thành nội dung dùng được sau khi reviewer xác nhận kết quả | Khi sinh/hiển thị/dùng insight | FR-assessment-grading-008, -009 | PRD Mục 12 (invariant), Mục 7.23; Observed: GAP-AS-05 |
| BR-assessment-grading-005 | Không auto pass/fail: hệ thống trình bày điểm/breakdown/insight; quyết định thuộc reviewer/HR | Khi hiển thị hoặc phát hành kết quả | FR-assessment-grading-008, -011 | PRD Mục 7.23 "Chưa làm", Mục 12 |
| BR-assessment-grading-006 | Chỉ kết quả "đã-review" được phát hành/dùng trong quyết định; phát hành đúng phần author công bố | Khi phát hành/xuất | FR-assessment-grading-009, -011, -013 | PRD Mục 7.22, Mục 7.23 |
| BR-assessment-grading-007 | Chấm tay phải theo hướng dẫn chấm của câu trong snapshot; câu thiếu hướng dẫn chấm được đánh dấu để grader biết | Khi mở mục chấm | FR-assessment-grading-003, -004 | brainstorm Mục 6.5; URD Mục 6 |
| BR-assessment-grading-008 | Kết quả đã phát hành mà điểm thay đổi sau regrade/override phải được đánh dấu "đã phát hành đã thay đổi" cho tới khi phát hành lại | Khi recompute sau phát hành phát sinh đổi điểm | FR-assessment-grading-012 | PRD Mục 7.22; brainstorm Mục 5.4 |
| BR-assessment-grading-009 | Export chỉ cho vai trò được cấp trong data-scope và luôn ghi audit lượt xuất | Khi xuất PDF/CSV | FR-assessment-grading-013 | PRD Mục 7.23, Mục 9 |
| BR-assessment-grading-010 | Điểm câu nằm trong thang 0 đến điểm tối đa của câu theo snapshot — cả khi override | Khi lưu điểm/override | FR-assessment-grading-004, -010 | brainstorm Mục 7.1 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-assessment-grading-001 | Điểm vượt thang câu | Lưu điểm/override ngoài 0..max của câu | minor | FR-assessment-grading-004, -010 | Form hiện "Điểm phải nằm trong khoảng 0 đến {điểm tối đa của câu}" | Nhập lại điểm hợp lệ |
| E-assessment-grading-002 | Override thiếu lý do | Lưu override/regrade chưa nhập lý do tối thiểu | minor | FR-assessment-grading-010, -012 | Hiện "Vui lòng nhập lý do điều chỉnh (tối thiểu 10 ký tự) trước khi lưu" | Nhập lý do rồi lưu |
| E-assessment-grading-003 | Xác nhận khi còn câu chưa chấm | Reviewer xác nhận kết quả còn câu manual "chờ-chấm" | major | FR-assessment-grading-007, -009 | Hiện "Còn {n} câu chưa chấm — hoàn tất chấm trước khi xác nhận kết quả" | Chấm nốt rồi xác nhận |
| E-assessment-grading-004 | Không có quyền | Vai trò chưa được cấp cố chấm/override/phát hành/xuất | major | FR-assessment-grading-003, -010, -011, -013 | Thông báo "Bạn không có quyền thực hiện thao tác này trên kết quả này" + audit từ chối | Xin cấp quyền qua author/admin |
| E-assessment-grading-005 | Insight lỗi | AI provider lỗi/timeout khi sinh insight | minor | FR-assessment-grading-008 | Kết quả hiện "insight lỗi" + "Chưa tạo được phân tích AI — kết quả chấm vẫn đầy đủ, bạn có thể thử tạo lại" | Retry có giới hạn; hết retry báo admin; kết quả không bị chặn |
| E-assessment-grading-006 | Ghi đè chấm đồng thời | Grader thứ hai lưu cùng mục chấm đã vừa đổi | minor | FR-assessment-grading-017 | Cảnh báo "Kết quả vừa được cập nhật bởi {người} — tải lại để xem bản mới nhất" | Tải lại, chấm trên bản mới |
| E-assessment-grading-007 | Xác nhận trên bản cũ sau regrade | Reviewer xác nhận khi kết quả vừa recompute lại | major | FR-assessment-grading-012, -017 | Cảnh báo "Kết quả vừa đổi — tải lại" trước khi ghi nhận | Xem lại bản mới rồi xác nhận |
| E-assessment-grading-008 | Phát hành kết quả chưa review | Phát hành khi kết quả chưa "đã-review" | major | FR-assessment-grading-011 | Chặn + nêu trạng thái hiện tại và bước còn thiếu | Xác nhận kết quả trước |
| E-assessment-grading-009 | Export vượt giới hạn | Xuất CSV vượt ngưỡng dòng cấu hình | minor | FR-assessment-grading-013 | Hiện "Kết quả xuất vượt quá giới hạn — lọc nhỏ hơn rồi xuất lại" | Lọc nhỏ phạm vi xuất |
| E-assessment-grading-010 | Câu thiếu hướng dẫn chấm | Mở mục chấm câu không có hướng dẫn chấm trong snapshot | minor | FR-assessment-grading-003 | Hiện "Câu này chưa có hướng dẫn chấm — chấm theo đánh giá chuyên môn" | Grader chấm theo judgment; tình trạng được ghi nhận |
| E-assessment-grading-011 | Submission bị hủy giữa chừng | Attempt bị thu hồi sau khi đã vào hàng chờ | minor | FR-assessment-grading-001 | Mục chấm đánh dấu "không cần chấm", loại khỏi hàng chờ | Giữ vết; không chấm tiếp |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-assessment-grading-01 | Kết quả đã review kịp thời cho quyết định | Thời gian từ submission đến kết quả "đã-review" (PRD Mục 7.23) | Mốc chờ sponsor chốt OQ-1/OQ-2 PRD; baseline xác lập trong pilot |
| SC-assessment-grading-02 | Mọi kết quả phát hành đã qua con người xác nhận | Tỷ lệ kết quả phát hành có bản ghi reviewer xác nhận | 100% — guardrail |
| SC-assessment-grading-03 | Không quyết định nào do AI tự sinh | Số quyết định bị đảo do AI suggestion / quyết định có AI suggestion (M-GR-02) | 0 auto-decision; M-GR-02 không tăng sau rollout |
| SC-assessment-grading-04 | Điểm hiển thị luôn khớp phần chấm | Tỷ lệ kiểm tra aggregate = tổng grade item sau recompute | 100% — regression mỗi release |
| SC-assessment-grading-05 | Override/regrade có trách nhiệm | Tỷ lệ override/regrade có lý do + người thực hiện + trước/sau | 100% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Submission__ — tham chiếu từ `candidate-assessment`: bài nộp bất biến kèm
  snapshot.
- __Kết quả chấm__ — bản ghi điểm của một submission: trạng thái chấm, tổng,
  phần auto/manual, mốc recompute.
- __Mục chấm từng câu__ — một câu cần chấm: điểm, nhận xét, grader, phiên bản
  chấm (regrade tạo bản mới).
- __Điểm theo kỹ năng__ — breakdown skill evidence từ câu/kỹ năng của
  snapshot.
- __AI insight__ — phân tích đề xuất: loại, nội dung, model/version, trạng
  thái đề xuất/được dùng.
- __Quyết định review__ — xác nhận/override của reviewer: quyết định, lý do,
  giá trị trước/sau, thời điểm.
- __Phát hành kết quả__ — phạm vi và phần đã phát hành, người phát hành;
  trạng thái "đã thay đổi" sau regrade.
- __Follow-up__ — hành động tiếp theo gắn submission: loại, owner, trạng
  thái.
- __Note reviewer__ — ghi chú kèm kết quả.
- __Lượt xuất__ — audit export PDF/CSV.

Chi tiết quan hệ + thuộc tính ở `srs/assessment-grading-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Submission → tách câu → auto-grade → hàng chờ chấm tay → đủ
  chấm → recompute → "đã-chấm".
- __Flow 2:__ Insight đề xuất → reviewer xem → xác nhận (hoặc override có lý
  do) → "đã-review" → phát hành phần công bố.
- __Flow 3:__ Regrade có lý do → phiên bản chấm mới → recompute → đánh dấu
  "đã phát hành đã thay đổi" nếu cần.
- __Flow 4:__ Xuất PDF/CSV trong scope + audit; tạo follow-up từ kết quả đã
  review.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __grading-queue__ — hàng chờ câu/submission chờ chấm, lọc theo bài/grader/
  thời gian chờ.
- __grade-item__ — màn chấm một câu: đề snapshot + câu trả lời + hướng dẫn
  chấm + ô điểm/nhận xét.
- __result-review__ — trang kết quả: breakdown theo câu/kỹ năng, insight đề
  xuất, note, nút override/xác nhận.
- __result-publish__ — phát hành theo phần author công bố + trạng thái "đã
  thay đổi" (nếu có).
- __submission-history__ — lịch sử phiên bản chấm, override, xác nhận, phát
  hành của một submission.
- __export-dialog__ — chọn loại dữ liệu/định dạng/phạm vi xuất.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Regrade/override/reopen chỉ theo công bố của author + lý do + audit | PRD Mục 7.22 — Assessment owner |
| AI không tự quyết định tuyển/thăng chức/pass-fail; mọi output có review/override/provenance | PRD Mục 12 (invariant), Mục 7.23 — Product owner |
| Kết quả/đáp án/hướng dẫn chấm theo organization/role/data-scope + audit | PRD Mục 9 — Security owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |
| Credential AI provider chỉ phía server | PRD Mục 9 — Security owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Submission bất biến + snapshot đề (có đáp án/hướng dẫn chấm phía server) | `candidate-assessment` | Toàn bộ luồng chấm |
| Kỹ năng của câu trong snapshot (skill evidence) | `question-bank` + `talent-framework` | Breakdown theo kỹ năng |
| Vai trò grader/reviewer và data-scope | `org-governance` | Hàng chờ, override, export |
| Provider AI + cấu hình insight | `platform-configuration`/`external-integrations` | FR-assessment-grading-008 (không chặn chấm tay) |
| Kênh nhắc hàng chờ/báo kết quả | `contextual-notifications` | FR-assessment-grading-016 phần nhắc |
| Điểm đến follow-up (tạo phiên/bài mới) | `interview-management`/`assessment-authoring` | Mở rộng follow-up sau v1 |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Submission đến kèm snapshot có đáp án + hướng dẫn chấm phía server | FR-assessment-grading-002/-003 không chấm được — phải đàm lại contract với candidate-assessment |
| Rubric v1 = hướng dẫn chấm của câu trong snapshot | Phải bổ sung quản trị rubric riêng (OQ-1) |
| Không auto pass/fail v1 — ngưỡng chỉ tham chiếu | Nếu business đòi auto-quyết → xung đột invariant Mục 12, phải đàm lại scope |
| Insight lỗi không chặn chấm | Submission treo khi provider lỗi → NFR-006 đổi |
| Ngưỡng đề xuất (SLA 3 ngày, lý do 10–500 ký tự, nhận xét 2.000 ký tự, retry 3 lần, export 50.000 dòng, auto-grade ≤5 phút) được owner chấp nhận | Các giá trị FR/NFR đổi theo quyết định (OQ-4, OQ-5, OQ-6) |
| Follow-up v1 là bản ghi có owner/trạng thái, không tự tạo lịch/bài mới | FR-assessment-grading-015 phải mở rộng tích hợp |

## 12. Open Questions

- [x] OQ-1: Rubric chấm câu tự luận v1 là gì và ai phê duyệt (OQ-AS-02,
  GAP-AS-04)? — Resolved (đề xuất): "hướng dẫn chấm" của câu trong snapshot;
  rubric bank riêng để phase sau — chờ Assessment owner + Head of HR xác
  nhận.
- [x] OQ-2: Threshold pass/fail và quyền override (OQ-AS-04)? — Resolved (đề
  xuất): không auto pass/fail v1; ngưỡng là tham chiếu do author công bố;
  override bởi vai trò được công bố + lý do — chờ Assessment owner xác nhận.
- [x] OQ-3: Regrade sau khi kết quả đã phát hành? — Resolved (đề xuất): được
  phép với vai trò được công bố + lý do + phiên bản chấm mới + đánh dấu "đã
  phát hành đã thay đổi" — chờ Assessment owner xác nhận.
- [x] OQ-4: Chuẩn lý do override/regrade và SLA hàng chờ? — Resolved (đề
  xuất): lý do 10–500 ký tự bắt buộc; SLA 3 ngày làm việc/submission — chờ
  owner xác nhận.
- [x] OQ-5: Ngưỡng hiệu năng auto-grade (≤5 phút) và retry insight (3 lần)?
  — Resolved (đề xuất): áp dụng làm chuẩn v1 — chờ Assessment owner xác
  nhận.
- [x] OQ-6: Giới hạn export? — Resolved (đề xuất): PDF/CSV, CSV ≤50.000
  dòng/lượt, theo quyền + audit — chờ owner xác nhận.
- [x] OQ-7: Retention kết quả/insight/lịch sử override? — Resolved (đề
  xuất): theo quyết định retention chung — chờ OQ-6 PRD; pilot chỉ dữ liệu
  synthetic trước khi duyệt.
- [~] OQ-8: Độ khó thực nghiệm của câu trả về `question-bank`? — Out of
  scope v1: hướng P2 sau khi đủ dữ liệu chấm.
