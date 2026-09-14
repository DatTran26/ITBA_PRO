---
type: brainstorm
feature: candidate-assessment
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/assessment-and-grading/reverse-spec.md, docs/_reverse/assessment-and-grading/gaps.md, docs/_product/roadmap.md]
---

# Làm bài đánh giá có server kiểm soát — candidate-assessment

## 1. Idea Seed

Ứng viên/nhân viên mở link bài đánh giá bằng token được cấp, đọc hướng dẫn,
làm bài trong khung thời gian do server kiểm soát với autosave có xác nhận từ
server, khôi phục được bài khi gián đoạn, nộp bài một lần duy nhất (idempotent)
và nhận biên nhận — trong khi đáp án và dữ liệu nội bộ không bao giờ lộ ra
phía người làm bài.

## 2. Context

Bài đánh giá được tạo và phát hành từ `assessment-authoring` (token/link,
cấu hình thời gian, scoring); feature này là đầu "thực thi" — nơi ứng viên
chạm vào sản phẩm. Reverse SRS cho thấy nền ITBAAI đã có share token, trang
làm bài public và submit, nhưng hai lỗ hổng nghiệp vụ nghiêm trọng đang tồn
tại và là mục Now của roadmap: public test loader trả về cả `correct_answer`
(lộ đáp án — GAP-AS-06, Critical) và submit control chủ yếu nằm phía client,
chưa chứng minh server enforce schedule/capacity/single-attempt trước khi ghi
(GAP-AS-07). PRD Mục 7.22 đặt contract cứng: submission dùng thời gian server,
autosave phải có server acknowledgement, khôi phục bản đã xác nhận gần nhất,
snapshot đề bài bất biến, submit idempotent; recovery, expiry và
duplicate-submit là release gate của pilot (rủi ro R-06). Đây là feature
`Must`, thuộc điều kiện hoàn thành v1 "Thu bài assessment không mất dữ liệu".

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Ứng viên | Mất bài khi mất mạng/đóng tab, không biết bài đã nộp chưa, lo link bị lỗi | Làm bài ổn định, biết rõ trạng thái lưu/nộp, có biên nhận |
| Nhân viên (làm đánh giá nội bộ) | Như ứng viên, thêm kỳ vọng đăng nhập thay vì token | Làm bài trong tài khoản, kết quả gắn hồ sơ đúng phạm vi |
| HR | Token bị chia sẻ, không biết ai đang làm/hết hạn, phải xử lý "em nộp rồi mà không thấy" | Theo dõi attempt, gia hạn/thu hồi token, đối chiếu biên nhận |
| Author bài đánh giá | Cấu hình expiry/attempt/kết quả hiển thị không đồng nhất | Công bố rõ quyền xem kết quả, số attempt, hạn làm bài |

## 4. Capabilities Breakdown

### P0 — must have

- Truy cập bài bằng token/link (ứng viên) hoặc tài khoản có quyền (nhân viên);
  kiểm tra phía server: token còn hiệu lực, chưa vượt số attempt cho phép,
  bài còn trong thời hạn phát hành.
- Màn hướng dẫn trước khi làm: thời lượng, số câu, quy định nộp, chính sách
  hiển thị kết quả; người làm bài xác nhận đã đọc trước khi bắt đầu.
- Timer do server kiểm soát: mốc bắt đầu/kết thúc tính theo giờ server, client
  chỉ hiển thị; hết giờ server tự đóng attempt.
- Autosave có server acknowledgement: mỗi câu trả lời chỉ được coi là đã lưu
  khi server xác nhận; client hiển thị rõ "đã lưu" / "đang lưu" / "chưa lưu
  được".
- Khôi phục sau gián đoạn: mở lại link/tài khoản → khôi phục đúng bản trả lời
  đã được server xác nhận gần nhất, cùng thời gian còn lại theo server.
- Submit idempotent: nộp nhiều lần (double-click, retry, 2 thiết bị) chỉ tạo
  một submission; mọi lần nộp lại trả về cùng biên nhận.
- Biên nhận nộp bài: sau submit thành công hiển thị mã/thời điểm nộp theo giờ
  server để đối chiếu.
- Không lộ đáp án/dữ liệu nội bộ: payload trả cho người làm bài chỉ gồm nội
  dung câu hỏi và lựa chọn — tuyệt đối không kèm đáp án đúng, giải thích nội
  bộ hay metadata chấm điểm.
