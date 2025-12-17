# GS1 Identifiers Implementation Backlog

This document tracks all GS1 identifiers that should be considered for implementation in the Kenya TNT System.

## Current Implementation Status

### ✅ Implemented Identifiers

1. **SSCC** (Serial Shipping Container Code)
   - Status: ✅ Fully implemented
   - Purpose: Identifies logistic units (shipments, pallets, cases)
   - Format: 18 digits (Extension + Company Prefix + Serial Reference + Check Digit)
   - Location: `src/shared/gs1/sscc.service.ts`

2. **GLN** (Global Location Number)
   - Status: ✅ Fully implemented
   - Purpose: Identifies physical locations (warehouses, premises, facilities)
   - Format: 13 digits (Company Prefix + Location Reference + Check Digit)
   - Location: `src/shared/gs1/gln.service.ts`

3. **GTIN** (Global Trade Item Number)
   - Status: ✅ Partially implemented (validation only)
   - Purpose: Identifies products at various packaging levels
   - Format: 8, 12, 13, or 14 digits
   - Location: `src/shared/gs1/sgtin.service.ts`
   - TODO: Add full GTIN check digit validation

4. **SGTIN** (Serialized Global Trade Item Number)
   - Status: ✅ Fully implemented
   - Purpose: Identifies individual serialized product units
   - Format: `urn:epc:id:sgtin:CompanyPrefix.ItemRef.SerialNumber`
   - Location: `src/shared/gs1/sgtin.service.ts`

5. **Batch/Lot Number**
   - Status: ✅ Fully implemented
   - Purpose: Identifies production batches/lots
   - Format: Alphanumeric (GS1-compliant)
   - Location: `src/shared/gs1/batch-number.service.ts`

6. **EPCIS Events**
   - Status: ✅ Fully implemented
   - Purpose: Tracks supply chain events (AggregationEvents, ObjectEvents)
   - Standard: EPCIS 2.0
   - Location: `src/shared/gs1/epcis-event.service.ts`

7. **GCP** (Global Company Prefix) Lookup/Validation
   - Status: ✅ Fully implemented
   - Purpose: Validates and looks up company prefixes from master data
   - Format: 6-12 digits
   - Location: `src/shared/gs1/gcp.service.ts`
   - Features:
     - Format validation (6-12 digits)
     - Company lookup from suppliers and logistics_providers tables
     - Prefix extraction from GS1 identifiers (GTIN, GLN, SSCC, SGTIN)
     - In-memory caching (1 hour TTL)
     - Cache management and statistics

---

## Backlog: Identifiers to Implement

### Priority 1: High Priority (Recommended for Pharmaceutical Track & Trace)

#### 1. GRAI (Global Returnable Asset Identifier)
- **Purpose**: Identifies reusable assets (pallets, containers, returnable packaging)
- **Format**: `urn:epc:id:grai:CompanyPrefix.AssetType.SerialNumber`
- **Structure**: 
  - Company Prefix: 6-12 digits
  - Asset Type: Remaining digits (to make 12 total before check digit)
  - Serial Number: Variable length
  - Check Digit: 1 digit (for Asset Type portion)
- **Use Cases**:
  - Track reusable pallets across supply chain
  - Monitor returnable containers
  - Asset lifecycle management
- **Business Value**: Reduces asset loss, enables asset pooling, improves sustainability
- **Implementation Complexity**: Medium
- **Estimated Effort**: 2-3 days

#### 2. GDTI (Global Document Type Identifier)
- **Purpose**: Identifies documents (invoices, shipping notices, certificates, regulatory documents)
- **Format**: 14 digits (similar to GTIN-14)
- **Structure**:
  - Indicator Digit: 1 digit (0-9)
  - Company Prefix: 6-12 digits
  - Document Type: Remaining digits
  - Check Digit: 1 digit
- **Use Cases**:
  - Link shipments to shipping documents in EPCIS events
  - Track regulatory certificates (PPB licenses, import permits) with GS1-standard identifiers
  - Document version control (new versions get new GDTIs)
  - Invoice tracking across supply chain partners
  - Cross-system document reference (when partners need to reference your documents)
