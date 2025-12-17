/**
 * Backfill EPCIS Events for Seed Shipments
 * 
 * This script creates missing EPCIS AggregationEvents for shipments that were
 * created via seed data and bypassed the normal EPCISEventService flow.
 * 
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/backfill-shipment-epcis-events.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';
import { GS1Service } from '../src/shared/gs1/gs1.service';

interface ShipmentToBackfill {
  id: number;
  ssccBarcode: string;
  eventId: string;
  userId: string;
  customerId: string | null;
  pickupLocation: string;
  destinationAddress: string;
  carrier: string;
  packageIds: number[];
}

async function main() {
  const logger = new Logger('BackfillEPCISEvents');
  
  logger.log('🚀 Starting EPCIS event backfill for seed shipments...');

  // Bootstrap NestJS app to get access to services
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const dataSource = app.get(DataSource);
  const gs1Service = app.get(GS1Service);

  try {
    // Step 1: Find all shipments that have eventId but no actual EPCIS event
    logger.log('📋 Querying shipments with missing EPCIS events...');
    
    const shipmentsQuery = `
      SELECT 
        s.id,
        s."ssccBarcode",
        s."eventId",
        s."userId",
        s."customerId",
        s."pickupLocation",
        s."destinationAddress",
        s.carrier,
        ARRAY_AGG(p.id) as package_ids
      FROM shipment s
      LEFT JOIN packages p ON p."shipmentId" = s.id
      WHERE s."isDispatched" = true
        AND s."eventId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM epcis_events e 
          WHERE e.event_id = s."eventId"
        )
      GROUP BY s.id, s."ssccBarcode", s."eventId", s."userId", 
               s."customerId", s."pickupLocation", s."destinationAddress", s.carrier
      ORDER BY s.id;
    `;

    const shipments: any[] = await dataSource.query(shipmentsQuery);
    
    if (shipments.length === 0) {
      logger.log('✅ No shipments need backfilling - all EPCIS events exist!');
      await app.close();
      return;
    }

    logger.log(`📦 Found ${shipments.length} shipments needing EPCIS events`);

    // Step 2: Get user GLN for each shipment
    const userGlnMap = new Map<string, { glnNumber?: string; organization?: string }>();
    
    for (const shipment of shipments) {
      if (!userGlnMap.has(shipment.userId)) {
        const user = await dataSource.query(
          `SELECT "glnNumber", organization FROM users WHERE id = $1`,
          [shipment.userId]
        );
        userGlnMap.set(shipment.userId, user[0] || {});
      }
    }

    // Step 3: Create EPCIS events for each shipment
    let successCount = 0;
    let failCount = 0;

    for (const shipment of shipments) {
      try {
        logger.log(`\n🔄 Processing shipment #${shipment.id} (SSCC: ${shipment.ssccBarcode})...`);

        // Get packages for this shipment
        const packages = await dataSource.query(
          `SELECT id, label, "ssccBarcode" FROM packages WHERE "shipmentId" = $1`,
          [shipment.id]
        );

        if (packages.length === 0) {
          logger.warn(`  ⚠️  No packages found for shipment ${shipment.id}, skipping`);
          failCount++;
          continue;
        }

        // Build EPCs
        const packageEPCs = packages.map(
          (p: any) => `urn:epc:id:sscc:${p.ssccBarcode || p.label.replace(/\s+/g, '')}`
        );
        const shipmentEPC = `urn:epc:id:sscc:${shipment.ssccBarcode}`;

        // Get user context
        const userContext = userGlnMap.get(shipment.userId) || {};

        // Determine destination GLN/location
        let destinationList;
        if (shipment.customerId) {
          // Try to get customer GLN
          const customer = await dataSource.query(
            `SELECT "glnNumber" FROM users WHERE id = $1`,
            [shipment.customerId]
          );
          if (customer[0]?.glnNumber) {
            destinationList = [{
              type: 'urn:epcglobal:cbv:sdt:location',
              destination: `urn:epc:id:sgln:${customer[0].glnNumber}.0`
            }];
          }
        }

        if (!destinationList && shipment.destinationAddress) {
          destinationList = [{
            type: 'urn:epcglobal:cbv:sdt:location',
            destination: `https://example.com/locations/${encodeURIComponent(shipment.destinationAddress)}`
          }];
        }

        // Create EPCIS AggregationEvent via GS1Service
        logger.log(`  📝 Creating EPCIS event for ${packages.length} packages...`);
        
        const newEventId = await gs1Service.createAggregationEvent(
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
            actorGLN: userContext.glnNumber,
            actorOrganization: userContext.organization,
            sourceEntityType: 'shipment',
            sourceEntityId: shipment.id,
          }
        );

        // Update shipment record with new event ID
        await dataSource.query(
          `UPDATE shipment SET "eventId" = $1 WHERE id = $2`,
          [newEventId, shipment.id]
        );

        logger.log(`  ✅ Created event ${newEventId}`);
        successCount++;

      } catch (error: any) {
        logger.error(`  ❌ Failed to create event for shipment ${shipment.id}:`, error.message);
        failCount++;
      }
    }

    // Summary
    logger.log(`\n${'='.repeat(60)}`);
    logger.log(`📊 Backfill Summary:`);
    logger.log(`   Total shipments processed: ${shipments.length}`);
    logger.log(`   ✅ Successfully created:   ${successCount}`);
    logger.log(`   ❌ Failed:                 ${failCount}`);
    logger.log(`${'='.repeat(60)}\n`);

    if (successCount > 0) {
      logger.log('🎉 EPCIS events have been created! These shipments are now trackable in Journey view.');
      logger.log('💡 Note: Events were saved to PostgreSQL. OpenEPCIS sync depends on service availability.');
    }

  } catch (error: any) {
    logger.error('❌ Backfill failed:', error.message);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
