---
type: urd
feature: document-intake
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md, docs/features/document-intake/brainstorms/unified-document-ingest.md]
---

# document-intake - User Requirements Document

## 1. Purpose

Cho HR và người dùng nội bộ một cổng tiếp nhận tài liệu thống nhất: đưa file
vào đúng ngữ cảnh nghiệp vụ, biết ngay file được nhận hay bị từ chối và vì
sao, theo dõi trạng thái xử lý từng file cho tới khi kết quả sẵn sàng cho
bước review — thay vì tài liệu đi qua email/chat/ổ đĩa rời và không ai biết
file đang treo ở đâu.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Tài liệu ứng viên/nhân sự đến qua email, chat, USB, ổ đĩa cá nhân | Không một điểm vào có kiểm soát; không biết file nào đã được xử lý, file nào còn treo | Hồ sơ thiếu tài liệu, phải hỏi lại nhiều kênh, quyết định chậm | Confirmed — PRD Mục 2, 7.17 |
| Admin | Không rõ ai đang đưa file gì vào hệ thống | File sai quyền, sai loại hoặc độc hại có thể lọt vào mà không có dấu vết | Sự cố bảo mật, không truy vết được khi kiểm tra | Confirmed — PRD Mục 7.17 (rủi ro chính), brainstorm Mục 3 |
| Nhân viên / quản lý | Đính kèm tài liệu vào cuộc họp/công việc qua công cụ rời | Không biết file có lên được không, bị từ chối vì lý do gì | Upload lặp lại mò mẫm, tài liệu thất lạc | Confirmed — brainstorm Mục 3 |
| Reviewer (document-review) | Phải tự hỏi đầu vào có sẵn chưa | Không có tín hiệu "output đã xử lý xong, sẵn sàng review" | Review chậm hoặc review trên dữ liệu dở | Assumption — suy từ PRD 7.18 dependency |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Đưa tài liệu vào hồ sơ ứng viên, nhân sự, thư viện nguồn trong phạm vi phụ trách | Một chỗ đưa file vào, thấy trạng thái xử lý từng file tới khi xong | Nhiều kênh rời, mất trạng thái, không biết file lỗi vì sao |
| secondary | Admin | Giám sát cổng tiếp nhận, xử lý job treo/thất bại và file bị cách ly | Kiểm soát được ai upload gì vào đâu, can thiệp khi job treo | File độc hại/sai quyền lọt vào âm thầm |
| secondary | Nhân viên / quản lý | Đính kèm tài liệu vào cuộc họp, công việc mình tham gia | Upload nhanh, thấy ngay file hợp lệ hay bị từ chối | Không rõ file đã lên được chưa |
| secondary | Reviewer | Nhận output đã xử lý để review ở document-review | Chỉ nhận file đã qua kiểm tra và xử lý xong | Phải chờ không rõ tiến độ đầu vào |

## 3. Scope Boundaries

### In Scope

- Người dùng đưa một hoặc nhiều file vào từ điểm vào nghiệp vụ, chọn/xác nhận
  ngữ cảnh và loại tài liệu ngay khi tải lên.
- Người dùng biết ngay file được nhận hay bị từ chối, kèm lý do cụ thể đọc
  hiểu được.
- Người dùng theo dõi trạng thái từng file (đang kiểm tra / chờ xử lý / đang
  xử lý / đã xử lý / thất bại / bị từ chối) và được thông báo khi xong hoặc
  khi thất bại sau retry.
- Người dùng thử lại file thất bại, thay thế file bị từ chối.
- Admin thấy hàng chờ job, file bị cách ly và job treo để xử lý.
- Mọi lượt tải đều có nhật ký truy vết: ai, vào ngữ cảnh nào, kết quả kiểm
  tra từng bước.

### Out of Scope

- Review và xác nhận nội dung trích xuất — thuộc `document-review`.
- Quản lý phiên bản, phát hành và tái sử dụng tài liệu nguồn — thuộc
  `document-library`.
- Nhận file từ nguồn ngoài (email đính kèm, drive) qua integration — giai
  đoạn sau, phụ thuộc `external-integrations`.
- Chấp nhận mọi định dạng/kích thước không giới hạn — PRD 7.17 nêu rõ chưa
  làm.
