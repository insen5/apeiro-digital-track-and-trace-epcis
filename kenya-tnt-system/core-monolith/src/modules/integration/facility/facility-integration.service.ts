import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EPCISEventService } from '../../../shared/gs1/epcis-event.service';
import { GS1Service } from '../../../shared/gs1/gs1.service';
import {
  createBizTransaction,
  createQuantity,
  createSourceDestination,
  SourceDestinationType,
  UnitOfMeasure,
} from '../../../shared/gs1/gs1.service';
import { MasterDataService } from '../../shared/master-data/master-data.service';
import {
  ReceivedEventDto,
  ConsumedEventDto,
  ProductIdentifierDto,
} from './dto/facility-event.dto';
import {
  LMISEventDto,
  LMISEventType,
  DispenseEventDto,
  ReceiveEventDto,
  AdjustEventDto,
  StockCountEventDto,
  ReturnEventDto,
  RecallEventDto,
} from './dto/lmis-event.dto';
import { FacilityMetricsInterceptor } from './interceptors/metrics.interceptor';

@Injectable()
export class FacilityIntegrationService {
  private readonly logger = new Logger(FacilityIntegrationService.name);
  private readonly MAX_RETRIES = 8;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second

  constructor(
    private readonly epcisEventService: EPCISEventService,
    private readonly gs1Service: GS1Service,
    private readonly masterDataService: MasterDataService,
    private readonly metricsInterceptor: FacilityMetricsInterceptor,
  ) {}

