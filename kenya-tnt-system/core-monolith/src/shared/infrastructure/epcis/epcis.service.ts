import { Injectable, Logger } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import {
  IEPCISAdapter,
  EPCISDocument,
  CaptureResponse,
  EPCISQuery,
  EPCISQueryDocument,
  EPCISEvent,
  QueryOptions,
} from './epcis-adapter.interface';
import { EPCISServiceFactory } from './epcis-service.factory';

/**
 * EPCIS Service
 *
 * This service provides a unified interface to interact with EPCIS services
 * regardless of the underlying provider (OpenEPCIS or vendor solution).
 *
 * The service uses the adapter pattern to support multiple EPCIS providers.
 * Switch providers by changing the EPCIS_ADAPTER_TYPE environment variable.
 */
@Injectable()
export class EPCISService {
  private readonly logger = new Logger(EPCISService.name);
  private adapter: IEPCISAdapter;

  constructor(private readonly factory: EPCISServiceFactory) {
    this.adapter = this.factory.createAdapter();
    this.logger.log('EPCIS Service initialized');
  }

  /**
   * Capture a single EPCIS event
   */
  async captureEvent(document: EPCISDocument): Promise<CaptureResponse> {
    return this.adapter.captureEvent(document);
  }

  /**
   * Capture multiple EPCIS events
   */
  async captureEvents(
    documents: EPCISDocument[],
  ): Promise<CaptureResponse[]> {
    return this.adapter.captureEvents(documents);
  }

  /**
   * Query EPCIS events with filters
   */
  async queryEvents(query: EPCISQuery): Promise<EPCISQueryDocument> {
    return this.adapter.queryEvents(query);
  }

  /**
   * Get a specific event by its ID
   */
  async getEventById(eventId: string): Promise<EPCISEvent> {
    return this.adapter.getEventById(eventId);
  }

  /**
   * Get all events for a specific EPC
   */
  async getEventsByEPC(
    epc: string,
    options?: QueryOptions,
  ): Promise<EPCISEvent[]> {
    return this.adapter.getEventsByEPC(epc, options);
  }

  /**
   * Check if the EPCIS service is healthy
   */
  async healthCheck(): Promise<boolean> {
    return this.adapter.healthCheck();
  }
}

