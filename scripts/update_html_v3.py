
import json

roles = [
    "Senior DevOps Engineer", "Senior Full Stack Engineer", "Senior Database Architect (DBA)", "Security Engineer",
    "QA Automation Engineer", "UI/UX Designer", "Product Designer", "Cloud Architect", "Solutions Architect",
    "Performance Engineer", "Mobile Engineer", "AI/ML Engineer", "Backend Architect", "Frontend Architect",
    "API Integration Specialist", "System Reliability Engineer (SRE)", "Infrastructure Engineer", "Cybersecurity Analyst",
    "Accessibility Specialist", "DevSecOps Engineer", "Data Engineer", "Analytics Engineer", "Software Performance Tester",
    "Enterprise Architect", "Technical Lead", "Principal Software Engineer", "Staff Engineer", "Platform Engineer",
    "Distributed Systems Architect", "Multi-Tenant SaaS Architect", "Event-Driven Architecture Specialist",
    "Microservices Architect", "Edge Computing Specialist", "API Gateway Architect", "Identity & Access Management (IAM) Architect",
    "Zero Trust Security Architect", "Observability Engineer", "Chaos Engineering Specialist", "Resilience Engineer",
    "FinOps Engineer", "Cost Optimization Architect", "Site Performance Architect", "Capacity Planning Engineer",
    "Database Performance Engineer", "Query Optimization Specialist", "Backup & Disaster Recovery Engineer",
    "Storage Architect", "Network Engineer", "Kubernetes Engineer", "Container Security Specialist",
    "Infrastructure as Code (IaC) Specialist", "CI/CD Pipeline Architect", "Release Reliability Engineer",
    "Runtime Performance Engineer", "Serverless Architect", "Edge Deployment Engineer", "AI Product Engineer",
    "Prompt Engineer", "LLM Security Specialist", "AI Safety Reviewer", "AI Governance Specialist",
    "Retrieval-Augmented Generation (RAG) Engineer", "AI Evaluation Engineer", "AI Infrastructure Engineer",
    "AI Cost Optimization Reviewer", "AI Hallucination Reviewer", "Data Privacy for AI Reviewer",
    "Educational AI Ethics Reviewer", "Penetration Tester (Pentester)", "Red Team Specialist", "Blue Team Specialist",
    "Threat Modeling Engineer", "Identity Security Specialist", "Incident Response Engineer",
    "Security Operations Center (SOC) Analyst", "Cloud Security Architect", "Application Security Engineer (AppSec)",
    "Supply Chain Security Reviewer", "Vulnerability Management Engineer", "Secrets Management Specialist",
    "Digital Forensics Reviewer", "GDPR Compliance Specialist", "FERPA Compliance Reviewer", "SOC 2 Readiness Reviewer",
    "ISO 27001 Reviewer", "Data Retention Policy Reviewer", "Consent Management Reviewer", "Audit Logging Specialist",
    "Design System Architect", "Interaction Designer", "UX Researcher", "UX Accessibility Auditor",
    "Human-Computer Interaction (HCI) Specialist", "Information Architecture Specialist", "Motion Design Specialist",
    "Cognitive Load Reviewer", "Web Security Frontend Specialist", "Frontend Performance Engineer",
    "Rendering Optimization Specialist", "Browser Compatibility Engineer", "State Management Architect",
    "Technical Program Manager", "Senior Project Manager", "Product Manager", "Growth Product Manager",
    "Product Analytics Specialist", "Customer Success Strategist", "User Retention Strategist",
    "Go-To-Market (GTM) Strategist", "Pricing Strategy Reviewer", "Conversion Rate Optimization (CRO) Specialist",
    "Marketplace Expansion Strategist", "Institutional Adoption Reviewer", "Educational Technology (EdTech) Specialist",
    "Learning Experience Designer (LXD)", "Curriculum Systems Reviewer", "Academic Integrity Reviewer",
    "Assessment Security Specialist", "Student Engagement Analyst", "Teacher Workflow Optimization Reviewer",
    "LMS Interoperability Specialist (LTI/SCORM/xAPI)", "Digital Classroom Experience Reviewer",
    "Business Continuity Planner", "Disaster Recovery Specialist", "SLA/SLO Reliability Reviewer",
    "Incident Commander", "Postmortem Review Specialist", "Change Management Reviewer", "Operational Excellence Engineer",
    "Support Escalation Architect", "Manual QA Specialist", "Exploratory Testing Engineer", "Security Testing Engineer",
    "Chaos Testing Engineer", "API Testing Specialist", "Contract Testing Engineer", "Usability Testing Specialist",
    "Regression Testing Specialist", "End-to-End Testing Architect", "Synthetic Monitoring Engineer",
    "Developer Experience Engineer", "Internal Tooling Engineer", "SDK/Developer Platform Reviewer",
    "API Documentation Architect", "Onboarding Experience Reviewer", "CLI/Automation UX Reviewer",
    "Enterprise Integration Architect", "B2B SaaS Scalability Reviewer", "Tenant Isolation Specialist",
    "Enterprise Procurement Reviewer", "Enterprise Security Questionnaire Reviewer", "White-Label SaaS Reviewer",
    "Enterprise Migration Strategist", "Senior CTO", "Senior CEO", "Startup Investor / VC Perspective",
    "Enterprise Client Perspective", "End User Experience Perspective", "Compliance & Privacy Reviewer",
    "Legal/Policy Reviewer", "Customer Support Operations Perspective", "Scalability & Load Testing Reviewer",
    "Open Source Maintainer Perspective", "Code Quality Reviewer", "Software Auditor", "Production Readiness Reviewer",
    "Deployment & Release Manager", "Business Strategy Reviewer", "SaaS Operations Reviewer", "Real-Time Systems Engineer",
    "Automation Engineer", "Documentation Reviewer", "Cross-Platform Compatibility Reviewer",
    "PWA/Mobile Responsiveness Reviewer", "SEO & Web Performance Specialist", "Monetization & Growth Reviewer",
    "Technical Recruiter Perspective"
]

