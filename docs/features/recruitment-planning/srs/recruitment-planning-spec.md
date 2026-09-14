---
type: srs
feature: recruitment-planning
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/recruitment-planning/brainstorms/recruitment-request-approval.md
  - docs/features/recruitment-planning/recruitment-planning-urd.md
  - docs/_reverse/recruitment-and-interviews/reverse-spec.md
---

# recruitment-planning — Software Requirements Specification

## 1. Scope

SRS này cover luồng nhu cầu tuyển dụng của một tổ chức: tạo/sửa/gửi/hủy
recruitment request, HR chuẩn hóa JD và gán owner, luồng phê duyệt một
cấp có hàng chờ và ghi nhận quyết định, tạo vị trí "Đang mở" từ request
đã duyệt, theo dõi headcount, tạm dừng/mở lại/đóng vị trí, điều chỉnh vị
trí đang mở có audit, cảnh báo chờ duyệt quá hạn và audit đầy đủ. Đây là
feature `Must` của lát cắt tuyển dụng v1 (PRD Mục 6.1). KHÔNG cover:
workforce budgeting/định biên, đăng vị trí ra kênh ngoài, phê duyệt đa
cấp, tiếp nhận/parse CV (`cv-intake`), đối chiếu ứng viên
(`candidate-matching`), điều phối trạng thái ứng viên
(`candidate-pipeline`), và định nghĩa khung kỹ năng (`talent-framework`).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Chuẩn hóa JD, gán owner, quản lý vị trí đang mở và headcount | Có |
| Quản lý | người | Đề xuất và theo dõi nhu cầu tuyển của đơn vị mình | Có |
| Approver (cấp thẩm quyền tuyển dụng) | người | Duyệt/từ chối/yêu cầu chỉnh request trong hàng chờ | Có |
| Lãnh đạo | người | Xem tổng quan request/vị trí trong phạm vi được cấp | Có (chỉ đọc) |
| Admin | người | Gán vai trò approver, truy vết audit | Có (gián tiếp qua org-governance) |
| `org-governance` | hệ thống | Cung cấp cơ cấu đơn vị, vai trò, phạm vi và gán thẩm quyền | Có (dependency) |
| `cv-intake` | hệ thống | Nhận vị trí "Đang mở" làm đích gắn CV | Có (consumer) |
| `candidate-pipeline` | hệ thống | Cung cấp trạng thái chốt tuyển để đếm headcount | Có (dependency) |
| `contextual-notifications` | hệ thống | Gửi cảnh báo quá hạn/kết quả duyệt | Có (dependency) |
| Ứng viên | người | Nộp CV vào vị trí đang mở | Không (chịu ràng buộc: chỉ vị trí đang mở mới hiện form) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-recruitment-planning-001 | Tạo và lưu nháp request | Khi quản lý hoặc HR tạo đề xuất tuyển dụng, hệ thống phải ghi nhận tên vị trí dự kiến, đơn vị, lý do, headcount, thời điểm cần và mức ưu tiên; cho lưu "Nháp" chưa đủ trường và sửa tự do khi còn nháp. | P0 | demo | PRD Mục 7.5; URD UN-001 |
| FR-recruitment-planning-002 | Gửi duyệt có kiểm tra | Khi người dùng gửi duyệt, hệ thống phải kiểm tra đủ trường bắt buộc của request và đã có JD chuẩn hóa + HR owner; nếu thiếu thì phải chặn và liệt kê phần thiếu. | P0 | test | PRD Mục 7.5; brainstorm D1, D3 |
| FR-recruitment-planning-003 | Chuẩn hóa JD và gán owner | Hệ thống phải cho HR bổ sung/sửa nội dung JD (mô tả, yêu cầu) và chọn HR owner là người dùng nội bộ còn hoạt động trước khi gửi duyệt. | P0 | demo | PRD Mục 7.5 (position/JD, owner); URD UN-003 |
| FR-recruitment-planning-004 | Hàng chờ duyệt | Hệ thống phải đưa request "Chờ duyệt" vào hàng chờ của approver, sắp theo thời gian gửi và đánh dấu request quá hạn SLA. | P0 | demo | PRD Mục 7.5 (approval); URD UN-004 |
| FR-recruitment-planning-005 | Quyết định duyệt có ghi nhận | Khi approver quyết định, hệ thống phải ghi nhận "Duyệt" / "Từ chối" / "Yêu cầu chỉnh" kèm người quyết định, thời điểm; từ chối và yêu cầu chỉnh bắt buộc ghi chú không rỗng. | P0 | test | PRD Mục 7.5, Mục 12; URD UN-004 |
| FR-recruitment-planning-006 | Mở vị trí từ request đã duyệt | Khi request chuyển "Đã duyệt", hệ thống phải tạo một vị trí ở "Đang mở" mang theo JD + headcount + owner của request; chỉ request "Đã duyệt" mới tạo được vị trí. | P0 | test | PRD Mục 7.5 (luồng duyệt → mở vị trí); brainstorm D2 |
| FR-recruitment-planning-007 | Rút về và hủy request | Khi request đang "Chờ duyệt" hoặc "Yêu cầu chỉnh", hệ thống phải cho người đề xuất/HR rút về "Nháp" hoặc hủy kèm lý do; request "Đã duyệt"/"Từ chối"/"Đã hủy" không sửa, không hủy được nữa. | P0 | test | brainstorm D6, 6.3; URD Journey 4 |
| FR-recruitment-planning-008 | Vòng chỉnh có lịch sử | Khi approver yêu cầu chỉnh, hệ thống phải chuyển request "Yêu cầu chỉnh" kèm ghi chú, cho sửa và gửi lại vào "Chờ duyệt"; mọi vòng gửi–trả phải giữ trong lịch sử. | P0 | test | brainstorm 6.3; URD UN-002 |
| FR-recruitment-planning-009 | Theo dõi headcount trên vị trí | Hệ thống phải hiển thị trên mỗi vị trí: headcount cần, số ứng viên đã chốt tuyển (theo trạng thái pipeline) và số còn lại; khi số đã chốt đạt headcount thì phải hiện cảnh báo đề xuất đóng — không tự đóng. | P0 | test | PRD Mục 7.5 (headcount, theo dõi); brainstorm D4 |
| FR-recruitment-planning-010 | Tạm dừng, mở lại, đóng vị trí | Khi HR owner hoặc approver tạm dừng/đóng vị trí, hệ thống phải yêu cầu lý do, chuyển trạng thái tương ứng và cho mở lại từ "Tạm dừng"; vị trí "Đã đóng" không mở lại và ngừng nhận hồ sơ mới. | P0 | test | brainstorm D5, D7; URD UN-007 |
| FR-recruitment-planning-011 | Điều chỉnh vị trí đang mở có audit | Khi HR owner sửa JD hoặc headcount trên vị trí đang mở, hệ thống phải ghi audit trước/sau kèm ghi chú; nếu headcount giảm dưới số đã chốt thì phải cảnh báo mâu thuẫn. | P1 | test | brainstorm 6.4; URD Journey 5 |
| FR-recruitment-planning-012 | Cảnh báo chờ duyệt quá hạn | Khi request ở "Chờ duyệt" quá SLA đã công bố, hệ thống phải đánh dấu quá hạn và thông báo approver + người đề xuất. | P1 | test | URD UN-008; brainstorm P1 |
| FR-recruitment-planning-013 | Cảnh báo trùng vị trí | Khi gửi duyệt request có tên vị trí + đơn vị trùng vị trí đang mở, hệ thống phải cảnh báo và yêu cầu xác nhận tiếp tục. | P1 | test | brainstorm 6.5 |
| FR-recruitment-planning-014 | Chặn thao tác ngoài phạm vi | Khi người dùng thao tác trên request/vị trí của đơn vị ngoài phạm vi được cấp, hệ thống phải từ chối và ghi audit từ chối. | P0 | test | PRD Mục 9; brainstorm D8 |
| FR-recruitment-planning-015 | Danh sách và lọc | Hệ thống phải cho xem/lọc danh sách request theo trạng thái, đơn vị, người đề xuất, mức ưu tiên và danh sách vị trí theo trạng thái/đơn vị/owner trong phạm vi được cấp. | P1 | demo | brainstorm P1; URD UN-009 |
| FR-recruitment-planning-016 | Audit toàn bộ vòng đời | Hệ thống phải ghi audit cho mọi sự kiện: tạo, sửa, gửi duyệt, rút về, hủy, quyết định approver, mở/tạm dừng/mở lại/đóng vị trí và điều chỉnh vị trí đang mở — đủ ai, khi nào, trước/sau, lý do. | P0 | kiểm tra | PRD Mục 9, Mục 7.5; URD UN-004 |
| FR-recruitment-planning-017 | Chặn mở vị trí lách duyệt | Hệ thống không được cho tạo vị trí "Đang mở" bằng bất kỳ đường nào khác ngoài request "Đã duyệt"; form ứng viên của `cv-intake` chỉ hiện với vị trí "Đang mở". | P0 | test | PRD Mục 7.5 (rủi ro chính); URD Mục 7 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-recruitment-planning-001 | security | Mọi thao tác trên request/vị trí phải theo organization/role/data-scope; deny by default khi quyết định quyền lỗi. | P0 | 0 sự cố vượt phạm vi được xác nhận (bám M-GR-01) |
| NFR-recruitment-planning-002 | auditability | Mọi quyết định duyệt/trả/đóng và điều chỉnh vị trí đều có vết audit đầy đủ. | P0 | 100% quyết định truy vết được trên mẫu kiểm tra |
| NFR-recruitment-planning-003 | usability | Thông báo lỗi/trạng thái tiếng Việt tự nhiên, nêu lý do và cách khắc phục; trạng thái request/vị trí hiển thị nhất quán trên mọi màn hình. | P0 | Người dùng đọc hiểu lý do chặn/từ chối mà không cần hỏi admin; kiểm tra mẫu wording |
| NFR-recruitment-planning-004 | performance | Danh sách request/vị trí và hàng chờ duyệt phản hồi nhanh ở quy mô pilot. | P1 | 95% lượt mở danh sách/hàng chờ trong ≤3 giây ở quy mô ≤500 request và ≤200 vị trí (giá trị đề xuất) |
| NFR-recruitment-planning-005 | reliability | Không request nào kẹt ở "Chờ duyệt" vô thời hạn mà không có cảnh báo. | P0 | 0 request quá SLA không được đánh dấu/thông báo (USC-004) |
| NFR-recruitment-planning-006 | integrity | Quyết định của approver không được ghi trên trạng thái request đã đổi; số đã chốt phải khớp nguồn pipeline. | P0 | Kiểm tra đồng thời: quyết định trên request đã rút về không được ghi; đối chiếu headcount ≥99% khớp |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-recruitment-planning-001 | Chỉ request "Đã duyệt" mới tạo được vị trí "Đang mở" — không có ngoại lệ. | Tạo vị trí | FR-recruitment-planning-006, FR-recruitment-planning-017 | PRD Mục 7.5 (rủi ro chính), Mục 12 |
| BR-recruitment-planning-002 | Từ chối, yêu cầu chỉnh, tạm dừng, đóng, hủy bắt buộc lý do không rỗng. | Quyết định/hành động đổi trạng thái | FR-recruitment-planning-005, FR-recruitment-planning-007, FR-recruitment-planning-010 | brainstorm 7.1 |
| BR-recruitment-planning-003 | Một request tạo tối đa một vị trí; tuyển đợt mới phải tạo request mới (đề xuất — OQ-2). | Duyệt request | FR-recruitment-planning-006 | brainstorm OQ-2 |
| BR-recruitment-planning-004 | Headcount mỗi request là số nguyên 1–50 (đề xuất — OQ-5). | Lưu/gửi duyệt request | FR-recruitment-planning-002 | brainstorm 7.2 |
| BR-recruitment-planning-005 | Request "Chờ duyệt" quá 5 ngày làm việc (đề xuất — OQ-5) bị đánh dấu quá hạn và thông báo approver + người đề xuất. | Giám sát thời gian chờ | FR-recruitment-planning-004, FR-recruitment-planning-012 | brainstorm 7.2 |
| BR-recruitment-planning-006 | Vị trí "Đã đóng" là trạng thái cuối — không mở lại; tuyển tiếp thì tạo request mới. | Yêu cầu mở lại vị trí đã đóng | FR-recruitment-planning-010 | brainstorm D7, 6.3 |
| BR-recruitment-planning-007 | Hệ thống chỉ cảnh báo khi đủ headcount; đóng vị trí luôn là quyết định của con người kèm lý do. | Số đã chốt đạt headcount | FR-recruitment-planning-009, FR-recruitment-planning-010 | PRD Mục 12 (human-in-the-loop); brainstorm OQ-4 |
| BR-recruitment-planning-008 | Quyết định của approver chỉ được ghi khi request vẫn ở "Chờ duyệt"; nếu trạng thái đã đổi phải cảnh báo và không ghi. | Approver bấm quyết định | FR-recruitment-planning-005, NFR-recruitment-planning-006 | brainstorm 6.4 |
| BR-recruitment-planning-009 | Người đề xuất/HR chỉ thao tác trên request và vị trí thuộc đơn vị trong phạm vi được cấp. | Mọi thao tác ghi | FR-recruitment-planning-014 | PRD Mục 9 |
| BR-recruitment-planning-010 | HR owner bắt buộc là người dùng nội bộ còn hoạt động tại thời điểm gửi duyệt và tại thời điểm vị trí mở. | Gửi duyệt / mở vị trí | FR-recruitment-planning-003, FR-recruitment-planning-006 | brainstorm 7.1 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-recruitment-planning-001 | Thiếu trường khi gửi duyệt | Gửi duyệt request thiếu trường bắt buộc; nếu thiếu thì hệ thống phải liệt kê phần thiếu | minor | FR-recruitment-planning-002 | Form hiện lỗi tại từng field | Bổ sung rồi gửi lại |
| E-recruitment-planning-002 | Chưa chuẩn hóa JD/owner | Gửi duyệt khi JD rỗng hoặc chưa có HR owner | major | FR-recruitment-planning-002, FR-recruitment-planning-003 | Thông báo "Cần hoàn thiện JD và chọn HR phụ trách" | HR hoàn thiện rồi gửi |
| E-recruitment-planning-003 | Chưa có approver | Tổ chức chưa gán vai trò phê duyệt | major | FR-recruitment-planning-004 | Thông báo "Tổ chức chưa có người phê duyệt — liên hệ admin" | Admin gán thẩm quyền trong org-governance |
| E-recruitment-planning-004 | Quyết định trên request đã đổi | Approver bấm duyệt khi request vừa bị rút về/sửa | major | FR-recruitment-planning-005, BR-008 | Cảnh báo "Request này vừa được cập nhật — tải lại" | Tải lại, quyết định trên bản mới |
| E-recruitment-planning-005 | Headcount không hợp lệ | Nhập headcount <1, >50 hoặc không nguyên | minor | FR-recruitment-planning-002, BR-004 | Lỗi tại field "Số lượng cần tuyển phải từ 1 đến 50" | Nhập lại |
| E-recruitment-planning-006 | Trùng vị trí đang mở | Gửi duyệt request trùng tên + đơn vị với vị trí đang mở | minor | FR-recruitment-planning-013 | Cảnh báo "Đã có vị trí «{tên}» đang mở — xác nhận vẫn gửi?" | Xác nhận tiếp tục hoặc sửa |
| E-recruitment-planning-007 | Mở lại vị trí đã đóng | Yêu cầu mở lại vị trí "Đã đóng" | minor | FR-recruitment-planning-010, BR-006 | Thông báo vị trí đã đóng không mở lại | Tạo request mới |
| E-recruitment-planning-008 | Giảm headcount dưới số đã chốt | Lưu headcount mới < số đã chốt tuyển | major | FR-recruitment-planning-011 | Cảnh báo mâu thuẫn số liệu | HR xác nhận giữ/đóng hoặc điều chỉnh lại |
| E-recruitment-planning-009 | Thao tác ngoài phạm vi | Ghi trên request/vị trí đơn vị ngoài scope | major | FR-recruitment-planning-014 | Thông báo không có quyền + ghi audit | Xin cấp quyền; sự kiện trong audit |
| E-recruitment-planning-010 | Sửa đồng thời | Hai người lưu cùng request | minor | FR-recruitment-planning-007, FR-recruitment-planning-016 | Cảnh báo "request vừa được {người} cập nhật — tải lại" | Tải lại, sửa trên bản mới |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-recruitment-planning-01 | Nhu cầu tới được quyết định duyệt nhanh | Thời gian trung bình từ "gửi duyệt" đến quyết định đầu tiên | ≤5 ngày làm việc (đề xuất, chờ OQ-2 sản phẩm) |
| SC-recruitment-planning-02 | Không vị trí mở lách duyệt | Tỷ lệ vị trí "Đang mở" có request "Đã duyệt" đủ JD/owner/headcount | 100% |
| SC-recruitment-planning-03 | Quyết định đều truy vết được | Tỷ lệ quyết định có đủ người + thời điểm + lý do | 100% |
| SC-recruitment-planning-04 | Hàng chờ duyệt không treo | Số request quá SLA không được đánh dấu/thông báo | 0 |
| SC-recruitment-planning-05 | Headcount đáng tin | Tỷ lệ khớp giữa số đã chốt trên vị trí và dữ liệu pipeline | ≥99% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- **RECRUITMENT_REQUEST** — đề xuất nhu cầu: tên vị trí dự kiến, đơn vị,
  lý do, headcount, thời điểm cần, mức ưu tiên, JD nháp, HR owner, trạng
  thái vòng đời, người đề xuất.
