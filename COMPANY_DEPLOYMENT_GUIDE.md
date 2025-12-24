# 🏢 Company Server Deployment Guide

**Last Updated**: December 22, 2025  
**Status**: Active  
**Infrastructure**: UHC Cloud (Internal)

---

## 🎯 Overview

This guide covers deployment to company-managed servers instead of cloud providers (DigitalOcean, AWS, etc.). All deployments require **VPN access** to UHC Cloud infrastructure.

---

## 🖥️ Server Infrastructure

### Staging (UAT) Server

```yaml
Environment:  UAT/Staging
VM Name:      tnt-staging
Domain:       tnt-staging.apeiro-digital.com
IP Address:   10.10.101.181 (private)
User:         ubuntu
Port:         443 (HTTPS)
Memory:       64 GB RAM
CPU:          16 cores
Storage:      1 TB
OS:           Ubuntu 22.04 LTS (assumed)
Network:      UHC Cloud VPN required
Auth:         PEM private key (kenya-tnt-staging.pem)
```

**Purpose:**
- Staging environment for Kenya TNT System
- UAT testing for Mobile App backend
- Pre-production validation
- Client demos and testing

### Production Server

```yaml
Status:       Not provisioned yet
Expected:     Q1 2026
Specs:        Similar to staging (64GB RAM, 16 cores)
Network:      UHC Cloud VPN required
Domain:       TBD (likely tnt.apeiro-digital.com)
```

---

## 🔐 Access Requirements

### 1. VPN Connection

**Required For:**
- SSH access to servers
- Deployment via CI/CD
- Database connections
- Application testing
- Log access

**How to Get Access:**
1. Contact IT/DevOps team
2. Request UHC Cloud VPN credentials
3. Receive VPN config file (.ovpn)
4. Install VPN client (OpenVPN, WireGuard)

**VPN Client Setup (OpenVPN Example):**
```bash
# macOS
brew install openvpn
sudo openvpn --config uhc-cloud.ovpn

# Linux
sudo apt install openvpn
sudo openvpn --config uhc-cloud.ovpn

# Windows
# Download OpenVPN GUI from openvpn.net
# Import uhc-cloud.ovpn config
```

**Verify VPN Connection:**
```bash
# Test connectivity to staging server
ping 10.10.101.181

# Test SSH (with PEM key)
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181

# Test HTTPS endpoint
curl -k https://tnt-staging.apeiro-digital.com/api/health
```

### 2. PEM Private Key

**File:** `kenya-tnt-staging.pem`  
**Location:** Provided by DevOps team  
**Usage:** SSH authentication to staging server

**Setup:**
```bash
# 1. Create secure key storage directory
mkdir -p ~/keys
chmod 700 ~/keys

# 2. Save PEM file (get from DevOps)
# Save as: ~/keys/kenya-tnt-staging.pem

# 3. Set correct permissions (critical!)
chmod 400 ~/keys/kenya-tnt-staging.pem

# 4. Test SSH connection (VPN must be connected first!)
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181

# 5. Add to .gitignore globally
echo "*.pem" >> ~/.gitignore_global
```

**Security Rules:**
- ✅ Store in `~/keys/` or `~/.ssh/`
- ✅ Use `chmod 400` (read-only for owner)
- ✅ Add to `.gitignore`
- ✅ Upload to GitHub Secrets for CI/CD
- ❌ Never commit to git
- ❌ Never share via email/Slack
- ❌ Never share via public cloud storage

---

## 🚀 Deployment Methods

### Method 1: GitHub Actions CI/CD (Recommended)

**Prerequisites:**
- GitHub repository with workflows
- GitHub Secrets configured
- VPN connectivity in CI/CD runner

**Setup GitHub Secrets:**
```bash
# Docker Registry
gh secret set DOCKER_REGISTRY_URL --body "cloud-taifacare.dha.go.ke"
gh secret set DOCKER_REGISTRY_USERNAME --body "admin"
gh secret set DOCKER_REGISTRY_PASSWORD --body "9142d696-121d-4232-a2ff-333b7bae4489"

# Staging Server
gh secret set STAGING_API_URL --body "https://tnt-staging.apeiro-digital.com/api"
gh secret set STAGING_SERVER_IP --body "10.10.101.181"
gh secret set STAGING_SERVER_USER --body "ubuntu"
gh secret set STAGING_SERVER_SSH_KEY < ~/keys/kenya-tnt-staging.pem

# Verify secrets
gh secret list
```

**CI/CD Workflow (VPN Requirement):**