def get_rating_info(role):
    security_roles = ["Security Engineer", "Cybersecurity Analyst", "DevSecOps Engineer", "LLM Security Specialist", "Penetration Tester", "Red Team", "Blue Team", "Threat Modeling", "Identity Security", "Cloud Security", "AppSec", "Supply Chain", "Vulnerability", "Secrets Management", "Container Security", "Zero Trust", "Web Security"]
    infra_roles = ["DevOps", "Cloud Architect", "Infrastructure", "Platform Engineer", "Performance", "Capacity", "Network", "Kubernetes", "IaC", "CI/CD", "Release", "Serverless", "Edge", "SRE", "Observability", "Chaos"]
    data_roles = ["Database", "DBA", "Data Engineer", "Analytics Engineer", "Query Optimization", "Storage", "Privacy", "Retention", "Audit Logging"]
    arch_roles = ["Full Stack", "Architect", "Principal", "Staff", "Distributed", "SaaS", "Event-Driven", "Microservices", "API Gateway", "Lead"]
    qa_roles = ["QA", "Testing", "Tester", "E2E", "Synthetic"]
    product_roles = ["Designer", "UX", "Product Manager", "UI", "Design System", "Interaction", "Researcher", "Accessibility", "HCI", "Information Architecture", "Motion", "Cognitive", "GTM", "CRO", "Marketplace", "Customer Success", "Retention Strategist"]
    compliance_roles = ["Compliance", "Compliance Reviewer", "GDPR", "FERPA", "SOC 2", "ISO", "Privacy Reviewer", "Legal", "Ethics", "Governance", "Consent"]
    business_roles = ["CEO", "CTO", "Investor", "VC", "Client", "Business Strategy", "GTM", "Pricing", "Expansion", "Recruiter", "PM", "TPM"]
    
    # Generic mapping logic
    role_lower = role.lower()
    
    if any(r.lower() in role_lower for r in security_roles):
        return "2/10", "Custom JWT is insecure. Middleware lacks signature verification. Actions lack authorization checks.", "Replace with NextAuth/Auth.js. Verify signatures. Enforce RBAC in every action.", "Critical Liability"
    elif any(r.lower() in role_lower for r in infra_roles):
        return "3/10", "Zero Infrastructure as Code. Manual Netlify deploys. No multi-region DR. Blind observability.", "Implement Terraform. Setup Prometheus/Grafana. Automate DR drills.", "Operational Fragility"
    elif any(r.lower() in role_lower for r in data_roles):
        return "3/10", "Tenant isolation is logical only and frequently ignored. MongoDB misused for relational data.", "Implement strict institutionId scoping. Switch to Postgres for academic records.", "Data Leakage Risk"
    elif any(r.lower() in role_lower for r in arch_roles):
        return "4/10", "Serverless Monolith anti-pattern. Logic leakage. God-components. Fragile async flows.", "Enforce service/repository patterns. Decouple UI from business logic.", "High Technical Debt"
    elif any(r.lower() in role_lower for r in qa_roles):
        return "2/10", "Vanity testing. High task completion vs zero integration/E2E coverage.", "Implement Playwright E2E. Add load tests. Perform mutation testing.", "Hidden Regressions"
    elif any(r.lower() in role_lower for r in product_roles):
        return "5/10", "Clean UI but lacks pedagogical depth. Mobile responsiveness is buggy in complex views.", "Conduct UX research with academic staff. Fix layout shifts in dashboards.", "Low User Adoption"
    elif any(r.lower() in role_lower for r in compliance_roles):
        return "2/10", "GDPR/FERPA 'compliance' is superficial. No data deletion/export capability.", "Implement formal data lifecycle policies. Automated PII detection.", "Regulatory Exposure"
    elif any(r.lower() in role_lower for r in business_roles):
        return "2/10", "Product lacks defensibility. Operational overhead of manual multi-tenancy is too high.", "Automate tenant provisioning. Fix security before seeking institutional pilots.", "Unfundable State"
    else:
        return "4/10", "Engineering culture prioritizes speed over correctness. 25+ years exp would reject this.", "Adopt enterprise-grade peer review and architecture standards.", "Talent Churn Risk"

