# CampusHub Secret Management (Doppler)
> Classification: INTERNAL · ENGINEERING · SECURITY

## 1. Overview
All environment variables are managed via **Doppler**. Direct management in Netlify UI or local `.env` files is strictly prohibited for production.

## 2. Naming Conventions
| Variable Name | Description | Example |
|---------------|-------------|---------|
| `AUTH_SECRET` | NextAuth encryption secret | `32-char-random-hex` |
| `AUTH_PRIVATE_KEY` | RS256 Private Key (Base64) | `LS0tLS1CRUdJTiBS...` |
| `AUTH_PUBLIC_KEY` | RS256 Public Key (Base64) | `LS0tLS1CRUdJTiBQ...` |
| `MONGODB_URI` | Primary Database connection | `mongodb+srv://...` |
| `UPSTASH_REDIS_REST_URL` | Rate limiting & Idempotency | `https://...upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash API Token | `red-token...` |
| `GOOGLE_CLIENT_ID` | OAuth2 Client ID | `xxx.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth2 Client Secret | `GOCSPX-...` |

## 3. Rotation Policy
- **JWT Keys (RS256):** Every 90 days.
- **Database Credentials:** Every 180 days.
- **API Tokens:** On employee offboarding or suspected leak.

## 4. Local Development
Run `doppler run -- npm run dev` to inject secrets from the `dev` environment.
