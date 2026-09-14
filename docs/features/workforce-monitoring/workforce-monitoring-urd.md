---
type: urd
feature: workforce-monitoring
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/workforce-monitoring/brainstorms/transparent-operations-monitoring.md]
---

# workforce-monitoring — User Requirements Document

## 1. Purpose

Cho quản lý một góc nhìn vận hành sớm và minh bạch — tiến độ, quá hạn,
workload và sự kiện quy trình đã được công bố trong chính sách — để phát
hiện gián đoạn trước khi thành sự cố, đồng thời cho nhân viên biết và xem
được chính dữ liệu của mình khi policy cho phép. Feature chỉ vận hành khi
đã có chính sách được duyệt và công bố — đây là điều kiện tiên quyết theo
PRD Mục 12 và rủi ro R-10.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Quản lý | Phát hiện task trễ/việc dồn qua hỏi trực tiếp, họp hoặc tổng hợp tay | Không có tín hiệu sớm trong đúng phạm vi quyền | Phát hiện gián đoạn khi đã lỡ hạn, xử lý bị động | Confirmed — PRD Mục 7.29, JTBD-MGR-01 |
| Nhân viên | Không biết dữ liệu nào về mình đang được theo dõi và dùng để làm gì | Theo dõi vận hành dễ bị cảm nhận là giám sát bí mật | Mất niềm tin, complaint privacy, kháng cự áp dụng | Confirmed — PRD Mục 7.29 (nhân viên xem dữ liệu của mình), R-10 |
| Admin | Chưa có nơi công bố chính sách theo dõi và kiểm soát phạm vi xem | Không có gate chính thức trước khi bật theo dõi | Nguy cơ bật theo dõi ngầm, vi phạm cam kết privacy | Confirmed — PRD Mục 9 (privacy gate), Mục 12 |
| Head of HR | Cần đảm bảo theo dõi vận hành không trở thành công cụ kỷ luật ngầm | Không có điểm phê duyệt chính sách | Rủi ro pháp lý và văn hóa tổ chức | Assumption — suy từ owner R-10 (Product + DPO/legal nominee) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Quản lý | Điều hành nhóm/phạm vi được phân quyền, cần phát hiện gián đoạn sớm | Dashboard tiến độ/quá hạn/workload trong phạm vi + cảnh báo để review và tạo action | Phát hiện muộn, dữ liệu rải rác, không biết cảnh báo nào đáng chú ý |
| secondary | Nhân viên | Người bị ảnh hưởng bởi theo dõi | Đọc policy công bố, xem dữ liệu của mình khi policy cho phép, gửi phản hồi/đính chính | Không biết bị theo dõi gì, không có kênh phản hồi |
| secondary | Admin | Cấu hình và vận hành chính sách | Soạn/duyệt/công bố policy có version, cấu hình ngưỡng, xem access audit | Không có nơi công bố chính sách chính thức |
| secondary | Head of HR / DPO-legal (người duyệt policy) | Phê duyệt chính sách trước khi bật | Đảm bảo purpose/phạm vi/retention hợp lệ trước khi thu thập | Chưa rõ ai chịu trách nhiệm duyệt (OQ-1, liên quan OQ-12 PRD) |
| out | Ứng viên, người ngoài tổ chức | Không thuộc phạm vi theo dõi | — | Không có nhu cầu trực tiếp với feature này |

## 3. Scope Boundaries

### In Scope

- Quản lý chính sách theo dõi (monitoring policy): soạn, gửi duyệt, phê
  duyệt, công bố, version, thu hồi — kèm khai báo loại dữ liệu, mục đích,
  phạm vi, vai trò được xem, retention và quyền self-view.
- Gate kỹ thuật: chỉ thu nhận/hiển thị dữ liệu khi có policy "Đã công bố".
- Thu nhận sự kiện quy trình đã công bố từ dữ liệu hệ thống có sẵn (task,
  hạn, trạng thái, bàn giao) — chỉ loại nằm trong policy.
