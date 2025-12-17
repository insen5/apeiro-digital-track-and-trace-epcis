import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class FacilityLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('FacilityIntegration');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const startTime = Date.now();
    const requestId = headers['x-request-id'] || `req-${Date.now()}`;
    const facilityId = headers['x-facility-id'] || request.facilityId || 'unknown';
    const apiKey = headers['x-api-key'] ? `${headers['x-api-key'].substring(0, 10)}...` : 'none';

    // Log incoming request with full details
    this.logger.log(
      `[${requestId}] 📥 INCOMING REQUEST\n` +
      `  Method: ${method}\n` +
      `  URL: ${url}\n` +
      `  Facility ID: ${facilityId}\n` +
      `  API Key: ${apiKey}\n` +
      `  Request Body: ${JSON.stringify(body, null, 2)}`,
    );

    // Log important headers (excluding sensitive data)
    const importantHeaders = {
      'content-type': headers['content-type'],
      'user-agent': headers['user-agent'],
      'x-facility-id': headers['x-facility-id'],
      'x-forwarded-for': headers['x-forwarded-for'],
      'x-forwarded-proto': headers['x-forwarded-proto'],
    };
    this.logger.debug(
      `[${requestId}] 📋 Request Headers: ${JSON.stringify(importantHeaders, null, 2)}`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          
          // Log successful response with full details
          this.logger.log(
            `[${requestId}] 📤 SUCCESS RESPONSE (${duration}ms)\n` +
            `  Method: ${method}\n` +
            `  URL: ${url}\n` +
            `  Facility ID: ${facilityId}\n` +
            `  Duration: ${duration}ms\n` +
            `  Response Body: ${JSON.stringify(data, null, 2)}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          
          // Log error with full details
          this.logger.error(
            `[${requestId}] ❌ ERROR RESPONSE (${duration}ms)\n` +
            `  Method: ${method}\n` +
            `  URL: ${url}\n` +
            `  Facility ID: ${facilityId}\n` +
            `  Duration: ${duration}ms\n` +
            `  Error Message: ${error.message}\n` +
            `  Error Details: ${JSON.stringify(error.response || error, null, 2)}`,
          );
          
          // Log stack trace separately for better readability
          if (error.stack) {
            this.logger.error(
              `[${requestId}] 📚 Stack Trace:\n${error.stack}`,
            );
          }
        },
      }),
    );
  }
}

