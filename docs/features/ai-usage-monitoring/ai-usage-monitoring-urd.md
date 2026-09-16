---
type: urd
feature: ai-usage-monitoring
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/ai-usage-monitoring/brainstorms/ai-usage-cost-observability.md, docs/_reverse/platform-communications-and-governance/reverse-spec.md]
---

# ai-usage-monitoring — User Requirements Document

## 1. Purpose

Cho admin một bức tranh đáng tin về mức dùng AI của tổ chức — mỗi
request AI có usage record về thao tác, model, token và chi phí ước
tính — để phát hiện bất thường sớm, reconcile được với hóa đơn provider
và quản lý ngân sách AI bằng căn cứ, trong khi log vận hành này không
bao giờ trở thành dữ liệu đánh giá nhân sự (PRD Mục 7.37).

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Admin | AI provider tính phí theo token nhưng không có usage record trong hệ thống | Không biết chi phí đến từ feature/thao tác nào, không reconcile được hóa đơn, spike chỉ phát hiện khi nhận bill | Ngân sách AI vượt kiểm soát, không chứng minh được nguyên nhân, không điều chỉnh policy kịp | Confirmed — PRD Mục 7.37, rủi ro R-14; Observed: reverse spec `platform-communications-and-governance` (bảng AI_USAGE đã có nền) |
| Product owner / operations | Không có số liệu tổng hợp về mức dùng AI | Không có căn cứ đặt quota, ngân sách hay quyết định đổi model/provider | Quyết định vận hành theo cảm tính | Assumption — suy từ "quản lý ngân sách" của PRD Mục 7.37 và R-14 |
| Security / DPO | Log vận hành dễ chứa payload/PII hoặc bị lạm dụng | Usage log có thể trở thành kênh giám sát người dùng trái chính sách | Vi phạm cam kết minh bạch và privacy gate | Confirmed — PRD Mục 7.37 (rủi ro "bị dùng ngoài mục đích vận hành"), Mục 5 non-goals |
| Quản lý / nhân viên | Mức dùng AI cá nhân có thể bị đọc như đánh giá hiệu suất | Lo bị soi mói thay vì được minh bạch mục đích | Mất niềm tin vào nền tảng | Confirmed — PRD Mục 7.37 "Chưa làm: đánh giá hiệu suất nhân viên từ mức dùng AI" |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Admin | Vận hành nền tảng, chịu trách nhiệm chi phí và rủi ro AI provider | Usage record đầy đủ, breakdown rõ, đơn giá cấu hình được, cảnh báo vượt ngưỡng xử lý được | Không biết tiền đi đâu, không reconcile được, spike phát hiện muộn |
| secondary | Product owner / operations | Review ngân sách và policy AI định kỳ | Tổng hợp đáng tin theo kỳ để quyết định | Không có căn cứ đặt quota/ngân sách |
| secondary | Security / DPO | Kiểm tra log vận hành không chứa PII và đúng mục đích công bố | Xác minh redact và phạm vi xem | Log có thể chứa payload hoặc bị lạm dụng |
| out | Quản lý | Không có surface usage — cố ý | — | (Bảo vệ: không dùng usage đánh giá nhân viên) |
| out | Người dùng nội bộ / ứng viên | Chỉ là nguồn phát sinh request | — | Không có nhu cầu trực tiếp |

## 3. Scope Boundaries

### In Scope

- Usage record cho mọi AI request đi qua nền tảng: feature, thao tác,
  provider, model, token vào/ra, trạng thái, chi phí ước tính, người
  dùng, đơn vị, thời điểm — chỉ metadata, không payload.
- Tổng hợp theo kỳ và breakdown theo feature/thao tác/model/người dùng.
- Pricing setting theo provider+model có hiệu lực và audit.
- Ngưỡng cảnh báo do admin đặt tay; cảnh báo mở → xem → đóng kèm ghi
  chú; không tự khóa/chặn request.
- Đối chiếu tổng hợp kỳ với hóa đơn provider, đánh dấu reconcile/lệch.
- Đo độ phủ của usage log (tỷ lệ record hợp lệ, "không đo được").

