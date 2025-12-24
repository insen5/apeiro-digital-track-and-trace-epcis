import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { QUALITY_AUDIT_CONFIGS, QualityAuditEntityConfig, getQualityAuditConfig } from './quality-audit.config';

/**
 * Generic Quality Audit Enrichment Service
 * Provides enriched audit data with dimensions, trends, and top issues
 * Works across all master data entities (Products, Premises, Facilities, Practitioners)
 */

export interface QualityAuditSnapshot {
  id: number;
  date: Date;
  totalRecords: number;
  overallQualityScore: number;
  completeRecords: number;
  completenessPercentage: number;
  dimensionScores?: {
    completeness: number;
    validity: number;
    consistency: number;
    timeliness: number;
  };
  triggeredBy?: string;
  notes?: string;
  createdAt: Date;
  fullReport?: any;
}

export interface TopIssue {
  severity: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  count: number;
  percentage?: number;
  impact?: string;
  action?: string;
}

export interface QualityAuditEnrichedData {
  entity: {
    type: string;
    displayName: string;
    totalRecords: number;
  };
  latestAudit: QualityAuditSnapshot;
  trend: {
    dates: string[];
    scores: number[];
  };
  dimensionBreakdown: {
    completeness: number;
    validity: number;
    consistency: number;
    timeliness: number;
  };
  topIssues: TopIssue[];
  history: QualityAuditSnapshot[];
}

@Injectable()
export class GenericQualityAuditEnrichmentService {
  private readonly logger = new Logger(GenericQualityAuditEnrichmentService.name);

  /**
   * Get enriched audit data for any entity type
   */
  async getEnrichedAuditData(
    entity_type: string,
    repository: Repository<any>,
    days: number = 30,
  ): Promise<QualityAuditEnrichedData> {
    try {
      // Get config for this entity type using the mapping function
      const config = getQualityAuditConfig(entityType);
      
      if (!config) {
        throw new Error(`No audit config found for entity type: ${entityType}`);
      }

      this.logger.log(`Getting enriched audit data for ${entityType} (last ${days} days)`);

      // Get latest audit
      const latestAudit = await this.getLatestAudit(repository, config);
      if (!latestAudit) {
        throw new Error(`No audit data found for ${entityType}`);
      }

      // Get trend data (last N days)
      const trend = await this.getQualityTrend(repository, config, days);

      // Get dimension breakdown
      const dimensionBreakdown = await this.getDimensionBreakdown(latestAudit, config);

      // Get top issues
      const topIssues = await this.getTopIssues(latestAudit, config);

      // Get audit history (last 20)
      const history = await this.getAuditHistory(repository, config, 20);

      return {
        entity: {
          type: entityType,
          displayName: config.entityDisplayName,
          totalRecords: latestAudit.totalRecords,
        },
        latestAudit,
        trend,
        dimensionBreakdown,
        topIssues,
        history,
      };
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6eb6168d-a48c-4538-bea8-2cbf5c49c96f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generic-quality-audit-enrichment.service.ts:112',message:'ERROR in getEnrichedAuditData',data:{entityType,errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      // #endregion
      
      this.logger.error(`Failed to get enriched audit data for ${entityType}:`, error);
      throw error;
    }
  }

