# 🚀 Kenya TNT System - Deployment Status

**Last Updated:** December 17, 2025 @ 20:00 UTC

---

## ✅ What's Complete (90% Done)

All infrastructure is ready and configured:

1. ✅ **OCI CLI Installed & Configured**
2. ✅ **Virtual Cloud Network (VCN) Created**
   - OCID: `ocid1.vcn.oc1.ap-mumbai-1.amaaaaaajwn72taamxichchosris5rwjja7pkz4xaxievi5qeb5p23p2sb2a`
3. ✅ **Internet Gateway Created**
4. ✅ **Security Lists Configured** (All ports open: 22, 80, 443, 3002, 4000, 8080)
5. ✅ **Subnet Created**
   - OCID: `ocid1.subnet.oc1.ap-mumbai-1.aaaaaaaazxd2x2feydvwpbgbvjsgmh3ern4bogimr2bf3wdgslpgcp6ri2eq`
6. ✅ **SSH Keys Generated**
   - Location: `~/.ssh/kenya-tnt-oracle`
7. ✅ **All Deployment Scripts Ready**

---

## ⏳ Current Blocker

**Mumbai region is OUT OF CAPACITY for ARM instances.**

This is temporary and normal for Oracle Free Tier. Capacity frees up throughout the day, especially during off-peak hours (2-6 AM India time).

**Important:** Once your instance is created, it's PERMANENT. You'll never lose it due to capacity issues. This only affects NEW instance creation.

---

## 🎯 What You Need To Do

**Run the auto-retry script:**

```bash
cd ~/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
nohup ./retry-instance-creation.sh > ~/kenya-tnt-retry.log 2>&1 &
```

**This will:**
- Keep trying every 60 seconds automatically
- Try different configurations (4 → 2 → 1 OCPUs)
- Run in the background
- Alert you when successful
- Automatically deploy the application once instance is created

**Check progress anytime:**
```bash
tail -f ~/kenya-tnt-retry.log
```

**Stop it (if needed):**
```bash
pkill -f retry-instance-creation
```

---

## ⏰ Best Times to Try

Based on India timezone (Mumbai datacenter):

- 🌙 **2:00 AM - 6:00 AM IST** - BEST (overnight low usage)
- 🌅 **6:00 AM - 9:00 AM IST** - Good (before work hours)
- 🌆 **11:00 PM - 1:00 AM IST** - Good (after peak)

Current India time: Check with `TZ=Asia/Kolkata date`

---

## 📁 Important Files & Locations

| File | Location | Purpose |
|------|----------|---------|
| OCI Config | `~/.oci/config` | OCI CLI configuration |
| API Key | `~/.oci/oci_api_key.pem` | Authentication |
| SSH Key | `~/.ssh/kenya-tnt-oracle` | Server access (once created) |
| Retry Script | `~/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/retry-instance-creation.sh` | Auto-retry |
| Deploy Script | `~/apeiro-digital-track-and-trace-epcis/kenya-tnt-system/deploy-application.sh` | App deployment |
| Deployment Info | `~/kenya-tnt-deployment-info.txt` | Infrastructure details |

---

## 🔄 Alternative: Manual Web Console

If you prefer to create the instance manually:

1. Go to https://cloud.oracle.com
2. **☰ Menu** → **Compute** → **Instances**
3. Click **Create Instance**
4. Configure:
   - **Name:** kenya-tnt-system
   - **Image:** Canonical Ubuntu 22.04 (aarch64)
   - **Shape:** VM.Standard.A1.Flex
     - OCPUs: 2-4 (whatever's available)
     - Memory: 12-24 GB
   - **Networking:** 
     - VCN: kenya-tnt-system-vcn
     - Subnet: kenya-tnt-system-subnet (public)
   - **SSH Key:** Upload `~/.ssh/kenya-tnt-oracle.pub`
5. Click **Create** (keep retrying if "Out of capacity")

Once created via web console:
```bash
# Get the Public IP from console, then:
export PUBLIC_IP="<your-instance-ip>"
cd ~/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
echo "$PUBLIC_IP" > /tmp/kenya-tnt-ip.txt
echo "$HOME/.ssh/kenya-tnt-oracle" > /tmp/kenya-tnt-ssh-key.txt
./deploy-application.sh
```

---

## 📊 What Happens After Instance Creation

Once the retry script succeeds OR you create manually:

1. **Infrastructure Ready** ✅ (already done)
2. **Instance Created** ⏳ (waiting for capacity)
3. **Auto Deploy** (automatic via script):
   - Install Docker
   - Clone/copy application
   - Configure environment
   - Start all services (PostgreSQL, OpenSearch, Backend, Frontend)
   - Configure firewall
   - Run health checks

**Total deployment time:** 15-20 minutes after instance is created

**Final result:**
- Frontend: `http://YOUR_IP:3002`
- Backend API: `http://YOUR_IP:4000/api`
- API Docs: `http://YOUR_IP:4000/api/docs`

---

## 🆘 Need Help?

**Check retry status:**
```bash
tail -f ~/kenya-tnt-retry.log
```

**Check if retry is running:**
```bash
ps aux | grep retry-instance
```

**Restart retry manually:**
```bash
cd ~/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
./retry-instance-creation.sh
```

---

## 💡 Bottom Line

**Everything is ready except the VM instance itself.**

The retry script will handle everything automatically once capacity becomes available (usually within a few hours during off-peak times).

**Start the retry script and let it run overnight!**

```bash
cd ~/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
nohup ./retry-instance-creation.sh > ~/kenya-tnt-retry.log 2>&1 &
echo "Retry script started in background!"
tail -f ~/kenya-tnt-retry.log
```
