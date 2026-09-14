---
type: brainstorm
feature: employee-onboarding
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/recruitment-and-interviews/reverse-spec.md]
---

# Chuyển đổi ứng viên thành nhân viên + checklist onboarding — employee-onboarding

## 1. Idea Seed

Khi ứng viên chấp nhận offer, một "hồ sơ onboarding" được tạo tự động: hệ
thống kéo dữ liệu từ offer + CV đã xác nhận để khởi tạo hồ sơ nhân viên
(không nhập lại), sinh checklist chuẩn bị theo nhóm (giấy tờ, thiết bị, tài
khoản, đào tạo) — mỗi việc có owner và hạn rõ ràng, có người xác nhận hoàn
tất, và case chỉ đóng khi checklist xong đúng trước ngày bắt đầu.

## 2. Context

Sau khi ứng viên nhận offer, việc chuẩn bị ngày đầu rải rác qua email/chat:
HR nhắc từng người, giấy tờ thiếu không ai hay, thiết bị/tài khoản cấp chậm,
nhân viên mới đến mà chưa có gì sẵn sàng. PRD Mục 7.12 đặt feature này là bước
cuối của hành trình tuyển dụng: `offer-management` (chấp nhận) → tạo hồ sơ
nhân viên ở `employee-profiles` → checklist có owner/hạn → đóng → application
sang `ONBOARDED` trên `candidate-pipeline`.

PRD xếp feature ở mức **Should** — KHÔNG thuộc cam kết lát cắt v1; là slice
mở rộng hire-to-onboard. Bằng chứng nguồn (reverse spec `recruitment-and-
interviews`, FR-RC-07): onboarding đòi "joined date" và "active employee
conversion" — tức chuyển đổi phải gắn ngày nhận việc và hồ sơ nhân viên đã
kích hoạt, không chỉ đổi trạng thái.

Nguyên tắc bất biến: việc giao cho con người, xác nhận hoàn tất bởi con
người; không tự cấp quyền hệ thống ngoài khi chưa tích hợp (PRD "Chưa làm");
dữ liệu giấy tờ nhân viên theo consent/access/retention.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| HR | Chuyển đổi ứng viên→nhân viên nhập lại tay; checklist onboarding quản bằng chat, task không có owner, quá hạn không ai biết | Conversion có prefill + checklist tự sinh, mỗi việc có owner/hạn, thấy tiến độ một nơi |
| Nhân viên mới | Đến ngày đầu mà chưa biết cần nộp gì, thiết bị/tài khoản chưa có | Biết rõ việc của mình trong checklist, được nhắc đúng hạn |
| Assignee (IT, hành chính, quản lý trực tiếp) | Được nhờ cấp thiết bị/tài khoản qua tin nhắn, không có hạn rõ | Task có hạn + context nhân viên mới, xác nhận xong một chạm |
| Quản lý | Không biết người mới vào team mình đã sẵn sàng chưa | Xem tiến độ onboarding của người trong scope |
| Admin | Cần biết ai xác nhận task nào, khi nào | Audit hoàn tất checklist |

## 4. Capabilities Breakdown

### P0 — must have

- Tạo hồ sơ onboarding (case) khi offer được chấp nhận — tự động từ sự kiện
  `offer-management` hoặc HR tạo tay trên application `ACCEPTED`; 1 case mở
  mỗi application.
- Conversion: khởi tạo hồ sơ nhân viên ở `employee-profiles` với prefill từ
  CV đã xác nhận + offer (tên, liên hệ, vị trí, phòng ban, ngày bắt đầu);
  case gắn ngày nhận việc (joined date) bắt buộc.
- Checklist có cấu trúc: task theo nhóm (giấy tờ / thiết bị / tài khoản /
  đào tạo / khác), mỗi task có tiêu đề, owner (assignee), hạn; task mặc định
  từ mẫu theo vị trí + task HR thêm tay.
- Mọi task bắt buộc có assignee và hạn — không cho task "không chủ"; hạn mặc
  định trước ngày bắt đầu (offset từ mẫu).
- Assignee xác nhận hoàn tất task (kèm ghi chú tùy chọn); HR có thể giao lại,
  đổi hạn, hủy task kèm lý do.
- Tiến độ case: % task hoàn tất, danh sách task quá hạn, cảnh báo task sắp
  tới hạn/ngày bắt đầu.
