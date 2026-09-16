---
type: urd
feature: candidate-assessment
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/features/candidate-assessment/brainstorms/server-controlled-assessment-taking.md, docs/_reverse/assessment-and-grading/reverse-spec.md]
---

# candidate-assessment - User Requirements Document

## 1. Purpose

Cho ứng viên/nhân viên làm bài đánh giá qua token/quyền trong một trải nghiệm
công bằng và đáng tin: hướng dẫn rõ trước khi làm, timer theo giờ server, câu
trả lời được lưu có xác nhận, khôi phục được khi gián đoạn, nộp một lần duy
nhất và có biên nhận — đồng thời không để lộ đáp án hay dữ liệu nội bộ.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Ứng viên | Làm bài qua link công khai; submit control nằm phía client | Mất mạng/đóng tab là mất bài; không biết bài đã được ghi nhận chưa | Phải xin làm lại, tranh chấp "đã nộp hay chưa", trải nghiệm kém | Observed: docs/_reverse/assessment-and-grading/gaps.md (GAP-AS-07) |
| Ứng viên | Trang làm bài public trả cả đáp án đúng trong dữ liệu câu hỏi | Người khác có thể xem đáp án — bài làm mất công bằng | Kết quả không phản ánh năng lực, có thể bị huỷ | Observed: docs/_reverse/assessment-and-grading/gaps.md (GAP-AS-06) |
| HR | Không có cách đối chiếu khi ứng viên báo "em nộp rồi" | Không có biên nhận/trạng thái attempt để kiểm tra | Mất thời gian điều tra, quyết định cho làm lại dựa cảm tính | Confirmed — PRD Mục 7.22 (receipt, rủi ro mất bài/submit trùng) |
| Author bài đánh giá | Token phát ra không rõ hạn/lượt làm | Token bị chia sẻ, làm bài trễ, không thu hồi được | Bài đánh giá mất giá trị đo lường | Confirmed — PRD Mục 7.22 (rủi ro token bị chia sẻ); Observed: OQ-AS-01 reverse spec |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Ứng viên | Nhận link bài đánh giá trong quy trình tuyển, làm bài trên thiết bị/mạng không kiểm soát | Hoàn tất bài công bằng, biết rõ trạng thái nộp, có biên nhận | Sợ mất bài khi gián đoạn; không biết hết hạn link; không chắc nộp thành công |
| secondary | Nhân viên | Làm đánh giá nội bộ qua tài khoản | Như ứng viên, kết quả gắn hồ sơ đúng phạm vi | Như ứng viên; thêm băn khoăn ai xem kết quả |
| secondary | HR | Điều phối assessment trong pipeline, xử lý sự cố "em nộp rồi" | Theo dõi attempt, gia hạn/thu hồi token có kiểm soát, đối chiếu biên nhận | Không có công cụ xử lý sự cố; thao tác thủ công qua kỹ thuật |
| secondary | Author bài đánh giá | Công bố quyền xem kết quả/attempt/expiry | Quy tắc được thực thi đúng như đã công bố | Chính sách lệch giữa cấu hình và thực thi |

## 3. Scope Boundaries

### In Scope

- Truy cập bài bằng token/link (ứng viên) hoặc tài khoản (nhân viên), kiểm
  tra hiệu lực phía server.
- Màn hướng dẫn + xác nhận trước khi bắt đầu; timer giờ server; progress.
- Autosave có server acknowledgement và trạng thái lưu hiển thị rõ.
- Khôi phục attempt từ bản đã được server xác nhận gần nhất.
- Submit idempotent + biên nhận (mã + thời điểm giờ server).
- Xử lý hết giờ/hết hạn token/hết lượt attempt; HR gia hạn/thu hồi có lý do
  và audit.
- Không trả đáp án/dữ liệu nội bộ ra surface người làm bài (vá GAP-AS-06).
- Snapshot đề bất biến trong suốt attempt.

### Out of Scope

- Chấm điểm, phân tích, phát hành kết quả chi tiết (thuộc
  `assessment-grading`).
- Tạo bài, chọn câu hỏi, cấu hình thời lượng ban đầu (thuộc
  `assessment-authoring`).