- Bóc tách ảnh giấy tờ nhanh ngoài pipeline — thuộc `vision-ocr` (module
  độc lập).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi cần đưa tài liệu vào một hồ sơ/ngữ cảnh cụ thể | Một điểm tải lên duy nhất trong màn nghiệp vụ, gắn sẵn ngữ cảnh | File đi vào đúng chỗ, không phải dẫn qua kênh ngoài | Critical | Confirmed — PRD 7.17, brainstorm P0 |
| UN-002 | HR | Ngay khi gửi file | Biết ngay file được nhận hay bị từ chối, kèm lý do và cách sửa | Không upload mò, không bỏ cuộc vì lỗi khó hiểu | Critical | Confirmed — brainstorm 5.1, 7.3 |
| UN-003 | HR | Sau khi file được nhận | Thấy trạng thái xử lý từng file và được báo khi xong/thất bại | Không phải hỏi "file xong chưa", kịp thời xử lý file lỗi | Critical | Confirmed — PRD 7.17 (queue/status) |
| UN-004 | HR | Khi file xử lý thất bại | Thử lại được từ danh sách, hiểu khi nào phải nhờ admin | Không mất file, không phải tải lại từ đầu | High | Confirmed — brainstorm 5.2 |
| UN-005 | Admin | Khi vận hành cổng tiếp nhận | Thấy job treo, job thất bại hết lượt, file bị cách ly để can thiệp | Không có lỗi âm thầm; mọi sự cố có người xử lý | High | Confirmed — brainstorm P0/P1 |
| UN-006 | Admin | Khi kiểm tra hoặc điều tra sự cố | Truy vết ai tải file gì, vào ngữ cảnh nào, kết quả kiểm tra ra sao | Đủ evidence cho audit và điều tra | High | Confirmed — PRD Mục 9 (audit boundary) |
| UN-007 | Nhân viên / quản lý | Khi đính kèm tài liệu vào họp/công việc | Upload trong đúng màn đang làm, không cần hiểu cơ chế xử lý nền | Tài liệu đính kèm thành công, thấy trạng thái rõ | Medium | Confirmed — brainstorm Mục 3, scenario matrix |
| UN-008 | HR | Khi tải một lô hồ sơ cùng ngữ cảnh | File lỗi không chặn file hợp lệ trong cùng lần tải | Không phải tải lại cả lô vì 1 file lỗi | Medium | Confirmed — brainstorm P1, flow 5.3 |
| UN-009 | Reviewer | Khi file xử lý xong | Nhận đúng output hoàn chỉnh để review, không phải đón file dở | Bắt đầu review ngay trên dữ liệu đủ | High | Assumption — suy từ dependency PRD 7.18 |

## 5. Prioritized User Journeys

### Journey 1: Đưa tài liệu vào hồ sơ và theo dõi tới khi xử lý xong

- **User:** HR
- **Importance:** Critical
- **Trigger:** HR đang ở màn hồ sơ ứng viên/nhân sự cần đính kèm tài liệu
- **Expected outcome:** File được nhận, xử lý xong trong thời hạn công bố,
  sẵn sàng cho bước review; HR thấy trạng thái từng bước
- **Related needs:** UN-001, UN-002, UN-003

1) Từ màn nghiệp vụ, HR chọn "Đính kèm tài liệu", chọn file, xác nhận
   loại/mục đích được hệ thống gợi ý.
2) Hệ thống báo file được tiếp nhận vào hàng chờ xử lý.
3) HR theo dõi trạng thái trong danh sách "Tài liệu đã tải".
4) Khi xử lý xong, HR nhận thông báo "đã xử lý" và file chuyển trạng thái
   Đã xử lý.

**Independent verification:** HR đứng ở màn hồ sơ bất kỳ, đưa 1 file hợp lệ
vào, quan sát được trạng thái chuyển tới "Đã xử lý" và nhận thông báo — không
cần liên quan tới journey khác.

### Journey 2: Xử lý file bị từ chối hoặc xử lý thất bại

- **User:** HR
- **Importance:** High
- **Trigger:** File HR vừa tải bị từ chối (sai loại/quá lớn/nghi độc hại)
  hoặc job thất bại
- **Expected outcome:** HR hiểu lý do, sửa và tải file thay thế hoặc thử lại
  job mà không mất ngữ cảnh
- **Related needs:** UN-002, UN-004

1) HR thấy file ở trạng thái Bị từ chối/Thất bại kèm lý do cụ thể.
2) Với file bị từ chối: HR tải file khác thay thế, ngữ cảnh giữ nguyên.
3) Với job thất bại: HR bấm "Thử lại", job quay lại hàng chờ.
4) Nếu hết lượt thử lại, HR thấy trạng thái thất bại cuối và biết admin đã
   được báo.

