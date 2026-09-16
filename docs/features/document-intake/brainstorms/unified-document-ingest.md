---
type: brainstorm
feature: document-intake
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md, docs/_reverse/knowledge-and-question-bank/reverse-spec.md]
---

# Cổng tiếp nhận tài liệu thống nhất có theo dõi — document-intake

## 1. Idea Seed

Một điểm tiếp nhận file dùng chung cho mọi luồng nghiệp vụ (tuyển dụng,
onboarding, cuộc họp, công việc, thư viện nguồn): người dùng tải file lên,
hệ thống kiểm tra quyền và định dạng/kích thước, gắn ngữ cảnh nghiệp vụ, lưu
file an toàn rồi tạo job xử lý có trạng thái rõ ràng — người dùng luôn biết
tài liệu của mình đang ở bước nào và được thông báo khi xong hoặc khi lỗi.

## 2. Context

Hiện tài liệu nghiệp vụ đi qua nhiều kênh rời (email, chat, ổ đĩa cá nhân)
và khi đưa vào hệ thống thiếu một cổng kiểm soát chung: không rõ ai được đưa
file vào đâu, file loại gì được chấp nhận, file đã được xử lý hay treo ở đâu.
Đây là feature nền của theme Document AI — `document-review` chỉ có dữ liệu
để review khi intake đã lưu file + job đúng trạng thái, và `cv-intake`,
`document-library` cũng đi qua cổng này. Mọi file đều có thể chứa dữ liệu
nhân sự nhạy cảm nên kiểm tra quyền theo organization/role/data-scope phải
xảy ra ngay tại điểm tiếp nhận, không phải sau khi xử lý.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Tài liệu ứng viên/nhân sự nhận qua nhiều kênh, dễ thất lạc, không biết file đã xử lý chưa | Một chỗ đưa file vào, thấy trạng thái xử lý từng file |
| Admin | Không kiểm soát được ai upload gì vào đâu; file độc hại/sai quyền lọt vào | Cổng vào duy nhất có kiểm quyền, kiểm loại file, audit đầy đủ |
| Nhân viên / quản lý | Đính kèm tài liệu vào cuộc họp/công việc mà không biết file có lên được không | Upload nhanh, thấy ngay file hợp lệ hay bị từ chối và vì sao |
| Reviewer (document-review) | Không biết có file mới cần review hay file đang lỗi | Nhận đúng output đã xử lý xong, kèm trạng thái rõ ràng |

## 4. Capabilities Breakdown

### P0 — must have

- Upload một hoặc nhiều file từ các điểm vào nghiệp vụ (màn tuyển dụng, hồ
  sơ, cuộc họp, công việc, thư viện nguồn); người dùng chọn ngữ cảnh/mục đích
  của tài liệu ngay khi tải lên.
- Kiểm tra quyền trước khi nhận file: người dùng phải có quyền đúng tổ chức/
  vai trò/phạm vi của ngữ cảnh đích; không có quyền → từ chối ngay, không lưu
  file.
- Validate định dạng theo whitelist và kích thước tối đa; file vi phạm → từ
  chối với lý do cụ thể, không tạo job.
- Kiểm tra an toàn file (phát hiện file độc hại/giả mạo định dạng) trước khi
  lưu; file nghi nguy hiểm → cách ly, báo admin, không cho xử lý tiếp.
- Tự phân loại ngữ cảnh theo nơi upload + gợi ý loại tài liệu (CV, giấy tờ
  nhân sự, biên bản, tài liệu nguồn...), người dùng xác nhận/chỉnh trước khi
  ghi nhận.
- Tạo processing job có trạng thái cho từng file hợp lệ; hiển thị tiến độ
  từng file trong danh sách vừa tải.
- Retry job khi xử lý lỗi (thủ công bởi người upload hoặc tự động theo chính
  sách); hết lượt → đánh dấu thất bại + báo admin.
- Thông báo cho người upload khi file xử lý xong hoặc thất bại; báo admin khi
  job treo quá ngưỡng.
- Audit đầy đủ: ai tải, vào ngữ cảnh nào, khi nào, kết quả từng bước kiểm tra.