- Tổng hợp và dashboard theo người/nhóm/phạm vi, đúng data-scope.
- Cảnh báo vận hành (quá hạn, workload, đứng) → manager xác nhận, tạo
  action kèm lý do.
- Self-view cho nhân viên: đọc policy + xem dữ liệu của mình khi policy
  cho phép + gửi phản hồi/đính chính.
- Access audit cho mọi lượt xem dữ liệu cá nhân và export.
- Retention tự động: xóa/ẩn danh dữ liệu chi tiết sau hạn đã công bố.

### Out of Scope

- Keylogging, screen capture, ghi âm, theo dõi thiết bị/vị trí cá nhân,
  hoặc bất kỳ thu thập nào ngoài chính sách đã công bố (PRD "Chưa làm",
  non-goal Mục 5).
- Suy luận phẩm chất, thái độ, năng suất cá nhân hoặc đánh giá hiệu suất
  từ dữ liệu theo dõi (PRD "Chưa làm").
- Kỷ luật tự động hoặc quyết định nhân sự tự động (PRD "Chưa làm", Mục
  12 invariant human-in-the-loop).
- Giám sát camera/CV — thuộc `cv-event-monitoring` (feature riêng).
- Báo cáo KPI liên domain tổng quát — thuộc `management-reporting`;
  feature này chỉ đọc số liệu đã có.
- Quản lý task/quy trình gốc — thuộc `kanban-workspaces`; feature này
  chỉ tiêu thụ sự kiện.
- Định nghĩa role/scope — thuộc `org-governance`.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Quản lý | Khi cần biết tình trạng vận hành nhóm mình | Một dashboard cho thấy tiến độ, quá hạn, workload và sự kiện quy trình gần nhất trong đúng phạm vi quyền | Nhìn thấy gián đoạn sớm mà không phải hỏi từng người | Critical | Confirmed — PRD Mục 7.29 (progress, overdue, workload) |
| UN-002 | Quản lý | Khi có dấu hiệu bất thường (quá hạn, dồn việc, đứng) | Nhận cảnh báo kèm dữ liệu nền để xác nhận và tạo action có lý do | Mọi cảnh báo được con người xem và quyết định, không tự kết luận | Critical | Confirmed — PRD Mục 7.29 (cảnh báo → review), Mục 12 |
| UN-003 | Admin | Khi tổ chức muốn bật theo dõi vận hành | Soạn và đưa chính sách qua phê duyệt rồi công bố trước khi thu thập | Không có dữ liệu nào được thu thập trước khi policy "Đã công bố" | Critical | Confirmed — PRD Mục 12 (chỉ làm khi policy được duyệt), R-10 |
| UN-004 | Nhân viên | Khi muốn biết mình đang bị theo dõi gì | Đọc được policy đang hiệu lực: loại dữ liệu, mục đích, ai xem, lưu bao lâu | Hiểu rõ dữ liệu của mình được dùng thế nào | Critical | Confirmed — PRD Mục 7.29 (policy rõ), R-10 (notice) |
| UN-005 | Nhân viên | Khi muốn kiểm tra dữ liệu của chính mình | Xem được tiến độ, hạn, quá hạn và cảnh báo liên quan đến mình khi policy cho phép | Tự kiểm chứng dữ liệu, phát hiện sai để phản hồi | High | Confirmed — PRD Mục 7.29 (nhân viên xem dữ liệu của mình khi policy cho phép) |
| UN-006 | Nhân viên | Khi thấy dữ liệu của mình sai hoặc bất hợp lý | Gửi được phản hồi/đính chính tới owner có trạng thái xử lý | Phản hồi có người tiếp nhận và kết quả rõ ràng | High | Assumption — suy từ ràng buộc "cơ chế phản hồi/đính chính" của PRODUCT.md (ràng buộc quyền riêng tư) |
| UN-007 | Admin | Khi cần chứng minh ai đã xem dữ liệu ai | Truy vết được mọi lượt xem dữ liệu cá nhân và lượt export | Điều tra complaint được, phát hiện truy cập vượt phạm vi | Critical | Confirmed — PRD Mục 9 (audit boundary), R-10 |
| UN-008 | Quản lý | Khi cảnh báo lặp lại nhưng không còn ý nghĩa | Đánh dấu cảnh báo sai để admin chỉnh ngưỡng | Giảm cảnh báo nhiễu, giữ tín hiệu đáng tin | Medium | Assumption — suy từ "cảnh báo có action hữu ích" của PRD Mục 7.29 |
| UN-009 | Người duyệt policy | Khi có chính sách mới/sửa chờ duyệt | Xem được bản đầy đủ, quyết định duyệt hoặc yêu cầu chỉnh có ghi chú | Không policy nào hiệu lực mà chưa qua duyệt | Critical | Confirmed — PRD Mục 12 (policy được duyệt) + invariant human review |
| UN-010 | Quản lý | Khi phạm vi quản lý thay đổi | Dashboard tự động chỉ hiển thị phạm vi hiện tại | Không thấy dữ liệu của phạm vi đã mất quyền | High | Confirmed — PRD Mục 9 (data-scope), JTBD-MGR-01 |

