# Pattern được chấp nhận

Trang này ghi **khi nào** dùng pattern và owner nằm ở đâu. Đọc implementation
hiện tại tại source; không sao chép snippet vào docs vì signature có thể đổi.

## Auth context trước data access

Áp dụng cho API authenticated.

- Owner: `src/lib/api/auth-helpers.ts` và route handler gần nhất.
- Route parse input, lấy auth context, kiểm tra role/ownership rồi mới query/mutate.
- Middleware không thay authorization ở route/RLS.
- Service role chỉ dùng sau khi action đã được authorize cụ thể.

Không dùng pattern này cho public token bằng cách giả lập user; public endpoint
cần contract tối thiểu riêng và query scope bằng token/resource.

## Centralized state transition

Áp dụng cho recruitment/application workflow.

- Owner: `src/lib/recruitment/state-machine.ts` và status API tương ứng.
- UI chỉ đề nghị transition; server xác minh transition hợp lệ.
- Override/recovery giữ reason/audit nếu business rule yêu cầu.

Không định nghĩa danh sách transition độc lập trong nhiều component/routes.

## Optimistic UI có rollback

Áp dụng cho setting hoặc mutation nhỏ, dễ đảo ngược.

- UI cập nhật trạng thái dự kiến để phản hồi nhanh.
- Request gửi patch tối thiểu.
- Failure khôi phục snapshot và thông báo rõ.
- Realtime response/newer mutation không được bị response cũ ghi đè.

Không dùng optimistic success cho gửi email, schema/data destructive action hoặc
decision nhân sự khi server confirmation là contract quan trọng.

## Parse-first provider output

Áp dụng cho OpenAI/Google AI, document parser, CV extraction và external payload.

- Owner: helper AI/document trong `src/lib` hoặc Supabase function tương ứng.
- Provider response bắt đầu là untrusted; parse vào schema/domain DTO.
- Malformed/partial result đi qua error/fallback rõ, không ép cast rồi lưu.
- Log metadata phục vụ chẩn đoán, không log credential/raw PII mặc định.

## Derived score recomputation

Áp dụng khi manual grade hoặc component score thay đổi.

- Owner: `src/lib/grading/recompute-result-score.ts` và grade/result routes.
- Aggregate score được tính lại từ facts hiện tại, không patch từng bản sao score
  rải rác.
- Manual value và AI/automatic value phải phân biệt khi cần audit.

## Email render rồi send

Áp dụng cho template email.

- Owner: `src/lib/email`.
- Validate template/variables/recipient trước render.
- Sanitize/encode theo output context.
- Credential resolution và SMTP send chỉ server-side.
- Delivery result được ghi vào email log theo contract.

Không render HTML từ user/AI rồi gửi trực tiếp mà bỏ qua validation/sanitization.

## Document pipeline có provenance

Áp dụng cho document-to-question.

- Raw source, extracted text, topics, jobs và generated questions là stage riêng.
- Merge/split topic không làm mất source reference.
- Retry phải tránh tạo duplicate artifact ngoài ý muốn.
- Human review xảy ra trước khi generated content được dùng trong assessment
  quan trọng.

Owner: document APIs, `src/lib/document-parsing`, document migrations và các
Supabase Edge Functions.

## Audit và fire-and-forget

Chỉ fire-and-forget khi side effect không quyết định response correctness và hệ
thống chấp nhận mất event. AI usage telemetry có thể phù hợp tuỳ contract; audit
nhân sự, email delivery hoặc state transition thường không phù hợp nếu không có
durable queue/retry.

Khi review, hỏi: “Nếu side effect thất bại ngay sau HTTP success, user/business
contract có còn đúng không?”. Nếu không, await hoặc dùng durable processing.

## Realtime subscription lifecycle

Áp dụng cho notification/application/build watcher.

- Tạo channel theo stable identity/scope.
- Cleanup khi dependency hoặc component lifecycle kết thúc.
- Re-fetch/reconcile server truth thay vì giả định mọi event đến đúng thứ tự.
- Không mở duplicate channel cho cùng consumer do unstable dependency.

Owner: hooks realtime trong `src/hooks` và component sử dụng tương ứng.

## CSV/PDF export ở boundary

Export chỉ lấy field đã được authorize và định dạng qua helper tập trung.

- CSV owner: `src/lib/export`.
- PDF result owner: `src/lib/generate-result-pdf.ts`.
- Escape spreadsheet formula khi export dữ liệu user-controlled.
- Không đưa field nhạy cảm vào export chỉ vì row object có sẵn.

## Khi thêm pattern mới

Chỉ thêm khi:

1. Có ít nhất hai consumer hoặc một boundary rủi ro cao cần thống nhất.
2. Owner/executable example tồn tại.
3. Pattern giải thích decision/constraint không thể chỉ suy ra từ code style.
4. Pattern cũ cạnh tranh được xoá hoặc đánh dấu superseded.
