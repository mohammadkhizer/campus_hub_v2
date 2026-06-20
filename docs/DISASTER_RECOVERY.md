# CampusHub Disaster Recovery (DR) Plan
> Classification: CRITICAL · ENGINEERING · RECOVERY

## 1. Overview
This document outlines the procedure to recreate the entire CampusHub production environment from scratch in the event of a total provider failure or account loss.

## 2. Recovery Time Objective (RTO)
- **Target:** < 30 Minutes
- **Current Capability:** ~15 Minutes (Automated via Terraform)

## 3. Recovery Procedure

### Step 1: Secret Restoration
1. Access the Doppler backup vault (Stored in offline physical security key).
2. Restore the `production` environment secrets.

### Step 2: Infrastructure Provisioning (IaC)
1. Clone the repository: `git clone https://github.com/mohammadkhizer/campus_hub_v2`
2. Navigate to `terraform/`.
3. Initialize Terraform: `terraform init`
4. Apply the configuration: `terraform apply -auto-approve`
   - This recreates: MongoDB Atlas Cluster, Upstash Redis, and Netlify Project.

### Step 3: Database Restoration
1. Log into MongoDB Atlas.
2. Navigate to "Cloud Backup" -> "Restore".
3. Select the latest point-in-time snapshot.
4. Restore to the newly created cluster.

### Step 4: DNS & Traffic Shift
1. Update DNS records (Cloudflare/Route53) to point to the new Netlify instance.
2. Verify SSL certificates are active.

## 4. DR Drill Log
| Date | Scope | Result | Notes |
|------|-------|--------|-------|
| 2026-05-16 | Initial Plan | ✅ DRAFTED | Baseline for automation established. |

## 5. Contact
- **Primary:** Mohammad Khizer (CTO)
- **Secondary:** SRE On-Call
