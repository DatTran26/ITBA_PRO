---
type: srs
feature: employment-lifecycle
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/employment-lifecycle/brainstorms/contract-and-status-transitions.md
  - docs/features/employment-lifecycle/employment-lifecycle-urd.md
  - docs/_reverse/talent-and-crm/reverse-spec.md
---

# employment-lifecycle — Software Requirements Specification

## 1. Scope

SRS này cover vòng đời việc làm của một nhân viên trong tổ chức: bản ghi
employment gắn 1-1 với hồ sơ HOAT_DONG, chuỗi hợp đồng lao động, thay đổi
vòng đời có phê duyệt (bắt đầu làm việc, kết thúc thử việc, tạm nghỉ, quay
lại, điều chuyển, nghỉ việc, gia hạn/ký hợp đồng mới), checklist bàn giao,
tài liệu đính kèm qua `document-intake`, nhắc hạn, đồng bộ sang
`employee-profiles` và audit đầy đủ.

Đây là feature `Could` trong Feature Map — KHÔNG thuộc cam kết pilot v1;
spec này chuẩn bị cho slice Core HR sau `employee-profiles` (PRD Mục 6.1,
Mục 7.4).

KHÔNG cover: chữ ký số và payroll integration (PRD "Chưa làm"), tạo/quản lý
hồ sơ nhân viên (`employee-profiles`), checklist ngày đầu người mới
(`employee-onboarding`), định nghĩa đơn vị/chức danh/quyền (`org-governance`),
sinh văn bản từ mẫu và gia hạn hàng loạt (P2), đánh giá hiệu suất như
trigger tự động (`employee-evaluation` chỉ là tài liệu tham chiếu).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Tạo thay đổi, quản lý hợp đồng, theo dõi checklist và nhắc hạn | Có |
| Quản lý | người | Đề xuất điều chuyển/nghỉ việc/tạm nghỉ cho người trong scope | Có |
| Approver (HR lead/Head of HR) | người | Duyệt/từ chối/trả về thay đổi trong hàng chờ | Có |
| Nhân viên | người | Xem trạng thái vòng đời và tài liệu của mình (phần được phép) | Có (chỉ đọc, phạm vi bản thân) |
| Owner checklist | người | Hoàn tất đầu việc bàn giao được giao | Có |
| Admin | người | Truy vết audit, xử lý sự cố quyền | Có (hạn chế) |
| `employee-profiles` | hệ thống | Cung cấp hồ sơ HOAT_DONG; nhận tín hiệu LUU_TRU/cập nhật đơn vị | Có — dependency |
| `org-governance` | hệ thống | Đơn vị, chức danh, role/scope approver, audit | Có — dependency |
| `document-intake` | hệ thống | Cổng duy nhất đưa tài liệu đính kèm vào | Có — dependency |
| `contextual-notifications` | hệ thống | Nhắc hạn, thông báo duyệt/hiệu lực/checklist | Có — dependency |
| `account-access` | hệ thống | Danh bạ người dùng; khóa tài khoản khi nghỉ việc (P1) | Có — dependency |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-employment-lifecycle-001 | Tạo việc làm trên hồ sơ hoạt động | Khi hồ sơ nhân viên ở trạng thái HOAT_DONG, hệ thống phải cho HR tạo một bản ghi việc làm gắn 1-1 với hồ sơ đó, khởi tạo ở trạng thái HOP_DONG kèm hợp đồng đầu tiên; một hồ sơ chỉ có đúng một việc làm | P0 | test | brainstorm Mục 4, 6.3; URD UN-001 |
| FR-employment-lifecycle-002 | Quản lý hợp đồng | Khi HR thêm hợp đồng (loại: thử việc / xác định thời hạn / không xác định thời hạn; số hợp đồng, ngày ký, hiệu lực từ–đến, file đính kèm), hệ thống phải kiểm tra số hợp đồng duy nhất trong tổ chức và hiệu lực đến > hiệu lực từ (trừ loại không xác định được trống ngày kết thúc) | P0 | test | brainstorm Mục 5.5, 7.1; URD UN-006 |
| FR-employment-lifecycle-003 | Một hợp đồng hiện hành | Khi hợp đồng mới có hiệu lực, hệ thống phải chuyển hợp đồng hiện hành cũ sang THAY_THE và giữ chuỗi thay thế; tại một thời điểm chỉ một hợp đồng ở trạng thái hiện hành trên mỗi việc làm | P0 | test | brainstorm Mục 5.5; URD UN-006 |
| FR-employment-lifecycle-004 | Tạo thay đổi vòng đời | Khi HR/quản lý trong scope tạo thay đổi, hệ thống phải ghi loại thay đổi, ngày hiệu lực, lý do và trường đích (đơn vị/vị trí/manager mới khi điều chuyển; ngày dự kiến quay lại khi tạm nghỉ) ở trạng thái NHAP | P0 | test | PRD Mục 7.4; brainstorm Mục 5.1; URD UN-001 |
| FR-employment-lifecycle-005 | Kiểm tra hợp lệ theo trạng thái | Khi tạo/gửi duyệt thay đổi, hệ thống phải kiểm tra loại thay đổi có trong transition matrix của trạng thái việc làm hiện tại (vd "kết thúc thử việc" chỉ khi đang THU_VIEC; đang TAM_NGHI chỉ cho "quay lại" hoặc "nghỉ việc") | P0 | test | brainstorm Mục 6.1 (D1), 6.3, 7.1; URD UN-002 |
| FR-employment-lifecycle-006 | Một thay đổi chờ mỗi việc làm | Nếu việc làm đã có thay đổi ở CHO_DUYET hoặc DA_DUYET chờ hiệu lực, thì hệ thống phải chặn tạo mới và hiển thị thay đổi đang chờ | P0 | test | brainstorm Mục 6.1 (D2), 7.2; URD UN-002 |
| FR-employment-lifecycle-007 | Gửi duyệt có điều kiện | Khi người tạo gửi duyệt, hệ thống phải kiểm tra đủ trường bắt buộc và tài liệu bắt buộc theo loại thay đổi rồi chuyển CHO_DUYET và đưa vào hàng chờ của approver phù hợp | P0 | test | PRD Mục 7.4 (luồng chính); brainstorm Mục 6.1 (D3); URD UN-003 |
| FR-employment-lifecycle-008 | Hàng chờ và quyết định duyệt | Khi approver mở hàng chờ, hệ thống phải hiển thị thay đổi kèm loại, ngày hiệu lực, lý do, tài liệu và checklist; khi approver quyết định, hệ thống phải ghi DA_DUYET, TU_CHOI (kèm ghi chú) hoặc trả về NHAP kèm người duyệt và thời điểm | P0 | test | PRD Mục 7.4; brainstorm Mục 6.1 (D4); URD UN-004 |
| FR-employment-lifecycle-009 | Chặn tự duyệt | Nếu người đề xuất trùng người duyệt và tổ chức còn approver khác hợp lệ, thì hệ thống phải chặn và hướng dẫn chuyển người duyệt; khi tổ chức chỉ có 1 approver thì cho phép và gắn cờ "tự duyệt" trong audit | P0 | test | brainstorm Mục 6.1 (D9); URD Mục 6 |
| FR-employment-lifecycle-010 | Áp dụng hiệu lực đúng ngày | Khi đến ngày hiệu lực của thay đổi DA_DUYET, hệ thống phải áp dụng trạng thái việc làm mới, chuyển thay đổi sang HIEU_LUC, ghi audit trước → sau và thông báo các bên liên quan; ngày hiệu lực chưa đến thì giữ chờ | P0 | test | PRD Mục 7.4; brainstorm Mục 6.1 (D5); URD UN-005 |
| FR-employment-lifecycle-011 | Hủy thay đổi đã duyệt trước hiệu lực | Khi thay đổi DA_DUYET chưa đến ngày hiệu lực, hệ thống phải cho người có quyền hủy kèm lý do và chuyển trạng thái HUY | P0 | test | brainstorm Mục 6.3; URD Mục 6 |
| FR-employment-lifecycle-012 | Backdate có kiểm soát | Nếu ngày hiệu lực trong quá khứ (≤90 ngày — đề xuất OQ-6), thì hệ thống phải yêu cầu lý do bắt buộc, gắn cờ audit "backdated" và áp dụng ngay sau khi duyệt | P0 | test | brainstorm Mục 6.1 (D7), 7.1; URD UN-011 |
| FR-employment-lifecycle-013 | Checklist theo loại thay đổi | Khi thay đổi được tạo, hệ thống phải sinh checklist mặc định theo loại (vd nghỉ việc: thu hồi thiết bị, bàn giao công việc, quyết toán, khóa tài khoản) với tiêu đề, owner và hạn từng đầu việc; owner xác nhận hoàn tất từng đầu việc | P0 | test | PRD Mục 7.4 (checklist); brainstorm Mục 5.2; URD UN-008 |
| FR-employment-lifecycle-014 | Checklist chưa xong không chặn hiệu lực | Khi thay đổi có hiệu lực mà checklist chưa hoàn tất, hệ thống vẫn áp dụng hiệu lực nhưng gắn cờ "checklist chưa hoàn tất" và tiếp tục nhắc owner (đề xuất — OQ-2) | P0 | test | brainstorm Mục 6.1 (D6); URD J2 |
| FR-employment-lifecycle-015 | Tài liệu đính kèm qua document-intake | Hệ thống phải cho đính kèm tài liệu trên việc làm/thay đổi thông qua `document-intake`, kiểm tra tài liệu bắt buộc theo loại thay đổi khi gửi duyệt và áp quyền xem theo vai trò (nhân viên chỉ thấy tài liệu của mình phần được phép) | P0 | test | PRD Mục 7.4 (tài liệu); brainstorm Mục 4, 6.1 (D8); URD UN-009 |
| FR-employment-lifecycle-016 | Nhắc hạn | Hệ thống phải gửi nhắc qua `contextual-notifications`: trước 7 ngày khi sắp hết thử việc, trước 30 ngày khi hợp đồng sắp hết hạn, khi checklist quá hạn, khi thay đổi DA_DUYET chờ hiệu lực quá hạn áp dụng, và nhắc approver khi thay đổi chờ duyệt quá SLA 2 ngày làm việc (đề xuất — OQ-7) | P0 | test | brainstorm Mục 5.5, 7.2; URD UN-007 |
| FR-employment-lifecycle-017 | Cảnh báo hợp đồng quá hạn | Khi hợp đồng qua ngày kết thúc mà chưa có thay đổi gia hạn/chấm dứt, hệ thống phải hiển thị cảnh báo "hợp đồng quá hạn" liên tục cho tới khi được xử lý; hệ thống không tự đổi trạng thái việc làm | P0 | test | brainstorm Mục 5.5, 6.5; URD J4 |
| FR-employment-lifecycle-018 | Đồng bộ sang employee-profiles | Khi nghỉ việc có hiệu lực, hệ thống phải báo `employee-profiles` chuyển hồ sơ sang LUU_TRU; khi điều chuyển có hiệu lực và được xác nhận, hệ thống phải báo cập nhật đơn vị/vị trí/manager trên hồ sơ | P0 | test | brainstorm Mục 4, 5.3; URD UN-012 |
| FR-employment-lifecycle-019 | Xác nhận hoàn tất điều chuyển | Khi thay đổi điều chuyển có hiệu lực, hệ thống phải đặt trạng thái DIEU_CHUYEN chờ xác nhận bàn giao; khi người có quyền xác nhận hoàn tất, trạng thái chuyển CHINH_THUC dưới đơn vị mới và đồng bộ hồ sơ | P0 | test | brainstorm Mục 5.3, 6.3; URD J3 |
| FR-employment-lifecycle-020 | Nhân viên tự xem | Hệ thống phải cho nhân viên xem trạng thái vòng đời hiện tại, lịch sử vòng đời và tài liệu của chính mình (phần được phép); tài liệu nội bộ HR không hiển thị | P1 | demo | PRD JTBD-EMP-01; brainstorm Mục 6.2; URD UN-010 |
| FR-employment-lifecycle-021 | Audit đầy đủ | Hệ thống phải ghi audit cho mọi sự kiện: tạo việc làm, thêm/thay thế hợp đồng, tạo/gửi/duyệt/từ chối/trả về/hủy thay đổi, áp dụng hiệu lực (trước → sau), hoàn tất checklist item, backdate, tự duyệt ngoại lệ, truy cập tài liệu bị từ chối | P0 | kiểm tra | PRD Mục 7.4 (evidence), Mục 9; URD UN-009 |
| FR-employment-lifecycle-022 | Timeline lịch sử vòng đời | Hệ thống phải hiển thị timeline các trạng thái việc làm đã qua trên hồ sơ (gồm cả giai đoạn tạm nghỉ khi nghỉ việc từ TAM_NGHI) | P1 | demo | brainstorm Mục 4 (P1); URD J5 |
| FR-employment-lifecycle-023 | Báo cáo vận hành | Hệ thống phải cung cấp danh sách: sắp hết thử việc, sắp hết hạn hợp đồng, thay đổi quá hạn, checklist chưa hoàn tất — theo phạm vi quyền | P1 | demo | brainstorm Mục 4 (P1) |
| FR-employment-lifecycle-024 | Khóa tài khoản khi nghỉ việc | Khi nghỉ việc có hiệu lực, hệ thống phải báo `account-access` khóa tài khoản liên kết của nhân viên (nếu có) | P1 | kiểm tra | brainstorm Mục 4 (P1); URD UN-012 |
| FR-employment-lifecycle-025 | Mẫu checklist cấu hình | Hệ thống phải cho người có quyền cấu hình checklist mặc định và tài liệu bắt buộc theo từng loại thay đổi của tổ chức | P1 | demo | brainstorm Mục 4 (P1); URD Mục 8 (catalog Head of HR) |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-employment-lifecycle-001 | human-in-the-loop | 100% chuyển trạng thái việc làm đi qua thay đổi có approver ghi nhận — không có đường sửa trạng thái trực tiếp và không có tác nhân tự động nào ra quyết định thay người | P0 | Audit mọi việc làm đổi trạng thái đều trỏ một thay đổi HIEU_LUC có người duyệt (guardrail bám PRD Mục 12) |
| NFR-employment-lifecycle-002 | permission | Truy cập việc làm/hợp đồng/tài liệu theo organization/role/data-scope, deny-by-default; nhân viên chỉ đọc phạm vi bản thân | P0 | Access test: người ngoài phạm vi bị từ chối và có audit; 0 incident vượt scope (bám M-GR-01) |
| NFR-employment-lifecycle-003 | auditability | Mọi chuyển trạng thái truy vết được đầy đủ ai đề xuất → ai duyệt → hiệu lực khi nào → trước/sau | P0 | Truy vết đủ vết của một thay đổi mẫu từ NHAP đến HIEU_LUC |
| NFR-employment-lifecycle-004 | data-retention | Việc làm, hợp đồng, thay đổi và tài liệu sau nghỉ việc giữ theo chính sách DPO; trước khi duyệt chỉ dữ liệu synthetic | P0 | Chính sách retention được duyệt — chờ DPO/legal (PRD OQ-6, spec OQ-3) |
| NFR-employment-lifecycle-005 | performance | Danh sách việc làm + hàng chờ duyệt tải trong ≤3 giây ở quy mô ≤500 nhân viên | P1 | Đo thời gian tải trên mẫu pilot (giá trị đề xuất — OQ-7) |
| NFR-employment-lifecycle-006 | reliability | Job áp dụng hiệu lực idempotent: chạy lại không tạo chuyển trạng thái kép; trễ >24 giờ thì cảnh báo HR | P0 | Test chạy lại job: không audit kép; cờ "quá hạn áp dụng" hiển thị |
| NFR-employment-lifecycle-007 | language | Toàn bộ giao diện và thông báo tiếng Việt tự nhiên | P0 | Kiểm tra wording mẫu brainstorm Mục 7.3 |
| NFR-employment-lifecycle-008 | integrity | Một hồ sơ HOAT_DONG có đúng một việc làm; một việc làm có đúng một hợp đồng hiện hành; một việc làm có tối đa một thay đổi đang chờ | P0 | Kiểm dữ liệu: 0 vi phạm trên tập pilot |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-employment-lifecycle-001 | Trạng thái việc làm chỉ đổi qua thay đổi vòng đời ở DA_DUYET đến ngày hiệu lực — cấm sửa trạng thái trực tiếp | Mọi yêu cầu đổi trạng thái | FR-employment-lifecycle-010 | brainstorm Mục 8; PRD Mục 7.4 (rủi ro thiếu phê duyệt) |
| BR-employment-lifecycle-002 | Transition matrix: HOP_DONG → THU_VIEC/NGHI_VIEC; THU_VIEC → CHINH_THUC/NGHI_VIEC; CHINH_THUC → TAM_NGHI/DIEU_CHUYEN/NGHI_VIEC; TAM_NGHI → CHINH_THUC(quay lại)/NGHI_VIEC; DIEU_CHUYEN → CHINH_THUC(xác nhận)/NGHI_VIEC | Khi chọn loại thay đổi | FR-employment-lifecycle-005 | brainstorm Mục 6.3 |
| BR-employment-lifecycle-003 | Tối đa một thay đổi đang chờ (CHO_DUYET hoặc DA_DUYET chưa hiệu lực) trên mỗi việc làm | Tạo thay đổi mới | FR-employment-lifecycle-006 | brainstorm Mục 7.2 |
| BR-employment-lifecycle-004 | Tài liệu bắt buộc theo loại thay đổi (vd nghỉ việc: quyết định/đơn) phải đủ trước khi gửi duyệt | Gửi duyệt | FR-employment-lifecycle-007, FR-015 | brainstorm Mục 7.1 |
| BR-employment-lifecycle-005 | Người đề xuất không tự duyệt khi tổ chức còn approver khác; ngoại lệ 1-approver gắn cờ "tự duyệt" | Approver mở/bấm duyệt | FR-employment-lifecycle-009 | brainstorm Mục 6.1 (D9) |
| BR-employment-lifecycle-006 | Điều chuyển yêu cầu ít nhất một trong đơn vị/vị trí/manager mới khác hiện tại | Lưu/gửi duyệt điều chuyển | FR-employment-lifecycle-004 | brainstorm Mục 6.5, 7.1 |
| BR-employment-lifecycle-007 | Một hồ sơ HOAT_DONG có đúng một việc làm; một việc làm có đúng một hợp đồng hiện hành; số hợp đồng duy nhất trong tổ chức | Tạo việc làm/hợp đồng | FR-employment-lifecycle-001..003 | brainstorm Mục 7.1 |
| BR-employment-lifecycle-008 | Checklist chưa hoàn tất không chặn hiệu lực — gắn cờ và leo thang nhắc owner | Áp dụng hiệu lực | FR-employment-lifecycle-014 | brainstorm OQ-2 (đề xuất) |
| BR-employment-lifecycle-009 | Backdate ≤90 ngày kèm lý do bắt buộc + cờ audit; quá ngưỡng thì chặn | Nhập ngày hiệu lực quá khứ | FR-employment-lifecycle-012 | brainstorm OQ-6 (đề xuất) |
| BR-employment-lifecycle-010 | Khi đang TAM_NGHI chỉ cho thay đổi "quay lại làm việc" hoặc "nghỉ việc"; điều chuyển khi TAM_NGHI cho tạo nhưng chỉ hiệu lực sau khi quay lại | Tạo/áp dụng thay đổi | FR-employment-lifecycle-005, FR-010 | brainstorm OQ-4 (đề xuất), 6.5 |
| BR-employment-lifecycle-011 | Hệ thống không tự quyết định nghỉ việc/kết thúc thử việc/kỷ luật; kết quả `employee-evaluation` chỉ là tài liệu đính kèm | Mọi tác nhân tự động | FR-employment-lifecycle-010, FR-015 | PRD Mục 12; brainstorm OQ-5 |
| BR-employment-lifecycle-012 | DIEU_CHUYEN là trạng thái quá đội: bắt buộc xác nhận hoàn tất mới về CHINH_THUC và đồng bộ hồ sơ | Áp dụng điều chuyển | FR-employment-lifecycle-019 | brainstorm Mục 8 |
| BR-employment-lifecycle-013 | `employee-profiles` là source of truth: feature này chỉ báo tín hiệu LUU_TRU/cập nhật đơn vị, không tự sửa hồ sơ | Nghỉ việc/điều chuyển có hiệu lực | FR-employment-lifecycle-018 | brainstorm Mục 8 |
| BR-employment-lifecycle-014 | Nhân viên chỉ xem trạng thái và tài liệu của chính mình phần được phép; tài liệu nội bộ HR không lộ | Render trang tự xem | FR-employment-lifecycle-020 | brainstorm Mục 6.2; PRD Mục 9 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-employment-lifecycle-001 | Loại thay đổi không hợp lệ | Chọn loại không nằm trong transition matrix của trạng thái hiện tại | major | FR-005 | Hiện "Trạng thái hiện tại không cho phép thay đổi này — xem lại vòng đời của nhân viên" | Chọn loại khác hợp lệ |
| E-employment-lifecycle-002 | Còn thay đổi đang chờ | Tạo thay đổi khi đã có CHO_DUYET/DA_DUYET chờ hiệu lực | major | FR-006 | Hiện "Nhân viên đang có thay đổi chờ duyệt/hiệu lực — xử lý trước khi tạo mới" | Xử lý/hủy thay đổi cũ |
| E-employment-lifecycle-003 | Thiếu tài liệu bắt buộc | Gửi duyệt khi thiếu tài liệu theo loại | minor | FR-007, FR-015 | Hiện "Chưa đủ tài liệu bắt buộc: {danh sách} — đính kèm trước khi gửi duyệt" | Đính kèm qua document-intake |
| E-employment-lifecycle-004 | Backdate thiếu lý do | Ngày hiệu lực quá khứ không nhập lý do | minor | FR-012 | Hiện "Ngày hiệu lực trong quá khứ cần lý do rõ ràng" | Nhập lý do hoặc sửa ngày |
| E-employment-lifecycle-005 | Điều chuyển không khác hiện tại | Đơn vị/vị trí/manager mới trùng hiện tại | minor | FR-004 | Hiện "Đơn vị, vị trí và người quản lý mới phải khác hiện tại" | Sửa trường đích |
| E-employment-lifecycle-006 | Tự duyệt thay đổi mình tạo | Approver trùng người đề xuất khi còn approver khác | major | FR-009 | Hiện "Bạn không thể duyệt thay đổi do chính mình đề xuất — chuyển người duyệt khác" | Chuyển approver khác |
| E-employment-lifecycle-007 | Số hợp đồng trùng | Thêm hợp đồng có số đã tồn tại trong tổ chức | minor | FR-002 | Hiện "Số hợp đồng {số} đã tồn tại — kiểm tra lại" | Sửa số hợp đồng |
| E-employment-lifecycle-008 | Ngày hiệu lực quá ngưỡng backdate | Backdate xa hơn 90 ngày | minor | FR-012 | Hiện "Ngày hiệu lực quá khứ chỉ cho phép tối đa 90 ngày" | Sửa ngày hoặc xin quy trình riêng |
| E-employment-lifecycle-009 | Không có quyền xem tài liệu | Người dùng/vai trò chưa được cấp cố mở tài liệu | major | FR-015, FR-020 | Tài liệu ẩn; khi cố truy cập hiện thông báo từ chối | Xin cấp quyền; sự kiện ghi audit |
| E-employment-lifecycle-010 | Job áp dụng hiệu lực trễ | Ngày hiệu lực đã qua >24 giờ mà chưa áp dụng | major | FR-010 | Thay đổi hiện cờ "quá hạn áp dụng" + cảnh báo HR | Job chạy lại idempotent; HR kiểm tra audit |
| E-employment-lifecycle-011 | Đồng bộ employee-profiles thất bại | Báo LUU_TRU/cập nhật đơn vị lỗi | critical | FR-018 | Thay đổi HIEU_LUC gắn cờ "đồng bộ hồ sơ lỗi" | Retry + báo HR xử lý tay, audit ghi nhận |
| E-employment-lifecycle-012 | Hồ sơ bị LUU_TRU giữa chừng | Tạo thay đổi trên việc làm mà hồ sơ đã LUU_TRU | major | FR-001, FR-005 | Chặn tạo + hiện trạng thái hồ sơ; thay đổi chờ bị hủy kèm ghi chú | Không thao tác tiếp trên việc làm đó |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-employment-lifecycle-01 | Chuyển trạng thái đúng hạn và đủ evidence (metric chính PRD Mục 7.4) | Tỷ lệ thay đổi HIEU_LUC đúng ngày hiệu lực + đủ tài liệu bắt buộc / tổng thay đổi | ≥95% sau 1 tháng pilot (đề xuất — chờ owner chốt) |
| SC-employment-lifecycle-02 | Tách quyền đề xuất/phê duyệt | Tỷ lệ thay đổi HIEU_LUC có approver khác người đề xuất (hoặc cờ tự duyệt ngoại lệ) | 100% |
| SC-employment-lifecycle-03 | Không hợp đồng quá hạn âm thầm | Số hợp đồng quá hạn >7 ngày chưa có thay đổi xử lý | 0 |
| SC-employment-lifecycle-04 | Checklist nghỉ việc hoàn tất đúng hạn | Tỷ lệ item checklist nghỉ việc xong trước applied_at | ≥90% (đề xuất) |
| SC-employment-lifecycle-05 | Audit trail đầy đủ | Số thay đổi HIEU_LUC thiếu vết đề xuất/duyệt/áp dụng | 0 |
| SC-employment-lifecycle-06 | Đồng bộ hồ sơ thành công | Tỷ lệ nghỉ việc/điều chuyển có hiệu lực đồng bộ `employee-profiles` đúng | 100% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __EMPLOYMENT__ — việc làm 1-1 với hồ sơ HOAT_DONG: trạng thái vòng đời
  hiện tại, hợp đồng hiện hành, mốc hiệu lực.
