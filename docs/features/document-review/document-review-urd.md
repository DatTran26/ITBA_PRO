---
type: urd
feature: document-review
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/document-review/brainstorms/human-confirmed-extraction-publish.md]
---

# document-review — User Requirements Document

## 1. Purpose

Cho HR/reviewer một màn đối chiếu có kiểm chứng để biến output OCR/trích
xuất thành dữ liệu đáng tin: mỗi field kèm confidence và vị trí nguồn
trên tài liệu gốc, con người sửa và xác nhận trước khi kết quả được
publish sang module nghiệp vụ — không field nào trở thành fact khi chưa
qua review.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Nhận file scan/ảnh giấy tờ rồi nhập tay toàn bộ vào hồ sơ | Mất thời gian, dễ sai sót khi gõ lại; nếu dùng OCR ngoài thì không có chỗ kiểm tra | Nhập liệu chậm, dữ liệu hồ sơ thiếu kiểm chứng | Confirmed — PRD Mục 7.18 ("giảm nhập liệu mà vẫn kiểm chứng được"), JTBD-HR-01 |
| Reviewer được giao | Không có hàng chờ cho biết file nào chờ review | File xử lý xong nằm im, không ai biết mình phải review | Tài liệu "treo" giữa intake và module nghiệp vụ, pipeline tuyển chậm | Assumption — suy từ dependency document-intake → document-review (PRD Mục 7.18) |
| HR | OCR tiếng Việt sai dấu/sai số/sai ngày | Không có cách biết chỗ nào máy đọc chưa chắc | Phải rà lại toàn bộ như nhập tay — mất lợi ích OCR | Confirmed — PRD Mục 7.18 (confidence, source location), rủi ro R-05 |
| Module tiêu thụ (cv-intake, document-library) | Nhận dữ liệu trích xuất không rõ đã được ai kiểm chứng | Không phân biệt được "máy đoán" và "người đã xác nhận" | Facts sai lọt vào hồ sơ/câu hỏi phát sinh | Confirmed — PRD Mục 7.18 (publish sau xác nhận), Mục 12 (human-in-the-loop) |
| Admin | Không nhìn thấy backlog review | Không phân công/giải quyết được tài liệu treo | Tài liệu chờ vô thời hạn | Assumption — suy từ nhu cầu vận hành hàng chờ của intake |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR (reviewer) | Được giao review tài liệu đã trích xuất trong phạm vi ngữ cảnh của mình | Đối chiếu nhanh, sửa chỗ sai, xác nhận và publish với ít thao tác nhất | Nhập tay lại toàn bộ; không biết chỗ máy đọc chưa chắc; sợ dữ liệu sai thành fact |
| secondary | Admin | Giám sát hàng chờ review, phân công | Thấy backlog, reassign khi cần, mở đường nhập tay khi trích xuất hỏng | Không có tầm nhìn tài liệu treo |
| secondary | Người tải file | Đã đưa file qua intake | Biết file của mình đã được review/publish chưa | Chờ không rõ tiến độ |
| out | Module tiêu thụ (cv-intake, document-library, ai-question-generation) | Nhận payload đã publish | Chỉ tiêu thụ dữ liệu đã xác nhận kèm provenance | (không phải người dùng) |
| out | Người trong tài liệu (ứng viên/nhân viên) | Dữ liệu của mình được trích xuất | Facts về mình được kiểm chứng | Không thao tác trong feature |

## 3. Scope Boundaries

### In Scope

- Nhận output đã xử lý xong từ `document-intake` và tạo kết quả trích
  xuất ở trạng thái "Chờ review".
- OCR text tiếng Việt (và giữ ngôn ngữ gốc khác khi gặp), giữ cấu trúc
  dòng/đoạn/bảng; đánh dấu phần không đọc được.
- Trích xuất field có cấu trúc theo loại tài liệu, mỗi field kèm giá trị
  đề xuất + confidence + vị trí nguồn trên tài liệu gốc.
- Màn review đối chiếu tài liệu gốc ↔ field; sửa/xác nhận từng field;
  giữ diff giữa giá trị máy và giá trị con người.
