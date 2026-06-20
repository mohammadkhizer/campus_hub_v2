# CampusHub VPS Deployment Guide
> Classification: EXTERNAL · CUSTOMER · SELF-HOSTING

## 1. Prerequisites
- Ubuntu 22.04 LTS VPS
- Minimum 2 vCPU, 4GB RAM
- Domain name pointed to VPS IP
- Root access

## 2. Environment Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker

# Install Nginx & Certbot
sudo apt install nginx certbot python3-certbot-nginx -y
```

## 3. Application Deployment
1. Clone the handoff package to `/opt/campus_hub`.
2. Configure environment variables in `.env`:
   ```bash
   MONGODB_URI=mongodb://mongodb:27017/campushub
   AUTH_SECRET=your_32_char_secret
   NEXTAUTH_URL=https://yourdomain.com
   UPSTASH_REDIS_REST_URL=http://redis:6379
   ```
3. Launch the stack:
   ```bash
   sudo docker-compose up -d
   ```

## 4. SSL & Nginx Configuration
```bash
# Configure Nginx as reverse proxy
# (Provide template for /etc/nginx/sites-available/default)

# Obtain SSL Certificate
sudo certbot --nginx -d yourdomain.com
```

## 5. Security & Maintenance
- **UFW:** Only allow 22, 80, 443.
- **Backups:** Use `scripts/backup.sh` for daily database dumps.
- **Updates:** Run `scripts/update.sh` to pull latest image and restart.
