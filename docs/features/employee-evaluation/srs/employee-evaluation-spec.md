---
type: srs
feature: employee-evaluation
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/employee-evaluation/brainstorms/evidence-based-employee-evaluation.md
  - docs/features/employee-evaluation/employee-evaluation-urd.md
  - docs/_reverse/talent-and-crm/reverse-spec.md
---

# employee-evaluation — Software Requirements Specification

## 1. Scope

SRS này cover chu trình đánh giá năng lực nhân viên của một tổ chức: đợt
đánh giá theo kỳ hoặc theo nhu cầu, giao bài theo khung kỹ năng đã công
bố, nhận breakdown điểm từ engine chấm, suy level đề xuất theo quy tắc đã
duyệt, hàng chờ xác nhận của reviewer với điều chỉnh có lý do, ghi nhận
thủ công có evidence, ghi nhận kết quả vào hồ sơ năng lực kèm provenance,
nhân viên xem kết quả của mình, sửa kết quả qua bản chỉnh, phân quyền theo
scope và audit đầy đủ. KHÔNG cover: quyết định KPI/lương/thăng chức/kỷ
luật tự động (PRD "Chưa làm"), ranking công khai, engine làm bài
(`candidate-assessment`), chấm và override điểm (`assessment-grading`),
taxonomy và khung vị trí (`talent-framework`), hồ sơ nhân viên gốc
(`employee-profiles`), phân tích gap (`skill-gap-analysis`), và các hướng
P2 (AI nhận xét, đề xuất đào tạo, peer feedback).

