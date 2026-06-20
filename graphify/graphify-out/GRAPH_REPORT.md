# Graph Report - .  (2026-05-14)

## Corpus Check
- 176 files · ~86,080 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 444 nodes · 1035 edges · 54 communities
- Extraction: 67% EXTRACTED · 33% INFERRED · 0% AMBIGUOUS · INFERRED: 344 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]

## God Nodes (most connected - your core abstractions)
1. `dbConnect()` - 86 edges
2. `getSessionAction()` - 66 edges
3. `toast()` - 59 edges
4. `useAuth()` - 41 edges
5. `cn()` - 36 edges
6. `useToast()` - 30 edges
7. `RouteGuard()` - 28 edges
8. `Badge()` - 27 edges
9. `toDTO()` - 21 edges
10. `Logger` - 21 edges

## Surprising Connections (you probably didn't know these)
- `loadFaculty()` --calls--> `getUsersByRoleAction()`  [INFERRED]
  src/app/courses/create/page.tsx → src/app/actions/auth.ts
- `middleware()` --calls--> `checkRateLimit()`  [INFERRED]
  src/middleware.ts → src/lib/rate-limit.ts
- `generateAnalysisReport()` --calls--> `checkRateLimit()`  [INFERRED]
  src/ai/flows/generate-analysis-report.ts → src/lib/rate-limit.ts
- `summarizeLectureAction()` --calls--> `createAction()`  [INFERRED]
  src/ai/flows/student-ai.ts → src/lib/action-factory.ts
- `getPerformanceInsightsAction()` --calls--> `createAction()`  [INFERRED]
  src/ai/flows/student-ai.ts → src/lib/action-factory.ts

## Communities (54 total, 0 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (50): createCourse(), deleteAnnouncement(), deleteAssignment(), deleteNote(), enrollInCourse(), getCourseDetail(), notifyStudentsInCourse(), saveAnnouncement() (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (48): serverGetAnalyticsData(), checkEnrollment(), serverDeleteFeedback(), serverGetDisplayedFeedbacks(), serverGetFeedbacks(), serverSubmitFeedback(), serverUpdateFeedbackStatus(), serverDeleteAttempt() (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (45): createStudentAction(), createTeacherAction(), deleteCoordinatorAction(), getSessionAction(), getStudentsAction(), getUsersByRoleAction(), logoutAction(), promoteToAdmin() (+37 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (3): useIsMobile(), cn(), Skeleton()

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (21): generateQuizQuestionsAction(), googleLoginAction(), loginAction(), signupAction(), getSubmissions(), submitAssignment(), AdminRedirect(), AssignmentDetailPage() (+13 more)

### Community 5 - "Community 5"
Cohesion: 0.1
Nodes (20): updateProfileAction(), generateSystemAnalysisAction(), getSystemActivityLogs(), getSystemStats(), manageUserRoleAction(), handleSend(), handleGenerateReport(), handleRoleChange() (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (20): gradeSubmission(), applyToDriveAction(), createPlacementDriveAction(), getAllApplicationsAction(), getEligibleDrivesAction(), getPlacementProfileAction(), updateApplicationStatusAction(), updatePlacementProfileAction() (+12 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (6): getMyProfile(), updateMyProfile(), Logger, handleChangePassword(), handleSaveProfile(), loadProfile()

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (10): getClassroomDetail(), getStudentAccessibleCourses(), saveClassroom(), loadCourses(), handleSave(), loadAllData(), removeQuestion(), validateQuestions() (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.31
Nodes (9): getAllComplaintsAction(), getStudentComplaintsAction(), submitComplaintAction(), updateComplaintStatusAction(), getSeverityBadge(), getStatusBadge(), handleSubmit(), handleUpdate() (+1 more)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dbConnect()` connect `Community 6` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.177) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 3` to `Community 8`, `Community 5`?**
  _High betweenness centrality (0.161) - this node is a cross-community bridge._
- **Why does `Badge()` connect `Community 8` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Are the 85 inferred relationships involving `dbConnect()` (e.g. with `serverGetAnalyticsData()` and `loginAction()`) actually correct?**
  _`dbConnect()` has 85 INFERRED edges - model-reasoned connections that need verification._
- **Are the 45 inferred relationships involving `getSessionAction()` (e.g. with `RootLayout()` and `dbConnect()`) actually correct?**
  _`getSessionAction()` has 45 INFERRED edges - model-reasoned connections that need verification._
- **Are the 56 inferred relationships involving `toast()` (e.g. with `handleDelete()` and `handleSave()`) actually correct?**
  _`toast()` has 56 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `useAuth()` (e.g. with `AdminRedirect()` and `AssignmentDetailPage()`) actually correct?**
  _`useAuth()` has 6 INFERRED edges - model-reasoned connections that need verification._