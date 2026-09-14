---
type: urd
feature: management-reporting
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/management-reporting/brainstorms/scoped-kpi-risk-alerts.md]
---

# management-reporting — User Requirements Document

## 1. Purpose

Cho quản lý và lãnh đạo một góc nhìn tổng hợp tự phục vụ về tuyển dụng,
đánh giá và công việc trong đúng phạm vi quyền của mình — biết được đâu
đang kẹt, cái gì quá hạn — mà không phải chờ HR tổng hợp tay và không
vượt ra ngoài dữ liệu mình được phép xem.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Quản lý | Muốn biết việc trong đơn vị đang kẹt ở đâu phải hỏi HR hoặc tự mở từng màn nghiệp vụ | Số liệu rời rạc, phát hiện chậm trễ muộn, không đồng nhất giữa các phòng | Ra quyết định chậm hoặc trên thông tin cũ; bị hỏi mới biết việc kẹt | Confirmed — PRD Mục 7.25; brainstorm scoped-kpi-risk-alerts Mục 2 |
| Lãnh đạo / Head of HR | Chờ HR tổng hợp tay mỗi tuần | Không tự phục vụ được số liệu cross-domain | Mất thời gian chờ; số liệu không drill xuống evidence được | Confirmed — PRD Mục 3 JTBD-BUY-01, JTBD-MGR-01 |
| HR | Tổng hợp số liệu thủ công, trả lời lặp lại cùng câu hỏi | Tốn công và dễ sai lệch giữa các lần gửi | Mất thời gian vận hành, số liệu không nhất quán | Observed: brainstorm scoped-kpi-risk-alerts Mục 3 |
| Admin | Cảnh báo nhiễu hoặc thiếu vì ngưỡng một cỡ cho mọi đơn vị | Không điều chỉnh được ngưỡng cảnh báo theo thực tế đơn vị | Alert fatigue, cảnh báo bị bỏ qua | Assumption — suy từ nhu cầu ngưỡng cấu hình được trong brainstorm |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Quản lý | Theo dõi tuyến dụng, bài đánh giá và công việc trong đơn vị mình quản lý | Nhận biết chậm trễ/rủi ro sớm và xác nhận action xử lý trong đúng scope | Không biết việc kẹt tới khi bị hỏi; sợ xem nhầm dữ liệu ngoài phạm vi |
| secondary | Lãnh đạo / Head of HR | Cần góc nhìn toàn tổ chức để ra quyết định | Báo cáo tổng hợp tự phục vụ, drill xuống evidence khi cần | Phải chờ tổng hợp tay; không kiểm chứng được số liệu |
| secondary | HR | Trả lời câu hỏi số liệu của quản lý | Số liệu tự cập nhật, export hợp lệ khi cần gửi | Tổng hợp thủ công, lặp lại |
| secondary | Admin | Vận hành ngưỡng cảnh báo và bộ KPI mặc định | Cấu hình ngưỡng theo đơn vị có kiểm chứng | Ngưỡng cứng một cỡ gây nhiễu/thiếu cảnh báo |
| out | Nhân viên / Ứng viên | Là đối tượng bị tổng hợp trong số liệu | (gián tiếp) dữ liệu của mình không bị lộ ngoài scope | Không có nhu cầu trực tiếp với feature này trong v1 |

## 3. Scope Boundaries

### In Scope

- Xem dashboard KPI nghiệp vụ (pipeline ứng viên, bài đánh giá, task)
  trong đúng phạm vi quyền, theo kỳ và filter phòng ban/vị trí.
- Nhận và xử lý cảnh báo quá hạn/rủi ro có vòng đời (mới → xử lý → đóng).
- Mở evidence nguồn từ số liệu/cảnh báo — chỉ entity trong scope.
- Yêu cầu AI executive summary kèm link evidence; con người xác nhận mọi
  action trước khi thực thi.
- Export báo cáo trong scope có audit và hạn lưu giữ file.
- Admin cấu hình ngưỡng cảnh báo và bộ KPI mặc định.

### Out of Scope

- Report builder tùy biến, báo cáo liên domain, dự báo/benchmark giữa
  các đơn vị (P2 của brainstorm; PRD Mục 5 non-goal "báo cáo liên domain").
- AI kết luận vi phạm hoặc chấm phẩm chất con người — invariant PRD Mục 12.
- Thu thập/phát sinh dữ liệu nguồn — thuộc các module nghiệp vụ
  (`candidate-pipeline`, `kanban-workspaces`, `candidate-assessment`,
  `assessment-grading`).
- Kênh gửi thông báo cảnh báo — thuộc `contextual-notifications`.
- Giám sát vận hành nhân viên (workload cá nhân) — thuộc
  `workforce-monitoring` ở phase sau.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Quản lý | Khi mở mục báo cáo trong kỳ hiện tại | Thấy ngay KPI của đơn vị mình: application đang kẹt, task quá hạn, bài test sắp hết hạn, tỷ lệ hoàn thành đúng hạn | Nắm được tình hình trong một màn hình mà không hỏi HR | Critical | Confirmed — PRD Mục 7.25 |