- Publish payload đã xác nhận kèm provenance sang module đích, có trạng
  thái và gửi lại khi lỗi (idempotent).
- Hàng chờ review, gán/reassign reviewer, nhắc chờ, audit đầy đủ.
- Yêu cầu xử lý lại trên cùng file khi kết quả không dùng được.

### Out of Scope

- Cổng tiếp nhận file, kiểm tra quyền/định dạng/an toàn và retry job —
  thuộc `document-intake`.
- Ghi đè trực tiếp hồ sơ nghiệp vụ khi chưa review (PRD "Chưa làm") —
  mọi dữ liệu sang module đích phải qua publish sau xác nhận.
- Định nghĩa ngữ nghĩa field của từng module đích (vd cách cv-intake
  map facts vào hồ sơ ứng viên) — feature này chỉ bàn giao payload.
- Quản lý phiên bản tài liệu nguồn và topic — thuộc `document-library`.
- Scan ảnh nhanh ngoài pipeline không lưu trữ — thuộc `vision-ocr`.
- Chọn/cấu hình engine OCR cụ thể — dependency hạ tầng, không phải
  requirement nghiệp vụ của feature này.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi một file đã xử lý xong | Thấy tài liệu trong hàng chờ review của mình với trạng thái rõ | Không tài liệu nào "mất" giữa intake và module đích | Critical | Confirmed — PRD Mục 7.18 (luồng nhận output → review); dependency từ document-intake |
| UN-002 | HR | Khi mở màn review | Đối chiếu tài liệu gốc với từng field đề xuất, bấm field nhảy tới vùng nguồn | Kiểm chứng được giá trị mà không lật qua lại giữa hai cửa sổ | Critical | Confirmed — PRD Mục 7.18 (source location, hiển thị evidence) |
| UN-003 | HR | Khi máy đọc không chắc | Field confidence thấp được tô nổi và ưu tiên rà trước | Tập trung sửa đúng chỗ rủi ro thay vì đọc lại toàn bộ | Critical | Confirmed — PRD Mục 7.18 (confidence); R-05 |
| UN-004 | HR | Khi field đề xuất sai hoặc thiếu | Sửa giá trị hoặc điền tay, hệ thống giữ cả bản máy lẫn bản sửa | Diff được giữ để đo chất lượng trích xuất và truy vết | Critical | Confirmed — PRD Mục 7.18 (diff/review), M-IN-03 |
| UN-005 | HR | Khi đã rà xong | Publish kết quả đã xác nhận sang module đích, biết rõ đã gửi thành công | Dữ liệu vào đúng hồ sơ/thư viện, có bản ghi publish | Critical | Confirmed — PRD Mục 7.18 (publish), Mục 12 |
| UN-006 | HR | Khi kết quả trích xuất nhiễu không sửa nổi | Yêu cầu xử lý lại trên cùng file thay vì gõ lại toàn bộ | Job mới chạy, kết quả mới quay lại hàng chờ | High | Assumption — mở rộng từ retry của PRD Mục 7.17/7.18 |
| UN-007 | Admin | Khi tài liệu chờ lâu hoặc reviewer vắng | Thấy backlog, gán/reassign reviewer, mở nhập tay khi hết lượt xử lý lại | Không tài liệu nào treo vô thời hạn | High | Assumption — nhu cầu vận hành hàng chờ |
| UN-008 | Người tải file | Sau khi tải file | Theo dõi file qua review → publish, biết kết quả cuối | Minh bạch tiến độ tài liệu của mình | Medium | Assumption — liên tục trạng thái từ intake |
| UN-009 | HR | Khi đồng nghiệp đang review cùng tài liệu | Được báo tài liệu đang có người review, tránh sửa đè | Không mất công sửa trên bản cũ | Medium | Assumption — edge case đồng thời |

## 5. Prioritized User Journeys

### Journey 1: Review và publish một tài liệu đã trích xuất

