---
type: brainstorm
feature: release-announcements
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/platform-communications-and-governance/reverse-spec.md]
---

# Thông báo phiên bản có phê duyệt và theo dõi đã đọc — release-announcements

## 1. Idea Seed

Một kênh công bố thay đổi sản phẩm trong chính ứng dụng: admin soạn thông
báo phiên bản (tiêu đề, nội dung thay đổi, nhãn phiên bản, đối tượng nhận),
thông báo phải qua review và phê duyệt của con người trước khi công bố, có
thể lên lịch công bố; người dùng thấy danh sách thông báo chưa đọc và xác
nhận đã đọc. Đây là bản ghi nghiệp vụ về thay đổi sản phẩm, KHÔNG phải Git
release/tag kỹ thuật.

## 2. Context

Khi sản phẩm đổi (tính năng mới, quy trình đổi, hành vi cũ bỏ), người dùng
nội bộ hiện chỉ biết qua truyền miệng, chat hoặc tự phát hiện — không có
kênh chính thức trong app, không biết ai đã đọc, không truy vết được thông
báo nào đã công bố cho phiên bản nào. Nguồn ITBAAI đã có nền version
announcement (bảng versions, read markers, super-admin soạn/duyệt — reverse
spec `platform-communications-and-governance` FR-PL-05); đây là bằng chứng
triển khai, chưa phải bằng chứng nhu cầu. PRD Mục 7.36 xếp feature này
`Could` — slice mở rộng sau lát cắt v1; phụ thuộc `account-access`
(danh tính), `org-governance` (quyền/audit) và `platform-configuration`
(cấu hình nền tảng). Rủi ro chính theo PRD: trạng thái thông báo lệch với
phiên bản thực tế đang chạy.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Admin | Thay đổi sản phẩm không có kênh công bố chính thức; không biết ai đã đọc thông báo quan trọng | Soạn, lên lịch và công bố thông báo phiên bản có kiểm soát; đo được tỷ lệ đọc |
| Reviewer (admin thứ hai / người được ủy quyền duyệt) | Thông báo sai/chưa rõ đến tay toàn bộ người dùng | Hàng chờ duyệt rõ ràng, quyết định duyệt/trả có ghi nhận |
| Người dùng nội bộ (HR, quản lý, nhân viên, interviewer) | Sản phẩm đổi mà không được báo; không phân biệt được đâu là thông báo mới | Thấy thông báo chưa đọc ngay trong app, đọc nội dung ảnh hưởng đến mình, đánh dấu đã đọc |
| Product owner / quản lý | Không đo được mức tiếp nhận thay đổi | Số liệu đọc theo thông báo để ra quyết định truyền thông |

## 4. Capabilities Breakdown

### P0 — must have

- Soạn thông báo phiên bản: tiêu đề, nội dung thay đổi (mô tả ngắn + mục
  thay đổi ảnh hưởng người dùng), nhãn phiên bản hiển thị, đối tượng nhận
  (toàn bộ người dùng / theo vai trò — đề xuất, xem OQ-2), mức quan trọng
  (thường / quan trọng).
- Luồng trạng thái đầy đủ: NHAP → CHO_DUYET → DA_DUYET → DA_CONG_BO →
  LUU_TRU; trả về NHAP khi bị từ chối kèm ghi chú; chỉ NHAP được xóa.
- Lên lịch công bố: thông báo đã duyệt có thể đặt thời điểm công bố trong
  tương lai; đến lịch hệ thống tự chuyển DA_CONG_BO; admin cũng có thể
  "công bố ngay".
- Người dùng: danh sách thông báo đang công bố trong phạm vi đối tượng của
  mình, badge số chưa đọc, mở xem nội dung, xác nhận "đã đọc" (read marker
  theo từng người).
- Admin xem bảng theo dõi: mỗi thông báo đã công bố có số người mục tiêu,
  số đã đọc, tỷ lệ đọc; lọc theo trạng thái/kỳ.
- Thu hồi/lưu trữ thông báo đã công bố kèm lý do (xử lý trường hợp thông
  báo lệch phiên bản thực tế — rủi ro chính của PRD).
