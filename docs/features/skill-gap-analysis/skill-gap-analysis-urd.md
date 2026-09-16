---
type: urd
feature: skill-gap-analysis
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/skill-gap-analysis/brainstorms/skill-coverage-and-gap-review.md, docs/_reverse/talent-and-crm/reverse-spec.md]
---

# skill-gap-analysis — User Requirements Document

## 1. Purpose

Cho quản lý và HR một phân tích độ phủ kỹ năng có kiểm chứng: so sánh năng
lực đã xác nhận của cá nhân/nhóm với khung kỳ vọng vị trí đã công bố, theo
công thức được business owner duyệt, để nhận biết khoảng trống kỹ năng có
thể hành động — ưu tiên đào tạo hoặc điều phối trên căn cứ evidence thay
vì cảm tính.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Quản lý | Quyết định đào tạo/điều phối bằng ấn tượng cá nhân | Không biết team thiếu kỹ năng nào so với kỳ vọng chính thức | Ngân sách đào tạo đi sai chỗ, nhân sự bị đánh giá cảm tính | Confirmed — PRD Mục 7.34 (phục vụ job), JTBD-MGR-01 |
| HR | Tổng hợp năng lực nhóm bằng file thủ công | Không có số liệu chuẩn để lập kế hoạch và trả lời lãnh đạo | Mất thời gian tổng hợp, con số không đối chiếu được | Confirmed — PRD Mục 7.34 (group coverage); Observed: reverse spec `talent-and-crm` FR-TL-04 |
| Business owner (Head of HR) | Công thức coverage/weight/threshold chưa có ai chịu trách | Con số độ phủ bị tranh chấp khi dùng làm căn cứ | Phân tích mất uy tín, action bị nghi ngờ | Confirmed — PRD Mục 7.34 (rủi ro chính), Mục 10 R-13, OQ-11; Observed: reverse spec `talent-and-crm` OQ-TL-02 |
| Nhân viên | Không biết mình thiếu gì so với kỳ vọng vị trí | Không chủ động được hướng phát triển; sợ bị xếp hạng | Thụ động chờ được đánh giá | Confirmed — JTBD-EMP-01; Assumption — suy từ OQ-8 PRD |
| Admin | Kết quả phân tích là dữ liệu nhân sự nhạy cảm | Chưa rõ ai được xem cá nhân/nhóm, truy cập không truy vết | Nguy cơ lộ dữ liệu và ranking lậu | Confirmed — PRD Mục 9 (scope/audit), Mục 7.34 "Chưa làm" |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Quản lý | Cần ưu tiên đào tạo/điều phối cho team trong scope | Thấy coverage và kỹ năng thiếu có evidence, xác nhận kết quả, tạo action có owner | Quyết định cảm tính, không có con số chung, bị tranh chấp |
| secondary | HR | Chạy phân tích cho nhiều nhóm, lập kế hoạch phát triển | Phân tích lặp lại được theo chuẩn đã duyệt, truy vết được | Tổng hợp tay, không ai duyệt công thức |
| secondary | Business owner (Head of HR/người được gán) | Chịu trách nhiệm công thức coverage/weight/threshold | Công thức qua duyệt trước khi áp, có provenance | Con số không có authority (R-13) |
| secondary | Nhân viên | Muốn biết gap của mình so với vị trí | Xem phần được công bố và action được giao | Không có nơi tra chính thức |
| secondary | Admin | Vận hành, phân quyền, truy vết | Kiểm soát ai xem/xuất, audit đầy đủ | Dữ liệu nhạy cảm không kiểm soát phạm vi |
| out | Ứng viên | — | — | Không liên quan feature này |

## 3. Scope Boundaries

### In Scope

- Lần phân tích (run) cho một nhân viên hoặc một đơn vị/nhóm trong scope:
  chọn đối tượng, chọn chuẩn (khung vị trí "đã-công-bố", mặc định khung
  của vị trí hiện tại), tính coverage và lưu snapshot kèm provenance.
