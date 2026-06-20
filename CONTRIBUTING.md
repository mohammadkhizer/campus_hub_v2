# Contributing to Campus Hub

## Local Setup Instructions

1. **Automated Setup:**
   Run the setup script which will install dependencies, copy the `.env` file, and optionally seed the database:
   ```bash
   bash scripts/setup.sh
   ```

2. **Manual Setup:**
   If you prefer not to use the script:
   - Ensure you have Node.js v18+ installed (match `.nvmrc`).
   - Run `npm install`
   - Copy `.env.example` to `.env` and fill in the required values.
   - Run `npm run dev`

## Branch Naming Convention
- `feat/feature-name` (e.g. `feat/auth-system`)
- `fix/bug-name` (e.g. `fix/login-crash`)
- `chore/task-name` (e.g. `chore/update-deps`)
- `docs/doc-name` (e.g. `docs/api-endpoints`)

## Coding Standards
- **TypeScript:** Use strict typing. Avoid `any` where possible.
- **Components:** Use functional components. Break large "God components" into smaller ones.
- **State:** Use local state where possible. Keep global state minimal.
- **Formatting:** Use Prettier and ESLint. Run `npm run lint` before committing.

## Pull Request Process
1. Create a branch from `develop`.
2. Ensure your code passes all CI checks (linting, typechecking, tests).
3. Open a PR against `develop`.
4. Provide a clear description of the changes.
5. Require at least one approval from a code reviewer before merging.
