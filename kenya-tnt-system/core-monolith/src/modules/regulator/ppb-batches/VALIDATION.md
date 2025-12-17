# PPB Batch Data Validation Requirements

This document defines all validation rules for PPB batch data received from Kafka topics.

## Validation Overview

All PPB batch data must pass comprehensive validation before being accepted into the system. Validation is performed in the following order:

1. **Schema Validation** - JSON structure, required fields, data types
2. **GS1 Identifier Validation** - GTIN, GLN, SGLN format and check digits
3. **Master Data Validation** - Entity existence and consistency checks
4. **Business Logic Validation** - Dates, quantities, relationships
5. **Data Consistency Checks** - Cross-field validation
6. **Data Quality Warnings** - Non-blocking quality checks

---

## 1. Schema Validation

### Required Fields

All of the following fields are **MANDATORY**:

#### Root Level
- `gtin` (string, required) - Product GTIN
- `product_name` (string, required) - Product name
- `product_code` (string, required) - Product code

#### Batch Object (`batch`)
- `batch.batch_number` (string, required, unique) - Unique batch identifier
- `batch.status` (string, required) - Must be one of: 'active', 'recalled', 'inactive', 'quarantined', 'expired'
- `batch.expiration_date` (date string, required) - Format: YYYY-MM-DD or ISO 8601
- `batch.manufacture_date` (date string, required) - Format: YYYY-MM-DD or ISO 8601
- `batch.Approval_Status` (boolean/string, required) - 'True'/'False' or true/false
- `batch.quantities.declared_total` (number, required) - Must be > 0
- `batch.quantities.declared_sent` (number, optional) - Must be ≤ declared_total if provided

#### Serialization Object (`serialization`)
- `serialization.range` (array of strings, **REQUIRED**) - Array of serialization ranges
- `serialization.is_partial_approval` (boolean, optional) - Default: false

#### Parties Object (`parties`)
- `parties.manufacturer.name` (string, required) - Manufacturer name
- `parties.manufacturer.gln` (string, required) - Manufacturer GLN
- `parties.manufacturing_site.sgln` (string, optional) - Manufacturing site SGLN
- `parties.manufacturing_site.label` (string, optional) - Manufacturing site name
- `parties.importer.name` (string, **REQUIRED**) - Importer name
- `parties.importer.country` (string, **REQUIRED**) - ISO country code (e.g., 'KE')
- `parties.importer.gln` (string, **REQUIRED**) - Importer GLN

#### Logistics Object (`logistics`)
- `logistics.carrier` (string, optional)
- `logistics.origin` (string, optional)
- `logistics.port_of_entry` (string, optional)
- `logistics.final_destination_sgln` (string, optional)
- `logistics.final_destination_address` (string, optional)

#### Optional Fields (Validated if Provided)
- `batch.permit_id` (string)
- `batch.consignment_ref_number` (string)
- `batch.Approval_DateStamp` (string) - Required if Approval_Status is true

### Data Type Validation

- **Dates**: Must be valid ISO 8601 or YYYY-MM-DD format
- **Numbers**: Must be positive integers for quantities (declared_total, declared_sent)
- **Strings**: Must be non-empty, respect max length constraints
- **Arrays**: Must be valid array structure (for serialization.range)
- **Booleans**: Accept true/false or 'True'/'False' string

### Schema Validation Rules

1. All required fields must be present and non-null
2. String fields must not be empty
3. Number fields must be valid numbers (not NaN, not Infinity)
4. Date strings must be parseable
5. Arrays must be actual arrays (not strings or objects)

---

## 2. GS1 Identifier Validation

### GTIN Validation

- **Format**: Must be 8, 12, 13, or 14 digits
- **Check Digit**: Must pass GS1 check digit validation algorithm
- **Product Existence**: GTIN must exist in `ppb_products` table
- **Product Status**: Product should be enabled/active in catalog (warning if disabled)

**Validation Steps:**
1. Check format (8, 12, 13, or 14 digits)
2. Validate check digit using GS1 algorithm
3. Query `ppb_products` table by GTIN
4. Verify product exists (error if not found)
5. Check product status (warning if disabled)

