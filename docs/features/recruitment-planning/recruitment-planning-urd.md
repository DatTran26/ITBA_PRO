---
type: urd
feature: recruitment-planning
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/recruitment-planning/brainstorms/recruitment-request-approval.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md]
---

# recruitment-planning — User Requirements Document

## 1. Purpose

Cho quản lý và HR một luồng nhu cầu tuyển dụng có kiểm soát: đề xuất được
chuẩn hóa thành vị trí/JD có owner và headcount, qua tay cấp thẩm quyền
trước khi mở, và mọi vị trí "đang mở" đều truy nguyên được về quyết định
phê duyệt — thay vì nhu cầu truyền miệng và vị trí mở mà không ai chắc đã
được duyệt.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Quản lý | Nhu cầu tuyển gửi qua email/chat/trao đổi trực tiếp | Không biết nhu cầu đã được duyệt chưa, đang ở bước nào, ai đang giữ | Nhu cầu cần gấp bị trễ, phải hỏi lại nhiều lần | Confirmed — PRD Mục 7.5, JTBD-MGR-01 |
| HR | Tự viết JD mỗi lần, tự quyết mở vị trí | Không có bản ghi duyệt; khi bị hỏi "ai cho mở vị trí này" không có căn cứ | Trách nhiệm không rõ, JD không nhất quán giữa các vị trí | Confirmed — PRD Mục 7.5 (rủi ro mở tuyển khi authority chưa rõ) |
| Cấp phê duyệt | Không có hàng chờ duyệt chính thức | Vị trí mở mà không qua quyết định của mình | Mất kiểm soát nhu cầu và định mức tuyển | Assumption — suy từ "cấp thẩm quyền phê duyệt trước khi mở tuyển" (PRD Mục 7.5) |
| Lãnh đạo | Muốn xem tổng nhu cầu đang chờ/đang mở | Không có danh sách thống nhất theo phạm vi quyền | Không nắm được kế hoạch tuyển thực tế | Confirmed — PRD Mục 3 (JTBD-MGR-01) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Chuẩn hóa JD, điều phối request và quản lý vị trí đang mở | Mọi vị trí mở đều có duyệt, owner và headcount rõ ràng | JD soạn lại mỗi lần, không rõ ai duyệt, headcount theo dõi tay |
| secondary | Quản lý | Đề xuất nhu cầu tuyển cho đơn vị mình | Gửi nhu cầu nhanh, biết trạng thái duyệt | Nhu cầu truyền miệng dễ thất lạc |
| secondary | Approver (cấp thẩm quyền — đề xuất Head of HR/người được ủy quyền) | Nhận hàng chờ request chờ duyệt | Quyết định duyệt/từ chối/yêu cầu chỉnh có ghi nhận | Không có kênh duyệt chính thức |
| secondary | Lãnh đạo | Xem tổng quan nhu cầu và vị trí trong phạm vi | Nhìn được kế hoạch tuyển thực tế | Dữ liệu rải rác |
| out | Ứng viên | Chỉ thấy vị trí "đang mở" qua form nộp CV (`cv-intake`) | (gián tiếp) vị trí mình nộp là nhu cầu thật đã duyệt | Không thao tác trong feature này |

## 3. Scope Boundaries

### In Scope

- Tạo/lưu nháp/sửa/gửi/hủy recruitment request (nhu cầu, lý do, đơn vị,
  headcount, thời điểm cần, mức ưu tiên).
- Chuẩn hóa JD và gán HR owner trước khi gửi duyệt.
- Luồng duyệt một cấp: chờ duyệt → duyệt / từ chối / yêu cầu chỉnh kèm
  ghi chú, có hàng chờ và thông báo kết quả.
- Tạo vị trí "Đang mở" từ request đã duyệt; tạm dừng/mở lại/đóng vị trí
  kèm lý do.
- Theo dõi headcount đã chốt/còn lại trên vị trí; cảnh báo đủ headcount
  là đề xuất đóng, con người quyết định.
