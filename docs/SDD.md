# Software Design Document (SDD)
> **Version:** 2.0 | **Status:** HARDENING REQUIRED
> **Last Updated:** 2026-05-16 | **Classification:** INTERNAL · ENGINEERING
> **Audit Basis:** System Analysis Report v2.0 · Overall Score: 38/100

---

## ⚠️ AUDIT VERDICT: PROTOTYPE-GRADE ONLY

> **Senior Engineering Council Ruling:** The system architecture exhibits a "Serverless Monolith" anti-pattern with critical liabilities in auth, multi-tenancy isolation, observability, and infrastructure reproducibility. All design decisions below are annotated with their audit standing.

---

## 1. System Architecture Overview

### 1.1 Architectural Pattern
- **Framework:** Next.js 15 (App Router) — full-stack monolith
- **Execution Model:** Serverless (Netlify). **RISK:** Cold starts and WAF-Lite middleware latency bottleneck at serverless tier
- **Language:** TypeScript. **NOTE:** Type-safety is bypassed in complex Mongoose aggregations ("Any-Script" problem)
- **🔴 AUTH SMELL — BLOCKER:** Custom JWT implementation instead of OIDC/NextAuth. High probability of implementation flaws. This is the #1 security liability.
- **🔴 ISOLATION SMELL:** `institutionId` filter-based isolation is logic-level only. A single missing clause causes global cross-tenant data leakage. Immediate blocker for B2B.
- **🟠 LOGIC BLEED:** Service layers exist in name but God Components still hold significant business logic. Repository abstraction is incomplete.
- **🔴 INFRASTRUCTURE BLINDNESS:** No IaC (Terraform/Pulumi). Environment state is "floating". DR scenario = 24-hour manual process.

### 1.2 Architecture Decision Records (ADRs) — REQUIRED

| Decision | Current State | Audit Finding | Required Action |
|----------|--------------|---------------|-----------------|
| Auth Strategy | Custom JWT | 🔴 BLOCKER | Replace with NextAuth.js + RS256 |
| Multi-tenancy | institutionId filter | 🔴 BLOCKER | Add RLS patterns + isolation test suite |
| IaC | None (Click-Ops) | 🔴 BLOCKER | Implement Terraform for all managed services |
| Observability | Sentry only | 🟠 HIGH | Add OpenTelemetry + structured JSON logging |
| AI Safety | Review layer only | 🟠 HIGH | Add prompt firewall + token budgets |
| WAF Position | Serverless middleware | 🟠 HIGH | Move to Edge layer |
| Idempotency | None | 🟠 HIGH | Implement request IDs + idempotency keys |

---

## 2. Infrastructure Modules

- **Environment Manager (`src/lib/env.ts`):** Centralized strict environment validation at runtime using Zod. ✅ Correct approach — maintain.
- **Database Connectivity (`src/lib/mongoose.ts`):** Resilience engine with failover support. Connection pooling configured. **GAP:** No connection-level metrics exported to observability stack.
- **Logging Service (`src/lib/logger.ts`):** Unified service (Info, Warn, Error, Security). **CRITICAL GAP:** Logs must be structured JSON only. No `console.log` in production. Add `requestId` and `userId` context to every log line.
- **🔴 MISSING: Idempotency Service** — No `src/lib/idempotency.ts`. All Server Action mutations are vulnerable to double-write on network retry.

---

## 3. Data Model (MongoDB/Mongoose)

- **Audit Finding (DBA 3/10):** MongoDB used for relational-heavy academic data. Schema is brittle. Complex aggregations lack formalized testing.
- **Recommended:** Formalize aggregation pipeline tests. Consider PostgreSQL evaluation for relational integrity if scaling past 500K users.

### Active Models
- Users, Courses, Quizzes, Attempts, Enrollments, Feedback, Announcements, Assignments, Submissions, Classrooms, Notes, Complaints, AuditLog (TTL 90d), SystemLog, PlacementDrive, PlacementApplication, PlacementProfile

### Required Schema Additions
- **All mutation models:** Add `idempotencyKey` field (sparse unique index) to prevent double-writes
- **AuditLog:** Add `requestId` field for distributed tracing correlation
- **User:** Add `oidcSub` field (for NextAuth migration path)

---

## 4. Security Architecture — REQUIRES OVERHAUL

