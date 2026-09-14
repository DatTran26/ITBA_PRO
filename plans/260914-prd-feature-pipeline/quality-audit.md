# Quality Audit - docs/features

Ngày kiểm tra: 2026-09-14

## Kết luận hiện tại

Pipeline artifact đã hoàn tất: 39/39 feature có đủ brainstorm, URD, SRS và
ERD. Toàn bộ frontmatter, link, bảng Markdown, ID định nghĩa cục bộ và ERD hiện
vượt qua checker. Không còn blocker cấu trúc cho bộ tài liệu mới.

Chất lượng nghiệp vụ vẫn ở trạng thái **cần Product/BA triage** vì còn 185 Open
Question trong 27 file. Đây là backlog quyết định hợp lệ, không được tự đánh
dấu resolved chỉ để làm sạch số liệu.

## Finding cần xử lý tiếp

### Đã xử lý - SRS `skill-gap-analysis`

SRS đã được viết lại theo contract 12 mục: bảng FR/NFR/BR, Error Matrix,
Success Criteria, Actors, Data Entities, Flows, Screens và
Constraints/Dependencies/Assumptions. ID dùng đầy đủ feature slug
`skill-gap-analysis`; checker không còn phát hiện `REQ-*`, prefix sai hoặc
thiếu FR.

### P1 - Open Question chưa được triage đồng đều

Có 185 checkbox Open Question còn mở trong 27 file. Open Question là hợp lệ,
nhưng nhiều dòng chưa chỉ rõ owner và artifact bị ảnh hưởng nếu chưa chốt.
Không được tự đánh dấu resolved. Product/BA cần triage theo nhóm owner:
Product, Head of HR, DPO/legal, Security và Technical/Operations.

### P1 - `vision-ocr` dùng contract SRS riêng

`docs/features/vision-ocr/srs/vision-ocr-spec.md` tổ chức theo `UC-*` thay vì
FR/NFR/BR/Error Matrix chung. Nội dung bám source hiện có và giữ trực tiếp
precondition/postcondition/exception của module standalone. Spec đã ghi rõ đề
xuất giữ ngoại lệ source-backed trong Open Questions; Product/BA vẫn phải chốt
trước khi coi đây là convention được duyệt.

### Bộ artifact bổ sung đã rà soát

Các feature `employment-lifecycle`, `external-integrations`,
`kanban-workspaces` và `operational-email` hiện đủ bốn artifact. Frontmatter,
link, bảng, ID và ERD của các file mới đều qua kiểm tra cơ học. Các quyết định
nghiệp vụ mang nhãn đề xuất vẫn cần đúng owner xác nhận trước khi đổi
`status: draft`.

## Sửa chữa đã áp dụng

- Thêm `docs/features/README.md` làm tuyến đọc và quality contract cho BA,
  Product, Dev và QA; thêm route tương ứng vào `docs/README.md`.
- Chuẩn hóa các Markdown table bị thừa dấu `|` đầu dòng.
- Sửa bốn cell table chứa dấu `|` không escape làm sai số cột.
- Thay các `TBD` đã phát hiện bằng owner quyết định và ảnh hưởng rõ ràng, không
  tự bịa giá trị.
- Chuẩn hóa LF cho ERD để checker không false-pass trên file CRLF.
- Chuẩn hóa ID của `skill-gap-analysis` theo full feature slug.
- Thêm `final-review-check.mjs` để kiểm artifact, frontmatter, link, bảng, ID,
  placeholder và thống kê Open Question trong một lượt.

## Evidence kiểm tra

- Artifact matrix: 39 feature, mỗi feature đủ brainstorm/URD/SRS/ERD.
- `node plans/260914-prd-feature-pipeline/check-erd.mjs docs/features`:
  39 file, 39 Mermaid block, 0 lỗi.
- Frontmatter/link checker: 0 lỗi.
- Markdown table checker: 0 bảng lệch số cột.
- Local ID definition checker: 0 `REQ-*`, prefix sai hoặc thiếu FR; `vision-ocr`
  là contract UC source-backed đã nêu riêng.
- Placeholder scan: không có `TODO`/`TBD`/`FIXME` thật; chuỗi `Todo` còn lại
  là tên một nhóm UI trong Open Question.
- Open Question heuristic: 185 câu còn mở; 74 câu chưa nhận diện được owner và
  171 câu chưa nhận diện được impact. Các số này dùng để lập backlog review,
  không phải bằng chứng tự động rằng nội dung nghiệp vụ sai.
- `git diff --check`: không có whitespace error trong các file đã sửa.

## Điều kiện đóng audit

1. Product/BA quyết định giữ contract UC source-backed hay chuẩn hóa
   `vision-ocr` sang FR/NFR/BR.
2. Triage 185 Open Question theo owner; mỗi câu còn mở phải nêu owner và ảnh
   hưởng nếu chưa chốt.
3. Sau khi owner chốt, cập nhật đúng artifact sở hữu claim rồi chạy lại toàn
   bộ checker trước khi đổi trạng thái draft.
