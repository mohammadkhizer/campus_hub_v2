# Features and User Roles

This document outlines the different user roles within Campus Hub and the features/pages accessible to each.

## 4-Tier RBAC Hierarchy

Campus Hub implements a robust Role-Based Access Control (RBAC) system with four distinct tiers.

---

### 1. Super Admin
**Target:** System Owners and Platform Managers
- **Primary Access:** `/superadmin/dashboard`
- **Key Features:**
  - **Global Governance:** Full control over the entire platform ecosystem.
  - **Enterprise RBAC:** Manage high-level permissions and system-wide roles.
  - **System Metrics:** View real-time analytics on system performance and uptime.
  - **Database Management:** Oversee multi-cluster database resilience and failover settings.

### 2. Administrator
**Target:** Institutional Administrators and Department Heads
- **Primary Access:** `/admin/dashboard`
- **Key Features:**
  - **Institutional Dashboard:** Overview of all academic activities within their jurisdiction.
  - **Classroom Management:** Manage all classrooms under `/admin/classrooms`.
  - **User Management:** Oversee teacher and student accounts.
  - **Content Oversight:** Ability to view and manage all courses and quizzes.
  - **Leaderboard Analytics:** Monitor institutional performance via `/admin/leaderboard`.
  - **Creation Tools:** Access to `/admin/create` for high-level entity creation.

### 3. Teacher
**Target:** Educators and Instructors
- **Primary Access:** `/teacher/dashboard`
- **Key Features:**
  - **Course Management:**
    - Create new courses via `/courses/create`.
    - Edit existing courses via `/courses/edit/[id]`.
    - Manage course participants and materials via `/courses/[id]/manage`.
  - **Assessment Engine:**
    - AI-powered quiz generation.
    - Create quizzes via `/courses/[id]/quizzes/create`.
    - Edit quizzes via `/courses/[id]/quizzes/[quizId]/edit`.
    - Automated grading and deep performance analytics.
  - **Engagement:** Access to leaderboard data to track student progress.

### 4. Student
**Target:** Learners and Participants
- **Primary Access:** `/student/dashboard`
- **Key Features:**
  - **Personalized Dashboard:** A central hub for their enrolled courses and upcoming tasks.
  - **Classroom View:** Access their specific classrooms via `/student/dashboard` (integrated).
  - **Learning Journey:**
    - View and access course materials.
    - Participate in assessments and quizzes via `/quizzes/[id]`.
  - **Feedback Loops:** Instant feedback on quiz submissions and academic performance.
  - **Profile Management:** Manage personal settings and academic profile.

---

## Navigation Summary

| Page Path | Super Admin | Administrator | Teacher | Student |
| :--- | :---: | :---: | :---: | :---: |
| `/superadmin/dashboard` | ✅ | ❌ | ❌ | ❌ |
| `/admin/dashboard` | ❌* | ✅ | ❌ | ❌ |
| `/teacher/dashboard` | ❌* | ❌ | ✅ | ❌ |
| `/student/dashboard` | ❌* | ❌ | ❌ | ✅ |
| `/courses/create` | ❌ | ✅ | ✅ | ❌ |
| `/quizzes/[id]` | ❌ | ❌ | ❌ | ✅ |
| `/profile` | ✅ | ✅ | ✅ | ✅ |

*\*Note: Users are typically redirected to their specific dashboard based on their role upon login.*
