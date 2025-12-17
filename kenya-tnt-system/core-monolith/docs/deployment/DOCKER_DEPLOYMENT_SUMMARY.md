# 🐳 Docker Deployment - Complete Setup Summary

## ✅ What Was Created

Your Kenya TNT System is now **fully Dockerized** and ready for deployment to Oracle Cloud (or any server).

### 📁 New Files Created

| File | Purpose |
|------|---------|
| `core-monolith/Dockerfile` | Backend container image definition |
| `core-monolith/.dockerignore` | Files to exclude from backend build |
| `frontend/Dockerfile` | Frontend container image definition |
| `frontend/.dockerignore` | Files to exclude from frontend build |
| `frontend/next.config.ts` | Updated with standalone output for Docker |
| `docker-compose.production.yml` | **Main deployment file** - All services configured |
| `env.production.template` | Environment variables template |
| `deploy-oracle-cloud.sh` | **Automated deployment script** |
| `test-local-deployment.sh` | Local testing script |
| `ORACLE_CLOUD_DEPLOYMENT.md` | Complete Oracle Cloud guide |
| `DEPLOYMENT_README.md` | General deployment documentation |

---

## 🎯 What's Included in docker-compose.production.yml

Your unified Docker Compose file includes:

1. ✅ **PostgreSQL + PostGIS** - Database (port 5432)
2. ✅ **Kenya TNT Backend** - NestJS API (port 4000)
3. ✅ **Kenya TNT Frontend** - Next.js app (port 3002)
4. ✅ **OpenEPCIS REST API** - EPCIS service (port 8080)
5. ✅ **Kafka** - Event streaming (port 9092)
6. ✅ **Zookeeper** - Kafka dependency (port 2181)
7. ✅ **OpenSearch** - Event storage (port 9200)

All services are networked together and configured for production use.

---

## 🚀 Quick Start Guide

### Option 1: Test Locally First (Recommended)

```bash
cd kenya-tnt-system

# Test everything works on your Mac
./test-local-deployment.sh

# Access at:
# - Frontend: http://localhost:3002
# - Backend: http://localhost:4000/api
# - API Docs: http://localhost:4000/api/docs
```

If everything works, proceed to cloud deployment.

### Option 2: Deploy to Oracle Cloud Free

**Step 1: Create Oracle Cloud VM**
- Follow [ORACLE_CLOUD_DEPLOYMENT.md](./ORACLE_CLOUD_DEPLOYMENT.md) Steps 1-4
- Get an ARM VM (24GB RAM, free forever)

**Step 2: SSH into VM and Deploy**

```bash
# SSH into your VM
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_PUBLIC_IP

# Clone repository
git clone YOUR_REPO_URL
cd apeiro-digital-track-and-trace-epcis/kenya-tnt-system

# Run automated deployment
./deploy-oracle-cloud.sh

# Wait 10-15 minutes for complete setup
```

**Step 3: Access Your Application**

```
Frontend:  http://YOUR_PUBLIC_IP:3002
Backend:   http://YOUR_PUBLIC_IP:4000/api
API Docs:  http://YOUR_PUBLIC_IP:4000/api/docs
EPCIS:     http://YOUR_PUBLIC_IP:8080
```

---

## 🔧 Manual Deployment (Any Server)

If you prefer manual control:

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
sudo apt install docker-compose -y

# 2. Configure environment
cp env.production.template .env.production
nano .env.production  # Update passwords and API URL

# 3. Build and start
docker-compose -f docker-compose.production.yml build
docker-compose -f docker-compose.production.yml up -d

# 4. Check status
docker-compose -f docker-compose.production.yml ps
```

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│              Docker Compose Network                  │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐      │
│  │ Frontend │  │ Backend  │  │   EPCIS     │      │
│  │ (Next.js)│→ │ (NestJS) │→ │ (Quarkus)   │      │
│  │  :3002   │  │  :4000   │  │   :8080     │      │
│  └──────────┘  └─────┬────┘  └──────┬──────┘      │
│                      │               │              │
│                      ▼               ▼              │
│                ┌───────────┐   ┌─────────┐         │
│                │PostgreSQL │   │ Kafka   │         │
│                │ PostGIS   │   │         │         │
│                │  :5432    │   │  :9092  │         │
│                └───────────┘   └────┬────┘         │
│                                     │              │
│                                     ▼              │
│                              ┌───────────┐         │
│                              │OpenSearch │         │
│                              │  :9200    │         │
│                              └───────────┘         │
└─────────────────────────────────────────────────────┘
```

---

## 🎛️ Environment Configuration

Key variables to configure in `.env.production`:

```bash
# Database (generate secure password!)
POSTGRES_PASSWORD=<secure_random_string>

# JWT Secret (generate secure secret!)
JWT_SECRET=<secure_random_string>

# Frontend API URL
NEXT_PUBLIC_API_URL=http://YOUR_PUBLIC_IP:4000/api

# GS1 Company Prefix
GS1_COMPANY_PREFIX=8886001

# Optional: PPB Integration
PPB_TERMINOLOGY_API_URL=https://terminology.health.go.ke
PPB_TERMINOLOGY_API_KEY=your_api_key
```

Generate secure values:
```bash
openssl rand -base64 32  # For POSTGRES_PASSWORD
openssl rand -base64 32  # For JWT_SECRET
```

---

