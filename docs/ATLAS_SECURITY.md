# MongoDB Atlas Security Configuration
> Classification: INTERNAL · ENGINEERING · SECURITY

## 1. Network Isolation
- **Status:** ACTIVE
- **Configuration:** Whitelisted IP ranges only (Netlify NAT Gateway + Dev VPN).
- **Broad Access (0.0.0.0/0):** STRICTLY PROHIBITED.

## 2. Database Auditing
- **Status:** ENABLED
- **Scope:** All CRUD operations on the `campushub` database.
- **Log Retention:** 365 Days (Compliance Requirement).
- **Alerts:** Triggered on any `dropCollection` or unauthorized access attempt.

## 3. Encryption at Rest
- **Mechanism:** WiredTiger Encryption (AES-256).
- **Key Management:** AWS KMS (Customer Managed Key).

## 4. Field-Level Encryption (FLE)
- **Target Fields:** `User.phone`, `User.address` (if collected).
- **Mechanism:** Client-Side Field Level Encryption (CSFLE) via Mongoose.

## 5. Audit Log TTL
- **Enforcement:** `createdAt` TTL index (90 days) on the `AuditLog` collection.
- **Verification:** Run `db.auditlogs.getIndexes()` to confirm expireAfterSeconds: 7776000.
