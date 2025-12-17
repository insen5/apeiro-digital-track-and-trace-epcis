# 🚀 Kenya TNT System - Production Deployment

Complete guide for deploying the Kenya Track & Trace System to production using Docker.

## 📋 Overview

This deployment package includes:
- ✅ **Backend (NestJS)**: Core API and business logic
- ✅ **Frontend (Next.js)**: Web application
- ✅ **PostgreSQL + PostGIS**: Database
- ✅ **OpenEPCIS**: EPCIS 2.0 event capture and storage
- ✅ **Kafka**: Event streaming
- ✅ **OpenSearch**: Event indexing and queries

---

## 🎯 Deployment Options

### Option 1: Oracle Cloud Free (Recommended - $0/month)
- **24GB RAM, 4 ARM cores**
- **200GB storage**
- **Free forever** (no tricks)
- 📖 [Full Oracle Cloud Guide](./ORACLE_CLOUD_DEPLOYMENT.md)

### Option 2: Any VPS with Docker
- Minimum: 8GB RAM, 4 cores, 50GB storage
- Works on: Hetzner, DigitalOcean, AWS, etc.
- See "Quick VPS Deployment" below

---

## ⚡ Quick Start (Any Server)

### Prerequisites

- Ubuntu 20.04+ or Debian 11+
- Docker & Docker Compose installed
- Public IP address
- At least 8GB RAM, 50GB disk

### 1. Clone Repository

```bash
git clone YOUR_REPO_URL
cd apeiro-digital-track-and-trace-epcis/kenya-tnt-system
```

### 2. Run Automated Setup

```bash
./deploy-oracle-cloud.sh
```

This script will:
- ✅ Install Docker (if needed)
- ✅ Generate secure passwords
- ✅ Configure firewall
- ✅ Build Docker images
- ✅ Start all services

**Estimated time:** 10-15 minutes

### 3. Access Your Application

After deployment:
- **Frontend**: http://YOUR_IP:3002
- **Backend API**: http://YOUR_IP:4000/api
- **API Docs**: http://YOUR_IP:4000/api/docs

---

## 🔧 Manual Deployment

If you prefer manual control:

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt install -y docker-compose
```

Logout and login again.

### 2. Configure Environment

```bash
# Copy template
cp env.production.template .env.production

# Generate secure passwords
POSTGRES_PASS=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Edit .env.production
nano .env.production
```

Update these:
```bash
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_secure_jwt_secret
NEXT_PUBLIC_API_URL=http://YOUR_PUBLIC_IP:4000/api
```

### 3. Configure Firewall

```bash
# Open required ports
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3002 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 4000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT

# Save rules
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

### 4. Build and Start

```bash
# Pull images
docker-compose -f docker-compose.production.yml pull

# Build custom images
docker-compose -f docker-compose.production.yml build

# Start services
docker-compose -f docker-compose.production.yml up -d

# Watch logs
docker-compose -f docker-compose.production.yml logs -f
```

---

## 📊 Service Architecture

```
┌─────────────────────────────────────────────────┐
│                USERS / BROWSERS                  │
└────────────────┬────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌──────────┐
│Frontend│  │Backend │  │  EPCIS   │
│:3002   │  │:4000   │  │  :8080   │
└────┬───┘  └───┬────┘  └────┬─────┘
     │          │             │
     │      ┌───┴────┐    ┌───┴─────┐
     │      │        │    │         │
     │      ▼        │    ▼         ▼
     │  ┌──────────┐ │ ┌──────┐ ┌────────┐
     │  │PostgreSQL│ │ │Kafka │ │OpenSrch│
     │  │PostGIS   │ │ │      │ │        │
     │  └──────────┘ │ └──────┘ └────────┘
     │               │
     └───────────────┘
```

---

## 🛠️ Management Commands

### View Service Status

```bash
docker-compose -f docker-compose.production.yml ps
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend
```

### Restart Services

```bash
# All services
docker-compose -f docker-compose.production.yml restart

# Specific service
docker-compose -f docker-compose.production.yml restart backend
```

### Stop Services

```bash
docker-compose -f docker-compose.production.yml down
```

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

---

## 🔐 Security Configuration

### 1. Change Default Passwords

**Always change these in `.env.production`:**

```bash
# Generate secure passwords
openssl rand -base64 32   # Use for POSTGRES_PASSWORD
openssl rand -base64 32   # Use for JWT_SECRET
```

### 2. Configure Firewall

Only expose necessary ports publicly:
- **80/443**: If using reverse proxy (Nginx)
- **3002**: Frontend (or proxy through 80/443)
- **4000**: Backend API (or proxy through 80/443)
- **8080**: EPCIS (optional - can be internal only)

Block all other ports in cloud firewall.

### 3. Setup SSL/HTTPS

Install Nginx and Certbot:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Configure reverse proxy (see ORACLE_CLOUD_DEPLOYMENT.md Step 8).

---

