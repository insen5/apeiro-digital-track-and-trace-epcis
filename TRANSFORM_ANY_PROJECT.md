# 🚀 Apply "Cowboy to Pro" Transformation to Any Project

**Last Updated**: December 22, 2025  
**Status**: Ready to Use  
**Deployment**: Company Servers (UHC Cloud VPN Required)

---

## 🎯 What You're Getting

All the goodness from this epic session:
- ✅ Branch structure (develop → staging → main)
- ✅ CI/CD pipelines (automated testing & deployment)
- ✅ NFR matrix (performance requirements)
- ✅ Environment-specific configs
- ✅ Docker registry integration
- ✅ Professional development workflow

---

## 🎬 Option 1: New Project from Template

### Use GitHub Template Repository

1. **Go to your template**:
   - https://github.com/insen5/project-template-standard

2. **Click "Use this template"**:
   - Click the green "Use this template" button
   - Name your new repository
   - Clone it

3. **Customize**:
   ```bash
   cd your-new-project
   
   # Update project-specific details
   vim .cursorrules        # Change project name, tech stack
   vim NFR_MATRIX.md       # Set your performance targets
   vim package.json        # Update project metadata
   
   # Set up GitHub Secrets (same 9 we used)
   gh secret set DOCKER_REGISTRY_URL --body "cloud-taifacare.dha.go.ke"
   gh secret set DOCKER_REGISTRY_USERNAME --body "admin"
   gh secret set DOCKER_REGISTRY_PASSWORD --body "9142d696-121d-4232-a2ff-333b7bae4489"
   # ... add remaining secrets
   
   # Run setup
   bash setup-dev-rails.sh
   ```

---

## 🔥 Option 2: Existing Project (What You Want!)

### Apply to Your Current "Cowboy" Project

**Quick Command** (run in your other project):

```bash
# 1. Go to your other project
cd /path/to/your/other/project

# 2. Download the transformation script
curl -O https://raw.githubusercontent.com/insen5/project-template-standard/main/setup-dev-rails.sh
chmod +x setup-dev-rails.sh

# 3. Copy CI/CD workflows
mkdir -p .github/workflows
curl -o .github/workflows/ci-dev.yml https://raw.githubusercontent.com/insen5/project-template-standard/main/.github/workflows/ci-dev.yml
curl -o .github/workflows/ci-staging.yml https://raw.githubusercontent.com/insen5/project-template-standard/main/.github/workflows/ci-staging.yml
curl -o .github/workflows/ci-production.yml https://raw.githubusercontent.com/insen5/project-template-standard/main/.github/workflows/ci-production.yml

# 4. Copy other essential files
curl -o NFR_MATRIX.md https://raw.githubusercontent.com/insen5/project-template-standard/main/NFR_MATRIX.md
curl -o .cursorrules https://raw.githubusercontent.com/insen5/project-template-standard/main/.cursorrules
curl -o DEVELOPMENT_WORKFLOW.md https://raw.githubusercontent.com/insen5/kenya-tnt-system/develop/DEVELOPMENT_WORKFLOW.md

# 5. Run setup
bash setup-dev-rails.sh
```

---

## 🎓 Step-by-Step for Existing Project

### Step 1: Clone the Transformation Files

```bash
cd /path/to/your/existing/project

# Create a temp directory to clone the template
git clone https://github.com/insen5/project-template-standard.git /tmp/project-template

# Copy the essential files
cp /tmp/project-template/.github/workflows/* .github/workflows/ 2>/dev/null || mkdir -p .github/workflows && cp /tmp/project-template/.github/workflows/* .github/workflows/
cp /tmp/project-template/setup-dev-rails.sh .
cp /tmp/project-template/NFR_MATRIX.md .
cp /tmp/project-template/.cursorrules .cursorrules.template
cp /tmp/project-template/QUICKSTART.md .
cp /tmp/project-template/Makefile .

# Clean up
rm -rf /tmp/project-template
```

### Step 2: Customize CI/CD Workflows

**Edit the workflows to match your project**:

```bash
# Update project-specific settings in each workflow file
vim .github/workflows/ci-dev.yml
vim .github/workflows/ci-staging.yml
vim .github/workflows/ci-production.yml
```

