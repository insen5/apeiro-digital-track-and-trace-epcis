'use client';

import ImprovedQualityAuditTab from '@/components/shared/ImprovedQualityAuditTab';

/**
 * Facility Production Audit History Tab
 * Uses generic enriched quality audit component
 */
export default function AuditHistoryTab() {
  return (
    <ImprovedQualityAuditTab
      entityType="facility_prod"
      apiBasePath="http://localhost:4000/api/master-data/prod-facilities"
      entityDisplayName="Production Facility"
    />
  );
}
