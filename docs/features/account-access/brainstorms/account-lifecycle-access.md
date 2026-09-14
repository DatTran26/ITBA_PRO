---
type: brainstorm
feature: account-access
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md]
---

# Vòng đời tài khoản và truy cập — account-access

## 1. Idea Seed

Thiết lập danh tính và phiên làm việc cho mọi vai trò nội bộ: admin tạo/mời tài
khoản, người dùng xác thực bằng email + mật khẩu, đặt lại mật khẩu khi quên,
đăng xuất và khôi phục phiên. Mọi truy cập đều phải thuộc đúng tổ chức được
cấp — tài khoản không thể vào surface ngoài phạm vi. Ứng viên không có tài
khoản; họ vào bằng link được cấp của module nghiệp vụ, không qua feature này.

## 2. Context

Đây là feature nền của toàn sản phẩm: mọi hành trình trong PRD (HR, quản lý,
nhân viên, interviewer, admin) đều bắt đầu bằng "đăng nhập và làm việc trong
đúng tổ chức/phạm vi". Town Hown là B2B nên danh tính được cấp bởi tổ chức
khách hàng, không phải tự đăng ký công khai — admin mời, user kích hoạt. Hiện
chưa có quyết định SSO/federation nên v1 chỉ làm email + mật khẩu; nếu sau này
có SSO thì luồng mời/đặt mật khẩu vẫn cần cho tài khoản nội bộ. Rủi ro chính
được PRD chỉ ra: có tài khoản nhưng sai phạm vi tổ chức — do đó kiểm tra quan
hệ tài khoản ↔ tổ chức là một phần của xác thực, không phải bổ sung sau.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Admin | Cấp tài khoản cho nhân sự mới mà không kiểm soát được ai đang truy cập | Mời tài khoản theo tổ chức, biết trạng thái từng tài khoản |
| HR / quản lý / nhân viên / interviewer | Quên mật khẩu phải nhờ admin, phiên hết hạn không rõ lý do | Tự đặt lại mật khẩu, vào đúng workspace nhanh |
| Cựu nhân viên (gián tiếp, qua admin) | Tài khoản còn sống sau nghỉ việc | Bị vô hiệu hóa kịp thời, không còn đăng nhập được |
| Security/audit owner | Không truy vết được ai đăng nhập lúc nào, từ đâu | Lịch sử truy cập tối thiểu để điều tra |

## 4. Capabilities Breakdown

### P0 — must have

- Admin mời tài khoản nội bộ: nhập họ tên + email + vai trò ban đầu + đơn vị
  thuộc tổ chức → hệ thống gửi email mời có link kích hoạt (đặt mật khẩu lần
  đầu).
- Đăng nhập email + mật khẩu: validate → kiểm tra trạng thái tài khoản → kiểm
  tra quan hệ với tổ chức đang truy cập → tạo phiên → vào workspace.
- Khóa tạm thời sau số lần sai mật khẩu liên tiếp; xác minh không-phải-robot
  (captcha) khi cần.
- Quên mật khẩu: nhập email → nhận link đặt lại có hạn → đặt mật khẩu mới →
  hủy toàn bộ phiên cũ.
- Đăng xuất chủ động; phiên tự hết hạn khi không hoạt động; đăng nhập lại tạo
  phiên mới.
- Trạng thái tài khoản: invited → active → suspended ↔ active → deactivated;
  admin suspend/deactivate; deactivate là kết thúc (không đảo ngược trên cùng
  email — tạo mới nếu cần).
- Đổi mật khẩu khi đang đăng nhập (nhập mật khẩu hiện tại → mật khẩu mới →
  hủy các phiên khác).
- Hồ sơ tối thiểu: họ tên, email (khóa định danh), vai trò hiển thị, đơn vị;
  user sửa được họ tên và ảnh đại diện.
- Ghi nhận sự kiện truy cập tối thiểu (đăng nhập thành công/thất bại, đặt lại
  mật khẩu, thu hồi phiên) để phục vụ truy vết — audit chi tiết thuộc
  org-governance.
- Thông điệp chống dò tài khoản: quên mật khẩu luôn trả lời chung, không tiết
  lộ email có tồn tại hay không.

### P1 — should have

