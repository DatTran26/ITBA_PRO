---
type: brainstorm
feature: cv-event-monitoring
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, PRODUCT.md]
---

# Giám sát sự kiện vi phạm bằng Computer Vision — phần HRMS tiếp nhận — cv-event-monitoring

## 1. Idea Seed

HRMS là **đầu nhận** của một hệ thống Computer Vision tách biệt: một Python
CV Backend (ngoài repo, đang build riêng) xử lý luồng camera tại các khu
vực đã công bố và chỉ gửi **sự kiện đã phát hiện kèm bằng chứng** về HRMS
qua API/webhook có retry. HRMS tiếp nhận sự kiện, lưu sự kiện và bằng chứng,
hiển thị dashboard theo phạm vi quyền, thông báo manager phụ trách và điều
phối việc xác nhận/từ chối có lý do — **không xử lý video realtime, không
nhận diện danh tính, không tự kết luận vi phạm**: mọi sự kiện chỉ là cảnh
báo cho đến khi manager xác nhận.

## 2. Context

Doanh nghiệp có một số khu vực làm việc đã công bố và được phép quan sát
(vd khu vực cấm hút thuốc, vị trí cần có người trực). Hiện việc phát hiện
vi phạm ở các khu vực này phụ thuộc tuần tra thủ công — chậm, không đều,
thiếu bằng chứng. Đặc tả đề xuất ở PRODUCT.md Mục 11 mô tả một Python CV
Backend riêng (frame sampling → model phát hiện → event + evidence) và đã
được chốt nguyên tắc: HRMS không xử lý video, chỉ nhận event đã xử lý.
Project profile xác nhận "CV service cho cv-event-monitoring đang build ở
ngoài repo (Python riêng)". PRD xếp feature này **Could** — hệ thống ngoài
với phần HRMS chỉ tiếp nhận; rủi ro R-15 yêu cầu bắt buộc human review,
retention/xóa evidence và access audit trước khi bật; ai duyệt chính sách
khu vực camera/ngưỡng/retention đang là OQ-12 của PRD (owner: DPO/legal).
Roadmap ghi feature bị chặn bởi CV service ngoài chưa sẵn và
`external-integrations` chưa chọn provider. Đây là feature nhạy cảm privacy
nhất PRD — thiết kế phải chứng minh được: khu vực công bố trước khi mở
camera, sự kiện chỉ là cảnh báo chờ người xác nhận, evidence có hạn lưu
giữ và mọi lượt xem đều bị audit.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Quản lý (manager phụ trách khu vực) | Phát hiện vi phạm khu vực công bố qua tuần tra tay, không bằng chứng | Nhận cảnh báo kèm evidence trong phạm vi, xác nhận/từ chối có lý do, tạo task xử lý |
| Admin | Chưa có nơi đăng ký khu vực/camera đã công bố và kiểm soát ai xem evidence | Catalog camera/khu vực gắn chính sách công bố, ngưỡng tiếp nhận, retention evidence, access audit |
| CV Backend (hệ thống ngoài) | Cần điểm gửi sự kiện tin cậy, không bị mất event khi HRMS bận | Endpoint có auth + idempotency + retry, trạng thái giao nhận rõ ràng |
| Head of HR / DPO-legal | Chưa rõ ai duyệt chính sách khu vực camera, ngưỡng, retention (OQ-12) | Điểm phê duyệt chính sách trước khi khu vực/camera được bật |
| Nhân viên trong khu vực quan sát | Không biết khu vực nào có camera và dữ liệu dùng thế nào | Đọc được công bố khu vực; có kênh phản hồi khi phù hợp |
| Lãnh đạo | Không có góc nhìn tổng hợp về sự kiện khu vực | Báo cáo/dashboard theo phạm vi được phân quyền |

## 4. Capabilities Breakdown

### P0 — must have

- **Chính sách khu vực quan sát (zone policy) là gate**: mỗi khu vực/camera
  chỉ được đăng ký hoạt động khi gắn một chính sách đã công bố — loại sự
  kiện cho phép, mục đích, ngưỡng cảnh báo tối thiểu để tiếp nhận, ai xem,
  retention evidence, khung giờ áp dụng. Không policy công bố → camera ở
  trạng thái "chưa kích hoạt", sự kiện gửi về bị từ chối có lý do.
