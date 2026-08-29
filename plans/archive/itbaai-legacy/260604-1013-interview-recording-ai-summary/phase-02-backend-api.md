# Phase 2: Backend API Development

## Overview
- **Priority**: High
- **Status**: Todo
- **Description**: Implement secure API routes under `src/app/api/recruitment/interview-room/sessions/[id]/` to handle audio uploading, Whisper transcription, and GPT-4o summarization.

## Requirements
1. **Audio Upload Endpoint (`POST /api/recruitment/interview-room/sessions/[id]/recording`)**:
   - Authenticate the request (roles: hr, recruiter, interviewer, admin, super_admin).
   - Read multipart form data containing an audio blob.
   - Upload the blob to Supabase storage bucket `interview-recordings`.
   - Update `interview_sessions.recording_url` with the storage path or public/signed URL.
2. **AI Analysis Endpoint (`POST /api/recruitment/interview-room/sessions/[id]/analyze`)**:
   - Authenticate the request.
   - Retrieve the audio file from Supabase storage using the `recording_url` from `interview_sessions`.
   - Send the audio to OpenAI Whisper (`openai.audio.transcriptions.create`) for transcription.
   - Send the transcript to OpenAI GPT-4o to generate:
     - Interview summary (Vietnamese).
     - Candidate key strengths and weaknesses.
     - Candidate overall suitability match with the job description.
   - Update `interview_sessions.transcript` and `interview_sessions.ai_summary`.
   - Log token usage in the `ai_usage` table.
3. **Session Update Endpoint (`PATCH /api/recruitment/interview-room/sessions/[id]`)**:
   - Allow manually updating `ai_summary`, `recruiter_note`, `transcript` etc.

## Related Code Files
- Create `src/app/api/recruitment/interview-room/sessions/[id]/recording/route.ts`
- Create `src/app/api/recruitment/interview-room/sessions/[id]/analyze/route.ts`
- Update/extend `src/app/api/recruitment/interview-room/sessions/[id]/route.ts` to support `PATCH` for editing the transcript/summary/notes.
