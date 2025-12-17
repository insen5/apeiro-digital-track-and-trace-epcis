# Consignment Approval Workflow - Backlog

## Overview

This document describes the future consignment approval workflow that will be implemented. This is currently in the backlog and not yet implemented.

## Current State (Phase 1)

**Consignment Import:**
- Only regulator (PPB) can import consignments
- Import endpoint: `POST /regulator/ppb-batches/consignment/import`
- This imports **approved consignments** directly into the system
- Manufacturer frontend: **No import/submit button** (query only)

## Future Requirement (Phase 2 - Backlog)

### Workflow

1. **Manufacturer Submission (Pre-Approval)**
   - Manufacturers create/submit potential/planned consignments to PPB
   - Endpoint: `POST /manufacturer/consignments/submit` (to be created)
   - Status: `PENDING_APPROVAL`
   - Manufacturer can view their submitted consignments

2. **PPB Review & Approval**
   - PPB has a UI to review submitted consignments
   - PPB can approve/reject individual items (batches, cases, packages, shipments)
   - UI: Checkboxes/toggles for each item (tick/tick interface)
   - Status transitions: `PENDING_APPROVAL` → `APPROVED` or `REJECTED`

3. **Approved Consignment Creation**
   - Once PPB approves, the approved consignment becomes the actual consignment
   - Approved consignments are imported into the system (current import flow)
   - EPCIS events are generated for approved items only

### Architecture Changes Needed

#### Backend

1. **New Endpoint: Manufacturer Consignment Submission**
   ```
   POST /manufacturer/consignments/submit
   ```
   - Creates consignment with status `PENDING_APPROVAL`
   - Stores in `consignments` table with `status` field
   - No EPCIS events generated yet (waiting for approval)

2. **New Endpoint: PPB Approval**
   ```
   POST /regulator/ppb-batches/consignments/:id/approve
   Body: {
     approvedItems: {
       shipments: string[], // SSCCs
       packages: string[],  // SSCCs
       cases: string[],    // SSCCs
       batches: number[]   // Batch IDs
     }
   }
   ```
   - Updates consignment status to `APPROVED`
   - Creates actual consignment with approved items only
   - Generates EPCIS events for approved items
   - Rejects non-approved items

3. **Database Schema Changes**
   - Add `status` field to `consignments` table:
     - `PENDING_APPROVAL` - Submitted by manufacturer, awaiting PPB review
     - `APPROVED` - Approved by PPB, imported into system
     - `REJECTED` - Rejected by PPB
     - `PARTIALLY_APPROVED` - Some items approved, some rejected
   - Add `submittedAt` timestamp
   - Add `approvedAt` timestamp
   - Add `approvedBy` (user ID of PPB approver)

4. **New Table: `consignment_submissions`** (Optional)
   - Stores pre-approval submissions separately
   - Links to approved consignment once approved
   - Allows tracking of submission history

#### Frontend

1. **Manufacturer Consignments Page**
   - Add "Submit to PPB" button (bring back)
   - Shows submitted consignments with status badges
   - Filter by status: `PENDING_APPROVAL`, `APPROVED`, `REJECTED`
   - View approval status and comments

2. **PPB Approval Page** (New)
   - List of pending consignments
   - Detail view with expandable hierarchy
   - Checkboxes for each item (shipment, package, case, batch)
   - Approve/Reject buttons
   - Comments field for rejection reasons
   - Bulk approve/reject options

### Implementation Notes

1. **Current Import Endpoint**
   - Keep `POST /regulator/ppb-batches/consignment/import` for direct imports
   - This will be used for:
     - Legacy/backward compatibility
     - Bulk imports from external systems
     - Approved consignments from the approval workflow

2. **Status Flow**
   ```
   Manufacturer submits → PENDING_APPROVAL
   PPB reviews → APPROVED or REJECTED
   Approved → Imported (EPCIS events generated)
   ```

3. **EPCIS Event Generation**
   - Only generate EPCIS events for approved items
   - Rejected items are not tracked in EPCIS
   - Partial approvals: Generate events only for approved items

4. **Data Model**
   - Pre-approval consignments: Stored with all items, status `PENDING_APPROVAL`
   - Approved consignments: Only approved items imported, status `APPROVED`
   - Rejected items: Marked as rejected, not imported

### Migration Path

When implementing this feature:

1. **Phase 1**: Add database fields (`status`, `submittedAt`, `approvedAt`, `approvedBy`)
2. **Phase 2**: Create submission endpoint for manufacturers
3. **Phase 3**: Create approval UI for PPB
4. **Phase 4**: Update import logic to handle approved consignments
5. **Phase 5**: Add status filtering and UI updates

### Related Files

- `core-monolith/src/modules/manufacturer/consignments/consignment.controller.ts` - Will need `submit()` method
- `core-monolith/src/modules/regulator/ppb-batches/ppb-batch.controller.ts` - Will need `approve()` method
- `core-monolith/src/modules/shared/consignments/consignment.service.ts` - Will need approval logic
- `frontend/app/manufacturer/consignments/page.tsx` - Will need submit button and status display
- `frontend/app/regulator/consignments/approval/page.tsx` - New approval page

### Dependencies

- Database migration for `status` field
- UI components for approval interface
- Status badges and filtering components
- Approval workflow state management

---

**Status**: 📋 Backlog - Not yet implemented
**Priority**: Medium (after core functionality is stable)
**Estimated Effort**: 2-3 weeks