**Independent verification:** Cố tình tải file sai định dạng → thấy lý do từ
chối đúng → tải file hợp lệ thay thế thành công.

### Journey 3: Tải một lô tài liệu cùng ngữ cảnh

- **User:** HR
- **Importance:** Medium
- **Trigger:** HR có nhiều file cho cùng một hồ sơ/đợt tuyển
- **Expected outcome:** File hợp lệ được nhận, file lỗi bị từ chối riêng với
  lý do, không chặn nhau
- **Related needs:** UN-008, UN-002

1) HR chọn nhiều file, xác nhận một ngữ cảnh chung.
2) Hệ thống báo tổng kết: bao nhiêu file được nhận, bao nhiêu bị từ chối.
3) HR xử lý riêng các file bị từ chối.

**Independent verification:** Tải 1 lô có lẫn file sai định dạng → file hợp
lệ vẫn vào hàng chờ, file lỗi có lý do riêng.

### Journey 4: Admin xử lý job treo và file bị cách ly

- **User:** Admin
- **Importance:** Medium
- **Trigger:** Cảnh báo job treo / file nghi độc hại / job thất bại hết lượt
- **Expected outcome:** Admin thấy hàng chờ sự cố, đẩy lại job hoặc đánh dấu
  thất bại có lý do, có audit
- **Related needs:** UN-005, UN-006

1) Admin mở màn theo dõi job, lọc trạng thái treo/thất bại/cách ly.
2) Với job treo: đẩy lại hàng chờ hoặc đánh dấu thất bại.
3) Với file cách ly: xem lý do, quyết định giải phóng hay giữ cách ly.
4) Mọi can thiệp được ghi nhật ký.

**Independent verification:** Tạo 1 job treo giả lập → admin thấy trong hàng
chờ và đẩy lại thành công.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Tải file vào ngữ cảnh mình không có quyền | File bị từ chối | Thấy rõ "không có quyền đính kèm vào mục này", file không được lưu | Journey 1 / UN-001 |
| File sai định dạng hoặc quá kích thước | File bị từ chối | Lý do cụ thể + gợi ý định dạng/giới hạn được chấp nhận | Journey 2 / UN-002 |
| File nghi độc hại hoặc giả định dạng | File bị cách ly | Người tải thấy lý do và biết admin được báo; không cho xử lý tiếp | Journey 2 / UN-005 |
| Đóng trình duyệt giữa lúc đang tải | File chưa lên | Không có file nửa vời; tải lại từ đầu | Journey 1 / UN-002 |
| Đóng trình duyệt sau khi file đã được nhận | Không theo dõi được tức thì | Job vẫn chạy nền; mở lại thấy trạng thái mới nhất + thông báo | Journey 1 / UN-003 |
| Tải file trùng nội dung đã có trong cùng ngữ cảnh | Có thể tạo bản trùng | Được cảnh báo và chọn giữ bản mới hay bỏ | Journey 1 / UN-001 |
| Kho lưu trữ hết chỗ | Không tải được | Thấy lỗi rõ "chưa lưu được — thử lại sau", admin được báo | Journey 2 / UN-005 |
| Tài khoản đã nghỉ việc cố tải file | Bị từ chối | Từ chối ngay tại điểm tiếp nhận, ghi audit | Journey 1 / UN-006 |
| Job treo không chịu xử lý | Người tải chờ mãi | Trạng thái "treo" hiển thị rõ; admin được báo để can thiệp | Journey 4 / UN-005 |

## 7. User-side Constraints

- Người dùng làm việc bằng tiếng Việt; mọi thông báo trạng thái/lỗi phải là
  tiếng Việt tự nhiên, nêu được lý do và cách sửa.
- Người dùng chỉ thấy và chỉ tải được file vào ngữ cảnh thuộc phạm vi quyền
  của mình (tổ chức/vai trò/phạm vi dữ liệu).
- Người dùng truy cập qua trình duyệt web trên máy tính; file lớn hơn giới
  hạn công bố là ngoài khả năng của v1.
- Người dùng cần biết trạng thái file gần như tức thì — không chấp nhận phải
  tải lại trang nhiều lần mới thấy tiến độ.
