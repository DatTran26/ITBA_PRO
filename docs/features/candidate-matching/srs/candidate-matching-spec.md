---
type: srs
feature: candidate-matching
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/candidate-matching/brainstorms/match-score-evidence-override.md
  - docs/features/candidate-matching/candidate-matching-urd.md
  - docs/_reverse/recruitment-and-interviews/reverse-spec.md
---

# candidate-matching — Software Requirements Specification

## 1. Scope

SRS này cover việc đối chiếu một application (CV đã được HR xác nhận, gắn
vị trí đang mở) với yêu cầu của vị trí: tính match score tổng 0–100 phân
rã theo kỹ năng/kinh nghiệm/domain, evidence trỏ về field CV và yêu cầu
vị trí cho từng thành phần, ngưỡng đề xuất có kiểm soát theo tổ chức/vị
trí, review của con người (chấp nhận hoặc override có lý do), batch tính
điểm, chạy lại khi dữ liệu nguồn đổi và audit toàn bộ. KHÔNG cover:
auto-reject hay bất kỳ quyết định cuối nào chỉ dựa trên AI (score chỉ là
đề xuất — invariant PRD Mục 12), chuyển trạng thái application
(`candidate-pipeline` — feature này chỉ ghi quyết định làm input cho con
người điều phối), xác nhận/parse CV (`cv-intake`), định nghĩa vị trí/JD
và kỹ năng kỳ vọng (`recruitment-planning`, `talent-framework`), matching
đa vị trí cho pool và báo cáo bias/fairness định kỳ (roadmap mở rộng).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Ưu tiên hồ sơ trên score + evidence, chấp nhận hoặc override đề xuất có lý do | Có |
| HR lead / vai trò được cấp ngưỡng | người | Đặt/sửa threshold theo tổ chức và vị trí, xem lịch sử ngưỡng | Có |
| Quản lý | người | Xem score và đề xuất của hồ sơ vào vị trí đơn vị trong phạm vi quyền | Có |
| Admin | người | Kiểm soát quyền xem/sửa ngưỡng, truy vết quyết định | Có |
| Job tính điểm (AI provider qua server) | hệ thống | Tính score + breakdown + evidence từ facts đã xác nhận | Có (chỉ qua ranh giới server; không giao diện) |
| Ứng viên | người | (gián tiếp) quyết định của con người trên điểm giải thích được | Không (không thao tác trong feature) |
| `cv-intake` | hệ thống (feature khác) | Cung cấp CV/facts "Đã xác nhận" làm đầu vào | Không (nguồn dữ liệu) |
| `recruitment-planning` / `talent-framework` | hệ thống (feature khác) | Cung cấp JD, yêu cầu và kỹ năng kỳ vọng của vị trí | Không (nguồn chuẩn đối chiếu) |
| `candidate-pipeline` | hệ thống (feature khác) | Nhận quyết định matching làm input; thực hiện transition | Không (consumer quyết định) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-candidate-matching-001 | Điều kiện tính điểm | Khi có yêu cầu tính điểm cho một application, hệ thống phải kiểm tra application có CV "Đã xác nhận" và đang gắn một vị trí có JD; nếu thiếu một trong hai điều kiện, hệ thống phải chặn và báo rõ điều kiện chưa đạt | P0 | test | PRD Mục 7.7 (luồng: CV đã xác nhận → score); URD UN-001 |
| FR-candidate-matching-002 | Tính score và breakdown | Khi application đủ điều kiện, hệ thống phải tạo một lần chấm điểm (run) gồm tổng điểm thang 0–100 và điểm riêng của 3 thành phần: kỹ năng, kinh nghiệm, domain | P0 | test | PRD Mục 7.7 (score, breakdown); URD UN-002 |
| FR-candidate-matching-003 | Evidence từng thành phần | Hệ thống phải gắn vào mỗi thành phần của run ít nhất một mục evidence trỏ tới field CV đã xác nhận và yêu cầu tương ứng của vị trí; khi một thành phần không có evidence nào, hệ thống phải đánh dấu thành phần đó "thiếu dữ liệu" thay vì im lặng cho điểm thấp | P0 | test | PRD Mục 7.7 (evidence, rủi ro score không giải thích được); URD UN-003 |
| FR-candidate-matching-004 | Nhãn đề xuất theo ngưỡng | Khi run hoàn tất, hệ thống phải so tổng điểm với ngưỡng hiệu lực tại thời điểm tính và gắn nhãn "Đạt đề xuất" hoặc "Chưa đạt đề xuất"; nhãn chỉ là gợi ý và không được gây bất kỳ thay đổi trạng thái nào trên application | P0 | test | PRD Mục 7.7 (threshold, Chưa làm: auto-reject), Mục 12; URD UN-004 |
| FR-candidate-matching-005 | Cờ không đủ dữ liệu | Nếu CV thiếu field cần đối chiếu hoặc vị trí chưa có yêu cầu chuẩn (chỉ có JD text), hệ thống phải gắn cờ "không đủ dữ liệu" hoặc "yêu cầu vị trí chưa chuẩn" trên run để score chỉ mang tính tham khảo | P0 | test | brainstorm Mục 4 P0, 6.2; URD UN-007 |
| FR-candidate-matching-006 | Quyết định của con người | Khi HR mở một run ở "chờ-review", hệ thống phải cho xem tổng điểm, nhãn đề xuất, breakdown và evidence; khi HR ghi quyết định, hệ thống phải nhận một trong: chấp nhận đề xuất / override đi tiếp / override dừng — và bắt buộc lý do không rỗng khi quyết định khác đề xuất | P0 | test | PRD Mục 7.7 (override có lý do), Mục 12; URD UN-004 |
| FR-candidate-matching-007 | Một quyết định hiệu lực | Hệ thống phải chỉ cho ghi một quyết định trên mỗi run và coi quyết định trên run mới nhất là hiệu lực; khi run đã có quyết định, yêu cầu quyết tiếp phải hiển thị quyết định hiện có kèm người và thời điểm | P0 | test | brainstorm Mục 6.4, 7.1; URD Journey 3 |
| FR-candidate-matching-008 | Ngưỡng theo tổ chức và vị trí | Hệ thống phải giữ ngưỡng mặc định tổ chức và cho phép override theo vị trí; chỉ vai trò được cấp mới sửa được ngưỡng, mọi sửa đổi bắt buộc lý do và được giữ thành lịch sử (giá trị cũ → mới, người sửa, hiệu lực từ) | P0 | test | PRD Mục 7.7 (threshold); URD UN-005 |
| FR-candidate-matching-009 | Nhãn giữ theo ngưỡng tại thời điểm tính | Khi ngưỡng thay đổi sau khi run đã tính, hệ thống phải giữ nguyên nhãn của run đó theo ngưỡng cũ, đồng thời hiển thị cảnh báo ngưỡng đã đổi và đề xuất tính lại | P0 | test | brainstorm Mục 6.4; URD Journey 4 |
| FR-candidate-matching-010 | Chạy lại và đánh dấu cũ | Khi CV được xác nhận lại hoặc JD/yêu cầu vị trí thay đổi, hệ thống phải đánh dấu các run hiện có là "cũ" và cho HR tính lại thành run mới; hệ thống phải chặn ghi quyết định trên run "cũ" | P0 | test | brainstorm Mục 4 P0, 6.4; URD UN-006 |
| FR-candidate-matching-011 | Lịch sử run kèm phiên bản | Hệ thống phải giữ toàn bộ run của một application kèm phiên bản model và phiên bản tiêu chí (ngưỡng + trọng số) tại thời điểm tính, cho xem lại từng run cũ | P0 | kiểm tra | PRD Mục 10 (R-02 model/version tracking); brainstorm Mục 4 P0 |
| FR-candidate-matching-012 | Batch tính điểm theo vị trí | Khi HR yêu cầu trên một vị trí, hệ thống phải tính điểm cho các application đủ điều kiện của vị trí đó, bỏ qua application đã có quyết định matching, và hiển thị bảng kết quả xếp theo điểm kèm nhãn đề xuất và cờ "không đủ dữ liệu" | P1 | test | brainstorm Mục 4 P1; URD UN-001, Journey 2 |
| FR-candidate-matching-013 | Batch không quyết định | Hệ thống phải giới hạn batch ở việc tính điểm — mọi quyết định vẫn do HR ghi trên từng run | P0 | test | PRD Mục 12; brainstorm Mục 4 P1 |
| FR-candidate-matching-014 | Tự chạy khi CV xác nhận | Khi một application gắn vị trí đang mở có CV vừa chuyển "Đã xác nhận", hệ thống phải tự tạo một run ở trạng thái "chờ-review" mà không cần HR bấm | P1 | test | brainstorm OQ-5 (đề xuất — chờ Product owner); URD Journey 1 |
| FR-candidate-matching-015 | Job lỗi và thử lại | Nếu job tính điểm thất bại hoặc quá hạn, hệ thống phải đánh dấu run "lỗi" kèm lý do, không để lại score nửa vời, và cho phép thử lại tạo run mới | P0 | test | brainstorm Mục 6.4; PRD Mục 10 (R-07) |
| FR-candidate-matching-016 | So sánh trong cùng vị trí | Hệ thống phải cho HR xem bảng so sánh breakdown của nhiều ứng viên cùng một vị trí để ra quyết định nhất quán | P1 | demo | brainstorm Mục 4 P1 |
| FR-candidate-matching-017 | Quyền theo scope | Hệ thống phải chỉ hiển thị score, evidence và quyết định cho người dùng có quyền trên vị trí/application tương ứng theo organization/role/data-scope, và ghi audit khi truy cập bị từ chối | P0 | test | PRD Mục 9; URD UN-009 |
| FR-candidate-matching-018 | Audit đầy đủ | Hệ thống phải ghi vết: ai yêu cầu/tự chạy run, ai quyết định, quyết định là gì, lý do override, ai sửa ngưỡng và lý do — kèm thời điểm | P0 | kiểm tra | PRD Mục 7.7 (override có lý do), Mục 9; URD UN-004, UN-005 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-candidate-matching-001 | decision-safety | Score không bao giờ tự gây thay đổi trạng thái application hay quyết định tuyển/loại — mọi hành động trên application do con người thực hiện qua `candidate-pipeline` | P0 | 0 application đổi trạng thái chỉ vì score trên toàn bộ pilot (guardrail; sửa xung đột auto-reject của reverse spec rule 1, OQ-RC-06) |
| NFR-candidate-matching-002 | explainability | Mọi score hiển thị cho người quyết định phải có breakdown và evidence truy ngược về field CV và yêu cầu vị trí | P0 | 100% run ở "chờ-review"/"đã-quyết-định" có đủ 3 thành phần kèm evidence hoặc cờ thiếu dữ liệu |
| NFR-candidate-matching-003 | auditability | Quyết định và thay đổi ngưỡng phải truy vết được ai/khi nào/lý do/trước-sau | P0 | Truy vết được 100% quyết định và 100% lần sửa ngưỡng trên mẫu kiểm tra |
| NFR-candidate-matching-004 | performance | Một run tính điểm đơn lẻ hoàn tất trong thời gian người dùng chấp nhận chờ | P1 | 95% run đơn lẻ có kết quả trong ≤2 phút (giá trị đề xuất — xem OQ-7) |
| NFR-candidate-matching-005 | performance | Batch tính điểm báo tiến độ và không chặn thao tác khác | P1 | Batch 50 hồ sơ hiển thị tiến độ theo thời gian thực và hoàn tất không quá 30 phút (giá trị đề xuất — xem OQ-7) |
| NFR-candidate-matching-006 | security | Truy cập score/evidence/quyết định tuân theo organization/role/data-scope; deny-by-default | P0 | 0 sự cố xem score vượt phạm vi được xác nhận (bám M-GR-01) |
| NFR-candidate-matching-007 | usability | Toàn bộ giao diện, nhãn đề xuất và thông báo tiếng Việt; nhãn đề xuất luôn kèm chữ "đây chỉ là gợi ý" | P0 | Kiểm tra màn matching và thông báo hiển thị đúng wording |
| NFR-candidate-matching-008 | data-retention | Run, quyết định và lịch sử ngưỡng giữ theo retention hồ sơ tuyển dụng chung | P1 | Thời gian giữ theo quyết định retention — chờ DPO (PRD OQ-6); trước khi duyệt chỉ dữ liệu synthetic |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-candidate-matching-001 | Score chỉ là đề xuất: không hành động nào trên application được tự thực hiện từ điểm số hoặc nhãn đề xuất | Khi run hoàn tất và gắn nhãn | FR-candidate-matching-004, FR-candidate-matching-013 | PRD Mục 12 (invariant), Mục 7.7 "Chưa làm"; sửa reverse spec rule 1 / OQ-RC-06 |
| BR-candidate-matching-002 | Override bắt buộc lý do không rỗng; chấp nhận đề xuất không bắt buộc lý do | Khi HR ghi quyết định khác đề xuất | FR-candidate-matching-006 | PRD Mục 7.7 (override có lý do) |
| BR-candidate-matching-003 | Chỉ CV "Đã xác nhận" và vị trí có JD mới được đưa vào đối chiếu; matching không đọc field chưa xác nhận hay file thô | Khi có yêu cầu tính điểm | FR-candidate-matching-001 | PRD Mục 7 (luồng review dữ liệu → matching); brainstorm Mục 8 |
| BR-candidate-matching-004 | Sửa ngưỡng chỉ cho vai trò được cấp, bắt buộc lý do, giữ lịch sử; ngưỡng mới chỉ áp cho run tính sau thời điểm hiệu lực | Khi vai trò được cấp lưu ngưỡng mới | FR-candidate-matching-008, FR-candidate-matching-009 | brainstorm Mục 7.1, OQ-1 |
| BR-candidate-matching-005 | Một quyết định hiệu lực duy nhất trên run mới nhất; quyết định đã ghi là bất biến — thay đổi bằng run mới + quyết định mới | Khi ghi quyết định | FR-candidate-matching-007 | brainstorm Mục 7.1, 8 |
| BR-candidate-matching-006 | Tổng điểm bằng đúng ngưỡng được tính "Đạt đề xuất" | Khi so điểm với ngưỡng | FR-candidate-matching-004 | brainstorm OQ-6 (đã chốt) |
| BR-candidate-matching-007 | Batch bỏ qua application đã có quyết định matching — không tính lại âm thầm | Khi chạy batch | FR-candidate-matching-012 | brainstorm Mục 6.1 (D6) |
| BR-candidate-matching-008 | Batch chỉ tính điểm — không có thao tác quyết định hàng loạt | Khi batch hoàn tất | FR-candidate-matching-013 | PRD Mục 12; brainstorm Mục 4 P1 |
| BR-candidate-matching-009 | Run "cũ" (nguồn CV/JD đã đổi) không được dùng để ghi quyết định | Khi HR mở review trên run cũ | FR-candidate-matching-010 | brainstorm Mục 6.4 |
| BR-candidate-matching-010 | Trọng số thành phần và thang điểm là cấu hình do business owner chốt — không hard-code công khai như chuẩn chung | Khi cấu hình tiêu chí đối chiếu | FR-candidate-matching-002, FR-candidate-matching-008 | brainstorm OQ-2 (liên quan OQ-11 PRD) |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-candidate-matching-001 | CV chưa xác nhận | Tính điểm cho application có CV chưa qua review | major | FR-candidate-matching-001 | Hiện "Chưa thể tính điểm — CV của ứng viên này chưa được xác nhận" | Quay lại `cv-intake` xác nhận CV |
| E-candidate-matching-002 | Application chưa gắn vị trí | Tính điểm cho ứng viên trong pool | major | FR-candidate-matching-001 | Hiện "Ứng viên chưa gắn vị trí nào — chọn vị trí trước khi đối chiếu" | Gắn application vào vị trí |
| E-candidate-matching-003 | Vị trí thiếu JD | Tính điểm khi vị trí chưa có JD/yêu cầu | major | FR-candidate-matching-001 | Hiện "Vị trí này chưa có JD/yêu cầu — bổ sung trước khi tính điểm" | Bổ sung JD ở `recruitment-planning` |
| E-candidate-matching-004 | Job tính điểm lỗi | Provider fail hoặc run quá 2 phút | major | FR-candidate-matching-015 | Run hiện "lỗi" + "Không tính được điểm lúc này — thử lại sau" | Bấm thử lại tạo run mới |
| E-candidate-matching-005 | Override thiếu lý do | Xác nhận override khi lý do rỗng | minor | FR-candidate-matching-006 | Hiện "Nhập lý do trước khi xác nhận thay đổi so với đề xuất" | Nhập lý do rồi xác nhận lại |
| E-candidate-matching-006 | Sửa ngưỡng thiếu lý do | Lưu ngưỡng mới khi lý do rỗng | minor | FR-candidate-matching-008 | Hiện "Nhập lý do thay đổi ngưỡng điểm" | Nhập lý do rồi lưu lại |
| E-candidate-matching-007 | Quyết định trên run cũ | Ghi quyết định khi run đã bị đánh dấu "cũ" | major | FR-candidate-matching-010 | Hiện "Dữ liệu đã thay đổi — tính lại điểm trước khi quyết định" | Tính lại rồi quyết trên run mới |
| E-candidate-matching-008 | Run đã có quyết định | Người thứ hai cố ghi quyết định trên cùng run | minor | FR-candidate-matching-007 | Hiện "Hồ sơ này đã được {người} quyết định lúc {thời điểm}" | Xem quyết định hiện có; tính run mới nếu cần |
| E-candidate-matching-009 | Không có quyền xem | Người ngoài scope cố xem score/evidence | major | FR-candidate-matching-017 | Ẩn dữ liệu + "Bạn không có quyền xem đối chiếu của vị trí này" | Xin cấp quyền; sự kiện ghi audit |
| E-candidate-matching-010 | Không có quyền sửa ngưỡng | Vai trò chưa được cấp cố lưu ngưỡng | major | FR-candidate-matching-008 | Hiện "Bạn không có quyền thay đổi ngưỡng đề xuất" | Xin cấp quyền qua admin; ghi audit |
| E-candidate-matching-011 | Batch không có hồ sơ đủ điều kiện | Chạy batch trên vị trí chưa có CV đã xác nhận | minor | FR-candidate-matching-012 | Empty state "Chưa có hồ sơ nào đủ điều kiện tính điểm cho vị trí này" | Chờ hồ sơ được xác nhận |
| E-candidate-matching-012 | Batch gián đoạn | Job batch bị ngắt giữa chừng | major | FR-candidate-matching-012 | Batch hiện trạng thái lỗi + số hồ sơ đã tính | Chạy lại phần chưa tính; run đã tạo không trùng |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-candidate-matching-01 | Đề xuất AI đáng tin để HR ưu tiên review | Tỷ lệ đề xuất được HR chấp nhận sau review / quyết định có đề xuất (theo phiên bản model) | Đạt mức sponsor duyệt — baseline/target chờ OQ-2 sản phẩm; M-GR-02 không tăng sau rollout |
| SC-candidate-matching-02 | Mọi score giải thích được | Tỷ lệ run có đủ breakdown + evidence (hoặc cờ thiếu dữ liệu chính xác) | 100% |
| SC-candidate-matching-03 | Override luôn có căn cứ | Tỷ lệ quyết định override có lý do không rỗng | 100% |
| SC-candidate-matching-04 | Không quyết định tự động từ điểm | Số application đổi trạng thái chỉ vì score | 0 (guardrail invariant) |
| SC-candidate-matching-05 | Review không bấm mù theo đề xuất | Tỷ lệ quyết định có sự kiện xem evidence trước khi quyết | ≥90% (đề xuất — chờ Product owner) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Lần chấm điểm (matching run)__ — một lần tính score trên application:
  tổng điểm, nhãn đề xuất, trạng thái, cờ dữ liệu, phiên bản model/tiêu
  chí, ngưỡng áp dụng và provenance người yêu cầu.
