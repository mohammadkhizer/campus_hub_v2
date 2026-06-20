# Technology Stack
> **Version:** 2.0 | **Status:** HARDENING REQUIRED
> **Last Updated:** 2026-05-16 | **Classification:** INTERNAL · ENGINEERING
> **Audit Basis:** System Analysis Report v2.0 · Overall Score: 38/100

---

## ⚠️ STACK AUDIT VERDICT

> **Senior Engineering Council Ruling:** The chosen stack (Netlify + Atlas + Upstash) is a viable "Low Ops" foundation for a startup but creates severe vendor lock-in and obscures infrastructure costs at scale. Performance monitoring is fragmented across 5+ external dashboards with no unified observability layer. Critical security gaps in the auth layer require immediate stack changes.

---

## 🔴 IMMEDIATE REQUIRED CHANGES

| Component | Current | Replace With | Priority | Reason |
|-----------|---------|-------------|----------|--------|
| Auth | `jsonwebtoken` (custom) | `next-auth` v5 | 🔴 CRITICAL | Custom JWT = security liability, no MFA, no OIDC |
| Secrets | Netlify env UI | Doppler | 🔴 CRITICAL | No rotation, no audit trail, exposed in UI |
| Logging | Unstructured console | Structured JSON + OTel | 🟠 HIGH | Debugging production takes hours |
| AI Safety | None | Custom `ai-safety.ts` | 🟠 HIGH | Token abuse + hallucination risk |
| IaC | None (Click-Ops) | Terraform | 🔴 CRITICAL | DR scenario = 24hr manual process |

---

## Core Technologies

| Technology | Version | Audit Status |
|---|---|---|
| **Framework:** Next.js | 15 (App Router) | ✅ Correct choice |
| **Language:** TypeScript | Latest | ⚠️ Bypassed in Mongoose aggregations — enforce strict mode |
| **Runtime:** Node.js | v18+ | ✅ Pin in `.nvmrc` |

---

## Frontend

| Library | Purpose | Audit Status |
|---|---|---|
| React | 19 | ✅ |
| Tailwind CSS | Styling | ✅ |
| Radix UI | Component primitives | ✅ — but ARIA implementation inconsistent |
| Framer Motion + tailwindcss-animate | Animations | ✅ |
| React Hook Form + Zod | Forms & validation | ✅ |
| Recharts | Data visualization | ✅ |
| react-markdown | Markdown rendering | ✅ |
| clsx, tailwind-merge, class-variance-authority | UI utilities | ✅ |
| lucide-react | Icons | ✅ |

**Frontend Gaps:**
- Virtual scrolling not implemented for large lists (leaderboards 500+ rows)
- Optimistic UI rollback strategy missing on mutation failure
- ARIA implementation inconsistencies across icon-only buttons

---

## Backend & Database

| Library | Purpose | Audit Status |
|---|---|---|
| MongoDB | Database | ⚠️ Relational-heavy data in document DB — formalize aggregation tests |
| Mongoose v9 | ODM | ⚠️ No base repository class enforcing institutionId |
| @upstash/redis | Caching + Rate Limiting | ⚠️ WAF at serverless tier causes latency — move to Edge |
| **jsonwebtoken** | **JWT auth** | **🔴 REPLACE WITH next-auth** |
| bcryptjs | Password hashing | ✅ — verify ≥ 12 rounds |
| @react-oauth/google + google-auth-library | Google OAuth | 🟡 Migrate to NextAuth Google adapter |

**Required Additions:**
```json
{
  "next-auth": "^5.0.0",           // Replace custom JWT
  "doppler-env": "latest",         // Secrets management
  "@opentelemetry/sdk-node": "^0.51.0",  // Distributed tracing
  "@opentelemetry/auto-instrumentations-node": "latest"
}
```

---

## AI & Integrations

| Library | Purpose | Audit Status |
|---|---|---|
| Genkit (@genkit-ai/google-genai) | Gemini AI integration | 🔴 No safety layer — add prompt firewall |
| Cloudinary | Media management | ✅ |
| Nodemailer | Email services | ✅ |
| pdf-parse | Document parsing | ✅ |

**AI Stack Required Additions:**
- Semantic cache layer (Redis-backed, hash prompts to avoid duplicate API calls)
- Token budget enforcement middleware
- PII detection before prompt submission
- Hallucination confidence scoring on AI output

---

## Secrets Management — FULL REPLACEMENT

| Current | Required |
|---------|----------|
| Netlify environment variable UI | Doppler (immediate) |
| No rotation policy | 90-day automated JWT secret rotation |
| No access audit trail | Full Doppler audit log |
| Shared across environments | Per-environment isolation (dev/staging/prod) |

```bash
# Phase 16 — Doppler Integration
npm install doppler-env
# All env vars sourced from Doppler, not Netlify UI
# Netlify build: doppler run -- npm run build
```

---

## Testing & Quality