- **User:** HR (reviewer)
- **Importance:** Critical
- **Trigger:** Một file qua intake được xử lý xong và vào hàng chờ review.
- **Expected outcome:** Tài liệu được xác nhận và publish sang module
  đích với provenance đầy đủ.
- **Related needs:** UN-001, UN-002, UN-003, UN-004, UN-005

1) HR mở hàng chờ review, chọn tài liệu "Chờ review".
2) Màn đối chiếu hiện tài liệu gốc + danh sách field; field confidence
   thấp nổi lên đầu.
3) HR rà từng field: bấm field → xem vùng nguồn → giữ nguyên hoặc sửa;
   field thiếu thì điền tay.
4) Khi đủ field bắt buộc → bấm "Xác nhận và đưa vào sử dụng".
5) Hệ thống publish sang module đích, hiện trạng thái "Đã publish".

**Independent verification:** Lấy một tài liệu vừa publish — kiểm tra
module đích nhận đúng payload, bản ghi publish có reviewer + thời điểm +
engine version, và mọi field bắt buộc đều ở trạng thái đã xác nhận.

### Journey 2: Rà field confidence thấp

- **User:** HR (reviewer)
- **Importance:** Critical
- **Trigger:** Tài liệu có nhiều field máy đọc không chắc (scan mờ, chữ
  viết tay).
- **Expected outcome:** HR chỉ phải đối chiếu sâu những field rủi ro,
  phần còn lại xác nhận nhanh có kiểm soát.
- **Related needs:** UN-002, UN-003, UN-004

1) Mở tài liệu: danh sách field tự sắp field thấp-confidence lên đầu.
2) HR bấm field tô nổi → tài liệu gốc nhảy tới vùng nguồn tương ứng.
3) Sửa giá trị sai; hệ thống giữ giá trị máy để hiện diff.
4) Sau khi rà hết field cảnh báo, dùng "xác nhận tất cả còn lại" cho
   các field đã kiểm.

**Independent verification:** Với một tài liệu có field dưới ngưỡng —
kiểm tra field đó nằm trong nhóm tô nổi, có vùng nguồn liên kết, và diff
ghi nhận đúng giá trị máy vs giá trị đã sửa.

### Journey 3: Yêu cầu xử lý lại kết quả nhiễu

- **User:** HR (reviewer)
- **Importance:** High
- **Trigger:** Kết quả trích xuất không dùng được (ảnh mờ, sai loại tài
  liệu, engine đọc hỏng).
- **Expected outcome:** File chạy lại qua pipeline và quay về hàng chờ
  với kết quả mới, không mất vết lần trước.
- **Related needs:** UN-006, UN-007

1) HR bấm "Yêu cầu xử lý lại", nhập lý do.
2) Hệ thống tạo job xử lý mới trên cùng file; kết quả cũ chuyển "Chờ xử
   lý lại".
3) Kết quả mới về → "Chờ review"; HR review trên bản mới.
4) Quá số lần xử lý lại → admin được báo, mở chế độ nhập tay.

**Independent verification:** Trên một tài liệu đã xử lý lại — đối chiếu
hai bản kết quả tồn tại song song, job mới có liên kết lý do, và trạng
thái cuối phản ánh đúng bản được publish.

### Journey 4: Admin xử lý backlog review

- **User:** Admin
- **Importance:** High
- **Trigger:** Tài liệu chờ quá ngưỡng hoặc reviewer không xử lý.
- **Expected outcome:** Mọi tài liệu chờ đều có người phụ trách rõ ràng.
- **Related needs:** UN-007, UN-001

1) Admin mở danh sách tài liệu, lọc "Chờ review"/"Đang review" quá hạn.
2) Reassign cho reviewer khác hoặc tự nhận.
3) Với tài liệu hết lượt xử lý lại → quyết định nhập tay hoặc trả về
   intake.

**Independent verification:** Trên danh sách chờ — mọi tài liệu đều có
owner hiện tại và mốc thời gian chờ; reassign có audit (ai gán, cho ai).

### Journey 5: Người tải theo dõi file qua review

