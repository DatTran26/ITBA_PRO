---
type: srs
feature: workforce-monitoring
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/workforce-monitoring/brainstorms/transparent-operations-monitoring.md
  - docs/features/workforce-monitoring/workforce-monitoring-urd.md
---

# workforce-monitoring — Software Requirements Specification

## 1. Scope

SRS này cover lát cắt theo dõi vận hành nhân viên **minh bạch** của HRMS:
quản lý chính sách theo dõi (soạn → duyệt → công bố → version), gate "không
policy công bố thì không thu thập", thu nhận sự kiện quy trình đã công bố
từ dữ liệu hệ thống có sẵn, tổng hợp progress/overdue/workload, dashboard
theo phạm vi quyền, cảnh báo để manager xác nhận có lý do, self-view cho
nhân viên khi policy cho phép, access audit và retention tự động. Đây là
feature **Could** — KHÔNG nằm trong cam kết v1; là slice mở rộng chỉ được
bật sau khi policy minh bạch được duyệt (PRD Mục 12, R-10). KHÔNG cover:
keylogging, screen capture, ghi âm, theo dõi thiết bị/vị trí, thu thập ngoài
chính sách đã công bố, suy luận phẩm chất/năng suất cá nhân, kỷ luật tự động
(PRD Mục 7.29 "Chưa làm", non-goals Mục 5); giám sát camera
(`cv-event-monitoring`); báo cáo KPI liên domain (`management-reporting`);
quản lý task (`kanban-workspaces`); định nghĩa role/scope (`org-governance`).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Quản lý | người | Xem dashboard phạm vi mình, nhận và xử lý cảnh báo có lý do | Có |
| Nhân viên | người | Đọc policy, xem dữ liệu của mình khi policy cho phép, gửi phản hồi | Có |
| Admin | người | Soạn policy, cấu hình ngưỡng, tạm dừng phạm vi, xem access audit | Có |
| Người duyệt policy (Head of HR / DPO-legal) | người | Phê duyệt hoặc yêu cầu chỉnh policy trước khi công bố | Có |
| `kanban-workspaces` | hệ thống (feature khác) | Nguồn sự kiện task/hạn/trạng thái/bàn giao; đích tạo task xử lý cảnh báo | Không (nguồn sự kiện + consumer action) |
| `management-reporting` | hệ thống (feature khác) | Nguồn số liệu KPI/overdue đã tổng hợp | Không (nguồn dữ liệu) |
| `org-governance` | hệ thống (feature khác) | Cung cấp role/scope/audit | Không (nền quyền) |
| `contextual-notifications` | hệ thống (feature khác) | Gửi thông báo cảnh báo/phản hồi | Không (kênh thông báo) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-workforce-monitoring-001 | Soạn chính sách theo dõi | Khi admin tạo policy, hệ thống phải ghi nhận: tên, loại dữ liệu theo dõi (chỉ trong danh mục công bố: tiến độ task, quá hạn, workload, sự kiện quy trình), mục đích, phạm vi áp dụng, vai trò được xem, retention và quyền self-view; trạng thái ban đầu "Bản nháp" | P0 | demo | PRD Mục 7.29 (policy rõ); brainstorm Mục 5.1; URD UN-003 |
| FR-workforce-monitoring-002 | Duyệt và công bố policy | Khi admin gửi duyệt, hệ thống phải chuyển policy sang "Chờ duyệt"; khi người có thẩm quyền phê duyệt, hệ thống phải chuyển "Đã công bố", hiển thị công khai cho phạm vi áp dụng và ghi nhận người duyệt + ngày công bố + version | P0 | test | PRD Mục 12 (chỉ làm khi policy được duyệt); URD UN-009 |
| FR-workforce-monitoring-003 | Gate không policy thì không thu thập | Khi không có policy "Đã công bố" hiệu lực, hệ thống phải chặn mọi thu nhận sự kiện, tổng hợp và hiển thị dữ liệu theo dõi trên mọi surface, kèm thông báo chưa có chính sách | P0 | test | PRD Mục 12, R-10; brainstorm Mục 6.1 (D1) |
| FR-workforce-monitoring-004 | Chỉ thu nhận sự kiện đã công bố | Khi sự kiện quy trình phát sinh, hệ thống chỉ ghi nhận nếu loại sự kiện nằm trong danh mục của policy hiệu lực; sự kiện ngoài danh mục phải bị loại ngay đầu vào, không lưu | P0 | test | PRD Mục 7.29 (sự kiện đã được công bố); brainstorm Mục 6.1 (D3) |
| FR-workforce-monitoring-005 | Tổng hợp theo người/nhóm/phạm vi | Hệ thống phải tổng hợp tiến độ, số việc quá hạn, phân bố workload và sự kiện quy trình gần nhất theo người/nhóm/phạm vi, chỉ tính sự kiện phát sinh sau ngày công bố policy | P0 | test | PRD Mục 7.29 (progress, overdue, workload); URD OQ-5 |
| FR-workforce-monitoring-006 | Dashboard theo phạm vi quyền | Khi manager mở dashboard, hệ thống chỉ hiển thị số liệu thuộc phạm vi quản lý được cấp qua `org-governance`; truy cập dữ liệu cá nhân ngoài phạm vi phải bị chặn và không tiết lộ sự tồn tại | P0 | test | PRD Mục 9 (data-scope), JTBD-MGR-01; URD UN-001/UN-010 |
| FR-workforce-monitoring-007 | Tạo cảnh báo vận hành | Khi số liệu vượt ngưỡng của policy (quá hạn, workload, đứng), hệ thống phải tạo cảnh báo "Mới" gửi manager phụ trách phạm vi; cảnh báo phải kèm dữ liệu nền (đối tượng, ngưỡng, thời lượng) và gộp trùng theo đối tượng + loại khi đã có cảnh báo mở | P0 | test | PRD Mục 7.29 (cảnh báo); brainstorm Mục 5.3 |
| FR-workforce-monitoring-008 | Manager xử lý cảnh báo có lý do | Khi manager chọn quyết định trên cảnh báo ("Xác nhận — cần xử lý", "Đã biết — có lý do", "Cảnh báo sai"), hệ thống phải yêu cầu lý do, ghi nhận người xử lý + thời điểm + quyết định, và chuyển cảnh báo "Đã xử lý" | P0 | test | PRD Mục 12 (human-in-the-loop); URD UN-002 |
| FR-workforce-monitoring-009 | Tạo task xử lý từ cảnh báo | Khi manager chọn "Xác nhận — cần xử lý", hệ thống phải cho tạo task trên `kanban-workspaces` kèm liên kết ngược về cảnh báo | P1 | demo | PRD Mục 7.29 (phụ thuộc 16); brainstorm Mục 5.3 |
| FR-workforce-monitoring-010 | Nhắc và escalate cảnh báo treo | Nếu cảnh báo quá SLA xử lý đã cấu hình, hệ thống phải nhắc manager; sau số lần nhắc đã cấu hình phải escalate theo quy tắc của policy | P1 | test | brainstorm Mục 5.3, 7.2; URD Mục 6 |
| FR-workforce-monitoring-011 | Self-view nhân viên | Khi policy cho phép self-view, hệ thống phải cho nhân viên xem dữ liệu vận hành của chính mình (task, hạn, quá hạn, cảnh báo liên quan) cùng policy đang hiệu lực; khi policy chỉ cho số liệu nhóm, chỉ hiển thị policy + kênh phản hồi | P0 | test | PRD Mục 7.29 (nhân viên xem dữ liệu của mình khi policy cho phép); URD UN-004/UN-005 |
| FR-workforce-monitoring-012 | Phản hồi/đính chính của nhân viên | Khi nhân viên gửi phản hồi về dữ liệu của mình, hệ thống phải định tuyến tới owner khai báo trong policy, giữ trạng thái xử lý và kết quả trả lời | P1 | test | URD UN-006; PRODUCT.md (ràng buộc quyền riêng tư — cơ chế phản hồi) |
| FR-workforce-monitoring-013 | Access audit | Hệ thống phải ghi nhận mọi lượt xem dữ liệu cá nhân, lượt export và quyết định xử lý cảnh báo (ai, khi nào, surface nào, đối tượng nào) vào audit của `org-governance` | P0 | test | PRD Mục 9 (audit boundary), R-10; URD UN-007 |
| FR-workforce-monitoring-014 | Version policy | Khi policy hiệu lực được sửa, hệ thống phải tạo version mới ở "Bản nháp" đi qua duyệt và công bố lại; version cũ chuyển "Hết hiệu lực"; không được có hai version cùng "Đã công bố" cho một phạm vi | P0 | test | brainstorm Mục 5.1, 6.3; URD Journey 4 |
| FR-workforce-monitoring-015 | Retention tự động | Khi dữ liệu chi tiết đạt hạn retention của policy, hệ thống phải tự động xóa hoặc ẩn danh hóa; số liệu tổng hợp ẩn danh chỉ giữ theo hạn riêng đã công bố | P0 | test | PRD Mục 9 (retention/delete), Mục 7.29; brainstorm Mục 6.1 (D8) |
| FR-workforce-monitoring-016 | Tạm dừng/thu hồi theo dõi | Khi admin hoặc người có thẩm quyền tạm dừng một phạm vi/loại theo dõi hoặc thu hồi policy, hệ thống phải dừng thu nhận và hiển thị ngay; dữ liệu đã lưu vẫn theo retention đã công bố | P0 | test | brainstorm Mục 5.5; R-10 |
| FR-workforce-monitoring-017 | Thống kê chất lượng cảnh báo | Hệ thống phải cho admin xem tỷ lệ cảnh báo được xử lý/có action và tỷ lệ "cảnh báo sai" theo loại/ngưỡng, để điều chỉnh ngưỡng | P1 | demo | PRD Mục 7.29 (đo thành công); brainstorm Mục 4 (P1) |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-workforce-monitoring-001 | privacy | Không có policy "Đã công bố" thì 0 byte dữ liệu theo dõi được thu thập hoặc hiển thị — trên mọi surface và vai trò | P0 | Kiểm tra trước công bố: dashboard chặn, store rỗng; gate không bypass được qua vai trò nào |
| NFR-workforce-monitoring-002 | privacy | Dữ liệu theo dõi chỉ gồm sự kiện quy trình trong danh mục policy; tuyệt đối không có keylogging, screen capture, ghi âm, theo dõi thiết bị/vị trí | P0 | 0 sự kiện ngoài danh mục trong store khi kiểm tra mẫu; source review không có bộ thu thập ngoài danh mục |
| NFR-workforce-monitoring-003 | security | Truy cập dữ liệu theo phạm vi deny-by-default; mọi lượt xem dữ liệu cá nhân và export có audit | P0 | 0 incident vượt phạm vi được xác nhận (bám M-GR-01); 100% lượt xem có bản ghi audit |
| NFR-workforce-monitoring-004 | data-retention | Dữ liệu chi tiết tự động xóa/ẩn danh đúng hạn đã công bố trong policy | P0 | 0 bản ghi chi tiết tồn tại quá retention khi kiểm định định kỳ |
| NFR-workforce-monitoring-005 | usability | Policy và wording cảnh báo dùng ngôn ngữ nhân viên đọc hiểu; cảnh báo luôn ghi rõ là "tín hiệu cần kiểm tra", không phải kết luận | P0 | Review wording trên 3 surface (dashboard, cảnh báo, self-view) không có câu nào ám chỉ kết luận vi phạm/đánh giá |
| NFR-workforce-monitoring-006 | performance | Dashboard tổng hợp tải được ở quy mô pilot (50–300 người nội bộ) | P1 | 95% lượt mở dashboard trả kết quả trong ≤3 giây ở dữ liệu 1 tháng pilot |
| NFR-workforce-monitoring-007 | reliability | Job tổng hợp idempotent: chạy lại không tạo số liệu trùng và không mất sự kiện | P1 | Chạy lại job trên cùng cửa sổ sự kiện cho kết quả giống hệt |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-workforce-monitoring-001 | Không có policy "Đã công bố" → không thu thập, không tổng hợp, không hiển thị — không có ngoại lệ vai trò | Khi bất kỳ truy cập/thu nhận nào vào dữ liệu theo dõi | FR-workforce-monitoring-003 | PRD Mục 12, R-10 |
| BR-workforce-monitoring-002 | Chỉ loại sự kiện trong danh mục policy mới được ghi nhận; ngoài danh mục loại ngay đầu vào | Khi sự kiện quy trình đến | FR-workforce-monitoring-004 | PRD Mục 7.29 |
| BR-workforce-monitoring-003 | Chỉ tổng hợp sự kiện phát sinh sau ngày công bố policy — không tổng hợp ngược dữ liệu cũ | Khi chạy tổng hợp | FR-workforce-monitoring-005 | URD OQ-5 (minh bạch, tránh theo dõi ngược) |
| BR-workforce-monitoring-004 | Cảnh báo là tín hiệu để kiểm tra — bắt buộc con người xác nhận kèm lý do; cấm tự kết luận vi phạm/kỷ luật/đánh giá hiệu suất | Khi tạo/xử lý cảnh báo | FR-workforce-monitoring-007, FR-workforce-monitoring-008 | PRD Mục 12 (invariant), Mục 7.29 "Chưa làm" |
| BR-workforce-monitoring-005 | Xử lý cảnh báo bắt buộc lý do; "Xác nhận" mới được tạo task xử lý | Khi manager chọn quyết định | FR-workforce-monitoring-008, FR-workforce-monitoring-009 | brainstorm Mục 5.3 |
| BR-workforce-monitoring-006 | Gộp cảnh báo trùng: chỉ 1 cảnh báo mở cho cùng đối tượng + loại | Khi tạo cảnh báo | FR-workforce-monitoring-007 | brainstorm Mục 6.5 |
| BR-workforce-monitoring-007 | Dữ liệu cá nhân chỉ hiển thị trong phạm vi được cấp; lượt xem cá nhân và export luôn ghi audit | Khi truy cập dữ liệu cá nhân hoặc export | FR-workforce-monitoring-006, FR-workforce-monitoring-013 | PRD Mục 9 |
| BR-workforce-monitoring-008 | Thay đổi policy bắt buộc version mới qua duyệt + công bố; không hai version cùng hiệu lực cho một phạm vi | Khi sửa policy hiệu lực | FR-workforce-monitoring-014 | brainstorm Mục 5.1 (D7) |
| BR-workforce-monitoring-009 | Self-view theo đúng khai báo của policy; tắt self-view phải khai báo tường minh | Khi nhân viên mở self-view | FR-workforce-monitoring-011 | PRD Mục 7.29; URD OQ-3 |
| BR-workforce-monitoring-010 | Dữ liệu hết retention phải xóa/ẩn danh; không giữ lâu hơn policy đã công bố | Khi chạy job retention | FR-workforce-monitoring-015 | PRD Mục 9, R-10 |
| BR-workforce-monitoring-011 | Thu hồi policy → dừng thu nhận ngay; dữ liệu tồn theo retention đã công bố | Khi policy bị thu hồi/hết hiệu lực | FR-workforce-monitoring-016 | brainstorm Mục 5.5 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-workforce-monitoring-001 | Chưa có policy công bố | Mở dashboard/dữ liệu theo dõi khi chưa có policy hiệu lực | major | FR-workforce-monitoring-003 | Hiện "Chưa có chính sách theo dõi vận hành nào được công bố — dữ liệu chưa được thu thập" | Admin soạn/duyệt/công bố policy |
| E-workforce-monitoring-002 | Gửi duyệt policy thiếu trường | "Gửi duyệt" trên policy thiếu trường bắt buộc | minor | FR-workforce-monitoring-001 | Hiện "Vui lòng điền đủ thông tin bắt buộc trước khi gửi duyệt: {danh sách field}" | Admin bổ sung rồi gửi lại |
| E-workforce-monitoring-003 | Truy cập ngoài phạm vi | Xem dữ liệu cá nhân/phạm vi không được cấp | major | FR-workforce-monitoring-006 | Hiện "Dữ liệu này nằm ngoài phạm vi quản lý của bạn"; ghi audit | Xin cấp phạm vi qua org-governance |
| E-workforce-monitoring-004 | Self-view bị tắt | Nhân viên mở dữ liệu của mình khi policy chỉ cho số liệu nhóm | minor | FR-workforce-monitoring-011 | Hiện "Chính sách hiện tại chỉ cho phép xem số liệu nhóm — bạn có thể gửi phản hồi nếu cần" | Gửi phản hồi tới owner |
| E-workforce-monitoring-005 | Xử lý cảnh báo thiếu lý do | Manager bấm xác nhận/đã biết mà chưa nhập lý do | minor | FR-workforce-monitoring-008 | Hiện "Vui lòng nhập lý do trước khi xác nhận xử lý cảnh báo" | Nhập lý do rồi xác nhận |
| E-workforce-monitoring-006 | Duyệt policy trên bản cũ | Người duyệt bấm duyệt khi policy vừa bị sửa | major | FR-workforce-monitoring-002 | Cảnh báo policy đã đổi trước khi ghi nhận quyết định | Xem bản mới rồi quyết định |
| E-workforce-monitoring-007 | Ngưỡng cấu hình không hợp lệ | Nhập ngưỡng không phải số nguyên dương | minor | FR-workforce-monitoring-007 | Hiện "Ngưỡng phải là số nguyên dương — kiểm tra lại giá trị đã nhập" | Nhập lại giá trị hợp lệ |
| E-workforce-monitoring-008 | Cảnh báo đã được xử lý | Hai manager cùng xử lý một cảnh báo | minor | FR-workforce-monitoring-008 | Hiện trạng thái mới + người đã xử lý | Không ghi đè; xem lịch sử xử lý |
| E-workforce-monitoring-009 | Job tổng hợp gián đoạn | Tổng hợp bị ngắt giữa chừng | major | FR-workforce-monitoring-005 | Số liệu hiển thị kèm mốc cập nhật cuối | Chạy lại idempotent; sự kiện thô không mất |
| E-workforce-monitoring-010 | Export ngoài quyền policy | Export dữ liệu cá nhân khi vai trò không được cấp | major | FR-workforce-monitoring-013 | Hiện "Chính sách hiện tại không cho phép vai trò của bạn xuất dữ liệu này" | Xin cấp quyền export trong policy |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-workforce-monitoring-01 | Cảnh báo vận hành có action hữu ích | Tỷ lệ cảnh báo được xử lý trong SLA có quyết định + lý do | ≥70% sau 1 tháng pilot (đề xuất — target chờ OQ-2 PRD) |
| SC-workforce-monitoring-02 | Không phát sinh privacy complaint | Số complaint được xác nhận liên quan theo dõi | 0 (guardrail — bám R-10, PRD Mục 7.29) |
| SC-workforce-monitoring-03 | Thu thập đúng phạm vi đã công bố | Tỷ lệ sự kiện thuộc danh mục policy hiệu lực | 100% |
| SC-workforce-monitoring-04 | Minh bạch với nhân viên | Tỷ lệ nhân viên trong phạm vi mở trang policy/self-view | ≥60% trong 1 tháng đầu (đề xuất) |
| SC-workforce-monitoring-05 | Không truy cập vượt phạm vi | Số incident vượt data-scope được xác nhận | 0 (bám M-GR-01) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Chính sách theo dõi (MONITORING_POLICY)__ — version, loại dữ liệu, mục
  đích, phạm vi, vai trò xem, retention, quyền self-view, trạng thái vòng
  đời (bản nháp → chờ duyệt → đã công bố → hết hiệu lực).
