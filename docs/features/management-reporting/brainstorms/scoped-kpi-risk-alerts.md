---
type: brainstorm
feature: management-reporting
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md]
---

# Báo cáo quản trị theo phạm vi quyền — management-reporting

## 1. Idea Seed

Tổng hợp KPI của recruitment, assessment và công việc (kanban) thành báo cáo
quản trị theo đúng phạm vi quyền của người xem: chọn phạm vi/kỳ → xem KPI và
cảnh báo quá hạn → mở evidence nguồn → xác nhận action xử lý. AI chỉ đề xuất
executive summary và chỉ ra rủi ro cần kiểm tra kèm đường dẫn evidence; con
người xác nhận action, AI không kết luận vi phạm hay chấm phẩm chất.

## 2. Context

Quản lý và lãnh đạo hiện muốn biết "tuyển đang kẹt ở đâu, task nào quá hạn,
bài test nào sắp trễ" phải hỏi HR hoặc tự mở từng màn hình nghiệp vụ — số
liệu rời, chậm và không đồng nhất giữa các phòng. Dữ liệu nguồn đã nằm trong
hệ thống (pipeline ứng viên, task kanban, bài đánh giá) nhưng chưa có lớp
tổng hợp theo phạm vi quản lý. Rủi ro đặc thù của lớp tổng hợp này là aggregate
làm lộ dữ liệu ngoài scope hoặc cho phép suy diễn cá nhân — vì vậy phạm vi
quyền (org-governance) là điều kiện tiên quyết, không phải tùy chọn.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Quản lý | Không biết việc trong đơn vị mình đang kẹt ở đâu cho tới khi bị hỏi | Dashboard KPI + cảnh báo quá hạn trong đúng đơn vị mình quản lý |
| Lãnh đạo / Head of HR | Phải chờ HR tổng hợp tay mỗi tuần | Báo cáo tổng hợp tự phục vụ, drill được xuống evidence |
| HR | Tổng hợp số liệu thủ công cho quản lý, trả lời lặp lại | Số liệu tự cập nhật, export hợp lệ khi cần gửi |
| Admin | Cảnh báo nhiễu hoặc thiếu vì ngưỡng một cỡ cho mọi đơn vị | Cấu hình ngưỡng cảnh báo và bộ KPI mặc định |

## 4. Capabilities Breakdown

### P0 — must have

- Dashboard KPI theo phạm vi quyền (data-scope từ `org-governance`): pipeline
  ứng viên theo trạng thái và thời gian kẹt, bài đánh giá đã giao/hoàn thành/
  quá hạn, task kanban quá hạn và tỷ lệ hoàn thành đúng hạn.
- Filter theo kỳ (tuần/tháng/quý tùy chọn) và theo phòng ban/vị trí — chỉ
  trong scope người xem.
- Cảnh báo quá hạn/rủi ro theo ngưỡng cấu hình được (application kẹt quá X
  ngày, task quá hạn, bài test sắp hết hạn chưa làm).
- Drill-down evidence: từ số liệu/cảnh báo mở danh sách entity nguồn — chỉ
  entity trong scope; số liệu nhỏ hơn ngưỡng nhóm tối thiểu thì ẩn.
- Cảnh báo có vòng đời: mới → đã xem → đang xử lý → đã đóng (kèm lý do) hoặc
  tự hết khi tình trạng nguồn hết.
- AI executive summary theo yêu cầu: đề xuất điểm nghẽn/rủi ro kèm link
  evidence; mọi action đề xuất phải con người xác nhận mới thực thi.
- Export CSV/PDF chỉ chứa dữ liệu trong scope; mỗi lượt export ghi audit
  (ai, kỳ nào, loại báo cáo).
- Hiển thị độ tươi dữ liệu ("dữ liệu cập nhật đến {giờ}") để người xem biết
  số liệu tới đâu.

### P1 — should have

- Gửi báo cáo định kỳ qua email theo scope của từng người nhận.
- So sánh với kỳ trước (trend lên/xuống trên từng KPI).
- Ngưỡng cảnh báo tùy chỉnh riêng theo đơn vị (admin duyệt).
- Người xem lưu bộ lọc hay dùng thành "khung báo cáo" cá nhân.

### P2 — nice to have

- Report builder tùy biến (chọn chỉ số, bố cục).
- Báo cáo liên domain (ngoài cam kết v1).
- Dự báo/benchmark giữa các đơn vị.