- Snapshot đề bài bất biến: bài người làm nhận là snapshot tại thời điểm phát
  hành/mở attempt; câu hỏi nguồn đổi sau đó không làm đề đang làm thay đổi.
- Theo dõi attempt phía HR: danh sách attempt theo bài (đang làm, đã nộp, hết
  hạn), thời điểm bắt đầu/nộp, trạng thái biên nhận.

### P1 — should have

- Progress trong bài: số câu đã trả lời/tổng số, đánh dấu câu để xem lại,
  màn review trước khi nộp.
- Cảnh báo sắp hết giờ và sắp hết hạn token (mốc cảnh báo theo cấu hình).
- HR gia hạn token / mở lại attempt cho trường hợp sự cố — có lý do bắt buộc
  và audit (theo quyền author đã công bố).
- Nhắc kết quả theo chính sách: nếu author cho phép hiển thị điểm/kết quả sau
  nộp thì hiển thị đúng phần được phép, không hơn.

### P2 — nice to have

- Làm bài trên nhiều thiết bị có "chuyển quyền" rõ ràng (thiết bị mới tiếp
  quản attempt, thiết bị cũ bị khoá).
- Chế độ in phiếu xác nhận nộp bài.
- Giám sát gian lận/proctoring — ngoài phạm vi v1 (PRD "Chưa làm: giám sát
  xâm phạm quyền riêng tư").

## 5. Core Flows (Happy Path)

### 5.1 Mở link → xác minh → hướng dẫn → bắt đầu

1) Ứng viên mở link `/test/{token}` từ email/thư mời; hệ thống kiểm tra phía
   server: token tồn tại, còn hạn, chưa vượt số attempt, bài còn phát hành.
2) Hợp lệ → màn hướng dẫn (thời lượng, số câu, quy định, quyền xem kết quả
   theo công bố của author) → ứng viên xác nhận "Bắt đầu làm bài".
3) Hệ thống mở attempt trên server (ghi mốc giờ bắt đầu server-side) và trả
   snapshot đề bài không đáp án → vào màn làm bài.
4) Không hợp lệ → trang lỗi nêu đúng lý do nghiệp vụ (hết hạn / hết lượt /
   bài đã đóng) và hướng dẫn liên hệ HR.

### 5.2 Làm bài với autosave và timer server

1) Mỗi thay đổi câu trả lời được gửi lên server theo nhịp autosave; client
   chỉ đánh dấu "đã lưu" khi có acknowledgement của server.
2) Timer hiển thị đếm ngược theo giờ server (client đồng bộ định kỳ, không
   tự quyết hết giờ).
3) Mất mạng/lỗi lưu → client giữ phần thay đổi chưa được xác nhận, hiển thị
   "chưa lưu được — đang thử lại", tự retry khi có kết nối.

```
Người làm bài                Client (browser)              Server
──────────────────────────────────────────────────────────────────────────
Bắt đầu làm bài
        │                         │                            │
        │   trả lời câu i         │  gửi autosave              │
        ├────────────────────────▶│───────────────────────────▶│
        │                         │        ack (đã lưu +        │
        │                         │◀─ giờ server còn lại) ─────│
        │   hiển thị "đã lưu" ◀───│                            │
        │                         │                            │
        │   (mất mạng)            │  gửi autosave ──── X       │
        │                         │  giữ pending, hiện         │
        │   "chưa lưu được —      │  "chưa lưu được"           │
        │    đang thử lại"        │       │ retry khi có mạng  │
        │                         │       └───────────────────▶│
        │                         │◀────────── ack ────────────│
        │                         │                            │
        │              hết giờ (giờ SERVER, không theo client) │
        │                         │◀── attempt tự đóng, ───────│
        │   màn "hết giờ, bài     │    phần đã ack giữ nguyên  │
        │   đã được ghi nhận" ◀───│                            │
```

### 5.3 Review → submit idempotent → biên nhận

1) Người làm bài vào màn review: danh sách câu, trạng thái đã/chưa trả lời,
   câu đánh dấu xem lại → quay lại sửa hoặc bấm "Nộp bài".
2) Xác nhận nộp → server đóng attempt, tạo submission một lần duy nhất kèm
   biên nhận (mã + thời điểm nộp theo giờ server).
3) Mọi nộp lại sau đó (retry, double-click, thiết bị khác, link mở lại) đều
   trả về cùng biên nhận — không tạo submission thứ hai.
