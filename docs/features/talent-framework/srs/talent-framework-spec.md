---
type: srs
feature: talent-framework
status: draft
updated: 2026-09-14
links:
  - docs/downtown/prd.md
  - docs/features/talent-framework/brainstorms/skill-taxonomy-and-position-expectations.md
  - docs/features/talent-framework/talent-framework-urd.md
  - docs/_reverse/talent-and-crm/reverse-spec.md
---

# talent-framework — Software Requirements Specification

## 1. Scope

SRS này cover khung kỹ năng chung của một tổ chức: taxonomy 2 tầng (nhóm
kỹ năng → kỹ năng), thang cấp độ chung và mô tả hành vi từng mức, khung kỳ
vọng vị trí (kỹ năng + level yêu cầu + cờ bắt buộc), vòng đời duyệt
bản-nháp → chờ-duyệt → đã-công-bố → ngừng-dùng với business owner bắt
buộc, đề xuất kỹ năng từ quản lý, import taxonomy và audit đầy đủ. KHÔNG
cover: áp khung lên quyết định lương/thăng chức tự động (PRD "Chưa làm"),
quản lý vị trí/cơ cấu tổ chức (`org-governance`, `employee-profiles`), ghi
nhận kỹ năng của nhân viên (`employee-profiles`, `employee-evaluation`),
tính coverage/gap (`skill-gap-analysis`), và AI gợi ý kỹ năng (hướng P2).

Feature này là `Should` trong Feature Map — **không nằm trong cam kết lát
cắt thương mại v1** (15 capability Must); nội dung dưới đây là first
release của riêng feature ở slice mở rộng.

## 2. Actors & Stakeholders

| Actor | Loại (người/hệ thống/ngoài) | Mục tiêu | Trong scope? |
|-------|-----------------------------|----------|--------------|
| HR | người | Tạo/sửa kỹ năng và khung vị trí, gửi duyệt, import taxonomy | Có |
| Business owner (Head of HR/người được gán) | người | Duyệt kỹ năng, khung vị trí và đề xuất thuộc phạm vi phụ trách | Có |
| Quản lý | người | Đề xuất kỹ năng, soạn khung vị trí team mình, xem khung | Có |
| Admin | người | Gán owner, cấu hình taxonomy, truy vết audit | Có |
| Interviewer / người tạo bài | người | Chọn kỹ năng đã công bố để gắn câu hỏi/bài/JD | Có (consumer trong-scope là điểm đọc) |
| Nhân viên | người | Xem khung kỳ vọng của vị trí mình (chỉ đọc) | Có |
| `question-bank`, `assessment-authoring`, `employee-evaluation`, `skill-gap-analysis` | hệ thống (feature khác) | Đọc danh mục kỹ năng/khung ở trạng thái "Đã công bố" | Không (consumer của dữ liệu feature này) |
| `org-governance`, `employee-profiles` | hệ thống (feature khác) | Cung cấp vị trí, role/scope, người dùng | Không (nguồn dữ liệu tham chiếu) |

## 3. Functional Requirements (FR)

