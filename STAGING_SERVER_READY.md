# 🎉 Staging Server Setup Complete!

**Date**: December 22, 2025  
**Server**: tnt-staging.apeiro-digital.com (10.10.101.181)  
**Status**: ✅ Ready for deployment

---

## ✅ What's Installed

### Server Details
```
Hostname:     tnt-staging
OS:           Ubuntu 22.04.5 LTS
Memory:       62 GB RAM (available)
CPU:          16 cores
Disk:         916 GB (98% free)
Uptime:       1 day
IP:           10.10.101.181 (private - VPN required)
```

### Software Installed
- ✅ **Docker 29.1.3** - Latest version
- ✅ **Docker Compose v5.0.0** - Latest version
- ✅ **Git** - For repository management
- ✅ **Vim** - Text editor
- ✅ **Curl** - For API testing
- ✅ **Application directory** - `/opt/kenya-tnt` (empty, ready for code)

---

## 🚀 Quick Deploy Commands

### Deploy Your Application (First Time)

```bash
# Method 1: Using deploy script (easiest!)
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
./deploy-to-staging.sh https://github.com/YOUR-ORG/kenya-tnt-system.git staging
```

### Deploy Manually

```bash
# 1. SSH to server
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181

# 2. Clone repository
cd /opt/kenya-tnt
git clone https://github.com/YOUR-ORG/kenya-tnt-system.git .
git checkout staging

# 3. Create environment file
cp env.staging.template .env.staging
vim .env.staging  # Add your environment variables

# 4. Start application
docker compose -f docker-compose.staging.yml up -d

# 5. Check logs
docker compose -f docker-compose.staging.yml logs -f
```

---

## 📋 Available Scripts

### 1. Test Connection
```bash
./test-staging-connection.sh
```
**Purpose**: Verify VPN and SSH connectivity  
**When to use**: Before any deployment

### 2. Deploy Application
```bash
./deploy-to-staging.sh [REPO_URL] [BRANCH]
```
**Purpose**: Deploy or update application  
**When to use**: Initial deployment or updates  
**Example**: `./deploy-to-staging.sh https://github.com/insen5/kenya-tnt-system.git staging`

### 3. Setup Server (Already Done!)
```bash
./setup-staging-server.sh
```
**Purpose**: First-time server setup  
**Status**: ✅ Already completed  
**When to use**: Only once per fresh server

---

## 🔍 Verify Installation

Test that everything works:

```bash
# Check Docker
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 "docker --version"
# Expected: Docker version 29.1.3, build f52814d

# Check Docker Compose
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 "docker compose version"
# Expected: Docker Compose version v5.0.0

# Check app directory
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 "ls -la /opt/kenya-tnt"
# Expected: Empty directory owned by ubuntu user
```

---

## 📝 Environment Variables

Before deploying, you'll need to create `.env.staging` with:

```bash
# Database
DATABASE_HOST=your_db_host
DATABASE_PORT=5432
DATABASE_NAME=kenya_tnt_db
DATABASE_USER=tnt_user
DATABASE_PASSWORD=your_secure_password

# API
API_PORT=4000
NODE_ENV=staging

# External Services
PPB_API_URL=https://ppb-api.example.com
HIE_UAT_URL=https://hie-uat.example.com

# Docker Registry
DOCKER_REGISTRY_URL=cloud-taifacare.dha.go.ke
DOCKER_REGISTRY_USERNAME=admin
DOCKER_REGISTRY_PASSWORD=your_registry_password

# Add other environment-specific variables...
```

---

## 🌐 Access URLs

### Once Deployed:

- **Application**: https://tnt-staging.apeiro-digital.com
- **API**: https://tnt-staging.apeiro-digital.com/api
- **Health Check**: https://tnt-staging.apeiro-digital.com/api/health

⚠️ **Note**: SSL certificates not yet installed. You may need to:
1. Install Let's Encrypt certificate
2. Configure Nginx reverse proxy
3. Or access via HTTP initially

---

## 🔧 Common Operations

### View Logs
```bash
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 \
  "cd /opt/kenya-tnt && docker compose -f docker-compose.staging.yml logs -f"
```

### Restart Application
```bash
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 \
  "cd /opt/kenya-tnt && docker compose -f docker-compose.staging.yml restart"
```

