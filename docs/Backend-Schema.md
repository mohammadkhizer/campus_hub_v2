# Backend Schema Reference
> **Version:** 1.0 | **Stack:** MongoDB + Mongoose + TypeScript
> **Classification:** INTERNAL · ENGINEERING
> **Tenant Model:** All documents scoped by `institutionId` (multi-tenant isolation)

---

## 📐 Schema Overview

| Model | Collection | Key Indexes | Soft Delete |
|-------|-----------|-------------|-------------|
| User | users | email+institutionId (unique), role+institutionId | ✅ deletedAt |
| Course | courses | code+institutionId (unique), faculty+institutionId | ✅ deletedAt |
| Quiz | quizzes | course+institutionId, isPublished+institutionId | ✅ deletedAt |
| Attempt | attempts | quiz+student (unique), quiz+institutionId | ✅ deletedAt |
| Enrollment | enrollments | course+student (unique) | ❌ |
| Feedback | feedback | student+institutionId, status+institutionId | ✅ deletedAt |
| Announcement | announcements | course (via ref) | ❌ |
| Assignment | assignments | course (via ref) | ❌ |
| Submission | submissions | assignment+student | ❌ |
| Classroom | classrooms | course (via ref) | ❌ |
| Note | notes | student+course | ❌ |
| Complaint | complaints | student+institutionId | ❌ |
| AuditLog | auditlogs | TTL: 90 days auto-expire | ❌ |
| SystemLog | systemlogs | level, createdAt | ❌ |
| PlacementDrive | placementdrives | institutionId | ❌ |
| PlacementApplication | placementapplications | drive+student (unique) | ❌ |
| PlacementProfile | placementprofiles | student (unique) | ❌ |

---

## 🧩 Detailed Schemas

### 1. User
**File:** `src/models/User.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| firstName | String | ✅ | |
| lastName | String | ✅ | |
| email | String | ✅ | Unique per institution |
| password | String | Conditional | Required if authProvider !== 'google' |
| role | String enum | ❌ | `student` \| `teacher` \| `administrator` \| `superadmin` · default: `student` |
| enrollmentNumber | String | ❌ | Sparse unique index |
| contactNumber | String | ❌ | |
| passwordVersion | Number | ❌ | Default: 0 · incremented on password change to invalidate sessions |
| authProvider | String enum | ❌ | `local` \| `google` · default: `local` |
| failedLoginAttempts | Number | ❌ | Default: 0 · triggers lockout at threshold |
| lockoutUntil | Date | ❌ | Account lockout expiry |
| hasConsentedToDataCollection | Boolean | ❌ | Default: false · GDPR consent flag |
| institutionId | ObjectId → Institution | ❌ | Multi-tenancy scope key |
| deletedAt | Date | ❌ | Default: null · soft delete |
| createdAt / updatedAt | Date | auto | Mongoose timestamps |

**Indexes:**
```
{ email: 1, institutionId: 1 }  — unique
{ role: 1, institutionId: 1 }
{ enrollmentNumber: 1 }  — sparse unique
```

---

### 2. Course
**File:** `src/models/Course.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| code | String | ✅ | Unique per institution (e.g., CS101) |
| title | String | ✅ | |
| description | String | ✅ | |
| thumbnail | String | ❌ | Cloudinary URL |
| faculty | ObjectId → User | ❌ | Assigned teacher |
| targetLectures | Number | ❌ | Default: 0 |
| targetAssessments | Number | ❌ | Default: 0 |
| classrooms | ObjectId[] → Classroom | ❌ | Associated classrooms |
| isPublished | Boolean | ❌ | Default: false |
| institutionId | ObjectId → Institution | ❌ | Tenant scope |
| deletedAt | Date | ❌ | Soft delete |

**Indexes:**
```
{ code: 1, institutionId: 1 }  — unique
{ faculty: 1, institutionId: 1 }
```

---

