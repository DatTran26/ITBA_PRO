# Tuyến tài liệu Town Hown

Trang này là điểm điều hướng tài liệu chính của repository gốc. Tài liệu ứng
dụng, raw requirements và hồ sơ thực thi được tách rõ để tránh dùng nhầm nguồn.

## Nguồn hiện hành

| Cần biết | Đọc tại | Chủ sở hữu nội dung |
| --- | --- | --- |
| Tầm nhìn và ràng buộc HRMS | [`../PRODUCT.md`](../PRODUCT.md) | Product intent và business constraints |
| Cấu trúc repository | [`../README.md`](../README.md) | Component map và onboarding |
| GitFlow/agent behavior | [`../AGENTS.md`](../AGENTS.md) | Quy trình bắt buộc |
| Quy trình đóng góp | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Contributor workflow |
| Bảo mật | [`../SECURITY.md`](../SECURITY.md) | Reporting và secret policy |
| Frontend ITBAAI | [`../Frontend/package.json`](../Frontend/package.json) | Runtime, scripts và dependency manifest |
| Backend ITBAAI | [`../Backend/`](../Backend) | Supabase platform và DB utilities |
| Tài liệu chuẩn | [`downtown/README.md`](downtown/README.md) | Product, architecture, development, operations, security |
| Thiết kế Town Hown | [`downtown/design-guidelines.md`](downtown/design-guidelines.md) | Visual direction, token, component, responsive và accessibility của `Frontend/` |
| SRS tái lập | [`_reverse/README.md`](_reverse/README.md) | Requirement draft, evidence, gaps và open questions |

## Tài liệu tham khảo và lịch sử

- [`../HRMS_He_thong_quan_ly_nhan_su.md`](../HRMS_He_thong_quan_ly_nhan_su.md)
  là bản yêu cầu theo thời gian, dùng để truy nguyên ý tưởng; không phải nguồn
  trạng thái triển khai.
- [`archive/itbaai-legacy/README.md`](archive/itbaai-legacy/README.md) là tuyến
  snapshot/import ITBAAI cũ; plans và raw requirements nằm trong
  [`../plans/archive/itbaai-legacy/`](../plans/archive/itbaai-legacy/).
- [`../plans/`](../plans/) chứa kế hoạch và báo cáo có trạng thái. Các file này
  ghi lại quyết định tại thời điểm thực hiện, không thay thế tài liệu evergreen.
- [`archive/itbaai-legacy/`](archive/itbaai-legacy/) giữ tài liệu ứng dụng trước
  khi flatten `Frontend`/`Backend`; chỉ dùng để truy nguyên lịch sử.
- `docs/_shared/kg/graph.json` là artifact máy sinh, không phải tài liệu do con
  người duy trì.

## Quy tắc duy trì

- Code, schema, manifest và workflow sở hữu WHAT/HOW.
- Tài liệu sở hữu WHY/WHERE, thuật ngữ, ràng buộc và quyết định bền vững.
- Không chép số lượng route, file, LOC, bảng hoặc tỷ lệ hoàn thành vào tài liệu
  hiện hành. Dùng lệnh tìm kiếm hoặc trỏ đến executable owner.
- Không ghi secret hoặc giá trị `.env`; chỉ ghi tên biến và mục đích.
- Khi hành vi thay đổi, sửa bề mặt tài liệu nhỏ nhất đang sở hữu claim đó.
- Giữ plans/reports như lịch sử; không viết lại kết quả cũ theo hiện trạng mới.

Quy ước commit fallback: [`references/COMMIT.md`](references/COMMIT.md).