### GLN Validation

#### Manufacturer GLN (`parties.manufacturer.gln`)

- **Format**: 
  - 13 digits (numeric GLN), OR
  - EPC URI format: `urn:epc:id:sgln:CompanyPrefix.LocationRef.CheckDigit`
- **Check Digit**: Must pass GS1 check digit validation
- **Master Data Existence**: Manufacturer must exist in `suppliers` table with `actor_type='manufacturer'`
- **GLN Match**: Manufacturer GLN should match master data `legalEntityGLN` or `hqGLN`
- **Company Prefix**: Manufacturer's GS1 prefix should match GTIN prefix (warning if mismatch)

**Validation Steps:**
1. Parse GLN (extract numeric from EPC URI if needed)
2. Validate format (13 digits)
3. Validate check digit
4. Query `suppliers` table by GLN or name
5. Verify manufacturer exists and is active (error if not found)
6. Verify GLN matches master data (warning if mismatch)
7. Check company prefix consistency with GTIN (warning if mismatch)

#### Importer GLN (`parties.importer.gln`)

- **Format**: 13 digits or EPC URI format
- **Check Digit**: Must pass GS1 check digit validation
- **Master Data Existence**: Importer must exist in `suppliers` table
- **Status**: Importer must be 'Active' in master data

**Validation Steps:**
1. Parse GLN (extract numeric from EPC URI if needed)
2. Validate format and check digit
3. Query `suppliers` table by GLN or name
4. Verify importer exists and is active (error if not found)

### SGLN Validation (Manufacturing Site, Final Destination)

#### Manufacturing Site SGLN (`parties.manufacturing_site.sgln`)

- **Format**: EPC URI format: `urn:epc:id:sgln:CompanyPrefix.LocationRef.CheckDigit`
- **GLN Extraction**: Extract numeric GLN and validate check digit
- **Company Prefix**: Should match manufacturer's company prefix (warning if mismatch)

**Validation Steps:**
1. Parse EPC URI format
2. Extract numeric GLN
3. Validate GLN check digit
4. Verify company prefix matches manufacturer (warning if mismatch)

#### Final Destination SGLN (`logistics.final_destination_sgln`)

- **Format**: EPC URI format
- **GLN Extraction**: Extract numeric GLN and validate check digit
- **Premise Existence**: Should exist in `premises` table (warning if not found)
- **Premise Status**: Premise must be 'Active' (warning if inactive)

**Validation Steps:**
1. Parse EPC URI format
2. Extract numeric GLN
3. Validate GLN check digit
4. Query `premises` table by GLN (warning if not found)
5. Check premise status (warning if inactive)

---

## 3. Master Data Entity Validation

### Manufacturer Validation

- **Existence**: `parties.manufacturer.name` or `parties.manufacturer.gln` must match a supplier with `actor_type='manufacturer'`
- **Status**: Manufacturer must be 'Active' in master data
- **GLN Consistency**: If GLN provided, it must match manufacturer's `legalEntityGLN` or `hqGLN`
- **Company Prefix**: Manufacturer's GS1 prefix should match GTIN prefix (warning if mismatch)

**Error Conditions:**
- Manufacturer not found in master data
- Manufacturer status is not 'Active'
- GLN mismatch with master data

**Warning Conditions:**
- Company prefix mismatch between GTIN and manufacturer
- Manufacturer name mismatch (different name for same GLN)

### Product Validation

- **Existence**: GTIN must exist in `ppb_products` table
- **Product Name Consistency**: Batch `product_name` should match catalog `brandDisplayName` or `genericDisplayName` (warning if mismatch)
- **Product Code Consistency**: `product_code` should match catalog `ppbRegistrationCode` (warning if mismatch)

**Error Conditions:**
- Product not found in catalog
- Product disabled/inactive (warning, not error)

**Warning Conditions:**
- Product name mismatch
- Product code mismatch

### Importer Validation

- **Existence**: `parties.importer.name` or `parties.importer.gln` must match a supplier in master data
- **Status**: Importer must be 'Active'
- **Country Code**: `parties.importer.country` should be valid ISO country code (e.g., 'KE')

