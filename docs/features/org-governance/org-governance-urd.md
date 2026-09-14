---
type: urd
feature: org-governance
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/org-governance/brainstorms/org-structure-role-scope.md
  - docs/_reverse/platform-communications-and-governance/reverse-spec.md
---

# org-governance — User Requirements Document

## 1. Purpose

Cho admin một nơi duy nhất để dựng cơ cấu tổ chức, gán người vào đơn vị kèm
vai trò và phạm vi dữ liệu, quản lý quan hệ báo cáo và truy vết hành động
nhạy cảm — để mọi module nghiệp vụ áp cùng một rule quyền và admin chứng
minh được ranh giới truy cập trước khi mở pilot.

### User Problem & Current Experience

| User | Current Situation | Problem | User Consequence | Evidence |
|------|-------------------|---------|------------------|----------|
| Admin | Cấp quyền rải rác trong từng công cụ hoặc theo yêu cầu lẻ | Không biết ai đang được xem gì, không chứng minh được cho khách hàng/kiểm toán | Mất kiểm soát truy cập, audit fail khi khách hàng hỏi | Confirmed — PRD Mục 7.2, JTBD-ADM-01 |
| Quản lý | Được cấp quyền thủ công, không khớp trách nhiệm | Thấy dữ liệu ngoài đơn vị phụ trách hoặc bị chặn thiếu | Quyết định thiếu căn cứ hoặc vô tình vi phạm phạm vi | Confirmed — PRD Mục 3 JTBD-MGR-01, Mục 7.2 |
| HR | Không rõ mình được thao tác tới đâu | Phải hỏi admin từng lần hoặc tự ý vượt quyền | Chậm công việc hoặc tạo sự cố vượt quyền | Assumption — suy từ rủi ro rule quyền không nhất quán (PRD Mục 7.2, R-03) |
| Nhân viên (bị gán, gián tiếp) | Bị đổi quyền hoặc sai đơn vị mà không biết | Assignment không khớp thực tế tổ chức | Làm việc sai phạm vi, mất quyền đột ngột | Assumption — suy từ luồng "gán thành viên → xác định phạm vi" PRD Mục 7.2 |
| Security/audit owner | Không có nhật ký tập trung cho hành động nhạy cảm | Không điều tra được khi có nghi vấn vượt quyền | Không chứng minh được ranh giới, guardrail M-GR-01 không đo được | Observed: reverse spec FR-PL-06 (activity log có nền); PRD Mục 8 M-GR-01 |

## 2. User Types

| Tier | User Type | Context | Primary Goal | Pain Points |
|------|-----------|---------|--------------|-------------|
| primary | Admin | Bootstrap và vận hành tenant của tổ chức khách hàng | Dựng cơ cấu + gán vai trò/phạm vi một chỗ, xác minh bằng test account, truy vết ai đã làm gì | Quyền rời rạc không kiểm soát được; không chứng minh được cho khách hàng |
| secondary | Quản lý | Được gán vai trò quản lý một đơn vị | Thấy đúng dữ liệu trong phạm vi trách nhiệm, không hơn không kém | Phạm vi lệch thực tế; bị chặn thiếu hoặc thấy thừa |
| secondary | HR / interviewer / nhân viên | Làm việc trong vai trò được gán | Quyền rõ theo vai trò, bị từ chối hiểu vì sao | Không biết giới hạn quyền của mình |
| secondary | Security/audit owner | Điều tra sự cố truy cập | Nhật ký đủ actor/target/trước-sau/lý do/thời điểm | Log thiếu hoặc nằm rải rác |
| out | Ứng viên | Không có tài khoản, không được gán vai trò | (gián tiếp) dữ liệu của mình được bảo vệ bởi scope của người khác | Không thuộc feature này |

## 3. Scope Boundaries

### In Scope

- Cơ cấu tổ chức dạng cây: tạo/sửa/ngừng/mở lại công ty (1 gốc), chi nhánh,
  phòng ban; xem sơ đồ cây kèm số thành viên.
- Chức danh: tạo/sửa/ngừng/mở lại trong tổ chức.
- Catalog vai trò chuẩn của sản phẩm (admin, HR, lãnh đạo, quản lý,
  interviewer, nhân viên) gắn phạm vi dữ liệu mặc định — chỉ đọc, không tự
  chế vai trò trong v1.
