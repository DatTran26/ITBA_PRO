---
type: urd
feature: cv-event-monitoring
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, PRODUCT.md, docs/features/cv-event-monitoring/brainstorms/cv-event-intake-and-manager-review.md]
---

# cv-event-monitoring — User Requirements Document

## 1. Purpose

Cho quản lý và admin một điểm tiếp nhận tin cậy cho sự kiện vi phạm do hệ
thống Computer Vision tách biệt phát hiện tại các khu vực đã công bố — sự
kiện đến kèm bằng chứng, được lưu và hiển thị đúng phạm vi, và luôn đi qua
bước xác nhận của con người trước khi có ý nghĩa. HRMS không xử lý video,
không nhận diện danh tính, không tự kết luận vi phạm (PRD Mục 7.38, Mục 12).

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Quản lý khu vực | Vi phạm tại khu vực công bố (hút thuốc, bỏ trống vị trí) chỉ phát hiện qua tuần tra tay | Phát hiện chậm, không đều, không có bằng chứng để xử lý | Không kiểm chứng được vi phạm, xử lý thiếu căn cứ | Confirmed — PRD Mục 7.38, JTBD-MGR-01; đặc tả PRODUCT.md Mục 11 |
| Admin | CV service ngoài sắp gửi sự kiện về nhưng HRMS chưa có điểm tiếp nhận và quản lý | Không kiểm soát khu vực/camera nào được phép, ai xem evidence, giữ bao lâu | Nguy cơ nhận sự kiện tràn lan không policy, lộ evidence, mất sự kiện khi lỗi | Confirmed — PRD Mục 7.38 (tiếp nhận, dashboard, xác nhận), JTBD-ADM-01 |
| CV Backend (hệ thống ngoài) | Đang build riêng, cần điểm gửi sự kiện bên HRMS | Gửi sự kiện mà không có endpoint tin cậy sẽ mất dữ liệu | Sự kiện vi phạm bị mất, không đối soát được | Confirmed — PRD Mục 7.38 (API/webhook có retry); project profile |
| Người duyệt chính sách (Head of HR/DPO-legal) | Chưa rõ ai duyệt khu vực camera/ngưỡng/retention | OQ-12 của PRD đang mở | Không thể bật camera hợp lệ | Confirmed — PRD OQ-12 (owner DPO/legal), R-15 |
| Nhân viên trong khu vực | Khu vực làm việc có camera | Không biết mình được quan sát thế nào và dữ liệu giữ bao lâu | Cảm giác bị theo dõi bí mật | Confirmed — PRODUCT.md Mục 11 (khu vực phải công khai kèm mục đích) |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Quản lý (manager phụ trách khu vực) | Có khu vực thuộc phạm vi quản lý được lắp camera đã công bố | Nhận cảnh báo kèm evidence trong phạm vi, xác nhận/từ chối có lý do, tạo task xử lý | Phát hiện vi phạm muộn, thiếu bằng chứng, sự kiện AI không rõ đáng tin không |
| secondary | Admin | Đăng ký camera/khu vực, cấu hình chính sách, xử lý lỗi giao nhận | Khu vực chỉ hoạt động khi có policy công bố; kiểm soát ai xem evidence; đối soát giao nhận | Không có catalog chính thức, lỗi giao nhận khó truy vết |
| secondary | Người duyệt chính sách (Head of HR/DPO-legal) | Phê duyệt zone policy trước khi bật camera | Đảm bảo khu vực/ngưỡng/retention hợp lệ trước khi quan sát | Chưa rõ ai chịu trách nhiệm (OQ-12 PRD) |
| secondary | Lãnh đạo | Xem báo cáo sự kiện khu vực theo phạm vi | Góc nhìn tổng hợp có kiểm soát | Không có dữ liệu sự kiện tập trung |
| secondary | CV Backend | Hệ thống ngoài gửi sự kiện | Endpoint tin cậy có retry/idempotency | Mất sự kiện nếu HRMS không tiếp nhận đúng |
| out | Nhân viên trong khu vực quan sát | Chịu sự quan sát đã công bố | (gián tiếp) biết khu vực được công bố, phản hồi qua kênh policy | v1 không có self-view evidence |

