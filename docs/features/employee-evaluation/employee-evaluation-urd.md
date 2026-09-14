---
type: urd
feature: employee-evaluation
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/employee-evaluation/brainstorms/evidence-based-employee-evaluation.md, docs/_reverse/talent-and-crm/reverse-spec.md]
---

# employee-evaluation — User Requirements Document

## 1. Purpose

Cho quản lý và nhân viên một chu trình đánh giá năng lực có kiểm chứng: bài
đánh giá được giao theo khung kỹ năng đã công bố, điểm và level đề xuất
được reviewer (con người) xác nhận hoặc điều chỉnh kèm lý do, và kết quả
đã ghi nhận trở thành hồ sơ năng lực có provenance — thay cho đánh giá
cảm tính, đồng thời giữ điểm bài test đúng vai trò evidence chứ không phải
kết luận toàn diện về con người.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Quản lý (reviewer) | Đánh giá cấp dưới bằng nhận xét chung trong file/biên bản rời | Không có khung chung, không có evidence để đối chiếu khi bị tranh chấp | Đánh giá cảm tính, khó bảo vệ quyết định, kết quả không tích lũy | Confirmed — PRD Mục 7.33, JTBD-MGR-01 |
| Nhân viên | Không biết mình được đánh giá trên căn cứ gì | Sợ điểm một bài test bị dùng như kết luận về con người mình | Mất niềm tin vào quy trình, ngại tham gia đánh giá | Confirmed — PRD Mục 7.33 (rủi ro chính), JTBD-EMP-01 |
| HR | Điều phối đợt đánh giá qua email và file | Không biết ai đã làm bài, ai chưa xác nhận, đợt nào đang treo | Phải đôn đốc thủ công, đợt đánh giá kéo dài không kết thúc | Assumption — suy từ luồng "chọn nhóm/vị trí → giao bài" của PRD Mục 7.33 |
| Business owner (Head of HR) | Quy tắc suy level từ điểm và vai trò reviewer chưa có ai chịu trách nhiệm | Level bị tranh chấp mà không có authority để giải quyết | Kết quả đánh giá và gap analysis bị nghi ngờ | Confirmed — PRD Mục 10 R-13, OQ-11; Observed: reverse spec `talent-and-crm` OQ-TL-01/OQ-TL-02 |
| Admin | Kết quả đánh giá là dữ liệu nhạy cảm của nhân viên | Chưa rõ ai được xem, truy cập có truy vết được không | Nguy cơ lộ dữ liệu nhân sự ra ngoài phạm vi | Confirmed — PRD Mục 9 (scope/audit), OQ-8 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Quản lý (reviewer) | Được gán xác nhận kết quả đánh giá của cấp dưới trong scope | Xem đủ evidence, xác nhận/điều chỉnh level có lý do, ghi nhận điểm mạnh và nhu cầu phát triển | Đánh giá cảm tính, thiếu căn cứ, dễ bị tranh chấp |
| secondary | Nhân viên | Người được đánh giá: làm bài và nhận kết quả đã xác nhận | Làm bài công bằng, hiểu kết quả và căn cứ, thấy hướng phát triển | Không biết quy trình, sợ bị đánh giá phiến diện bởi điểm test |
| secondary | HR | Điều phối đợt đánh giá theo kỳ hoặc nhu cầu | Đợt có phạm vi/hạn/reviewer rõ, theo dõi tiến độ đến khi ghi nhận | Điều phối thủ công, đợt treo vì reviewer vắng |
| secondary | Business owner (Head of HR/người được gán) | Chịu trách nhiệm quy tắc đề xuất level và chính sách đánh giá | Quy tắc chuyển đổi được duyệt trước khi áp, có provenance | Không có authority chính thức khi level bị tranh chấp (R-13) |
| secondary | Admin | Vận hành, phân quyền và truy vết | Kiểm soát ai xem/sửa kết quả, audit đầy đủ | Dữ liệu nhạy cảm không kiểm soát được phạm vi |
| out | Ứng viên | — | — | Không liên quan feature này (đánh giá nội bộ nhân viên) |

