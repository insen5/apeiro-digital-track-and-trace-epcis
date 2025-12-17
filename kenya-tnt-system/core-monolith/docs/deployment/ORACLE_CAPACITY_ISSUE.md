# ⚠️ Oracle Cloud ARM Capacity Issue

## Current Status

**Mumbai Region:** ❌ OUT OF CAPACITY for ARM instances  
**Impact:** Cannot create VM.Standard.A1.Flex instances  
**Last Checked:** December 17, 2025 @ 23:48 UTC

---

## What's Happening?

Oracle Cloud Free Tier ARM instances (VM.Standard.A1.Flex) are **extremely popular** and **limited in availability**. The Mumbai data center is currently at full capacity.

This is **NORMAL** and **TEMPORARY**.

---

## Solutions (in Order of Recommendation)

### ✅ Option 1: Auto-Retry Script (Easiest)

We've created an automated retry script that will keep trying until capacity becomes available:

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
chmod +x retry-instance-creation.sh
./retry-instance-creation.sh
```

**This will:**
- Automatically retry every 60 seconds
- Try different configurations (4 OCPUs → 2 OCPUs → 1 OCPU)
- Continue indefinitely until successful
- Alert you when capacity is available

**Recommended Times to Run (India Time):**
- 🌙 **2 AM - 6 AM IST** (Best - lowest usage)
- 🌅 **6 AM - 9 AM IST** (Good - before work hours)
- 🌆 **11 PM - 1 AM IST** (Good - after peak hours)

### ✅ Option 2: Try Different Region

Change region to one with better capacity:

**Recommended Regions:**
1. **Hyderabad** (`ap-hyderabad-1`) - Closest to Kenya after Mumbai
2. **Singapore** (`ap-singapore-1`) - Good Asia-Pacific coverage
3. **Johannesburg** (`af-johannesburg-1`) - Closest to Kenya geographically

**To switch region:**
```bash
# 1. Update OCI config
nano ~/.oci/config
# Change: region=ap-mumbai-1
# To:     region=ap-hyderabad-1 (or other region)

# 2. Re-run deployment
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
./deploy-to-oracle.sh
```

### ✅ Option 3: Manual Creation via Web Console

Sometimes the web console has better success rates:

1. Go to https://cloud.oracle.com
2. **☰ Menu** → **Compute** → **Instances**
3. Click **Create Instance**
4. Configure:
   - Name: `kenya-tnt-system`
   - Image: Ubuntu 24.04 (ARM)
   - Shape: VM.Standard.A1.Flex (4 OCPUs, 24GB)
   - Network: Use existing VCN (kenya-tnt-system-vcn)
   - SSH Key: Upload `~/.ssh/kenya-tnt-oracle.pub`
5. Click **Create** and keep retrying if capacity error appears

Once created via web console:
```bash
# Get the public IP from console
export PUBLIC_IP="<your-instance-ip>"
export SSH_KEY_PATH="$HOME/.ssh/kenya-tnt-oracle"

# Run application deployment
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
echo "$PUBLIC_IP" > /tmp/kenya-tnt-ip.txt
echo "$SSH_KEY_PATH" > /tmp/kenya-tnt-ssh-key.txt
./deploy-application.sh
```

### ⚠️ Option 4: Use AMD Instead of ARM (Less Free Resources)

If you need an instance immediately, use AMD shape:

**Shape:** `VM.Standard.E2.1.Micro`  
**Resources:** 1 OCPU, 1GB RAM (more limited, but usually available)  
**Note:** May struggle with full stack (database + backend + frontend)

---

## Why This Happens

1. **ARM instances are FREE forever** (4 OCPUs, 24GB RAM)
2. **Extremely popular** among developers
3. **Limited physical hardware** in data centers
4. **High demand** especially in Asian regions

---

## What We've Already Done

✅ Created VCN (Virtual Cloud Network)  
✅ Configured Internet Gateway  
✅ Set up Security Lists (ports open)  
✅ Created Subnet  
✅ Generated SSH Keys  

**Only Missing:** The compute instance itself

---

## Current Infrastructure

All of this is ready and waiting:

```
VCN OCID: ocid1.vcn.oc1.ap-mumbai-1.amaaaaaajwn72taamxichchosris5rwjja7pkz4xaxievi5qeb5p23p2sb2a
Subnet OCID: ocid1.subnet.oc1.ap-mumbai-1.aaaaaaaazxd2x2feydvwpbgbvjsgmh3ern4bogimr2bf3wdgslpgcp6ri2eq
SSH Key: /Users/apeiro/.ssh/kenya-tnt-oracle
```

---

## Typical Wait Times

Based on community experience:

- **During Day (India Time):** Can take hours or days
- **During Night (2-6 AM IST):** Usually succeeds within 1-2 hours
- **Different Region:** Often succeeds immediately

---

## Recommended Action

**START THE RETRY SCRIPT NOW:**

```bash
cd /Users/apeiro/apeiro-digital-track-and-trace-epcis/kenya-tnt-system
chmod +x retry-instance-creation.sh
./retry-instance-creation.sh
```

Let it run in the background. It will alert you when capacity becomes available.

**OR**

Try a different region (Hyderabad is great for Kenya):
- Edit `~/.oci/config`
- Change region to `ap-hyderabad-1`
- Run `./deploy-to-oracle.sh`

---

## Support

This is a known Oracle Cloud limitation, not a problem with our deployment script. The infrastructure is correctly configured and ready.

**References:**
- [Oracle Cloud Free Tier Capacity Issues (Reddit)](https://www.reddit.com/r/oraclecloud/)
- [OCI Capacity Troubleshooting](https://docs.oracle.com/iaas/Content/Compute/References/resource-limits.htm)

---

**Need Help?** The retry script is your best bet. Just let it run!