## 3. Scope Boundaries

### In Scope

- Zone policy: soạn → duyệt → công bố → version; khai báo khu vực, loại sự
  kiện, mục đích, ngưỡng tiếp nhận, vai trò xem/xem evidence, retention,
  khung giờ áp dụng.
- Catalog camera/khu vực: đăng ký gắn policy đã công bố, trạng thái
  (đăng ký/chưa kích hoạt/hoạt động/tạm dừng/mất kết nối), khung giờ,
  lịch sử cấu hình phía HRMS.
- Endpoint tiếp nhận sự kiện: xác thực service, validation payload,
  idempotency, trạng thái giao nhận, retry/dead-letter + hàng chờ lỗi.
- Lưu sự kiện + evidence tách biệt: metadata sự kiện (loại, camera, khu
  vực, thời điểm, duration, confidence, model version) và file bằng chứng
  (ảnh/clip) có retention riêng.
- Dashboard sự kiện theo phòng/camera/loại/trạng thái đúng phạm vi quyền.
- Thông báo manager phụ trách; vòng đời sự kiện bắt buộc qua người: chờ
  review → xác nhận / false positive / cần thêm context → xử lý xong /
  loại bỏ — quyết định kèm lý do.
- Evidence access audit: mọi lượt xem/tải/quyết định ghi nhận.
- Evidence retention tự động: xóa/đánh dấu hết hạn theo policy.
- Tạo task xử lý trên `kanban-workspaces` từ sự kiện đã xác nhận.

### Out of Scope

- Xử lý stream/video realtime trong HRMS — toàn bộ logic CV nằm trong
  Python CV Backend ngoài repo (PRD "Chưa làm").
- Nhận diện danh tính qua camera, phân tích cảm xúc/phẩm chất, theo dõi
  liên tục cá nhân, chấm điểm năng suất (PRD "Chưa làm" + PRODUCT.md
  "Không đưa vào").
- Tự kết luận vi phạm hoặc kỷ luật tự động (PRD Mục 12 invariant).
- Loại phát hiện phase 2: PPE, xâm nhập khu vực, điện thoại khu vực cấm,
  đếm người, heatmap (phase 2 của CV service).
- Live preview/stream — thuộc UI riêng của CV service.
- Cấu hình model/threshold/FPS phía CV service — admin chỉ đọc model
  version/threshold tại thời điểm sự kiện; chỉnh sửa nằm trên service.
