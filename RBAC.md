# Role-Based Access Control (RBAC)

This document summarizes how Campus Hub v2 implements RBAC across pages, navigation, and server actions.

## Roles

The application supports four role values:

- `student`
- `teacher`
- `administrator`
- `superadmin`

The role is exposed in the client auth context and is enforced both in UI route guards and in server actions.

## Client-side RBAC

### Auth context

`src/context/auth-context.tsx` provides the authenticated user profile and exposes:

- `profile` - current user profile with `role`
- `isAuthenticated` - whether a session exists
- `isLoading` - auth state is still being fetched

### RouteGuard

`src/components/route-guard.tsx` protects client pages using `allowedRole` props.

- If the user is not authenticated, they are redirected to `/login`.
- If the user is authenticated but does not belong to an allowed role, they are redirected to their correct dashboard:
  - `superadmin` → `/superadmin/dashboard`
  - `administrator` → `/admin/dashboard`
  - `teacher` → `/teacher/dashboard`
  - `student` → `/student/dashboard`

### Key protected pages

The application uses `RouteGuard` in pages such as:

- `src/app/admin/placements/page.tsx`
- `src/app/admin/leaderboard/page.tsx`
- `src/app/admin/classrooms/page.tsx`
- `src/app/feedback/page.tsx`
- `src/app/dashboard/classrooms/page.tsx`
- Many admin and superadmin pages under `src/app/admin` and `src/app/superadmin`

### Dashboard redirect page

The app uses a central redirect page to send each user to their correct dashboard:

- `src/app/dashboard/page.tsx` maps current role to:
  - `/superadmin/dashboard`
  - `/admin/dashboard`
  - `/teacher/dashboard`
  - `/student/dashboard`

This page is referenced in navigation as `/dashboard-redirect`.

## Navigation RBAC

Navigation links are defined in `src/config/navigation.ts` and include a `roles` array.

Each item is only visible to users whose role is included in the allowed roles for that item.

Example navigation entries:

- `Home` - all roles
- `Dashboard` - all roles via `/dashboard-redirect`
- `Classroom` - `student`, `teacher`, `administrator`
- `Quiz`, `Feedback`, `Complaint Box`, `Placements`, `AI Assistant` - `student`
- `Faculty Registry` - `administrator`, `superadmin`
- `System Logs`, `Analytics`, `Feedbacks` - `superadmin`

## Server-side RBAC

`src/lib/action-factory.ts` provides a standardized server action wrapper.

It enforces RBAC on server actions by:

- fetching the current session with `getSessionAction()`
- returning `UNAUTHORIZED` if no session exists
- returning `FORBIDDEN` if the user role is not included in `allowedRoles`

This ensures server-side enforcement even when a client navigates directly to a page.

## Common page names and routes

### Public / auth pages

- `/` → `src/app/page.tsx`
- `/login` → `src/app/login/page.tsx`
- `/signup` → `src/app/signup/page.tsx`
- `/profile` → `src/app/profile/page.tsx`

### Role dashboard pages

- `/student/dashboard` → student dashboard
- `/teacher/dashboard` → teacher dashboard
- `/admin/dashboard` → administrator dashboard
- `/superadmin/dashboard` → superadmin dashboard

### Example feature routes

- `/courses` → `src/app/courses/page.tsx`
- `/admin/classrooms` → `src/app/admin/classrooms/page.tsx`
- `/student/complaints` → `src/app/student/complaints/page.tsx`
- `/student/placements` → `src/app/student/placements/page.tsx`

## Dynamic routing

The app uses Next.js dynamic route segments for resource-specific pages.

Examples:

- `src/app/courses/edit/[id]/page.tsx`
  - route: `/courses/edit/:id`
  - used for editing a course by its ID
- `src/app/courses/[id]/page.tsx`
  - route: `/courses/:id`
  - used for viewing course details
- `src/app/courses/[id]/quizzes/[quizId]/edit/page.tsx`
  - route: `/courses/:id/quizzes/:quizId/edit`
  - used for editing a specific quiz in a course
- `src/app/quizzes/[id]/leaderboard/page.tsx`
  - route: `/quizzes/:id/leaderboard`
  - used for quiz leaderboard views

## Best practices

- Keep role checks in UI navigation and page-level route guards.
- Always enforce the same role restrictions in server actions.
- Use the centralized `getDashboardHref` helper in `src/config/navigation.ts` when redirecting users after login.
- Prefer explicit role arrays instead of loose role logic when defining allowed access.

## Notes

- The RBAC implementation is a combination of UI protection, role-based menu visibility, and backend server action enforcement.
- The central auth context and `RouteGuard` implementation make it easy to add new role-protected pages.
