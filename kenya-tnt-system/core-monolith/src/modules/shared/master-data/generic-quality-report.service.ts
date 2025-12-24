import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { getQualityAuditConfig } from './quality-audit.config';

/**
 * Generic Quality Report Service
 * Generates quality reports for any entity type using configuration
 * (Following the same pattern as QualityAlertService)
 */

@Injectable()
export class GenericQualityReportService {
  private readonly logger = new Logger(GenericQualityReportService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Generate quality report for any entity type
   * Config-driven approach (like checkAndAlert in Quality Alert System)
   * NOW WITH TIMELINESS SCORING AND DISTRIBUTION ANALYSIS
   */
  async generateReport(entity_type: string): Promise<any> {
    const config = getQualityAuditConfig(entityType);
    
    this.logger.log(`Generating quality report for ${config.entityDisplayName}...`);

    const repository = this.dataSource.getRepository(config.tableName);
    
    // Fetch all entities (excluding test data)
    const queryBuilder = repository.createQueryBuilder('entity');
    
    // Exclude test data if isTest field exists
    const metadata = this.dataSource.getMetadata(config.tableName);
    if (metadata.columns.find(col => col.propertyName === 'isTest')) {
      queryBuilder.where('entity.isTest = :isTest', { isTest: false });
    }
    
    const entities = await queryBuilder.getMany();
    const totalRecords = entities.length;

    // 1. Completeness Analysis (config-driven)
    const completeness: any = {};
    let completenessScore = 0;

    for (const metric of config.completenessMetrics) {
      let missingCount = 0;
      
      // Map metric keys to actual field checks
      switch (metric.key) {
        case 'missingGtin':
          missingCount = entities.filter(e => !e['gtin']).length;
          break;
        case 'missingManufacturer':
          missingCount = entities.filter(e => !e['manufacturers'] || (Array.isArray(e['manufacturers']) && e['manufacturers'].length === 0)).length;
          break;
        case 'missingBrandName':
          missingCount = entities.filter(e => !e['brandName']).length;
          break;
        case 'missingGenericName':
          missingCount = entities.filter(e => !e['genericName']).length;
          break;
        case 'missingPpbCode':
          missingCount = entities.filter(e => !e['ppbRegistrationCode']).length;
          break;
        case 'missingCategory':
          missingCount = entities.filter(e => !e['category']).length;
          break;
        case 'missingStrength':
          missingCount = entities.filter(e => !e['strengthAmount'] && !e['strengthUnit']).length;
          break;
        case 'missingRoute':
          missingCount = entities.filter(e => !e['routeDescription']).length;
          break;
        case 'missingForm':
          missingCount = entities.filter(e => !e['formDescription']).length;
          break;
        case 'missingGln':
          missingCount = entities.filter(e => !e['gln']).length;
          break;
        case 'missingLicenseInfo':
          missingCount = entities.filter(e => !e['licenseValidUntil']).length;
          break;
        case 'missingCounty':
          missingCount = entities.filter(e => !e['county']).length;
          break;
        case 'missingBusinessType':
          missingCount = entities.filter(e => !e['businessType']).length;
          break;
        case 'missingOwnership':
          missingCount = entities.filter(e => !e['ownership']).length;
          break;
        case 'missingSuperintendent':
          missingCount = entities.filter(e => !e['superintendentName']).length;
          break;
        case 'missingLocation':
          // Check for actual location data (locationId for premises, or physical address fields)
          // For premises: missing location_id means no normalized location data
          missingCount = entities.filter(e => !e['locationId']).length;
          break;
        case 'missingSupplierMapping':
          missingCount = entities.filter(e => !e['supplierId']).length;
          break;
        default:
          missingCount = 0;
      }

      completeness[metric.key] = missingCount;
      
      const fieldScore = totalRecords > 0 ? ((totalRecords - missingCount) / totalRecords) * metric.weight : 0;
      completenessScore += fieldScore;
    }

    // Calculate complete records (records with ALL critical fields - STRICT)
    // Config-driven approach using completeRecordsFields
    let completeRecordsCount = 0;
    
    if (config.completeRecordsFields) {
      completeRecordsCount = entities.filter(entity => {
        // Check ALL required fields from config
        return config.completeRecordsFields.every(field => {
          // Special cases with business logic
          switch (field) {
            case 'supplierId':
              // Must exist AND not be default value 1
            return entity[field] && entity[field] !== 1;
            
            case 'manufacturers':
              // Array must exist and not be empty
              return entity[field] && Array.isArray(entity[field]) && entity[field].length > 0;
            
            case 'brandName':
              // Check brandName OR brandDisplayName
              return !!(entity['brandName'] || entity['brandDisplayName']);
            
            case 'genericName':
              // Check genericName OR genericDisplayName
              return !!(entity['genericName'] || entity['genericDisplayName']);
            
            case 'strengthAmount':
              // Check strengthAmount OR strengthUnit
              return !!(entity['strengthAmount'] || entity['strengthUnit']);
            
            case 'phoneNumber':
              // Check phoneNumber OR mobileNumber (for practitioners)
              return !!(entity['phoneNumber'] || entity['mobileNumber']);
            
            case 'ownership':
              // Must exist AND not be 'Unknown' (for facilities)
              return entity[field] && entity[field] !== 'Unknown';
            
            case 'latitude':
            case 'longitude':
              // Coordinates must both be present (checked together in facilities)
              if (config.entityName.includes('Facility')) {
                return !!entity['latitude'] && !!entity['longitude'];
              }
              return !!entity[field];
            
            default:
              // Standard field presence check
              return !!entity[field];
          }
        });
      }).length;
    } else {
      // Fallback: Use completeness metrics (legacy approach)
      completeRecordsCount = entities.filter(entity => {
        return config.completenessMetrics.filter(m => m.critical).every(metric => {
          switch (metric.key) {
            case 'missingGtin': return !!entity['gtin'];
            case 'missingManufacturer': return entity['manufacturers'] && Array.isArray(entity['manufacturers']) && entity['manufacturers'].length > 0;
            case 'missingBrandName': return !!(entity['brandName'] || entity['brandDisplayName']);
            case 'missingGenericName': return !!(entity['genericName'] || entity['genericDisplayName']);
            case 'missingPpbCode': return !!entity['ppbRegistrationCode'];
            case 'missingCategory': return !!entity['category'];
            case 'missingStrength': return !!(entity['strengthAmount'] || entity['strengthUnit']);
            case 'missingRoute': return !!entity['routeDescription'];
            case 'missingForm': return !!entity['formDescription'];
            default: return true;
          }
        });
      }).length;
    }

    completeness.completeRecords = completeRecordsCount;
    completeness.completenessPercentage = totalRecords > 0 ? Math.round((completeRecordsCount / totalRecords) * 100 * 100) / 100 : 0;

    // 2. Validity Analysis (config-driven)
    const validity: any = {};
    let validityScore = 0;

    for (const metric of config.validityMetrics) {
      let invalidCount = 0;
      
      switch (metric.key) {
        case 'duplicateGtins': {
          const gtins = entities.filter(e => e['gtin']).map(e => e['gtin']);
          const uniqueGtins = new Set(gtins);
          invalidCount = gtins.length - uniqueGtins.size;
          break;
        }
        case 'invalidGtinFormat':
          invalidCount = entities.filter(e => e['gtin'] && !/^\d{8,14}$/.test(e['gtin'])).length;
          break;
        case 'duplicateProductIds': {
          const ids = entities.map(e => e['etcdProductId']);
          const uniqueIds = new Set(ids);
          invalidCount = ids.length - uniqueIds.size;
          break;
        }
        case 'expiredLicenses': {
          const now = new Date();
          invalidCount = entities.filter(e => e['licenseValidUntil'] && new Date(e['licenseValidUntil']) < now).length;
          break;
        }
        case 'invalidGln':
          invalidCount = entities.filter(e => e['gln'] && !/^\d{13}$/.test(e['gln'])).length;
          break;
        case 'duplicatePremiseIds': {
          const ids = entities.map(e => e['premiseId']);
          const uniqueIds = new Set(ids);
          invalidCount = ids.length - uniqueIds.size;
          break;
        }
        default:
          invalidCount = 0;
      }

      validity[metric.key] = invalidCount;
      
      const fieldScore = totalRecords > 0 ? ((totalRecords - invalidCount) / totalRecords) * metric.weight : 0;
      validityScore += fieldScore;
    }
    
    // 2b. Custom Validity Queries (for complex entity-specific checks like license tracking)
    if (config.customValidityQueries) {
      for (const customQuery of config.customValidityQueries) {
        if (customQuery.value !== undefined) {
          // Use static value
          validity[customQuery.key] = customQuery.value;
        } else {
          // Execute hardcoded queries based on key (can't serialize async functions in config)
          switch (customQuery.key) {
            case 'expiringSoon': {
              // License expires within 30 days from today
              const now = new Date();
              const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              
              this.logger.log(`Checking expiringSoon: ${now.toISOString()} to ${thirtyDaysFromNow.toISOString()}`);
              
              const count = await repository
                .createQueryBuilder('entity')
                .where('entity.licenseValidUntil IS NOT NULL')
                .andWhere('entity.licenseValidUntil BETWEEN :now AND :thirtyDaysFromNow', { 
                  now, 
                  thirtyDaysFromNow 
                })
                .andWhere('entity.isTest IS NOT TRUE')
                .getCount();
              
              this.logger.log(`ExpiringSoon count: ${count}`);
              validity[customQuery.key] = count;
              break;
            }
            case 'validLicenses': {
              // License is currently valid (expires in the future)
              const now = new Date();
              
              this.logger.log(`Checking validLicenses: > ${now.toISOString()}`);
              
              const count = await repository
                .createQueryBuilder('entity')
                .where('entity.licenseValidUntil IS NOT NULL')
                .andWhere('entity.licenseValidUntil > :now', { now })
                .andWhere('entity.isTest IS NOT TRUE')
                .getCount();
              
              this.logger.log(`ValidLicenses count: ${count}`);
              validity[customQuery.key] = count;
              break;
            }
            default:
              validity[customQuery.key] = 0;
          }
        }
      }
    }

    // 2c. Operational Monitoring Metrics (tracked but NOT affecting quality score)
    // These are informational only - e.g., license expiry status, operational alerts
    const monitoring: Record<string, number> = {};
    if (config.monitoringMetrics) {
      for (const metric of config.monitoringMetrics) {
        // Execute monitoring queries based on key (license tracking, operational status)
        switch (metric.key) {
          case 'expiringSoon': {
            // License expires within 30 days from today
            const now = new Date();
            const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            
            this.logger.log(`[Monitoring] Checking expiringSoon: ${now.toISOString()} to ${thirtyDaysFromNow.toISOString()}`);
            
            const count = await repository
              .createQueryBuilder('entity')
              .where('entity.licenseValidUntil IS NOT NULL')
              .andWhere('entity.licenseValidUntil BETWEEN :now AND :thirtyDaysFromNow', { 
                now, 
                thirtyDaysFromNow 
              })
              .andWhere('entity.isTest IS NOT TRUE')
              .getCount();
            
            this.logger.log(`[Monitoring] ExpiringSoon count: ${count}`);
            monitoring[metric.key] = count;
            break;
          }
          case 'expiredLicenses': {
            // License has already expired
            const now = new Date();
            
            this.logger.log(`[Monitoring] Checking expiredLicenses: < ${now.toISOString()}`);
            
            const count = await repository
              .createQueryBuilder('entity')
              .where('entity.licenseValidUntil IS NOT NULL')
              .andWhere('entity.licenseValidUntil < :now', { now })
              .andWhere('entity.isTest IS NOT TRUE')
              .getCount();
            
            this.logger.log(`[Monitoring] ExpiredLicenses count: ${count}`);
            monitoring[metric.key] = count;
            break;
          }
          case 'validLicenses': {
            // License is currently valid (expires in the future)
            const now = new Date();
            
            this.logger.log(`[Monitoring] Checking validLicenses: > ${now.toISOString()}`);
            
            const count = await repository
              .createQueryBuilder('entity')
              .where('entity.licenseValidUntil IS NOT NULL')
              .andWhere('entity.licenseValidUntil > :now', { now })
              .andWhere('entity.isTest IS NOT TRUE')
              .getCount();
            
            this.logger.log(`[Monitoring] ValidLicenses count: ${count}`);
            monitoring[metric.key] = count;
            break;
          }
          default:
            monitoring[metric.key] = 0;
        }
      }
    }

    // 3. Get last sync timestamp
    // Try different field names: lastSyncedAt (product), last_updated (premise), lastUpdated
    let lastSynced = null;
    const timestampFields = ['lastSyncedAt', 'lastUpdated', 'last_updated'];
    
    for (const field of timestampFields) {
      try {
        const metadata = this.dataSource.getMetadata(config.tableName);
        if (metadata.columns.find(col => col.propertyName === field || col.databaseName === field)) {
          lastSynced = await repository
            .createQueryBuilder('entity')
            .select(`MAX(entity.${field})`, 'lastSync')
            .where('entity.isTest IS NOT TRUE')
            .getRawOne();
          break;
        }
      } catch (err) {
        continue;
      }
    }

    // 4. Calculate timeliness score
    const { score: timelinessScore, hoursSinceSync } = await this.calculateTimelinessScore(
      entityType,
      lastSynced?.lastSync
    );

    // 5. Generate distribution analysis
    const distribution = await this.generateDistributionAnalysis(entityType, repository);

    // 6. Calculate overall score using configured weights
    const weights = config.scoringWeights || {
      completeness: 0.5,
      validity: 0.5,
      consistency: 0,
      timeliness: 0,
    };

    const totalWeight =
      config.completenessMetrics.reduce((sum, m) => sum + m.weight, 0) +
      config.validityMetrics.reduce((sum, m) => sum + m.weight, 0);

    const normalizedCompletenessScore = totalWeight > 0 ? (completenessScore / totalWeight) * 100 : 0;
    const normalizedValidityScore = totalWeight > 0 ? (validityScore / totalWeight) * 100 : 0;

    // STRICT LOGIC: Use completenessPercentage (record-level) instead of normalizedCompletenessScore (field-level)
    // This better reflects that records missing ANY critical fields are unusable
    const dataQualityScore =
      completeness.completenessPercentage * weights.completeness +
      normalizedValidityScore * weights.validity +
      100 * weights.consistency + // Placeholder
      timelinessScore * weights.timeliness;

    // 7. Generate recommendations (enhanced with timeliness)
    const recommendations = this.generateRecommendations(
      config,
      completeness,
      validity,
      totalRecords,
      hoursSinceSync
    );

    // 8. Build issues array for alerts (enhanced with timeliness)
    const issues = this.buildIssuesArray(
      config,
      completeness,
      validity,
      hoursSinceSync
    );

    // Calculate consistency score (currently placeholder)
    // TODO: Implement actual consistency checks based on config.consistencyMetrics
    const consistencyScore = 100; // Placeholder - assumes no consistency issues

    return {
      overview: {
        totalRecords,
        lastSyncDate: lastSynced?.lastSync || null,
        dataQualityScore: Math.round(dataQualityScore * 100) / 100,
        generatedAt: new Date(),
      },
      completeness,
      validity,
      monitoring, // NEW: Operational monitoring metrics (license status, etc.)
      distribution,
      issues,
      recommendations,
      scores: {
        completeness: Math.round(completeness.completenessPercentage * 100) / 100,
        validity: Math.round(normalizedValidityScore * 100) / 100,
        consistency: Math.round(consistencyScore * 100) / 100,
        timeliness: Math.round(timelinessScore * 100) / 100,
      },
    };
  }

  private generateRecommendations(
    config: any,
    completeness: any,
    validity: any,
    total: number,
    hoursSinceSync: number = 0
  ): string[] {
    const recommendations: string[] = [];

    // Timeliness recommendations
    if (config.timelinessConfig && hoursSinceSync > 0) {
      const thresholds = config.timelinessConfig.thresholds;
      // Find the worst threshold exceeded
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (hoursSinceSync >= thresholds[i].hours) {
          const days = Math.round(hoursSinceSync / 24);
          recommendations.push(
            `Data is stale - last sync was ${days} days ago (expected: ${config.timelinessConfig.syncFrequency})`
          );
          break;
        }
      }
    }

    // Critical completeness issues
    for (const metric of config.completenessMetrics) {
      if (metric.critical && completeness[metric.key] > total * 0.1) {
        recommendations.push(
          `CRITICAL: ${metric.label} - ${completeness[metric.key]} records (${Math.round((completeness[metric.key] / total) * 100)}%)`
        );
      }
    }

    // Validity issues
    for (const metric of config.validityMetrics) {
      if (validity[metric.key] > 0) {
        recommendations.push(`${metric.label}: ${validity[metric.key]} invalid records`);
      }
    }

    return recommendations;
  }