- Self-view evidence cho nhân viên trong v1 (đề xuất — chờ DPO/legal).
- Self-service theo dõi vận hành nói chung — thuộc `workforce-monitoring`.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Admin | Khi tổ chức muốn đưa một khu vực vào giám sát CV | Đăng ký camera chỉ sau khi khu vực có chính sách quan sát được duyệt và công bố | Không camera nào hoạt động mà khu vực chưa công bố | Critical | Confirmed — PRODUCT.md Mục 11 (khu vực công khai kèm mục đích); PRD R-15 |
| UN-002 | CV Backend | Khi phát hiện sự kiện vi phạm | Gửi event + evidence tới endpoint có xác thực, biết được đã ghi nhận hay cần retry | Không mất sự kiện, không tạo trùng | Critical | Confirmed — PRD Mục 7.38 (API/webhook có retry); PRODUCT.md (retry khi gửi thất bại) |
| UN-003 | Quản lý | Khi có sự kiện chờ review trong khu vực mình | Nhận thông báo và xem sự kiện kèm evidence: loại, camera, thời điểm, confidence | Quyết định xác nhận/từ chối/cần thêm context có căn cứ | Critical | Confirmed — PRD Mục 7.38 (dashboard, xác nhận/từ chối có lý do) |
| UN-004 | Quản lý | Khi xác nhận sự kiện là vi phạm thật | Tạo task xử lý liên kết sự kiện để theo dõi đến khi xong | Vi phạm có owner xử lý, không bỏ sót | High | Confirmed — PRD Mục 7.38 (tạo task xử lý khi cần); PRODUCT.md (Kanban) |
| UN-005 | Quản lý | Khi sự kiện là cảnh báo sai | Đánh dấu false positive kèm lý do để vào thống kê chất lượng | Giảm cảnh báo nhiễu lần sau, đánh giá model theo camera | High | Confirmed — PRODUCT.md Mục 11 (bỏ qua cảnh báo sai, tỷ lệ false positive) |
| UN-006 | Admin | Khi cần chứng minh ai đã xem evidence | Truy vết mọi lượt xem/tải evidence và quyết định sự kiện | Điều tra truy cập vượt phạm vi được | Critical | Confirmed — PRD R-15 (access audit); PRODUCT.md (ghi nhật ký lượt xem) |
| UN-007 | Admin | Khi sự kiện gửi về bị lỗi lặp sau retry | Một hàng chờ lỗi giao nhận có payload và lý do để xử lý tay | Không sự kiện nào mất âm thầm | High | Confirmed — PRD Mục 7.38 (retry); PRODUCT.md (log toàn bộ request) |
| UN-008 | Người duyệt chính sách | Khi có zone policy chờ duyệt | Xem bản đầy đủ (khu vực, loại sự kiện, ngưỡng, retention, ai xem) rồi duyệt/yêu cầu chỉnh | Không khu vực nào được quan sát mà chưa qua duyệt | Critical | Confirmed — PRD OQ-12, R-15 |
| UN-009 | Quản lý | Khi cần nhìn tổng quan sự kiện khu vực | Dashboard lọc theo phòng/camera/loại/trạng thái đúng phạm vi | Nắm được điểm nóng và tình trạng xử lý | High | Confirmed — PRD Mục 7.38 (dashboard); PRODUCT.md (dashboard) |
| UN-010 | Admin | Khi evidence đến hạn retention | Evidence tự xóa/đánh dấu hết hạn theo policy đã công bố | Không giữ evidence quá cam kết | Critical | Confirmed — PRD R-15 (retention/xóa); PRODUCT.md (tự động xóa sau thời hạn) |
| UN-011 | Admin | Khi một camera tạo quá nhiều false positive | Thống kê chất lượng theo camera/loại/model để đề xuất chỉnh ngưỡng phía CV service | Giảm nhiễu có căn cứ số liệu | Medium | Confirmed — PRODUCT.md Mục 11 (đề xuất điều chỉnh ngưỡng) |

## 5. Prioritized User Journeys

### Journey 1: Công bố chính sách khu vực và kích hoạt camera

- **User:** Admin (với người duyệt là Head of HR/DPO-legal)
- **Importance:** Critical
- **Trigger:** Một khu vực làm việc được quyết định đưa vào giám sát CV.
- **Expected outcome:** Zone policy "Đã công bố"; camera đăng ký và chỉ
  "Hoạt động" khi khu vực có policy; sự kiện bắt đầu được tiếp nhận.
- **Related needs:** UN-001, UN-008

1) Admin soạn zone policy: khu vực, loại sự kiện, mục đích, ngưỡng
   confidence tiếp nhận, vai trò xem/xem evidence, retention, khung giờ.
2) Gửi duyệt → người duyệt phê duyệt → policy "Đã công bố", công khai.
3) Admin đăng ký camera gắn khu vực + endpoint service → kiểm tra kết nối
   → camera "Hoạt động".
4) Từ đây sự kiện của camera được tiếp nhận theo đúng loại/ngưỡng policy.

**Independent verification:** Thử gửi một sự kiện tới camera trước khi
policy công bố — bị từ chối kèm lý do. Sau khi công bố + kích hoạt, gửi
sự kiện hợp lệ — được lưu ở "Chờ review" và bản ghi policy có đủ người
duyệt/ngày công bố.

### Journey 2: Sự kiện từ CV Backend được tiếp nhận và review

