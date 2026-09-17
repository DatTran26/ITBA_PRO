---
type: srs
feature: cv-event-monitoring
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - PRODUCT.md
  - docs/features/cv-event-monitoring/brainstorms/cv-event-intake-and-manager-review.md
  - docs/features/cv-event-monitoring/cv-event-monitoring-urd.md
---

# cv-event-monitoring — Software Requirements Specification

## 1. Scope

SRS này cover **phần HRMS** của giám sát sự kiện vi phạm bằng Computer
Vision: chính sách khu vực quan sát (zone policy) làm gate trước khi camera
hoạt động, catalog camera/khu vực, endpoint tiếp nhận sự kiện từ CV Backend
ngoài repo có xác thực/idempotency/retry, lưu sự kiện + bằng chứng tách
biệt, dashboard theo phạm vi quyền, thông báo manager, vòng đời xác nhận/
từ chối có lý do, evidence retention tự động và access audit. Đây là
feature **Could** — KHÔNG nằm trong cam kết v1; là slice mở rộng chỉ được
bật khi human review, retention/xóa evidence và access audit đã sẵn sàng
và policy được duyệt (PRD Mục 12, R-15, OQ-12). KHÔNG cover: xử lý
stream/video realtime, nhận diện danh tính, phân tích cảm xúc/phẩm chất,
theo dõi liên tục cá nhân, tự kết luận vi phạm/kỷ luật, loại phát hiện
phase 2 (PPE, xâm nhập, đếm người), cấu hình model/FPS phía CV service,
live preview (PRD Mục 7.38 "Chưa làm"; PRODUCT.md Mục 11 "Không đưa vào").

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| Quản lý (manager phụ trách khu vực) | người | Nhận và xử lý sự kiện chờ review trong phạm vi, tạo task | Có |
| Admin | người | Soạn/duyệt/công bố zone policy, đăng ký camera, xử lý hàng chờ lỗi, xem access audit | Có |
| Người duyệt chính sách (Head of HR / DPO-legal) | người | Phê duyệt zone policy trước khi camera hoạt động | Có |
| Lãnh đạo | người | Xem báo cáo/dashboard sự kiện theo phạm vi | Có (chỉ đọc) |
| CV Backend | hệ thống ngoài | Gửi sự kiện đã phát hiện + evidence qua API/webhook; nhận trạng thái giao nhận và (P1) trạng thái xác nhận | Không (hệ thống ngoài — contract boundary) |
| Nhân viên trong khu vực | người | Đọc công bố khu vực; phản hồi qua kênh policy | Không (v1 không có self-view evidence) |
| `contextual-notifications` | hệ thống (feature khác) | Gửi thông báo sự kiện cho manager | Không (kênh thông báo) |
| `kanban-workspaces` | hệ thống (feature khác) | Đích tạo task xử lý sự kiện | Không (consumer action) |
| `org-governance` | hệ thống (feature khác) | Role/scope/audit | Không (nền quyền) |
| `management-reporting` | hệ thống (feature khác) | Nguồn đọc cho báo cáo liên domain | Không (consumer số liệu) |
| `external-integrations` | hệ thống (feature khác) | Kênh webhook tổng quát khi sẵn | Không (chưa chọn provider — contract riêng v1) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-cv-event-monitoring-001 | Soạn zone policy | Khi admin tạo chính sách khu vực, hệ thống phải ghi nhận: khu vực/phòng áp dụng, loại sự kiện cho phép (danh mục đã công bố: hút thuốc, rời vị trí quá lâu), mục đích, ngưỡng confidence tiếp nhận, vai trò xem sự kiện/xem evidence, retention evidence/metadata, khung giờ áp dụng; trạng thái "Bản nháp" | P0 | demo | PRD Mục 7.38; PRODUCT.md Mục 11 (khu vực công khai); URD UN-008 |
| FR-cv-event-monitoring-002 | Duyệt và công bố zone policy | Khi admin gửi duyệt, hệ thống chuyển policy sang "Chờ duyệt"; khi người có thẩm quyền phê duyệt, hệ thống chuyển "Đã công bố", công khai cho phạm vi và ghi người duyệt + ngày công bố + version | P0 | test | PRD OQ-12, R-15; URD UN-008 |
| FR-cv-event-monitoring-003 | Đăng ký camera gắn policy | Khi admin đăng ký camera, hệ thống phải yêu cầu khu vực có policy "Đã công bố" và ghi nhận mã camera duy nhất, khu vực, endpoint service, khung giờ; camera chỉ sang "Hoạt động" sau kiểm tra kết nối | P0 | test | PRODUCT.md Mục 11 (quản lý camera); brainstorm Mục 5.1 |
| FR-cv-event-monitoring-004 | Tiếp nhận sự kiện có xác thực | Khi CV Backend gửi sự kiện qua endpoint, hệ thống phải xác thực service trước; request không xác thực bị từ chối và ghi log | P0 | test | PRD Mục 7.38 (API/webhook); brainstorm Mục 6.1 (D2) |
| FR-cv-event-monitoring-005 | Idempotency tiếp nhận | Nếu event_id đã tồn tại, hệ thống phải trả trạng thái "đã ghi nhận" và không tạo sự kiện mới | P0 | test | PRODUCT.md Mục 11 (không tạo sự kiện trùng); brainstorm Mục 6.1 (D3) |
| FR-cv-event-monitoring-006 | Kiểm hợp lệ theo policy | Khi sự kiện đến, hệ thống chỉ lưu nếu: camera "Hoạt động", loại sự kiện thuộc policy khu vực, confidence đạt ngưỡng tiếp nhận, thời điểm trong khung giờ áp dụng; ngược lại từ chối kèm lý do để service biết | P0 | test | PRODUCT.md Mục 11 (ngưỡng, khung giờ); brainstorm Mục 6.1 (D4) |
| FR-cv-event-monitoring-007 | Lưu sự kiện + evidence tách biệt | Hệ thống phải lưu bản ghi sự kiện (loại, camera, khu vực, thời điểm, duration, confidence, model version, trạng thái) tách biệt với evidence (ảnh/clip + trạng thái nạp); metadata và evidence có retention riêng theo policy | P0 | test | PRD Mục 7.38 (lưu sự kiện và bằng chứng); PRODUCT.md Mục 11 (metadata tách biệt) |
| FR-cv-event-monitoring-008 | Delivery log + retry + dead-letter | Hệ thống phải ghi delivery log mọi request đến (thành công/lỗi/lý do); sự kiện xử lý lỗi trả mã lỗi để service retry theo cơ chế đã chốt; hết retry chuyển hàng chờ "Lỗi giao nhận" cho admin xử lý tay | P0 | test | PRD Mục 7.38 (retry); PRODUCT.md Mục 11 (log toàn bộ request) |
| FR-cv-event-monitoring-009 | Dashboard theo phạm vi | Hệ thống phải hiển thị sự kiện lọc theo phòng/camera/loại/trạng thái chỉ trong phạm vi quản lý được cấp; sự kiện ngoài phạm vi ẩn hoàn toàn | P0 | test | PRD Mục 7.38 (dashboard), Mục 9; URD UN-009 |
| FR-cv-event-monitoring-010 | Thông báo manager | Khi sự kiện vào "Chờ review", hệ thống phải thông báo manager phụ trách khu vực (in-app; kênh ngoài qua `contextual-notifications` khi có) kèm tóm tắt — không đính kèm evidence trong thông báo | P0 | test | PRD Mục 7.38 (thông báo manager); PRODUCT.md Mục 11 |
| FR-cv-event-monitoring-011 | Quyết định có lý do bắt buộc | Khi manager quyết định trên sự kiện ("Xác nhận vi phạm", "False positive", "Cần thêm context"), hệ thống phải yêu cầu lý do, ghi người quyết định + thời điểm và chuyển trạng thái tương ứng | P0 | test | PRD Mục 7.38 (xác nhận/từ chối có lý do), Mục 12; PRODUCT.md Mục 11 |
| FR-cv-event-monitoring-012 | Đóng sự kiện | Khi sự kiện "Đã xác nhận" được xử lý xong, hệ thống chuyển "Đã xử lý" (resolved); sự kiện không còn giá trị chuyển "Đã loại bỏ" (dismissed) kèm lý do — bám vòng đời Detected → Pending Review → Confirmed/False Positive/Need More Context → Resolved/Dismissed | P0 | test | PRODUCT.md Mục 11 (trạng thái sự kiện) |
| FR-cv-event-monitoring-013 | Tạo task xử lý | Khi manager xác nhận sự kiện cần xử lý, hệ thống phải cho tạo task trên `kanban-workspaces` kèm liên kết ngược về sự kiện | P1 | demo | PRD Mục 7.38 (tạo task khi cần); PRODUCT.md Mục 11 (Kanban) |
| FR-cv-event-monitoring-014 | Cooldown gộp sự kiện | Khi sự kiện cùng loại + camera đến trong cửa sổ cooldown đã cấu hình và đã có sự kiện mở cùng loại, hệ thống phải gộp vào sự kiện đang mở thay vì tạo mới | P1 | test | PRODUCT.md Mục 11 (cooldown cảnh báo); brainstorm Mục 6.5 |
| FR-cv-event-monitoring-015 | SLA nhắc/escalate | Nếu sự kiện "Chờ review" quá SLA đã cấu hình, hệ thống phải nhắc manager; sau số lần nhắc cấu hình, escalate theo policy | P1 | test | brainstorm Mục 5.3, 6.5; URD Mục 6 |
| FR-cv-event-monitoring-016 | Evidence access audit | Hệ thống phải ghi nhận mọi lượt xem/tải evidence và mọi quyết định sự kiện (ai, khi nào, đối tượng nào, surface nào) vào audit | P0 | test | PRD R-15 (access audit); PRODUCT.md Mục 11 (ghi nhật ký) |
| FR-cv-event-monitoring-017 | Evidence retention tự động | Khi evidence đạt hạn retention của policy tại thời điểm ghi nhận, hệ thống phải tự động xóa/đánh dấu hết hạn; lượt xem sau hạn bị chặn kèm thông báo | P0 | test | PRD R-15 (retention/xóa); PRODUCT.md Mục 11 (tự động xóa) |
| FR-cv-event-monitoring-018 | Quyền evidence hẹp hơn | Hệ thống chỉ cho xem/tải evidence khi vai trò được cấp trong zone policy; quyền xem evidence phải hẹp hơn hoặc bằng quyền xem sự kiện | P0 | test | PRODUCT.md Mục 11 (phân quyền xem/tải nghiêm ngặt); R-15 |
| FR-cv-event-monitoring-019 | Thống kê chất lượng phát hiện | Hệ thống phải tổng hợp tỷ lệ sự kiện xác nhận/false positive theo camera/loại/model version để admin đánh giá và đề xuất chỉnh ngưỡng phía CV service | P1 | demo | PRD Mục 7.38 (đo thành công); PRODUCT.md Mục 11 |
| FR-cv-event-monitoring-020 | Sự kiện kỹ thuật camera | Hệ thống phải tiếp nhận và hiển thị sự kiện kỹ thuật (camera mất kết nối, chất lượng frame thấp, worker lỗi) như loại riêng, định tuyến admin thay vì manager | P1 | demo | PRODUCT.md Mục 11 (camera mất kết nối phải được phát hiện) |
| FR-cv-event-monitoring-021 | Đồng bộ trạng thái ngược | Khi sự kiện được xác nhận/false positive, hệ thống cho phép đồng bộ trạng thái về CV Backend để đánh giá model | P2 | demo | PRODUCT.md Mục 11 (đồng bộ ngược nếu cần); URD OQ-7 |
| FR-cv-event-monitoring-022 | Công bố khu vực cho nhân viên | Hệ thống phải hiển thị công khai zone policy đang hiệu lực (khu vực, mục đích, loại sự kiện, retention) cho người trong phạm vi | P0 | demo | PRODUCT.md Mục 11 (khu vực công khai kèm mục đích); R-15 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-cv-event-monitoring-001 | privacy | Camera chỉ "Hoạt động" khi khu vực có policy "Đã công bố"; sự kiện từ camera chưa kích hoạt bị từ chối | P0 | 0 sự kiện tiếp nhận từ camera/khu vực chưa có policy khi kiểm tra delivery log |
| NFR-cv-event-monitoring-002 | privacy | Sự kiện không chứa dữ liệu nhận diện danh tính cá nhân; hệ thống không suy ra danh tính từ evidence | P0 | Payload contract không có field danh tính; kiểm tra lưu trữ không có trường định danh cá nhân |
| NFR-cv-event-monitoring-003 | security | Mọi lượt xem/tải evidence và quyết định sự kiện có audit; quyền evidence deny-by-default | P0 | 0 lượt xem evidence ngoài phạm vi được xác nhận (bám M-GR-01); 100% lượt xem có log |
| NFR-cv-event-monitoring-004 | data-retention | Evidence tự xóa/đánh dấu đúng hạn policy; metadata theo hạn riêng đã công bố | P0 | 0 evidence tồn tại quá retention khi kiểm định định kỳ |
| NFR-cv-event-monitoring-005 | reliability | Không mất sự kiện: idempotency, retry có giới hạn, hàng chờ lỗi + delivery log đầy đủ | P0 | ≥99% sự kiện hợp lệ ghi nhận sau retry; 100% request đến có delivery log |
| NFR-cv-event-monitoring-006 | usability | Wording luôn gọi sự kiện là "cảnh báo chờ xác nhận", không phải "vi phạm" hay kết luận | P0 | Review wording trên mọi surface sự kiện chưa xác nhận |
| NFR-cv-event-monitoring-007 | performance | Dashboard sự kiện tải được ở quy mô pilot (vài nghìn sự kiện/tháng, đề xuất) | P1 | 95% lượt mở dashboard trả kết quả trong ≤3 giây |
| NFR-cv-event-monitoring-008 | isolation | HRMS không xử lý video/stream; chỉ lưu metadata + evidence đã xử lý từ service | P0 | Không có thành phần xử lý media trong scope triển khai HRMS |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-cv-event-monitoring-001 | Không có zone policy "Đã công bố" cho khu vực → camera không được "Hoạt động" và sự kiện bị từ chối | Khi đăng ký/kích hoạt camera hoặc sự kiện đến | FR-cv-event-monitoring-003, FR-cv-event-monitoring-006 | PRD OQ-12, R-15; PRODUCT.md Mục 11 |
| BR-cv-event-monitoring-002 | Mọi sự kiện chỉ là cảnh báo — bắt buộc manager xác nhận kèm lý do trước khi có ý nghĩa; cấm tự kết luận vi phạm/kỷ luật | Khi sự kiện được tạo/hiển thị/xử lý | FR-cv-event-monitoring-011, FR-cv-event-monitoring-012 | PRD Mục 12 (invariant), Mục 7.38 "Chưa làm" |
| BR-cv-event-monitoring-003 | event_id là khóa idempotency — gửi trùng không tạo bản ghi mới | Khi sự kiện đến | FR-cv-event-monitoring-005 | PRODUCT.md Mục 11 (không tạo trùng) |
| BR-cv-event-monitoring-004 | Sự kiện chỉ tiếp nhận khi camera hoạt động + loại thuộc policy + confidence đạt ngưỡng + trong khung giờ | Khi sự kiện đến | FR-cv-event-monitoring-006 | PRODUCT.md Mục 11 |
| BR-cv-event-monitoring-005 | Quyết định sự kiện bắt buộc lý do; "Xác nhận" mới được tạo task xử lý | Khi manager quyết định | FR-cv-event-monitoring-011, FR-cv-event-monitoring-013 | PRD Mục 7.38 |
| BR-cv-event-monitoring-006 | Quyền xem evidence ⊆ quyền xem sự kiện; mọi lượt xem/tải evidence ghi audit | Khi truy cập evidence | FR-cv-event-monitoring-016, FR-cv-event-monitoring-018 | PRODUCT.md Mục 11 (phân quyền nghiêm ngặt) |
| BR-cv-event-monitoring-007 | Evidence xóa/đánh dấu hết hạn theo retention tại thời điểm ghi nhận — không giữ quá policy đã công bố | Khi chạy job retention | FR-cv-event-monitoring-017 | PRD R-15; PRODUCT.md Mục 11 |
| BR-cv-event-monitoring-008 | Sự kiện lỗi sau retry tối đa → hàng chờ lỗi giao nhận; không bỏ âm thầm | Khi xử lý sự kiện lỗi lặp | FR-cv-event-monitoring-008 | PRD Mục 7.38 (retry); R-07 PRD (dead-letter) |
| BR-cv-event-monitoring-009 | Cooldown: cùng loại + camera trong cửa sổ cooldown gộp vào sự kiện đang mở | Khi sự kiện đến | FR-cv-event-monitoring-014 | PRODUCT.md Mục 11 (cooldown) |
| BR-cv-event-monitoring-010 | Sự kiện không gắn danh tính cá nhân — đối tượng là khu vực/camera | Khi lưu/hiển thị sự kiện | FR-cv-event-monitoring-007 | PRD Mục 7.38 "Chưa làm"; PRODUCT.md "Không đưa vào" |
| BR-cv-event-monitoring-011 | Zone policy đang hiệu lực phải công khai cho người trong phạm vi | Khi policy "Đã công bố" | FR-cv-event-monitoring-022 | PRODUCT.md Mục 11 (công khai kèm mục đích) |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-cv-event-monitoring-001 | Khu vực chưa có policy | Đăng ký/kích hoạt camera ở khu vực chưa công bố policy | major | FR-cv-event-monitoring-003 | Hiện "Khu vực này chưa có chính sách quan sát được công bố — công bố chính sách trước khi đăng ký camera" | Soạn/duyệt/công bố policy |
| E-cv-event-monitoring-002 | Payload sự kiện thiếu trường | Sự kiện đến thiếu trường bắt buộc | major | FR-cv-event-monitoring-006, FR-cv-event-monitoring-008 | Trả "Sự kiện thiếu thông tin bắt buộc: {danh sách field} — yêu cầu gửi lại" | Service sửa và retry; lặp → hàng chờ lỗi |
| E-cv-event-monitoring-003 | Xác thực service thất bại | Request không có/xài credential hợp lệ | critical | FR-cv-event-monitoring-004 | Trả "Yêu cầu từ dịch vụ không hợp lệ — kiểm tra cấu hình xác thực"; ghi log | Kiểm tra credential phía CV service |
| E-cv-event-monitoring-004 | Camera chưa kích hoạt | Sự kiện từ camera "đăng ký/tạm dừng/mất kết nối" | major | FR-cv-event-monitoring-006 | Trả "Sự kiện bị từ chối: camera {mã} chưa ở trạng thái hoạt động" | Kích hoạt camera khi policy sẵn |
| E-cv-event-monitoring-005 | Loại sự kiện ngoài policy | Sự kiện loại chưa công bố cho khu vực | major | FR-cv-event-monitoring-006 | Trả "Sự kiện bị từ chối: loại '{loại}' không nằm trong chính sách đã công bố của khu vực" | Cập nhật policy version mới nếu cần |
| E-cv-event-monitoring-006 | Dưới ngưỡng confidence | Confidence < ngưỡng tiếp nhận của policy | minor | FR-cv-event-monitoring-006 | Từ chối tiếp nhận, ghi delivery log | Service điều chỉnh ngưỡng phía nó |
| E-cv-event-monitoring-007 | Xem sự kiện ngoài phạm vi | Manager mở sự kiện khu vực khác | major | FR-cv-event-monitoring-009 | Hiện "Sự kiện này thuộc khu vực ngoài phạm vi quản lý của bạn" | Xin cấp phạm vi qua org-governance |
| E-cv-event-monitoring-008 | Xem evidence không quyền | Vai trò không được cấp xem evidence | major | FR-cv-event-monitoring-018 | Hiện "Bạn không có quyền xem bằng chứng của sự kiện này"; ghi audit | Xin cấp quyền evidence trong policy |
| E-cv-event-monitoring-009 | Evidence hết hạn | Mở evidence đã quá retention | minor | FR-cv-event-monitoring-017 | Hiện "Bằng chứng đã được xóa theo thời hạn lưu giữ đã công bố ({n} ngày)" | Không khôi phục; metadata vẫn xem được |
| E-cv-event-monitoring-010 | Quyết định thiếu lý do | Manager bấm quyết định chưa nhập lý do | minor | FR-cv-event-monitoring-011 | Hiện "Vui lòng nhập lý do trước khi ghi nhận quyết định" | Nhập lý do rồi xác nhận |
| E-cv-event-monitoring-011 | Sự kiện đã được xử lý | Hai manager cùng quyết định một sự kiện | minor | FR-cv-event-monitoring-011 | Hiện trạng thái mới + người đã xử lý | Không ghi đè; xem lịch sử |
| E-cv-event-monitoring-012 | Retry hết lượt | Sự kiện lỗi sau số retry cấu hình | major | FR-cv-event-monitoring-008 | Bản ghi vào hàng chờ "Lỗi giao nhận": "{n} sự kiện gửi về không thành công sau khi thử lại — cần xử lý thủ công" | Admin xử lý tay hoặc đánh dấu bỏ |
| E-cv-event-monitoring-013 | Evidence nạp lỗi | File evidence không nạp được sau hạn | minor | FR-cv-event-monitoring-007 | Sự kiện hiển thị "evidence lỗi" | Sự kiện vẫn review được; admin kiểm tra |
| E-cv-event-monitoring-014 | Sự kiện ngoài khung giờ | Sự kiện đến ngoài khung giờ áp dụng của policy | minor | FR-cv-event-monitoring-006 | Từ chối kèm lý do khung giờ | Kiểm tra cấu hình giờ phía service |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-cv-event-monitoring-01 | Sự kiện được người quyết định kịp thời | Tỷ lệ sự kiện có quyết định trong SLA | ≥80% sau 1 tháng pilot (đề xuất — target chờ OQ-12 PRD) |
| SC-cv-event-monitoring-02 | Cảnh báo ít nhiễu | Tỷ lệ false positive theo camera | Giảm qua 2 tháng liên tiếp (đề xuất — chờ OQ-12) |
| SC-cv-event-monitoring-03 | Không mất sự kiện giao nhận | Tỷ lệ ghi nhận thành công sau retry; tỷ lệ request có delivery log | ≥99% ghi nhận; 100% request có log |
| SC-cv-event-monitoring-04 | Không quan sát ngoài công bố | Sự kiện tiếp nhận từ camera chưa policy; lượt xem evidence ngoài phạm vi | 0 và 0 (guardrail — bám R-15, M-GR-01) |
| SC-cv-event-monitoring-05 | Evidence đúng hạn | Evidence tồn tại quá retention | 0 khi kiểm định định kỳ |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Chính sách khu vực (ZONE_POLICY + version)__ — khu vực, loại sự kiện,
  mục đích, ngưỡng tiếp nhận, vai trò xem/xem evidence, retention,
  khung giờ, trạng thái vòng đời.
