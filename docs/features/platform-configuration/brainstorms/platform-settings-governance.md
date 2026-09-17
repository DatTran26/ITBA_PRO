---
type: brainstorm
feature: platform-configuration
status: draft
updated: 2026-09-14
links: [docs/downtown/prd.md, docs/_reverse/platform-communications-and-governance/reverse-spec.md]
---

# Cấu hình nền tảng có kiểm chứng — platform-configuration

## 1. Idea Seed

Một trung tâm cấu hình cho admin: mọi tham số vận hành của nền tảng (AI
provider, email/SMTP, tham số assessment, phiên bản hiển thị, hành vi
nghiệp vụ) được liệt kê theo nhóm trong một catalog có chủ, mỗi thay đổi
phải qua validation trước khi lưu, credential nhập một chiều không bao giờ
đọc lại plaintext, provider nào cũng test được kết nối trước khi dùng, và
mọi thay đổi nhạy cảm đều có lịch sử để xem lại hoặc rollback — admin điều
chỉnh vận hành mà không phải sửa source hay nhờ kỹ thuật cho từng thay đổi
nhỏ.

## 2. Context

Hành trình Admin trong PRD yêu cầu "cấu hình provider bằng secret phía
server, test connection và rollback" trước khi mở pilot — tức cấu hình
không chỉ là form lưu giá trị mà là một quy trình có kiểm chứng. PRD đặt
ràng buộc "service credential chỉ ở server boundary" và "Supabase, AI,
email và external integration là dependency có dữ liệu/quyền riêng". Rủi
ro chính PRD chỉ ra: setting sai ảnh hưởng toàn tổ chức hoặc lộ credential.

Nguồn ITBAAI đã có nền settings: GET có mask giá trị dạng secret và PATCH
cập nhật; SMTP password đi qua RPC encryption và không trả plaintext khi
đọc (reverse spec FR-PL-02, FR-PL-04) — đây là bằng chứng triển khai, chưa
phải bằng chứng nhu cầu. Feature này là MoSCoW `Should` — không nằm trong
cam kết v1, nhưng là nền vận hành cho các feature `Must` (kênh email của
`account-access`/`contextual-notifications`, provider AI của các tính năng
AI, pricing setting của `ai-usage-monitoring`, thông tin phiên bản của
`release-announcements`). Catalog setting chính thức và mô hình sở hữu
setting hệ thống vs tổ chức vẫn cần owner chốt.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Admin | Muốn đổi cấu hình vận hành (SMTP, AI provider, tham số module) nhưng phải nhờ kỹ thuật sửa source/env | Tự chỉnh setting theo nhóm trong giao diện, có validate và test trước khi áp dụng |
| Admin | Không biết giá trị nào đã đổi so với mặc định, ai đổi lúc nào | Lịch sử thay đổi đầy đủ + lọc "khác mặc định" + rollback được |
| Security owner | Credential (SMTP key, AI key) dễ lộ qua màn hình cấu hình hoặc log | Secret nhập một chiều, không bao giờ trả plaintext, không nằm trong history |
| Vận hành nền tảng (platform operator) | Setting mức hệ thống lẫn với setting của từng tenant | Phân biệt phạm vi hệ thống vs tổ chức rõ ràng |
| Các feature consumer (operational-email, ai-usage-monitoring, release-announcements...) | Đọc cấu hình từ nhiều nguồn khác nhau, không biết đâu là chuẩn | Một nguồn cấu hình duy nhất có chủ |

## 4. Capabilities Breakdown

### P0 — must have

- Catalog setting theo nhóm có chủ: AI (provider, model mặc định, ngưỡng
  sử dụng), Email (SMTP host/port/from), Assessment (tham số mặc định của
  module đánh giá), Version (phiên bản hiển thị), Feature behavior (cờ
  hành vi nghiệp vụ được công bố). Mỗi setting có key, nhóm, kiểu giá trị,
  phạm vi (hệ thống/tổ chức), giá trị mặc định an toàn và mô tả tác động.
- Đọc cấu hình: admin xem giá trị hiện hành; giá trị secret luôn hiển thị
  dạng masked (chỉ biết "đã cấu hình/chưa"), không bao giờ trả plaintext.