- **User:** CV Backend (gửi) + Quản lý (xử lý)
- **Importance:** Critical
- **Trigger:** CV Backend phát hiện hành vi trong khu vực quan sát.
- **Expected outcome:** Sự kiện được lưu một lần duy nhất ở "Chờ review",
  manager phụ trách nhận thông báo và ra quyết định có lý do.
- **Related needs:** UN-002, UN-003

1) CV Backend gửi event qua endpoint → HRMS xác thực → idempotency →
   kiểm camera/policy/ngưỡng → lưu "Chờ review" + đăng ký evidence.
2) Manager nhận thông báo → mở sự kiện → xem evidence (ghi audit).
3) Manager quyết định kèm lý do: xác nhận / false positive / cần thêm
   context.
4) Quyết định được ghi nhận; sự kiện đi tới trạng thái tương ứng.

**Independent verification:** Gửi cùng một event hai lần — chỉ một bản
ghi sự kiện. Mở sự kiện bằng manager trong phạm vi — xem được evidence
và có audit lượt xem; bằng manager ngoài phạm vi — không thấy sự kiện.

### Journey 3: Xử lý sự kiện đã xác nhận đến khi đóng

- **User:** Quản lý
- **Importance:** High
- **Trigger:** Sự kiện được xác nhận là vi phạm cần xử lý.
- **Expected outcome:** Task xử lý được tạo trên `kanban-workspaces`,
  liên kết sự kiện; sự kiện đóng khi xử lý xong.
- **Related needs:** UN-004

1) Trên sự kiện "Đã xác nhận", manager chọn "Tạo nhiệm vụ xử lý" → task
   được tạo kèm liên kết ngược.
2) Task được theo dõi trên kanban như thường.
3) Khi task xong, manager đánh dấu sự kiện "Đã xử lý" (resolved).

**Independent verification:** Mở task được tạo — có liên kết về sự kiện
gốc; sự kiện ở "Đã xử lý" có đủ chuỗi: phát hiện → xác nhận (lý do) →
task → resolved.

### Journey 4: Xử lý lỗi giao nhận sự kiện

- **User:** Admin
- **Importance:** High
- **Trigger:** CV Service retry hết lượt mà sự kiện vẫn lỗi.
- **Expected outcome:** Sự kiện nằm trong hàng chờ lỗi với payload + lý
  do; admin xử lý tay hoặc đánh dấu bỏ; không mất âm thầm.
- **Related needs:** UN-002, UN-007

1) Sự kiện lỗi sau retry chuyển hàng chờ "Lỗi giao nhận".
2) Admin mở bản ghi: xem payload, lý do, số lần retry.
3) Admin sửa/ngập tay nếu dữ liệu cứu được, hoặc đánh dấu bỏ kèm ghi chú.

**Independent verification:** Giả lập sự kiện payload lỗi → sau số retry
đã cấu hình, bản ghi xuất hiện trong hàng chờ lỗi với đủ lý do và log
giao nhận.

### Journey 5: Evidence hết retention

- **User:** Hệ thống (đối tượng kiểm chứng: admin/DPO)
- **Importance:** High
- **Trigger:** Evidence đạt hạn lưu giữ đã công bố.
- **Expected outcome:** Evidence tự xóa/đánh dấu hết hạn; metadata sự
  kiện vẫn theo hạn riêng; mọi lượt xem trước đó đã audit.
- **Related needs:** UN-006, UN-010

1) Job retention quét evidence theo `expires_at` → xóa/đánh dấu hết hạn.
2) Lượt xem evidence sau hạn bị chặn kèm thông báo hạn lưu giữ.