- Buộc đổi mật khẩu ở lần đăng nhập đầu tiên sau khi admin tạo trực tiếp
  (không qua link mời).
- Danh sách phiên đang hoạt động của tôi + thu hồi từng phiên.
- Đổi email đăng nhập có xác nhận qua địa chỉ mới trước khi áp dụng.
- Admin gửi lại lời mời khi link hết hạn.

### P2 — nice to have

- SSO/federation với nhà cung cấp danh tính của khách hàng (chờ quyết định —
  PRD đánh dấu "chưa làm").
- Xác thực đa yếu tố (MFA), tối thiểu cho vai trò admin.
- Chính sách mật khẩu nâng cao (rotation, cấm dùng lại N mật khẩu gần nhất).

## 5. Core Flows (Happy Path)

### 5.1 Admin mời và user kích hoạt tài khoản

1) Admin vào quản trị người dùng → "Mời tài khoản" → nhập họ tên, email, vai
   trò ban đầu, đơn vị.
2) Hệ thống validate email định dạng + chưa tồn tại trong tổ chức → tạo tài
   khoản trạng thái INVITED → gửi email mời kèm link kích hoạt (hạn 72 giờ).
3) User mở link → form đặt mật khẩu lần đầu → nhập 2 lần, đạt chính sách.
4) Hệ thống đánh dấu link USED, chuyển tài khoản sang ACTIVE, tạo phiên đầu
   tiên → vào workspace đúng tổ chức.
5) Admin thấy trạng thái tài khoản đổi thành ACTIVE trong danh sách.

```
Admin                         Hệ thống                              User được mời
─────────────────────────────────────────────────────────────────────────────────

"Mời tài khoản"
họ tên, email,
vai trò, đơn vị
      │
      ▼
── Email hợp lệ và chưa có trong tổ chức? ──┐
      │                                    │
   Không ▶ báo lỗi "Email đã tồn tại"      │
      │                                    │
     Có ▼                                  │
┌─────────────────────────┐                │
│ Tạo tài khoản INVITED   │                │
│ + phát hành link 72h    │                │
│ + gửi email mời         │───────────────▶│ mở email, bấm link
└─────────────────────────┘                │        │
                                           │        ▼
                                           │   ── Link còn hạn và chưa dùng? ──┐
                                           │        │                          │
                                           │     Không ▶ trang "link hết hạn, │
                                           │      yêu cầu gửi lại"            │
                                           │        │                          │
                                           │       Có ▼                        │
                                           │   form đặt mật khẩu (2 lần)       │
                                           │        │                          │
                                           │   ── Đạt chính sách? ──┐          │
                                           │        │Không ▶ báo lỗi tại form  │
                                           │       Có ▼                        │
                                           ▼
                              ┌──────────────────────────┐
                              │ Link → USED              │
                              │ Tài khoản → ACTIVE       │
                              │ Tạo phiên đầu tiên       │
                              └───────────┬──────────────┘
                                          ▼
                                   vào workspace
                                   đúng tổ chức
```

### 5.2 Đăng nhập

1) User nhập email + mật khẩu tại trang đăng nhập của tổ chức.
2) Hệ thống kiểm tra captcha nếu tài khoản/IP đang trong trạng thái nghi ngờ
   (sau 3 lần sai liên tiếp — đề xuất, chờ duyệt).
3) So khớp email + mật khẩu; sai → tăng bộ đếm, báo lỗi chung "Email hoặc mật
   khẩu không đúng".
4) Đúng → kiểm tra trạng thái tài khoản (INVITED/SUSPENDED/DEACTIVATED → từ
   chối với thông điệp phù hợp).
5) Kiểm tra tài khoản thuộc tổ chức đang truy cập → không thuộc → từ chối.
6) Tạo phiên → vào workspace; bộ đếm sai reset về 0.