- Proctoring/giám sát xâm phạm quyền riêng tư (PRD "Chưa làm").
- Adaptive testing, ngân hàng đề theo độ khó động.
- Thông báo kết quả cho ứng viên theo kênh (thuộc `contextual-notifications`).

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Ứng viên | Nhận link bài đánh giá | Mở link và biết ngay link còn dùng được hay không, vì sao không | Trang hướng dẫn rõ ràng hoặc lỗi nêu đúng lý do (hết hạn/hết lượt/đã đóng) | Critical | Confirmed — PRD Mục 7.22 (access) |
| UN-002 | Ứng viên | Trước khi làm bài | Đọc hướng dẫn: thời lượng, số câu, quy định nộp, chính sách xem kết quả | Hiểu luật chơi trước khi bấm bắt đầu; không bất ngờ giữa bài | High | Confirmed — PRD Mục 7.22 (instruction) |
| UN-003 | Ứng viên | Trong khi làm bài | Biết còn bao nhiêu thời gian theo đồng hồ đáng tin | Timer khớp giờ hệ thống; hết giờ là do server quyết, không phải máy mình | Critical | Confirmed — PRD Mục 7.22 (server-side time) |
| UN-004 | Ứng viên | Sau mỗi câu trả lời | Biết câu trả lời đã được lưu chắc chắn hay chưa | Trạng thái "đã lưu / đang lưu / chưa lưu được" từng câu | Critical | Confirmed — PRD Mục 7.22 (autosave có server ack) |
| UN-005 | Ứng viên | Bị gián đoạn (mất mạng, đóng tab, hết pin) | Mở lại và tiếp tục từ phần đã lưu, không làm lại từ đầu | Bản trả lời server xác nhận gần nhất được khôi phục kèm giờ còn lại | Critical | Confirmed — PRD Mục 7.22 (recovery, release gate) |
| UN-006 | Ứng viên | Nộp bài | Nộp đúng một lần; lỡ bấm lại/retry không tạo bài thứ hai | Một submission duy nhất, mọi nộp lại trả cùng biên nhận | Critical | Confirmed — PRD Mục 7.22 (submit idempotent, release gate) |
| UN-007 | Ứng viên | Sau khi nộp | Có bằng chứng đã nộp (mã biên nhận + thời điểm) | Biên nhận hiển thị ngay, dùng được để đối chiếu với HR | Critical | Confirmed — PRD Mục 7.22 (receipt) |
| UN-008 | Ứng viên | Trong suốt bài | Không bị rò dữ liệu đáp án; kết quả đo đúng năng lực | Surface làm bài chỉ chứa nội dung câu hỏi + lựa chọn | Critical | Confirmed — PRD Mục 7.22 (không lộ dữ liệu nội bộ); Observed: GAP-AS-06 |
| UN-009 | HR | Khi ứng viên báo sự cố hoặc cần thêm thời gian | Xem được trạng thái attempt và gia hạn/thu hồi/mở lại có kiểm soát | Thao tác có lý do bắt buộc và audit; chỉ trong quyền author công bố | High | Confirmed — PRD Mục 7.22 (expiry/reopen/override có lý do và audit) |
| UN-010 | HR | Khi phát hành bài cho nhiều ứng viên | Theo dõi ai đang làm, đã nộp, hết hạn | Danh sách attempt theo bài với trạng thái và thời điểm | High | Assumption (suy từ "theo dõi attempt" và đo M-IN-02) |
| UN-011 | Nhân viên | Làm đánh giá nội bộ | Làm bài với cùng bảo đảm như ứng viên, danh tính từ tài khoản | Attempt gắn tài khoản; kết quả vào đúng scope | High | Confirmed — PRD Mục 7.22 (theo token/quyền), Feature Map persona |
| UN-012 | Author | Khi cấu hình bài | Quyết định ứng viên thấy gì sau nộp (chỉ biên nhận hay điểm/nhận xét) | Màn kết quả hiển thị đúng phần đã công bố, không hơn | Medium | Confirmed — PRD Mục 7.22 (quyền xem kết quả do author công bố) |

## 5. Prioritized User Journeys

### Journey 1: Làm và nộp bài hoàn chỉnh

- **User:** Ứng viên
- **Importance:** Critical
- **Trigger:** Nhận link bài đánh giá từ thư mời của HR.
- **Expected outcome:** Bài được nộp một lần, có biên nhận, không mất câu trả
  lời đã lưu.
- **Related needs:** UN-001, UN-002, UN-003, UN-004, UN-006, UN-007, UN-008

1) Mở link → hệ thống xác minh token phía server → vào màn hướng dẫn.
2) Đọc hướng dẫn → "Bắt đầu làm bài" → attempt mở, timer chạy theo giờ server.
3) Trả lời từng câu; mỗi câu hiện "đã lưu" khi server xác nhận.
4) Vào màn review → kiểm câu chưa trả lời → "Nộp bài" → xác nhận.
5) Nhận màn biên nhận: mã nộp + thời điểm theo giờ hệ thống.

