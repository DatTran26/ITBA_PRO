# Evidence matrix — Knowledge và question bank

| Requirement | BFF | Backend | Confidence |
| --- | --- | --- | --- |
| FR-KB-01 | question-bank routes | question_bank + RLS | High |
| FR-KB-02 | source/job/topic routes | document sources/jobs | High |
| FR-KB-03 | merge/split routes | document_topics | High |
| FR-KB-04 | source references | question/source schema | High |
| FR-KB-05 | documents routes | document/topic RLS | High |

Negative evidence: không có test suite; business quality threshold không được
suy ra từ prompt hoặc UI label.