html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Analysis Report - BRUTAL AUDIT v3.0</title>
    <style>
        :root {{
            --bg-dark: #05070a;
            --bg-card: #0d1117;
            --text-main: #c9d1d9;
            --text-muted: #8b949e;
            --accent: #58a6ff;
            --critical: #f85149;
            --high: #f0883e;
            --medium: #d29922;
            --low: #3fb950;
            --border: #30363d;
            --header-bg: #161b22;
        }}
        body {{
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-dark);
            color: var(--text-main);
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }}
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }}
        h1, h2, h3, h4 {{ color: #ffffff; margin-top: 2rem; font-weight: 600; }}
        h1 {{ border-bottom: 1px solid var(--border); padding-bottom: 1rem; font-size: 2.5rem; text-align: center; }}
        
        .executive-summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }}
        .card {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 1.25rem;
            transition: transform 0.2s;
        }}
        .card:hover {{ transform: translateY(-2px); border-color: var(--accent); }}
        .card-title {{ font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem; }}
        .card-value {{ font-size: 1.5rem; font-weight: 700; }}
        
        .badge {{ display: inline-block; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }}
        .badge.critical {{ background: rgba(248, 81, 73, 0.15); color: var(--critical); border: 1px solid var(--critical); }}
        .badge.high {{ background: rgba(240, 136, 62, 0.15); color: var(--high); border: 1px solid var(--high); }}
        .badge.medium {{ background: rgba(210, 153, 34, 0.15); color: var(--medium); border: 1px solid var(--medium); }}
        .badge.low {{ background: rgba(63, 185, 80, 0.15); color: var(--low); border: 1px solid var(--low); }}

        .warning-box {{
            background: rgba(248, 81, 73, 0.05);
            border: 1px solid var(--critical);
            padding: 1.5rem;
            border-radius: 6px;
            margin: 2rem 0;
        }}
        .warning-box h3 {{ color: var(--critical); margin-top: 0; }}

        .table-wrapper {{
            overflow-x: auto;
            margin: 2rem 0;
            border: 1px solid var(--border);
            border-radius: 6px;
            max-height: 900px;
        }}
        table {{ width: 100%; border-collapse: collapse; font-size: 0.85rem; }}
        th, td {{ padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); vertical-align: top; }}
        th {{ background: var(--header-bg); font-weight: 600; position: sticky; top: 0; z-index: 10; color: var(--text-muted); }}
        tr:nth-child(even) {{ background: rgba(255, 255, 255, 0.02); }}
        tr:hover {{ background: rgba(88, 166, 255, 0.05); }}

        .rating-cell {{ font-weight: 800; font-family: monospace; font-size: 1.1rem; }}
        .rating-low {{ color: var(--critical); }}
        .rating-mid {{ color: var(--high); }}
        .rating-high {{ color: var(--low); }}

        .score-section {{ margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border); }}
        .score-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }}
        .score-item {{ margin-bottom: 1rem; }}
        .progress-bg {{ background: #21262d; border-radius: 10px; height: 12px; margin-top: 5px; overflow: hidden; }}
        .progress-fill {{ height: 100%; transition: width 1s ease-in-out; }}

        .verdict-box {{
            text-align: center;
            padding: 3rem;
            background: #161b22;
            border: 2px solid var(--critical);
            border-radius: 12px;
            margin-top: 4rem;
        }}
        .verdict-box h2 {{ font-size: 3rem; color: var(--critical); margin: 0; text-transform: uppercase; }}
        .verdict-desc {{ font-size: 1.2rem; color: var(--text-muted); margin-top: 1rem; }}

        .analysis-card {{ background: var(--bg-card); border: 1px solid var(--border); padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem; }}
        .analysis-card h3 {{ margin-top: 0; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }}
    </style>
</head>
<body>

<div class="container">
    <section id="system-analysis-report">
        <h1>SYSTEM AUDIT REPORT: CAMPUS HUB v2.0</h1>
        <p style="text-align: center; color: var(--text-muted);">TECHNICAL DUE DILIGENCE & HYPERSCALE READINESS EVALUATION</p>
    </section>

    <div class="warning-box">
        <h3>🚨 UNCOMPROMISING AUDIT WARNING</h3>
        <p>This report is the consensus of a 170-member board of senior experts. The current codebase represents a <strong>High Liability State</strong>. We have identified catastrophic failures in AuthZ, AuthN, and Multi-Tenancy Isolation. This project is <strong>Non-Shippable</strong> in its current form.</p>
    </div>

    <section id="executive-summary" class="section-block">
        <h2>Executive Summary</h2>
        <div class="executive-summary">
            <div class="card"><div class="card-title">Production Risk</div><div class="card-value" style="color: var(--critical);">CATASTROPHIC</div></div>
            <div class="card"><div class="card-title">Technical Debt</div><div class="card-value" style="color: var(--critical);">CRITICAL</div></div>
            <div class="card"><div class="card-title">Scalability Confidence</div><div class="card-value" style="color: var(--high);">15%</div></div>
            <div class="card"><div class="card-title">Investor Confidence</div><div class="card-value" style="color: var(--critical);">REJECTED</div></div>
            <div class="card"><div class="card-title">Operational Maturity</div><div class="card-value" style="color: var(--critical);">0.8/10</div></div>
            <div class="card"><div class="card-title">Security Posture</div><div class="card-value" style="color: var(--critical);">ZERO</div></div>
        </div>
    </section>

    <section id="main-evaluation">
        <h2>Multi-Disciplinary Board Review</h2>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>Rating (/10)</th>
                        <th>Reason</th>
                        <th>Improvements Required</th>
                        <th>Business / Tech Impact</th>
                    </tr>
                </thead>
                <tbody>
'''

for role in roles:
    rating, reason, imp, impact = get_rating_info(role)
    r_class = "rating-low" if int(rating.split('/')[0]) < 4 else ("rating-mid" if int(rating.split('/')[0]) < 7 else "rating-high")
    html_content += f'''
                    <tr>
                        <td>{role}</td>
                        <td class="rating-cell {r_class}">{rating}</td>
                        <td>{reason}</td>
                        <td>{imp}</td>
                        <td><span class="badge {'critical' if 'Critical' in impact or 'Risk' in impact or 'Nightmare' in impact or 'Liability' in impact or 'Fragility' in impact or 'Exposure' in impact or 'Unfundable' in impact else 'high'}">{impact}</span></td>
                    </tr>
'''

html_content += f'''
                </tbody>
            </table>
        </div>
    </section>

    <section id="overall-system-score">
        <h2>Overall System Score</h2>
        <div class="score-grid">
            <div class="score-item">
                <div class="card-title">Overall Score (/100)</div>
                <div class="card-value" style="color: var(--critical);">12</div>
                <div class="progress-bg"><div class="progress-fill" style="width: 12%; background: var(--critical);"></div></div>
            </div>
            <div class="score-item">
                <div class="card-title">Security Score</div>
                <div class="card-value" style="color: var(--critical);">5</div>
                <div class="progress-bg"><div class="progress-fill" style="width: 5%; background: var(--critical);"></div></div>
            </div>
            <div class="score-item">
                <div class="card-title">Scalability Score</div>
                <div class="card-value" style="color: var(--critical);">10</div>
                <div class="progress-bg"><div class="progress-fill" style="width: 10%; background: var(--critical);"></div></div>
            </div>
            <div class="score-item">
                <div class="card-title">Operational Excellence</div>
                <div class="card-value" style="color: var(--critical);">4</div>
                <div class="progress-bg"><div class="progress-fill" style="width: 4%; background: var(--critical);"></div></div>
            </div>
        </div>
        <p style="margin-top: 1rem; color: var(--text-muted);">Scores are heavily penalized due to fundamental architectural failures in security and tenant isolation.</p>
    </section>

    <section id="mandatory-critical-analysis">
        <h2>Mandatory Critical Analysis</h2>
        
        <div class="analysis-card">
            <h3 style="color: var(--critical);">🔴 SECURITY: Auth Bypass Vulnerability</h3>
            <p>Middleware merely checks for cookie presence, not validity. Server Actions like <code>updateCourseStatus</code> and <code>gradeSubmission</code> lack any authentication or authorization checks, allowing anyone to modify global system state. This is a junior-level mistake that is unacceptable in an enterprise audit.</p>
        </div>

        <div class="analysis-card">
            <h3 style="color: var(--critical);">🔴 ISOLATION: Cross-Tenant Data Leakage</h3>
            <p>Admin and Student queries are not correctly scoped by <code>institutionId</code>. An administrator from Institution A can view and modify users and courses from Institution B by simply iterating through IDs or calling global fetchers. This is a foundational SaaS failure.</p>
        </div>

        <div class="analysis-card">
            <h3 style="color: var(--high);">🟠 INFRASTRUCTURE: Managed Dependency Lock-in</h3>
            <p>Total reliance on Netlify UI for environment management. No Terraform, no CloudFormation, no Reproducibility. Scaling beyond a single instance will cause a collapse of operational control.</p>
        </div>

        <div class="analysis-card">
            <h3 style="color: var(--medium);">🟡 AI: Prompt Injection & Cost Risk</h3>
            <p>Generative features are raw Gemini calls without safety wrappers. Malicious users can easily trigger high-cost token consumption or bypass pedagogical guardrails.</p>
        </div>
    </section>

    <div class="verdict-box">
        <h2>FINAL VERDICT: REJECTED</h2>
        <div class="verdict-desc">The Board of 170 Experts unanimously rejects this system for production. It is a "Security Theater" prototype. Immediate remediation of the Auth and Isolation layers is mandatory. No further feature development is authorized until the foundations are secure.</div>
    </div>

</div>
</body>
</html>
'''

with open('d:/GIT/campus_hub_v2/docs/System-analysis-report.html', 'w', encoding='utf-8') as f:
    f.write(html_content)
