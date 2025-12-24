import { Injectable, Logger } from '@nestjs/common';
import { QUALITY_ALERT_CONFIGS, getAlertSeverity, shouldTriggerAlert, QualityAlertConfig } from './quality-alert.config';

/**
 * Quality Alert Service
 * Monitors data quality scores and triggers alerts when thresholds are crossed
 */
@Injectable()
export class QualityAlertService {
  private readonly logger = new Logger(QualityAlertService.name);

  /**
   * Check quality score and trigger alerts if needed
   */
  async checkAndAlert(
    entity_type: string,
    score: number,
    metadata: {
      totalRecords: number;
      auditId: number;
      triggeredBy: string;
      lastSync?: Date;
      issues?: any[];
    }
  ): Promise<void> {
    const config = QUALITY_ALERT_CONFIGS[entityType];
    
    if (!config || !config.enabled) {
      this.logger.debug(`Alerts disabled for ${entityType}`);
      return;
    }

    if (!shouldTriggerAlert(score, config)) {
      this.logger.debug(`Score ${score} is above alert threshold for ${entityType}`);
      return;
    }

    const severity = getAlertSeverity(score, config);
    this.logger.warn(
      `🚨 Quality alert triggered for ${entityType}: Score ${score}/100 (${severity.toUpperCase()})`
    );

    // Send alerts through enabled channels
    for (const channel of config.channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendAlert(channel.type, {
          entityType,
          score,
          severity,
          metadata,
          config: channel.config,
        });
      } catch (error) {
        this.logger.error(`Failed to send ${channel.type} alert for ${entityType}:`, error);
      }
    }
  }

  /**
   * Send alert through specific channel
   */
  private async sendAlert(
    type: 'email' | 'webhook' | 'slack' | 'sms',
    payload: any
  ): Promise<void> {
    switch (type) {
      case 'email':
        await this.sendEmailAlert(payload);
        break;
      case 'webhook':
        await this.sendWebhookAlert(payload);
        break;
      case 'slack':
        await this.sendSlackAlert(payload);
        break;
      case 'sms':
        await this.sendSmsAlert(payload);
        break;
      default:
        this.logger.warn(`Unknown alert channel type: ${type}`);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(payload: any): Promise<void> {
    const { entityType, score, severity, metadata, config } = payload;
    
    this.logger.log(`📧 Sending email alert to ${config.recipients?.join(', ')}`);
    
    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
    // For now, just log
    const emailContent = this.buildEmailContent(entityType, score, severity, metadata);
    this.logger.log(`Email content:\n${emailContent}`);
    
    // Simulate email send
    // await emailService.send({
    //   to: config.recipients,
    //   subject: `[${severity.toUpperCase()}] ${entityType} Data Quality Alert - Score: ${score}/100`,
    //   body: emailContent,
    // });
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(payload: any): Promise<void> {
    const { entityType, score, severity, metadata, config } = payload;
    
    if (!config.webhookUrl) {
      this.logger.warn('Webhook URL not configured');
      return;
    }

    this.logger.log(`🔗 Sending webhook alert to ${config.webhookUrl}`);
    
    // TODO: Send HTTP POST to webhook URL
    // const webhookPayload = {
    //   event: 'quality_alert',
    //   entityType,
    //   score,
    //   severity,
    //   timestamp: new Date().toISOString(),
    //   metadata,
    // };
    // await fetch(config.webhookUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(webhookPayload),
    // });
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(payload: any): Promise<void> {
    const { entityType, score, severity } = payload;
    this.logger.log(`💬 Slack alert for ${entityType}: Score ${score} (${severity})`);
    // TODO: Integrate with Slack webhook
  }

  /**
   * Send SMS alert
   */
  private async sendSmsAlert(payload: any): Promise<void> {
    const { entityType, score, severity } = payload;
    this.logger.log(`📱 SMS alert for ${entityType}: Score ${score} (${severity})`);
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
  }

  /**
   * Build email content
   */
  private buildEmailContent(
    entity_type: string,
    score: number,
    severity: string,
    metadata: any
  ): string {
    const emoji = severity === 'critical' ? '🔴' : severity === 'warning' ? '⚠️' : 'ℹ️';
    
    return `
${emoji} DATA QUALITY ALERT - ${severity.toUpperCase()}

Entity: ${entityType.toUpperCase()}
Quality Score: ${score}/100
Total Records: ${metadata.totalRecords?.toLocaleString() || 'N/A'}
Audit ID: ${metadata.auditId}
Triggered By: ${metadata.triggeredBy}
Last Sync: ${metadata.lastSync ? new Date(metadata.lastSync).toLocaleString() : 'N/A'}

${metadata.issues && metadata.issues.length > 0 ? `
Top Issues:
${metadata.issues.slice(0, 5).map((issue: any, idx: number) => 
  `${idx + 1}. [${issue.severity?.toUpperCase()}] ${issue.description} (${issue.count})`
).join('\n')}
` : ''}

Action Required:
${severity === 'critical' 
  ? '⚠️ IMMEDIATE ACTION REQUIRED - Quality score critically low'
  : severity === 'warning'
  ? '⚠️ Review and address data quality issues'
  : 'ℹ️ Monitor and plan improvements'}

View detailed report: http://localhost:3002/regulator/${entityType}s

---
Kenya Track & Trace System - Automated Quality Monitoring
    `.trim();
  }
}
