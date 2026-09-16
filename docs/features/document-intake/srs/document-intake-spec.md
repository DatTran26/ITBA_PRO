---
type: srs
feature: document-intake
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/document-intake/brainstorms/unified-document-ingest.md, docs/features/document-intake/document-intake-urd.md]
---

# document-intake — Software Requirements Specification

## 1. Scope

Cổng tiếp nhận tài liệu thống nhất cho mọi luồng nghiệp vụ (tuyển dụng, hồ
sơ nhân sự, cuộc họp, công việc, thư viện nguồn): kiểm tra quyền và định
dạng/kích thước ngay tại điểm tiếp nhận, lưu file hợp lệ có ngữ cảnh, tạo
job xử lý có trạng thái và thông báo kết quả cho người tải.

Trong scope: upload đơn và theo lô, kiểm tra quyền/định dạng/kích thước/an
toàn, phân loại ngữ cảnh có xác nhận, processing job với trạng thái và
retry, thông báo kết quả, hàng chờ giám sát cho admin, audit đầy đủ.

Ngoài scope: review/xác nhận nội dung trích xuất (`document-review`),
quản lý phiên bản và phát hành tài liệu nguồn (`document-library`), nhận
file từ nguồn ngoài qua integration (`external-integrations`), bóc tách
ảnh nhanh ngoài pipeline (`vision-ocr`), chấp nhận mọi định dạng/kích
thước không giới hạn.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Đưa tài liệu vào đúng hồ sơ/ngữ cảnh, theo dõi tới khi xử lý xong | Có |
| Nhân viên / quản lý | người | Đính kèm tài liệu vào cuộc họp/công việc mình tham gia | Có |
| Admin | người | Giám sát hàng chờ, xử lý job treo/thất bại và file bị cách ly | Có |
| Reviewer (document-review) | người | Nhận output đã xử lý xong để review | Có (là bên nhận kết quả) |
| Module tiêu thụ (cv-intake, document-review, document-library, meeting, task) | hệ thống | Nhận file + kết quả xử lý qua đúng một cổng | Có |
| `org-governance` | hệ thống | Cung cấp quyết định quyền theo organization/role/data-scope | Có (dependency) |
| Dịch vụ kiểm tra an toàn file | hệ thống/ngoài | Phát hiện file độc hại/giả định dạng | Có (dependency, phạm vi chờ OQ-3) |
| Provider AI bên ngoài (OCR/trích xuất) | ngoài | Xử lý nội dung file khi job cần | Có (bị chặn bởi OQ-6) |
| Ứng viên | người | Nộp tài liệu qua kênh được mời | Không (v1 chỉ người dùng nội bộ) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-document-intake-001 | Tiếp nhận file có ngữ cảnh | Khi người dùng gửi một hoặc nhiều file từ màn nghiệp vụ, hệ thống phải yêu cầu ngữ cảnh đích và loại/mục đích tài liệu trước khi ghi nhận; gợi ý tự động chỉ là đề xuất để người dùng xác nhận. | P0 | demo | PRD Mục 7.17, brainstorm 5.1 |
| FR-document-intake-002 | Kiểm tra quyền trước khi nhận | Khi người dùng gửi file, hệ thống phải kiểm tra quyền ghi của người đó trên ngữ cảnh đích theo organization/role/data-scope; nếu không có quyền thì phải từ chối ngay, không lưu file, và ghi audit từ chối. | P0 | test | PRD Mục 7.17, 9; brainstorm D1 |
| FR-document-intake-003 | Kiểm tra định dạng và kích thước | Khi file được gửi, hệ thống phải so định dạng với whitelist và kích thước với giới hạn đã công bố; nếu vi phạm thì phải từ chối kèm lý do cụ thể và không tạo job. | P0 | test | PRD Mục 7.17; brainstorm D2, 7.1 |
| FR-document-intake-004 | Kiểm tra an toàn file | Khi file qua kiểm tra định dạng/kích thước, hệ thống phải kiểm tra an toàn (nội dung khớp định dạng khai báo, không nghi độc hại); nếu file nghi nguy hiểm thì phải cách ly, báo admin và không cho xử lý tiếp. | P0 | test | PRD Mục 7.17 (rủi ro); brainstorm D3 |
| FR-document-intake-005 | Lưu file hợp lệ và tạo job | Khi file qua mọi kiểm tra, hệ thống phải lưu file vào kho kèm ngữ cảnh/loại tài liệu/người tải và tạo một processing job ở trạng thái chờ xử lý cho từng file. | P0 | demo | PRD Mục 7.17; brainstorm 5.1 |
| FR-document-intake-006 | Theo dõi trạng thái từng file | Trong khi file đang được xử lý, hệ thống phải hiển thị trạng thái hiện tại của từng file (đang kiểm tra / chờ xử lý / đang xử lý / đã xử lý / thất bại / bị từ chối) trong danh sách tài liệu đã tải. | P0 | demo | PRD Mục 7.17 (queue/status); URD UN-003 |
| FR-document-intake-007 | Thông báo kết quả xử lý | Khi job kết thúc, hệ thống phải thông báo cho người tải biết file đã xử lý xong hoặc thất bại; khi job treo quá ngưỡng, hệ thống phải báo admin. | P0 | test | PRD Mục 7.17; brainstorm 5.2, D7 |
| FR-document-intake-008 | Retry job thất bại | Khi job xử lý thất bại, hệ thống phải cho phép đưa job về hàng chờ theo chính sách retry (tự động và/hoặc người dùng bấm "Thử lại"); nếu hết lượt retry thì phải đánh dấu thất bại cuối và báo admin lẫn người tải. | P0 | test | PRD Mục 7.17 (retry); brainstorm D5, R-07 sản phẩm |
| FR-document-intake-009 | Upload hàng loạt độc lập | Khi người dùng tải một lô file cùng ngữ cảnh, hệ thống phải kiểm tra và xử lý từng file độc lập: file lỗi bị từ chối riêng kèm lý do, không chặn file hợp lệ, và tổng kết rõ số file được nhận/bị từ chối. | P1 | test | brainstorm 5.3; URD UN-008 |
| FR-document-intake-010 | Thay thế file bị từ chối | Khi file bị từ chối, hệ thống phải cho người tải đưa file thay thế vào cùng ngữ cảnh mà không phải nhập lại thông tin ngữ cảnh. | P1 | demo | brainstorm P1; URD Journey 2 |
| FR-document-intake-011 | Cảnh báo trùng nội dung | Khi file được nhận có nội dung trùng với file đã tồn tại trong cùng ngữ cảnh, hệ thống phải cảnh báo và cho người dùng chọn giữ bản mới hay bỏ. [NEEDS CLARIFICATION: hành vi khi người dùng im lặng — nhận hay giữ?] | P1 | test | brainstorm D6; URD Mục 6 |
| FR-document-intake-012 | Hàng chờ giám sát cho admin | Hệ thống phải cho admin xem danh sách job theo trạng thái (treo / thất bại / cách ly), lọc theo ngữ cảnh và người tải, và can thiệp: đẩy lại hàng chờ, đánh dấu thất bại kèm lý do, giải phóng hay giữ cách ly file. | P1 | demo | brainstorm P1; URD Journey 4 |
| FR-document-intake-013 | Audit mọi lượt tiếp nhận | Hệ thống phải ghi nhật ký cho mọi lượt tải và mọi can thiệp của admin: ai, vào ngữ cảnh nào, khi nào, kết quả từng bước kiểm tra và lý do từ chối/thất bại. | P0 | kiểm tra | PRD Mục 9; URD UN-006 |
| FR-document-intake-014 | Bàn giao output cho module đích | Khi job xử lý xong, hệ thống phải đánh dấu kết quả sẵn sàng để module đích (document-review, cv-intake, document-library) nhận xử lý tiếp, kèm liên kết tới file và ngữ cảnh gốc. | P0 | test | PRD Mục 7.17; URD UN-009 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-document-intake-001 | performance | File hợp lệ phải được xử lý xong trong SLA đã công bố cho người dùng (đề xuất 5 phút, chờ OQ-2). | P0 | ≥ 95% job của file hợp lệ kết thúc trong SLA trong tháng pilot; đo bằng thời gian nhận → xong. |
| NFR-document-intake-002 | security | Không file nào được lưu khi người tải thiếu quyền ghi trên ngữ cảnh đích; deny by default khi quyết định quyền lỗi. | P0 | Kiểm tra audit: 0 file lưu mà thiếu quyền; incident vượt data-scope = 0 (theo M-GR-01). |
| NFR-document-intake-003 | auditability | Mọi lượt tải và can thiệp đều truy vết được đầy đủ. | P0 | 100% file được nhận/từ chối có bản ghi đủ (ai, ngữ cảnh, kết quả kiểm tra); kiểm tra mẫu mỗi release. |
| NFR-document-intake-004 | usability | Trạng thái file cập nhật gần như tức thì; mọi thông báo lỗi/trạng thái là tiếng Việt tự nhiên, nêu lý do và cách khắc phục. | P0 | Người dùng không phải tải lại trang để thấy trạng thái mới; ≥ 70% file bị từ chối được thay thế thành công cùng ngày (USC-002). |
| NFR-document-intake-005 | reliability | Không job nào mất âm thầm: mọi job treo/thất bại cuối đều có trạng thái hiển thị và có người được báo. | P0 | 0 job kết thúc mà không có trạng thái cuối và không có thông báo; ≥ 80% job thất bại lần đầu thành công sau retry (USC-004). |
| NFR-document-intake-006 | privacy | File chứa dữ liệu nhân sự chỉ được gửi tới provider AI bên ngoài theo chính sách đã duyệt; khi chưa duyệt chỉ dùng dữ liệu không nhạy cảm/synthetic. | P0 | 0 file dữ liệu thật gửi ra provider ngoài khi OQ-6/OQ-13 sản phẩm còn mở. |
| NFR-document-intake-007 | integrity | File bị từ chối không được giữ lại âm thầm; file bị cách ly không được đưa vào xử lý khi chưa được giải phóng. | P0 | Kiểm tra mẫu: 0 file từ chối còn trong kho dùng được; 0 job chạy trên file đang cách ly. |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-document-intake-001 | Whitelist định dạng: PDF, DOCX, XLSX, CSV, TXT, PNG, JPG, WEBP (đề xuất, chờ OQ-1). | Mọi lượt gửi file | FR-document-intake-003 | brainstorm 7.1 |
| BR-document-intake-002 | Kích thước ≤ 20 MB mỗi file; tối đa 10 file mỗi lần tải (đề xuất, chờ OQ-1). | Mọi lượt gửi file | FR-document-intake-003, FR-document-intake-009 | brainstorm 7.2 |
| BR-document-intake-003 | Từ chối ngay và không lưu khi thiếu quyền trên ngữ cảnh đích; tài khoản đã deactivate bị từ chối ở mọi ngữ cảnh. | Kiểm tra quyền | FR-document-intake-002 | brainstorm 6.2 |
| BR-document-intake-004 | Retry tối đa 3 lần mỗi job (đề xuất, chờ OQ-2); hết lượt → thất bại cuối, chỉ admin xử lý tay. | Job FAILED | FR-document-intake-008 | brainstorm 7.2, 6.3 |
| BR-document-intake-005 | Job ở trạng thái đang xử lý quá 15 phút (đề xuất, chờ OQ-2) bị đánh dấu treo và báo admin. | Giám sát thời gian job | FR-document-intake-007, FR-document-intake-012 | brainstorm D7, 7.2 |
| BR-document-intake-006 | File nghi độc hại/giả định dạng bị cách ly, không xử lý tiếp cho tới khi admin giải phóng. | Kiểm tra an toàn phát hiện nghi vấn | FR-document-intake-004, FR-document-intake-012 | brainstorm D3 |
| BR-document-intake-007 | Ngữ cảnh/mục đích tài liệu là bắt buộc trước khi ghi nhận; gợi ý tự động không được tự chốt thay người dùng. | Ghi nhận file | FR-document-intake-001 | brainstorm 7.1 |
| BR-document-intake-008 | Trong một lô tải, kết quả từng file tách biệt; file lỗi không được chặn file hợp lệ. | Upload nhiều file | FR-document-intake-009 | brainstorm 5.3 |
| BR-document-intake-009 | Mọi module nhận tài liệu đều phải đi qua cổng này; không có đường upload riêng lách kiểm tra quyền. | Module mới cần nhận file | FR-document-intake-001, FR-document-intake-002 | brainstorm Mục 8 |
| BR-document-intake-010 | Job retry phải idempotent: thử lại không được tạo bản ghi/kết quả trùng. | Job FAILED → QUEUED | FR-document-intake-008 | R-07 sản phẩm |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-document-intake-001 | Không có quyền trên ngữ cảnh đích | Gửi file vào ngữ cảnh thiếu quyền ghi; nếu thiếu quyền thì hệ thống phải từ chối ngay và không lưu file | major | FR-document-intake-002 | File ở trạng thái Bị từ chối kèm lý do | Chọn ngữ cảnh đúng hoặc xin cấp quyền |
| E-document-intake-002 | Sai định dạng | File không thuộc whitelist; nếu sai định dạng thì hệ thống phải từ chối kèm danh sách định dạng được hỗ trợ | minor | FR-document-intake-003 | File Bị từ chối + lý do | Tải file đúng định dạng |
| E-document-intake-003 | Vượt kích thước | File > 20 MB (đề xuất); nếu vượt giới hạn thì hệ thống phải từ chối và nêu giới hạn | minor | FR-document-intake-003 | File Bị từ chối + lý do | Nén/chia file rồi tải lại |
| E-document-intake-004 | File nghi độc hại/giả định dạng | Kiểm tra an toàn phát hiện nghi vấn; nếu nghi nguy hiểm thì hệ thống phải cách ly và báo admin | major | FR-document-intake-004 | File Bị từ chối (cách ly) + lý do | Liên hệ admin; admin giải phóng nếu nhầm |
| E-document-intake-005 | Lỗi lưu trữ/kho đầy | Ghi file thất bại; nếu không lưu được thì hệ thống phải báo lỗi rõ, không để lại file nửa vời và báo admin | major | FR-document-intake-005 | Thông báo lỗi tại màn tải | Thử lại sau; admin xử lý dung lượng |
| E-document-intake-006 | Job thất bại sau hết lượt retry | Job FAILED quá số lần retry; nếu hết lượt thì hệ thống phải đánh dấu thất bại cuối và báo admin + người tải | major | FR-document-intake-008 | File Thất bại + lý do cuối | Admin can thiệp tay hoặc tải file khác |
| E-document-intake-007 | Lô tải có file bị từ chối | Một phần file trong lô vi phạm; nếu file lỗi thì hệ thống phải từ chối riêng file đó, không chặn file hợp lệ | minor | FR-document-intake-009 | Tổng kết nhận/từ chối từng file | Xử lý riêng file bị từ chối |
| E-document-intake-008 | Job treo | Job xử lý quá ngưỡng thời gian; nếu treo thì hệ thống phải đánh dấu rõ và báo admin | major | FR-document-intake-007, FR-document-intake-012 | Trạng thái Treo trong danh sách và hàng chờ admin | Admin đẩy lại hàng chờ hoặc đánh dấu thất bại |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-document-intake-01 | File hợp lệ được xử lý xong trong SLA đã công bố | Tỷ lệ job hoàn tất trong SLA / tổng job của file hợp lệ, theo tháng | ≥ 95% (target chốt theo OQ-2 sản phẩm) |
| SC-document-intake-02 | Không file nào lọt qua kiểm soát quyền | Số file được lưu khi người tải thiếu quyền ghi ngữ cảnh | 0 |
| SC-document-intake-03 | Mọi lượt tải đều truy vết được | Tỷ lệ file có audit đủ (ai/ngữ cảnh/kết quả kiểm tra) | 100% |
| SC-document-intake-04 | Người tải tự khắc phục được file bị từ chối | Tỷ lệ file bị từ chối có file thay thế hợp lệ trong cùng ngày | ≥ 70% |
| SC-document-intake-05 | Job lỗi được phục hồi không cần tải lại file | Tỷ lệ job thất bại lần đầu chuyển thành công sau retry | ≥ 80% |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- **INTAKE_DOCUMENT** — bản ghi file được tiếp nhận: tên file, định dạng,
  kích thước, loại tài liệu, ngữ cảnh đích (loại ngữ cảnh + mã tham chiếu),
  trạng thái tiếp nhận/xử lý, người tải, đường dẫn lưu trữ, thời điểm tạo.