**Error Conditions:**
- Importer not found in master data
- Importer status is not 'Active'
- Invalid country code

### Premise/Location Validation

- **Final Destination Existence**: If `logistics.final_destination_sgln` provided, premise should exist in `premises` table
- **Premise Status**: Premise must be 'Active'
- **Premise Ownership**: Premise should belong to importer or manufacturer (warning if mismatch)

**Warning Conditions:**
- Premise not found
- Premise inactive
- Premise ownership mismatch

---

## 4. Business Logic Validation

### Date Validation

- **Manufacture Date**: 
  - Must be valid date
  - Must not be in future
  - Must be parseable as Date object

- **Expiration Date**: 
  - Must be valid date
  - Must be after manufacture date
  - Must be parseable as Date object

- **Approval Date**: 
  - If `Approval_Status=true`, `Approval_DateStamp` should be provided
  - Must be valid date if provided
  - Must not be in future

- **Date Format**: ISO 8601 or YYYY-MM-DD format

**Error Conditions:**
- Invalid date format
- Manufacture date in future
- Expiration date before manufacture date
- Approval date in future

### Quantity Validation

- **Declared Total**: 
  - Must be positive integer
  - Must be > 0
  - Must be a valid number

- **Declared Sent**: 
  - Must be positive integer if provided
  - Must be ≤ declared_total
  - Must be a valid number

- **Serialization Range Count**: 
  - If serialization ranges provided, total serial numbers should match declared_total (warning if mismatch)
  - Calculate total from ranges and compare with declared_total

**Error Conditions:**
- Declared total ≤ 0
- Declared sent > declared_total
- Invalid number format

**Warning Conditions:**
- Serialization range count mismatch with declared_total

### Status Validation

- **Batch Status**: Must be one of: 'active', 'recalled', 'inactive', 'quarantined', 'expired'
- **Approval Status**: If `Approval_Status=true`, `Approval_DateStamp` should be provided
- **Processed Status**: Should not be manually set (system managed)

**Error Conditions:**
- Invalid batch status value
- Approval status true but no approval date

### Serialization Validation

- **Serialization Ranges**: **REQUIRED** - Must be array of strings
- **Range Format**: Each range should be in format "START - END" or single number
- **Range Consistency**: Ranges should not overlap (warning if overlap detected)
- **Range Completeness**: If `is_partial_approval=false`, all serial numbers should be covered (warning if gaps)

**Error Conditions:**
- Missing serialization.range array
- Empty serialization.range array
- Invalid range format

**Warning Conditions:**
- Overlapping ranges
- Gaps in serialization coverage (if not partial approval)
- Range count mismatch with declared_total

### Permit and Consignment Validation

- **Permit ID Format**: If provided, should match expected format (alphanumeric)
- **Consignment Ref**: If provided, should be unique or match existing consignment

**Warning Conditions:**
- Invalid permit ID format
- Duplicate consignment reference

---

## 5. Data Consistency Checks

### Cross-Field Validation

- **Manufacturer Name vs GLN**: Manufacturer name should match master data for given GLN
- **Product Name vs GTIN**: Product name should match catalog product for given GTIN
- **Manufacturing Site**: Manufacturing site SGLN should belong to manufacturer (same company prefix)
- **Importer vs Destination**: Final destination should belong to importer (if both provided)

**Error Conditions:**
- Manufacturer name/GLN mismatch with master data
- Product name/GTIN mismatch with catalog

**Warning Conditions:**
- Manufacturing site company prefix mismatch
- Final destination ownership mismatch

### Relationship Validation

- **Manufacturer-Product**: Manufacturer should be authorized to produce this product (check product-manufacturer mapping in catalog)
- **Importer-Manufacturer**: Importer should be valid trading partner (optional business rule)

**Warning Conditions:**
- Manufacturer not in product's manufacturer list
- Importer-manufacturer relationship not verified

---

## 6. Duplicate Detection

### Batch Number Uniqueness

- **Uniqueness Check**: batch_number must be unique (check existing batches)
- **Update Scenario**: If batch exists, validate it's an update (same GTIN, same batch_number)