- **When to Use**:
  - ✅ Regulatory requirements mandate document traceability with GS1 identifiers
  - ✅ Need to share document references with external partners/systems
  - ✅ Integrating with systems that expect GS1 document identifiers
  - ✅ Need standardized document identifiers for audit trails
- **When NOT Needed**:
  - ❌ Only tracking documents internally (use internal document IDs)
  - ❌ No regulatory requirement for GS1 document identifiers
  - ❌ No partner/system integration requiring GS1 document references
- **Business Value**: Regulatory compliance, document traceability, audit trails, partner interoperability
- **Implementation Complexity**: Low-Medium
- **Estimated Effort**: 1-2 days
- **Priority Note**: Consider only if regulatory compliance or partner integration requires GS1-standard document identifiers

---

### Priority 2: Medium Priority (Useful for Advanced Features)

#### 3. GIAI (Global Individual Asset Identifier)
- **Purpose**: Identifies individual assets (equipment, devices, manufacturing tools)
- **Format**: `urn:epc:id:giai:CompanyPrefix.IndividualAssetReference`
- **Structure**:
  - Company Prefix: 6-12 digits
  - Individual Asset Reference: Variable length (up to 30 characters)
- **Use Cases**:
  - Track manufacturing equipment
  - Monitor scanning devices
  - Equipment maintenance tracking
  - Asset depreciation management
- **Business Value**: Equipment lifecycle management, maintenance scheduling
- **Implementation Complexity**: Medium
- **Estimated Effort**: 2 days

#### 4. GSRN (Global Service Relation Number)
- **Purpose**: Identifies service relationships (patient prescriptions, medical records, service agreements)
- **Format**: 18 digits
- **Structure**:
  - Company Prefix: 6-12 digits
  - Service Reference: Remaining digits
  - Check Digit: 1 digit
- **Use Cases**:
  - Link products to patient prescriptions (if patient-level tracking required)
  - Medical record tracking
  - Service agreement management
- **Business Value**: Patient safety, personalized medicine tracking
- **Implementation Complexity**: Medium-High
- **Estimated Effort**: 3-4 days
- **Note**: May require additional privacy/compliance considerations

#### 5. GCP (Global Company Prefix) Lookup/Validation Service
- **Purpose**: Validate and lookup company prefixes (NOT for prefix assignment - GS1 assigns prefixes)
- **Status**: ✅ **Fully Implemented** (2025-01-19)
- **Location**: `src/shared/gs1/gcp.service.ts`
- **What It Does**:
  - ✅ Validate company prefix format (6-12 digits)
  - ✅ Lookup partner company information from prefix (name, GLN, contact info)
  - ✅ Cache known partner prefixes locally for faster lookups (1 hour TTL)
  - ✅ Extract company prefix from GS1 identifiers (GTIN, GLN, SSCC, SGTIN)
  - ✅ Search in both suppliers and logistics_providers tables
- **What It Does NOT Do**:
  - ❌ Assign prefixes (GS1 assigns these - you cannot create new ones)
  - ❌ Manage prefix allocation (handled by GS1)
  - ❌ GEPIR integration (future enhancement - see below)
- **API Methods**:
  - `validateGCP(dto: ValidateGCPDto)` - Validate prefix format
  - `lookupGCP(dto: LookupGCPDto)` - Lookup company info from prefix
  - `extractGCPFromIdentifier(dto: ExtractGCPFromIdentifierDto)` - Extract prefix from GS1 identifier
  - `clearGCPCache()` - Clear lookup cache
  - `getGCPCacheStats()` - Get cache statistics
- **When to Use**:
  - ✅ Receiving shipments from unknown/new partners and need to verify their prefix
  - ✅ Need to lookup partner company details from a prefix
  - ✅ Regulatory requirements to validate partner prefixes
  - ✅ High volume of partner interactions requiring prefix validation
- **Future Enhancement**: GEPIR (Global Electronic Party Information Registry) integration for external validation (3-4 days effort)
- **Implementation Complexity**: Low
- **Estimated Effort**: ✅ Completed (1 day)

---

### Priority 3: Lower Priority (Advanced/Niche Use Cases)

