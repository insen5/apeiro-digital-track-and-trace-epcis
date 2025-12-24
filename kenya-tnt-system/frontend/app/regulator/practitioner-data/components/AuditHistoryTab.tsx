'use client';

import ImprovedQualityAuditTab from '@/components/shared/ImprovedQualityAuditTab';

/**
 * Practitioner Audit History Tab
 * Uses generic enriched quality audit component
 */
export default function AuditHistoryTab() {
  return (
    <ImprovedQualityAuditTab
      entityType="practitioner"
      apiBasePath="http://localhost:4000/api/master-data/practitioners"
      entityDisplayName="Practitioner"
    />
  );
}
