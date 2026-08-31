# Chuẩn phát triển ITBAAI

Các quy tắc dưới đây chỉ giữ những constraint project-specific hoặc safety
boundary khó suy ra từ formatter/linter. TypeScript/ESLint/package manifest là
nguồn chuẩn cho syntax, dependency và rule máy kiểm tra được.

## Nguyên tắc chung

- Thay đổi nhỏ nhất tại đúng owner; không tạo abstraction/module chỉ để “đẹp”.
- Reuse helper/component/domain rule hiện có trước khi thêm implementation mới.
- Không đổi public contract, schema hoặc role behavior ngoài scope được chấp nhận.
- Unknown input phải được parse/validate ở boundary trước khi đi vào logic.
- Không che lint/build/type error bằng disable hoặc cast rộng không có căn cứ.

## TypeScript và naming

- Giữ `strict: true`; không dùng `any` để bỏ qua thiết kế type. Với payload ngoài
  hệ thống, bắt đầu từ `unknown` rồi parse.
- Shared contract chỉ đặt ở `src/types` khi có nhiều consumer thật; type local ở
  gần owner giúp thay đổi dễ hơn.
- Dùng alias `@/*` cho import từ `src`; import tương đối cho file cùng module.
- Tôn trọng convention đang có: component/type PascalCase; function/variable
  camelCase; file JS/TS/TSX mới ưu tiên kebab-case nếu folder không có convention
  mạnh hơn; database identifier theo schema hiện hữu.
- Không dùng barrel export nếu nó tạo cycle hoặc che boundary module.

Executable owner: [`../tsconfig.json`](../tsconfig.json),
[`../eslint.config.mjs`](../eslint.config.mjs).

## Next.js và React

- Mặc định dùng Server Component; thêm `"use client"` chỉ khi cần browser API,
  event handler, client hook, animation hoặc local interactive state.
- Server Component/route handler lấy dữ liệu nhạy cảm; không truyền secret hay
  row vượt nhu cầu xuống client props.
- Giữ state gần consumer. Shared context chỉ dùng khi state thật sự cắt qua nhiều
  nhánh UI.
- Cleanup subscription/timer/listener trong effect; tránh duplicate realtime
  channel khi component re-render.
- Dùng UI primitives và layout shell trong `src/components/ui` trước khi tạo
  biến thể mới. Domain component đặt tại folder domain tương ứng.
- Accessibility là contract: label cho control, keyboard operation, focus hợp
  lý, semantic element và trạng thái loading/error/empty rõ ràng.

## API route boundaries

Route handler chịu trách nhiệm theo thứ tự:

1. Xác thực request và parse params/body/query.
2. Xác định auth context.
3. Kiểm tra role/ownership/scope.
4. Gọi helper/domain owner.
5. Map kết quả/lỗi thành response không lộ nội bộ.
6. Ghi audit/usage/operation record nếu contract yêu cầu.

Không dựa vào việc UI ẩn button để bảo vệ action. Không trả stack, credential,
provider payload đầy đủ hoặc raw database error cho client.

Owner tham khảo: `src/lib/api/auth-helpers.ts`, các route cùng domain và
[`code-patterns.md`](code-patterns.md).

## Supabase và database

- Chọn đúng client browser/server/admin trong `src/lib/supabase`.
- Service role chỉ server-side và chỉ cho action cần bypass RLS.
- Mọi schema/RLS/function/index change dùng migration mới; không sửa migration
  đã áp dụng trên môi trường chia sẻ nếu không có chiến lược rõ ràng.
- Trước schema/data change trên database thật: backup, xác định target project,
  đánh giá rollback và kiểm tra migration order.
- Authorization phải nhất quán giữa API checks và RLS; một lớp không thay lớp
  còn lại.
- Query list cần scope/filter/pagination phù hợp; không kéo toàn bộ dataset rồi
  lọc quyền ở client.

## AI boundary

- Prompt input và provider output có thể chứa dữ liệu không đáng tin.
- Structured output phải có schema/parser và fallback/error path rõ.
- Không hardcode API key/model secret; đọc config từ server environment/helper.
- Đặt timeout/size limit phù hợp cho file, CV, transcript và prompt lớn.
- Ghi usage mà không log secret hoặc dữ liệu cá nhân vượt nhu cầu.
- Insight/score AI phải là đề xuất có thể review; không tự động quyết định tuyển
  dụng hoặc kỷ luật.

## Email và dữ liệu nhạy cảm

- Render/sanitize/template variable handling thuộc `src/lib/email`.
- SMTP credential không đi qua client response/log.
- Validate recipient và template variables trước khi send.
- Delivery log không đồng nghĩa business action đã hoàn tất; caller xử lý trạng
  thái partial/failure theo contract.

## File và Document AI

- Kiểm tra access, loại file, kích thước và parse failure ở upload boundary.
- Tách raw document, extracted text, topic và generated question để giữ provenance.
- Không hiển thị generated HTML/text nguy hiểm mà chưa sanitize.
- Storage path và signed/public URL phải phù hợp độ nhạy dữ liệu.

## Error, logging và audit

- Error message cho user phải actionable nhưng không lộ implementation/secret.
- Operational log phục vụ chẩn đoán; audit record phục vụ truy nguyên nghiệp vụ.
- Action nhạy cảm nên có actor, target, outcome và timestamp theo schema owner.
- Fire-and-forget chỉ dùng cho side effect không được phép quyết định success của
  request. Nếu audit/delivery là contract bắt buộc, phải await hoặc có durable job.

## Testing và validation

Repository hiện không có `npm test`. Không viết test hướng dẫn giả định.

Validation tối thiểu cho code change:

```powershell
npm run lint
npm run build
```

Sau đó bổ sung check phù hợp với risk:

- API: request/auth/role/ownership/error cases.
- Migration: apply trên database disposable/staging và kiểm tra RLS/rollback.
- UI: happy path, loading, empty, error, keyboard/mobile nếu liên quan.
- AI/provider: schema parse, malformed output, timeout và provider failure.
- Public assessment: token access, submission idempotency/duplicate behavior.

Không tuyên bố automated tests đã chạy khi project chưa có runner. Ghi rõ manual
hoặc focused validation nào thực sự đã thực hiện.

## Review checklist

- Scope và owner đúng chưa?
- Boundary có parse/authorization đầy đủ chưa?
- Client có nhận secret/dữ liệu vượt nhu cầu không?
- Schema change có migration, backup/rollback và RLS chưa?
- AI/provider failure có đường xử lý an toàn không?
- Audit/operation log có đúng mục đích và không rò PII không?
- Existing contract có bị đổi ngoài ý muốn không?
- Docs owner có cần cập nhật không?
- Validation report có phản ánh đúng những gì đã chạy không?
