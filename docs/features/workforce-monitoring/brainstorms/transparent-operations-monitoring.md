---
type: brainstorm
feature: workforce-monitoring
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md]
---

# Theo dõi vận hành nhân viên minh bạch — workforce-monitoring

## 1. Idea Seed

Một lớp quan sát vận hành **minh bạch**: hệ thống tổng hợp progress, overdue,
workload và các sự kiện quy trình đã được công bố trong chính sách, hiển thị
cho quản lý trong đúng phạm vi quyền, đồng thời cho nhân viên xem dữ liệu
liên quan đến chính mình khi policy cho phép. Mọi cảnh báo chỉ là tín hiệu để
con người review — không phải công cụ kỷ luật tự động, không giám sát bí mật.

## 2. Context

Quản lý hiện phát hiện gián đoạn công việc muộn — qua tổng hợp tay, hỏi trực
tiếp hoặc khi đã lỡ hạn; còn nhân viên không biết dữ liệu nào về mình đang
được dùng để đánh giá vận hành. PRD xếp feature này **Could**: chỉ làm khi
policy minh bạch được duyệt (PRD Mục 12), và rủi ro R-10 cảnh báo rõ việc
biến cảnh báo vận hành thành giám sát bí mật xâm phạm quyền riêng tư — gate
là "không có notice/employee visibility thì cấm release". Feature chỉ đọc lại
dữ liệu công việc/quy trình đã tồn tại trong hệ thống (task, hạn, trạng thái,
bàn giao từ `kanban-workspaces`; KPI và cảnh báo từ `management-reporting`;
quyền và phạm vi từ `org-governance`) — không thu thập nguồn dữ liệu mới ngoài
chính sách đã công bố. Privacy gate PRD Mục 9 áp dụng: trước dữ liệu thật,
Product/DPO phải duyệt purpose, lawful basis, access, retention/delete,
withdrawal, legal hold và audit; khi OQ-3/OQ-6 của PRD còn mở thì chỉ dùng dữ
liệu synthetic. Đây là một trong hai feature nhạy cảm nhất về privacy của PRD
cùng với `cv-event-monitoring`, nên toàn bộ thiết kế bám nguyên tắc: công bố
trước — thu thập sau — con người xem được — con người quyết định.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Quản lý | Phát hiện task trễ, việc dồn hoặc quy trình đứng khi đã muộn; không có góc nhìn vận hành sớm trong phạm vi mình | Dashboard progress/overdue/workload theo phạm vi quyền + cảnh báo để review |
| Nhân viên | Không biết dữ liệu nào của mình đang được theo dõi và dùng cho việc gì | Đọc được policy đã công bố; xem dữ liệu liên quan đến mình khi policy cho phép; có kênh phản hồi |
| Admin | Chưa có nơi công bố policy giám sát và kiểm soát ai xem dữ liệu nào | Soạn/duyệt/công bố policy có version; cấu hình phạm vi và ngưỡng; truy vết truy cập |
| Head of HR | Cần đảm bảo theo dõi vận hành không thành công cụ kỷ luật ngầm | Phê duyệt policy trước khi bật; định kỳ xem lại complaint |
| DPO/legal (owner xác nhận) | Chưa có ai chịu trách nhiệm duyệt purpose/retention dữ liệu theo dõi | Điểm duyệt chính sách trước khi dữ liệu thật được bật (PRD R-10, liên quan OQ-12) |

## 4. Capabilities Breakdown

### P0 — must have

- **Monitoring policy là điều kiện tiên quyết**: không có policy ở trạng thái
  "Đã công bố" thì hệ thống không thu thập, tổng hợp hay hiển thị bất kỳ dữ
  liệu theo dõi nào — kể cả admin.
- Quản lý policy: soạn (loại dữ liệu được theo dõi, mục đích, ai được xem,
  phạm vi áp dụng, retention), gửi duyệt, phê duyệt, công bố, version;
  mọi thay đổi tạo version mới phải duyệt lại và công bố lại.
- Thu nhận chỉ các sự kiện quy trình đã công bố trong policy: task tạo/giao/
  cập nhật tiến độ/quá hạn/bàn giao từ dữ liệu hệ thống có sẵn — không tạo
  nguồn thu thập mới.
- Tổng hợp theo người/nhóm/phạm vi: tiến độ, số việc quá hạn, phân bố
  workload, sự kiện quy trình gần nhất.