## 📝 Useful Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend
```

### Restart Services
```bash
docker-compose -f docker-compose.production.yml restart
```

### Stop Services
```bash
docker-compose -f docker-compose.production.yml down
```

### Update Application
```bash
git pull
docker-compose -f docker-compose.production.yml up -d --build
```

### Database Backup
```bash
docker exec kenya-tnt-postgres pg_dump -U tnt_user kenya_tnt_db > backup.sql
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] Tested locally with `./test-local-deployment.sh`
- [ ] All services running without errors
- [ ] Frontend loads in browser
- [ ] Backend API health check passes
- [ ] API documentation accessible

### Oracle Cloud Setup
- [ ] Created Oracle Cloud account
- [ ] Provisioned ARM VM (24GB RAM)
- [ ] Configured Security List (ports 80, 443, 3002, 4000, 8080)
- [ ] Saved SSH private key
- [ ] Can SSH into VM

### Deployment
- [ ] Cloned repository on VM
- [ ] Configured `.env.production` with secure passwords
- [ ] Ran `./deploy-oracle-cloud.sh` successfully
- [ ] All containers running: `docker ps`
- [ ] Frontend accessible from browser
- [ ] Backend API responding
- [ ] EPCIS service operational

### Post-Deployment
- [ ] Changed default passwords
- [ ] Configured firewall (cloud + VM)
- [ ] Tested basic functionality
- [ ] (Optional) Setup domain + SSL
- [ ] (Optional) Configured automated backups

---

## 🔐 Security Considerations

### Must Do (Critical)
1. ✅ Change default passwords in `.env.production`
2. ✅ Configure cloud firewall (Oracle Security List)
3. ✅ Configure VM firewall (iptables)
4. ✅ Use strong JWT secret

### Should Do (Recommended)
1. 🔒 Setup domain with SSL (HTTPS)
2. 🔒 Restrict database port (5432) to internal only
3. 🔒 Setup automated backups
4. 🔒 Enable container resource limits
5. 🔒 Setup log rotation

### Nice to Have
1. 📊 Setup monitoring (Grafana/Prometheus)
2. 📧 Configure email notifications
3. 🔄 Setup CI/CD pipeline
4. 🧪 Configure staging environment

---

## 💰 Cost Comparison

| Platform | Monthly Cost | RAM | Storage | Notes |
|----------|-------------|-----|---------|-------|
| **Oracle Cloud Free** | **$0** | 24GB | 200GB | Free forever, ARM-based |
| Hetzner CX21 | $5.40 | 4GB | 40GB | Good value, EU-based |
| DigitalOcean Basic | $12 | 2GB | 50GB | Easy to use |
| AWS Lightsail | $20 | 4GB | 80GB | Has Africa region |

**Recommendation**: Start with Oracle Cloud Free, move to paid if you need more resources.

---

## 🆘 Troubleshooting

### Common Issues

**"Cannot connect to database"**
```bash
# Check PostgreSQL is running
docker exec kenya-tnt-postgres pg_isready -U tnt_user

# Check environment variables
docker-compose -f docker-compose.production.yml config
```

**"Port already in use"**
```bash
# Find what's using the port
sudo netstat -tlnp | grep :4000

# Kill process or change port in docker-compose.yml
```

**"Out of memory"**
```bash
# Check available memory
free -h

# Check container usage
docker stats

# Increase VM size or reduce services
```

**"Can't access from browser"**
1. Check cloud firewall (Security List)
2. Check VM firewall: `sudo iptables -L -n`
3. Check service is running: `docker ps`
4. Check logs: `docker-compose logs`

---

## 📚 Documentation

- **[DEPLOYMENT_README.md](./DEPLOYMENT_README.md)** - General deployment guide
- **[ORACLE_CLOUD_DEPLOYMENT.md](./ORACLE_CLOUD_DEPLOYMENT.md)** - Complete Oracle Cloud walkthrough
- **[README.md](./README.md)** - System overview and architecture

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ All containers running: `docker ps` shows 7 containers  
✅ Frontend loads: http://YOUR_IP:3002  
✅ Backend healthy: http://YOUR_IP:4000/api/health returns OK  
✅ API docs work: http://YOUR_IP:4000/api/docs  
✅ No errors in logs: `docker-compose logs` shows no critical errors  
✅ Database connected: Backend can query PostgreSQL  
✅ EPCIS operational: Can capture test events  

---

## 🚀 Next Steps

1. **Test Locally**
   ```bash
   ./test-local-deployment.sh
   ```

2. **Deploy to Cloud**
   - Follow [ORACLE_CLOUD_DEPLOYMENT.md](./ORACLE_CLOUD_DEPLOYMENT.md)
   - Or run `./deploy-oracle-cloud.sh` on your VM

3. **Share with Users**
   - Frontend: http://YOUR_DOMAIN:3002
   - API: http://YOUR_DOMAIN:4000/api

4. **Optional Enhancements**
   - Setup domain + SSL
   - Configure automated backups
   - Setup monitoring
   - Configure PPB API integration

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose -f docker-compose.production.yml logs`
2. Verify firewall rules (cloud + VM)
3. Check disk space: `df -h`
4. Check memory: `free -h`
5. Review [Troubleshooting section](#-troubleshooting)

---

**Total Setup Time:**
- Local test: 5-10 minutes
- Oracle Cloud VM: 5-10 minutes
- Deployment: 10-15 minutes
- **Total: 20-35 minutes** ⚡

**You're ready to deploy!** 🎉

