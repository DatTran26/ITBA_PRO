# Document AI Evidence Prism Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-file OCR demo with a runnable, responsive Vietnamese Document AI verification workspace using the approved Evidence Prism direction and the existing synchronous OCR API.

**Architecture:** Keep the API boundary unchanged and model the browser session as a pure reducer plus a feature-level orchestration hook. Compose a semantic application shell, queue, upload control, and review workspace from focused React components; use CSS for layout and the code-native prism graphic, with GSAP limited to task-oriented entrance and state transitions.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, React Testing Library, jest-dom, Phosphor Icons, GSAP, CSS custom properties, Outfit Variable, Geist Variable.

**Spec:** `docs/superpowers/specs/2026-08-24-document-ai-workspace-design.md`

## Global Constraints

- Work only on `develop-thanh`; the branch was rebased onto the latest `origin/develop` before implementation.
- Consume `POST /api/ocr/scan` as-is; do not modify backend code or claim background jobs, persistence, cancellation, confidence, structured extraction, or source-region mapping.
- Accept PNG, JPG/JPEG, and WEBP up to 10 MB; keep at most five session-only jobs and process exactly one request at a time in FIFO order.
- Preserve `originalText`, `editedText`, and `confirmedText` as distinct values; AI output is not official until explicit human confirmation.
- Desktop supports full review; tablet uses accessible source/result tabs; mobile supports upload, status, reading, copy, and download but not deep editing or confirmation.
- UI copy is Vietnamese except OCR, AI, file extensions, and unavoidable technical terms; no emoji.
- Evidence Prism colors appear only on the evidence path, status nodes, empty-state media field, and focus treatment.
- Respect `prefers-reduced-motion`; never render a fake percentage or completion estimate.
- Stage explicit paths only. Exclude `.superpowers/` and unrelated worktree changes from all commits.
- Present every English commit message to Thanh and wait for explicit approval before running `git commit`.

---

### Task 1: Establish the Runnable Frontend and Test Harness

**Files:**
- Modify: `modules/vision-ocr/frontend/package.json`
- Create: `modules/vision-ocr/frontend/package-lock.json`
- Create: `modules/vision-ocr/frontend/index.html`
- Create: `modules/vision-ocr/frontend/tsconfig.json`
- Create: `modules/vision-ocr/frontend/tsconfig.app.json`
- Create: `modules/vision-ocr/frontend/tsconfig.node.json`
- Create: `modules/vision-ocr/frontend/vite.config.ts`
- Create: `modules/vision-ocr/frontend/src/vite-env.d.ts`
- Create: `modules/vision-ocr/frontend/src/main.tsx`
- Create: `modules/vision-ocr/frontend/src/styles.css`
- Create: `modules/vision-ocr/frontend/src/test/setup.ts`
- Modify: `modules/vision-ocr/frontend/src/__tests__/OCRScannerPage.test.tsx`

**Interfaces:**
- Consumes: existing exported `OCRScannerPage` React component.
- Produces: `npm run dev`, `npm run typecheck`, `npm test`, and `npm run build`; a JSDOM test environment with browser API shims.

- [ ] **Step 1: Preserve the existing component smoke test as the harness probe**

```tsx
import { render, screen } from "@testing-library/react";
import { OCRScannerPage } from "../components/OCRScannerPage";

test("renders the current OCR scanner", () => {
  render(<OCRScannerPage />);
  expect(
    screen.getByRole("heading", { name: "Vision OCR Scanner" }),
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Install and configure the test runner**

Run:

```bash
cd modules/vision-ocr/frontend
npm install
npm test -- --run src/__tests__/OCRScannerPage.test.tsx
```

Expected before configuration: the command cannot run because Vitest and its setup do not exist. Configuration files are the TDD exception for this task; the unchanged component smoke test proves the new harness against real production code.

- [ ] **Step 3: Add the Vite entrypoint and deterministic test setup**

`src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { OCRScannerPage } from "./components/OCRScannerPage";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OCRScannerPage />
  </React.StrictMode>,
);
```

`src/test/setup.ts` must import `@testing-library/jest-dom/vitest`, run RTL cleanup after each test, provide `window.matchMedia`, and stub `URL.createObjectURL`/`URL.revokeObjectURL` with deterministic values.

- [ ] **Step 4: Add explicit scripts and dependencies**

Use these scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Install runtime dependencies for Phosphor icons, GSAP, Outfit Variable, and Geist Variable. Install Vitest, JSDOM, React Testing Library, user-event, and jest-dom as development dependencies. Remove the unused Tailwind, PostCSS, and Autoprefixer packages because this implementation uses one explicit CSS visual system rather than an unconfigured utility layer.

- [ ] **Step 5: Run the harness checks**

```bash
npm run typecheck
npm test -- --run src/__tests__/OCRScannerPage.test.tsx
```

Expected: typecheck and the existing component smoke test pass.

- [ ] **Step 6: Prepare the task commit without committing**

Stage only the Task 1 paths, show the staged diff, and propose `chore(ocr): establish frontend toolchain`. Wait for Thanh's explicit approval before committing.

### Task 2: Build the Queue Domain with TDD

**Files:**
- Modify: `modules/vision-ocr/frontend/src/types/ocr.ts`
- Create: `modules/vision-ocr/frontend/src/features/ocr/ocrQueue.ts`
- Create: `modules/vision-ocr/frontend/src/features/ocr/ocrQueue.test.ts`

**Interfaces:**
- Consumes: browser `File` objects and the existing `OCRScanResponse` contract.
- Produces: `OCRJob`, `OCRQueueState`, `OCRQueueAction`, `ocrQueueReducer`, `createOCRJobs`, and `validateFiles`.

The state contract is:

```ts
export type OCRJobStatus =
  | "queued"
  | "processing"
  | "needs_review"
  | "confirmed"
  | "error";