| ID | Title | Description | Priority | Verify by | Source |
|----|-------|-------------|----------|-----------|--------|
| FR-talent-framework-001 | Tạo/sửa kỹ năng | Khi HR/admin (hoặc owner) tạo kỹ năng, hệ thống phải ghi nhận tên, nhóm kỹ năng, mô tả và mô tả hành vi cho từng mức trên thang chung; kỹ năng mới ở trạng thái "Bản nháp" cho tới khi gửi duyệt | P0 | demo | PRD Mục 7.32 (taxonomy kỹ năng, level); URD UN-001 |
| FR-talent-framework-002 | Kiểm tra trùng/gần giống | Khi lưu kỹ năng mới, hệ thống phải phát hiện tên trùng (không phân biệt hoa thường) và gợi ý kỹ năng gần giống đã có; trùng tuyệt đối thì chặn lưu, gần giống thì cảnh báo cho người tạo quyết định | P0 | test | PRD Mục 7.32 (rủi ro taxonomy trùng); brainstorm Mục 6.1 (D1) |
| FR-talent-framework-003 | Gửi duyệt và hàng chờ | Khi người soạn gửi duyệt kỹ năng/khung, hệ thống phải kiểm tra đủ trường bắt buộc rồi chuyển sang "Chờ duyệt" và đưa vào hàng chờ của business owner phụ trách | P0 | test | PRD Mục 7.32 (luồng chính); URD UN-003 |
| FR-talent-framework-004 | Quyết định của owner | Khi owner quyết định trên mục chờ duyệt, hệ thống phải ghi nhận "Công bố" hoặc "Yêu cầu chỉnh" kèm ghi chú bắt buộc, người duyệt và thời điểm; "Công bố" chuyển mục thành "Đã công bố" | P0 | test | PRD Mục 7.32 (rủi ro owner), R-13, OQ-11; URD UN-003 |
| FR-talent-framework-005 | Chỉ bản đã công bố làm chuẩn | Khi bất kỳ module nào đọc danh mục kỹ năng/khung làm chuẩn tham chiếu, hệ thống phải chỉ trả các mục ở trạng thái "Đã công bố" | P0 | test | PRD Mục 7.32, Mục 12 (human-in-the-loop); URD UN-004 |
| FR-talent-framework-006 | Khung kỳ vọng vị trí | Khi soạn khung cho một vị trí, hệ thống phải cho gắn kỹ năng từ danh mục đã công bố, đặt level yêu cầu trên thang chung và cờ "bắt buộc" từng dòng; khung phải có ≥1 kỹ năng, không trùng kỹ năng, mọi dòng có level | P0 | demo | PRD Mục 7.32 (yêu cầu vị trí, cờ bắt buộc); Observed: reverse spec `talent-and-crm` FR-TL-02 |
| FR-talent-framework-007 | Bắt buộc business owner của vị trí | Khi gửi duyệt/công bố khung vị trí, nếu vị trí chưa có business owner thì hệ thống phải chặn và hướng dẫn gán owner trước; admin (hoặc Head of HR) thực hiện gán owner | P0 | test | PRD Mục 7.32 (rủi ro kỳ vọng không có business owner); URD UN-002 |
| FR-talent-framework-008 | Một khung hiệu lực mỗi vị trí | Khi khung mới của một vị trí được công bố, hệ thống phải chuyển khung đó thành bản hiệu lực duy nhất và đưa khung cũ (nếu có) về trạng thái lịch sử | P0 | test | brainstorm Mục 6.3; URD UN-002 |
| FR-talent-framework-009 | Sửa nội dung đã công bố | Khi kỹ năng/khung "Đã công bố" bị sửa, hệ thống phải đưa bản chỉnh về "Chờ duyệt" và giữ bản đang công bố làm chuẩn tới khi bản mới được duyệt | P0 | test | brainstorm Mục 5.3, 6.1 (D6); URD UN-006 |
| FR-talent-framework-010 | Ngừng dùng thay xóa | Khi kỹ năng/khung đang được tham chiếu (khung vị trí khác, kỹ năng nhân viên, câu hỏi, bài đánh giá) có yêu cầu xóa, hệ thống phải chặn xóa và chỉ cho "Ngừng dùng" kèm lý do; mục ngừng dùng ẩn khỏi chọn mới và tham chiếu cũ hiển thị nhãn "đã ngừng dùng" | P0 | test | brainstorm Mục 6.1 (D5); URD UN-007 |
| FR-talent-framework-011 | Xóa khi chưa có tham chiếu | Nếu kỹ năng/khung chưa được tham chiếu ở đâu, thì hệ thống phải cho xóa hẳn và giữ vết audit (ai xóa, nội dung cuối, thời điểm) | P1 | test | brainstorm Mục 6.1 (D5); URD UN-007 |
| FR-talent-framework-012 | Phục hồi mục ngừng dùng | Khi khôi phục kỹ năng/khung đã ngừng dùng, hệ thống phải đưa mục về "Chờ duyệt" để owner duyệt lại trước khi làm chuẩn trở lại | P1 | test | brainstorm Mục 6.3; URD OQ-8 |
| FR-talent-framework-013 | Nhân viên xem khung vị trí mình | Hệ thống phải cho nhân viên xem (chỉ đọc) khung "Đã công bố" của vị trí mình đang giữ | P0 | demo | brainstorm Mục 4; URD UN-005 |
| FR-talent-framework-014 | Đề xuất kỹ năng từ quản lý | Khi quản lý gửi đề xuất kỹ năng mới (tên, nhóm gợi ý, mô tả, lý do), hệ thống phải đưa đề xuất vào hàng chờ của owner; owner duyệt thì tạo kỹ năng đi qua luồng chờ-duyệt chuẩn, từ chối thì ghi lý do trả quản lý | P1 | test | brainstorm Mục 4 (P1); URD UN-008 |
| FR-talent-framework-015 | Import taxonomy từ file mẫu | Khi HR tải file theo mẫu công bố, hệ thống phải kiểm tra từng dòng (đủ trường, nhóm tồn tại, trùng tên), tạo kỹ năng hợp lệ ở "Bản nháp" và báo lỗi theo dòng; kỹ năng import vẫn qua duyệt như thường | P1 | test | brainstorm Mục 4 (P1); URD UN-009 |
| FR-talent-framework-016 | Nhân bản khung vị trí | Hệ thống phải cho tạo khung mới bằng cách nhân bản từ khung đã có của vị trí khác rồi chỉnh, bản nhân bản ở "Bản nháp" | P2 | demo | brainstorm Mục 4 (P1); URD UN-011 |
| FR-talent-framework-017 | Quản lý nhóm kỹ năng | Hệ thống phải cho tạo/sửa tên nhóm kỹ năng; chặn xóa nhóm còn chứa kỹ năng, yêu cầu chuyển kỹ năng sang nhóm khác trước | P1 | demo | brainstorm Mục 6.5; URD Mục 6 |
| FR-talent-framework-018 | Lịch sử thay đổi | Hệ thống phải giữ lịch sử ai tạo/sửa/duyệt/công bố/ngừng dùng trên kỹ năng và khung (thời điểm, nội dung trước/sau, ghi chú duyệt) | P0 | kiểm tra | PRD Mục 9 (audit); URD UN-010 |
| FR-talent-framework-019 | Thang level chung | Hệ thống phải áp một thang level chung của tổ chức (đề xuất 5 mức — chờ duyệt, OQ-2) cho mọi kỹ năng; chỉ vai trò được cấp mới chỉnh thang, và thang đã có tham chiếu thì khóa chỉnh trực tiếp | P0 | test | brainstorm Mục 4, 9; URD OQ-2/OQ-7 |
| FR-talent-framework-020 | Cảnh báo đồng thời | Khi hai người cùng sửa một kỹ năng/khung, hệ thống phải cảnh báo người lưu sau rằng đối tượng vừa được cập nhật thay vì ghi đè im lặng | P1 | test | brainstorm Mục 6.4; URD Mục 6 |