#### 6. GINC (Global Identification Number for Consignment)
- **Purpose**: Identifies consignments (shipments from one party to another)
- **Format**: 18 digits
- **Structure**: Similar to SSCC
- **Use Cases**:
  - International shipping
  - Customs declarations
  - Multi-party consignments
- **Business Value**: International trade compliance, customs clearance
- **Implementation Complexity**: Medium
- **Estimated Effort**: 2 days
- **Note**: May overlap with SSCC functionality

#### 7. GSIN (Global Shipment Identification Number)
- **Purpose**: Identifies shipments (similar to SSCC but for different use case)
- **Format**: 18 digits
- **Structure**: Similar to SSCC
- **Use Cases**:
  - Shipment-level tracking
  - Transportation management
- **Business Value**: Alternative to SSCC for shipment identification
- **Implementation Complexity**: Low (similar to SSCC)
- **Estimated Effort**: 1 day
- **Note**: May be redundant if SSCC covers this use case

#### 8. GEPIR (Global Electronic Party Information Registry)
- **Purpose**: Lookup service for GS1 identifiers (not an identifier itself)
- **Format**: Web service/API
- **Use Cases**:
  - Validate company prefixes
  - Lookup company information from GLN
  - Verify GTIN ownership
- **Business Value**: Data validation, partner verification
- **Implementation Complexity**: Medium (requires external API integration)
- **Estimated Effort**: 3-4 days
- **Note**: External service dependency

#### 9. GPC (Global Product Classification)
- **Purpose**: Standardized product classification system
- **Format**: Hierarchical code structure
- **Use Cases**:
  - Product categorization
  - Regulatory reporting
  - Analytics and reporting
- **Business Value**: Standardized product classification, regulatory compliance
- **Implementation Complexity**: Medium-High
- **Estimated Effort**: 4-5 days
- **Note**: Requires maintaining classification codes

#### 10. GSRN-P (Global Service Relation Number - Provider)
- **Purpose**: Identifies service provider relationships
- **Format**: 18 digits
- **Use Cases**:
  - Healthcare provider tracking
  - Service provider management
- **Business Value**: Service relationship management
- **Implementation Complexity**: Medium
- **Estimated Effort**: 2-3 days
- **Note**: Healthcare-specific use case

#### 11. GSRN-L (Global Service Relation Number - Location)
- **Purpose**: Identifies service location relationships
- **Format**: 18 digits
- **Use Cases**:
  - Service location tracking
  - Location-based services
- **Business Value**: Location service management
- **Implementation Complexity**: Medium
- **Estimated Effort**: 2-3 days
- **Note**: May overlap with GLN functionality

---

### Priority 4: Specialized/Edge Cases

#### 12. GCN (Global Coupon Number)
- **Purpose**: Identifies coupons, vouchers, promotional items
- **Format**: 14 digits
- **Use Cases**:
  - Promotional campaign tracking
  - Coupon validation
- **Business Value**: Marketing campaign tracking
- **Implementation Complexity**: Low
- **Estimated Effort**: 1 day
- **Note**: Not typically needed for pharmaceutical track and trace

#### 13. GMN (Global Model Number)
- **Purpose**: Identifies product models (not individual items)
- **Format**: Variable
- **Use Cases**:
  - Product model tracking
  - Version management
- **Business Value**: Product model lifecycle management
- **Implementation Complexity**: Low
- **Estimated Effort**: 1 day
- **Note**: May overlap with GTIN functionality

#### 14. GDTI-96 (Global Document Type Identifier - 96-bit)
- **Purpose**: Extended version of GDTI for RFID encoding
- **Format**: 96-bit binary encoding
- **Use Cases**:
  - RFID document tracking
  - High-volume document management
- **Business Value**: RFID integration
- **Implementation Complexity**: High
- **Estimated Effort**: 5-7 days
- **Note**: Requires RFID infrastructure

---

## Validation Enhancements Backlog

### Facility Integration Service: GS1 Identifier Validation

**Status**: ⚠️ Partial validation (SSCC only)  
**Priority**: P1 - High Priority  
**Location**: `src/modules/integration/facility/facility-integration.service.ts`  
**Estimated Effort**: 2-3 days

#### Current Validation Status