- Sửa cấu hình có validation: kiểu giá trị, miền giá trị, format (URL,
  email, port, số), ràng buộc chéo; giá trị vượt security/business
  invariant bị chặn (vd không thể tắt audit, không nhập secret vào field
  không-secret).
- Secret write-only: nhập credential qua field riêng → lưu phía server;
  đọc lại chỉ thấy trạng thái "đã cấu hình"; xóa secret là hành động riêng
  có cảnh báo.
- Test connection: với setting provider (SMTP, AI), admin chạy kiểm tra
  kết nối trước/sau khi lưu; kết quả (thành công/thất bại + thông điệp
  không chứa secret) được ghi lại kèm thời điểm và người chạy.
- Lịch sử thay đổi: mọi lưu tạo revision (giá trị trước/sau, ai, khi nào,
  lý do nếu nhập); với setting secret chỉ ghi "đã thay đổi secret".
- Rollback: chọn một revision trước của setting không-secret → xem diff →
  khôi phục; rollback tạo revision mới có audit.
- Áp dụng an toàn: thay đổi có hiệu lực theo chế độ đã công bố của setting
  (áp ngay); setting ảnh hưởng toàn tổ chức có cảnh báo xác nhận trước lưu.
- Phân quyền: chỉ vai trò admin thao tác; setting phạm vi hệ thống chỉ
  vận hành nền tảng được chỉnh.

### P1 — should have

- Lọc "khác mặc định" và so sánh giá trị hiện tại với safe default.
- Cảnh báo cấu hình bắt buộc còn thiếu (vd SMTP chưa cấu hình → các tính
  năng email không hoạt động) dạng checklist trạng thái sẵn sàng.
- Export cấu hình không-secret ra file để nhập lại cho tenant khác
  (onboard), không gồm secret.
- Liên kết từ setting tới feature consumer tương ứng (vd setting SMTP →
  trạng thái kênh email).

### P2 — nice to have

- Dual control: thay đổi setting nhạy cảm cần người thứ hai phê duyệt.
- Lên lịch áp dụng thay đổi (scheduled activation).
- Gói cấu hình versioned cho tenant (config bundle).

## 5. Core Flows (Happy Path)

### 5.1 Xem và chỉnh sửa setting

1) Admin vào "Cấu hình nền tảng" → chọn nhóm (AI / Email / Assessment /
   Version / Feature behavior).
2) Danh sách setting của nhóm hiện: key, giá trị hiện tại (secret masked),
   phạm vi, "khác mặc định" hay không.
3) Admin sửa giá trị → hệ thống validate (kiểu, miền, format, ràng buộc
   chéo) → lỗi thì báo tại field, không lưu.
4) Hợp lệ → nếu setting ảnh hưởng toàn tổ chức, hiện xác nhận tác động →
   lưu → tạo revision (trước/sau + ai + lý do) → áp dụng ngay → báo thành
   công.

```
Admin                          Hệ thống                          Provider
───────────────────────────────────────────────────────────────────────────
chọn nhóm setting
      │
      ▼
┌──────────────────────────┐
│ Danh sách setting:       │
│ giá trị hiện tại,        │
│ secret masked, phạm vi   │
└───────────┬──────────────┘
            │ sửa giá trị + lưu
            ▼
── Validate hợp lệ? ──┐
      │               │
   Không ▶ báo lỗi    │
     tại field        │
     Có ▼             │
── Setting ảnh hưởng toàn tổ chức? ──┐
      │                              │
   Có ▶ xác nhận "thay đổi này áp   │
        dụng cho toàn tổ chức"       │
      │         │ hủy ▶ không lưu    │
      │        OK                    │
      ◀─────────┘                    │
      ▼                              │
┌──────────────────────────┐         │
│ Lưu giá trị mới          │         │
│ + revision (trước/sau,   │         │
│   ai, lý do)             │         │
│ + audit                  │         │
└───────────┬──────────────┘         │
            ▼                        │
   "Đã lưu cấu hình — áp dụng ngay"  │
```

### 5.2 Cấu hình provider và test connection

1) Admin mở nhóm Email → nhập SMTP host/port/username; nhập password qua
   field secret riêng (không hiện lại).
