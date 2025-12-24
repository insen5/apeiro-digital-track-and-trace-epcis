'use client';

import ImprovedQualityAuditTab from '@/components/shared/ImprovedQualityAuditTab';

/**
 * Premise Audit History Tab
 * Uses generic enriched quality audit component
 */
export default function AuditHistoryTab() {
  return (
    <ImprovedQualityAuditTab
      entityType="premise"
      apiBasePath="http://localhost:4000/api/master-data/premises"
      entityDisplayName="Premise"
    />
  );
}
