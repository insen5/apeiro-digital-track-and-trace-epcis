# 🔐 PEM File Setup Complete

**Date**: December 22, 2025  
**Status**: ✅ Secure Setup Complete

---

## ✅ What Was Done

### 1. Secured PEM File Location
- ✅ **Moved** PEM file from project directory → `~/keys/`
- ✅ **Renamed** `tnt-staging 1 (1).pem` → `kenya-tnt-staging.pem` (clean name)
- ✅ **Set permissions** to `400` (read-only for owner)
- ✅ **Removed** original file from project directory

### 2. Updated .gitignore
- ✅ Added `*.pem` to `.gitignore` in `kenya-tnt-system/`
- ✅ Added other security-related file patterns
- ✅ Verified no `.pem` files tracked by git

### 3. Created Test Script
- ✅ Created `test-staging-connection.sh`
- ✅ Tests VPN connectivity
- ✅ Tests SSH connection
- ✅ Shows server information

---

## 📍 PEM File Location

```
~/keys/kenya-tnt-staging.pem
```

**Permissions**: `-r--------` (400)  
**Owner**: apeiro  
**Size**: 2602 bytes

---

## 🧪 Test Your Connection

**Before testing, connect to UHC Cloud VPN first!**

Then run:

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
./test-staging-connection.sh
```

This will:
1. ✅ Check if VPN is connected
2. ✅ Check if PEM file has correct permissions
3. ✅ Test SSH connection
4. ✅ Show server information
5. ✅ Check if application is deployed

---

## 🔑 Manual SSH Connection

```bash
# Connect to VPN first!

# Then SSH to staging
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181
```

---

## 🚀 Add to GitHub Secrets (For CI/CD)

```bash
# Add PEM file to GitHub Secrets
gh secret set STAGING_SERVER_SSH_KEY < ~/keys/kenya-tnt-staging.pem

# Verify it was added
gh secret list | grep STAGING_SERVER_SSH_KEY
```

---

## 🔒 Security Checklist

- [x] PEM file not in project directory
- [x] PEM file has 400 permissions
- [x] PEM file in .gitignore
- [x] PEM file in secure location (~/.keys/)
- [ ] **TODO**: Connect to VPN and test SSH
- [ ] **TODO**: Add to GitHub Secrets (for CI/CD)

---

## 📚 Next Steps

### 1. Test Connection (Requires VPN)

```bash
# 1. Connect to UHC Cloud VPN
# 2. Test connection
./test-staging-connection.sh
```

### 2. Configure GitHub Secrets

```bash
# Add all required secrets for CI/CD
gh secret set STAGING_SERVER_IP --body "10.10.101.181"
gh secret set STAGING_SERVER_USER --body "ubuntu"
gh secret set STAGING_SERVER_SSH_KEY < ~/keys/kenya-tnt-staging.pem
gh secret set STAGING_API_URL --body "https://tnt-staging.apeiro-digital.com/api"

# Docker Registry
gh secret set DOCKER_REGISTRY_URL --body "cloud-taifacare.dha.go.ke"
gh secret set DOCKER_REGISTRY_USERNAME --body "admin"
gh secret set DOCKER_REGISTRY_PASSWORD --body "9142d696-121d-4232-a2ff-333b7bae4489"
```

### 3. First Deployment

See **COMPANY_DEPLOYMENT_GUIDE.md** for complete deployment instructions.

Quick deploy (requires VPN):

```bash
# SSH to server
ssh -i ~/keys/tnt-staging.pem ubuntu@10.10.101.181

# On server, run first-time setup (if needed)
# See COMPANY_DEPLOYMENT_GUIDE.md section "Server Setup"
```

---

## ⚠️ Important Reminders

### Never Do This:
- ❌ Commit `.pem` files to git
- ❌ Share `.pem` via email/Slack
- ❌ Copy `.pem` to project directory
- ❌ Change permissions to anything other than 400
- ❌ Share via public cloud storage

### Always Do This:
- ✅ Keep `.pem` in `~/keys/` or `~/.ssh/`
- ✅ Use `chmod 400` on PEM files
- ✅ Share via encrypted methods (see TRANSFORM_ANY_PROJECT.md)
- ✅ Connect to VPN before accessing server
- ✅ Use GitHub Secrets for CI/CD

---

## 🆘 Troubleshooting

### "Permission denied (publickey)"

**Solution:**
```bash
# Check permissions
ls -la ~/keys/kenya-tnt-staging.pem
# Should show: -r--------

# Fix if wrong
chmod 400 ~/keys/kenya-tnt-staging.pem
```

### "Connection timeout"

**Solution:**
```bash
# Check VPN connection
ping 10.10.101.181

# If fails, connect to VPN first
```

### "No such file or directory"

**Solution:**
```bash
# Verify PEM file location
ls -la ~/keys/kenya-tnt-staging.pem

# If not found, file may be in wrong location
find ~ -name "kenya-tnt-staging.pem" 2>/dev/null
```

---

## 📖 Documentation References

- **Deployment Guide**: [COMPANY_DEPLOYMENT_GUIDE.md](./COMPANY_DEPLOYMENT_GUIDE.md)
- **Quick Reference**: [DEPLOYMENT_QUICK_REFERENCE.md](./DEPLOYMENT_QUICK_REFERENCE.md)
- **Transform Projects**: [TRANSFORM_ANY_PROJECT.md](./TRANSFORM_ANY_PROJECT.md)
- **All Docs**: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## ✅ Summary

Your PEM file is now securely configured:

```
Location:     ~/keys/kenya-tnt-staging.pem
Permissions:  400 (secure)
Git Status:   Ignored (won't be committed)
Test Script:  ./test-staging-connection.sh
```

**Next**: Connect to VPN and run `./test-staging-connection.sh` 🚀

---

**Secured by**: Cursor AI  
**Date**: December 22, 2025  
**Status**: Ready for deployment testing

