# Project Roadmap

> **Historical roadmap snapshot.** Phase, ngày, budget, tỷ lệ và trạng thái bên
> dưới chưa có owner xác nhận hiện hành. Dùng plans/source/release evidence để
> xác định trạng thái; product boundary hiện hành nằm ở
> [`project-overview-pdr.md`](project-overview-pdr.md).

## Current Status

**Phase**: Phase 2: Stabilization & Scale (STARTING)
**Date**: April 2, 2026
**Completion**: ~98% (Phase 1 nearly complete)

## Phase Summary

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: MVP + Admin (CURRENT - 95% Complete)               │
│ ├─ Core Features: Complete ✓                                │
│ ├─ Authentication: Complete ✓ (roles: recruiter, admin)     │
│ ├─ Test Creation: Complete ✓                                │
│ ├─ Question Generation: Complete ✓ (8 AI routes)            │
│ ├─ Result Analysis: Complete ✓ (with inline editing)        │
│ ├─ Follow-up Sessions: Complete ✓ (Mar 19)                  │
│ ├─ System Settings: Complete ✓ (auto-save, 10 defaults)     │
│ ├─ Version Management: Complete ✓ (automated release workflow)│ ├─ Assessment Templates: Complete ✓ (Use Template feature)  │
│ ├─ Token Monitoring: Complete ✓ (logAiUsage, dashboard)     │
│ ├─ Skill Framework: Complete ✓ (categories, expectations)   │
│ ├─ CSV Export: Complete ✓ (admin-only)                      │
│ ├─ Admin Dashboard: Complete ✓ (3rd tab, KPIs, charts)      │
│ ├─ Code Quality: Optimized (Phase 1 files <200 LOC)        │
│ ├─ Script Relocation: Complete ✓ (.claude/scripts/)         │
│ └─ Testing: In Progress (target Phase 2: 80%+ coverage)     │
│                                                              │
├─ Phase 2: Stabilization & Scale (Q2 2026, Est. Apr 1+)      │
│ ├─ Automated Testing: Unit + integration + E2E tests        │
│ ├─ Rate Limiting: Per-user, per-endpoint constraints        │
│ ├─ Input Sanitization: XSS/injection prevention             │
│ ├─ Sentry Integration: Error tracking & monitoring          │
│ ├─ API Documentation: Comprehensive endpoint docs           │
│ ├─ Performance Tuning: Query optimization, caching          │
│ ├─ Security Audit: Third-party review                       │
│ └─ Documentation: API docs, troubleshooting guide          │
│                                                              │
├─ Phase 3: Enterprise Features (Q3 2026)                     │
│ ├─ API Access: Programmatic test creation                  │
│ ├─ Batch Testing: Send to multiple candidates              │
│ ├─ Performance Benchmarking: Compare candidates            │
│ ├─ Custom Scoring: Rubric definition                       │
│ ├─ SSO Integration: SAML/OAuth support                     │
│ └─ Data Export: CSV/PDF reports                            │
│                                                              │
└─ Phase 4: Advanced Features (Q4 2026+)                      │
  ├─ Video Integration: Record candidate responses            │
  ├─ Real-time Collaboration: Multiple recruiter access      │
  ├─ Skill Taxonomy: Pre-built question library              │
  ├─ ML Recommendations: Suggest candidates                  │
  └─ Mobile App: Native iOS/Android                          │
