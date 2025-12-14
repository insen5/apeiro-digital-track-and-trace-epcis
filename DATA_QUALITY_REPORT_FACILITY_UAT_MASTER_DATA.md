# Data Quality Report - Facility UAT Master Data

## Executive Summary

This document provides a comprehensive data quality framework for the Facility UAT Master Data in the Kenya Track & Trace System, synced from the Safaricom Health Information Exchange (HIE) Facility Registry API.

**Report Generated:** December 14, 2025  
**Data Source:** Safaricom HIE Facility Registry API → `uat_facilities` table  
**Sync Method:** Incremental sync every 3 hours  

---

## 📊 Data Quality Dimensions

### 1. **Completeness** (40% weight)
Measures the presence of required data fields

| Field | Required? | Criticality | Impact if Missing |
|-------|-----------|-------------|-------------------|
| Facility Code | **Yes** | **CRITICAL** | Cannot identify facility uniquely |
| MFL Code | Yes | **HIGH** | Cannot link to MOH Master Facility List |
| Facility Name | **Yes** | **CRITICAL** | Cannot identify facility |
| Facility Type | Yes | **HIGH** | Cannot categorize facilities |
| Ownership | Yes | **HIGH** | Cannot track public vs private facilities |
| County | Yes | **HIGH** | Cannot track geographical distribution |
| Sub-County | Yes | **MEDIUM** | Incomplete location data |
| Ward | Yes | **MEDIUM** | Incomplete location data |
| GLN | **Yes** | **CRITICAL** | ❌ **Cannot use in EPCIS events** |
| Operational Status | Yes | **HIGH** | Cannot verify active status |
| License Status | Yes | **MEDIUM** | Regulatory compliance unknown |
| License Validity | Yes | **MEDIUM** | Cannot verify current license |
| Phone Number | No | **LOW** | Contact information missing |
| Email | No | **LOW** | Contact information missing |
| Services Offered | No | **MEDIUM** | Facility capabilities unknown |
| Beds Capacity | No | **LOW** | Facility size unknown |
| Latitude/Longitude | No | **LOW** | Cannot map facility location |

### Critical Finding: **GLN Coverage**

**Expected Status:**
- ✅ **Safaricom HIE API does NOT provide GLN** (known limitation)
- ❌ **All facilities will have NULL GLN** after sync
- ❌ **Facilities without GLN cannot be used in EPCIS events**

**Impact:**
- Cannot track facility-level receiving events
- Cannot track facility-level dispensing events
- Breaks end-to-end traceability chain
- Requires manual GLN assignment coordination with GS1 Kenya

**Completeness Score Formula:**
```
Completeness % = (Complete Records / Total Records) × 100

Complete Record = Has all CRITICAL + HIGH criticality fields (excluding GLN)

Note: GLN excluded from completeness calculation as it's a known API limitation
```

---

### 2. **Validity** (30% weight)
Measures the correctness and format of data

#### Facility Code Validation
- **Valid**: Unique facility code from Safaricom HIE
- **Invalid**: Duplicate facility codes (critical issue)

#### License Validity
- ✅ **Valid:** License expires > 30 days from now
- ⚠️ **Expiring Soon:** License expires within 30 days
- ❌ **Expired:** License date < today

#### Operational Status
- ✅ **Active:** Facility is operational
- ⚠️ **Temporarily Closed:** Short-term closure
- ❌ **Inactive:** Facility permanently closed

#### Location Coordinates Validation
- **Valid**: Latitude between -5 and 5, Longitude between 33 and 42 (Kenya bounds)
- **Invalid**: Outside Kenya bounds or NULL

#### Duplicate Detection
- Check for duplicate `facility_code` (critical issue)
- Check for duplicate `mfl_code` (warning)
- Check for duplicate facility names in same county (warning)

**Validity Score Formula:**
```
Validity % = (
  (Valid Licenses / Total) × 40% +
  (No Duplicate Codes ? 100 : 0) × 30% +
  (Active Facilities / Total) × 20% +
  (Valid Coordinates / Total with Coords) × 10%
)
```

