# Reverse SRS — Knowledge và question bank

## Scope

✅ Cluster quản lý question bank, tài liệu/document source, extraction job, topic,
topic merge/split, sinh câu hỏi từ tài liệu và pull/swap/import câu hỏi vào bài
đánh giá. Edge Functions hỗ trợ extract/generate; BFF điều phối access và state.

## Actors

- Recruiter/content editor: upload/import, duyệt topic/question, kéo câu vào test.
- AI provider/Edge Function: extract text/topic, generate candidate questions.
- Supabase Storage/DB: giữ raw artifact, provenance, job và RLS.

## Functional requirements

- **FR-KB-01 ✅** Question bank có list/create/detail/update/delete và bulk import
  (`Frontend/src/app/api/question-bank/route.ts:7`,
  `Frontend/src/app/api/question-bank/[id]/route.ts:7`,
  `Frontend/src/app/api/question-bank/bulk-import/route.ts:15`).
- **FR-KB-02 ✅** Source có upload URL, extraction job, topics, approval và
  question generation boundaries (`Frontend/src/app/api/document-sources/upload-url/route.ts:7`,
  `Frontend/src/app/api/document-sources/[id]/extract-topics/route.ts:8`,
  `Frontend/src/app/api/document-sources/[id]/approve/route.ts:8`,
  `Frontend/src/app/api/document-sources/[id]/generate-questions/route.ts:8`).
- **FR-KB-03 ✅** Topics hỗ trợ merge/split
  (`Frontend/src/app/api/document-sources/[id]/topics/merge/route.ts:8`,
  `Frontend/src/app/api/document-sources/[id]/topics/split/route.ts:8`).
- **FR-KB-04 ✅** Question bank giữ source/provenance qua schema riêng
  (`Backend/supabase/migrations/20260513000000_question_bank_foundation.sql:7`,
  `:59`).
- **FR-KB-05 ✅** Document topics/documents đều bật RLS
  (`Backend/supabase/migrations/20260514000000_document_topics.sql:33`,
  `Backend/supabase/migrations/20260515000000_document_library.sql:26`).

## Business rules

1. Generated question là draft không đáng tin cho đến khi human review.
2. Raw source, extracted text, topic và generated question phải giữ provenance.
3. Merge/split topic không được làm mất trace đến document/source.
4. File/URL input phải được validate type, size, access và timeout ở boundary.

## Open questions

- **OQ-KB-01:** Ai có quyền approve source/topic/question?
- **OQ-KB-02:** Retention và deletion cascade của raw document là gì?
- **OQ-KB-03:** Duplicate detection và versioning của question hoạt động ra sao?
- **OQ-KB-04:** Provider fallback/cost quota/quality threshold được duyệt chưa?
