# ⚡ Quick Deploy - One Page Reference

## 🎯 Option 1: Test Locally (5 minutes)

```bash
cd kenya-tnt-system
./test-local-deployment.sh

# Access:
# Frontend: http://localhost:3002
# Backend:  http://localhost:4000/api
# API Docs: http://localhost:4000/api/docs
```

---

## 🎯 Option 2: Oracle Cloud Free (30 minutes)

### Step 1: Create VM (10 min)
1. Go to https://cloud.oracle.com/free
2. Create account (free forever, no tricks)
3. Create VM: **Compute → Instances → Create**
   - Shape: **VM.Standard.A1.Flex** (ARM)
   - OCPU: **4**, Memory: **24GB**
   - Image: **Ubuntu 22.04**
   - Download SSH key
4. Note public IP: `___.___.___.___ `

### Step 2: Open Firewall (5 min)
1. Click your VCN → Security Lists → Default
2. Add Ingress Rules:
   - Port 80, 443, 3002, 4000, 8080
   - Source: `0.0.0.0/0`

### Step 3: Deploy (15 min)
```bash
# SSH into VM
ssh -i ~/Downloads/ssh-key-*.key ubuntu@YOUR_PUBLIC_IP

# Clone and deploy
git clone YOUR_REPO_URL
cd apeiro-digital-track-and-trace-epcis/kenya-tnt-system
./deploy-oracle-cloud.sh

# Wait 10-15 minutes
```

### Step 4: Access
```
Frontend:  http://YOUR_IP:3002
Backend:   http://YOUR_IP:4000/api
API Docs:  http://YOUR_IP:4000/api/docs
```

---

## 🎯 Option 3: Any VPS (20 minutes)

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo apt install docker-compose -y

# Clone repo
git clone YOUR_REPO_URL
cd apeiro-digital-track-and-trace-epcis/kenya-tnt-system

# Configure
cp env.production.template .env.production
nano .env.production  # Update passwords & IP

# Deploy
docker-compose -f docker-compose.production.yml up -d
```

---

## 📝 Environment Variables (Required)

Edit `.env.production`:

```bash
# Generate secure passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# Set your IP
NEXT_PUBLIC_API_URL=http://YOUR_PUBLIC_IP:4000/api
```

---

## 🛠️ Essential Commands

```bash
# View logs
docker-compose -f docker-compose.production.yml logs -f

# Stop
docker-compose -f docker-compose.production.yml down

# Restart
docker-compose -f docker-compose.production.yml restart

# Status
docker-compose -f docker-compose.production.yml ps

# Update
git pull && docker-compose -f docker-compose.production.yml up -d --build
```

---

## ✅ Success Check

All these should work:
- [ ] `curl http://YOUR_IP:3002` → Frontend HTML
- [ ] `curl http://YOUR_IP:4000/api/health` → `{"status":"ok"}`
- [ ] `docker ps` → 7 containers running
- [ ] Browser: http://YOUR_IP:3002 → Web app loads

---

## 🆘 Troubleshooting

**Can't access from browser?**
1. Check cloud firewall (Security List)
2. Check VM firewall: `sudo iptables -L`
3. Check service: `docker ps`

**Service not starting?**
```bash
docker-compose -f docker-compose.production.yml logs [service-name]
```

**Out of memory?**
```bash
free -h
docker stats
```

---

## 📚 Full Documentation

- [DOCKER_DEPLOYMENT_SUMMARY.md](./DOCKER_DEPLOYMENT_SUMMARY.md) - Overview
- [ORACLE_CLOUD_DEPLOYMENT.md](./ORACLE_CLOUD_DEPLOYMENT.md) - Complete guide
- [DEPLOYMENT_README.md](./DEPLOYMENT_README.md) - Detailed instructions

---

## 💰 Cost

- **Oracle Cloud**: $0/month (24GB RAM, free forever)
- **Hetzner**: $5/month (4GB RAM)
- **DigitalOcean**: $12/month (2GB RAM)

---

**Ready? Pick an option above and deploy!** 🚀

