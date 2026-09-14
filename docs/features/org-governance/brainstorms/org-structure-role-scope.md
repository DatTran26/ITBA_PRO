---
type: brainstorm
feature: org-governance
status: draft
updated: 2026-09-13
links: [docs/downtown/prd.md]
---

# Cơ cấu tổ chức, vai trò và phạm vi dữ liệu — org-governance

## 1. Idea Seed

Một nơi duy nhất để admin dựng cơ cấu tổ chức (công ty → chi nhánh → phòng ban),
định nghĩa chức danh và danh mục vai trò, gán người vào đơn vị kèm vai trò và
phạm vi dữ liệu, quản lý quan hệ báo cáo (ai quản lý ai), và truy vết mọi hành
động nhạy cảm qua nhật ký kiểm toán. Mọi module nghiệp vụ khác đọc role/scope
từ đây — không module nào tự định nghĩa quyền riêng.

## 2. Context

Town Hown là HRMS B2B nhiều tổ chức khách hàng; PRD đặt "quyền truy cập theo
vai trò, tổ chức và phạm vi quản lý" là product constraint, không phải tùy chọn
triển khai sau. Hành trình Admin trong PRD yêu cầu "xác minh role, scope và
audit bằng test account" trước khi mở pilot — nghĩa là org-governance phải có
đủ cơ cấu, gán quyền và audit để chứng minh ranh giới hoạt động. Rủi ro chính
PRD chỉ ra: rule quyền không nhất quán giữa các module (risk R-03) — một nơi
định nghĩa + áp dụng thống nhất là cách phòng chính. Guardrail sản phẩm
`M-GR-01`: 0 sự cố vượt organization/role/data-scope được xác nhận.

Hiện trạng source ITBAAI đã có user admin, settings và activity log — đây là
bằng chứng triển khai, chưa phải spec được duyệt; catalog vai trò và scope chính
thức vẫn cần business owner chốt.

## 3. User Types (preliminary)

| User Type | Pain Point | Primary Need |
|-----------|-----------|--------------|
| Admin | Cấp quyền rời rạc, không biết ai đang được xem gì, không chứng minh được cho khách hàng/audit | Dựng cơ cấu + gán vai trò/phạm vi một chỗ, truy vết được ai đã làm gì |
| Quản lý | Thấy dữ liệu ngoài đơn vị mình phụ trách hoặc ngược lại bị chặn thiếu | Phạm vi dữ liệu đúng với trách nhiệm quản lý |
| HR | Không rõ mình được thao tác tới đâu trên hồ sơ/ứng viên | Quyền rõ theo vai trò, không phải hỏi admin từng lần |
| Nhân viên (bị gán, gián tiếp) | Bị đổi quyền mà không biết, hoặc bị sai đơn vị | Assignment đúng đơn vị/chức danh/quản lý của mình |
| Security/audit owner | Không điều tra được khi có nghi vấn vượt quyền | Nhật ký kiểm toán đủ actor/target/trước-sau/lý do |

## 4. Capabilities Breakdown

### P0 — must have

- Cơ cấu tổ chức dạng cây: tạo/sửa/ngừng hoạt động công ty (1 gốc), chi nhánh,
  phòng ban; mỗi đơn vị có mã + tên + đơn vị cha; xem sơ đồ cây.
- Chức danh: tạo/sửa/ngừng chức danh trong tổ chức (dùng khi gán thành viên).
- Danh mục vai trò chuẩn của sản phẩm: quản trị viên (admin), HR, quản lý,
  lãnh đạo, interviewer, nhân viên — mỗi vai trò gắn một loại phạm vi dữ liệu
  mặc định; admin không tự chế vai trò mới trong v1.
- Gán thành viên: chọn tài khoản (từ account-access) → đơn vị → chức danh →
  vai trò → người quản lý trực tiếp → hiệu lực; sửa/kết thúc gán có lý do.