- **PROCESSING_JOB** — job xử lý của một file đã nhận: loại job, trạng thái
  (chờ/đang xử lý/xong/thất bại/treo), số lần thử, thông điệp lỗi, các mốc
  thời gian.
- **INTAKE_AUDIT_EVENT** — sự kiện kiểm toán của cổng tiếp nhận: ai, hành
  động gì (tải/từ chối/cách ly/retry/can thiệp admin), trên file/job nào,
  kết quả và lý do.
- **USERS** (tham chiếu ngoài, thuộc `org-governance`) — người tải và người
  can thiệp.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- Tải file vào ngữ cảnh: chọn file → xác nhận loại/mục đích → kiểm tra
  quyền → kiểm tra định dạng/kích thước → kiểm tra an toàn → lưu + tạo job
  → xử lý → thông báo kết quả.
- Theo dõi và xử lý lỗi: xem trạng thái → thử lại job thất bại / thay thế
  file bị từ chối → hết lượt thì admin can thiệp.
- Upload hàng loạt: chọn nhiều file + một ngữ cảnh → từng file kiểm tra
  độc lập → tổng kết nhận/từ chối.
- Admin xử lý hàng chờ: lọc job treo/thất bại/cách ly → đẩy lại, đánh dấu
  thất bại hoặc giải phóng cách ly → mọi can thiệp có audit.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- Màn đính kèm tài liệu trong ngữ cảnh nghiệp vụ (chọn file, xác nhận
  loại/mục đích).