  private buildIssuesArray(
    config: any,
    completeness: any,
    validity: any,
    hoursSinceSync: number = 0
  ): any[] {
    const issues: any[] = [];

    // Add timeliness issues
    if (config.timelinessConfig && hoursSinceSync > 0) {
      const thresholds = config.timelinessConfig.thresholds;
      const days = Math.round(hoursSinceSync / 24);

      // Determine severity based on thresholds
      if (hoursSinceSync >= thresholds[thresholds.length - 2]?.hours) {
        issues.push({
          severity: 'high',
          description: `Data is critically stale - last sync was ${days} days ago (expected: ${config.timelinessConfig.syncFrequency})`,
          count: 0,
          category: 'Timeliness',
        });
      } else if (hoursSinceSync >= thresholds[thresholds.length - 3]?.hours) {
        issues.push({
          severity: 'medium',
          description: `Data is stale - last sync was ${days} days ago (expected: ${config.timelinessConfig.syncFrequency})`,
          count: 0,
          category: 'Timeliness',
        });
      } else if (hoursSinceSync >= thresholds[1]?.hours) {
        issues.push({
          severity: 'low',
          description: `Data sync delayed - last sync was ${days} days ago (expected: ${config.timelinessConfig.syncFrequency})`,
          count: 0,
          category: 'Timeliness',
        });
      }
    }

    // Add completeness issues
    for (const metric of config.completenessMetrics) {
      if (completeness[metric.key] > 0) {
        issues.push({
          severity: metric.critical ? 'high' : 'medium',
          description: metric.label,
          count: completeness[metric.key],
          category: 'Completeness',
        });
      }
    }

    // Add validity issues
    for (const metric of config.validityMetrics) {
      if (validity[metric.key] > 0) {
        issues.push({
          severity: 'high',
          description: metric.label,
          count: validity[metric.key],
          category: 'Data Integrity',
        });
      }
    }

    return issues;
  }