- Audit cho action nhạy cảm: gửi duyệt, duyệt/từ chối, công bố, thu hồi,
  lưu trữ — ai / khi nào / thông báo nào / lý do.

### P1 — should have

- Sửa thông báo đã công bố: tạo bản chỉnh sửa qua lại duyệt, hoặc sửa trực
  tiếp kèm audit + đánh dấu "đã chỉnh sửa" (đề xuất — xem OQ-4).
- Nhắc người chưa đọc: với thông báo quan trọng quá hạn đọc, admin gửi nhắc
  lại (qua `contextual-notifications` khi feature đó sẵn sàng).
- Đính kèm link tài liệu hướng dẫn/hình minh họa trong nội dung.
- Người dùng mới sau khi thông báo công bố vẫn thấy thông báo trong hạn
  hiển thị.

### P2 — nice to have

- Mẫu thông báo phát hành dùng lại (cấu trúc "Mới / Thay đổi / Đã sửa").
- Thống kê đọc theo thời gian và vai trò.
- Đối chiếu hiển thị với Git tag/image thực tế đang chạy (chỉ hiển thị —
  KHÔNG suy nội dung; liên quan OQ-PL-05 reverse spec).

## 5. Core Flows (Happy Path)

### 5.1 Soạn, duyệt và công bố thông báo phiên bản

1) Admin mở "Thông báo phiên bản" → tạo nháp: nhập tiêu đề, nội dung,
   nhãn phiên bản, đối tượng nhận, mức quan trọng.
2) Lưu NHAP → "Gửi duyệt" → chuyển CHO_DUYET, hàng chờ của reviewer có
   thông báo mới.
3) Reviewer mở thông báo: xem toàn bộ nội dung + đối tượng nhận.
   - Duyệt → DA_DUYET.
   - Từ chối kèm ghi chú → trả về NHAP, người soạn thấy lý do.
4) Thông báo DA_DUYET: admin chọn "công bố ngay" hoặc đặt lịch công bố.
   - Công bố ngay → DA_CONG_BO ngay.
   - Đặt lịch → giữ DA_DUYET kèm `scheduled_at`; đến giờ hệ thống tự
     chuyển DA_CONG_BO.
5) Người dùng thuộc đối tượng nhận thấy badge + thông báo trong danh sách.
6) Admin theo dõi tỷ lệ đọc; khi cần thu hồi → LUU_TRU kèm lý do.

```
Admin                          Hệ thống                     Reviewer
─────────────────────────────────────────────────────────────────────────

Soạn thông báo
      │
      ▼
┌───────────────┐
│ Lưu NHAP      │
└───────┬───────┘
        │ "Gửi duyệt"
        ▼
┌───────────────┐        ┌──────────────────────────┐
│ CHO_DUYET     │───────▶│ Reviewer xem nội dung    │
└───────────────┘        └───────────┬──────────────┘
        ▲                            │
        │ Từ chối + ghi chú   ── Duyệt? ──┐
        └────────────────────    │         │
                              Không      Có
                                 ▼         ▼
                              (về NHAP) ┌───────────────┐
                                        │ DA_DUYET      │
                                        └───────┬───────┘
                                                │
                                     ── Đặt lịch công bố? ──┐
                                     │                      │
                                   Có                      Không
                                     ▼                      ▼
                          ┌────────────────────┐   "Công bố ngay"
                          │ Chờ scheduled_at   │        │
                          │ (DA_DUYET + lịch)  │        ▼
                          └─────────┬──────────┘  ┌─────────────┐
                                    │ đến giờ     │ DA_CONG_BO  │
                                    └────────────▶│ (tự chuyển) │
                                                  └──────┬──────┘
                                                         ▼
                                          Người dùng thấy badge
                                          + thông báo chưa đọc
                                                         │
                                    admin thu hồi/lưu trữ▼
                                                  ┌─────────────┐
                                                  │ LUU_TRU     │
                                                  │ (kèm lý do) │
                                                  └─────────────┘
```

### 5.2 Người dùng nhận biết và xác nhận đã đọc