- Danh sách "Tài liệu đã tải" theo ngữ cảnh (trạng thái từng file, lý do
  từ chối/thất bại, hành động thử lại/thay thế).
- Màn hàng chờ job cho admin (lọc trạng thái/ngữ cảnh/người tải, danh sách
  file cách ly, hành động can thiệp).

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Kiểm tra quyền theo organization/role/data-scope ngay tại điểm tiếp nhận, deny by default | PRD Mục 9; Security owner |
| Audit boundary cho mọi lượt tải và can thiệp | PRD Mục 9; Security owner |
| File chứa PII chỉ gửi provider ngoài theo chính sách đã duyệt; OQ-3/OQ-6/OQ-13 mở thì chỉ dữ liệu synthetic | PRD Mục 9, R-04/R-16; Product + DPO |
| Human-in-the-loop: intake không tự quyết định loại/ngữ cảnh thay người dùng — gợi ý phải được xác nhận | PRD Mục 12 |
| Tiếng Việt là ngôn ngữ ưu tiên cho mọi thông báo | PRD Mục 9 |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Quyết định quyền theo organization/role/data-scope (`org-governance`) | org-governance owner | Không kiểm tra được quyền → không thể nhận file an toàn |
| Kho lưu trữ file của nền tảng | Platform/Operations | Không lưu được file hợp lệ |
| Cơ chế kiểm tra an toàn file (phát hiện độc hại/giả định dạng) | Operations owner (phạm vi OQ-3) | File độc hại có thể lọt vào |
| Module đích nhận output (document-review, cv-intake, document-library) | Owner từng module | Kết quả xử lý không có nơi tiêu thụ |
| Thông báo trong app (`contextual-notifications`) | Notifications owner | Người tải không được báo khi xong/thất bại |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Whitelist, 20 MB/file, 10 file/lần đủ cho nhu cầu v1 | FR-document-intake-003, BR-001/002 phải chỉnh validation |
| SLA 5 phút và ngưỡng treo 15 phút phản ánh kỳ vọng người dùng | NFR-001, SC-01, BR-004/005 đo sai |
| Kiểm tra an toàn file dùng cơ chế sẵn có của hạ tầng | FR-document-intake-004 cần thêm vendor/luồng chờ |
| Người dùng có kết nối ổn định cho file ≤ giới hạn | Tỷ lệ upload lỗi cao, NFR-004 không đạt |

