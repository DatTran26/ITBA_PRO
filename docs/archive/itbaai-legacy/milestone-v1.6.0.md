# 🚀 Milestone v1.6.0+: Stabilization & Scale

> **Historical milestone.** Không dùng làm trạng thái sản phẩm hiện tại.

## Overview
This milestone marks the transition from MVP to a production-ready, scalable platform. The primary focus is on **Performance**, **UI Refinement**, **State Management**, and **Architectural Cleanliness**.

---

## 1. ⚡ Performance (Hiệu suất)
*Goal: Achieve API response times < 500ms and P90 page loads < 2s.*

- **Query Optimization**: Refactor Supabase queries for the CRM layer and Scoring Engine to eliminate N+1 issues and reduce latency.
- **API Caching**: Implement strategic Cache-Control headers for static or slow-changing data (e.g., skill categories, assessment templates).
- **Rate Limiting**: Apply per-user/per-endpoint constraints to manage OpenAI token costs and prevent abuse.
- **Monitoring**: Full integration of **Sentry** for real-time error tracking and performance profiling.
- **Bundle Optimization**: Audit Tailwind CSS v4 and UI libraries to minimize client-side bundle size.

## 2. 🎨 UI & Aesthetics (Giao diện & Trải nghiệm)
*Goal: Deliver a premium, high-fidelity interface with "Wow" factor.*

- **High-End Styling**: Enhance the "Test Constraints" modal with premium effects (Glassmorphism, deep dark schemes).
- **Loading UX**: Unified skeleton loaders across all CRM detail pages to ensure a stable visual experience.
- **Micro-interactions**: Subtle Framer Motion 12 animations for cards, buttons, and status transitions.
- **Mobile 2.0**: Advanced responsiveness for complex data views (Skill Matrix, Activity Logs).
- **Typography & Icons**: Standardization using modern families (Inter/Outfit) and premium icon sets.

## 3. 💾 State Management (Quản lý Trạng thái)
*Goal: Decouple logic from components and improve UI reactivity.*

- **Custom Hooks Extraction**: Move business logic from oversized components into specialized hooks:
  - `useAssessmentSession`
  - `useCrmEntity`
  - `useAiUsageTracking`
- **Optimistic UI**: Implement immediate UI updates for Notes, Tags, and Status changes to eliminate "perception of lag".
- **Real-time Synchronization**: Expand Supabase Realtime usage to Person and Group detail pages for collaborative recruiting.

## 4. 🔘 Button Display Logic (Nút bấm & Hành động)
*Goal: Minimalist UI with context-aware action triggers.*

- **Smart Grouping**: Use dropdown action menus for non-primary actions (Archive, Sync, Export) to declutter the workspace.
- **Role-Based Visibility**: 
  - **Admin**: Views system-level controls (Settings, Version Approval).
  - **Recruiter**: Views test-specific controls (AI Regenerate, Share Token).
- **State-Dependent Controls**: Button labels and styles reflect entity lifecycle (e.g., "Deactivate" instead of "Draft").
- **Interactive Feedback**: Integrated loading states within buttons for async AI operations.

## 5. 📐 Layout & Structure (Bố cục & Cấu trúc)
*Goal: Standardized layouts and maintainable code architecture.*

- **CRM Page Standards**: Implement the "Triple Column" standard: 
  - **Col 1**: Core Entity Data
  - **Col 2**: Visual Analytics (Skill Matrix, Scoring)
  - **Col 3**: Activity Sidebar (Notes, Tasks)
- **Component Pruning**: Strict enforcement of the **< 200 LOC per file** rule.
- **Directory Modularization**: Reorganize `components/dashboard` into sub-folders by domain (CRM, Assessments, Admin).
- **Scoring Engine**: Standardize the math and utility functions used for skill GAP analysis.

---

## 🚦 Roadmap Priorities

| Feature Module | Priority | Status | Target Date |
| :--- | :--- | :--- | :--- |
| **Refactor create/page.tsx** | 🔴 Critical | In Progress | April 10 |
| **Sentry Integration** | 🟡 High | Not Started | April 12 |
| **Optimistic UI (Notes/Tags)** | 🟡 High | Not Started | April 15 |
| **API Rate Limiting** | 🟢 Medium | Not Started | April 20 |

---
*Last Updated: April 7, 2026*
*Version: 1.6.0 Proposal*