4) Màn kết quả hiển thị phần được author cho phép (ít nhất: "đã nộp thành
   công" + biên nhận; điểm/nhận xét chỉ khi author công bố).

```
Submit path (idempotent):

  bấm "Nộp bài"
       │
       ▼
┌─────────────────────────────┐
│ Server: attempt còn mở?     │
└───────────────┬─────────────┘
                │
      ┌─────────┼──────────────┬───────────────────┐
      ▼         ▼              ▼                   ▼
   còn mở   đã nộp trước đó  đã hết giờ/hạn    attempt bị thu hồi
      │         │              │                   │
      ▼         ▼              ▼                   ▼
  đóng attempt  trả lại CÙNG  khoá submit,      chặn + thông báo,
  + tạo         biên nhận cũ  giữ phần đã ack,  gợi ý liên hệ HR
  submission    (không tạo    hiện biên nhận
  + biên nhận   submission 2)  nếu server đã
      │                        tự đóng-thu
      ▼
  hiện biên nhận: "Đã nộp — mã {code}, {HH:mm DD/MM} (giờ hệ thống)"
```

### 5.4 Khôi phục sau gián đoạn

1) Người làm bài mở lại link (hoặc đăng nhập lại với nhân viên) trong khi
   attempt còn hiệu lực.
2) Server trả về attempt đang mở: snapshot đề, toàn bộ câu trả lời đã được
   xác nhận gần nhất, thời gian còn lại theo giờ server.
3) Người làm bài tiếp tục từ đúng trạng thái đó; phần chưa kịp xác nhận
   trước gián đoạn được báo là không khôi phục được.

### 5.5 Hết hạn và quản lý token phía HR

1) Token hết hạn trước khi mở bài → trang "link hết hạn" + hướng dẫn liên hệ
   HR; không tạo attempt.
2) HR xem danh sách attempt/token theo bài; với trường hợp sự cố chính đáng,
   HR gia hạn hạn token hoặc mở lại attempt — bắt buộc nhập lý do, hành động
   được audit (quyền này phải nằm trong phần author đã công bố).

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Token tồn tại, còn hạn, bài còn phát hành? | Cho vào màn hướng dẫn | Trang lỗi nêu lý do (hết hạn/đã đóng/không tồn tại) |
| D2 | 5.1 | Attempt đã tồn tại cho token/người này? | Khôi phục attempt đang mở (5.4) hoặc trả biên nhận nếu đã nộp | Tạo attempt mới nếu còn lượt |
| D3 | 5.1 | Còn lượt attempt theo cấu hình author? | Cho bắt đầu | Thông báo "đã hết lượt làm bài" + liên hệ HR |
| D4 | 5.2 | Autosave được server xác nhận? | Đánh dấu "đã lưu" câu đó | Giữ pending + hiện "chưa lưu được — đang thử lại" |
| D5 | 5.2 | Giờ server đã quá deadline của attempt? | Server đóng attempt, client nhận trạng thái đã đóng | Tiếp tục làm bài |
| D6 | 5.3 | Attempt còn mở khi nhận submit? | Đóng attempt, tạo submission + biên nhận | Trả cùng biên nhận (đã nộp) hoặc chặn (bị thu hồi) |
| D7 | 5.3 | Submit trùng với submission đã có? | Trả về biên nhận hiện có, không ghi thêm | (không xảy ra nhánh khác — luôn idempotent) |
| D8 | 5.5 | HR có quyền gia hạn/mở lại theo công bố của author? | Cho thao tác kèm lý do bắt buộc + audit | Ẩn/khoá thao tác |
| D9 | 5.3 | Author cho phép hiển thị điểm sau nộp? | Hiện đúng phần được phép | Chỉ hiện biên nhận + "kết quả sẽ được thông báo" |

### 6.2 Scenario Matrix

| Vai trò | Token hợp lệ | Token hết hạn/hết lượt | Attempt đang mở | Attempt đã nộp |
|---|---|---|---|---|
| Ứng viên (qua token) | vào hướng dẫn, làm bài | trang lỗi + hướng dẫn liên hệ HR | khôi phục bản đã ack, làm tiếp | xem biên nhận, không sửa được |
| Nhân viên (đăng nhập) | như ứng viên, danh tính từ tài khoản | như ứng viên | như ứng viên | như ứng viên |
| HR trong scope | xem danh sách attempt, gia hạn/thu hồi theo quyền | thao tác gia hạn token | xem tiến độ (không xem nội dung bài nếu policy cấm) | xem trạng thái nộp + biên nhận |
| Người ngoài scope/không token | chặn, không thấy gì ngoài trang lỗi chung | chặn | chặn | chặn |