export interface OCRJob {
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

- [ ] **Step 1: Write reducer tests for queue capacity, FIFO state changes, and selection preservation**

Use literal `File` fixtures and assert observable state. Cover: accepting five jobs, rejecting capacity overflow, selecting the first added job, transitioning only the addressed job, and preserving selection when another job completes.

```ts
test("completing a background job preserves the selected job", () => {
  const initial = stateWithJobs([queued("a"), processing("b")], "a");
  const next = ocrQueueReducer(initial, {
    type: "complete",
    id: "b",
    text: "Hợp đồng lao động",
  });
  expect(next.selectedJobId).toBe("a");
  expect(next.jobs[1]).toMatchObject({
    status: "needs_review",
    originalText: "Hợp đồng lao động",
    editedText: "Hợp đồng lao động",
  });
});
```

- [ ] **Step 2: Run the reducer tests and verify RED**

```bash
npm test -- --run src/features/ocr/ocrQueue.test.ts
```

Expected: FAIL because `ocrQueueReducer` and its types do not exist.

- [ ] **Step 3: Implement the minimal reducer and file-validation rules**

Implement actions for `add`, `select`, `start`, `complete`, `fail`, `edit`, `confirm`, `reopen`, `retry`, `remove`, and `set_validation_error`. Validation must reject unsupported MIME/extensions, zero-byte files, files over `10 * 1024 * 1024`, likely duplicates by `name + size + lastModified`, and files beyond the remaining five-job capacity. Valid files in a mixed selection still enter the queue; rejected reasons are summarized in Vietnamese.

- [ ] **Step 4: Add tests for human-review invariants and removal rules**

Cover: editing never mutates `originalText`; confirmation snapshots `editedText`; reopening clears only `confirmedText`; only queued, confirmed, and error jobs can be removed; retry is available only from error and increments `attemptCount`.

- [ ] **Step 5: Run the reducer suite to verify GREEN**

```bash
npm test -- --run src/features/ocr/ocrQueue.test.ts
```

Expected: all queue-domain tests pass with no warnings.

- [ ] **Step 6: Prepare the task commit without committing**

Stage only the Task 2 paths, show the staged diff, and propose `feat(ocr): model the review queue`. Wait for Thanh's explicit approval before committing.

### Task 3: Orchestrate Sequential OCR Requests

**Files:**
- Create: `modules/vision-ocr/frontend/src/features/ocr/useOCRQueue.ts`
- Create: `modules/vision-ocr/frontend/src/features/ocr/useOCRQueue.test.tsx`
- Modify: `modules/vision-ocr/frontend/src/services/ocrService.ts`

**Interfaces:**
- Consumes: `scanImage(file): Promise<OCRScanResponse>` and the Task 2 reducer.
- Produces: `useOCRQueue(scan?: ScanImage): OCRQueueController` with state, selected job, and action methods used by the page.

```ts
export interface OCRQueueController {
  state: OCRQueueState;
  selectedJob: OCRJob | null;
  addFiles(files: FileList | File[]): void;
  selectJob(id: string): void;
  editText(id: string, text: string): void;
  confirmJob(id: string): void;
  reopenJob(id: string): void;
  retryJob(id: string): void;
  removeJob(id: string): void;
  clearValidationError(): void;
}
```

- [ ] **Step 1: Write a hook test proving FIFO and single concurrency**

Use a controllable deferred promise at the external scan boundary. Add three files, assert only the first filename has entered the scanner, resolve it, then assert only the second begins.

- [ ] **Step 2: Run the hook test and verify RED**

```bash
npm test -- --run src/features/ocr/useOCRQueue.test.tsx
```

Expected: FAIL because `useOCRQueue` does not exist.

- [ ] **Step 3: Implement the orchestration hook**

Use the reducer as the single state-transition authority. An effect starts the oldest queued job only when no job is processing. Dispatch `start` before awaiting the injected scanner; dispatch `complete` or a user-safe Vietnamese `fail` result afterward. Keep created object URLs in a ref, revoke them on permitted removal and unmount, and do not persist queue data to storage.

- [ ] **Step 4: Add error, retry, empty-result, and URL lifecycle tests**

Assert that a rejected request leaves the original `File` available for retry, that an empty successful string becomes `needs_review`, that retry scans the same file once, and that removal/unmount call `URL.revokeObjectURL` for each owned preview.

- [ ] **Step 5: Make API errors user-safe at the service boundary**

Keep server detail out of the visible message while preserving a stable classification:

```ts
export class OCRServiceError extends Error {
  constructor(public readonly kind: "network" | "service") {
    super(kind === "network" ? "network" : "service");
  }
}
```

The hook maps these kinds to `Không thể kết nối dịch vụ OCR.` and `Dịch vụ OCR chưa thể xử lý tài liệu này.`.

- [ ] **Step 6: Run hook and reducer suites to verify GREEN**

```bash
npm test -- --run src/features/ocr/useOCRQueue.test.tsx src/features/ocr/ocrQueue.test.ts
```

Expected: all orchestration and domain tests pass; scanner concurrency never exceeds one.

- [ ] **Step 7: Prepare the task commit without committing**

Stage only the Task 3 paths, show the staged diff, and propose `feat(ocr): process scans sequentially`. Wait for Thanh's explicit approval before committing.

### Task 4: Compose the HRMS Shell and Upload Queue

**Files:**
- Create: `modules/vision-ocr/frontend/src/components/app/AppShell.tsx`
- Create: `modules/vision-ocr/frontend/src/components/app/SidebarNavigation.tsx`
- Create: `modules/vision-ocr/frontend/src/components/ocr/UploadLauncher.tsx`
- Create: `modules/vision-ocr/frontend/src/components/ocr/OCRJobQueue.tsx`
- Modify: `modules/vision-ocr/frontend/src/components/OCRScannerPage.tsx`
- Modify: `modules/vision-ocr/frontend/src/__tests__/OCRScannerPage.test.tsx`

**Interfaces:**
- Consumes: `OCRQueueController` from Task 3.
- Produces: semantic `AppShell`, grouped disabled navigation, keyboard-operable upload, compact queue, and clearly labeled demo persona.

- [ ] **Step 1: Expand the page test for shell semantics and truthful navigation**

Assert `Document AI` is the only enabled navigation item; disabled product destinations expose `Sắp ra mắt`; the header renders `Thanh` and `HR Operations` with a `Tài khoản demo` label; the upload input is reachable through a Vietnamese button label.

- [ ] **Step 2: Run the page test and verify RED**

```bash
npm test -- --run src/__tests__/OCRScannerPage.test.tsx
```

Expected: FAIL because the old scanner has no application shell or grouped navigation.

- [ ] **Step 3: Implement the semantic shell**

Use `<aside>`, `<nav aria-label="Điều hướng chính">`, `<header>`, and `<main>`. Keep collapse state local to `AppShell`. Render disabled destinations as non-link elements with `aria-disabled="true"`; never attach a fake route. Use Phosphor icons with `aria-hidden="true"` and text labels.

- [ ] **Step 4: Implement the accessible upload launcher and queue**

The drop zone must be a styled `<label>` backed by a multi-file input, accept click/keyboard input, and pass all files to `addFiles`. Queue rows are real buttons for selection; removal is a separate named button and appears only when state rules permit it. Announce processing and validation updates in scoped `aria-live` regions.

- [ ] **Step 5: Add interaction tests for multi-file upload and validation summary**

Use `userEvent.upload` with valid and oversized fixtures. Assert valid filenames appear immediately, invalid files produce a focused `role="alert"`, and no more than five rows are rendered.

- [ ] **Step 6: Run page tests to verify GREEN**

```bash
npm test -- --run src/__tests__/OCRScannerPage.test.tsx
```

Expected: shell, navigation, persona, upload, queue, and validation tests pass.

- [ ] **Step 7: Prepare the task commit without committing**

Stage only the Task 4 paths, show the staged diff, and propose `feat(ui): compose the Document AI shell`. Wait for Thanh's explicit approval before committing.

### Task 5: Build the Human Review Workspace and Evidence Spine

**Files:**
- Create: `modules/vision-ocr/frontend/src/components/ocr/EvidenceSpine.tsx`
- Create: `modules/vision-ocr/frontend/src/components/ocr/DocumentPreview.tsx`
- Create: `modules/vision-ocr/frontend/src/components/ocr/ReviewWorkspace.tsx`
- Create: `modules/vision-ocr/frontend/src/components/ocr/ReviewWorkspace.test.tsx`
- Modify: `modules/vision-ocr/frontend/src/components/OCRScannerPage.tsx`

**Interfaces:**
- Consumes: selected `OCRJob` and controller callbacks.
- Produces: truthful status trace, source preview, editable review, original OCR comparison, confirmation/reopen, retry, copy, and `.txt` download.

- [ ] **Step 1: Write review tests for the human confirmation boundary**

Render a `needs_review` job, edit the textarea, confirm it, and assert the editor becomes locked with a visible `Đã xác nhận` state. Reopen and assert the edited value remains while confirmation is cleared. Assert the original OCR text remains available in an explicitly labeled disclosure.

- [ ] **Step 2: Run review tests and verify RED**

```bash
npm test -- --run src/components/ocr/ReviewWorkspace.test.tsx
```

Expected: FAIL because the review workspace does not exist.

- [ ] **Step 3: Implement the Evidence Spine without false mapping**

`EvidenceSpine` receives only `status` and a concise text label. It renders one neutral trace for queued, a moving source-to-review sweep for processing, a mint-violet-coral review trace with two nodes for needs-review, a stable teal trace for confirmed, and an interrupted neutral trace plus named error state for error. It must not receive OCR text offsets, bounding boxes, or image coordinates.

- [ ] **Step 4: Implement desktop panes and accessible tablet tabs**

Use a source panel and result panel in one stable workspace grid. The tablet tab list follows `tab`, `tablist`, and `tabpanel` semantics with ArrowLeft/ArrowRight/Home/End keyboard behavior. Desktop CSS reveals both panels; tablet CSS reveals the active panel. Mobile renders read-only result content and omits edit/confirm controls.

- [ ] **Step 5: Implement copy, download, retry, and empty-result warning**

Copy and download must always use `editedText`. Download creates `<base filename>_ocr.txt`, clicks it, then revokes its temporary URL. A blank OCR result shows `Không phát hiện được văn bản đáng tin cậy` but still remains reviewable. Error state retains the preview and offers retry without another upload.

- [ ] **Step 6: Add behavior tests for tabs, copy source, download source, retry, and empty output**

Assert keyboard tab movement, clipboard text equals the edited value, the Blob is constructed from the edited value, retry callback receives the selected ID, and blank output is not labeled confirmed.

- [ ] **Step 7: Run review and page suites to verify GREEN**

```bash
npm test -- --run src/components/ocr/ReviewWorkspace.test.tsx src/__tests__/OCRScannerPage.test.tsx
```

Expected: all human-review and integration behaviors pass.

- [ ] **Step 8: Prepare the task commit without committing**

Stage only the Task 5 paths, show the staged diff, and propose `feat(ui): add Evidence Prism review`. Wait for Thanh's explicit approval before committing.

### Task 6: Apply the Evidence Prism Visual System and Motion

**Files:**
- Modify: `modules/vision-ocr/frontend/src/styles.css`
- Create: `modules/vision-ocr/frontend/src/hooks/useWorkspaceMotion.ts`
- Modify: `modules/vision-ocr/frontend/src/components/app/AppShell.tsx`
- Modify: `modules/vision-ocr/frontend/src/components/ocr/OCRJobQueue.tsx`
- Modify: `modules/vision-ocr/frontend/src/components/ocr/EvidenceSpine.tsx`

**Interfaces:**
- Consumes: semantic class names/data attributes from Tasks 4–5 and the browser reduced-motion preference.
- Produces: exact design tokens, responsive layouts at 1280/768 px, controlled GSAP transitions, and a static reduced-motion experience.

- [ ] **Step 1: Add exact tokens and typography**

Define CSS custom properties for `#092E30`, `#F8FBFA`, `#DFECE8`, `#65DFD3`, `#AA8CFF`, `#FF9079`, `#4AC7AD`, `#0D6E62`, and white. Import Outfit Variable for headings and Geist Variable for body/UI. Apply the 8/12/16 px radius hierarchy and reserve pill shapes for statuses.

- [ ] **Step 2: Build the code-native empty-state media field**

Use layered semantic HTML/CSS lines and document planes inside one `aria-hidden="true"` figure. Do not use a raster image, stock art, decorative page gradient, or text embedded in an image. Keep prism colors within this figure and the evidence path.

- [ ] **Step 3: Implement desktop, tablet, and mobile layout contracts**

At 1280 px and wider render a 240 px sidebar, 320–360 px persistent queue, side-by-side source/review panes, and a 4 px vertical spine. At 768–1279 px render the 72 px rail, accessible tabs, and a horizontal trace. Below 768 px render a compact header, single-column queue/result flow, a 3 px status trace, and no editor or confirmation controls.

- [ ] **Step 4: Add task-oriented motion**

`useWorkspaceMotion` creates a scoped `gsap.context`, animates shell regions once, staggers newly visible queue rows, and transitions the selected workspace state without moving keyboard focus. The Evidence Spine processing sweep is the only continuous animation. Use `gsap.matchMedia()` to remove transforms and sweeps when `(prefers-reduced-motion: reduce)` matches.

- [ ] **Step 5: Add a reduced-motion component test**

Set the test `matchMedia` shim to reduced mode, render the page, and assert the processing trace exposes a static status label and no animation-only dependency for understanding state. Do not test GSAP internals or exact CSS values in JSDOM.

- [ ] **Step 6: Run tests, typecheck, and build**

```bash
npm test
npm run typecheck
npm run build
```

Expected: all tests pass, TypeScript reports zero errors, and Vite produces `dist/` successfully.

- [ ] **Step 7: Prepare the task commit without committing**

Stage only the Task 6 paths, show the staged diff, and propose `feat(ui): apply Evidence Prism styling`. Wait for Thanh's explicit approval before committing.

### Task 7: Browser QA, Accessibility Review, and Delivery Documentation

**Files:**
- Modify: `modules/vision-ocr/README.md`
- Modify: frontend files only when a verified QA defect requires a correction and a failing regression test is added first.

**Interfaces:**
- Consumes: the complete frontend and Vite dev server.
- Produces: verified desktop/tablet/mobile behavior, documented commands, clean quality gates, and a reviewable branch.

- [ ] **Step 1: Document the runnable frontend**

Update the README with `npm install`, `npm run dev`, `npm test`, `npm run typecheck`, and `npm run build`. State that queue data is session-only and the frontend expects the existing API at `http://localhost:8000` unless `VITE_API_URL` is configured.

- [ ] **Step 2: Run the full quality gate**

```bash
cd modules/vision-ocr/frontend
npm test
npm run typecheck
npm run build
```

Expected: zero test failures, zero TypeScript errors, and a successful production build. Lint is explicitly reported as skipped because no lint script exists.

- [ ] **Step 3: Inspect the running UI in a real browser**

Start Vite, then use browser automation at 1440×1000, 1024×900, and 390×844. Verify no horizontal overflow; sidebar/rail/mobile header transitions; Evidence Spine orientation; keyboard tab behavior; long filename truncation; empty, processing, review, confirmed, and error states; and reduced-motion behavior.

- [ ] **Step 4: Run an accessibility-focused manual pass**

Navigate without a mouse. Verify visible focus, logical heading order, named icon controls, status announcements, upload input labeling, and that disabled destinations do not navigate. Check that all status meaning has adjacent text or icons and no prism color is the sole signal.

- [ ] **Step 5: Review the final diff against the spec**

Map every acceptance criterion to a test, browser observation, or documented capability. Scan for emoji, fake percentages, source-mapping language, storage APIs, unrelated backend edits, secrets, and accidental `.superpowers/` inclusion.

- [ ] **Step 6: Prepare documentation and any QA-fix commit without committing**

Stage only the README and verified QA fixes, show the staged diff, and propose `docs(ocr): document the review workspace`. Wait for Thanh's explicit approval before committing.

- [ ] **Step 7: Finish the branch only after all commit approvals**

Use `superpowers:verification-before-completion`, `code-review`, `superpowers:requesting-code-review`, and `superpowers:finishing-a-development-branch`. Push only `develop-thanh`, open a PR targeting `develop`, and leave the PR unmerged for Dat.
