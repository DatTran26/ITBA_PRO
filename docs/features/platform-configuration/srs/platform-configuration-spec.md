---
type: srs
feature: platform-configuration
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/platform-configuration/brainstorms/platform-settings-governance.md
  - docs/features/platform-configuration/platform-configuration-urd.md
  - docs/_reverse/platform-communications-and-governance/reverse-spec.md
---

# platform-configuration — Software Requirements Specification

## 1. Scope

SRS này cover trung tâm cấu hình nền tảng của một tenant và của platform:
catalog setting theo nhóm có chủ (AI, Email/SMTP, Assessment, Version,
Feature behavior), đọc giá trị theo phạm vi, sửa có validation và chặn giá
trị vượt invariant, secret write-only, test connection cho provider setting,
lịch sử thay đổi append-only kèm rollback, xác nhận cho thay đổi ảnh hưởng
toàn tổ chức và checklist cấu hình bắt buộc khi bootstrap.

Feature này là `Should` trong Feature Map — KHÔNG nằm trong cam kết lát cắt
pilot v1 (PRD Mục 6.1); nó là nền vận hành cho các slice mở rộng và cho một
số feature `Must` tiêu thụ cấu hình (kênh email, provider AI, cờ hành vi).

KHÔNG cover: gửi email/mẫu email/log giao nhận (`operational-email`), thông
báo phiên bản (`release-announcements` — feature này chỉ giữ setting version
hiển thị), đo mức dùng AI (`ai-usage-monitoring`), kết nối lịch/webhook/công
cụ ngoài (`external-integrations`), deployment authority và release
automation (OQ-5 PRD), policy builder cấu hình tùy ý ngoài catalog, và quản
lý vai trò/quyền (`org-governance` — feature này chỉ tiêu thụ vai trò admin
và audit boundary).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Admin | người | Xem/chỉnh setting phạm vi tổ chức, test provider, rollback, theo checklist bootstrap | Có |
| Vận hành nền tảng (platform operator) | người | Quản setting phạm vi hệ thống cho toàn platform | Có |
| Security owner | người | Kiểm soát credential và audit cấu hình | Có (stakeholder ràng buộc) |
| `org-governance` | hệ thống (feature khác) | Cung cấp vai trò admin, phạm vi và audit boundary | Không (dependency) |
| `account-access` | hệ thống (feature khác) | Cung cấp phiên/tài khoản admin hợp lệ | Không (dependency) |
| Feature consumer (`operational-email`, `contextual-notifications`, `ai-usage-monitoring`, `release-announcements`, `external-integrations`) | hệ thống (feature khác) | Đọc giá trị cấu hình hiệu lực từ một nguồn duy nhất | Không (consumer) |
| Provider ngoài (SMTP, AI) | ngoài | Được test kết nối bằng cấu hình đã lưu | Có (đối tượng của test connection) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-platform-configuration-001 | Catalog setting theo nhóm có chủ | Hệ thống phải cung cấp catalog setting do sản phẩm công bố, mỗi key có: nhóm (AI, Email, Assessment, Version, Feature behavior), kiểu giá trị, phạm vi (hệ thống/tổ chức), giá trị mặc định an toàn, cờ bắt buộc, cờ secret, cờ nhạy cảm và mô tả tác động; admin không tạo key mới | P0 | kiểm tra | PRD Mục 7.28 (categorized settings, safe defaults); URD UN-001 |
| FR-platform-configuration-002 | Đọc cấu hình theo phạm vi | Khi admin mở một nhóm, hệ thống phải liệt kê setting của nhóm với giá trị hiệu lực của phạm vi đó, trạng thái (chưa cấu hình/đã cấu hình/chưa kiểm chứng/đã kiểm chứng), cờ "khác mặc định" và phạm vi sở hữu; giá trị secret chỉ hiển thị trạng thái "đã cấu hình/chưa cấu hình" | P0 | demo | PRD Mục 7.28; URD UN-001, UN-003 |
| FR-platform-configuration-003 | Sửa cấu hình có validation | Khi admin lưu giá trị, hệ thống phải validate theo kiểu, miền giá trị, format (URL, email, port, số) và ràng buộc chéo đã công bố của key; nếu không hợp lệ thì báo lỗi tại field và không lưu | P0 | test | PRD Mục 7.28 (validation); brainstorm Mục 7.1 |
| FR-platform-configuration-004 | Chặn giá trị vượt invariant | Nếu giá trị vi phạm security/business invariant (tắt audit, nhập secret vào field thường, vượt ngưỡng cho phép của key, sửa setting bị khóa), thì hệ thống phải chặn lưu và báo "giá trị này vượt giới hạn an toàn của hệ thống" | P0 | test | PRD Mục 7.28 "Chưa làm" (vượt invariants); brainstorm D2 |
| FR-platform-configuration-005 | Secret write-only | Khi lưu field secret, hệ thống phải ghi một chiều phía server (mã hóa), không bao giờ trả plaintext trên bất kỳ surface nào (đọc, tìm kiếm, export, lịch sử, test); field secret để trống khi lưu nghĩa là giữ nguyên giá trị cũ | P0 | test | PRD Mục 9 (credential chỉ ở server boundary); reverse spec FR-PL-02/FR-PL-04; URD UN-003 |
| FR-platform-configuration-006 | Xóa secret có cảnh báo | Khi admin xóa một secret đang dùng, hệ thống phải hiện cảnh báo "kênh phụ thuộc sẽ ngừng", yêu cầu xác nhận và ghi audit; sau khi xóa, trạng thái setting về "chưa cấu hình" | P0 | test | brainstorm Mục 6.5; URD Mục 6 |
| FR-platform-configuration-007 | Test connection provider | Với setting thuộc nhóm provider (SMTP, AI), hệ thống phải cho admin chạy "kiểm tra kết nối" trên cấu hình đã lưu; kết quả (thành công/thất bại + thông điệp không chứa secret + ai + khi nào) được ghi lại append-only | P0 | test | PRD Mục 7.28 (test connection); hành trình Admin PRD Mục 7; URD UN-004 |
| FR-platform-configuration-008 | Trạng thái kiểm chứng và cổng kênh | Hệ thống phải duy trì trạng thái kiểm chứng của provider setting: test đạt chuyển "đã kiểm chứng"; đổi giá trị provider hoặc test lỗi về "chưa kiểm chứng"; kênh/tính năng phụ thuộc chỉ được bật khi setting bắt buộc đạt "đã kiểm chứng" | P0 | test | brainstorm Mục 5.2, 6.3; URD Journey 1; OQ-3 URD |
| FR-platform-configuration-009 | Revision append-only mỗi lần lưu | Khi một thay đổi được lưu, hệ thống phải tạo revision ghi giá trị trước/sau, người thực hiện, thời điểm và lý do; với setting secret chỉ ghi "đã thay đổi secret"; revision không được sửa/xóa | P0 | test | PRD Mục 7.28 (history); URD UN-005, UN-010 |
| FR-platform-configuration-010 | Rollback giá trị không-secret | Khi admin chọn một revision trước của setting không-secret, hệ thống phải hiển thị diff so với hiện tại, áp giá trị cũ như một thay đổi mới (revision + audit) sau khi admin nhập lý do; setting secret không rollback — chỉ nhập secret mới | P0 | test | PRD Mục 7.28; hành trình Admin (rollback); brainstorm D7/D8 |
| FR-platform-configuration-011 | Xác nhận tác động toàn tổ chức | Khi lưu setting được đánh dấu ảnh hưởng toàn tổ chức, hệ thống phải hiện xác nhận "thay đổi này áp dụng cho toàn tổ chức và được ghi vào lịch sử" trước khi lưu; hủy thì không lưu | P0 | test | brainstorm Mục 5.1 (D3); URD UN-002 |
| FR-platform-configuration-012 | Checklist cấu hình bắt buộc | Hệ thống phải hiển thị trạng thái các setting bắt buộc (chưa cấu hình/đã cấu hình/đã kiểm chứng) kèm đường dẫn tới màn cấu hình tương ứng; cảnh báo số mục còn thiếu cho tới khi checklist đạt | P1 | demo | brainstorm Mục 5.4; URD UN-006 |
| FR-platform-configuration-013 | Phân quyền theo phạm vi setting | Hệ thống phải chỉ cho admin tổ chức thao tác setting phạm vi tổ chức của mình và chỉ vận hành nền tảng thao tác setting phạm vi hệ thống; vai trò khác không thấy màn cấu hình; mọi lượt từ chối được ghi nhận | P0 | test | PRD Mục 9; brainstorm Mục 6.2; URD UN-007 |
| FR-platform-configuration-014 | Lọc khác mặc định | Hệ thống phải cho lọc các setting có giá trị khác safe default và so sánh giá trị hiện tại với mặc định | P1 | demo | brainstorm Mục 4 (P1); URD UN-008 |
| FR-platform-configuration-015 | Export cấu hình không-secret | Hệ thống phải cho export cấu hình phạm vi tổ chức ra file chỉ gồm setting không-secret (có ghi nhận ai xuất, khi nào) để nhập lại cho tenant khác | P2 | test | brainstorm Mục 4 (P1); URD UN-009 |
| FR-platform-configuration-016 | Cảnh báo sửa đồng thời | Khi admin lưu một setting vừa được người khác cập nhật sau thời điểm admin mở form, hệ thống phải cảnh báo "Cấu hình vừa được {người} cập nhật — tải lại trước khi sửa" thay vì ghi đè âm thầm | P1 | test | brainstorm Mục 6.4; URD Mục 6 |
| FR-platform-configuration-017 | Khôi phục giá trị mặc định | Với setting không bắt buộc và không-secret, hệ thống phải cho "khôi phục mặc định" — áp giá trị default như một revision mới có audit | P1 | demo | brainstorm Mục 6.5 |
| FR-platform-configuration-018 | Áp dụng thay đổi ngay | Khi một thay đổi được lưu, giá trị hiệu lực mới phải được consumer đọc thấy ở lần đọc kế tiếp, không có giá trị giữa chừng và không yêu cầu restart | P0 | test | brainstorm Mục 8 (assumption áp dụng ngay); URD Mục 7 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-platform-configuration-001 | security | Secret chỉ tồn tại ở server boundary: write-only, mã hóa phía server, masked trên mọi surface (đọc, tìm kiếm, export, lịch sử, test, log lỗi) | P0 | 0 sự cố lộ secret qua mọi surface (guardrail bám M-GR-01) |
| NFR-platform-configuration-002 | auditability | Mọi thay đổi cấu hình và mọi lần test connection có bản ghi append-only đủ ai/khi nào/kết quả; revision không có thao tác sửa/xóa trên mọi vai trò | P0 | 100% thay đổi trên mẫu kiểm tra có revision đủ trường; thử sửa/xóa đều bị từ chối |
| NFR-platform-configuration-003 | consistency | Một giá trị hiệu lực duy nhất cho mỗi (key, phạm vi): mọi consumer đọc cùng kết quả; giá trị mới áp dụng ngay không trạng thái giữa chừng | P0 | Đọc đồng thời từ 2 consumer trả cùng giá trị sau mỗi lần lưu |
| NFR-platform-configuration-004 | performance | Mở nhóm setting và lưu một giá trị không làm admin chờ đáng kể | P1 | 95% lượt mở nhóm ≤2 giây và lưu ≤3 giây ở catalog ≤200 key (đề xuất — OQ-7) |
| NFR-platform-configuration-005 | usability | Giao diện, mô tả tác động setting và toàn bộ thông báo là tiếng Việt viết cho admin hiểu, không thuật ngữ kỹ thuật | P0 | Kiểm tra wording theo bảng mẫu của brainstorm |
| NFR-platform-configuration-006 | data-retention | Revision và kết quả test giữ theo retention đã duyệt; đề xuất revision ≥12 tháng rolling thống nhất audit `org-governance`, test giữ 20 lần gần nhất mỗi setting | P1 | Retention chính thức chờ DPO (OQ-5, liên quan OQ-6 PRD) |
| NFR-platform-configuration-007 | reliability | Test connection có timeout rõ (đề xuất 10 giây) và kết quả lỗi không bao giờ chứa secret/credential | P0 | Test timeout ghi "không phản hồi" sau đúng ngưỡng; kiểm tra log lỗi không có credential |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-platform-configuration-001 | Chỉ vai trò admin (phạm vi tổ chức) và vận hành nền tảng (phạm vi hệ thống) được thao tác cấu hình; deny-by-default cho mọi vai trò khác | Mọi truy cập màn cấu hình | FR-platform-configuration-013 | PRD Mục 9; `org-governance` |
| BR-platform-configuration-002 | Secret chỉ nhập qua field bảo mật; field secret để trống khi lưu = giữ nguyên giá trị cũ; không chấp nhận secret qua field thường | Khi lưu setting có field secret | FR-platform-configuration-005 | brainstorm Mục 6.5, 7.1 |
| BR-platform-configuration-003 | Kênh/tính năng phụ thuộc chỉ được bật khi provider setting đạt "đã kiểm chứng"; đổi giá trị provider đưa trạng thái về "chưa kiểm chứng" | Khi bật kênh phụ thuộc hoặc đổi giá trị provider | FR-platform-configuration-008 | brainstorm Mục 5.2; OQ-3 URD |
| BR-platform-configuration-004 | Setting bị khóa bởi invariant (vd audit luôn bật) không ai sửa được, kể cả admin và vận hành nền tảng | Khi có yêu cầu sửa setting bị khóa | FR-platform-configuration-004 | brainstorm Mục 6.2; PRD Mục 7.28 "Chưa làm" |
| BR-platform-configuration-005 | Lý do 5–500 ký tự bắt buộc khi sửa setting được đánh dấu nhạy cảm; tùy chọn với setting thường | Khi lưu setting nhạy cảm | FR-platform-configuration-009 | brainstorm Mục 7.1 |
| BR-platform-configuration-006 | Rollback chỉ áp cho setting không-secret; rollback tạo revision mới thay vì sửa bản ghi cũ | Khi chọn "Khôi phục giá trị này" | FR-platform-configuration-010 | brainstorm Mục 5.3 (D7) |
| BR-platform-configuration-007 | Revision và kết quả test là append-only — không ai sửa/xóa | Mọi thao tác trên lịch sử | FR-platform-configuration-009, FR-platform-configuration-007 | brainstorm Mục 6.3 |
| BR-platform-configuration-008 | Key setting chỉ tồn tại trong catalog do sản phẩm công bố — không tạo/sửa key từ giao diện | Khi có yêu cầu key mới | FR-platform-configuration-001 | brainstorm Mục 8 (assumption catalog) |
| BR-platform-configuration-009 | Export chỉ gồm setting không-secret; secret không bao giờ xuất hiện trong file export | Khi export cấu hình | FR-platform-configuration-015 | brainstorm Mục 9 (rủi ro lộ credential) |
| BR-platform-configuration-010 | Nếu ghi revision thất bại trong một lần lưu thì hủy toàn bộ thay đổi — không cho phép thay đổi cấu hình thiếu vết | Khi lưu mà ghi audit lỗi | FR-platform-configuration-009 | Suy từ FR-org-governance-012 (hành động quan trọng không thiếu audit) |
| BR-platform-configuration-011 | Test connection không chặn lưu — cho phép lưu nháp cấu hình ở "chưa kiểm chứng"; chỉ bắt buộc test đạt trước khi bật kênh | Khi lưu provider setting | FR-platform-configuration-007, FR-platform-configuration-008 | OQ-3 URD (đề xuất) |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-platform-configuration-001 | Giá trị sai kiểu/miền/format | Lưu giá trị không qua validation | minor | FR-platform-configuration-003 | Lỗi tại field: "Giá trị không hợp lệ: {lý do} — kiểm tra lại trường {tên}" | Sửa giá trị rồi lưu lại |
| E-platform-configuration-002 | Vượt invariant | Lưu giá trị tắt audit, vượt ngưỡng cho phép hoặc sửa setting bị khóa | major | FR-platform-configuration-004 | Hiện "Không thể lưu — giá trị này vượt giới hạn an toàn của hệ thống" | Đổi giá trị hợp lệ; setting bị khóa không có đường sửa |
| E-platform-configuration-003 | Không có quyền | Vai trò không phải admin/vận hành nền tảng cố truy cập hoặc admin sửa setting hệ thống | major | FR-platform-configuration-013 | Hiện "Bạn không có quyền thay đổi cấu hình này" / "Cấu hình này thuộc phạm vi hệ thống — liên hệ vận hành nền tảng" | Xin cấp quyền; lượt từ chối đã ghi nhận |
| E-platform-configuration-004 | Secret vào field thường | Nhập credential vào field không phải bảo mật | major | FR-platform-configuration-005 | Hiện "Không nhập thông tin bí mật vào trường này — dùng trường bảo mật riêng" | Nhập lại qua field bảo mật |
| E-platform-configuration-005 | Test connection thất bại/timeout | Provider không phản hồi trong ngưỡng hoặc trả lỗi | major | FR-platform-configuration-007 | Hiện "Không kết nối được sau {số} giây — kiểm tra địa chỉ và thông tin đăng nhập"; setting ở "chưa kiểm chứng" | Sửa host/credential rồi test lại; lưu nháp vẫn được |
| E-platform-configuration-006 | Rollback setting secret | Chọn khôi phục trên setting loại secret | minor | FR-platform-configuration-010 | Hiện "Không thể khôi phục giá trị bảo mật — vui lòng nhập giá trị mới" | Nhập secret mới thay vì rollback |
| E-platform-configuration-007 | Thiếu lý do | Lưu setting nhạy cảm không nhập lý do | minor | FR-platform-configuration-009 | Hiện "Vui lòng nhập lý do thay đổi cấu hình này" | Nhập lý do 5–500 ký tự rồi lưu |
| E-platform-configuration-008 | Sửa đồng thời | Lưu khi setting vừa được người khác cập nhật | minor | FR-platform-configuration-016 | Hiện "Cấu hình vừa được {người} cập nhật — tải lại trước khi sửa" | Tải lại, sửa trên bản mới |
| E-platform-configuration-009 | Xóa secret đang dùng | Xóa credential của provider đang phục vụ kênh | major | FR-platform-configuration-006 | Cảnh báo "kênh phụ thuộc sẽ ngừng" trước khi xác nhận | Xác nhận để xóa hoặc hủy; kênh phụ thuộc chuyển ngừng |
| E-platform-configuration-010 | Setting bắt buộc còn thiếu | Bootstrap/mở checklist khi còn setting bắt buộc chưa kiểm chứng | major | FR-platform-configuration-012 | Checklist hiện "Còn {n} cấu hình bắt buộc chưa hoàn tất" + đường dẫn từng mục | Hoàn tất từng mục và test khi cần |
| E-platform-configuration-011 | Ghi revision thất bại | Lỗi ghi audit trong lúc lưu | critical | FR-platform-configuration-009 | Thay đổi bị hủy + báo admin hệ thống chưa ghi nhận được | Retry khi audit khôi phục; báo vận hành |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-platform-configuration-01 | Thay đổi cấu hình không gây incident | Tỷ lệ thay đổi có incident liên quan / tổng thay đổi (đo thành công PRD Mục 7.28) | ≥98% (đề xuất — target chính thức chờ OQ-2 sản phẩm) |
| SC-platform-configuration-02 | Mọi thay đổi có vết truy vết | Tỷ lệ thay đổi có revision đủ trước/sau + ai + thời điểm trên mẫu kiểm tra | 100% |
| SC-platform-configuration-03 | Không lộ secret | Số incident lộ credential qua mọi surface | 0 (guardrail bám M-GR-01) |
| SC-platform-configuration-04 | Provider được kiểm chứng trước khi dùng | Tỷ lệ kênh phụ thuộc đi vào hoạt động có bản ghi test đạt | 100% |
| SC-platform-configuration-05 | Admin tự cấu hình provider | Thời gian từ mở form đến test đạt của một provider mới (SMTP) | ≤30 phút (đề xuất — chờ owner) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Định nghĩa setting (SETTING_DEFINITION)__ — một key trong catalog: nhóm,
  kiểu giá trị, miền/format, phạm vi sở hữu, giá trị mặc định an toàn, cờ
  bắt buộc/secret/nhạy cảm/ảnh hưởng toàn tổ chức, mô tả tác động.