## 4. Non-Functional Requirements (NFR)

| ID | Category | Requirement | Priority | Acceptance |
|----|----------|-------------|----------|------------|
| NFR-talent-framework-001 | security | Mọi thao tác trên taxonomy/khung tuân theo organization/role/data-scope; deny-by-default cho vai trò chưa được cấp | P0 | 0 sự cố vượt scope được xác nhận (guardrail bám M-GR-01) |
| NFR-talent-framework-002 | auditability | Mọi thay đổi trạng thái, nội dung, quyết định duyệt và gán owner phải có vết audit (ai, khi nào, trước/sau) | P0 | Truy vết được 100% sự kiện trên mẫu đối tượng kiểm tra bất kỳ |
| NFR-talent-framework-003 | integrity | Tham chiếu cũ tới kỹ năng/khung ngừng dùng không bị viết lại; bản đã công bố không bị sửa trực tiếp mà không qua duyệt | P0 | Kiểm tra tham chiếu cũ giữ nguyên sau ngừng dùng; không có đường sửa chuẩn bỏ qua duyệt |
| NFR-talent-framework-004 | performance | Tải danh mục kỹ năng, hàng chờ duyệt và khung vị trí | P1 | 95% lượt tải trong ≤3 giây ở quy mô taxonomy ≤500 kỹ năng (đề xuất — OQ-6) |
| NFR-talent-framework-005 | usability | Toàn bộ giao diện và thông báo tiếng Việt; tên/mô tả kỹ năng hỗ trợ đầy đủ dấu và ký tự tiếng Việt | P0 | Kiểm tra mẫu dữ liệu tiếng Việt lưu và hiển thị đúng |
| NFR-talent-framework-006 | governance | Khung kỹ năng chỉ là chuẩn tham chiếu; hệ thống không cung cấp đường tự động áp khung lên quyết định lương/thăng chức | P0 | Không có trigger/báo cáo tự ra quyết định nhân sự từ dữ liệu khung (PRD Mục 7.32 "Chưa làm", Mục 12) |