## 📦 Database Backup

### Manual Backup

```bash
# Backup database
docker exec kenya-tnt-postgres pg_dump -U tnt_user kenya_tnt_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress
gzip backup_*.sql
```

### Restore Backup

```bash
# Decompress
gunzip backup_20240101_120000.sql.gz

# Restore
cat backup_20240101_120000.sql | docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db
```

### Automated Daily Backup

```bash
# Create backup script
sudo nano /usr/local/bin/backup-kenya-tnt.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/kenya-tnt"
mkdir -p $BACKUP_DIR
cd /home/ubuntu/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
docker exec kenya-tnt-postgres pg_dump -U tnt_user kenya_tnt_db | gzip > $BACKUP_DIR/backup_$(date +%Y%m%d).sql.gz
# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Make executable and schedule:
```bash
sudo chmod +x /usr/local/bin/backup-kenya-tnt.sh
sudo crontab -e
```

Add line:
```cron
0 2 * * * /usr/local/bin/backup-kenya-tnt.sh
```

---

## 🔍 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs

# Check resources
free -h           # Memory
df -h             # Disk
docker stats      # Container usage
```

### Can't Access from Browser

1. Check cloud firewall (Security Groups/Lists)
2. Check VM firewall: `sudo iptables -L -n`
3. Check service: `docker ps`
4. Check logs: `docker-compose logs frontend`

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker exec kenya-tnt-postgres pg_isready -U tnt_user

# Check environment variables
docker-compose -f docker-compose.production.yml config
```

### Out of Disk Space

```bash
# Clean Docker cache
docker system prune -a

# Remove old logs
docker-compose -f docker-compose.production.yml logs --tail=0 -f > /dev/null
```

---

## 📊 Monitoring

### Resource Usage

```bash
# Real-time stats
docker stats

# System resources
htop

# Disk usage
df -h
du -sh /var/lib/docker
```

### Health Checks

```bash
# Backend health
curl http://localhost:4000/api/health

# Frontend health
curl http://localhost:3002

# Database health
docker exec kenya-tnt-postgres pg_isready -U tnt_user
```

---

## 🌐 Domain Setup (Optional)

If you have a domain, configure DNS:

**DNS Records:**
```
Type    Name    Value
A       @       YOUR_PUBLIC_IP
A       api     YOUR_PUBLIC_IP
A       www     YOUR_PUBLIC_IP
```

Then setup Nginx reverse proxy + SSL (see ORACLE_CLOUD_DEPLOYMENT.md).

---

## 📈 Performance Tuning

### For Production (High Traffic)

Edit `docker-compose.production.yml`:

```yaml
# Increase PostgreSQL resources
postgres:
  environment:
    - POSTGRES_SHARED_BUFFERS=1GB
    - POSTGRES_EFFECTIVE_CACHE_SIZE=3GB
  
# Scale backend
backend:
  deploy:
    replicas: 2

# Scale frontend
frontend:
  deploy:
    replicas: 2
```

Then:
```bash
docker-compose -f docker-compose.production.yml up -d --scale backend=2 --scale frontend=2
```

---

## 🆘 Getting Help

### Check Logs First

```bash
# See what's happening
docker-compose -f docker-compose.production.yml logs -f
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Out of memory | Increase VM RAM or reduce services |
| Port already in use | Check: `sudo netstat -tlnp` |
| Build fails | Check Docker has enough disk space |
| Can't connect | Verify firewall rules (cloud + VM) |

---

## ✅ Post-Deployment Checklist

- [ ] All services running: `docker ps`
- [ ] Frontend accessible: http://YOUR_IP:3002
- [ ] Backend API working: http://YOUR_IP:4000/api/health
- [ ] API docs available: http://YOUR_IP:4000/api/docs
- [ ] Changed default passwords in `.env.production`
- [ ] Configured firewall (cloud + VM)
- [ ] Tested database connectivity
- [ ] Setup automated backups
- [ ] (Optional) Configured domain + SSL

---

## 📚 Additional Resources

- [Oracle Cloud Complete Guide](./ORACLE_CLOUD_DEPLOYMENT.md)
- [System Architecture](./README.md)
- [API Documentation](http://YOUR_IP:4000/api/docs)
- [EPCIS Implementation](./EPCIS_CONFIG.md)

---

**Deployment Estimated Time:**
- Automated: 10-15 minutes
- Manual: 20-30 minutes
- Oracle Cloud (first time): 30-45 minutes

**Total Cost:**
- Oracle Cloud Free: **$0/month**
- Hetzner VPS: **$4.50/month**
- DigitalOcean: **$12/month**

---

## 🎉 Success!

Once deployed, share these URLs with your users:

- **Web App**: http://YOUR_DOMAIN:3002
- **API**: http://YOUR_DOMAIN:4000/api
- **Docs**: http://YOUR_DOMAIN:4000/api/docs

Enjoy your Kenya TNT System! 🚀