## 3. Scope Boundaries

### In Scope

- Đợt đánh giá (campaign): tạo theo kỳ hoặc theo nhu cầu, chọn phạm vi
  nhân viên theo nhóm/vị trí, hạn làm bài và hạn xác nhận, gán reviewer.
- Giao bài: gợi ý bài đánh giá theo khung kỳ vọng đã công bố của vị trí;
  xử lý nhân viên chưa có khung (chọn thủ công hoặc loại khỏi đợt); mỗi
  nhân viên một assignment có trạng thái và hạn.
- Làm bài trên engine `candidate-assessment` (tái sử dụng contract sẵn
  có); nhận breakdown điểm theo kỹ năng từ `assessment-grading`.
- Level đề xuất tự động theo quy tắc chuyển đổi đã được business owner
  duyệt, kèm phiên bản quy tắc trong provenance.
- Hàng chờ xác nhận của reviewer: xem evidence, xác nhận hoặc điều chỉnh
  level từng kỹ năng (điều chỉnh bắt buộc lý do), ghi nhận thủ công kỹ
  năng không đo được bằng bài (bắt buộc evidence).
- Ghi nhận kết quả: bắt buộc điểm mạnh + nhu cầu phát triển; kết quả cập
  nhật hồ sơ năng lực nhân viên với provenance (đợt, reviewer, thời điểm).
- Nhân viên xem kết quả của mình (phần được công bố); sửa kết quả đã ghi
  nhận qua bản chỉnh có lý do và audit, không ghi đè.
- Phân quyền xem theo scope; nhắc hạn/gia hạn; phân công lại reviewer;
  self-assessment trước đợt (P1); so sánh giữa hai đợt (P1).

### Out of Scope

- Tự động quyết định KPI, lương, thăng chức hoặc kỷ luật từ kết quả đánh
  giá (PRD Mục 7.33 "Chưa làm"); kết quả chỉ là đầu vào cho quyết định
  của con người.
- Ranking công khai hoặc so sánh nhân viên trên surface chung.
- Engine làm bài và contract attempt/submission — thuộc
  `candidate-assessment`; feature này không tái tạo.
- Chấm bài, override điểm và breakdown theo kỹ năng — thuộc
  `assessment-grading`.
- Định nghĩa taxonomy, thang level và khung kỳ vọng vị trí — thuộc
  `talent-framework`.
- Sở hữu hồ sơ nhân viên và hồ sơ năng lực gốc — thuộc `employee-profiles`;
  feature này ghi kết quả đã xác nhận sang đó kèm provenance.
- Tính độ phủ/khoảng trống kỹ năng của nhóm — thuộc `skill-gap-analysis`.
- AI đề xuất nhận xét phát triển, đề xuất nội dung đào tạo, phản hồi đa
  chiều (peer feedback) — hướng P2.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | HR | Khi bắt đầu một kỳ đánh giá hoặc có nhu cầu đột xuất | Tạo đợt đánh giá: tên, loại (theo kỳ/theo nhu cầu), phạm vi nhân viên theo nhóm/vị trí, hạn làm bài, hạn xác nhận | Đợt có cấu trúc rõ ràng thay cho điều phối email | Critical | Confirmed — PRD Mục 7.33 (luồng chính), OQ-8 |