- Phạm vi dữ liệu theo 4 mức: toàn tổ chức / đơn vị mình + đơn vị con / chỉ
  đơn vị mình / chỉ dữ liệu của bản thân; module nghiệp vụ áp mức này khi
  quyết định user được xem/sửa gì.
- Quan hệ quản lý: mỗi gán có tối đa 1 người quản lý trực tiếp trong cùng tổ
  chức; đổi quản lý ghi audit.
- Nhật ký kiểm toán cho hành động quan trọng: ai — làm gì — lên đối tượng nào —
  trước/sau — lý do — khi nào; admin/security owner lọc theo người, loại hành
  động, khoảng thời gian; bản ghi chỉ thêm, không sửa/xóa.
- Deny-by-default: tài khoản không có gán hợp lệ = không có quyền nghiệp vụ;
  hành động ngoài vai trò/phạm vi bị từ chối và ghi nhận.
- Không ngừng/xóa đơn vị hay chức danh đang còn thành viên active — phải chuyển
  hoặc kết thúc gán trước.

### P1 — should have

- Một người nhiều gán đồng thời (nhiều đơn vị hoặc nhiều vai trò); phạm vi
  hiệu dụng = hợp nhất các phạm vi được cấp.
- Chế độ "kiểm chứng quyền": admin chọn một vai trò/đơn vị và xem trước người
  đó sẽ thấy/không thấy gì (phục vụ bước "xác minh bằng test account" của hành
  trình Admin trong PRD).
- Nhập cơ cấu tổ chức hàng loạt từ file mẫu (CSV) khi onboard khách hàng mới.
- Cảnh báo vận hành: tài khoản ACTIVE không có gán nào; đơn vị không có quản
  lý; vai trò admin chỉ còn 1 người.
- Hiệu lực tương lai cho gán/quản lý (điều chuyển có ngày hiệu lực).

### P2 — nice to have

- Policy builder tùy biến không giới hạn (PRD đánh dấu "chưa làm").
- Dual control: thay đổi quyền nhạy cảm cần người thứ hai phê duyệt.
- Đề xuất vai trò/chức danh tự động theo dữ liệu đã có (gợi ý, vẫn do admin
  quyết).

## 5. Core Flows (Happy Path)

### 5.1 Dựng cơ cấu tổ chức

1) Admin vào phần quản trị tổ chức → tạo công ty (gốc) nếu chưa có.
2) Tạo chi nhánh/phòng ban: nhập mã + tên + chọn đơn vị cha trong cây → hệ
   thống kiểm mã không trùng và không tạo chu trình → đơn vị ACTIVE.
3) Tạo chức danh: mã + tên gọi → ACTIVE trong tổ chức.
4) Sơ đồ cây hiển thị toàn bộ đơn vị kèm số thành viên đang gán.

### 5.2 Gán thành viên, vai trò và phạm vi

1) Admin chọn "Gán thành viên" → chọn tài khoản đang ACTIVE (từ
   account-access) → chọn đơn vị → chức danh → vai trò → người quản lý trực
   tiếp (tùy loại vai trò, bắt buộc với nhân viên/interviewer).
2) Hệ thống kiểm tra: tài khoản thuộc tổ chức, đơn vị/chức danh đang ACTIVE,
   vai trò nằm trong catalog, quản lý khác chính người được gán.
3) Hệ thống suy ra phạm vi dữ liệu từ vai trò được gán + đơn vị → tạo gán
   trạng thái ACTIVE → ghi audit (ai gán, cho ai, ở đâu, vai trò gì).
4) Người được gán thấy workspace theo đúng vai trò/phạm vi từ phiên kế tiếp.