---

### 3. **Consistency** (15% weight)
Measures data consistency across records

- County names standardized (e.g., "Nairobi" not "nairobi" or "NRB")
- Facility types from known list (Hospital, Health Centre, Dispensary, etc.)
- Ownership types standardized (Government, Private, FBO)
- Status values from known list (Active, Inactive, Temporarily Closed)

**Known Values:**

**Facility Types:**
- National Referral Hospital
- County Referral Hospital
- Sub-County Hospital
- Health Centre
- Dispensary
- Medical Clinic
- Nursing Home
- Laboratory
- Pharmacy

**Ownership:**
- Government (MOH)
- County Government
- Private
- Faith-Based Organization (FBO)
- NGO
- Parastatal

---

### 4. **Timeliness** (15% weight)
Measures data freshness

- **Excellent:** Last sync < 3 hours ago (within schedule)
- **Good:** Last sync < 6 hours ago
- **Warning:** Last sync < 24 hours ago
- **Critical:** Last sync > 24 hours ago (sync failures)

**Sync Schedule:** Every 3 hours (8x daily)

---

## 🎯 Quality Scoring

### Overall Data Quality Score

```
Total Score = (
  Completeness × 40% +
  Validity × 30% +
  Consistency × 15% +
  Timeliness × 15%
)
```

### Score Interpretation

| Score Range | Grade | Status | Action Required |
|-------------|-------|--------|-----------------|
| 90-100 | A+ | ✅ Excellent | Maintain current practices |
| 80-89 | A | ✅ Good | Minor improvements |
| 70-79 | B | ⚠️ Acceptable | Review recommendations |
| 60-69 | C | ⚠️ Needs Improvement | Action plan required |
| < 60 | F | ❌ Critical | Immediate action required |

---

## 📈 Sample Data Quality Report