**Error Conditions:**
- Duplicate batch_number with different GTIN (not an update)

**Info Conditions:**
- Batch exists, treating as update

---

## 7. Data Quality Checks

### Missing Critical Data

- **Warnings for Missing Optional but Important Fields**:
  - Manufacturing site details
  - Importer details (if required by business rules)
  - Logistics information
  - Permit ID

### Incomplete Serialization

- **Warning**: If `declared_total` > 0 but serialization ranges are empty or incomplete
- **Warning**: If `is_partial_approval=true` but serialization ranges cover all declared_total

### Compliance Checks

- **PPB License**: Manufacturer should have valid PPB license number in master data (warning if missing)
- **Permit Validity**: Permit ID should be valid format (warning if invalid format)
- **Import Authorization**: Importer should have valid import license (warning if missing in master data)

---

## 8. Validation Error Handling

### Error Severity Levels

#### Critical Errors (Reject Batch)
- Missing required fields
- Invalid GTIN/GLN format or check digit
- Product not found in catalog
- Manufacturer not found in master data
- Importer not found in master data
- Invalid date formats or logical date errors
- Duplicate batch number with different GTIN
- Invalid batch status
- Missing serialization ranges
- Quantity validation failures

#### Warnings (Accept but Flag)
- Product name mismatch with catalog
- Product code mismatch with catalog
- Missing optional but recommended fields
- Serialization range count mismatch
- Company prefix mismatch between GTIN and manufacturer
- Manufacturing site company prefix mismatch
- Premise not found or inactive
- Premise ownership mismatch
- Overlapping serialization ranges
- Gaps in serialization coverage
- Manufacturer not in product's manufacturer list

#### Info (Log Only)
- Missing optional fields
- Data quality suggestions
- Update scenario detected

### Validation Response Structure

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];      // Critical errors (block processing)
  warnings: ValidationWarning[];  // Warnings (allow but flag)
  info: ValidationInfo[];         // Info messages (log only)
}

interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: 'error';
}

interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  severity: 'warning';
}