- Điều chỉnh JD/headcount trên vị trí đang mở có audit.
- Cảnh báo request chờ duyệt quá hạn.
- Audit đầy đủ đề xuất → duyệt → mở → đóng.

### Out of Scope

- Workforce budgeting, định biên, đối chiếu ngân sách (PRD "Chưa làm").
- Đăng vị trí ra job board/marketplace (PRD "Chưa làm"; chờ
  `external-integrations`).
- Chuỗi phê duyệt nhiều cấp — v1 một cấp duyệt (OQ-7 brainstorm, out of
  scope).
- Tiếp nhận/parse CV ứng viên — thuộc `cv-intake`; feature này chỉ cung
  cấp vị trí đang mở làm đích gắn.
- Đối chiếu ứng viên với vị trí — thuộc `candidate-matching`.
- Điều phối trạng thái ứng viên — thuộc `candidate-pipeline`.
- Khung kỹ năng/level kỳ vọng chi tiết — thuộc `talent-framework`; vị trí
  ở đây chỉ tham chiếu.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Quản lý | Khi đơn vị cần thêm người | Gửi đề xuất nhu cầu có đủ vị trí/lý do/số lượng/thời điểm qua một form duy nhất | Request được ghi nhận, đi vào luồng duyệt, không thất lạc | Critical | Confirmed — PRD Mục 7.5 (request) |
| UN-002 | Quản lý | Sau khi gửi đề xuất | Xem được request đang ở trạng thái nào, ai đang giữ, vì sao bị trả | Không phải hỏi lại bằng kênh ngoài | High | Confirmed — PRD Mục 7.5 (theo dõi) |
| UN-003 | HR | Khi nhận request mới | Chuẩn hóa thành JD đầy đủ và gán owner trước khi đưa lên duyệt | Vị trí gửi duyệt đã có JD chuẩn và người phụ trách | Critical | Confirmed — PRD Mục 7.5 (position/JD, owner) |
| UN-004 | Approver | Khi có request chờ duyệt | Một hàng chờ liệt kê request kèm nhu cầu + JD + người đề xuất; quyết định duyệt/từ chối/yêu cầu chỉnh có ghi nhận | Mọi quyết định có người, thời điểm, lý do | Critical | Confirmed — PRD Mục 7.5 (approval); vai trò cụ thể là đề xuất chờ xác nhận |
| UN-005 | HR | Sau khi request được duyệt | Vị trí tự động mở với JD + headcount + owner, sẵn sàng nhận CV | `cv-intake` gắn được CV vào vị trí đang mở | Critical | Confirmed — PRD Mục 7.5 (luồng duyệt → mở vị trí), Mục 7.6 dependency |
| UN-006 | HR owner | Khi vị trí đang tuyển | Theo dõi headcount đã chốt/còn lại và điều chỉnh JD/headcount có audit | Số liệu tuyển đúng, thay đổi truy vết được | High | Confirmed — PRD Mục 7.5 (headcount, theo dõi) |
| UN-007 | HR owner / approver | Khi cần ngừng tuyển một vị trí | Tạm dừng (mở lại được) hoặc đóng hẳn kèm lý do | Vị trí ngừng nhận hồ sơ mới, lý do truy vết được | High | Assumption — suy từ theo dõi vị trí PRD Mục 7.5 |
| UN-008 | Approver / người đề xuất | Khi request chờ duyệt lâu | Được nhắc khi request quá hạn SLA | Request không treo vô thời hạn | Medium | Assumption — suy từ đo thành công "thời gian đến duyệt" PRD Mục 7.5 |
| UN-009 | Lãnh đạo | Khi cần nhìn kế hoạch tuyển | Danh sách request/vị trí theo phạm vi được cấp | Báo cáo miệng thay bằng màn hình sống | Medium | Confirmed — PRD Mục 3 (JTBD-MGR-01) |

## 5. Prioritized User Journeys

### Journey 1: Từ nhu cầu đến vị trí đang mở