**Option A: Self-Hosted Runner Inside VPN**
```yaml
# .github/workflows/ci-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: self-hosted  # Runner inside VPN network
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Test VPN connectivity
        run: ping -c 4 10.10.101.181
      
      - name: Deploy to staging
        run: |
          ssh -i <(echo "${{ secrets.STAGING_SERVER_SSH_KEY }}") \
            ubuntu@10.10.101.181 \
            "cd /opt/kenya-tnt && docker-compose -f docker-compose.staging.yml pull && docker-compose -f docker-compose.staging.yml up -d"
```

**Option B: GitHub-Hosted Runner with VPN Action**
```yaml
# .github/workflows/ci-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Connect to VPN
        uses: kota65535/github-openvpn-connect-action@v2
        with:
          config_file: .github/vpn/uhc-cloud.ovpn
          username: ${{ secrets.VPN_USERNAME }}
          password: ${{ secrets.VPN_PASSWORD }}
      
      - name: Test VPN connectivity
        run: ping -c 4 10.10.101.181
      
      - name: Deploy to staging
        run: |
          ssh -i <(echo "${{ secrets.STAGING_SERVER_SSH_KEY }}") \
            ubuntu@10.10.101.181 \
            "cd /opt/kenya-tnt && docker-compose -f docker-compose.staging.yml pull && docker-compose -f docker-compose.staging.yml up -d"
```

### Method 2: Manual Deployment (Developer Machine)

**Prerequisites:**
- VPN connected
- PEM key configured
- Docker Compose files ready

**Deploy Script:**
```bash
#!/bin/bash
# deploy-staging.sh

set -e

echo "🔌 Checking VPN connection..."
ping -c 2 10.10.101.181 || { echo "❌ VPN not connected!"; exit 1; }

echo "🔑 Testing SSH access..."
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 "echo '✅ SSH works'"

echo "🚀 Deploying to staging..."
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 << 'EOF'
  cd /opt/kenya-tnt
  git pull origin staging
  docker-compose -f docker-compose.staging.yml pull
  docker-compose -f docker-compose.staging.yml up -d
  docker-compose -f docker-compose.staging.yml ps
EOF

echo "✅ Deployment complete!"
echo "🌐 Check: https://tnt-staging.apeiro-digital.com"
```

**Run deployment:**
```bash
chmod +x deploy-staging.sh
./deploy-staging.sh
```

### Method 3: VS Code Remote SSH

**Setup:**
```bash
# ~/.ssh/config
Host tnt-staging
  HostName 10.10.101.181
  User ubuntu
  IdentityFile ~/keys/kenya-tnt-staging.pem
  StrictHostKeyChecking no
```

**Connect:**
1. Connect to VPN
2. VS Code → Remote-SSH → Connect to Host
3. Select `tnt-staging`
4. Work directly on server

---

## 🏗️ Server Setup (First-Time Only)

### Initial Server Configuration

**Run on staging server (via SSH):**
```bash
# Connect to server
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Create application directory
sudo mkdir -p /opt/kenya-tnt
sudo chown ubuntu:ubuntu /opt/kenya-tnt

# Clone repository
cd /opt/kenya-tnt
git clone https://github.com/your-org/kenya-tnt-system.git .

# Set up environment file
cp env.staging.template .env.staging
vim .env.staging  # Configure environment variables

# Install SSL certificate (if needed)
sudo apt install certbot nginx -y
sudo certbot --nginx -d tnt-staging.apeiro-digital.com

# Start application
docker-compose -f docker-compose.staging.yml up -d
```

---

## 🔍 Monitoring & Maintenance

### Check Application Status

```bash
# SSH to server
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181

# Check running containers
docker ps

# Check logs
docker-compose -f /opt/kenya-tnt/docker-compose.staging.yml logs -f

# Check resource usage
docker stats

# Check disk usage
df -h
docker system df
```

### Common Maintenance Tasks

**Restart application:**
```bash
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 \
  "cd /opt/kenya-tnt && docker-compose -f docker-compose.staging.yml restart"
```

**View logs:**
```bash
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 \
  "cd /opt/kenya-tnt && docker-compose -f docker-compose.staging.yml logs --tail=100 -f backend"
```

**Update application:**
```bash
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 \
  "cd /opt/kenya-tnt && git pull && docker-compose -f docker-compose.staging.yml up -d --build"
```

**Clean up Docker:**
```bash
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 \
  "docker system prune -af --volumes"
```

---

## 🐛 Troubleshooting

### Issue: Can't connect to server

**Symptoms:**
```
ssh: connect to host 10.10.101.181 port 22: Operation timed out
```

