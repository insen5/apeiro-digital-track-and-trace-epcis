# 🚀 Oracle Cloud Free Tier Deployment Guide

This guide walks you through deploying the Kenya TNT System on Oracle Cloud's **free forever** tier.

## 📋 What You Get (Free Forever)

- ✅ **ARM VM**: 4 cores, 24GB RAM (or 2 VMs with 12GB each)
- ✅ **Storage**: 200GB block storage
- ✅ **Bandwidth**: 10TB/month outbound
- ✅ **IPv4**: 2 public IPs
- ✅ **No credit card tricks**: Actually free forever

---

## 🎯 Step 1: Create Oracle Cloud Account

1. Go to https://cloud.oracle.com/free
2. Sign up (requires credit card for verification, but NOT charged)
3. Choose your home region (closest to Kenya: **Mumbai** or **Johannesburg**)
4. Complete account setup

---

## 🖥️ Step 2: Create VM Instance

### 2.1 Navigate to Compute Instances

1. Login to Oracle Cloud Console
2. Click **☰ Menu** → **Compute** → **Instances**
3. Click **Create Instance**

### 2.2 Configure Instance

**Name**: `kenya-tnt-system`

**Placement**: Leave default

**Image**:
- Click **Change Image**
- Select **Ubuntu** (22.04 or later)
- Click **Select Image**

**Shape**:
- Click **Change Shape**
- Select **Ampere** (ARM-based)
- Choose **VM.Standard.A1.Flex**
- Set OCPUs: **4**
- Set Memory: **24 GB**
- Click **Select Shape**

**Networking**:
- Leave **Create new virtual cloud network** selected
- Check **Assign a public IPv4 address**

**Add SSH Keys**:
- Select **Generate SSH key pair**
- Click **Save Private Key** (downloads `ssh-key-*.key`)
- Click **Save Public Key** (optional backup)

**Boot Volume**: Leave default (50GB is fine)

### 2.3 Create Instance

- Click **Create**
- Wait 2-3 minutes for provisioning
- Note the **Public IP Address** (e.g., `123.45.67.89`)

---

## 🔐 Step 3: Configure Firewall Rules

### 3.1 Add Ingress Rules

1. On the instance details page, click your **Virtual Cloud Network** name
2. Click **Security Lists** → **Default Security List**
3. Click **Add Ingress Rules** and add these:

| Source CIDR | Protocol | Destination Port | Description |
|-------------|----------|------------------|-------------|
| `0.0.0.0/0` | TCP | `80` | HTTP |
| `0.0.0.0/0` | TCP | `443` | HTTPS |
| `0.0.0.0/0` | TCP | `4000` | Backend API |
| `0.0.0.0/0` | TCP | `3002` | Frontend |
| `0.0.0.0/0` | TCP | `8080` | EPCIS Service |

4. Click **Add Ingress Rules**

---

## 🔑 Step 4: Connect to Your VM

### 4.1 Set SSH Key Permissions (macOS/Linux)

```bash
chmod 400 ~/Downloads/ssh-key-*.key
```

### 4.2 SSH into VM

```bash
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_PUBLIC_IP
```

Replace `YOUR_PUBLIC_IP` with the IP from Step 2.3.

**First login will show Ubuntu welcome message.**

---

## 🐳 Step 5: Install Docker

### 5.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 5.2 Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Enable Docker to start on boot
sudo systemctl enable docker

# Restart session (or logout and login again)
newgrp docker
```

### 5.3 Verify Installation

```bash
docker --version
docker-compose --version
```

Should show Docker 24+ and Docker Compose 2+.

---

## 📦 Step 6: Deploy Kenya TNT System

### 6.1 Install Git

```bash
sudo apt install git -y
```

### 6.2 Clone Repository

```bash
cd ~
git clone YOUR_REPO_URL
cd apeiro-digital-track-and-trace-epcis/kenya-tnt-system
```

Replace `YOUR_REPO_URL` with your GitHub repository URL.

### 6.3 Configure Environment

```bash
# Copy example environment file
cp .env.production.example .env.production

# Edit environment variables
nano .env.production
```

**Update these critical values:**

```bash
# Generate secure password
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Generate secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Set your public IP
NEXT_PUBLIC_API_URL=http://YOUR_PUBLIC_IP:4000/api
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

### 6.4 Configure Firewall on VM

