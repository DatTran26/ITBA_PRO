---
title: "Calendar View — Interviews Page"
description: "Add Google Calendar–style tab view to /dashboard/interviews using react-big-calendar"
status: completed
priority: P2
effort: 8h
branch: feat/interview-calendar-view
tags: [ui, calendar, interviews, react-big-calendar]
created: 2026-04-25
---

# Calendar View — Interviews Page

## Overview

Add a **"Lịch"** tab alongside the existing **"Danh sách"** list view in `/dashboard/interviews`. Uses `react-big-calendar` with full dark-theme CSS override. Events are colored by `interviewer_status` matching the existing status system. Clicking an event opens an inline action panel (confirm/decline).

No drag-drop in v1. No new API endpoints — reuses existing `/api/recruitment/interviews` fetch.

## Phases

| # | Phase | Status | Effort | Link |
|---|-------|--------|--------|------|
| 1 | Install & CSS Setup | Completed | 1h | [phase-01](./phase-01-install-setup.md) |
| 2 | CalendarView Component | Completed | 4h | [phase-02-calendar-component.md](./phase-02-calendar-component.md) |
| 3 | Tab Toggle Integration | Completed | 2h | [phase-03-tab-integration.md](./phase-03-tab-integration.md) |

## Dependencies

- `react-big-calendar` (MIT) — not yet installed
- `date-fns` (peer dep of react-big-calendar) — not yet installed
- `framer-motion` v12.35.1 — already installed
- Existing `/api/recruitment/interviews` endpoint — no changes needed
- `src/app/globals.css` — add calendar theme overrides

## Key Decisions

- **Library**: `react-big-calendar` over FullCalendar (MIT, smaller bundle, full CSS control)
- **Views**: Week (default) + Month only. Day and Agenda deferred to v2.
- **Interactivity**: Click-to-detail only. No drag-drop (v2).
- **SSR**: Dynamic import with `ssr: false` to avoid react-big-calendar SSR issues.
- **CSS strategy**: Import base CSS in the calendar component file; override via `globals.css` scoped under `.rbc-calendar`.