| Tool | Purpose | Audit Status |
|---|---|---|
| Jest + ts-jest | Unit tests | ⚠️ Happy-path focused — add property-based testing |
| mongodb-memory-server | Integration tests | ✅ |
| Playwright | E2E tests | ⚠️ Coverage unknown — requires CI integration |
| k6 | Load tests | ⚠️ Run against staging, not just local |
| OWASP ZAP | Security scan | ⚠️ Not in CI pipeline |
| Snyk + TruffleHog/GitLeaks | Security scanning | ✅ |

**Required Additions:**
- `fast-check` — property-based testing for auth and RBAC logic
- Tenant isolation test suite (20+ test cases, runs in CI)
- Chaos testing (inject failures in DB, Redis, AI endpoints)

---

## Observability & Monitoring — REQUIRES OVERHAUL

| Tool | Current Status | Required |
|---|---|---|
| Sentry | ✅ Active | Maintain — add session replay |
| Better Uptime | ✅ Active | Maintain |
| Custom logger | 🔴 Unstructured | Replace with structured JSON + OTel context |
| OpenTelemetry | ❌ Missing | Install and instrument immediately (Phase 17) |
| Distributed tracing | ❌ Missing | Required before production |
| Unified metrics dashboard | ❌ Missing | Grafana or Datadog (Phase 17) |
| Alerting / On-call | ❌ Missing | PagerDuty integration |

**OpenTelemetry Implementation:**
```typescript
// src/instrumentation.ts (Next.js 15 — auto-loaded)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  serviceName: 'campus-hub',
  instrumentations: [getNodeAutoInstrumentations()],
  // Export to Grafana Tempo or Datadog
});

sdk.start();
```

---

## CI/CD & DevOps

| Tool | Status | Notes |
|---|---|---|
| GitHub Actions | ✅ | Add security scan and tenant isolation test steps |
| Netlify CD | ✅ | Move WAF to Edge Functions |
| netlify.toml | ✅ | Maintain |
| CodeClimate + ESLint | ✅ | Enforce in CI, zero bypass |

**CI Pipeline Required Steps (in order):**
1. Lint + Type-check
2. Unit tests (≥ 70% coverage gate)
3. Tenant isolation tests (MUST PASS)
4. Integration tests
5. Security scan (Snyk + OWASP ZAP)
6. Secret scan (TruffleHog)
7. Build
8. Bundle size check
9. E2E tests (against Netlify preview URL)
10. Lighthouse CI

---

## Security Tooling

| Tool | Status | Notes |
|---|---|---|
| TruffleHog (pre-commit) | ✅ | Maintain |
| Snyk / Dependabot | ✅ | Block PRs on HIGH+ CVEs |
| OWASP ZAP | 🟠 Not in CI | Add to CI pipeline |
| Doppler | 🔴 PENDING | Phase 16 — critical |

---

## Infrastructure (Managed Services)

| Service | Status | Audit Finding |
|---|---|---|
| Netlify (hosting) | ✅ Active | Move WAF to Edge Functions |
| MongoDB Atlas | ✅ Active | Add Private Link; restrict to Netlify IPs only |
| Upstash Redis | ✅ Active | Model costs for 1M+ operations |
| Cloudinary | ✅ Active | Validate MIME type before upload |
| Nodemailer (SMTP) | ✅ Active | Add rate limiting on email sends |
| Doppler (secrets) | 🔴 PENDING | Highest priority infrastructure addition |
| Terraform | 🔴 MISSING | Environment is "floating" — must be codified |

**Cost Modeling Required:**
```
MongoDB Atlas M10: ~$57/month base
  → At 1M quiz attempts: model read/write units
Upstash Redis: pay-per-request
  → At 10M rate-limit checks: model costs
Gemini API: per-token billing
  → Without token budgets: unbounded spend risk
```

---

## Infrastructure as Code (Phase 17 — NOW MANDATORY)

```hcl
# terraform/
#   ├── main.tf          — Provider config
#   ├── atlas.tf         — MongoDB Atlas cluster
#   ├── upstash.tf       — Redis instance
#   ├── netlify.tf       — Site + deploy config
#   └── variables.tf     — All config as code

# Enables:
#   - 5-minute environment recreation
#   - Auditable infrastructure changes via git
#   - Identical dev/staging/prod environments
#   - White-label customer provisioning automation
```

---

## Deferred Stack

- Docker + docker-compose (Phase 15 — VPS customer delivery)
- Nginx + Certbot (Phase 15)
- Kubernetes (post-Series A)
- HashiCorp Vault (post-Series A — Doppler for now)
- Multi-region Atlas (Phase 17 target — post-Series A for full active-active)

---

*Techstack v2.0 · May 2026 · Revised per System Analysis Report BRUTAL AUDIT v2.0*
*Previous v1.1 "all managed services, no IaC yet" understated risk — IaC is now MANDATORY, not optional*