```

## Detailed Phase Breakdown

### Phase 1: MVP (Current - March 2026)

**Status**: In Final Polish

#### Completed Features (✓)

1. **User Authentication**
   - Email/password signup and login
   - JWT-based sessions
   - Password reset flow
   - Admin and recruiter roles

2. **Test Management**
   - Create tests with job role, level, description
   - Customizable instructions and question count
   - Archive/delete functionality
   - Unique share tokens for public access
   - Test expiration (30 days default)

3. **Question Generation**
   - Integration with OpenAI GPT-4o
   - Job description alignment
   - Markdown-formatted questions
   - Optional question regeneration
   - Fallback to sample questions if API unavailable

4. **Test Taking Interface**
   - Anonymous candidate access via share link
   - Multiple-choice questions (4 options)
   - Timer countdown (configurable)
   - Progress tracking
   - Auto-save answers

5. **Result Analysis**
   - Score calculation and percentage
   - Answer-by-answer review
   - AI-powered performance analysis
   - Topic-level scoring
   - Suggested follow-up questions

6. **Recruiter Dashboard**
   - Overview with test and candidate counts
   - Test list with creation date and result count
   - Quick actions (view, share, delete)
   - Result tracking and access
   - User management

7. **Follow-up Sessions** (Added Mar 19)
   - Generate follow-up questions based on results
   - Separate session tracking
   - Session status management (open/closed)
   - Recruiter follow-up analysis

8. **Interviewer Notes** (Added Mar 20)
   - Add notes to candidate results (up to 5000 characters)
   - Save/update notes via dedicated PATCH endpoint
   - Display notes in result detail page (warm gradient section)
   - Authenticate note updates (recruiters only)

9. **Candidate Status (Pass/Fail)** (Added Mar 20)
   - Add status column: pass/fail to results table
   - Segmented control in result header for quick status selection
   - PATCH /api/results/[id] supports status field
   - Visual indicator in result analysis UI

10. **Result Detail UI Redesign** (Added Mar 20)
    - 5-section interview-first layout
    - Header (Score + Status) → AI Assessment → Quick Hints → Note → Tabs
    - Two-column follow-up question layout (question left, points right)
    - Tab-style category filters (All, Strength Validation, Weakness Probe, etc.)
    - Blue/white Quick Interview Hints cards with numbered badges

11. **Realtime Updates** (Added Mar 20)
    - Supabase Realtime subscriptions on test detail page
    - Auto-refresh results when candidate submits test
    - No page reload required for recruiters monitoring test
    - supabase_realtime publication configured

12. **Edit AI Summary** (Added Mar 20)
    - Inline edit mode for ai_analysis fields
    - Edit overall_assessment, strengths, weaknesses, recommendation
    - PATCH /api/results/[id] supports ai_analysis field
    - Toast notifications for save/cancel actions

13. **Export PDF Report** (Added Mar 20)
    - Client-side PDF generation via jspdf
    - Export button in result header
    - PDF includes candidate info, score, AI analysis, notes, status, question breakdown
    - Professional formatting suitable for internal reporting

14. **System Settings Management** (Added Mar 29)
    - Admin-only settings page at `/dashboard/settings`
    - Auto-save PATCH endpoints for each setting (no form submission)
    - Categories: AI (model, temperature, token pricing), Assessment (defaults), Scoring (methods)
    - 10 seeded default settings for instant platform configuration
    - Type system: text, number, select, toggle, json input types

15. **Version Management Workflow** (Added Mar 29)
    - Version status lifecycle: draft → pending → approved → rejected → archived
    - Version categories (platform, assessment, etc.)
    - Creator tracking and admin approval controls
    - `/dashboard/versions` page with status filters
    - Integrated with version creation dialog

16. **Assessment Templates** (Added Mar 29)
    - Reusable test configuration templates
    - Global templates (admin-created) visible to all recruiters
    - Personal templates (user-created) private to owner
    - "Use Template" button auto-fills test creation form
    - Templates include: job_role, level, question_count, job_description, time_limit
    - CRUD endpoints at `/api/templates`

17. **Token Monitoring & Cost Tracking** (Added Mar 29)
    - Automatic AI usage logging via `logAiUsage()` utility
    - Fire-and-forget pattern (integrated in all 8 AI routes)
    - Tracks: user_id, feature, tokens_in, tokens_out, cost_estimate, model
    - Admin API (`GET /api/ai-usage`) with aggregations:
      - By day (time series chart)
      - By feature (breakdown pie chart)
      - Top 5 users (leaderboard table)
      - Total cost estimation
    - Configurable token pricing via system_settings

18. **Skill Framework Tables** (Added Mar 29)
    - Skill categories table (5 seeded defaults: Technical, Business Analysis, Communication, Soft Skills, Domain Knowledge)
    - Level-skill expectations table for position-specific requirements
    - Tracks: skill, level, position, expected_score (1-5), is_mandatory flags
    - Used for talent assessment and skill benchmarking

21. **Automated Version Management** (Added April 2)
    - Relocated scripts from `scripts/` to `.claude/scripts/`
    - Standardized Semantic Versioning (MAJOR.MINOR.PATCH)
    - Automated updates for `package.json`, `version.txt`, and `CHANGELOG.md`
    - Enforced tagging policy: forbidden on `dev`, mandatory on `release/*`
    - Mandatory interactive verification of release descriptions
    - Multi-remote push support (GitHub + GitLab) for code and tags

20. **Admin Dashboard Tab** (Added Mar 29)
    - 3rd tab in dashboard (Recruiter | Assessor | Admin)
    - Admin-specific KPI cards:
      - Tests created (total)
      - Average assessment score
      - Active recruiters count
      - Token usage (this period)
    - Visual components:
      - Daily token usage line chart
      - Feature breakdown pie chart
      - Active recruiters list (realtime)
    - Quick action links: Settings, Templates, Versions, Export
    - Server-side admin stats aggregation via Supabase queries

#### In Progress / Known Issues

1. **Code Quality Issues** 🔴 (Blocker for Phase 2)
   - `create/page.tsx` (796 LOC) - **URGENT: Needs refactoring to <200 LOC**
   - `dashboard-client.tsx` (402 LOC) - **Needs component extraction**
   - `users-client.tsx` (521 LOC) - **Needs logic splitting**

2. **Missing Features**
   - Automated testing (unit + E2E)
   - Rate limiting on API endpoints
   - Error boundary components
   - Request validation middleware
   - Performance monitoring

3. **Documentation Gaps**
   - API endpoint documentation
   - Deployment troubleshooting guide
   - Component library documentation
   - Contribution guidelines

#### Phase 1 Success Criteria (COMPLETE)

**Core MVP** ✓
- [x] Core features functional
- [x] Database schema complete (13 tables)
- [x] Authentication working (Supabase email/password, roles)
- [x] AI integration (OpenAI GPT-4o + Google fallback)
- [x] Deployment working (Vercel + Supabase production)

**Enhancements** ✓
- [x] Follow-up sessions feature
- [x] Interviewer notes capability
- [x] Candidate status (pass/fail) tracking
- [x] Result detail redesign (5-section layout)
- [x] Realtime updates (Supabase subscriptions)
- [x] Edit AI summary (inline editing)
- [x] PDF report export

**Admin Features** ✓
- [x] System settings management (auto-save pattern)
- [x] Version management (draft→approved workflow)
- [x] Assessment templates (reusable configs)
- [x] Token monitoring (logAiUsage, admin dashboard)
- [x] Skill framework (categories, expectations)
- [x] CSV export (results, candidates, skills)
- [x] Admin dashboard (KPIs, charts, quick links)

**Documentation** ✓
- [x] Architecture documented (✓ Complete - March 20, updated March 29)
- [x] Code standards documented
- [x] System architecture with admin flows

**Deferred to Phase 2** →
- [ ] All files < 200 LOC (Code quality target, in progress)
- [ ] Unit test coverage > 50% (Testing infrastructure)
- [ ] Rate limiting & security hardening
- [ ] Sentry monitoring integration
- [ ] Comprehensive API documentation

---

### Phase 2: Stabilization & Scale (Q2 2026)

**Planned Start**: April 1, 2026
**Duration**: 6-8 weeks
**Priority**: High (required before Phase 3)

#### Goals

1. **Code Quality & Maintainability**
   - Refactor oversized components (200 LOC limit)
   - Extract reusable custom hooks
   - Improve error handling and validation
   - Add comprehensive comments and JSDoc

2. **Testing Infrastructure**
   - Unit tests (React components, utilities, API routes)
   - Integration tests (Supabase + API flows)
   - E2E tests (critical user journeys)
   - Target coverage: 80%+ for critical paths

3. **Performance & Scalability**
   - Implement request caching
   - Optimize database queries
   - Add CDN caching headers
   - Performance monitoring (Vercel Analytics)

4. **Security Hardening**
   - Rate limiting on API endpoints
   - CSRF protection (Next.js built-in)
   - Input validation across endpoints
   - Security header configuration
   - Audit logging for sensitive operations

5. **Documentation Completion**
   - Comprehensive API documentation
   - Component storybook or library docs
   - Deployment troubleshooting guide
   - Developer contribution guide
   - Security guidelines

6. **Monitoring & Observability**
   - Sentry error tracking integration
   - Vercel Analytics setup
   - Database performance monitoring
   - Log aggregation and alerting

#### Deliverables

| Item | Owner | Status |
|------|-------|--------|
| Code refactoring (files <200 LOC) | Dev team | Not started |
| Unit test suite | QA team | Not started |
| E2E test suite | QA team | Not started |
| API documentation | Tech writer | Not started |
| Performance optimization | Dev team | Not started |
| Monitoring setup | DevOps | Not started |

#### Acceptance Criteria

- [x] All files under 200 LOC
- [x] 80%+ unit test coverage for critical paths
- [x] E2E tests for test creation → submission → analysis flow
- [x] Deployment guide with troubleshooting section
- [x] API documentation with examples
- [x] Sentry error tracking integrated
- [x] Performance benchmarks documented (< 2s page load, < 500ms API)

---

### Phase 3: Enterprise Features (Q3 2026)

**Planned Start**: June 1, 2026
**Duration**: 10-12 weeks
**Blockers**: Phase 2 completion

#### Features

1. **API Access** (Priority: High)
   - RESTful API for programmatic test creation
   - Webhook notifications (result submission, analysis complete)
   - API key management
   - Rate limits per API key
   - Documentation and SDKs (Node.js, Python)

2. **Batch Testing** (Priority: High)
   - Send test links to multiple candidates via CSV upload
   - Bulk email functionality
   - Candidate batch tracking
   - Bulk result export

3. **Performance Benchmarking** (Priority: Medium)
   - Cohort comparison (compare candidate against similar level)
   - Percentile ranking
   - Topic-level benchmarks
   - Trend analysis (over time)

4. **Custom Scoring** (Priority: Medium)
   - Define custom scoring rubrics
   - Weighted question scoring
   - Custom scoring criteria
   - Flexible pass/fail thresholds

5. **SSO / Enterprise Auth** (Priority: Medium)
   - SAML 2.0 support
   - OAuth integration (Google, Microsoft)
   - Directory sync (optional)
   - Multi-tenant support

6. **Data Export & Reporting** (Priority: Medium)
   - CSV export (results, analytics)
   - PDF report generation
   - Scheduled email reports
   - Compliance reports (SOC 2, etc.)

#### Estimated Effort

| Feature | Effort | Owner |
|---------|--------|-------|
| API Access | 60 hours | Backend team |
| Batch Testing | 40 hours | Backend + Frontend |
| Benchmarking | 50 hours | Data team |
| Custom Scoring | 35 hours | Backend |
| SSO | 45 hours | Backend + DevOps |
| Data Export | 30 hours | Backend + QA |

#### Success Criteria

- [x] API endpoints functional and documented
- [x] Batch testing reduces time to 1-click test distribution
- [x] Benchmarking shows in result detail page
- [x] Custom scoring available in test creation
- [x] SSO tested with major providers (Google, Microsoft, Okta)
- [x] Export covers 95%+ of reporting needs

---

### Phase 4: Advanced Features (Q4 2026+)

**Planned Start**: September 1, 2026
**Status**: Scoping in progress

#### Features (In Priority Order)

1. **Real-time Collaboration** (Q4 2026)
   - Multiple recruiters viewing same result simultaneously
   - Shared notes and comments
   - Real-time presence indicators
   - WebSocket integration

2. **Video Interview Integration** (Q4 2026)
   - Record candidate video responses
   - Optional video for specific questions
   - Video playback in recruiter dashboard
   - Video codec optimization (reduce storage)

3. **Skill Taxonomy** (Q1 2027)
   - Pre-built question library by skill/tech
   - Question tagging system
   - Full-text search across questions
   - Community contributions (moderated)

4. **ML-powered Recommendations** (Q1 2027)
   - Recommend follow-up questions using ML
   - Suggest candidate fit based on answers
   - Predict success metrics (optional)
   - Privacy-first approach (on-device where possible)

5. **Mobile App** (Q2 2027)
   - Native iOS app (React Native)
   - Native Android app (React Native)
   - Offline test-taking capability
   - Candidate and recruiter apps

6. **Advanced Analytics** (Q2 2027)
   - Funnel analysis (application → test → hire)
   - Time-to-hire metrics
   - Diversity analytics
   - Predictive hiring insights

---

## Roadmap Timeline

```
2026:
    Q1 (Jan-Mar)  [████████████░░░░░░░░] Phase 1 MVP (in final polish)
    Q2 (Apr-Jun)  [░░░░░░░░░░░░░░░░░░░░] Phase 2 Stabilization
    Q3 (Jul-Sep)  [░░░░░░░░░░░░░░░░░░░░] Phase 3 Enterprise
    Q4 (Oct-Dec)  [░░░░░░░░░░░░░░░░░░░░] Phase 4 Advanced

2027:
    Q1 (Jan-Mar)  [░░░░░░░░░░░░░░░░░░░░] Phase 4 Continued
    Q2 (Apr-Jun)  [░░░░░░░░░░░░░░░░░░░░] Phase 4 Completion
```

## Risk & Mitigation

### High-Risk Items

| Item | Risk | Mitigation |
|------|------|-----------|
| Phase 1 Code Quality | Oversized files block Phase 2 | Schedule refactoring sprint (2 weeks) |
| OpenAI Cost | Scaling could exceed budget | Implement caching + Google GenAI fallback |
| Database Growth | Performance degradation | Add indexes + archive old data |
| Team Velocity | May miss Phase 2 deadline | Break tasks into smaller sprints |

### Success Enablers

1. **Clear Priorities**: Focus on Phase 2 blockers before Phase 3 features
2. **User Feedback**: Regular check-ins with early adopters
3. **Team Communication**: Weekly standups + async updates
4. **Automated CI/CD**: Tests run before deployment
5. **Monitoring**: Catch issues early with observability

## Budget & Resource Allocation

### Team Composition

- **Backend Developer**: 1 FTE (API routes, database, auth)
- **Frontend Developer**: 1 FTE (UI, components, forms)
- **QA Engineer**: 0.5 FTE (testing, bug reports)
- **DevOps/Infrastructure**: 0.25 FTE (deployment, monitoring)
- **Product Manager**: 0.5 FTE (planning, prioritization)

### Budget Estimation

| Category | Monthly | Quarterly |
|----------|---------|-----------|
| Infrastructure (Vercel + Supabase) | $50 | $150 |
| OpenAI API (growth) | $200-500 | $600-1500 |
| Monitoring (Sentry, etc.) | $20 | $60 |
| **Total** | $270-570 | $810-1710 |

## Dependencies & Blockers

### Critical Path

```
Phase 1 (MVP Complete)
        ↓
Phase 2 Code Refactoring (BLOCKER for Phase 3)
        ↓
Phase 2 Testing (BLOCKER for GA)
        ↓
Phase 3 Enterprise Features
        ↓
Phase 4 Advanced Features
```

### External Dependencies

- **OpenAI API**: Stability and availability
- **Supabase**: Database performance and uptime
- **Vercel**: Deployment and serverless performance
- **Market Feedback**: User adoption and feature priorities

## Success Metrics by Phase

### Phase 1 (MVP)
- **Adoption**: 10+ beta users
- **Features**: All core features working
- **Quality**: Zero critical bugs in production
- **Performance**: < 2s page load (p90)
- **Uptime**: 99%+ availability

### Phase 2 (Stabilization)
- **Adoption**: 50+ active users
- **Tests Created**: 100+ tests
- **Test Coverage**: 80%+ critical paths
- **Code Quality**: All files < 200 LOC
- **Performance**: < 500ms API response (p95)

### Phase 3 (Enterprise)
- **Adoption**: 200+ active users
- **Tests Created**: 1000+ tests
- **API Usage**: 50%+ of tests created via API
- **Batch Testing**: 200+ candidates per batch
- **Revenue**: Generate sustainable revenue (optional)

### Phase 4 (Advanced)
- **Adoption**: 1000+ active users
- **Tests Created**: 10,000+ tests
- **Mobile**: 30% access via mobile
- **Video**: 20% of candidates using video
- **Revenue**: Recurring revenue model

## Communication & Updates

### Stakeholder Updates

- **Weekly**: Team standups (internal)
- **Bi-weekly**: User feedback sessions with early adopters
- **Monthly**: Public roadmap updates
- **Quarterly**: Major milestone announcements

### Change Log

**April 2, 2026**:
- **Automated Version Management**: New `npm run version` command
- **Script Relocation**: Moved all utility scripts to `.claude/scripts/` to declutter root
- Updated `versioning-standard.md` with strict branching rules

**March 29, 2026**:
**March 1, 2026**: MVP launched with core features

## Conclusion

The ITBAAI roadmap is designed to:
1. **Stabilize MVP** (Phase 1 → 2): Ensure code quality and test coverage
2. **Scale Operations** (Phase 2 → 3): Add enterprise features for growth
3. **Differentiate** (Phase 3 → 4): Build advanced AI-powered features

Each phase builds on the previous, with clear success criteria and milestone checkpoints. Regular feedback loops with users ensure the roadmap reflects market needs.

**Next Milestone**: Phase 2 start (April 1, 2026)
- Refactor oversized components
- Implement comprehensive test suite
- Complete deployment documentation