- Breakdown theo kỹ năng: level yêu cầu vs level đã xác nhận, trạng thái
  đạt/dưới-yêu-cầu/vượt/chưa-đánh-giá, cờ bắt buộc, % coverage theo công
  thức đã duyệt, danh sách kỹ năng thiếu.
- Drill evidence: nguồn level (kết quả đánh giá đã ghi nhận/ghi nhận thủ
  công), thời điểm xác nhận, nhãn "dữ liệu cũ" theo ngưỡng.
- Group coverage: tổng hợp số người đạt/tổng theo từng kỹ năng, kỹ năng
  thiếu phổ biến; drill thành viên trong scope; không bảng xếp hạng.
- Công thức coverage là đối tượng có vòng đời duyệt của business owner
  (bản-nháp → chờ-duyệt → đã-công-bố → ngừng-dùng); run ghi phiên bản
  công thức và khung đã áp.
- Xác nhận run của reviewer trước khi tạo action; action đào tạo/điều
  phối/đánh giá bổ sung có mô tả, owner, hạn, trạng thái.
- Nhân viên xem gap của chính mình (phần công bố); so sánh hai run; cảnh
  báo khung bản mới/level mới; xuất CSV trong scope; audit truy cập.

### Out of Scope

- Ranking công khai hoặc bảng xếp hạng nhân viên (PRD Mục 7.34 "Chưa làm").
- Quyết định nhân sự tự động (lương, thăng chức, kỷ luật, điều chuyển bắt
  buộc) từ kết quả phân tích.
- Ghi nhận/đánh giá level kỹ năng — thuộc `employee-evaluation`; feature
  này chỉ đọc level "đã xác nhận".
- Định nghĩa taxonomy, thang level và khung vị trí — thuộc
  `talent-framework`.
- Sở hữu hồ sơ nhân viên và hồ sơ năng lực gốc — thuộc `employee-profiles`.
- Nhóm ad-hoc tự tạo ngoài đơn vị tổ chức — hướng mở rộng (OQ-1).
- Đề xuất nội dung đào tạo bằng AI, AI tóm tắt gap, dashboard xu hướng
  (giao `management-reporting`) — hướng P2.
- Task đầy đủ cho action (kanban) — first release action chỉ có owner/
  hạn/trạng thái; liên kết `kanban-workspaces` là mở rộng sau.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Quản lý | Khi cần biết cấp dưới thiếu kỹ năng gì | Chọn nhân viên + chuẩn khung, xem từng kỹ năng: yêu cầu vs đã xác nhận, đạt/dưới/vượt/chưa-đánh-giá | Nhận biết gap cụ thể thay vì ấn tượng chung | Critical | Confirmed — PRD Mục 7.34 (score breakdown, missing skills); Observed: reverse spec `talent-and-crm` FR-TL-03 |