- **User:** Người tải file (HR/nhân viên)
- **Importance:** Medium
- **Trigger:** Sau khi file được intake xử lý xong.
- **Expected outcome:** Người tải thấy trạng thái review và kết quả
  publish mà không phải hỏi reviewer.
- **Related needs:** UN-008

1) Mở danh sách tài liệu đã tải → file hiện "Chờ review"/"Đang review".
2) Khi reviewer publish → trạng thái "Đã publish" + có thể xem kết quả
   theo quyền.

**Independent verification:** Với một file vừa qua review — trạng thái
hiển thị cho người tải khớp trạng thái thật của kết quả trích xuất.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Publish khi còn thiếu field bắt buộc | Người dùng không hiểu vì sao bị chặn | Thông báo liệt kê đúng field còn thiếu/chưa xác nhận | Journey 1 / UN-005 |
| Ảnh scan trắng/không có text | Không có gì để review | Kết quả vào hàng chờ với cờ "không đọc được nội dung"; chọn nhập tay hoặc xử lý lại | UN-006 |
| Loại tài liệu chọn sai ở intake | Bộ field không khớp nội dung | Reviewer đổi loại tài liệu trong màn review (ghi nhận) hoặc trả xử lý lại | Journey 3 / UN-002 |
| Người khác đang review tài liệu | Sửa đè lẫn nhau | Cảnh báo "đang được {người} review", chỉ xem; admin reassign được | UN-009 |
| Publish sang module đích lỗi | Sợ mất kết quả đã xác nhận | Trạng thái "Chờ publish" rõ ràng + gửi lại, cam kết không mất dữ liệu | Journey 1 / UN-005 |
| File nguồn bị khóa/cách ly khi đang review | Không hoàn tất được | Màn review khóa, thông báo lý do; không cho publish | UN-005 |
| Reviewer thoát giữa chừng | Tài liệu kẹt ở "đang review" | Phiên hết hạn tự nhả về "chờ review", phần đã xác nhận không mất | Journey 4 / UN-007 |
| Hàng chờ trống | Không biết có việc không | Empty state rõ + gợi ý xem file đang xử lý ở intake | Journey 1 |
| Field lặp (nhiều mục kinh nghiệm) | Bộ field cố định không đủ | Thêm/bớt nhóm field lặp trong màn review | UN-004 |

## 7. User-side Constraints

- Giao diện và thông báo tiếng Việt; nội dung trích xuất giữ nguyên ngôn
  ngữ gốc (không dịch).
- Chỉ người dùng nội bộ đăng nhập, có quyền trên ngữ cảnh của file mới
  review được; field nhạy cảm (định danh, lương) hiển thị theo quyền.
- Màn đối chiếu cần hiển thị đồng thời tài liệu gốc và danh sách field —
  desktop là surface chính; không yêu cầu mobile cho v1.
- Publish chỉ chạy khi đủ field bắt buộc đã xác nhận — không có đường
  tắt "bỏ qua review" (invariant human-in-the-loop).
- Người tải và reviewer có thể là một người, nhưng bản ghi provenance
  luôn tách hai vai trò.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Reviewer là người dùng nội bộ có quyền trên ngữ cảnh file; mặc định người tải nếu không phân công | Nếu cần vai trò riêng → hàng chờ nghẽn, không ai nhận | Assumption — đề xuất chờ Admin lead | Chốt ở OQ-5 brainstorm |
