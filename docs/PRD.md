# Product Requirements Document (PRD)
> **Version:** 3.0 | **Status:** HARDENING PHASE — NOT Production-Ready
> **Last Updated:** 2026-05-16 | **Classification:** INTERNAL · PRODUCT
> **Audit Basis:** System Analysis Report v2.0 (BRUTAL AUDIT) · Score: 38/100

---

## ⚠️ EXECUTIVE AUDIT VERDICT

| Risk Dimension | Status |
|---|---|
| Production Risk | 🔴 CATASTROPHIC |
| Technical Debt | 🔴 CRITICAL |
| Scalability Confidence | 🟠 LOW (20%) |
| Investor Readiness | 🔴 REJECTED |
| Operational Maturity | 🔴 1.5/10 |
| Security Posture | 🟠 THEATER |

> **Board Directive:** All enterprise client exposure and production traffic is STRICTLY PROHIBITED until the Foundational Hardening Phase (Phases 16–20 below) is completed. The system is a functionally complete prototype, not a production-grade platform.

---

## 1. Product Overview

| Field | Value |
|-------|-------|
| **Product Name** | Campus Hub |
| **Type** | B2B SaaS Learning Management System (LMS) |
| **Deployment** | Netlify (hosted) · VPS/self-hosted (white-label, Phase 15) |
| **Target Market** | Academic institutions — universities, colleges, training academies |
| **Actual Status** | 🔴 **PROTOTYPE-COMPLETE, ENTERPRISE-REJECTED** — Foundational hardening required |

**Description:** Campus Hub is a B2B SaaS LMS supporting the full academic lifecycle. It is functionally complete across 14 phases but fundamentally **unstable for enterprise production** due to: custom JWT auth liabilities, logic-level multi-tenant isolation, infrastructure blindness (no IaC), shallow testing coverage, and absent disaster recovery.

---

## 2. Target Users & Roles

| Role | Responsibilities | Access Level |
|------|-----------------|--------------|
| **Student** | Consume course content, take timed assessments, submit feedback | Lowest |
| **Teacher** | Create/publish quizzes, manage course content, track student performance | Mid |
| **Administrator** | Manage staff, create courses, assign teachers, view leaderboards | High |
| **Super Admin** | Full platform governance, system monitoring, compliance oversight | Highest |

---

## 3. Critical Failure Analysis (Audit v2.0)

### 3.1 Auth Trap — Highest Priority Blocker
- Custom JWT implementation is the project's single biggest liability
- Missing: MFA, session federation, OIDC compliance, formal rotation policy
- **Impact:** Immediate blocker for any B2B/enterprise acquisition
- **Fix:** Replace with NextAuth.js (OIDC-compatible) + asymmetric key signing

### 3.2 Multi-Tenancy Weakness — CATASTROPHIC Risk
- `institutionId` filter-based isolation = logic-level only
- One missing `where institutionId =` clause = global cross-tenant data leak
- **Impact:** Zero-tolerance failure in B2B SaaS. Legal and reputational destruction
- **Fix:** Row-Level Security patterns or per-tenant DB collections (Phase 16)

### 3.3 Infrastructure Blindness
- No IaC (Terraform/Pulumi). Entire environment state is "floating" in Netlify UI
- Disaster recovery scenario = 24-hour manual reconstruction, not 5-minute automated restore
- **Fix:** Terraform/Pulumi for all managed service provisioning (Phase 17)

### 3.4 AI Recklessness
- Gemini direct-to-user with only a thin human review layer
- No semantic caching, token budget, hallucination filter, or PII detector
- One abuse scenario = $10,000+ in API costs or harmful content in minutes
- **Fix:** Prompt firewall + token quotas + semantic cache + PII detection (Phase 18)

### 3.5 Distributed Systems Gaps
- Zero idempotency handling in Server Actions
- Double-click = double DB write (duplicate quiz submissions, duplicate payments)
- **Fix:** Request IDs + idempotency keys on all mutation endpoints

### 3.6 Disaster Recovery — NOT VERIFIED
- Backups exist in Atlas but no tested RTO/RPO
- No DR drill conducted. No cross-region restore tested
- **Impact:** One region failure or data corruption = permanent business death

---

## 4. Functional Requirements

### 4.1 Super Admin Features
- Institutional governance dashboard with full platform control
- Advanced Analytics Hub: user growth, registration trends, performance metrics (Recharts)
- Feedback moderation: review, approve, hide, or delete student testimonials
- Global role management: create, assign, revoke roles with full audit trail
- System monitoring: security logs, errors, suspicious activity
- User lookup, force password reset, bulk enrollment via internal admin dashboard
- Paginated audit log viewer with level and date range filters
- Reconciliation history: view all daily payment reconciliation runs

### 4.2 Administrator Features
- Per-quiz and academic-wide leaderboards (paginated)
- Staff management CRUD (Teacher accounts) with soft-delete
- Course establishment: modules, course codes, curriculum targets
- Faculty assignment: dynamically assign Teachers to Courses
- Bulk import/export for staff and student data

