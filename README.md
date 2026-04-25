# Campus Hub V2

Campus Hub V2 is a high-performance Learning Management System (LMS) and assessment platform. It is engineered for academic institutions to manage courses, automate assessments via Artificial Intelligence, and maintain institutional governance through a secure, multi-tier access model.

## Core Documentation
For detailed technical specifications, architecture diagrams, and deployment strategies, refer to the following documents:

- **Software Design Document (SDD):** [docs/SDD.md](./docs/SDD.md) - Comprehensive system architecture, data models, and scaling strategies.
- **Technical Implementation:** [docs/details.md](./docs/details.md) - Deep dive into modules, security, and integration logic.
- **Functional Specification:** [docs/Features_and_User.md](./docs/Features_and_User.md) - Role-based feature matrix and workflows.
- **API and Routes:** [docs/routes.md](./docs/routes.md) - Directory of system routes and navigation security.
- **Media Strategy:** [docs/CLOUDINARY.md](./docs/CLOUDINARY.md) - Distributed asset management and CDN configuration.
- **Developer Guide:** [docs/developer.md](./docs/developer.md) - Onboarding, standards, and environment setup.

## Primary Technology Stack
- **Framework:** Next.js 15 (App Router)
- **Runtime:** Node.js 20.x
- **Database:** MongoDB Atlas (M30+ Cluster)
- **AI Integration:** Google Gemini API (Genkit)
- **Asset Management:** Cloudinary CDN
- **Security:** JWT-based session management, Edge Middleware, and Zod validation.

## Infrastructure and Deployment
The platform is optimized for serverless execution and global distribution.
- **Host:** Vercel (Edge Network and Serverless Functions).
- **CI/CD:** GitHub Actions for automated testing and deployment.
- **Monitoring:** Datadog, Sentry, and Axiom.

## License
This project is proprietary. Unauthorized copying, distribution, or use is strictly prohibited.
