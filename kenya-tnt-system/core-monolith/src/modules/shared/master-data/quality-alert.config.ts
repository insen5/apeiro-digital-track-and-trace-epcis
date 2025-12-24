/**
 * Quality Alert Configuration
 * Defines thresholds and notification settings for data quality monitoring
 */

export interface QualityAlertThreshold {
  critical: number; // Score below this = critical alert (red)
  warning: number;  // Score below this = warning alert (yellow)
  info: number;     // Score below this = info alert (blue)
}

export interface QualityAlertChannel {
  type: 'email' | 'webhook' | 'slack' | 'sms';
  enabled: boolean;
  config: {
    recipients?: string[]; // For email/SMS
    webhookUrl?: string;   // For webhook/Slack
    template?: string;     // Custom message template
  };
}

export interface QualityAlertConfig {
  entity_type: string;
  thresholds: QualityAlertThreshold;
  channels: QualityAlertChannel[];
  checkFrequency: string; // e.g., 'on-sync', 'hourly', 'daily'
  enabled: boolean;
}

export const QUALITY_ALERT_CONFIGS: Record<string, QualityAlertConfig> = {
  product: {
    entity_type: 'product',
    thresholds: {
      critical: 50,  // Score < 50 = CRITICAL
      warning: 70,   // Score < 70 = WARNING
      info: 80,      // Score < 80 = INFO
    },
    channels: [
      {
        type: 'email',
        enabled: true,
        config: {
          recipients: [
            'data-quality@ppb.go.ke',
            'supply-chain@moh.go.ke',
          ],
          template: 'product-quality-alert',
        },
      },
      {
        type: 'webhook',
        enabled: false,
        config: {
          webhookUrl: process.env.QUALITY_ALERT_WEBHOOK_URL,
        },
      },
    ],
    checkFrequency: 'on-sync',
    enabled: true,
  },
  
  premise: {
    entity_type: 'premise',
    thresholds: {
      critical: 55,
      warning: 70,
      info: 80,
    },
    channels: [
      {
        type: 'email',
        enabled: true,
        config: {
          recipients: [
            'data-quality@ppb.go.ke',
            'premise-registry@ppb.go.ke',
          ],
          template: 'premise-quality-alert',
        },
      },
    ],
    checkFrequency: 'on-sync',
    enabled: true,
  },
  
  facility: {
    entity_type: 'facility',
    thresholds: {
      critical: 50,
      warning: 70,
      info: 80,
    },
    channels: [
      {
        type: 'email',
        enabled: true,
        config: {
          recipients: [
            'data-quality@ppb.go.ke',
            'facility-registry@moh.go.ke',
          ],
          template: 'facility-quality-alert',
        },
      },
    ],
    checkFrequency: 'on-sync',
    enabled: true,
  },
};

export function getAlertSeverity(score: number, config: QualityAlertConfig): 'critical' | 'warning' | 'info' | 'normal' {
  if (score < config.thresholds.critical) return 'critical';
  if (score < config.thresholds.warning) return 'warning';
  if (score < config.thresholds.info) return 'info';
  return 'normal';
}

export function shouldTriggerAlert(score: number, config: QualityAlertConfig): boolean {
  return score < config.thresholds.info;
}