### 4.1 Current State (Audit: Security 2/10 · IAM 2/10)
- Custom JWT with HttpOnly cookies — functional but not enterprise-grade
- 4-tier RBAC at Server Action level — implemented but formally unverified
- WAF-Lite via Upstash Redis middleware — **LATENCY BOTTLENECK** at serverless tier
- Zod validation on all inputs — ✅ correct

### 4.2 Required Changes (Phase 16)

**Auth Overhaul:**
```
REPLACE: Custom jsonwebtoken implementation
WITH:    NextAuth.js v5 (App Router compatible)
         - OIDC-compliant session management
         - RS256 asymmetric signing (not HS256)
         - Built-in CSRF protection
         - Google OAuth adapter (drop current custom implementation)
         - Database adapter for session persistence
```

**Secret Management:**
```
REPLACE: Netlify environment variable UI
WITH:    Doppler (immediate) → HashiCorp Vault (post-Series A)
         - Automated 90-day JWT secret rotation
         - Audit trail on all secret access
         - Environment-level isolation (dev/staging/prod)
```

**Network Isolation:**
```
ADD: MongoDB Atlas Private Link / VPC Peering
     - Restrict Atlas access to Netlify IP ranges only
     - No public internet access to database
ADD: Upstash Redis Private Link (available on paid tier)
```

**WAF Relocation:**
```
MOVE: Rate limiting from Next.js middleware → Netlify Edge Functions
      - Execute at CDN edge, not in serverless runtime
      - Eliminates cold-start latency on WAF evaluation
```

### 4.3 Threat Model (STRIDE — Required)
- **Spoofing:** JWT forgery risk (mitigated by RS256 migration)
- **Tampering:** Server Actions without idempotency (fix: idempotency keys)
- **Repudiation:** AuditLog covers critical actions ✅
- **Information Disclosure:** Cross-tenant leak via missing institutionId filter (fix: RLS patterns + test suite)
- **Denial of Service:** Rate limiting at serverless tier (fix: move to Edge)
- **Elevation of Privilege:** Client-side role trust risk (mitigated by server-side RBAC verification)

---

## 5. Multi-Tenancy Architecture — CRITICAL REDESIGN

### Current State (Multi-Tenant Architect: 2/10)
- Logic-level isolation via `institutionId` filter on all queries
- **RISK:** Single developer error (missing filter) = catastrophic cross-tenant leak
- No automated test suite verifying isolation boundaries

### Required Pattern (Phase 16)
```typescript
// REQUIRED: Repository-level enforcement pattern
// Every repository method must enforce institutionId automatically
// Never rely on call-site remembering to add the filter

class BaseRepository<T> {
  protected model: Model<T>;
  
  async find(query: FilterQuery<T>, institutionId: string): Promise<T[]> {
    // institutionId is a required parameter — not optional
    return this.model.find({ ...query, institutionId, deletedAt: null });
  }
  
  // All mutation methods similarly enforce institutionId
}
```

```typescript
// REQUIRED: Integration test suite for tenant isolation
// Must run in CI on every PR
describe('Tenant Isolation', () => {
  it('Student from Institution A cannot read Institution B courses', ...)
  it('Teacher from Institution A cannot modify Institution B quizzes', ...)
  it('Admin from Institution A cannot access Institution B users', ...)
  // 20+ isolation test cases minimum
});
```

---

## 6. Service & Repository Layer

```
src/services/     — Business logic, orchestration, RBAC checks
src/repositories/ — Direct Mongoose calls, institutionId enforced at base class level
src/lib/          — Infrastructure: logger, mongoose, env, idempotency, auth

RULE: No UI component may call Mongoose directly
RULE: All repositories extend BaseRepository (institutionId enforcement)
RULE: All Server Actions call services, never repositories directly
```

**Audit Finding (Solutions Architect 4/10):** Logic still bleeds into God Components. Enforce Hexagonal Architecture boundaries. Service layer must be the only entry point to business logic.

---

## 7. Key Infrastructure Files

| File | Status | Action Required |
|------|--------|-----------------|
| `src/lib/env.ts` | ✅ Correct | Maintain |
| `src/lib/mongoose.ts` | ✅ Functional | Add connection metrics export |
| `src/lib/logger.ts` | 🟠 Needs Work | Enforce structured JSON, add requestId/userId context |
| `src/middleware.ts` | 🔴 Bottleneck | Move WAF to Edge Functions |
| `src/lib/auth.ts` | 🔴 REPLACE | Migrate to NextAuth.js v5 |
| `src/lib/idempotency.ts` | 🔴 MISSING | Create — idempotency key enforcement |
| `src/lib/ai-safety.ts` | 🔴 MISSING | Create — prompt firewall + token budget |