| UN-002 | Quản lý | Khi muốn so sánh theo kỳ hoặc đơn vị con trong scope | Đổi kỳ (tuần/tháng/quý) và lọc phòng ban/vị trí trong scope | Số liệu tổng hợp lại đúng phạm vi, không lộ nhóm ngoài scope | Critical | Confirmed — PRD Mục 7.25 (filter scope) |
| UN-003 | Quản lý | Khi có entity vượt ngưỡng (application kẹt, task quá hạn, test sắp hết hạn) | Nhận cảnh báo kịp thời trên dashboard và qua thông báo | Phát hiện chậm trễ sớm thay vì khi bị hỏi | Critical | Confirmed — PRD Mục 7.25 (overdue/risk) |
| UN-004 | Quản lý | Khi mở một cảnh báo hoặc số liệu bất thường | Drill xuống danh sách entity nguồn làm evidence | Tin vào số liệu vì kiểm chứng được từng bản ghi trong scope | Critical | Confirmed — PRD Mục 7.25 (drill evidence) |
| UN-005 | Quản lý | Khi xử lý một cảnh báo | Chọn action rõ ràng: tạo task, giao lại owner, tạm hoãn có lý do, hoặc đóng kèm lý do | Cảnh báo dẫn tới hành động được ghi nhận, không bị bỏ trôi | Critical | Confirmed — PRD Mục 7.25 (xác nhận action); đo thành công của feature |
| UN-006 | Lãnh đạo | Khi cần bức tranh tổng thể nhanh | Nhận AI executive summary chỉ ra điểm nghẽn/rủi ro kèm link evidence | Có gợi ý tổng hợp nhưng vẫn tự kiểm tra trước khi quyết định | High | Confirmed — PRD Mục 7.25 (AI hỗ trợ summary) + invariant human-in-the-loop Mục 12 |
| UN-007 | HR | Khi quản lý/lãnh đạo cần số liệu gửi đi | Export báo cáo trong scope thành file có audit | Gửi số liệu nhanh, không copy tay, biết ai đã xuất gì | High | Confirmed — PRD Mục 7.25 (export hợp lệ) |
| UN-008 | Quản lý | Khi nhìn số liệu | Biết dữ liệu tươi tới đâu (thời điểm cập nhật) | Không quyết định trên số liệu cũ mà không hay | High | Observed: brainstorm scoped-kpi-risk-alerts Mục 4 (độ tươi dữ liệu) |
| UN-009 | Admin | Khi một đơn vị phàn nàn cảnh báo nhiễu | Đặt ngưỡng cảnh báo riêng cho đơn vị/loại KPI | Cảnh báo bám thực tế, giảm alert fatigue | Medium | Assumption — mở rộng từ "ngưỡng cấu hình được" của brainstorm |
| UN-010 | Quản lý | Khi tổng hợp rơi vào nhóm rất nhỏ | Hệ thống ẩn số liệu thay vì hiển thị | Không vô tình suy diễn cá nhân từ aggregate | Critical | Assumption — suy từ rủi ro aggregate lộ scope của PRD Mục 7.25 |

## 5. Prioritized User Journeys

### Journey 1: Quản lý xem dashboard và drill evidence

- **User:** Quản lý
- **Importance:** Critical
- **Trigger:** Đầu tuần/kỳ, quản lý mở mục báo cáo để nắm tình hình đơn vị.
- **Expected outcome:** Thấy KPI kỳ hiện tại đúng scope, biết độ tươi dữ
  liệu, mở được evidence từng entity.
- **Related needs:** UN-001, UN-002, UN-004, UN-008, UN-010

1) Quản lý mở mục "Báo cáo" → hệ thống xác định data-scope → hiển thị
   KPI kỳ hiện tại kèm độ tươi dữ liệu.
2) Đổi kỳ/filter phòng ban trong scope → số liệu tổng hợp lại.
3) Click một KPI → mở danh sách entity nguồn trong scope làm evidence.
4) Nhóm có ít hơn ngưỡng tối thiểu → hệ thống ẩn số liệu, báo "không đủ
   dữ liệu để hiển thị".

**Independent verification:** Đăng nhập bằng tài khoản quản lý một đơn vị —
mọi số liệu và entity drill được đều thuộc đơn vị đó; filter sang đơn vị
ngoài scope không cho kết quả.

### Journey 2: Xử lý cảnh báo quá hạn từ đầu đến đóng