- __Phạm vi áp dụng policy (POLICY_SCOPE)__ — đơn vị/nhóm mà version policy
  áp dụng.
- __Quyết định duyệt policy (POLICY_APPROVAL)__ — người duyệt, quyết định,
  ghi chú, thời điểm.
- __Sự kiện quy trình (WORK_EVENT)__ — loại sự kiện đã công bố, đối tượng,
  thời điểm, phạm vi, policy version nguồn; có retention.
- __Số liệu tổng hợp (WORK_METRIC_SNAPSHOT)__ — tiến độ/quá hạn/workload
  theo người/nhóm/phạm vi/kỳ; ẩn danh hóa theo hạn.
- __Cảnh báo (MONITORING_ALERT)__ — loại, đối tượng, ngưỡng vượt, trạng
  thái xử lý, quyết định + lý do + người xử lý.
- __Phản hồi nhân viên (EMPLOYEE_FEEDBACK)__ — nội dung, đối tượng dữ liệu,
  owner, trạng thái, kết quả.
- __Truy cập dữ liệu (DATA_ACCESS_LOG)__ — ai xem dữ liệu cá nhân/export
  của ai, khi nào, surface nào (ghi vào audit org-governance).
- __Tham chiếu ngoài__ — USER (`org-governance`), TASK (`kanban-workspaces`).