1) Người dùng đăng nhập → thấy badge số thông báo chưa đọc trên khu vực
   thông báo.
2) Mở danh sách: thông báo đang công bố dành cho đối tượng của mình,
   chưa đọc được đánh dấu.
3) Mở từng thông báo → đọc nội dung → hệ thống ghi read marker (thời điểm
   đọc của người đó).
4) Badge giảm tương ứng; thông báo đã đọc vẫn xem lại được.

### 5.3 Thu hồi thông báo đã công bố (xử lý lệch phiên bản)

1) Admin phát hiện thông báo không khớp phiên bản đang chạy (deploy bị
   rollback, nội dung sai).
2) Mở thông báo DA_CONG_BO → "Thu hồi/lưu trữ" → nhập lý do bắt buộc.
3) Thông báo chuyển LUU_TRU: biến mất khỏi danh sách người dùng, vẫn xem
   được ở màn admin cùng lý do và ai thu hồi.
4) (Đề xuất) Admin tạo thông báo sửa đính chính nếu cần — qua lại luồng
   duyệt.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Đủ trường bắt buộc để gửi duyệt (tiêu đề, nội dung, đối tượng)? | Cho gửi → CHO_DUYET | Ở NHAP + liệt kê trường thiếu |
| D2 | 5.1 | Reviewer có đồng ý nội dung? | DA_DUYET, ghi nhận người duyệt | Trả về NHAP kèm ghi chú bắt buộc |
| D3 | 5.1 | Admin đặt lịch công bố thay vì công bố ngay? | Giữ DA_DUYET + scheduled_at, đến giờ tự công bố | Chuyển DA_CONG_BO ngay |
| D4 | 5.1/5.3 | Thông báo đã công bố cần rút? | LUU_TRU + lý do + audit | Giữ nguyên DA_CONG_BO |
| D5 | 5.2 | Người xem thuộc đối tượng nhận của thông báo? | Hiện trong danh sách + tính badge | Ẩn hoàn toàn |
| D6 | 5.1 | Người gửi duyệt và người duyệt là cùng một người? | Chặn tự duyệt (đề xuất — xem OQ-3) | Cho phép nếu policy chấp nhận |
| D7 | 5.2 | Thông báo quan trọng và user bấm đóng mà chưa xem nội dung? | Vẫn tính là chưa đọc, badge còn | — |

### 6.2 Scenario Matrix

| Actor | Hành động | Trạng thái thông báo | Kết quả |
|---|---|---|---|
| Admin | Sửa / xóa | NHAP | Được; xóa chỉ với NHAP |
| Admin | Gửi duyệt | NHAP đủ trường | CHO_DUYET |
| Admin | Sửa / rút về | CHO_DUYET (chính mình gửi) | Về NHAP (đề xuất — OQ-3) |
| Reviewer | Duyệt / từ chối | CHO_DUYET | DA_DUYET hoặc về NHAP |
| Reviewer | Tự duyệt thông báo mình soạn | CHO_DUYET | Chặn (đề xuất — OQ-3) |
| Admin | Công bố ngay / đặt lịch | DA_DUYET | DA_CONG_BO ngay hoặc theo lịch |
| Admin | Thu hồi | DA_CONG_BO | LUU_TRU + lý do + audit |
| Admin | Sửa nội dung | DA_CONG_BO | P1: qua duyệt lại hoặc sửa có audit (OQ-4) |
| Người dùng | Xem / đánh dấu đọc | DA_CONG_BO + trong đối tượng | Được; ghi read marker |
| Người dùng | Xem | LUU_TRU / CHO_DUYET / ngoài đối tượng | Không thấy |
| Người ngoài scope | Mọi action quản trị | mọi | Chặn theo org/role/data-scope + audit |

### 6.3 State Transitions