Feature này là `Should` trong Feature Map — **không nằm trong cam kết lát
cắt thương mại v1** (15 capability Must); nội dung dưới đây là first
release của riêng feature ở slice mở rộng.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Tạo và điều phối đợt, theo dõi tiến độ, phân công lại reviewer, gia hạn | Có |
| Quản lý (reviewer) | người | Xem evidence, xác nhận/điều chỉnh level, ghi nhận kết quả; tạo đợt theo nhu cầu | Có |
| Nhân viên | người | Làm bài được giao, self-assessment, xem kết quả của mình | Có |
| Business owner (Head of HR/người được gán) | người | Duyệt quy tắc chuyển điểm thành level đề xuất trước khi áp | Có |
| Admin | người | Vận hành, xem mọi đợt/kết quả trong phạm vi quản trị, truy vết | Có |
| `candidate-assessment` | hệ thống (feature khác) | Thực thi làm bài: attempt, autosave, submit, receipt | Không (engine được tái sử dụng) |
| `assessment-grading` | hệ thống (feature khác) | Chấm bài, trả breakdown điểm theo kỹ năng + evidence | Không (nguồn kết quả chấm) |
| `talent-framework` | hệ thống (feature khác) | Cung cấp khung vị trí đã công bố, thang level | Không (nguồn chuẩn) |
| `employee-profiles` | hệ thống (feature khác) | Nhận kết quả đã ghi nhận vào hồ sơ năng lực; cung cấp quan hệ quản lý | Không (đích ghi + nguồn quan hệ) |
| `contextual-notifications` | hệ thống (feature khác) | Gửi thông báo giao bài, nhắc hạn, kết quả | Không (kênh thông báo) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-employee-evaluation-001 | Tạo đợt đánh giá | Khi HR (hoặc quản lý cho nhu cầu) tạo đợt, hệ thống phải ghi nhận tên, loại ("theo kỳ"/"theo nhu cầu"), phạm vi nhân viên theo nhóm/vị trí, hạn làm bài và hạn xác nhận (hạn xác nhận sau hạn làm bài); đợt mới ở trạng thái "bản-nháp" | P0 | demo | PRD Mục 7.33 (luồng chính); URD UN-001 |
| FR-employee-evaluation-002 | Gợi ý bài theo khung vị trí | Khi chọn phạm vi nhân viên, hệ thống phải đối chiếu từng người với khung "đã-công-bố" của vị trí họ: có khung → gợi ý bài phù hợp; chưa có khung → liệt kê riêng để HR chọn bài thủ công hoặc loại khỏi đợt | P0 | test | PRD Mục 7.33 (phạm vi v1); brainstorm Mục 6.1 (D1) |
| FR-employee-evaluation-003 | Phát hành đợt và tạo assignment | Khi HR xác nhận phát hành, hệ thống phải tạo một assignment cho mỗi nhân viên (bài, hạn làm bài, reviewer — mặc định quản lý trực tiếp), chuyển đợt sang "đang-mở" và thông báo cho nhân viên kèm hạn và tên reviewer | P0 | test | PRD Mục 7.33 (giao bài); URD Journey 1 |
| FR-employee-evaluation-004 | Chặn reviewer trùng người được đánh giá | Khi gán reviewer cho assignment, nếu reviewer là chính nhân viên được đánh giá thì hệ thống phải chặn và yêu cầu chọn reviewer khác | P0 | test | brainstorm Mục 6.1 (D2); URD UN-004 (đề xuất — OQ-3) |
| FR-employee-evaluation-005 | Làm bài trên engine chung | Khi nhân viên mở assignment, hệ thống phải đưa người đó vào làm bài trên engine `candidate-assessment` với đầy đủ contract (giờ server, autosave có ack, submit idempotent, biên nhận); feature này không tái tạo engine | P0 | kiểm tra | PRD Mục 7.33 + Mục 7.22; URD UN-003 |
| FR-employee-evaluation-006 | Nhận kết quả chấm theo kỹ năng | Khi submission được `assessment-grading` chấm xong, hệ thống phải ghi nhận breakdown điểm theo kỹ năng kèm liên kết evidence bài làm cho assignment tương ứng | P0 | test | PRD Mục 7.33 (chấm); URD UN-004 |
| FR-employee-evaluation-007 | Suy level đề xuất theo quy tắc đã duyệt | Khi có breakdown điểm theo kỹ năng, hệ thống phải áp quy tắc chuyển đổi ở trạng thái "đã-công-bố" để sinh level đề xuất cho từng kỹ năng, và ghi phiên bản quy tắc vào provenance của kết quả | P0 | test | PRD Mục 7.33 (level đề xuất), R-13; OQ-4 |
| FR-employee-evaluation-008 | Hàng chờ xác nhận của reviewer | Khi assignment đủ điều kiện (bài đã chấm xong), hệ thống phải chuyển sang "chờ-xác-nhận" và hiển thị trong hàng chờ của reviewer: điểm theo kỹ năng, level đề xuất, evidence bài làm theo quyền, self-assessment nếu có; khi bài chưa chấm xong thì không cho xác nhận | P0 | demo | PRD Mục 7.33 (reviewer xác nhận); brainstorm D3 |
| FR-employee-evaluation-009 | Xác nhận hoặc điều chỉnh level | Khi reviewer quyết định trên từng kỹ năng, hệ thống phải ghi nhận "đã-xác-nhận" theo level đề xuất, hoặc "điều-chỉnh" sang level khác với lý do bắt buộc (10–500 ký tự), người thực hiện và thời điểm | P0 | test | PRD Mục 7.33, Mục 12 (human-in-the-loop); URD UN-005 |
| FR-employee-evaluation-010 | Ghi nhận thủ công kỹ năng không đo được | Khi kỹ năng trong phạm vi không có bài đo được, hệ thống phải cho reviewer ghi nhận level thủ công kèm evidence đính kèm hoặc ghi chú quan sát + lý do, hoặc để trạng thái "chưa đánh giá" | P0 | test | brainstorm D5, OQ-7; URD UN-006 |
| FR-employee-evaluation-011 | Ghi nhận kết quả vào hồ sơ năng lực | Khi reviewer bấm "Ghi nhận", hệ thống phải kiểm tra đủ phần bắt buộc (mọi kỹ năng có level cuối hoặc "chưa đánh giá", điểm mạnh, nhu cầu phát triển) rồi tạo kết quả đã ghi nhận, cập nhật hồ sơ năng lực của nhân viên với provenance (đợt, reviewer, thời điểm) và thông báo cho nhân viên | P0 | test | PRD Mục 7.33 (ghi nhận kết quả); URD UN-007 |
| FR-employee-evaluation-012 | Nhân viên xem kết quả của mình | Hệ thống phải cho nhân viên xem kết quả đã ghi nhận của chính mình: level từng kỹ năng, phần kết quả bài được công bố, điểm mạnh, nhu cầu phát triển, tên reviewer, thời điểm — kèm nhãn "không phải đánh giá toàn diện về cá nhân"; không hiển thị đáp án, kết quả người khác hay bảng xếp hạng | P0 | demo | PRD Mục 7.33; URD UN-008, OQ-2 |
| FR-employee-evaluation-013 | Phân quyền xem kết quả theo scope | Hệ thống phải chỉ cho xem kết quả: chính nhân viên (phần công bố), quản lý trực tiếp trong scope, HR trong scope và admin vận hành; mọi truy cập bị từ chối phải ghi audit | P0 | test | PRD Mục 9, OQ-8; URD UN-010, UN-011 |
| FR-employee-evaluation-014 | Sửa kết quả đã ghi nhận qua bản chỉnh | Khi kết quả đã ghi nhận cần sửa, hệ thống phải tạo bản chỉnh mới kèm lý do bắt buộc (10–500 ký tự), đưa bản chỉnh thành hiệu lực và giữ bản cũ trong lịch sử; không cho ghi đè im lặng; nhân viên thấy dấu "đã cập nhật" | P0 | test | brainstorm Mục 5.5, D8; URD UN-009 |
| FR-employee-evaluation-015 | Quy tắc chuyển đổi qua duyệt của owner | Khi quy tắc chuyển điểm thành level được tạo/sửa, hệ thống phải đưa qua duyệt của business owner (mô hình review như `talent-framework`); chỉ quy tắc "đã-công-bố" mới được áp cho đợt mở | P0 | test | PRD Mục 7.33 (rủi ro), R-13, OQ-11; OQ-4 |
| FR-employee-evaluation-016 | Theo dõi tiến độ và xử lý treo | Hệ thống phải cho HR xem tiến độ đợt theo trạng thái assignment, nhắc hạn trước hạn làm bài, đánh dấu "quá-hạn", gia hạn và phân công lại reviewer trong scope khi reviewer vắng | P0 | demo | PRD Mục 7.33 (đo thành công); brainstorm Mục 6.4 |
| FR-employee-evaluation-017 | Hủy đợt/assignment có lý do | Khi hủy đợt hoặc assignment (nhân viên nghỉ, đợt tạo nhầm), hệ thống phải ghi lý do; assignment đã nộp được HR chọn giữ xử lý hoặc hủy theo quyết định có audit; kết quả đã ghi nhận không bị xóa | P1 | test | brainstorm Mục 6.4/6.5; URD Mục 6 |
| FR-employee-evaluation-018 | Self-assessment trước đợt | Hệ thống phải cho nhân viên tự đánh mức trên các kỹ năng trong phạm vi trước khi làm bài, và hiển thị phần tự đánh đó cho reviewer khi xác nhận | P1 | demo | brainstorm Mục 4 (P1); URD UN-012 |
| FR-employee-evaluation-019 | Cảnh báo kết quả chấm thay đổi | Khi điểm bài bị override/regrade sau khi assignment đã "chờ-xác-nhận", hệ thống phải cảnh báo reviewer "kết quả vừa thay đổi — tải lại" trước khi ghi nhận | P0 | test | brainstorm Mục 6.4/6.5; bám BR chống lệch điểm của `assessment-grading` |
| FR-employee-evaluation-020 | So sánh giữa hai đợt | Hệ thống phải cho xem song song kết quả đã ghi nhận của cùng nhân viên giữa hai đợt (level từng kỹ năng và thời điểm) | P1 | demo | brainstorm Mục 4 (P1) |
| FR-employee-evaluation-021 | Đính kèm evidence bổ sung | Hệ thống phải cho reviewer đính kèm evidence (ghi chú quan sát, tài liệu/chứng chỉ tham chiếu) vào phần xác nhận của từng kỹ năng | P1 | demo | brainstorm Mục 4 (P1); URD UN-006 |
| FR-employee-evaluation-022 | Audit hành động nhạy cảm | Hệ thống phải ghi vết audit cho: phát hành đợt, gán/đổi reviewer, xác nhận, điều chỉnh level, ghi nhận thủ công, ghi nhận kết quả, bản chỉnh, hủy và truy cập bị từ chối | P0 | kiểm tra | PRD Mục 9 (audit boundary); URD UN-011 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-employee-evaluation-001 | security | Kết quả đánh giá là dữ liệu nhạy cảm: truy cập deny-by-default theo organization/role/data-scope trên mọi surface (xem, tìm kiếm, export) | P0 | 0 sự cố xem kết quả vượt scope được xác nhận (guardrail bám M-GR-01) |
| NFR-employee-evaluation-002 | auditability | Mọi quyết định của reviewer và thay đổi trên kết quả phải truy vết được (ai, khi nào, trước/sau, lý do) | P0 | Truy vết được 100% sự kiện trên mẫu assignment kiểm tra bất kỳ |
| NFR-employee-evaluation-003 | integrity | Điểm và level đề xuất là evidence, không tự thành kết luận: hệ thống không có đường ghi hồ sơ năng lực bỏ qua "Ghi nhận" của reviewer | P0 | Không tồn tại kết quả trong hồ sơ năng lực thiếu reviewer/provenance |
| NFR-employee-evaluation-004 | governance | Hệ thống không cung cấp đường tự động từ kết quả đánh giá sang quyết định lương/thăng chức/kỷ luật, và không có surface ranking công khai | P0 | Không trigger/báo cáo ranking; kiểm tra không có liên kết tự động sang quyết định nhân sự (PRD Mục 7.33 "Chưa làm", Mục 12) |
| NFR-employee-evaluation-005 | performance | Tải hàng chờ xác nhận và màn tiến độ đợt | P1 | 95% lượt tải trong ≤3 giây ở quy mô đợt ≤300 nhân viên (đề xuất — OQ-6) |
| NFR-employee-evaluation-006 | usability | Toàn bộ giao diện và thông báo tiếng Việt; nội dung nhận xét hỗ trợ đầy đủ dấu | P0 | Kiểm tra mẫu nhận xét tiếng Việt lưu và hiển thị đúng |
| NFR-employee-evaluation-007 | data-retention | Kết quả và lịch sử đợt giữ để truy vết; thời gian giữ theo chính sách retention của tổ chức | P1 | Retention chính thức chờ OQ-6 PRD; trước privacy gate chỉ dữ liệu synthetic |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-employee-evaluation-001 | Reviewer phải khác người được đánh giá — không ngoại lệ | Khi gán reviewer cho assignment | FR-employee-evaluation-004 | brainstorm D2; OQ-3 (đề xuất) |
| BR-employee-evaluation-002 | Assignment chỉ sang "chờ-xác-nhận" khi bài đã chấm xong; chưa chấm xong thì reviewer không xác nhận được | Khi trạng thái chấm thay đổi hoặc reviewer mở assignment | FR-employee-evaluation-008 | brainstorm D3 |
| BR-employee-evaluation-003 | Điều chỉnh level đề xuất bắt buộc lý do 10–500 ký tự; điều chỉnh vượt ±2 mức vẫn cho phép nhưng đòi lý do chi tiết hơn | Khi reviewer đổi level đề xuất | FR-employee-evaluation-009 | brainstorm Mục 7.1/7.2; OQ-6 (đề xuất) |
| BR-employee-evaluation-004 | Ghi nhận thủ công kỹ năng không đo được bắt buộc evidence đính kèm hoặc ghi chú quan sát + lý do; thiếu evidence thì để "chưa đánh giá" | Khi reviewer ghi nhận thủ công | FR-employee-evaluation-010 | brainstorm D5; OQ-7 |
| BR-employee-evaluation-005 | Điểm bài là evidence, không phải kết luận: level cuối do reviewer xác nhận; mọi surface cho nhân viên mang nhãn "không phải đánh giá toàn diện về cá nhân" | Mọi đường hiển thị/ghi nhận kết quả | FR-employee-evaluation-011, FR-employee-evaluation-012 | PRD Mục 7.33 (rủi ro chính), Mục 12 |
| BR-employee-evaluation-006 | Không ranking công khai; không trigger tự động sang quyết định KPI/lương/thăng chức/kỷ luật | Mọi đường dữ liệu ra quyết định nhân sự | NFR-employee-evaluation-004 | PRD Mục 7.33 "Chưa làm", Mục 5, Mục 12 |
| BR-employee-evaluation-007 | Quy tắc chuyển đổi phải ở "đã-công-bố" trước khi đợt mở; đợt ghi phiên bản quy tắc đã áp | Khi phát hành đợt và khi suy level đề xuất | FR-employee-evaluation-007, FR-employee-evaluation-015 | R-13, OQ-11; OQ-4 |
| BR-employee-evaluation-008 | "Ghi nhận" bị chặn khi thiếu phần bắt buộc: kỹ năng chưa có level cuối/"chưa đánh giá", thiếu điểm mạnh hoặc thiếu nhu cầu phát triển | Khi reviewer bấm "Ghi nhận" | FR-employee-evaluation-011 | brainstorm D6 |
| BR-employee-evaluation-009 | Sửa kết quả đã ghi nhận chỉ qua bản chỉnh có lý do; bản cũ giữ trong lịch sử — cấm ghi đè | Khi có yêu cầu sửa kết quả đã ghi nhận | FR-employee-evaluation-014 | brainstorm D8; URD UN-009 |
| BR-employee-evaluation-010 | Kết quả ghi nhận theo snapshot khung vị trí tại thời điểm đánh giá; khung đổi sau đó không viết lại kết quả cũ | Khi khung vị trí có bản công bố mới | FR-employee-evaluation-011 | brainstorm Mục 6.5 |
| BR-employee-evaluation-011 | Reviewer phải mở evidence (điểm theo kỹ năng/bài làm theo quyền) trước khi "Ghi nhận" | Khi reviewer bấm "Ghi nhận" chưa xem evidence | FR-employee-evaluation-008, FR-employee-evaluation-011 | brainstorm Mục 9 (rủi ro xác nhận cho có) |
| BR-employee-evaluation-012 | Hạn xác nhận phải sau hạn làm bài; assignment quá hạn làm bài chuyển "quá-hạn" và chỉ gia hạn được bởi HR/reviewer có quyền | Khi tạo đợt và khi quá hạn | FR-employee-evaluation-001, FR-employee-evaluation-016 | brainstorm Mục 7.1 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-employee-evaluation-001 | Reviewer trùng người được đánh giá | Gán reviewer là chính nhân viên được đánh giá | major | FR-employee-evaluation-004 | Hiện "Người xác nhận phải khác người được đánh giá — chọn reviewer khác" | Chọn reviewer khác |
| E-employee-evaluation-002 | Nhân viên chưa có khung vị trí | Giao bài cho nhóm có người chưa có khung "đã-công-bố" | minor | FR-employee-evaluation-002 | Hiện "{n} nhân viên chưa có khung vị trí đã công bố — chọn bài thủ công hoặc loại khỏi đợt" | Chọn bài thủ công hoặc loại khỏi đợt |
| E-employee-evaluation-003 | Đợt vượt quy mô | Phạm vi đợt vượt 300 nhân viên | minor | FR-employee-evaluation-001 | Hiện "Đợt đánh giá tối đa 300 nhân viên — chia nhỏ phạm vi" | Chia nhỏ phạm vi |
| E-employee-evaluation-004 | Xác nhận khi chưa chấm xong | Reviewer mở/xác nhận assignment chưa chấm xong | major | FR-employee-evaluation-008 | Hiện "Bài đánh giá chưa được chấm xong — chưa thể xác nhận kết quả" | Chờ chấm xong; kiểm tra trạng thái grading |
| E-employee-evaluation-005 | Điều chỉnh không lý do | Reviewer đổi level mà bỏ trống/thiếu lý do | minor | FR-employee-evaluation-009 | Hiện "Nhập lý do điều chỉnh level (tối thiểu 10 ký tự)" | Nhập lý do rồi lưu |
| E-employee-evaluation-006 | Ghi nhận thiếu phần bắt buộc | "Ghi nhận" khi còn kỹ năng chưa có level, thiếu điểm mạnh/nhu cầu | minor | FR-employee-evaluation-011 | Hiện "Còn thiếu: {danh sách phần thiếu} — hoàn tất trước khi ghi nhận" | Hoàn tất phần thiếu |
| E-employee-evaluation-007 | Ghi nhận thủ công không evidence | Ghi nhận thủ công kỹ năng không đo được mà không đính kèm evidence/ghi chú | minor | FR-employee-evaluation-010 | Hiện yêu cầu đính kèm evidence hoặc để "chưa đánh giá" | Đính kèm evidence hoặc chọn "chưa đánh giá" |
| E-employee-evaluation-008 | Xem kết quả ngoài scope | Vai trò ngoài scope cố mở kết quả | major | FR-employee-evaluation-013 | Hiện "Bạn không có quyền xem kết quả đánh giá này"; ghi audit truy cập bị từ chối | Xin cấp quyền qua admin |
| E-employee-evaluation-009 | Đợt thiếu quy tắc đã duyệt | Phát hành đợt khi quy tắc chuyển đổi chưa "đã-công-bố" | major | FR-employee-evaluation-015 | Hiện "Chưa có quy tắc chuyển đổi được duyệt — gửi duyệt quy tắc trước khi mở đợt" | Gửi duyệt quy tắc với business owner |
| E-employee-evaluation-010 | Reviewer vắng giữa đợt | Reviewer nghỉ/vắng khi có assignment "chờ-xác-nhận" | major | FR-employee-evaluation-016 | Cảnh báo đợt thiếu reviewer trên màn tiến độ | HR phân công lại reviewer trong scope |
| E-employee-evaluation-011 | Kết quả chấm đổi khi đang xem | Override/regrade sau khi assignment đã "chờ-xác-nhận" | major | FR-employee-evaluation-019 | Cảnh báo "Kết quả vừa thay đổi — tải lại trước khi ghi nhận" | Tải lại, xem bản mới rồi quyết định |
| E-employee-evaluation-012 | Sửa kết quả không lý do | Tạo bản chỉnh mà bỏ trống lý do | minor | FR-employee-evaluation-014 | Hiện "Nhập lý do chỉnh sửa (tối thiểu 10 ký tự)" | Nhập lý do rồi lưu bản chỉnh |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-employee-evaluation-01 | Kỳ đánh giá hoàn tất với reviewer/evidence đầy đủ | Tỷ lệ assignment "đã-ghi-nhận" / assignment phát hành trong đợt | ≥90% trong SLA — target chính thức chờ OQ-1/OQ-2 PRD |
| SC-employee-evaluation-02 | Kết quả ghi nhận đều qua reviewer hợp lệ | Tỷ lệ kết quả có reviewer ≠ người được đánh giá + provenance đợt + điểm mạnh + nhu cầu | 100% |
| SC-employee-evaluation-03 | Hàng chờ xác nhận không treo | Thời gian từ "chờ-xác-nhận" đến "đã-ghi-nhận" | ≤10 ngày làm việc (đề xuất — OQ-6) |
| SC-employee-evaluation-04 | Điều chỉnh có căn cứ | Tỷ lệ bản ghi điều chỉnh level có lý do hợp lệ | 100% |
| SC-employee-evaluation-05 | Không lộ kết quả ngoài phạm vi | Số incident xem kết quả vượt scope được xác nhận | 0 (guardrail bám M-GR-01) |
| SC-employee-evaluation-06 | Level đề xuất có governance | Tỷ lệ đợt áp quy tắc "đã-công-bố" và ghi phiên bản quy tắc | 100% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Đợt đánh giá__ — header đợt: tên, loại, phạm vi, hạn, trạng thái vòng
  đời, phiên bản quy tắc chuyển đổi áp dụng.
