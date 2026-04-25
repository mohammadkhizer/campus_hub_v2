# Routing and Navigation Specification

## 1. Overview
The Campus Hub V2 navigation system is dynamically generated based on the authenticated user's role. Routing is enforced via Next.js Middleware and client-side route guards to ensure data isolation.

## 2. Route Directory by Role

### 2.1 Super Admin Routes
- `/superadmin/dashboard`: Primary portal for system-wide health and analytics.
- `/superadmin/logs`: Access to security audits and system error logs.
- `/superadmin/feedback`: Moderation panel for public testimonials.
- `/admin/dashboard`: Overriding access to institutional management.

### 2.2 Administrator Routes
- `/admin/dashboard`: Operational hub for managing classrooms and faculty.
- `/admin/leaderboard`: Institutional performance analytics.
- `/admin/complaints`: Grievance management and resolution system.

### 2.3 Teacher Routes
- `/teacher/dashboard`: Management of assigned courses and classrooms.
- `/courses/create`: Entry point for AI-assisted and manual course establishment.
- `/courses/[id]/manage`: Control center for specific course content and participants.

### 2.4 Student Routes
- `/student/dashboard`: Personal learning hub and course overview.
- `/courses`: Repository of enrolled course materials and notes.
- `/quizzes`: Access to active assessments.
- `/student/complaints`: Interface for registering academic or technical concerns.
- `/profile`: Self-service account management.

## 3. Security Implementation

### 3.1 Authorization Layer
- **Middleware:** Intercepts path segments to verify role permissions before rendering.
- **Server Action Protection:** Every data mutation within a route is protected by a server-side check. If a user's role does not match the required permission for the action, the request is terminated with a `403 Forbidden` status.

### 3.2 Navigation Logic
- **Dynamic Filtering:** The `Navbar` component filters navigation links based on the `profile.role` property provided by the `AuthContext`.
- **Route Guards:** The `RouteGuard` component wraps sensitive pages to prevent unauthenticated access or role-mismatch errors during client-side navigation.
