# Phase 1: Database & Storage Migration

## Overview
- **Priority**: High
- **Status**: Todo
- **Description**: Set up the database schema and storage policies required to persist recording URLs, transcripts, AI summaries, and the raw audio blobs in Supabase Storage.

## Requirements
- Columns `recording_url`, `transcript`, and `ai_summary` added to `interview_sessions`.
- A storage bucket named `interview-recordings` created in Supabase with RLS policies restricting read/write access to recruiters, interviewers, and admins.

## Implementation Steps
1. Create `supabase/migrations/20260604000000_interview_recording.sql`.
2. Apply the migration via Supabase tool or manually if needed.
3. Verify database schema modifications using `list_tables` or a query.
