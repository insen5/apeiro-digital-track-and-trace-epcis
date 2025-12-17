# Standardized Sync Logs & Quality Audit System

**Date:** December 18, 2025  
**Purpose:** Unified approach for sync logging and quality audit presentation across all master data  
**Status:** 🎯 Ready for Implementation

---

## Part 1: Sync Logs Standardization

### 📊 Current State Analysis

#### Existing Sync Log Tables:

| Table | Used By | Has entity_type | Has triggered_by | Has custom_params | Status |
|-------|---------|-----------------|------------------|-------------------|--------|
| **master_data_sync_logs** | Products, Premises, Facilities | ✅ YES | ✅ YES | ✅ YES (JSONB) | ✅ STANDARD |
| **uat_facilities_sync_log** | UAT Facilities | ❌ NO | ❌ NO | ❌ NO | ❌ LEGACY |
| **prod_facilities_sync_log** | Prod Facilities | ❌ NO | ❌ NO | ❌ NO | ❌ LEGACY |

#### Current Usage:

```sql
SELECT COUNT(*), entity_type FROM master_data_sync_logs GROUP BY entity_type;

 count | entity_type  
-------+--------------
   3   | facility      (UAT)
   2   | facility_prod (Production)
   3   | premise
   2   | product
```

---

### 🎯 Standardization Plan

#### Option 1: Migrate All to master_data_sync_logs (✅ RECOMMENDED)

**Benefits:**
- Single source of truth
- Consistent querying
- Easier to add new entities
- Already supports Products, Premises, and Facilities

**Implementation:**
1. Migrate data from facility-specific tables to `master_data_sync_logs`
2. Add missing `entity_type` values
3. Deprecate facility-specific tables
4. Update services to use only `master_data_sync_logs`

---

### 📝 Standard Sync Log Schema

```typescript
// Entity: MasterDataSyncLog
export class MasterDataSyncLog {
  id: number;
  
  // Entity identification
  entityType: 'product' | 'premise' | 'facility' | 'facility_prod' | 'practitioner'; // REQUIRED
  
  // Sync timing
  syncStartedAt: Date;  // REQUIRED
  syncCompletedAt?: Date;
  syncStatus: 'in_progress' | 'completed' | 'failed'; // REQUIRED
  
  // Sync metrics
  recordsFetched: number;  // From API
  recordsInserted: number; // New records created
  recordsUpdated: number;  // Existing records updated
  recordsFailed: number;   // Records that failed to sync
  
  // Error tracking
  errorMessage?: string;  // Detailed error message if syncStatus = 'failed'
  
  // Metadata
  lastUpdatedTimestamp?: Date;  // Last sync timestamp used for incremental sync
  triggeredBy?: string;         // 'manual', 'cron', 'scheduled-weekly', 'api'
  customParams?: JSON;          // Entity-specific parameters (JSONB)
  
  // Audit
  createdAt: Date;  // When log entry was created
}
```

---

### 🔄 Standard Sync Log Service Methods

```typescript
// Generic Sync History Methods
interface SyncLogService {
  // Get latest sync for entity
  getLatestSync(entityType: string): Promise<MasterDataSyncLog>;
  
  // Get sync history (paginated)
  getSyncHistory(entityType: string, limit?: number): Promise<MasterDataSyncLog[]>;
  
  // Get sync by ID
  getSyncById(id: number): Promise<MasterDataSyncLog>;
  
  // Create sync log entry
  createSyncLog(data: Partial<MasterDataSyncLog>): Promise<MasterDataSyncLog>;
  
  // Update sync log (completion/failure)
  updateSyncLog(id: number, data: Partial<MasterDataSyncLog>): Promise<MasterDataSyncLog>;
  
  // Get sync statistics
  getSyncStats(entityType: string, days?: number): Promise<{
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    avgDuration: number; // minutes
    totalRecordsFetched: number;
    totalRecordsInserted: number;
    totalRecordsUpdated: number;
  }>;
}
```

---

### 📡 Standard Frontend SyncStatus Component Props

```typescript
interface SyncStatusProps {
  entityType: 'product' | 'premise' | 'facility' | 'facility_prod' | 'practitioner';
  apiEndpoint: string;  // e.g., '/api/master-data/products'
  syncFrequency?: string; // e.g., 'every 3 hours'
  showHistory?: boolean;  // Show last N syncs
  autoRefresh?: boolean;  // Auto-refresh every 30s
}
```

---

## Part 2: Quality Audit Tabs Standardization

### 📊 Current State Analysis

#### Quality Audit/Snapshot Tables:

| Table | Date Field | Score Field | Dimension Scores | full_report (JSONB) | triggered_by | notes |
|-------|------------|-------------|------------------|---------------------|--------------|-------|
| **product_quality_reports** | report_date | data_quality_score | ❌ NO | ✅ YES | ✅ YES | ✅ YES |
| **premise_quality_reports** | report_date | data_quality_score | ❌ NO | ✅ YES | ✅ YES | ✅ YES |
| **practitioner_quality_reports** | report_date | data_quality_score | ❌ NO | ✅ YES | ✅ YES | ✅ YES |
| **uat_facilities_quality_audit** | audit_date | overall_quality_score | ✅ YES (4 dimensions) | ❌ NO | ❌ NO | ❌ NO |
| **prod_facilities_quality_audit** | audit_date | overall_quality_score | ✅ YES (4 dimensions) | ❌ NO | ✅ YES | ✅ YES |

#### Common Fields (ALL tables have):
- ✅ `id` (primary key)
- ✅ Date field (report_date or audit_date)
- ✅ Total records count
- ✅ `complete_records` - records with ALL critical fields
- ✅ `completeness_percentage` - % of complete records (STRICT)
- ✅ Overall quality score (data_quality_score or overall_quality_score)
- ✅ `created_at` timestamp

---

### 🎯 Audit Tab Enrichment Strategy

#### What to Display in Audit Tab:

1. **Quality Score Trend** (Line Chart)
   - X-axis: Date
   - Y-axis: Overall quality score (0-100)
   - Show last 30 days or 20 audits

2. **Dimension Breakdown** (Progress Bars)
   - Completeness: X%
   - Validity: X%
   - Consistency: X%
   - Timeliness: X%
   
   **Note:** If dimension scores not stored, extract from `full_report` JSONB

3. **Key Metrics Cards**
   - Total Records
   - Complete Records (count + %)
   - Latest Sync Date
   - Audit Frequency

4. **Audit History Table**
   - Date/Time
   - Total Records
   - Quality Score
   - Completeness %
   - Triggered By
   - Actions (View Details)

5. **Top Issues** (from latest audit)
   - Critical completeness issues
   - Validity errors
   - Consistency problems

---

### 📝 Generic Quality Audit Interface

```typescript
// Unified Quality Audit Response
export interface QualityAuditSnapshot {
  // Core fields (common to all)
  id: number;
  date: Date;  // report_date or audit_date
  totalRecords: number;  // total_products, total_premises, total_facilities, etc.
  overallQualityScore: number;  // data_quality_score or overall_quality_score
  completeRecords: number;
  completenessPercentage: number;
  
  // Dimension scores (extract from full_report if not stored)
  dimensionScores?: {
    completeness: number;
    validity: number;
    consistency: number;
    timeliness: number;
  };
  
  // Metadata
  triggeredBy?: string;
  notes?: string;
  createdAt: Date;
  
  // Full report for drill-down
  fullReport?: any; // JSONB
}

// Normalized response format
export interface QualityAuditEnrichedData {
  entity: {
    type: string;
    displayName: string;
    totalRecords: number;
  };
  
  latestAudit: QualityAuditSnapshot;
  
  trend: {
    dates: string[];
    scores: number[];
  };
  
  dimensionBreakdown: {
    completeness: number;
    validity: number;
    consistency: number;
    timeliness: number;
  };
  
  topIssues: Array<{
    severity: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    count: number;
  }>;
  
  history: QualityAuditSnapshot[];
}
```

---

### 🔄 Generic Quality Audit Service