## 5. Business Rules

| ID | Rule | Trigger | Implements FR | Source |
|----|------|---------|---------------|--------|
| BR-talent-framework-001 | Chỉ kỹ năng/khung "Đã công bố" được tham chiếu làm chuẩn — không ngoại lệ, kể cả nội dung import hay đề xuất | Khi module đọc danh mục chuẩn hoặc khi chọn kỹ năng gắn vào đối tượng khác | FR-talent-framework-005 | PRD Mục 12; brainstorm Mục 4 |
| BR-talent-framework-002 | Vị trí phải có business owner trước khi khung của nó được công bố | Khi gửi duyệt/công bố khung vị trí | FR-talent-framework-007 | PRD Mục 7.32 (rủi ro), R-13 |
| BR-talent-framework-003 | Đối tượng đang được tham chiếu cấm xóa — chỉ được "Ngừng dùng"; tham chiếu cũ giữ nguyên hiển thị | Khi có yêu cầu xóa kỹ năng/khung | FR-talent-framework-010 | brainstorm Mục 6.1 (D5), Mục 8 |
| BR-talent-framework-004 | Sửa nội dung "Đã công bố" buộc qua duyệt lại; bản cũ vẫn là chuẩn tới khi bản mới được duyệt | Khi lưu sửa trên mục đã công bố | FR-talent-framework-009 | brainstorm Mục 5.3 |
| BR-talent-framework-005 | Mỗi vị trí tối đa 1 khung "Đã công bố"; công bố khung mới thay khung cũ | Khi công bố khung vị trí | FR-talent-framework-008 | brainstorm Mục 6.3 |
| BR-talent-framework-006 | Khung/kỹ năng không được dùng để tự động kết luận lương, thăng chức, kỷ luật hay phẩm chất con người | Mọi đường dữ liệu ra quyết định nhân sự | FR-talent-framework-001 (scope) | PRD Mục 7.32 "Chưa làm", Mục 5 non-goals, Mục 12 |
| BR-talent-framework-007 | Khung vị trí hợp lệ: ≥1 kỹ năng, không trùng kỹ năng, mọi dòng có level yêu cầu trên thang chung | Khi gửi duyệt khung vị trí | FR-talent-framework-006 | brainstorm Mục 7.1 |
| BR-talent-framework-008 | Phục hồi mục ngừng dùng phải qua "Chờ duyệt" — không quay thẳng về đã công bố | Khi khôi phục kỹ năng/khung | FR-talent-framework-012 | brainstorm Mục 6.3; URD OQ-8 |
| BR-talent-framework-009 | Thang level là chung toàn tổ chức; đã có tham chiếu thì khóa sửa trực tiếp, đổi qua quy trình migrate có duyệt | Khi chỉnh thang level | FR-talent-framework-019 | brainstorm Mục 9; URD OQ-2/OQ-7 |
| BR-talent-framework-010 | Owner được tự duyệt nội dung mình soạn nhưng audit phải ghi nhận "tự duyệt" | Khi owner duyệt mục do chính mình tạo | FR-talent-framework-004 | brainstorm Mục 6.5; URD OQ-4 (đề xuất — chờ Head of HR) |
| BR-talent-framework-011 | Tên kỹ năng không trùng toàn taxonomy (không phân biệt hoa thường); gần giống chỉ cảnh báo | Khi lưu kỹ năng | FR-talent-framework-002 | brainstorm Mục 7.1 |
| BR-talent-framework-012 | Nhóm kỹ năng còn chứa kỹ năng thì cấm xóa | Khi xóa nhóm kỹ năng | FR-talent-framework-017 | brainstorm Mục 6.5 |