| UN-002 | HR | Khi giao bài cho danh sách nhân viên | Hệ thống gợi ý bài phù hợp khung vị trí đã công bố; liệt kê riêng người chưa có khung | Bài giao khớp chuẩn, không ai bị giao sai kỹ năng | Critical | Confirmed — PRD Mục 7.33 (phạm vi v1); brainstorm Mục 5.1 |
| UN-003 | Nhân viên | Khi được giao bài đánh giá | Biết rõ có bài cần làm, hạn nộp, ai sẽ review kết quả; làm bài công bằng như bài tuyển | Hoàn tất bài đúng hạn, không mất dữ liệu làm bài | Critical | Confirmed — PRD Mục 7.33, Mục 7.22 (contract làm bài) |
| UN-004 | Quản lý (reviewer) | Khi có kết quả chờ xác nhận | Hàng chờ liệt kê assignment kèm điểm theo kỹ năng, level đề xuất, evidence bài làm và self-assessment nếu có | Quyết định xác nhận trên đầy đủ căn cứ, không chỉ nhìn tổng điểm | Critical | Confirmed — PRD Mục 7.33 (reviewer xác nhận evidence, level đề xuất) |
| UN-005 | Quản lý (reviewer) | Khi không đồng ý level đề xuất | Điều chỉnh level từng kỹ năng với lý do bắt buộc | Level cuối do con người quyết, mọi điều chỉnh truy vết được | Critical | Confirmed — PRD Mục 7.33, Mục 12 (human-in-the-loop); R-13 |
| UN-006 | Quản lý (reviewer) | Khi kỹ năng trong khung không có bài nào đo được | Ghi nhận level thủ công kèm evidence đính kèm hoặc ghi chú quan sát; hoặc để "chưa đánh giá" | Không bịa mức khi thiếu căn cứ | High | Assumption — suy từ rủi ro đánh giá phiến diện; brainstorm OQ-7 |
| UN-007 | Quản lý (reviewer) | Khi chốt kết quả của một nhân viên | Ghi nhận điểm mạnh và nhu cầu phát triển (bắt buộc) rồi hoàn tất | Kết quả vào hồ sơ năng lực với provenance đợt/người xác nhận | Critical | Confirmed — PRD Mục 7.33 (ghi nhận kết quả, điểm mạnh, nhu cầu phát triển) |
| UN-008 | Nhân viên | Khi kết quả đã được ghi nhận | Xem level đã xác nhận, phần kết quả bài được công bố, điểm mạnh, nhu cầu phát triển, tên reviewer và thời điểm | Hiểu kết quả của mình và hướng phát triển | Critical | Confirmed — PRD Mục 7.33, JTBD-EMP-01, OQ-8 |
| UN-009 | HR / quản lý | Khi kết quả đã ghi nhận cần sửa | Tạo bản chỉnh kèm lý do; nhân viên thấy có thay đổi | Không ghi đè im lặng, lịch sử truy vết được | High | Assumption — suy từ yêu cầu audit/provenance; brainstorm Mục 5.5 |
| UN-010 | HR | Khi đợt đang chạy | Theo dõi tiến độ từng assignment, nhắc hạn, gia hạn và phân công lại reviewer vắng | Đợt không treo vô thời hạn | High | Confirmed — PRD Mục 7.33 (đo thành công: hoàn tất kỳ đánh giá); brainstorm Mục 6.4 |
| UN-011 | Admin | Khi điều tra truy cập kết quả | Truy vết ai đã xem/ghi nhận/sửa kết quả nào, khi nào | Audit đầy đủ trên dữ liệu nhạy cảm | Critical | Confirmed — PRD Mục 9 (audit boundary) |
| UN-012 | Nhân viên | Khi chuẩn bị cho kỳ đánh giá | Tự đánh mức kỹ năng của mình trước đợt để reviewer đối chiếu | Reviewer có thêm góc nhìn tự nhận của nhân viên | Medium | Assumption — brainstorm Mục 4 (P1) |

## 5. Prioritized User Journeys

### Journey 1: Tạo đợt đánh giá và giao bài

- **User:** HR
- **Importance:** Critical
- **Trigger:** Đến kỳ đánh giá định kỳ, hoặc có nhu cầu (trước đào tạo,
  sau thử việc, trước điều phối).
- **Expected outcome:** Mỗi nhân viên trong phạm vi có một assignment với
  bài phù hợp, hạn làm bài và reviewer đã gán; nhân viên được thông báo.
- **Related needs:** UN-001, UN-002, UN-010

1) HR tạo đợt: đặt tên, chọn loại "theo kỳ" hoặc "theo nhu cầu", chọn
   phạm vi nhân viên theo nhóm/vị trí, đặt hạn làm bài và hạn xác nhận.