**What to change**:
- Working directory paths (if different structure)
- Test commands (match your test setup)
- Build commands (match your build process)
- Docker build context (your Dockerfile location)

### Step 3: Add GitHub Secrets

**Use company servers (requires UHC Cloud VPN)**:

```bash
# Docker Registry (company registry)
gh secret set DOCKER_REGISTRY_URL --body "cloud-taifacare.dha.go.ke"
gh secret set DOCKER_REGISTRY_USERNAME --body "admin"
gh secret set DOCKER_REGISTRY_PASSWORD --body "9142d696-121d-4232-a2ff-333b7bae4489"

# Staging (UAT) - Company Server (requires VPN)
gh secret set STAGING_API_URL --body "https://tnt-staging.apeiro-digital.com/api"
gh secret set STAGING_SERVER_IP --body "10.10.101.181"
gh secret set STAGING_SERVER_USER --body "ubuntu"
gh secret set STAGING_SERVER_SSH_KEY < ~/path/to/kenya-tnt-staging.pem

# Production (when server is provisioned)
# gh secret set PRODUCTION_API_URL --body "https://YOUR_PRODUCTION_DOMAIN/api"
# gh secret set PRODUCTION_SERVER_IP --body "YOUR_PRODUCTION_PRIVATE_IP"
# gh secret set PRODUCTION_SERVER_USER --body "ubuntu"
# gh secret set PRODUCTION_SERVER_SSH_KEY < ~/path/to/prod-server.pem
```

**⚠️ Important Notes:**
- **VPN Required**: All GitHub Actions runners must connect to UHC Cloud VPN to access staging server (10.10.101.181)
- **Private Key**: Store the `.pem` file securely, use `gh secret set` to upload it to GitHub
- **HTTPS Only**: Staging uses port 443 (HTTPS), ensure SSL certificates are configured
- **Private IP**: 10.10.101.181 is a private IP, only accessible via VPN

### Step 3a: Handle Private Key (.pem file)

**Secure the PEM file**:
```bash
# 1. Save the PEM file (ask DevOps team for kenya-tnt-staging.pem)
# Store in: ~/keys/kenya-tnt-staging.pem

# 2. Set correct permissions (critical!)
chmod 400 ~/keys/kenya-tnt-staging.pem

# 3. Test SSH connection
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181

# 4. Add to GitHub Secrets (for CI/CD)
gh secret set STAGING_SERVER_SSH_KEY < ~/keys/kenya-tnt-staging.pem

# 5. Verify secret was added
gh secret list | grep STAGING_SERVER_SSH_KEY
```

**⚠️ Security Best Practices:**
- **NEVER** commit `.pem` files to git
- **NEVER** share `.pem` files via email or Slack
- **ALWAYS** use `chmod 400` to restrict permissions
- **ALWAYS** add to `.gitignore`: `*.pem`
- **Store** in secure location: `~/keys/` or `~/.ssh/`

**How to Share PEM File Securely:**

1. **Best: In-Person Transfer**
   ```bash
   # Copy to USB drive, hand to team member
   cp kenya-tnt-staging.pem /Volumes/USB/
   ```

2. **Good: Encrypted File Sharing**
   ```bash
   # Encrypt with GPG
   gpg --encrypt --recipient colleague@company.com kenya-tnt-staging.pem
   # Share .gpg file via secure file sharing (e.g., company file server)
   
   # Recipient decrypts
   gpg --decrypt kenya-tnt-staging.pem.gpg > kenya-tnt-staging.pem
   chmod 400 kenya-tnt-staging.pem
   ```

3. **Acceptable: Secure Shared Password Manager**
   - Use company password manager (1Password, LastPass, etc.)
   - Upload as secure document
   - Share access with specific team members

4. **Temporary: Encrypted Zip (last resort)**
   ```bash
   # Create encrypted zip (macOS/Linux)
   zip -e tnt-staging.zip kenya-tnt-staging.pem
   # Enter strong password
   
   # Share zip via secure channel
   # Share password via different channel (phone call, SMS, not same email!)
   ```

5. **Never Acceptable:**
   - ❌ Email attachment
   - ❌ Slack message
   - ❌ Public cloud storage (Dropbox, Google Drive without encryption)
   - ❌ Git repository
   - ❌ Screenshot or photo