### Out of Scope

- Tự khóa người dùng/tính năng khi vượt ngưỡng (PRD Mục 7.37 "Chưa
  làm"); quota cứng là quyết định policy sau (P2).
- Đánh giá hiệu suất nhân viên từ mức dùng AI (PRD "Chưa làm").
- Đẩy cảnh báo qua `contextual-notifications` — P1.
- Export CSV, drill theo người kèm nhãn vận hành — P1.
- Anomaly detection tự động, auto-fetch bảng giá provider, liên kết
  provider console — P2.
- Instrument ghi usage ở từng feature nghiệp vụ — feature này định
  nghĩa dữ liệu và surface; điểm ghi chung ở provider boundary thuộc
  nền tảng.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Admin | Khi một AI request chạy trong nền tảng | Có usage record tự động: feature/thao tác/model/token/trạng thái/người/thời điểm, không payload | Mọi request đều truy vết được về mặt vận hành | Critical | Confirmed — PRD Mục 7.37 (usage log); Observed: reverse spec bảng AI_USAGE |
| UN-002 | Admin | Khi xem mức dùng trong một kỳ | Tổng hợp request/token/chi phí và breakdown theo feature/thao tác/model/người | Xác định được chi phí tập trung ở đâu | Critical | Confirmed — PRD Mục 7.37 (xu hướng, breakdown) |
| UN-003 | Admin | Khi provider đổi giá hoặc thêm model | Nhập/cập nhật đơn giá theo provider+model có hiệu lực | Chi phí ước tính record mới phản ánh giá đúng | Critical | Confirmed — PRD Mục 7.37 (pricing setting) |
| UN-004 | Admin | Khi muốn phát hiện bất thường sớm | Đặt ngưỡng theo metric+kỳ+phạm vi; nhận cảnh báo khi vượt | Cảnh báo mở trong ≤1 chu kỳ kiểm tra, không bỏ sót spike | High | Confirmed — PRD Mục 7.37 (cảnh báo thủ công), R-14 |
| UN-005 | Admin | Khi xử lý một cảnh báo | Drill số liệu vi phạm, đóng cảnh báo kèm ghi chú bắt buộc | Mọi cảnh báo có kết quả xử lý rõ ràng | High | Assumption — suy từ R-14 (response: cảnh báo + review) |
| UN-006 | Admin | Khi hóa đơn provider về cuối tháng | Đối chiếu tổng token/chi phí theo model với hóa đơn, đánh dấu reconcile hay lệch | Biết usage log có đủ phủ không; kịp thời phát hiện thiếu | High | Confirmed — PRD Mục 7.37 (đo thành công: reconcile được) |
| UN-007 | Admin | Khi một phần request thiếu token data | Thấy rõ tỷ lệ record "không đo được" để đánh giá độ phủ | Không lẫn số liệu đo được với số đoán | High | Confirmed — PRD Mục 7.37 (rủi ro "số liệu thiếu") |
| UN-008 | Security / DPO | Khi kiểm tra log vận hành | Xác minh usage record chỉ chứa metadata, phạm vi xem đúng quyền | Không PII trong log, không xem trái phạm vi | Critical | Confirmed — PRD Mục 7.37 (redact sai là rủi ro), Mục 9 |
| UN-009 | Product owner | Khi review ngân sách/policy AI định kỳ | Số liệu kỳ đáng tin để quyết định quota/ngưỡng/provider | Policy review có căn cứ | Medium | Assumption — suy từ R-14 response (quota/policy review) |
| UN-010 | Admin | Khi cần đưa số liệu ra ngoài (báo cáo, đối chiếu) | Export CSV theo kỳ/bộ lọc có audit | File đủ dùng, có vết ai xuất | Medium | Assumption — P1 của brainstorm |

## 5. Prioritized User Journeys

### Journey 1: Từ AI request đến usage record đầy đủ

- **User:** hệ thống (vận hành), admin là người kiểm chứng
- **Importance:** Critical
- **Trigger:** Một feature nghiệp vụ bất kỳ gọi AI provider.
- **Expected outcome:** Usage record được ghi đúng — đủ metadata, đúng
  chi phí ước tính, không payload.
- **Related needs:** UN-001, UN-007, UN-008

1) Feature gọi AI qua điểm chung → provider trả kết quả + token (hoặc
   lỗi/thiếu token).
