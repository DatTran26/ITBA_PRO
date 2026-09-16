---
type: srs
feature: org-governance
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/org-governance/brainstorms/org-structure-role-scope.md
  - docs/features/org-governance/org-governance-urd.md
  - docs/_reverse/platform-communications-and-governance/reverse-spec.md
---

# org-governance — Software Requirements Specification

## 1. Scope

SRS này cover quản trị tổ chức và quyền truy cập của một tenant: cơ cấu đơn
vị dạng cây (công ty → chi nhánh → phòng ban), chức danh, catalog vai trò
chuẩn, gán thành viên kèm phạm vi dữ liệu 4 mức, quan hệ quản lý trực tiếp,
deny-by-default và nhật ký kiểm toán append-only cho hành động quan trọng.
KHÔNG cover: vòng đời tài khoản và phiên (`account-access` — feature này chỉ
gán quyền cho tài khoản đã tồn tại), hồ sơ nhân viên và vòng đời nhân sự
(`employee-profiles`, `employment-lifecycle`), policy builder tùy biến
không giới hạn và dual control (PRD "Chưa làm"/hướng P2), rule quyền trên
từng đối tượng nghiệp vụ cụ thể (module nghiệp vụ tự áp role/scope do
feature này cung cấp) và log vận hành kỹ thuật.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Admin | người | Dựng cơ cấu, gán vai trò/phạm vi, xác minh quyền, truy vết audit | Có |
| Quản lý / HR / interviewer / nhân viên | người | Làm việc trong phạm vi được gán; bị từ chối rõ ràng ngoài phạm vi | Có (là đối tượng của rule quyền) |
| Security/audit owner | người | Điều tra sự cố truy cập qua nhật ký kiểm toán | Có |
| `account-access` | hệ thống (feature khác) | Cung cấp tài khoản + trạng thái; nhận yêu cầu thu hồi phiên khi gán kết thúc | Không (dependency hai chiều) |
| Module nghiệp vụ (pipeline, assessment, document...) | hệ thống (feature khác) | Đọc role/scope của người dùng để quyết định cho phép/từ chối | Không (consumer của dữ liệu feature này) |
| Ứng viên | người | Không có tài khoản, không được gán vai trò | Không |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-org-governance-001 | Quản lý cây đơn vị | Hệ thống phải cho admin tạo/sửa/xem cây đơn vị trong tổ chức: đúng 1 công ty gốc, chi nhánh và phòng ban có đơn vị cha cùng tổ chức, mã duy nhất, không tạo chu trình, độ sâu tối đa 5 cấp; sơ đồ cây hiển thị kèm số thành viên đang gán | P0 | test | PRD Mục 7.2 (cơ cấu tổ chức); brainstorm Mục 5.1, 7.2 |
| FR-org-governance-002 | Ngừng và mở lại đơn vị | Khi admin ngừng một đơn vị, hệ thống phải chặn nếu còn thành viên có gán ACTIVE trong đơn vị đó hoặc đơn vị con; đơn vị ngừng không nhận gán mới, vẫn hiển thị trong cây với cảnh báo; admin mở lại được | P0 | test | brainstorm Mục 6.1 (D10), 6.3 |
| FR-org-governance-003 | Quản lý chức danh | Hệ thống phải cho admin tạo/sửa/ngừng/mở lại chức danh trong tổ chức (mã + tên duy nhất); chặn ngừng khi còn gán ACTIVE dùng chức danh đó | P0 | test | PRD Mục 7.2 (chức danh); brainstorm Mục 5.1 |
| FR-org-governance-004 | Catalog vai trò chuẩn | Hệ thống phải cung cấp catalog 6 vai trò chuẩn (quản trị viên, HR, lãnh đạo, quản lý, interviewer, nhân viên), mỗi vai trò gắn phạm vi dữ liệu mặc định; catalog chỉ đọc — admin không tạo/sửa vai trò trong v1 | P0 | kiểm tra | PRD Mục 7.2 (role/scope), "Chưa làm" (policy builder); brainstorm Mục 6.2 |
| FR-org-governance-005 | Gán thành viên | Khi admin gán, hệ thống phải kiểm tra tài khoản tồn tại và thuộc tổ chức, đơn vị + chức danh đang ACTIVE, vai trò trong catalog, người quản lý (bắt buộc với nhân viên/interviewer) là tài khoản ACTIVE khác chính người được gán và không tạo chu trình báo cáo; rồi suy ra phạm vi dữ liệu và tạo gán ACTIVE kèm audit | P0 | test | PRD Mục 7.2 (luồng chính); brainstorm Mục 5.2 |
| FR-org-governance-006 | Gán cho tài khoản chưa kích hoạt | Hệ thống phải cho gán vai trò/đơn vị cho tài khoản INVITED; quyền chỉ phát huy khi tài khoản ACTIVE, kèm thông báo cho admin biết | P1 | demo | brainstorm Mục 6.5; URD Mục 6 |
| FR-org-governance-007 | Phạm vi dữ liệu 4 mức | Hệ thống phải hỗ trợ 4 mức phạm vi: toàn tổ chức / đơn vị mình + đơn vị con / chỉ đơn vị mình / chỉ dữ liệu của bản thân, suy ra từ vai trò + đơn vị được gán; khi người dùng có nhiều gán ACTIVE (tối đa 5), phạm vi hiệu dụng là hợp nhất rộng nhất | P0 | test | brainstorm Mục 4, 6.2; OQ-2 URD |
| FR-org-governance-008 | Deny-by-default | Nếu người dùng không có gán ACTIVE nào thì hệ thống phải từ chối mọi truy cập nghiệp vụ với thông báo rõ và ghi nhận lượt từ chối | P0 | test | brainstorm Mục 4, 6.1 (D6); PRD Mục 9 |
| FR-org-governance-009 | Điều chuyển và kết thúc gán | Khi admin đổi đơn vị/vai trò/quản lý hoặc kết thúc gán, hệ thống phải bắt buộc lý do, kiểm tra ràng buộc (không mất admin cuối cùng, không chu trình báo cáo), áp dụng ngay và ghi audit trước/sau; kết thúc gán phải thu hồi phiên đang sống của người đó qua `account-access` | P0 | test | PRD Mục 7.2 (luồng chính); brainstorm Mục 5.5 |
| FR-org-governance-010 | Nhật ký kiểm toán append-only | Hệ thống phải ghi nhật ký cho mọi hành động quan trọng (gán/sửa/kết thúc quyền, tạo/sửa/ngừng đơn vị & chức danh, duyệt nghiệp vụ, xuất dữ liệu, đọc/xuất nhật ký, lượt từ chối quyền) đủ 6 trường: ai — làm gì — lên gì — trước/sau — lý do — khi nào; bản ghi chỉ thêm, không sửa/xóa | P0 | test | PRD Mục 7.2 (audit hành động quan trọng); reverse spec FR-PL-06 |
| FR-org-governance-011 | Lọc và xem nhật ký | Hệ thống phải cho admin/security owner lọc nhật ký theo người thực hiện, loại hành động, đối tượng và khoảng thời gian (mặc định 30 ngày gần nhất), mở chi tiết từng bản ghi | P0 | demo | brainstorm Mục 5.4, 7.2 |
| FR-org-governance-012 | Hành động quan trọng không thiếu audit | Nếu việc ghi audit thất bại trong một hành động quan trọng, thì hệ thống phải hủy hành động đó và báo admin — không cho phép hành động quan trọng thiếu vết | P0 | test | brainstorm Mục 6.4 |
| FR-org-governance-013 | Chặn mất admin cuối cùng | Khi một thao tác gán/gỡ quyền làm tổ chức không còn ai giữ vai trò admin, hệ thống phải chặn thao tác đó | P0 | test | brainstorm Mục 6.1 (D8) |
| FR-org-governance-014 | Kiểm chứng quyền (preview) | Hệ thống phải cho admin chọn một vai trò/đơn vị và xem trước người đó sẽ thấy/không thấy gì, phục vụ xác minh bằng test account trước pilot | P1 | demo | PRD Mục 7 (hành trình Admin bước 2); brainstorm Mục 4 (P1); URD UN-007 |
| FR-org-governance-015 | Import cơ cấu hàng loạt | Khi admin tải file theo mẫu, hệ thống phải kiểm tra từng dòng (mã, cha tồn tại, không chu trình), tạo dòng hợp lệ và báo lỗi theo dòng cho dòng không hợp lệ | P1 | test | brainstorm Mục 4 (P1), 7.2; URD UN-008 |
| FR-org-governance-016 | Cảnh báo vận hành quyền | Hệ thống phải hiển thị cảnh báo: tài khoản ACTIVE không có gán, đơn vị không có quản lý, vai trò admin chỉ còn 1 người | P1 | demo | brainstorm Mục 4 (P1); URD UN-009 |
| FR-org-governance-017 | Ngày hiệu lực trên gán | Hệ thống phải lưu ngày hiệu lực bắt đầu/kết thúc trên mỗi gán để truy vết; lên lịch điều chuyển tương lai (trạng thái chờ hiệu lực) là slice mở rộng | P1 | kiểm tra | brainstorm Mục 4 (P1); OQ-6 URD |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-org-governance-001 | security | Deny-by-default trên mọi quyết định truy cập: không gán hợp lệ = không quyền nghiệp vụ; lượt từ chối luôn được ghi nhận | P0 | 0 sự cố vượt organization/role/data-scope được xác nhận (guardrail M-GR-01) |
| NFR-org-governance-002 | consistency | Role/scope đọc từ một nguồn duy nhất: mọi module nghiệp vụ nhận cùng kết quả phạm vi cho cùng một người | P0 | Kiểm tra 2 module bất kỳ quyết định giống nhau trên cùng tài khoản + dữ liệu |
| NFR-org-governance-003 | auditability | 100% hành động trong danh sách "quan trọng" có audit record đủ 6 trường; nhật ký không có thao tác sửa/xóa trên mọi vai trò | P0 | Đối chiếu mẫu hành động với bản ghi; thử sửa/xóa bản ghi đều bị từ chối |
| NFR-org-governance-004 | performance | Người dùng không nhận thấy độ trễ khi hệ thống quyết định quyền trong thao tác nghiệp vụ ở quy mô pilot | P1 | Quyết định phạm vi trong ≤1 giây với tổ chức ≤300 người, cây ≤5 cấp (đề xuất — OQ-7 spec) |
| NFR-org-governance-005 | usability | Giao diện quản trị và thông báo lỗi tiếng Việt; admin hiểu được lý do bị chặn mà không cần tra tài liệu kỹ thuật | P0 | Kiểm tra wording theo bảng mẫu của brainstorm |
| NFR-org-governance-006 | data-retention | Nhật ký kiểm toán giữ tối thiểu 12 tháng rolling; không xóa cứng đơn vị/chức danh/gán trong v1 | P1 | Retention chính thức chờ DPO duyệt (OQ-3, liên quan OQ-6 PRD) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-org-governance-001 | Một tổ chức có đúng 1 đơn vị công ty gốc; mọi đơn vị khác phải có cha trong cây | Khi tạo đơn vị | FR-org-governance-001 | brainstorm Mục 4 |
| BR-org-governance-002 | Mã đơn vị/chức danh duy nhất trong tổ chức, không phân biệt hoa thường | Khi tạo/sửa mã | FR-org-governance-001, FR-org-governance-003 | brainstorm Mục 7.1 |
| BR-org-governance-003 | Không tạo chu trình trong cây đơn vị và trong quan hệ báo cáo | Khi chọn đơn vị cha/người quản lý | FR-org-governance-001, FR-org-governance-005 | brainstorm Mục 6.1 (D2, D9) |
| BR-org-governance-004 | Không ngừng/xóa đơn vị hay chức danh đang còn gán ACTIVE — phải chuyển hoặc kết thúc gán trước | Khi admin ngừng đơn vị/chức danh | FR-org-governance-002, FR-org-governance-003 | brainstorm Mục 4, 6.1 (D10) |
| BR-org-governance-005 | Một gán = 1 vai trò trong catalog chuẩn; phạm vi suy ra từ vai trò + đơn vị, không nhập tay | Khi tạo/sửa gán | FR-org-governance-005, FR-org-governance-007 | brainstorm Mục 5.2, 7.1 |
| BR-org-governance-006 | Người quản lý trực tiếp tối đa 1, là tài khoản ACTIVE cùng tổ chức, khác người được gán; bắt buộc với vai trò nhân viên/interviewer | Khi gán/đổi quản lý | FR-org-governance-005 | brainstorm Mục 7.1 |
| BR-org-governance-007 | Lý do (5–500 ký tự) bắt buộc khi kết thúc gán, đổi vai trò, đổi phạm vi, ngừng đơn vị/chức danh | Khi lưu các thao tác trên | FR-org-governance-002, FR-org-governance-003, FR-org-governance-009 | brainstorm Mục 7.1 |
| BR-org-governance-008 | Kết thúc gán hoặc thu hẹp quyền áp dụng ngay và thu hồi phiên đang sống | Khi gán ENDED hoặc scope giảm | FR-org-governance-009 | brainstorm Mục 5.5; `account-access` BR-010 |
| BR-org-governance-009 | Tổ chức phải luôn còn ≥1 người giữ vai trò admin | Khi thao tác làm giảm số admin | FR-org-governance-013 | brainstorm Mục 6.1 (D8) |
| BR-org-governance-010 | Nhật ký kiểm toán là append-only — không ai (kể cả admin) sửa/xóa bản ghi | Mọi thao tác trên nhật ký | FR-org-governance-010 | brainstorm Mục 4, 6.3 |
| BR-org-governance-011 | Gán cho tài khoản INVITED hợp lệ nhưng quyền chỉ phát huy khi tài khoản ACTIVE | Khi gán và khi xác thực | FR-org-governance-006 | brainstorm Mục 6.5 |
| BR-org-governance-012 | V1 không xóa cứng đơn vị/chức danh/gán — chỉ INACTIVE/ENDED để giữ truy vết | Khi có yêu cầu xóa | FR-org-governance-002, FR-org-governance-009 | brainstorm Mục 6.5 |
| BR-org-governance-013 | Admin có thể tự gán quyền cho mình — không chặn nhưng mọi thay đổi đều audit | Khi admin gán cho chính mình | FR-org-governance-005, FR-org-governance-010 | brainstorm Mục 6.5 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-org-governance-001 | Mã đơn vị/chức danh trùng | Tạo mã đã tồn tại trong tổ chức | minor | FR-org-governance-001, FR-org-governance-003 | Hiện "Mã {mã} đã tồn tại trong tổ chức" | Đổi mã khác |
| E-org-governance-002 | Chu trình cây đơn vị | Chọn cha là con của chính nó | major | FR-org-governance-001 | Hiện "Không thể chọn {đơn vị} làm cha — sẽ tạo vòng lặp trong cơ cấu" | Chọn cha khác |
| E-org-governance-003 | Ngừng đơn vị còn thành viên | Ngừng đơn vị/nhánh còn gán ACTIVE | major | FR-org-governance-002 | Hiện "Đơn vị còn {số} thành viên đang hoạt động — chuyển họ trước khi ngừng" | Chuyển thành viên trước |
| E-org-governance-004 | Gán tài khoản không hợp lệ | Tài khoản không ACTIVE/INVITED hoặc khác tổ chức | major | FR-org-governance-005 | Hiện "Tài khoản không hợp lệ để gán" | Kiểm tra trạng thái tài khoản |
| E-org-governance-005 | Đơn vị/chức danh đã ngừng | Chọn giá trị INACTIVE khi gán | minor | FR-org-governance-005 | Hiện "Đơn vị/chức danh đã ngừng hoạt động — chọn giá trị khác" | Chọn giá trị active |
| E-org-governance-006 | Quản lý là chính mình | Chọn người quản lý = người được gán | minor | FR-org-governance-005 | Hiện "Người quản lý không thể là chính người được gán" | Chọn người khác |
| E-org-governance-007 | Chu trình báo cáo | Đổi quản lý tạo vòng A→B→A | major | FR-org-governance-005, FR-org-governance-009 | Hiện "Không thể gán — thay đổi này tạo vòng lặp quản lý" | Chọn quản lý khác |
| E-org-governance-008 | Mất admin cuối cùng | Gỡ/thu hẹp quyền của admin duy nhất | critical | FR-org-governance-013 | Hiện "Không thể thực hiện — đây là quản trị viên cuối cùng của tổ chức" | Gán admin khác trước |
| E-org-governance-009 | Vượt phạm vi dữ liệu | Thao tác ngoài scope hiệu dụng | major | FR-org-governance-008 | Hiện "Bạn không có quyền thực hiện thao tác này" | Xin admin cấp quyền; lượt từ chối đã ghi nhận |
| E-org-governance-010 | Tài khoản chưa được gán | Đăng nhập khi không có gán ACTIVE | major | FR-org-governance-008 | Hiện "Tài khoản này chưa được gán vai trò — hiện không có quyền nghiệp vụ" | Admin tạo gán |
| E-org-governance-011 | Thiếu lý do | Lưu thao tác nhạy cảm không lý do | minor | FR-org-governance-009 | Hiện "Vui lòng nhập lý do thay đổi (tối thiểu 5 ký tự)" | Nhập lý do rồi lưu lại |
| E-org-governance-012 | Dòng import lỗi | Dòng thiếu mã, cha không tồn tại, tạo chu trình | minor | FR-org-governance-015 | Báo "Dòng {n}: {lý do} — dòng này chưa được tạo" | Sửa file, tải lại phần lỗi |
| E-org-governance-013 | Audit ghi thất bại | Ghi nhật ký lỗi giữa hành động quan trọng | critical | FR-org-governance-012 | Hành động bị hủy + báo admin hệ thống chưa ghi nhận được | Retry khi audit khôi phục; báo vận hành |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-org-governance-01 | Không sự cố vượt phạm vi | Số incident vượt organization/role/data-scope (M-GR-01) | 0 sự cố xác nhận (guardrail cứng) |
| SC-org-governance-02 | Audit đầy đủ cho hành động quan trọng | Tỷ lệ bản ghi đủ 6 trường trên mẫu kiểm tra | 100% |
| SC-org-governance-03 | Bootstrap tenant nhanh | Thời gian dựng cơ cấu tối thiểu (công ty + 2 chi nhánh + 5 phòng ban + 10 chức danh) | < 60 phút (đề xuất — chờ sponsor) |
| SC-org-governance-04 | Lượt từ chối quyền truy vết được | Tỷ lệ lượt từ chối có bản ghi trong nhật ký | 100% trong 12 tháng |
| SC-org-governance-05 | Ranh giới kiểm chứng trước pilot | Tỷ lệ ô vai trò × phạm vi khớp kỳ vọng trong checklist test account | 100% trước khi mở dữ liệu thật |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Tổ chức (ORGANIZATION)__ — tenant khách hàng B2B; gốc của mọi dữ liệu
  cơ cấu, gán và nhật ký.