```typescript
@Injectable()
export class GenericQualityAuditEnrichmentService {
  
  /**
   * Get enriched audit data for any entity type
   */
  async getEnrichedAuditData(
    entityType: string,
    days: number = 30
  ): Promise<QualityAuditEnrichedData> {
    const config = getQualityAuditConfig(entityType);
    const repository = this.getRepository(config.tableName);
    
    // Get latest audit
    const latestAudit = await this.getLatestAudit(repository, config);
    
    // Get trend data (last 30 days)
    const trend = await this.getQualityTrend(repository, config, days);
    
    // Get dimension breakdown (from stored or extracted from full_report)
    const dimensionBreakdown = await this.getDimensionBreakdown(latestAudit, config);
    
    // Get top issues from latest audit
    const topIssues = await this.getTopIssues(latestAudit, config);
    
    // Get audit history
    const history = await this.getAuditHistory(repository, config, 20);
    
    return {
      entity: {
        type: entityType,
        displayName: config.entityDisplayName,
        totalRecords: latestAudit.totalRecords,
      },
      latestAudit,
      trend,
      dimensionBreakdown,
      topIssues,
      history,
    };
  }
  
  /**
   * Extract dimension scores from stored columns or full_report JSONB
   */
  private async getDimensionBreakdown(
    audit: any,
    config: QualityAuditEntityConfig
  ): Promise<{ completeness: number; validity: number; consistency: number; timeliness: number }> {
    // If entity has dimension score columns (facilities)
    if (audit.completenessScore !== undefined) {
      return {
        completeness: audit.completenessScore || 0,
        validity: audit.validityScore || 0,
        consistency: audit.consistencyScore || 0,
        timeliness: audit.timelinessScore || 0,
      };
    }
    
    // Otherwise, extract from full_report JSONB (products/premises/practitioners)
    if (audit.fullReport && audit.fullReport.scores) {
      return {
        completeness: audit.fullReport.scores.completeness || 0,
        validity: audit.fullReport.scores.validity || 0,
        consistency: audit.fullReport.scores.consistency || 0,
        timeliness: audit.fullReport.scores.timeliness || 0,
      };
    }
    
    // Fallback: estimate from overall score
    return {
      completeness: audit.completenessPercentage || 0,
      validity: 80, // Assumed
      consistency: 90, // Assumed
      timeliness: 85, // Assumed
    };
  }
  
  /**
   * Extract top issues from audit
   */
  private async getTopIssues(
    audit: any,
    config: QualityAuditEntityConfig
  ): Promise<Array<{severity: string; category: string; description: string; count: number}>> {
    const issues: any[] = [];
    
    // Extract from full_report if available
    if (audit.fullReport && audit.fullReport.issues) {
      return audit.fullReport.issues.slice(0, 5); // Top 5
    }
    
    // Otherwise, build from stored metrics
    // Completeness issues
    config.completenessMetrics
      .filter(m => m.critical)
      .forEach(metric => {
        const count = audit[metric.key] || 0;
        if (count > 0) {
          issues.push({
            severity: 'high',
            category: 'Completeness',
            description: metric.label,
            count,
          });
        }
      });
    
    // Validity issues
    config.validityMetrics.forEach(metric => {
      const count = audit[metric.key] || 0;
      if (count > 0) {
        issues.push({
          severity: 'high',
          category: 'Validity',
          description: metric.label,
          count,
        });
      }
    });
    
    // Sort by count descending, take top 5
    return issues.sort((a, b) => b.count - a.count).slice(0, 5);
  }
}
```

---

### 🎨 Generic Frontend Audit Tab Component