2) Hệ thống ghi usage record: feature/thao tác/model/token/status/
   người/đơn vị/thời điểm.
3) Chi phí = token × đơn giá hiệu lực; thiếu token → "không đo được".
4) Record mới được kiểm tra ngưỡng; request nghiệp vụ không bị chặn ở
   mọi nhánh.

**Independent verification:** Chọn 10 AI request thật trên môi trường
thử — 10/10 có usage record, không record nào chứa nội dung prompt/
response, và chi phí khớp token × đơn giá tại thời điểm ghi.

### Journey 2: Admin điều tra chi phí theo breakdown

- **User:** Admin
- **Importance:** Critical
- **Trigger:** Chi phí AI tháng này cao bất thường hoặc cần báo cáo
  định kỳ.
- **Expected outcome:** Admin xác định được feature/thao tác/model
  (và người, nếu cần điều tra) chiếm chi phí.
- **Related needs:** UN-002, UN-007

1) Admin mở "Mức dùng AI" → chọn kỳ → xem tổng request/token/chi phí
   và xu hướng.
2) Chuyển breakdown theo feature → thao tác → model; thấy nhóm chiếm
   chi phí chính.
3) Drill sang danh sách record của nhóm (metadata); nếu cần, xem theo
   người dùng với nhãn "chỉ dùng cho điều tra vận hành".
4) Đánh dấu điểm bất thường để xử lý hoặc mở cảnh báo tay.

**Independent verification:** Trên dữ liệu kỳ thử — con số breakdown
theo từng chiều cộng lại khớp tổng kỳ, và danh sách record của một
nhóm khớp đúng số lượng đã đếm.

### Journey 3: Cấu hình ngưỡng và xử lý cảnh báo vượt

- **User:** Admin
- **Importance:** High
- **Trigger:** Admin muốn được báo khi chi phí hoặc số request vượt
  mức cho phép.
- **Expected outcome:** Cảnh báo được tạo khi vượt, admin xử lý và
  đóng có ghi nhận.
- **Related needs:** UN-004, UN-005, UN-009

1) Admin đặt ngưỡng (vd chi phí/tháng toàn tổ chức; request/ngày theo
   feature).
2) Số liệu kỳ vượt ngưỡng → cảnh báo "mở" xuất hiện trong danh sách
   trong ≤1 chu kỳ kiểm tra.
3) Admin mở cảnh báo → drill breakdown → xác định nguyên nhân.
4) Đóng cảnh báo kèm ghi chú bắt buộc; khắc phục diễn ra qua policy/
   feature liên quan — không qua khóa tài khoản.

**Independent verification:** Đặt ngưỡng thấp cố ý trên môi trường thử
— cảnh báo xuất hiện sau khi số liệu vượt, ghi đúng metric/giá trị vi
phạm, và bản ghi đóng có đủ người + ghi chú + thời điểm.

### Journey 4: Đối chiếu kỳ với hóa đơn provider

- **User:** Admin
- **Importance:** High
- **Trigger:** Cuối tháng, hóa đơn AI provider về.
- **Expected outcome:** Kỳ được đánh dấu "đã reconcile" hoặc "lệch"
  kèm hướng điều tra.
- **Related needs:** UN-006, UN-007, UN-009

1) Admin mở "Đối chiếu" → chọn tháng → xem tổng token/chi phí ước
   tính theo provider+model.
2) So với con số hóa đơn → chênh trong ngưỡng (đề xuất 5%) → đánh dấu
   "đã reconcile".
3) Vượt ngưỡng → "lệch" → kiểm tra tỷ lệ "không đo được", đơn giá
   thiếu/sai, record thiếu.