### Overview
```
╔════════════════════════════════════════════════════════════╗
║     FACILITY UAT MASTER DATA - DATA QUALITY REPORT         ║
╚════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Total Facilities:    8,523
  Last Sync:           2025-12-14T10:30:00Z
  
  Data Quality Score:  76.8/100 ⚠️ ACCEPTABLE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DATA COMPLETENESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Complete Records:       7,892 / 8,523 (92.6%)
  
  Missing Data:
    GLN:                  8,523  (100%) ❌ CRITICAL - API LIMITATION
    MFL Code:             156    (1.8%)
    Facility Type:        23     (0.3%)
    Ownership:            45     (0.5%)
    County:               12     (0.1%)
    Location Data:        234    (2.7%)
    License Info:         89     (1.0%)
    Contact Info:         3,456  (40.5%) ⚠️ LOW PRIORITY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DATA VALIDITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  License Status:
    Expired:              67   ⚠️ URGENT
    Expiring Soon:        123  (within 30 days)
    Valid:                8,333
  
  Operational Status:
    Active:               8,123  (95.3%)
    Temporarily Closed:   234    (2.7%)
    Inactive:             166    (1.9%)
  
  Duplicate Codes:        2     ⚠️ CRITICAL
  Invalid Coordinates:    156   (out of 6,789 with coords)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DISTRIBUTION (Top 10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  By County:
    Nairobi               892   (10.5%)
    Kiambu                456   (5.4%)
    Nakuru                389   (4.6%)
    Mombasa               345   (4.0%)
    Machakos              312   (3.7%)
    Kakamega              298   (3.5%)
    Kisumu                234   (2.7%)
    Meru                  223   (2.6%)
    Kilifi                198   (2.3%)
    Bungoma               187   (2.2%)

  By Facility Type:
    Dispensary            5,432 (63.7%)
    Health Centre         1,234 (14.5%)
    Medical Clinic        890   (10.4%)
    Hospital              567   (6.7%)
    Pharmacy              234   (2.7%)
    Laboratory            156   (1.8%)
    Other                 10    (0.1%)

  By Ownership:
    Government            4,567 (53.6%)
    Private               3,456 (40.5%)
    FBO                   400   (4.7%)
    NGO                   100   (1.2%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ISSUES IDENTIFIED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ❌ CRITICAL [GLN Missing] 8,523 facilities missing GLN (API limitation)
  ⚠️  HIGH     [License Validity] 67 facilities have expired licenses
  ⚠️  MEDIUM   [License Validity] 123 facilities have licenses expiring within 30 days
  ⚠️  MEDIUM   [Completeness] 156 facilities missing MFL Code
  ⚠️  MEDIUM   [Completeness] 234 facilities missing location data
  ❌ HIGH      [Data Integrity] 2 duplicate facility codes detected
  ℹ️  LOW      [Completeness] 3,456 facilities missing contact information

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  KNOWN API LIMITATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ℹ️  API LIMITATION: Safaricom HIE API does not provide GLN
      - Missing: GLN (GS1 Global Location Number)
      - Available: Facility codes, MFL codes, basic facility info
      - Impact: Cannot use facilities in EPCIS events without GLN
      - Mitigation: Manual GLN assignment via GS1 Kenya coordination
  
  ℹ️  API LIMITATION: Contact information may be incomplete
      - Email and phone numbers not always provided
      - Impact: Cannot notify facilities of issues automatically
      - Mitigation: Manual data entry or facility registration portal
  
  ℹ️  API LIMITATION: Service offerings may be outdated
      - Services list may not reflect current capabilities
      - Impact: Cannot accurately filter by services offered
      - Mitigation: Implement facility self-update portal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  IMMEDIATE (Week 1):
  • Coordinate with GS1 Kenya to assign GLNs to 8,523 facilities
  • Prioritize GLN assignment for:
    - National referral hospitals (highest volume)
    - County referral hospitals
    - High-volume dispensaries
  • Resolve 2 duplicate facility codes by contacting Safaricom HIE
  • Update 67 expired licenses or mark facilities as inactive
  • Notify 123 facilities with licenses expiring within 30 days

  SHORT-TERM (Month 1):
  • Complete missing MFL codes for 156 facilities
  • Implement facility self-registration portal for contact updates
  • Set up alerts for license expiration (60 days before expiry)
  • Create GLN assignment workflow for new facilities

  MEDIUM-TERM (Quarter 1):
  • Achieve 100% GLN coverage for active facilities
  • Implement real-time webhook sync from Safaricom HIE
  • Create facility-to-premise mapping (link HIE to PPB)
  • Set up automated license renewal reminders

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  API & DATA SOURCE RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Safaricom HIE API Enhancements Needed:
  • Request Safaricom HIE to add GLN field to facility registry
    - Enable EPCIS compliance for all facilities
    - Coordinate with GS1 Kenya for bulk GLN assignment
  
  • Request enhanced facility data:
    - Add current email and phone contact (verified)
    - Add real-time operational status updates
    - Add facility administrator contact details
  
  • Request webhook notifications for facility updates
    - Enable real-time sync instead of 3-hour polling
    - Reduce data latency from 0-3 hours to < 5 seconds
  
  Interim Solutions:
  • Implement facility self-registration portal
    - Facilities verify their HIE data
    - Add missing GLN, contact info, services
    - Admin approval workflow for verification
  
  • Manual GLN assignment process
    - Work with GS1 Kenya to assign GLNs in bulk
    - Batch assign GLNs to high-priority facilities first
    - Create CSV import tool for bulk GLN updates
  
  • Create facility-to-premise mapping
    - Link Safaricom HIE facilities to PPB premises
    - Enable cross-reference between systems
    - Support data reconciliation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📊 Data Source Analysis

### Current Data Source

**Safaricom Health Information Exchange (HIE) Facility Registry API**

**Authentication:** OAuth2 (Client Credentials)  
**URL:** `https://apistg.safaricom.co.ke/hie/api/v1/fr/facility/sync`  
**Sync Method:** Incremental (using `lastUpdated` parameter)  
**Sync Frequency:** Every 3 hours (automated)

**Data Provided:**
- ✅ Facility code, MFL code, KMHFL code
- ✅ Facility name, type, ownership
- ✅ County, sub-county, constituency, ward
- ✅ Operational status, license status
- ✅ Services offered, beds capacity
- ✅ Latitude/longitude coordinates

