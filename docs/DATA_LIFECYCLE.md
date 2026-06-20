# CampusHub Data Lifecycle & Privacy Policy
> Classification: INTERNAL · COMPLIANCE · GDPR · DPDPA

## 1. Data Inventory & Mapping
| Data Type | Category | Collection Point | Storage | Retention | Deletion Policy |
|-----------|----------|------------------|---------|-----------|-----------------|
| User PII (Name, Email) | Personal | Signup / SSO | MongoDB Atlas (US-East) | Active account life | Purge on user delete |
| Institutional Data | Sensitive | Admin Panel | MongoDB Atlas (US-East) | Active contract life | Archive on contract end |
| Quiz Attempts | Academic | Student App | MongoDB Atlas (US-East) | 5 Years | Anonymize PII; retain scores |
| Audit Logs | Security | System Factory | MongoDB Atlas / Sentry | 90 Days | TTL Index auto-purge |
| AI Prompts | Usage | AI Features | Transient (Memory) | 0 Days | Not persisted locally |
| Auth Tokens (JWT) | Identity | NextAuth | Client-side (HttpOnly) | 30 Days | Session expiry |

## 2. Institutional Isolation (Multi-Tenancy)
- **Architecture:** Logical isolation via `institutionId` mandatory indexing and factory-level validation.
- **Privacy:** Data from Institution A is NEVER visible to Institution B, even if a user bypasses client-side controls.

## 3. Data Processing (AI Safety)
- **Gemini API:** Prompts are processed by Google Cloud Vertex AI / AI Studio.
- **Terms:** As per Google's "Generative AI on Vertex AI" terms, customer data is NOT used to train foundation models for other customers.

## 4. Subject Rights (GDPR/DPDPA)
- **Right to Access:** Users can request a full data export via the Profile dashboard.
- **Right to Erasure:** Deleting an account triggers anonymization of academic records and hard deletion of PII.

## 5. Security Controls
- **Encryption at Rest:** MongoDB Atlas (AWS KMS).
- **Encryption in Transit:** TLS 1.3 enforced for all traffic.
- **Access Control:** RBAC enforced at the Server Action layer.
