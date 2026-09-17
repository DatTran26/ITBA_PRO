---
type: srs-erd
feature: candidate-matching
updated: 2026-09-14
---

# candidate-matching — Entity Relationship Diagram

> Scope: đối chiếu application với vị trí — lần chấm điểm (run) kèm
> breakdown và evidence, ngưỡng đề xuất có lịch sử, quyết định của con
> người và đợt batch. `APPLICATION`, `RECRUITMENT_POSITION`,
> `CV_DOCUMENT`, `USER` là tham chiếu tối thiểu sang feature khác
> (`candidate-pipeline`, `recruitment-planning`, `cv-intake`,
> `org-governance`).

## Diagram

```mermaid
erDiagram
    APPLICATION ||--o{ MATCHING_RUN : "được chấm điểm"
    RECRUITMENT_POSITION ||--o{ MATCHING_RUN : "đối chiếu theo"
    CV_DOCUMENT ||--o{ MATCHING_RUN : "làm nguồn facts"
    USER ||--o{ MATCHING_RUN : "yêu cầu tính"
    MATCH_BATCH ||--o{ MATCHING_RUN : "chứa lần tính"
    RECRUITMENT_POSITION ||--o{ MATCH_BATCH : "chạy theo"
    USER ||--o{ MATCH_BATCH : "khởi chạy"
    MATCHING_RUN ||--o{ SCORE_COMPONENT : "phân rã thành"
    SCORE_COMPONENT ||--o{ SCORE_EVIDENCE : "giải thích bằng"
    MATCH_THRESHOLD ||--o{ MATCHING_RUN : "áp ngưỡng hiệu lực"
    RECRUITMENT_POSITION |o--o{ MATCH_THRESHOLD : "ghi đè theo vị trí"
    USER ||--o{ MATCH_THRESHOLD : "đặt"
    MATCHING_RUN ||--o| MATCH_DECISION : "nhận quyết định"
    USER ||--o{ MATCH_DECISION : "ra quyết định"

    MATCHING_RUN {
        string run_id PK "mã lần chấm điểm"
        string application_id FK "application được đối chiếu"
        string position_id FK "vị trí làm chuẩn đối chiếu"
        string cv_document_id FK "CV đã xác nhận làm nguồn facts"
        string threshold_id FK "ngưỡng và trọng số áp tại thời điểm tính"
        string batch_id FK "đợt batch chứa run này nếu có"
        int total_score "tổng điểm thang 0-100"
        string suggestion_label "nhãn đề xuất: đạt đề xuất hoặc chưa đạt đề xuất"
        string data_flag "cờ dữ liệu: đủ, không đủ dữ liệu, yêu cầu vị trí chưa chuẩn"
        string status "đã-tính, chờ-review, đã-quyết-định, cũ, lỗi"
        string trigger_type "nguồn chạy: tự động sau xác nhận CV, thủ công, batch"
        string model_version "phiên bản model tại thời điểm tính"
        string criteria_version "phiên bản tiêu chí tại thời điểm tính"
        string requested_by_user_id FK "người yêu cầu, rỗng khi tự chạy"
        string error_message "lý do khi run lỗi"
        datetime computed_at "thời điểm tính xong"
        datetime created_at "thời điểm tạo run"
    }
    SCORE_COMPONENT {
        string component_id PK "mã điểm thành phần"
        string run_id FK "lần chấm điểm chứa thành phần"
        string component "thành phần: kỹ năng, kinh nghiệm, domain"
        int score "điểm thành phần thang 0-100"
        int weight "trọng số phần trăm tại thời điểm tính"
        boolean missing_data "cờ thành phần thiếu dữ liệu đối chiếu"
    }
    SCORE_EVIDENCE {
        string evidence_id PK "mục evidence"
        string component_id FK "thành phần được giải thích"
        string cv_field_ref "field CV đã xác nhận được trỏ"
        string requirement_ref "yêu cầu vị trí tương ứng"
        string match_note "ghi chú vì sao khớp hoặc không khớp"
    }
    MATCH_THRESHOLD {
        string threshold_id PK "mã lần đặt ngưỡng"
        string organization_id FK "tổ chức sở hữu ngưỡng"
        string position_id FK "vị trí ghi đè, rỗng khi là mặc định tổ chức"
        int threshold_value "giá trị ngưỡng đề xuất thang 0-100"
        int weight_skill "trọng số phần trăm thành phần kỹ năng"
        int weight_experience "trọng số phần trăm thành phần kinh nghiệm"
        int weight_domain "trọng số phần trăm thành phần domain"
        string reason "lý do thay đổi, bắt buộc"
        string created_by_user_id FK "vai trò được cấp đặt ngưỡng"
        datetime effective_from "hiệu lực từ thời điểm"
        datetime created_at "thời điểm ghi"
    }
    MATCH_DECISION {
        string decision_id PK "mã quyết định"
        string run_id FK "lần chấm điểm được quyết định"
        string decision "chấp nhận đề xuất, override đi tiếp, override dừng"
        boolean is_override "quyết định khác đề xuất của hệ thống"
        string suggestion_snapshot "nhãn đề xuất và điểm tại thời điểm quyết"
        string reason "lý do, bắt buộc khi override"
        string decided_by_user_id FK "người ra quyết định"
        datetime decided_at "thời điểm quyết định"
    }
    MATCH_BATCH {
        string batch_id PK "mã đợt tính điểm hàng loạt"
        string position_id FK "vị trí chạy batch"
        string status "đang chạy, hoàn tất, lỗi một phần"
        int total_count "số hồ sơ đủ điều kiện trong đợt"
        int scored_count "số hồ sơ đã tính xong"
        int skipped_count "số hồ sơ bỏ qua vì đã có quyết định"
        int insufficient_count "số run gắn cờ không đủ dữ liệu"
        string created_by_user_id FK "người khởi chạy"
        datetime created_at "thời điểm tạo đợt"
        datetime finished_at "thời điểm xử lý xong"
    }
    APPLICATION {
        string application_id PK "mã application, thuộc candidate-pipeline"
        string stage "stage hiện tại của application"
    }
    RECRUITMENT_POSITION {
        string position_id PK "mã vị trí tuyển, thuộc recruitment-planning"
        string title "tên vị trí tuyển dụng"
    }
    CV_DOCUMENT {
        string document_id PK "mã tài liệu CV, thuộc cv-intake"
        string title "tên file CV đã xác nhận"
    }
    USER {
        string user_id PK "mã người dùng, thuộc org-governance"
        string display_name "tên hiển thị"
    }
```

