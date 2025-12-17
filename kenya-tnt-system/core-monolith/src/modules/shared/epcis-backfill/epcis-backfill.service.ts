import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Shipment } from '../../../shared/domain/entities/shipment.entity';
import { Package } from '../../../shared/domain/entities/package.entity';
import { User } from '../../../shared/domain/entities/user.entity';
import { GS1Service } from '../../../shared/gs1/gs1.service';

@Injectable()
export class EpcisBackfillService {
  private readonly logger = new Logger(EpcisBackfillService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gs1Service: GS1Service,
  ) {}

  /**
   * Backfill EPCIS events for shipments created via seed data
   */
  async backfillShipmentEvents(): Promise<{
    total: number;
    success: number;
    failed: number;
    details: Array<{ shipmentId: number; sscc: string; status: string; eventId?: string; error?: string }>;
  }> {
    this.logger.log('Starting EPCIS event backfill for seed shipments...');

    // Find shipments with missing EPCIS events
    const shipmentsQuery = `
      SELECT 
        s.id,
        s."ssccBarcode",
        s."eventId" as old_event_id,
        s."userId",
        s."customerId",
        s."pickupLocation",
        s."destinationAddress",
        s.carrier
      FROM shipment s
      WHERE s."isDispatched" = true
        AND s."eventId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM epcis_events e 
          WHERE e.event_id = s."eventId"
        )
      ORDER BY s.id;
    `;

    const shipments: any[] = await this.dataSource.query(shipmentsQuery);
    
    if (shipments.length === 0) {
      this.logger.log('No shipments need backfilling');
      return { total: 0, success: 0, failed: 0, details: [] };
    }

    this.logger.log(`Found ${shipments.length} shipments needing EPCIS events`);

    const results = {
      total: shipments.length,
      success: 0,
      failed: 0,
      details: [] as Array<{ shipmentId: number; sscc: string; status: string; eventId?: string; error?: string }>,
    };

    for (const shipment of shipments) {
      try {
        this.logger.log(`Processing shipment #${shipment.id} (SSCC: ${shipment.ssccBarcode})`);

        // Get packages
        const packages = await this.packageRepo.find({
          where: { shipmentId: shipment.id },
        });

        if (packages.length === 0) {
          this.logger.warn(`No packages found for shipment ${shipment.id}, skipping`);
          results.failed++;
          results.details.push({
            shipmentId: shipment.id,
            sscc: shipment.ssccBarcode,
            status: 'failed',
            error: 'No packages found'
          });
          continue;
        }

        // Build EPCs
        const packageEPCs = packages.map(
          p => `urn:epc:id:sscc:${p.ssccBarcode || p.label.replace(/\s+/g, '')}`
        );
        const shipmentEPC = `urn:epc:id:sscc:${shipment.ssccBarcode}`;

        // Get user context
        const user = await this.userRepo.findOne({ where: { id: shipment.userId } });

        // Determine destination
        let destinationList;
        if (shipment.customerId) {
          const customer = await this.userRepo.findOne({ where: { id: shipment.customerId } });
          if (customer?.glnNumber) {
            destinationList = [{
              type: 'urn:epcglobal:cbv:sdt:location',
              destination: `urn:epc:id:sgln:${customer.glnNumber}.0`
            }];
          }
        }

        if (!destinationList && shipment.destinationAddress) {
          destinationList = [{
            type: 'urn:epcglobal:cbv:sdt:location',
            destination: `https://example.com/locations/${encodeURIComponent(shipment.destinationAddress)}`
          }];
        }

        // Create EPCIS event
        const newEventId = await this.gs1Service.createAggregationEvent(
          shipmentEPC,
          packageEPCs,
          {
            bizStep: 'shipping',
            disposition: 'in_transit',
            action: 'ADD',
            bizTransactionList: [
              {
                type: 'urn:epcglobal:cbv:btt:po',
                bizTransaction: `SHIPMENT-${shipment.id}`
              }
            ],
            destinationList,
            actorType: 'manufacturer',
            actorUserId: shipment.userId,
            actorGLN: user?.glnNumber,
            actorOrganization: user?.organization,
            sourceEntityType: 'shipment',
            sourceEntityId: shipment.id,
          }
        );

        // Update shipment
        await this.shipmentRepo.update(shipment.id, { eventId: newEventId });

        this.logger.log(`Created event ${newEventId} for shipment ${shipment.id}`);
        results.success++;
        results.details.push({
          shipmentId: shipment.id,
          sscc: shipment.ssccBarcode,
          status: 'success',
          eventId: newEventId
        });

      } catch (error: any) {
        this.logger.error(`Failed to create event for shipment ${shipment.id}:`, error.message);
        results.failed++;
        results.details.push({
          shipmentId: shipment.id,
          sscc: shipment.ssccBarcode,
          status: 'failed',
          error: error.message
        });
      }
    }

    this.logger.log(`Backfill complete: ${results.success}/${results.total} successful`);
    return results;
  }
}