| UN-002 | Quản lý / HR | Khi cần bức tranh cả nhóm | Chọn đơn vị/nhóm + chuẩn, xem số người đạt/tổng theo kỹ năng và kỹ năng thiếu phổ biến | Ưu tiên đào tạo nhóm có căn cứ | Critical | Confirmed — PRD Mục 7.34 (group coverage); Observed: FR-TL-04 |
| UN-003 | Quản lý | Khi đọc một dòng gap | Mở drill evidence: level nào, xác nhận bởi kết quả nào, khi nào, có phải dữ liệu cũ không | Tin được con số trước khi quyết định | Critical | Confirmed — PRD Mục 7.34 (drill evidence) |
| UN-004 | Business owner | Khi công thức coverage được soạn/sửa | Công thức đi qua duyệt trước khi áp; mọi run ghi phiên bản công thức | Con số coverage có authority chịu trách | Critical | Confirmed — PRD Mục 7.34 (rủi ro), R-13, OQ-11 |
| UN-005 | Reviewer (quản lý/HR) | Khi run đã tính xong | Xem toàn bộ breakdown + evidence rồi xác nhận hoặc trả ghi chú yêu cầu tính lại | Kết quả được con người kiểm chứng trước khi dùng | Critical | Confirmed — PRD Mục 7.34 (review trước action, đo thành công) |
| UN-006 | Quản lý / HR | Khi đã xác nhận run | Tạo action đào tạo/điều phối/đánh giá bổ sung cho dòng gap hoặc cả nhóm, có owner + hạn | Gap biến thành việc cụ thể có người chịu | Critical | Confirmed — PRD Mục 7.34 (tạo action, ưu tiên đào tạo/điều phối) |
| UN-007 | HR | Khi thành viên nhóm thiếu khung hoặc thiếu level | Thấy rõ danh sách chưa đủ dữ liệu, không bị tính vào mẫu | Không có con số ảo từ dữ liệu thiếu | High | Assumption — suy từ rủi ro dữ liệu; brainstorm D7 |
| UN-008 | Nhân viên | Khi muốn biết gap của mình | Xem phần được công bố: trạng thái kỹ năng theo khung vị trí mình + action được giao | Chủ động hướng phát triển | High | Confirmed — JTBD-EMP-01; Assumption — đề xuất OQ-2 (PRD OQ-8) |
| UN-009 | Quản lý / HR | Khi khung hoặc level thay đổi sau run | Được cảnh báo "có dữ liệu mới — tính lại"; run cũ giữ snapshot | Không ra quyết định trên số cũ vô thức | High | Assumption — suy từ yêu cầu provenance |
| UN-010 | Admin | Khi điều tra truy cập kết quả phân tích | Truy vết ai xem/xuất/xác nhận run nào, khi nào | Audit đầy đủ trên dữ liệu nhạy cảm | Critical | Confirmed — PRD Mục 9 (audit boundary) |
| UN-011 | Quản lý | Khi xét chuyển nội bộ cho một nhân viên | So gap của người đó theo khung của vị trí đích | Biết trước gap nếu điều chuyển | Medium | Assumption — brainstorm Mục 4 (P1), OQ-7 |
| UN-012 | HR | Khi cần đưa kết quả ra khỏi hệ thống | Xuất CSV trong scope, có audit lượt xuất | Chia sẻ có kiểm soát | Medium | Assumption — mở rộng hợp lý của capability export |

## 5. Prioritized User Journeys

### Journey 1: Phân tích gap của một nhân viên đến action

- **User:** Quản lý
- **Importance:** Critical
- **Trigger:** Trước quyết định đào tạo/điều phối, hoặc sau một đợt đánh
  giá.
- **Expected outcome:** Run "đã-xác-nhận" có breakdown + evidence, và ít
  nhất một action có owner được tạo cho gap quan trọng.
- **Related needs:** UN-001, UN-003, UN-005, UN-006

1) Quản lý chọn một cấp dưới trong scope → chuẩn mặc định khung "đã-công-
   bố" của vị trí người đó.
2) Hệ thống tính coverage: từng kỹ năng đạt/dưới/vượt/chưa-đánh-giá, %
   coverage, cờ bắt buộc.
3) Quản lý đọc breakdown, drill evidence của các dòng quan trọng → "Xác
   nhận kết quả".
4) Chọn dòng gap → "Tạo action" (đào tạo/điều phối/đánh giá bổ sung) →
   gán owner + hạn → action "mở".

**Independent verification:** Với một run đã xác nhận — mọi dòng gap có
trạng thái và nguồn level; run ghi phiên bản công thức + khung; action
tạo ra trỏ đúng run và có owner + hạn.

### Journey 2: Phân tích coverage cả nhóm

- **User:** HR (hoặc quản lý cho team mình)
- **Importance:** Critical
- **Trigger:** Lập kế hoạch đào tạo quý, hoặc trước khi mở vị trí mới.
- **Expected outcome:** Coverage nhóm theo kỹ năng với danh sách thiếu
  phổ biến, thành viên thiếu dữ liệu được liệt kê riêng, run được xác
  nhận và dẫn tới action nhóm.
- **Related needs:** UN-002, UN-005, UN-006, UN-007

1) HR chọn đơn vị/nhóm trong scope → chọn chuẩn (theo khung từng thành
   viên).
2) Hệ thống tính từng thành viên đủ dữ liệu; liệt kê riêng người thiếu
   khung/thiếu level.