## 5. Prioritized User Journeys

### Journey 1: Công bố chính sách và bật theo dõi

- **User:** Admin (với người duyệt là Head of HR/DPO)
- **Importance:** Critical
- **Trigger:** Tổ chức quyết định bật theo dõi vận hành minh bạch.
- **Expected outcome:** Policy ở "Đã công bố", công khai cho phạm vi; hệ
  thống bắt đầu thu nhận sự kiện đúng danh mục đã công bố.
- **Related needs:** UN-003, UN-009

1) Admin soạn policy: chọn loại dữ liệu, mục đích, phạm vi, vai trò xem,
   retention, quyền self-view → lưu "Bản nháp" → gửi duyệt.
2) Người duyệt xem bản đầy đủ → phê duyệt (hoặc yêu cầu chỉnh, lặp lại).
3) Policy "Đã công bố": hiển thị công khai, hiệu lực từ ngày công bố.
4) Thu nhận sự kiện và dashboard bắt đầu hoạt động — trước đó mọi truy cập
   bị chặn kèm thông báo chưa có chính sách.

**Independent verification:** Trước khi công bố, mở dashboard bằng tài
khoản quản lý — bị chặn với thông báo đúng. Sau khi công bố, kiểm tra bản
ghi policy có đủ người duyệt + ngày công bố + version, và sự kiện mới ghi
nhận đều thuộc danh mục đã công bố.

### Journey 2: Quản lý xem dashboard và xử lý cảnh báo

- **User:** Quản lý
- **Importance:** Critical
- **Trigger:** Có cảnh báo vận hành mới hoặc quản lý mở dashboard định kỳ.
- **Expected outcome:** Cảnh báo được xem, được xác nhận với quyết định và
  lý do; khi cần tạo task xử lý trên `kanban-workspaces`.
- **Related needs:** UN-001, UN-002, UN-010

1) Manager mở dashboard → chỉ thấy phạm vi được cấp: tiến độ, quá hạn,
   workload theo nhóm và cá nhân trong quyền.
2) Cảnh báo mới hiện kèm dữ liệu nền (task nào, bao lâu, thuộc phạm vi nào).
3) Manager chọn: "Xác nhận — cần xử lý" (tạo task), "Đã biết — có lý do"
   (ghi chú), hoặc "Cảnh báo sai" (đánh dấu chỉnh ngưỡng).
4) Quyết định được ghi nhận kèm người xử lý, thời điểm và lý do.