---

## 8. State Management

- **Server state:** React Query (SWR pattern for dashboard data) ✅
- **Client UI state:** Zustand (user session, preferences) ✅
- **Form state:** React Hook Form + Zod resolvers ✅
- **Gap:** No optimistic update rollback strategy on mutation failure

---

## 9. Observability Architecture — REQUIRES UPGRADE

### Current State (SRE 2/10)
- Sentry: error tracking ✅
- Better Uptime: uptime monitoring ✅
- Custom logger: unstructured, inconsistent ❌
- Distributed tracing: NONE ❌
- Metrics: NONE ❌

### Required State (Phase 17)
```
OpenTelemetry SDK → Trace every Server Action and DB query
Structured JSON Logs → Every log line has: timestamp, level, requestId, userId, institutionId, route, duration
Metrics → p50/p95/p99 latency per route, error rates, DB query times
Alerting → PagerDuty or similar for SLO breaches
Dashboard → Grafana or Datadog for unified view
```

---

## 10. AI Safety Architecture — REQUIRES IMPLEMENTATION

### Current State (AI Governance 1/10)
- Gemini integration via Genkit — direct-to-teacher output
- Human review step before publish ✅
- No prompt injection protection ❌
- No token budget ❌
- No PII detection in prompts ❌
- No semantic caching ❌

### Required State (Phase 18)
```typescript
// src/lib/ai-safety.ts — REQUIRED

interface AIRequest {
  prompt: string;
  userId: string;
  institutionId: string;
}

class AISafetyLayer {
  async validate(req: AIRequest): Promise<void> {
    await this.checkPromptInjection(req.prompt);   // Block jailbreaks
    await this.checkPIIInPrompt(req.prompt);        // Block PII leakage
    await this.enforceTokenBudget(req.userId);      // Hard cost limits
  }
  
  async deduplicate(req: AIRequest): Promise<string | null> {
    return this.semanticCache.get(req.prompt);      // Avoid repeat API calls
  }
  
  async scoreHallucination(response: string): Promise<number> {
    // Flag low-confidence outputs before teacher review
  }
}
```

---

## 11. Deployment Architecture

```
GitHub → GitHub Actions CI (lint→typecheck→test→build→security scan)
       → Netlify CD (auto-deploy main, PR previews)
       → MongoDB Atlas (replica set, M10+, Private Link)
       → Upstash Redis (serverless, Edge-connected)
       → Cloudinary (media CDN)
       → Sentry (error tracking)
       → OpenTelemetry → Grafana/Datadog (Phase 17)
       → Doppler (secrets management — Phase 16)
```

### Infrastructure as Code (Phase 17 — REQUIRED)
```hcl
# terraform/main.tf — MUST BE CREATED
# Defines: MongoDB Atlas cluster, Upstash Redis, Cloudinary config,
# Netlify site, DNS, environment variable bindings
# Enables: 5-minute environment recreation vs current 24-hour manual process
```

---

## 12. Disaster Recovery — VERIFIED PLAN REQUIRED

| Element | Current State | Required State |
|---------|--------------|----------------|
| Backups | Atlas auto-backup ✅ | Verified with tested restore ❌ |
| RTO | Unknown | Target: < 4 hours |
| RPO | Unknown | Target: < 1 hour |
| DR Drill | Never conducted | Quarterly automated drills |
| Cross-region | None | Atlas multi-region replica (Phase 17) |

---

## 13. Deferred Architecture

- Docker + docker-compose (Phase 15 — VPS white-label delivery)
- Nginx reverse proxy + Certbot SSL (Phase 15)
- Terraform/Pulumi IaC (Phase 17 — NO LONGER DEFERRED — now mandatory)
- Kubernetes orchestration (post-Series A)
- SSO/SAML (Phase 20)
- Multi-region active-active (post-Series A)

---

*SDD v2.0 · May 2026 · Revised per System Analysis Report BRUTAL AUDIT v2.0*
*Previous SDD v1.1 status "Architecture verified" was INCORRECT — significant gaps identified*