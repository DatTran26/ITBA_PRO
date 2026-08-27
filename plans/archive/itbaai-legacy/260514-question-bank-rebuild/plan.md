---
title: "Question Bank Rebuild: Single Sidebar Item + Unified Tabbed Page"
description: "Remove accordion sub-nav, rebuild as flat sidebar link → unified tabbed page"
status: pending
priority: P1
branch: "dev"
tags: ["question-bank", "nav", "ui-refactor"]
blockedBy: []
blocks: []
created: "2026-05-14T08:17:31.067Z"
createdBy: "ck-cli"
source: cli
---

# Question Bank Rebuild: Single Sidebar Item + Unified Tabbed Page

## Overview

Current implementation has Question Bank as an accordion group in the sidebar with 4 child links (Overview, Add Question, Bulk Import, AI Pipeline). This is wrong UX. Rebuild so Question Bank is a **single flat sidebar item** that navigates to `/dashboard/question-bank` — a unified page with internal shadcn/ui Tabs.

All API routes, DB migration, edge function, and `src/components/question-bank/` components are KEPT as-is.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Cleanup & Nav Fix](./phase-01-cleanup-nav-fix.md) | Pending |
| 2 | [Unified Page Redesign](./phase-02-unified-page-redesign.md) | Pending |
| 3 | [Compile & Verify](./phase-03-compile-verify.md) | Pending |

## What Changes

| File | Action |
|------|--------|
| `src/app/dashboard/question-bank/add/` | DELETE entire directory |
| `src/app/dashboard/question-bank/import/` | DELETE entire directory |
| `src/app/dashboard/question-bank/ai-pipeline/` | DELETE entire directory |
| `src/components/ui/nav-config.ts` | Change question-bank group → single link only |
| `src/components/ui/app-sidebar.tsx` | Add `NavStandaloneItem` component for single-link groups |
| `src/app/dashboard/question-bank/page.tsx` | Keep server wrapper, update props |
| `src/app/dashboard/question-bank/question-bank-client.tsx` | Full redesign with Tabs |

## What Stays (Do Not Touch)

- `src/app/api/question-bank/` — all routes
- `src/app/api/document-sources/` — all routes
- `src/components/question-bank/` — all components
- `supabase/migrations/20260513000000_question_bank_foundation.sql`
- `supabase/functions/generate-questions-from-doc/`

## Dependencies

- No other active plans depend on Question Bank sub-pages