Chi tiết quan hệ + thuộc tính ở `srs/workforce-monitoring-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Soạn policy → gửi duyệt → phê duyệt → "Đã công bố" → bắt đầu
  thu thập.
- __Flow 2:__ Sự kiện quy trình hợp lệ → ghi nhận → tổng hợp → dashboard
  theo phạm vi.
- __Flow 3:__ Vượt ngưỡng → cảnh báo → manager xác nhận có lý do → task xử
  lý khi cần.
- __Flow 4:__ Nhân viên đọc policy → self-view → phản hồi/đính chính →
  owner xử lý.
- __Flow 5:__ Sửa policy → version mới qua duyệt → công bố → version cũ hết
  hiệu lực; retention theo version đã công bố.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __policy-editor__ — soạn/sửa policy theo section (dữ liệu, mục đích, phạm
  vi, vai trò xem, retention, self-view).
- __policy-approval-queue__ — hàng chờ policy "Chờ duyệt" của người duyệt.
- __monitoring-dashboard__ — dashboard tiến độ/quá hạn/workload theo phạm
  vi + banner policy version.
- __alert-list / alert-detail__ — danh sách và chi tiết cảnh báo kèm dữ
  liệu nền + quyết định có lý do.
- __my-activity-view__ — self-view nhân viên: policy hiệu lực + dữ liệu của
  mình + form phản hồi.
- __access-audit-view__ — truy vết lượt xem dữ liệu cá nhân/export.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Feature Could — chỉ làm khi policy minh bạch được duyệt; cấm release nếu policy chưa duyệt | PRD Mục 12, R-10 — Product + DPO/legal nominee |
| Cấm keylogging, screen capture, suy luận phẩm chất, kỷ luật tự động, giám sát bí mật | PRD Mục 7.29 "Chưa làm", non-goals Mục 5 — Product owner |
| Mọi truy cập theo organization/role/data-scope + audit boundary | PRD Mục 9 — Security owner |
| Cảnh báo/quyết định ảnh hưởng con người phải qua người xác nhận | PRD Mục 12 (invariant human-in-the-loop) — Product owner |
| Trước dữ liệu thật: Product/DPO duyệt purpose, lawful basis, access, retention/delete, withdrawal, legal hold, audit; OQ-3/OQ-6 mở thì chỉ dữ liệu synthetic | PRD Mục 9 — Product + DPO |
| Retention/access/withdrawal khai báo trong policy và thực thi tự động | PRD Mục 9, R-10 — DPO/legal |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Role/scope/audit cho phạm vi quản lý và vai trò xem | `org-governance` | FR-006, FR-013 — không kiểm soát được phạm vi |
| Nguồn sự kiện task/hạn/trạng thái/bàn giao; đích tạo task xử lý | `kanban-workspaces` | FR-004, FR-005, FR-009 — không có sự kiện nguồn |
| Số liệu KPI/overdue đã tổng hợp | `management-reporting` | FR-005 — tổng hợp chậm/thiếu nguồn |
| Kênh gửi thông báo cảnh báo/phản hồi | `contextual-notifications` | FR-007, FR-010 — cảnh báo chỉ hiện in-app |
| Người duyệt policy được bổ nhiệm (Head of HR + DPO/legal) | Product owner / Head of HR | FR-002 — không có ai duyệt thì không công bố được |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Người duyệt policy = Head of HR + DPO/legal | FR-002 nghẽn hoặc duyệt thiếu lớp privacy |
| Nguồn sự kiện v1 chỉ từ kanban + reporting đã có | FR-004/005 phải mở rộng danh mục thu thập |
| Self-view mặc định bật | FR-011 giảm phạm vi, rủi ro minh bạch tăng |
| Ngưỡng/retention Mục 7.2 brainstorm là chuẩn đề xuất | FR-007/015 đổi ngưỡng mặc định |
| Access audit tái dùng audit org-governance | FR-013 phải tự xây log riêng |

## 12. Open Questions

- [x] OQ-1: Ai duyệt policy? — Resolved (đề xuất): Head of HR + DPO/legal —
  chờ xác nhận (R-10, liên quan OQ-12 PRD).
- [x] OQ-2: Retention chi tiết/tổng hợp? — Resolved (đề xuất): 90 ngày / 13
  tháng ẩn danh — chờ DPO/legal (OQ-6 PRD).
- [x] OQ-3: Self-view mặc định? — Resolved (đề xuất): xem đầy đủ dữ liệu
  của mình khi policy cho phép — chờ DPO/legal.
- [x] OQ-4: Ngưỡng + SLA cảnh báo? — Resolved (đề xuất): quá hạn 3 ngày,
  workload 15 task, đứng 7 ngày, SLA 3 ngày — chờ Product owner/Head of HR.
- [x] OQ-5: Có tổng hợp ngược dữ liệu trước policy? — Resolved: không.
- [~] OQ-6: Export dữ liệu theo dõi? — Out of scope v1 (P1 theo quyền policy).

## 13. develop-hieu implemented slice: face attendance

This branch adds a concrete biometric attendance flow inside the existing
workforce monitoring area.

- `/dashboard/attendance` captures a webcam image for check-in/check-out,
  supports retake, and keeps file upload as a fallback.
- The browser sends the capture to a Next.js BFF route. The BFF verifies the
  face by calling the Python Vision AI service and comparing against stored
  ArcFace embeddings.
- Attendance uses the local face-store/`user_face_embeddings` data as the
  biometric source of truth. The six-angle registration flow must exist before
  reliable attendance can run.
- Check-in creates or opens an `attendance_sessions` record. Check-out closes
  the active session and feeds the daily summary flow.
- `attendance_shifts` define the expected work window. `attendance_daily_summary`
  stores day-level totals and status.
- Local development can use the face-store fallback when Supabase service-role
  credentials are absent; production keeps Supabase/Postgres metadata as the
  durable system of record.

Boundaries for this slice:

- This is biometric check-in/check-out, not a full HR policy tracking engine.
- Production-grade liveness and payroll approval workflows remain future work.