- **User:** Quản lý + HR + approver
- **Importance:** Critical
- **Trigger:** Đơn vị có nhu cầu tuyển người mới.
- **Expected outcome:** Vị trí ở trạng thái "Đang mở" với JD + owner +
  headcount, xuất phát từ request "Đã duyệt" truy vết được.
- **Related needs:** UN-001, UN-003, UN-004, UN-005

1) Quản lý tạo request: tên vị trí, đơn vị, lý do, headcount, thời điểm
   cần, mức ưu tiên → gửi.
2) HR chuẩn hóa JD, gán HR owner → gửi duyệt → request "Chờ duyệt".
3) Approver mở hàng chờ → duyệt.
4) Hệ thống tạo vị trí "Đang mở"; `cv-intake` nhận CV gắn vị trí và form
   ứng viên của vị trí hoạt động.

**Independent verification:** Chọn một vị trí "Đang mở" bất kỳ — truy
ngược về request gốc: có đủ người đề xuất, quyết định duyệt (ai, khi
nào), JD tại thời điểm duyệt, owner và headcount.

### Journey 2: Approver xử lý hàng chờ duyệt

- **User:** Approver
- **Importance:** Critical
- **Trigger:** Có request chuyển sang "Chờ duyệt".
- **Expected outcome:** Mỗi request có quyết định rõ ràng kèm ghi chú bắt
  buộc khi từ chối/yêu cầu chỉnh; không request treo quá hạn mà không ai
  được nhắc.
- **Related needs:** UN-004, UN-008

1) Approver mở hàng chờ, thấy request sắp theo thời gian gửi, request quá
   hạn đánh dấu.
2) Mở request → xem nhu cầu + JD + người đề xuất + owner.
3) Quyết định: duyệt (tạo vị trí), từ chối (kết thúc + lý do), hoặc yêu
   cầu chỉnh (về cho người đề xuất + ghi chú).

**Independent verification:** Lấy 10 request đã qua hàng chờ — 100% có
bản ghi quyết định (ai, khi nào, quyết định gì, ghi chú nếu từ chối/yêu
cầu chỉnh).

### Journey 3: Theo dõi headcount và đóng vị trí

- **User:** HR owner
- **Importance:** High
- **Trigger:** Vị trí đang mở có ứng viên đi tới cuối pipeline.
- **Expected outcome:** Headcount đã chốt/còn lại luôn đúng; khi đủ số,
  HR được đề xuất đóng và quyết định đóng có lý do.
- **Related needs:** UN-006, UN-007

1) HR owner mở vị trí → xem headcount cần, đã chốt (ứng viên chốt tuyển
   do pipeline ghi nhận), còn lại.
2) Khi đủ số → hệ thống cảnh báo đề xuất đóng.
3) HR xác nhận "Đóng" kèm lý do → vị trí "Đã đóng", ngừng nhận hồ sơ mới.

**Independent verification:** Đối chiếu một vị trí "Đã đóng" — số đã chốt
khớp danh sách application chốt tuyển của vị trí, và có bản ghi ai đóng,
khi nào, lý do.

### Journey 4: Request bị trả về chỉnh

- **User:** Quản lý / HR
- **Importance:** High
- **Trigger:** Approver chọn "Yêu cầu chỉnh" kèm ghi chú.
- **Expected outcome:** Người đề xuất sửa theo ghi chú và gửi lại vào
  hàng chờ; lịch sử các vòng chỉnh được giữ.
- **Related needs:** UN-002, UN-004

1) Người đề xuất nhận thông báo request bị trả kèm ghi chú.
2) Sửa nội dung/JD → gửi lại → request về "Chờ duyệt".
3) Approver xem lại và quyết định; vòng lặp ghi lại lịch sử.

**Independent verification:** Một request từng bị trả ≥1 lần — lịch sử
hiện đủ các vòng (ghi chú approver, thời điểm gửi lại, quyết định cuối).

### Journey 5: Điều chỉnh vị trí đang mở

- **User:** HR owner
- **Importance:** Medium
- **Trigger:** Nhu cầu thay đổi sau khi vị trí đã mở (JD cần bổ sung,
  headcount đổi).