### Stop Application
```bash
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 \
  "cd /opt/kenya-tnt && docker compose -f docker-compose.staging.yml down"
```

### Update Application
```bash
# Use the deploy script - it handles updates automatically
./deploy-to-staging.sh https://github.com/YOUR-ORG/kenya-tnt-system.git staging
```

### Check Container Status
```bash
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 \
  "docker ps"
```

### Clean Up Docker
```bash
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 \
  "docker system prune -af"
```

---

## 🔐 Security Checklist

- [x] VPN required for access
- [x] SSH key authentication only (no password)
- [x] PEM file secured with 400 permissions
- [x] Server firewalled (only accessible via VPN)
- [ ] SSL certificate (install when deploying app)
- [ ] Environment variables (create .env.staging)
- [ ] Secrets in GitHub Secrets (for CI/CD)

---

## 📊 Server Monitoring

### Check Resource Usage
```bash
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 << 'EOF'
  echo "=== CPU & Memory ==="
  top -bn1 | head -20
  
  echo ""
  echo "=== Disk Usage ==="
  df -h
  
  echo ""
  echo "=== Docker Stats ==="
  docker stats --no-stream
EOF
```

### Check System Updates
```bash
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 \
  "sudo apt update && apt list --upgradable"
```

---

## 🚨 Troubleshooting

### Can't connect to server
**Issue**: `Connection timeout`  
**Solution**: Connect to UHC Cloud VPN first

### Permission denied
**Issue**: `Permission denied (publickey)`  
**Solution**: Check PEM file permissions: `chmod 400 ~/keys/kenya-tnt-staging.pem`

### Docker not found
**Issue**: `docker: command not found`  
**Solution**: Already installed! Try: `docker --version`

### Application not accessible
**Issue**: Can't reach https://tnt-staging.apeiro-digital.com  
**Possible causes**:
1. Application not deployed yet
2. SSL not configured
3. Nginx not set up
4. Firewall blocking port 443

**Next steps**:
1. Deploy application first
2. Configure SSL/Nginx
3. Check firewall rules

---

## 📚 Documentation References

- **This Guide**: `STAGING_SERVER_READY.md` ← You are here
- **Deployment Guide**: [COMPANY_DEPLOYMENT_GUIDE.md](./COMPANY_DEPLOYMENT_GUIDE.md)
- **Quick Reference**: [DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md)
- **Transform Projects**: [TRANSFORM_ANY_PROJECT.md](./TRANSFORM_ANY_PROJECT.md)
- **PEM Setup**: [PEM_FILE_SETUP_COMPLETE.md](./PEM_FILE_SETUP_COMPLETE.md)
- **All Documentation**: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## ✅ Next Steps

### Immediate (Do These Now):

1. **Clone Your Repository**
   ```bash
   ./deploy-to-staging.sh https://github.com/YOUR-ORG/kenya-tnt-system.git staging
   ```

2. **Create Environment File**
   ```bash
   ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181
   cd /opt/kenya-tnt
   vim .env.staging  # Add your environment variables
   ```

3. **Start Application**
   ```bash
   docker compose -f docker-compose.staging.yml up -d
   ```

### Soon (Within 24 Hours):

4. **Install SSL Certificate**
   ```bash
   ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181
   sudo apt install certbot nginx -y
   sudo certbot --nginx -d tnt-staging.apeiro-digital.com
   ```

5. **Configure GitHub Actions**
   - Add secrets to GitHub repository
   - Enable CI/CD workflows
   - Test automated deployments

6. **Set Up Monitoring**
   - Configure health checks
   - Set up logging
   - Add alerting (optional)

---

## 🎉 Summary

**Server Status**: ✅ READY FOR DEPLOYMENT

**What's Done**:
- ✅ Docker and Docker Compose installed
- ✅ Application directory created
- ✅ PEM file configured and secured
- ✅ VPN connectivity verified
- ✅ SSH access working
- ✅ Deploy scripts created

**What's Next**:
1. Deploy your code
2. Configure environment variables
3. Set up SSL
4. Test application
5. Configure CI/CD

**You're ready to deploy!** 🚀

---

**Last Updated**: December 22, 2025  
**Maintained By**: DevOps Team  
**Server Owner**: Apeiro Digital

---

🏢 **Company Infrastructure - Professional Deployment Ready!** 🎯

