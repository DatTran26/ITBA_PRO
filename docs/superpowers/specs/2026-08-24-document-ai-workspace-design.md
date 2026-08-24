# Document AI Workspace UI/UX Design

**Status:** Revised visual direction approved in conversation on 2026-08-24

## Context

DOWN TOWN is an AI-assisted HRMS. The current frontend exposes a single OCR scanner page that uploads one image, waits for a synchronous response, and displays raw text. It does not yet provide a runnable frontend toolchain, an application shell, a multi-file working queue, a review boundary between AI output and human-confirmed content, or a visual language suitable for daily HR operations.

This design establishes the frontend foundation for the broader product while implementing only the Document AI/OCR vertical slice. Thanh's contribution remains UI/UX-focused: the existing OCR API is consumed as-is, and no backend subsystem is added.

## Primary User and Outcome

The primary persona is **Thanh — HR Operations**, presented as a clearly labeled demo user. This user repeatedly uploads employee documents, monitors processing, compares an original image with OCR output, corrects the text, and explicitly confirms the reviewed result.

The successful experience should feel like an operational verification desk rather than an AI showcase. AI produces a draft; the HR user owns the final confirmation.

## Goals

- Establish an application shell that communicates the scope of the full DOWN TOWN HRMS.
- Deliver a production-minded, responsive Document AI workspace against the existing `POST /api/ocr/scan` endpoint.
- Support a session-only queue of up to five image jobs processed sequentially.
- Preserve a visible distinction between original OCR output and HR-edited content.
- Provide explicit loading, review, confirmation, retry, and error states without implying unsupported backend capabilities.
- Create a reusable visual foundation with accessible tokens, typography, icons, spacing, and motion.
- Supply a runnable React, TypeScript, test, and build toolchain because the repository currently contains only frontend source files.

## Non-Goals

- Backend changes, durable job storage, polling, server-side cancellation, or real progress percentages.
- Authentication, authorization, routing, or functional implementations of other HRMS modules.
- PDF, DOCX, XLSX, PPTX, TIFF, or BMP support.
- Document classification, structured field extraction, confidence scores, or source-region mapping.
- Persistent history, local storage of document content, or seeded employee records in production UI.
- A reusable organization-wide component library.

## UX Principles

1. **Human confirmation is a boundary.** AI output is never presented as official data until the user confirms it.
2. **Show only true system state.** The interface must not fabricate progress, cancellation, persistence, confidence, or structured extraction.
3. **Optimize repeated review.** The job queue remains visible on desktop so HR can move through several files without entering a wizard.
4. **Use density deliberately.** The queue is compact; the document review area is spacious.
5. **Preserve focus.** Background job completion never steals selection or keyboard focus from the file currently being reviewed.
6. **Keep sensitive data ephemeral.** Images and OCR text live only in memory for the current page session.

## Information Architecture

The application shell groups the ten product areas into a scalable navigation model:

- **Overview:** Dashboard and reports.
- **People:** Employee management, recruitment and onboarding, assessments.
- **Work:** AI meetings, tasks and Kanban, employee operations monitoring.
- **AI & Data:** Document AI.
- **System:** Organization and access, notifications and integrations.

Document AI is the only enabled destination in this slice. Every other destination is visibly disabled and labeled `Sắp ra mắt`; it must not navigate to an empty or simulated page.

The desktop sidebar is approximately 240 px wide and includes a user-operated control that collapses it to a 72 px rail for the current session. At tablet widths it starts collapsed automatically. The header identifies the current workspace and the demo persona without introducing fake authentication controls.

## Workspace Layout

The selected layout is **Queue-first Desk**:

- A 320–360 px job queue occupies the left side of the content region.
- The remaining width is the review workspace.
- With no selected job, the workspace becomes the upload drop zone and concise supported-format guidance.
- With a selected completed job, the workspace splits into document preview and OCR review editor.
- Selecting jobs changes workspace content in place; there is no multi-page wizard.

### Responsive Behavior

- **1280 px and wider:** full labeled sidebar, persistent queue, and side-by-side document/review panes.
- **768–1279 px:** collapsed navigation rail; document and OCR result use accessible tabs to preserve usable reading width.
- **Below 768 px:** compact header and single-column flow supporting upload, queue status, result reading, copy, and download. Deep editing and confirmation direct the user to a larger screen.

## Visual Direction

The selected art direction is **Evidence Prism**. The product interface itself carries the visual thesis: HR work moves from source evidence, through an AI-generated draft, to human-confirmed content. A slim evidence spine between the source preview and OCR editor makes that boundary visible without claiming field-level traceability that the backend does not provide.

### Reference Transformation

Lattice is used as a quality reference, not a layout template. DOWN TOWN adopts its decisive typographic hierarchy, composed asymmetric grids, disciplined semantic color, product-led imagery, and light physical feedback. It does not copy the marketing hero, rainbow decoration, oversized campaign typography, stock imagery, or landing-page motion patterns.

The operational workspace remains denser and calmer than a marketing site. Color appears only where it explains OCR state or data movement; it does not decorate the entire application or soften the seriousness of employee documents.