### P1 — should have

- Upload hàng loạt một lô nhiều file cùng ngữ cảnh, kết quả từng file tách
  biệt (file nào lỗi không chặn file khác).
- Tải lại/thay thế file bị từ chối mà không phải nhập lại ngữ cảnh.
- Màn theo dõi job cho admin: lọc theo trạng thái, ngữ cảnh, người tải; xem
  hàng chờ job thất bại cần xử lý tay.
- Cảnh báo khi upload file trùng nội dung đã có trong cùng ngữ cảnh.

### P2 — nice to have

- Nhận file từ nguồn ngoài (đính kèm email, liên kết drive) qua integration
  đã duyệt.
- Gợi ý loại tài liệu bằng AI dựa trên nội dung (vẫn cần người xác nhận).
- Webhook trạng thái job cho module tiêu thụ.

## 5. Core Flows (Happy Path)

### 5.1 Tải file vào đúng ngữ cảnh và được xử lý

1) Người dùng từ màn nghiệp vụ (vd hồ sơ ứng viên) chọn "Đính kèm tài liệu",
   chọn file và xác nhận loại/mục đích.
2) Hệ thống kiểm tra quyền của người dùng trên ngữ cảnh đích; kiểm tra định
   dạng và kích thước; kiểm tra an toàn file.
3) File hợp lệ → lưu vào kho, ghi nhận ngữ cảnh + loại tài liệu, tạo job xử
   lý trạng thái QUEUED.
4) Job chuyển PROCESSING → DONE; kết quả xử lý (text/metadata trích xuất) sẵn
   sàng cho bước review của `document-review`.
5) Người dùng thấy file chuyển "Đã xử lý" trong danh sách và nhận thông báo
   hoàn tất.

```
Người dùng                     Cổng tiếp nhận                        Hệ thống
─────────────────────────────────────────────────────────────────────────────────

Chọn file + xác nhận
loại/mục đích
        │
        ▼
── Người dùng có quyền trên ngữ cảnh đích? ──┐
        │                                    │
      Không ▶ TỪ CHỐI ngay, không lưu file   │
        │                                    │
       Có ▼                                  │
── Định dạng trong whitelist                 │
   và kích thước ≤ giới hạn? ──┐             │
        │                       │            │
      Không ▶ TỪ CHỐI, nêu rõ lý do          │
       Có ▼                     │            │
── File qua kiểm tra an toàn? ──┤            │
        │                       │            │
     Nghi độc hại ▶ CÁCH LY,    │            │
                    báo admin,  │            │
                    không xử lý │            │
       Có ▼                     │            │
┌──────────────────────────┐    │            │
│ Lưu file vào kho + ghi   │    │            │
│ ngữ cảnh/loại tài liệu   │    │            │
│ + audit người tải        │    │            │
└───────────┬──────────────┘    │            │
            ▼                   │            │
┌──────────────────────────┐    │            │
│ Tạo job xử lý: QUEUED    │    │            │
└───────────┬──────────────┘    │            │
            ▼                   │            │
        PROCESSING              │            │
            │                   │            │
     ── Xử lý thành công? ──┐   │            │
            │               │   │            │
          Lỗi ▶ FAILED      │   │            │
            │   retry ≤ 3 lần│  │            │
            │   hết lượt ──▶ │  │            │
            │   báo admin +  │  │            │
            │   người tải    │  │            │
            ▼               │   │            │
          DONE ──▶ kết quả sẵn sàng          │
            │      cho document-review       │
            ▼                                │
   Thông báo "Đã xử lý" tới người tải        │
```

### 5.2 Theo dõi trạng thái và xử lý file lỗi

1) Người dùng mở danh sách "Tài liệu đã tải" → thấy từng file với trạng thái
   (Đang kiểm tra / Chờ xử lý / Đang xử lý / Đã xử lý / Thất bại / Bị từ chối).
2) Với file Thất bại: xem lý do, chọn "Thử lại" → job quay lại QUEUED; hết
   lượt retry tự động thì chỉ admin còn đường xử lý tay.
3) Với file Bị từ chối: xem lý do (sai quyền / sai loại / quá lớn / nghi độc
   hại), tải file khác thay thế.

