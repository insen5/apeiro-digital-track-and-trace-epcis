'use client';

import GenericQualityAuditTab from '@/components/shared/GenericQualityAuditTab';

/**
 * Premise Audit History Tab
 * Uses generic enriched quality audit component
 */
export default function AuditHistoryTab() {
  return (
    <GenericQualityAuditTab
      entityType="premise"
      apiBasePath="http://localhost:4000/api/master-data/premises"
      entityDisplayName="Premise"
    />
  );
}