```
RELEASE_ANNOUNCEMENT:
  (tạo) → NHAP → CHO_DUYET → DA_DUYET → DA_CONG_BO → LUU_TRU
              ↑__trả về__|        (đến lịch scheduled_at
                                  hoặc công bố ngay)
  NHAP → (xóa)  [chỉ NHAP được xóa]

READ_MARKER (per user × announcement):
  CHUA_DOC → DA_DOC  [ghi 1 lần, không đảo]
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| Thông báo | — | NHAP | Admin tạo nháp | — |
| Thông báo | NHAP | CHO_DUYET | Gửi duyệt khi đủ trường | — |
| Thông báo | CHO_DUYET | DA_DUYET | Reviewer duyệt | có (admin rút về NHAP — đề xuất) |
| Thông báo | CHO_DUYET | NHAP | Reviewer từ chối kèm ghi chú | — |
| Thông báo | DA_DUYET | DA_CONG_BO | Đến lịch công bố hoặc admin "công bố ngay" | không (rút = LUU_TRU) |
| Thông báo | DA_CONG_BO | LUU_TRU | Admin thu hồi/lưu trữ kèm lý do | không |
| Thông báo | NHAP | (xóa) | Admin xóa nháp | không |
| Read marker | CHUA_DOC | DA_DOC | Người dùng mở/xác nhận đọc | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Admin đóng giữa lúc soạn | Thông báo NHAP với nội dung đã lưu | Mở lại nháp tiếp tục | không cần |
| Đến lịch công bố nhưng tác vụ lên lịch lỗi | Thông báo DA_DUYET + scheduled_at quá hạn | Job chạy lại ở chu kỳ kế; admin vẫn "công bố ngay" được | cảnh báo admin "thông báo quá lịch chưa công bố" |
| 2 admin sửa cùng nháp đồng thời | Bản gốc + phiên sửa từng người | Người lưu sau thấy cảnh báo "thông báo vừa bị {ai} đổi" | không ghi đè im lặng |
| Phiên bản kỹ thuật bị rollback sau khi thông báo đã công bố | Thông báo DA_CONG_BO sai thực tế | Admin thu hồi kèm lý do (flow 5.3) | (đề xuất) thông báo đính chính qua duyệt |
| User mới được tạo sau khi thông báo công bố | Read marker chưa có | Thông báo còn hạn hiển thị → vẫn hiện chưa đọc cho user mới (đề xuất) | không cần |
| Reviewer từ chối trong lúc admin vừa sửa nháp | CHO_DUYET với nội dung cũ | Quyết định ghi trên phiên bản nội dung tại thời điểm duyệt; cảnh báo nếu nội dung vừa đổi | không |

### 6.5 Other Edge Cases

- Tổ chức chưa có thông báo nào: màn admin hiện empty state gợi ý tạo
  thông báo đầu tiên; người dùng không thấy badge.
- Thông báo quan trọng quá hạn đọc mà tỷ lệ đọc thấp: admin dùng nhắc lại
  (P1) hoặc kênh khác; hệ thống KHÔNG tự gửi lại nếu admin không yêu cầu.
- Nhãn phiên bản trùng nhau giữa 2 thông báo: cho phép (một phiên bản có
  thể có nhiều thông báo) nhưng cảnh báo trùng nhãn khi soạn.
- Thông báo DA_CONG_BO mà `scheduled_at`/thời điểm hiển thị bị sửa ngược:
  mọi sửa đổi sau công bố phải có audit (liên quan OQ-4).
- Thông báo lưu trữ vẫn còn read marker cũ: giữ marker để đo tỷ lệ đọc
  lịch sử.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Tiêu đề | bắt buộc, ≤150 ký tự |
| Nội dung thay đổi | bắt buộc, ≤10.000 ký tự (đề xuất) |
| Nhãn phiên bản hiển thị | bắt buộc, ≤30 ký tự; gợi ý dạng `x.y.z` nhưng KHÔNG bắt khớp Git tag (OQ-1) |
| Đối tượng nhận | bắt buộc; "tất cả người dùng" hoặc danh sách vai trò hợp lệ (đề xuất — OQ-2) |
| Mức quan trọng | bắt buộc; thường / quan trọng (đề xuất) |
| Lịch công bố | nếu đặt: phải là thời điểm trong tương lai |
| Ghi chú từ chối | bắt buộc khi reviewer từ chối, ≥10 ký tự |
| Lý do thu hồi/lưu trữ | bắt buộc, ≥10 ký tự |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Số thông báo/trang (danh sách admin) | 20 (đề xuất) | — | phân trang |
| Số thông báo trong danh sách người dùng | 10 mới nhất (đề xuất) | — | "xem tất cả" |
| Badge chưa đọc | hiển thị tối đa 9+ (đề xuất) | — | vẫn đếm đủ bên trong |
| Hạn hiển thị thông báo thường cho user mới | 90 ngày kể từ công bố (đề xuất) | rolling | user mới không thấy thông báo cũ hơn |
| Hạn đọc để tính "đọc đúng hạn" của thông báo quan trọng | 7 ngày kể từ công bố (đề xuất — chờ owner, OQ-5) | mỗi thông báo | chỉ ảnh hưởng chỉ số đo, không chặn user |
| Chu kỳ kiểm tra lịch công bố | 5 phút (đề xuất) | liên tục | công bố trễ tối đa 1 chu kỳ |
| Retention thông báo + read marker | chờ PRD OQ-6 (DPO duyệt); đề xuất 24 tháng | — | trước pilot chỉ dữ liệu synthetic |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Thiếu trường khi gửi duyệt | "Còn {n} thông tin bắt buộc chưa có — chưa thể gửi duyệt" | E-? |
| Lịch công bố trong quá khứ | "Thời điểm công bố phải sau thời điểm hiện tại" | E-? |
| Tự duyệt thông báo mình soạn | "Bạn không thể duyệt thông báo do chính mình soạn" | E-? |
| Xóa thông báo không phải nháp | "Chỉ có thể xóa thông báo ở trạng thái nháp" | E-? |
| Thu hồi thiếu lý do | "Nhập lý do thu hồi (tối thiểu 10 ký tự)" | E-? |
| Truy cập ngoài quyền | "Bạn không có quyền quản lý thông báo phiên bản" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Gửi duyệt | "Đã gửi thông báo chờ duyệt" |
| Duyệt | "Đã duyệt thông báo — sẵn sàng công bố" |
| Công bố ngay | "Thông báo đã được công bố tới {n} người dùng" |
| Đặt lịch | "Thông báo sẽ công bố lúc {thời điểm}" |
| Đánh dấu đã đọc | (không cần toast — badge tự giảm) |
| Thu hồi | "Đã thu hồi thông báo" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Chờ duyệt | "Thông báo đang chờ {reviewer} duyệt" |
| Từ chối | "Thông báo bị trả về: {ghi chú}" |
| Đã lên lịch | "Đã duyệt — chờ đến {thời điểm} để công bố" |
| Quá lịch chưa công bố | "Thông báo đã quá lịch công bố — kiểm tra lại" |
| Thông báo mới cho user | "Có {n} thông báo mới" |
| Trùng nhãn phiên bản | "Đã có thông báo cho phiên bản {nhãn} — kiểm tra trước khi tạo" |

## 8. Assumptions

- `account-access` cung cấp danh tính/phiên; `org-governance` cung cấp role
  + scope + audit; `platform-configuration` là nơi đặt cấu hình liên quan
  (đề xuất: ngưỡng mức quan trọng, hạn hiển thị).
- Reviewer là vai trò nghiệp vụ được gán quyền "duyệt thông báo" qua
  org-governance — không nhất thiết là super admin (đề xuất — OQ-3).
- Nhãn phiên bản là chuỗi hiển thị do admin nhập; KHÔNG suy từ commit/Git
  tag (PRD "Chưa làm": không tự động suy release note từ commit).
- Đối tượng nhận v1 gồm "tất cả người dùng" + lọc theo vai trò; lọc theo
  đơn vị/chi nhánh là P2 (đề xuất — OQ-2).
- Thông báo không chứa dữ liệu cá nhân nhạy cảm; retention theo OQ-6 PRD.
- Tỷ lệ đọc tính trên tập người dùng mục tiêu đang hoạt động tại thời
  điểm đo (đề xuất cách tính — OQ-5).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Thông báo lệch phiên bản đang chạy (rủi ro chính PRD) | thỉnh thoảng | Người dùng hiểu sai thay đổi, complaint, mất niềm tin kênh | Luồng thu hồi kèm lý do (5.3); nhãn phiên bản do admin xác nhận tay; P2 đối chiếu hiển thị với release thật |
| Thông báo sai sót đến tay toàn bộ người dùng | thỉnh thoảng | Lộ thông tin chưa đến hạn, hỗn loạn quy trình | Bắt buộc review trước công bố; chặn tự duyệt (đề xuất) |
| Lạm dụng thông báo (quá nhiều, không trọng yếu) | thường | Người dùng bỏ qua badge — thông báo quan trọng chìm | Mức quan trọng + đo tỷ lệ đọc; admin quy ước khi nào dùng "quan trọng" |
| Job lên lịch lỗi — thông báo không công bố đúng giờ | hiếm | Thông báo trễ, mất thời điểm truyền thông | Cảnh báo "quá lịch chưa công bố"; đường "công bố ngay" dự phòng |
| User mới bị spam thông báo cũ | thỉnh thoảng | Trải nghiệm onboarding rối | Hạn hiển thị 90 ngày (đề xuất) |
| Audit/retention chưa được DPO duyệt (OQ-6 PRD) | thường | Không dùng được dữ liệu thật | Chỉ synthetic trước khi privacy gate đạt |

## 10. Success Criteria (preliminary)

- Tỷ lệ người dùng mục tiêu đọc thông báo quan trọng trong 7 ngày — target
  chốt cùng PRD OQ-2 (đề xuất ≥80%).
- 100% thông báo ở DA_CONG_BO đã đi qua DA_DUYET (không đường tắt).
- 100% action duyệt/công bố/thu hồi có bản ghi audit đủ ai-khi nào-lý do.
- Thời gian trung bình từ soạn đến công bố ≤1 ngày làm việc (đề xuất).

## 11. Open Questions

- [x] OQ-1: Nhãn phiên bản có bắt buộc khớp Git tag/image release không? —
  Resolved (đề xuất): không — nhãn là chuỗi hiển thị do admin nhập, nghiệp
  vụ đồng bộ với release kỹ thuật do admin đảm bảo (PRD "Chưa làm": không
  tự suy từ commit; liên quan OQ-PL-05 reverse spec) — chờ Admin lead/
  Technical owner xác nhận.
- [x] OQ-2: Đối tượng nhận gồm những lựa chọn nào? — Resolved (đề xuất):
  v1 = toàn bộ người dùng + theo vai trò; theo đơn vị/chi nhánh để P2 —
  chờ Product owner xác nhận.
- [x] OQ-3: Ai là reviewer hợp lệ và có chặn tự duyệt không? — Resolved
  (đề xuất): vai trò "duyệt thông báo" gán qua org-governance; v1 chặn tự
  duyệt khi tổ chức có ≥2 người giữ quyền duyệt — chờ Admin lead xác nhận.
- [x] OQ-4: Cho sửa nội dung sau khi đã công bố không? — Resolved (đề
  xuất): cho phép sửa kèm audit + hiển thị "đã chỉnh sửa", KHÔNG reset
  read marker trừ khi admin chọn "bắt buộc đọc lại" (P1) — chờ Product
  owner xác nhận.
- [x] OQ-5: "Đúng hạn" của thông báo quan trọng là bao lâu và tỷ lệ đọc
  tính trên tập nào? — Resolved (đề xuất): 7 ngày; mẫu số = người dùng
  mục tiêu đang hoạt động tại thời điểm đo — chờ Product owner xác nhận
  (liên quan OQ-2 PRD về target metrics).
- [~] OQ-6: Tự động gợi ý nội dung thông báo từ danh sách thay đổi kỹ
  thuật? — Out of scope v1: PRD nêu rõ "Chưa làm: tự động suy release
  note từ commit hoặc thay release automation".

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd release-announcements` — capture user perspective
- `/brd release-announcements` — business case
- `/prd-epic release-announcements` — product scope