- Catalog camera/khu vực: đăng ký camera gắn phòng/khu vực/đơn vị, trạng
  thái (chưa kích hoạt, hoạt động, tạm dừng, mất kết nối), khung giờ giám
  sát, lịch sử thay đổi cấu hình phía HRMS.
- Endpoint tiếp nhận sự kiện: API/webhook có xác thực service, kiểm hợp lệ
  payload (loại sự kiện, camera, thời điểm, confidence, evidence ref),
  idempotency chống trùng, và ghi nhận trạng thái giao nhận.
- Retry/dead-letter phía HRMS: khi xử lý sự kiện lỗi, đánh dấu để CV
  Backend retry theo cơ chế đã chốt; sự kiện lỗi lặp vào hàng chờ xử lý tay,
  không mất âm thầm (PRD: "API/webhook có retry"; PRODUCT.md: "có cơ chế
  retry khi gửi sự kiện thất bại").
- Lưu sự kiện + bằng chứng: bản ghi sự kiện (loại, camera, khu vực, thời
  điểm, duration, confidence, model version) tách biệt với file bằng chứng
  (ảnh/clip ngắn); metadata và evidence có retention riêng đã công bố.
- Dashboard sự kiện theo phòng/camera/loại/trạng thái trong đúng phạm vi
  quản lý — deny-by-default.
- Thông báo manager phụ trách khi có sự kiện "Chờ review" (in-app; kênh
  ngoài qua `contextual-notifications` nếu có).
- Vòng đời sự kiện bắt buộc qua con người: chờ review → xác nhận / false
  positive / cần thêm context → xử lý xong / loại bỏ — mọi quyết định kèm
  lý do bắt buộc và người quyết định.
- Evidence retention + access audit: xem/tải evidence chỉ cho vai trò được
  cấp, mọi lượt xem/tải/xác nhận ghi audit; evidence tự xóa/đánh dấu hết
  hạn theo retention đã công bố.
- Tạo task xử lý trên `kanban-workspaces` từ sự kiện đã xác nhận.

### P1 — should have

- Đồng bộ trạng thái xác nhận ngược về CV Backend (để service ngoài biết
  sự kiện nào là false positive phục vụ đánh giá model).
- Thống kê chất lượng: tỷ lệ sự kiện được xác nhận, false positive theo
  camera/loại/model version — để admin đề xuất chỉnh ngưỡng phía CV service.
- Sự kiện kỹ thuật từ CV Backend (camera offline, chất lượng frame thấp,
  worker lỗi) hiển thị như loại sự kiện riêng để admin xử lý.
- Cảnh báo SLA: sự kiện chờ review quá hạn → nhắc/escalate theo policy.
- Export báo cáo sự kiện theo quyền, có audit.

### P2 — nice to have

- Tóm tắt tình hình theo ngày/tuần và đề xuất kiểm tra sự kiện confidence
  thấp lặp lại (AI hỗ trợ — vẫn qua người xác nhận).
- Loại phát hiện phase 2 của CV service: PPE, xâm nhập khu vực, điện thoại
  khu vực cấm, đếm người, heatmap — chỉ tiếp nhận khi service sẵn và policy
  được cập nhật.
- Live preview/stream đã tối ưu — thuộc phía CV service, HRMS chỉ liên kết.

## 5. Core Flows (Happy Path)

### 5.1 Công bố chính sách khu vực và đăng ký camera

1) Admin soạn zone policy: khu vực/phòng áp dụng, loại sự kiện cho phép
   (vd hút thuốc, rời vị trí quá lâu), mục đích, ngưỡng confidence tối
   thiểu để tiếp nhận, vai trò được xem/xem evidence, retention evidence,
   khung giờ áp dụng → lưu "Bản nháp" → gửi duyệt.
2) Người duyệt (đề xuất: Head of HR + DPO/legal — chờ xác nhận OQ-12 PRD)
   phê duyệt → policy "Đã công bố", hiển thị công khai cho người trong
   phạm vi.
3) Admin đăng ký camera gắn khu vực thuộc policy đã công bố + endpoint CV
   Backend → camera "Hoạt động" chỉ sau khi kiểm tra kết nối service.