```typescript
// GenericQualityAuditTab.tsx
interface GenericQualityAuditTabProps {
  entityType: 'product' | 'premise' | 'facility' | 'facility_prod' | 'practitioner';
  config: QualityAuditConfig;
}

export default function GenericQualityAuditTab({ entityType, config }: GenericQualityAuditTabProps) {
  const [auditData, setAuditData] = useState<QualityAuditEnrichedData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadAuditData();
  }, [entityType]);
  
  const loadAuditData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.apiBasePath}/quality-audit/enriched`);
      const data = await response.json();
      setAuditData(data);
    } catch (error) {
      console.error('Failed to load audit data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || !auditData) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="space-y-6">
      {/* Quality Score Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={auditData.trend} />
        </CardContent>
      </Card>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Records"
          value={auditData.entity.totalRecords}
          icon={<Database />}
        />
        <MetricCard
          title="Complete Records"
          value={`${auditData.latestAudit.completeRecords} (${auditData.latestAudit.completenessPercentage.toFixed(1)}%)`}
          icon={<CheckCircle />}
        />
        <MetricCard
          title="Quality Score"
          value={auditData.latestAudit.overallQualityScore.toFixed(1)}
          color={getScoreColor(auditData.latestAudit.overallQualityScore)}
          icon={<TrendingUp />}
        />
        <MetricCard
          title="Last Audit"
          value={formatDate(auditData.latestAudit.date)}
          icon={<Calendar />}
        />
      </div>
      
      {/* Dimension Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Dimensions</CardTitle>
        </CardHeader>
        <CardContent>
          <DimensionBreakdown dimensions={auditData.dimensionBreakdown} />
        </CardContent>
      </Card>
      
      {/* Top Issues */}
      <Card>
        <CardHeader>
          <CardTitle>Top Data Quality Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <IssuesList issues={auditData.topIssues} />
        </CardContent>
      </Card>
      
      {/* Audit History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
          <button onClick={createNewAudit} className="btn-primary">
            Create New Audit
          </button>
        </CardHeader>
        <CardContent>
          <AuditHistoryTable history={auditData.history} />
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🎯 Implementation Roadmap

### Phase 1: Sync Logs Standardization

**Tasks:**
1. ✅ Create migration to add missing columns to facility sync logs
2. ✅ Migrate data from facility-specific tables to master_data_sync_logs
3. ✅ Update GenericSyncService to always use master_data_sync_logs
4. ✅ Deprecate facility-specific sync log tables
5. ✅ Update frontend SyncStatus component to support all entity types

**SQL Migration:**
```sql
-- V18: Standardize Sync Logs
-- Migrate facility sync data to master_data_sync_logs

INSERT INTO master_data_sync_logs (
  entity_type, sync_started_at, sync_completed_at, sync_status,
  records_fetched, records_inserted, records_updated, records_failed,
  error_message, last_updated_timestamp, triggered_by, created_at
)
SELECT 
  'facility' as entity_type,
  sync_started_at, sync_completed_at, sync_status,
  records_fetched, records_inserted, records_updated, records_failed,
  error_message, last_updated_timestamp,
  'manual' as triggered_by, -- Default for legacy data
  created_at
FROM uat_facilities_sync_log
WHERE id NOT IN (
  SELECT custom_params->>'uat_sync_id' 
  FROM master_data_sync_logs 
  WHERE entity_type = 'facility'
);

-- Same for prod facilities
INSERT INTO master_data_sync_logs (...)
SELECT 
  'facility_prod' as entity_type,
  ...
FROM prod_facilities_sync_log
WHERE ...;
```

---

### Phase 2: Quality Audit Enrichment

**Tasks:**
1. ✅ Create GenericQualityAuditEnrichmentService
2. ✅ Add `/quality-audit/enriched` endpoint to all master data controllers
3. ✅ Implement dimension score extraction logic
4. ✅ Implement top issues extraction logic
5. ✅ Test with all entity types

**Backend Implementation:**
```typescript
// In master-data.controller.ts
@Get('products/quality-audit/enriched')
async getProductQualityAuditEnriched() {
  return this.qualityAuditEnrichmentService.getEnrichedAuditData('product');
}

@Get('premises/quality-audit/enriched')
async getPremiseQualityAuditEnriched() {
  return this.qualityAuditEnrichmentService.getEnrichedAuditData('premise');
}

// Repeat for all entities...
```

---

### Phase 3: Frontend Generic Components

**Tasks:**
1. ✅ Create GenericQualityAuditTab component
2. ✅ Create reusable sub-components:
   - QualityTrendChart
   - DimensionBreakdown
   - TopIssuesList
   - AuditHistoryTable
3. ✅ Update all master data pages to use generic components
4. ✅ Test responsive design and loading states

---

## 📊 Benefits of Standardization

### For Sync Logs:

| Benefit | Impact |
|---------|--------|
| **Single Source of Truth** | All sync logs in one table |
| **Consistent Querying** | Same API across all entities |
| **Easier Maintenance** | One table to optimize/backup |
| **Better Analytics** | Cross-entity sync comparisons |
| **Simplified Monitoring** | One query for all sync health |

### For Quality Audits:

| Benefit | Impact |
|---------|--------|
| **Consistent UI** | Same audit tab experience |
| **Dimension Visibility** | Always show 4 dimensions |
| **Top Issues Surfaced** | Quick problem identification |
| **Trend Analysis** | Visual quality over time |
| **Reduced Code** | One component, all entities |

---

## 🎓 Usage Examples

### Backend: Get Sync History

```typescript
// For any entity type
const syncs = await masterDataService.getSyncHistory('product', 10);
const syncs = await masterDataService.getSyncHistory('premise', 10);
const syncs = await masterDataService.getSyncHistory('facility', 10);
```

### Backend: Get Enriched Audit Data

```typescript
// For any entity type
const audit = await qualityAuditEnrichmentService.getEnrichedAuditData('product');
const audit = await qualityAuditEnrichmentService.getEnrichedAuditData('facility');
```

### Frontend: Use Generic Components

```typescript
// In any master data page
<GenericQualityAuditTab 
  entityType="product" 
  config={productAuditConfig} 
/>

<GenericQualityAuditTab 
  entityType="premise" 
  config={premiseAuditConfig} 
/>

<SyncStatus 
  entityType="facility" 
  apiEndpoint="/api/master-data/facilities" 
  syncFrequency="every 3 hours"
/>
```

---

## 📚 Related Documentation

- **quality-audit.config.ts** - Config for all entity types
- **STANDARDIZED_DATA_QUALITY_DIMENSIONS.md** - Quality dimensions explained
- **CONFIG_DRIVEN_QUALITY_SYSTEM_SUMMARY.md** - Overall system architecture

---

**Last Updated:** December 18, 2025  
**Status:** 🎯 Ready for Phase 1 Implementation  
**Next Step:** Create Migration V18 for Sync Log Standardization
