---
type: urd
feature: candidate-matching
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/candidate-matching/brainstorms/match-score-evidence-override.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md]
---

# candidate-matching — User Requirements Document

## 1. Purpose

Cho HR một cách ưu tiên hồ sơ nhanh mà vẫn giữ quyền quyết định: điểm
đối chiếu giữa CV đã xác nhận và yêu cầu vị trí, phân rã theo kỹ năng/
kinh nghiệm/domain, mỗi điểm kèm evidence giải thích được — score chỉ là
đề xuất, con người chấp nhận hoặc override có lý do, và không ứng viên
nào bị loại chỉ vì điểm máy.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| HR | Vị trí nhận nhiều CV, phải đọc lần lượt để xếp ưu tiên | Chậm, không nhất quán giữa người review, khó nói "vì sao người này trước" | Mất thời gian sàng lọc, quyết định thiếu căn cứ thống nhất | Confirmed — PRD Mục 7.7, JTBD-HR-01 |
| HR | Điểm AI trong nguồn cũ tự loại ứng viên dưới ngưỡng | Quyết định tuyển/loại bị máy chiếm, không giải thích được | Loại nhầm ứng viên, rủi ro công bằng và pháp lý | Observed: reverse spec rule 1 + OQ-RC-06; Confirmed — invariant PRD Mục 12 |
| HR lead | Không kiểm soát được tiêu chí sàng lọc của đội | Mỗi người review một kiểu, ngưỡng ai cũng sửa được | Kết quả sàng lọc không ổn định, không truy vết | Assumption — suy từ "threshold" trong phạm vi v1 PRD 7.7 |
| Quản lý | Muốn hiểu chất lượng hồ sơ đầu vào vị trí của mình | Không có thước đo chung giữa các ứng viên | Không so sánh được, khó ra quyết định mở rộng | Assumption — suy từ JTBD-MGR-01 |
| Ứng viên | Quyết định loại không rõ căn cứ | Có thể bị loại bởi điểm máy không giải thích | Trải nghiệm thiếu công bằng | Confirmed — PRD Mục 3 (JTBD-CAN-01), Mục 12 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | HR | Review hồ sơ đã xác nhận của một vị trí đang mở | Ưu tiên đúng người nhanh hơn, mọi quyết định có căn cứ và vẫn là quyết định của mình | Đọc CV thủ công, đề xuất máy không giải thích, sợ bấm theo máy sai |
| secondary | HR lead / Reviewer | Giám sát chất lượng sàng lọc và quyết định override | Đề xuất có evidence, override có lý do, đo được tỷ lệ đảo | Không truy vết được vì sao đề xuất bị đảo |
| secondary | Quản lý | Xem mức độ phù hợp của hồ sơ vào vị trí đơn vị | So sánh ứng viên trên cùng thước | Không có thước đo chung |
| secondary | Admin | Cấu hình threshold/quyền sửa ngưỡng | Ngưỡng có owner, lịch sử rõ | Ai cũng sửa ngưỡng không vết |
| out | Ứng viên | Chịu quyết định của quy trình | (gián tiếp) quyết định của con người trên điểm giải thích được | Không thao tác trong feature này |

## 3. Scope Boundaries

### In Scope

- Tính match score cho application có CV "Đã xác nhận" gắn vị trí: tổng
  điểm + breakdown kỹ năng/kinh nghiệm/domain.
- Evidence từng thành phần trỏ về field CV và yêu cầu vị trí.
- Threshold theo tổ chức/vị trí do vai trò được cấp đặt, có lịch sử và
  lý do — chỉ đổi nhãn đề xuất.
- Review của con người: chấp nhận đề xuất hoặc override kèm lý do bắt
  buộc; một quyết định hiệu lực trên run mới nhất.
- Chạy lại score khi CV/JD đổi; lịch sử run kèm model/tiêu chí version.
- Batch tính điểm nhiều hồ sơ của một vị trí (không quyết định hàng
  loạt).