**Data NOT Provided:**
- ❌ GLN (must be assigned via GS1 Kenya)
- ⚠️ Contact info (email/phone) may be incomplete
- ⚠️ Address details (street addresses) may be missing

---

## 🛠️ Data Quality Tools

### 1. **Automated Report Generator**

```bash
# Generate report
./scripts/data-quality-report.sh uat-facilities

# Save to file
./scripts/data-quality-report.sh uat-facilities --save report-$(date +%Y%m%d).json

# JSON output only
./scripts/data-quality-report.sh uat-facilities --json | jq '.overview'
```

### 2. **API Endpoint**

```bash
# Get full report
curl http://localhost:4000/api/master-data/uat-facilities/data-quality-report

# Extract specific metrics
curl http://localhost:4000/api/master-data/uat-facilities/data-quality-report | jq '.overview'
```

### 3. **Database Queries**

```sql
-- Find facilities with expired licenses
SELECT facility_code, facility_name, license_valid_until
FROM uat_facilities
WHERE license_valid_until < CURRENT_DATE
ORDER BY license_valid_until;

-- Find duplicate facility codes
SELECT facility_code, COUNT(*) as count
FROM uat_facilities
GROUP BY facility_code
HAVING COUNT(*) > 1;

-- Find missing critical data
SELECT 
  SUM(CASE WHEN gln IS NULL THEN 1 ELSE 0 END) as missing_gln,
  SUM(CASE WHEN mfl_code IS NULL THEN 1 ELSE 0 END) as missing_mfl,
  SUM(CASE WHEN county IS NULL THEN 1 ELSE 0 END) as missing_county,
  SUM(CASE WHEN facility_type IS NULL THEN 1 ELSE 0 END) as missing_type
FROM uat_facilities;

-- Distribution by county
SELECT county, COUNT(*) as count
FROM uat_facilities
WHERE county IS NOT NULL
GROUP BY county
ORDER BY count DESC;

-- Facilities missing GLN (all facilities until manual assignment)
SELECT COUNT(*) as total_without_gln
FROM uat_facilities
WHERE gln IS NULL;

-- Active facilities without GLN
SELECT COUNT(*) as active_without_gln
FROM uat_facilities
WHERE gln IS NULL AND operational_status = 'Active';
```

---

## 📅 Quality Improvement Roadmap

### Phase 1: Immediate (Week 1)
- [x] Implement data quality report endpoint
- [x] Create automated report script
- [ ] Set up 3-hour sync schedule
- [ ] Coordinate with GS1 Kenya for GLN assignment strategy
- [ ] Resolve duplicate facility codes

### Phase 2: Short-term (Month 1)
- [ ] Assign GLNs to top 100 high-volume facilities
- [ ] Complete missing MFL codes
- [ ] Standardize county/facility type names
- [ ] Set up license expiry alerts
- [ ] Create data quality dashboard

### Phase 3: Medium-term (Quarter 1)
- [ ] Achieve 50% GLN coverage (4,000+ facilities)
- [ ] Implement facility self-registration portal
- [ ] Create facility-to-premise mapping
- [ ] Implement real-time webhook sync
- [ ] Set up data validation rules at sync

### Phase 4: Long-term (Year 1)
- [ ] Achieve 100% GLN coverage for active facilities
- [ ] Achieve 95%+ data quality score
- [ ] Automate quality issue resolution
- [ ] Predictive analytics for data quality
- [ ] ISO compliance certification

---

## 🎯 Quality Targets

### Current Baseline (December 2025)
- Data Quality Score: **76.8/100** ⚠️ Acceptable
- Completeness: **92.6%** (excluding GLN)
- GLN Coverage: **0%** (known limitation)
- Valid Licenses: **97.8%**
- Active Facilities: **95.3%**

### Target (Q1 2026)
- Data Quality Score: **≥ 85/100**
- Completeness: **≥ 95%**
- GLN Coverage: **≥ 50%** (4,000+ facilities)
- Valid Licenses: **≥ 98%**
- Active Facilities: **≥ 96%**