## 6. Error Matrix

| Error ID | Title | Trigger | Severity | Related FR | Screen state | Recovery |
|----------|-------|---------|----------|------------|--------------|----------|
| E-talent-framework-001 | Trùng tên kỹ năng | Lưu kỹ năng có tên trùng tuyệt đối trong taxonomy | minor | FR-talent-framework-002 | Hiện "Đã có kỹ năng \"{tên}\" trong khung — chọn tên khác hoặc dùng kỹ năng sẵn có" | Đổi tên hoặc dùng kỹ năng sẵn có |
| E-talent-framework-002 | Vị trí chưa có owner | Gửi duyệt/công bố khung cho vị trí chưa gán business owner | major | FR-talent-framework-007 | Hiện "Vị trí này chưa có người phụ trách khung kỹ năng — gán người phụ trách trước khi công bố" | Gán owner rồi gửi lại |
| E-talent-framework-003 | Khung chưa hợp lệ | Gửi duyệt khung trùng kỹ năng, thiếu level hoặc rỗng | minor | FR-talent-framework-006 | Hiện "Khung chưa hợp lệ: {lý do cụ thể từng dòng}" | Sửa dòng lỗi rồi gửi lại |
| E-talent-framework-004 | Xóa đối tượng đang được dùng | Xóa kỹ năng/khung đang được tham chiếu | major | FR-talent-framework-010 | Hiện "Kỹ năng này đang được dùng ở {số} nơi — chỉ có thể ngừng dùng, không xoá" | Chuyển sang thao tác Ngừng dùng |
| E-talent-framework-005 | Không có quyền | Vai trò chưa được cấp cố tạo/sửa/duyệt | major | FR-talent-framework-001, FR-talent-framework-004 | Hiện "Bạn không có quyền chỉnh khung kỹ năng"; ghi audit truy cập bị từ chối | Xin cấp quyền qua admin |
| E-talent-framework-006 | Xóa nhóm còn kỹ năng | Xóa nhóm kỹ năng đang chứa kỹ năng | minor | FR-talent-framework-017 | Hiện "Nhóm này còn {n} kỹ năng — chuyển kỹ năng sang nhóm khác trước khi xóa" | Chuyển kỹ năng rồi xóa |
| E-talent-framework-007 | Sửa đồng thời | Người thứ hai lưu khi đối tượng vừa được cập nhật | minor | FR-talent-framework-020 | Hiện "\"{tên}\" vừa được {người} cập nhật — tải lại để xem bản mới nhất" | Tải lại, sửa trên bản mới |
| E-talent-framework-008 | Vượt giới hạn taxonomy | Tạo kỹ năng/nhóm/dòng khung vượt ngưỡng (500/50/30) | minor | FR-talent-framework-001, FR-talent-framework-006 | Hiện thông báo giới hạn cụ thể + gợi ý rà soát/ngừng dùng | Rà soát ngừng dùng bớt hoặc liên hệ admin |
| E-talent-framework-009 | File import lỗi | File sai mẫu, dòng thiếu trường, nhóm không tồn tại, trùng tên | minor | FR-talent-framework-015 | Báo kết quả "Dòng {n}: {lý do} — dòng này chưa được tạo" | Sửa file tải lại phần lỗi |
| E-talent-framework-010 | Chỉnh thang level đang được dùng | Sửa thang chung khi đã có kỹ năng/level tham chiếu | major | FR-talent-framework-019 | Hiện "Thang cấp độ đang được sử dụng — thay đổi cần qua quy trình riêng có duyệt" | Đề xuất quy trình migrate với owner |

## 7. Success Criteria