| Identifier | Format Validation | Check Digit | Catalog Lookup | Status |
|------------|-------------------|-------------|----------------|--------|
| **SSCC** | ✅ Yes | ✅ Yes | N/A | ✅ Fully validated |
| **GTIN** | ❌ No | ❌ No | ✅ Yes | ⚠️ Partial (catalog only) |
| **SGTIN** | ❌ No | ❌ No | N/A | ❌ Not validated |
| **Batch Number** | ❌ No | N/A | N/A | ❌ Not validated |
| **GLN** | ❌ No | ❌ No | N/A | ❌ Not validated |

#### Issues Identified

1. **SGTIN Validation Missing**
   - **Problem**: SGTINs provided in `identifiers.sgtins` are used directly without format/check digit validation
   - **Risk**: Invalid SGTINs can create invalid EPCIS events
   - **Example**: `"0616400401234567890X"` is used without checking EPC URI format
   - **Impact**: Data quality issues, EPCIS validation failures downstream

2. **GTIN Format Validation Missing**
   - **Problem**: Only catalog existence is checked, not format/check digit
   - **Risk**: Invalid GTINs (wrong check digit, wrong length) pass if they exist in catalog
   - **Impact**: Data integrity issues, potential EPCIS errors

3. **GLN Validation Missing**
   - **Problem**: GLN from `dto.GLN` is used directly without validation
   - **Risk**: Invalid GLNs (wrong length, wrong check digit) are accepted
   - **Impact**: Invalid location identifiers in EPCIS events

4. **Batch Number Validation Missing**
   - **Problem**: Batch numbers are used directly without format validation
   - **Risk**: Invalid batch formats accepted
   - **Impact**: Inconsistent batch identifiers in EPCIS events

#### Required Changes

**1. Add SGTIN Validation**
```typescript
// Before using SGTINs from identifiers.sgtins
if (dto.identifiers.sgtins && dto.identifiers.sgtins.length > 0) {
  for (const sgtin of dto.identifiers.sgtins) {
    // Validate SGTIN format (with or without urn:epc:id:sgtin: prefix)
    const sgtinUri = sgtin.startsWith('urn:epc:id:sgtin:') 
      ? sgtin 
      : `urn:epc:id:sgtin:${sgtin}`;
    
    if (!this.gs1Service.validateSGTIN(sgtinUri)) {
      throw new BadRequestException(`Invalid SGTIN format: ${sgtin}`);
    }
    epcList.push(sgtinUri);
  }
}
```

**2. Add GTIN Format Validation**
```typescript
// Before catalog lookup
if (!this.gs1Service.validateGTIN(dto.gtin)) {
  throw new BadRequestException(`Invalid GTIN format: ${dto.gtin}. Must be 8, 12, 13, or 14 digits with valid check digit.`);
}

// Then check catalog
const catalogProduct = await this.masterDataService.findByGTIN(dto.gtin);
```

**3. Add GLN Validation**
```typescript
// At the start of each event handler
if (!this.gs1Service.validateGLN(dto.GLN)) {
  throw new BadRequestException(`Invalid GLN format: ${dto.GLN}. Must be 13 digits with valid check digit.`);
}
```

**4. Add Batch Number Validation**
```typescript
// Before using batch number
if (dto.batchNumber && !this.gs1Service.validateBatchNumber(dto.batchNumber)) {
  throw new BadRequestException(`Invalid batch number format: ${dto.batchNumber}`);
}
```

#### Affected Event Handlers

All event handlers in `facility-integration.service.ts` need validation:
- ✅ `handleDispense()` - Add GTIN, SGTIN, GLN, Batch validation
- ✅ `handleReceive()` - Add GTIN, SGTIN, SSCC, GLN, Batch validation
- ✅ `handleAdjust()` - Add GTIN, SGTIN, GLN, Batch validation
- ✅ `handleStockCount()` - Add GTIN, SGTIN, GLN, Batch validation
- ✅ `handleReturn()` - Add GTIN, SGTIN, SSCC, GLN, Batch validation
- ✅ `handleRecall()` - Add GTIN, SGTIN, GLN, Batch validation

#### Implementation Steps

1. **Create validation helper methods** in `FacilityIntegrationService`:
   - `validateGTIN(gtin: string): void`
   - `validateSGTIN(sgtin: string): void`
   - `validateGLN(gln: string): void`
   - `validateBatchNumber(batchNo: string): void`