- Cờ "không đủ dữ liệu" thay vì điểm thấp giả.
- Audit: ai chạy, ai quyết, override lý do gì, khi nào.

### Out of Scope

- Auto-reject/auto-quyết định cuối chỉ dựa trên AI (PRD "Chưa làm";
  invariant Mục 12).
- Chuyển trạng thái application — thuộc `candidate-pipeline`; matching
  chỉ ghi quyết định làm input cho con người điều phối.
- Xác nhận/parse CV — thuộc `cv-intake`; matching không đọc dữ liệu chưa
  xác nhận.
- Định nghĩa vị trí/JD và kỹ năng kỳ vọng — thuộc `recruitment-planning`
  và `talent-framework`; matching chỉ tham chiếu.
- Matching đa vị trí/gợi ý vị trí cho pool — roadmap mở rộng (OQ-7).
- Báo cáo bias/fairness định kỳ — v1 chỉ ghi đủ dữ liệu để phân tích
  (OQ-8).
- Chấm ứng viên không gắn vị trí (pool) — thiếu chuẩn đối chiếu.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi vị trí có nhiều hồ sơ đã xác nhận | Tính điểm đối chiếu cho một hoặc nhiều application để xếp ưu tiên review | Biết hồ sơ nào đáng xem trước mà không đọc hết từ đầu | Critical | Confirmed — PRD Mục 7.7 (score) |
| UN-002 | HR | Khi xem điểm của một ứng viên | Thấy phân rã theo kỹ năng/kinh nghiệm/domain thay vì chỉ một con số | Hiểu điểm mạnh/yếu để quyết có căn cứ | Critical | Confirmed — PRD Mục 7.7 (breakdown) |
| UN-003 | HR | Khi không hiểu vì sao ra điểm đó | Mở evidence: điểm thành phần trỏ tới field CV nào khớp yêu cầu nào | Score giải thích được, không hộp đen | Critical | Confirmed — PRD Mục 7.7 (evidence), rủi ro chính |
| UN-004 | HR | Khi đề xuất không khớp đánh giá của mình | Override kết quả đề xuất kèm lý do bắt buộc | Giữ quyền quyết định cuối, lý do truy vết được | Critical | Confirmed — PRD Mục 7.7 (override có lý do), Mục 12 |
| UN-005 | HR lead | Khi cần thống nhất tiêu chí sàng lọc | Đặt/sửa ngưỡng đề xuất theo tổ chức hoặc vị trí có lý do và lịch sử | Ngưỡng có owner, thay đổi truy vết được | High | Confirmed — PRD Mục 7.7 (threshold) |
| UN-006 | HR | Khi CV hoặc JD thay đổi sau khi đã có điểm | Được báo score "cũ" và tính lại trên dữ liệu mới | Không quyết định trên dữ liệu lỗi thời | High | Assumption — suy từ re-run và version của PRD 7.7 |
| UN-007 | HR | Khi CV thiếu dữ liệu để đối chiếu | Thấy cờ "không đủ dữ liệu" thay vì điểm thấp giả | Không đánh giá thấp oan ứng viên | High | Assumption — suy từ rủi ro bias/giải thích PRD 7.7 |
| UN-008 | HR | Khi quyết định xong | Application được đưa tiếp vào pipeline cho con người điều phối | Kết quả review thành bước đi tiếp rõ ràng | Critical | Confirmed — PRD Mục 7.7 (luồng → đưa vào pipeline) |
| UN-009 | Quản lý | Khi xem hồ sơ vị trí của mình | Thấy điểm và đề xuất trong phạm vi được cấp | Hiểu chất lượng đầu vào mà không vượt quyền | Medium | Assumption — suy từ JTBD-MGR-01 |

## 5. Prioritized User Journeys

### Journey 1: Tính điểm và quyết định trên một application

