---
phase: 4
title: "Google Drive OAuth + Picker + Live Link"
status: pending
effort: 3h
blockedBy: [1, 2]
blocks: [5, 7]
---

# Phase 4 — Google Drive OAuth + Picker + Live Link

## Context Links
- Auth helper: `src/lib/api/auth-helpers.ts` (pattern used by all API routes)
- `user_oauth_tokens` table: defined in Phase 1 migration
- `documents` table: defined in Phase 1 (`source_type = 'google_drive'`, `drive_file_id`, `drive_modified_time`)
- Text extraction: `src/lib/document-parsing/extract-text-from-buffer.ts` (Phase 2)
- Google GenAI already imported: `@google/genai` in package.json (not the same as Drive API — note distinction)

## Overview

Allow leaders to import documents directly from their Google Drive. Each import is a **live link** — the document's Drive `modifiedTime` is checked on page open; if newer than `documents.drive_modified_time`, a banner prompts the user to update (triggering Phase 5 diff flow).

OAuth tokens (access + refresh) are stored per user in `user_oauth_tokens`. Tokens are encrypted before storage. The Google Picker runs in the browser; only the selected file ID and metadata reach the server.

## Architecture

### OAuth Flow

```
User clicks "Connect Google Drive"
  → GET /api/auth/google-drive/authorize
    → redirect to Google OAuth2 consent screen
      → redirect back to /api/auth/google-drive/callback?code=...
        → exchange code for tokens
        → encrypt tokens
        → upsert user_oauth_tokens row
        → redirect to /dashboard/question-bank?driveConnected=1
```

### Import Flow

```
User clicks "Import from Google Drive"
  → component checks GET /api/auth/google-drive/status
    → if not connected: show "Connect Drive" button
    → if connected: load Google Picker script, open Picker
      → user selects file in Picker
        → Picker returns { id, name, mimeType, modifiedTime }
        → POST /api/documents/drive-import
            body: { driveFileId, fileName, mimeType }
          → API reads refresh token → get fresh access token
          → fetch file content from Drive API
          → extract text (Phase 2 module)
          → upload bytes to Supabase Storage (library/{teamId}/drive-{driveFileId}-{name})
          → insert documents row (source_type='google_drive', drive_file_id, drive_modified_time)
          → return { documentId }
```

### Freshness Check (page open)

```
QuestionBankAiPipelineTab mounts (or DocumentLibraryPanel mounts)
  → GET /api/documents?teamId=...  (includes drive_modified_time)
  → for each doc where source_type='google_drive':
      GET /api/documents/[id]/drive-freshness
        → fetch Drive file metadata (modifiedTime only — no content download)
        → compare with documents.drive_modified_time
        → if newer: return { stale: true, newModifiedTime }
  → UI shows "New version available" banner on stale cards
  → User clicks "Update" → triggers Phase 5 diff flow
```

### Security

- OAuth `state` parameter: random nonce stored in server-side session cookie (CSRF protection)
- Tokens encrypted at rest using `pgcrypto` `pgp_sym_encrypt` (key from env `OAUTH_ENCRYPTION_KEY`) before INSERT
- Tokens decrypted with `pgp_sym_decrypt` at read time in API route (never returned to client)
- Access token refreshed automatically if expired (Drive API returns 401)
- Scopes requested: `https://www.googleapis.com/auth/drive.readonly` (minimum required)

## Requirements

**Functional**
- OAuth2 PKCE or server-side code flow (server-side preferred — tokens never touch browser)
- Google Picker v2 loaded via script tag (Google API JS client)
- Picker restricted to file types: PDF, DOCX, TXT (MIME type filter in Picker config)
- On import: store Drive file bytes in Supabase Storage (same bucket as library)
- `drive_modified_time` stored as ISO8601 UTC on `documents` row
- Freshness check: one Drive API call per Drive-sourced document (metadata only, not content)
- "Disconnect Drive" option: deletes `user_oauth_tokens` row for provider='google'

**Non-functional**
- Refresh token never logged or returned in API responses
- All Drive API calls server-side only
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_ENCRYPTION_KEY` in env vars (not hardcoded)
- Picker API key (public) acceptable in client-side env (`NEXT_PUBLIC_GOOGLE_PICKER_API_KEY`)

## Dependencies

No new npm packages needed — Drive API accessed via `fetch` (REST). Google Picker loaded from Google CDN at runtime.

Required env vars (add to `.env.local` and deployment secrets):
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OAUTH_ENCRYPTION_KEY=        # 32-byte random string for pgcrypto
NEXT_PUBLIC_GOOGLE_PICKER_API_KEY=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=  # public; needed by Picker JS
```

## Related Code Files

**Create**
- `src/app/api/auth/google-drive/authorize/route.ts` — redirect to Google OAuth
- `src/app/api/auth/google-drive/callback/route.ts` — exchange code, store tokens
- `src/app/api/auth/google-drive/status/route.ts` — GET: is user connected?
- `src/app/api/auth/google-drive/disconnect/route.ts` — DELETE token row
- `src/app/api/documents/drive-import/route.ts` — POST: import selected file
- `src/app/api/documents/[id]/drive-freshness/route.ts` — GET: check modifiedTime
- `src/lib/google-drive/drive-api-client.ts` — fetch wrapper for Drive REST API
- `src/lib/google-drive/oauth-token-manager.ts` — encrypt/decrypt/refresh token logic
- `src/components/question-bank/google-drive-picker.tsx` — Picker UI component

**Modify**
- `src/components/question-bank/document-library-panel.tsx` (Phase 3) — add "Import from Drive" button
- `src/components/question-bank/document-library-card.tsx` (Phase 3) — show Drive icon for `source_type='google_drive'`; show freshness banner

