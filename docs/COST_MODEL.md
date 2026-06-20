# CampusHub Infrastructure Cost Model
> Classification: INTERNAL · FINOPS · PLANNING

## 1. Overview
This model estimates monthly infrastructure costs for the CampusHub platform based on user growth tiers.

## 2. Tiered Cost Estimates (Monthly)

| Service | 1K Users (MVP) | 10K Users (Growth) | 100K Users (Scale) |
|---------|----------------|--------------------|-------------------|
| **MongoDB Atlas** | $0 (Free/Shared) | $60 (M10) | $200 (M30 + Backup) |
| **Upstash Redis** | $0 (Free Tier) | $15 (Pro) | $120 (Enterprise) |
| **Netlify** | $0 (Starter) | $19 (Pro) | $99+ (Enterprise) |
| **Gemini API** | $50 (Pay-as-go) | $400 (Bulk) | $3,500 (Commitment) |
| **Sentry / OTel** | $0 (Free) | $26 (Developer) | $200 (Business) |
| **TOTAL** | **~$50** | **~$520** | **~$4,119** |

## 3. Cost Optimization Strategies
1. **Semantic Caching:** Cache AI responses for common topics to reduce Gemini API costs by ~30%.
2. **TTL Indexing:** Automatically purge old audit logs and notifications to keep MongoDB storage costs flat.
3. **Edge Logic:** Offload rate limiting to Netlify Edge to avoid serverless function invocation costs.

## 4. Cost Alerts (Monthly)
- **Warning:** $500 (Notify CTO)
- **Critical:** $1,000 (Notify CEO + CTO)
