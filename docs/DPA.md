# Data Processing Agreement (DPA) Template
> Classification: LEGAL · INSTITUTIONAL · TEMPLATE

## 1. Introduction
This Data Processing Agreement ("DPA") forms part of the Master Service Agreement between CampusHub ("Processor") and the Institution ("Controller").

## 2. Scope of Processing
Processor shall process Personal Data only for the purposes of providing the CampusHub services, including:
- User authentication and role management.
- Academic assessment generation and scoring.
- Institutional analytics and reporting.

## 3. Data Subject Rights
Processor shall assist Controller in fulfilling its obligations to respond to requests from Data Subjects (Access, Erasure, Portability).

## 4. Technical and Organizational Measures
Processor implements the following security measures:
- **Tenant Isolation:** Mandatory `institutionId` scoping at the database and application layers.
- **Encryption:** AES-256 at rest (MongoDB Atlas) and TLS 1.3 in transit.
- **Access Control:** Role-Based Access Control (RBAC) and least-privilege principles.

## 5. Sub-processors
Controller authorizes the use of the following sub-processors:
- **Google Cloud Platform (Vertex AI):** AI model processing (US-East).
- **MongoDB Atlas:** Database hosting (US-East).
- **Netlify:** Application hosting and edge computing.
- **Upstash:** Distributed caching and rate limiting.

## 6. Data Breach Notification
Processor shall notify Controller within 48 hours of becoming aware of a personal data breach.