### Step 3b: VPN Connection Setup

**For Local Development:**
```bash
# 1. Get UHC Cloud VPN credentials from IT/DevOps
# 2. Install VPN client (e.g., OpenVPN, WireGuard)
# 3. Connect to VPN
# 4. Verify connection
ping 10.10.101.181
curl -k https://tnt-staging.apeiro-digital.com/api/health

# 5. Deploy only when VPN connected
```

**For GitHub Actions CI/CD:**

**Option A: Self-Hosted Runner (Recommended)**
- Deploy GitHub Actions runner on a VM inside VPN network
- Runner has permanent VPN access
- No VPN action needed in workflows

**Option B: VPN Action in Workflow**
```yaml
# Add to .github/workflows/ci-staging.yml
- name: Connect to VPN
  uses: kota65535/github-openvpn-connect-action@v2
  with:
    config_file: .github/vpn/uhc-cloud.ovpn
    username: ${{ secrets.VPN_USERNAME }}
    password: ${{ secrets.VPN_PASSWORD }}

- name: Test VPN Connection
  run: ping -c 4 10.10.101.181
```

**Option C: Deploy from Inside Network**
- Trigger deployment from developer machine (inside VPN)
- Use manual deployment script
- Not recommended for production

### Step 4: Run the Transformation

```bash
chmod +x setup-dev-rails.sh
bash setup-dev-rails.sh
```

This will:
- ✅ Create branch structure (develop, staging, main)
- ✅ Set up environment files
- ✅ Update .gitignore
- ✅ Guide you through GitHub setup

### Step 5: Customize for Your Project

```bash
# Update .cursorrules with your project specifics
vim .cursorrules

# Update NFR_MATRIX with your actual requirements
vim NFR_MATRIX.md

# Update README
vim README.md
```

---

## 🏃 Super Quick Method (Copy from Kenya TNT)

If you want to just copy everything from Kenya TNT to your other project:

```bash
# In your other project directory
OTHER_PROJECT="/path/to/your/other/project"
KENYA_TNT="/Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system"

cd $OTHER_PROJECT

# Copy all the goodies
cp -r $KENYA_TNT/.github .
cp $KENYA_TNT/setup-dev-rails.sh .
cp $KENYA_TNT/NFR_MATRIX.md .
cp $KENYA_TNT/DEVELOPMENT_WORKFLOW.md .
cp $KENYA_TNT/QUICKSTART.md .
cp $KENYA_TNT/docker-compose.staging.yml .
cp $KENYA_TNT/env.staging.template .

# Run setup
bash setup-dev-rails.sh
```

---

## 🎨 Customization Checklist

After copying files, customize these for your project:

### .github/workflows/*.yml
- [ ] Update `working-directory` paths
- [ ] Update test commands (`npm test`, `npm run lint`, etc.)
- [ ] Update Docker build contexts
- [ ] Update coverage thresholds (if different)

### NFR_MATRIX.md
- [ ] Update performance targets
- [ ] Update resource limits
- [ ] Update testing requirements
- [ ] Update logging levels

### .cursorrules
- [ ] Change project name
- [ ] Update technology stack
- [ ] Add project-specific rules
- [ ] Update coding standards

### docker-compose files
- [ ] Update service names
- [ ] Update image names for your registry
- [ ] Update ports (if different)
- [ ] Update environment variables

### Environment files
- [ ] Create `.env.development`
- [ ] Update `env.staging.template`
- [ ] Update `env.production.template`

---

## 🚀 One-Liner for Your Other Projects

Create this as an alias:

```bash
# Add to your ~/.zshrc or ~/.bashrc
alias cowboy-to-pro='
  curl -sL https://raw.githubusercontent.com/insen5/project-template-standard/main/setup-dev-rails.sh | bash -s
  mkdir -p .github/workflows
  curl -sL https://raw.githubusercontent.com/insen5/project-template-standard/main/.github/workflows/ci-dev.yml -o .github/workflows/ci-dev.yml
  curl -sL https://raw.githubusercontent.com/insen5/project-template-standard/main/.github/workflows/ci-staging.yml -o .github/workflows/ci-staging.yml
  curl -sL https://raw.githubusercontent.com/insen5/project-template-standard/main/.github/workflows/ci-production.yml -o .github/workflows/ci-production.yml
  curl -sL https://raw.githubusercontent.com/insen5/project-template-standard/main/NFR_MATRIX.md -o NFR_MATRIX.md
  echo "✅ Transformation complete! Run setup-dev-rails.sh to finish."
'
```

