# Chuẩn hoá tài liệu dự án

## Kết quả cần đạt

Thiết lập một tuyến tài liệu duy nhất giúp thành viên và AI xác định nhanh sản
phẩm là gì, mã nguồn nằm ở đâu, kiến trúc và vận hành được quyết định như thế
nào, và tài liệu nào chỉ là hồ sơ lịch sử.

## Phạm vi

- Tài liệu điều hướng và quản trị ở repo gốc.
- Tài liệu sản phẩm, kiến trúc, phát triển và vận hành của ứng dụng
  `learning-and-testing-system`.
- Phân loại `ITBA_docs` và các `plans/reports` để tránh nhầm tài liệu lịch sử
  với nguồn hiện hành.
- Sửa lỗi Markdown, đường dẫn và tuyên bố lỗi thời trên các bề mặt tài liệu
  hiện hành.

## Ràng buộc

- Source, schema, manifest và workflow là bằng chứng cho WHAT/HOW.
- Tài liệu chỉ sở hữu WHY/WHERE, thuật ngữ, ràng buộc và quyết định bền vững.
- Không thay đổi product code, schema hoặc dữ liệu.
- Không sửa lại nội dung lịch sử chỉ để phản ánh hiện trạng mới.
- Không đưa secret hoặc giá trị từ `.env` vào tài liệu.
- Giữ nguyên GitFlow của repo gốc và không thực hiện commit/push.

## Ngoài phạm vi

- Hoàn thiện các tính năng còn dang dở.
- Kiểm chứng hạ tầng production hoặc Supabase từ xa.
- Tạo thêm hệ thống governance, generator hay CI gate mới.

## Các bước

1. Lập inventory, xác định nguồn chuẩn và các tài liệu trùng/lỗi thời.
2. Đối chiếu claim với source, manifest, migrations và workflow hiện tại.
3. Nhận phản biện từ `kongming` về cấu trúc, nội dung giữ/cắt và rủi ro.
4. Chuẩn hoá tuyến điều hướng repo gốc và ứng dụng.
5. Viết lại các tài liệu canonical bị lệch khỏi source.
6. Gắn nhãn rõ tài liệu lưu trữ và bảo toàn plans/reports như bằng chứng lịch sử.
7. Kiểm tra Markdown, link nội bộ, path, command, config key và claim.

## Tiêu chí chấp nhận

- Có một điểm bắt đầu rõ ràng ở repo gốc và một điểm bắt đầu rõ ràng cho app.
- Người đọc phân biệt được product target, hiện trạng triển khai và lịch sử.
- Không còn số lượng file, route, LOC hoặc trạng thái phần trăm được duy trì thủ
  công trên tuyến tài liệu canonical.
- Stack, lệnh chạy, biến môi trường và nhánh Git khớp với bằng chứng hiện tại.
- `ITBA_docs` không còn được hiểu là nguồn hiện hành.
- Tất cả link tương đối trong tài liệu canonical trỏ tới mục tiêu tồn tại.
- Báo cáo cuối nêu rõ file đã đổi, bằng chứng, validation và câu hỏi còn mở.

## Bằng chứng chính

- `package.json`, `tsconfig.json`, `next.config.ts`, `docker-compose.yml`.
- `src/app`, `src/lib`, `src/components`, `src/middleware.ts`.
- `supabase/migrations`, `supabase/functions`.
- `.github/workflows`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`.
- Git status của repo gốc và nested application repo.

## Rủi ro và rollback

- Hai repo đều đang có nhiều thay đổi chưa commit; chỉ chạm file tài liệu thuộc
  phạm vi và không ghi đè thay đổi source.
- `learning-and-testing-system` đã được người dùng xác nhận là source tích hợp
  trực tiếp vào repo gốc; không còn nested `.git`.
- Rollback bằng cách hoàn nguyên riêng các file tài liệu đã liệt kê trong báo
  cáo cuối; không dùng reset toàn repository.