## 5. Core Flows (Happy Path)

### 5.1 Xem dashboard theo phạm vi và drill evidence

1) Quản lý mở mục "Báo cáo" → hệ thống xác định data-scope của người xem
   (đơn vị/phạm vi quản lý) → hiển thị KPI mặc định của kỳ hiện tại.
2) Người xem đổi kỳ và filter phòng ban/vị trí trong scope → hệ thống tổng
   hợp lại số liệu + cảnh báo đang mở.
3) Click một KPI hoặc cảnh báo → hệ thống mở danh sách entity nguồn
   (application/task/bài test) trong scope làm evidence.
4) Nếu tổng hợp rơi vào nhóm nhỏ hơn ngưỡng tối thiểu → hệ thống ẩn số liệu,
   hiển thị "không đủ dữ liệu để hiển thị".

```
Người xem (quản lý/lãnh đạo)     Hệ thống báo cáo              Nguồn nghiệp vụ
─────────────────────────────────────────────────────────────────────────────────
Mở "Báo cáo"
        │
        ▼
┌──────────────────────────┐
│ Xác định data-scope của  │
│ người xem (org-governance)│
└───────────┬──────────────┘
            ▼
   ── Có phạm vi dữ liệu? ──┐
   │                        │
 Không ▼                  Có ▼
 Hiển thị "Bạn chưa   ┌────────────────────────┐    tổng hợp từ pipeline,
 được gán phạm vi     │ Tổng hợp KPI kỳ hiện   │◀─── kanban, assessment
 xem báo cáo"         │ tại + cảnh báo đang mở │     theo scope
                     └───────────┬────────────┘
                                 ▼
              ── Filter/nhóm < ngưỡng tối thiểu? ──┐
              │                                    │
            Có ▼                                 Không ▼
      Ẩn ô số liệu:                        Hiện KPI + cảnh báo
      "Không đủ dữ liệu                    + độ tươi dữ liệu
      để hiển thị"                              │
                                                ▼
                                  Người xem click KPI/cảnh báo
                                                │
                                                ▼
                                  ┌────────────────────────┐
                                  │ Drill evidence: danh   │
                                  │ sách entity nguồn      │
                                  │ (chỉ trong scope)      │
                                  └───────────┬────────────┘
                                              ▼
                                  Người xem chọn action xử lý
                                  (tạo task / giao lại / bỏ qua
                                   có lý do) → ghi audit
```

### 5.2 Cảnh báo quá hạn → con người xác nhận action

1) Hệ thống phát hiện entity vượt ngưỡng (application ở một trạng thái quá
   ngưỡng ngày, task quá hạn, bài test sắp hết hạn chưa làm).
2) Tạo cảnh báo trạng thái "mới" trên dashboard + gửi thông báo tới người có
   scope (qua `contextual-notifications`).
3) Người nhận mở cảnh báo → xem evidence → chọn action: tạo task xử lý, giao
   lại owner, snooze có lý do, hoặc đóng có lý do.
4) Hệ thống ghi audit action; cảnh báo chuyển "đang xử lý" → "đã đóng"; nếu
   tình trạng nguồn tự hết (task được xong, application chuyển trạng thái) →
   cảnh báo "tự hết" vẫn giữ trong lịch sử.

### 5.3 AI executive summary có evidence

1) Người xem bấm "Tóm tắt AI" trên dashboard.
2) Hệ thống sinh summary từ dữ liệu trong scope: điểm nghẽn, xu hướng đáng
   chú ý, rủi ro cần kiểm tra — mỗi nhận định kèm link evidence nguồn.
3) Summary hiển thị kèm nhãn "đề xuất của AI — cần kiểm tra evidence".
4) Người xem chọn từng đề xuất action (vd "giao lại owner cho 3 application
   kẹt") → xác nhận mới thực thi; không chọn thì summary chỉ là tham khảo.

### 5.4 Export báo cáo trong scope

1) Người xem chọn scope/kỳ → "Xuất báo cáo" → chọn CSV hoặc PDF.
2) Hệ thống kiểm tra quyền export + scope dữ liệu → sinh file → ghi audit
   lượt export (ai, kỳ, loại, số dòng).
3) File sẵn sàng trong danh sách "báo cáo đã xuất" để tải trong thời hạn lưu
   giữ; hết hạn file tự xóa.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Người xem có data-scope hợp lệ? | Tổng hợp KPI theo scope | Hiển thị "chưa được gán phạm vi", không tải dữ liệu |
