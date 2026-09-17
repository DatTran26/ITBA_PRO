---
type: srs
feature: ai-usage-monitoring
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/ai-usage-monitoring/brainstorms/ai-usage-cost-observability.md
  - docs/features/ai-usage-monitoring/ai-usage-monitoring-urd.md
  - docs/_reverse/platform-communications-and-governance/reverse-spec.md
---

# ai-usage-monitoring — Software Requirements Specification

## 1. Scope

SRS này cover giám sát mức dùng AI phục vụ vận hành: usage record cho
mọi AI request đi qua nền tảng (chỉ metadata, không payload), tổng hợp
theo kỳ, breakdown theo feature/thao tác/model/người dùng, pricing
setting theo provider+model, ngưỡng cảnh báo do admin đặt tay, vòng đời
cảnh báo (mở → đang xem → đã đóng), và đối chiếu tổng hợp kỳ với hóa
đơn provider.

Feature xếp MoSCoW `Should` (PRD Feature Map #37) — KHÔNG nằm trong cam
kết pilot v1; đây là slice mở rộng, áp dụng khi sponsor duyệt roadmap
tiếp theo.

KHÔNG cover: tự khóa người dùng/request khi vượt ngưỡng (PRD Mục 7.37
"Chưa làm"); đánh giá hiệu suất nhân viên từ mức dùng AI (PRD "Chưa
làm"); gửi cảnh báo qua notification (P1, phụ thuộc
`contextual-notifications`); export CSV và drill theo người kèm nhãn
vận hành (P1); anomaly detection tự động, auto-fetch giá provider,
quota cứng (P2); instrument ghi usage trong từng feature nghiệp vụ —
feature này định nghĩa dữ liệu và surface, điểm ghi chung thuộc nền
tảng.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Admin | người | Xem tổng hợp/breakdown, cấu hình đơn giá và ngưỡng, xử lý cảnh báo, đối chiếu kỳ, export | Có |
| Product owner / operations | người | Xem số liệu kỳ để review ngân sách/quota/policy | Có (xem, không cấu hình) |
| Security / DPO | người | Kiểm tra log chỉ chứa metadata, phạm vi xem đúng | Có (xem/audit) |
| Điểm ghi usage chung của nền tảng | hệ thống | Ghi usage record khi AI request hoàn tất/thất bại; kiểm tra ngưỡng | Có |
| Tác vụ tổng hợp/kiểm tra ngưỡng | hệ thống | Chạy chu kỳ idempotent, tạo cảnh báo khi vượt | Có |
| AI provider (OpenAI/Gemini/...) | ngoài | Trả token usage trên response; gửi hóa đơn theo kỳ | Không (nguồn dữ liệu) |
| Quản lý | người | — | Không (cố ý: không surface, chống lạm dụng đánh giá nhân sự) |
| Người dùng nội bộ | người | Chỉ là nguồn phát sinh request | Không |
| `contextual-notifications` | hệ thống (feature khác) | Kênh đẩy cảnh báo (P1) | Không (dependency) |
| `platform-configuration` | hệ thống (feature khác) | Surface đặt đơn giá/ngưỡng trong nhóm cấu hình "AI" | Không (dependency) |
| `org-governance` | hệ thống (feature khác) | Role/scope/audit cho quyền xem và cấu hình | Không (dependency) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-ai-usage-monitoring-001 | Ghi usage record cho mọi AI request | Khi một AI request qua điểm ghi chung hoàn tất hoặc thất bại, hệ thống phải ghi usage record gồm: feature nguồn, loại thao tác, provider, model, token vào, token ra, trạng thái (thành công/lỗi/không đo được), chi phí ước tính, người dùng, đơn vị, thời điểm — và KHÔNG được ghi payload, prompt hay nội dung response | P0 | test | PRD Mục 7.37 (usage log, rủi ro redact); URD UN-001 |
| FR-ai-usage-monitoring-002 | Chi phí ước tính chốt tại thời điểm ghi | Khi ghi record, hệ thống phải tính chi phí = token × đơn giá hiệu lực của provider+model tại thời điểm đó và giữ nguyên giá trị này kể cả khi giá đổi sau; model chưa có giá thì chi phí để trống và hiển thị "chưa có giá" | P0 | test | brainstorm Mục 5.3, OQ-4; URD UN-003 |
| FR-ai-usage-monitoring-003 | Đánh dấu record không đo được | Nếu provider không trả token usage cho một request, hệ thống phải ghi record với trạng thái "không đo được" và đếm riêng vào chỉ số coverage thay vì đoán số | P0 | test | PRD Mục 7.37 (rủi ro số liệu thiếu); URD UN-007 |
| FR-ai-usage-monitoring-004 | Tổng hợp theo kỳ | Hệ thống phải tổng hợp usage theo kỳ (ngày/tuần/tháng): tổng request, token vào/ra, chi phí ước tính, và so với kỳ trước tương đương | P0 | test | PRD Mục 7.37 (xu hướng); URD UN-002 |
| FR-ai-usage-monitoring-005 | Breakdown đa chiều | Hệ thống phải cho breakdown số liệu kỳ theo feature, loại thao tác, provider/model và người dùng; breakdown theo người chỉ hiển thị cho vai trò được cấp và kèm nhãn "chỉ dùng cho điều tra vận hành" | P0 | test | PRD Mục 7.37 (breakdown); URD UN-002, UN-008 |
| FR-ai-usage-monitoring-006 | Danh sách record theo nhóm | Khi admin drill một nhóm breakdown, hệ thống phải trả danh sách usage record thuộc nhóm đó (metadata, phân trang) | P0 | demo | URD Journey 2 |
| FR-ai-usage-monitoring-007 | Quản lý đơn giá | Hệ thống phải cho vai trò được cấp thêm/sửa đơn giá theo provider+model: giá/token vào, giá/token ra, tiền tệ, ngày hiệu lực; chặn khoảng hiệu lực chồng nhau trên cùng khóa; mọi thay đổi có audit giá cũ/mới | P0 | test | PRD Mục 7.37 (pricing setting); URD UN-003 |
| FR-ai-usage-monitoring-008 | Quản lý ngưỡng cảnh báo | Hệ thống phải cho vai trò được cấp tạo/sửa/tắt ngưỡng theo metric (chi phí/số request/token), kỳ (ngày/tuần/tháng) và phạm vi (toàn tổ chức hoặc 1 feature); ngưỡng bị tắt không sinh cảnh báo mới nhưng không tự đóng cảnh báo đang mở | P0 | test | PRD Mục 7.37 (cảnh báo thủ công); URD UN-004 |
| FR-ai-usage-monitoring-009 | Tạo cảnh báo khi vượt ngưỡng | Khi tác vụ chu kỳ phát hiện số liệu kỳ hiện tại vượt ngưỡng đang bật, hệ thống phải tạo cảnh báo "mở" ghi metric, giá trị ngưỡng, giá trị đo được và kỳ — và KHÔNG được chặn/khóa request hay tài khoản nào | P0 | test | PRD Mục 7.37 + "Chưa làm", R-14; URD UN-004 |
| FR-ai-usage-monitoring-010 | Vòng đời cảnh báo | Hệ thống phải cho admin xem danh sách cảnh báo (mở/đang xem/đã đóng), mở xem số liệu vi phạm kèm drill, và đóng cảnh báo chỉ khi có ghi chú ≥10 ký tự; ghi nhận người và thời điểm đóng | P0 | test | URD UN-005; brainstorm Mục 6.3 |
| FR-ai-usage-monitoring-011 | Đối chiếu kỳ với hóa đơn | Hệ thống phải cho admin chọn một kỳ tháng và xem tổng token/chi phí ước tính theo provider+model; khi admin xác nhận đối chiếu, hệ thống ghi trạng thái kỳ "đã reconcile" hoặc "lệch cần điều tra" kèm người và thời điểm | P0 | demo | PRD Mục 7.37 (đo thành công: reconcile); URD UN-006 |
| FR-ai-usage-monitoring-012 | Chỉ số coverage của usage log | Hệ thống phải hiển thị tỷ lệ request có usage record và tỷ lệ record "không đo được" trong kỳ, để admin đánh giá độ phủ trước khi tin số liệu | P1 | demo | PRD Mục 7.37 (đo thành công, rủi ro số liệu thiếu); URD UN-007 |
| FR-ai-usage-monitoring-013 | Phân quyền xem usage | Hệ thống phải chỉ mở màn usage cho vai trò được cấp trong đúng phạm vi tổ chức; mọi lượt xem breakdown theo người và export phải ghi audit | P0 | test | PRD Mục 9, Mục 7.37 (rủi ro lạm dụng); URD UN-008 |
| FR-ai-usage-monitoring-014 | Cờ nguồn môi trường | Usage record phải mang cờ nguồn (môi trường thật/test) để loại dữ liệu synthetic khỏi số liệu đối chiếu và cảnh báo | P1 | test | brainstorm Mục 6.5 (đề xuất); URD Mục 6 |
| FR-ai-usage-monitoring-015 | Export CSV có audit | Khi vai trò được cấp export số liệu theo kỳ/bộ lọc, hệ thống phải tạo file trong giới hạn 100.000 dòng và ghi audit (ai, khi nào, bộ lọc) | P1 | test | brainstorm Mục 4 (P1); URD UN-010 |
| FR-ai-usage-monitoring-016 | Đẩy cảnh báo qua notification | Khi `contextual-notifications` sẵn sàng, hệ thống phải cho admin chọn nhận cảnh báo mới qua kênh đó; v1 chỉ là danh sách trong màn admin | P1 | demo | brainstorm Mục 4 (P1); URD OQ-1 |
| FR-ai-usage-monitoring-017 | Drill theo người dùng kèm nhãn mục đích | Khi vai trò được cấp xem breakdown một người dùng cụ thể, hệ thống phải hiển thị nhãn "chỉ dùng cho điều tra vận hành — không dùng đánh giá nhân sự" và ghi audit lượt xem | P1 | test | brainstorm Mục 4 (P1); PRD Mục 7.37 "Chưa làm" |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-ai-usage-monitoring-001 | privacy | Usage record chỉ chứa metadata trong whitelist (không payload, không prompt, không nội dung response, không field text tự do) | P0 | 0 sự cố PII/payload trong usage log được xác nhận (guardrail bám M-GR-01); kiểm tra mẫu định kỳ |
| NFR-ai-usage-monitoring-002 | security | Mọi surface usage theo organization/role/data-scope; truy cập ngoài quyền bị chặn và ghi audit | P0 | 0 sự cố xem trái phạm vi được xác nhận (bám M-GR-01) |
| NFR-ai-usage-monitoring-003 | integrity | Ghi usage không làm chậm/chặn request nghiệp vụ: request AI hoàn tất bình thường kể cả khi bước ghi log lỗi | P0 | Test fault-injection: khi ghi log thất bại, request nghiệp vụ vẫn trả kết quả và sự cố được báo |
| NFR-ai-usage-monitoring-004 | reliability | Tác vụ tổng hợp và kiểm tra ngưỡng idempotent: chạy lại không tạo cảnh báo/bản ghi trùng | P0 | Test chạy lại tác vụ trên cùng kỳ không sinh bản ghi trùng |
| NFR-ai-usage-monitoring-005 | auditability | Mọi thay đổi đơn giá/ngưỡng, lượt đóng cảnh báo, lượt export và lượt xem breakdown theo người đều có audit đủ ai-khi nào-trước/sau | P0 | Truy vết được 100% sự kiện trên mẫu kiểm tra |
| NFR-ai-usage-monitoring-006 | performance | Dashboard tổng hợp/breakdown tải nhanh ở quy mô usage thực tế | P1 | 95% lượt mở dashboard trả kết quả trong ≤3 giây ở quy mô ≤5 triệu record/tổ chức (giá trị đề xuất — xem OQ spec) |
| NFR-ai-usage-monitoring-007 | data-retention | Usage log giữ theo chính sách retention chung (chỉ metadata) | P1 | Thời gian giữ theo OQ-6 PRD — đề xuất 24 tháng |
| NFR-ai-usage-monitoring-008 | usability | Toàn bộ giao diện và thông báo tiếng Việt; số liệu tiền tệ hiển thị theo tiền tệ cấu hình kèm ký hiệu | P0 | Kiểm tra mẫu số liệu VND/USD hiển thị đúng định dạng |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-ai-usage-monitoring-001 | Usage log không bao giờ chứa payload/prompt/nội dung response — chỉ metadata whitelist | Khi ghi usage record | FR-ai-usage-monitoring-001 | PRD Mục 7.37 (rủi ro redact), Mục 9 |
| BR-ai-usage-monitoring-002 | Số liệu usage không được dùng cho quyết định/đánh giá nhân sự; breakdown theo người chỉ phục vụ điều tra vận hành và chỉ mở cho vai trò được cấp | Khi render/export breakdown theo người | FR-ai-usage-monitoring-005, 013, 017 | PRD Mục 7.37 "Chưa làm", Mục 12; R-14 |
| BR-ai-usage-monitoring-003 | Vượt ngưỡng chỉ tạo cảnh báo cho con người xử lý — hệ thống không tự chặn request, khóa tài khoản hay tắt feature | Khi số liệu vượt ngưỡng | FR-ai-usage-monitoring-009 | PRD Mục 7.37 "Chưa làm"; R-14 response |
| BR-ai-usage-monitoring-004 | Chi phí ước tính chốt tại thời điểm ghi record; đổi giá không tính lại record cũ | Khi lưu đơn giá mới | FR-ai-usage-monitoring-002, 007 | brainstorm OQ-4 (đề xuất) |
| BR-ai-usage-monitoring-005 | Khoảng hiệu lực đơn giá không được chồng nhau trên cùng provider+model | Khi lưu đơn giá | FR-ai-usage-monitoring-007 | brainstorm Mục 7.1 |
| BR-ai-usage-monitoring-006 | Đóng cảnh báo bắt buộc ghi chú ≥10 ký tự và ghi nhận người đóng | Khi admin đóng cảnh báo | FR-ai-usage-monitoring-010 | brainstorm Mục 7.1; URD UN-005 |
| BR-ai-usage-monitoring-007 | Record thiếu token data ghi "không đo được" — cấm đoán số để số liệu trông đầy đủ | Khi provider không trả token | FR-ai-usage-monitoring-003 | PRD Mục 7.37 (rủi ro số liệu thiếu) |
| BR-ai-usage-monitoring-008 | Dữ liệu synthetic/test không được tính vào số liệu đối chiếu và cảnh báo | Khi tổng hợp cho đối chiếu/ngưỡng | FR-ai-usage-monitoring-014 | brainstorm Mục 6.5 (đề xuất) |
| BR-ai-usage-monitoring-009 | Mọi thay đổi đơn giá/ngưỡng và mọi lượt export/xem breakdown theo người đều phải có audit | Khi thực hiện các action đó | FR-ai-usage-monitoring-007, 008, 013, 015, 017 | PRD Mục 9 |
| BR-ai-usage-monitoring-010 | Ghi usage phải fire-and-forget đối với request nghiệp vụ — lỗi ghi log không được làm request AI thất bại | Khi bước ghi log lỗi | FR-ai-usage-monitoring-001 | NFR-003; brainstorm Mục 6.4 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-ai-usage-monitoring-001 | Ngưỡng thiếu/không hợp lệ | Lưu ngưỡng thiếu metric/kỳ/phạm vi hoặc giá trị ≤0 | minor | FR-ai-usage-monitoring-008 | Hiện "Nhập ngưỡng lớn hơn 0 và chọn đủ metric, kỳ, phạm vi" | Admin nhập lại |
| E-ai-usage-monitoring-002 | Đơn giá chồng hiệu lực | Lưu đơn giá trùng khoảng hiệu lực trên cùng provider+model | minor | FR-ai-usage-monitoring-007 | Hiện "Đã có đơn giá cho {provider}/{model} trùng khoảng hiệu lực — kiểm tra lại ngày" | Sửa ngày hiệu lực |
| E-ai-usage-monitoring-003 | Đóng cảnh báo thiếu ghi chú | Đóng cảnh báo với ghi chú rỗng/<10 ký tự | minor | FR-ai-usage-monitoring-010 | Hiện "Nhập ghi chú xử lý (tối thiểu 10 ký tự) trước khi đóng cảnh báo" | Nhập ghi chú rồi đóng |
| E-ai-usage-monitoring-004 | Không có quyền xem usage | Người dùng không giữ vai trò được cấp mở màn usage | major | FR-ai-usage-monitoring-013 | Hiện "Bạn không có quyền xem dữ liệu mức dùng AI" | Xin cấp quyền; sự kiện ghi audit |
| E-ai-usage-monitoring-005 | Export vượt giới hạn | Bộ lọc export trả >100.000 dòng | minor | FR-ai-usage-monitoring-015 | Hiện "Bộ lọc hiện tại có hơn 100.000 dòng — thu hẹp kỳ hoặc điều kiện rồi xuất lại" | Thu hẹp bộ lọc |
| E-ai-usage-monitoring-006 | Khoảng truy vấn quá dài | Chọn khoảng xem >12 tháng | minor | FR-ai-usage-monitoring-005 | Hiện "Khoảng thời gian tối đa 12 tháng — chọn lại" | Chọn lại kỳ |
| E-ai-usage-monitoring-007 | Ghi usage thất bại | Điểm ghi chung không ghi được record (lỗi hạ tầng) | critical | FR-ai-usage-monitoring-001 | Request nghiệp vụ vẫn trả kết quả; cảnh báo vận hành hiện trên màn admin "ghi usage đang lỗi — coverage sẽ thiếu" | Khôi phục điểm ghi; đánh dấu kỳ coverage thiếu (NFR-003) |
| E-ai-usage-monitoring-008 | Tác vụ tổng hợp/ngưỡng lỗi | Job chu kỳ fail giữa chừng | major | FR-ai-usage-monitoring-009 | Cảnh báo "tổng hợp usage bị trễ" cho admin | Job chạy lại idempotent từ mốc cuối (NFR-004) |
| E-ai-usage-monitoring-009 | Model chưa có đơn giá | Record ghi được token nhưng không có giá hiệu lực | minor | FR-ai-usage-monitoring-002 | Chi phí hiển thị "chưa có giá"; nhắc admin bổ sung | Thêm đơn giá; record mới tính được |
| E-ai-usage-monitoring-010 | Reconcile lệch ngưỡng | Chênh ước tính vs hóa đơn >5% | major | FR-ai-usage-monitoring-011 | Kỳ đánh dấu "lệch" + gợi ý kiểm tra coverage/đơn giá | Điều tra: tỷ lệ "không đo được", giá thiếu, record thiếu |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-ai-usage-monitoring-01 | Usage log đủ phủ để tin số liệu | Tỷ lệ request AI có usage record; tỷ lệ record đo được token | ≥99% có record; ≥95% đo được token |
| SC-ai-usage-monitoring-02 | Kỳ hóa đơn reconcile được | Số kỳ "đã reconcile" hoặc "lệch có nguyên nhân" / tổng kỳ | 100%; chênh ≤5% (đề xuất) |
| SC-ai-usage-monitoring-03 | Cảnh báo được xử lý có trách nhiệm | Tỷ lệ cảnh báo đóng kèm ghi chú trong ≤3 ngày làm việc | 100% |
| SC-ai-usage-monitoring-04 | Không payload trong log vận hành | Số sự cố PII/payload trong usage record được xác nhận | 0 (guardrail, bám M-GR-01) |
| SC-ai-usage-monitoring-05 | Không lạm dụng cho đánh giá nhân sự | Số trường hợp số liệu usage trong quyết định nhân sự được xác nhận | 0 (guardrail, PRD "Chưa làm") |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Usage record__ — một lượt AI request: feature, thao tác, provider,
  model, token vào/ra, trạng thái, chi phí ước tính đã chốt, người dùng,
  đơn vị, cờ nguồn môi trường, thời điểm. Bất biến sau khi ghi.
- __Tổng hợp ngày__ — số liệu gộp theo ngày × feature × thao tác ×
  model phục vụ dashboard và kiểm tra ngưỡng.
- __Đơn giá AI__ — giá/token vào, giá/token ra theo provider+model với
  khoảng hiệu lực và vết cập nhật.
- __Ngưỡng cảnh báo__ — metric, kỳ, giá trị, phạm vi, trạng thái bật/tắt.
- __Cảnh báo__ — một lần vi phạm ngưỡng: số đo, trạng thái mở/đang xem/
  đã đóng, người đóng, ghi chú.
- __Trạng thái đối chiếu kỳ__ — quyết định reconcile/lệch của admin trên
  từng tháng.
- __Người dùng nội bộ / Đơn vị tổ chức__ — entity neo tham chiếu từ
  `account-access`/`org-governance`, không sở hữu ở đây.

Chi tiết quan hệ + thuộc tính ở `srs/ai-usage-monitoring-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ AI request → ghi usage record (không payload) → chốt chi
  phí → kiểm tra ngưỡng (không bao giờ chặn request).
- __Flow 2:__ Admin chọn kỳ → tổng hợp → breakdown → drill record nhóm.
- __Flow 3:__ Admin lưu đơn giá/ngưỡng → audit → áp cho record mới.
- __Flow 4:__ Số liệu vượt ngưỡng → cảnh báo mở → admin drill → đóng
  kèm ghi chú → điều chỉnh policy ngoài hệ thống.
- __Flow 5:__ Chọn tháng → tổng hợp theo model → so với hóa đơn → đánh
  dấu reconcile/lệch.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __usage-dashboard__ — tổng request/token/chi phí theo kỳ + xu hướng +
  chỉ số coverage.
- __usage-breakdown__ — bảng breakdown theo feature/thao tác/model/
  người (theo quyền) + drill danh sách record.
- __ai-pricing-settings__ — danh sách đơn giá theo provider+model, thêm/
  sửa có hiệu lực (nhúng trong `platform-configuration`).
- __usage-thresholds__ — danh sách ngưỡng đang bật/tắt + form đặt
  ngưỡng.
- __usage-alert-list__ — cảnh báo mở/đang xem/đã đóng + drill số liệu
  vi phạm + đóng kèm ghi chú.
- __usage-reconcile__ — chọn tháng, tổng theo provider+model, xác nhận
  đối chiếu.
- __usage-export__ — chọn kỳ/bộ lọc, xuất CSV có audit.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Mọi surface usage theo organization/role/data-scope | PRD Mục 9 — Security owner |
| Usage log chỉ chứa metadata, không payload/PII | PRD Mục 7.37 (rủi ro redact), Mục 9 — Security + DPO |
| Không dùng usage cho quyết định/đánh giá nhân sự | PRD Mục 7.37 "Chưa làm", Mục 12 — Product owner |
| Không tự khóa/chặn request hay tài khoản từ số liệu usage | PRD Mục 7.37 "Chưa làm"; R-14 — Product owner |
| Audit cho action nhạy cảm (đổi giá/ngưỡng, export, xem theo người) | PRD Mục 9 — Security owner |
| Feature `Should` — không nằm trong cam kết v1 | PRD Feature Map #37 + Mục 12 — Product owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Điểm ghi usage chung ở provider boundary của nền tảng | Nền tảng AI / `platform-configuration` | FR-001/003 — không có record để giám sát |
| Role/scope + audit hành động | `org-governance` | FR-005/008/013 và mọi audit |
| Danh tính người dùng nội bộ | `account-access` | Gắn request với người dùng |
| Surface cấu hình (nhóm "AI") cho đơn giá/ngưỡng | `platform-configuration` | FR-007/008 có nơi vận hành |
| Kênh đẩy cảnh báo | `contextual-notifications` | FR-016 (P1) |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Provider trả token usage cho phần lớn request | FR-003 và SC-01 không đạt — phải đổi cách đo coverage |
| Đơn giá nhập tay là đủ cho v1 | FR-007 phải thêm nguồn auto-fetch |
| Ngưỡng tay + so kỳ trước đủ phát hiện spike | FR-009/010 phải thêm anomaly (P2 kéo sớm) |
| Giới hạn số (15 phút, 50 dòng/trang, 100.000 dòng export, 20 ngưỡng, 5% reconcile, 12 tháng truy vấn) là chuẩn | FR/NFR đổi ngưỡng tương ứng |
| Tác vụ chu kỳ nền tảng sẵn có để chạy kiểm tra ngưỡng/tổng hợp | FR-009 và NFR-004 cần cơ chế lập lịch riêng |

## 12. Open Questions

- [x] OQ-1: "Cảnh báo thủ công" — hệ thống tự động đến đâu? — Resolved:
  chỉ flag trong màn admin; không tự khóa/chặn (PRD "Chưa làm" + R-14);
  notification là P1.
- [x] OQ-2: Ai xem được breakdown theo người? — Resolved (đề xuất):
  chỉ admin/vai trò được cấp, kèm nhãn vận hành + audit — chờ Security
  owner xác nhận.
- [x] OQ-3: Nguồn đơn giá? — Resolved (đề xuất): admin nhập tay theo
  bảng giá provider — chờ Admin lead xác nhận.
- [x] OQ-4: Chi phí có tính lại khi giá đổi? — Resolved (đề xuất):
  không — chốt tại thời điểm ghi — chờ Admin lead xác nhận.
- [x] OQ-5: Request lỗi có ghi usage? — Resolved: có, status "lỗi";
  thiếu token → "không đo được".
- [x] OQ-6: Có quota cứng? — Resolved (đề xuất): không v1 — chỉ cảnh
  báo + policy review (R-14); P2 — chờ Product owner.
- [x] OQ-7: Ngưỡng reconcile và các giới hạn số được chấp nhận? —
  Resolved (đề xuất): ≤5% chênh hóa đơn; giới hạn theo Mục 7.2
  brainstorm — chờ Admin lead xác nhận.
- [~] OQ-8: Retention usage log? — Out of scope feature: theo OQ-6 PRD;
  đề xuất 24 tháng cho metadata, trước đó synthetic.
- [~] OQ-9: Anomaly detection tự động? — Out of scope v1: P2.