## Implementation Steps

1. Register Google Cloud OAuth2 credentials (outside code — prereq for testing):
   - Authorized redirect URI: `{APP_URL}/api/auth/google-drive/callback`
   - Enable Drive API in Google Cloud Console

2. Create `src/lib/google-drive/oauth-token-manager.ts`:
   - `encryptToken(plain: string): string` — `pgp_sym_encrypt` via supabase RPC or manual `pgcrypto` SQL
   - `decryptToken(cipher: string): string`
   - `getValidAccessToken(userId: string, supabase): Promise<string>` — decrypt refresh token → call Google token endpoint if access token expired → update row → return access token
   - ≤ 120 lines

3. Create `src/lib/google-drive/drive-api-client.ts`:
   - `getFileMetadata(fileId: string, accessToken: string): Promise<DriveFileMeta>`
   - `downloadFileBytes(fileId: string, mimeType: string, accessToken: string): Promise<Uint8Array>` — handles export for Google Docs formats if needed
   - ≤ 100 lines

4. Create `src/app/api/auth/google-drive/authorize/route.ts`:
   - Generate random `state` nonce → store in signed cookie
   - Build OAuth URL with scope, redirect_uri, state, access_type=offline, prompt=consent
   - Return 302 redirect

5. Create `src/app/api/auth/google-drive/callback/route.ts`:
   - Validate `state` cookie match (CSRF)
   - Exchange `code` for tokens via POST to `https://oauth2.googleapis.com/token`
   - Encrypt access_token and refresh_token
   - Upsert `user_oauth_tokens` (ON CONFLICT (user_id, provider) DO UPDATE)
   - Redirect to `/dashboard/question-bank?driveConnected=1`

6. Create `src/app/api/auth/google-drive/status/route.ts`:
   - Query `user_oauth_tokens` WHERE user_id = current user AND provider = 'google'
   - Return `{ connected: boolean }`

7. Create `src/app/api/documents/drive-import/route.ts`:
   - Auth check (leader/admin)
   - Get valid access token via `getValidAccessToken`
   - `getFileMetadata` → confirm file exists, get name + mimeType + modifiedTime
   - Map mimeType to file_type: `application/pdf→pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document→docx`, `text/plain→txt`
   - `downloadFileBytes` → convert to Buffer
   - `extractTextFromBuffer` (Phase 2) → get text
   - Upload bytes to Supabase Storage
   - Insert `documents` row (source_type='google_drive', drive_file_id, drive_modified_time)
   - Return `{ documentId }`

8. Create `src/app/api/documents/[id]/drive-freshness/route.ts`:
   - Fetch `documents` row → confirm source_type='google_drive'
   - Get valid access token
   - `getFileMetadata` → compare modifiedTime with `documents.drive_modified_time`
   - Return `{ stale: boolean; newModifiedTime?: string }`

9. Create `src/components/question-bank/google-drive-picker.tsx`:
   - Load `https://apis.google.com/js/api.js` on mount (dynamic script tag)
   - `gapi.load('picker', callback)` → open Picker with MIME filter
   - On pick: call `POST /api/documents/drive-import` with selected file metadata
   - Show loading spinner during import
   - On success: call `onImported(documentId)` callback
   - ≤ 150 lines

## Todo List

- [ ] Register Google Cloud OAuth2 app + enable Drive API (manual prereq)
- [ ] Add env vars to `.env.local` template
- [ ] Create `oauth-token-manager.ts`
- [ ] Create `drive-api-client.ts`
- [ ] Create `authorize/route.ts`
- [ ] Create `callback/route.ts` (with CSRF state validation)
- [ ] Create `status/route.ts`
- [ ] Create `disconnect/route.ts`
- [ ] Create `drive-import/route.ts`
- [ ] Create `drive-freshness/route.ts`
- [ ] Create `google-drive-picker.tsx`
- [ ] Wire "Import from Drive" button into `document-library-panel.tsx`
- [ ] Wire freshness banner into `document-library-card.tsx`
- [ ] Test full OAuth round-trip (authorize → callback → token stored)
- [ ] Test Picker → import → document appears in library
- [ ] Test freshness detection with a Drive file edited after import

## Success Criteria

- User connects Google Drive → `user_oauth_tokens` row created (encrypted)
- Picker opens, user selects PDF → file downloaded, stored in Supabase Storage, appears in library
- Disconnecting Drive deletes token row, hides Drive features
- If Drive file modified after import → library card shows "New version available" banner
- Refresh token encrypted in DB (confirm by checking raw column value is not plaintext)
- No tokens in any API response body or server logs

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `pgcrypto` not enabled on Supabase project | Medium | High | Enable via `CREATE EXTENSION IF NOT EXISTS pgcrypto;` in migration; alternatively use app-level AES encryption |
| Google Picker JS fails to load (CSP restrictions) | Medium | Medium | Add `apis.google.com` to `Content-Security-Policy` in `next.config.ts` |
| Drive API rate limit (100 req/100s per user) | Low | Low | Freshness check is one call per doc per page load — unlikely to hit limit |
| Access token expiry mid-session | Medium | Low | `getValidAccessToken` always checks expiry before use; refresh if < 5 min left |
| Large Drive files (> 50 MB) exceed upload limit | Low | Medium | Check file size via Drive metadata before downloading; return 413 with user message |

## Unresolved Questions

- Confirm `pgcrypto` is available on current Supabase tier (required for `pgp_sym_encrypt`).
- Confirm `OAUTH_ENCRYPTION_KEY` management: env var per deployment or Supabase Vault secret?
- Should the Picker allow Google Docs/Sheets selection (with export to PDF/DOCX)? Recommend NO for MVP — only natively supported file types.
