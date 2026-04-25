# Role-Based Route & Navigation Directory

This document outlines the accessible pages and navigation items for each user role within the Campus Hub platform. The navigation bar dynamically filters these items based on the user's authenticated role.

---

## 🏗️ Technical Implementation
Navigation is controlled via a centralized configuration:
- **Config File**: `src/config/navigation.ts`
- **Component**: `src/components/navbar.tsx`

---

## 👑 Super Admin
The Super Admin has unrestricted access to the entire platform for system-wide configuration and oversight.

**Navbar Items:**
- **Dashboard**: `/superadmin/dashboard` (System health, Global stats)
- **Faculty Registry**: `/admin/dashboard` (Control over all staff and coordinators)
- **System Logs**: `/superadmin/logs` (Security and audit trails)
- **Analytics**: `/superadmin/analytics` (Institutional performance data)
- **Grievances**: `/admin/complaints` (Review and resolve student concerns)

---

## 🛡️ Administrator (Institutional Admin)
Responsible for day-to-day operations, faculty management, and classroom logistics.

**Navbar Items:**
- **Dashboard**: `/admin/dashboard` (Operational hub)
- **Classrooms**: `/admin/dashboard` (Manage Classrooms tab: Registry, Students, Mapping)
- **Faculty Registry**: `/admin/dashboard` (Faculty tab: Onboard and manage Teachers)
- **Leaderboard**: `/admin/leaderboard` (Student performance tracking)
- **Grievances**: `/admin/complaints` (Review and resolve student concerns)

---

## 👨‍🏫 Teacher (Subject Coordinator)
Focuses on curriculum delivery, classroom management, and student onboarding.

**Navbar Items:**
- **Dashboard**: `/teacher/dashboard` (Academic overview)
- **My Courses**: `/teacher/dashboard` (Courses tab: Manage curriculum and publishing)
- **Classrooms**: `/teacher/dashboard` (Classrooms tab: View assigned groups)
- **Students**: `/teacher/dashboard` (Students tab: **Onboard Students**, Student Registry)

---

## 🎓 Student
The end-user focusing on learning, participation, and progress tracking.

**Navbar Items:**
- **Home**: `/` (Landing page/General info)
- **Dashboard**: `/student/dashboard` (Personal learning hub)
- **Classroom**: `/student/dashboard` (View enrolled classrooms)
- **Course**: `/courses` (Browse and access course materials)
- **Quiz**: `/quizzes` (Take assigned assessments)
- **Complaint Box**: `/student/complaints` (Register and track concerns)
- **Profile**: `/profile` (Manage personal account details)

---

## 🔒 Route Security
Access is enforced at multiple levels:
1. **Middleware/RouteGuard**: Prevents direct URL access to unauthorized directories (e.g., a student trying to visit `/admin/*`).
2. **UI Filtering**: The Navbar hides unauthorized links to simplify the interface.
3. **Server Actions**: RBAC (Role-Based Access Control) is checked inside every sensitive action (e.g., `deleteClassroom` checks if user is an `administrator`).