## 12. Open Questions

- [ ] OQ-1: Danh sách định dạng chính thức và giới hạn kích thước/số file
  mỗi lần tải? (đề xuất: whitelist trên, 20 MB/file, 10 file/lần — kế
  thừa URD OQ-1)
- [ ] OQ-2: SLA xử lý job và ngưỡng "job treo" chính thức? (đề xuất 5
  phút / 15 phút — kế thừa URD OQ-2; liên quan OQ-2 sản phẩm)
- [ ] OQ-3: Kiểm tra an toàn file tới mức nào — kiểm định dạng/nội dung
  tại chỗ hay gọi dịch vụ quét bên ngoài? (kế thừa URD OQ-3)
- [ ] OQ-4: File trùng nội dung trong cùng ngữ cảnh: chỉ cảnh báo hay tự
  gộp/từ chối? Hành vi mặc định khi người dùng im lặng? (kế thừa URD
  OQ-4; gỡ marker FR-document-intake-011)
- [ ] OQ-5: Retention/consent cho file tài liệu thô — giữ bao lâu, ai
  được xóa? (liên quan OQ-6 sản phẩm)
- [ ] OQ-6: Khi job cần gọi provider AI bên ngoài, chính sách gửi tài
  liệu chứa PII là gì và ai duyệt? (liên quan OQ-13 sản phẩm — owner
  DPO/legal, KHÔNG tự chốt)