### 5.3 Upload hàng loạt cùng ngữ cảnh

1) Người dùng chọn nhiều file cùng lúc, xác nhận một ngữ cảnh chung.
2) Hệ thống kiểm tra từng file độc lập: file hợp lệ → lưu + tạo job; file lỗi
   → từ chối kèm lý do, không chặn các file còn lại.
3) Danh sách kết quả hiển thị rõ file nào được nhận, file nào bị từ chối.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Người dùng có quyền trên ngữ cảnh đích? | Tiếp tục kiểm tra file | Từ chối, không lưu file, ghi audit từ chối |
| D2 | 5.1 | Định dạng thuộc whitelist và kích thước ≤ giới hạn? | Tiếp tục kiểm tra an toàn | Từ chối kèm lý do cụ thể (sai loại / quá lớn) |
| D3 | 5.1 | File qua được kiểm tra an toàn? | Lưu file + tạo job | Cách ly file, báo admin, đánh dấu Bị từ chối |
| D4 | 5.1 | Job xử lý thành công? | DONE + mở đường cho document-review + báo người tải | FAILED, vào nhánh retry |
| D5 | 5.2 | Còn lượt retry? | Job quay lại QUEUED | Đánh dấu thất bại cuối, báo admin + người tải |
| D6 | 5.1 | File trùng nội dung đã có trong cùng ngữ cảnh? | Cảnh báo, cho người dùng chọn giữ bản mới hay bỏ | Nhận bình thường |
| D7 | 5.1 | Job ở PROCESSING quá ngưỡng thời gian? | Đánh dấu treo + báo admin | Tiếp tục chờ |

### 6.2 Scenario Matrix

| Người tải | Ngữ cảnh đích | Quyền | Kết quả |
|---|---|---|---|
| HR | Hồ sơ ứng viên trong phạm vi phụ trách | có | Nhận file, tạo job |
| HR | Hồ sơ ứng viên ngoài phạm vi phụ trách | không | Từ chối ngay (D1) |
| Nhân viên | Cuộc họp/công việc mình tham gia | có | Nhận file, tạo job |
| Nhân viên | Ngữ cảnh phòng ban khác | không | Từ chối ngay (D1) |
| Admin | Thư viện nguồn / bất kỳ ngữ cảnh | có | Nhận file, tạo job |
| Tài khoản đã deactivate | mọi ngữ cảnh | không | Từ chối ngay (D1) |

### 6.3 State Transitions

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| file | — | ĐANG KIỂM TRA | người dùng gửi file | — |
| file | ĐANG KIỂM TRA | BỊ TỪ CHỐI | sai quyền / sai loại / quá lớn / nghi độc hại | không (tải file khác) |
| file | ĐANG KIỂM TRA | ĐÃ NHẬN | qua mọi kiểm tra, lưu kho | — |
| job | — | QUEUED | file ĐÃ NHẬN | — |
| job | QUEUED | PROCESSING | đến lượt xử lý | — |
| job | PROCESSING | DONE | xử lý thành công | — |
| job | PROCESSING | FAILED | lỗi xử lý/timeout | có (retry → QUEUED) |
| job | FAILED | QUEUED | retry (tự động hoặc người dùng bấm Thử lại) | — |
| job | FAILED | THẤT BẠI CUỐI | hết lượt retry | không (admin xử lý tay) |
| job | PROCESSING | TREO | quá ngưỡng thời gian | có (admin đẩy lại QUEUED) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Người dùng đóng trình duyệt giữa lúc đang tải file lên | không có file, không có job | tải lại từ đầu | không cần |
| Người dùng đóng trình duyệt sau khi file ĐÃ NHẬN | file + job QUEUED/PROCESSING | job tiếp tục chạy nền; trạng thái hiện khi mở lại | không cần |
| Bộ xử lý lỗi/timeout giữa job | job FAILED | retry theo chính sách | hết lượt → THẤT BẠI CUỐI, báo admin |
| Kho lưu trữ lỗi khi ghi file | file chưa lưu, chưa có job | báo lỗi cho người dùng, mời tải lại | không để lại file nửa vời |
| 2 người cùng tải file giống nhau vào cùng ngữ cảnh | cả 2 file + 2 job | cảnh báo trùng nội dung, người sau quyết giữ/bỏ | — |
| File mới tải trong khi file cũ cùng ngữ cảnh đang xử lý | cả 2 job độc lập | xử lý song song, không ghi đè nhau | — |