  /**
   * Get latest audit record
   */
  private async getLatestAudit(
    repository: Repository<any>,
    config: QualityAuditEntityConfig,
  ): Promise<QualityAuditSnapshot | null> {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6eb6168d-a48c-4538-bea8-2cbf5c49c96f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generic-quality-audit-enrichment.service.ts:123',message:'getLatestAudit attempting query',data:{entity_type:config.entityType,dateField:config.dateField,tableName:config.tableName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Use find with take(1) instead of findOne to avoid selection condition requirement
    try {
      const audits = await repository.find({
        order: { [config.dateField]: 'DESC' },
        take: 1,
      });

      if (!audits || audits.length === 0) return null;

      return this.normalizeAudit(audits[0], config);
    } catch (error) {
      this.logger.error(`Failed to get latest audit for ${config.entityType}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get audit history (last N records) with dimension breakdowns
   */
  private async getAuditHistory(
    repository: Repository<any>,
    config: QualityAuditEntityConfig,
    limit: number = 20,
  ): Promise<any[]> {
    const audits = await repository.find({
      order: { [config.dateField]: 'DESC' },
      take: limit,
    });

    // Enrich each audit with its dimension breakdown
    const enrichedAudits = [];
    for (const audit of audits) {
      const normalized = this.normalizeAudit(audit, config);
      const dimensionBreakdown = await this.getDimensionBreakdown(audit, config);
      enrichedAudits.push({
        ...normalized,
        dimensionBreakdown,
      });
    }
    return enrichedAudits;
  }

  /**
   * Normalize audit record to standard format
   * NOTE: Parse all numeric fields to ensure they're numbers, not strings
   */
  private normalizeAudit(audit: any, config: QualityAuditEntityConfig): QualityAuditSnapshot {
    return {
      id: audit.id,
      date: audit[config.dateField],
      totalRecords: Number(audit[config.totalRecordsField]) || 0,
      overallQualityScore: Number(audit[config.scoreField]) || 0,
      completeRecords: Number(audit.completeRecords) || 0,
      completenessPercentage: Number(audit.completenessPercentage) || 0,
      triggeredBy: audit.triggeredBy,
      notes: audit.notes,
      createdAt: audit.created_at,
      fullReport: audit.fullReport,
    };
  }

  /**
   * Get quality trend over time
   */
  private async getQualityTrend(
    repository: Repository<any>,
    config: QualityAuditEntityConfig,
    days: number,
  ): Promise<{ dates: string[]; scores: number[] }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const audits = await repository
      .createQueryBuilder('audit')
      .where(`audit.${config.dateField} >= :cutoffDate`, { cutoffDate })
      .orderBy(`audit.${config.dateField}`, 'ASC')
      .getMany();

    const dates = audits.map((a) =>
      new Date(a[config.dateField]).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    );

    const scores = audits.map((a) => Number(a[config.scoreField]) || 0);

    return { dates, scores };
  }

  /**
   * Extract dimension scores from stored columns or full_report JSONB
   */
  private async getDimensionBreakdown(
    audit: any,
    config: QualityAuditEntityConfig,
  ): Promise<{ completeness: number; validity: number; consistency: number; timeliness: number }> {
    // Check if entity has dimension score columns (facilities)
    if (audit.completenessScore !== undefined) {
      return {
        completeness: Number(audit.completenessScore) || 0,
        validity: Number(audit.validityScore) || 0,
        consistency: Number(audit.consistencyScore) || 0,
        timeliness: Number(audit.timelinessScore) || 0,
      };
    }

    // Otherwise, extract from full_report JSONB (products/premises/practitioners)
    if (audit.fullReport && audit.fullReport.scores) {
      return {
        completeness: Number(audit.fullReport.scores.completeness) || 0,
        validity: Number(audit.fullReport.scores.validity) || 0,
        consistency: Number(audit.fullReport.scores.consistency) || 0,
        timeliness: Number(audit.fullReport.scores.timeliness) || 0,
      };
    }

    // Fallback: estimate from overall score and completeness
    const completeness = Number(audit.completenessPercentage) || 0;
    const overall = Number(audit[config.scoreField]) || 0;

    // Rough estimation based on typical weights
    const validity = Math.min(100, overall + 10); // Usually higher than overall
    const consistency = Math.min(100, overall + 5);
    const timeliness = overall;

    this.logger.warn(
      `Dimension scores not found for ${config.entityType}, using estimates`,
    );

    return {
      completeness,
      validity,
      consistency,
      timeliness,
    };
  }

  /**
   * Extract top issues from audit
   */
  private async getTopIssues(audit: any, config: QualityAuditEntityConfig): Promise<TopIssue[]> {
    const issues: TopIssue[] = [];
    const totalRecords = audit[config.totalRecordsField] || 1;

    // Extract from full_report if available
    if (audit.fullReport && audit.fullReport.issues) {
      return audit.fullReport.issues.slice(0, 5).map((issue: any) => ({
        ...issue,
        percentage: totalRecords > 0 ? (issue.count / totalRecords) * 100 : 0,
      }));
    }

    // Otherwise, build from stored metrics
    // Completeness issues (high priority if >5% missing)
    if (config.completenessMetrics) {
      config.completenessMetrics
        .filter((m) => m.critical)
        .forEach((metric) => {
          const count = audit[metric.key] || 0;
          if (count > 0) {
            const percentage = (count / totalRecords) * 100;
            issues.push({
              severity: percentage > 5 ? 'high' : percentage > 2 ? 'medium' : 'low',
              category: 'Completeness',
              description: metric.label,
              count,
              percentage,
              impact: this.getImpactMessage('completeness', metric.label),
              action: this.getActionMessage('completeness', metric.label),
            });
          }
        });
    }

    // Validity issues (high priority if any duplicates/invalid formats)
    if (config.validityMetrics) {
      config.validityMetrics.forEach((metric) => {
        const count = audit[metric.key] || 0;
        if (count > 0) {
          const percentage = (count / totalRecords) * 100;
          issues.push({
            severity:
              metric.checkType === 'duplicate' || metric.checkType === 'format'
                ? 'high'
                : 'medium',
            category: 'Validity',
            description: metric.label,
            count,
            percentage,
            impact: this.getImpactMessage('validity', metric.label),
            action: this.getActionMessage('validity', metric.label),
          });
        }
      });
    }

    // Consistency issues (usually medium priority)
    if (config.consistencyMetrics) {
      config.consistencyMetrics.forEach((metric) => {
        const count = audit[metric.key] || 0;
        if (count > 0) {
          const percentage = (count / totalRecords) * 100;
          issues.push({
            severity: 'medium',
            category: 'Consistency',
            description: metric.label,
            count,
            percentage,
            impact: this.getImpactMessage('consistency', metric.label),
            action: this.getActionMessage('consistency', metric.label),
          });
        }
      });
    }

    // Sort by severity and count, take top 5
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return issues
      .sort((a, b) => {
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return b.count - a.count;
      })
      .slice(0, 5);
  }

  /**
   * Get impact message for issue
   */
  private getImpactMessage(category: string, label: string): string {
    const impactMap: Record<string, string> = {
      // Completeness
      'Missing Manufacturers': 'Cannot track source, compliance issues',
      'Missing Generic Name': 'Cannot identify therapeutic equivalent',
      'Missing GTIN': 'Cannot scan or track product',
      'Missing GLN': 'Cannot identify facility location',
      'Missing Coordinates': 'Cannot map facility locations',
      'Unknown Ownership': 'Classification incomplete',
      'Missing Contact Info': 'Cannot communicate with facility',

      // Validity
      'Duplicate GTIN': 'Traceability errors, scanning conflicts',
      'Invalid GTIN Format': 'Cannot scan or verify authenticity',
      'Duplicate Facility Codes': 'Facility identification conflicts',
      'Invalid Coordinates': 'Incorrect facility mapping',

      // Consistency
      'County Name Variations': 'Data aggregation and reporting issues',
      'Facility Type Formatting': 'Classification inconsistencies',
    };

    return impactMap[label] || 'May affect data quality and operations';
  }

  /**
   * Get action message for issue
   */
  private getActionMessage(category: string, label: string): string {
    const actionMap: Record<string, string> = {
      // Completeness
      'Missing Manufacturers': 'Contact PPB for manufacturer data',
      'Missing Generic Name': 'Add generic names from WHO INN list',
      'Missing GTIN': 'Request GTINs from manufacturers',
      'Missing GLN': 'Contact Safaricom HIE for GLN assignment',
      'Missing Coordinates': 'Geocode facility addresses',
      'Unknown Ownership': 'Update facility ownership information',
      'Missing Contact Info': 'Request contact details from facilities',

      // Validity
      'Duplicate GTIN': 'Verify and update incorrect GTINs',
      'Invalid GTIN Format': 'Correct GTIN format or obtain new codes',
      'Duplicate Facility Codes': 'Assign unique facility codes',
      'Invalid Coordinates': 'Verify and correct coordinate data',

      // Consistency
      'County Name Variations': 'Standardize county names across system',
      'Facility Type Formatting': 'Apply consistent facility type naming',
    };

    return actionMap[label] || 'Review and correct data as needed';
  }
}