### Signature Evidence Spine

The evidence spine is the one signature visual device in the workspace. It never implies that a text passage maps to a specific image region.

- **Queued:** a neutral hairline with one empty status node.
- **Processing:** a muted spine with one restrained sweep moving from source toward review. It communicates activity without a fabricated percentage.
- **Needs review:** a limited mint-violet-coral spectrum with two visible nodes marking the source and human-review sides of the boundary.
- **Confirmed:** a stable teal spine with a completed node. The editor locks, but the layout does not jump or celebrate theatrically.
- **Error:** a neutral spine interrupted by an error-colored node and paired with explicit error text; color never carries the meaning alone.

The spine adapts without inventing new capability:

- **Desktop:** a 4 px vertical trace occupies the gutter between the source and review panes.
- **Tablet:** when the panes become tabs, a compact horizontal trace sits below the tab list and indicates the selected job state, not a source-region relationship.
- **Mobile:** a 3 px top trace appears in the selected job's status header. Mobile remains read/copy/download only and does not expose deep editing or confirmation.

### Core Tokens

- Deep teal `#092E30`: navigation, primary text, and the darkest interactive state.
- Canvas `#F8FBFA`: the application background.
- Source mist `#DFECE8`: source-preview framing and quiet selected surfaces.
- Trace mint `#65DFD3`, trace violet `#AA8CFF`, and trace coral `#FF9079`: the review-state evidence spine, its nodes, and the empty-state media field only.
- Confirmed teal `#4AC7AD`: the confirmed spine and confirmation status accent.
- Action teal `#0D6E62`: primary actions and accessible links.
- White `#FFFFFF`: document, editor, and elevated utility surfaces.
- Semantic warning and error colors must meet WCAG AA contrast and always pair color with text or an icon.

Outfit at weights 600–700 gives short workspace and section titles a clear editorial voice. Geist at weights 400–600 handles navigation, body copy, controls, and data-dense UI. Both use system sans-serif fallbacks. Page titles remain between 28 and 32 px; body text remains between 14 and 16 px with at least 1.45 line height. Filenames and technical metadata may use Geist Mono sparingly.

Borders and spacing create most of the hierarchy. Controls use an 8 px radius, ordinary panels 12 px, and the major workspace boundary 16 px. Pills are reserved for status and compact filters. Shadows are reserved for the document sheet, popovers, and genuinely elevated layers. Selectable queue rows may lift by at most 4 px with a layered shadow; static regions do not float.

The design excludes decorative page gradients, warm cream plus acid-accent defaults, glassmorphism, oversized marketing headings, decorative emoji, excessive pills, and card containers around every region. Prism colors must not leak into ordinary navigation, body copy, or unrelated controls.

Phosphor icons replace emoji and provide consistent stroke weight. Icon-only controls require accessible names and visible tooltips.

## Component Architecture

```text
App
└── AppShell
    ├── SidebarNavigation
    ├── AppHeader
    └── DocumentWorkspace
        ├── UploadLauncher
        ├── OCRJobQueue
        │   └── OCRJobItem
        └── ReviewWorkspace
            ├── DocumentPreview
            ├── OCRTextEditor
            └── ReviewActions
```

Presentation components consume explicit props and contain no API orchestration. A feature-level `useOCRQueue` hook owns asynchronous processing. A pure `ocrQueueReducer` owns state transitions so queue behavior can be tested without rendering the entire application.

The intended state interface is:

```ts
type OCRJobStatus =
  | "queued"
  | "processing"
  | "needs_review"
  | "confirmed"
  | "error";

interface OCRJob {
  id: string;
  file: File;
  previewUrl: string;
  status: OCRJobStatus;
  originalText: string;
  editedText: string;
  confirmedText: string | null;
  errorMessage: string | null;
  attemptCount: number;
  createdAt: number;
  startedAt: number | null;
}
```

The exact file map is finalized in the implementation plan, but state, orchestration, app-shell presentation, queue presentation, review presentation, and styles must remain separate responsibilities.

## Queue Rules

- A selection or drop accepts at most five images.
- The active queue capacity is five jobs. A user can dismiss confirmed or failed jobs to make room for another batch.
- Supported MIME types are PNG, JPG/JPEG, and WEBP, matching the backend.
- Each file is limited to 10 MB, matching the backend.
- Files are processed in first-in, first-out order, one request at a time.
- The first added file becomes selected. Later completions do not replace the user's current selection.
- A duplicate in the same session is detected only by `name`, `size`, and `lastModified`. The UI describes this as a likely duplicate, not content-level duplicate detection.
- Queued jobs can be removed. Processing jobs cannot be canceled because the server does not expose cancellation.
- Failed jobs can be retried with their original `File` object and incremented `attemptCount`.
- Confirmed and failed jobs can be dismissed. A `needs_review` job cannot be dismissed until the user confirms it; this prevents accidental loss of reviewed or partially edited text.

## Data Flow