- **User:** Quản lý
- **Importance:** Critical
- **Trigger:** Hệ thống phát hiện entity vượt ngưỡng và bắn cảnh báo.
- **Expected outcome:** Cảnh báo được mở, xem evidence, có action xác
  nhận và đóng kèm lý do — toàn bộ có audit.
- **Related needs:** UN-003, UN-004, UN-005

1) Nhận thông báo/thấy cảnh báo "mới" trên dashboard.
2) Mở cảnh báo → xem evidence (entity nguồn, ngưỡng vượt, thời gian).
3) Chọn action: tạo task xử lý / giao lại owner / tạm hoãn có lý do /
   đóng kèm lý do.
4) Cảnh báo chuyển "đang xử lý" rồi "đã đóng"; nếu tình trạng nguồn tự
   hết trước khi xử lý thì cảnh báo "tự hết", vẫn giữ trong lịch sử.

**Independent verification:** Chọn một cảnh báo đã đóng — truy vết được ai
đã action, action gì, lý do và thời điểm; cảnh báo tự hết có dấu vết phân
biệt với đóng do người xử lý.

### Journey 3: Lãnh đạo dùng AI summary rồi tự kiểm chứng

- **User:** Lãnh đạo / Head of HR
- **Importance:** High
- **Trigger:** Cần bức tranh tổng hợp trước cuộc họp điều hành.
- **Expected outcome:** Summary chỉ ra điểm nghẽn/rủi ro kèm evidence;
  mọi action đề xuất chỉ thực thi sau khi người xem xác nhận.
- **Related needs:** UN-006

1) Lãnh đạo bấm "Tóm tắt AI" trên dashboard toàn tổ chức.
2) Đọc các nhận định kèm link evidence nguồn, nhãn "đề xuất của AI —
   cần kiểm tra evidence".
3) Mở evidence kiểm chứng, chọn từng action đề xuất để xác nhận thực
   thi (hoặc bỏ qua).

**Independent verification:** Mỗi nhận định trong summary mở được evidence
nguồn trong scope; không có action nào được thực thi mà thiếu xác nhận
của người xem trong audit.

### Journey 4: HR export báo cáo gửi lãnh đạo

- **User:** HR
- **Importance:** High
- **Trigger:** Lãnh đạo yêu cầu số liệu tuyển dụng tháng trước.
- **Expected outcome:** File export chỉ chứa dữ liệu trong scope người
  xuất, có audit lượt export, tự xóa sau hạn lưu giữ.
- **Related needs:** UN-007

1) HR chọn scope/kỳ → "Xuất báo cáo" → chọn định dạng.
2) Hệ thống kiểm tra quyền export + scope → sinh file nền.
3) HR tải file trong mục "báo cáo đã xuất"; file tự xóa khi hết hạn.

**Independent verification:** Đối chiếu file export với scope của người
xuất — không chứa bản ghi ngoài scope; audit ghi đủ ai/kỳ/loại/số dòng.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Quản lý chưa được gán đơn vị/phạm vi | Không xem được gì | Dashboard trống + hướng dẫn liên hệ admin, không tải dữ liệu | Journey 1 / UN-001 |
| Quản lý kiêm nhiệm nhiều đơn vị | Không biết đang xem scope nào | Scope là hợp các đơn vị; filter cho tách từng đơn vị | UN-002 (OQ-4) |
| Nguồn nghiệp vụ không trả dữ liệu kịp | Nghi ngờ số liệu | Ô KPI lỗi hiển thị "chưa cập nhật", phần còn lại vẫn hiện; không dùng số cũ giả số mới | UN-008 |
| Người xem dán link evidence ngoài scope | Cố xem dữ liệu không thuộc mình | Hệ thống từ chối theo quyền entity, độc lập với màn báo cáo | UN-004 |
| AI summary lỗi/timeout | Mất phần gợi ý | Dashboard KPI vẫn hiển thị bình thường, bấm lại được | Journey 3 / UN-006 |
| Hai người cùng xử lý một cảnh báo | Action đè nhau | Người sau thấy trạng thái mới nhất và ai đã action; giữ action đầu | Journey 2 / UN-005 |
| Kỳ đầu tiên chưa có dữ liệu nguồn | Tưởng hệ thống lỗi | Empty state "Chưa có dữ liệu trong kỳ này" | Journey 1 |
| Cảnh báo quá nhiều cùng lúc | Choáng, bỏ qua | Nhóm theo loại + đơn vị, ưu tiên mức vượt ngưỡng cao nhất | UN-003 |
| Export vượt giới hạn dòng | Không xuất được | Chặn kèm gợi ý thu hẹp filter/chia nhỏ kỳ | Journey 4 / UN-007 |

## 7. User-side Constraints

- Mọi người xem phải đăng nhập và có data-scope hợp lệ từ
  `org-governance`; không có scope thì không có số liệu — đây là điều
  kiện tiên quyết, không phải tùy chọn (PRD Mục 9).