- __Phê duyệt policy (POLICY_APPROVAL)__ — lớp duyệt (nghiệp vụ/privacy),
  quyết định, ghi chú.
- __Camera (CAMERA)__ — mã duy nhất, khu vực, endpoint service, trạng thái,
  khung giờ, lịch sử cấu hình.
- __Sự kiện (CV_EVENT)__ — event_id từ service, loại, camera, khu vực,
  thời điểm, duration, confidence, model version, trạng thái vòng đời.
- __Bằng chứng (EVENT_EVIDENCE)__ — loại (ảnh/clip), storage ref, trạng
  thái nạp, hạn retention.
- __Quyết định (EVENT_REVIEW)__ — người quyết định, quyết định, lý do,
  task xử lý liên kết.
- __Giao nhận (EVENT_DELIVERY)__ — request đến, kết quả, lý do lỗi, số
  retry, trạng thái hàng chờ lỗi.
- __Truy cập evidence (EVIDENCE_ACCESS_LOG)__ — ai xem/tải evidence nào,
  khi nào, surface nào.
- __Tham chiếu ngoài__ — USER, ORG_UNIT (`org-governance`), TASK
  (`kanban-workspaces`).

Chi tiết quan hệ + thuộc tính ở `srs/cv-event-monitoring-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Soạn zone policy → duyệt → công bố → đăng ký camera →
  "Hoạt động".
- __Flow 2:__ CV Backend gửi sự kiện → xác thực → idempotency → kiểm
  policy → lưu "Chờ review" + evidence → thông báo manager.
- __Flow 3:__ Manager xem sự kiện + evidence → quyết định có lý do →
  xác nhận/false positive/cần thêm context → task xử lý khi cần → đóng.
- __Flow 4:__ Sự kiện lỗi → service retry → hết lượt → hàng chờ lỗi giao
  nhận → admin xử lý tay.
- __Flow 5:__ Evidence hết retention → tự xóa/đánh dấu → lượt xem sau hạn
  bị chặn; metadata theo hạn riêng.

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __zone-policy-editor__ — soạn/sửa policy theo section (khu vực, loại sự
  kiện, ngưỡng, retention, quyền xem, khung giờ).
- __policy-approval-queue__ — hàng chờ policy "Chờ duyệt".
- __camera-catalog__ — danh sách camera/khu vực + trạng thái + đăng ký.
- __event-dashboard__ — dashboard sự kiện lọc theo phòng/camera/loại/trạng
  thái + banner "chỉ là cảnh báo".
- __event-review-detail__ — chi tiết sự kiện + evidence + quyết định có
  lý do.
- __delivery-error-queue__ — hàng chờ sự kiện lỗi giao nhận + payload + lý
  do.
- __zone-public-notice__ — trang công bố chính sách khu vực cho nhân viên.
- __access-audit-view__ — truy vết lượt xem/tải evidence và quyết định.

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Feature Could — HRMS chỉ nhận sự kiện đã xử lý; mọi cảnh báo qua manager xác nhận | PRD Mục 12 — Product owner |
| Bắt buộc human review + retention/xóa evidence + access audit trước khi bật | PRD R-15 — Product + DPO/legal nominee |
| Cấm xử lý stream realtime, nhận diện danh tính, tự kết luận vi phạm/kỷ luật | PRD Mục 7.38 "Chưa làm"; PRODUCT.md "Không đưa vào" — Product owner |
| Khu vực camera phải công khai kèm mục đích; không quan sát ngoài phạm vi công bố | PRODUCT.md Mục 11 (ràng buộc quyền riêng tư) — DPO/legal |
| Evidence có thời hạn, tự xóa sau hạn, phân quyền xem/tải nghiêm ngặt, mọi lượt xem ghi nhật ký | PRODUCT.md Mục 11 (ràng buộc dữ liệu) — Security owner + DPO |
| Mọi truy cập theo organization/role/data-scope + audit boundary | PRD Mục 9 — Security owner |
| Trước dữ liệu thật: Product/DPO duyệt purpose, lawful basis, access, retention/delete, withdrawal, legal hold, audit; OQ-3/OQ-6/OQ-12 mở thì chỉ dữ liệu synthetic | PRD Mục 9, OQ-12 — Product + DPO |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| CV Backend phát hiện sự kiện + gửi evidence (Python service ngoài repo) | Owner CV service (đang build) | Toàn bộ nguồn sự kiện — chỉ test được contract bằng dữ liệu synthetic |
| Endpoint contract (schema, auth, retry) được chốt | Owner CV service + Technical/Operations | FR-004..008 — không tích hợp được |
| Role/scope/audit cho phạm vi manager/admin | `org-governance` | FR-009, FR-016 — không kiểm soát phạm vi |
| Kênh thông báo manager | `contextual-notifications` | FR-010 — sự kiện chỉ hiện trên dashboard |
| Tạo task xử lý | `kanban-workspaces` | FR-013 — sự kiện xác nhận không có đích xử lý |
| Báo cáo liên domain | `management-reporting` | FR-019 mở rộng — thống kê chất lượng chỉ nội bộ |
| Kênh webhook/integration tổng quát | `external-integrations` (chưa chọn provider) | Contract webhook v1 tự quản; khi sẵn có thể chuyển |
| Người duyệt zone policy (Head of HR + DPO/legal) | Product owner / DPO | FR-002 — không công bố được policy |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| Contract sự kiện = payload PRODUCT.md Mục 11 + event_id | FR-005/006 đổi validation và idempotency |
| Evidence lưu tại storage HRMS | FR-017 retention không thực thi được |
| Người duyệt policy = Head of HR + DPO/legal | FR-002 nghẽn thẩm quyền |
| Sự kiện không gắn danh tính cá nhân | BR-010, NFR-002 phải đổi — feature đổi bản chất |
| Ngưỡng/SLA/retry/retention là đề xuất chờ chốt | FR-006/015/017/008 đổi default |
| Webhook là contract riêng v1 (chưa qua external-integrations) | FR-004/008 phải tái cấu trúc khi platform sẵn |

## 12. Open Questions

- [x] OQ-1: Endpoint contract? — Resolved (đề xuất): payload PRODUCT.md +
  event_id; chờ owner CV service (roadmap OQ-1).
- [x] OQ-2: Ai duyệt khu vực/ngưỡng/retention? — Resolved (đề xuất): Head
  of HR + DPO/legal — chờ DPO/legal (PRD OQ-12).
- [x] OQ-3: Ngưỡng confidence tiếp nhận? — Resolved (đề xuất): 0.70 — chờ
  DPO/legal + owner CV service.
- [x] OQ-4: Retention evidence/metadata? — Resolved (đề xuất): 30 ngày /
  12 tháng — chờ DPO/legal (OQ-6 PRD).
- [x] OQ-5: Retry/dead-letter? — Resolved (đề xuất): 5 lần backoff → hàng
  chờ lỗi — chờ Technical/Operations.
- [x] OQ-6: SLA review + cooldown? — Resolved (đề xuất): 2 ngày làm việc /
  10 phút — chờ Product owner/Head of HR.
- [~] OQ-7: Đồng bộ trạng thái ngược về service? — Out of scope v1 (P1).
- [~] OQ-8: Nhân viên xem evidence liên quan mình? — Out of scope v1 —
  chờ DPO/legal.
- [~] OQ-9: Loại phase 2 (PPE, xâm nhập, đếm người)? — Out of scope v1 —
  phase 2 CV service.

## 13. develop-hieu implemented slice: workplace behavior monitoring

This branch implements the first workplace behavior monitoring slice in the
existing Next.js dashboard with Python used only as the inference service.

- `/dashboard/behavior` provides two live monitor boxes for workplace
  detection. Each monitor can be configured with a model path, source/camera
  selection, confidence settings, and per-monitor runtime logs.
- Current P0 input is browser camera/video frame capture through the dashboard.
  RTSP/WebRTC ingest from network cameras remains out of scope.
- Next.js BFF routes call the Python Vision AI service through `VISION_AI_URL`.
  The browser never calls the FastAPI service directly.
- The Python service runs YOLO with local weights such as `behavior.pt`,
  `smoking.pt`, or `leaving.pt`. Model files are local runtime assets and are
  not committed to git.
- The implemented labels include smoking/cigarette-style detections and empty
  seat/unoccupied desk detections. The API returns bounding boxes, labels,
  confidence, and processing metadata.
- The UI renders live bounding boxes over the video frame, shows label and
  confidence, and writes scan/log output separately for each monitor.
- Detected events are created as `pending_review`. A manager/admin must approve
  or reject the alert; AI output never auto-punishes an employee.
- Evidence images and metadata are stored under
  `VIOLATION_DATA_DIR/Profile Name__userId/YYYY-MM-DD/`.
- Evidence capture applies a cooldown to avoid duplicated evidence for the
  same continuous behavior.
- `/dashboard/model-controller` lets privileged users tune model paths,
  confidence, IOU threshold, enabled labels, and storage paths.

Still outside this slice:

- RTSP/WebRTC camera ingest, Telegram notifications, dwell/background workers,
  automatic discipline, and production active-learning retraining.