- **POSITION** — vị trí tuyển dụng được tạo từ request đã duyệt: JD chuẩn,
  headcount cần/đã chốt, owner, trạng thái (đang mở/tạm dừng/đã đóng),
  tham chiếu request gốc.
- **APPROVAL_DECISION** — một quyết định của approver trên request: loại
  quyết định (duyệt/từ chối/yêu cầu chỉnh), ghi chú, thời điểm.
- **RECRUITMENT_AUDIT_EVENT** — sự kiện kiểm toán: tạo/sửa/gửi/rút/hủy/
  quyết định/đổi trạng thái vị trí/điều chỉnh — ai, khi nào, trước/sau.
- **USER**, **ORG_UNIT** (tham chiếu ngoài, thuộc `org-governance`) —
  người đề xuất, owner, approver và đơn vị của request.

Chi tiết quan hệ + thuộc tính ở `srs/recruitment-planning-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- **Flow 1:** Tạo request → chuẩn hóa JD + owner → gửi duyệt → approver
  duyệt → vị trí "Đang mở".
- **Flow 2:** Hàng chờ approver → duyệt / từ chối / yêu cầu chỉnh → sửa
  gửi lại (lặp).
- **Flow 3:** Theo dõi headcount → đủ số → cảnh báo đề xuất đóng → HR
  xác nhận đóng (hoặc đóng/tạm dừng thủ công kèm lý do).
- **Flow 4:** Điều chỉnh JD/headcount trên vị trí đang mở → audit
  trước/sau → cảnh báo mâu thuẫn nếu cần.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- **request-form** — tạo/sửa đề xuất (nhu cầu + JD + owner).
- **request-list** — danh sách request của tôi/đơn vị theo trạng thái.
- **approval-queue** — hàng chờ request chờ duyệt của approver.
- **request-detail** — chi tiết request + lịch sử vòng chỉnh + quyết định.
- **position-list** — danh sách vị trí đang mở/tạm dừng/đã đóng kèm
  headcount.
- **position-detail** — JD, headcount đã chốt/còn lại, hành động tạm
  dừng/đóng/điều chỉnh, lịch sử audit.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Mọi thao tác theo organization/role/data-scope, deny by default | PRD Mục 9 — Security owner |
| Vị trí chỉ mở sau khi request được con người có thẩm quyền duyệt | PRD Mục 7.5, Mục 12 — Product owner |
| Audit cho mọi quyết định và thay đổi trạng thái | PRD Mục 9 — Security owner |
| Cảnh báo đủ headcount chỉ là đề xuất; đóng vị trí do con người quyết định | PRD Mục 12 (human-in-the-loop) — Product owner |
| Tiếng Việt là ngôn ngữ ưu tiên cho giao diện và thông báo | PRD Mục 9 |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Cơ cấu đơn vị, vai trò, phạm vi và gán vai trò approver | `org-governance` owner | Không gửi duyệt được — chặn toàn bộ luồng |
| Trạng thái "chốt tuyển" của application để đếm headcount | `candidate-pipeline` (và offer-management khi có) | FR-009 đếm sai — headcount không đáng tin |
| Gửi thông báo quá hạn/kết quả duyệt | `contextual-notifications` owner | FR-012, thông báo quyết định không đến người dùng |
| Vị trí đang mở làm đích gắn CV và form ứng viên | `cv-intake` owner (consumer) | cv-intake không có vị trí để gắn CV |
| Taxonomy kỹ năng/level gắn vị trí (P1) | `talent-framework` owner | Kỹ năng kỳ vọng của vị trí chỉ là text tự do |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Một cấp duyệt đủ cho v1; approver là vai trò gán được | FR-004/005 phải mở rộng chuỗi duyệt và hàng chờ đa cấp |
| Một request = một vị trí | ERD và FR-006 phải thêm quan hệ đợt tuyển |
| "Đã chốt" đếm từ trạng thái cuối pipeline công bố | FR-009, BR-007 và SC-05 đếm sai |
| Ngưỡng 50 headcount, 20.000 ký tự JD, 5 ngày SLA được chấp nhận | BR-004/005, E-005, SC-01 đổi giá trị |
| Vị trí đã đóng không cần mở lại trong thực tế | BR-006 phải thêm luồng khôi phục có duyệt |

## 12. Open Questions

- [x] OQ-1: Ai là cấp thẩm quyền duyệt — Resolved (đề xuất): vai trò
  "người phê duyệt tuyển dụng" gán trong `org-governance`, mặc định Head
  of HR/ủy quyền theo đơn vị — chờ Head of HR xác nhận.
- [x] OQ-2: Một request tạo mấy vị trí — Resolved (đề xuất): một; đợt
  mới tạo request mới — chờ Product owner xác nhận.
- [x] OQ-3: Nguồn đếm "đã chốt tuyển" — Resolved (đề xuất): trạng thái
  chốt do `candidate-pipeline`/offer ghi nhận — chờ Head of HR xác nhận.
- [x] OQ-4: Vị trí đủ headcount có tự đóng — Resolved: KHÔNG; cảnh báo
  đề xuất, con người quyết định (PRD Mục 12).
- [x] OQ-5: Ngưỡng số (headcount ≤50, JD ≤20.000 ký tự, SLA 5 ngày làm
  việc) — Resolved (đề xuất): dùng làm chuẩn v1 — chờ Product owner xác
  nhận.
- [x] OQ-6: Request từ chối mở lại được không — Resolved: không; tạo
  request mới tham chiếu.
- [~] OQ-7: Phê duyệt đa cấp — Out of scope v1: đưa roadmap mở rộng.