- **Expected outcome:** Điều chỉnh được ghi audit trước/sau; không phải
  đóng vị trí tạo lại.
- **Related needs:** UN-006, UN-007

1) HR owner mở vị trí đang mở → sửa JD hoặc headcount → lưu kèm ghi chú.
2) Hệ thống ghi audit thay đổi (trước/sau, ai, khi nào).
3) Nếu headcount giảm dưới số đã chốt → cảnh báo mâu thuẫn, HR quyết
   định.

**Independent verification:** Sửa headcount một vị trí đang mở — audit
hiện đúng giá trị trước và sau, người sửa và thời điểm.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Gửi duyệt request thiếu trường | Người gửi không hiểu vì sao bị chặn | Thông báo liệt kê đúng trường còn thiếu | Journey 1 / UN-001 |
| Gửi duyệt khi chưa chuẩn hóa JD/owner | Request thiếu thông tin để duyệt | Chặn gửi, yêu cầu hoàn thiện JD và chọn HR phụ trách | Journey 1 / UN-003 |
| Tổ chức chưa gán approver | Không gửi duyệt được, không biết hỏi ai | Thông báo rõ + hướng dẫn liên hệ admin gán thẩm quyền | UN-004 |
| Approver duyệt lúc request vừa bị rút về | Quyết định trên bản cũ | Kiểm tra trạng thái trước khi ghi, cảnh báo đã đổi | Journey 2 / UN-004 |
| Hai người cùng sửa request | Người lưu sau ghi đè | Cảnh báo "request vừa được {người} cập nhật" | Journey 4 |
| Gửi duyệt request trùng vị trí đang mở | Tuyển trùng vị trí | Cảnh báo vị trí tương tự đang mở, xác nhận tiếp tục | Journey 1 |
| Vị trí đóng khi còn ứng viên đang xử lý | Sợ mất hồ sơ | Ứng viên vẫn được `candidate-pipeline` điều phối; chỉ ngừng nhận hồ sơ mới | Journey 3 / UN-007 |
| Giảm headcount dưới số đã chốt | Số liệu mâu thuẫn | Cảnh báo mâu thuẫn + HR quyết định đóng hay giữ | Journey 5 / UN-006 |
| Người thao tác ngoài phạm vi đơn vị | Thao tác vượt quyền | Từ chối + ghi audit từ chối | UN-001 |
| Không có request nào | Người mới không biết bắt đầu | Empty state gợi ý tạo đề xuất đầu tiên | Journey 1 |

## 7. User-side Constraints

- Ngôn ngữ giao diện và toàn bộ thông báo là tiếng Việt (PRD Mục 9).
- Chỉ người dùng nội bộ đã đăng nhập, thuộc tổ chức và phạm vi được cấp
  mới tạo/xem request và vị trí (organization/role/data-scope — PRD Mục 9).
- Cấp phê duyệt là vai trò được gán trong `org-governance`; nếu tổ chức
  chưa gán, hệ thống chặn gửi duyệt và hướng dẫn liên hệ admin.
- Quyết định từ chối/yêu cầu chỉnh/đóng/tạm dừng/hủy bắt buộc có lý do —
  đây là điều kiện tiên quyết của mọi hành động thay đổi trạng thái.
- Vị trí "Đang mở" là điều kiện tiên quyết để `cv-intake` nhận CV gắn vị
  trí và mở form ứng viên — không có đường tạo vị trí lách duyệt.
- Màn hình chính trên desktop (form, hàng chờ, danh sách); không yêu cầu
  mobile cho v1.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Một cấp duyệt trong v1; approver là vai trò gán trong org-governance (đề xuất Head of HR/ủy quyền theo đơn vị) | Nếu cần đa cấp → luồng duyệt thiếu bước | Assumption — đã giải OQ-1 (đề xuất chờ Head of HR) | Head of HR xác nhận trước pilot |
