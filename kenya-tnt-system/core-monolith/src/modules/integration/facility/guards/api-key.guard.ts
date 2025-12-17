import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    const facilityId = request.headers['x-facility-id'];

    if (!apiKey) {
      this.logger.warn('API key missing in request');
      throw new UnauthorizedException('API key required. Please provide X-API-Key header.');
    }

    // Validate API key (from config or database)
    // For now, using environment variable. Can be extended to database lookup
    const validApiKeys = this.configService
      .get<string>('FACILITY_API_KEYS', '')
      .split(',')
      .filter(Boolean);

    // If no API keys configured, allow all (for development)
    // In production, this should be enforced
    if (validApiKeys.length === 0) {
      this.logger.warn(
        'No FACILITY_API_KEYS configured. Allowing request (development mode).',
      );
      request.facilityId = facilityId;
      return true;
    }

    if (!validApiKeys.includes(apiKey)) {
      this.logger.warn(`Invalid API key attempt from facility: ${facilityId}`);
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach facility ID to request for logging/metrics
    request.facilityId = facilityId;
    return true;
  }
}