- Gán thành viên: tài khoản → đơn vị → chức danh → vai trò → người quản lý
  trực tiếp; suy ra phạm vi dữ liệu; sửa/kết thúc gán có lý do.
- Phạm vi dữ liệu 4 mức (toàn tổ chức / đơn vị + con / chỉ đơn vị / chỉ bản
  thân) và deny-by-default khi không có gán hợp lệ; lượt từ chối được ghi
  nhận.
- Nhật ký kiểm toán append-only cho hành động quan trọng, lọc theo người/
  loại/đối tượng/thời gian.
- Chế độ kiểm chứng quyền (preview vai trò/đơn vị sẽ thấy gì) phục vụ bước
  xác minh bằng test account — P1.
- Nhiều gán đồng thời với phạm vi hiệu dụng = hợp nhất — P1 (giới hạn 5).
- Import cơ cấu hàng loạt từ file mẫu, cảnh báo vận hành — P1.

### Out of Scope

- Vòng đời tài khoản (mời, xác thực, phiên) — thuộc `account-access`;
  feature này chỉ gán quyền cho tài khoản đã tồn tại.
- Hồ sơ nhân viên đầy đủ và vòng đời nhân sự — thuộc `employee-profiles`/
  `employment-lifecycle`.
- Policy builder tùy biến không giới hạn, dual control cho thay đổi quyền —
  PRD "Chưa làm" / hướng P2.
- Quyền trên từng đối tượng nghiệp vụ cụ thể (ai được xem câu hỏi nào, bài
  test nào) — module nghiệp vụ tự áp role/scope do feature này cung cấp.
- Log vận hành kỹ thuật (operational log) — tách biệt nhật ký kiểm toán
  nghiệp vụ.

## 4. User Needs

| ID | User | Context / Trigger | User Need | Expected Outcome | Importance | Evidence |
|----|------|-------------------|-----------|------------------|------------|----------|
| UN-001 | Admin | Khi onboard tenant mới | Dựng cơ cấu cây (công ty → chi nhánh → phòng ban) một nơi duy nhất, có mã không trùng và không vòng lặp | Sơ đồ tổ chức đúng thực tế, sẵn sàng gán người | Critical | Confirmed — PRD Mục 7.2 (cơ cấu tổ chức) |
| UN-002 | Admin | Khi cần chức danh để gán | Tạo và quản lý danh mục chức danh của tổ chức | Chức danh sẵn có khi gán thành viên | High | Confirmed — PRD Mục 7.2 (chức danh) |
| UN-003 | Admin | Khi có nhân sự cần quyền làm việc | Gán tài khoản vào đơn vị với vai trò, chức danh và người quản lý; phạm vi dữ liệu tự suy ra | Người được gán có đúng quyền từ phiên kế tiếp, hành động có audit | Critical | Confirmed — PRD Mục 7.2 (role/scope, quan hệ quản lý) |
| UN-004 | Người dùng nội bộ | Khi truy cập dữ liệu nghiệp vụ | Được làm đúng những gì vai trò/phạm vi cho phép và bị từ chối rõ ràng ngoài phạm vi | Không vượt scope; hiểu vì sao bị từ chối | Critical | Confirmed — PRD Mục 9 (org/role/scope constraint), R-03 |
| UN-005 | Admin | Khi nhân sự đổi đơn vị/vai trò hoặc nghỉ | Điều chuyển hoặc kết thúc gán kèm lý do; quyền mất hiệu lực ngay | Không còn quyền thừa; truy vết được trước/sau | Critical | Confirmed — PRD Mục 7.2 (luồng chính), rủi ro quyền thừa |
| UN-006 | Admin/security owner | Khi cần chứng minh hoặc điều tra | Lọc và xem nhật ký kiểm toán: ai — làm gì — lên gì — trước/sau — lý do — khi nào | Truy vết được mọi hành động quan trọng trong 12 tháng | Critical | Confirmed — PRD Mục 7.2 (audit), Mục 8 M-GR-01; reverse spec FR-PL-06 |
| UN-007 | Admin | Trước khi mở pilot cho tenant | Kiểm chứng quyền bằng test account/preview: chọn vai trò/đơn vị và xem trước sẽ thấy gì | Chứng minh ranh giới hoạt động trước dữ liệu thật | High | Confirmed — hành trình Admin PRD Mục 7 ("xác minh role, scope và audit bằng test account"); mức độ cơ chế là Assumption |
| UN-008 | Admin | Khi cơ cấu lớn cần nhập nhanh | Import cơ cấu từ file mẫu, biết rõ dòng nào lỗi | Onboard tenant không nhập tay từng đơn vị | Medium | Assumption — nhu cầu onboard pilot suy từ quy mô khách hàng B2B |
| UN-009 | Admin | Khi cấu hình quyền có bất thường | Được cảnh báo: tài khoản ACTIVE chưa gán, đơn vị không có quản lý, vai trò admin chỉ còn 1 người | Phát hiện lỗ hổng quyền trước khi thành sự cố | Medium | Assumption — suy từ rủi ro gán sai scope trong brainstorm |
| UN-010 | Quản lý | Khi cần xem/duyệt trong đơn vị mình | Phạm vi đơn vị mình + đơn vị con được áp tự động | Không phải xin quyền lẻ; không thấy dữ liệu đơn vị khác | High | Confirmed — PRD Mục 3 JTBD-MGR-01, Mục 7.2 |
| UN-011 | Admin | Khi một người kiêm nhiều vai trò/đơn vị | Gán đồng thời nhiều gán; phạm vi hiệu dụng là hợp nhất rộng nhất | Người kiêm vai trò không mất quyền cần thiết | Medium | Assumption — thực tế pilot có người kiêm vai trò (vd nhân viên kiêm interviewer) |

