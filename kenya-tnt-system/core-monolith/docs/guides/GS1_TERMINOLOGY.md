# GS1 Terminology in Kenya TNT System

## GS1 Hierarchy & Terminology

### ✅ Correct Mappings:

1. **Batch = Lot** ✅
   - **GS1 Term**: Batch/Lot
   - **Definition**: A quantity of a product produced under the same conditions (same production run)
   - **Our System**: `batches` table
   - **Identifier**: Batch Number (e.g., `BATCH-001-001`)
   - **Contains**: Products (identified by GTIN)

2. **Case = Carton** ✅
   - **GS1 Term**: Case/Carton
   - **Definition**: A container (usually cardboard box) that holds multiple units of a product
   - **Our System**: `case` table
   - **Contains**: Products from batches (via `cases_products` junction table)
   - **Example**: A carton containing 50 units of Paracetamol tablets

3. **Package ≠ Pallet** (Partially Correct)
   - **GS1 Term**: Package/Logistic Unit
   - **Definition**: A container that holds cases/cartons. Can be:
     - A larger carton/box containing multiple smaller cartons
     - A pallet (flat platform with stacked cartons)
     - A shipping container
   - **Our System**: `packages` table
   - **Contains**: Cases (cartons)
   - **Note**: In our system, "package" is a generic term for a container holding cases. It could be a pallet, but it's more flexible.

4. **Shipment = Logistic Unit (SSCC)** ✅
   - **GS1 Term**: Logistic Unit (identified by SSCC)
   - **Definition**: The highest level shipping unit, identified by Serial Shipping Container Code (SSCC)
   - **Our System**: `shipment` table
   - **Identifier**: SSCC (18-digit code)
   - **Contains**: Packages
   - **SSCC**: Can be assigned to pallets, containers, or any logistic unit

---

## Complete GS1 Hierarchy in Our System

```
Product (GTIN)
  └── Batch/Lot (Batch Number)
        └── Case/Carton (Case Label)
              └── Package (Package Label) - Could be pallet or larger carton
                    └── Shipment (SSCC) - Logistic Unit
```

### Real-World Example:

```
Paracetamol 500mg (GTIN: 0123456789012)
  └── Batch BATCH-001-001 (1000 units produced)
        └── Case CASE-001 (Carton with 50 units)
              └── Package PKG-001 (Pallet with 20 cartons = 1000 units)
                    └── Shipment SSCC: 123456789012345678
```

---

## GS1 Standards Reference

### SSCC (Serial Shipping Container Code)
- **18-digit identifier** for logistic units
- Can be assigned to:
  - Individual cartons (if tracking at that level)
  - Pallets (most common)
  - Shipping containers
  - Any logistic unit that needs tracking

### EPCIS Aggregation Events
Our system uses EPCIS AggregationEvents to track:
- **Case Aggregation**: Products/Batches → Case (carton)
- **Package Aggregation**: Cases → Package (pallet/container)
- **Shipment Aggregation**: Packages → Shipment (SSCC)

---

## Terminology Clarification

### What is a "Case" in GS1?
- A **case** or **carton** is a container (usually cardboard) that holds multiple individual product units
- Example: A carton containing 50 bottles of medicine
- In EPCIS: Represented as an aggregation of products/batches

### What is a "Package" in Our System?
- A **package** is a container that holds multiple cases/cartons
- It can be:
  - A **pallet** (wooden/plastic platform with stacked cartons) - most common
  - A **larger carton** (master carton containing smaller cartons)
  - A **shipping container** (for large shipments)
- In our system, we use "package" as a flexible term, but in practice, it's often a pallet

### What is a "Shipment"?
- A **shipment** is the logistic unit identified by SSCC
- Contains one or more packages
- Represents the unit being shipped from one location to another
- The SSCC is the "license plate" for tracking this shipment

---

## Recommendations

### For Better GS1 Compliance:

1. **Consider Renaming "Package" to "Pallet"** (if that's what you're using):
   - If packages are always pallets, consider renaming for clarity
   - Or add a `type` field: `pallet`, `master_carton`, `container`

2. **Add GS1 Identifiers**:
   - Cases could have their own identifiers (if needed)
   - Packages could have identifiers (if different from shipment SSCC)

3. **Document the Hierarchy**:
   - Make it clear in the UI what each level represents
   - Add tooltips/help text explaining the GS1 hierarchy

---

## Current Implementation

Our system correctly implements:
- ✅ Batch/Lot tracking
- ✅ Case/Carton aggregation
- ✅ Package aggregation (flexible - can be pallet)
- ✅ Shipment with SSCC
- ✅ EPCIS AggregationEvents for tracking

The terminology is mostly correct, with "package" being a flexible term that typically represents a pallet in real-world usage.