**Solution:**
```bash
# 1. Check VPN connection
ping 10.10.101.181

# 2. If ping fails, reconnect to VPN
sudo openvpn --config uhc-cloud.ovpn

# 3. Try SSH again
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181
```

### Issue: Permission denied (publickey)

**Symptoms:**
```
Permission denied (publickey).
```

**Solution:**
```bash
# 1. Check PEM file permissions
ls -l ~/keys/kenya-tnt-staging.pem
# Should show: -r-------- (400)

# 2. Fix permissions if wrong
chmod 400 ~/keys/kenya-tnt-staging.pem

# 3. Verify correct key file
ssh -i ~/keys/kenya-tnt-staging.pem -v ubuntu@10.10.101.181
```

### Issue: GitHub Actions fails to deploy

**Symptoms:**
```
Error: Connection timeout to 10.10.101.181
```

**Solution:**

**If using self-hosted runner:**
```bash
# 1. SSH to runner machine
# 2. Test VPN connectivity
ping 10.10.101.181

# 3. Restart runner if needed
```

**If using GitHub-hosted runner:**
```yaml
# Add VPN connection step to workflow (see Method 1, Option B above)
```

### Issue: SSL certificate errors

**Symptoms:**
```
curl: (60) SSL certificate problem: self signed certificate
```

**Solution:**
```bash
# Temporary: Skip verification (testing only)
curl -k https://tnt-staging.apeiro-digital.com/api/health

# Permanent: Install valid SSL certificate
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181
sudo certbot --nginx -d tnt-staging.apeiro-digital.com
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] VPN credentials obtained
- [ ] VPN connected and tested
- [ ] PEM file secured (`chmod 400`)
- [ ] SSH access verified
- [ ] GitHub Secrets configured
- [ ] Environment variables ready
- [ ] Code changes committed to staging branch

### Deployment
- [ ] VPN connected
- [ ] CI/CD pipeline triggered (or manual deploy)
- [ ] Deployment script runs successfully
- [ ] Containers started
- [ ] Health check passes

### Post-Deployment
- [ ] Application accessible (https://tnt-staging.apeiro-digital.com)
- [ ] API health check passes
- [ ] Database connectivity verified
- [ ] Logs checked for errors
- [ ] Smoke tests pass
- [ ] Stakeholders notified

---

## 🔐 Security Best Practices

### PEM Key Management
1. **Store securely**: `~/keys/` with `chmod 700`
2. **File permissions**: `chmod 400` on PEM file
3. **Never commit**: Add `*.pem` to `.gitignore`
4. **Rotate regularly**: Request new keys quarterly
5. **Audit access**: Track who has keys

### VPN Management
1. **Personal credentials**: Don't share VPN accounts
2. **Auto-disconnect**: Configure VPN timeout
3. **Audit logs**: IT monitors VPN connections
4. **Revoke access**: Notify IT when team member leaves

### Server Access
1. **Principle of least privilege**: Only grant necessary access
2. **Sudo usage**: Use `sudo` sparingly, log all usage
3. **Audit logs**: Review `/var/log/auth.log` regularly
4. **Fail2ban**: Configure automatic IP blocking for failed attempts

---

## 📊 Server Specifications Comparison

| Environment | Domain | RAM | CPU | Storage | Status |
|-------------|--------|-----|-----|---------|--------|
| **Development** | localhost | 8-16 GB | 4-8 | 256 GB | Local machine |
| **Staging (UAT)** | tnt-staging.apeiro-digital.com | 64 GB | 16 | 1 TB | ✅ Active |
| **Production** | TBD | 64+ GB | 16+ | 1+ TB | 🔜 Q1 2026 |

---

## 🆘 Support

### DevOps Team Contacts
- **VPN Access**: IT Support (it@apeiro-digital.com)
- **PEM Keys**: DevOps Team (devops@apeiro-digital.com)
- **Server Issues**: Infrastructure Team
- **Emergency**: On-call engineer (via PagerDuty)

### Documentation
- **This Guide**: `COMPANY_DEPLOYMENT_GUIDE.md`
- **Transformation Guide**: `TRANSFORM_ANY_PROJECT.md`
- **Development Workflow**: `DEVELOPMENT_WORKFLOW.md`
- **NFR Matrix**: `NFR_MATRIX.md`

---

**Last Updated**: December 22, 2025  
**Next Review**: March 22, 2026  
**Maintained By**: DevOps Team

---

🏢 **Company Infrastructure - Secure, Reliable, Professional** 🚀