3) Màn coverage nhóm: số người đạt/tổng theo kỹ năng, kỹ năng thiếu phổ
   biến; drill thành viên trong scope (không xếp hạng).
4) Reviewer xác nhận → tạo action nhóm (vd "đào tạo {kỹ năng} cho team").

**Independent verification:** Với một run nhóm — tổng số thành viên tính +
số thiếu dữ liệu khớp danh sách; mọi dòng coverage có mẫu số và nguồn;
action nhóm có owner.

### Journey 3: Công bố công thức coverage qua duyệt

- **User:** HR (soạn) + business owner (duyệt)
- **Importance:** High
- **Trigger:** Cần chuẩn tính coverage trước đợt phân tích đầu tiên, hoặc
  thay đổi cách tính.
- **Expected outcome:** Công thức "đã-công-bố" là bản duy nhất được áp;
  mọi run mới ghi phiên bản này.
- **Related needs:** UN-004

1) HR soạn công thức (cách tính %, trọng số kỹ năng bắt buộc, xử lý "chưa
   đánh giá") → gửi duyệt.
2) Owner xem → "Công bố" hoặc "Yêu cầu chỉnh" kèm ghi chú.
3) Công thức công bố áp cho run mới; run cũ giữ phiên bản đã áp.

**Independent verification:** Tạo run sau khi công thức công bố — run ghi
đúng phiên bản công thức; khi chưa có công thức "đã-công-bố" thì run mới
bị chặn với hướng dẫn gửi duyệt.

### Journey 4: Nhân viên xem gap của mình

- **User:** Nhân viên
- **Importance:** High
- **Trigger:** Muốn biết mình thiếu gì so với kỳ vọng vị trí, hoặc vừa
  được giao action phát triển.
- **Expected outcome:** Xem được trạng thái kỹ năng theo khung của mình và
  action được giao; không thấy dữ liệu người khác.
- **Related needs:** UN-008

1) Nhân viên mở "Kỹ năng của tôi so với vị trí" → xem đạt/thiếu theo
   khung + action đang giao cho mình.
2) Nhãn trên màn hình ghi rõ đây là căn cứ tham khảo, không phải quyết
   định nhân sự.

**Independent verification:** Đăng nhập nhân viên — thấy đúng phần công
bố; truy cập run của đồng nghiệp bị chặn và ghi audit.

### Journey 5: Theo dõi và đóng action

- **User:** Owner action + người tạo
- **Importance:** Medium
- **Trigger:** Action được giao và đến hạn.
- **Expected outcome:** Action đi đến "xong" hoặc "hủy" có lý do; action
  quá hạn được nhắc.
- **Related needs:** UN-006

1) Owner nhận thông báo action → cập nhật "đang-làm" → "xong" khi hoàn
   tất.
2) Người tạo/quản lý xem danh sách action theo run; hủy action kèm lý do
   khi không còn phù hợp.