```
Admin                          Hệ thống                              Người được gán
─────────────────────────────────────────────────────────────────────────────────

"Gán thành viên"
chọn tài khoản + đơn vị
+ chức danh + vai trò
+ quản lý trực tiếp
      │
      ▼
── Tài khoản ACTIVE và thuộc tổ chức? ──┐
      │                                │
   Không ▶ báo "Tài khoản không hợp    │
           lệ để gán"                  │
      │                                │
     Có ▼                              │
── Đơn vị + chức danh đang ACTIVE? ──┐ │
      │                              │ │
   Không ▶ báo "Đơn vị/chức danh     │ │
           đã ngừng hoạt động"       │ │
      │                              │ │
     Có ▼                            │ │
── Vai trò trong catalog chuẩn? ──┐  │ │
      │                            │ │ │
   Không ▶ báo "Vai trò không hợp  │ │ │
           lệ"                     │ │ │
      │                            │ │ │
     Có ▼                          │ │ │
┌─────────────────────────┐        │ │ │
│ Suy ra phạm vi dữ liệu  │        │ │ │
│ = loại scope của vai trò│        │ │ │
│ + đơn vị được gán       │        │ │ │
├─────────────────────────┤        │ │ │
│ Tạo gán ACTIVE          │        │ │ │
│ Ghi audit: ai/cho ai/   │        │ │ │
│ ở đâu/vai trò/lý do     │        │ │ │
└───────────┬─────────────┘        │ │ │
            ▼                      │ │ │
   báo "Đã gán {vai trò} cho       │ │ │
   {tên} tại {đơn vị}"             │ │ │
            │                      │ │ │
            └──────────────────────┴─┴─▶│ phiên kế tiếp:
                                        │ workspace theo đúng
                                        │ vai trò + phạm vi
```

### 5.3 Thực hiện action nghiệp vụ trong phạm vi

1) Người dùng (HR/quản lý/nhân viên) mở hoặc thao tác trên dữ liệu nghiệp vụ
   (ví dụ xem danh sách ứng viên của phòng ban).
2) Hệ thống lấy gán ACTIVE của người đó → vai trò + đơn vị → phạm vi hiệu dụng.
3) Không có gán hợp lệ → từ chối (deny-by-default), ghi nhận lượt bị từ chối.
4) Dữ liệu/hành động nằm trong phạm vi → cho phép; ngoài phạm vi → từ chối
   "Bạn không có quyền..." và ghi nhận.
5) Hành động quan trọng thành công (đổi quyền, duyệt, xuất dữ liệu...) → ghi
   audit đầy đủ trước/sau.

### 5.4 Truy vết nhật ký kiểm toán

1) Admin/security owner vào "Nhật ký kiểm toán" → lọc theo người thực hiện,
   loại hành động, đối tượng, khoảng thời gian.
2) Mở 1 bản ghi → xem ai — làm gì — lên gì — giá trị trước/sau — lý do — thời
   điểm.
3) Không có thao tác sửa/xóa bản ghi; xuất báo cáo (nếu được phép) cũng bị
   ghi audit.

### 5.5 Điều chuyển / kết thúc gán

1) Admin mở gán hiện tại → chọn đổi đơn vị/vai trò/quản lý, hoặc kết thúc gán
   → nhập lý do.
2) Hệ thống kiểm tra ràng buộc (không gỡ admin cuối cùng; không tạo chu trình
   quản lý A→B→A) → áp dụng → ghi audit kèm trước/sau.
3) Kết thúc gán → quyền tương ứng mất hiệu lực ngay; phiên đang sống của
   người đó bị thu hồi qua account-access.

## 6. System Behavior Deep Dive

### 6.1 Decision Points

