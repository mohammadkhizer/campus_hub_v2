# Application Flow & Route Map
> **Version:** 1.0 | **Framework:** Next.js 15 App Router
> **Classification:** INTERNAL · PRODUCT · ENGINEERING

---

## 🗺️ Route Index

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page with testimonials, features, CTA |
| `/login` | Public | Email/password + Google OAuth |
| `/signup` | Public | Student self-registration |
| `/dashboard` | Student | Personalized student dashboard |
| `/student/dashboard` | Student | Extended student view |
| `/student/ai` | Student | AI study assistant |
| `/student/placements` | Student | Browse drives + apply |
| `/student/complaints` | Student | Submit/track complaints |
| `/courses` | All Auth | Course catalog |
| `/courses/create` | Teacher+Admin | Create course |
| `/courses/edit/[id]` | Teacher+Admin | Edit course |
| `/courses/[id]` | Enrolled | Course detail + announcements |
| `/courses/[id]/manage` | Teacher | Course management panel |
| `/courses/[id]/quizzes/create` | Teacher | Create quiz (manual or AI) |
| `/courses/[id]/quizzes/[quizId]/edit` | Teacher | Edit quiz |
| `/courses/[id]/assignments/[assignmentId]` | Enrolled | View/submit assignment |
| `/quizzes` | All Auth | Quiz list |
| `/quizzes/[id]` | Student | Take quiz (timed, one-attempt) |
| `/quizzes/[id]/leaderboard` | All Auth | Quiz leaderboard |
| `/quizzes/attempts/[attemptId]/review` | Student+Teacher | Review attempt |
| `/feedback` | Student | Submit testimonial |
| `/profile` | All Auth | View/edit profile |
| `/dashboard/classrooms` | Student | Assigned classrooms |
| `/admin/dashboard` | Admin | Admin control panel |
| `/admin/create` | Admin | Create teacher account |
| `/admin/classrooms` | Admin | Manage classrooms |
| `/admin/classrooms/create` | Admin | Create classroom |
| `/admin/classrooms/edit/[id]` | Admin | Edit classroom |
| `/admin/leaderboard` | Admin | Institution-wide leaderboard |
| `/admin/placements` | Admin | Manage placement drives |
| `/admin/complaints` | Admin | Resolve complaints |
| `/teacher/dashboard` | Teacher | Teacher control center |
| `/superadmin/dashboard` | Super Admin | Governance dashboard |
| `/superadmin/analytics` | Super Admin | Analytics hub (Recharts) |
| `/superadmin/feedback` | Super Admin | Moderate testimonials |
| `/superadmin/logs` | Super Admin | Audit log viewer |

---

## 👤 Role Flows

### 🎓 Student
1. **Enroll & Study:** Login → `/courses` → `/courses/[id]` → view announcements → submit assignments
2. **Take Exam:** `/quizzes/[id]` (timed, server-enforced one-attempt) → `/quizzes/attempts/[id]/review`
3. **Check Rank:** `/quizzes/[id]/leaderboard`
4. **Leave Feedback:** `/feedback` → pending moderation by Super Admin
5. **Placements:** `/student/placements` → apply → track status

### 🧑‍🏫 Teacher
1. **Create Course:** `/courses/create` → publish
2. **Build Quiz (Manual):** `/courses/[id]/quizzes/create` → add questions → set time limit → publish
3. **Build Quiz (AI):** Select AI mode → enter topic → Gemini generates → review/edit → publish
4. **Post Announcement:** `/courses/[id]/manage` → create with optional Cloudinary attachment
5. **Track Performance:** `/quizzes/[id]/leaderboard`

### 🏛️ Administrator
1. **Onboard Teacher:** `/admin/create` → creates account + sends credentials
2. **Manage Classrooms:** `/admin/classrooms` → create → assign students
3. **View Leaderboard:** `/admin/leaderboard` (paginated, institution-wide)
4. **Placement Drives:** `/admin/placements` → create → review applications → update statuses
5. **Resolve Complaints:** `/admin/complaints` → add resolution → close

### 🔐 Super Admin
1. **Analytics:** `/superadmin/analytics` → DAU, course growth, quiz stats (Recharts)
2. **Moderate Feedback:** `/superadmin/feedback` → approve/hide/delete testimonials
3. **Audit Trail:** `/superadmin/logs` → filter by level/date/user
4. **User Governance:** `/superadmin/dashboard` → search users, change roles, force reset, soft delete

---

## 🔐 Auth Flow

```
Visitor → protected route → middleware checks JWT cookie
  Valid   → pass to page, RBAC checked at Server Action level
  Invalid → redirect /login → credentials or Google OAuth
          → Server Action validates → set HttpOnly JWT cookie
          → redirect to role dashboard
```

**Google OAuth:** `google-auth-library` verifies `id_token` server-side → upsert User (authProvider: 'google') → set JWT → redirect

---

## 🤖 AI Quiz Generation Flow

```
Teacher → /courses/[id]/quizzes/create → select "AI Generation"
        → enter topic + difficulty + count
        → Server Action → Genkit/Gemini (rate-limited 5 req/min)
        → AI returns questions → Teacher review screen
        → edit/reorder → confirm → saved as draft → publish
```

---

## 🛡️ RBAC & Rate Limits

```
middleware.ts enforces:
  /superadmin/** → superadmin only
  /admin/**      → administrator, superadmin
  /teacher/**    → teacher, administrator, superadmin
  /student/**    → student only
  /courses/**    → all authenticated
  /quizzes/**    → all authenticated

Rate limits (Upstash Redis):
  Global: 50 req/min/IP
  Auth:    5 req/min/IP
  AI:      5 req/min/user
```

---

## 📄 Caching Strategy

| Route | Cache |
|-------|-------|
| `/` | SSG + ISR |
| `/courses` | Redis 5 min |
| `/quizzes/[id]/leaderboard` | Redis 2 min |
| `/superadmin/analytics` | Redis 10 min |
| `/quizzes/[id]` | No cache (exam integrity) |
| `/superadmin/logs` | No cache (real-time audit) |

---

*AppFlow v1.0 · Based on src/app/ route tree · May 2026*