2) Hệ thống đối chiếu từng nhân viên với khung vị trí đã công bố: có
   khung → gợi ý bài phù hợp; chưa có khung → liệt kê riêng.
3) HR xử lý nhóm chưa có khung (chọn bài thủ công hoặc loại khỏi đợt),
   xác nhận danh sách + bài + reviewer (mặc định quản lý trực tiếp).
4) Phát hành đợt → hệ thống tạo assignment và thông báo cho từng nhân
   viên kèm hạn và tên reviewer.

**Independent verification:** Chọn một đợt vừa phát hành — mọi assignment
có đủ nhân viên, bài, reviewer khác người được đánh giá, hạn làm bài; và
nhân viên trong phạm vi nhận được thông báo.

### Journey 2: Nhân viên làm bài đến trạng thái chờ xác nhận

- **User:** Nhân viên
- **Importance:** Critical
- **Trigger:** Nhận thông báo có bài đánh giá được giao.
- **Expected outcome:** Bài được nộp hợp lệ, điểm theo kỹ năng và level
  đề xuất xuất hiện trong hàng chờ của reviewer.
- **Related needs:** UN-003, UN-004

1) Nhân viên mở assignment → làm bài trên engine đánh giá (timer,
   autosave có xác nhận, submit idempotent như contract chung).
2) Nộp xong → bài được chấm, trả breakdown điểm theo kỹ năng kèm evidence.
3) Hệ thống áp quy tắc chuyển đổi đã duyệt → level đề xuất cho từng kỹ
   năng; assignment chuyển "chờ-xác-nhận" vào hàng chờ reviewer.

**Independent verification:** Với một assignment đã nộp — bản ghi có
submission hợp lệ, breakdown theo kỹ năng, level đề xuất kèm phiên bản
quy tắc, và trạng thái "chờ-xác-nhận" hiện đúng trong hàng chờ của
reviewer được gán.

### Journey 3: Reviewer xác nhận và ghi nhận kết quả

- **User:** Quản lý (reviewer)
- **Importance:** Critical
- **Trigger:** Assignment của cấp dưới chuyển sang "chờ-xác-nhận".
- **Expected outcome:** Mọi kỹ năng có level cuối (xác nhận / điều chỉnh
  có lý do / ghi nhận thủ công có evidence / chưa đánh giá), kết quả được
  ghi nhận vào hồ sơ năng lực và nhân viên được thông báo.
- **Related needs:** UN-004, UN-005, UN-006, UN-007

1) Reviewer mở hàng chờ → mở assignment: xem điểm theo kỹ năng, level đề
   xuất, evidence bài làm (theo quyền), self-assessment nếu có.
2) Từng kỹ năng: xác nhận level đề xuất, hoặc điều chỉnh + lý do bắt
   buộc; kỹ năng không đo được thì ghi nhận thủ công kèm evidence hoặc để
   "chưa đánh giá".
3) Điền điểm mạnh và nhu cầu phát triển (bắt buộc) → "Ghi nhận".
4) Kết quả vào hồ sơ năng lực với provenance; nhân viên nhận thông báo
   xem kết quả.

**Independent verification:** Lấy 10 kết quả đã ghi nhận — 100% có
reviewer khác người được đánh giá, level từng kỹ năng (hoặc trạng thái
"chưa đánh giá"), điểm mạnh + nhu cầu phát triển, provenance đợt; mọi
điều chỉnh level có lý do.

### Journey 4: Nhân viên xem kết quả của mình

- **User:** Nhân viên
- **Importance:** High
- **Trigger:** Nhận thông báo kết quả đã ghi nhận.
- **Expected outcome:** Nhân viên xem đầy đủ phần kết quả được công bố
  của mình; không thấy dữ liệu người khác hay bảng xếp hạng.
- **Related needs:** UN-008

1) Nhân viên mở "Kết quả đánh giá của tôi" → xem từng kỹ năng: level đã
   xác nhận, phần kết quả bài được công bố, điểm mạnh, nhu cầu phát
   triển, tên reviewer, thời điểm.