### 6.5 Other Edge Cases

- File 0 byte hoặc file đổi tên đuôi giả định dạng → kiểm tra nội dung thật
  của file ở bước an toàn, từ chối khi lệch định dạng khai báo.
- Tên file trùng trong cùng ngữ cảnh → nhận bình thường, phân biệt bằng bản
  ghi riêng; không ghi đè file cũ.
- File bị module đích từ chối sau khi job DONE (vd nội dung không đọc được) →
  chuyển sang `document-review` với trạng thái cần xử lý tay, không xóa file.
- Hết dung lượng kho → báo lỗi rõ cho người tải, báo admin; không nhận file
  mới tới khi có chỗ.
- Job TREO → admin xem hàng chờ, đẩy lại QUEUED hoặc đánh dấu thất bại.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| File định dạng | whitelist: PDF, DOCX, XLSX, CSV, TXT, PNG, JPG, WEBP (đề xuất — chờ duyệt, OQ-1) |
| File kích thước | ≤ 20 MB mỗi file (đề xuất — chờ duyệt, OQ-1) |
| Tên file | ≤ 255 ký tự, cho phép Unicode tiếng Việt |
| Ngữ cảnh/mục đích | bắt buộc chọn trước khi ghi nhận; gợi ý tự động chỉ là đề xuất |
| Quyền | phải có quyền ghi trên ngữ cảnh đích theo organization/role/data-scope |
| Nội dung file | phải khớp định dạng khai báo; lệch → coi như nghi giả mạo, cách ly |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Kích thước mỗi file | 20 MB (đề xuất — chờ duyệt) | — | Từ chối kèm lý do |
| Số file mỗi lần tải | 10 file (đề xuất — chờ duyệt) | 1 lần tải | File vượt quá bị từ chối riêng |
| Retry job | 3 lần (đề xuất — chờ duyệt) | mỗi job | THẤT BẠI CUỐI + báo admin |
| SLA xử lý job | 5 phút (đề xuất — chờ duyệt, OQ-2) | mỗi job | Đánh dấu chậm, vẫn tiếp tục |
| Ngưỡng job treo | 15 phút ở PROCESSING (đề xuất — chờ duyệt, OQ-2) | liên tục | Đánh dấu TREO + báo admin |
| Retention file thô | Chờ DPO/legal xác nhận theo OQ-6 sản phẩm | — | Không áp dụng dữ liệu thật trước khi chính sách được duyệt |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Không có quyền trên ngữ cảnh đích | "Bạn không có quyền đính kèm tài liệu vào mục này" | E-? |
| Sai định dạng | "Định dạng {đuôi file} chưa được hỗ trợ — chọn file PDF, DOCX, XLSX, CSV, TXT hoặc ảnh" | E-? |
| Quá kích thước | "File {tên file} vượt quá 20 MB — chọn file nhỏ hơn" | E-? |
| File nghi độc hại | "File {tên file} không qua được kiểm tra an toàn — liên hệ quản trị nếu đây là nhầm lẫn" | E-? |
| Kho đầy / lỗi lưu | "Chưa lưu được file — thử lại sau ít phút" | E-? |
| Job thất bại sau retry | "File {tên file} xử lý thất bại sau nhiều lần thử — quản trị đã được thông báo" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| File được nhận | "Đã tiếp nhận {tên file} — đang chờ xử lý" |
| Job xong | "Tài liệu {tên file} đã xử lý xong" |
| Retry được chấp nhận | "Đã đưa {tên file} vào hàng chờ xử lý lại" |
| Upload hàng loạt | "Đã nhận {x}/{n} file — {y} file bị từ chối, xem chi tiết bên dưới" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Đang xử lý | "{tên file} đang được xử lý" |
| File trùng | "Một file có nội dung giống {tên file} đã tồn tại trong mục này — giữ bản mới hay bỏ?" |
| Job treo (gửi admin) | "Job xử lý {tên file} đang treo quá 15 phút — kiểm tra hàng chờ" |
| Gợi ý loại tài liệu | "Hệ thống gợi ý đây là {loại tài liệu} — xác nhận hoặc chọn lại" |