interface ValidationInfo {
  field: string;
  code: string;
  message: string;
  severity: 'info';
}
```

### Validation Error Codes

#### Schema Validation Codes
- `SCHEMA_MISSING_FIELD` - Required field missing
- `SCHEMA_INVALID_TYPE` - Invalid data type
- `SCHEMA_INVALID_FORMAT` - Invalid format
- `SCHEMA_EMPTY_VALUE` - Empty value for required field

#### GS1 Validation Codes
- `GTIN_INVALID_FORMAT` - Invalid GTIN format
- `GTIN_INVALID_CHECK_DIGIT` - Invalid GTIN check digit
- `GTIN_NOT_FOUND` - GTIN not in product catalog
- `GLN_INVALID_FORMAT` - Invalid GLN format
- `GLN_INVALID_CHECK_DIGIT` - Invalid GLN check digit
- `GLN_NOT_FOUND` - GLN not in master data
- `SGLN_INVALID_FORMAT` - Invalid SGLN format
- `SGLN_INVALID_CHECK_DIGIT` - Invalid SGLN check digit

#### Master Data Validation Codes
- `MANUFACTURER_NOT_FOUND` - Manufacturer not in master data
- `MANUFACTURER_INACTIVE` - Manufacturer not active
- `MANUFACTURER_GLN_MISMATCH` - GLN mismatch with master data
- `PRODUCT_NOT_FOUND` - Product not in catalog
- `PRODUCT_INACTIVE` - Product disabled
- `IMPORTER_NOT_FOUND` - Importer not in master data
- `IMPORTER_INACTIVE` - Importer not active
- `PREMISE_NOT_FOUND` - Premise not found
- `PREMISE_INACTIVE` - Premise not active

#### Business Logic Validation Codes
- `DATE_INVALID_FORMAT` - Invalid date format
- `DATE_MANUFACTURE_FUTURE` - Manufacture date in future
- `DATE_EXPIRATION_BEFORE_MANUFACTURE` - Expiration before manufacture
- `QUANTITY_INVALID` - Invalid quantity value
- `QUANTITY_DECLARED_SENT_EXCEEDS_TOTAL` - Declared sent exceeds total
- `STATUS_INVALID` - Invalid batch status
- `SERIALIZATION_MISSING` - Serialization ranges missing
- `SERIALIZATION_INVALID_FORMAT` - Invalid serialization range format

#### Consistency Validation Codes
- `MANUFACTURER_NAME_MISMATCH` - Name mismatch with master data
- `PRODUCT_NAME_MISMATCH` - Product name mismatch with catalog
- `COMPANY_PREFIX_MISMATCH` - Company prefix mismatch
- `PREMISE_OWNERSHIP_MISMATCH` - Premise ownership mismatch

---

## 9. Validation Implementation Order

1. **Schema Validation** (fast, fail early)
   - Check required fields
   - Validate data types
   - Check format constraints

2. **GS1 Identifier Format Validation** (fast)
   - Validate GTIN format and check digit
   - Validate GLN format and check digit
   - Validate SGLN format and check digit

3. **Master Data Existence Checks** (database queries)
   - Check product exists in catalog
   - Check manufacturer exists in master data
   - Check importer exists in master data
   - Check premise exists (if provided)

4. **Business Logic Validation** (computation)
   - Validate dates and date relationships
   - Validate quantities
   - Validate serialization ranges
   - Validate status values

5. **Data Consistency Checks** (cross-field validation)
   - Validate manufacturer-product relationships
   - Validate GLN consistency
   - Validate company prefix consistency

6. **Duplicate Detection** (database query)
   - Check batch number uniqueness

7. **Data Quality Warnings** (non-blocking)
   - Check for missing optional fields
   - Check for data quality issues
   - Generate recommendations

---

## 10. Performance Considerations

- **Cache Master Data**: Cache frequently accessed master data (manufacturers, products) to reduce database queries
- **Batch Database Queries**: Where possible, batch multiple lookups into single queries
- **Parallel Validation**: Validate independent checks in parallel
- **Fail Fast**: Stop validation on first critical error
- **Logging**: Log all validation results for audit trail

---

## 11. Validation Result Storage

Validation results should be stored with each batch record:

- `processed_status`: 'VALIDATED', 'ERROR', 'WARNING', 'PROCESSED'
- `processing_error`: JSON string of validation errors
- `validation_warnings`: JSON string of validation warnings
- `validation_info`: JSON string of validation info messages

This allows:
- Tracking validation history
- Debugging validation issues
- Reporting on data quality
- Audit trail for compliance

---

## 12. Example Validation Scenarios

### Scenario 1: Valid Batch
- All required fields present
- Valid GS1 identifiers
- All entities exist in master data
- Dates are valid and logical
- Quantities are valid
- Serialization ranges are complete
- **Result**: `isValid: true`, no errors, no warnings

### Scenario 2: Missing Serialization Ranges
- All required fields present except `serialization.range`
- **Result**: `isValid: false`, error: `SERIALIZATION_MISSING`

### Scenario 3: Product Name Mismatch
- GTIN exists in catalog
- Product name in batch doesn't match catalog
- **Result**: `isValid: true`, warning: `PRODUCT_NAME_MISMATCH`

### Scenario 4: Invalid GTIN Check Digit
- GTIN format is correct (13 digits)
- Check digit is invalid
- **Result**: `isValid: false`, error: `GTIN_INVALID_CHECK_DIGIT`

### Scenario 5: Manufacturer Not Found
- Manufacturer GLN provided
- Manufacturer not in master data
- **Result**: `isValid: false`, error: `MANUFACTURER_NOT_FOUND`

---

## 13. Testing Requirements

All validation rules must be tested with:
- Valid data (should pass)
- Missing required fields (should fail)
- Invalid formats (should fail)
- Invalid check digits (should fail)
- Missing master data entities (should fail)
- Data mismatches (should warn)
- Edge cases (empty strings, null values, etc.)

---

## Revision History

- **2025-01-XX**: Initial validation requirements document
- **2025-01-XX**: Updated - serialization.range and parties.importer.* are required
- **2025-01-XX**: Removed GTIN-batch combination uniqueness check