**Independent verification:** Tạo attempt qua token hợp lệ, trả lời một phần,
submit; kiểm tra: đúng 1 submission tồn tại, biên nhận hiển thị, payload câu
hỏi không chứa đáp án, autosave có bản ghi ack phía server.

### Journey 2: Gián đoạn và khôi phục

- **User:** Ứng viên
- **Importance:** Critical
- **Trigger:** Mất mạng/đóng trình duyệt giữa bài.
- **Expected outcome:** Khôi phục đúng phần đã được server xác nhận; phần chưa
  xác nhận được báo rõ là mất; giờ còn lại đúng theo server.
- **Related needs:** UN-004, UN-005, UN-003

1) Giữa bài bị đóng tab → mở lại link.
2) Hệ thống nhận ra attempt đang mở → trả snapshot đề + câu trả lời đã ack
   gần nhất + thời gian còn lại.
3) Tiếp tục làm và nộp bình thường.

**Independent verification:** Đang làm thì đóng tab, mở lại: các câu đã "đã
lưu" còn nguyên, câu đang gõ dở "chưa lưu được" phải nhập lại, timer khớp
giờ server.

### Journey 3: Truy cập không hợp lệ hoặc hết hạn

- **User:** Ứng viên
- **Importance:** High
- **Trigger:** Mở link hết hạn/đã nộp/hết lượt/bị thu hồi.
- **Expected outcome:** Thông báo rõ lý do nghiệp vụ + hướng dẫn liên hệ HR;
  không tạo attempt mới; không lộ thông tin bài.
- **Related needs:** UN-001

1) Mở link → server kiểm tra → từ chối với lý do cụ thể.
2) Trường hợp "đã nộp" → hiển thị lại biên nhận cũ thay vì lỗi.

**Independent verification:** Mở link đã nộp → thấy biên nhận cũ; mở link hết
hạn → trang hết hạn + hướng dẫn; không attempt nào được tạo thêm.

### Journey 4: HR xử lý sự cố attempt

- **User:** HR
- **Importance:** High
- **Trigger:** Ứng viên báo link hết hạn/mất bài, hoặc cần thu hồi link bị
  chia sẻ.
- **Expected outcome:** HR xem trạng thái attempt/biên nhận, gia hạn hoặc thu
  hồi với lý do bắt buộc; hành động được audit.
- **Related needs:** UN-009, UN-010

1) Mở danh sách attempt của bài → lọc theo trạng thái.
2) Chọn attempt/token → "Gia hạn" hoặc "Thu hồi" → nhập lý do → xác nhận.
3) Ứng viên mở lại link → truy cập được (gia hạn) hoặc bị chặn (thu hồi).

**Independent verification:** Audit log có bản ghi gia hạn/thu hồi kèm người
thực hiện, lý do, thời điểm; ứng viên thấy trạng thái mới ngay lượt mở sau.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Mất mạng khi đang làm | Sợ mất phần vừa trả lời | Câu chưa ack hiện "chưa lưu được — đang thử lại"; có mạng tự lưu lại | Journey 2 / UN-004 |
| Hết giờ khi đang offline | Không nộp được phần cuối | Server tự đóng theo giờ hệ thống; phần đã ack vẫn là bài nộp; màn báo rõ | Journey 1,2 / UN-003 |
| Nộp xong nhưng chưa thấy biên nhận (rớt mạng) | Không chắc đã nộp | Nộp lại/mở lại link → nhận cùng biên nhận, không tạo submission mới | Journey 3 / UN-006, UN-007 |
| Hai thiết bị cùng mở | Không biết thiết bị nào giữ bài | Thiết bị sau thấy cảnh báo và lựa chọn tiếp quản; thiết bị cũ bị khoá | Journey 2 / UN-005 |
| Link bị forward cho người khác | Người lạ có thể làm bài | Attempt limit + tuỳ chọn định danh khi bắt đầu; HR thu hồi được | Journey 4 / UN-009 |
| Bài bị đóng giữa lúc đang làm | Lo bài mất giữa chừng | Attempt đang mở vẫn hoàn tất theo snapshot; chỉ chặn attempt mới | Journey 1 / UN-005 |
| Cố tìm đáp án trong trang làm bài | (kẻ gian lận) | Không có dữ liệu đáp án để lộ — payload chỉ nội dung + lựa chọn | UN-008 |
| Empty state HR | Chưa có ai làm | "Chưa có lượt làm bài nào cho bài đánh giá này" | Journey 4 / UN-010 |

## 7. User-side Constraints

