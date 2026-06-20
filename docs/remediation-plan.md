# Production Hardening & Remediation Plan (v1.0)

This plan outlines the critical engineering steps required to move CampusHub from its current "Security Theater" state to an enterprise-grade production environment.

## 🔴 Priority 1: Security & AuthN/AuthZ Hardening
**Board Finding:** Middleware lacks token verification. Server Actions lack authorization checks.
- [x] **Middleware Hardening:** Implement JWT signature verification and session health checks in `src/middleware.ts`.
- [x] **Action Factory Enforcement:** Refactor all raw Server Actions to use the `createAction` factory in `src/lib/action-factory.ts`.
- [x] **Session Enrichment:** Update `getSessionAction` to include `institutionId` and `role` validation against the database on every sensitive call.
- [x] **Secret Rotation:** Move `JWT_SECRET` to a managed secret store pattern and implement a rotation strategy (RS256 ready).

## 🔴 Priority 2: Multi-Tenancy Isolation
**Board Finding:** Cross-tenant data leakage is currently possible.
- [x] **Global Query Scoping:** Update all models to use a Mongoose plugin or middleware that automatically injects `{ institutionId: session.institutionId }`.
- [x] **Creation Guard:** Ensure all `create` operations in Server Actions explicitly set the `institutionId` from the current session.
- [x] **Validation Guard:** Add a check in `createAction` that prevents any query from proceeding without an `institutionId` unless explicitly allowed.

## 🟠 Priority 3: Reliability & Observability
**Board Finding:** The system is "floating" without formal infrastructure management.
- [x] **Infrastructure as Code (IaC):** Begin transition to Terraform for managing MongoDB Atlas, Upstash, and Cloudinary configurations.
- [x] **Structured Logging:** Standardize all `logger` calls to use JSON format with consistent fields (correlationId, userId, institutionId).
- [x] **Error Boundaries:** Implement global error handling (`GlobalErrorBoundary.tsx`) that masks internal stack traces while logging full details.

## 🟡 Priority 4: Testing Maturity
**Board Finding:** 94% checklist is a vanity metric.
- [x] **Integration Tests:** Add Jest tests for all `createAction` handlers to verify RBAC and Isolation (`tests/integration/tenant-isolation.test.ts`).
- [x] **E2E Smoke Tests:** Implement Playwright tests for critical paths: Login -> Quiz Start -> Quiz Submit -> Result View (`tests/e2e/student-journey.spec.ts`).

## 📈 Execution Roadmap
1. **Phase A (Immediate):** Fix Auth Bypass and Scoping in `courses.ts` and `auth.ts`.
2. **Phase B (Short-term):** Standardize all other actions.
3. **Phase C (Medium-term):** Implement IaC and full E2E suite.
