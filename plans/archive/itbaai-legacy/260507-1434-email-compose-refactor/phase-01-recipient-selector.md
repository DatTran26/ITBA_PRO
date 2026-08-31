# Phase 01 — Dynamic RecipientSelector

## Context Links
- Current picker: `src/app/dashboard/emails/_components/recipient-picker.tsx`
- Compose: `src/app/dashboard/emails/compose-client.tsx`
- API: `src/app/api/emails/recipients/route.ts`

## Overview
- Priority: P2
- Status: completed
- Replace single-select `RecipientPicker` with a `RecipientSelector` that switches between single and multi modes based on template type, and derives source (persons vs users) from template type.

## Key Insights
- `/api/emails/recipients` already supports `type=interview_reminder` → users (role=interviewer); else persons. Backend source switch is done. Only the UI cardinality changes.
- Existing picker stores `query` string fused with selected display label. For multi-select, model selection as an array `Recipient[]`, with chip render + remove.
- Compose currently passes `recipientSource: "persons"` hard-coded — must derive from template type.

## Requirements

### Functional
- New `RecipientSelector` with prop `mode: "single" | "multi"`
- `value: Recipient | Recipient[]` controlled by parent (split based on mode)
- `onChange(value)` parent handler
- Multi mode: search + click adds to selection (chip list above input). Selected items hidden from results. Backspace on empty input removes last chip.
- Single mode: keep current behavior (display selected as filled query string)
- Visual disabled state when no template type chosen

### Non-functional
- Keep file under 200 lines (split chip render to small subcomponent if needed)
- No external deps; reuse `email-page-chrome` styles

## Architecture

```
RecipientSelector (props: mode, source, type, value, onChange, disabled)
 ├─ SearchInput (debounced fetch /api/emails/recipients?type=…&q=…)
 ├─ ResultsDropdown (filters out already-selected ids)
 └─ ChipList (multi mode only) — renders selected, click removes
```

ComposeClient maps:
- `schedule_interview` → multi, persons
- `interview_reminder` → multi, users
- `offer` / `onboard_confirm` → single, persons

## Related Code Files

### Modify
- `src/app/dashboard/emails/compose-client.tsx`
  - Replace `recipient: Recipient | null` state with `recipients: Recipient[]` (always array; render single-mode UI when 0..1)
  - Derive `mode`, `source` from `type` via small helper
  - Update `handleSend` (Phase 4 will wire bulk endpoint; for now keep single-send working when `recipients.length === 1`)
  - Update preview `Recipient` summary to count + first-name fallback
- `src/app/dashboard/emails/_components/recipient-picker.tsx`
  - Rename file to `recipient-selector.tsx` (kebab-case), add `mode` prop. Old `RecipientPicker` becomes a thin single-mode wrapper, OR delete and update all imports. Preferred: update file in-place per `development-rules.md` ("DO NOT create new enhanced files").

### Create
- (none — extend existing file)

## Implementation Steps
1. Add `templateRecipientConfig(type)` helper in `src/lib/email/recipient-config.ts` returning `{ mode, source, sessionPickerEnabled }`.
2. Edit `recipient-picker.tsx`:
   - Add `mode` prop (default `"single"`).
   - Internal state: `selected: Recipient[]`. Single mode uses `selected[0]`.
   - Render chips when `mode === "multi"`.
   - Filter results by `!selected.some(s => s.id === r.id)`.
   - Single-mode behavior unchanged externally (still emits `Recipient | null` via narrowed onChange OR change parent contract — choose latter).
3. Change props contract:
   - `value: Recipient[]`, `onChange: (next: Recipient[]) => void`
   - Compose adapts: stores `recipients: Recipient[]`.
4. Update `compose-client.tsx`:
   - Replace `recipient` state with `recipients`.
   - Replace single-recipient summary `Recipient` line with `${recipients.length} recipient(s) — first: …`.
   - `handleSend` still calls `/api/emails/send` when `recipients.length === 1` (Phase 4 will branch).
   - Pass `source` from helper into picker.
   - Update Send button disabled when `recipients.length === 0`.
5. Run `npm run lint` and `npx tsc --noEmit` (or `next build`) to confirm no compile errors.

## Todo List
- [x] Create `src/lib/email/recipient-config.ts`
- [x] Edit `recipient-picker.tsx` to support `mode` + array value
- [x] Update `compose-client.tsx` state to array
- [x] Update Send button & summary
- [ ] Lint + type-check pass (shell blocked in worktree agent — run manually)
- [ ] Manual smoke: pick 3 candidates for schedule_interview; confirm chips render & remove; confirm send still works for single

## Success Criteria
- Switching template type clears recipients and toggles mode.
- For multi types, user can add/remove multiple recipients via chips.
- For single types, only one recipient can be selected.
- No TS errors. Existing single-send path still works end-to-end.

## Risk Assessment
- Risk: breaking existing imports of `RecipientPicker`. Mitigation: keep export name, just extend props with default `mode="single"`.
- Risk: `source` mismatch with API. Mitigation: API already returns `source` field per row; trust server.

## Security
- No new endpoints in this phase — auth unchanged.

## Next Steps
- Phase 02 adds SessionPicker to feed selected recipients in bulk.