## 8. Assumptions

- `org-governance` cung cấp đủ organization/role/data-scope để kiểm tra quyền
  ngay tại điểm tiếp nhận.
- Kho lưu trữ file của nền tảng đã sẵn sàng và có giới hạn dung lượng quản lý
  được.
- Việc kiểm tra an toàn file (phát hiện độc hại/giả định dạng) có thể dùng một
  cơ chế sẵn có của hạ tầng; nếu phải gọi dịch vụ ngoài thì nằm trong OQ-3.
- Mọi module nhận tài liệu (cv-intake, document-review, document-library,
  meeting, task) đều đi qua cổng này — không có đường upload riêng lách quyền.
- Người dùng có kết nối đủ ổn định cho file ≤ giới hạn; upload lớn hơn là
  ngoài phạm vi v1.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| File độc hại lọt vào kho | thỉnh thoảng | sự cố bảo mật, ảnh hưởng toàn tổ chức | kiểm tra an toàn bắt buộc trước lưu + cách ly + báo admin |
| Job treo/lỗi âm thầm → người dùng tưởng file đã xong | thỉnh thoảng | hồ sơ thiếu tài liệu, quyết định chậm | trạng thái hiển thị rõ + ngưỡng treo báo admin + retry |
| Phân loại/ngữ cảnh sai → tài liệu vào nhầm hồ sơ | thỉnh thoảng | lộ dữ liệu sang người không đúng phạm vi | người dùng xác nhận loại/ngữ cảnh; kiểm quyền theo ngữ cảnh đích |
| Người dùng bỏ ý định upload vì bị từ chối không rõ lý do | thường | tài liệu tiếp tục đi kênh ngoài, feature mất tác dụng | wording lỗi nêu đúng lý do + cách sửa |
| Retention/consent file thô chưa được duyệt (OQ-6) | hiếm | vi phạm cam kết privacy khi pilot dữ liệu thật | chỉ dùng dữ liệu synthetic cho tới khi policy duyệt |

## 10. Success Criteria (preliminary)

- Tỷ lệ file hợp lệ được xử lý xong trong SLA đã công bố — target chốt ở
  OQ-2.
- 100% file được nhận có bản ghi audit đủ (ai, ngữ cảnh, kết quả kiểm tra).
- 0 file được lưu khi người tải không có quyền trên ngữ cảnh đích.
- Tỷ lệ job FAILED được retry thành công — baseline chờ OQ-1 sản phẩm.

## 11. Open Questions

- [ ] OQ-1: Danh sách định dạng chính thức và giới hạn kích thước/số file mỗi
  lần tải là bao nhiêu? (đề xuất: whitelist trên, 20 MB/file, 10 file/lần)
- [ ] OQ-2: SLA xử lý job và ngưỡng "job treo" chính thức là bao lâu? (đề
  xuất: 5 phút / 15 phút)
- [ ] OQ-3: Kiểm tra an toàn file cần tới mức nào — chỉ kiểm định dạng/chữ ký
  file, hay phải gọi dịch vụ quét malware bên ngoài (tên dịch vụ nào)?
- [ ] OQ-4: File trùng nội dung trong cùng ngữ cảnh: chỉ cảnh báo hay tự gộp/
  từ chối?
- [ ] OQ-5: Kế thừa OQ-6 sản phẩm: retention/consent cho file tài liệu thô là
  gì — giữ bao lâu, ai được xóa?
- [ ] OQ-6: Kế thừa OQ-13 sản phẩm (mở rộng phạm vi): khi job xử lý cần gọi
  provider AI bên ngoài (OCR/trích xuất), chính sách gửi tài liệu chứa PII là
  gì và ai duyệt?

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd document-intake` — capture user perspective
- `/brd document-intake` — business case
- `/prd-epic document-intake` — product scope