- Đóng case: chỉ khi mọi task bắt buộc hoàn tất (hoặc hủy có lý do) VÀ hồ sơ
  nhân viên đã kích hoạt → phát sự kiện để `candidate-pipeline` chuyển
  `ONBOARDED`; nếu còn thiếu thì liệt kê điều kiện chưa đạt.
- Hủy case: khi ứng viên không nhận việc/offer thu hồi — kèm lý do, task đang
  mở chuyển "Đã hủy".
- Nhân viên mới (khi đã có tài khoản) xem được phần việc của mình trong
  checklist.
- Audit: ai tạo case, giao task, xác nhận, đổi hạn, hủy, đóng.

### P1 — should have

- Mẫu checklist theo vị trí/đơn vị do HR quản lý (thêm/sửa mục, offset hạn
  mặc định trước ngày bắt đầu); case mới áp dụng mẫu phù hợp.
- Nhắc tự động cho assignee khi task sắp/quá hạn (qua
  `contextual-notifications`).
- Task giao cho chính nhân viên mới (ví dụ "nộp giấy tờ", "đọc quy định")
  hiển thị trong surface của nhân viên sau khi có tài khoản.
- Đính kèm tài liệu vào task (giấy tờ mẫu, quy định cần đọc) từ
  `document-library`.
- Reopen case đã đóng trong thời hạn khi phát hiện thiếu (ghi lý do).

### P2 — nice to have

- Tự cấp tài khoản/quyền trên hệ thống ngoài (email, chat, VPN) khi
  `external-integrations` sẵn — PRD "Chưa làm" trong v1.
- Đào tạo đầu vào có nội dung/bài test từ `assessment-authoring`.
- Báo cáo onboarding: thời gian hoàn tất trung bình, task hay trễ theo nhóm.

## 5. Core Flows (Happy Path)

### 5.1 Offer chấp nhận → tạo case + checklist

1) Offer chuyển "Đã chấp nhận" (`offer-management`) → hệ thống nhận sự kiện →
   tạo case onboarding ở "Mới tạo", gắn application + offer, prefill ứng
   viên/vị trí/ngày bắt đầu từ offer.
2) Case áp dụng mẫu checklist theo vị trí → sinh task với assignee + hạn mặc
   định (offset trước ngày bắt đầu); HR gán owner case + bổ sung/điều chỉnh
   task.
3) HR xác nhận "Bắt đầu onboarding" → case "Đang thực hiện"; task phát cho
   assignee kèm thông báo; đồng thời hồ sơ nhân viên được khởi tạo ở
   `employee-profiles` (prefill, theo luồng review của feature đó).

```
offer chấp nhận                  Hệ thống                          HR / assignee
───────────────────────────────────────────────────────────────────────────────────
"Đã chấp nhận"
   │ (sự kiện)
   ▼
Tạo case "Mới tạo" ──▶ gắn application + offer + ngày bắt đầu
   │
   ▼
┌── Có mẫu checklist cho vị trí? ──┐
Có ▶ sinh task từ mẫu           Không ▶ checklist trống
   (assignee + hạn offset)          (HR thêm task tay)
   └──────────────┬────────────────┘
                  ▼
        HR gán owner case, kiểm/bổ sung task
                  ▼
        ── Mọi task có assignee + hạn? ──
        │                          │
     Không▶ liệt kê task           Có ▼
          thiếu owner/hạn      "Bắt đầu onboarding"
                  │                  │
                  │                  ▼
                  │          case "Đang thực hiện"
                  │          task phát cho assignee + thông báo
                  │                  │
                  │                  ▼
                  │        hồ sơ nhân viên khởi tạo
                  │        (employee-profiles: nháp → chờ duyệt → kích hoạt)
                  ▼
```

### 5.2 Assignee thực hiện và xác nhận task

1) Assignee nhận thông báo task (kèm tên nhân viên mới, hạn, context) → mở
   task → thực hiện ngoài đời thật (cấp thiết bị, tạo tài khoản...).
2) Bấm "Hoàn tất" (ghi chú tùy chọn) → task "Hoàn tất" + audit người xác
   nhận/thời điểm → tiến độ case cập nhật.
3) Task quá hạn chưa xong → đánh dấu "Quá hạn" + nhắc assignee/owner; task
   vẫn hoàn tất được (ghi "hoàn tất trễ").

### 5.3 HR theo dõi tiến độ và đóng case

1) HR mở case → thấy % hoàn tất, task quá hạn, task sắp hạn, ngày bắt đầu
   còn lại.