| ID | Outcome nghiệp vụ | Đo bằng | Mốc đạt |
|----|-------------------|---------|---------|
| SC-talent-framework-01 | Vị trí trọng yếu có khung được duyệt | Tỷ lệ vị trí trọng yếu (do Head of HR chọn) có khung "Đã công bố" | ≥80% sau 1 tháng rollout — target chính thức chờ OQ-2 PRD |
| SC-talent-framework-02 | Chuẩn đều qua duyệt có owner | Tỷ lệ kỹ năng/khung "Đã công bố" có bản ghi quyết định của owner | 100% |
| SC-talent-framework-03 | Downstream bám chuẩn | Tỷ lệ tham chiếu kỹ năng/khung ở "Đã công bố" từ module khác | 100% |
| SC-talent-framework-04 | Taxonomy không trùng vô thức | Tỷ lệ cảnh báo gần giống được xử lý có ý thức | ≥90% sau 1 tháng rollout |
| SC-talent-framework-05 | Hàng chờ duyệt không treo | Thời gian từ "gửi duyệt" đến quyết định đầu tiên | ≤5 ngày làm việc (đề xuất — OQ-6) |

## 8. Data Entities (tóm tắt — chi tiết ở erd.md)

- __Nhóm kỹ năng__ — danh mục tầng một của taxonomy thuộc tổ chức.
- __Kỹ năng__ — tên, mô tả, nhóm, trạng thái vòng đời, provenance
  (người tạo/duyệt, nguồn tạo tay/import/đề xuất).
- __Thang level chung__ — các mức cấp độ của tổ chức (đề xuất 5).
- __Mô tả level theo kỹ năng__ — hành vi mong đợi của từng kỹ năng ở từng
  mức.
- __Khung kỳ vọng vị trí__ — header khung theo vị trí, phiên bản, trạng
  thái duyệt, business owner.
- __Dòng yêu cầu trong khung__ — kỹ năng + level yêu cầu + cờ bắt buộc.
- __Đề xuất kỹ năng__ — đề xuất của quản lý chờ owner xử lý.
- __Yêu cầu/quyết định duyệt__ — mục chờ duyệt, quyết định, ghi chú, người
  duyệt, thời điểm (đa hình theo đối tượng).
- __Vị trí, Người dùng__ — tham chiếu từ `employee-profiles`/
  `org-governance`, không sở hữu ở đây.

Chi tiết quan hệ + thuộc tính ở `srs/talent-framework-erd.md`.

## 9. Flows (tóm tắt — chi tiết ở flows.md)

- __Flow 1:__ Tạo kỹ năng → kiểm trùng → gửi duyệt → owner công bố/yêu cầu
  chỉnh → "Đã công bố".
- __Flow 2:__ Soạn khung vị trí → kiểm owner + hợp lệ → gửi duyệt → công bố
  thay khung cũ.
- __Flow 3:__ Sửa mục đã công bố → bản chỉnh chờ duyệt → duyệt thì thay
  chuẩn; ngừng dùng → ẩn khỏi chọn, tham chiếu cũ giữ nguyên.
- __Flow 4:__ Quản lý gửi đề xuất kỹ năng → owner duyệt → kỹ năng vào
  luồng chờ-duyệt chuẩn.
- __Flow 5:__ Import file mẫu → kiểm tra theo dòng → kỹ năng hợp lệ vào
  "Bản nháp".

## 10. Screens (tóm tắt — chi tiết ở ascii-wireframe/)

- __skill-catalog__ — danh mục kỹ năng theo nhóm + lọc trạng thái/nguồn.
- __skill-editor__ — soạn kỹ năng + mô tả hành vi từng level + cảnh báo trùng.
- __position-framework__ — khung kỳ vọng của một vị trí (dòng kỹ năng,
  level, cờ bắt buộc).
- __approval-queue__ — hàng chờ duyệt của business owner.
- __approval-detail__ — xem nội dung chờ duyệt + công bố/yêu cầu chỉnh.
- __skill-proposal__ — quản lý gửi đề xuất kỹ năng.
- __taxonomy-import__ — tải file mẫu, xem kết quả theo dòng.
- __my-position-framework__ — nhân viên xem khung vị trí mình (chỉ đọc).

## 11. Constraints, Dependencies & Assumptions

__Constraints (ràng buộc áp đặt — có source/owner):__