**Independent verification:** Lấy 10 action đã đóng — 100% có trạng thái
cuối, owner, và lý do nếu bị hủy.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Đối tượng chưa có khung đã công bố | Không tính được | Chặn run cá nhân + hướng dẫn chọn khung khác/công bố khung; run nhóm loại thành viên thiếu khung ra danh sách riêng | Journey 1, 2 / UN-001, UN-007 |
| Chưa có công thức coverage được duyệt | Không có chuẩn tính | Chặn run mới + "gửi duyệt công thức trước khi phân tích" | Journey 3 / UN-004 |
| Tạo action khi run chưa xác nhận | Action theo dữ liệu chưa ai xem | Chặn: "Kết quả phân tích cần được người xác nhận duyệt trước khi tạo hành động" | Journey 1 / UN-006 |
| Nhân viên chưa có level nào đã xác nhận | Hiểu lầm coverage 0% | Mọi dòng "chưa-đánh-giá" + thông báo "chưa đủ dữ liệu để đánh giá" thay vì % số | Journey 1 / UN-007 |
| Level đã xác nhận quá 180 ngày | Quyết định trên dữ liệu cũ | Nhãn "dữ liệu cũ — cân nhắc đánh giá lại" cạnh dòng gap | UN-003, UN-009 |
| Khung/công thức/level đổi sau khi run đã tính | Run lệch dữ liệu hiện tại | Cảnh báo "có bản mới — tạo phân tích mới"; run cũ giữ snapshot | UN-009 |
| Reviewer trả run kèm ghi chú | Run treo không rõ trạng thái | Run ở "đã-tính" + ghi chú yêu cầu; người tạo tính lại/bổ sung | UN-005 |
| Reviewer vắng khi run chờ xác nhận | Action không tạo được | Cảnh báo hàng chờ; HR phân công reviewer khác trong scope | UN-005 |
| Nhóm có thành viên giữ vị trí khác nhau | Không biết chọn chuẩn nào | Chuẩn áp theo khung của từng người; coverage nhóm tổng hợp theo kỹ năng chung | Journey 2 / UN-002 |
| Người xem ngoài scope cố mở run | Lộ dữ liệu nhạy cảm | Chặn + "Bạn không có quyền xem phân tích kỹ năng này"; audit truy cập bị từ chối | UN-008, UN-010 |
| Owner action nghỉ việc | Action mồ côi | Người tạo phân công owner mới; audit ghi cả hai | Journey 5 / UN-006 |
| Run đã xác nhận bị phát hiện sai nguồn | Sửa run mất provenance | Không sửa run — tạo run mới, đánh dấu run cũ "đã thay thế" kèm liên kết | UN-009 |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt là ưu tiên.
- Mọi người dùng phải đăng nhập và thuộc tổ chức/phạm vi được cấp; không
  có surface công khai cho kết quả phân tích.
- Chỉ khung vị trí "đã-công-bố" được làm chuẩn; chỉ công thức "đã-công-bố"
  được áp cho run mới — không ngoại lệ.
- Chỉ level "đã xác nhận" được tính coverage; level tự khai không vào mẫu
  số.
- Action chỉ tạo từ run "đã-xác-nhận" — con người phải xem kết quả trước
  khi hành động.
- Kết quả phân tích luôn mang nhãn "căn cứ tham khảo, không phải quyết
  định nhân sự"; không surface ranking/xếp hạng.
- Màn hình desktop là chính cho breakdown, drill và hàng chờ; không yêu
  cầu mobile cho first release.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| "Nhóm" = đơn vị/phòng ban của org-governance; nhóm ad-hoc là mở rộng | Nếu cần nhóm tự tạo ngay → thiếu entity nhóm và scope | Resolved-đề xuất — chờ Product owner | Chốt ở OQ-1 |