- **User:** HR
- **Importance:** Critical
- **Trigger:** Application có CV "Đã xác nhận" gắn vị trí đang mở.
- **Expected outcome:** Score + breakdown + evidence hiện rõ; HR chấp
  nhận hoặc override có lý do; quyết định ghi audit và application đi
  tiếp.
- **Related needs:** UN-001, UN-002, UN-003, UN-004, UN-008

1) HR mở application → "Tính điểm đối chiếu" (hoặc score đã tự chạy khi
   CV xác nhận).
2) Xem tổng điểm, nhãn đề xuất theo threshold, breakdown 3 thành phần.
3) Mở evidence từng thành phần: field CV ↔ yêu cầu vị trí.
4) Chọn "Chấp nhận đề xuất" hoặc "Override" + lý do → ghi quyết định.
5) Application được `candidate-pipeline` điều phối bước tiếp bởi con
   người.

**Independent verification:** Chọn một application đã quyết — kiểm tra
score có đủ breakdown + evidence, quyết định có người/thời điểm/lý do
nếu override, và không trạng thái nào tự đổi chỉ vì điểm.

### Journey 2: Batch tính điểm cho một vị trí

- **User:** HR
- **Importance:** High
- **Trigger:** Vị trí mở có nhiều hồ sơ đã xác nhận cần sàng.
- **Expected outcome:** Bảng score xếp theo điểm kèm nhãn đề xuất và cờ
  thiếu dữ liệu; HR review từng hồ sơ.
- **Related needs:** UN-001, UN-002, UN-007

1) HR mở vị trí → "Tính điểm cho hồ sơ đã xác nhận".
2) Hệ thống chạy score cho application đủ điều kiện, bỏ qua hồ sơ đã có
   quyết định.
3) Bảng kết quả xếp theo điểm; hồ sơ "không đủ dữ liệu" đánh dấu riêng.
4) HR mở từng hồ sơ review và quyết định như Journey 1.

**Independent verification:** Chạy batch trên vị trí có ≥3 hồ sơ — mọi
score tạo ra đều có run riêng + evidence, và hồ sơ đã quyết không bị
tính lại âm thầm.

### Journey 3: Override đề xuất có lý do

- **User:** HR
- **Importance:** High
- **Trigger:** Đề xuất của hệ thống không khớp đánh giá chuyên môn.
- **Expected outcome:** HR chọn kết quả khác, nhập lý do, quyết định
  override ghi đầy đủ để phân tích sau.
- **Related needs:** UN-004

1) Trên màn matching, HR chọn "Override" → chọn kết quả mong muốn.
2) Nhập lý do bắt buộc → xác nhận.
3) Audit ghi: đề xuất gốc, quyết định override, lý do, người, thời điểm.

**Independent verification:** Lấy mẫu các override — 100% có lý do không
rỗng và đề xuất gốc còn lưu để đối chiếu (đo M-GR-02).

### Journey 4: Điều chỉnh threshold của vị trí

- **User:** HR lead/Admin (vai trò được cấp)
- **Importance:** Medium
- **Trigger:** Ngưỡng mặc định không phù hợp độ khó vị trí.
- **Expected outcome:** Ngưỡng mới có hiệu lực cho run sau, lịch sử
  ngưỡng và lý do truy vết được.
- **Related needs:** UN-005

1) Mở cấu hình ngưỡng của vị trí → nhập giá trị mới + lý do.
2) Lưu → hiệu lực cho lần tính tiếp theo; score cũ giữ nhãn theo ngưỡng
   tại thời điểm tính.
3) Lịch sử ngưỡng hiện ai sửa, khi nào, từ giá trị nào sang giá trị nào.

**Independent verification:** Sửa ngưỡng một vị trí — run mới áp ngưỡng
mới, run cũ giữ nhãn cũ, audit đủ trước/sau.

### Journey 5: Tính lại score khi dữ liệu nguồn đổi