**Independent verification:** Tạo một task quá hạn vượt ngưỡng → cảnh báo
xuất hiện trong phạm vi đúng; xác nhận cảnh báo → bản ghi có đủ quyết định,
lý do, người xử lý; task xử lý được tạo và liên kết về cảnh báo.

### Journey 3: Nhân viên xem dữ liệu của mình và phản hồi

- **User:** Nhân viên
- **Importance:** High
- **Trigger:** Nhân viên muốn biết mình bị theo dõi gì hoặc thấy số liệu sai.
- **Expected outcome:** Nhân viên đọc được policy, xem dữ liệu của mình
  (khi policy cho phép) và gửi phản hồi được tiếp nhận.
- **Related needs:** UN-004, UN-005, UN-006

1) Nhân viên mở "Dữ liệu vận hành của tôi" → đọc policy đang hiệu lực.
2) Xem số liệu của chính mình: task đang mở, hạn, quá hạn, cảnh báo liên
   quan và trạng thái xử lý.
3) Phát hiện sai (vd task đã bàn giao vẫn hiện quá hạn) → gửi phản hồi/
   đính chính → nhận kết quả xử lý.

**Independent verification:** Đăng nhập tài khoản nhân viên trong phạm vi
policy cho phép self-view — thấy đúng và chỉ dữ liệu của mình; gửi phản
hồi → bản ghi phản hồi có owner và trạng thái.

### Journey 4: Thay đổi policy khi phạm vi/loại dữ liệu đổi

- **User:** Admin + người duyệt
- **Importance:** High
- **Trigger:** Tổ chức muốn mở rộng/thu hẹp phạm vi hoặc đổi retention.
- **Expected outcome:** Version mới qua duyệt và công bố trước khi hiệu
  lực; version cũ hết hiệu lực; dữ liệu cũ theo retention đã công bố.
- **Related needs:** UN-003, UN-009

1) Admin tạo version mới từ policy hiện hành → chỉnh → gửi duyệt.
2) Người duyệt phê duyệt → version mới "Đã công bố", version cũ "Hết hiệu
   lực".
3) Người trong phạm vi thấy thông báo policy sẽ đổi và đọc bản mới.

**Independent verification:** Kiểm tra không có thời điểm nào hai version
cùng "Đã công bố"; sự kiện thu nhận sau ngày công bố tuân danh mục của
version mới.

### Journey 5: Điều tra truy cập dữ liệu theo dõi

- **User:** Admin
- **Importance:** Medium
- **Trigger:** Có complaint hoặc nghi vấn truy cập vượt phạm vi.
- **Expected outcome:** Truy vết được đầy đủ lượt xem dữ liệu cá nhân của
  một người hoặc một dữ liệu, kèm thời điểm và surface.
- **Related needs:** UN-007

1) Admin mở access audit → lọc theo người xem / người bị xem / khoảng thời
   gian.
2) Đối chiếu phạm vi quyền tại thời điểm xem → xác định truy cập hợp lệ
   hay vượt phạm vi.