| Người xem: quản lý/HR trong scope xem đầy đủ; nhân viên xem gap của mình ở phần công bố | Nếu nhân viên không được xem → màn self-service thừa; nếu phạm vi rộng hơn → rủi ro lộ | Resolved-đề xuất — chờ Product owner | Chốt ở OQ-2 (PRD OQ-8) |
| Business owner duyệt công thức/weight/threshold là Head of HR (hoặc người được gán) | Nếu authority khác → duyệt gán sai, con số vô chủ (R-13) | Resolved-đề xuất — chờ Head of HR | Chốt ở OQ-3 (PRD OQ-11) |
| Công thức v1: % = kỹ năng đạt/vượt trên tổng kỹ năng khung; "chưa-đánh-giá" vào mẫu số, hiển thị riêng; trọng số bắt buộc trong quy tắc | Nếu công thức khác → con số coverage đổi toàn bộ | Resolved-đề xuất — chờ Head of HR | Chốt ở OQ-4 |
| Level "đã xác nhận" đọc từ hồ sơ năng lực của employee-profiles (ghi bởi employee-evaluation) | Nếu nguồn khác → drill evidence trỏ sai | Confirmed — phụ thuộc Feature Map (3, 32, 33) | Đối chiếu contract đọc |
| Reviewer run mặc định: quản lý trực tiếp (cá nhân) / quản lý đơn vị (nhóm) | Nếu reviewer khác → hàng chờ gán sai | Assumption — bám mô hình reviewer `employee-evaluation` | Chốt cùng OQ-3 spec |
| Ngưỡng 300 thành viên, 180 ngày dữ liệu cũ, 20 action/run, 10.000 dòng CSV là chuẩn first release | Nếu khác → đổi giới hạn và nhãn | Resolved-đề xuất — chờ Head of HR | Chốt ở OQ-5 |
| Chỉ dữ liệu synthetic trước khi privacy gate đạt | Nếu dùng dữ liệu thật sớm → vi phạm gate | Confirmed — PRD Mục 9, OQ-3/OQ-6 PRD | — |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Gap được reviewer xác nhận và dẫn tới action phù hợp | Chưa có — xác lập bằng đo trong 1 quý đầu | ≥70% run đã xác nhận có ≥1 action; target chính thức chờ OQ-1/OQ-2 PRD | Tỷ lệ run "đã-xác-nhận" có action / tổng run "đã-xác-nhận" | 1 quý sau rollout |
| USC-002 | Run nào cũng có provenance chuẩn | — | 100% run ghi phiên bản công thức + khung đã áp | Kiểm tra bản ghi run | Liên tục |
| USC-003 | Action chỉ sinh từ kết quả đã xem | — | 100% action trỏ run "đã-xác-nhận" | Kiểm tra liên kết action → run | Liên tục |
| USC-004 | Action được theo đến cùng | Chưa có — xác lập sau 1 quý | ≥80% action đóng (xong/hủy có lý do) trong hạn | Tỷ lệ action đóng đúng hạn | 1 quý sau rollout |
| USC-005 | Không lộ kết quả ngoài phạm vi | 0 sự cố | 0 sự cố xem/xuất vượt scope được xác nhận | Số incident vượt scope (guardrail bám M-GR-01) | Liên tục |

## 10. Open Questions

- [x] OQ-1: "Nhóm" trong phân tích nhóm là gì — đơn vị tổ chức hay nhóm
  tự tạo? — Resolved (đề xuất): first release dùng đơn vị/phòng ban của
  `org-governance`; nhóm ad-hoc là hướng mở rộng — chờ Product owner xác
  nhận.
- [x] OQ-2: Ai được xem kết quả phân tích — và nhân viên có xem gap của
  mình không? — Resolved (đề xuất): quản lý/HR trong scope xem đầy đủ;
  nhân viên xem gap của chính mình ở phần công bố; không ranking — chờ
  Product owner xác nhận (PRD OQ-8).
- [x] OQ-3: Ai duyệt công thức coverage, weight và threshold? — Resolved
  (đề xuất): business owner là Head of HR (hoặc người Head of HR gán) —
  chờ Head of HR xác nhận (PRD OQ-11, R-13; OQ-TL-02 reverse spec).
- [x] OQ-4: Công thức coverage v1 cụ thể là gì? — Resolved (đề xuất): %
  coverage = kỹ năng đạt/vượt yêu cầu trên tổng kỹ năng khung; "chưa-
  đánh-giá" vào mẫu số nhưng hiển thị riêng; trọng số bắt buộc nằm trong
  quy tắc do owner công bố — chờ Head of HR xác nhận.
- [x] OQ-5: Ngưỡng đề xuất (300 thành viên/nhóm, dữ liệu cũ 180 ngày, 20
  action mở/run, 10.000 dòng CSV) có được duyệt? — Resolved (đề xuất):
  giữ ngưỡng đề xuất — chờ Head of HR xác nhận.
- [x] OQ-6: Run có bắt buộc reviewer xác nhận trước khi tạo action? —
  Resolved: có — action chỉ tạo từ run "đã-xác-nhận", bám luồng và chỉ
  số thành công của PRD Mục 7.34.
- [x] OQ-7: Có cho so gap theo khung vị trí khác hiện tại không? —
  Resolved: có — chọn bất kỳ khung "đã-công-bố", mặc định khung vị trí
  hiện tại; run ghi rõ chuẩn đã áp (P1).
- [x] OQ-8: Retention của run và action? — Resolved (đề xuất): giữ để
  truy vết/so sánh; chính thức theo OQ-6 PRD — chờ DPO.
