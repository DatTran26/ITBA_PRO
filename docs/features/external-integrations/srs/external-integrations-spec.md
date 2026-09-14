---
type: srs
feature: external-integrations
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/external-integrations/brainstorms/provider-agnostic-external-integrations.md
  - docs/features/external-integrations/external-integrations-urd.md
  - docs/features/platform-configuration/srs/platform-configuration-spec.md
---

# external-integrations — Software Requirements Specification

## 1. Scope

SRS này cover khung tích hợp provider-agnostic của một tổ chức: định nghĩa
integration theo contract (loại trao đổi calendar/form/webhook/file/task,
hướng, trường được phép, source-of-truth per loại dữ liệu), kết nối/authorize
với credential write-only và test connection bắt buộc, sync run có trạng
thái với retry/dead-letter và idempotency, webhook inbound qua hàng chờ +
allowlist + chữ ký, reconcile thủ công có audit, và vòng đời integration
(draft → active → paused → disabled).

Feature này là `Should` trong Feature Map — KHÔNG nằm trong lát cắt pilot
v1, và đang `Trì hoãn — chưa chọn provider` (project profile 2026-09-13).
Mọi nội dung ở mức provider-agnostic; provider cụ thể chỉ được gắn vào khi
roadmap quyết định.

KHÔNG cover: connector marketplace không giới hạn (PRD "Chưa làm"); chọn
provider cụ thể; auto-merge reconcile trong v1; deploy/approval qua webhook
(OQ-5 PRD — không phải cổng deploy); logic nghiệp vụ của dữ liệu được sync
(thuộc module nguồn); multi-provider routing cùng loại (P2); catalog cấu
hình + secret store (`platform-configuration` — giá trị credential nằm ở đó
làm nguồn duy nhất); phân quyền/audit nền (`org-governance`); kênh báo lỗi
(`contextual-notifications`).

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Admin | người | Cấu hình, giám sát, reconcile, ngắt integration | Có |
| HR | người | Dùng kết quả sync; tham gia reconcile khi được gán | Có |
| Technical/Operations owner | người | Chọn provider, rotation credential, vận hành retry | Có (stakeholder) |
| DPO/legal nominee | người | Duyệt trường trao đổi + retention | Có (stakeholder ràng buộc) |
| `org-governance` | hệ thống (feature khác) | Vai trò/quyền/phạm vi + audit | Không (dependency) |
| `platform-configuration` | hệ thống (feature khác) | Giữ credential/endpoint trong catalog — nguồn duy nhất | Không (dependency) |
| `contextual-notifications` | hệ thống (feature khác) | Báo lỗi sync/dead-letter | Không (dependency) |
| Module nghiệp vụ nguồn (`candidate-pipeline`, `workforce-monitoring`...) | hệ thống (feature khác) | Phát sinh/tiêu thụ dữ liệu sync | Không (nguồn/đích dữ liệu) |
| Provider ngoài (calendar, form, task...) | ngoài | Đích/nguồn trao đổi theo contract | Có (dependency — chưa chọn) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-external-integrations-001 | Định nghĩa integration theo contract | Hệ thống phải cho admin tạo integration từ loại contract có sẵn (calendar, form, webhook, file, task): đặt tên duy nhất, chọn hướng (outbound/inbound), khai báo trường được phép trao đổi và source-of-truth per loại dữ liệu; trạng thái khởi tạo "Nháp" | P0 | demo | PRD Mục 7.27 (theo cấu hình và audit rõ); URD UN-001 |
| FR-external-integrations-002 | Kết nối + authorize | Hệ thống phải cho nhập credential/endpoint qua field bảo mật write-only (giá trị nằm trong catalog `platform-configuration`); test connection bắt buộc đạt trước khi bật; giữ bản ghi kiểm chứng gần nhất | P0 | test | PRD Mục 7.27 (cấu hình/kết nối → authorize); URD UN-002 |
| FR-external-integrations-003 | Bật/tạm dừng/ngắt integration | Hệ thống phải quản vòng đời: Nháp → Hoạt động (sau test đạt) → Tạm dừng → Ngắt; tạm dừng giữ hàng chờ, ngắt hủy hàng chờ có log và webhook inbound bị bỏ qua | P0 | test | brainstorm Mục 6.2/6.3; URD UN-009 |
| FR-external-integrations-004 | Hàng chờ sync outbound | Khi module nghiệp vụ phát sự kiện hợp lệ theo contract, hệ thống phải tạo mục sync (sync item) vào hàng chờ của integration với payload tối thiểu theo allowlist | P0 | test | PRD Mục 7.27 (sync/event); URD UN-003 |
| FR-external-integrations-005 | Idempotency end-to-end | Mỗi mục sync phải mang khóa duy nhất (integration + bản ghi nguồn + loại trao đổi); replay webhook, retry hay chạy lại run phải bị bỏ qua kèm log duplicate-skipped — không tạo bản ghi trùng | P0 | test | PRD Mục 7.27 (rủi ro duplicate), R-12; URD UN-011 |
| FR-external-integrations-006 | Retry + dead-letter | Khi provider trả lỗi tạm, hệ thống phải retry theo lịch 5 phút/30 phút/2 giờ; hết lượt chuyển mục sang FAILED (dead-letter) kèm lỗi cuối; lỗi xác thực lặp không retry vô hạn | P0 | test | R-07/R-12; brainstorm 7.2 (đề xuất); URD UN-004 |
| FR-external-integrations-007 | Webhook inbound an toàn | Hệ thống phải cấp endpoint inbound kèm secret tự sinh (hiển thị một lần), chỉ nhận request có chữ ký hợp lệ, đưa vào hàng chờ và cắt trường ngoài allowlist contract kèm log field-drop | P0 | test | brainstorm D4; URD UN-006; OQ-5 PRD |
| FR-external-integrations-008 | Reconcile thủ công | Hệ thống phải cho chạy reconcile theo integration + khoảng thời gian: so khớp hai phía theo khóa map, liệt kê chênh (chỉ-ở-ta / chỉ-ở-họ / khác giá trị) kèm source-of-truth; quyết định từng dòng (áp dụng/giữ/bỏ qua kèm ghi chú) là append-only có audit; mục "áp dụng" tạo sync run sửa phía không phải truth | P0 | test | PRD Mục 7.27 (reconcile); URD UN-005 |
| FR-external-integrations-009 | Sync log truy vết | Mọi mục sync phải có bản ghi: integration, run, bản ghi nguồn, khóa idempotent, trạng thái, số lần thử, mốc thời gian, lỗi cuối và payload snapshot tối thiểu; lọc theo integration/trạng thái/loại | P0 | kiểm tra | PRD Mục 7.27 (audit rõ); R-12 |
| FR-external-integrations-010 | Báo kết quả cho người phụ trách | Khi run kết thúc có lỗi hoặc mục vào dead-letter, hệ thống phải báo người phụ trách qua `contextual-notifications` (fallback: hiển thị trong log) | P1 | test | brainstorm P1; dependency PRD #26; URD UN-010 |
| FR-external-integrations-011 | Field-level allowlist | Hệ thống phải quản danh sách trường được phép trao đổi per contract; trường nhạy cảm chỉ vào allowlist sau khi DPO duyệt; trường ngoài allowlist không xuất/nhập | P0 | test | PRD Mục 9, R-04/R-08; OQ-6; URD UN-008 |
| FR-external-integrations-012 | Resend dead-letter | Hệ thống phải cho resend mục FAILED sau khi nguyên nhân được sửa — tạo lần thử mới cùng khóa idempotent, không gửi lại mục đã SENT | P0 | test | URD UN-004; brainstorm 6.4 |
| FR-external-integrations-013 | Phân quyền chi tiết | Hệ thống phải tách quyền: tạo/sửa integration, bật/ngắt, xem log, quyết định reconcile, quản lý allowlist — gán theo vai trò `org-governance`, deny-by-default | P0 | test | PRD Mục 9; brainstorm Mục 8 |
| FR-external-integrations-014 | Chặn bật khi chưa sẵn sàng | Hệ thống phải chặn bật integration khi contract chưa đủ trường bắt buộc, chưa có credential hoặc test connection chưa đạt; hiển thị rõ "đang chờ provider/kiểm chứng" | P0 | test | URD UN-012; project profile (Trì hoãn) |
| FR-external-integrations-015 | Rotation credential | Hệ thống phải cho thay credential mới (write-only, ghi revision); khi nghi lộ: disable integration, thu hồi phía provider là bước vận hành ngoài hệ thống được ghi nhận, rà log cửa sổ nghi lộ | P0 | test | PRD Mục 9; brainstorm Mục 9; URD UN-007 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-external-integrations-001 | security | Minimal trao đổi: mọi payload chỉ chứa trường trong allowlist contract; credential chỉ ở server boundary, không plaintext trên mọi surface | P0 | 0 payload chứa trường ngoài allowlist; 0 sự cố lộ credential (bám M-GR-01, R-08) |
| NFR-external-integrations-002 | reliability | Không mục sync nào mất âm thầm: mọi mục kết thúc ở trạng thái ghi nhận, FAILED có người được báo, replay/retry không tạo duplicate | P0 | 0 mục không có trạng thái cuối; 0 duplicate theo khóa idempotent |
| NFR-external-integrations-003 | auditability | Mọi hành động cấu hình, authorize, mỗi sync run, từng quyết định reconcile đều có vết ai/khi nào/kết quả | P0 | 100% sự kiện kiểm tra có bản ghi đủ trường |
| NFR-external-integrations-004 | security | Quyền provider tối thiểu: contract khai báo scope cần; webhook inbound bắt buộc https + chữ ký; endpoint outbound chặn host nội bộ | P0 | Review scope trước khi bật; 100% request inbound không chữ ký bị từ chối |
| NFR-external-integrations-005 | performance | Sync run không chặn thao tác nghiệp vụ của người dùng; hàng chờ xử lý nền | P1 | Run 500 mục hoàn tất dispatch trong ≤30 phút khi provider khỏe (đề xuất — chờ OQ-10) |
| NFR-external-integrations-006 | privacy | Sync log + payload snapshot giữ theo retention đã duyệt; trường nhạy cảm chỉ trao đổi khi DPO cho phép | P0 | Retention chính thức chờ DPO (OQ-6 PRD); chỉ dữ liệu synthetic trước privacy gate |
| NFR-external-integrations-007 | usability | Giao diện và thông báo tiếng Việt tự nhiên; trạng thái integration nói rõ "đang chờ provider" khi chưa chọn | P0 | Kiểm tra màn cấu hình hiển thị đúng trạng thái trì hoãn |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-external-integrations-001 | Integration chỉ được bật sau khi test connection đạt và contract đủ trường bắt buộc — không ngoại lệ | Khi bật integration | FR-external-integrations-002, FR-external-integrations-014 | brainstorm D1; URD UN-002 |
| BR-external-integrations-002 | Khóa idempotent = integration + bản ghi nguồn + loại trao đổi; trùng khóa → bỏ qua kèm log | Khi tạo/nhận mục sync | FR-external-integrations-005 | PRD rủi ro duplicate; R-12 |
| BR-external-integrations-003 | Retry tối đa 3 lần theo lịch 5p/30p/2h; hết lượt → FAILED dead-letter; lỗi xác thực không retry vô hạn | Khi provider trả lỗi | FR-external-integrations-006 | brainstorm 7.2; R-07/R-12; OQ-10 đề xuất |
| BR-external-integrations-004 | Webhook inbound chỉ qua endpoint hệ thống cấp + chữ ký hợp lệ; trường ngoài allowlist bị cắt kèm log field-drop | Khi nhận request inbound | FR-external-integrations-007 | brainstorm D4; OQ-5 PRD |
| BR-external-integrations-005 | Reconcile không auto-merge: mọi chênh lệch cần quyết định thủ công append-only; "áp dụng" sửa phía không phải source-of-truth | Khi chạy reconcile | FR-external-integrations-008 | PRD Mục 7.27; brainstorm D5/D6 |
| BR-external-integrations-006 | Payload outbound chỉ chứa trường trong allowlist; trường nhạy cảm cần DPO duyệt trước khi vào allowlist | Khi xây payload / sửa contract | FR-external-integrations-011 | PRD Mục 9, R-04/R-08; OQ-6 |
| BR-external-integrations-007 | Ngắt integration: hủy hàng chờ có log, webhook inbound bỏ qua, credential giữ để bật lại | Khi admin ngắt | FR-external-integrations-003 | brainstorm 6.2/6.4; URD UN-009 |
| BR-external-integrations-008 | Resend chỉ mục FAILED; tạo lần thử mới cùng khóa idempotent | Khi resend dead-letter | FR-external-integrations-012 | brainstorm 6.2 |
| BR-external-integrations-009 | Quyền reconcile tách riêng quyền cấu hình; cả hai tách khỏi quyền xem log | Khi kiểm tra quyền | FR-external-integrations-013 | brainstorm Mục 8; PRD Mục 9 |
| BR-external-integrations-010 | Source-of-truth khai báo per loại dữ liệu trong contract; đổi khai báo không sửa quyết định reconcile đã ghi (snapshot rule tại thời điểm tạo) | Khi đổi contract | FR-external-integrations-001, FR-external-integrations-008 | brainstorm 6.5 |
| BR-external-integrations-011 | Credential chỉ nhập qua field bảo mật, lưu mã hóa trong catalog `platform-configuration`; đọc lại chỉ trả trạng thái | Khi lưu/đọc credential | FR-external-integrations-002, FR-external-integrations-015 | PRD Mục 9; URD OQ-8 |
| BR-external-integrations-012 | Integration ở trạng thái "đang chờ provider" không dispatch mục nào; giao diện phải nói rõ | Khi chưa chọn provider | FR-external-integrations-014 | Project profile (Trì hoãn) |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-external-integrations-001 | Test connection lỗi | Admin test kết nối provider không đạt | major | FR-external-integrations-002 | Hiện "Không kết nối được hệ thống ngoài: {lý do} — kiểm tra lại cấu hình" | Sửa cấu hình rồi test lại |
| E-external-integrations-002 | Webhook sai chữ ký | Request inbound không hợp lệ chữ ký | major | FR-external-integrations-007 | Từ chối request; log ghi "Yêu cầu webhook bị từ chối do chữ ký không hợp lệ" | Provider sửa secret; không có hành động phía user |
| E-external-integrations-003 | Hết retry | Provider lỗi liên tục qua 3 lần retry | major | FR-external-integrations-006 | Mục FAILED + báo "Đồng bộ {loại} thất bại sau 3 lần thử: {lý do} — cần xử lý thủ công" | Sửa nguyên nhân rồi resend hoặc đóng vết |
| E-external-integrations-004 | Integration bị ngắt giữa chừng | Admin ngắt khi còn mục QUEUED | major | FR-external-integrations-003 | Hàng chờ hủy kèm log "Integration đã bị ngắt — mục đồng bộ này sẽ không được gửi" | Bật lại → tạo run mới |
| E-external-integrations-005 | Trường ngoài contract | Payload có trường không trong allowlist | major | FR-external-integrations-011 | Cắt trường + log "Trường {tên} không nằm trong hợp đồng dữ liệu của integration này" | Owner đề nghị mở allowlist nếu cần |
| E-external-integrations-006 | Bật khi chưa kiểm chứng | Cố bật khi chưa test đạt/thiếu contract | minor | FR-external-integrations-014 | Hiện "Integration chưa được kiểm chứng — hoàn tất contract và test kết nối trước" | Hoàn tất contract + test đạt |
| E-external-integrations-007 | Credential hết hạn | Provider trả lỗi xác thực liên tục | major | FR-external-integrations-015 | Báo "Xác thực với hệ thống ngoài thất bại — kiểm tra credential"; retry có giới hạn | Đổi credential → test → bật lại |
| E-external-integrations-008 | Xung đột map reconcile | Hai bản ghi nguồn map cùng một bản ghi ngoài | minor | FR-external-integrations-008 | Reconcile liệt kê nhóm xung đột, bắt buộc chọn một | Chọn bản ghi đúng rồi quyết định |
| E-external-integrations-009 | Không có quyền reconcile | Người chỉ có quyền xem cố quyết định | major | FR-external-integrations-013 | Hiện "Bạn không có quyền đối soát cho integration này" | Xin admin cấp quyền |
| E-external-integrations-010 | Provider down kéo dài | Không kết nối được trong cả run | major | FR-external-integrations-006 | Mục ở RETRYING theo lịch; hết lượt FAILED | Provider phục hồi → resend phần FAILED |
| E-external-integrations-011 | Chưa chọn provider | Admin vào cấu hình khi roadmap chưa mở | minor | FR-external-integrations-014 | Hiện "Tính năng này đang chờ chọn provider — cấu hình hiện là bản nháp" | Chờ quyết định roadmap |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-external-integrations-01 | Sync chạy không cần sửa tay | Tỷ lệ mục SENT/tổng mục hợp lệ (đo chính PRD Mục 7.27) | ≥95% (đề xuất — chờ OQ-10 + provider thật) |
| SC-external-integrations-02 | Không duplicate | Số bản ghi trùng theo khóa idempotent | 0 |
| SC-external-integrations-03 | Reconcile có chủ | Tỷ lệ dòng chênh có quyết định trong ≤5 ngày làm việc | ≥90% sau kỳ reconcile đầu (đề xuất) |
| SC-external-integrations-04 | Chỉ integration kiểm chứng được chạy | Tỷ lệ integration ACTIVE đã qua test connection | 100% |
| SC-external-integrations-05 | Không lộ credential/field | Số incident lộ credential hoặc payload chứa trường ngoài allowlist | 0 (bám M-GR-01, R-08) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Integration (INTEGRATION)__ — một kết nối theo contract: loại, hướng,
  trạng thái vòng đời, tham chiếu credential trong catalog.