  /**
   * Calculate timeliness score based on last sync timestamp
   * Config-driven thresholds for different entity types
   */
  private async calculateTimelinessScore(
    entity_type: string,
    lastSyncDate: Date | null
  ): Promise<{ score: number; hoursSinceSync: number }> {
    const config = getQualityAuditConfig(entityType);
    
    if (!config.timelinessConfig || !lastSyncDate) {
      return { score: 0, hoursSinceSync: 0 };
    }

    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

    // Find matching threshold from config
    for (const threshold of config.timelinessConfig.thresholds) {
      if (hoursSinceSync < threshold.hours) {
        return { score: threshold.score, hoursSinceSync };
      }
    }

    // If no threshold matched, return lowest score
    return { score: 0, hoursSinceSync };
  }

  /**
   * Generate distribution analysis for entity type
   * Supports both boolean and categorical fields
   */
  private async generateDistributionAnalysis(
    entity_type: string,
    repository: any
  ): Promise<any> {
    const config = getQualityAuditConfig(entityType);
    
    if (!config.distributionQueries) {
      return {};
    }

    const distributions: any = {};

    for (const dist of config.distributionQueries) {
      try {
        if (dist.type === 'boolean') {
          // Handle boolean fields (e.g., kemlIsOnKeml)
          const trueCount = await repository
            .createQueryBuilder('entity')
            .where(`entity.${dist.field} = :value`, { value: true })
            .andWhere('entity.isTest IS NOT TRUE')
            .getCount();

          const total = await repository
            .createQueryBuilder('entity')
            .where('entity.isTest IS NOT TRUE')
            .getCount();

          distributions[dist.key] = {
            onKeml: trueCount,
            notOnKeml: total - trueCount,
          };
        } else {
          // Handle categorical fields (e.g., category, levelOfUse)
          const queryBuilder = repository
            .createQueryBuilder('entity')
            .select(`entity.${dist.field}`, 'value')
            .addSelect('COUNT(*)', 'count')
            .where(`entity.${dist.field} IS NOT NULL`)
            .andWhere('entity.isTest IS NOT TRUE');

          // Apply additional filters if specified
          if (dist.filter) {
            Object.entries(dist.filter).forEach(([key, val]) => {
              queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: val });
            });
          }

          const results = await queryBuilder
            .groupBy(`entity.${dist.field}`)
            .orderBy('count', 'DESC')
            .getRawMany();

          distributions[dist.key] = results;
        }
      } catch (error) {
        this.logger.error(`Error generating distribution for ${dist.key}:`, error);
        distributions[dist.key] = [];
      }
    }

    return distributions;
  }
}