2. **Add validation at entry points**:
   - Validate GLN at the start of each handler
   - Validate GTIN before catalog lookup
   - Validate SGTINs before adding to EPC list
   - Validate batch numbers before formatting as EPC URI

3. **Update error messages** to be descriptive and include expected format

4. **Add unit tests** for validation scenarios:
   - Valid identifiers (should pass)
   - Invalid format (should fail with clear error)
   - Invalid check digit (should fail)
   - Missing identifiers (should fail)

5. **Update API documentation** (Swagger) to reflect validation requirements

#### Business Value

- **Data Quality**: Ensures only valid GS1 identifiers are accepted
- **Error Prevention**: Catches invalid identifiers early, before EPCIS event creation
- **Compliance**: Aligns with GS1 standards for identifier validation
- **Debugging**: Clear error messages help identify integration issues quickly
- **Downstream Impact**: Prevents invalid EPCIS events from being sent to OpenEPCIS

#### Dependencies

- ✅ GS1 validation services already exist:
  - `GS1Service.validateSSCC()` - ✅ Available
  - `GS1Service.validateSGTIN()` - ✅ Available
  - `GS1Service.validateGTIN()` - ✅ Available (via `SGTINService`)
  - `GS1Service.validateGLN()` - ✅ Available
  - `GS1Service.validateBatchNumber()` - ✅ Available

#### Testing Considerations

- Test with valid identifiers (should pass)
- Test with invalid formats (should fail with 400 Bad Request)
- Test with invalid check digits (should fail)
- Test with missing identifiers (should fail)
- Test error messages are clear and actionable
- Test validation doesn't significantly impact performance

---

## Implementation Recommendations

### Phase 1: Core Enhancements (Next Sprint)
1. ✅ Complete GTIN check digit validation
2. **Add comprehensive GS1 identifier validation in Facility Integration Service** (P1 - High Priority)
   - Validate GTIN format and check digit before catalog lookup
   - Validate SGTIN format when provided in event payloads
   - Validate GLN format and check digit for all facility events
   - Validate batch number format before EPC URI formatting
   - See "Validation Enhancements Backlog" section above for details
3. Add GRAI service (for reusable asset tracking)
4. Add GDTI service (for document tracking) - **Only if regulatory compliance or partner integration requires it**

### Phase 2: Advanced Features (Future)
5. Add GIAI service (for equipment tracking)
6. Add GPC classification (for product categorization)
7. Add GEPIR integration (for identifier validation) - **Only if validating unknown partner prefixes**

### Phase 3: Specialized Features (As Needed)
8. Add GSRN (if patient-level tracking required)
9. Add GINC/GSIN (if international shipping needs)
10. ✅ **GCP lookup/validation service** - **COMPLETED** (2025-01-19)
11. Add GEPIR integration for GCP (external validation) - **Future Enhancement**
12. Add other identifiers based on specific business requirements

### Decision Framework
- **GDTI**: Implement if regulatory requirements mandate GS1 document identifiers OR if integrating with partners/systems that require GS1 document references
- **GCP Lookup**: Implement if you need to validate/lookup prefixes from unknown partners OR if regulatory requirements mandate prefix validation
- **GRAI**: High value for reusable asset tracking - recommended for most pharmaceutical supply chains

---

## Notes

- **Standards Version**: All implementations should follow current GS1 General Specifications
- **EPCIS Compatibility**: All identifiers should be compatible with EPCIS 2.0
- **Check Digit Algorithms**: Use standard GS1 check digit algorithms for all numeric identifiers
- **EPC URI Format**: Follow standard EPC URI format: `urn:epc:id:{type}:{components}`
- **Validation**: All identifiers should have validation methods
- **Documentation**: Each identifier service should include comprehensive documentation

---

## References

- [GS1 General Specifications](https://www.gs1.org/standards/genspecs)
- [EPCIS 2.0 Standard](https://www.gs1.org/standards/epcis)
- [GS1 Healthcare Implementation Guide](https://www.gs1.org/industries/healthcare)
- [GS1 Identifier Key Types](https://www.gs1.org/standards/id-keys)

---

## Last Updated
2025-01-19