**Independent verification:** Tạo sự kiện có evidence hết hạn → sau job,
evidence không còn truy cập được và có bản ghi xóa; metadata sự kiện vẫn
xem được trong hạn của nó.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Đăng ký camera ở khu vực chưa có policy | Admin bị chặn không hiểu lý do | Thông báo yêu cầu công bố chính sách khu vực trước | Journey 1 / UN-001 |
| Sự kiện từ camera chưa đăng ký | CV service gửi nhầm đích | Từ chối kèm lý do "camera không tồn tại" + log cho admin | UN-002 |
| Sự kiện đúng camera nhưng loại ngoài policy | Service phát hiện loại chưa công bố | Từ chối kèm lý do loại sự kiện không được phép; admin cập nhật policy nếu cần | UN-001, UN-002 |
| Sự kiện dưới ngưỡng confidence | Sự kiện nhiễu lọt vào | Từ chối tiếp nhận, ghi delivery log để đối soát | UN-003 |
| Gửi trùng sự kiện (retry/mạch lỗi) | Trùng bản ghi | Trả "đã ghi nhận", không tạo sự kiện mới | Journey 2 / UN-002 |
| Evidence chưa nạp xong | Manager mở sự kiện thấy thiếu bằng chứng | Sự kiện hiển thị "evidence đang nạp"; quá hạn đánh dấu lỗi, vẫn review được | UN-003 |
| Manager xem sự kiện đã được xử lý | Ghi đè quyết định | Hiện trạng thái mới + người xử lý, không ghi đè | Journey 2 |
| Quyết định không nhập lý do | Quyết định thiếu căn cứ | Chặn ghi nhận, yêu cầu lý do | UN-003 |
| Sự kiện chờ review quá SLA | Sự kiện treo | Nhắc manager; sau 2 lần nhắc escalate theo policy | UN-003 |
| Manager phụ trách nghỉ việc | Sự kiện không có owner | Đánh dấu "thiếu owner" + escalate admin | UN-003 |
| Policy khu vực hết hiệu lực | Camera vẫn gửi sự kiện | Camera chuyển "tạm dừng", sự kiện mới bị từ chối kèm lý do | Journey 1 |
| Xem evidence ngoài quyền | Lộ hình ảnh nhạy cảm | Chặn + thông báo + ghi audit | UN-006 |
| Cooldown cùng loại/camera | Spam sự kiện liên tiếp | Gộp vào sự kiện đang mở, không tạo mới | UN-003 |

## 7. User-side Constraints

- Toàn bộ giao diện, policy và thông báo bằng tiếng Việt; policy viết
  bằng ngôn ngữ nhân viên đọc hiểu.
- Sự kiện chỉ là "cảnh báo chờ xác nhận" — wording tuyệt đối không gọi là
  "vi phạm" cho tới khi manager xác nhận.
- Camera chỉ "Hoạt động" khi khu vực có policy "Đã công bố" — không có
  chế độ bật tạm để test trên dữ liệu thật.
- Quyền xem evidence hẹp hơn hoặc bằng quyền xem sự kiện — khai báo trong
  zone policy; deny-by-default.
- Mọi lượt xem/tải evidence và mọi quyết định sự kiện đều bị audit — đây
  là điều kiện tiên quyết, không phải tùy chọn.
- HRMS không hiển thị stream video; evidence chỉ là ảnh/clip ngắn đã xử
  lý từ phía CV service.
- Sự kiện không gắn danh tính nhân viên trong dữ liệu — đối tượng là khu
  vực/camera; không suy ra cá nhân bằng hệ thống.
- Trước khi privacy gate PRD Mục 9 đạt (OQ-3/OQ-6/OQ-12 đóng): chỉ chạy
  trên dữ liệu synthetic.