| Ràng buộc | Source / Owner |
|-----------|----------------|
| Taxonomy/khung thuộc 1 tổ chức; truy cập theo organization/role/data-scope | PRD Mục 9 — Security owner |
| Business owner duyệt trước khi nội dung thành chuẩn | PRD Mục 7.32, R-13, OQ-11 — Head of HR |
| Audit cho action nhạy cảm (duyệt, công bố, ngừng dùng, gán owner) | PRD Mục 9 — Security owner |
| Không tự áp khung lên quyết định lương/thăng chức; AI không kết luận phẩm chất | PRD Mục 7.32 "Chưa làm", Mục 5, Mục 12 — Product owner |
| Chỉ dữ liệu synthetic trước khi privacy gate (OQ-3/OQ-6 PRD) đạt | PRD Mục 9 — Product + DPO |
| Tiếng Việt là ngôn ngữ ưu tiên | PRD Mục 9 — Product owner |

__Dependencies (deliverable do bên khác sở hữu):__

| Phụ thuộc | Owner | Blocks nếu chưa sẵn |
|-----------|-------|---------------------|
| Vị trí (position), phòng ban và quan hệ nhân viên–vị trí | `employee-profiles` / `org-governance` | FR-talent-framework-006/013 — không có chỗ gắn khung |
| Role/scope và vai trò business owner | `org-governance` | FR-talent-framework-004/007 — không ai duyệt được |
| Người dùng nội bộ (user) cho created_by/reviewer | `account-access` | Provenance và hàng chờ duyệt |
| Danh mục kỹ năng đã công bố làm chuẩn cho câu hỏi/bài/JD | `question-bank`, `assessment-authoring` (consumer) | Không chặn feature này; chặn downstream nếu taxonomy trống |

__Assumptions (tin là đúng — nêu hệ quả nếu sai):__

| Giả định | Invalidate {X} nếu sai |
|----------|------------------------|
| 1 tenant = 1 taxonomy chung; khác biệt theo phòng thể hiện qua khung vị trí | FR-talent-framework-001/006 phải thêm scope phân tán |
| Thang level chung 5 mức áp mọi kỹ năng | FR-talent-framework-019 và mô hình level phải thiết kế lại đa thang |
| Mỗi vị trí đúng 1 business owner | FR-talent-framework-007 phải xử lý nhiều owner/owner vắng |
| Tham chiếu cũ giữ nguyên khi ngừng dùng | FR-talent-framework-010 phải thêm migrate lịch sử |
| Giới hạn số (500 kỹ năng, 30/khung, 50 nhóm) là chuẩn first release | E-talent-framework-008 và NFR-talent-framework-004 đổi ngưỡng |

## 12. Open Questions

- [x] OQ-1: Ai duyệt taxonomy, level, weight và threshold kỹ năng —
  Resolved (đề xuất): Head of HR là business owner mặc định; có thể gán
  owner theo mảng kỹ năng/vị trí, admin thực hiện gán — chờ Head of HR
  xác nhận (PRD OQ-11, R-13).
- [x] OQ-2: Thang level chung mấy mức, có thang riêng theo nhóm không —
  Resolved (đề xuất): 5 mức chung toàn tổ chức, không thang riêng trong
  first release — chờ Head of HR xác nhận.
- [x] OQ-3: Ai tạo/sửa trực tiếp và ai gán owner — Resolved (đề xuất):
  HR/admin trực tiếp; quản lý qua đề xuất; admin/Head of HR gán owner —
  chờ Head of HR xác nhận.
- [x] OQ-4: Owner tự duyệt nội dung mình soạn — Resolved (đề xuất): được
  phép, audit ghi "tự duyệt" — chờ Head of HR xác nhận.
- [x] OQ-5: Định nghĩa "vị trí trọng yếu" và target — Resolved (đề xuất):
  danh sách do Head of HR chọn; target chờ OQ-1/OQ-2 PRD.
- [x] OQ-6: Ngưỡng giới hạn và SLA duyệt đề xuất — Resolved (đề xuất):
  giữ 500/30/50 và SLA 5 ngày làm việc — chờ Head of HR xác nhận.
- [x] OQ-7: Đổi thang level sau khi dùng rộng — Resolved (đề xuất): khóa
  khi đã có tham chiếu; đổi qua quy trình migrate có duyệt — chờ Head of
  HR xác nhận.
- [x] OQ-8: Phục hồi mục ngừng dùng — Resolved: qua "Chờ duyệt", không
  quay thẳng về đã công bố.