4) Hệ thống chỉ tiếp nhận sự kiện của camera "Hoạt động" và thuộc loại sự
   kiện policy cho phép — sự kiện khác bị từ chối kèm lý do để CV Backend
   biết.

### 5.2 Tiếp nhận sự kiện từ CV Backend → lưu → cảnh báo manager

1) CV Backend phát hiện sự kiện → gửi event (loại, camera, thời điểm,
   confidence, duration, evidence ref, model version) qua endpoint.
2) HRMS xác thực service → kiểm idempotency (event_id đã có → trả trạng
   thái đã ghi nhận, không tạo trùng) → kiểm payload + camera/policy hợp
   lệ → lưu sự kiện ở "Chờ review" + đăng ký evidence.
3) Tìm manager phụ trách khu vực → tạo thông báo cảnh báo kèm tóm tắt sự
   kiện (không đính kèm evidence trong thông báo).
4) Nếu bước xử lý lỗi → trả mã lỗi để CV Backend retry theo cơ chế đã
   chốt; ghi delivery log; lỗi lặp chuyển hàng chờ xử lý tay cho admin.

```
CV Backend (ngoài)             HRMS                          Manager
──────────────────────────────────────────────────────────────────────────
Phát hiện sự kiện
        │
        ▼ gửi event + evidence ref (API/webhook)
   ┌────────────────────────────────────────┐
   │ 1. Xác thực service                    │
   │ 2. Idempotency: event_id đã có? ──Có──▶ trả "đã ghi nhận" (không trùng)
   │              │Không                    │
   │ 3. Camera "Hoạt động" + loại sự kiện   │
   │    thuộc policy? ──Không──▶ từ chối kèm lý do
   │              │Có                       │
   │ 4. Lưu sự kiện "Chờ review" + evidence │
   │ 5. Thông báo manager phụ trách         │
   └───────────────┬────────────────────────┘
                   ▼
         Manager mở sự kiện → xem evidence (ghi audit)
                   ▼
         ── Quyết định? ──┐
            │        │        │
     Xác nhận ▼   Sai ▼   Cần thêm ▼
     "Đã xác nhận" "False   context" → giữ
     (+ lý do,     positive" "Chờ bổ sung"
      có thể tạo   (+ lý do)  → xác nhận sau
      task)           │
                   ▼
         Đồng bộ trạng thái về CV Backend (P1)
```

### 5.3 Manager review và quyết định sự kiện

1) Manager mở dashboard → lọc sự kiện "Chờ review" trong phạm vi → mở sự
   kiện: xem loại, camera/khu vực, thời điểm, confidence, duration và
   evidence (lượt xem evidence ghi audit).
2) Chọn quyết định + lý do bắt buộc: "Xác nhận vi phạm" (có thể tạo task
   xử lý trên kanban), "False positive", hoặc "Cần thêm context".
3) "Xác nhận"/"False positive" → sự kiện sang trạng thái cuối và ghi nhận
   vào thống kê chất lượng; "Cần thêm context" → giữ mở, có thể gắn ghi
   chú yêu cầu manager khác/khu vực khác kiểm tra.
4) Sự kiện "Đã xác nhận" khi được xử lý xong chuyển "Đã xử lý" (resolved);
   sự kiện không còn giá trị chuyển "Đã loại bỏ" (dismissed) kèm lý do.

### 5.4 Evidence retention và access audit

1) Evidence (ảnh/clip) có hạn theo retention của zone policy tại thời điểm
   sự kiện được ghi nhận.
2) Job retention định kỳ xóa/đánh dấu evidence hết hạn; metadata sự kiện
   giữ theo hạn riêng đã công bố.
3) Mọi lượt xem/tải evidence và mọi quyết định sự kiện ghi access audit —
   admin truy vết được ai đã xem evidence nào, khi nào.

### 5.5 Xử lý sự kiện lỗi giao nhận

1) Sự kiện gửi về nhưng payload lỗi/không hợp lệ → HRMS trả lỗi có lý do;
   CV Backend retry theo cơ chế đã chốt.
2) Retry hết hạn mà vẫn lỗi → sự kiện vào hàng chờ "Lỗi giao nhận" của
   admin: xem payload, lý do, quyết định nhập tay hoặc đánh dấu bỏ.