- Dashboard quản lý theo đúng phạm vi quyền (organization/role/data-scope) —
  không drill xuống cá nhân ngoài phạm vi.
- Cảnh báo vận hành: task quá hạn quá ngưỡng, workload mất cân bằng, quy
  trình đứng (không cập nhật quá ngưỡng) — mỗi cảnh báo là tín hiệu để
  manager xác nhận và tạo action, không phải kết luận.
- Self-view cho nhân viên: xem policy đang hiệu lực + dữ liệu của chính mình
  (tiến độ, hạn, cảnh báo liên quan) khi policy cho phép.
- Access audit: ghi nhận ai xem dữ liệu theo dõi của ai, khi nào, trên surface
  nào — phục vụ điều tra complaint.
- Retention theo policy: dữ liệu sự kiện và bản tổng hợp có hạn lưu giữ đã
  công bố, tự động xóa hoặc ẩn danh hóa sau hạn.

### P1 — should have

- Cấu hình ngưỡng cảnh báo theo loại (quá hạn > n ngày, workload > n task
  đang mở/người, đứng > n ngày) theo phạm vi áp dụng.
- Kênh phản hồi/đính chính của nhân viên về dữ liệu của mình, có owner xử lý.
- Export báo cáo vận hành theo quyền, có vết audit.
- Cảnh báo chất lượng cảnh báo: loại cảnh báo lặp lại nhưng không có action
  nào được xác nhận → gợi ý chỉnh ngưỡng cho admin.

### P2 — nice to have

- So sánh workload/tiến độ giữa các kỳ.
- Đề xuất tái phân phối việc (AI suggestion — vẫn qua manager xác nhận).
- Mở rộng nguồn sự kiện sang meeting/assessment khi các feature đó sẵn sàng.

## 5. Core Flows (Happy Path)

### 5.1 Công bố policy trước khi bật monitoring

1) Admin soạn policy: chọn loại dữ liệu được theo dõi (progress, overdue,
   workload, sự kiện quy trình), phạm vi áp dụng, ai được xem, retention và
   quyền self-view của nhân viên → lưu "Bản nháp".
2) Admin gửi duyệt → policy ở "Chờ duyệt" → người có thẩm quyền (đề xuất:
   Head of HR + DPO/legal) xem và phê duyệt hoặc yêu cầu chỉnh.
3) Được duyệt → policy chuyển "Đã công bố": hiển thị công khai cho toàn bộ
   người trong phạm vi, bắt đầu hiệu lực từ ngày công bố.
4) Hệ thống chỉ bắt đầu thu nhận sự kiện và hiển thị dashboard khi đã có
   policy "Đã công bố" — mọi truy cập trước đó bị chặn với thông báo rõ lý do.
5) Thay đổi policy: tạo version mới ở "Bản nháp" → duyệt → công bố; version
   cũ chuyển "Hết hiệu lực", dữ liệu đã thu theo version cũ vẫn tuân
   retention đã công bố của version đó.

```
Admin                        Hệ thống                     Người duyệt
──────────────────────────────────────────────────────────────────────────
Soạn policy (loại dữ liệu, mục đích, ai xem, retention)
        │
        ▼
   "Bản nháp" ── sửa tự do ──┐
        │                     │
        ▼ "Gửi duyệt"         │
   "Chờ duyệt"               │
        │                     │
        ▼                     ▼
              ┌───────────────────────────────────┐
              │ Người duyệt xem policy đầy đủ      │
              └───────────────┬───────────────────┘
                              ▼
                 ── Phê duyệt? ──┐
                    │            │
                  Có ▼          Không ▼
             "Đã công bố"   "Chờ duyệt" + ghi chú
             (công khai cho   → admin chỉnh → gửi lại
              phạm vi; bật
              thu thập +
              dashboard)
                    │
                    ▼
        Sửa policy → version mới "Bản nháp" → duyệt → công bố;
        version cũ "Hết hiệu lực", retention theo version đã công bố.

Trước "Đã công bố": mọi truy cập dashboard/dữ liệu theo dõi bị chặn,
 hiện "Chưa có chính sách theo dõi nào được công bố".
```

### 5.2 Thu sự kiện hợp lệ → tổng hợp → dashboard quản lý

1) Khi có policy "Đã công bố", hệ thống ghi nhận sự kiện quy trình từ dữ
   liệu có sẵn (task tạo/giao/cập nhật/quá hạn/bàn giao) — chỉ loại sự kiện
   nằm trong danh sách đã công bố; sự kiện ngoài danh sách bị loại ngay đầu
   vào và không lưu.