- Số liệu aggregate không được cho suy diễn cá nhân: nhóm nhỏ hơn ngưỡng
  tối thiểu bị ẩn.
- AI summary chỉ mang tính đề xuất — mọi action do con người xác nhận;
  AI không kết luận vi phạm hay phẩm chất (PRD Mục 12).
- Ngôn ngữ giao diện tiếng Việt; số liệu, định dạng ngày theo chuẩn
  người dùng Việt Nam.
- Màn hình chính là desktop (bảng KPI, drill evidence); không yêu cầu
  mobile cho v1.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Data-scope do org-governance cung cấp nhất quán cho mọi module nguồn | Nếu lệch scope → aggregate lộ dữ liệu, mất trust toàn feature | Assumption — phụ thuộc feature org-governance | Verify khi org-governance hoàn tất siết scope (roadmap Now) |
| Module nguồn (pipeline, kanban, assessment) phát sinh đủ trạng thái/owner/hạn | Nếu thiếu → KPI rỗng hoặc cảnh báo sai | Assumption — kanban/assessment đang ở roadmap Now | Đối chiếu khi các feature Now hoàn tất |
| contextual-notifications làm kênh đẩy cảnh báo | Nếu chưa có → cảnh báo chỉ nằm trên dashboard, giảm khả năng phát hiện | Confirmed — roadmap Now | — |
| Ngưỡng nhóm tối thiểu = 5 là chấp nhận được về privacy | Nếu owner yêu cầu khác → số liệu bị ẩn nhiều hơn/ít hơn | Assumption — đề xuất trong brainstorm | Chốt ở OQ-3 |
| Quyền export là quyền riêng, tách khỏi quyền xem | Nếu gộp → mọi người xem đều export được, tăng rủi ro lộ | Assumption | Chốt trong ma trận quyền khi đặc tả |
| Báo cáo vận hành cần chính sách "không dùng đánh giá/kỷ luật cá nhân" | Nếu thiếu → công cụ bị lạm dụng, complaint nhân viên | Assumption — suy từ rủi ro PRD | Chốt ở OQ-6, cần owner DPO/Head of HR |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Cảnh báo dẫn tới hành động thật thay vì bị bỏ trôi | Chưa có — xác lập sau 1 tháng pilot | ≥60% cảnh báo có action xác nhận của con người (đề xuất — chờ OQ-5) | Tỷ lệ cảnh báo có action confirmed / tổng cảnh báo tạo | 1 tháng sau pilot |
| USC-002 | Lãnh đạo tự lấy số liệu không cần HR tổng hợp tay | HR tổng hợp tay mỗi tuần | ≥80% yêu cầu số liệu định kỳ tự phục vụ qua dashboard/export (đề xuất) | Số yêu cầu tổng hợp tay còn lại mỗi tuần | 1 tháng sau pilot |
| USC-003 | Không có sự cố xem/xuất dữ liệu vượt phạm vi | 0 | 0 sự cố xác nhận | Incident vượt scope liên quan báo cáo (bám M-GR-01) | Liên tục |
| USC-004 | Mọi action cảnh báo và lượt export truy vết được | 0% | 100% có audit | Tỷ lệ action/export có bản ghi audit đủ trường | Liên tục |
| USC-005 | Người xem tin số liệu vì biết độ tươi | Chưa có | 100% màn hình KPI hiển thị mốc "dữ liệu cập nhật đến" | Kiểm tra giao diện từng loại báo cáo | Mỗi release |

## 10. Open Questions

- [ ] OQ-1: Bộ KPI mặc định của v1 gồm những chỉ số nào (đề xuất:
  application kẹt, task quá hạn, bài test sắp hết hạn, tỷ lệ hoàn thành
  đúng hạn)? — cần Head of HR/sponsor duyệt.
- [ ] OQ-2: Ngưỡng cảnh báo mặc định từng loại (application kẹt bao
  ngày, bài test nhắc trước hạn bao lâu)?
- [ ] OQ-3: Ngưỡng nhóm tối thiểu để hiển thị số liệu tổng hợp — đề xuất
  5, cần DPO/privacy owner duyệt?
- [ ] OQ-4: Quản lý kiêm nhiệm nhiều đơn vị — scope gộp hay bắt chọn
  từng đơn vị khi xem?
- [ ] OQ-5: Target định lượng cho tỷ lệ cảnh báo dẫn tới action xác
  nhận (liên quan OQ-2 PRD — target chưa được sponsor duyệt)?
- [ ] OQ-6: Có cần chính sách công bố "báo cáo vận hành không dùng để
  đánh giá/kỷ luật cá nhân" kèm dashboard — owner DPO/Head of HR?
- [ ] OQ-7: Retention file export và audit lượt export — đề xuất file 30
  ngày, audit theo chính sách chung (liên quan OQ-6 PRD)?