2) Nhãn trên màn hình ghi rõ đây là kết quả đánh giá năng lực, không
   phải đánh giá toàn diện về cá nhân.

**Independent verification:** Đăng nhập nhân viên có kết quả đã ghi nhận —
thấy đúng phần được công bố; nhân viên khác truy cập bản ghi này bị chặn
và sự kiện ghi audit.

### Journey 5: Sửa kết quả đã ghi nhận

- **User:** HR / quản lý (reviewer)
- **Importance:** Medium
- **Trigger:** Phát hiện sai sót trong kết quả đã ghi nhận (nhầm level,
  thiếu evidence, lỗi nội dung nhận xét).
- **Expected outcome:** Bản chỉnh mới thay bản cũ với lý do và vết audit;
  nhân viên thấy bản mới và biết có chỉnh sửa.
- **Related needs:** UN-009, UN-011

1) Người có quyền mở kết quả đã ghi nhận → "Tạo bản chỉnh" → sửa phần
   cần thiết, nhập lý do bắt buộc.
2) Hệ thống ghi trước/sau, đưa bản chỉnh thành hiệu lực; bản cũ giữ trong
   lịch sử.
3) Nhân viên thấy bản mới kèm dấu "đã cập nhật".

**Independent verification:** Chỉnh một kết quả đã ghi nhận — bản cũ vẫn
xem được trong lịch sử kèm lý do chỉnh, audit ghi đúng người thực hiện và
thời điểm.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Nhân viên trong phạm vi chưa có khung vị trí đã công bố | Không biết giao bài gì | Liệt kê riêng nhóm này; HR chọn bài thủ công hoặc loại khỏi đợt | Journey 1 / UN-002 |
| Reviewer được gán trùng người được đánh giá | Gán reviewer bị chặn | Thông báo "Người xác nhận phải khác người được đánh giá — chọn reviewer khác" | Journey 1 / UN-004 |
| Reviewer cố xác nhận khi bài chưa chấm xong | Xác nhận trên dữ liệu thiếu | Chặn: "Bài đánh giá chưa được chấm xong — chưa thể xác nhận kết quả" | Journey 3 / UN-004 |
| Reviewer điều chỉnh level không nhập lý do | Mất căn cứ điều chỉnh | Chặn ghi nhận, yêu cầu "Nhập lý do điều chỉnh level (tối thiểu 10 ký tự)" | Journey 3 / UN-005 |
| Ghi nhận khi còn thiếu phần bắt buộc | Kết quả thiếu điểm mạnh/nhu cầu | Chặn và liệt kê "Còn thiếu: {danh sách phần thiếu}" | Journey 3 / UN-007 |
| Reviewer nghỉ/vắng giữa đợt | Assignment treo chờ-xác-nhận | HR phân công lại reviewer mới trong scope; cảnh báo đợt thiếu reviewer | UN-010 |
| Nhân viên chưa làm bài khi hết hạn | Không rõ trạng thái | Assignment "quá-hạn"; HR gia hạn hoặc hủy kèm lý do; đã nhắc trước hạn | UN-010 |
| Nhân viên nghỉ việc giữa đợt | Assignment mồ côi | Hủy assignment kèm lý do; kết quả đã ghi nhận trước đó giữ nguyên | UN-010 |
| Điểm bị override sau khi đã chờ-xác-nhận | Reviewer xác nhận trên số cũ | Cảnh báo "kết quả vừa thay đổi — tải lại" trước khi ghi nhận | Journey 3 / UN-004 |
| Người xem ngoài scope cố mở kết quả | Lộ dữ liệu nhạy cảm | Chặn + "Bạn không có quyền xem kết quả đánh giá này"; ghi audit truy cập bị từ chối | UN-008, UN-011 |
| Khung vị trí đổi sau khi đợt đã chạy | Kết quả lệch chuẩn hiện tại | Kết quả giữ snapshot theo khung tại thời điểm đánh giá | UN-007 |
| Đợt bị hủy khi đã có người làm bài | Mất công phần đã làm | HR chọn giữ xử lý phần đã nộp hoặc hủy hẳn có audit; assignment chưa mở bị hủy | UN-010 |