| D2 | 5.1 | Nhóm/filter sau scope có ít hơn ngưỡng tối thiểu? | Ẩn số liệu, "không đủ dữ liệu để hiển thị" | Hiện số liệu bình thường |
| D3 | 5.2 | Entity vượt ngưỡng cảnh báo? | Tạo cảnh báo "mới" + thông báo người có scope | Chỉ cập nhật KPI |
| D4 | 5.2 | Tình trạng nguồn đã hết trước khi ai xử lý? | Cảnh báo → "tự hết", giữ lịch sử | Giữ nguyên "mới" |
| D5 | 5.3 | AI summary đề xuất action? | Hiện đề xuất + evidence; chỉ thực thi khi người xem xác nhận | Summary chỉ để đọc |
| D6 | 5.4 | Người xem có quyền export trên scope đã chọn? | Sinh file + audit | Từ chối + thông báo thiếu quyền |
| D7 | 5.4 | File export quá hạn lưu giữ? | Tự xóa file, giữ audit lượt export | Giữ file |

### 6.2 Scenario Matrix

| Vai trò | Phạm vi dữ liệu | Xem KPI | Drill evidence | Export | Cấu hình ngưỡng |
|---|---|---|---|---|---|
| Lãnh đạo / Head of HR | toàn tổ chức | ✓ | ✓ (mọi đơn vị) | ✓ | — |
| Quản lý | đơn vị mình quản lý | ✓ | ✓ (trong scope) | ✓ (trong scope) | đề xuất, admin duyệt |
| HR | theo phạm vi được phân công | ✓ | ✓ (trong scope) | ✓ | — |
| Admin | cấu hình, không mặc định xem số liệu nghiệp vụ | chỉ màn cấu hình | — | — | ✓ |
| Nhân viên / Ứng viên | — | — | — | — | — |

### 6.3 State Transitions