3) Toàn bộ request giao nhận (thành công/thất bại/retry) ghi delivery log
   để đối soát với CV Backend.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Khu vực đã có policy "Đã công bố"? | Cho đăng ký/kích hoạt camera | Chặn đăng ký, hướng dẫn công bố policy trước |
| D2 | 5.2 | Service gọi endpoint có xác thực hợp lệ? | Tiếp tục kiểm | Từ chối, ghi log truy cập trái phép |
| D3 | 5.2 | event_id đã tồn tại (gửi trùng/retry)? | Trả "đã ghi nhận", không tạo sự kiện mới | Xử lý tiếp như sự kiện mới |
| D4 | 5.2 | Camera "Hoạt động" + loại sự kiện + confidence đạt ngưỡng policy? | Lưu sự kiện "Chờ review" + đăng ký evidence | Từ chối kèm lý do (camera chưa kích hoạt / loại không được phép / dưới ngưỡng) |
| D5 | 5.2 | Payload đủ trường bắt buộc? | Lưu và xử lý tiếp | Trả lỗi validation để service retry/sửa; vào hàng chờ lỗi nếu lặp |
| D6 | 5.3 | Manager có phạm vi quyền phủ khu vực sự kiện? | Cho xem sự kiện + evidence (ghi audit) | Ẩn hoàn toàn khỏi dashboard |
| D7 | 5.3 | Quyết định của manager là gì? | "Xác nhận" → trạng thái cuối + có thể tạo task; "False positive" → trạng thái cuối + vào thống kê chất lượng | "Cần thêm context" → giữ "Chờ bổ sung" |
| D8 | 5.3 | Lý do đã nhập? | Ghi nhận quyết định | Chặn, yêu cầu nhập lý do |
| D9 | 5.4 | Evidence hết retention? | Xóa/đánh dấu hết hạn tự động | Vẫn xem được theo quyền |
| D10 | 5.5 | Retry CV Backend còn lượt? | Chờ retry, giữ delivery log lỗi | Chuyển hàng chờ "Lỗi giao nhận" cho admin |

### 6.2 Scenario Matrix

| Vai trò | Sự kiện chờ review | Sự kiện đã xác nhận | False positive | Evidence trong hạn | Evidence hết hạn |
|---|---|---|---|---|---|
| Manager trong phạm vi | xem + xác nhận/từ chối/cần thêm | xem + đóng (resolved) | xem | xem (ghi audit) | không xem được |
| Manager ngoài phạm vi | không thấy | không thấy | không thấy | không xem được | không xem được |
| Admin | xem mọi sự kiện + hàng chờ lỗi giao nhận | xem | xem + thống kê chất lượng | xem theo quyền evidence (ghi audit) | không xem được |
| Người duyệt policy | — | — | — | — | xem lịch sử policy |
| Nhân viên trong khu vực | không thấy sự kiện | không thấy | không thấy | — | — |
| CV Backend | gửi sự kiện, nhận trạng thái giao nhận | nhận đồng bộ trạng thái (P1) | nhận đồng bộ (P1) | gửi/nạp evidence ref | — |

### 6.3 State Transitions