## 7. User-side Constraints

- Ngôn ngữ giao diện tiếng Việt là ưu tiên; nội dung nhận xét hỗ trợ đầy
  đủ dấu tiếng Việt.
- Mọi người dùng phải đăng nhập và thuộc tổ chức/phạm vi được cấp; không
  có surface công khai cho kết quả đánh giá.
- Reviewer phải khác người được đánh giá — không ngoại lệ (đề xuất — OQ-3).
- Chỉ kết quả đã qua bước "Ghi nhận" của reviewer mới được ghi vào hồ sơ
  năng lực; điểm và level đề xuất không tự thành hồ sơ.
- Kết quả luôn mang nhãn "không phải đánh giá toàn diện về cá nhân" trên
  mọi surface hiển thị cho nhân viên.
- Không có tính năng ranking/xếp hạng công khai; không có trigger tự động
  sang quyết định lương/thăng chức/kỷ luật.
- Màn hình desktop là chính cho điều phối đợt và hàng chờ xác nhận; nhân
  viên làm bài trên surface của `candidate-assessment`.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Đợt đánh giá hỗ trợ cả "theo kỳ" lẫn "theo nhu cầu"; ai xem kết quả = nhân viên (phần công bố) + quản lý trực tiếp + HR trong scope | Nếu chỉ một loại hoặc phạm vi xem khác → thiết kế phân quyền và loại đợt sai | Resolved-đề xuất — chờ Product owner xác nhận | Chốt ở OQ-1/OQ-2 (liên quan OQ-8 PRD) |
| Reviewer mặc định là quản lý trực tiếp, phải khác người được đánh giá; HR phân công lại khi cần | Nếu reviewer là vai trò khác → gán mặc định sai | Resolved-đề xuất — chờ Head of HR xác nhận | Chốt ở OQ-3 |
| Quy tắc chuyển điểm thành level đề xuất do business owner (Head of HR) duyệt; mỗi đợt ghi phiên bản quy tắc | Nếu authority khác → level đề xuất thiếu governance (R-13) | Resolved-đề xuất — chờ Head of HR xác nhận | Chốt ở OQ-4 (liên quan OQ-11 PRD) |
| Engine làm bài dùng lại `candidate-assessment`; breakdown theo kỹ năng lấy từ `assessment-grading`; khung từ `talent-framework` bản đã công bố | Nếu phải tái tạo → phạm vi feature phình to | Confirmed — phụ thuộc Feature Map (22, 23, 32) | Đối chiếu contract khi tích hợp |
| Hồ sơ năng lực (kỹ năng của nhân viên) thuộc `employee-profiles`; feature ghi kết quả đã xác nhận kèm provenance | Nếu feature sở hữu hồ sơ → trùng source of truth | Assumption — bám ranh giới `employee-profiles` | Đối chiếu khi `employee-profiles` mở điểm ghi |
| Ngưỡng đề xuất (300 nhân viên/đợt, 5 bài/người, SLA xác nhận 10 ngày làm việc, điều chỉnh ±2 mức) là chuẩn first release | Nếu quá chặt/lỏng → vận hành đợt và điều chỉnh bị ảnh hưởng | Resolved-đề xuất — chờ Head of HR xác nhận | Chốt ở OQ-6 |
| Kết quả đánh giá là dữ liệu nhạy cảm: chỉ dùng dữ liệu synthetic trước khi privacy gate đạt | Nếu dùng dữ liệu thật sớm → vi phạm gate PRD Mục 9 | Confirmed — PRD Mục 9, OQ-3/OQ-6 PRD | — |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Kỳ đánh giá hoàn tất với reviewer và evidence đầy đủ | Chưa có — xác lập bằng đo trong 1 kỳ đánh giá đầu | ≥90% assignment trong đợt đạt "đã-ghi-nhận" trong SLA; target chính thức chờ OQ-1/OQ-2 PRD | Tỷ lệ assignment đã-ghi-nhận / assignment đã phát hành | Sau 1 kỳ đánh giá |
| USC-002 | Mọi kết quả ghi nhận đều qua reviewer hợp lệ | 0% (hiện không có quy trình) | 100% kết quả có reviewer ≠ người được đánh giá + provenance đợt | Kiểm tra bản ghi kết quả đã ghi nhận | Liên tục |
| USC-003 | Reviewer xác nhận trong SLA | Chưa có — xác lập bằng đo thời gian chờ trong 1 kỳ đầu | ≤10 ngày làm việc sau hạn làm bài (đề xuất — OQ-6) | Thời gian từ "chờ-xác-nhận" đến "đã-ghi-nhận" | 1 tháng sau rollout |
| USC-004 | Điều chỉnh level luôn có căn cứ | — | 100% điều chỉnh có lý do hợp lệ | Tỷ lệ bản ghi điều chỉnh có lý do đủ độ dài | Liên tục |
| USC-005 | Không lộ kết quả ngoài phạm vi | 0 sự cố | 0 sự cố xem kết quả vượt scope được xác nhận | Số incident vượt scope (guardrail bám M-GR-01) | Liên tục |