- Giao diện tiếng Việt ưu tiên (PRD Mục 9); hướng dẫn viết cho người không
  chuyên công nghệ.
- Ứng viên không có tài khoản — truy cập duy nhất qua token/link; nhân viên
  qua `account-access` với org/role/data-scope.
- Người làm bài dùng thiết bị/mạng đa dạng: autosave và recovery phải chịu
  được mạng chập chờn, đổi thiết bị, đóng tab.
- Mọi mốc thời gian quyết định (bắt đầu, hết giờ, nộp, hết hạn) theo giờ
  server — không tin giờ client.
- Trước khi privacy gate duyệt (OQ-3/OQ-6 sản phẩm) chỉ dùng dữ liệu
  synthetic cho pilot.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Token/link, cấu hình attempt/expiry và snapshot đề do `assessment-authoring` phát hành | Nếu chưa có, feature phải tự phát hành bài → scope phình | Confirmed — PRD Mục 7.21 (token/link, publish) | Xác nhận contract khi authoring spec hoàn thiện |
| Nhân viên làm bài qua tài khoản với cùng contract làm bài | Nếu policy nội bộ khác (không giới hạn attempt) → cần nhánh riêng | Assumption | OQ-7 brainstorm |
| Người làm bài chấp nhận "không xem đáp án sau nộp" là mặc định | Nếu tổ chức muốn công khai đáp án → cần surface riêng | Assumption (OQ-AS-03) | OQ-2 brainstorm |
| Autosave 20s + grace submit 0s + hạn token 7 ngày là chấp nhận được | Nếu business muốn grace sau deadline → flow hết giờ đổi | Assumption | OQ-6 brainstorm, owner chốt |
| Hai thiết bị cùng attempt: thiết bị sau tiếp quản | Nếu policy là chặn thiết bị sau → flow đổi | Assumption | OQ-3 brainstorm |
| Thông báo trạng thái (nộp thành công, sắp hết hạn) gửi qua `contextual-notifications` | Nếu chưa sẵn sàng → chỉ hiển thị trong trang | Assumption (roadmap Now) | Theo dõi feature notifications |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Người bắt đầu hoàn tất bài hợp lệ có biên nhận | Chưa có — xác lập bằng đo pilot theo test version | Mức chờ sponsor chốt (OQ-1/OQ-2 sản phẩm; M-IN-02) | Submission hợp lệ có receipt / attempt đã bắt đầu | Hàng tháng trong pilot |
| USC-002 | Không mất câu trả lời đã được server xác nhận | 0 | 0 — guardrail bắt buộc (M-GR-03) | Số submission mất answer đã ack, đo qua recovery test + incident log | Mỗi release |
| USC-003 | Không lộ đáp án ra surface người làm bài | 0 | 0 — guardrail (bám M-GR-01) | Số incident payload chứa đáp án/field nội bộ | Liên tục |
| USC-004 | Submit trùng không tạo submission thứ hai | 0 | 100% nộp lại trả cùng biên nhận | Test duplicate-submit (release gate) + incident log | Mỗi release |
| USC-005 | Ứng viên biết trạng thái bài của mình | Chưa có | 100% submission có biên nhận truy vết (mã + giờ server) | Tỷ lệ submission có receipt hợp lệ | Hàng tháng |

## 10. Open Questions

- [ ] OQ-1 (kế thừa brainstorm OQ-1 / OQ-AS-01, OQ-AS-05): chính sách token —
  expiry mặc định, attempt limit, revocation — do author từng bài hay policy
  tổ chức chốt?
- [ ] OQ-2 (brainstorm OQ-2 / OQ-AS-03): ứng viên có được xem đáp án/giải
  thích sau khi nộp không? Mặc định đề xuất: không, trừ khi author công bố.
- [ ] OQ-3 (brainstorm OQ-3): hai thiết bị cùng attempt — chặn thiết bị sau
  hay cho tiếp quản?
- [ ] OQ-4 (brainstorm OQ-4): có bắt buộc định danh khi bắt đầu bài qua token?
- [ ] OQ-5 (brainstorm OQ-5): bài bị đóng giữa chừng — attempt đang mở hoàn
  tất hay đóng theo?
- [ ] OQ-6 (brainstorm OQ-6): ngưỡng đề xuất — autosave 20 giây, hạn token 7
  ngày, grace submit 0 giây — được duyệt chưa?
- [ ] OQ-7 (brainstorm OQ-7, liên quan OQ-8 PRD): attempt nội bộ của nhân
  viên có cùng chính sách expiry/limit với ứng viên không?
