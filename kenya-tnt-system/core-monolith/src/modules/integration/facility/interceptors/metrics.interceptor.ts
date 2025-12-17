import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// Simple in-memory metrics (can be extended to Prometheus)
export interface FacilityMetrics {
  requestsTotal: number;
  requestsSuccess: number;
  requestsError: number;
  epcisEventsCaptured: number;
  epcisEventsFailed: number;
  averageResponseTime: number;
  receivedEvents: number;
  consumedEvents: number;
}

@Injectable()
export class FacilityMetricsInterceptor implements NestInterceptor {
  private metrics: FacilityMetrics = {
    requestsTotal: 0,
    requestsSuccess: 0,
    requestsError: 0,
    epcisEventsCaptured: 0,
    epcisEventsFailed: 0,
    averageResponseTime: 0,
    receivedEvents: 0,
    consumedEvents: 0,
  };

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    this.metrics.requestsTotal++;

    const request = context.switchToHttp().getRequest();
    const url = request.url;

    return next.handle().pipe(
      tap({
        next: () => {
          this.metrics.requestsSuccess++;
          this.updateAverageResponseTime(Date.now() - startTime);
          
          // Track event types
          if (url.includes('received')) {
            this.metrics.receivedEvents++;
          } else if (url.includes('consumed')) {
            this.metrics.consumedEvents++;
          }
        },
        error: () => {
          this.metrics.requestsError++;
          this.updateAverageResponseTime(Date.now() - startTime);
        },
      }),
    );
  }

  getMetrics(): FacilityMetrics {
    return { ...this.metrics };
  }

  recordEPCISEvent(success: boolean) {
    if (success) {
      this.metrics.epcisEventsCaptured++;
    } else {
      this.metrics.epcisEventsFailed++;
    }
  }

  private updateAverageResponseTime(duration: number) {
    const total = this.metrics.requestsSuccess + this.metrics.requestsError;
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (total - 1) + duration) / total;
  }
}