| ID | Flow | Khi nào | YES (nhánh đồng ý) | NO (nhánh từ chối) |
|---|---|---|---|---|
| D1 | 5.1 | Mã đơn vị đã tồn tại trong tổ chức? | Báo "Mã đơn vị đã tồn tại" | Tạo đơn vị |
| D2 | 5.1 | Đơn vị cha tạo thành chu trình (cha là con của chính nó)? | Chặn + báo lỗi | Cho tạo |
| D3 | 5.2 | Tài khoản ACTIVE và thuộc tổ chức? | Kiểm tra tiếp | Báo "Tài khoản không hợp lệ để gán" |
| D4 | 5.2 | Đơn vị/chức danh đang ACTIVE? | Kiểm tra vai trò | Báo "đã ngừng hoạt động" |
| D5 | 5.2 | Người quản lý được chọn = chính người được gán? | Chặn "Người quản lý không thể là chính mình" | Cho phép |
| D6 | 5.3 | Có gán ACTIVE nào? | Tính phạm vi hiệu dụng | Từ chối deny-by-default + ghi nhận |
| D7 | 5.3 | Dữ liệu/hành động nằm trong phạm vi? | Cho phép (+ audit nếu quan trọng) | Từ chối + ghi nhận lượt từ chối |
| D8 | 5.5 | Gỡ vai trò làm mất admin cuối cùng của tổ chức? | Chặn + báo lỗi | Cho phép + audit |
| D9 | 5.5 | Đổi quản lý tạo chu trình báo cáo? | Chặn + báo lỗi | Áp dụng + audit |
| D10 | 5.1/5.5 | Đơn vị/chức danh còn thành viên ACTIVE khi ngừng? | Chặn "còn {n} thành viên — chuyển trước" | Cho ngừng hoạt động |

### 6.2 Scenario Matrix

| Vai trò | Phạm vi mặc định | Xem dữ liệu | Thao tác nghiệp vụ |
|---|---|---|---|
| Admin | Toàn tổ chức | Toàn bộ trong tổ chức | Quản trị cấu hình/gán; không tự duyệt nghiệp vụ HR |
| HR | Toàn tổ chức | Hồ sơ tuyển dụng/nhân sự trong tổ chức | Thao tác nghiệp vụ HR trong phạm vi |
| Lãnh đạo | Toàn tổ chức (đọc) | Báo cáo/tổng hợp toàn tổ chức | Duyệt theo quy trình; không sửa hồ sơ chi tiết |
| Quản lý | Đơn vị mình + đơn vị con | Dữ liệu nhân viên/ứng viên thuộc scope | Duyệt/xác nhận trong scope |
| Interviewer | Chỉ bản thân (+ dữ liệu được giao) | CV/JD/câu hỏi của phiên được phân công | Ghi đánh giá phiên mình |
| Nhân viên | Chỉ bản thân | Dữ liệu/việc của mình | Cập nhật phần được phép của mình |

### 6.3 State Transitions

```
org_unit / position:  ACTIVE ──admin ngừng──▶ INACTIVE (không xóa khi còn gán)
                         ▲                        │
                         └──── admin mở lại ──────┘

assignment:  ──admin gán──▶ ACTIVE ──admin kết thúc/điều chuyển──▶ ENDED
audit_event:  chỉ thêm mới — không đổi trạng thái, không sửa, không xóa
```

| Entity | Từ | Sang | Trigger | Quay lại được? |
|--------|------|----|---------|-------------|
| org_unit | — | ACTIVE | admin tạo | — |
| org_unit | ACTIVE | INACTIVE | admin ngừng (khi không còn thành viên ACTIVE) | có (mở lại ACTIVE) |
| org_unit | INACTIVE | ACTIVE | admin mở lại | — |
| position | — | ACTIVE | admin tạo | — |
| position | ACTIVE | INACTIVE | admin ngừng (khi không còn gán ACTIVE) | có |
| assignment | — | ACTIVE | admin gán hợp lệ | — |
| assignment | ACTIVE | ENDED | admin kết thúc / thay bằng gán mới | không (tạo gán mới) |
| audit_event | — | RECORDED | hành động quan trọng hoặc từ chối quyền | không — append-only |

### 6.4 Interrupted Transactions

