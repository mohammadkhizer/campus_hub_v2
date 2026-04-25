# Developer Standards and Onboarding

## 1. Development Environment
To maintain consistency across the development team, all contributors must adhere to the following environment specifications.

### 1.1 Prerequisites
- **Runtime:** Node.js v20.x or higher.
- **Package Manager:** npm v10.x or higher.
- **Database:** Access to a MongoDB Atlas cluster (Primary and Backup).
- **External APIs:** Valid API keys for Google Gemini and Cloudinary.

### 1.2 Configuration
The application utilizes a `.env` file for local development. Reference `.env.example` for the required keys. Strict runtime validation is performed via `src/lib/env.ts`.

## 2. Engineering Standards

### 2.1 Type Safety
- All new features must be implemented in **TypeScript**.
- Avoid the use of `any`. Utilize interfaces defined in `src/lib/types.ts` or local schema-driven types.
- Input validation must be performed using **Zod** within all Server Actions.

### 2.2 Data Fetching and Mutation
- **Safe Actions:** Use the `safeAction()` wrapper from `src/lib/actions.ts` for all Server Actions. This ensures consistent error handling, structured logging, and input validation.
- **Serialization (DTOs):** Avoid `JSON.parse(JSON.stringify(doc))`. Use the `toDTO()` or `fromLean()` utilities from `src/lib/dto.ts` for high-performance data serialization.
- **Caching:** Leverage Next.js `revalidatePath` and `revalidateTag` to manage cache invalidation after data mutations.
- **Mongoose:** Always use the `dbConnect()` utility from `src/lib/mongoose.ts` to ensure connection caching. Do not manually clear `mongoose.models` in model files as the registration is now centralized.


### 2.3 Security Practices
- **Role Verification:** Always perform server-side role checks within Server Actions using `getSessionAction`.
- **Persistent Logging:** Use `logger.security()` or `logger.error()` for critical events to ensure they are archived in the MongoDB `logs` collection.
- **Credential Integrity:** Enforce the global password policy (8+ chars, uppercase, numeric) in all onboarding workflows.

## 3. Workflow and CI/CD

### 3.1 Code Reviews
- All Pull Requests must pass automated linting and type-checking.

### 3.2 Testing Strategy
- **Manual Verification:** Critical paths (Auth, Quiz, Upload) must be manually verified in a staging environment.
- **Type Safety:** Automated `tsc --noEmit` is used for build-time validation.

## 4. Documentation
- Update the **SDD** for any architectural changes.
- Ensure all new Mongoose models are documented.
- Maintain the **Functional Specification** when adding or modifying user permissions.