Then in any project:
```bash
cd /path/to/cowboy/project
cowboy-to-pro
```

---

## 🌐 Company Server Infrastructure

### Staging (UAT) Server Specs
```yaml
VM Name: tnt-staging
Memory: 64 GB RAM
CPU: 16 cores
Storage: 1 TB
Port: 443 (HTTPS)
User: ubuntu
IP: 10.10.101.181 (private)
Domain: tnt-staging.apeiro-digital.com
Access: Requires UHC Cloud VPN connection
Auth: PEM private key
```

### Production Server
**Status**: Not provisioned yet  
**Plan**: Similar specs to staging, separate domain and IP

### VPN Connection Requirement

**For GitHub Actions CI/CD:**
- Install VPN client on GitHub self-hosted runner (if applicable)
- OR use GitHub-hosted runner with VPN action
- OR deploy from inside VPN network

**For Local Development:**
- Connect to UHC Cloud VPN before deployment
- Test connectivity: `ping 10.10.101.181`
- Verify SSH access: `ssh -i ~/kenya-tnt-staging.pem ubuntu@10.10.101.181`

---

## 📊 Reusable Components

### Same for All Projects:
- ✅ Docker Registry (cloud-taifacare.dha.go.ke)
- ✅ Company Servers (tnt-staging.apeiro-digital.com)
- ✅ VPN Access (UHC Cloud VPN)
- ✅ Branch structure (develop → staging → main)
- ✅ CI/CD patterns (adjust test commands)

### Project-Specific:
- ⚙️ Test commands
- ⚙️ Build commands
- ⚙️ Service names
- ⚙️ Performance targets (NFRs)
- ⚙️ Application port (internal Docker port)

---

## 🎯 Example: Transform Your "FLMIS" Project

```bash
# Go to FLMIS project
cd /Users/apeiro/your-flmis-project

# Copy transformation files from Kenya TNT
cp /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/.github/workflows/* .github/workflows/
cp /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/setup-dev-rails.sh .
cp /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/DEVELOPMENT_WORKFLOW.md .

# Customize for FLMIS
vim .github/workflows/ci-dev.yml  # Update to Java/Spring Boot commands
vim NFR_MATRIX.md                 # Set FLMIS performance targets

# Connect to VPN first!
# (Connect to UHC Cloud VPN)

# Add GitHub Secrets (reuse same company infrastructure!)
gh secret set DOCKER_REGISTRY_URL --body "cloud-taifacare.dha.go.ke"
gh secret set DOCKER_REGISTRY_USERNAME --body "admin"
gh secret set DOCKER_REGISTRY_PASSWORD --body "9142d696-121d-4232-a2ff-333b7bae4489"

# Staging (reuse same server, different app)
gh secret set STAGING_API_URL --body "https://tnt-staging.apeiro-digital.com/flmis/api"
gh secret set STAGING_SERVER_IP --body "10.10.101.181"
gh secret set STAGING_SERVER_USER --body "ubuntu"
gh secret set STAGING_SERVER_SSH_KEY < ~/keys/kenya-tnt-staging.pem

# Test connection
ping 10.10.101.181
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181

# Run transformation
bash setup-dev-rails.sh

# ✅ FLMIS is now professional too (on same staging server)!
```

---

## 🏆 Best Practice: Create Your Company Template

Since you have multiple projects, create a company-wide template:

```bash
# Fork the template for your company
# https://github.com/insen5/project-template-standard
# → Fork to: https://github.com/dha-kenya/project-template-standard

# Customize with:
# - DHA Docker Registry pre-configured
# - Your SSH keys
# - Your server IPs
# - Your company standards

# Then for ANY new project:
# 1. Use your company template
# 2. Run setup
# 3. Done in 5 minutes!
```

---

## ✅ Verification Checklist

After transforming another project:

- [ ] Branches created (develop, staging, main)
- [ ] GitHub Secrets added (9 total)
- [ ] CI/CD workflows in place
- [ ] Branch protection rules set
- [ ] Local environment running
- [ ] First commit pushed to develop
- [ ] CI ran successfully
- [ ] Documentation updated

---

## 🆘 Quick Help

**Issue**: "My project uses Java, not Node.js"
**Solution**: Update the CI workflows:
```yaml
# Replace npm commands with Maven/Gradle
npm run test     → mvn test
npm run lint     → mvn checkstyle:check
npm run build    → mvn clean package
```

**Issue**: "Different directory structure"
**Solution**: Update `working-directory` in workflows:
```yaml
defaults:
  run:
    working-directory: ./your-project-path
```

**Issue**: "Don't have separate servers"
**Solution**: Use same staging server with different Docker Compose projects:
```bash
# Project 1 (Kenya TNT)
STAGING_API_URL=https://tnt-staging.apeiro-digital.com/api
# Uses Docker Compose project: kenya-tnt-staging

# Project 2 (e.g., FLMIS)
STAGING_API_URL=https://tnt-staging.apeiro-digital.com:8443/api
# Uses Docker Compose project: flmis-staging
# Different internal port, reverse proxy routes by domain/path
```

**Issue**: "Can't access staging server"
**Solution**: Connect to UHC Cloud VPN first:
```bash
# 1. Connect to VPN
# 2. Test connectivity
ping 10.10.101.181

# 3. Test SSH
ssh -i ~/kenya-tnt-staging.pem ubuntu@10.10.101.181

# 4. If GitHub Actions fails, check VPN connectivity in runner
```

**Issue**: "How to use the PEM file?"
**Solution**: Secure the private key and add to GitHub Secrets:
```bash
# Set proper permissions on local machine
chmod 400 ~/kenya-tnt-staging.pem

# Add to GitHub Secrets (reads entire file)
gh secret set STAGING_SERVER_SSH_KEY < ~/kenya-tnt-staging.pem

# Test locally first
ssh -i ~/kenya-tnt-staging.pem ubuntu@10.10.101.181
```

---

## 📚 Resources

- **Template Repo**: https://github.com/insen5/project-template-standard
- **Kenya TNT Example**: https://github.com/insen5/kenya-tnt-system
- **DHA Registry Config**: `DHA_REGISTRY_CONFIG.md` (in Kenya TNT)
- **Workflow Guide**: `DEVELOPMENT_WORKFLOW.md`

---

## 🎉 Summary

**To transform ANY project from Cowboy to Pro:**

```bash
# 1. Copy files from Kenya TNT or template
# 2. Customize CI/CD for your tech stack
# 3. Get VPN access and .pem file from DevOps
# 4. Add GitHub Secrets (registry + company servers)
# 5. Run setup-dev-rails.sh
# 6. Deploy to company staging server!
```

**Time**: 20-40 minutes per project (including VPN setup)  
**Result**: Enterprise-grade development workflow  
**Reuse**: Same Docker registry, staging server, patterns  
**Requirements**: UHC Cloud VPN access, kenya-tnt-staging.pem file

---

## 🔐 Security Checklist

Before deploying to company servers:

- [ ] VPN credentials obtained from IT/DevOps
- [ ] PEM file secured with `chmod 400`
- [ ] PEM file added to `.gitignore`
- [ ] PEM file uploaded to GitHub Secrets
- [ ] VPN connection tested (`ping 10.10.101.181`)
- [ ] SSH connection tested (`ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181`)
- [ ] HTTPS endpoint tested (`curl -k https://tnt-staging.apeiro-digital.com`)
- [ ] Never committed secrets to git

---

## 📋 Deployment Server Reference

### Staging (UAT)
```
Domain:  tnt-staging.apeiro-digital.com
IP:      10.10.101.181 (private)
User:    ubuntu
Port:    443 (HTTPS)
Access:  VPN + PEM key
RAM:     64 GB
CPU:     16 cores
Storage: 1 TB
```

### Production
```
Status: Not provisioned yet
Plan:   Similar specs, separate domain
```

---

**Transform all your projects to professional workflows!** 🚀

**From Cowboy Chaos to Professional Paradise - Everywhere!** 🤠 → 👔 → 🌟