| Tình huống | Hệ thống còn lại gì | Resume | Cleanup |
|---|---|---|---|
| Admin đóng trình duyệt giữa form gán | chưa có gán nào được tạo | mở lại form, làm lại từ đầu | không cần |
| Import cơ cấu hàng loạt lỗi giữa chừng (P1) | các dòng hợp lệ đã tạo + báo cáo lỗi từng dòng | sửa file, import lại phần lỗi | dòng lỗi không tạo — không nửa vời |
| Kết thúc gán trong lúc user đang có phiên | gán ENDED, audit RECORDED | phiên bị thu hồi qua account-access; thao tác kế tiếp bị từ chối | — |
| 2 admin gán cùng tài khoản đồng thời | gán ghi sau áp dụng trên trạng thái mới nhất | cả 2 audit đều ghi, truy vết được xung đột | — |
| Audit ghi thất bại trong action quan trọng | action chưa hoàn tất | action bị hủy + báo admin — không cho action quan trọng thiếu audit | — |

### 6.5 Other Edge Cases

- Tài khoản được mời (INVITED) chưa kích hoạt: vẫn gán được vai trò/đơn vị
  trước — quyền chỉ phát huy khi tài khoản ACTIVE.
- Đơn vị cha bị ngừng: đơn vị con ACTIVE vẫn hiển thị trong cây nhưng cảnh báo
  "cha đã ngừng"; không cho gán mới vào cả nhánh.
- Người quản lý bị kết thúc gán: các gán con không tự mất — cảnh báo "đơn vị/
  người không còn quản lý" để admin gán lại.
- Xóa cứng dữ liệu tổ chức: v1 không hỗ trợ xóa org_unit/position/assignment —
  chỉ INACTIVE/ENDED để giữ truy vết.
- Tự gán quyền cho chính mình: admin có thể gán cho mình vai trò khác, nhưng
  mọi thay đổi đều audit — audit là cơ chế phát hiện, không phải chặn.

## 7. Validation, Limits & Wording

### 7.1 Validation rules

| Field | Rule |
|---|---|
| Mã đơn vị/chức danh | bắt buộc, duy nhất trong tổ chức, không phân biệt hoa thường, 2–30 ký tự, chữ/số/gạch |
| Tên đơn vị/chức danh | bắt buộc, 1–120 ký tự |
| Đơn vị cha | phải thuộc cùng tổ chức; không tạo chu trình; độ sâu cây tối đa 5 cấp |
| Vai trò khi gán | phải thuộc catalog chuẩn v1; 1 gán = 1 vai trò |
| Người quản lý trực tiếp | tài khoản ACTIVE cùng tổ chức, khác người được gán, không tạo chu trình báo cáo; bắt buộc với vai trò nhân viên/interviewer |
| Lý do | bắt buộc khi: kết thúc gán, đổi vai trò, đổi phạm vi, ngừng đơn vị/chức danh — 5–500 ký tự |
| Phạm vi dữ liệu | 1 trong 4 mức: toàn tổ chức / đơn vị + con / chỉ đơn vị / chỉ bản thân |

### 7.2 Limits & Quotas (exact values)

| Tham số | Giá trị | Window | Behavior khi vượt |
|---|---|---|---|
| Độ sâu cây tổ chức | 5 cấp (công ty → chi nhánh → phòng ban → nhóm → nhóm con) | theo tổ chức | chặn tạo đơn vị con (đề xuất — chờ duyệt) |
| Số vai trò trong catalog | 6 vai trò chuẩn v1 | hệ thống | không tạo vai trò tùy biến — đường P2 policy builder |
| Số gán ACTIVE đồng thời / tài khoản | 5 | theo tài khoản | chặn gán thêm, đề nghị kết thúc gán cũ (đề xuất — chờ duyệt) |
| Số dòng import cơ cấu (P1) | 500 dòng | mỗi lần import | chặn file, yêu cầu chia nhỏ (đề xuất — chờ duyệt) |
| Trang nhật ký kiểm toán | 50 bản ghi | mỗi trang | phân trang |
| Retention audit | tối thiểu 12 tháng | rolling | chờ OQ-3 (kế thừa OQ-6 sản phẩm) |
| Thời hạn lọc audit mặc định | 30 ngày gần nhất | khi mở màn | đổi filter để xem xa hơn |