- __EMPLOYMENT_CONTRACT__ — hợp đồng lao động trong chuỗi: loại, số, ngày
  ký, hiệu lực từ–đến, trạng thái, hợp đồng bị thay thế.
- __LIFECYCLE_CHANGE__ — một thay đổi vòng đời: loại, ngày hiệu lực, lý
  do, trường đích, trạng thái duyệt, cờ backdate/tự duyệt, vết áp dụng.
- __CHANGE_CHECKLIST_ITEM__ — đầu việc checklist của một thay đổi: tiêu
  đề, owner, hạn, trạng thái hoàn tất.
- __LIFECYCLE_DOCUMENT__ — gán tài liệu (qua `document-intake`) vào việc
  làm hoặc thay đổi, kèm vai trò tài liệu và cờ bắt buộc.
- __EMPLOYMENT_AUDIT_EVENT__ — vết audit mọi sự kiện vòng đời: ai, khi
  nào, hành động, trước → sau.
- __EMPLOYEE_PROFILE__, __USER__, __POSITION__, __ORGANIZATION_UNIT__,
  __INTAKE_DOCUMENT__ — tham chiếu tối thiểu sang `employee-profiles`,
  `account-access`/`org-governance`, `document-intake`.

Chi tiết quan hệ + thuộc tính ở `srs/employment-lifecycle-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Tạo thay đổi → kiểm tra hợp lệ → gửi duyệt → approver duyệt/
  từ chối/trả về → đến ngày hiệu lực → áp dụng + audit + thông báo.
- __Flow 2:__ Nghỉ việc: thay đổi + checklist sinh tự động → duyệt → hiệu
  lực → hồ sơ LUU_TRU + khóa tài khoản (P1) + cờ checklist chưa xong.
- __Flow 3:__ Điều chuyển: duyệt → hiệu lực → DIEU_CHUYEN → xác nhận bàn
  giao → CHINH_THUC + cập nhật hồ sơ.
- __Flow 4:__ Tạm nghỉ → duyệt → hiệu lực → TAM_NGHI → quá ngày dự kiến
  nhắc HR → quay lại → CHINH_THUC.
- __Flow 5:__ Hợp đồng: thêm/thay thế → nhắc trước hạn → gia hạn hoặc
  chấm dứt → cảnh báo quá hạn nếu bỏ qua.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __employment-detail__ — việc làm của một nhân viên: trạng thái, hợp
  đồng, timeline vòng đời, tài liệu.
- __change-form__ — tạo/sửa thay đổi: loại, ngày hiệu lực, lý do, trường
  đích, tài liệu bắt buộc.
- __approval-queue__ — hàng chờ thay đổi CHO_DUYET của approver.
- __change-review__ — xem thay đổi + tài liệu + checklist, duyệt/từ
  chối/trả về.
- __contract-list__ — chuỗi hợp đồng của việc làm + cảnh báo quá hạn.
- __checklist-panel__ — checklist của thay đổi, owner xác nhận từng đầu
  việc.
- __employee-self-view__ — nhân viên xem trạng thái + tài liệu của mình.
- __lifecycle-reports__ — danh sách sắp hết thử việc/hết hạn/quá hạn.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Mọi chuyển trạng thái qua người duyệt — AI/hệ thống không tự quyết nghỉ việc/kết thúc thử việc/kỷ luật | PRD Mục 12 (invariant) — Product owner |
| Truy cập theo organization/role/data-scope + audit hành động nhạy cảm | PRD Mục 9 — Security owner |
| Việc làm chỉ gắn hồ sơ HOAT_DONG; `employee-profiles` là source of truth | Brainstorm Mục 8; ranh giới `employee-profiles` — Head of HR |
| Tài liệu chỉ vào qua `document-intake` | Brainstorm Mục 8 — Document AI owner |
| Feature `Could` — không thuộc cam kết pilot v1, làm sau `employee-profiles` | PRD Mục 6.1, Feature Map — Product owner |
| Catalog loại thay đổi/tài liệu bắt buộc/checklist mặc định do Head of HR duyệt trước dữ liệu thật | Brainstorm Mục 8 — Head of HR |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO/legal |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| `employee-profiles`: hồ sơ HOAT_DONG + điểm nhận tín hiệu LUU_TRU/cập nhật đơn vị | Core HR | Toàn bộ feature (phụ thuộc khai báo Feature Map) |
| `org-governance`: đơn vị/chức danh/manager + role/scope cho approver | Platform | Tạo điều chuyển, phân quyền duyệt |
| `document-intake`: cổng tài liệu + kiểm tra file | Document AI | FR-015, tài liệu bắt buộc |
| `contextual-notifications`: kênh nhắc hạn/thông báo | Platform | FR-016 |
| `account-access`: danh bạ + khóa tài khoản khi nghỉ việc (P1) | Platform | FR-024 |
| `employee-onboarding` chuyển người trúng tuyển sang hồ sơ | Recruitment | Nguồn hồ sơ HOAT_DONG đầu tiên |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Approver là vai trò nghiệp vụ được gán qua `org-governance` (HR lead; nghỉ việc/điều chuyển thêm quản lý cấp trên/Head of HR) | FR-008/009 nghẽn hoặc mất tách quyền — chờ Head of HR (OQ-1) |
| Checklist chưa xong không chặn hiệu lực | FR-014 phải đổi thành chặn — rủi ro pháp lý ngày hiệu lực (OQ-2) |
| Điều chuyển khi TAM_NGHI chỉ hiệu lực sau quay lại | BR-010 đổi thành chặn tạo — mất khả năng lên lịch (OQ-4) |
| Backdate ≤90 ngày kèm lý do là ngưỡng chấp nhận được | FR-012 và validation đổi ngưỡng (OQ-6) |
| Giới hạn số (nhắc 7/30 ngày, SLA duyệt 2 ngày, ≤20 checklist, ≤10 MB/file, tải ≤3 giây, ≤500 nhân viên) là chuẩn slice này | FR-016, NFR-005 đổi ngưỡng (OQ-7) |
| Re-hire mở lại qua hồ sơ (`employee-profiles`), không qua thay đổi vòng đời | State machine cần nhánh NGHI_VIEC → HOP_DONG |
| `employee-evaluation` chỉ là tài liệu tham chiếu đính kèm | BR-011 phải mở rộng trigger — chờ Product owner (PRD OQ-8) |

## 12. Open Questions

- [x] OQ-1: Ma trận approver theo loại thay đổi? — Resolved (đề xuất): HR
  lead duyệt thông thường; nghỉ việc/điều chuyển cần thêm quản lý cấp
  trên hoặc Head of HR — chờ Head of HR xác nhận.
- [x] OQ-2: Checklist chưa xong có chặn hiệu lực? — Resolved (đề xuất):
  không chặn, gắn cờ + leo thang nhắc — chờ Head of HR xác nhận.
- [x] OQ-3: Retention việc làm/hợp đồng/tài liệu sau nghỉ việc? —
  Resolved (đề xuất): giữ để truy vết theo chính sách DPO; trước đó chỉ
  dữ liệu synthetic — chờ DPO/legal (PRD OQ-6).
- [x] OQ-4: Điều chuyển khi đang tạm nghỉ? — Resolved (đề xuất): cho tạo,
  chỉ hiệu lực sau khi quay lại — chờ Head of HR xác nhận.
- [x] OQ-5: `employee-evaluation` làm evidence cho thay đổi? — Resolved:
  chỉ đính kèm như tài liệu tham chiếu, không tự quyết định — chu kỳ/
  phạm vi chờ Product owner (PRD OQ-8).
- [x] OQ-6: Ngưỡng backdate ngày hiệu lực? — Resolved (đề xuất): ≤90 ngày
  kèm lý do + cờ audit — chờ Head of HR xác nhận.
- [x] OQ-7: Giới hạn số (nhắc 7/30 ngày, SLA 2 ngày, ≤20 checklist, ≤10
  MB/file, ≤3 giây, ≤500 nhân viên)? — Resolved (đề xuất): chấp nhận làm
  chuẩn slice này — chờ Head of HR xác nhận.
- [~] OQ-8: Chữ ký số trên hợp đồng/quyết định? — Out of scope v1: PRD
  "Chưa làm" khi chưa chọn provider.
- [~] OQ-9: Tích hợp payroll? — Out of scope v1: non-goal PRD Mục 5.
- [~] OQ-10: Sinh văn bản từ mẫu/gia hạn hàng loạt? — Out of scope v1
  (hướng P2).