  /**
   * Send EPCIS event with retry logic (exponential backoff)
   */
  private async sendEPCISEventWithRetry<T>(
    eventFn: () => Promise<T>,
    eventType: string,
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const result = await eventFn();
        this.metricsInterceptor.recordEPCISEvent(true);
        if (attempt > 0) {
          this.logger.log(
            `EPCIS event ${eventType} succeeded after ${attempt} retries`,
          );
        }
        return result;
      } catch (error: any) {
        lastError = error;
        this.metricsInterceptor.recordEPCISEvent(false);
        
        if (attempt < this.MAX_RETRIES) {
          const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          this.logger.warn(
            `EPCIS event ${eventType} failed (attempt ${attempt + 1}/${this.MAX_RETRIES + 1}). Retrying in ${delay}ms...`,
            error.message,
          );
          await this.sleep(delay);
        } else {
          this.logger.error(
            `EPCIS event ${eventType} failed after ${this.MAX_RETRIES + 1} attempts`,
            error.stack,
          );
        }
      }
    }
    
    throw lastError!;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle product received event from FLMIS
   * Creates EPCIS AggregationEvent with bizStep='receiving'
   */
  async handleProductReceived(dto: ReceivedEventDto): Promise<void> {
    this.logger.log(`Processing received event: ${dto.event_id}`);

    // Validate and transform products
    const childEPCs: string[] = [];
    const parentSSCC = dto.shipment_sscc;

    for (const product of dto.products) {
      // Validate GTIN exists in catalog
      const catalogProduct = await this.masterDataService.findByGTIN(product.gtin);
      if (!catalogProduct) {
        throw new BadRequestException(
          `Product with GTIN ${product.gtin} not found in catalog`,
        );
      }

      // Build child EPCs based on what's provided
      if (product.serial_numbers && product.serial_numbers.length > 0) {
        // Unit-level tracking: Create SGTINs for serial numbers
        for (const serial of product.serial_numbers) {
          const sgtin = this.gs1Service.generateSGTIN({
            gtin: product.gtin,
            serial_number: serial,
          });
          childEPCs.push(`urn:epc:id:sgtin:${sgtin}`);
        }
      } else if (product.batch_no) {
        // Batch-level tracking: Use batch EPC
        const batchEPC = this.gs1Service.formatBatchNumberAsEPCURI(product.batch_no);
        childEPCs.push(batchEPC);
      } else if (product.sscc) {
        // Container-level tracking: Use SSCC
        if (this.gs1Service.validateSSCC(product.sscc)) {
          const ssccEPC = this.gs1Service.formatSSCCAsEPCURI(product.sscc);
          childEPCs.push(ssccEPC);
        } else {
          throw new BadRequestException(`Invalid SSCC: ${product.sscc}`);
        }
      } else {
        throw new BadRequestException(
          `Product ${product.gtin} must have either serialNumbers, batchNo, or sscc`,
        );
      }
    }

    if (childEPCs.length === 0) {
      throw new BadRequestException('No valid EPCs found in products');
    }

    // Build parent EPC (shipment SSCC or facility location)
    let parentID: string;
    if (parentSSCC && this.gs1Service.validateSSCC(parentSSCC)) {
      parentID = this.gs1Service.formatSSCCAsEPCURI(parentSSCC);
    } else {
      // Fallback to facility location
      parentID = `https://example.com/facilities/${dto.facility_gln}`;
    }

    // Build read point and business location
    const readPoint = dto.read_point
      ? { id: `https://example.com/readpoints/${dto.read_point}` }
      : { id: `https://example.com/facilities/${dto.facility_gln}` };

    const bizLocation = dto.biz_location
      ? { id: `https://example.com/locations/${dto.biz_location}` }
      : { id: `https://example.com/facilities/${dto.facility_gln}` };

    // Build source/destination lists using facility GLN
    const destinationList = [
      createSourceDestination(SourceDestinationType.LOCATION, this.formatGLNAsSGLN(dto.facility_gln)),
    ];

    // Send EPCIS event with retry
    // Note: quantityList not available in legacy ReceivedEventDto (ProductIdentifierDto doesn't have quantity)
    await this.sendEPCISEventWithRetry(
      () =>
        this.epcisEventService.createAggregationEvent(parentID, childEPCs, {
          bizStep: 'receiving',
          disposition: 'active',
          readPoint,
          bizLocation,
          action: 'ADD',
          destinationList,
        }),
      'product_received',
    );

    this.logger.log(
      `Successfully processed received event: ${dto.event_id} - ${childEPCs.length} EPCs`,
    );
  }

  /**
   * Handle product consumed event from FLMIS
   * Creates EPCIS ObjectEvent with bizStep='consuming'
   */
  async handleProductConsumed(dto: ConsumedEventDto): Promise<void> {
    this.logger.log(`Processing consumed event: ${dto.event_id}`);

    // Validate and transform products to EPC list
    const epcList: string[] = [];

    for (const product of dto.products) {
      // Validate GTIN exists in catalog
      const catalogProduct = await this.masterDataService.findByGTIN(product.gtin);
      if (!catalogProduct) {
        throw new BadRequestException(
          `Product with GTIN ${product.gtin} not found in catalog`,
        );
      }

      // Build EPCs based on what's provided
      if (product.serial_numbers && product.serial_numbers.length > 0) {
        // Unit-level tracking: Create SGTINs for serial numbers
        for (const serial of product.serial_numbers) {
          const sgtin = this.gs1Service.generateSGTIN({
            gtin: product.gtin,
            serial_number: serial,
          });
          epcList.push(`urn:epc:id:sgtin:${sgtin}`);
        }
      } else if (product.batch_no) {
        // Batch-level tracking: Use batch EPC
        const batchEPC = this.gs1Service.formatBatchNumberAsEPCURI(product.batch_no);
        epcList.push(batchEPC);
      } else {
        throw new BadRequestException(
          `Product ${product.gtin} must have either serialNumbers or batchNo for consumption tracking`,
        );
      }
    }

    if (epcList.length === 0) {
      throw new BadRequestException('No valid EPCs found in products');
    }

    // Build read point and business location
    const readPoint = dto.read_point
      ? { id: `https://example.com/readpoints/${dto.read_point}` }
      : { id: `https://example.com/facilities/${dto.facility_gln}` };

    const bizLocation = dto.biz_location
      ? { id: `https://example.com/locations/${dto.biz_location}` }
      : { id: `https://example.com/facilities/${dto.facility_gln}` };

    // Build source/destination lists using facility GLN
    const destinationList = [
      createSourceDestination(SourceDestinationType.LOCATION, this.formatGLNAsSGLN(dto.facility_gln)),
    ];

    // Send EPCIS event with retry
    // Note: quantityList not available in legacy ConsumedEventDto (ProductIdentifierDto doesn't have quantity)
    await this.sendEPCISEventWithRetry(
      () =>
        this.epcisEventService.createObjectEvent(epcList, {
          bizStep: 'consuming',
          disposition: 'consumed',
          readPoint,
          bizLocation,
          action: 'OBSERVE',
          destinationList,
        }),
      'product_consumed',
    );

    this.logger.log(
      `Successfully processed consumed event: ${dto.event_id} - ${epcList.length} EPCs`,
    );
  }

  /**
   * Unified handler for all LMIS event types
   * Routes to specific handlers based on event type
   */
  async handleLMISEvent(dto: LMISEventDto): Promise<void> {
    this.logger.log(`Processing LMIS event: ${dto.type}`);

    switch (dto.type) {
      case LMISEventType.DISPENSE:
        return this.handleDispense(dto as DispenseEventDto);
      case LMISEventType.RECEIVE:
        return this.handleReceive(dto as ReceiveEventDto);
      case LMISEventType.ADJUST:
        return this.handleAdjust(dto as AdjustEventDto);
      case LMISEventType.STOCK_COUNT:
        return this.handleStockCount(dto as StockCountEventDto);
      case LMISEventType.RETURN:
        return this.handleReturn(dto as ReturnEventDto);
      case LMISEventType.RECALL:
        return this.handleRecall(dto as RecallEventDto);
      default:
        throw new BadRequestException(`Unsupported event type: ${(dto as any).type}`);
    }
  }

  /**
   * Handle dispense/issue event
   * Creates EPCIS ObjectEvent with bizStep='dispensing'
   */
  private async handleDispense(dto: DispenseEventDto): Promise<void> {
    this.logger.log(`Processing dispense event: ${dto.dispensation_id}`);

    // Validate GTIN
    const catalogProduct = await this.masterDataService.findByGTIN(dto.gtin);
    if (!catalogProduct) {
      throw new BadRequestException(
        `Product with GTIN ${dto.gtin} not found in catalog`,
      );
    }

    // Build EPC list from SGTINs or batch
    const epcList: string[] = [];
    if (dto.identifiers?.sgtins && dto.identifiers.sgtins.length > 0) {
      // Use provided SGTINs (already formatted)
      for (const sgtin of dto.identifiers.sgtins) {
        epcList.push(`urn:epc:id:sgtin:${sgtin}`);
      }
    } else if (dto.batch_number) {
      // Batch-level tracking
      const batchEPC = this.gs1Service.formatBatchNumberAsEPCURI(dto.batch_number);
      epcList.push(batchEPC);
    } else {
      throw new BadRequestException(
        'Dispense event must have either sgtins or batchNumber',
      );
    }

    // Build read point and business location
    const readPoint = this.buildReadPoint(dto.GLN, dto.location);
    const bizLocation = this.buildBizLocation(dto.GLN, dto.location);

    // Extract location coordinates
    const locationCoords = this.getLocationCoordinates(dto.location);

    // Build quantity list
    const quantityList = dto.quantity
      ? [createQuantity(`urn:epc:class:lgtin:${dto.gtin}.${dto.batch_number}`, dto.quantity, UnitOfMeasure.EACH)]
      : undefined;

    // Build business transaction list
    const bizTransactionList = [
      createBizTransaction('DISPENSATION', dto.dispensation_id),
    ];

    // Build source/destination lists using facility GLN
    const destinationList = [
      createSourceDestination(SourceDestinationType.LOCATION, this.formatGLNAsSGLN(dto.GLN)),
    ];

    // Send EPCIS event
    await this.sendEPCISEventWithRetry(
      () =>
        this.epcisEventService.createObjectEvent(epcList, {
          bizStep: 'dispensing',
          disposition: 'dispensed',
          readPoint,
          bizLocation,
          action: 'OBSERVE',
          ...locationCoords,
          quantityList,
          bizTransactionList,
          destinationList,
        }),
      'dispense',
    );

    this.logger.log(
      `Successfully processed dispense event: ${dto.dispensation_id} - ${epcList.length} EPCs`,
    );
  }

  /**
   * Handle receive event (opened SSCC with partial SGTIN scans OR sealed SSCC bulk receive)
   * Creates EPCIS AggregationEvent with bizStep='receiving'
   */
  private async handleReceive(dto: ReceiveEventDto): Promise<void> {
    this.logger.log(`Processing receive event: ${dto.grn_id}`);

    // Validate items array
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      throw new BadRequestException('Items array is required and must not be empty');
    }

    const childEPCs: string[] = [];
    let parentSSCC: string | undefined;

    for (const item of dto.items) {
      // Validate item is not null/undefined
      if (!item) {
        throw new BadRequestException('Item in items array cannot be null or undefined');
      }

      // Validate GTIN
      if (!item.gtin) {
        throw new BadRequestException('Item must have a gtin');
      }

      const catalogProduct = await this.masterDataService.findByGTIN(item.gtin);
      if (!catalogProduct) {
        throw new BadRequestException(
          `Product with GTIN ${item.gtin} not found in catalog`,
        );
      }

      // Build child EPCs
      if (item.identifiers.sgtins && item.identifiers.sgtins.length > 0) {
        // Unit-level: Use provided SGTINs
        for (const sgtin of item.identifiers.sgtins) {
          childEPCs.push(`urn:epc:id:sgtin:${sgtin}`);
        }
      } else if (item.identifiers.sscc) {
        // Container-level: Use SSCC
        if (this.gs1Service.validateSSCC(item.identifiers.sscc)) {
          const ssccEPC = this.gs1Service.formatSSCCAsEPCURI(item.identifiers.sscc);
          childEPCs.push(ssccEPC);
          parentSSCC = item.identifiers.sscc; // Use first SSCC as parent
        } else {
          throw new BadRequestException(`Invalid SSCC: ${item.identifiers.sscc}`);
        }
      } else if (item.batch_number) {
        // Batch-level: Use batch EPC
        const batchEPC = this.gs1Service.formatBatchNumberAsEPCURI(item.batch_number);
        childEPCs.push(batchEPC);
      } else {
        throw new BadRequestException(
          `Item ${item.gtin} must have either sgtins, sscc, or batchNumber`,
        );
      }
    }

    if (childEPCs.length === 0) {
      throw new BadRequestException('No valid EPCs found in items');
    }

    // Build parent EPC (shipment SSCC or facility location)
    let parentID: string;
    if (parentSSCC) {
      parentID = this.gs1Service.formatSSCCAsEPCURI(parentSSCC);
    } else if (dto.shipment?.shipment_id) {
      // Use shipment ID as parent
      parentID = `https://example.com/shipments/${dto.shipment.shipment_id}`;
    } else {
      parentID = `https://example.com/facilities/${dto.GLN}`;
    }

    // Build read point and business location
    const readPoint = this.buildReadPoint(dto.GLN, dto.location);
    const bizLocation = this.buildBizLocation(dto.GLN, dto.location);

    // Extract location coordinates
    const locationCoords = this.getLocationCoordinates(dto.location);

    // Build quantity list from items
    const quantityList = dto.items
      .filter(item => item.quantity)
      .map(item => {
        const epcClass = `urn:epc:class:lgtin:${item.gtin}.${item.batch_number}`;
        return createQuantity(epcClass, item.quantity, UnitOfMeasure.EACH);
      });

    // Build business transaction list
    const bizTransactionList = [
      createBizTransaction('GRN', dto.grn_id),
      ...(dto.shipment?.shipment_id ? [createBizTransaction('SHIPMENT', dto.shipment.shipment_id)] : []),
    ];

    // Build source/destination lists using facility GLN
    const destinationList = [
      createSourceDestination(SourceDestinationType.LOCATION, this.formatGLNAsSGLN(dto.GLN)),
    ];

    // Send EPCIS event
    await this.sendEPCISEventWithRetry(
      () =>
        this.epcisEventService.createAggregationEvent(parentID, childEPCs, {
          bizStep: 'receiving',
          disposition: 'active',
          readPoint,
          bizLocation,
          action: 'ADD',
          ...locationCoords,
          quantityList: quantityList.length > 0 ? quantityList : undefined,
          bizTransactionList,
          destinationList,
        }),
      'receive',
    );

    this.logger.log(
      `Successfully processed receive event: ${dto.grn_id} - ${childEPCs.length} EPCs`,
    );
  }

  /**
   * Handle adjustment event
   * Creates EPCIS ObjectEvent with bizStep='inventory_adjusting'
   */
  private async handleAdjust(dto: AdjustEventDto): Promise<void> {
    this.logger.log(`Processing adjust event: ${dto.reference_id}`);

    // Validate GTIN
    const catalogProduct = await this.masterDataService.findByGTIN(dto.item.gtin);
    if (!catalogProduct) {
      throw new BadRequestException(
        `Product with GTIN ${dto.item.gtin} not found in catalog`,
      );
    }

    // Build EPC list
    const epcList: string[] = [];
    if (dto.item?.identifiers?.sgtins && dto.item.identifiers.sgtins.length > 0) {
      for (const sgtin of dto.item.identifiers.sgtins) {
        epcList.push(`urn:epc:id:sgtin:${sgtin}`);
      }
    } else if (dto.item.batch_number) {
      const batchEPC = this.gs1Service.formatBatchNumberAsEPCURI(dto.item.batch_number);
      epcList.push(batchEPC);
    } else {
      throw new BadRequestException(
        'Adjustment item must have either sgtins or batchNumber',
      );
    }

    // Determine disposition based on reason
    let disposition = 'in_progress';
    if (dto.reason === 'expiry') {
      disposition = 'expired';
    } else if (dto.reason === 'damage') {
      disposition = 'damaged';
    } else if (dto.reason === 'theft' || dto.reason === 'loss') {
      disposition = 'disposed';
    }

    // Build read point and business location
    const readPoint = this.buildReadPoint(dto.GLN, dto.location);
    const bizLocation = this.buildBizLocation(dto.GLN, dto.location);

    // Extract location coordinates
    const locationCoords = this.getLocationCoordinates(dto.location);

    // Build quantity list (using absolute value of quantityChange)
    const quantityList = dto.item.quantity_change !== undefined
      ? [createQuantity(`urn:epc:class:lgtin:${dto.item.gtin}.${dto.item.batch_number}`, Math.abs(dto.item.quantity_change), UnitOfMeasure.EACH)]
      : undefined;

    // Build business transaction list
    const bizTransactionList = [
      createBizTransaction('ADJUSTMENT', dto.reference_id),
    ];

    // Build source/destination lists using facility GLN
    const destinationList = [
      createSourceDestination(SourceDestinationType.LOCATION, this.formatGLNAsSGLN(dto.GLN)),
    ];

    // Send EPCIS event
    await this.sendEPCISEventWithRetry(
      () =>
        this.epcisEventService.createObjectEvent(epcList, {
          bizStep: 'inventory_adjusting',
          disposition,
          readPoint,
          bizLocation,
          action: 'OBSERVE',
          ...locationCoords,
          quantityList,
          bizTransactionList,
          destinationList,
        }),
      'adjust',
    );

    this.logger.log(
      `Successfully processed adjust event: ${dto.reference_id} - ${epcList.length} EPCs`,
    );
  }

  /**
   * Handle stock count event
   * Creates EPCIS ObjectEvent with bizStep='cycle_counting' for discrepancies
   */
  private async handleStockCount(dto: StockCountEventDto): Promise<void> {
    this.logger.log(`Processing stock count event: ${dto.count_session_id}`);

    const facilityGLN = dto.location?.facility_gln;
    if (!facilityGLN) {
      throw new BadRequestException('Stock count event must include facilityGln in location');
    }

    // Process items with discrepancies
    for (const item of dto.items) {
      if (item.system_quantity === item.physical_quantity) {
        continue; // No discrepancy, skip
      }

      // Validate GTIN
      const catalogProduct = await this.masterDataService.findByGTIN(item.gtin);
      if (!catalogProduct) {
        this.logger.warn(
          `Product with GTIN ${item.gtin} not found in catalog, skipping`,
        );
        continue;
      }

      // Build EPC list
      const epcList: string[] = [];
      if (item.identifiers.sgtins && item.identifiers.sgtins.length > 0) {
        for (const sgtin of item.identifiers.sgtins) {
          epcList.push(`urn:epc:id:sgtin:${sgtin}`);
        }
      } else if (item.batch_number) {
        const batchEPC = this.gs1Service.formatBatchNumberAsEPCURI(item.batch_number);
        epcList.push(batchEPC);
      }

      if (epcList.length === 0) {
        continue; // Skip if no EPCs
      }

      // Build read point and business location
      const readPoint = this.buildReadPoint(facilityGLN, dto.location);
      const bizLocation = this.buildBizLocation(facilityGLN, dto.location);

      // Extract location coordinates
      const locationCoords = this.getLocationCoordinates(dto.location);

      // Build quantity list (use physical quantity for discrepancy)
      const quantityList = item.physical_quantity !== undefined
        ? [createQuantity(`urn:epc:class:lgtin:${item.gtin}.${item.batch_number}`, item.physical_quantity, UnitOfMeasure.EACH)]
        : undefined;

      // Build business transaction list
      const bizTransactionList = [
        createBizTransaction('STOCK_COUNT', dto.count_session_id),
      ];

      // Build source/destination lists using facility GLN
      const destinationList = [
        createSourceDestination(SourceDestinationType.LOCATION, this.formatGLNAsSGLN(facilityGLN)),
      ];

      // Send EPCIS event for discrepancy
      await this.sendEPCISEventWithRetry(
        () =>
          this.epcisEventService.createObjectEvent(epcList, {
            bizStep: 'cycle_counting',
            disposition: 'in_progress',
            readPoint,
            bizLocation,
            action: 'OBSERVE',
            ...locationCoords,
            quantityList,
            bizTransactionList,
            destinationList,
          }),
        'stock_count',
      );
    }

    this.logger.log(
      `Successfully processed stock count event: ${dto.count_session_id}`,
    );
  }

  /**
   * Handle return event
   * Creates EPCIS AggregationEvent with bizStep='returning'
   */
  private async handleReturn(dto: ReturnEventDto): Promise<void> {
    this.logger.log(`Processing return event: ${dto.return_id}`);

    const childEPCs: string[] = [];

    for (const item of dto.items) {
      // Validate GTIN
      const catalogProduct = await this.masterDataService.findByGTIN(item.gtin);
      if (!catalogProduct) {
        throw new BadRequestException(
          `Product with GTIN ${item.gtin} not found in catalog`,
        );
      }

      // Build child EPCs
      if (item.identifiers.sgtins && item.identifiers.sgtins.length > 0) {
        for (const sgtin of item.identifiers.sgtins) {
          childEPCs.push(`urn:epc:id:sgtin:${sgtin}`);
        }
      } else if (item.identifiers.sscc) {
        if (this.gs1Service.validateSSCC(item.identifiers.sscc)) {
          const ssccEPC = this.gs1Service.formatSSCCAsEPCURI(item.identifiers.sscc);
          childEPCs.push(ssccEPC);
        } else {
          throw new BadRequestException(`Invalid SSCC: ${item.identifiers.sscc}`);
        }
      } else if (item.batch_number) {
        const batchEPC = this.gs1Service.formatBatchNumberAsEPCURI(item.batch_number);
        childEPCs.push(batchEPC);
      } else {
        throw new BadRequestException(
          `Item ${item.gtin} must have either sgtins, sscc, or batchNumber`,
        );
      }
    }

    if (childEPCs.length === 0) {
      throw new BadRequestException('No valid EPCs found in items');
    }

    // Build parent EPC (return container or facility)
    const parentID = `https://example.com/returns/${dto.return_id}`;

    // Build read point and business location
    const readPoint = this.buildReadPoint(dto.GLN, dto.location);
    const bizLocation = this.buildBizLocation(dto.GLN, dto.location);

    // Extract location coordinates
    const locationCoords = this.getLocationCoordinates(dto.location);

    // Build quantity list from items
    const quantityList = dto.items
      .filter(item => item.quantity)
      .map(item => {
        const epcClass = `urn:epc:class:lgtin:${item.gtin}.${item.batch_number}`;
        return createQuantity(epcClass, item.quantity, UnitOfMeasure.EACH);
      });

    // Build business transaction list
    const bizTransactionList = [
      createBizTransaction('RETURN', dto.return_id),
    ];

    // Build source/destination lists using facility GLN
    const destinationList = [
      createSourceDestination(SourceDestinationType.LOCATION, this.formatGLNAsSGLN(dto.GLN)),
    ];

    // Send EPCIS event
    await this.sendEPCISEventWithRetry(
      () =>
        this.epcisEventService.createAggregationEvent(parentID, childEPCs, {
          bizStep: 'returning',
          disposition: 'returned',
          readPoint,
          bizLocation,
          action: 'ADD',
          ...locationCoords,
          quantityList: quantityList.length > 0 ? quantityList : undefined,
          bizTransactionList,
          destinationList,
        }),
      'return',
    );

    this.logger.log(
      `Successfully processed return event: ${dto.return_id} - ${childEPCs.length} EPCs`,
    );
  }

  /**
   * Handle recall event
   * Creates EPCIS ObjectEvent with bizStep='recalling'
   */
  private async handleRecall(dto: RecallEventDto): Promise<void> {
    this.logger.log(`Processing recall event: ${dto.recall_notice_id}`);

    const facilityGLN = dto.location?.facility_gln;
    if (!facilityGLN) {
      throw new BadRequestException('Recall event must include facilityGln in location');
    }

    const epcList: string[] = [];

    for (const item of dto.items) {
      // Validate GTIN
      const catalogProduct = await this.masterDataService.findByGTIN(item.gtin);
      if (!catalogProduct) {
        throw new BadRequestException(
          `Product with GTIN ${item.gtin} not found in catalog`,
        );
      }

      // Build EPC list
      if (item.identifiers.sgtins && item.identifiers.sgtins.length > 0) {
        for (const sgtin of item.identifiers.sgtins) {
          epcList.push(`urn:epc:id:sgtin:${sgtin}`);
        }
      } else if (item.batch_number) {
        const batchEPC = this.gs1Service.formatBatchNumberAsEPCURI(item.batch_number);
        epcList.push(batchEPC);
      } else {
        throw new BadRequestException(
          `Item ${item.gtin} must have either sgtins or batchNumber`,
        );
      }
    }

    if (epcList.length === 0) {
      throw new BadRequestException('No valid EPCs found in items');
    }

    // Build read point and business location
    const readPoint = this.buildReadPoint(facilityGLN, dto.location);
    const bizLocation = this.buildBizLocation(facilityGLN, dto.location);

    // Extract location coordinates
    const locationCoords = this.getLocationCoordinates(dto.location);

    // Build quantity list from items
    const quantityList = dto.items
      .filter(item => item.quantity)
      .map(item => {
        const epcClass = `urn:epc:class:lgtin:${item.gtin}.${item.batch_number}`;
        return createQuantity(epcClass, item.quantity, UnitOfMeasure.EACH);
      });

    // Build business transaction list
    const bizTransactionList = [
      createBizTransaction('RECALL', dto.recall_notice_id),
    ];

    // Build source/destination lists using facility GLN
    const destinationList = [
      createSourceDestination(SourceDestinationType.LOCATION, this.formatGLNAsSGLN(facilityGLN)),
    ];

    // Send EPCIS event
    await this.sendEPCISEventWithRetry(
      () =>
        this.epcisEventService.createObjectEvent(epcList, {
          bizStep: 'recalling',
          disposition: 'recalled',
          readPoint,
          bizLocation,
          action: 'OBSERVE',
          ...locationCoords,
          quantityList: quantityList.length > 0 ? quantityList : undefined,
          bizTransactionList,
          destinationList,
        }),
      'recall',
    );

    this.logger.log(
      `Successfully processed recall event: ${dto.recall_notice_id} - ${epcList.length} EPCs`,
    );
  }

  /**
   * Helper: Build read point from GLN and location
   * Supports both object and comma-separated string coordinate formats
   */
  private buildReadPoint(gln: string, location: any): { id: string } {
    const coords = this.getLocationCoordinates(location);
    if (coords.latitude !== undefined && coords.longitude !== undefined) {
      return {
        id: `https://example.com/readpoints/${gln}-${coords.latitude}-${coords.longitude}`,
      };
    }
    return { id: `https://example.com/facilities/${gln}` };
  }

  /**
   * Helper: Build business location from GLN and location
   */
  private buildBizLocation(gln: string, location: any): { id: string } {
    return { id: `https://example.com/facilities/${gln}` };
  }

  /**
   * Helper: Extract location coordinates for EPCIS events
   * Supports both object format and comma-separated string format
   */
  private getLocationCoordinates(location: any): {
    latitude?: number;
    longitude?: number;
    accuracyMeters?: number;
  } {
    if (!location?.coordinates) {
      return {};
    }

    const coords = location.coordinates;

    // Handle comma-separated string format: "latitude,longitude" or "lat,lng,accuracy"
    if (typeof coords === 'string') {
      const parts = coords.split(',').map((s: string) => s.trim());
      if (parts.length >= 2) {
        const latitude = parseFloat(parts[0]);
        const longitude = parseFloat(parts[1]);
        const accuracyMeters = parts.length >= 3 ? parseFloat(parts[2]) : undefined;

        if (!isNaN(latitude) && !isNaN(longitude)) {
          return {
            latitude,
            longitude,
            ...(accuracyMeters !== undefined && !isNaN(accuracyMeters) ? { accuracyMeters } : {}),
          };
        } else {
          this.logger.warn(`Invalid coordinate string format: ${coords}`);
          return {};
        }
      } else {
        this.logger.warn(`Invalid coordinate string format (expected "lat,lng"): ${coords}`);
        return {};
      }
    }

    // Handle object format: { latitude, longitude, accuracyMeters }
    if (typeof coords === 'object' && coords !== null) {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: coords.accuracy_meters,
      };
    }

    // Invalid format
    this.logger.warn(`Invalid coordinates format: ${typeof coords}`);
    return {};
  }

  /**
   * Helper: Format GLN as SGLN URI for EPCIS source/destination lists
   * Format: urn:epc:id:sgln:{GLN}.0.0
   */
  private formatGLNAsSGLN(gln: string): string {
    // Ensure GLN is 13 digits, pad if needed
    const normalizedGLN = gln.padStart(13, '0').substring(0, 13);
    return `urn:epc:id:sgln:${normalizedGLN}.0.0`;
  }
}