### 7.3 Wording samples (exact strings)

#### Error messages

| Tình huống | Wording | Code |
|---|---|---|
| Mã trùng | "Mã {mã} đã tồn tại trong tổ chức" | E-? |
| Chu trình cây | "Không thể chọn {đơn vị} làm cha — sẽ tạo vòng lặp trong cơ cấu" | E-? |
| Ngừng đơn vị còn người | "Đơn vị còn {số} thành viên đang hoạt động — chuyển họ trước khi ngừng" | E-? |
| Gỡ admin cuối | "Không thể thực hiện — đây là quản trị viên cuối cùng của tổ chức" | E-? |
| Tự làm quản lý mình | "Người quản lý không thể là chính người được gán" | E-? |
| Chu trình báo cáo | "Không thể gán — thay đổi này tạo vòng lặp quản lý" | E-? |
| Vượt phạm vi | "Bạn không có quyền thực hiện thao tác này" | E-? |
| Đơn vị đã ngừng | "Đơn vị/chức danh đã ngừng hoạt động — chọn giá trị khác" | E-? |
| Thiếu lý do | "Vui lòng nhập lý do thay đổi (tối thiểu 5 ký tự)" | E-? |

#### Success messages

| Tình huống | Wording |
|---|---|
| Tạo đơn vị | "Đã tạo {loại đơn vị} {tên}" |
| Gán thành viên | "Đã gán vai trò {vai trò} cho {tên} tại {đơn vị}" |
| Kết thúc gán | "Đã kết thúc gán của {tên} tại {đơn vị}" |
| Điều chuyển | "Đã cập nhật gán của {tên} — có hiệu lực từ {ngày}" |
| Ngừng/mở lại | "Đã {ngừng / mở lại} {tên đơn vị/chức danh}" |

#### Info / neutral messages

| Tình huống | Wording |
|---|---|
| Trước khi lưu thay đổi quyền | "Thay đổi này sẽ được ghi vào nhật ký kiểm toán" |
| Gán cho tài khoản chưa kích hoạt | "Tài khoản chưa kích hoạt — quyền sẽ áp dụng khi người này đăng nhập lần đầu" |
| Tài khoản không có gán | "Tài khoản này chưa được gán vai trò — hiện không có quyền nghiệp vụ" |
| Audit trống | "Chưa có sự kiện nào trong khoảng thời gian đã chọn" |

## 8. Assumptions

- account-access cung cấp tài khoản và trạng thái (INVITED/ACTIVE/SUSPENDED/
  DEACTIVATED); org-governance chỉ gán quyền cho tài khoản đã tồn tại.
- Mỗi tài khoản thuộc đúng 1 tổ chức (kế thừa assumption của account-access);
  multi-org là nhiều tài khoản.
- Catalog 6 vai trò chuẩn (admin/HR/lãnh đạo/quản lý/interviewer/nhân viên) đủ
  cho v1; vai trò ứng viên không tồn tại vì ứng viên không có tài khoản.
- "Hành động quan trọng" cần audit tối thiểu gồm: gán/sửa/kết thúc quyền, tạo/
  sửa/ngừng đơn vị & chức danh, duyệt nghiệp vụ, xuất dữ liệu, đọc nhật ký —
  danh sách chính thức chờ OQ-4.
- Phạm vi hiệu dụng khi nhiều gán = hợp nhất rộng nhất (P1); v1 đơn gán là đủ.
- Nhật ký kiểm toán tách biệt log vận hành kỹ thuật (theo security.md:
  operational log ≠ audit record).

## 9. Risks