2) Bấm "Kiểm tra kết nối" → hệ thống thử kết nối provider bằng cấu hình
   đã lưu → hiển thị thành công hoặc lỗi (không chứa secret).
3) Kết quả test được ghi lại (ai, khi nào, kết quả, thông điệp).
4) Test thất bại → setting vẫn lưu được nhưng mang trạng thái "chưa kiểm
   chứng"; kênh email không được bật cho tới khi test đạt.

### 5.3 Xem lịch sử và rollback

1) Admin mở "Lịch sử thay đổi" của một setting (hoặc toàn bộ nhóm).
2) Danh sách revision: giá trị trước → sau, ai đổi, khi nào, lý do.
3) Chọn revision trước → xem diff so với hiện tại → "Khôi phục giá trị
   này" → nhập lý do → hệ thống áp giá trị cũ như thay đổi mới (revision
   mới + audit).
4) Setting secret không rollback giá trị — chỉ nhập secret mới.

### 5.4 Checklist cấu hình bắt buộc khi bootstrap tenant

1) Admin mở màn "Trạng thái cấu hình" → danh sách setting bắt buộc kèm
   trạng thái: chưa cấu hình / đã cấu hình / đã kiểm chứng.
2) Setting bắt buộc còn thiếu hiện cảnh báo với đường dẫn tới màn cấu
   hình tương ứng.
3) Hoàn tất từng mục → checklist chuyển xanh; feature phụ thuộc (vd email)
   chỉ sẵn sàng khi setting bắt buộc đã kiểm chứng.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Giá trị hợp lệ theo kiểu/miền/format? | Cho lưu | Báo lỗi tại field, không lưu |
| D2 | 5.1 | Giá trị vi phạm invariant (tắt audit, secret vào field thường, vượt ngưỡng cho phép)? | Chặn + báo "giá trị vượt giới hạn cho phép" | Cho lưu |
| D3 | 5.1 | Setting ảnh hưởng toàn tổ chức? | Xác nhận tác động trước lưu | Lưu trực tiếp |
| D4 | 5.1 | Người thao tác là admin của đúng phạm vi (org setting → admin tổ chức; system setting → vận hành nền tảng)? | Cho thao tác | Từ chối + ghi nhận |
| D5 | 5.2 | Field là secret? | Lưu một chiều phía server; đọc trả trạng thái "đã cấu hình" | Lưu/đọc giá trị bình thường |
| D6 | 5.2 | Test connection thành công? | Ghi kết quả đạt; setting chuyển "đã kiểm chứng" | Ghi kết quả lỗi; setting ở "chưa kiểm chứng", kênh phụ thuộc không bật |
| D7 | 5.3 | Setting là secret? | Không rollback — chỉ nhập secret mới | Cho rollback giá trị |
| D8 | 5.3 | Revision được chọn hợp lệ (cùng setting, chưa bị xóa)? | Áp giá trị cũ như revision mới | Báo không rollback được |
| D9 | 5.4 | Setting bắt buộc đã kiểm chứng? | Checklist đạt, feature phụ thuộc sẵn sàng | Cảnh báo thiếu + link tới màn cấu hình |

### 6.2 Scenario Matrix

| Loại setting | Đọc | Sửa | Test | Rollback | Ai được thao tác |
|---|---|---|---|---|---|
| Thường, phạm vi tổ chức | hiện giá trị | validate + lưu + audit | n/a | rollback giá trị | admin tổ chức |
| Secret, phạm vi tổ chức | chỉ "đã/chưa cấu hình" | write-only + audit "đã đổi secret" | test được | chỉ nhập mới | admin tổ chức |
| Thường, phạm vi hệ thống | hiện giá trị | validate + lưu + audit | n/a | rollback giá trị | vận hành nền tảng |
| Secret, phạm vi hệ thống | chỉ trạng thái | write-only + audit | test được | chỉ nhập mới | vận hành nền tảng |
| Bị khóa bởi invariant | hiện giá trị | không cho sửa (vd audit luôn bật) | n/a | n/a | không ai sửa được |
| Bắt buộc chưa cấu hình | hiện "chưa cấu hình" + cảnh báo | như trên theo loại | theo loại | theo loại | theo phạm vi |

### 6.3 State Transitions