## Entity Reference

| Entity | Purpose | Key attributes |
|--------|---------|----------------|
| MATCHING_RUN | Một lần tính score trên application — điểm, nhãn đề xuất, trạng thái, cờ dữ liệu và provenance phiên bản | total_score, suggestion_label, data_flag, status, model_version, criteria_version, threshold_id |
| SCORE_COMPONENT | Breakdown của một run theo 3 thành phần kỹ năng/kinh nghiệm/domain | component, score, weight, missing_data |
| SCORE_EVIDENCE | Mục giải thích của một thành phần — trỏ field CV khớp yêu cầu vị trí | cv_field_ref, requirement_ref, match_note |
| MATCH_THRESHOLD | Một lần đặt ngưỡng + trọng số — mặc định tổ chức hoặc ghi đè vị trí; chuỗi bản ghi là lịch sử ngưỡng | threshold_value, weight_*, position_id, reason, effective_from |
| MATCH_DECISION | Quyết định của con người trên một run — bất biến, tối đa 1 trên run | decision, is_override, suggestion_snapshot, reason, decided_by_user_id |
| MATCH_BATCH | Một đợt tính điểm theo vị trí — chỉ tính, không quyết định | position_id, status, total_count, scored_count, skipped_count |
| APPLICATION | Hồ sơ ứng tuyển được đối chiếu — tham chiếu tối thiểu từ `candidate-pipeline` | application_id, stage |
| RECRUITMENT_POSITION | Vị trí làm chuẩn đối chiếu (JD + yêu cầu) — tham chiếu từ `recruitment-planning` | position_id, title |
| CV_DOCUMENT | CV đã xác nhận làm nguồn facts — tham chiếu từ `cv-intake` | document_id, title |
| USER | Người dùng nội bộ — tham chiếu từ `org-governance` | user_id, display_name |

## Notes & Assumptions

- `MATCHING_RUN.status` là vòng đời run (đã-tính → chờ-review →
  đã-quyết-định; nhánh "cũ" khi nguồn đổi, "lỗi" khi job fail).
  `suggestion_label` chỉ là gợi ý — không phải trạng thái quyết định và
  không gây hành động nào trên `APPLICATION` (BR-candidate-matching-001).
- `MATCH_THRESHOLD` lưu mỗi lần đặt thành một bản ghi mới (append-only):
  ngưỡng hiệu lực là bản ghi mới nhất khớp scope (vị trí riêng trước, rồi
  mặc định tổ chức). `MATCHING_RUN.threshold_id` chốt ngưỡng tại thời
  điểm tính nên run cũ giữ nhãn theo ngưỡng cũ — đây là cách "lịch sử
  ngưỡng" được truy vết.
- `weight_skill/experience/domain` trên `MATCH_THRESHOLD` và `weight`
  trên `SCORE_COMPONENT` cùng phục vụ trọng số cấu hình được (đề xuất
  OQ-2 của spec): run chụp trọng số tại thời điểm tính để giải thích
  chênh điểm giữa các đợt.
- `SCORE_EVIDENCE.cv_field_ref`/`requirement_ref` là tham chiếu logic
  tới field đã xác nhận của `cv-intake` và yêu cầu của
  `recruitment-planning`/`talent-framework` — entity đầy đủ của các nguồn
  đó không nằm trong ERD này.
- `MATCH_DECISION` tối đa 1 trên run (quan hệ `||--o|`); quyết định là
  bất biến — muốn đổi quyết định phải tạo run mới (BR-candidate-
  matching-005). `suggestion_snapshot` giữ nhãn + điểm tại thời điểm
  quyết để đo tỷ lệ đảo đề xuất (M-GR-02).
- `APPLICATION`, `RECRUITMENT_POSITION`, `CV_DOCUMENT`, `USER` chỉ khai
  tối thiểu phục vụ quan hệ — entity đầy đủ thuộc ERD của
  `candidate-pipeline`, `recruitment-planning`, `cv-intake`,
  `org-governance`.
- Retention: run, quyết định và lịch sử ngưỡng giữ theo retention hồ sơ
  tuyển dụng chung — chờ DPO (PRD OQ-6); ERD chưa mô hình thuộc tính
  retention.
