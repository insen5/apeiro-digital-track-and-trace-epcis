'use client';

import GenericQualityAuditTab from '@/components/shared/GenericQualityAuditTab';

/**
 * Facility Production Audit History Tab
 * Uses generic enriched quality audit component
 */
export default function AuditHistoryTab() {
  return (
    <GenericQualityAuditTab
      entityType="facility_prod"
      apiBasePath="http://localhost:4000/api/master-data/prod-facilities"
      entityDisplayName="Production Facility"
    />
  );
}
