# Developer Documentation

Important information for developers working on the Campus Hub project.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Database:** MongoDB
- **File Storage:** Cloudinary (See [CLOUDINARY.md](./CLOUDINARY.md))
- **Authentication:** JWT (JSON Web Tokens) with HttpOnly Cookie protection

## Core Architecture

### 1. Authentication & RBAC
The system uses a 4-tier Role-Based Access Control system.
- **Context:** `src/context/auth-context.tsx` handles the global auth state.
- **Protection:** `src/components/route-guard.tsx` is used to wrap pages and restrict access based on roles.
- **Server Actions:** `src/app/actions/auth.ts` contains the logic for login, logout, and session retrieval.

### 2. Security Middleware
Located at `src/middleware.ts`, it handles:
- **Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.
- **Rate Limiting:** (Optional/Configurable) protects API routes and server actions.

### 3. Project Structure
- `src/app`: Contains all pages and layouts (Next.js App Router).
- `src/components`: Reusable UI components.
- `src/context`: React Context providers (Auth, etc.).
- `src/lib`: Utility functions and core logic.
- `src/models`: Database schemas and models.
- `docs/`: Project documentation and blueprints.

## Important Files
- `next.config.ts`: Next.js configuration.
- `tailwind.config.ts`: Custom theme, colors, and animations.
- `.env`: Environment variables (Template should be followed).

## Development Guidelines
- **Aesthetics:** Follow the "Next-Gen" design system (shimmers, glassmorphism, premium cards).
- **Type Safety:** Ensure all props and data structures are properly typed.
- **Performance:** Utilize Next.js Server Components where possible for better performance.
- **Security:** Never expose sensitive logic on the client side; use Server Actions or protected API routes.