- Desktop là surface chính cho dashboard/review; thông báo đến qua
  `contextual-notifications` khi có.

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| Contract sự kiện v1 = payload PRODUCT.md Mục 11 + event_id bắt buộc | Nếu service gửi schema khác → validation fail, sự kiện vào hàng chờ lỗi | Assumption — chờ owner CV service | Chốt contract ở OQ-1 (roadmap OQ-1) |
| Người duyệt zone policy = Head of HR + DPO/legal | Nếu khác → policy không được duyệt đúng thẩm quyền | Assumption — bám OQ-12 PRD (owner DPO/legal) | Xác nhận với DPO/legal |
| Evidence lưu tại storage HRMS quản lý | Nếu evidence ở storage service → retention/xóa không thực thi được phía HRMS | Assumption | Chốt trong contract OQ-1 |
| Sự kiện không gắn danh tính cá nhân | Nếu có identity → feature đổi bản chất, vi phạm "Chưa làm" | Confirmed — PRD Mục 7.38 "Chưa làm", PRODUCT.md "Không đưa vào" | — |
| Ngưỡng/SLA/retry/retention Mục 7.2 là đề xuất | Nếu owner chốt khác → đổi default | Assumption | Chốt OQ-3..OQ-6 |
| `external-integrations` chưa sẵn → endpoint webhook là contract riêng của feature | Nếu integration platform sẵn → chuyển contract qua đó | Assumption — bám roadmap Later | Đối chiếu khi `external-integrations` đặc tả |
| Nhân viên không xem evidence trong v1 | Nếu DPO yêu cầu minh bạch evidence → mở rộng self-view | Assumption — chờ định hướng DPO/legal | OQ-8 |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Sự kiện được con người quyết định kịp thời | Chưa có — xác lập bằng đo thời gian chờ review trong 1 tháng pilot | ≥80% sự kiện được xác nhận/từ chối trong SLA (đề xuất — chờ OQ-12 PRD) | Tỷ lệ sự kiện có quyết định trong SLA / tổng sự kiện | 1 tháng sau pilot |
| USC-002 | Cảnh báo ít nhiễu, đáng tin | Chưa có — xác lập bằng tỷ lệ false positive tháng đầu | False positive theo camera giảm qua 2 tháng liên tiếp nhờ chỉnh ngưỡng (đề xuất) | Tỷ lệ sự kiện "False positive" / tổng sự kiện theo camera | Hàng tháng |
| USC-003 | Không mất sự kiện giao nhận | 0 bản ghi | ≥99% sự kiện ghi nhận thành công sau retry; 100% sự kiện lỗi nằm trong hàng chờ có log | Tỷ lệ ghi nhận / tổng request đến | Liên tục |
| USC-004 | Không quan sát ngoài công bố | 0 sự cố | 0 sự kiện tiếp nhận từ camera/khu vực chưa có policy; 0 lượt xem evidence ngoài phạm vi | Kiểm tra delivery log + access audit | Liên tục |
| USC-005 | Evidence theo đúng hạn | 0 vi phạm | 0 evidence tồn tại quá retention khi kiểm định | Kiểm định storage định kỳ | Hàng tháng |

## 10. Open Questions

- [x] OQ-1: Endpoint contract CV service (schema, auth, retry)? — Resolved
  (đề xuất): schema theo payload PRODUCT.md Mục 11 + event_id bắt buộc;
  auth service-to-service; retry 5 lần backoff — chờ owner CV service
  xác nhận (roadmap OQ-1).
- [x] OQ-2: Ai duyệt chính sách khu vực/ngưỡng/retention? — Resolved (đề
  xuất): Head of HR + DPO/legal — chờ DPO/legal xác nhận (PRD OQ-12).
- [x] OQ-3: Ngưỡng confidence tiếp nhận? — Resolved (đề xuất): 0.70 mặc
  định theo khu vực — chờ DPO/legal + owner CV service.
- [x] OQ-4: Retention evidence/metadata? — Resolved (đề xuất): evidence
  30 ngày, metadata 12 tháng — chờ DPO/legal (OQ-6 PRD).
- [x] OQ-5: Retry/dead-letter? — Resolved (đề xuất): 5 lần backoff rồi
  hàng chờ lỗi giao nhận — chờ Technical/Operations.
- [x] OQ-6: SLA review + cooldown gộp? — Resolved (đề xuất): SLA 2 ngày
  làm việc, cooldown 10 phút — chờ Product owner/Head of HR.
- [~] OQ-7: Đồng bộ trạng thái ngược về CV service? — Out of scope v1 (P1).
- [~] OQ-8: Nhân viên xem evidence liên quan mình? — Out of scope v1 —
  chờ định hướng DPO/legal.
- [~] OQ-9: Loại phát hiện phase 2 (PPE, xâm nhập, đếm người)? — Out of
  scope v1 — phase 2 CV service (PRD "Chưa làm").
