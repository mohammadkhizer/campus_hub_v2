# CampusHub Threat Model (STRIDE)
> Last Updated: 2026-05-16 | Status: DRAFT · CRITICAL

## 1. STRIDE Analysis Table

| Category | Threat | Mitigation Status | Technical Implementation |
|----------|--------|-------------------|--------------------------|
| **S**poofing | User impersonation via JWT theft | ✅ ACTIVE | NextAuth.js v5 with RS256 readiness, HttpOnly cookies |
| **T**ampering | Double-submission of quiz attempts | ✅ ACTIVE | `withIdempotency` wrapper in `action-factory.ts` |
| **R**epudiation | Sensitive data mutations without logs | ✅ ACTIVE | `logger.security` and `correlationId` tracking |
| **I**nformation Disclosure | Cross-tenant data leakage | ✅ ACTIVE | `institutionId` validation guard in `action-factory.ts` |
| **D**enial of Service | Brute-force/Resource exhaustion | ✅ ACTIVE | Netlify Edge Rate Limiter (ingress shield) |
| **E**levation of Privilege | Student accessing Admin actions | ✅ ACTIVE | `allowedRoles` verification in `createAction` |

## 2. Attack Surface Analysis
- **Public API:** Minimal. Most logic behind `next-action` headers.
- **Authentication:** OAuth2 (Google) preferred over credentials.
- **Data Layer:** Multi-tenant isolated via `institutionId` index.

## 3. High-Priority Residual Risks
- **Secret Leaks:** Mitigated via pending Doppler integration.
- **DDoS (L7):** Mitigated via Edge Rate Limiter, but needs burst detection.
- **MFA:** Not yet enforced for Admin roles (Phase 16.1 legacy).

## 4. Mitigation Roadmap
1. Complete Doppler migration to eliminate Netlify UI secret visibility.
2. Implement 90-day RSA key rotation for `AUTH_PRIVATE_KEY`.
3. Add MFA for `ADMIN` and `SUPERADMIN` roles.
