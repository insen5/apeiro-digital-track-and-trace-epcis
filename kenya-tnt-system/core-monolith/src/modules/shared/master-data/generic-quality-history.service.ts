import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';

/**
 * Generic Quality History Service
 * Handles quality report history, retrieval, and trends for any entity type
 * Eliminates duplicate methods across Product, Premise, and Facility quality reports
 */

export interface QualityHistoryConfig {
  entityType: string;
  repository: Repository<any>;
  dateField: string; // 'reportDate' or 'auditDate'
  scoreField: string; // 'dataQualityScore' or 'overallQualityScore'
}

@Injectable()
export class GenericQualityHistoryService {
  private readonly logger = new Logger(GenericQualityHistoryService.name);

  /**
   * Get quality report history (paginated)
   * Replaces: getQualityReportHistory, getProductQualityReportHistory, getUatFacilityQualityHistory
   */
  async getHistory(config: QualityHistoryConfig, limit: number = 50): Promise<any[]> {
    try {
      const reports = await config.repository.find({
        order: { [config.dateField]: 'DESC' },
        take: limit,
      });
      return reports || [];
    } catch (error) {
      this.logger.error(`Failed to fetch ${config.entityType} quality report history:`, error);
      return [];
    }
  }

  /**
   * Get quality report by ID
   * Replaces: getQualityReportById, getProductQualityReportById, getUatFacilityQualityHistoryById
   */
  async getById(config: QualityHistoryConfig, id: number): Promise<any> {
    return await config.repository.findOne({
      where: { id },
    });
  }

  /**
   * Get quality score trend over time
   * Replaces: getQualityScoreTrend, getProductQualityScoreTrend, getUatFacilityQualityScoreTrend
   */
  async getScoreTrend(
    config: QualityHistoryConfig,
    days: number = 30
  ): Promise<{ date: string; score: number }[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const reports = await config.repository
        .createQueryBuilder('report')
        .select(`report.${config.dateField}`, 'date')
        .addSelect(`report.${config.scoreField}`, 'score')
        .where(`report.${config.dateField} >= :since`, { since })
        .orderBy(`report.${config.dateField}`, 'ASC')
        .getRawMany();

      return reports.map((r) => ({
        date: r.date,
        score: parseFloat(r.score),
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch ${config.entityType} quality score trend:`, error);
      return [];
    }
  }
}