```
setting_value:  chưa-cấu-hình ──lưu lần đầu──▶ đã-cấu-hình
                     ▲                            │
                     └── xóa giá trị (nếu cho) ───┘
đã-cấu-hình ──test đạt──▶ đã-kiểm-chứng
đã-cấu-hình ──test lỗi──▶ chưa-kiểm-chứng ──test lại đạt──▶ đã-kiểm-chứng

setting_revision:  append-only — mỗi lưu/rollback tạo revision mới
connection_test:   append-only — mỗi lần test tạo bản ghi kết quả
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| setting_value | — | chưa-cấu-hình | tenant/feature tồn tại nhưng chưa nhập | — |
| setting_value | chưa-cấu-hình | đã-cấu-hình | lưu giá trị hợp lệ lần đầu | có (xóa giá trị nếu được phép) |
| setting_value | đã-cấu-hình | đã-kiểm-chứng | test connection đạt (setting provider) | — |
| setting_value | đã-cấu-hình/đã-kiểm-chứng | chưa-kiểm-chứng | giá trị provider đổi hoặc test lỗi | có (test lại) |
| setting_revision | — | recorded | mỗi lần lưu/rollback | không — append-only |
| connection_test | — | recorded | mỗi lần chạy test | không — append-only |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Admin đóng trình duyệt giữa form | giá trị cũ vẫn hiệu lực, chưa có revision | mở lại form, nhập lại | không cần |
| Test connection timeout/provider không phản hồi | bản ghi test kết quả lỗi "không phản hồi" | chạy lại test khi provider phục hồi | — |
| Lưu thành công nhưng áp dụng thất bại (consumer đọc lỗi) | revision đã ghi; giá trị mới đã lưu | consumer đọc lại theo chu kỳ; admin rollback nếu cần | cảnh báo vận hành |
| 2 admin sửa cùng setting đồng thời | bản lưu sau ghi đè giá trị | cảnh báo "setting vừa được {người} cập nhật — tải lại" | cả 2 revision đều trong lịch sử |
| Secret đã nhập nhưng test fail liên tục | secret đã lưu, trạng thái chưa-kiểm-chứng | sửa host/credential rồi test lại | xóa secret nếu sai hoàn toàn |

### 6.5 Other Edge Cases

- Admin mở form sửa setting secret nhưng không nhập gì vào field secret:
  giữ nguyên secret cũ (field rỗng = không đổi), chỉ đổi các field thường.
- Xóa secret (vô hiệu provider): hành động riêng có cảnh báo "kênh phụ
  thuộc sẽ ngừng" → audit; kênh email/AI ngừng hoạt động.
- Giá trị mặc định bị xóa: cho "khôi phục mặc định" trên setting không
  bắt buộc — tạo revision về default.
- Setting đang được consumer đọc khi bị đổi: consumer đọc giá trị mới ở
  lần đọc kế tiếp; không có giá trị giữa chừng.
- Catalog thiếu key cần thiết: admin không tự tạo key — báo vận hành nền
  tảng bổ sung catalog (quy trình ngoài feature).
- Số ký tự đặc biệt trong giá trị (mật khẩu SMTP có ký tự lạ): lưu đúng
  nguyên văn, không trim/transform.
- Người xem không phải admin: không thấy màn cấu hình — deny-by-default
  qua `org-governance`.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Host/URL provider | bắt buộc, định dạng hostname/URL hợp lệ |
| Port | số nguyên 1–65535 |
| From email (SMTP) | bắt buộc, định dạng email hợp lệ |
| Giá trị số (quota, ngưỡng, timeout) | số trong miền đã công bố của từng key |
| Giá trị enum (provider, model, chế độ) | phải thuộc danh sách của catalog |
| Giá trị boolean/toggle | chỉ bật/tắt trong phạm vi cho phép của invariant |
| Secret | chỉ nhập qua field secret; không hiển thị lại; không chấp nhận qua field thường |
| Lý do thay đổi | tùy chọn với setting thường; bắt buộc (5–500 ký tự) với setting được đánh dấu nhạy cảm |
| Key setting | chỉ tồn tại trong catalog — không tạo key mới từ giao diện |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Độ dài giá trị text | 2.000 ký tự | mỗi setting | chặn lưu (đề xuất — chờ duyệt) |
| Số key trong catalog | ~200 key | hệ thống | vượt thì mở rộng catalog qua vận hành (đề xuất) |
| Timeout test connection | 10 giây | mỗi lần test | ghi kết quả lỗi "không phản hồi" (đề xuất) |
| Trang lịch sử thay đổi | 50 revision | mỗi trang | phân trang |
| Retention lịch sử thay đổi | tối thiểu 12 tháng | rolling | chờ DPO (liên quan OQ-6 PRD) |
| Số kết quả test giữ lại / setting | 20 lần gần nhất | theo setting | bản cũ hơn lưu trữ nén (đề xuất) |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Giá trị sai định dạng | "Giá trị không hợp lệ: {lý do} — kiểm tra lại trường {tên}" | E-? |
| Vượt invariant | "Không thể lưu — giá trị này vượt giới hạn an toàn của hệ thống" | E-? |
| Không có quyền | "Bạn không có quyền thay đổi cấu hình này" | E-? |
| Setting hệ thống | "Cấu hình này thuộc phạm vi hệ thống — liên hệ vận hành nền tảng" | E-? |
| Secret vào field thường | "Không nhập thông tin bí mật vào trường này — dùng trường bảo mật riêng" | E-? |
| Rollback secret | "Không thể khôi phục giá trị bảo mật — vui lòng nhập giá trị mới" | E-? |
| Test timeout | "Không kết nối được sau {số} giây — kiểm tra địa chỉ và thông tin đăng nhập" | E-? |
| Thiếu lý do (setting nhạy cảm) | "Vui lòng nhập lý do thay đổi cấu hình này" | E-? |
| Sửa đồng thời | "Cấu hình vừa được {người} cập nhật — tải lại trước khi sửa" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Lưu setting | "Đã lưu cấu hình — thay đổi có hiệu lực ngay" |
| Test đạt | "Kết nối thành công — cấu hình đã được kiểm chứng" |
| Secret đã lưu | "Đã lưu thông tin bảo mật — hệ thống sẽ không hiển thị lại giá trị này" |
| Rollback | "Đã khôi phục giá trị từ {thời điểm} — thay đổi được ghi vào lịch sử" |
| Khôi phục mặc định | "Đã đưa {tên setting} về giá trị mặc định" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Trước khi lưu setting toàn tổ chức | "Thay đổi này áp dụng cho toàn tổ chức và được ghi vào lịch sử — tiếp tục?" |
| Secret masked | "•••••••• (đã cấu hình {ngày}) — nhập giá trị mới để thay thế" |
| Setting chưa kiểm chứng | "Cấu hình chưa được kiểm tra kết nối — tính năng phụ thuộc chưa hoạt động" |
| Checklist thiếu | "Còn {n} cấu hình bắt buộc chưa hoàn tất" |
| Empty state lịch sử | "Chưa có thay đổi nào được ghi lại" |
| Nguồn giá trị | "Đang dùng giá trị mặc định của hệ thống" / "Đã tùy chỉnh bởi {người} vào {ngày}" |

## 8. Assumptions

- Catalog setting (key, nhóm, kiểu, phạm vi, mặc định, bắt buộc) do sản
  phẩm công bố; admin không tự tạo key — tránh cấu hình "tự do" mất kiểm
  soát.
- Phạm vi có 2 mức: `hệ thống` (toàn platform, do vận hành nền tảng quản)
  và `tổ chức` (do admin của tenant đó quản). Org admin không thấy/chỉnh
  setting hệ thống.
- Secret chỉ sống ở server boundary (PRD Mục 9): nhập một chiều, lưu dạng
  mã hóa phía server, không bao giờ trả plaintext qua bất kỳ surface nào
  (đọc, tìm kiếm, export, lịch sử, test).
- Thay đổi áp dụng ngay không cần restart (assumption về kiến trúc đọc
  cấu hình của consumer).
- `org-governance` cung cấp vai trò admin + phạm vi và audit từ chối;
  `account-access` cung cấp phiên admin hợp lệ.
- SMTP/AI key mặc định do nền tảng cung cấp ở phạm vi hệ thống; tenant có
  thể override bằng key riêng ở phạm vi tổ chức (đề xuất — OQ-2).
- Version setting là bản ghi hiển thị phục vụ `release-announcements`,
  không phải release automation; deployment authority (OQ-5 PRD) nằm
  ngoài feature.
- Các số liệu giới hạn ở Mục 7.2 là đề xuất thận trọng — chờ owner chốt.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Setting sai (SMTP sai, quota AI sai, cờ sai) → incident toàn tổ chức | thỉnh thoảng | email không gửi, AI lỗi hàng loạt, tính năng tắt nhầm — pilot chững | validation trước lưu, safe default, test connection, xác nhận tác động toàn tổ chức, rollback + audit |
| Credential lộ (hiển thị plaintext, log giá trị, export chứa secret) | hiếm | lộ khóa AI/SMTP — rủi ro bảo mật nghiêm trọng, thu hồi key khẩn | write-only + mask mọi surface, history chỉ ghi "đã đổi secret", export loại trừ secret, deny-by-default |
| Admin bỏ qua test connection rồi bật kênh | thường | kênh email/AI chết ngay khi dùng thật, mất lời mời/thông báo | trạng thái "chưa kiểm chứng" hiển thị rõ; kênh phụ thuộc không bật khi chưa test đạt |
| Catalog thiếu key → admin vẫn phải nhờ sửa source | thường | feature mất giá trị, quay lại thói quen sửa env tay | quy trình bổ sung catalog qua vận hành; review catalog trước mỗi slice |
| Hai admin cấu hình xung đột (1 bật 1 tắt) | thỉnh thoảng | trạng thái lắp bắp khó điều tra | cảnh báo sửa đồng thời; mọi revision có tên người đổi |
| Retention history quá ngắn → không điều tra được ai đổi gì | hiếm | audit fail, không chứng minh được cho khách hàng | giữ ≥12 tháng, append-only (OQ-6 PRD chờ DPO) |
| Compliance: lưu/xử lý cấu hình theo khu vực chưa rõ (OQ-3 PRD) | thỉnh thoảng | thiết kế phải làm lại khi mở thị trường khác | mặc định Việt Nam/PDPA cho pilot; scope hệ thống/tổ chức đã tách để mở rộng |

## 10. Success Criteria (preliminary)

- Tỷ lệ thay đổi cấu hình thành công không gây incident — đo thành công
  của PRD Mục 7.28; target chính thức chờ OQ-2 sản phẩm (đề xuất ≥98%).
- 100% thay đổi cấu hình có revision + audit đầy đủ.
- 0 sự cố lộ secret qua bất kỳ surface nào (guardrail, bám M-GR-01).
- 100% provider setting được test connection trước khi kênh phụ thuộc đi
  vào dùng thật.
- Admin hoàn tất cấu hình provider mới (SMTP) trong ≤30 phút không cần kỹ
  thuật (đề xuất — chờ duyệt).

## 11. Open Questions

- [ ] OQ-1: Ai sở hữu setting phạm vi hệ thống — vai trò "vận hành nền
  tảng" nào trong mô hình tenant (platform operator ngoài catalog vai trò
  của tổ chức)?
- [ ] OQ-2: SMTP/AI key là của nền tảng hay tenant tự cấp (BYOK) — mặc
  định nào cho pilot, và tenant override có cần duyệt không?
- [ ] OQ-3: Có bắt buộc test connection đạt trước khi LƯU provider
  setting không, hay chỉ bắt buộc trước khi bật kênh phụ thuộc?
- [ ] OQ-4: Danh sách key trong catalog v1 gồm những gì cho từng nhóm
  (AI/email/assessment/version/feature behavior) — ai chốt?
- [ ] OQ-5: Retention cho lịch sử thay đổi và kết quả test — giữ bao lâu
  (liên quan OQ-6 PRD)?
- [ ] OQ-6: Deployment authority (OQ-5 PRD) ảnh hưởng gì tới nhóm setting
  Version — version setting có cần đối chiếu với release thật không?
- [ ] OQ-7: Các giới hạn Mục 7.2 (2.000 ký tự, 10 giây test, 50
  revision/trang, 20 test giữ lại) có được owner chấp nhận không?

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd platform-configuration` — capture user perspective
- `/brd platform-configuration` — business case
- `/prd-epic platform-configuration` — product scope