### 3. Quiz
**File:** `src/models/Quiz.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| course | ObjectId → Course | ✅ | |
| title | String | ✅ | |
| category | String | ❌ | Default: 'General' |
| description | String | ❌ | |
| generationType | String enum | ❌ | `manual` \| `ai` · default: `manual` |
| difficulty | String enum | ❌ | `easy` \| `medium` \| `hard` · default: `medium` |
| timeLimit | Number | ❌ | Minutes · 0 = no limit |
| isPublished | Boolean | ❌ | Default: false |
| activityMonitoring | Boolean | ❌ | Default: true |
| password | String | ❌ | Optional quiz access password |
| questions | Array | ❌ | Embedded question subdocuments |
| institutionId | ObjectId | ❌ | Tenant scope |
| deletedAt | Date | ❌ | Soft delete |

**Question subdocument:**

| Field | Type | Notes |
|-------|------|-------|
| type | String enum | `mcq` \| `fill-in-the-blanks` \| `short-answer` \| `long-answer` |
| questionText | String | Required |
| imageUrl | String | Optional Cloudinary URL |
| options | String[] | For MCQ only |
| correctAnswer | String | Optional for long-answer |
| explanation | String | Optional |
| points | Number | Default: 1 |

**Indexes:**
```
{ course: 1, institutionId: 1 }
{ isPublished: 1, institutionId: 1 }
```

---

### 4. Attempt
**File:** `src/models/Attempt.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| quiz | ObjectId → Quiz | ✅ | |
| student | ObjectId → User | ✅ | |
| score | Number | ✅ | Raw score |
| totalQuestions | Number | ✅ | |
| completedAt | Date | ✅ | |
| status | String enum | ❌ | `completed` \| `disqualified` \| `pending_review` · default: `completed` |
| answers | Map\<String\> | ❌ | questionId → answer |
| feedback | String | ❌ | Teacher/system feedback |
| institutionId | ObjectId | ❌ | Tenant scope |
| deletedAt | Date | ❌ | Soft delete |

**Indexes:**
```
{ quiz: 1, student: 1 }  — unique (enforces one-attempt policy)
{ quiz: 1, institutionId: 1 }
{ student: 1, institutionId: 1 }
```

---

### 5. Enrollment
**File:** `src/models/Enrollment.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| course | ObjectId → Course | ✅ | |
| student | ObjectId → User | ✅ | |
| createdAt / updatedAt | Date | auto | |

**Indexes:**
```
{ course: 1, student: 1 }  — unique (prevents duplicate enrollment)
```

---

### 6. Feedback / Testimonials
**File:** `src/models/Feedback.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| student | ObjectId → User | ✅ | |
| content | String | ✅ | The testimonial text |
| rating | Number | ❌ | 1–5 stars |
| status | String enum | ❌ | `pending` \| `visible` \| `hidden` · default: `pending` |
| moderatedBy | ObjectId → User | ❌ | Super Admin who moderated |
| institutionId | ObjectId | ❌ | Tenant scope |
| deletedAt | Date | ❌ | Soft delete |

**Indexes:**
```
{ student: 1, institutionId: 1 }
{ status: 1, institutionId: 1 }
```

---

### 7. Announcement
**File:** `src/models/Announcement.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| course | ObjectId → Course | ✅ | |
| title | String | ✅ | |
| content | String | ✅ | |
| attachmentUrl | String | ❌ | Cloudinary file/image URL |
| postedBy | ObjectId → User | ✅ | Teacher who posted |
| createdAt / updatedAt | Date | auto | |

---

### 8. Assignment
**File:** `src/models/Assignment.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| course | ObjectId → Course | ✅ | |
| title | String | ✅ | |
| description | String | ✅ | |
| dueDate | Date | ❌ | |
| attachmentUrl | String | ❌ | Cloudinary URL |
| createdBy | ObjectId → User | ✅ | Teacher |
| createdAt / updatedAt | Date | auto | |

---

### 9. Submission
**File:** `src/models/Submission.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| assignment | ObjectId → Assignment | ✅ | |
| student | ObjectId → User | ✅ | |
| fileUrl | String | ❌ | Cloudinary submission URL |
| submittedAt | Date | ❌ | |
| grade | Number | ❌ | Assigned by teacher |
| feedback | String | ❌ | Teacher feedback |

---

### 10. Classroom
**File:** `src/models/Classroom.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | String | ✅ | |
| course | ObjectId → Course | ✅ | |
| students | ObjectId[] → User | ❌ | Enrolled students |
| schedule | String | ❌ | e.g. "Mon/Wed 10:00–11:30" |
| institutionId | ObjectId | ❌ | Tenant scope |
| createdAt / updatedAt | Date | auto | |

---