## 5. Prioritized User Journeys

### Journey 1: Bootstrap cơ cấu tổ chức cho tenant pilot

- **User:** Admin
- **Importance:** Critical
- **Trigger:** Tenant mới cần dựng cơ cấu trước khi mời người dùng.
- **Expected outcome:** Cây đơn vị + chức danh sẵn sàng; admin gán được
  thành viên đầu tiên với vai trò/phạm vi đúng.
- **Related needs:** UN-001, UN-002, UN-003

1) Admin tạo công ty gốc, rồi các chi nhánh/phòng ban: mã + tên + đơn vị cha
   — hệ thống chặn mã trùng và chu trình.
2) Admin tạo chức danh trong tổ chức.
3) Admin gán tài khoản: chọn đơn vị → chức danh → vai trò → người quản lý;
   hệ thống suy ra phạm vi và ghi audit.
4) Sơ đồ cây hiển thị đơn vị kèm số thành viên đang gán.

**Independent verification:** Dựng một cây mẫu (công ty + 2 chi nhánh + 5
phòng ban) và gán 3 tài khoản — mỗi tài khoản đăng nhập chỉ thấy workspace
theo vai trò/phạm vi đã gán; audit log có đủ 3 bản ghi gán.

### Journey 2: Gán và điều chỉnh quyền cho người trong tổ chức

- **User:** Admin
- **Importance:** Critical
- **Trigger:** Nhân sự mới vào, đổi vai trò, chuyển đơn vị hoặc nghỉ việc.
- **Expected outcome:** Gán được tạo/sửa/kết thúc có lý do và audit; quyền
  cũ mất hiệu lực ngay khi kết thúc.
- **Related needs:** UN-003, UN-005, UN-011

1) Admin mở "Gán thành viên" → chọn tài khoản → đơn vị/chức danh/vai trò/
   quản lý → xác nhận.
2) Hệ thống kiểm tra ràng buộc (đơn vị active, vai trò trong catalog, quản
   lý không phải chính mình, không chu trình báo cáo) → tạo gán + audit.
3) Khi điều chuyển/kết thúc: nhập lý do → quyền tương ứng đổi/mất ngay;
   phiên đang sống của người đó bị thu hồi qua `account-access`.

**Independent verification:** Kết thúc một gán của người đang đăng nhập —
thao tác nghiệp vụ kế tiếp của họ bị từ chối và lượt từ chối có trong nhật
ký.

### Journey 3: Người dùng làm việc trong phạm vi được cấp

- **User:** Quản lý / HR
- **Importance:** Critical
- **Trigger:** Người dùng mở hoặc thao tác dữ liệu nghiệp vụ hàng ngày.
- **Expected outcome:** Dữ liệu/hành động trong phạm vi được cho phép; ngoài
  phạm vi bị từ chối với thông điệp rõ và được ghi nhận.
- **Related needs:** UN-004, UN-010

1) Người dùng mở dữ liệu nghiệp vụ (vd danh sách ứng viên của phòng ban).
2) Hệ thống lấy gán active → phạm vi hiệu dụng → cho phép hoặc từ chối
   "Bạn không có quyền thực hiện thao tác này".