- File chứa dữ liệu nhân sự nhạy cảm: người dùng kỳ vọng chỉ người đúng
  quyền mới xem/xử lý được, và file bị từ chối không bị giữ lại âm thầm.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Whitelist định dạng PDF/DOCX/XLSX/CSV/TXT/PNG/JPG/WEBP, ≤20 MB/file, ≤10 file/lần là đủ cho nhu cầu v1 | Phạm vi tiếp nhận thừa/thiếu, phải chỉnh validation sau | Đề xuất trong brainstorm, chưa duyệt | Chốt ở OQ-1 trước khi khóa SRS |
| SLA xử lý 5 phút và ngưỡng treo 15 phút phản ánh kỳ vọng người dùng | Thông báo trễ/sớm, chỉ số "xử lý trong SLA" sai | Đề xuất, chưa duyệt | Chốt ở OQ-2 |
| Kiểm tra an toàn file có sẵn cơ chế hạ tầng (không cần mua dịch vụ quét riêng) | Nếu phải gọi dịch vụ ngoài: thêm vendor, chi phí và luồng chờ | Chưa xác nhận | Chốt ở OQ-3 |
| Mọi module nhận tài liệu đều đi qua cổng này, không đường upload riêng | File lách quyền, audit thiếu | Giả định từ brainstorm | Xác nhận khi các module tiêu thụ (cv-intake, document-review, document-library) được spec |
| Người dùng có kết nối ổn định cho file ≤ giới hạn | Upload thất bại thường xuyên với file lớn | Hợp lý cho ngữ cảnh văn phòng | Theo dõi tỷ lệ upload lỗi khi pilot |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | File hợp lệ được xử lý xong trong SLA đã công bố | Chưa có — xác lập bằng đo thời gian nhận → xử lý xong trong 1 tháng pilot | ≥ 95% file hợp lệ xong trong SLA (target chốt theo OQ-2) | Tỷ lệ job DONE trong SLA / tổng job của file hợp lệ | Hàng tháng trong pilot |
| USC-002 | Người tải hiểu và khắc phục được file bị từ chối | Chưa có — xác lập bằng tỷ lệ file bị từ chối được tải lại thành công | ≥ 70% file bị từ chối được thay thế thành công trong cùng ngày | Tỷ lệ file REJECTED có file thay thế hợp lệ | Hàng tháng |
| USC-003 | Không file nào được lưu khi người tải sai quyền | 0 kỳ vọng tuyệt đối | 0 file lưu khi sai quyền | Kiểm tra audit: file lưu mà thiếu quyền ghi ngữ cảnh | Liên tục |
| USC-004 | Job thất bại được phục hồi không cần tải lại file | Chưa có — xác lập bằng tỷ lệ FAILED → DONE sau retry | ≥ 80% job thất bại lần đầu thành công sau retry | Tỷ lệ job FAILED chuyển DONE sau retry | Hàng tháng |
| USC-005 | Mọi lượt tải đều truy vết được | 100% kỳ vọng | 100% file có audit đủ (ai/ngữ cảnh/kết quả kiểm tra) | Kiểm tra mẫu audit định kỳ | Mỗi release |

## 10. Open Questions

- [ ] OQ-1: Danh sách định dạng chính thức và giới hạn kích thước/số file mỗi
  lần tải là bao nhiêu? (đề xuất từ brainstorm: whitelist trên, 20 MB/file,
  10 file/lần — kế thừa brainstorm OQ-1)
- [ ] OQ-2: SLA xử lý job và ngưỡng "job treo" chính thức? (đề xuất 5 phút /
  15 phút — kế thừa brainstorm OQ-2; liên quan target USC-001)
- [ ] OQ-3: Kiểm tra an toàn file tới mức nào — kiểm định dạng/nội dung tại
  chỗ hay gọi dịch vụ quét bên ngoài? (kế thừa brainstorm OQ-3)
- [ ] OQ-4: File trùng nội dung trong cùng ngữ cảnh: chỉ cảnh báo hay tự
  gộp/từ chối? (kế thừa brainstorm OQ-4)
- [ ] OQ-5: Retention/consent cho file tài liệu thô — giữ bao lâu, ai được
  xóa? (kế thừa OQ-6 sản phẩm)
- [ ] OQ-6: Khi job xử lý cần gọi provider AI bên ngoài (OCR/trích xuất),
  chính sách gửi tài liệu chứa PII là gì và ai duyệt? (kế thừa OQ-13 sản
  phẩm, mở rộng phạm vi)