```
cảnh-báo: mới → đã-xem → đang-xử-lý → đã-đóng
   │           │            │
   │           │            └─ snooze có lý do → tạm-hoãn → mới (hết snooze)
   └───────────┴── tình trạng nguồn hết ──▶ tự-hết
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| cảnh-báo | — | mới | entity vượt ngưỡng | — |
| cảnh-báo | mới | đã-xem | người có scope mở cảnh báo | — |
| cảnh-báo | đã-xem | đang-xử-lý | người xem chọn action (tạo task/giao lại) | — |
| cảnh-báo | đã-xem | tạm-hoãn | snooze kèm lý do + mốc hẹn | có (hết hạn → mới) |
| cảnh-báo | đang-xử-lý/tạm-hoãn | đã-đóng | người xem đóng kèm lý do | không |
| cảnh-báo | mới/đã-xem | tự-hết | tình trạng nguồn hết trước khi xử lý | không |
| file-export | — | sẵn-sàng | sinh file xong | — |
| file-export | sẵn-sàng | đã-xóa | hết hạn lưu giữ | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Nguồn nghiệp vụ (kanban/pipeline) không trả dữ liệu kịp | KPI phần lỗi hiển thị "chưa cập nhật", phần còn lại vẫn hiện | Tự tổng hợp lại khi nguồn phục hồi; độ tươi dữ liệu báo rõ | Không dùng số cũ giả làm số mới |
| User đóng trình duyệt khi export đang chạy | Job export tiếp tục nền | File hiện trong "báo cáo đã xuất" khi xong | File hết hạn tự xóa |
| AI summary timeout/lỗi | Dashboard KPI thường vẫn hiển thị | User bấm lại "Tóm tắt AI" | Không lưu summary lỗi |
| 2 người cùng xử lý 1 cảnh báo | Cảnh báo có 1 trạng thái chung | Người sau thấy trạng thái mới nhất + ai đã action | Cảnh báo trùng action → giữ action đầu, ghi chú action sau |
| Email báo cáo định kỳ gửi lỗi | Lịch gửi còn nguyên | Retry theo policy email | FAILED → báo admin |

### 6.5 Other Edge Cases

- Quản lý chưa được gán đơn vị → dashboard trống với hướng dẫn liên hệ admin.
- Quản lý kiêm nhiệm 2 đơn vị → scope là hợp của 2 đơn vị; filter cho tách từng
  đơn vị (xem OQ-4).
- Dữ liệu nguồn bị sửa lại sau khi đã tổng hợp (task đổi hạn, application bị
  khôi phục) → tổng hợp lại ở lần refresh kế; cảnh báo đã đóng không mở lại.
- Cảnh báo quá nhiều cùng lúc → nhóm theo loại + đơn vị, ưu tiên mức độ quá
  ngưỡng cao nhất.
- Người xem cố drill evidence ngoài scope qua link dán tay → hệ thống từ chối
  theo quyền entity (không phụ thuộc màn báo cáo).
- Empty state kỳ đầu tiên (chưa có dữ liệu nguồn) → hiển thị "Chưa có dữ liệu
  trong kỳ này".

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Kỳ báo cáo | từ-ngày ≤ đến-ngày; khoảng tối đa 12 tháng (đề xuất — chờ duyệt) |
| Filter phòng/vị trí | chỉ chọn trong scope người xem; chọn ngoài scope → lọc bỏ |
| Ngưỡng cảnh báo | số nguyên dương (ngày/giờ tùy loại); do admin hoặc quản lý được ủy quyền đặt |
| Quyền export | role được cấp export + dữ liệu yêu cầu nằm trong scope |
| Snooze cảnh báo | bắt buộc lý do + mốc hẹn; mốc hẹn tối đa 14 ngày (đề xuất — chờ duyệt) |
| Đóng cảnh báo | bắt buộc chọn lý do từ danh sách (đã xử lý / không còn liên quan / báo sai ngưỡng) |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Ngưỡng nhóm tối thiểu để hiện số liệu | 5 người/bản ghi (đề xuất — chờ duyệt) | mỗi ô tổng hợp | Ẩn số liệu: "không đủ dữ liệu để hiển thị" |
| Ngưỡng mặc định application kẹt | 5 ngày ở một trạng thái (đề xuất — chờ duyệt) | — | Tạo cảnh báo mới |
| Ngưỡng mặc định task quá hạn | quá hạn > 0 ngày | — | Tạo cảnh báo ngay khi quá hạn |
| Snooze tối đa | 14 ngày (đề xuất — chờ duyệt) | mỗi lần snooze | Chặn, báo chọn mốc ngắn hơn |
| Retention file export | 30 ngày (đề xuất — chờ duyệt) | rolling | Tự xóa file, giữ audit |
| Số dòng tối đa một file export | 10.000 dòng (đề xuất — chờ duyệt) | mỗi lượt | Chặn + gợi ý thu hẹp filter |
| Email báo cáo định kỳ | tối đa 1 lần/ngày/người nhận (đề xuất — chờ duyệt) | mỗi ngày | Gộp các báo cáo cùng kỳ |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Chưa được gán phạm vi | "Bạn chưa được gán phạm vi xem báo cáo — liên hệ quản trị viên" | E-? |
| Không có quyền export | "Bạn không có quyền xuất báo cáo trên phạm vi này" | E-? |
| Export vượt giới hạn | "Báo cáo vượt quá 10.000 dòng — hãy thu hẹp bộ lọc hoặc chia nhỏ kỳ" | E-? |
| Không tổng hợp được số liệu | "Chưa tải được số liệu {tên nhóm} — dữ liệu sẽ tự cập nhật lại" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Export xong | "Báo cáo {tên} đã sẵn sàng — tải trong mục Báo cáo đã xuất" |
| Đóng cảnh báo | "Đã đóng cảnh báo — lý do: {lý do}" |
| Tạo task từ cảnh báo | "Đã tạo việc xử lý và giao cho {người nhận}" |
| Snooze | "Đã tạm hoãn cảnh báo tới {ngày}" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Cảnh báo application kẹt | "{N} application đang ở \"{trạng thái}\" quá {X} ngày trong {đơn vị}" |
| Cảnh báo task quá hạn | "{N} công việc trong {đơn vị} đã quá hạn" |
| Nhóm nhỏ bị ẩn | "Không đủ dữ liệu để hiển thị (nhóm nhỏ hơn {N})" |
| Độ tươi dữ liệu | "Dữ liệu cập nhật đến {HH:mm DD/MM}" |
| Nhãn AI summary | "Tóm tắt do AI đề xuất — kiểm tra evidence trước khi hành động" |
| Cảnh báo tự hết | "Cảnh báo đã tự đóng vì tình trạng không còn" |
| Empty state | "Chưa có dữ liệu trong kỳ này" |

## 8. Assumptions

- Data-scope (đơn vị/phạm vi quản lý) đã được `org-governance` cung cấp nhất
  quán cho mọi module nguồn.
- Các module nguồn (`candidate-pipeline`, `kanban-workspaces`,
  `candidate-assessment`, `assessment-grading`) đã phát sinh trạng thái, owner
  và hạn đầy đủ để tổng hợp.
- `contextual-notifications` sẵn sàng làm kênh đẩy cảnh báo tới người có scope.
- Nền AI của nền tảng sẵn có cho executive summary; summary luôn kèm evidence
  và không tự thực thi action.
- Quyền export là quyền riêng, không mặc định đi kèm quyền xem.
- Audit boundary sẵn có để ghi lượt export và action trên cảnh báo.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Aggregate làm lộ dữ liệu ngoài scope hoặc cho suy diễn cá nhân (nhóm nhỏ) | thỉnh thoảng | vi phạm phạm vi quyền, complaint nhân viên, mất trust | mọi số liệu qua scope filter; ngưỡng nhóm tối thiểu; drill evidence chặn theo quyền entity |
| AI summary sai/lệch nhưng được đọc như kết luận | thỉnh thoảng | quyết định quản lý sai hướng | mọi nhận định kèm link evidence; nhãn "đề xuất — cần kiểm tra"; action phải con người xác nhận |
| Ngưỡng mặc định không hợp từng đơn vị → quá nhiều cảnh báo | thường | alert fatigue, cảnh báo bị bỏ qua, mất giá trị | ngưỡng cấu hình được theo đơn vị; snooze/đóng bắt buộc lý do để đo chất lượng cảnh báo |
| Số liệu nguồn trễ/thiếu → báo cáo sai kỳ vọng lãnh đạo | thỉnh thoảng | lãnh đạo quyết định trên số liệu cũ | hiển thị độ tươi dữ liệu; KPI lỗi nguồn báo "chưa cập nhật" thay vì số cũ |
| Export bị chia sẻ ngoài scope dự kiến | thỉnh thoảng | lộ dữ liệu nhân sự/tuyển dụng ra ngoài | export chỉ trong scope + audit lượt export + file tự xóa sau retention |
| Báo cáo bị dùng để đánh giá cá nhân ngoài mục đích vận hành | thỉnh thoảng | biến công cụ vận hành thành công cụ kỷ luật | wording trung lập, ẩn số liệu nhóm nhỏ, chính sách sử dụng báo cáo (OQ-6) |

## 10. Success Criteria (preliminary)

- Tỷ lệ cảnh báo dẫn tới action được con người xác nhận — target chờ chốt
  (OQ-5).
- Lãnh đạo tự lấy được số liệu tổng hợp mà không cần nhờ HR tổng hợp tay.
- 0 sự cố xác nhận xem/xuất dữ liệu vượt phạm vi quyền.
- 100% action từ cảnh báo và lượt export có audit truy vết được.

## 11. Open Questions

- [ ] OQ-1: Bộ KPI mặc định của v1 gồm những chỉ số nào (đề xuất: application
  kẹt, task quá hạn, bài test sắp hết hạn, tỷ lệ hoàn thành đúng hạn)?
- [ ] OQ-2: Ngưỡng cảnh báo mặc định cho từng loại (application kẹt bao
  ngày, bài test nhắc trước hạn bao lâu)?
- [ ] OQ-3: Ngưỡng nhóm tối thiểu để hiển thị số liệu tổng hợp — đề xuất 5,
  cần duyệt theo chính sách privacy?
- [ ] OQ-4: Quản lý kiêm nhiệm nhiều đơn vị — scope gộp hay bắt chọn từng
  đơn vị khi xem?
- [ ] OQ-5: Target định lượng cho "tỷ lệ cảnh báo dẫn tới action được xác
  nhận"? Kế thừa OQ-2 sản phẩm (North Star/target chưa được sponsor duyệt).
- [ ] OQ-6: Có cần chính sách "báo cáo vận hành không dùng để đánh giá/kỷ
  luật cá nhân" được công bố kèm dashboard không?
- [ ] OQ-7: Retention cho file export và log audit lượt export (đề xuất 30
  ngày file, audit theo chính sách chung — kế thừa OQ-6 sản phẩm)?

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd management-reporting` — capture user perspective
- `/brd management-reporting` — business case
- `/prd-epic management-reporting` — product scope