### 6.3 State Transitions

```
token:    phát-hành → hết-hạn / thu-hồi

attempt:  (chưa có) → đang-làm → đã-nộp
                        │    │
                        │    └────→ hết-giờ (server tự đóng)
                        │              │
                        ▼              ▼
                     bị-thu-hồi ──▶ (kết thúc; mọi submit sau
                      (HR/admin        chỉ trả biên nhận nếu đã
                       có lý do)       từng nộp, ngược lại chặn)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| token | — | phát-hành | author publish link (`assessment-authoring`) | — |
| token | phát-hành | hết-hạn | quá hạn cấu hình | có (HR gia hạn có lý do) |
| token | phát-hành | thu-hồi | HR thu hồi có lý do | có (cấp lại = token mới) |
| attempt | — | đang-làm | xác nhận "Bắt đầu" + còn lượt | — |
| attempt | đang-làm | đã-nộp | submit thành công (idempotent) | không |
| attempt | đang-làm | hết-giờ | giờ server quá deadline | có (HR mở lại theo quyền + lý do) |
| attempt | đang-làm | bị-thu-hồi | HR/admin thu hồi có lý do | theo quyết định có audit |
| submission | — | đã-ghi | submit hợp lệ lần đầu | không (bất biến, snapshot) |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Đóng browser giữa bài | attempt "đang-làm" + các câu đã server ack | mở lại link → khôi phục bản ack gần nhất + giờ còn lại | không — attempt sống tới deadline |
| Mất mạng khi đang làm | server giữ phần đã ack; client giữ pending chưa ack | có mạng → flush pending; nếu server đã đóng (hết giờ) thì phần pending mất, báo rõ | pending quá hạn trên client tự huỷ |
| Token hết hạn trước khi mở | không có attempt | HR gia hạn → mở lại được | — |
| Token hết hạn giữa bài | attempt đang-làm (deadline riêng của attempt) | tiếp tục tới deadline attempt; không bị đá ra giữa chừng | — |
| Nộp rồi nhưng client chưa nhận biên nhận (rớt mạng đúng lúc submit) | submission đã ghi trên server | nộp lại → nhận cùng biên nhận | — |
| 2 thiết bị cùng mở 1 attempt | một attempt duy nhất | thiết bị sau thấy "đang làm ở phiên khác"; policy đề xuất: thiết bị sau tiếp quản, thiết bị trước khoá (OQ-3) | khoá phiên cũ |
| Hết giờ khi đang offline | server đã đóng attempt theo giờ server | online lại → thấy trạng thái đã đóng + phần đã ack | pending client huỷ, không ghi được nữa |
| Submit khi attempt vừa bị HR thu hồi | attempt "bị-thu-hồi" | chặn submit, thông báo liên hệ HR; nếu đã từng nộp thì vẫn trả biên nhận | — |

### 6.5 Other Edge Cases

- Link được forward cho người khác: token là đường vào duy nhất → rủi ro chia
  sẻ là PRD-named; giảm bằng attempt limit + ghi nhận danh tính/email người
  làm khi bắt đầu (nếu author yêu cầu định danh — OQ-4).
- Ứng viên mở link trên thiết bị không hỗ trợ (quá cũ): trang hướng dẫn kiểm
  tra tối thiểu và báo yêu cầu trình duyệt — không vào được attempt.
- Bài bị author đóng/thu hồi phát hành giữa lúc người khác đang làm: attempt
  đang mở vẫn hoàn tất theo snapshot; chỉ chặn attempt mới (đề xuất — OQ-5).
- Câu tự luận dài: autosave theo nhịp, giới hạn độ dài theo cấu hình câu.
- Người làm bài cố mở "xem đáp án" qua link công khai: surface public không
  có dữ liệu đáp án — không có gì để lộ (contract cứng, GAP-AS-06).
- Empty state: HR chưa có attempt nào → "Chưa có lượt làm bài nào".

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Token truy cập | bắt buộc; tồn tại, chưa thu hồi, còn hạn, còn lượt attempt |
| Xác nhận hướng dẫn | bắt buộc trước khi mở attempt |
| Câu trả lời trắc nghiệm | đúng số lựa chọn loại câu yêu cầu (1 đáp án / nhiều đáp án) |
| Câu tự luận | tối đa theo cấu hình câu (đề xuất mặc định 5.000 ký tự) |
| Submit | chỉ khi attempt "đang-làm" và chưa quá deadline server |
| Gia hạn/mở lại attempt | chỉ vai trò được author công bố; bắt buộc lý do; ghi audit |
| Payload câu hỏi trả client | chỉ nội dung câu + lựa chọn; cấm đáp án/giải thích/metadata chấm |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Nhịp autosave | 20 giây hoặc ngay khi rời câu (đề xuất — OQ-6) | mỗi attempt | câu chưa ack hiện "chưa lưu được" |
| Số attempt mỗi token | 1 (đề xuất mặc định, author cấu hình được — OQ-AS-05/OQ-1) | mỗi token | chặn attempt mới, trả biên nhận nếu đã nộp |
| Hạn token mặc định | 7 ngày kể từ phát hành (đề xuất — OQ-AS-01/OQ-1) | mỗi token | link vào trang "hết hạn" |
| Grace submit sau deadline | 0 giây — server đóng ngay khi quá deadline (đề xuất — OQ-6) | mỗi attempt | submit sau đó chỉ trả biên nhận nếu đã nộp |
| Cảnh báo sắp hết giờ | 10 phút và 1 phút cuối (đề xuất) | mỗi attempt | banner đếm ngược nhấn mạnh |
| Độ dài câu tự luận | 5.000 ký tự (đề xuất) | mỗi câu | chặn nhập thêm + báo giới hạn |
| Dung lượng payload đề | chỉ snapshot không đáp án (contract cứng) | mỗi lần tải | không áp dụng — quy tắc bắt buộc |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Token không tồn tại/thu hồi | "Link làm bài không hợp lệ hoặc đã bị thu hồi — liên hệ người phụ trách để được cấp lại" | E-? |
| Token hết hạn | "Link làm bài đã hết hạn vào {DD/MM} — liên hệ người phụ trách để gia hạn" | E-? |
| Hết lượt attempt | "Bạn đã dùng hết số lượt làm bài cho link này" | E-? |
| Hết giờ | "Đã hết thời gian làm bài — phần trả lời đã lưu được hệ thống ghi nhận" | E-? |
| Autosave thất bại | "Chưa lưu được câu trả lời — đang thử lại, vui lòng không đóng trang" | E-? |
| Nộp khi attempt bị thu hồi | "Lượt làm bài này đã bị thu hồi — liên hệ người phụ trách" | E-? |
| Thiết bị khác đang giữ attempt | "Bài đang được làm ở một phiên khác — tiếp tục sẽ chuyển lượt làm về thiết bị này" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Bắt đầu attempt | "Bắt đầu làm bài — bạn có {X} phút, bài được tự động lưu" |
| Autosave thành công | "Đã lưu" |
| Nộp thành công | "Đã nộp bài — mã biên nhận {code}, nộp lúc {HH:mm DD/MM} (giờ hệ thống)" |
| Khôi phục bài | "Đã khôi phục bài làm từ bản lưu gần nhất lúc {HH:mm}" |
| HR gia hạn | "Đã gia hạn link tới {DD/MM} — thao tác đã được ghi lại" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Đang lưu | "Đang lưu..." |
| Sắp hết giờ | "Còn {n} phút — bài sẽ tự đóng khi hết giờ" |
| Đã nộp rồi | "Bài đã được nộp lúc {HH:mm DD/MM} — mã biên nhận {code}" |
| Kết quả không công khai | "Kết quả sẽ được thông báo theo chính sách của đơn vị tuyển dụng" |
| Phiên ở thiết bị khác | "Bài đang mở ở thiết bị khác" |
| Empty state HR | "Chưa có lượt làm bài nào cho bài đánh giá này" |

## 8. Assumptions

- Bài đánh giá, câu hỏi snapshot, token/link và cấu hình (thời lượng, số
  attempt, expiry, quyền xem kết quả) được phát hành từ `assessment-authoring`;
  feature này chỉ tiêu thụ, không chỉnh sửa đề.
- Câu hỏi nguồn đã qua review trong `question-bank`; snapshot tại attempt/
  publish là bất biến theo contract PRD.
- Nhân viên làm bài qua tài khoản (`account-access`) với cùng contract
  timer/autosave/submit như ứng viên qua token; danh tính thay thế token.
- "Không lộ đáp án" áp cho mọi surface public: payload trang làm bài, tìm
  kiếm, cache, export — vá GAP-AS-06 là phần lõi của feature này.
- Các giá trị Mục 7.2 (nhịp autosave, hạn token 7 ngày, grace 0 giây, cảnh
  báo 10/1 phút, 5.000 ký tự) là đề xuất hợp lý chờ owner chốt — nguồn chỉ
  xác nhận contract (server-time, ack, idempotent) chứ chưa chốt ngưỡng.
- Attempt limit mặc định 1 theo hướng "server enforce single-attempt" của
  roadmap Now; author có thể cấu hình khác nếu được công bố (OQ-1).
- Đồng hồ client chỉ hiển thị; mọi quyết định hết giờ/hết hạn theo giờ server.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Lộ đáp án qua payload public → gian lận hàng loạt | thỉnh thoảng (đã có GAP-AS-06) | kết quả tuyển sai lệch, mất uy tín quy trình | payload whitelist field; test regression "không có correct_answer"; audit quyền xem đáp án |
| Mất bài/mất answer đã ack khi gián đoạn | thỉnh thoảng | ứng viên khiếu nại, phải cho làm lại, chậm pipeline | autosave ack + recovery bản gần nhất; M-GR-03 = 0 là guardrail release gate |
| Submit trùng tạo nhiều submission → chấm lệch | thỉnh thoảng | điểm sai, HR phải dọn tay | submit idempotent + receipt duy nhất; duplicate-submit là release gate |
| Token bị chia sẻ/đoán → người lạ làm bài | thỉnh thoảng | kết quả không đúng người, phải huỷ attempt | attempt limit, expiry, tuỳ chọn định danh khi bắt đầu, thu hồi có audit |
| Deadline client-side bị chỉnh → làm quá giờ | hiếm | bất công giữa ứng viên | timer server-side tuyệt đối; client chỉ hiển thị |
| Chính sách "hiển thị kết quả" không thống nhất giữa các bài | thỉnh thoảng | ứng viên thấy/không thấy tuỳ bài → complaint | quyền xem kết quả do author công bố rõ ở màn hướng dẫn |
| HR lạm dụng mở lại attempt/gia hạn không lý do | hiếm | tranh chấp tính công bằng | bắt buộc lý do + audit + phạm vi quyền |

## 10. Success Criteria (preliminary)

- Tỷ lệ người bắt đầu hoàn tất bài hợp lệ (có biên nhận) — mục tiêu theo PRD
  Mục 7.22; con số chờ OQ-1/OQ-2 của PRD sản phẩm (M-IN-02).
- 0 submission mất answer đã được server xác nhận (guardrail M-GR-03).
- 0 incident lộ đáp án ra surface public (guardrail, bám M-GR-01).
- 100% submission có biên nhận truy vết được (mã + giờ server).
- Release gate pilot: recovery, expiry và duplicate-submit được kiểm chứng
  trước khi mở dữ liệu thật (PRD Mục 7.22).

## 11. Open Questions

- [ ] OQ-1: Token có expiry/revocation/attempt limit chính thức thế nào —
  giá trị mặc định và ai chốt (author từng bài hay policy tổ chức)?
  (liên quan OQ-AS-01 reverse spec, OQ-AS-05)
- [ ] OQ-2: Ứng viên có được xem đáp án/giải thích SAU khi nộp không, và
  theo quyền nào (OQ-AS-03)? Mặc định đề xuất: không, trừ khi author công
  bố rõ.
- [ ] OQ-3: Hai thiết bị cùng mở attempt — chính sách chính thức là chặn
  thiết bị sau, hay cho "tiếp quản" khoá thiết bị trước?
- [ ] OQ-4: Có bắt buộc định danh (email/mã ứng viên) khi bắt đầu bài qua
  token để chống chia sẻ link, hay token đủ?
- [ ] OQ-5: Khi bài bị đóng/thu hồi phát hành giữa chừng, attempt đang mở
  được hoàn tất (đề xuất: có) hay đóng theo?
- [ ] OQ-6: Các ngưỡng đề xuất Mục 7.2 (autosave 20s, hạn token 7 ngày,
  grace submit 0s, cảnh báo 10/1 phút, tự luận 5.000 ký tự) được owner
  chấp nhận làm chuẩn v1 không?
- [ ] OQ-7: Attempt của nhân viên nội bộ có cùng expiry/attempt-limit với
  ứng viên, hay theo policy nội bộ riêng (liên quan OQ-8 PRD)?

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd candidate-assessment` — capture user perspective
- `/brd candidate-assessment` — business case
- `/prd-epic candidate-assessment` — product scope