### 11. Note
**File:** `src/models/Note.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| student | ObjectId → User | ✅ | |
| course | ObjectId → Course | ✅ | |
| title | String | ✅ | |
| content | String | ✅ | |
| createdAt / updatedAt | Date | auto | |

---

### 12. Complaint
**File:** `src/models/Complaint.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| student | ObjectId → User | ✅ | |
| subject | String | ✅ | |
| description | String | ✅ | |
| status | String enum | ❌ | `open` \| `in-progress` \| `resolved` · default: `open` |
| resolvedBy | ObjectId → User | ❌ | Admin who resolved |
| resolution | String | ❌ | Resolution notes |
| institutionId | ObjectId | ❌ | Tenant scope |
| createdAt / updatedAt | Date | auto | |

---

### 13. AuditLog
**File:** `src/models/AuditLog.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| userId | ObjectId → User | ❌ | Actor |
| email | String | ❌ | Denormalized for log readability |
| action | String | ✅ | e.g. `ROLE_CHANGED`, `QUIZ_DELETED` |
| details | Mixed | ❌ | Additional context (JSON) |
| ipAddress | String | ❌ | |
| userAgent | String | ❌ | |
| createdAt | Date | auto | **TTL: 90 days** (GDPR auto-delete) |

> ⚠️ Append-only. No update/delete operations should be performed manually.

---

### 14. SystemLog
**File:** `src/models/SystemLog.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| level | String enum | ✅ | `info` \| `warn` \| `error` \| `security` |
| message | String | ✅ | |
| context | Mixed | ❌ | Route, userId, requestId etc. |
| stack | String | ❌ | Error stack trace |
| createdAt | Date | auto | |

---

### 15. PlacementDrive
**File:** `src/models/PlacementDrive.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| company | String | ✅ | |
| role | String | ✅ | Job title |
| description | String | ❌ | |
| eligibility | String | ❌ | CGPA/branch criteria |
| ctc | String | ❌ | Package offered |
| driveDate | Date | ❌ | |
| applicationDeadline | Date | ❌ | |
| status | String enum | ❌ | `upcoming` \| `active` \| `closed` |
| institutionId | ObjectId | ❌ | Tenant scope |
| createdAt / updatedAt | Date | auto | |

---

### 16. PlacementApplication
**File:** `src/models/PlacementApplication.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| drive | ObjectId → PlacementDrive | ✅ | |
| student | ObjectId → User | ✅ | |
| status | String enum | ❌ | `applied` \| `shortlisted` \| `selected` \| `rejected` |
| createdAt / updatedAt | Date | auto | |

**Indexes:**
```
{ drive: 1, student: 1 }  — unique (one application per drive)
```

---

### 17. PlacementProfile
**File:** `src/models/PlacementProfile.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| student | ObjectId → User | ✅ | Unique — one profile per student |
| cgpa | Number | ❌ | |
| branch | String | ❌ | |
| skills | String[] | ❌ | |
| resumeUrl | String | ❌ | Cloudinary PDF URL |
| linkedIn | String | ❌ | |
| github | String | ❌ | |
| isAvailable | Boolean | ❌ | Default: true |
| createdAt / updatedAt | Date | auto | |

---

## 🔗 Relationship Map

```
Institution (virtual)
  ├── User (many)           institutionId
  ├── Course (many)         institutionId
  │     ├── Quiz (many)     course ref
  │     │     └── Attempt   quiz+student (unique)
  │     ├── Enrollment      course+student (unique)
  │     ├── Announcement    course ref
  │     ├── Assignment      course ref
  │     │     └── Submission assignment+student
  │     ├── Classroom       course ref
  │     └── Note            course+student
  ├── Feedback              student ref
  ├── Complaint             student ref
  ├── AuditLog              userId ref (TTL 90d)
  ├── SystemLog             standalone
  ├── PlacementDrive        institutionId
  │     └── PlacementApplication  drive+student (unique)
  └── PlacementProfile      student (unique)
```

---

## 🔒 Multi-Tenancy Rules
1. **Every query must filter by `institutionId`** — enforced at service layer
2. **Server Actions verify** `session.user.institutionId === resource.institutionId` before any mutation
3. **Cross-tenant reads are architecturally impossible** when service layer is used correctly
4. **Super Admins** operate within their own `institutionId` scope only

---

*Schema version: 1.0 · Based on src/models/ · Last updated: May 2026*
