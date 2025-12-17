import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  IEPCISAdapter,
  EPCISAdapterConfig,
  EPCISDocument,
  CaptureResponse,
  EPCISQuery,
  EPCISQueryDocument,
  EPCISEvent,
  QueryOptions,
} from './epcis-adapter.interface';
import { AxiosRequestConfig } from 'axios';

@Injectable()
export class OpenEPCISAdapter implements IEPCISAdapter {
  private readonly logger = new Logger(OpenEPCISAdapter.name);
  private config: EPCISAdapterConfig;

  constructor(private readonly httpService: HttpService) {
    this.config = {
      baseUrl: 'http://localhost:8084',
      authType: 'none',
      timeout: 30000,
    };
  }

  configure(config: EPCISAdapterConfig): void {
    this.config = { ...this.config, ...config };
    // Ensure trailing slash
    if (!this.config.baseUrl.endsWith('/')) {
      this.config.baseUrl = `${this.config.baseUrl}/`;
    }
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/ld+json',
    };

    switch (this.config.authType) {
      case 'basic':
        if (this.config.apiKey && this.config.apiSecret) {
          const credentials = Buffer.from(
            `${this.config.apiKey}:${this.config.apiSecret}`,
          ).toString('base64');
          headers['Authorization'] = `Basic ${credentials}`;
        }
        break;
      case 'bearer':
        if (this.config.apiKey) {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }
        break;
      case 'api-key':
        if (this.config.apiKey) {
          headers['X-API-Key'] = this.config.apiKey;
        }
        break;
      case 'none':
      default:
        // No authentication
        break;
    }

    return headers;
  }

  async captureEvent(document: EPCISDocument): Promise<CaptureResponse> {
    try {
      const headers = this.buildHeaders();
      const requestConfig: AxiosRequestConfig = {
        headers,
        timeout: this.config.timeout || 30000,
      };

      // OpenEPCIS uses /capture endpoint for capturing events (not /events)
      const endpoint = `${this.config.baseUrl}capture`;
      this.logger.debug(`Posting EPCIS event to: ${endpoint}`);
      
      const response = await firstValueFrom(
        this.httpService.post(
          endpoint,
          document,
          requestConfig,
        ),
      );

      this.logger.log('EPCIS event captured successfully');
      return {
        success: true,
        eventIds: document.epcisBody.eventList.map((e) => e.eventID),
      };
    } catch (error: any) {
      this.logger.error(
        'Failed to capture EPCIS event',
        error?.response?.data ?? error?.message,
      );
      return {
        success: false,
        errors: [error?.response?.data?.message || error?.message || 'Unknown error'],
      };
    }
  }

  async captureEvents(
    documents: EPCISDocument[],
  ): Promise<CaptureResponse[]> {
    return Promise.all(documents.map((doc) => this.captureEvent(doc)));
  }

  async queryEvents(query: EPCISQuery): Promise<EPCISQueryDocument> {
    try {
      const headers = this.buildHeaders();
      const params = new URLSearchParams();

      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      const requestConfig: AxiosRequestConfig = {
        headers,
        params,
        timeout: this.config.timeout || 30000,
      };

      const response = await firstValueFrom(
        this.httpService.get(`${this.config.baseUrl}events`, requestConfig),
      );

      return response.data as EPCISQueryDocument;
    } catch (error: any) {
      this.logger.error(
        'Failed to query EPCIS events',
        error?.response?.data ?? error?.message,
      );
      throw new Error(
        `EPCIS query failed: ${error?.response?.data?.message || error?.message}`,
      );
    }
  }

  async getEventById(eventId: string): Promise<EPCISEvent> {
    try {
      const headers = this.buildHeaders();
      const requestConfig: AxiosRequestConfig = {
        headers,
        timeout: this.config.timeout || 30000,
      };

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.config.baseUrl}events/${eventId}`,
          requestConfig,
        ),
      );

      // Extract event from response (assuming it returns EPCISDocument)
      const document = response.data as EPCISQueryDocument;
      if (document.epcisBody?.eventList?.length > 0) {
        return document.epcisBody.eventList[0];
      }

      throw new Error(`Event with ID ${eventId} not found`);
    } catch (error: any) {
      this.logger.error(
        `Failed to get event by ID: ${eventId}`,
        error?.response?.data ?? error?.message,
      );
      throw new Error(
        `Failed to get event: ${error?.response?.data?.message || error?.message}`,
      );
    }
  }

  async getEventsByEPC(
    epc: string,
    options?: QueryOptions,
  ): Promise<EPCISEvent[]> {
    try {
      const query: EPCISQuery = {
        EQ_epc: epc,
      };

      if (options?.limit) {
        query.limit = options.limit;
      }

      const document = await this.queryEvents(query);
      return document.epcisBody?.eventList || [];
    } catch (error: any) {
      this.logger.error(
        `Failed to get events by EPC: ${epc}`,
        error?.response?.data ?? error?.message,
      );
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const headers = this.buildHeaders();
      const requestConfig: AxiosRequestConfig = {
        headers,
        timeout: 5000, // Short timeout for health check
      };

      await firstValueFrom(
        this.httpService.get(`${this.config.baseUrl}health`, requestConfig),
      );
      return true;
    } catch (error: any) {
      this.logger.warn('EPCIS service health check failed', error?.message);
      return false;
    }
  }
}