2) Khi mọi task bắt buộc hoàn tất và hồ sơ nhân viên đã kích hoạt → nút "Đóng
   onboarding" khả dụng → HR xác nhận → case "Hoàn tất" → phát sự kiện →
   `candidate-pipeline` chuyển application `ONBOARDED` + thông báo owner.
3) Nếu chưa đủ điều kiện → nút đóng chặn kèm danh sách còn thiếu (task nào,
   hồ sơ nhân viên trạng thái nào).

### 5.4 Hủy case (ứng viên không nhận việc / offer thu hồi)

1) HR chọn "Hủy onboarding" → nhập lý do bắt buộc → case "Đã hủy", mọi task
   đang mở chuyển "Đã hủy" + thông báo assignee.
2) Application trên pipeline không tự đổi — HR quyết định trên
   `candidate-pipeline` (giữ state machine một nơi).

### 5.5 Nhân viên mới xem việc của mình

1) Sau khi hồ sơ + tài khoản được tạo, nhân viên mở "Onboarding của tôi" →
   thấy task giao cho mình (nộp giấy tờ, đọc quy định) + ngày bắt đầu.
2) Nhân viên xác nhận xong phần mình → HR/owner thấy cập nhật trên case.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Application `ACCEPTED` và chưa có case mở? | Tạo case (tự động/tay) | Chặn + báo đã có case hoặc chưa đạt điều kiện |
| D2 | 5.1 | Có mẫu checklist phù hợp vị trí? | Sinh task từ mẫu (assignee/hạn mặc định) | Checklist trống, HR thêm tay |
| D3 | 5.1 | Mọi task có assignee + hạn? | Cho "Bắt đầu onboarding" | Chặn + liệt kê task thiếu |
| D4 | 5.3 | Mọi task bắt buộc hoàn tất VÀ hồ sơ nhân viên đã kích hoạt? | Cho "Đóng onboarding" → `ONBOARDED` | Chặn + liệt kê điều kiện thiếu |
| D5 | 5.2 | Task đến hạn chưa xong? | Đánh dấu "Quá hạn" + nhắc | Tiếp tục theo dõi |
| D6 | 5.4 | Hủy case khi task đang mở? | Case "Đã hủy" + task "Đã hủy" + báo assignee | — |
| D7 | 5.5 | Nhân viên đã có tài khoản? | Task giao cho nhân viên hiện trong surface của họ | Task hiện cho HR xử lý thay |
| D8 | mọi | Người thao tác trong phạm vi quyền? | Cho phép | Chặn + ghi audit truy cập từ chối |

### 6.2 Scenario Matrix

| Vai trò | Case mới tạo | Case đang thực hiện | Task của mình | Case hoàn tất/hủy |
|---|---|---|---|---|
| HR (trong scope) | kiểm/sửa task, gán owner, bắt đầu | theo dõi, giao lại, đổi hạn, hủy task/case, đóng | (nếu được giao) xác nhận | xem, reopen (P1) |
| Assignee | — | xem task mình, xác nhận hoàn tất, bình luận | xác nhận/bình luận | xem task mình |
| Nhân viên mới | — | xem task của mình | xác nhận phần mình | xem |
| Quản lý | xem trong scope | xem tiến độ trong scope | — | xem |
| Admin | xem/audit | xem/audit, đổi owner | — | xem/audit |

### 6.3 State Transitions