**Independent verification:** Với một tháng dữ liệu thử có hóa đơn giả
lập — màn đối chiếu hiện đúng tổng theo model, và quyết định reconcile
được ghi nhận kèm người + thời điểm.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Provider không trả token cho một số request | Chi phí ước tính thiếu âm thầm | Record đánh dấu "không đo được"; dashboard hiện % coverage | Journey 1 / UN-007 |
| Model chưa có đơn giá | Chi phí hiển thị sai/thiếu | Record ghi token, chi phí "chưa có giá"; cảnh báo nhắc bổ sung giá | UN-003 |
| Request AI lỗi/timeout | Tưởng không tốn phí nhưng provider vẫn tính | Vẫn ghi record status "lỗi" để đếm coverage | Journey 1 / UN-001 |
| Admin đổi giá giữa kỳ | Số liệu kỳ bị tính lẫn hai giá | Record cũ giữ chi phí đã chốt; giá mới chỉ áp record mới | UN-003 |
| Cảnh báo mở trong lúc ngưỡng bị tắt | Cảnh báo treo không ai xử lý | Vẫn hiện và đóng tay được; không sinh cảnh báo mới từ ngưỡng đã tắt | UN-004 |
| Người xem không có quyền usage | Tò mò mức dùng nhưng không được | Chặn với thông báo rõ; sự kiện ghi audit | UN-008 |
| Quản lý xin xem mức dùng của nhân viên mình | Muốn dùng cho đánh giá | Không có surface — chỉ admin/được cấp, kèm nhãn mục đích vận hành | UN-008 |
| Export vượt 100.000 dòng | File khổng lồ khó dùng | Chặn + gợi ý thu hẹp kỳ/bộ lọc | UN-010 |
| Tổ chức chưa có request AI nào | Dashboard trống khó hiểu | Empty state + gợi ý kiểm tra điểm ghi usage | Journey 2 |
| Dữ liệu synthetic/test trộn vào số liệu thật | Reconcile lệch không rõ nguyên nhân | Record mang cờ nguồn môi trường, loại khỏi đối chiếu (đề xuất) | Journey 4 / UN-006 |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt là ưu tiên (PRD Mục 9).
- Mọi surface usage chỉ mở cho người đăng nhập giữ vai trò được cấp
  trong đúng phạm vi tổ chức — ràng buộc quyền, không tùy chọn (PRD
  Mục 9).
- Usage record chỉ chứa metadata kỹ thuật — cấm đưa payload, prompt
  hay nội dung response vào log (PRD Mục 7.37 rủi ro, Mục 9).
- Số liệu theo người dùng chỉ phục vụ điều tra vận hành — không được
  dùng cho quyết định nhân sự (PRD Mục 7.37 "Chưa làm", Mục 12).
- Hệ thống không bao giờ chặn/khóa request hay tài khoản dựa trên số
  liệu usage — mọi phản ứng là quyết định của con người (R-14, Mục 12).
- Feature là slice mở rộng (MoSCoW `Should`) — không nằm trong cam kết
  pilot v1.
- Màn dashboard/breakdown/đối chiếu thiết kế cho desktop (bảng, bộ
  lọc); không yêu cầu mobile v1.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Mọi AI request đi qua một điểm ghi usage chung ở provider boundary | Nếu request đi lẻ → coverage thiếu, số liệu sai | Assumption — kiến trúc nền tảng | Kiểm chứng khi spec nền tảng AI chốt; đo % coverage làm guardrail |