| Confidence thang 0–1 do engine trả, ngưỡng cảnh báo 0,70 | Nếu thang/ngưỡng khác → tô nổi sai nhóm field | Assumption — đề xuất | Chốt ở OQ-1 brainstorm; kiểm chứng trong pilot |
| Bộ field bắt buộc theo loại tài liệu do owner nghiệp vụ công bố | Nếu không có bộ field → publish không có điều kiện | Assumption | Lập danh sách field cho từng loại v1 khi đặc tả module đích |
| Xử lý lại tối đa 2 lần rồi chuyển nhập tay | Nếu ít hơn → nhập tay sớm tốn công; nhiều hơn → trì hoãn | Assumption — đề xuất | Chốt ở OQ-2 brainstorm |
| Publish idempotent theo cặp (kết quả, module đích) | Nếu không → publish trùng tạo facts lặp | Assumption | Contract test với module đích khi tích hợp |
| File PII chỉ qua provider ngoài khi chính sách duyệt | Nếu gửi tự do → vi phạm privacy gate | Confirmed — PRD Mục 9, R-16, OQ-13 | Chờ DPO/legal duyệt chính sách che/lọc |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | HR publish dữ liệu mà không nhập lại toàn bộ | Chưa có — xác lập bằng đo thời gian review/tài liệu trong 1 tháng pilot | ≥60% tài liệu publish với thời gian review < thời gian nhập tay tương đương | Thời gian từ mở review đến publish so với ước lượng nhập tay theo số field | 1 tháng sau pilot |
| USC-002 | Field máy đề xuất được reviewer giữ nguyên (chất lượng trích xuất) | Chưa có — xác lập bằng diff review trong 1 tháng pilot | Mức giữ nguyên đo được và tăng dần theo đợt hiệu chỉnh (mốc số chờ OQ-2 PRD) | Tỷ lệ field xác nhận không sửa / tổng field đề xuất (M-IN-03) | 1 tháng sau pilot |
| USC-003 | Không field nào thành fact khi chưa qua xác nhận | 0 (hiện không có pipeline) | 100% payload publish có reviewer + provenance | Kiểm tra publish event: đủ người xác nhận, engine, thời điểm | Liên tục |
| USC-004 | Tài liệu không treo ở hàng chờ review | Chưa có — xác lập bằng đo thời gian chờ trong pilot | Tài liệu chờ review được nhận xử lý trong ≤1 ngày làm việc | Thời gian từ "chờ-review" đến "đang-review" | 1 tháng sau pilot |
| USC-005 | Kết quả đã xác nhận không mất khi publish lỗi | 0 sự cố | 0 kết quả đã xác nhận mất hoặc publish trùng | Số incident mất/trùng publish được xác nhận | Liên tục |

## 10. Open Questions

- [x] OQ-1: Ngưỡng confidence cảnh báo — Resolved (đề xuất): 0,70; field
  dưới ngưỡng tô nổi và buộc nhìn vùng nguồn trước khi xác nhận — chờ
  Document AI owner xác nhận (brainstorm OQ-1).
- [x] OQ-2: Số lần xử lý lại tối đa trước khi nhập tay — Resolved (đề
  xuất): 2 lần, sau đó admin quyết định — chờ Document AI owner (OQ-2).
- [x] OQ-3: SLA hàng chờ review và phiên "đang review" — Resolved (đề
  xuất): nhắc sau 1 ngày làm việc; phiên nhả về chờ sau 60 phút không
  hoạt động — chờ Operations owner (OQ-3).
- [x] OQ-4: Cơ chế publish và giới hạn gửi lại — Resolved (đề xuất):
  trạng thái "chờ-publish" + gửi lại ≤3 lần idempotent — chờ Technical
  owner (OQ-4).
- [x] OQ-5: Ai là reviewer hợp lệ — Resolved (đề xuất): người dùng nội
  bộ có quyền trên ngữ cảnh, admin phân công; mặc định người tải — chờ
  Admin lead (OQ-5).
- [x] OQ-6: Chính sách gửi file PII tới provider OCR ngoài — Resolved
  (đề xuất): chưa duyệt thì chỉ file không nhạy cảm/synthetic; file PII
  dùng engine nội bộ hoặc chờ — chờ DPO/legal (PRD OQ-13, R-16).
- [x] OQ-7: Retention text trích xuất/vùng nguồn/diff — Resolved (đề
  xuất): theo vòng đời file nguồn ở intake — chờ DPO/legal (PRD OQ-6).
- [~] OQ-8: Gợi ý giá trị field từ dữ liệu hiện có và học từ sửa của
  reviewer — Out of scope v1: capability P2 của brainstorm, cần thêm
  duyệt về dùng dữ liệu học.