- __Assignment__ — bài được giao cho một nhân viên trong đợt: bài, hạn,
  reviewer, trạng thái, liên kết attempt/submission.
- __Quy tắc chuyển đổi + dải điểm__ — quy tắc suy level từ điểm theo kỹ
  năng, qua duyệt của business owner, có phiên bản.
- __Kết quả kỹ năng__ — level đề xuất/xác nhận/điều chỉnh/ghi nhận thủ
  công của từng kỹ năng trong một assignment, kèm lý do và evidence.
- __Kết quả đã ghi nhận__ — snapshot kết quả của một assignment: điểm
  mạnh, nhu cầu phát triển, provenance; có chuỗi bản chỉnh.
- __Evidence đính kèm__ — ghi chú quan sát/tài liệu đính kèm cho ghi nhận
  thủ công.
- __Self-assessment__ — mức tự đánh của nhân viên theo kỹ năng trước đợt.
- __Nhân viên, người dùng, bài đánh giá, submission/kết quả chấm, khung vị
  trí, kỹ năng, thang level, kỹ năng hồ sơ__ — tham chiếu tối thiểu sang
  `employee-profiles`, `org-governance`, `assessment-authoring`,
  `candidate-assessment`, `assessment-grading`, `talent-framework`.

Chi tiết quan hệ + thuộc tính ở `srs/employee-evaluation-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Tạo đợt → đối chiếu khung → xác nhận danh sách + reviewer →
  phát hành → assignment + thông báo.
- __Flow 2:__ Nhân viên làm bài (engine chung) → chấm → breakdown theo kỹ
  năng → quy tắc đã duyệt → level đề xuất → "chờ-xác-nhận".
- __Flow 3:__ Reviewer xem evidence → xác nhận/điều chỉnh/ghi nhận thủ
  công → điểm mạnh + nhu cầu → "Ghi nhận" → hồ sơ năng lực + thông báo.
- __Flow 4:__ Nhân viên mở kết quả của mình (phần công bố).
- __Flow 5:__ Tạo bản chỉnh kết quả đã ghi nhận → lý do + audit → bản mới
  hiệu lực.
- __Flow 6:__ HR theo dõi đợt → nhắc/gia hạn → phân công lại reviewer →
  hoàn tất đợt.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __campaign-list__ — danh sách đợt + trạng thái + lối tạo đợt.
- __campaign-editor__ — tạo/sửa đợt: phạm vi, hạn, đối chiếu khung, chọn
  bài, gán reviewer.
- __campaign-progress__ — tiến độ đợt theo trạng thái assignment; cảnh báo
  thiếu reviewer/quá hạn.
- __my-assignment__ — bài được giao của nhân viên + hạn + self-assessment.
- __review-queue__ — hàng chờ "chờ-xác-nhận" của reviewer.
- __review-detail__ — điểm theo kỹ năng + level đề xuất + evidence + xác
  nhận/điều chỉnh/ghi nhận thủ công + điểm mạnh/nhu cầu.
- __my-evaluation-result__ — kết quả đã ghi nhận của nhân viên (phần công
  bố + nhãn).
- __result-history__ — lịch sử kết quả và bản chỉnh của một người.
- __level-rule-editor__ — soạn/gửi duyệt quy tắc chuyển đổi (owner duyệt).

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Đợt/assignment/kết quả thuộc 1 tổ chức; truy cập theo organization/role/data-scope | PRD Mục 9 — Security owner |
| Human-in-the-loop: level cuối và ghi nhận do reviewer quyết; điểm/level đề xuất chỉ là evidence | PRD Mục 12, Mục 7.33 (rủi ro) — Product owner |
| Quy tắc chuyển đổi/level/threshold do business owner duyệt trước khi áp | PRD OQ-11, R-13 — Head of HR |
| Không tự quyết định KPI/lương/thăng chức/kỷ luật; không ranking công khai | PRD Mục 7.33 "Chưa làm", Mục 5 — Product owner |
| Audit cho action nhạy cảm (ghi nhận, điều chỉnh, bản chỉnh, truy cập) | PRD Mục 9 — Security owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |
| Tiếng Việt là ngôn ngữ ưu tiên | PRD Mục 9 — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Khung vị trí + thang level ở "đã-công-bố" | `talent-framework` | FR-employee-evaluation-002/007 — không có chuẩn để gợi ý bài và suy level |
| Engine làm bài + contract attempt/submission | `candidate-assessment` | FR-employee-evaluation-005 — không có chỗ làm bài |
| Breakdown điểm theo kỹ năng + evidence bài làm | `assessment-grading` | FR-employee-evaluation-006/007 — không có đầu vào cho level đề xuất |
| Bài đánh giá đã phát hành phù hợp khung | `assessment-authoring` | FR-employee-evaluation-002/003 — không có bài để giao |
| Hồ sơ nhân viên + quan hệ quản lý + điểm ghi hồ sơ năng lực | `employee-profiles` | FR-employee-evaluation-003/011 — không có phạm vi nhân viên và chỗ ghi kết quả |
| Role/scope và vai trò reviewer/business owner | `org-governance` | FR-employee-evaluation-013/015 — phân quyền và duyệt quy tắc |
| Thông báo giao bài/nhắc hạn/kết quả | `contextual-notifications` | FR-employee-evaluation-003/016 — nhân viên/reviewer không biết việc cần làm |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Hỗ trợ cả đợt "theo kỳ" lẫn "theo nhu cầu"; người xem = nhân viên (phần công bố) + quản lý trực tiếp + HR trong scope | FR-employee-evaluation-001/012/013 và model phân quyền phải thiết kế lại (PRD OQ-8) |
| Reviewer mặc định là quản lý trực tiếp từ quan hệ `employee-profiles` | FR-employee-evaluation-003 phải thêm nguồn reviewer khác |
| Quy tắc chuyển đổi là một đối tượng có vòng đời duyệt như khung (bản-nháp → chờ-duyệt → đã-công-bố) | FR-employee-evaluation-015 phải đổi cơ chế duyệt |
| Nhân viên giữ nhiều vị trí thì giao theo khung vị trí chính | FR-employee-evaluation-002 phải xử lý đa khung |
| Ngưỡng 300 nhân viên/đợt, 5 bài/người, SLA 10 ngày làm việc, ±2 mức điều chỉnh là chuẩn first release | E-employee-evaluation-003/005 và NFR-employee-evaluation-005 đổi ngưỡng |
| Kết quả hiệu lực đến khi có kết quả mới cùng kỹ năng; lịch sử đợt giữ nguyên | Mô hình "kết quả hiện hành" trong hồ sơ năng lực đổi cách ghi |
| `employee-profiles` mở điểm ghi kỹ năng đã xác nhận kèm provenance | FR-employee-evaluation-011 bị chặn — cần contract ghi mới |

## 12. Open Questions

- [x] OQ-1: Đánh giá theo kỳ hay theo nhu cầu? — Resolved (đề xuất): hỗ
  trợ cả hai — đợt "theo kỳ" do HR tạo định kỳ, đánh giá "theo nhu cầu"
  do quản lý trực tiếp/HR tạo khi cần — chờ Product owner xác nhận (PRD
  OQ-8).
- [x] OQ-2: Ai được xem và dùng kết quả đánh giá? — Resolved (đề xuất):
  chính nhân viên (phần công bố), quản lý trực tiếp trong scope, HR trong
  scope, admin vận hành; không công khai, không ranking — chờ Product
  owner xác nhận (PRD OQ-8).
- [x] OQ-3: Reviewer hợp lệ là ai? — Resolved (đề xuất): mặc định quản lý
  trực tiếp; HR phân công lại khi vắng/đổi; reviewer phải khác người được
  đánh giá — chờ Head of HR xác nhận.
- [x] OQ-4: Quy tắc chuyển điểm thành level đề xuất do ai duyệt và lưu ở
  đâu? — Resolved (đề xuất): quy tắc là đối tượng có vòng đời duyệt của
  business owner (Head of HR), mỗi đợt ghi phiên bản quy tắc — chờ Head
  of HR xác nhận (liên quan PRD OQ-11, R-13).
- [x] OQ-5: Nhân viên giữ nhiều vị trí thì giao bài theo khung nào? —
  Resolved (đề xuất): theo khung của vị trí chính; trường hợp đặc biệt HR
  chọn khung khác khi tạo đợt — chờ Head of HR xác nhận.
- [x] OQ-6: Ngưỡng đề xuất (300 nhân viên/đợt, 5 bài/người, SLA 10 ngày
  làm việc, ±2 mức điều chỉnh, nhắc 2 lần) có được duyệt? — Resolved (đề
  xuất): giữ ngưỡng đề xuất — chờ Head of HR xác nhận.
- [x] OQ-7: Kỹ năng không đo được bằng bài thì đánh giá thế nào? —
  Resolved: reviewer ghi nhận thủ công kèm evidence + lý do; thiếu
  evidence thì "chưa đánh giá", không bịa mức.
- [x] OQ-8: Kết quả đánh giá có hiệu lực bao lâu và retention ra sao? —
  Resolved (đề xuất): hiệu lực đến khi có kết quả mới cùng kỹ năng; lịch
  sử đợt giữ nguyên; retention chính thức theo OQ-6 PRD — chờ Head of HR
  + DPO xác nhận.
