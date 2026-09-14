---
type: documentation-index
status: active
updated: 2026-09-02
links:
  - prd.md
  - architecture.md
  - development.md
  - operations.md
  - security.md
  - ../_reverse/README.md
  - ../../Backend/README.md
---

# Downtown — bộ tài liệu chuẩn của Town Hown

Thư mục này là nguồn tài liệu hiện hành cho sản phẩm Town Hown và source ứng
dụng tại `Frontend`/`Backend`. Người đọc chỉ cần bắt đầu từ đây;
source, manifest, migrations và workflow vẫn là bằng chứng cuối cùng cho hành vi
kỹ thuật.

## Bộ tài liệu tối thiểu

| Tài liệu | Khi cần đọc | Nội dung sở hữu |
| --- | --- | --- |
| [PRD sản phẩm](prd.md) | Xác định tầm nhìn, người dùng, scope và ưu tiên | Product intent, Feature Map, metrics, risks |
| [Kiến trúc](architecture.md) | Tìm boundary, owner và data flow | WHY/WHERE của hệ thống và module |
| [Phát triển](development.md) | Thay đổi/review source | Setup, quy tắc code, validation và GitFlow |
| [Vận hành](operations.md) | Build, release, deploy hoặc xử lý incident | Runtime contract, migration, rollback, runbook |
| [Bảo mật](security.md) | Xử lý quyền, dữ liệu nhạy cảm, AI hoặc sự cố | Trust boundaries và security policy |
| [SRS tái lập từ code](../_reverse/README.md) | Truy nguyên requirement về source/schema | Reverse drafts, flows, states, ERD, use cases, gaps và evidence |
| [Schema Backend](../../Backend/README.md) | Đối chiếu bảng/bucket git với live/staging | Inventory object và lệch còn lại (không phải WHY sản phẩm) |

## Authority

- `prd.md` sở hữu sản phẩm mục tiêu; feature chỉ được coi đã triển khai khi có
  source/migration và validation tương ứng.
- `architecture.md` sở hữu boundary và rationale; không sở hữu inventory route,
  table hoặc dependency version.
- `development.md`, `operations.md`, `security.md` sở hữu workflow và constraint
  bền vững; executable owner được liên kết trực tiếp.
- [`../../AGENTS.md`](../../AGENTS.md) vẫn là authority bắt buộc cho GitFlow và
  agent behavior.
- `plans/archive/itbaai-legacy`, raw requirements và Harness docs là hồ sơ
  lịch sử/tham khảo, không cạnh tranh với bộ này.
- `docs/_reverse` là evidence draft sinh từ code, chưa phải baseline business.
  Chỉ sau review/formalization mới đưa feature vào `docs/features` và dùng
  `doc-drift --strict`.
- [`../../Backend/README.md`](../../Backend/README.md) sở hữu inventory bảng,
  bucket và lệch git ↔ live/staging; downtown không đếm table.

## Cách duy trì

1. Code, schema, manifest và CI sở hữu WHAT/HOW.
2. Docs chỉ giữ WHY/WHERE, business rules, thuật ngữ và constraint.
3. Không duy trì thủ công số file, route, table, LOC, dependency version hoặc
   tỷ lệ hoàn thành.
4. Không ghi secret hoặc giá trị `.env`.
5. Khi contract thay đổi, sửa đúng một tài liệu owner và cập nhật link tại đây
   chỉ khi tuyến đọc thay đổi.
6. Không viết lại plan/report lịch sử để làm nó giống source hiện tại.

## Tài liệu nguồn đã hợp nhất

Bộ này được tổng hợp từ product contract, raw requirements, tài liệu ứng dụng,
source map, kiến trúc, security và runbook đã có. Những tài liệu cũ được giữ làm
archive để truy nguyên; mọi cập nhật mới nên vào `docs/downtown`.