3) Tài khoản chưa gán vai trò nào → từ chối deny-by-default + ghi nhận.

**Independent verification:** Dùng tài khoản quản lý đơn vị A truy cập dữ
liệu đơn vị B — bị từ chối và có bản ghi lượt từ chối; truy cập đơn vị A
và đơn vị con của A thành công.

### Journey 4: Xác minh ranh giới quyền trước pilot

- **User:** Admin (kèm security owner)
- **Importance:** High
- **Trigger:** Trước khi mở pilot dữ liệu thật — hành trình Admin trong PRD
  yêu cầu "xác minh role, scope và audit bằng test account".
- **Expected outcome:** Admin chứng minh từng vai trò chỉ thấy/thao tác
  đúng phạm vi; mọi action quan trọng có audit.
- **Related needs:** UN-006, UN-007

1) Admin tạo test account cho từng vai trò/đơn vị tiêu biểu.
2) Đăng nhập test account hoặc dùng chế độ kiểm chứng quyền (P1) — đối
   chiếu kỳ vọng "thấy/không thấy".
3) Kiểm tra nhật ký kiểm toán có đủ hành động vừa thực hiện.

**Independent verification:** Checklist vai trò × phạm vi được duyệt trước
pilot — mỗi ô kiểm chứng có kết quả khớp hoặc có ghi nhận xử lý.

### Journey 5: Truy vết hành động nhạy cảm

- **User:** Admin / security owner
- **Importance:** High
- **Trigger:** Nghi vấn vượt quyền hoặc khách hàng yêu cầu chứng minh.
- **Expected outcome:** Tìm được đầy đủ sự kiện của một người/đối tượng
  trong khoảng thời gian; không ai sửa/xóa được bản ghi.
- **Related needs:** UN-006

1) Vào "Nhật ký kiểm toán" → lọc theo người thực hiện, loại hành động, đối
   tượng, khoảng thời gian.
2) Mở bản ghi → xem đủ trường ai/gì/lên gì/trước-sau/lý do/thời điểm.

**Independent verification:** Lấy 10 hành động quan trọng vừa thực hiện —
100% có bản ghi đủ 6 trường và không có thao tác sửa/xóa nào khả dụng.

### Journey 6: Import cơ cấu hàng loạt

- **User:** Admin
- **Importance:** Medium
- **Trigger:** Onboard tenant có sẵn sơ đồ tổ chức trong file.
- **Expected outcome:** Dòng hợp lệ tạo đơn vị, dòng lỗi báo rõ để sửa;
  không import nửa vời.
- **Related needs:** UN-008

1) Admin tải file theo mẫu → hệ thống kiểm tra từng dòng (mã, cha tồn tại,
   không chu trình).
2) Báo kết quả theo dòng; dòng lỗi sửa rồi tải lại.

**Independent verification:** Import file cố ý có dòng trùng mã và dòng tạo
chu trình — dòng hợp lệ được tạo, dòng lỗi báo đúng lý do.

## 6. User Exceptions & Edge Conditions

