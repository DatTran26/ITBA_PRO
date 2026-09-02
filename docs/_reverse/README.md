# Bộ SRS tái lập từ source

Trạng thái: **reverse draft**, cập nhật 2026-09-02. Bộ tài liệu này mô tả hành
vi có bằng chứng trong `Frontend` và `Backend` tại repository root. Đây không
phải business baseline đã phê duyệt.

ERD trong từng cluster khớp 46 bảng `public` trên live/staging và
`Backend/supabase/migrations`. Inventory và lệch còn lại (lock assessment chưa
apply, `cv-processor` chưa deploy) nằm tại [`Backend/README.md`](../../Backend/README.md).

## Phạm vi

| Feature cluster | Reverse spec | Trạng thái |
| --- | --- | --- |
| Assessment và grading | [Mở](assessment-and-grading/reverse-spec.md) | Draft từ code |
| Recruitment và interview | [Mở](recruitment-and-interviews/reverse-spec.md) | Draft từ code |
| Talent và CRM | [Mở](talent-and-crm/reverse-spec.md) | Draft từ code |
| Knowledge và question bank | [Mở](knowledge-and-question-bank/reverse-spec.md) | Draft từ code |
| Platform, communication và governance | [Mở](platform-communications-and-governance/reverse-spec.md) | Draft từ code |

## Quy ước bằng chứng

- ✅: xác minh trực tiếp từ source, migration hoặc build.
- 🟡: suy luận business intent; cần owner xác nhận qua OQ.
- Đường dẫn `Frontend/...:line` và `Backend/...:line` tính từ repository root.
- Không suy ra production readiness từ việc route hoặc bảng tồn tại.
- Project chưa có test runner; build pass nhưng lint còn baseline errors được
  ghi tại [gaps chung](platform-communications-and-governance/gaps.md).

## Quan hệ với tài liệu chính thức

Tài liệu canonical cho con người nằm tại [docs/downtown](../downtown/README.md).
`doc-drift --strict` yêu cầu baseline đã phê duyệt trong `docs/features`; thư
mục đó hiện chưa tồn tại. Cần review reverse draft, formalize bằng workflow SRS,
rồi mới chạy doc-drift.
