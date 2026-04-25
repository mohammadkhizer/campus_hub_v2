# 🎓 Campus Hub

**Campus Hub** is a premium, high-performance Learning Management System (LMS) and assessment platform designed for modern academic institutions. It provides a robust, secure, and user-centric experience for students, teachers, administrators, and system governors.

---

## 🛡️ Production-Grade Security & Infrastructure

Campus Hub is built with a "Security First" philosophy, ensuring data integrity, high availability, and protection against modern web threats.

### 🔒 Core Security & Traffic Protection
- **Strict Environment Validation:** Runtime validation of all secrets using Zod to prevent misconfiguration leaks.
- **WAF-Lite Middleware:** Global request throttling and rate limiting (50 req/min) to mitigate DDoS and brute-force attacks.
- **Hardened Security Headers:** Implemented via `middleware.ts`:
  - `Content-Security-Policy`: Restricts unauthorized script/style execution.
  - `Strict-Transport-Security (HSTS)`: Enforces permanent HTTPS.
  - `X-Frame-Options (DENY)`: Prevents Clickjacking.
  - `X-Content-Type-Options`: Prevents MIME-sniffing.
- **Action Level Security:** Every Server Action is protected by strict Zod schema validation and 4-tier role-based access control (RBAC).

---

## 🛠️ Developer View (Architecture & Technology)

Campus Hub uses a modern, scalable architecture designed for high availability and clean separation of concerns.

### 🏗️ Core Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose ODM (Plus Failover Support)
- **Validation:** Zod (Runtime and Input validation)
- **Logging:** Structured production logger (Info, Warn, Error, Security levels)
- **Authentication:** Custom JWT-based system with Secure, HttpOnly, SameSite cookies.
- **AI Integration:** Google GenAI (Gemini) via Genkit for automated quiz generation.

### 📂 Key Infrastructure Modules
- `src/lib/env.ts`: Centralized environment manager.
- `src/lib/mongoose.ts`: The resilience engine for database connectivity.
- `src/lib/logger.ts`: The unified reporting and monitoring service.
- `src/app/actions/superadmin.ts`: Governance and system-wide analytics engine.

---

## 👑 Super Admin Experience (System Governance)

The Super Admin is the platform's ultimate authority, responsible for global health, security, and institutional oversight.

### 📋 Key Features:
- **Institutional Governance:** Full control over all platform operations, including overriding institutional parameters.
- **Advanced Analytics Hub:** Real-time visibility into user growth, registration trends, and platform-wide performance metrics via interactive charts.
- **Feedback Moderation:** Review and select student testimonials for platform-wide display; ability to delete or hide feedback.
- **Global Role Management:** Dynamically create, assign, or revoke any user role (Super Admin, Admin, Teacher, Student).
- **System Monitoring:** Integrated dashboard for tracking security logs, system errors, and suspicious activity.

---

## 🏛️ Administrator Experience (Platform Governance)

The Administrator is the platform's overseer, responsible for institutional structure and staff integrity.

### 📋 Key Features:
- **Comprehensive Leaderboards:** Access to per-quiz and academic-wide leaderboards with advanced search and performance sorting.
- **Staff Management:** Full CRUD operations for "Active Coordinator Inventory" (Teacher accounts).
- **Course Establishment:** Defining academic modules, assigning global Course Codes, and setting curriculum targets.
- **Faculty Assignment:** Dynamically assigning Teachers to specific courses.

---

## 👨‍🏫 Teacher Experience (Instructional Design)

Teachers are the primary content creators and instructional leads for their assigned courses.

### 📋 Key Features:
- **Course Control Center:** A dedicated dashboard for managing instructional materials and students.
- **Performance Tracking:** Access to detailed quiz results and student-specific accuracy leaderboards.
- **Assessment Suite:** Creating interactive, timed quizzes and generating academic assignments.
- **Interactive Announcements:** Posting real-time updates and course-wide communications.

---

## 🎓 Student Experience (Learner View)

Campus Hub provides students with an intuitive, results-driven learning environment.

### 📋 Key Features:
- **Personalized Dashboard:** Real-time tracking of academic progress, accuracy, and milestones.
- **One-Attempt Quiz Policy:** Secure assessment environment ensuring each student can perform a quiz exactly once.
- **Unified Feedback System:** Dedicated space for students to submit testimonials and share their learning experience.
- **Course Discovery:** Fluid navigation to accessible courses assigned to the student's classroom.
- **Timed Assessments:** Distraction-free exam environment with immediate feedback and result breakdown.

---

## 🎨 UI/UX Redesign (Premium Experience)

The platform has been redesigned for a modern, high-conversion SaaS aesthetic.

### ✨ Highlights:
- **High-Impact Landing Page:** Conversion-focused public home page featuring student testimonials and premium trust indicators.
- **Unified Smart Dashboard:** A role-based entry point that provides personalized welcomes and action shortcuts.
- **Modular Widget Architecture:** Dashboard layouts using modern UI components for high-density information display.

---

## 🚀 Setup & Configuration

### Prerequisites
- Node.js (v18 or higher)
- Primary MongoDB Connection URI
- Google Generative AI API Key (for Quiz AI)
- Cloudinary Credentials (for Media)

### Installation & Execution
1. **Clone & Install:**
   ```bash
   git clone <repository-url>
   npm install
   ```
2. **Configure Environment:**
   Create a `.env` file based on the required schema:
   ```env
   MONGODB_URI=primary_uri
   MONGODB_BACKUP_URI=secondary_uri
   JWT_SECRET=min_32_chars_secret
   ENCRYPTION_KEY=min_32_chars_key
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   NODE_ENV=development
   ```
3. **Run Platform:**
   ```bash
   npm run dev
   ```

---

*Built with ❤️ for the next generation of educators and learners.*