1. The user selects or drops one to five files.
2. The client validates count, MIME type, size, and likely duplicates before dispatching queue actions.
3. Valid files receive local IDs and object URLs, enter `queued`, and appear immediately.
4. `useOCRQueue` selects the oldest queued job only when no job is processing.
5. The job moves to `processing`, and `scanImage(file)` calls the existing synchronous OCR endpoint.
6. A successful response copies `result.text` to both `originalText` and `editedText`, then moves the job to `needs_review`.
7. The user edits `editedText`. Copy and download always use `editedText`, never `originalText`.
8. Confirmation copies `editedText` to `confirmedText`, moves the job to `confirmed`, and locks the editor.
9. `Mở lại để sửa` clears `confirmedText`, returns the job to `needs_review`, and preserves `originalText`.
10. Removing a job or unmounting the workspace revokes its object URL.

All data remains in memory and disappears on refresh. The interface states this clearly where confirmation occurs.

## Loading, Success, and Error Behavior

Processing shows the current step and elapsed waiting time, not a fabricated percentage. The copy must remain calm and specific: `Đang trích xuất văn bản` rather than promising a fixed completion time.

Errors remain attached to their job and use Vietnamese messages for:

- Unsupported file format.
- File larger than 10 MB.
- Empty or unreadable file.
- Network connection failure.
- OCR service or unexpected server failure.

Retry never requires the user to select the original file again. The error state retains preview, filename, and attempt count. API details useful only to developers are not exposed directly in the UI.

If the service returns an empty or sentinel-like result, the job still enters review with a prominent warning that no reliable text was detected. It is not silently treated as confirmed content.

## Motion

Motion is restrained and task-oriented:

- A short application-shell entrance on first mount.
- A stagger when new jobs enter the queue.
- A brief opacity and position transition when the selected review pane changes state.
- The evidence spine changes state without changing layout; processing uses one slow source-to-review sweep as the focal animation.
- Direct hover and pressed feedback on interactive rows and controls.

GSAP orchestrates the shell entrance, queue-entry stagger, review-pane transition, and evidence-spine state change. ScrollTrigger, scroll pinning, horizontal narrative scrolling, and decorative card stacking are excluded. `prefers-reduced-motion: reduce` removes the processing sweep and non-essential movement, leaving an immediate static state-colored trace.

## Accessibility

- The drop zone is a real button or label-driven control and works without drag-and-drop.
- All controls are reachable and operable by keyboard.
- Status updates use an appropriately scoped `aria-live` region.
- Tablet tabs follow ARIA tab patterns and keyboard navigation.
- Focus never moves merely because a background job finishes.
- Validation failure moves focus to a concise summary connected to the invalid input.
- Focus treatment combines trace mint with a deep-teal outer edge so it remains visible against light and dark surfaces.
- Icon-only buttons have accessible names; status never relies on color alone.
- Long filenames truncate visually while their full names remain available to assistive technology and tooltips.

## Testing Strategy

### Reducer and Hook Tests

- Enforce queue capacity and FIFO transitions.
- Prevent concurrent scan calls.
- Preserve selection when another job finishes.
- Preserve `originalText` across edits, confirmation, and reopening.
- Permit retry only for failed jobs; permit dismissal only for queued, confirmed, or failed jobs.
- Revoke object URLs when jobs are removed and when the hook unmounts.

### Component Tests

- Render the grouped navigation and clearly labeled demo persona.
- Operate the empty-state upload control using keyboard input.
- Accept supported formats and reject unsupported or oversized files.
- Render queued, processing, review, confirmed, and error states.
- Verify that copy and download consume edited text.
- Verify confirmation locks the editor and reopening unlocks it.
- Verify accessible status announcements and tab semantics.
- Verify reduced-motion behavior.
- Verify each queue status produces the defined evidence-spine treatment without implying source-region mapping.

### Manual Review

Review at 1440 px, 1024 px, and 390 px. Check keyboard order, visible focus, contrast, text overflow, long filenames, slow responses, network failures, retry, dismissal confirmation, and the absence of accidental horizontal scrolling. Confirm that prism colors remain limited to the evidence path, status nodes, and empty-state media field.

## Acceptance Criteria

- The frontend installs and runs using documented commands.
- Type-check, automated tests, and production build pass.
- The UI is Vietnamese except for OCR, AI, file extensions, and unavoidable technical terms.
- The interface contains no emoji and no unsupported backend claims.
- Five valid images process sequentially and remain independently reviewable.
- Original, edited, and confirmed text remain distinguishable in state.
- Queued, processing, needs-review, confirmed, and error states have truthful, accessible evidence-spine treatments.
- The Evidence Prism signature transforms into a horizontal tablet trace and mobile status trace without implying field-level mapping.
- Desktop, tablet, and mobile behavior matches the defined capability boundaries.
- The backend remains unchanged.

## Repository and Delivery Constraints

- All work occurs on `develop-thanh`.
- Each commit message must be approved by Thanh before the commit is created.
- Commit subjects and bodies are in English and contain no emoji or AI attribution.
- The completed branch is pushed to `origin/develop-thanh`.
- The pull request targets `develop`, never `main`, and waits for Dat's review.
- Existing unrelated worktree changes and `.superpowers/` brainstorming artifacts are excluded from every commit.