```
Trang đăng nhập (theo tổ chức)
        │ email + mật khẩu
        ▼
── Đang nghi ngờ (≥3 lần sai liên tiếp)? ──┐
        │                                 │
       Có ▶ hiện captcha xác minh         │
        │         │ fail ▶ báo lỗi, giữ đếm
        │        pass                     │
        ◀─────────┘                       │
        ▼                                 │
── Email + mật khẩu khớp? ──┐             │
        │                    │            │
     Không ▶ +1 bộ đếm sai   │            │
        │    đủ 5 lần ─▶ KHÓA TẠM 15 phút │
        │    báo "Email hoặc mật khẩu     │
        │    không đúng"                  │
       Có ▼                               │
── Trạng thái = ACTIVE? ──┐               │
        │                  │              │
     Không ▶ INVITED: "Chưa kích hoạt —   │
        │    kiểm tra email mời"          │
        │  SUSPENDED/DEACTIVATED:         │
        │    "Tài khoản đã bị vô hiệu     │
        │    hóa — liên hệ quản trị viên" │
       Có ▼                               │
── Thuộc tổ chức đang truy cập? ──┐       │
        │                          │      │
     Không ▶ "Email hoặc mật khẩu không   │
        │    đúng" (không lộ lý do)       │
       Có ▼                               │
   tạo phiên → vào workspace
```

### 5.3 Quên / đặt lại mật khẩu

1) User bấm "Quên mật khẩu" → nhập email → hệ thống luôn trả lời "Nếu email
   tồn tại, chúng tôi đã gửi hướng dẫn" (chống dò tài khoản).
2) Email tồn tại và thuộc tổ chức → phát hành link đặt lại (hạn 1 giờ — đề
   xuất, chờ duyệt) → gửi qua SMTP; tối đa 3 link/giờ/email.
3) User mở link còn hạn, chưa dùng → form mật khẩu mới → đạt chính sách →
   link USED, mật khẩu cập nhật, toàn bộ phiên cũ bị thu hồi.
4) User đăng nhập bằng mật khẩu mới.

### 5.4 Đăng xuất và hết hạn phiên

1) Đăng xuất chủ động → phiên hiện tại REVOKED → về trang đăng nhập.
2) Không hoạt động quá ngưỡng (đề xuất 8 giờ — chờ duyệt) → phiên EXPIRED →
   lần tương tác sau bị đưa về đăng nhập với thông báo "Phiên đã hết hạn".
3) Đăng nhập lại → phiên mới, quay lại màn hình đang xem nếu còn hợp lệ.

### 5.5 Admin suspend / deactivate tài khoản

1) Admin chọn tài khoản → Suspend (tạm) hoặc Deactivate (kết thúc).
2) Hệ thống chuyển trạng thái, thu hồi mọi phiên đang sống, ghi sự kiện truy
   cập (ai, khi nào, lý do nếu nhập).
3) Suspend → có thể mở lại (ACTIVE); Deactivate → không đảo ngược; cùng email
   muốn dùng lại thì mời tài khoản mới.
4) Không cho suspend/deactivate tài khoản admin cuối cùng của tổ chức.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Email đã có trong tổ chức? | Báo "Email đã tồn tại" cho admin | Tạo INVITED + gửi link |
| D2 | 5.1/5.3 | Link còn hạn và chưa dùng? | Cho đặt mật khẩu | Trang "link hết hạn" + đường dẫn xin link mới |
| D3 | 5.2 | Mật khẩu khớp? | Kiểm tra tiếp trạng thái | +1 đếm sai, lỗi chung; đủ ngưỡng → khóa tạm |
| D4 | 5.2 | Trạng thái = ACTIVE? | Kiểm tra tổ chức | Từ chối theo trạng thái (INVITED/SUSPENDED/DEACTIVATED) |
| D5 | 5.2 | Thuộc tổ chức đang truy cập? | Tạo phiên | Lỗi chung — không lộ tài khoản tồn tại ở tổ chức khác |
| D6 | 5.3 | Email tồn tại? | Gửi link (nếu chưa vượt 3/giờ) | Vẫn trả lời giống hệt — không tiết lộ |
| D7 | 5.5 | Là admin cuối cùng của tổ chức? | Chặn suspend/deactivate | Cho phép + thu hồi phiên |
| D8 | 5.1/5.3 | Mật khẩu mới đạt chính sách? | Lưu + thu hồi phiên cũ | Báo lỗi tại form, link vẫn còn dùng được |

### 6.2 Scenario Matrix