| Đơn giá nhập tay theo bảng giá provider, hiệu lực theo ngày | Nếu cần auto-fetch → phải tích hợp thêm | Assumption | Đã giải ở brainstorm OQ-3 — chờ Admin lead |
| Chi phí chốt tại thời điểm ghi, không tính lại khi giá đổi | Nếu phải tính lại → reconcile phức tạp | Assumption | Đã giải ở brainstorm OQ-4 — chờ Admin lead |
| Breakdown theo người chỉ cho admin/được cấp; quản lý không có surface v1 | Nếu business yêu cầu quản lý xem → phải thêm policy + notice | Assumption | Đã giải ở brainstorm OQ-2 — chờ Security owner |
| Ngưỡng reconcile 5% và các giới hạn số Mục 7.2 brainstorm là chuẩn vận hành | Nếu khác → mốc "lệch" và giới hạn đổi | Assumption | Đã giải ở brainstorm OQ-7/OQ-8 — chờ Admin lead |
| Request_ref chỉ là tham chiếu nghiệp vụ tối thiểu, không chứa nội dung | Nếu cần payload điều tra → tăng rủi ro PII | Assumption — bám rủi ro PRD | Review redact cùng DPO trước dữ liệu thật |
| Retention usage log theo OQ-6 PRD (đề xuất 24 tháng) | Nếu ngắn hơn → mất lịch sử reconcile | Assumption — chờ DPO | Theo dõi OQ-6 PRD; trước đó synthetic |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Mọi AI request có usage record hợp lệ | Chưa có — xác lập bằng đếm coverage trong 1 tuần đầu bật | ≥99% request có record; ≥95% record đo được token | Tỷ lệ request AI có usage record / tổng request qua provider boundary | 1 tháng sau khi bật |
| USC-002 | Kỳ hóa đơn reconcile được | Chưa có — xác lập bằng kỳ đối chiếu đầu tiên | 100% kỳ có quyết định reconcile; chênh ≤5% hoặc có ghi nhận nguyên nhân | Số kỳ "đã reconcile" hoặc "lệch có nguyên nhân" / tổng kỳ | Hàng tháng |
| USC-003 | Cảnh báo được xử lý kịp thời | Chưa có — xác lập bằng các cảnh báo đầu trong 1 tháng | 100% cảnh báo đóng kèm ghi chú trong ≤3 ngày làm việc | Thời gian từ mở đến đóng của từng cảnh báo | 1 tháng sau khi bật |
| USC-004 | Không payload/PII trong usage log | 0 sự cố | 0 sự cố được xác nhận | Kiểm tra mẫu record định kỳ + review redact (bám M-GR-01) | Liên tục |
| USC-005 | Usage không bị lạm dụng ngoài vận hành | 0 trường hợp | 0 trường hợp số liệu usage xuất hiện trong quyết định nhân sự được xác nhận | Audit truy cập + complaint của nhân viên | Liên tục |

## 10. Open Questions

- [x] OQ-1: "Cảnh báo thủ công" nghĩa là gì — hệ thống có tự động gì
  không? — Resolved: admin tự cấu hình ngưỡng và tự xử lý; hệ thống chỉ
  flag trong màn admin, không tự khóa/chặn (PRD "Chưa làm" + R-14);
  notification là P1.
- [x] OQ-2: Ai được xem breakdown theo người dùng? — Resolved (đề
  xuất): chỉ admin/vai trò được cấp; quản lý không có surface v1 — chờ
  Security owner xác nhận.
- [x] OQ-3: Nguồn đơn giá? — Resolved (đề xuất): admin nhập tay theo
  bảng giá provider, hiệu lực theo ngày — chờ Admin lead xác nhận.
- [x] OQ-4: Chi phí có tính lại khi giá đổi? — Resolved (đề xuất):
  không — chốt tại thời điểm ghi record — chờ Admin lead xác nhận.
- [x] OQ-5: Request lỗi có ghi usage không? — Resolved: có, status
  "lỗi"; thiếu token thì "không đo được" để đo coverage.
- [x] OQ-6: Có quota cứng tự chặn request? — Resolved (đề xuất): không
  v1 — chỉ cảnh báo + policy review (R-14); quota cứng là P2 — chờ
  Product owner.
- [x] OQ-7: Ngưỡng reconcile chấp nhận được? — Resolved (đề xuất):
  ≤5% — chờ Admin lead xác nhận.
- [~] OQ-8: Retention usage log? — Out of scope feature: theo OQ-6 PRD
  (DPO duyệt); đề xuất 24 tháng, trước đó chỉ synthetic.
- [~] OQ-9: Anomaly detection tự động? — Out of scope v1: P2; v1 chỉ
  ngưỡng tay + so với kỳ trước.