```
camera: đăng-ký → chưa-kích-hoạt → hoạt-động → tạm-dừng
                       ↑              │            │
                       └──(chưa có policy công bố)─┘
                  hoạt-động → mất-kết-nối (sự kiện kỹ thuật) → hoạt-động

sự-kiện: chờ-review → đã-xác-nhận → đã-xử-lý (resolved)
              │    └→ false-positive (đóng)
              └→ chờ-bổ-sung → chờ-review
       chờ-review/đã-xác-nhận → đã-loại-bỏ (dismissed, kèm lý do)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| camera | — | đăng-ký | admin đăng ký camera mới | — |
| camera | đăng-ký/chưa-kích-hoạt | hoạt-động | khu vực có policy công bố + kiểm tra kết nối service đạt | — |
| camera | hoạt-động | tạm-dừng | admin tạm dừng hoặc policy khu vực hết hiệu lực | có |
| camera | hoạt-động | mất-kết-nối | sự kiện kỹ thuật/health check fail | có (tự về hoạt-động khi kết nối lại) |
| camera | tạm-dừng | hoạt-động | admin bật lại khi policy còn hiệu lực | — |
| sự-kiện | — | chờ-review | tiếp nhận hợp lệ từ CV Backend | — |
| sự-kiện | chờ-review | đã-xác-nhận | manager "Xác nhận vi phạm" + lý do | — |
| sự-kiện | chờ-review | false-positive | manager "False positive" + lý do | không |
| sự-kiện | chờ-review | chờ-bổ-sung | manager "Cần thêm context" | có (về chờ-review khi có thêm thông tin) |
| sự-kiện | đã-xác-nhận | đã-xử-lý | manager/owner đánh dấu xử lý xong | không |
| sự-kiện | chờ-review/đã-xác-nhận | đã-loại-bỏ | người có quyền loại bỏ + lý do | không |
| sự-kiện giao nhận | mới | đã-ghi-nhận | xử lý thành công | — |
| sự kiện giao nhận | mới | lỗi-retry | xử lý lỗi, còn lượt retry của service | có (về đã-ghi-nhận khi retry đạt) |
| sự kiện giao nhận | lỗi-retry | lỗi-giao-nhận | hết lượt retry | admin xử lý tay |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| CV Backend gửi sự kiện khi HRMS đang lỗi | request thất bại, chưa ghi | service retry theo cơ chế đã chốt; idempotency chống trùng | delivery log ghi thất bại |
| Gửi trùng một sự kiện (retry/mạch lỗi) | bản ghi sự kiện đầu tiên | trả "đã ghi nhận" cho lần gửi sau | không tạo sự kiện thứ hai |
| Evidence chưa nạp xong nhưng sự kiện đã lưu | sự kiện có evidence "đang nạp" | khi evidence sẵn → cập nhật trạng thái | quá hạn nạp → đánh dấu "evidence lỗi", sự kiện vẫn review được |
| Manager mở sự kiện nhưng sự kiện vừa được người khác xử lý | trạng thái đã đổi | hiện trạng thái mới + người xử lý | — |
| Job retention chạy giữa lúc manager đang xem evidence | evidence hết hạn | lượt xem đang mở hoàn tất, lượt mới bị chặn | đánh dấu hết hạn, audit lượt cuối |
| Policy khu vực hết hiệu lực khi camera đang hoạt động | camera chuyển "tạm-dừng" | sự kiện mới bị từ chối kèm lý do; sự kiện đang mở vẫn review được | evidence đã lưu theo retention cũ |
| Hai admin sửa một camera/policy nháp | bản lưu sau ghi đè | cảnh báo "vừa được {người} cập nhật — tải lại" | không merge tự động |

### 6.5 Other Edge Cases

- Sự kiện đến từ camera chưa đăng ký trong catalog → từ chối kèm lý do
  "camera không tồn tại", ghi log để admin kiểm tra cấu hình service.
- Sự kiện đúng camera nhưng loại không nằm trong policy khu vực (vd CV
  service phát hiện loại mới chưa được công bố) → từ chối kèm lý do; admin
  cập nhật policy qua version mới nếu muốn nhận loại đó.
- Confidence dưới ngưỡng policy → từ chối tiếp nhận (không hiển thị), vẫn
  ghi delivery log để đối soát.
- Sự kiện chờ review quá SLA → nhắc manager; lặp nhắc → escalate theo
  policy (vd lên quản lý cấp trên trong phạm vi).
- CV Backend gửi sự kiện ngoài khung giờ áp dụng của policy → từ chối kèm
  lý do (camera chỉ giám sát trong khung giờ công bố).
- Mất manager phụ trách khu vực (nghỉ việc/chuyển phạm vi) → sự kiện mới
  đánh dấu "thiếu owner" và escalate tới admin.
- Nhân viên phản hồi về sự kiện liên quan mình → đi qua kênh phản hồi của
  `workforce-monitoring`/policy quy trình, KHÔNG hiển thị evidence cho
  nhân viên trong v1 (đề xuất — chờ DPO/legal).
- Evidence là clip ngắn theo cấu hình trước/sau sự kiện phía CV service —
  HRMS chỉ lưu reference và metadata, không tái xử lý nội dung.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên zone policy | bắt buộc, tối đa 200 ký tự |
| Khu vực/phòng áp dụng | bắt buộc ≥1 khu vực thuộc tổ chức |
| Loại sự kiện cho phép | bắt buộc ≥1, chỉ trong danh mục đã công bố: hút thuốc, rời vị trí quá lâu (phase 1) |
| Mục đích quan sát | bắt buộc, tối đa 1.000 ký tự, ngôn ngữ nhân viên đọc được |
| Ngưỡng confidence tiếp nhận | bắt buộc, 0.50–0.99 (đề xuất mặc định 0.70 — xem OQ-3) |
| Retention evidence | bắt buộc, 7–90 ngày (đề xuất mặc định 30 ngày — xem OQ-4) |
| Khung giờ áp dụng | bắt buộc khai báo; không cho phép "24/7" trừ khi policy ghi rõ lý do |
| Vai trò xem sự kiện / xem evidence | bắt buộc ≥1; quyền xem evidence hẹp hơn hoặc bằng quyền xem sự kiện |
| Đăng ký camera | mã camera duy nhất; bắt buộc gắn khu vực có policy công bố; bắt buộc endpoint service |
| Payload sự kiện đến | bắt buộc: event_id, event_type, camera_id, detected_at, confidence; evidence ref khi policy yêu cầu |
| Lý do quyết định sự kiện | bắt buộc, tối đa 500 ký tự |
| Gửi duyệt policy | chỉ khi đủ trường bắt buộc |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Retry tiếp nhận sự kiện (phía CV service) | 5 lần, backoff (đề xuất — xem OQ-5) | mỗi sự kiện | sau 5 lần → hàng chờ "Lỗi giao nhận" |
| Retention evidence | 30 ngày (đề xuất — xem OQ-4) | từ thời điểm sự kiện | tự xóa/đánh dấu hết hạn |
| Retention metadata sự kiện | 12 tháng (đề xuất — xem OQ-4) | từ thời điểm sự kiện | ẩn danh/xóa theo policy |
| SLA review sự kiện | 2 ngày làm việc (đề xuất — xem OQ-6) | từ "Chờ review" | nhắc manager; sau 2 lần nhắc escalate |
| Ngưỡng confidence tiếp nhận mặc định | 0.70 (đề xuất — xem OQ-3) | mỗi sự kiện | dưới ngưỡng → từ chối tiếp nhận |
| Cooldown cùng loại sự kiện/camera | 10 phút (đề xuất — xem OQ-6) | theo camera + loại | sự kiện lặp trong cooldown gộp vào sự kiện đang mở |
| Số sự kiện dashboard hiển thị | 50 dòng/trang | — | phân trang |
| Kích thước evidence tham chiếu | theo giới hạn lưu trữ chung; clip ngắn ≤30 giây (đề xuất) | mỗi sự kiện | evidence lớn hơn → chỉ lưu ảnh snapshot |
| Hàng chờ lỗi giao nhận | giữ tối đa 90 ngày | mỗi bản ghi | quá hạn → archive kèm log |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Đăng ký camera chưa có policy | "Khu vực này chưa có chính sách quan sát được công bố — công bố chính sách trước khi đăng ký camera" | E-? |
| Payload sự kiện thiếu trường | "Sự kiện thiếu thông tin bắt buộc: {danh sách field} — yêu cầu gửi lại" | E-? |
| Camera chưa kích hoạt nhận sự kiện | "Sự kiện bị từ chối: camera {mã} chưa ở trạng thái hoạt động" | E-? |
| Loại sự kiện ngoài policy | "Sự kiện bị từ chối: loại '{loại}' không nằm trong chính sách đã công bố của khu vực" | E-? |
| Xem sự kiện ngoài phạm vi | "Sự kiện này thuộc khu vực ngoài phạm vi quản lý của bạn" | E-? |
| Xem evidence không quyền | "Bạn không có quyền xem bằng chứng của sự kiện này" | E-? |
| Evidence hết hạn | "Bằng chứng đã được xóa theo thời hạn lưu giữ đã công bố ({n} ngày)" | E-? |
| Quyết định thiếu lý do | "Vui lòng nhập lý do trước khi ghi nhận quyết định" | E-? |
| Xác thực service thất bại | "Yêu cầu từ dịch vụ không hợp lệ — kiểm tra cấu hình xác thực" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Policy khu vực được công bố | "Chính sách quan sát đã được công bố — camera trong khu vực có thể được kích hoạt" |
| Camera kích hoạt | "Camera {mã} đã hoạt động — chỉ tiếp nhận sự kiện thuộc chính sách đã công bố" |
| Tiếp nhận sự kiện | "Đã ghi nhận sự kiện — chờ người quản lý xem xét" |
| Xác nhận sự kiện | "Đã ghi nhận xác nhận của bạn cho sự kiện này" |
| Đánh dấu false positive | "Đã ghi nhận cảnh báo sai — số liệu sẽ dùng để đánh giá chất lượng phát hiện" |
| Tạo task xử lý | "Đã tạo nhiệm vụ xử lý liên kết với sự kiện này" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Banner dashboard sự kiện | "Sự kiện do hệ thống Computer Vision phát hiện chỉ là cảnh báo — cần người quản lý xác nhận trước khi ghi nhận" |
| Sự kiện mới | "Có {n} sự kiện mới cần xem xét trong khu vực {khu vực}" |
| Công bố khu vực | "Khu vực này đang được quan sát theo chính sách '{tên policy}' — mục đích: {mục đích}; dữ liệu giữ {n} ngày" |
| Cooldown gộp | "Sự kiện tương tự vừa được ghi nhận — gộp vào sự kiện đang mở" |
| Hàng chờ lỗi | "{n} sự kiện gửi về không thành công sau khi thử lại — cần xử lý thủ công" |
| Đồng bộ về service | "Trạng thái xác nhận đã được gửi lại cho hệ thống Computer Vision" |

## 8. Assumptions

- CV Backend là hệ thống ngoài do bên khác sở hữu (đang build bằng Python
  riêng — project profile); HRMS chỉ định nghĩa contract tiếp nhận, không
  spec phía service (model, worker, stream) — mọi capability xử lý video
  nằm ngoài scope.
- Contract sự kiện v1 bám payload mẫu của PRODUCT.md Mục 11 (event_type,
  camera_id, room_id, detected_at, confidence, duration_seconds,
  evidence_image_url, evidence_video_url, model_version, status) cộng
  event_id cho idempotency — endpoint contract chính thức chờ OQ-1.
- Người duyệt zone policy là Head of HR + DPO/legal — resolved-đề xuất
  theo hướng OQ-12 PRD (owner DPO/legal) chờ xác nhận.
- Evidence lưu tại storage do HRMS quản lý (CV Backend gửi file/URL nạp
  về); không giữ link tới storage của service — để retention/xóa thực thi
  được từ phía HRMS.
- Sự kiện không gắn danh tính nhân viên (không nhận diện mặt người — PRD
  "Chưa làm"); đối tượng sự kiện là khu vực/camera, không phải cá nhân —
  việc suy ra cá nhân nếu có là do manager trong bước xác nhận, không phải
  dữ liệu hệ thống.
- Ngưỡng, retry, SLA ở Mục 7.2 là giá trị đề xuất — chờ owner chốt (OQ-3
  đến OQ-6); trước đó chỉ chạy trên dữ liệu synthetic theo privacy gate
  PRD Mục 9.
- `external-integrations` chưa chọn provider — webhook tiếp nhận coi là
  contract riêng của feature cho tới khi integration platform sẵn (bám
  roadmap).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Cảnh báo AI bị dùng như kết luận vi phạm chính thức khi chưa người xác nhận (R-15) | thỉnh thoảng | kỷ luật oan, complaint, mất niềm tin, pháp lý | wording "chỉ là cảnh báo" trên mọi surface; state machine bắt buộc qua review; cấm auto-escalate thành kỷ luật |
| Evidence giữ quá retention đã công bố → vi phạm privacy (R-15) | thỉnh thoảng | vi phạm cam kết, rủi ro pháp lý | retention bắt buộc trong zone policy, tự xóa/đánh dấu hết hạn, kiểm định định kỳ |
| Truy cập evidence vượt phạm vi → sự cố bảo mật (R-15 trigger) | thỉnh thoảng | lộ hình ảnh nhân viên, complaint | quyền evidence hẹp hơn quyền sự kiện; access audit mọi lượt xem/tải |
| CV service gửi sự kiện sai/nhiễu → dashboard spam, manager bỏ qua | thường | cảnh báo mất giá trị, bỏ sót sự kiện thật | ngưỡng tiếp nhận theo policy, cooldown gộp, thống kê false positive phản hồi service |
| Mất sự kiện khi giao nhận lỗi → không biết vi phạm đã xảy ra | thỉnh thoảng | mất bằng chứng, điều tra thiếu dữ liệu | retry + dead-letter hàng chờ lỗi, delivery log đối soát |
| Bật camera khu vực chưa công bố → covert surveillance (R-10 liên quan) | hiếm | vi phạm pháp lý nghiêm trọng | gate D1: camera chỉ hoạt động khi khu vực có policy công bố; sự kiện từ camera chưa kích hoạt bị từ chối |
| OQ-12 chưa có owner → policy không ai duyệt, feature không bật được | thỉnh thoảng | feature treo ở Later | resolved-đề xuất Head of HR + DPO/legal; công bố chờ xác nhận |
| CV service ngoài chậm/đổi contract → tích hợp trễ | thường | feature không có dữ liệu thật | contract version hóa, delivery log, hàng chờ lỗi; dependency theo roadmap |

## 10. Success Criteria (preliminary)

- Tỷ lệ sự kiện "Chờ review" được manager xác nhận/từ chối trong SLA —
  theo PRD Mục 7.38; con số target chờ OQ-12 PRD.
- Tỷ lệ false positive theo camera giảm dần nhờ thống kê phản hồi —
  target chờ OQ-12 PRD.
- 100% sự kiện được lưu có quyết định của con người trước khi đóng.
- 0 sự kiện được tiếp nhận từ camera/khu vực chưa có policy công bố.
- 0 lượt xem evidence ngoài phạm vi được xác nhận (guardrail, bám M-GR-01).
- 0 evidence tồn tại quá retention khi kiểm định.

## 11. Open Questions

- [x] OQ-1: Endpoint contract CV service (event schema, auth, retry) đã
  chốt chưa? — Resolved (đề xuất): schema theo payload mẫu PRODUCT.md Mục
  11 + event_id bắt buộc cho idempotency; auth service-to-service; retry
  5 lần backoff — chờ owner CV service xác nhận (roadmap OQ-1).
- [x] OQ-2: Ai duyệt chính sách khu vực camera, ngưỡng và retention? —
  Resolved (đề xuất): Head of HR duyệt nghiệp vụ + DPO/legal xác nhận
  purpose/retention — chờ DPO/legal xác nhận (PRD OQ-12).
- [x] OQ-3: Ngưỡng confidence tối thiểu để tiếp nhận sự kiện? — Resolved
  (đề xuất): 0.70 mặc định, chỉnh theo khu vực trong policy — chờ DPO/
  legal + owner CV service.
- [x] OQ-4: Retention evidence và metadata sự kiện? — Resolved (đề xuất):
  evidence 30 ngày, metadata 12 tháng — chờ DPO/legal (liên quan OQ-6 PRD).
- [x] OQ-5: Cơ chế retry/dead-letter phía HRMS? — Resolved (đề xuất):
  service retry 5 lần backoff, sau đó hàng chờ lỗi giao nhận cho admin —
  chờ Technical/Operations xác nhận.
- [x] OQ-6: SLA review và cooldown gộp sự kiện? — Resolved (đề xuất): SLA
  2 ngày làm việc, cooldown 10 phút theo camera + loại — chờ Product
  owner + Head of HR.
- [~] OQ-7: Đồng bộ trạng thái xác nhận ngược về CV service? — Out of
  scope v1: là P1, chỉ khi service yêu cầu để đánh giá model.
- [~] OQ-8: Nhân viên có được xem evidence liên quan mình không? — Out of
  scope v1: v1 không hiển thị evidence cho nhân viên; phản hồi đi qua kênh
  policy — chờ DPO/legal định hướng (liên quan OQ-12 PRD).
- [~] OQ-9: Loại phát hiện phase 2 (PPE, xâm nhập, đếm người)? — Out of
  scope v1: phase 2 của CV service; chỉ tiếp nhận khi service sẵn và
  policy được cập nhật (PRD "Chưa làm").

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd cv-event-monitoring` — capture user perspective
- `/brd cv-event-monitoring` — business case
- `/prd-epic cv-event-monitoring` — product scope
