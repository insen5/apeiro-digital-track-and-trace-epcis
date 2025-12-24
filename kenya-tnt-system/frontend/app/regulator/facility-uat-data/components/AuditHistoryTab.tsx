'use client';

import ImprovedQualityAuditTab from '@/components/shared/ImprovedQualityAuditTab';

/**
 * Facility UAT Audit History Tab
 * Uses generic enriched quality audit component
 */
export default function AuditHistoryTab() {
  return (
    <ImprovedQualityAuditTab
      entityType="facility"
      apiBasePath="http://localhost:4000/api/master-data/uat-facilities"
      entityDisplayName="UAT Facility"
    />
  );
}