- __Contract field (CONTRACT_FIELD)__ — allowlist trường được phép trao đổi
  + source-of-truth per loại dữ liệu của integration.
- __Đợt đồng bộ (SYNC_RUN)__ — một lần chạy sync/reconcile-in: loại, trạng
  thái, tổng kết.
- __Mục đồng bộ (SYNC_ITEM)__ — một bản ghi trao đổi: khóa idempotent,
  tham chiếu nguồn/đích, payload snapshot tối thiểu, trạng thái, lỗi.
- __Lần thử (SYNC_ATTEMPT)__ — mỗi lần gọi provider cho một mục.
- __Báo cáo đối soát (RECONCILE_REPORT)__ — một lần chạy reconcile: khoảng
  thời gian, người chạy, tổng kết chênh.
- __Dòng chênh lệch (RECONCILE_ITEM)__ — một chênh lệch: loại chênh, giá
  trị hai phía, quyết định append-only + người quyết định.
- __Giá trị cấu hình (SETTING_VALUE)__ — tham chiếu ngoài, thuộc
  `platform-configuration`: credential/endpoint.
- __Người dùng (USERS)__, __Tổ chức (ORGANIZATION)__ — tham chiếu ngoài,
  thuộc `account-access`/`org-governance`.

Chi tiết quan hệ + thuộc tính ở `srs/external-integrations-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Tạo integration → định contract → nhập credential → test
  connection → bật → Hoạt động.
- __Flow 2:__ Sự kiện nghiệp vụ → mục sync QUEUED → provider chấp nhận →
  SENT; lỗi → RETRYING → FAILED → resend thủ công.
- __Flow 3:__ Webhook inbound → kiểm chữ ký → hàng chờ → cắt trường ngoài
  allowlist → module nghiệp vụ quyết định áp dụng.
- __Flow 4:__ Chạy reconcile → danh sách chênh → quyết định từng dòng →
  mục "áp dụng" tạo sync sửa phía không phải truth.
- __Flow 5:__ Rotation credential: ngắt → nhập credential mới → test đạt
  → bật lại → rà log cửa sổ nghi lộ.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __integration-list__ — danh sách integration + trạng thái vòng đời.
- __integration-setup__ — tạo/sửa contract + credential (write-only) +
  test connection + bật/ngắt.
- __sync-log__ — nhật ký mục sync: lọc integration/trạng thái/loại, chi
  tiết attempt, resend.
- __reconcile-run__ — chạy reconcile + danh sách chênh + quyết định từng
  dòng có preview.
- __dead-letter__ — hàng dead-letter + lý do + resend/đóng vết.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Trao đổi theo cấu hình + audit rõ; rủi ro duplicate/stale/quyền rộng phải được kiểm soát | PRD Mục 7.27 — Product owner |
| Idempotency + retry/dead-letter cho mọi trao đổi | PRD Mục 10 R-07/R-12 — Operations owner |
| Credential chỉ ở server boundary; quyền provider tối thiểu | PRD Mục 9 — Security owner |
| Retention/consent cho dữ liệu sync theo chính sách; OQ-6 mở thì chỉ dữ liệu synthetic | PRD Mục 9, R-04, OQ-6 — Product + DPO |
| Webhook inbound không phải cổng ghi trực tiếp/deploy | PRD OQ-5 — Technical owner |
| Quyền theo organization/role/data-scope, deny-by-default | PRD Mục 9 — Security owner (`org-governance`) |
| Tiếng Việt ưu tiên cho giao diện và thông báo | PRD Mục 9 — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Quyết định chọn provider | Product/Operations owner (roadmap) | Toàn bộ feature giữ trạng thái "chờ provider" — chỉ cấu hình nháp |
| Vai trò/quyền/phạm vi + audit (`org-governance`, PRD #2) | org-governance owner | Không phân quyền cấu hình/reconcile |
| Credential store (`platform-configuration`) | platform-configuration owner (cùng slice Should) | FR-002 cần bản ghi credential riêng tạm thời theo cùng hợp đồng |
| Kênh báo lỗi (`contextual-notifications`, PRD #26) | contextual-notifications owner | FR-010 degrade sang hiển thị trong log |
| Module nghiệp vụ nguồn/đích phát sự kiện và áp dụng kết quả | Owner từng module | Không có dữ liệu để sync |
| SLA/retry/bounce chuẩn (PRD OQ-10) | Technical/Operations owner | BR-003 và SC-01 ở mức đề xuất |
| Chính sách retention/consent (PRD OQ-6) | Product + DPO | NFR-006 và allowlist trường nhạy cảm chưa chốt |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Khung contract provider-agnostic đủ cho mọi provider tương lai | Khi chọn provider, adapter + field mapping phải thêm không đổi khung |
| Calendar là loại đầu tiên được bật | Thứ tự bật contract đổi theo quyết định owner |
| Credential integration nằm trong catalog `platform-configuration` | Hai nơi lưu secret → lệch/khó audit (URD OQ-8) |
| Reconcile v1 thủ công, không auto-merge | Phải thiết kế conflict policy + rollback reconcile |
| Retry 5p/30p/2h chuẩn chung với operational-email | BR-003, NFR-005 đổi theo OQ-10 |
| Webhook inbound chỉ qua hàng chờ + allowlist | Rủi ro ghi trái phép; phải thiết kế lại inbound |
| Giới hạn đề xuất: webhook 60 req/phút, payload 256 KB, 500 mục/run, reconcile report giữ 90 ngày | FR-006/007/008 và validation đổi ngưỡng |
| Dữ liệu nhạy cảm chỉ trao đổi khi DPO duyệt allowlist | Contract phải siết lại; SC-05 không đạt |

## 12. Open Questions

- [x] OQ-1: Provider nào được chọn? — Out of scope v1: project profile ghi
  "Trì hoãn — chưa chọn provider" (2026-09-13); quyết định thuộc roadmap —
  tài liệu giữ provider-agnostic.
- [x] OQ-2: Loại trao đổi nào bật đầu tiên? — Resolved (đề xuất): calendar
  theo PRD; các loại khác theo quyết định owner — chờ Product owner.
- [x] OQ-3: Webhook inbound ghi thẳng nghiệp vụ? — Resolved (đề xuất):
  không — qua hàng chờ + allowlist; module nghiệp vụ quyết định áp dụng —
  chờ Technical owner (bám OQ-5 PRD).
- [x] OQ-4: Retention/consent cho dữ liệu sync (OQ-6 PRD)? — Resolved (đề
  xuất): sync log theo audit policy; payload snapshot tối thiểu; trường
  nhạy cảm qua allowlist DPO — chờ DPO/legal.
- [x] OQ-5: Source-of-truth per loại dữ liệu? — Resolved (đề xuất): khai
  báo trong contract; module nghiệp vụ là truth cho dữ liệu nó sở hữu —
  chờ owner từng module khi chọn provider.
- [x] OQ-6: Auto-merge reconcile? — Resolved (đề xuất): không trong v1 —
  chờ Product owner.
- [x] OQ-7: Retry/dead-letter chuẩn? — Resolved (đề xuất): 5p/30p/2h →
  FAILED, thống nhất các feature gửi — chờ Technical/Operations (OQ-10).
- [x] OQ-8: Secret của integration để ở đâu? — Resolved (đề xuất): catalog
  `platform-configuration`, write-only + masked + versioned — chờ
  Operations owner.
- [x] OQ-9: Ai quyết định reconcile? — Resolved (đề xuất): admin/HR được
  gán quyền "đối soát" per integration — chờ Product owner.
- [x] OQ-10: Webhook endpoint ai cấp? — Resolved (đề xuất): hệ thống tự
  sinh endpoint + secret, hiển thị secret một lần — chờ Technical owner.