## 10. Open Questions

- [x] OQ-1: Đánh giá theo kỳ hay theo nhu cầu? — Resolved (đề xuất): hỗ
  trợ cả hai — đợt "theo kỳ" do HR tạo định kỳ, đánh giá "theo nhu cầu"
  do quản lý trực tiếp/HR tạo khi cần — chờ Product owner xác nhận (PRD
  OQ-8).
- [x] OQ-2: Ai được xem và dùng kết quả đánh giá? — Resolved (đề xuất):
  chính nhân viên (phần công bố: level đã xác nhận + điểm mạnh + nhu cầu
  phát triển + phần kết quả bài được author công bố), quản lý trực tiếp
  trong scope, HR trong scope; không công khai, không ranking — chờ
  Product owner xác nhận (PRD OQ-8).
- [x] OQ-3: Reviewer hợp lệ là ai — quản lý trực tiếp, HR, hay người thứ
  ba? — Resolved (đề xuất): mặc định quản lý trực tiếp; HR phân công lại
  khi vắng/đổi; reviewer phải khác người được đánh giá — chờ Head of HR
  xác nhận.
- [x] OQ-4: Quy tắc chuyển điểm thành level đề xuất do ai duyệt? —
  Resolved (đề xuất): business owner (Head of HR) duyệt quy tắc chuyển
  đổi trước khi áp, mỗi đợt ghi phiên bản quy tắc — chờ Head of HR xác
  nhận (liên quan PRD OQ-11, R-13).
- [x] OQ-5: Nhân viên giữ nhiều vị trí thì giao bài theo khung nào? —
  Resolved (đề xuất): theo khung của vị trí chính; trường hợp đặc biệt HR
  chọn khung khác khi tạo đợt — chờ Head of HR xác nhận.
- [x] OQ-6: Ngưỡng đề xuất (300 nhân viên/đợt, 5 bài/người, SLA 10 ngày,
  ±2 mức điều chỉnh) có được duyệt? — Resolved (đề xuất): giữ ngưỡng đề
  xuất — chờ Head of HR xác nhận.
- [x] OQ-7: Kỹ năng không đo được bằng bài trắc nghiệm/tự luận thì đánh
  giá thế nào? — Resolved: reviewer ghi nhận thủ công kèm evidence đính
  kèm + lý do; nếu thiếu evidence thì để "chưa đánh giá", không bịa mức.
- [x] OQ-8: Kết quả đánh giá có hiệu lực bao lâu? — Resolved (đề xuất):
  hiệu lực đến khi có kết quả mới của cùng kỹ năng thay thế; lịch sử đợt
  giữ nguyên để truy vết — chờ Head of HR xác nhận.