**Independent verification:** Lấy một dữ liệu cá nhân bất kỳ đã được xem —
access audit liệt kê đủ ai xem, khi nào, trên surface nào.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Mở dashboard khi chưa có policy công bố | Người dùng tưởng lỗi hệ thống | Màn hình thông báo rõ "Chưa có chính sách theo dõi vận hành nào được công bố — dữ liệu chưa được thu thập" | Journey 1 / UN-003 |
| Gửi duyệt policy thiếu trường | Admin không biết vì sao bị chặn | Liệt kê đúng các field còn thiếu | Journey 1 / UN-003 |
| Người duyệt bấm duyệt trên bản policy đã cũ | Duyệt nhầm nội dung | Cảnh báo policy vừa được cập nhật, phải xem bản mới | Journey 4 / UN-009 |
| Nhân viên mở self-view khi policy chỉ cho số liệu nhóm | Tưởng bị mất quyền | Thông báo policy hiện chỉ cho phép xem số liệu nhóm + kênh phản hồi | Journey 3 / UN-005 |
| Cảnh báo tạo ra khi manager nghỉ phép | Cảnh báo treo | Quá SLA tự nhắc; sau 2 lần nhắc escalate theo policy | Journey 2 / UN-002 |
| Manager xử lý cảnh báo đã được người khác xử lý | Ghi đè quyết định | Hiện trạng thái mới + người đã xử lý, không ghi đè | Journey 2 / UN-002 |
| Phạm vi quản lý đổi giữa chừng | Thấy dữ liệu không còn thuộc quyền | Dashboard tự lọc lại theo phạm vi hiện tại | UN-010 |
| Dữ liệu hết retention | Không truy vết được chi tiết cũ | Thông báo dữ liệu đã xóa theo chính sách lưu giữ; số liệu ẩn danh vẫn còn nếu policy cho phép | UN-004, UN-007 |
| Sự kiện ngoài danh mục công bố cố được ghi | Thu thập vượt chính sách | Loại bỏ ngay đầu vào, không lưu, không hiển thị | Journey 1 / UN-003 |
| Nhân viên nghỉ việc | Dữ liệu treo vô thời hạn | Dữ liệu đi theo retention như thường, không xóa sớm không giữ lâu | UN-004 |

## 7. User-side Constraints

- Toàn bộ giao diện, policy và thông báo bằng tiếng Việt; policy phải viết
  bằng ngôn ngữ nhân viên đọc hiểu, không thuật ngữ pháp lý khó.
- Không có bất kỳ dữ liệu theo dõi nào hiển thị trước khi có policy "Đã
  công bố" — kể cả admin và quản lý cấp cao (điều kiện tiên quyết).
- Người xem dữ liệu cá nhân phải thuộc phạm vi được cấp trong policy và
  có quyền qua `org-governance`; deny-by-default.
- Cảnh báo không bao giờ được trình bày như kết luận vi phạm hay đánh giá
  hiệu suất — wording luôn là "tín hiệu cần kiểm tra".
- Self-view là quyền của nhân viên do policy khai báo; nếu policy tắt phải
  nêu rõ và nhân viên vẫn đọc được policy + gửi phản hồi.
- Desktop là surface chính cho dashboard quản lý; self-view nhân viên cần
  dùng được trên trình duyệt thường (không yêu cầu app riêng).
- Trước khi privacy gate PRD Mục 9 đạt (purpose, lawful basis, retention,
  access được duyệt; OQ-3/OQ-6 PRD đóng): chỉ chạy trên dữ liệu synthetic.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Người duyệt policy là Head of HR + DPO/legal (hai lớp: nghiệp vụ + privacy) | Nếu chỉ một vai trò → duyệt thiếu góc nhìn privacy hoặc nghiệp vụ | Assumption — bám owner R-10 PRD | Chốt ở OQ-1 (liên quan OQ-12 PRD) |
