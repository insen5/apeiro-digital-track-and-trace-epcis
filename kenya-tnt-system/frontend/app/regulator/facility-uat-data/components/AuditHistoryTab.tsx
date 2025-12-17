'use client';

import GenericQualityAuditTab from '@/components/shared/GenericQualityAuditTab';

/**
 * Facility UAT Audit History Tab
 * Uses generic enriched quality audit component
 */
export default function AuditHistoryTab() {
  return (
    <GenericQualityAuditTab
      entityType="facility"
      apiBasePath="http://localhost:4000/api/master-data/uat-facilities"
      entityDisplayName="UAT Facility"
    />
  );
}
