'use client';

import GenericQualityAuditTab from '@/components/shared/GenericQualityAuditTab';

/**
 * Practitioner Audit History Tab
 * Uses generic enriched quality audit component
 */
export default function AuditHistoryTab() {
  return (
    <GenericQualityAuditTab
      entityType="practitioner"
      apiBasePath="http://localhost:4000/api/master-data/practitioners"
      entityDisplayName="Practitioner"
    />
  );
}
