# Kenya TNT System - DHA Docker Registry Configuration

**Registry**: cloud-taifacare.dha.go.ke  
**Username**: admin  
**Date**: December 20, 2025

---

## 🔑 GitHub Secrets to Add

Go to: `https://github.com/insen5/kenya-tnt-system/settings/secrets/actions`

Click "New repository secret" and add these **9 secrets**:

### Docker Registry (3 secrets)

```
Name: DOCKER_REGISTRY_URL
Value: cloud-taifacare.dha.go.ke
```

```
Name: DOCKER_REGISTRY_USERNAME
Value: admin
```

```
Name: DOCKER_REGISTRY_PASSWORD
Value: 9142d696-121d-4232-a2ff-333b7bae4489
```

### Staging Environment (3 secrets)

```
Name: STAGING_API_URL
Value: http://YOUR_STAGING_SERVER_IP:4000/api
(Replace YOUR_STAGING_SERVER_IP with actual IP)
```

```
Name: STAGING_SERVER_IP
Value: YOUR_STAGING_SERVER_IP
(Replace with actual staging server IP)
```

```
Name: STAGING_SERVER_USER
Value: root
(Or your actual SSH username)
```

```
Name: STAGING_SERVER_SSH_KEY
Value: <paste your entire SSH private key>
(Get it with: cat ~/.ssh/id_rsa)
```

### Production Environment (3 secrets)

```
Name: PRODUCTION_API_URL
Value: https://YOUR_PRODUCTION_DOMAIN/api
(Or http://YOUR_PRODUCTION_IP:4000/api)
```

```
Name: PRODUCTION_SERVER_IP
Value: YOUR_PRODUCTION_SERVER_IP
(Replace with actual production server IP)
```

```
Name: PRODUCTION_SERVER_USER
Value: root
(Or your actual SSH username)
```

```
Name: PRODUCTION_SERVER_SSH_KEY
Value: <paste your entire SSH private key>
(Same as staging, or different key if you use separate keys)
```

---

## 🚀 Docker Images Will Be Pushed To

### Staging Images
```
cloud-taifacare.dha.go.ke/kenya-tnt-backend:staging
cloud-taifacare.dha.go.ke/kenya-tnt-frontend:staging
```

### Production Images
```
cloud-taifacare.dha.go.ke/kenya-tnt-backend:production
cloud-taifacare.dha.go.ke/kenya-tnt-backend:latest
cloud-taifacare.dha.go.ke/kenya-tnt-frontend:production
cloud-taifacare.dha.go.ke/kenya-tnt-frontend:latest
```

---

## 🔧 Server Configuration

### On Staging Server

```bash
# SSH to staging
ssh root@YOUR_STAGING_IP

# Login to DHA registry
echo "9142d696-121d-4232-a2ff-333b7bae4489" | docker login cloud-taifacare.dha.go.ke -u admin --password-stdin

# Test pull (after first CI/CD run)
docker pull cloud-taifacare.dha.go.ke/kenya-tnt-backend:staging
```

### On Production Server

```bash
# SSH to production
ssh root@YOUR_PRODUCTION_IP

# Login to DHA registry
echo "9142d696-121d-4232-a2ff-333b7bae4489" | docker login cloud-taifacare.dha.go.ke -u admin --password-stdin

# Test pull (after first CI/CD run)
docker pull cloud-taifacare.dha.go.ke/kenya-tnt-backend:production
```

---

## 📋 Update docker-compose Files

You'll need to update your docker-compose files to pull from the DHA registry:

### docker-compose.staging.yml

```yaml
services:
  backend:
    image: cloud-taifacare.dha.go.ke/kenya-tnt-backend:staging
    # Remove the 'build:' section
    # ... rest of config

  frontend:
    image: cloud-taifacare.dha.go.ke/kenya-tnt-frontend:staging
    # Remove the 'build:' section
    # ... rest of config
```

### docker-compose.production.yml

```yaml
services:
  backend:
    image: cloud-taifacare.dha.go.ke/kenya-tnt-backend:production
    # Remove the 'build:' section
    # ... rest of config

  frontend:
    image: cloud-taifacare.dha.go.ke/kenya-tnt-frontend:production
    # Remove the 'build:' section
    # ... rest of config
```

---

## ✅ Quick Test

Test login from your laptop:

```bash
echo "9142d696-121d-4232-a2ff-333b7bae4489" | docker login cloud-taifacare.dha.go.ke -u admin --password-stdin

# Should output: Login Succeeded
```

---

## 🎯 Next Steps

1. ✅ **Add 9 GitHub Secrets** (listed above)
2. ✅ **Update docker-compose files** (I can help with this)
3. ✅ **Continue with setup-dev-rails.sh** (press Enter when ready)

---

## 🔐 Security Note

**Important**: The token `9142d696-121d-4232-a2ff-333b7bae4489` is now visible in:
- This file (local only)
- GitHub Secrets (encrypted)
- CI/CD logs will NOT show the token (masked by GitHub)

Keep this file secure and do NOT commit it to git (already in .gitignore).

---

**Your DHA registry is now configured!** 🎉