```
case onboarding: mới-tạo → đang-thực-hiện → hoàn-tất
                      ↘ đã-hủy (mọi lúc trước hoàn-tất, có lý do)
task: chưa-làm → đang-làm → hoàn-tất
        ↘ quá-hạn (auto khi quá hạn) → hoàn-tất (ghi "hoàn tất trễ")
        ↘ đã-hủy (khi case hủy hoặc HR hủy task có lý do)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| case | — | mới-tạo | offer chấp nhận (sự kiện) hoặc HR tạo tay | — |
| case | mới-tạo | đang-thực-hiện | HR "Bắt đầu onboarding" + checklist đủ owner/hạn | có — trả về khi cần sửa checklist lớn |
| case | đang-thực-hiện | hoàn-tất | HR "Đóng" + task bắt buộc xong + hồ sơ kích hoạt | có — reopen P1 trong hạn + lý do |
| case | mới-tạo/đang-thực-hiện | đã-hủy | HR "Hủy" + lý do (offer thu hồi/không nhận việc) | không — tạo case mới nếu cần |
| task | — | chưa-làm | sinh từ mẫu hoặc HR thêm | — |
| task | chưa-làm | đang-làm | assignee bắt đầu (tùy chọn) | có |
| task | chưa-làm/đang-làm | quá-hạn | quá hạn chưa xong (tự động) | có — khi hoàn tất |
| task | chưa-làm/đang-làm/quá-hạn | hoàn-tất | assignee/HR xác nhận | không |
| task | chưa-làm/đang-làm/quá-hạn | đã-hủy | HR hủy task/case kèm lý do | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Offer bị thu hồi sau khi case đã tạo | case vẫn mở | cảnh báo trên case → HR hủy case kèm lý do | task đang mở → "Đã hủy" |
| Hồ sơ nhân viên bị trả về (`employee-profiles`) | case "Đang thực hiện", điều kiện đóng chưa đạt | HR bổ sung hồ sơ rồi đóng case sau | — |
| Assignee nghỉ/vắng khi task sắp hạn | task "Quá hạn" | HR "Giao lại" cho người khác có quyền | audit giao lại |
| Nhân viên chưa có tài khoản đến ngày bắt đầu | task giao nhân viên vẫn mở | HR xác nhận thay khi nhân viên hoàn tất ngoài hệ thống | — |
| 2 người cùng xác nhận 1 task | xác nhận đầu đã ghi | người sau thấy "đã hoàn tất" | idempotent |
| Sự kiện "offer chấp nhận" phát 2 lần | case đã tồn tại cho application | kiểm application trước khi tạo → bỏ qua bản trùng | không tạo case thứ hai |

### 6.5 Other Edge Cases

- Ứng viên từng là nhân viên cũ (re-hire): `employee-profiles` gợi ý hồ sơ
  lưu trữ để mở lại — case gắn hồ sơ mở lại thay vì tạo mới.
- Ngày bắt đầu bị dời (đàm phán sau chấp nhận): HR cập nhật ngày bắt đầu trên
  case → hệ thống đề xuất dời hạn task theo cùng offset (xác nhận trước khi
  áp dụng).
- Task "tài khoản" xong nhưng tài khoản chưa được mời (`account-access`):
  case vẫn theo dõi task "mời tài khoản" riêng, không ngầm coi là xong.
- Checklist trống (không mẫu, HR chưa thêm): vẫn cho "Bắt đầu" khi HR xác
  nhận rõ "onboarding không cần task" — giả định OQ-4.
- Mẫu checklist bị sửa khi case đang chạy: case giữ task đã sinh; thay đổi
  mẫu chỉ ảnh hưởng case tạo sau (giống snapshot phiên bản).
- Nhân viên không đến nhận việc ngày đầu (no-show): HR hủy case lý do
  "không nhận việc" → application xử lý thủ công trên pipeline.
- Task đánh dấu bắt buộc vs tùy chọn: đóng case chỉ chặn bởi task bắt buộc;
  task tùy chọn có thể "Bỏ qua" kèm lý do.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Application nguồn | bắt buộc ở `ACCEPTED`; không có case khác đang mở |
| Ngày bắt đầu (joined date) | bắt buộc; mặc định từ offer; cảnh báo nếu quá khứ >30 ngày |
| Tiêu đề task | bắt buộc, 3–200 ký tự |
| Nhóm task | bắt buộc; 1 trong: giấy tờ, thiết bị, tài khoản, đào tạo, khác |
| Assignee task | bắt buộc; người dùng đang hoạt động trong tổ chức, hoặc cờ "giao cho nhân viên mới" |
| Hạn task | bắt buộc; mặc định trước ngày bắt đầu theo offset mẫu; cảnh báo nếu sau ngày bắt đầu |
| Owner case | bắt buộc HR trong scope trước khi "Bắt đầu" |
| Lý do hủy case/task | bắt buộc, 10–500 ký tự |
| Ghi chú hoàn tất | tùy chọn, ≤1.000 ký tự |
| Cờ bắt buộc task | mặc định bắt buộc; task tùy chọn cho phép "Bỏ qua" kèm lý do |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Số task mỗi case | 50 | mỗi case | chặn thêm, gợi ý gộp task (giả định — OQ-5) |
| Offset hạn task mặc định | trước ngày bắt đầu 1–14 ngày (theo mẫu) | mỗi task | hạn sau ngày bắt đầu → cảnh báo (giả định) |
| Nhắc task quá hạn | 1 lần/ngày | mỗi task quá hạn | ngừng nhắc sau 5 lần liên tiếp (giả định — OQ-5) |
| Case mở mỗi application | 1 | — | chặn tạo trùng (kể cả sự kiện phát lại) |
| Hạn reopen case đã hoàn tất | 30 ngày (P1) | từ ngày đóng | ẩn action reopen (giả định — OQ-5) |
| Số mẫu checklist mỗi tổ chức | 50 | — | chặn tạo thêm (giả định) |
| Độ dài lý do/ghi chú | 10–500 / ≤1.000 ký tự | mỗi lần nhập | chặn lưu |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Tạo case khi chưa đủ điều kiện | "Chỉ tạo onboarding cho ứng viên đã chấp nhận offer" | E-? |
| Đã có case mở | "Ứng viên này đang có hồ sơ onboarding — mở hồ sơ hiện có" | E-? |
| Task thiếu owner/hạn | "Còn {n} việc chưa có người phụ trách hoặc hạn — bổ sung trước khi bắt đầu" | E-? |
| Đóng case chưa đủ điều kiện | "Chưa thể đóng onboarding: {n} việc bắt buộc chưa xong / hồ sơ nhân viên chưa kích hoạt" | E-? |
| Hủy thiếu lý do | "Vui lòng nhập lý do hủy (tối thiểu 10 ký tự)" | E-? |
| Hết quyền | "Bạn không có quyền thao tác hồ sơ onboarding này" | E-? |
| Ngày bắt đầu thiếu | "Cần ngày bắt đầu làm việc trước khi tạo checklist" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Tạo case | "Đã tạo hồ sơ onboarding cho {tên ứng viên}" |
| Bắt đầu | "Đã bắt đầu onboarding — {n} việc đã giao cho người phụ trách" |
| Hoàn tất task | "Đã xác nhận hoàn tất: {tên việc}" |
| Đóng case | "Onboarding hoàn tất — {tên nhân viên} đã sẵn sàng, hồ sơ chuyển «Đã onboard»" |
| Giao lại task | "Đã giao lại «{tên việc}» cho {người}" |
| Hủy case | "Đã hủy onboarding của {tên ứng viên} — các việc đang mở đã hủy theo" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Tiến độ | "{x}/{n} việc hoàn tất — còn {m} việc trước ngày bắt đầu {DD/MM/YYYY}" |
| Task quá hạn | "«{tên việc}» quá hạn {n} ngày — phụ trách: {assignee}" |
| Task giao cho bạn | "Bạn được giao «{tên việc}» cho nhân viên mới {tên} — hạn {DD/MM}" |
| Offer bị thu hồi | "Offer của ứng viên này đã bị thu hồi — cân nhắc hủy onboarding" |
| Hồ sơ chờ kích hoạt | "Hồ sơ nhân viên đang chờ duyệt — cần kích hoạt trước khi đóng onboarding" |
| Ngày bắt đầu đổi | "Ngày bắt đầu đổi sang {DD/MM/YYYY} — dời hạn {n} việc theo?" |
| Nhân viên chưa có tài khoản | "Nhân viên chưa có tài khoản — HR xác nhận thay các việc của nhân viên" |

## 8. Assumptions

- Điều kiện tạo case: application `ACCEPTED` (offer chấp nhận). Nguồn đòi
  "joined date + active employee conversion" (FR-RC-07) → case bắt buộc ngày
  bắt đầu, đóng case đòi hồ sơ nhân viên đã kích hoạt.
- `employee-profiles` cung cấp conversion ứng viên → hồ sơ (NHAP →
  CHO_DUYET → HOAT_DONG); feature này kích khởi + theo dõi điều kiện đóng,
  không tự ý kích hoạt hồ sơ.
- `candidate-pipeline` thực hiện transition `ONBOARDED` khi nhận sự kiện
  "case hoàn tất"; feature này chỉ phát sự kiện.
- Task giao cho nhân viên mới chỉ hiển thị self-service khi nhân viên có tài
  khoản (`account-access`); trước đó HR xác nhận thay.
- Mẫu checklist (P1) là tài sản tổ chức do HR quản lý; case sinh task theo
  snapshot mẫu tại thời điểm tạo — đổi mẫu không ảnh hưởng case đang chạy.
- Giới hạn (50 task/case, offset 1–14 ngày, nhắc 1 lần/ngày tối đa 5, reopen
  30 ngày) là giá trị đề xuất — OQ-5.
- Không tự cấp quyền/tài khoản hệ thống ngoài (PRD "Chưa làm") — task
  "tài khoản/thiết bị" là việc con người thực hiện rồi xác nhận.
- Dữ liệu giấy tờ nhân viên theo retention/consent (OQ-6 PRD); trước DPO
  duyệt chỉ dữ liệu synthetic.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Task không có owner/quá hạn (rủi ro chính PRD) | thường | ngày đầu nhân viên thiếu chuẩn bị, trải nghiệm tệ, HR chạy khắc phục | bắt buộc assignee+hạn khi tạo/bắt đầu; cảnh báo quá hạn; nhắc tự động |
| Conversion nhập lại tay → trùng người/sai dữ liệu | thỉnh thoảng | 2 hồ sơ cho 1 người, lương/vị trí sai | prefill từ CV đã xác nhận + offer; kiểm trùng ở `employee-profiles` |
| Checklist hình thức — task tick xong nhưng thực tế chưa làm | thỉnh thoảng | thiết bị/tài khoản vẫn thiếu ngày đầu | xác nhận có người chịu trách + ghi chú; quản lý thấy tiến độ |
| Case đóng sớm khi hồ sơ nhân viên chưa kích hoạt | thỉnh thoảng | nhân viên "tồn tại" trên pipeline nhưng không có hồ sơ hợp lệ | điều kiện đóng kép: task xong VÀ hồ sơ HOAT_DONG |
| Sự kiện offer chấp nhận mất/trùng → case thiếu hoặc trùng | hiếm | ứng viên nhận việc không có onboarding, hoặc 2 case | tạo case có đường tay; idempotent theo application |
| Adoption: assignee ngoài HR (IT/hành chính) không vào hệ thống | thường | task vẫn xử lý qua chat, checklist không phản ánh thật | thông báo có context đầy đủ; HR xác nhận thay được; báo cáo task trễ |
| Giấy tờ nhân viên chứa dữ liệu nhạy cảm lộ quyền | hiếm | vi phạm privacy gate | tài liệu đính kèm theo quyền `document-library`; deny-by-default |

## 10. Success Criteria (preliminary)

- Tỷ lệ checklist hoàn tất trước ngày bắt đầu — mục tiêu PRD Mục 7.12;
  baseline/target chờ OQ-1/OQ-2 PRD.
- 100% task có assignee + hạn (guardrail, rủi ro chính).
- 100% case đóng có hồ sơ nhân viên HOAT_DONG tương ứng.
- Thời gian từ "offer chấp nhận" đến "bắt đầu onboarding" ≤1 ngày làm việc
  (đề xuất).
- 0 case trùng trên cùng application; 0 task mở không owner.

## 11. Open Questions

- [x] OQ-1: Ai gán owner/assignee cho task mặc định — mẫu theo vai trò hay
  HR gán tay từng task? — Resolved (đề xuất): mẫu checklist (P1) gán vai trò
  mặc định, HR đổi được khi tạo case; không có mẫu thì HR gán tay — chờ Head
  of HR xác nhận.
- [x] OQ-2: Nhân viên mới có self-service task trong v1 không? — Resolved (đề
  xuất): có nhưng phụ thuộc tài khoản (`account-access`); trước khi có tài
  khoản HR xác nhận thay — chờ Product owner xác nhận.
- [x] OQ-3: Điều kiện đóng case — chỉ checklist xong hay cần thêm xác nhận
  "đã đến nhận việc"? — Resolved (đề xuất): task bắt buộc xong + hồ sơ
  HOAT_DONG; "đã đến" là 1 task checklist ("Xác nhận ngày đầu") do HR/quản
  lý xác nhận — chờ Head of HR xác nhận.
- [x] OQ-4: Checklist trống có được bắt đầu không? — Resolved (đề xuất): được,
  khi HR xác nhận rõ "không cần task" — ghi audit lựa chọn đó.
- [x] OQ-5: Giới hạn (50 task/case, offset 1–14 ngày, nhắc tối đa 5 lần,
  reopen 30 ngày, 50 mẫu/tổ chức)? — Resolved (đề xuất): giữ làm mặc định —
  chờ Product owner xác nhận.
- [x] OQ-6: Retention case + task + giấy tờ đính kèm sau khi nhân viên nghỉ?
  — Resolved (đề xuất): theo retention hồ sơ nhân viên; trước DPO duyệt chỉ
  synthetic (PRD OQ-6, Mục 9).
- [~] OQ-7: Tự cấp tài khoản/quyền hệ thống ngoài? — Out of scope v1: PRD
  Mục 7.12 "Chưa làm" cho tới khi `external-integrations` sẵn sàng.

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd employee-onboarding` — capture user perspective
- `/brd employee-onboarding` — business case
- `/prd-epic employee-onboarding` — product scope