### 4.3 Teacher Features
- Course Control Center dashboard
- Performance tracking: quiz results and student accuracy leaderboards
- Assessment Suite: create interactive, timed, published/unpublished quizzes
- **AI quiz generation:** input topic → Gemini generates questions → mandatory review step → publish
- Interactive course-wide announcements
- Assignment creation with file attachments via Cloudinary

### 4.4 Student Features
- Personalized dashboard: progress tracking, accuracy metrics, milestones
- Secure timed exam engine with **server-enforced one-attempt policy**
- Testimonial/feedback submission with moderation workflow
- Course discovery and enrollment interface
- Progress visualization (completion %, accuracy over time)

### 4.5 AI Features (Genkit / Gemini) — HARDENING REQUIRED
- AI quiz generation: Teacher-prompted → AI generates → review step → publish
- AI System Analysis Report: Super Admin can generate an AI-written platform health summary
- **NEW: Prompt firewall** — block PII injection and prompt injection attacks
- **NEW: Token budget enforcement** — hard limit per user/session/day
- **NEW: Semantic response caching** — deduplicate near-identical AI calls
- **NEW: Hallucination scoring** — flag low-confidence AI outputs before review
- All AI endpoints: rate-limited (5 req/min), server-only, never expose API keys to client
- Mandatory human review step before any AI-generated content goes live

---

## 5. Non-Functional Requirements

### 5.1 Security — REQUIRES OVERHAUL
- **REPLACE** custom JWT with NextAuth.js / OIDC-compliant auth
- **ADD** asymmetric key signing (RS256) for JWT tokens
- **ADD** formal secret rotation policy (Doppler + 90-day automated rotation)
- **ADD** VPC Peering / Private Link between Netlify and MongoDB Atlas
- 4-tier RBAC enforced at every Server Action (never trust client-side role)
- HttpOnly, Secure, SameSite=Strict cookies + session expiry
- WAF-Lite: 50 req/min global, 5 req/min on auth endpoints (Upstash Redis)
- All inputs validated via Zod before any DB operation
- Full HTTP security header suite (CSP, HSTS, X-Frame-Options, etc.)
- Account lockout after N failed logins; session invalidated on role/password change
- **ADD** formal threat model (STRIDE) documented

### 5.2 Performance
- p99 latency target: < 500ms for authenticated routes
- **WAF-Lite MUST move to Edge layer** — current serverless middleware causes latency bottleneck
- All list endpoints paginated (max 100 items/page)
- Redis caching for leaderboards, course lists, analytics data
- Code-split route bundles; skeleton loaders for all async operations

### 5.3 Compliance — REQUIRES FORMAL PROOF
- GDPR: explicit consent (banner insufficient — formal consent management platform required)
- Right-to-deletion: endpoint must be formally tested and audited
- Data export endpoint: must be formally audited
- Data masking in logs: must be verified, not assumed
- Audit logs: append-only, TTL-managed, covering all critical state changes
- SOC2 Type I: formal documentation + evidence collection must begin
- **NEW: Data lifecycle documentation** — all data flows formally mapped

### 5.4 Reliability & Operability — REQUIRES PROOF
- SLO: 99.9% availability, p99 < 500ms, error rate < 0.1%
- **Uptime monitoring active** (Better Uptime)
- **Structured JSON logging** via `src/lib/logger.ts` — no console.log in production
- **OpenTelemetry distributed tracing** — required before production
- **Automated DR drill** — must be conducted and documented before launch
- **Tested RTO/RPO** — restore procedure verified, not assumed
- Runbooks: top 5 incident types documented and reviewed

### 5.5 Scalability
- MongoDB Atlas with replica set failover and connection pooling
- **ADD idempotency keys** to all mutation endpoints
- Upstash Redis for distributed rate limiting across serverless instances
- Multi-tenant isolation: `institutionId` on all models (+ formal isolation test suite)
- All list queries use compound indexes
- **Cost modeling:** Atlas + Upstash costs modeled for 1M+ quiz attempts

---

## 6. Hardening Phases (New — Post-Audit)

| Phase | Focus | Priority |
|-------|-------|----------|
| Phase 16 | Auth Overhaul (NextAuth/OIDC) + Idempotency | 🔴 CRITICAL |
| Phase 17 | IaC (Terraform) + DR Drill + VPC Peering | 🔴 CRITICAL |
| Phase 18 | AI Safety Layer (Firewall + Budget + Cache) | 🟠 HIGH |
| Phase 19 | Compliance Formalization (SOC2 evidence, GDPR proof) | 🟠 HIGH |
| Phase 20 | Enterprise Readiness (SSO/SAML, SLA Monitoring, Multi-region) | 🟡 MEDIUM |

---

## 7. Out of Scope (Current Phase)

- Native mobile app (iOS/Android)
- LTI/SCORM/xAPI interoperability (documented for Phase 21+)
- Kubernetes / container orchestration (deferred to post-Series A)
- Docker / VPS self-hosted deployment (Phase 15 — activates on first white-label customer)

---

*PRD v3.0 · Updated per System Analysis Report BRUTAL AUDIT v2.0 · May 2026*
*Previous v2.0 status "Production-Ready GA" was INCORRECT — downgraded to HARDENING PHASE*