| Rủi ro | Khả năng | Hậu quả nghiệp vụ | Cách phòng |
|--------|----------|-------------------|-----------|
| Rule quyền không nhất quán giữa các module (PRD R-03) | thỉnh thoảng | sự cố vượt quyền giữa các khách hàng B2B — mất uy tín, vi phạm hợp đồng | role/scope định nghĩa một nơi, deny-by-default, guardrail M-GR-01 = 0 sự cố |
| Admin gán sai scope → lộ dữ liệu nhân sự/ứng viên | thỉnh thoảng | lộ PII sang người không được phép, khiếu nại khách hàng | kiểm chứng quyền bằng test account trước pilot; audit mọi gán; cảnh báo tài khoản chưa gán |
| Chưa có owner duyệt role×permission matrix | thường | mỗi module tự hiểu quyền → drift; spec bị treo | OQ-1 chặn trước khi spec hóa chi tiết quyền từng module |
| Audit ghi quá ít → không điều tra được; hoặc quá nhiều → nhiễu, bỏ qua | thỉnh thoảng | không chứng minh được cho khách hàng/kiểm toán; mất guardrail | danh sách "hành động quan trọng" tối thiểu do security owner duyệt; lọc/phân trang |
| Process: nhân sự nghỉ/chuyển nhưng gán không được cập nhật | thường | quyền thừa tồn tại, truy cập sai phạm vi | kết thúc gán là bước bắt buộc của employment-lifecycle; cảnh báo định kỳ (P1) |
| Data: import cơ cấu từ dữ liệu khách hàng bẩn (trùng mã, chu trình) | thỉnh thoảng | onboard pilot chậm, cơ cấu sai | validate từng dòng + báo cáo lỗi; không import nửa vời |
| Timeline: audit + scope xây muộn làm chậm mọi module | thỉnh thoảng | toàn bộ pilot v1 bị chặn vì feature nền chưa xong | feature này là Must, đi trước trong slice safety foundation |

## 10. Success Criteria (preliminary)

- 0 sự cố vượt organization/role/data-scope được xác nhận (guardrail `M-GR-01`
  của PRD — mục tiêu cứng).
- 100% hành động trong danh sách "quan trọng" có audit record đủ 6 trường
  (ai/gì/lên gì/trước-sau/lý do/khi nào).
- Thời gian admin dựng cơ cấu tối thiểu cho tenant pilot (công ty + 2 chi
  nhánh + 5 phòng ban + 10 chức danh) < 60 phút (đề xuất — chờ duyệt).
- 100% lượt từ chối quyền được ghi nhận và truy vết được trong 12 tháng.

## 11. Open Questions

- [ ] OQ-1: Role×permission matrix chính thức (vai trò nào được làm gì trên
  module nào) do ai duyệt — security owner hay Head of HR? (kế thừa OQ-PL-01
  từ reverse spec platform-communications-and-governance)
- [ ] OQ-2: Một người có được gán nhiều đơn vị/vai trò đồng thời trong v1
  không, hay P1 mới mở?
- [ ] OQ-3: Retention và mức redact cho nhật ký kiểm toán (giữ bao lâu, ai được
  xem, có chống sửa thế nào)? (kế thừa OQ-6 sản phẩm + OQ-PL-04)
- [ ] OQ-4: Danh sách "hành động quan trọng" bắt buộc audit tối thiểu gồm những
  gì — ai là owner chốt danh sách này?
- [ ] OQ-5: Lãnh đạo và quản lý khác nhau thế nào về phạm vi — lãnh đạo xem
  toàn tổ chức chỉ-đọc có đúng ý định không?
- [ ] OQ-6: Có cần trạng thái "chờ hiệu lực" cho gán/điều chuyển trong v1
  không (điều chuyển ngày tương lai)?

## 12. Next Steps

Sau brainstorm này (sau khi BA approve):
- `/urd org-governance` — capture user perspective
- `/brd org-governance` — business case
- `/prd-epic org-governance` — product scope