| Trạng thái tài khoản | Đăng nhập | Link mời/reset | Hệ quả |
|---|---|---|---|
| INVITED | Từ chối — "chưa kích hoạt" | Link mời dùng được → ACTIVE | Phiên đầu tạo sau kích hoạt |
| ACTIVE | Cho phép nếu đúng org | Link reset dùng được | Phiên mới, đếm sai reset |
| ACTIVE, sai mật khẩu ≥5 lần | Khóa tạm 15 phút | Reset link vẫn gửi được | Đếm reset sau khi hết khóa hoặc đổi mật khẩu |
| SUSPENDED | Từ chối — "bị vô hiệu hóa" | Link không dùng được | Phiên cũ đã thu hồi |
| DEACTIVATED | Từ chối — "bị vô hiệu hóa" | Link không dùng được | Chỉ quay lại bằng lời mời mới |

### 6.3 State Transitions

```
account:   INVITED ──đặt mật khẩu──▶ ACTIVE ⇄ SUSPENDED
              │                        │
              └── link hết hạn ──┐     └──▶ DEACTIVATED (cuối)
                                 ▼
                    vẫn INVITED — admin gửi lại lời mời (link mới)

access_link (invite/reset): ISSUED → USED | EXPIRED
session: ACTIVE → EXPIRED (idle) | REVOKED (logout / admin / đổi mật khẩu)
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| account | — | INVITED | admin mời | — |
| account | INVITED | ACTIVE | đặt mật khẩu qua link | không |
| account | ACTIVE | SUSPENDED | admin suspend | có (mở lại ACTIVE) |
| account | ACTIVE/SUSPENDED | DEACTIVATED | admin deactivate | không |
| access_link | — | ISSUED | tạo lời mời / yêu cầu reset | — |
| access_link | ISSUED | USED | đặt mật khẩu thành công | không |
| access_link | ISSUED | EXPIRED | quá hạn hoặc bị link mới thay thế | không |
| session | — | ACTIVE | đăng nhập/kích hoạt thành công | — |
| session | ACTIVE | EXPIRED | idle quá ngưỡng | không |
| session | ACTIVE | REVOKED | logout, đổi/reset mật khẩu, admin suspend/deactivate | không |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| User đóng trình duyệt giữa form đặt mật khẩu | link ISSUED còn hạn | mở lại link, đặt tiếp | link hết hạn tự EXPIRED |
| Link mời hết hạn trước khi kích hoạt | account INVITED, link EXPIRED | admin "gửi lại lời mời" → link mới | link cũ vô hiệu |
| SMTP lỗi khi gửi email mời/reset | account INVITED / link ISSUED | admin gửi lại; user yêu cầu lại (tính vào 3/giờ) | — |
| User xin link reset 2 lần | link mới ISSUED, link cũ bị thay thế | chỉ link mới nhất dùng được | link cũ EXPIRED |
| Đăng nhập trên 2 thiết bị | 2 phiên ACTIVE độc lập | cả 2 dùng song song | đổi mật khẩu/reset → thu hồi cả 2 |
| Admin suspend trong lúc user đang có phiên | phiên REVOKED ngay | user bị đưa về đăng nhập ở thao tác kế tiếp | — |

### 6.5 Other Edge Cases

- Admin mời email sai chính tả: tài khoản nằm INVITED vô hạn → admin hủy lời
  mời (đưa về trạng thái hủy) hoặc deactivate rồi mời lại đúng email.
- User xin reset nhưng tài khoản đang SUSPENDED: email vẫn trả lời chung,
  không gửi link; admin xử lý trực tiếp.
- Đổi mật khẩu khi đang login: yêu cầu nhập mật khẩu hiện tại; thành công →
  thu hồi mọi phiên khác, giữ phiên hiện tại.
- Email mời vào spam: không có cơ chế trong sản phẩm — admin gửi lại hoặc báo
  IT khách hàng whitelist domain gửi.
- Tài khoản bị xóa vĩnh viễn: v1 không hỗ trợ xóa — chỉ deactivate để giữ
  truy vết (ai đã hành động trong hệ thống).

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Email | định dạng email hợp lệ; duy nhất trong một tổ chức; không phân biệt hoa thường |
| Họ tên | bắt buộc, 1–120 ký tự |
| Mật khẩu | tối thiểu 8 ký tự, có chữ và số (đề xuất — chờ duyệt); nhập 2 lần khớp nhau |
| Mật khẩu khi đổi | phải nhập mật khẩu hiện tại; mới ≠ hiện tại |
| Link kích hoạt/reset | một lần dùng; hết hạn theo limit; link mới vô hiệu link cũ cùng loại |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Sai mật khẩu liên tiếp | 5 lần | theo tài khoản | khóa đăng nhập 15 phút; đổi mật khẩu thành công → mở ngay |
| Hiện captcha | sau 3 lần sai liên tiếp | theo tài khoản | phải qua captcha trước khi thử tiếp (đề xuất — chờ duyệt) |
| Hạn link mời | 72 giờ | từ lúc phát hành | EXPIRED; admin gửi lại lời mời mới (đề xuất — chờ duyệt) |
| Hạn link reset mật khẩu | 1 giờ | từ lúc phát hành | EXPIRED; user xin link mới (đề xuất — chờ duyệt) |
| Số link reset | 3 link | mỗi giờ / email | trả lời chung như bình thường nhưng không gửi thêm |
| Phiên idle | 8 giờ | không hoạt động | EXPIRED → đăng nhập lại (đề xuất — chờ duyệt) |
| Phiên tuyệt đối | 30 ngày | từ lúc tạo | buộc đăng nhập lại kể cả đang hoạt động (đề xuất — chờ duyệt) |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Sai email/mật khẩu | "Email hoặc mật khẩu không đúng" | E-? |
| Tài khoản bị khóa tạm | "Tài khoản tạm khóa do nhập sai nhiều lần — thử lại sau {số} phút" | E-? |
| Tài khoản suspended/deactivated | "Tài khoản của bạn đã bị vô hiệu hóa — liên hệ quản trị viên" | E-? |
| Tài khoản INVITED đăng nhập | "Tài khoản chưa kích hoạt — kiểm tra email mời hoặc liên hệ quản trị viên" | E-? |
| Link hết hạn/đã dùng | "Link này đã hết hạn hoặc đã được sử dụng — yêu cầu gửi link mới" | E-? |
| Mật khẩu yếu | "Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số" | E-? |
| Nhập lại không khớp | "Mật khẩu nhập lại không khớp" | E-? |
| Admin mời email trùng | "Email này đã có tài khoản trong tổ chức" | E-? |
| Suspend admin cuối | "Không thể vô hiệu hóa — đây là quản trị viên cuối cùng của tổ chức" | E-? |
| Đổi mật khẩu sai hiện tại | "Mật khẩu hiện tại không đúng" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Gửi lời mời | "Đã gửi lời mời tới {email} — link có hiệu lực 72 giờ" |
| Kích hoạt tài khoản | "Tài khoản đã kích hoạt — chào mừng bạn" |
| Đặt lại mật khẩu | "Đã đổi mật khẩu — đăng nhập lại để tiếp tục" |
| Đổi mật khẩu khi login | "Đã đổi mật khẩu — các thiết bị khác đã đăng xuất" |
| Đăng xuất | "Đã đăng xuất" |
| Suspend/deactivate | "Đã {tạm khóa / vô hiệu hóa} tài khoản {email}" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Sau khi xin reset | "Nếu email {email} tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu" |
| Phiên hết hạn | "Phiên đăng nhập đã hết hạn — vui lòng đăng nhập lại" |
| Email mời (subject/body) | "{Tổ chức} mời bạn tham gia Town Hown — đặt mật khẩu để kích hoạt trong 72 giờ" |
| Email reset | "Bạn vừa yêu cầu đặt lại mật khẩu — link có hiệu lực 1 giờ. Nếu không phải bạn, bỏ qua email này" |
| Bị đưa về login do suspend | "Phiên đã kết thúc — tài khoản của bạn đã bị vô hiệu hóa" |

## 8. Assumptions

- Mỗi tài khoản gắn với đúng 1 tổ chức; user thuộc nhiều tổ chức (nếu có) là
  nhiều tài khoản khác nhau.
- Email là định danh duy nhất và là kênh nhận link kích hoạt/reset — SMTP đã
  được cấu hình và vận hành (platform-configuration).
- Vai trò ban đầu khi mời được chọn từ danh sách vai trò chuẩn do
  org-governance định nghĩa.
- Ứng viên KHÔNG có tài khoản — truy cập qua link/token của module nghiệp vụ
  (candidate-assessment, offer-management).
- Phiên là khái niệm nghiệp vụ (đăng nhập → hết hạn/thu hồi); cơ chế kỹ thuật
  cụ thể để `/srs` + kiến trúc quyết.
- V1 chỉ email + mật khẩu; SSO/federation là quyết định riêng, không chặn
  luồng mời nội bộ.

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Email mời/reset vào spam hoặc SMTP lỗi → user không kích hoạt được | thường | người được mời không vào được hệ thống, tỷ lệ truy cập thấp, admin bị hỏi dồn | admin gửi lại lời mời; hướng dẫn whitelist domain; theo dõi FAILED qua operational-email/contextual-notifications |
| Cựu nhân viên chưa deactivate → còn truy cập dữ liệu nhân sự | thỉnh thoảng | lộ dữ liệu sau nghỉ việc, vi phạm bảo mật với khách hàng | deactivate là bước bắt buộc trong employment-lifecycle; cảnh báo tài khoản ACTIVE không còn hồ sơ nhân viên hiệu lực |
| Sai phạm vi tổ chức (tài khoản vào nhầm org) | hiếm | lộ dữ liệu giữa các khách hàng B2B — sự cố nghiêm trọng | kiểm tra quan hệ tổ chức ngay trong xác thực (D5), deny by default, guardrail 0 sự cố vượt quyền |
| Phiên idle quá dài trên máy dùng chung | thỉnh thoảng | người khác thao tác dưới danh tính user | idle timeout 8h, thu hồi khi đổi mật khẩu, danh sách phiên cho user tự thu hồi |
| Thông điệp lỗi lộ thông tin (email tồn tại, đúng org) | hiếm | bị dò tài khoản để tấn công có chủ đích | wording chung thống nhất cho mọi nhánh từ chối |
| Chính sách mật khẩu quá lỏng/quá chặt chưa duyệt | thỉnh thoảng | hoặc rủi ro bảo mật, hoặc user viết mật khẩu ra giấy | chốt chính sách ở OQ-5 trước khi spec |

## 10. Success Criteria (preliminary)

- Tỷ lệ người được mời kích hoạt thành công trong 72 giờ đầu — target chính
  thức chờ OQ-2 sản phẩm (đề xuất định hướng ≥90%).
- Tỷ lệ yêu cầu reset mật khẩu hoàn tất mà không cần admin can thiệp ≥95%.
- 0 sự cố xác nhận truy cập vượt phạm vi tổ chức (guardrail chung với
  org-governance, metric `M-GR-01`).
- Thời gian trung bình từ mời đến kích hoạt < 24 giờ (đề xuất — chờ duyệt).

## 11. Open Questions

- [ ] OQ-1: Chính sách mật khẩu chính thức (độ dài tối thiểu, charset, có cấm
  dùng lại, có rotation không) do ai duyệt — security owner hay product owner?
- [ ] OQ-2: MFA có bắt buộc cho vai trò admin trong v1/pilot không, hay để P2?
- [ ] OQ-3: Các ngưỡng đề xuất (5 lần sai → khóa 15 phút; captcha sau 3 lần;
  link mời 72h; link reset 1h; idle 8h; absolute 30 ngày) — sponsor duyệt hay
  chỉnh?
- [ ] OQ-4: Kế thừa OQ-10 sản phẩm: SLA, retry, bounce và fallback cho email
  mời/reset (kênh nào báo khi email không tới được)?
- [ ] OQ-5: Kế thừa OQ-6 sản phẩm: retention cho dữ liệu phiên và lịch sử sự
  kiện truy cập (giữ bao lâu, xóa thế nào khi tài khoản deactivate)?
- [ ] OQ-6: SSO/federation có trong cam kết khách hàng pilot không — nếu có,
  thứ tự ưu tiên so với email+mật khẩu?

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd account-access` — capture user perspective
- `/brd account-access` — business case
- `/prd-epic account-access` — product scope