2) Bộ tổng hợp cập nhật số liệu theo người/nhóm/phạm vi: tiến độ, quá hạn,
   workload đang mở, sự kiện gần nhất.
3) Manager mở dashboard → chỉ thấy phạm vi được cấp: nhóm/cá nhân thuộc quyền
   quản lý; đối chiếu cùng kỳ, drill xuống task cụ thể trong phạm vi.
4) Manager đánh dấu đã xem/đã nắm — mọi lượt xem dữ liệu cá nhân được ghi
   access audit.

### 5.3 Cảnh báo vận hành → manager xác nhận action

1) Bộ luật cảnh báo quét số liệu tổng hợp theo ngưỡng của policy: quá hạn >
   ngưỡng, workload vượt ngưỡng, quy trình đứng > ngưỡng.
2) Vượt ngưỡng → tạo cảnh báo "Mới" gửi manager phụ trách phạm vi (in-app;
   kênh ngoài nếu `contextual-notifications` cho phép).
3) Manager mở cảnh báo → xem dữ liệu nền (task nào, bao lâu, thuộc ai trong
   phạm vi) → chọn: "Xác nhận — cần xử lý" (tạo action/task trên
   `kanban-workspaces`), "Đã biết — có lý do" (ghi chú), hoặc "Cảnh báo sai"
   (đánh dấu để chỉnh ngưỡng).
4) Cảnh báo được xử lý chuyển "Đã xử lý" kèm người xác nhận, quyết định và
   lý do — cảnh báo không tự tạo kết luận hay kỷ luật nào.

### 5.4 Nhân viên xem dữ liệu của mình + phản hồi

1) Nhân viên mở "Dữ liệu vận hành của tôi" → thấy policy đang hiệu lực (loại
   dữ liệu nào được theo dõi, mục đích, ai xem, lưu bao lâu).
2) Nếu policy cho phép self-view: xem số liệu của chính mình — task đang mở,
   hạn, quá hạn, cảnh báo liên quan đến mình và trạng thái xử lý của nó.
3) Nhân viên gửi phản hồi/đính chính (vd "task đã bàn giao nhưng vẫn hiện
   quá hạn") → phản hồi đi tới owner được cấu hình trong policy, có trạng
   thái xử lý và audit.
4) Khi retention hết hạn, dữ liệu chi tiết bị xóa/ẩn danh — nhân viên thấy
   ngày dữ liệu sẽ hết hạn ngay trên màn hình của mình.

### 5.5 Tắt/tạm dừng theo dõi

1) Admin hoặc người có thẩm quyền tạm dừng một phạm vi/loại theo dõi → thu
   nhận dừng ngay, dashboard ẩn phần đó, dữ liệu đã lưu vẫn theo retention.
2) Khi policy bị thu hồi (không còn version hiệu lực): toàn bộ thu nhận và
   hiển thị dừng; dữ liệu tồn tại xử lý theo retention đã công bố; sự kiện
   tắt được audit.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | tất cả | Có policy "Đã công bố" hiệu lực không? | Cho thu nhận sự kiện, hiển thị dashboard, tạo cảnh báo | Chặn mọi thu thập/hiển thị; hiện thông báo chưa có chính sách |
| D2 | 5.1 | Người duyệt phê duyệt policy? | Chuyển "Đã công bố", công khai cho phạm vi, bắt đầu hiệu lực | Ở "Chờ duyệt" + ghi chú yêu cầu chỉnh |
| D3 | 5.2 | Sự kiện thuộc loại đã công bố trong policy? | Ghi nhận vào store sự kiện | Loại bỏ ngay, không lưu, không tổng hợp |
| D4 | 5.2/5.3 | Người xem có phạm vi quyền phủ dữ liệu này? | Hiển thị số liệu/task trong phạm vi + ghi access audit | Ẩn hoàn toàn, không tiết lộ sự tồn tại |
| D5 | 5.3 | Manager chọn hành động nào trên cảnh báo? | "Xác nhận" → tạo task xử lý; "Đã biết" → đóng kèm ghi chú; "Sai" → đánh dấu để chỉnh ngưỡng | Cảnh báo quá hạn SLA nhắc lại/escalate theo policy |
| D6 | 5.4 | Policy cho phép nhân viên self-view? | Nhân viên xem dữ liệu của mình | Chỉ hiển thị policy công bố + kênh phản hồi |
| D7 | 5.1/5.5 | Thay đổi policy có làm phạm vi thu thập rộng hơn? | Bắt buộc version mới qua duyệt + công bố lại trước khi hiệu lực | Thu hẹp phạm vi: vẫn qua version + công bố, áp dụng ngay khi công bố |
| D8 | 5.4 | Dữ liệu đã hết retention? | Tự động xóa hoặc ẩn danh hóa; giữ số liệu tổng hợp không định danh nếu policy cho phép | Vẫn hiển thị/truy vết bình thường |