| Situation | User Impact | Expected User-facing Outcome | Related Journey / Need |
|-----------|-------------|------------------------------|------------------------|
| Nhập mã đơn vị/chức danh đã tồn tại | Không lưu được, không hiểu lý do | Thông báo "Mã {mã} đã tồn tại trong tổ chức" | Journey 1 / UN-001 |
| Chọn đơn vị cha tạo vòng lặp | Cơ cấu sai nếu lọt | Chặn + "Không thể chọn {đơn vị} làm cha — sẽ tạo vòng lặp trong cơ cấu" | Journey 1 / UN-001 |
| Ngừng đơn vị còn thành viên | Mất quyền hàng loạt nếu lọt | Chặn "Đơn vị còn {số} thành viên đang hoạt động — chuyển họ trước khi ngừng" | Journey 2 / UN-005 |
| Gỡ/thu hẹp quyền làm mất admin cuối cùng | Tổ chức mất khả năng quản trị | Chặn "Không thể thực hiện — đây là quản trị viên cuối cùng của tổ chức" | Journey 2 / UN-005 |
| Gán tài khoản chưa kích hoạt (INVITED) | Tưởng gán không ăn | Gán vẫn được tạo; hiện "Tài khoản chưa kích hoạt — quyền sẽ áp dụng khi người này đăng nhập lần đầu" | Journey 2 / UN-003 |
| Người quản lý bị kết thúc gán | Cấp dưới "mồ côi" quản lý | Cảnh báo "đơn vị/người không còn quản lý" để admin gán lại; gán con không tự mất | Journey 2 / UN-005 |
| Tài khoản chưa có gán nào đăng nhập | Không vào được nghiệp vụ, tưởng lỗi | Hiện "Tài khoản này chưa được gán vai trò — hiện không có quyền nghiệp vụ" | Journey 3 / UN-004 |
| Đơn vị cha bị ngừng | Nhánh con không hiểu tình trạng | Đơn vị con hiển thị cảnh báo "cha đã ngừng"; không cho gán mới vào cả nhánh | Journey 1, 2 / UN-005 |
| Kết thúc gán mà không nhập lý do | Audit thiếu căn cứ | Chặn lưu + "Vui lòng nhập lý do thay đổi (tối thiểu 5 ký tự)" | Journey 2 / UN-006 |
| Hai admin gán cùng tài khoản đồng thời | Gán xung đột | Cả hai thao tác ghi audit đầy đủ; trạng thái cuối truy vết được | Journey 2 / UN-006 |
| Audit ghi thất bại giữa hành động quan trọng | Hành động thiếu vết | Hành động bị hủy và báo admin — không cho hành động quan trọng thiếu audit | Journey 5 / UN-006 |
| Import file có dòng lỗi | Không biết sửa dòng nào | Báo kết quả theo dòng; dòng lỗi không tạo | Journey 6 / UN-008 |

## 7. User-side Constraints

- Giao diện tiếng Việt ưu tiên; thông báo lỗi/audit rõ ràng cho admin.
- Chỉ tài khoản có vai trò admin (phạm vi toàn tổ chức) thao tác quản trị
  cơ cấu/gán/audit; người khác chỉ chịu rule quyền.
- Gán chỉ áp cho tài khoản đã tồn tại trong `account-access` của cùng tổ
  chức; ứng viên không có tài khoản nên không xuất hiện trong feature này.
- Catalog vai trò v1 cố định 6 vai trò chuẩn — admin không tự tạo vai trò.
- Nhật ký kiểm toán chỉ thêm mới — không ai (kể cả admin) sửa/xóa bản ghi.
- V1 không xóa cứng đơn vị/chức danh/gán — chỉ ngừng hoạt động/kết thúc để
  giữ truy vết.
- Màn quản trị cơ cấu/audit ưu tiên desktop (bảng, sơ đồ cây).

## 8. Assumptions & Validation

| Assumption | Impact if Wrong | Validation Status | Next Action |
|------------|-----------------|-------------------|-------------|
| `account-access` cung cấp tài khoản + trạng thái; org-governance chỉ gán quyền cho tài khoản đã tồn tại | Nếu khác → trùng nguồn sự thật về người dùng | Confirmed — phân chia scope trong PRD Mục 7.1/7.2 | — |
| Mỗi tài khoản thuộc đúng 1 tổ chức (kế thừa account-access) | Nếu multi-org → gán phải chọn org context | Assumption — mô hình B2B tenant | Đối chiếu khi tenant provisioning đặc tả |
| Catalog 6 vai trò chuẩn đủ cho v1; ma trận vai trò × quyền theo scenario matrix của brainstorm | Nếu thiếu vai trò → phải mở catalog sớm | Assumption — chờ owner duyệt matrix | Chốt ở OQ-1 |
| Cho phép nhiều gán ACTIVE đồng thời (tối đa 5), phạm vi hiệu dụng = hợp nhất rộng nhất; trường hợp phổ biến v1 là 1 gán | Nếu chỉ đơn gán → người kiêm vai trò mất quyền; nếu rule hợp nhất khác → scope lệch | Assumption — chờ duyệt | Chốt ở OQ-2 |
| "Hành động quan trọng" cần audit tối thiểu: gán/sửa/kết thúc quyền, tạo/sửa/ngừng đơn vị & chức danh, duyệt nghiệp vụ, xuất dữ liệu, đọc/xuất nhật ký, lượt từ chối quyền | Nếu danh sách khác → audit thiếu hoặc nhiễu | Assumption — chờ security owner chốt | Chốt ở OQ-4 |
| Retention audit tối thiểu 12 tháng, append-only, không redact actor/action | Nếu compliance yêu cầu khác → thay đổi lưu trữ | Assumption — chờ DPO (OQ-6 PRD) | Chốt ở OQ-3 |
| Lãnh đạo = đọc toàn tổ chức + duyệt theo quy trình, không sửa hồ sơ chi tiết; quản lý = đơn vị mình + con | Nếu khác → scenario matrix và role catalog đổi | Assumption — chờ Head of HR | Chốt ở OQ-5 |

