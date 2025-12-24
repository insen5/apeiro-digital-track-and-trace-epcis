# Docker Registry Setup Guide

**Last Updated**: December 19, 2025  
**Purpose**: Configure your company's Docker registry with Kenya TNT System

---

## 🎯 Overview

The CI/CD pipeline pushes Docker images to your company's Docker registry, then pulls them on staging/production servers for deployment.

---

## 🔧 Required GitHub Secrets

Add these to: `Settings → Secrets → Actions`

### Docker Registry Credentials

```bash
DOCKER_REGISTRY_URL       = registry.yourcompany.com
DOCKER_REGISTRY_USERNAME  = your-username
DOCKER_REGISTRY_PASSWORD  = your-password-or-token
```

---

## 📋 Registry-Specific Configuration

### Option 1: Docker Hub

```bash
DOCKER_REGISTRY_URL       = docker.io/your-username
# OR leave empty, it defaults to docker.io
DOCKER_REGISTRY_URL       = 

DOCKER_REGISTRY_USERNAME  = your-dockerhub-username
DOCKER_REGISTRY_PASSWORD  = your-dockerhub-access-token
```

**Create access token**: https://hub.docker.com/settings/security

### Option 2: GitHub Container Registry (ghcr.io)

```bash
DOCKER_REGISTRY_URL       = ghcr.io/your-github-username
DOCKER_REGISTRY_USERNAME  = your-github-username
DOCKER_REGISTRY_PASSWORD  = your-github-personal-access-token
```

**Create PAT**: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
- Scopes needed: `write:packages`, `read:packages`

### Option 3: GitLab Container Registry

```bash
DOCKER_REGISTRY_URL       = registry.gitlab.com/your-group/your-project
DOCKER_REGISTRY_USERNAME  = your-gitlab-username
DOCKER_REGISTRY_PASSWORD  = your-gitlab-access-token
```

**Create access token**: GitLab → User Settings → Access Tokens → Add new token
- Scopes needed: `read_registry`, `write_registry`

### Option 4: AWS ECR (Elastic Container Registry)

```bash
DOCKER_REGISTRY_URL       = 123456789012.dkr.ecr.us-east-1.amazonaws.com
DOCKER_REGISTRY_USERNAME  = AWS
DOCKER_REGISTRY_PASSWORD  = <aws-ecr-token>
```

**Note**: ECR tokens expire every 12 hours. Consider using GitHub Actions AWS credentials instead.

### Option 5: Azure Container Registry

```bash
DOCKER_REGISTRY_URL       = yourregistry.azurecr.io
DOCKER_REGISTRY_USERNAME  = your-username
DOCKER_REGISTRY_PASSWORD  = your-password
```

### Option 6: Private Registry (Self-Hosted)

```bash
DOCKER_REGISTRY_URL       = registry.yourcompany.com
DOCKER_REGISTRY_USERNAME  = your-username
DOCKER_REGISTRY_PASSWORD  = your-password-or-token
```

---

## 🚀 How CI/CD Uses the Registry

### Staging Deployment (automatic)

```yaml
# .github/workflows/ci-staging.yml

1. Build images:
   - registry.yourcompany.com/kenya-tnt-backend:staging
   - registry.yourcompany.com/kenya-tnt-frontend:staging

2. Push to registry

3. SSH to staging server:
   - docker login registry.yourcompany.com
   - docker compose pull
   - docker compose up -d
```

### Production Deployment (after approval)

```yaml
# .github/workflows/ci-production.yml

1. Build images:
   - registry.yourcompany.com/kenya-tnt-backend:production
   - registry.yourcompany.com/kenya-tnt-frontend:production
   - registry.yourcompany.com/kenya-tnt-backend:latest
   - registry.yourcompany.com/kenya-tnt-frontend:latest

2. Push to registry

3. Wait for manual approval ⚠️

4. SSH to production server:
   - docker login registry.yourcompany.com
   - docker compose pull
   - docker compose up -d
```

---

## 🔐 Server-Side Configuration

Your staging/production servers need to be able to pull from your registry.

### Update docker-compose files to use your registry

**Example for docker-compose.staging.yml:**

```yaml
services:
  backend:
    image: registry.yourcompany.com/kenya-tnt-backend:staging
    # ... rest of config

  frontend:
    image: registry.yourcompany.com/kenya-tnt-frontend:staging
    # ... rest of config
```

**Example for docker-compose.production.yml:**

```yaml
services:
  backend:
    image: registry.yourcompany.com/kenya-tnt-backend:production
    # ... rest of config

  frontend:
    image: registry.yourcompany.com/kenya-tnt-frontend:production
    # ... rest of config
```

### Manual login on servers (one-time)

```bash
# SSH to staging server
ssh root@YOUR_STAGING_IP

# Login to your registry
docker login registry.yourcompany.com -u your-username
# Enter password when prompted

# Repeat for production server
ssh root@YOUR_PRODUCTION_IP
docker login registry.yourcompany.com -u your-username
```

**Note**: CI/CD handles login automatically, but you may need this for manual deployments.

---

## 🧪 Testing Registry Access

### Test from your laptop

```bash
# Build a test image
docker build -t registry.yourcompany.com/test:latest .

# Push to registry
docker push registry.yourcompany.com/test:latest

# Pull from registry
docker pull registry.yourcompany.com/test:latest
```

### Test from staging server

```bash
ssh root@YOUR_STAGING_IP

# Try pulling a test image
docker pull registry.yourcompany.com/test:latest
```

---

## 🆘 Troubleshooting

### "unauthorized: authentication required"

**Fix**: Check credentials in GitHub Secrets
```bash
# Verify on your laptop:
docker login registry.yourcompany.com -u your-username
# If this works, credentials are correct
```

### "denied: requested access to the resource is denied"

**Fix**: Check permissions/scopes for your registry token
- Docker Hub: Needs `Read & Write` permissions
- GitHub: Needs `write:packages` scope
- GitLab: Needs `write_registry` scope

### "repository does not exist"

**Fix**: Create repositories first (some registries require this)
- Docker Hub: Create repository via web UI
- GitHub: First push creates repository automatically
- GitLab: Enable container registry in project settings

### Images not updating on server

**Fix**: Clear Docker cache
```bash
ssh root@YOUR_SERVER_IP
docker compose down
docker system prune -a -f
docker compose pull
docker compose up -d
```

---

## 📊 Registry Comparison

| Registry | Cost | Storage | Bandwidth | Private Repos |
|----------|------|---------|-----------|---------------|
| Docker Hub | Free tier: 1 repo | 1 image pull/6h | Limited | 1 (free) |
| GitHub CR | Free | 500MB free | 1GB/month free | Unlimited |
| GitLab CR | Free | 10GB free | Unlimited | Unlimited |
| AWS ECR | Pay per GB | $0.10/GB/month | $0.09/GB transfer | Unlimited |
| Azure ACR | $5/month (Basic) | 10GB included | Unlimited | Unlimited |
| Company Registry | Varies | Varies | Varies | Unlimited |

---

## ✅ Checklist

Before running CI/CD:

- [ ] Registry credentials added to GitHub Secrets
- [ ] Tested `docker login` from laptop
- [ ] Tested `docker push` from laptop
- [ ] Updated docker-compose.staging.yml with registry URL
- [ ] Updated docker-compose.production.yml with registry URL
- [ ] Tested `docker pull` from staging server
- [ ] Tested `docker pull` from production server

---

**Your CI/CD pipeline is now configured to use your company's Docker registry!** 🎉