### 6.2 Scenario Matrix

| Vai trò | Chưa có policy công bố | Policy chờ duyệt | Policy đã công bố | Policy bị thu hồi |
|---|---|---|---|---|
| Admin | soạn/sửa bản nháp, gửi duyệt | xem, chỉnh theo ghi chú | tạo version mới, tạm dừng phạm vi, xem access audit | xem lịch sử, soạn version mới |
| Người duyệt (Head of HR/DPO) | — | xem + duyệt/yêu cầu chỉnh | xem policy hiệu lực + complaint | xem lịch sử |
| Quản lý | không thấy gì (màn chặn) | không thấy gì | dashboard + cảnh báo trong phạm vi | không thấy gì; dữ liệu theo retention |
| Nhân viên | không thấy gì | không thấy gì | đọc policy + self-view theo policy + gửi phản hồi | đọc lịch sử policy; dữ liệu theo retention |

### 6.3 State Transitions

```
policy: bản-nháp → chờ-duyệt → đã-công-bố → hết-hiệu-lực
             ↑          │           │
             └──────────┘           └─(version mới công bố)→ hết-hiệu-lực
             (yêu cầu chỉnh)

cảnh-báo: mới → đã-xem → đã-xử-lý
                │          ├─ xác nhận → tạo task xử lý
                │          ├─ đã biết → đóng kèm ghi chú
                │          └─ cảnh báo sai → đánh dấu chỉnh ngưỡng
                └─(quá SLA, chưa xem)→ nhắc/escalate theo policy
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| policy | — | bản-nháp | admin soạn mới hoặc tạo version mới | — |
| policy | bản-nháp | chờ-duyệt | admin "Gửi duyệt" | — |
| policy | chờ-duyệt | đã-công-bố | người có thẩm quyền phê duyệt | — |
| policy | chờ-duyệt | chờ-duyệt | yêu cầu chỉnh → admin sửa → gửi lại | có (lặp) |
| policy | đã-công-bố | hết-hiệu-lực | version mới được công bố, hoặc thu hồi | không (tạo version mới) |
| cảnh-báo | — | mới | số liệu vượt ngưỡng của policy | — |
| cảnh-báo | mới | đã-xem | manager mở cảnh báo | — |
| cảnh-báo | mới/đã-xem | đã-xử-lý | manager chọn quyết định kèm lý do | không |
| cảnh-báo | mới | mới (nhắc) | quá SLA chưa xem → nhắc/escalate | có (lặp tới khi xử lý) |
| phản-hồi nhân viên | — | mới | nhân viên gửi phản hồi/đính chính | — |
| phản-hồi nhân viên | mới | đã-xử-lý | owner trả lời/ghi nhận đính chính | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Admin soạn policy dở, đóng trình duyệt | bản nháp đã lưu lần cuối | mở lại policy nháp tiếp tục | nháp không gửi duyệt giữ nguyên |
| Người duyệt mở policy chờ duyệt nhưng admin vừa sửa lại | người duyệt đang xem bản cũ | khi bấm duyệt → kiểm version, cảnh báo đã đổi | — |
| Sự kiện đến khi policy vừa hết hiệu lực | sự kiện thuộc version cũ | xử lý theo retention version cũ, không thu mới | đánh dấu nguồn dữ liệu theo policy version |
| Hai admin cùng sửa một bản nháp policy | bản lưu sau ghi đè | cảnh báo "policy vừa được {người} cập nhật — tải lại" | không merge tự động |
| Manager xử lý cảnh báo nhưng cảnh báo vừa được người khác xử lý | trạng thái đã đổi | hiện trạng thái mới + người xử lý | — |
| Job tổng hợp gián đoạn | sự kiện thô đã lưu | chạy lại tổng hợp idempotent từ sự kiện | không tạo số liệu trùng |

### 6.5 Other Edge Cases

- Tổ chức mới chưa có policy: mọi surface monitoring hiện empty state hướng
  dẫn soạn policy — tuyệt đối không có "xem thử" dữ liệu.
- Phạm vi quản lý thay đổi (đổi quản lý phòng): dashboard chỉ theo phạm vi
  hiện tại; dữ liệu cũ của phạm vi mất quyền không còn xem được, vẫn giữ
  access audit.
- Nhân viên nghỉ việc: dữ liệu theo dõi của người đó đi theo retention như
  thường; không tự xóa sớm, không giữ lâu hơn policy.
- Policy chỉ cho phép số liệu nhóm (không cho self-view cá nhân): nhân viên
  vẫn đọc được policy + gửi phản hồi, dashboard của họ chỉ hiện thông tin
  policy.
- Cảnh báo trùng cho cùng tình trạng: gộp theo đối tượng + loại + chu kỳ,
  không spam cảnh báo mới khi cảnh báo cũ chưa xử lý.
- Sự kiện đến sai thứ tự thời gian (task đóng trước khi event tạo được ghi):
  tổng hợp tính theo thời điểm sự kiện, không theo thứ tự nhận.
- Export chứa dữ liệu cá nhân: chỉ vai trò được cấp trong policy mới export
  được; lượt export ghi access audit.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tên policy | bắt buộc, tối đa 200 ký tự |
| Loại dữ liệu theo dõi | bắt buộc ≥1, chỉ trong danh mục: tiến độ task, quá hạn, workload, sự kiện quy trình đã công bố |
| Mục đích sử dụng | bắt buộc, tối đa 1.000 ký tự, mô tả rõ bằng ngôn ngữ nhân viên đọc được |
| Phạm vi áp dụng | bắt buộc ≥1 đơn vị/nhóm thuộc tổ chức |
| Vai trò được xem | bắt buộc ≥1 vai trò; phải map qua `org-governance` |
| Retention sự kiện chi tiết | bắt buộc, 7–365 ngày (đề xuất mặc định 90 ngày — xem OQ-2) |
| Quyền self-view | bắt buộc khai báo: cho phép / chỉ số liệu nhóm |
| Gửi duyệt | chỉ khi đủ trường bắt buộc |
| Lý do xử lý cảnh báo | bắt buộc khi "Xác nhận" hoặc "Đã biết"; tối đa 500 ký tự |
| Phản hồi nhân viên | bắt buộc nội dung, tối đa 1.000 ký tự |
| Ngưỡng cảnh báo | số nguyên dương; quá hạn theo ngày, workload theo số task, đứng theo ngày |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Retention sự kiện chi tiết | 90 ngày (đề xuất — xem OQ-2) | từ thời điểm sự kiện | tự động xóa/ẩn danh hóa |
| Retention số liệu tổng hợp ẩn danh | 13 tháng (đề xuất — xem OQ-2) | theo kỳ tháng | tự động xóa |
| SLA xử lý cảnh báo | 3 ngày làm việc (đề xuất — xem OQ-4) | từ khi tạo cảnh báo | nhắc manager; sau 2 lần nhắc escalate theo policy |
| Ngưỡng mặc định "task quá hạn" | 3 ngày (đề xuất — xem OQ-4) | mỗi task | tạo cảnh báo |
| Ngưỡng mặc định "workload" | 15 task đang mở/người (đề xuất — xem OQ-4) | theo ngày | tạo cảnh báo |
| Ngưỡng mặc định "quy trình đứng" | 7 ngày không cập nhật (đề xuất — xem OQ-4) | mỗi luồng việc | tạo cảnh báo |
| Gộp cảnh báo trùng | 1 cảnh báo mở / đối tượng / loại | — | không tạo thêm khi đã có cảnh báo mở cùng loại |
| Số dòng dashboard hiển thị | 50 dòng/trang | — | phân trang |
| Giới hạn nội dung phản hồi | 1.000 ký tự | mỗi phản hồi | chặn gửi, báo số ký tự |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Truy cập khi chưa có policy công bố | "Chưa có chính sách theo dõi vận hành nào được công bố — dữ liệu chưa được thu thập" | E-? |
| Gửi duyệt policy thiếu trường | "Vui lòng điền đủ thông tin bắt buộc trước khi gửi duyệt: {danh sách field}" | E-? |
| Xem dữ liệu ngoài phạm vi | "Dữ liệu này nằm ngoài phạm vi quản lý của bạn" | E-? |
| Self-view bị tắt bởi policy | "Chính sách hiện tại chỉ cho phép xem số liệu nhóm — bạn có thể gửi phản hồi nếu cần" | E-? |
| Xử lý cảnh báo thiếu lý do | "Vui lòng nhập lý do trước khi xác nhận xử lý cảnh báo" | E-? |
| Export ngoài quyền policy | "Chính sách hiện tại không cho phép vai trò của bạn xuất dữ liệu này" | E-? |
| Ngưỡng cấu hình không hợp lệ | "Ngưỡng phải là số nguyên dương — kiểm tra lại giá trị đã nhập" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Gửi duyệt policy | "Chính sách đã gửi cho người duyệt — theo dõi chỉ bắt đầu sau khi được công bố" |
| Policy được công bố | "Chính sách đã được công bố và có hiệu lực — dữ liệu sẽ được thu thập theo đúng phạm vi đã công bố" |
| Xử lý cảnh báo | "Đã ghi nhận quyết định của bạn cho cảnh báo này" |
| Gửi phản hồi | "Phản hồi của bạn đã được gửi tới {đơn vị/người phụ trách}" |
| Tạm dừng phạm vi | "Đã tạm dừng thu thập cho {phạm vi} — dữ liệu đã lưu vẫn theo thời hạn đã công bố" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Banner trên dashboard | "Dữ liệu trên trang này thu thập theo chính sách '{tên policy}' phiên bản {n} — công bố ngày {ngày}" |
| Self-view header | "Đây là dữ liệu vận hành liên quan đến bạn, thu thập theo chính sách đã công bố — xem chi tiết chính sách" |
| Cảnh báo mới | "Có {n} cảnh báo vận hành mới cần xem xét — cảnh báo là tín hiệu để kiểm tra, không phải kết luận" |
| Hết hạn retention | "Dữ liệu chi tiết trước {ngày} đã được xóa theo chính sách lưu giữ" |
| Policy sắp đổi | "Chính sách theo dõi sẽ đổi từ {ngày} — xem phiên bản mới để biết thay đổi" |
| Phản hồi được xử lý | "Phản hồi của bạn đã được xử lý: {kết quả}" |

## 8. Assumptions

- Người duyệt policy là Head of HR kèm xác nhận DPO/legal — bám owner của
  rủi ro R-10 ("Product + DPO/legal nominee") và mô hình OQ-12 của PRD;
  chờ xác nhận chính thức (OQ-1).
- Nguồn sự kiện v1 chỉ đến từ dữ liệu `kanban-workspaces` (task, hạn, trạng
  thái, bàn giao) và số liệu `management-reporting` đã có — không tạo agent
  thu thập mới, không đọc email/chat/thiết bị.
- Self-view mặc định được bật trong policy v1 (nhân viên xem được dữ liệu
  của mình) vì PRD nêu rõ "cho nhân viên xem dữ liệu liên quan đến mình khi
  policy cho phép" — tổ chức có thể chọn chế độ "chỉ số liệu nhóm" nhưng
  phải khai báo tường minh trong policy.
- Cảnh báo không tự động tạo hành động kỷ luật và không được trình bày như
  đánh giá hiệu suất cá nhân — đây là invariant từ PRD Mục 12 và "Chưa làm"
  của Mục 7.29.
- Ngưỡng và retention ở Mục 7.2 là giá trị đề xuất thận trọng — cần owner
  chốt (OQ-2, OQ-4); trước khi chốt chỉ chạy trên dữ liệu synthetic theo
  privacy gate PRD Mục 9.
- Access audit của feature này dùng chung hạ tầng audit của `org-governance`
  — feature không tự xây audit store riêng.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Cảnh báo vận hành bị dùng như công cụ kỷ luật/đánh giá ngầm → complaint privacy, mất niềm tin (R-10) | thỉnh thoảng | khiếu nại nhân viên, pháp lý, hủy pilot | gate "không policy công bố thì không thu thập"; wording cảnh báo luôn nói "tín hiệu để kiểm tra"; cấm suy luận phẩm chất; audit mọi lượt xem |
| Policy được soạn nhưng không ai đọc → "minh bạch trên giấy" | thường | nhân viên vẫn cảm thấy bị theo dõi bí mật | policy bắt buộc hiển thị công khai trong sản phẩm + banner nêu version trên dashboard + self-view |
| Chỉ quản lý xem được còn nhân viên không → mất cân đối, complaint | thỉnh thoảng | mất niềm tin, bị coi là surveillance | self-view mặc định bật; policy phải khai báo tường minh nếu tắt; kênh phản hồi |
| Ngưỡng cảnh báo sai → spam cảnh báo, manager bỏ qua | thường | cảnh báo không có action, mất giá trị | gộp trùng, đo tỷ lệ cảnh báo có action, cơ chế "cảnh báo sai" để chỉnh ngưỡng |
| Dữ liệu giữ quá retention → vi phạm chính sách đã công bố | thỉnh thoảng | vi phạm cam kết privacy, rủi ro pháp lý | retention bắt buộc trong policy, tự động xóa/ẩn danh, kiểm tra định kỳ |
| Truy cập dữ liệu cá nhân ngoài phạm vi → incident vượt quyền (M-GR-01) | thỉnh thoảng | sự cố bảo mật, mất uy tín | deny-by-default theo data-scope, access audit, guardrail 0 incident |
| Feature bị triển khai trước khi policy duyệt → vi phạm gate R-10 | hiếm | phải rollback, mất niềm tin sponsor | gate kỹ thuật D1 chặn tuyệt đối; release checklist bắt buộc policy "Đã công bố" |

## 10. Success Criteria (preliminary)

- Tỷ lệ cảnh báo vận hành có action được manager xác nhận — theo định hướng
  "cảnh báo có action hữu ích" của PRD Mục 7.29; con số target chờ OQ-2 PRD.
- 0 privacy complaint được xác nhận liên quan theo dõi (guardrail — bám
  R-10 và M-GR-01).
- 100% sự kiện thu nhận thuộc loại đã công bố trong policy hiệu lực.
- 100% policy hiệu lực có người duyệt, ngày công bố và version.
- Tỷ lệ nhân viên trong phạm vi đã mở trang policy/self-view — đo mức độ
  "được thông báo" thực tế (chỉ số đề xuất).

## 11. Open Questions

- [x] OQ-1: Ai duyệt policy theo dõi vận hành? — Resolved (đề xuất): Head of
  HR phê duyệt nghiệp vụ + DPO/legal xác nhận purpose/retention trước khi
  công bố — chờ Head of HR và DPO/legal xác nhận (bám owner R-10 PRD và mô
  hình OQ-12 PRD).
- [x] OQ-2: Retention cho sự kiện chi tiết và số liệu tổng hợp là bao lâu? —
  Resolved (đề xuất): sự kiện chi tiết 90 ngày, tổng hợp ẩn danh 13 tháng,
  khai báo tường minh trong từng policy — chờ DPO/legal xác nhận (liên quan
  OQ-6 PRD).
- [x] OQ-3: Nhân viên được xem những dữ liệu nào của mình? — Resolved (đề
  xuất): mặc định xem đầy đủ dữ liệu vận hành của chính mình khi policy cho
  phép (chế độ "chỉ số liệu nhóm" là tùy chọn phải khai báo trong policy) —
  chờ DPO/legal xác nhận.
- [x] OQ-4: Ngưỡng cảnh báo mặc định và SLA xử lý cảnh báo? — Resolved (đề
  xuất): quá hạn 3 ngày, workload 15 task đang mở, đứng 7 ngày, SLA xử lý 3
  ngày làm việc — chờ Product owner + Head of HR xác nhận (liên quan OQ-2
  PRD về target).
- [x] OQ-5: Nguồn sự kiện v1 ngoài `kanban-workspaces` có gì không? —
  Resolved: chỉ sự kiện quy trình/task đã có trong hệ thống (kanban +
  số liệu management-reporting); mở rộng nguồn khác là P2 (PRD Mục 7.29
  "Phạm vi v1: chỉ dữ liệu công việc/quy trình trong hệ thống").
- [~] OQ-6: Có cho export dữ liệu theo dõi ra ngoài hệ thống không? — Out of
  scope v1: export là P1 và chỉ cho vai trò được cấp trong policy; tích hợp
  xuất báo cáo liên domain thuộc roadmap mở rộng của `management-reporting`.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd workforce-monitoring` — capture user perspective
- `/brd workforce-monitoring` — business case
- `/prd-epic workforce-monitoring` — product scope