## 9. User Success Criteria

| ID | User Outcome | Baseline | Target | Measurement | Review Period |
|----|--------------|----------|--------|-------------|---------------|
| USC-001 | Không sự cố vượt organization/role/data-scope | 0 sự cố | 0 sự cố xác nhận (guardrail cứng) | Số incident vượt scope — bám M-GR-01 PRD | Liên tục |
| USC-002 | Mọi hành động quan trọng có audit đầy đủ | Chưa có | 100% bản ghi đủ 6 trường (ai/gì/lên gì/trước-sau/lý do/khi nào) | Kiểm tra mẫu bản ghi audit theo tuần | Hàng tuần trong pilot |
| USC-003 | Admin dựng cơ cấu tối thiểu cho tenant pilot nhanh | Chưa có — xác lập bằng đo 3 lần bootstrap đầu | < 60 phút cho cây công ty + 2 chi nhánh + 5 phòng ban + 10 chức danh (đề xuất) | Thời gian từ mở màn đến gán thành công đầu tiên | Mỗi lần onboard tenant |
| USC-004 | Không tài khoản ACTIVE nào "treo" không quyền vô tình | Chưa có | 100% tài khoản ACTIVE có ≥1 gán hợp lệ hoặc có cảnh báo được xử lý | Tỷ lệ tài khoản ACTIVE không gán có cảnh báo mở | Hàng tuần trong pilot |
| USC-005 | Ranh giới quyền được kiểm chứng trước dữ liệu thật | 0 | 100% ô vai trò × phạm vi trong checklist test account khớp kỳ vọng trước pilot | Checklist xác minh có kết quả | Trước mỗi pilot |

## 10. Open Questions

- [x] OQ-1: Ai duyệt role×permission matrix chính thức (OQ-PL-01 reverse
  spec)? — Resolved (đề xuất): Security owner duyệt cùng Head of HR;
  catalog 6 vai trò và phạm vi mặc định theo scenario matrix là bản v1 —
  chờ hai owner xác nhận.
- [x] OQ-2: Một người có được gán nhiều đơn vị/vai trò đồng thời trong v1
  không? — Resolved (đề xuất): được — tối đa 5 gán ACTIVE đồng thời, phạm
  vi hiệu dụng là hợp nhất rộng nhất; trường hợp phổ biến vẫn là 1 gán —
  chờ Product owner xác nhận.
- [x] OQ-3: Retention và mức redact cho nhật ký kiểm toán (OQ-6 PRD,
  OQ-PL-04)? — Resolved (đề xuất): giữ tối thiểu 12 tháng rolling,
  append-only, không redact actor/action (đây là dữ liệu kiểm toán, không
  phải log vận hành); chỉ admin/security owner xem — chờ DPO/legal xác nhận.
- [x] OQ-4: Danh sách "hành động quan trọng" bắt buộc audit gồm gì, ai
  chốt? — Resolved (đề xuất): danh sách tối thiểu ở Mục 8 (gán/sửa/kết
  thúc quyền, đơn vị & chức danh, duyệt nghiệp vụ, xuất dữ liệu, đọc/xuất
  nhật ký, lượt từ chối quyền) — chờ Security owner chốt.
- [x] OQ-5: Lãnh đạo và quản lý khác nhau thế nào về phạm vi? — Resolved
  (đề xuất): lãnh đạo = đọc toàn tổ chức + duyệt theo quy trình, không sửa
  hồ sơ chi tiết; quản lý = đơn vị mình + đơn vị con — chờ Head of HR xác
  nhận.
- [x] OQ-6: Cần trạng thái "chờ hiệu lực" cho gán/điều chuyển trong v1
  không? — Resolved (đề xuất): v1 lưu ngày hiệu lực trên gán để truy vết;
  điều chuyển tương lai thực hiện bằng gán mới tại thời điểm cần, trạng
  thái chờ hiệu lực tự động thuộc slice P1 — chờ Product owner xác nhận.