- **User:** HR
- **Importance:** Medium
- **Trigger:** CV được xác nhận lại hoặc JD/yêu cầu vị trí thay đổi.
- **Expected outcome:** Score cũ đánh dấu "cũ"; run mới trên dữ liệu mới;
  lịch sử run còn nguyên.
- **Related needs:** UN-006

1) Hệ thống đánh dấu run hiện có "cũ" khi nguồn đổi, hiện đề xuất tính
   lại.
2) HR bấm "Tính lại" → run mới được tạo.
3) Review và quyết định trên run mới; run cũ + quyết định cũ giữ làm
   lịch sử.

**Independent verification:** Đổi JD của vị trí đã có score — run cũ
hiện "cũ", run mới có model/tiêu chí version riêng, quyết định cũ không
bị sửa.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Tính điểm cho CV chưa xác nhận | Điểm trên dữ liệu chưa kiểm chứng | Chặn + hướng dẫn xác nhận CV trước | Journey 1 / UN-001 |
| Application chưa gắn vị trí (pool) | Không có chuẩn đối chiếu | Chặn + yêu cầu gắn vị trí trước | Journey 1 |
| Vị trí thiếu JD/yêu cầu | Score không có cơ sở | Chặn tính điểm, báo bổ sung JD; hoặc score cờ "yêu cầu chưa chuẩn" | Journey 1 / UN-003 |
| CV thiếu field đối chiếu | Điểm thấp giả | Cờ "không đủ dữ liệu" + gợi ý bổ sung CV | UN-007 |
| Job tính điểm lỗi/timeout | Không có score | Run trạng thái lỗi + lý do + thử lại | Journey 1 |
| HR quyết trên score "cũ" | Quyết định trên dữ liệu lỗi thời | Chặn quyết, yêu cầu tính lại | Journey 5 / UN-006 |
| Hai HR cùng quyết một run | Ghi đè quyết định | Quyết định đầu ghi; người sau thấy đã có + ai đã quyết | Journey 3 |
| Threshold đổi sau khi có score | Nhãn cũ không khớp ngưỡng mới | Nhãn cũ giữ theo ngưỡng tại thời điểm tính + cảnh báo | Journey 4 |
| Override không nhập lý do | Mất vết quyết định | Chặn xác nhận, yêu cầu lý do | Journey 3 / UN-004 |
| Người xem ngoài phạm vi vị trí | Xem score vượt quyền | Từ chối + audit | UN-009 |
| Chưa hồ sơ nào đủ điều kiện | Bảng batch trống | Empty state nêu điều kiện (CV đã xác nhận + gắn vị trí) | Journey 2 |

## 7. User-side Constraints

- Ngôn ngữ giao diện và thông báo tiếng Việt (PRD Mục 9).
- Chỉ người dùng nội bộ có quyền trên vị trí/application mới xem score,
  evidence và quyết định — theo organization/role/data-scope.
- Chỉ CV "Đã xác nhận" được đưa vào đối chiếu — điều kiện tiên quyết;
  matching không đọc field chưa xác nhận.
- Score chỉ là đề xuất: không hành động nào trên application được tự
  thực hiện từ điểm số (invariant PRD Mục 12) — đây là điều kiện của
  mọi màn hình và quyết định.
- Override và sửa threshold bắt buộc lý do — điều kiện tiên quyết của
  hai hành động này.
- Sửa threshold chỉ cho vai trò được cấp; người khác chỉ xem ngưỡng
  hiệu lực.
- Màn hình chính desktop (bảng breakdown, evidence); không yêu cầu
  mobile cho v1.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Thang 0–100, breakdown 3 thành phần trọng số bằng nhau mặc định | Nếu chuẩn khác → score khó giải thích/so sánh | Assumption — đã giải OQ-2 (đề xuất chờ Head of HR) | Head of HR chốt thang + trọng số |
