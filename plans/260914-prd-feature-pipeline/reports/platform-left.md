# Report: platform-left

- **Features:** `platform-configuration` (PRD 7.28, Should),
  `operational-email` (PRD 7.35, Should), `external-integrations`
  (PRD 7.27, Should — trì hoãn chưa chọn provider)
- **Files written:**
  - `docs/features/platform-configuration/srs/platform-configuration-spec.md` (mới)
  - `docs/features/platform-configuration/srs/platform-configuration-erd.md` (mới)
  - `docs/features/operational-email/operational-email-urd.md` (mới)
  - `docs/features/operational-email/srs/operational-email-spec.md` (mới)
  - `docs/features/operational-email/srs/operational-email-erd.md` (mới)
  - `docs/features/external-integrations/brainstorms/provider-agnostic-external-integrations.md` (mới)
  - `docs/features/external-integrations/external-integrations-urd.md` (mới)
  - `docs/features/external-integrations/srs/external-integrations-spec.md` (mới)
  - `docs/features/external-integrations/srs/external-integrations-erd.md` (mới)
  - Brainstorm/URD đã có sẵn của platform-configuration và brainstorm
    operational-email — chỉ dùng làm nguồn, không sửa.
- **OQ resolved:** 30 `[x]` trong file mới (operational-email URD 10 + spec 10;
  external-integrations brainstorm 8 + URD 10 + spec 10 — cùng bộ lặp theo
  pipeline). Đề xuất chờ owner: phần lớn (Product / Technical+Operations /
  DPO-legal / owner từng module).
- **OQ hold/OOS:** external-integrations OQ-1 `[~]` Out of scope v1 — chọn
  provider thuộc roadmap (project profile 2026-09-13). P2 defer: đính kèm
  file email, lên lịch gửi, multi-provider routing, auto-merge reconcile.
- **Mermaid verify:** cả 3 ERD `PASS` check-erd.mjs (platform-config 6E/8R;
  operational-email 9E/13R; external-integrations 10E/13R). mermaid-verify:
  toolchain thiếu (mmdc cần Chrome for Testing — không có trên máy) → tự
  soi thủ công; 5 cảnh báo "NGHĨA"/file là heuristic tên FK
  (`actor_id`, `updated_by`, `reviewed_by`, `resolved_by`, `decided_by`,
  `credential_setting_id`...) không khớp pattern — FK tồn tại thật trong
  entity, giữ nguyên convention.
- **🔶 Quyết định thay user đáng chú ý:**
  - platform-configuration: credential/secret write-only + masked + loại
    khỏi history/export; system-scope do platform operator ngoài role
    catalog tenant; giới hạn đề xuất 200 catalog keys, test timeout 10s,
    20 test gần nhất/setting, revision ≥12 tháng — chờ DPO/Ops.
  - operational-email: chỉ mẫu "Đã duyệt" được gửi (human-in-the-loop);
    idempotent = batch+địa chỉ; retry 5p/30p/2h → dead-letter; bulk 200
    người/batch + eligibility gate + preview bắt buộc; địa chỉ ngoài hồ
    sơ chỉ gửi đơn kèm xác nhận + audit; snapshot nội dung tối thiểu chờ
    DPO (OQ-6 PRD); SMTP nằm trong catalog platform-configuration làm
    nguồn duy nhất.
  - external-integrations: toàn bộ provider-agnostic (đang trì hoãn);
    webhook inbound KHÔNG ghi thẳng nghiệp vụ — qua hàng chờ + allowlist
    + chữ ký (bám OQ-5 PRD); reconcile v1 thủ công không auto-merge,
    quyết định append-only; credential trong catalog platform-config;
    source-of-truth khai báo per contract, module nghiệp vụ là truth cho
    dữ liệu nó sở hữu.
- **Vấn đề/blocker (cho Max, không phải file của tôi):**
  - `external-integrations` phụ thuộc quyết định chọn provider trên
    roadmap — feature giữ trạng thái "chờ provider", chỉ cấu hình nháp
    được; khi roadmap mở cần owner chốt provider + loại contract ưu tiên.
  - 3 OQ PRD đang mở ảnh hưởng chéo: OQ-5 (deployment authority — webhook
    inbound), OQ-6 (retention/consent — email snapshot + sync payload),
    OQ-10 (SLA/retry chuẩn — retry 5p/30p/2h của tôi là đề xuất chờ chốt).