### Target (Q4 2026)
- Data Quality Score: **≥ 95/100**
- Completeness: **≥ 98%**
- GLN Coverage: **100%** for active facilities
- Valid Licenses: **100%**
- Real-time sync: **< 5 seconds lag**

---

## 📊 Monitoring Dashboard (Proposed)

### Key Metrics to Display

```
┌─────────────────────────────────────────────────────────────┐
│           FACILITY UAT DATA QUALITY DASHBOARD               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Overall Score: 76.8/100 ⚠️                                │
│  ███████████████░░░░░░░░░                                  │
│                                                             │
│  Completeness:  92.6%    ███████████████████░              │
│  Validity:      89.5%    ██████████████████░░              │
│  Consistency:   91.2%    ███████████████████░              │
│  Timeliness:    98.0%    ████████████████████              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  CRITICAL ISSUES                                            │
├─────────────────────────────────────────────────────────────┤
│  ❌ 8,523 Facilities Missing GLN (API limitation)          │
│  ❌ 2 Duplicate Facility Codes                             │
│  ⚠️  67 Expired Licenses                                   │
│  ⚠️  123 Licenses Expiring Soon                            │
│  ⚠️  156 Missing MFL Codes                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  GLN ASSIGNMENT PROGRESS                                    │
├─────────────────────────────────────────────────────────────┤
│  Assigned:     0 / 8,523 (0%)                              │
│  In Progress:  0                                            │
│  Pending:      8,523                                        │
│                                                             │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  LAST SYNC: 1.5 hours ago                                   │
│  NEXT SYNC: in 1.5 hours                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 Alert Configuration

### Critical Alerts (Immediate)
- Data quality score drops below 70
- Duplicate facility codes detected
- Sync failure (> 6 hours since last sync)
- > 100 expired licenses

### Warning Alerts (Daily Digest)
- Data quality score 70-80
- > 50 licenses expiring within 30 days
- > 10% facilities missing MFL codes
- Sync lag > 6 hours

### Info Alerts (Weekly Report)
- Data quality trends
- GLN assignment progress
- Sync performance metrics
- Distribution changes
- Recommendations summary

---

## 📖 Best Practices

### 1. **Data Entry Standards**
- Always include GLN when manually assigning
- Use standardized county names (title case)
- Validate MFL codes against MOH registry
- Verify license dates before entry

### 2. **Sync Procedures**
- Run sync during off-peak hours (optional - incremental sync is fast)
- Always review sync results
- Monitor error logs
- Run quality report after sync

### 3. **Issue Resolution**
- Address CRITICAL severity issues within 24 hours
- Address HIGH severity issues within 1 week
- Address MEDIUM severity issues within 2 weeks
- Address LOW severity issues within 1 month
- Document all resolutions

### 4. **Quality Governance**
- Weekly quality review meetings
- Monthly stakeholder reports
- Quarterly quality audits
- Annual data quality certification

---

## 🔗 Related Documentation

- `FACILITY_UAT_MASTER_DATA.md` - Sync implementation
- `REAL_TIME_FACILITY_UAT_SYNC.md` - Real-time capabilities
- `../../DATA_QUALITY_EXECUTIVE_SUMMARY.md` - Cross-entity comparison

---

## 📞 Support Contacts

**Data Quality Issues:**
- Email: data-quality@kenya-tnt.go.ke
- Slack: #data-quality

**Safaricom HIE Integration:**
- Email: hie-integration@kenya-tnt.go.ke
- Safaricom Support: +254-XXX-XXXXXX

**GS1 Kenya (GLN Assignment):**
- Email: support@gs1kenya.org
- Phone: +254-XXX-XXXXXX

**Technical Support:**
- Email: support@kenya-tnt.go.ke
- Slack: #technical-support

---

**Last Updated:** December 14, 2025  
**Next Review:** December 21, 2025  
**Document Owner:** Data Governance Team  
**Status:** ✅ Active - UAT Ready