| Nguồn dữ liệu v1 chỉ là sự kiện quy trình/task đã có (kanban + reporting) | Nếu cần thêm nguồn → phải mở rộng policy danh mục và lượng thu thập | Confirmed — PRD Mục 7.29 "chỉ dữ liệu công việc/quy trình trong hệ thống" | — |
| Self-view mặc định bật trong policy v1 | Nếu owner chọn mặc định tắt → giảm tính minh bạch, rủi ro R-10 tăng | Assumption — bám PRD Mục 7.29 "khi policy cho phép" | Chốt ở OQ-3 với DPO/legal |
| Ngưỡng cảnh báo và retention ở Mục 7.2 brainstorm là chuẩn đề xuất | Nếu quá chặt/lỏng → spam cảnh báo hoặc giữ dữ liệu quá lâu | Assumption | Chốt ở OQ-2/OQ-4 |
| Access audit tái dùng hạ tầng audit của org-governance | Nếu phải tự xây → trùng log, khó điều tra chéo | Assumption | Đối chiếu spec `org-governance` khi sẵn |
| Phản hồi nhân viên có owner rõ trong policy (vd HR/đơn vị phụ trách) | Nếu không gán owner → phản hồi treo, mất niềm tin | Assumption | Chốt owner phản hồi trong mẫu policy (OQ-1) |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Cảnh báo vận hành dẫn tới action hữu ích thay vì bị bỏ qua | Chưa có — xác lập bằng đo tỷ lệ cảnh báo có quyết định trong 1 tháng pilot đầu | ≥70% cảnh báo được xử lý trong SLA với quyết định có lý do (đề xuất — chờ OQ-2 PRD) | Tỷ lệ cảnh báo có quyết định trong SLA / tổng cảnh báo | 1 tháng sau pilot |
| USC-002 | Không privacy complaint từ theo dõi vận hành | 0 complaint | 0 complaint được xác nhận (guardrail, bám R-10) | Số complaint xác nhận liên quan feature | Liên tục |
| USC-003 | Mọi dữ liệu thu thập đều nằm trong policy đã công bố | — | 100% sự kiện thuộc danh mục policy hiệu lực | Kiểm tra mẫu sự kiện đối chiếu policy version | Liên tục, review hàng tháng |
| USC-004 | Nhân viên biết mình được theo dõi gì | Chưa có — xác lập bằng đo tỷ lệ mở trang policy sau công bố đầu | ≥60% nhân viên trong phạm vi mở trang policy/self-view trong 1 tháng đầu (đề xuất) | Tỷ lệ nhân viên có ≥1 lượt xem policy/self-view | 1 tháng sau công bố |
| USC-005 | Không truy cập dữ liệu cá nhân vượt phạm vi | 0 sự cố | 0 sự cố vượt phạm vi được xác nhận (bám M-GR-01) | Số incident vượt data-scope | Liên tục |

## 10. Open Questions

- [x] OQ-1: Ai là người duyệt hợp lệ cho policy theo dõi vận hành — admin,
  Head of HR, hay cần cả DPO/legal? — Resolved (đề xuất): Head of HR duyệt
  nghiệp vụ + DPO/legal xác nhận purpose/retention — chờ Head of HR và
  DPO/legal xác nhận (bám owner R-10 PRD, liên quan OQ-12 PRD).
- [x] OQ-2: Retention dữ liệu theo dõi: sự kiện chi tiết và tổng hợp giữ
  bao lâu? — Resolved (đề xuất): chi tiết 90 ngày, tổng hợp ẩn danh 13
  tháng, khai báo trong policy — chờ DPO/legal xác nhận (liên quan OQ-6
  PRD).
- [x] OQ-3: Chế độ self-view mặc định — nhân viên xem đầy đủ dữ liệu của
  mình hay chỉ số liệu nhóm? — Resolved (đề xuất): mặc định xem đầy đủ dữ
  liệu của chính mình; chế độ "chỉ số liệu nhóm" phải khai báo tường minh
  — chờ DPO/legal xác nhận.
- [x] OQ-4: Ngưỡng cảnh báo mặc định và SLA xử lý? — Resolved (đề xuất):
  quá hạn 3 ngày, workload 15 task đang mở, đứng 7 ngày, SLA 3 ngày làm
  việc — chờ Product owner + Head of HR xác nhận.
- [x] OQ-5: Dữ liệu từ period trước khi có policy có được tổng hợp ngược
  không? — Resolved: không — chỉ tổng hợp sự kiện phát sinh sau ngày công
  bố policy, tránh "theo dõi ngược" chưa thông báo.
- [~] OQ-6: Có cho export dữ liệu theo dõi không? — Out of scope v1: export
  là P1, chỉ vai trò được cấp trong policy; báo cáo liên domain thuộc
  roadmap `management-reporting`.
