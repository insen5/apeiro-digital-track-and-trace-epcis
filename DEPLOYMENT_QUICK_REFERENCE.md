# 🚀 Deployment Quick Reference Card

**Last Updated**: December 22, 2025

---

## 📋 Staging Server Details

```
Domain:     tnt-staging.apeiro-digital.com
IP:         10.10.101.181 (private - VPN required)
User:       ubuntu
Port:       443 (HTTPS)
RAM:        64 GB
CPU:        16 cores
Storage:    1 TB
Auth:       PEM key (tnt-staging.pem)
Network:    UHC Cloud VPN required
```

---

## ⚡ Quick Deploy Checklist

- [ ] 1. Connect to VPN
- [ ] 2. Test VPN: `ping 10.10.101.181`
- [ ] 3. Test SSH: `ssh -i ~/keys/tnt-staging.pem ubuntu@10.10.101.181`
- [ ] 4. Deploy code (see commands below)
- [ ] 5. Verify: `https://tnt-staging.apeiro-digital.com`

---

## 🔑 Essential Commands

### Connect to Server
```bash
# 1. Connect to VPN first!

# 2. SSH to server
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181
```

### Deploy Application
```bash
# On your local machine (VPN connected)
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 << 'EOF'
  cd /opt/kenya-tnt
  git pull origin staging
  docker-compose -f docker-compose.staging.yml pull
  docker-compose -f docker-compose.staging.yml up -d
EOF
```

### Check Status
```bash
# SSH to server and check containers
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 "docker ps"

# Check logs
ssh -i ~/keys/kenya-tnt-staging.pem ubuntu@10.10.101.181 \
  "cd /opt/kenya-tnt && docker-compose -f docker-compose.staging.yml logs --tail=50 backend"
```

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect to server | Connect to VPN first |
| Permission denied (SSH) | Check PEM file: `chmod 400 ~/keys/kenya-tnt-staging.pem` |
| Deployment failed | Check VPN connection, check logs |
| HTTPS error | Check SSL certificate on server |

---

## 📚 Full Documentation

- **Deployment Guide**: [COMPANY_DEPLOYMENT_GUIDE.md](./COMPANY_DEPLOYMENT_GUIDE.md)
- **Transform Projects**: [TRANSFORM_ANY_PROJECT.md](./TRANSFORM_ANY_PROJECT.md)
- **All Documentation**: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)

---

## 🔐 Security Reminders

- ✅ VPN connected before deployment
- ✅ PEM file permissions: `chmod 400`
- ✅ Never commit `.pem` files to git
- ✅ Never share PEM via email/Slack
- ✅ Store in `~/keys/` or `~/.ssh/`

---

**Print this and keep it handy! 📌**