- __Giá trị setting (SETTING_VALUE)__ — giá trị hiệu lực của một key tại một
  phạm vi (hệ thống hoặc một tổ chức), kèm trạng thái kiểm chứng và mốc cập
  nhật; với key secret chỉ giữ trạng thái + tham chiếu secret phía server.
- __Phiên bản thay đổi (SETTING_REVISION)__ — append-only: giá trị trước/
  sau (secret chỉ "đã thay đổi"), người thực hiện, lý do, thời điểm, loại
  thay đổi (sửa/rollback/khôi phục mặc định/xóa secret).
- __Kết quả kiểm tra kết nối (CONNECTION_TEST)__ — append-only: setting,
  kết quả, thông điệp không chứa secret, người chạy, thời điểm.
- __Tổ chức (ORGANIZATION)__ — tham chiếu phạm vi tổ chức; entity thuộc
  `org-governance`.
- __Người dùng (USER)__ — admin/vận hành thực hiện thay đổi; entity thuộc
  `account-access`.

Chi tiết quan hệ + thuộc tính ở `srs/platform-configuration-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Mở nhóm → sửa giá trị → validate → xác nhận nếu ảnh hưởng toàn
  tổ chức → lưu + revision → áp dụng ngay.
- __Flow 2:__ Cấu hình provider → nhập field thường + field secret → lưu →
  test connection → "đã kiểm chứng" → kênh phụ thuộc sẵn sàng.
- __Flow 3:__ Mở lịch sử → chọn revision → xem diff → khôi phục (revision
  mới + audit); secret chỉ nhập mới.
- __Flow 4:__ Checklist bootstrap → xử lý từng mục thiếu → test → checklist
  đạt → feature phụ thuộc sẵn sàng.
- __Flow 5:__ Điều tra: lọc lịch sử theo setting/người/thời gian → xem
  trước/sau + lý do (secret chỉ "đã thay đổi").

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __settings-catalog__ — danh sách nhóm + setting: giá trị hiện tại (secret
  masked), phạm vi, cờ "khác mặc định".
- __setting-editor__ — form sửa theo kiểu giá trị; field secret riêng; nhập
  lý do khi setting nhạy cảm; xác nhận tác động toàn tổ chức.
- __provider-test-panel__ — nút kiểm tra kết nối + kết quả gần nhất + trạng
  thái kiểm chứng.
- __settings-history__ — lịch sử revision + bộ lọc + diff + thao tác khôi
  phục.
- __config-checklist__ — trạng thái setting bắt buộc khi bootstrap + cảnh
  báo thiếu + đường dẫn xử lý.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Service credential chỉ ở server boundary; không plaintext trên mọi surface | PRD Mục 9 — Security owner |
| Không cho phép cấu hình vượt security/business invariants | PRD Mục 7.28 "Chưa làm" — Security + Product owner |
| Quyền thao tác theo organization/role/data-scope, deny-by-default | PRD Mục 9 — Security owner (`org-governance`) |
| Audit cho thay đổi nhạy cảm là product constraint | PRD Mục 9, Mục 7.28 — Security owner |
| Tiếng Việt là ngôn ngữ ưu tiên | PRD Mục 9 — Product owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Vai trò admin + phạm vi dữ liệu + audit boundary (`org-governance`, PRD #2) | org-governance owner | Không phân quyền/audit được thao tác cấu hình |
| Phiên và tài khoản admin hợp lệ (`account-access`, PRD #1) | account-access owner | Không xác thực được người thao tác |
| Tenant provisioning — tổ chức tồn tại để gán phạm vi | Vận hành nền tảng | Không có phạm vi tổ chức cho setting |
| Catalog key chính thức v1 theo nhóm | Operations owner (OQ-4 URD) | FR-platform-configuration-001 thiếu nội dung chính thức |
| Provider thật (SMTP, AI) để test connection | Operations owner | Test chỉ chạy được trên cấu hình giả |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Phạm vi 2 mức: hệ thống (vận hành nền tảng) và tổ chức (admin tenant) | FR-platform-configuration-013 phải thêm tầng phạm vi |
| SMTP/AI key mặc định nền tảng cấp ở scope hệ thống; tenant override được ở scope tổ chức | FR-platform-configuration-002/005 thêm luồng BYOK hoặc bỏ override |
| Thay đổi áp dụng ngay không cần restart | FR-platform-configuration-018 cần chế độ "chờ áp dụng" |
| Consumer đọc cấu hình qua một điểm đọc duy nhất của feature này | NFR-platform-configuration-003 không bảo đảm — consumer đọc nguồn khác |
| Giới hạn đề xuất: 2.000 ký tự, ~200 key, 10 giây test, 50 revision/trang, 20 test giữ lại, history ≥12 tháng | FR/NFR liên quan đổi ngưỡng |
| Cấu hình provider mà `operational-email` dùng (SMTP) nằm trong catalog feature này; màn cấu hình trong `operational-email` đọc-ghi cùng giá trị đó — một nguồn duy nhất | Hai nơi lưu SMTP → lệch cấu hình kênh gửi (chờ Operations owner xác nhận ranh giới — OQ-8) |

## 12. Open Questions

- [x] OQ-1: Ai sở hữu setting phạm vi hệ thống? — Resolved (đề xuất): vai
  trò "vận hành nền tảng" mức platform ngoài catalog vai trò của tổ chức;
  org admin chỉ thao tác setting phạm vi tổ chức — chờ Operations owner
  xác nhận (kế thừa URD OQ-1).
- [x] OQ-2: SMTP/AI key nền tảng cấp hay tenant tự cấp (BYOK)? — Resolved
  (đề xuất): nền tảng cung cấp mặc định ở scope hệ thống; tenant override
  ở scope tổ chức — chờ Product owner + DPO (kế thừa URD OQ-2).
- [x] OQ-3: Bắt buộc test đạt trước khi lưu? — Resolved (đề xuất): không
  chặn lưu; chỉ bắt buộc test đạt trước khi bật kênh phụ thuộc — chờ
  Operations owner (kế thừa URD OQ-3, BR-platform-configuration-011).
- [x] OQ-4: Danh sách key catalog v1 theo nhóm? — Resolved (đề xuất): AI
  (provider, model mặc định, ngưỡng sử dụng), Email (SMTP host/port/from +
  secret), Assessment (tham số mặc định module), Version (phiên bản hiển
  thị), Feature behavior (cờ được công bố) — chờ Operations owner chốt
  (kế thừa URD OQ-4).
- [x] OQ-5: Retention revision và kết quả test (OQ-6 PRD, OQ-PL-04)? —
  Resolved (đề xuất): revision append-only ≥12 tháng rolling; test giữ 20
  lần gần nhất mỗi setting — chờ DPO/legal (kế thừa URD OQ-5).
- [x] OQ-6: Version setting có đối chiếu release thật (OQ-5 PRD,
  OQ-PL-05)? — Resolved (đề xuất): version setting chỉ là bản ghi hiển thị
  phục vụ `release-announcements`, không ràng buộc Git tag hay deployment
  authority — chờ Technical owner (kế thừa URD OQ-6).
- [x] OQ-7: Các giới hạn/ngưỡng hiệu năng (2.000 ký tự, ~200 key, 10 giây
  test, 50 revision/trang, 20 test giữ lại, lưu ≤3 giây)? — Resolved (đề
  xuất): giữ làm chuẩn v1 — chờ Operations owner (kế thừa URD OQ-7).
- [x] OQ-8: Ranh giới sở hữu giá trị SMTP giữa feature này và
  `operational-email`? — Resolved (đề xuất): giá trị nằm trong catalog
  feature này làm nguồn duy nhất; `operational-email` cung cấp màn cấu
  hình/test ngữ cảnh email đọc-ghi cùng giá trị đó — chờ Operations owner
  xác nhận.