| Một request = một vị trí; đợt mới tạo request mới | Nếu cần N:N → thiếu quan hệ đợt tuyển | Assumption — đã giải OQ-2 | Product owner xác nhận |
| "Đã chốt tuyển" đếm từ trạng thái cuối pipeline do candidate-pipeline/offer ghi nhận | Nếu đếm sai → đóng vị trí sai lúc | Assumption — đã giải OQ-3 | Đối chiếu khi candidate-pipeline đặc tả xong |
| Hệ thống chỉ cảnh báo đủ headcount, không tự đóng vị trí | Nếu auto-close → vi phạm human-in-the-loop | Confirmed — invariant PRD Mục 12 | — |
| Giới hạn (headcount ≤50, JD ≤20.000 ký tự, SLA 5 ngày) là chuẩn v1 | Nếu sai ngưỡng → validation/báo sai | Assumption — đã giải OQ-5 | Product owner xác nhận |
| Request từ chối không mở lại, tạo request mới tham chiếu | Nếu cho mở lại → audit mờ | Assumption — đã giải OQ-6 | — |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Nhu cầu đi từ đề xuất đến quyết định duyệt nhanh và có trạng thái rõ | Chưa có — xác lập bằng đo trung bình trên các request đầu tiên trong 1 tháng pilot | Thời gian trung bình gửi → duyệt ≤5 ngày làm việc (đề xuất, chờ OQ-2 sản phẩm) | Thời gian từ "gửi duyệt" đến quyết định đầu tiên, theo request | 1 tháng sau pilot |
| USC-002 | Mọi vị trí đang mở đều qua duyệt | 0% (hiện không có luồng duyệt) | 100% | Tỷ lệ vị trí "Đang mở" có request "Đã duyệt" + JD + owner + headcount | Liên tục |
| USC-003 | Quyết định duyệt/trả/đóng đều truy vết được | Chưa có | 100% quyết định có người + thời điểm + lý do | Kiểm tra mẫu quyết định mỗi tháng | Hàng tháng |
| USC-004 | Request chờ duyệt không treo âm thầm | Chưa có — xác lập trong pilot | 0 request quá SLA mà không có cảnh báo | Số request quá hạn không được đánh dấu/thông báo | Liên tục |
| USC-005 | Headcount trên vị trí đáng tin | Chưa có — xác lập bằng đối chiếu thủ công trong pilot | Số đã chốt khớp dữ liệu pipeline ≥99% | Đối chiếu định kỳ headcount vị trí vs application chốt | Hàng tháng |

## 10. Open Questions

- [x] OQ-1: Ai là cấp thẩm quyền duyệt — Resolved (đề xuất): vai trò
  "người phê duyệt tuyển dụng" gán trong `org-governance`, mặc định Head
  of HR hoặc người được ủy quyền theo đơn vị; một cấp duyệt v1 — chờ Head
  of HR xác nhận.
- [x] OQ-2: Một request tạo được mấy vị trí — Resolved (đề xuất): một vị
  trí; đợt tuyển mới tạo request mới, có thể nhân bản JD — chờ Product
  owner xác nhận.
- [x] OQ-3: Headcount đếm thế nào — Resolved (đề xuất): đếm application
  chốt tuyển do `candidate-pipeline`/offer ghi nhận; hệ thống chỉ cảnh
  báo, HR xác nhận đóng — chờ Head of HR xác nhận.
- [x] OQ-4: Vị trí đủ headcount có tự đóng — Resolved: KHÔNG; cảnh báo
  đề xuất, con người quyết định (PRD Mục 12).
- [x] OQ-5: Ngưỡng số học chuẩn v1 (headcount ≤50, JD ≤20.000 ký tự, SLA
  duyệt 5 ngày làm việc) — Resolved (đề xuất): dùng giá trị này — chờ
  Product owner xác nhận.
- [x] OQ-6: Request từ chối có mở lại được — Resolved: không; lý do giữ
  trong audit, tạo request mới tham chiếu request cũ.
- [~] OQ-7: Phê duyệt nhiều cấp — Out of scope v1: PRD Mục 7.5 chỉ nêu
  một cấp thẩm quyền; đưa vào roadmap mở rộng.
