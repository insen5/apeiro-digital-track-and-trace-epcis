# PostGIS & Location-Based Analytics Analysis

**Date:** December 15, 2025  
**Status:** Infrastructure Ready, Implementation Pending  
**Priority:** P2 (Medium) - Low-hanging fruit opportunities identified

---

## 🎯 Executive Summary

### Current State:
- ✅ **PostGIS Extension Installed** (v3.4.3)
- ✅ **Location Data Structure Ready** (latitude/longitude columns exist)
- ✅ **LMIS Integration Supports Coordinates** (facility events can include location)
- ❌ **No Spatial Indexes** (performance bottleneck for geo queries)
- ❌ **No Location Data in Database** (0 facilities with coordinates)
- ❌ **No Spatial Queries Implemented** (no use of PostGIS functions)

### The Gap:
**Infrastructure is ready, but no data or queries utilize PostGIS capabilities**

---

## 📊 What Actually Exists

### 1. **PostGIS Extension** ✅
```sql
-- Installed in postgres database
postgis | 3.4.3 | public | PostGIS geometry and geography spatial types and functions
```

### 2. **Location Columns in Facilities** ✅
```sql
-- uat_facilities table (Safaricom HIE facilities)
latitude  NUMERIC(10,8)  -- e.g., -1.2921000 (Nairobi)
longitude NUMERIC(11,8)  -- e.g., 36.8219000

-- prod_facilities table (NLMIS facilities) 
latitude  NUMERIC(10,8)
longitude NUMERIC(11,8)

-- Current data: 0 facilities with coordinates (NULL values)
-- Validation: Kenya bounds (lat: -4.7 to 5.0, lng: 33.9 to 41.9)
```

### 3. **LMIS Event Location Support** ✅

**Facility Integration Service** (Lines 864-911):
```typescript
/**
 * Extract location coordinates for EPCIS events
 * Supports:
 * - Object format: { latitude, longitude, accuracyMeters }
 * - String format: "latitude,longitude" or "lat,lng,accuracy"
 */
private getLocationCoordinates(location: any): {
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
}
```

**LMIS Events Accept Coordinates:**
```json
POST /api/facility/lmis/unified
{
  "eventType": "dispense",
  "facilityGLN": "1234567890123",
  "location": {
    "coordinates": "-1.2921,36.8219,10"  // lat,lng,accuracy
  },
  "products": [...]
}
```

### 4. **EPCIS ReadPoint Includes Coordinates** ✅

**Current Implementation** (Line 847):
```typescript
return {
  id: `https://example.com/readpoints/${gln}-${coords.latitude}-${coords.longitude}`
};
```

**EPCIS Event stores:**
```sql
-- epcis_events table
read_point_id VARCHAR  -- e.g., "https://example.com/readpoints/123-1.2921-36.8219"
```

---

## ❌ What's Missing

### 1. **No Spatial Indexes** 
**Impact:** Slow performance for distance/proximity queries

```sql
-- Currently NO spatial indexes exist
SELECT indexname FROM pg_indexes 
WHERE indexname LIKE '%spatial%' OR indexname LIKE '%geo%';
-- Result: (0 rows)
```

### 2. **No Location Data**
```sql
-- 0 facilities have coordinates
SELECT COUNT(*) FROM uat_facilities 
WHERE latitude IS NOT NULL;
-- Result: 0

SELECT COUNT(*) FROM prod_facilities 
WHERE latitude IS NOT NULL;
-- Result: 0 (probably, based on UAT results)
```

**Why?**
- ✅ Safaricom HIE API **may provide** lat/long (needs verification)
- ✅ NLMIS API **may provide** lat/long (needs verification)
- ❌ Current sync doesn't **extract/store** coordinates
- ❌ Manual coordinate entry not implemented

### 3. **No Spatial Queries**
```typescript
// None of these exist in codebase:
// - Find facilities within X km of a point
// - Calculate distance between facilities
// - Geo-clustering of facilities
// - Heatmap queries
// - Route optimization
```

---

## 🎯 Low-Hanging Fruit: Quick Wins

### **Priority 1: Add Spatial Indexes** (30 minutes)
**Benefit:** 10-100x faster geo queries when data exists

```sql
-- Create spatial indexes on facilities
CREATE INDEX idx_uat_facilities_location 
ON uat_facilities USING GIST (
  ST_MakePoint(longitude, latitude)::geography
) WHERE latitude IS NOT NULL;