| Threshold 2 tầng (tổ chức + vị trí), mặc định 60, chỉ vai trò được cấp sửa | Nếu ngưỡng tự do → tiêu chí sàng lọc loạn | Assumption — đã giải OQ-1/OQ-3 | Head of HR xác nhận |
| Score tự chạy khi CV xác nhận + vị trí còn mở (tạo run chờ-review) | Nếu phải bấm tay → batch thủ công nặng | Assumption — đã giải OQ-5 | Product owner xác nhận |
| Nhãn chỉ đạt/chưa đạt + cờ không đủ dữ liệu; không auto-action | Nếu có auto-action → vi phạm invariant | Confirmed — PRD Mục 12; trả lời OQ-RC-06 | — |
| Quyết định hiệu lực thuộc run mới nhất; run cũ giữ lịch sử | Nếu nhiều quyết định song song → mâu thuẫn | Assumption | — |
| Yêu cầu đối chiếu lấy từ POSITION JD + kỹ năng kỳ vọng talent-framework khi có | Nếu thiếu nguồn yêu cầu → score thiếu chuẩn | Assumption — phụ thuộc recruitment-planning/talent-framework | Đối chiếu khi hai feature chốt spec |
| Batch chỉ tính điểm, không quyết định hàng loạt | Nếu có bulk-quyết → rủi ro review hình thức | Confirmed — human-in-the-loop | — |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Đề xuất của hệ thống đáng tin để ưu tiên review | Chưa có — xác lập bằng đo tỷ lệ chấp nhận trong 1 tháng pilot | Tỷ lệ đề xuất được HR chấp nhận đạt mức sponsor duyệt (chờ OQ-2 sản phẩm); M-GR-02 không tăng sau rollout | Quyết định chấp nhận / quyết định có đề xuất, theo phiên bản model | 1 tháng sau pilot |
| USC-002 | Mọi score giải thích được | 0% trước feature | 100% score có breakdown + evidence truy ngược | Kiểm tra mẫu run | Hàng tháng |
| USC-003 | Override đều có lý do | 0% trước feature | 100% override có lý do không rỗng | Kiểm tra mẫu quyết định override | Hàng tháng |
| USC-004 | Không quyết định tự động từ điểm | 0 sự cố | 0 application đổi trạng thái chỉ vì score | Giám sát sự kiện transition vs score | Liên tục |
| USC-005 | Review không bấm mù theo đề xuất | Chưa có — xác lập trong pilot | ≥90% quyết định có mở evidence trước khi quyết (đề xuất) | Tỷ lệ quyết định có sự kiện xem evidence | 1 tháng sau pilot |

## 10. Open Questions

- [x] OQ-1: Ai đặt/sửa threshold — Resolved (đề xuất): vai trò HR lead/
  admin; Head of HR duyệt ngưỡng tổ chức và theo vị trí — chờ Head of HR
  xác nhận (liên quan OQ-11 PRD).
- [x] OQ-2: Thang điểm và trọng số — Resolved (đề xuất): 0–100; 3 thành
  phần trọng số bằng nhau mặc định, cấu hình được — chờ Head of HR xác
  nhận.
- [x] OQ-3: Ngưỡng mặc định — Resolved (đề xuất): 60/100 — chờ Head of
  HR xác nhận.
- [x] OQ-4: Auto-reject dưới ngưỡng — Resolved: KHÔNG; score chỉ là đề
  xuất (PRD Mục 12; OQ-RC-06 = recommendation).
- [x] OQ-5: Tự chạy hay bấm tay — Resolved (đề xuất): tự chạy tạo run
  chờ-review khi CV xác nhận + vị trí mở — chờ Product owner xác nhận.
- [x] OQ-6: Score = threshold — Resolved: tính "Đạt đề xuất".
- [~] OQ-7: Gợi ý vị trí cho pool — Out of scope v1: matching đa vị trí
  là roadmap mở rộng.
- [~] OQ-8: Báo cáo bias/fairness — Out of scope v1: chỉ ghi đủ dữ liệu
  quyết định để phân tích sau.