Oracle Cloud VMs have additional firewall (iptables). Open ports:

```bash
# Open required ports
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3002 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 4000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT

# Save rules
sudo netfilter-persistent save
```

If `netfilter-persistent` is not installed:

```bash
sudo apt install iptables-persistent -y
```

### 6.5 Start Services

```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# This will take 5-10 minutes on first run (building images)
```

### 6.6 Monitor Startup

```bash
# Watch logs
docker-compose -f docker-compose.production.yml logs -f

# Press Ctrl+C to stop watching (services keep running)
```

### 6.7 Check Service Status

```bash
docker-compose -f docker-compose.production.yml ps
```

All services should show "Up" status.

---

## ✅ Step 7: Verify Deployment

### 7.1 Check Services

Visit these URLs (replace with your public IP):

- **Frontend**: http://YOUR_PUBLIC_IP:3002
- **Backend API**: http://YOUR_PUBLIC_IP:4000/api/health
- **API Docs**: http://YOUR_PUBLIC_IP:4000/api/docs
- **EPCIS Service**: http://YOUR_PUBLIC_IP:8080

### 7.2 Check Docker Logs

```bash
# Check all services
docker-compose -f docker-compose.production.yml logs

# Check specific service
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend
```

---

## 🌐 Step 8: Setup Domain (Optional)

### 8.1 Point Domain to VM

If you have a domain, add these DNS records:

```
Type    Name              Value
A       @                 YOUR_PUBLIC_IP
A       api               YOUR_PUBLIC_IP
A       www               YOUR_PUBLIC_IP
```

### 8.2 Install Nginx (Reverse Proxy)

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 8.3 Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/kenya-tnt
```

Paste this configuration (replace `your-domain.com`):

```nginx
# Frontend
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/kenya-tnt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8.4 Get Free SSL Certificate

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

Follow prompts. Certbot auto-renews certificates.

---

## 🔧 Maintenance Commands

### Start/Stop Services

```bash
# Stop all services
docker-compose -f docker-compose.production.yml down

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Restart specific service
docker-compose -f docker-compose.production.yml restart backend
```

### Update Application

```bash
cd ~/apeiro-digital-track-and-trace-epcis/kenya-tnt-system

# Pull latest code
git pull

# Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Specific service
docker-compose -f docker-compose.production.yml logs -f backend
```

### Database Backup

```bash
# Backup database
docker exec kenya-tnt-postgres pg_dump -U tnt_user kenya_tnt_db > backup_$(date +%Y%m%d).sql

# Restore database
cat backup_20240101.sql | docker exec -i kenya-tnt-postgres psql -U tnt_user -d kenya_tnt_db
```

---

## 🔍 Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs

# Check disk space
df -h

# Check memory
free -h
```

### Can't Access from Browser

1. Check Oracle Cloud Security List (Step 3)
2. Check VM firewall: `sudo iptables -L -n`
3. Check service is running: `docker ps`
4. Check logs: `docker-compose logs`

### Out of Disk Space

```bash
# Clean up old Docker images
docker system prune -a

# Remove old volumes (CAUTION: removes data!)
docker volume prune
```

---

## 📊 Monitoring

### Check Resource Usage

```bash
# CPU and memory
htop

# Disk usage
df -h

# Docker stats
docker stats
```

### Setup Log Rotation

```bash
sudo nano /etc/docker/daemon.json
```

Add:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:

```bash
sudo systemctl restart docker
docker-compose -f docker-compose.production.yml up -d
```

---

## 🎉 Success!

Your Kenya TNT System is now running on Oracle Cloud Free Tier!

**Access Points:**
- Frontend: http://YOUR_IP:3002
- Backend API: http://YOUR_IP:4000/api
- API Docs: http://YOUR_IP:4000/api/docs

**Next Steps:**
1. Test all features
2. Setup domain + SSL (Step 8)
3. Configure backups
4. Share URL with users

---

## 💡 Tips

- Oracle Cloud free tier is **genuinely free forever**
- ARM architecture is fast and efficient
- 24GB RAM is plenty for this system
- Set up automatic backups with cron
- Monitor disk space regularly

---

## 🆘 Support

If you run into issues:
1. Check logs: `docker-compose logs`
2. Check Oracle Cloud console for network issues
3. Verify all ports are open (Steps 3 & 6.4)

**Estimated setup time:** 30-45 minutes (first time)

