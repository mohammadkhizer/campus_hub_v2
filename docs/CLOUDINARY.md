# Media Strategy and Asset Management

## 1. Overview
Campus Hub V2 utilizes Cloudinary as its primary Image and Video Platform (IVP) and Content Delivery Network (CDN). This strategy offloads binary storage requirements and ensures high-speed asset delivery globally.

## 2. Integration Architecture
The integration is split into client-side uploading and server-side metadata management.

### 2.1 Client-Side Uploads
To reduce server-side compute and bandwidth consumption, the application utilizes direct client-side uploads.
- **Security:** Uploads are authorized via signed upload presets or server-generated signatures.
- **Formats:** Primarily used for student assignment submissions (PDFs) and course materials.

### 2.2 Server-Side Management
The server manages the lifecycle of the assets stored in Cloudinary.
- **Persistence:** Only the secure URL and public ID are stored in MongoDB.
- **Cleanup:** Background tasks (planned) are responsible for deleting orphaned assets when courses or submissions are removed.

## 3. Configuration and Standards

### 3.1 Folder Structure
Assets are organized in Cloudinary to mirror the system's organizational hierarchy:
- `campus-hub/assignments/[assignmentId]/[studentId]`
- `campus-hub/courses/[courseId]/notes`
- `campus-hub/profiles/[userId]`

### 3.2 Optimization Settings
- **Images:** Automatic format (`f_auto`) and quality (`q_auto`) optimizations are applied via URL transformations.
- **PDFs:** Served via the Cloudinary CDN to ensure reliable streaming and downloading for students.

## 4. Operational Risks and Mitigations

### 4.1 Quota Management
- **Risk:** Reaching the free/paid tier limits for storage or bandwidth.
- **Mitigation:** Implement client-side file size limits (e.g., 10MB per PDF) and monitor usage via the Cloudinary Admin API.

### 4.2 Availability
- **Risk:** Cloudinary service outage.
- **Mitigation:** The application includes error handling for failed uploads. Future iterations may include a local temporary buffer or a secondary storage provider (e.g., AWS S3).