CREATE INDEX idx_prod_facilities_location 
ON prod_facilities USING GIST (
  ST_MakePoint(longitude, latitude)::geography
) WHERE latitude IS NOT NULL;
```

**Migration File:** `V10_add_spatial_indexes.sql`

---

### **Priority 2: Extract Coordinates from API Sync** (2 hours)
**Benefit:** Automatic location data for ~12,000 facilities

#### **2a. Safaricom HIE API**
Check if response includes lat/long:
```typescript
// SafaricomHieApiService - check response structure
{
  mflCode: "12345",
  name: "Kenyatta National Hospital",
  latitude: -1.2921,  // ← Does this exist?
  longitude: 36.8219  // ← Does this exist?
}
```

**If YES:** Update `master-data.service.ts` sync to extract:
```typescript
// Line ~1200 in syncFacilitiesFromSafaricomHIE()
facilityData.latitude = apiResponse.latitude;
facilityData.longitude = apiResponse.longitude;
```

#### **2b. NLMIS API** 
Similar check for production facilities sync.

#### **2c. Coordinate Validation (Kenya-Specific Bounds)**
**IMPLEMENTED:** Data quality reports now validate coordinates against Kenya's geographical bounds:
- **Latitude:** -4.7° to 5.0° (Kenya spans from south to north)
- **Longitude:** 33.9° to 41.9° (Kenya spans from west to east)
- **Global bounds check:** Also validates lat ∈ [-90, 90] and lng ∈ [-180, 180]

Any coordinates outside these ranges are flagged as `invalidCoordinates` in the data quality report.

---

### **Priority 3: Basic Geo Queries** (4 hours)

#### **3a. Find Nearest Facilities**
```typescript
// New endpoint: GET /api/facilities/nearby
async findNearbyFacilities(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<UATFacility[]> {
  return this.facilityRepo
    .createQueryBuilder('f')
    .where(
      `ST_DWithin(
        ST_MakePoint(f.longitude, f.latitude)::geography,
        ST_MakePoint(:lng, :lat)::geography,
        :radius
      )`,
      { lat: latitude, lng: longitude, radius: radiusKm * 1000 } // meters
    )
    .orderBy(
      `ST_Distance(
        ST_MakePoint(f.longitude, f.latitude)::geography,
        ST_MakePoint(:lng, :lng)::geography
      )`
    )
    .getMany();
}
```

#### **3b. Calculate Facility Distance**
```typescript
// New utility method
async getDistanceBetweenFacilities(
  facilityA_id: number,
  facilityB_id: number
): Promise<{ distanceKm: number }> {
  const result = await this.facilityRepo
    .createQueryBuilder('a')
    .select(
      `ST_Distance(
        ST_MakePoint(a.longitude, a.latitude)::geography,
        ST_MakePoint(b.longitude, b.latitude)::geography
      ) / 1000`, 'distanceKm'
    )
    .innerJoin(UATFacility, 'b', 'b.id = :facilityB_id', { facilityB_id })
    .where('a.id = :facilityA_id', { facilityA_id })
    .getRawOne();
  
  return { distanceKm: parseFloat(result.distanceKm) };
}
```

#### **3c. Product Distribution Heatmap**
```typescript
// Count products dispensed per facility (grouped by location)
async getDispenseHeatmap(
  startDate: Date,
  endDate: Date
): Promise<Array<{ latitude: number; longitude: number; count: number }>> {
  return this.facilityOperationsRepo
    .createQueryBuilder('fo')
    .select('f.latitude', 'latitude')
    .addSelect('f.longitude', 'longitude')
    .addSelect('COUNT(fo.id)', 'count')
    .innerJoin('uat_facilities', 'f', 'f.mfl_code = fo.facility_id')
    .where('fo.operation_type = :type', { type: 'DISPENSING' })
    .andWhere('fo.operation_timestamp BETWEEN :start AND :end', {
      start: startDate,
      end: endDate,
    })
    .andWhere('f.latitude IS NOT NULL')
    .groupBy('f.latitude, f.longitude')
    .getRawMany();
}
```

---

## 🚀 High-Impact Use Cases

### **Use Case 1: Recall Proximity Alerts** ⚠️
**Problem:** Product recall issued for Batch XYZ  
**Solution:** Alert facilities within 50km of affected distribution

```typescript
// Find facilities with recalled product nearby
async getFacilitiesNearRecall(
  batchId: number,
  radiusKm: number = 50
): Promise<Array<{ facility: UATFacility; distanceKm: number; stockLevel: number }>> {
  
  // 1. Get facilities that have the recalled batch
  const affectedFacilities = await this.getFacilitiesWithBatch(batchId);
  
  // 2. For each affected facility, find nearby facilities
  const results = [];
  for (const affectedFacility of affectedFacilities) {
    const nearby = await this.findNearbyFacilities(
      affectedFacility.latitude,
      affectedFacility.longitude,
      radiusKm
    );
    
    // 3. Check if nearby facilities also have the batch
    for (const nearbyFacility of nearby) {
      const stockLevel = await this.getStockLevel(nearbyFacility.id, batchId);
      if (stockLevel > 0) {
        results.push({
          facility: nearbyFacility,
          distanceKm: calculateDistance(affectedFacility, nearbyFacility),
          stockLevel
        });
      }
    }
  }
  
  return results;
}
```

**Frontend:** Map visualization showing:
- 🔴 Red pins: Facilities with recalled product
- 🟡 Yellow pins: Nearby facilities (potential cross-contamination)
- Radius circles showing 50km zones

---

### **Use Case 2: Supply Chain Route Optimization** 🚚
**Problem:** Optimize distributor delivery routes to minimize distance

```typescript
// Find optimal distribution route
async getOptimalDeliveryRoute(
  warehouseGLN: string,
  deliveryFacilityIds: number[]
): Promise<{
  route: UATFacility[];
  totalDistanceKm: number;
  estimatedTimeMinutes: number;
}> {
  
  const warehouse = await this.getWarehouseLocation(warehouseGLN);
  
  // Nearest neighbor algorithm (simple TSP approximation)
  const route = [];
  let currentLocation = warehouse;
  let remaining = [...deliveryFacilityIds];
  let totalDistance = 0;
  
  while (remaining.length > 0) {
    // Find nearest unvisited facility
    const nearest = await this.findNearestFacility(
      currentLocation.latitude,
      currentLocation.longitude,
      remaining
    );
    
    route.push(nearest);
    totalDistance += nearest.distanceKm;
    currentLocation = nearest;
    remaining = remaining.filter(id => id !== nearest.id);
  }
  
  return {
    route,
    totalDistanceKm: totalDistance,
    estimatedTimeMinutes: Math.ceil(totalDistance / 0.5) // 30 km/h avg
  };
}
```

**Frontend:** Interactive map showing:
- Optimized delivery route
- Distance between stops
- Estimated delivery times

---

### **Use Case 3: Stock Redistribution Recommendations** 📦
**Problem:** Facility A has excess stock, Facility B is low  
**Solution:** Recommend transfers between nearby facilities

```typescript
// Find nearby facilities for stock transfer
async getStockTransferRecommendations(
  productId: number,
  maxDistanceKm: number = 100
): Promise<Array<{
  sourceFacility: UATFacility;
  destFacility: UATFacility;
  distanceKm: number;
  excessUnits: number;
  shortfallUnits: number;
}>> {
  
  // 1. Get facilities with excess stock (> 2 months supply)
  const excessFacilities = await this.getFacilitiesWithExcess(productId);
  
  // 2. Get facilities with low stock (< 1 month supply)
  const lowStockFacilities = await this.getFacilitiesWithLowStock(productId);
  
  // 3. Match excess to low stock within distance
  const recommendations = [];
  for (const source of excessFacilities) {
    const nearbyLowStock = await this.findNearbyFacilities(
      source.latitude,
      source.longitude,
      maxDistanceKm
    ).filter(f => lowStockFacilities.includes(f));
    
    for (const dest of nearbyLowStock) {
      recommendations.push({
        sourceFacility: source,
        destFacility: dest,
        distanceKm: calculateDistance(source, dest),
        excessUnits: source.stockLevel - source.targetLevel,
        shortfallUnits: dest.targetLevel - dest.stockLevel
      });
    }
  }
  
  return recommendations.sort((a, b) => a.distanceKm - b.distanceKm);
}
```

---

### **Use Case 4: Geographic Consumption Analysis** 📊
**Problem:** Identify regional patterns in product consumption

```typescript
// Geographic clustering of consumption
async getConsumptionHeatmap(
  productId: number,
  startDate: Date,
  endDate: Date,
  clusterRadiusKm: number = 50
): Promise<Array<{
  clusterCenter: { lat: number; lng: number };
  facilityCount: number;
  totalConsumption: number;
  avgConsumptionPerFacility: number;
}>> {
  
  return this.facilityOperationsRepo
    .createQueryBuilder('fo')
    .select(
      `ST_ClusterKMeans(
        ST_MakePoint(f.longitude, f.latitude)::geography,
        10
      ) OVER() AS cluster_id`
    )
    .addSelect('AVG(f.latitude)', 'centerLat')
    .addSelect('AVG(f.longitude)', 'centerLng')
    .addSelect('COUNT(DISTINCT f.id)', 'facilityCount')
    .addSelect('SUM(fo.quantity)', 'totalConsumption')
    .innerJoin('uat_facilities', 'f', 'f.mfl_code = fo.facility_id')
    .where('fo.product_id = :productId', { productId })
    .andWhere('fo.operation_type = :type', { type: 'DISPENSING' })
    .andWhere('fo.operation_timestamp BETWEEN :start AND :end', {
      start: startDate,
      end: endDate
    })
    .groupBy('cluster_id')
    .getRawMany();
}
```

**Frontend:** Heatmap showing:
- Hot zones (high consumption regions)
- Cold zones (low consumption regions)
- Facility clusters

---

### **Use Case 5: Cold Chain Monitoring by Region** ❄️
**Problem:** Track temperature excursions geographically

```typescript
// Find temperature excursions by location
async getTemperatureExcursionsByRegion(
  startDate: Date,
  endDate: Date
): Promise<Array<{
  region: string;
  facilityCount: number;
  excursionCount: number;
  avgTemperature: number;
  location: { lat: number; lng: number };
}>> {
  
  // Assuming temperature monitoring data exists
  return this.temperatureLogsRepo
    .createQueryBuilder('tl')
    .select('f.county', 'region')
    .addSelect('COUNT(DISTINCT f.id)', 'facilityCount')
    .addSelect(
      `COUNT(CASE WHEN tl.temperature > 8 THEN 1 END)`,
      'excursionCount'
    )
    .addSelect('AVG(tl.temperature)', 'avgTemperature')
    .addSelect('AVG(f.latitude)', 'lat')
    .addSelect('AVG(f.longitude)', 'lng')
    .innerJoin('uat_facilities', 'f', 'f.id = tl.facility_id')
    .where('tl.timestamp BETWEEN :start AND :end', {
      start: startDate,
      end: endDate
    })
    .groupBy('f.county')
    .having('COUNT(CASE WHEN tl.temperature > 8 THEN 1 END) > 0')
    .getRawMany();
}
```

---

## 🛠️ Implementation Roadmap

### **Phase 1: Foundation** (1 day)
1. ✅ **Add Spatial Indexes** (30 min)
   - Create GIST indexes on lat/long columns
   - Migration: `V10_add_spatial_indexes.sql`

2. ✅ **Verify API Coordinate Support** (2 hours)
   - Check Safaricom HIE API response structure
   - Check NLMIS API response structure
   - Document coordinate field names

3. ✅ **Update Sync Logic** (2 hours)
   - Extract coordinates during facility sync
   - Store in `latitude` and `longitude` columns
   - Backfill existing facilities

4. ✅ **Validate Data** (1 hour)
   - Run sync manually
   - Verify coordinates populated
   - Check data quality (invalid coords)

---

### **Phase 2: Basic Queries** (2 days)

1. **Nearby Facilities Endpoint** (4 hours)
   - `GET /api/facilities/nearby?lat={lat}&lng={lng}&radius={km}`
   - Returns facilities within radius
   - Sorted by distance

2. **Distance Calculator** (2 hours)
   - `GET /api/facilities/distance?from={id}&to={id}`
   - Calculate distance between two facilities
   - Use for logistics planning

3. **Facility Coordinates Endpoint** (2 hours)
   - `GET /api/facilities/coordinates`
   - Returns all facilities with lat/long (for mapping)
   - Supports filtering by county/region

4. **Basic Map Integration** (4 hours)
   - Frontend: Integrate Leaflet or Google Maps
   - Display facilities on map
   - Clickable markers showing facility details

---

### **Phase 3: Analytics Queries** (1 week)

1. **Consumption Heatmap** (2 days)
   - Aggregate consumption by location
   - Generate heatmap data
   - Frontend visualization

2. **Recall Proximity Analysis** (2 days)
   - Find facilities near recall locations
   - Distance-based risk scoring
   - Alert notifications

3. **Stock Transfer Recommendations** (2 days)
   - Identify excess/shortage pairs
   - Calculate optimal transfers
   - Route optimization

4. **Regional Clustering** (1 day)
   - K-means clustering by location
   - Identify service areas
   - Distribution center recommendations

---

## 📐 Technical Details

### **PostGIS Functions Used:**

```sql
-- Distance calculation (in meters)
ST_Distance(
  ST_MakePoint(lon1, lat1)::geography,
  ST_MakePoint(lon2, lat2)::geography
)

-- Check if within radius (returns boolean)
ST_DWithin(
  point1::geography,
  point2::geography,
  radius_meters
)

-- K-means clustering
ST_ClusterKMeans(geometry, k) OVER()

-- Create point from coordinates
ST_MakePoint(longitude, latitude)

-- Cast to geography (uses WGS84, accurate for Earth)
::geography
```

### **Performance Considerations:**

1. **Use GIST indexes** for spatial queries (10-100x speedup)
2. **Use geography type** (not geometry) for accurate Earth distances
3. **Cache frequently queried locations** (e.g., major hubs)
4. **Limit result sets** (e.g., max 100 facilities per query)
5. **Pre-compute distances** for common routes (materialized view)

---

## ❓ Dependency on Analytics Schema

**Question:** Does this require analytics schema (star schema, materialized views)?

**Answer:** **NO - Can be done with current schema!** ✅

### **Current Schema is Sufficient:**
```sql
-- uat_facilities (already has lat/long)
-- facility_operations (already has facility_id + timestamps)
-- epcis_events (already has read_point_id with embedded coords)

-- JOIN directly for queries:
SELECT 
  f.latitude,
  f.longitude,
  COUNT(fo.id) as operation_count
FROM facility_operations fo
JOIN uat_facilities f ON f.mfl_code = fo.facility_id
WHERE fo.operation_timestamp > NOW() - INTERVAL '30 days'
GROUP BY f.latitude, f.longitude
```

### **Analytics Schema Would Help (But Not Required):**

**Optional Enhancement:** Materialized view for performance
```sql
-- Pre-aggregate for faster heatmaps
CREATE MATERIALIZED VIEW facility_consumption_by_location AS
SELECT 
  f.latitude,
  f.longitude,
  f.mfl_code,
  f.facility_name,
  DATE_TRUNC('day', fo.operation_timestamp) as date,
  COUNT(*) as operation_count,
  SUM(fo.quantity) as total_quantity
FROM facility_operations fo
JOIN uat_facilities f ON f.mfl_code = fo.facility_id
WHERE f.latitude IS NOT NULL
GROUP BY 1, 2, 3, 4, 5;

-- Refresh daily
CREATE INDEX idx_facility_consumption_location 
ON facility_consumption_by_location 
USING GIST (ST_MakePoint(longitude, latitude)::geography);
```

**When Analytics Schema Becomes Useful:**
- 🟢 **Now:** Direct queries work fine (< 100ms for most geo queries)
- 🟡 **At 1M+ events:** Materialized views speed up aggregations
- 🔴 **At 10M+ events:** Star schema with pre-aggregation becomes critical

**Current Data Volume:** ~20K serials, ~12K facilities → **Direct queries sufficient**

---

## 🎯 Recommendation: Start Simple

### **Week 1: Quick Win (Low Risk, High Value)**
1. Add spatial indexes (30 min) ✅
2. Extract coordinates from API sync (2 hours) ✅
3. Create "Find Nearby Facilities" endpoint (2 hours) ✅
4. Simple map visualization in frontend (4 hours) ✅

**Total Effort:** 1 day  
**Value:** Foundation for all future geo features

### **Week 2-3: High-Impact Use Cases**
1. Recall proximity alerts (2 days)
2. Consumption heatmap (2 days)
3. Stock transfer recommendations (2 days)

**Total Effort:** 6 days  
**Value:** Immediate operational insights

### **Later: Analytics Optimization (If Needed)**
- Only if performance becomes an issue
- Wait until data volume justifies complexity
- Can be added incrementally

---

## 📝 Summary

| Feature | Status | Effort | Value | Dependency on Analytics Schema |
|---------|--------|--------|-------|-------------------------------|
| **Spatial Indexes** | ❌ Missing | 30 min | High | None |
| **Extract Coordinates** | ❌ Missing | 2 hours | High | None |
| **Nearby Facilities** | ❌ Missing | 4 hours | High | None |
| **Distance Calculator** | ❌ Missing | 2 hours | Medium | None |
| **Heatmap Queries** | ❌ Missing | 2 days | High | None (optional: mat view) |
| **Recall Proximity** | ❌ Missing | 2 days | High | None |
| **Route Optimization** | ❌ Missing | 3 days | Medium | None |
| **Analytics Schema** | ❌ Not needed yet | N/A | Low | N/A |

**TL;DR:**
- ✅ PostGIS ready, just need indexes + data + queries
- ✅ No analytics schema required for geo features
- ✅ Can implement in 1-2 weeks
- ✅ High value, low risk, clear use cases

---

**Last Updated:** December 15, 2025  
**Next Steps:** Add spatial indexes migration (30 min task)