- __Điểm thành phần__ — breakdown kỹ năng/kinh nghiệm/domain của một run
  kèm trọng số tại thời điểm tính và cờ thiếu dữ liệu.
- __Evidence__ — mục giải thích của một thành phần: field CV đã xác nhận
  khớp yêu cầu vị trí nào.
- __Ngưỡng đề xuất__ — giá trị ngưỡng + trọng số có hiệu lực theo tổ chức
  hoặc vị trí, mỗi bản ghi là một lần đặt (lịch sử tự nhiên).
- __Quyết định matching__ — quyết định của con người trên một run: chấp
  nhận/override, lý do, người và thời điểm — bất biến.
- __Đợt batch__ — một lần tính điểm hàng loạt theo vị trí với đếm kết quả.
- __Application / Vị trí / CV / Người dùng__ — tham chiếu từ
  `candidate-pipeline`, `recruitment-planning`, `cv-intake`,
  `org-governance`.

Chi tiết quan hệ + thuộc tính ở `srs/candidate-matching-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Tính điểm một application → xem breakdown + evidence →
  chấp nhận hoặc override có lý do → application đi tiếp qua con người.
- __Flow 2:__ Batch tính điểm theo vị trí → bảng xếp theo điểm → review
  từng hồ sơ.
- __Flow 3:__ Sửa ngưỡng tổ chức/vị trí có lý do → run mới áp ngưỡng mới,
  run cũ giữ nhãn cũ + cảnh báo.
- __Flow 4:__ CV/JD đổi → run cũ đánh dấu "cũ" → tính lại → quyết định
  trên run mới.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __matching-review__ — tổng điểm, nhãn đề xuất, breakdown 3 thành phần,
  evidence từng phần, nút chấp nhận/override.
- __matching-batch__ — bảng hồ sơ của vị trí xếp theo điểm kèm nhãn và cờ
  thiếu dữ liệu.
- __matching-compare__ — so sánh breakdown nhiều ứng viên cùng vị trí.
- __threshold-config__ — ngưỡng hiệu lực theo tổ chức/vị trí + lịch sử
  thay đổi.
- __matching-history__ — các run cũ của application kèm phiên bản model/
  tiêu chí và quyết định đã ghi.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Human-in-the-loop: score là đề xuất, con người giữ quyền quyết định; cấm auto-reject | PRD Mục 12 + Mục 7.7 "Chưa làm" — Product owner |
| Chỉ đối chiếu trên CV đã được con người xác nhận | PRD Mục 7 luồng (cv-intake → matching) — Product owner |
| Truy cập theo organization/role/data-scope, deny-by-default | PRD Mục 9 — Security owner |
| Audit cho hành động nhạy cảm (quyết định, sửa ngưỡng) | PRD Mục 9 — Security owner |
| AI output phải parse/review; credential provider chỉ ở server boundary | PRD Mục 9 — Technical owner |
| Trọng số/ngưỡng cần business authority (Head of HR) — không tự chốt | PRD Mục 10 (R-13 tinh thần), OQ-11 PRD — Head of HR |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| CV/facts ở trạng thái "Đã xác nhận" trên application | `cv-intake` | FR-candidate-matching-001 — không có đầu vào hợp lệ |
| Vị trí có JD + yêu cầu (và kỹ năng kỳ vọng khi có) | `recruitment-planning` (+ `talent-framework`) | FR-candidate-matching-002/003 — thiếu chuẩn đối chiếu |
| Application + state machine nhận input quyết định | `candidate-pipeline` | Kết quả review không đi tiếp được |
| Role/scope cho vai trò sửa ngưỡng và xem score | `org-governance` | FR-candidate-matching-008/017 |
| Head of HR chốt thang điểm, trọng số và ngưỡng mặc định | Head of HR (OQ-1/OQ-2/OQ-3 spec) | FR-candidate-matching-002/004/008 dùng giá trị đề xuất |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Thang 0–100, 3 thành phần trọng số bằng nhau mặc định (đề xuất OQ-2) | FR-candidate-matching-002 và NFR-002 phải đổi cách trình bày/tính |
| Ngưỡng mặc định 60/100, 2 tầng tổ chức + vị trí (đề xuất OQ-3) | FR-candidate-matching-008 thiếu giá trị khởi đầu |
| Score tự chạy khi CV xác nhận + vị trí mở (đề xuất OQ-5) | FR-candidate-matching-014 thừa — HR bấm tay mọi lần |
| Quyết định hiệu lực thuộc run mới nhất; quyết định đã ghi bất biến | FR-candidate-matching-007 phải hỗ trợ sửa quyết định |
| Yêu cầu đối chiếu đọc từ JD + kỹ năng kỳ vọng của vị trí | FR-candidate-matching-003 không có requirement_ref |
| Kết quả review chỉ là input; transition do `candidate-pipeline` thực hiện | Phải thêm cơ chế tự chuyển stage — vi phạm ranh giới |

## 12. Open Questions

- [x] OQ-1: Ai đặt/sửa threshold — Resolved (đề xuất): vai trò HR lead/
  admin theo cấu hình tổ chức; Head of HR duyệt ngưỡng tổ chức và theo
  vị trí — chờ Head of HR xác nhận (liên quan OQ-11 PRD).
- [x] OQ-2: Thang điểm và trọng số — Resolved (đề xuất): 0–100; 3 thành
  phần trọng số bằng nhau mặc định, cấu hình được — chờ Head of HR xác
  nhận.
- [x] OQ-3: Ngưỡng mặc định — Resolved (đề xuất): 60/100 — chờ Head of
  HR xác nhận.
- [x] OQ-4: Score dưới ngưỡng có auto-reject không — Resolved: KHÔNG;
  score chỉ là đề xuất (PRD Mục 12; trả lời OQ-RC-06 = recommendation).
- [x] OQ-5: Tự chạy hay bấm tay — Resolved (đề xuất): tự chạy tạo run
  chờ-review khi CV xác nhận + vị trí mở — chờ Product owner xác nhận.
- [x] OQ-6: Score bằng đúng ngưỡng — Resolved: tính "Đạt đề xuất".
- [x] OQ-7: Ngưỡng hiệu năng (run ≤2 phút, batch 50/≤30 phút) — Resolved
  (đề xuất): giữ làm mặc định — chờ Product owner xác nhận.
- [~] OQ-8: Gợi ý vị trí khác cho ứng viên/pool — Out of scope v1:
  matching đa vị trí là roadmap mở rộng.
- [~] OQ-9: Báo cáo bias/fairness định kỳ — Out of scope v1: chỉ ghi đủ
  dữ liệu quyết định + override để phân tích sau.