- __Đơn vị (ORG_UNIT)__ — cây công ty/chi nhánh/phòng ban có cha, mã duy
  nhất, trạng thái; tham chiếu bởi mọi module khi lọc phạm vi.
- __Chức danh (POSITION)__ — danh mục chức danh của tổ chức.
- __Vai trò (ROLE)__ — catalog 6 vai trò chuẩn của sản phẩm gắn phạm vi
  mặc định; entity nền các feature khác tham chiếu.
- __Gán thành viên (ASSIGNMENT)__ — liên kết người dùng ↔ đơn vị + chức
  danh + vai trò + người quản lý, mang phạm vi hiệu dụng và ngày hiệu lực;
  entity nền các feature khác tham chiếu khi cần biết người thuộc đơn vị/
  vai trò nào.
- __Sự kiện kiểm toán (AUDIT_EVENT)__ — nhật ký append-only cho hành động
  quan trọng và lượt từ chối quyền.
- __Người dùng (USER)__ — tài khoản nội bộ; entity do `account-access` sở
  hữu, chỉ tham chiếu.

Chi tiết quan hệ + thuộc tính ở `srs/org-governance-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Dựng cây đơn vị + chức danh → sơ đồ sẵn sàng gán người.
- __Flow 2:__ Gán thành viên → kiểm tra ràng buộc → suy ra phạm vi → gán
  ACTIVE + audit → người được gán có quyền từ phiên kế tiếp.
- __Flow 3:__ Thao tác nghiệp vụ → lấy phạm vi hiệu dụng → cho phép hoặc
  từ chối + ghi nhận.
- __Flow 4:__ Điều chuyển/kết thúc gán → lý do → ràng buộc → áp dụng →
  audit trước/sau → thu hồi phiên.
- __Flow 5:__ Truy vết nhật ký: lọc → xem chi tiết → (không sửa/xóa).
- __Flow 6:__ Kiểm chứng quyền bằng test account/preview trước pilot.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __org-tree__ — sơ đồ cây đơn vị + số thành viên + cảnh báo cha ngừng.
- __position-list__ — danh mục chức danh và trạng thái.
- __assignment-form__ — gán/sửa/kết thúc gán kèm lý do bắt buộc.
- __member-access-view__ — phạm vi hiệu dụng của một người (vai trò, đơn
  vị, quản lý).
- __audit-log__ — nhật ký kiểm toán + bộ lọc + chi tiết trước/sau.
- __access-preview__ — chế độ kiểm chứng quyền theo vai trò/đơn vị (P1).
- __org-import__ — tải file mẫu cơ cấu + kết quả theo dòng (P1).

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Quyền truy cập theo vai trò/tổ chức/phạm vi là product constraint, không phải tùy chọn | PRD Mục 4, Mục 9 — Security owner |
| Deny-by-default và audit boundary trên mọi module | PRD Mục 9 — Security owner |
| Human-in-the-loop: audit ghi nhận quyết định của người, không thay quyết định | PRD Mục 12 — Product owner |
| Guardrail 0 sự cố vượt scope (M-GR-01) | PRD Mục 8 — Security owner |
| Nhật ký kiểm toán tách log vận hành kỹ thuật | Brainstorm Mục 8 (security.md) — Security owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |
| Ngôn ngữ giao diện tiếng Việt ưu tiên | PRD Mục 9 — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Tài khoản + trạng thái (ACTIVE/INVITED...) | `account-access` | FR-org-governance-005 không có đối tượng gán |
| Thu hồi phiên khi kết thúc gán/vô hiệu | `account-access` | BR-org-governance-008 — quyền thừa trong phiên sống |
| Kênh cảnh báo vận hành (admin notices) | `contextual-notifications` | FR-org-governance-016 chỉ hiển thị trong màn quản trị |
| Tenant provisioning (tạo ORGANIZATION gốc) | Vận hành nền tảng / Product owner | Không có tổ chức để dựng cây |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Mỗi tài khoản thuộc đúng 1 tổ chức | Mọi FR gán/phạm vi cần thêm bước chọn tổ chức |
| Catalog 6 vai trò chuẩn đủ cho v1 | FR-org-governance-004 phải mở tạo vai trò |
| Đa gán ACTIVE tối đa 5, phạm vi hiệu dụng = hợp nhất rộng nhất | FR-org-governance-007 đổi rule hợp nhất hoặc giới hạn |
| Danh sách "hành động quan trọng" tối thiểu như BR/NFR-003 | FR-org-governance-010 thiếu hoặc thừa phạm vi audit |
| Lãnh đạo = đọc toàn tổ chức + duyệt, không sửa chi tiết | ROLE catalog và scenario matrix đổi |
| Giới hạn đề xuất: cây ≤5 cấp, ≤5 gán/tài khoản, import ≤500 dòng, 50 bản ghi/trang, lọc mặc định 30 ngày | FR-org-governance-001/007/011/015 và NFR-004 đổi ngưỡng |

## 12. Open Questions

- [x] OQ-1: Ai duyệt role×permission matrix chính thức (OQ-PL-01 reverse
  spec)? — Resolved (đề xuất): Security owner duyệt cùng Head of HR;
  catalog 6 vai trò + phạm vi mặc định theo scenario matrix là bản v1 —
  chờ hai owner xác nhận.
- [x] OQ-2: Một người được gán nhiều đơn vị/vai trò đồng thời trong v1? —
  Resolved (đề xuất): được, tối đa 5 gán ACTIVE đồng thời; phạm vi hiệu
  dụng là hợp nhất rộng nhất — chờ Product owner xác nhận.
- [x] OQ-3: Retention/redact cho nhật ký kiểm toán (OQ-6 PRD, OQ-PL-04)?
  — Resolved (đề xuất): giữ tối thiểu 12 tháng rolling, append-only, không
  redact actor/action; chỉ admin/security owner xem — chờ DPO/legal xác
  nhận.
- [x] OQ-4: Danh sách "hành động quan trọng" bắt buộc audit, ai chốt? —
  Resolved (đề xuất): danh sách tối thiểu tại FR-org-governance-010 — chờ
  Security owner chốt.
- [x] OQ-5: Lãnh đạo khác quản lý thế nào về phạm vi? — Resolved (đề
  xuất): lãnh đạo đọc toàn tổ chức + duyệt theo quy trình, không sửa hồ
  sơ chi tiết; quản lý thấy đơn vị mình + con — chờ Head of HR xác nhận.
- [x] OQ-6: Trạng thái "chờ hiệu lực" cho gán/điều chuyển trong v1? —
  Resolved (đề xuất): v1 lưu ngày hiệu lực để truy vết; lên lịch tự động
  thuộc slice mở rộng — chờ Product owner xác nhận.
- [x] OQ-7: Ngưỡng hiệu năng quyết định phạm vi (≤1 giây ở quy mô pilot)?
  — Resolved (đề xuất): giữ như acceptance của NFR-org-governance-004 —
  chờ Technical owner xác nhận.
