# Chính sách bảo mật ITBAAI

## Báo cáo lỗ hổng

- Không mở public issue cho lỗ hổng chưa vá.
- Dùng private vulnerability reporting của repository hosting nếu được bật;
  nếu chưa có, liên hệ trực tiếp maintainer qua kênh nội bộ được phê duyệt.
- Cung cấp impact, phạm vi ảnh hưởng, bước tái hiện tối thiểu và bản vá đề xuất
  nếu có. Không gửi production secret hoặc dữ liệu cá nhân thật trong báo cáo.

## Phạm vi hỗ trợ

Version được hỗ trợ phải được xác định từ release đang vận hành và quyết định của
maintainer. Không dùng bảng version mẫu. Khi chưa có thông báo khác, ưu tiên vá
release production hiện hành và nhánh tích hợp theo GitFlow workspace.

## Secret handling

- Không commit `.env`, `.env.local`, API key, service-role key, SMTP password,
  SSH private key hoặc database credential.
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` và SMTP credential chỉ server-side.
- `NEXT_PUBLIC_*` được bundle cho client; không đặt secret vào biến có prefix này.
- Không in secret trong logs, docs, screenshots, test fixtures hoặc CI output.
- Khi nghi ngờ lộ secret: revoke/rotate trước, sau đó điều tra và làm sạch lịch sử
  theo quy trình được phê duyệt.

## Security boundaries

- Middleware không thay API authorization/RLS.
- Public assessment token cấp quyền tối thiểu cho resource tương ứng.
- File/CV/recording/email là dữ liệu nhạy cảm; kiểm tra access, loại/size và
  retention trước production use.
- AI/provider output là untrusted; parse và sanitize trước lưu/render.
- Service role bypass RLS chỉ dùng trong server action cụ thể đã authorize.
- Audit record không được thay bằng application log.

Kiến trúc trust boundary: [`docs/system-architecture.md`](docs/system-architecture.md).
Chính sách workspace: [`../SECURITY.md`](../SECURITY.md).
