# Functional Specification: Roles and Features

## 1. Overview
Campus Hub V2 implements a 4-tier Role-Based Access Control (RBAC) hierarchy. This document defines the feature availability and functional responsibilities for each user role.

## 2. Role Hierarchy and Permissions

### 2.1 Super Admin
The Super Admin is responsible for global platform governance, system health, and institutional oversight.
- **System Governance:** Full control over all platform entities (Users, Courses, Classrooms).
- **Security Monitoring:** Access to global audit logs and security breach reports.
- **Analytics:** High-level institutional growth metrics and performance trends.
- **Moderation:** Management of student testimonials and feedback for public display.
- **Infrastructure:** Oversight of database failover status and system configuration.

### 2.2 Administrator
Administrators manage the day-to-day operations of specific departments or institutions.
- **Staff Management:** Onboarding and management of Teacher accounts.
- **Classroom Logistics:** Mapping students and teachers to academic classrooms.
- **Performance Auditing:** Access to institutional leaderboards and detailed student performance data.
- **Conflict Resolution:** Review and resolution of student-filed grievances (Complaints).

### 2.3 Teacher
Teachers are the primary content architects and instructional leads.
- **Course Management:** Creation and maintenance of course materials and syllabus.
- **Assessment Creation:** Manual or AI-assisted generation of timed quizzes.
- **Instructional Support:** Uploading study notes (PDFs) and posting course-wide announcements.
- **Evaluation:** Reviewing assignment submissions and providing academic feedback.

### 2.4 Student
Students are the primary end-users engaged in the learning and assessment process.
- **Dashboard:** Central hub for viewing active courses, upcoming quizzes, and academic progress.
- **Assessments:** Participation in secure, timed quizzes with server-side integrity monitoring (timing, device tracking, and disqualification triggers).
- **Assignments:** Uploading deliverables and tracking grading status.
- **Engagement:** Submission of feedback and registration of grievances.


## 3. Feature Access Matrix

| Feature | Super Admin | Admin | Teacher | Student |
| :--- | :---: | :---: | :---: | :---: |
| Global Analytics | Full | Limited | No | No |
| User Role Modification | Yes | No | No | No |
| Course Creation | No | Yes | Yes | No |
| AI Quiz Generation | No | Yes | Yes | No |
| Assignment Submission | No | No | No | Yes |
| Grievance Resolution | Yes | Yes | No | No |
| System Log Access | Yes | No | No | No |
| Profile Management | Yes | Yes | Yes | Yes |

## 4. Workflow Integrity
- **Redirection Logic:** Upon authentication, users are automatically routed to their respective dashboards (`/superadmin`, `/admin`, `/teacher`, or `/student`) based on their role metadata.
- **Session Security:** Authorization tokens are validated server-side for every sensitive action.
- **Credential Policy:** Strict password requirements (8+ chars, uppercase, numeric) are enforced at the account creation level.
- **Session Revocation:** Multi-device session invalidation is triggered automatically upon password updates to protect against compromised credentials.

