import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, DataSource } from 'typeorm';
import { Shipment } from '../../domain/entities/shipment.entity';
import { User } from '../../domain/entities/user.entity';
import { EPCISEvent } from '../../domain/entities/epcis-event.entity';
// Temporarily removed to fix column mapping issue
// import { EPCISEventEPC } from '../../domain/entities/epcis-event-epc.entity';
import { Consignment } from '../../domain/entities/consignment.entity';
import { EPCISEventBizTransaction } from '../../domain/entities/epcis-event-biz-transaction.entity';

/**
 * Journey Service (Shared Analytics)
 *
 * Tracks product journey across the entire supply chain using EPCIS events from database.
 * Uses single SQL query with joins - no HTTP calls needed!
 * Can be used by regulators, manufacturers, suppliers, and other actors.
 */
@Injectable()
export class JourneyService {
  private readonly logger = new Logger(JourneyService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EPCISEvent)
    private readonly eventRepo: Repository<EPCISEvent>,
    // Temporarily commented out to fix column mapping issue
    // @InjectRepository(EPCISEventEPC)
    // private readonly eventEpcRepo: Repository<EPCISEventEPC>,
    @InjectRepository(Consignment)
    private readonly consignmentRepo: Repository<Consignment>,
    @InjectRepository(EPCISEventBizTransaction)
    private readonly bizTxnRepo: Repository<EPCISEventBizTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get complete journey by SSCC using EPCIS events from database
   * PURE SQL implementation - zero TypeORM entity dependencies
   * This eliminates all column mapping issues and works immediately without restarts
   */
  async getJourneyBySSCC(sscc: string): Promise<any> {
    try {
      console.log(`\n\n[Pure SQL] ===== Starting getJourneyBySSCC for SSCC: ${sscc} =====`);
      console.log(`[Pure SQL] Method called at:`, new Date().toISOString());
      console.log(`[Pure SQL] DataSource available:`, !!this.dataSource);
      this.logger.log(`[Pure SQL] Starting getJourneyBySSCC for SSCC: ${sscc}`);
      
      // Add debug flag to response
      const debugInfo: any = { method: 'getJourneyBySSCC', sscc, timestamp: new Date().toISOString() };
      
      // Build SSCC EPC URI patterns
      const ssccPatterns = [
        `urn:epc:id:sscc:${sscc}`,
        `https://example.com/shipments/${sscc}`,
        sscc, // Direct SSCC match
      ];

      // Step 1: Find all event IDs related to this SSCC via EPCs
      const ssccEscaped = sscc.replace(/'/g, "''").replace(/\\/g, "\\\\");
      const ssccLikePattern = `%${ssccEscaped}%`;
      
      console.log(`[Pure SQL] Query params:`, { 
        pattern1: ssccPatterns[0], 
        pattern2: ssccPatterns[1], 
        pattern3: ssccPatterns[2], 
        likePattern: ssccLikePattern 
      });
      
      let epcEventIds: any[] = [];
      try {
        // Escape single quotes for SQL LIKE pattern
        const escapedPattern = sscc.replace(/'/g, "''");
        
        // Try the query - use manager.query() which might handle params better
        const epcQuery = `SELECT DISTINCT event_id as "eventId"
           FROM epcis_event_epcs
           WHERE epc = $1 OR epc = $2 OR epc = $3 OR epc LIKE $4`;
        
        console.log(`[Pure SQL] Executing EPC query:`);
        console.log(`[Pure SQL] Query:`, epcQuery);
        console.log(`[Pure SQL] Params:`, JSON.stringify([ssccPatterns[0], ssccPatterns[1], ssccPatterns[2], ssccLikePattern]));
        console.log(`[Pure SQL] DataSource type:`, this.dataSource?.constructor?.name);
        
        // Try both dataSource.query and manager.query
        try {
          epcEventIds = await this.dataSource.query(epcQuery, [
            ssccPatterns[0], 
            ssccPatterns[1], 
            ssccPatterns[2], 
            ssccLikePattern
          ]);
          console.log(`[Pure SQL] dataSource.query() succeeded`);
        } catch (dsError: any) {
          console.error(`[Pure SQL] dataSource.query() failed:`, dsError.message);
          // Try with manager instead
          epcEventIds = await this.dataSource.manager.query(epcQuery, [
            ssccPatterns[0], 
            ssccPatterns[1], 
            ssccPatterns[2], 
            ssccLikePattern
          ]);
          console.log(`[Pure SQL] manager.query() succeeded`);
        }
        
        console.log(`[Pure SQL] EPC query completed! Returned ${epcEventIds.length} results`);
        console.log(`[Pure SQL] Results type:`, Array.isArray(epcEventIds) ? 'Array' : typeof epcEventIds);
        if (epcEventIds.length > 0) {
          console.log(`[Pure SQL] First 3 event IDs:`, epcEventIds.slice(0, 3).map((e: any) => e?.event_id || e));
        } else {
          console.warn(`[Pure SQL] WARNING: EPC query returned 0 results!`);
          console.warn(`[Pure SQL] This means no events found for SSCC: ${sscc}`);
        }
      } catch (epcError: any) {
        console.error(`[Pure SQL] EPC query failed:`, epcError.message);
        console.error(`[Pure SQL] Error details:`, {
          name: epcError.name,
          code: epcError.code,
          stack: epcError.stack?.substring(0, 500)
        });
        this.logger.error(`[Pure SQL] EPC query failed: ${epcError.message}`, epcError.stack);
        throw epcError;
      }

      // Step 2: Find events where parent_id matches SSCC patterns
      const parentEventIds = await this.dataSource.query(
        `SELECT DISTINCT event_id as "eventId"
         FROM epcis_events
         WHERE parent_id IS NOT NULL
         AND (parent_id = $1 OR parent_id = $2 OR parent_id = $3)`,
        [ssccPatterns[0], ssccPatterns[1], ssccPatterns[2]]
      );

      // Combine all event IDs
      const allEventIds = [
        ...new Set([
          ...epcEventIds.map((e: any) => e.event_id),
          ...parentEventIds.map((e: any) => e.event_id),
        ]),
      ];

      console.log(`[Pure SQL] Found ${allEventIds.length} unique event IDs for SSCC: ${sscc}`, allEventIds);
      this.logger.log(`[Pure SQL] Found ${allEventIds.length} unique event IDs for SSCC: ${sscc}`);

      if (allEventIds.length === 0) {
        console.warn(`[Pure SQL] WARNING: No event IDs found! EPC query returned ${epcEventIds.length}, parent query returned ${parentEventIds.length}`);
        console.warn(`[Pure SQL] EPC results:`, epcEventIds);
        console.warn(`[Pure SQL] Parent results:`, parentEventIds);
        this.logger.warn(`[Pure SQL] No events found for SSCC ${sscc}, falling back to legacy method`);
        // Don't fall back immediately - let's see what's happening
        // return this.getJourneyBySSCCLegacy(sscc);
        // Instead, return empty structure so we can debug
        debugInfo.step = 'no_event_ids_found';
        debugInfo.epcQueryResults = epcEventIds.length;
        debugInfo.parentQueryResults = parentEventIds.length;
        debugInfo.allEventIds = allEventIds.length;
        debugInfo.epcResults = epcEventIds;
        debugInfo.parentResults = parentEventIds;
        
        return {
          sscc,
          events: [],
          manufacturer: { shipping: [], receiving: [], returns: [] },
          supplier: { shipping: [], receiving: [], returns: [] },
          userFacility: { shipping: [], receiving: [], returns: [] },
          _debug: debugInfo
        };
      }

      // Step 3: Get events with shipments and users (simpler query, faster)
      let eventsRaw: any[] = [];
      try {
        // Build parameterized IN clause properly
        const eventIdParams = allEventIds.map((_, i) => `$${i + 1}`).join(', ');
        
        console.log(`[Pure SQL] Executing query for ${allEventIds.length} event IDs:`, allEventIds.slice(0, 3));
        this.logger.log(`[Pure SQL] Executing query for ${allEventIds.length} event IDs: ${allEventIds.slice(0, 3).join(', ')}...`);
        
        const query = `SELECT 
            e.event_id as "eventId",
            e.event_type as "eventType",
            e.event_time as "eventTime",
            e.biz_step as "bizStep",
            e.disposition,
            e.action,
            e.read_point_id as "readPointId",
            e.biz_location_id as "bizLocationId",
            e.latitude,
            e.longitude,
            e.actor_type as "actorType",
            e.actor_user_id as "actorUserId",
            e.actor_gln as "actorGLN",
            e.actor_organization as "actorOrganization",
            e.source_entity_type as "sourceEntityType",
            e.source_entity_id as "sourceEntityId",
            -- Shipment data (if exists)
            s.id as "shipmentId",
            s.customer as "shipmentCustomer",
            s.carrier as "shipmentCarrier",
            s."destination_address" as "shipmentDestination",
            s."pickup_location" as "shipmentPickupLocation",
            -- Actor user data
            u.id as "actorUserTableId",
            u.email as "actorEmail",
            u.organization as "actorUserOrganization",
            u."gln_number" as "actorUserGLN",
            u.role as "actorUserRole"
          FROM epcis_events e
          LEFT JOIN shipment s ON e.source_entity_type = 'shipment' AND e.source_entity_id = s.id
          LEFT JOIN users u ON e.actor_user_id = u.id
          WHERE e.event_id IN (${eventIdParams})
          ORDER BY e.event_time ASC`;
        
        console.log(`[Pure SQL] Query:`, query.substring(0, 200) + '...');
        console.log(`[Pure SQL] Params:`, allEventIds);
        
        eventsRaw = await this.dataSource.query(query, allEventIds);

        this.logger.log(`[Pure SQL] Query succeeded! Retrieved ${eventsRaw.length} events`);
        if (eventsRaw.length > 0) {
          this.logger.log(`[Pure SQL] Sample event: ${eventsRaw[0].event_id} - ${eventsRaw[0].actorOrganization}`);
        }
      } catch (queryError: any) {
        this.logger.error(`[Pure SQL] Query failed: ${queryError.message}`, queryError.stack);
        throw queryError; // Re-throw to trigger fallback
      }

      // Step 3b: Load EPCs separately (much faster than GROUP BY with json_agg)
      const epcsByEventId = new Map<string, string[]>();
      if (eventsRaw.length > 0) {
        const epcEventIdParams = allEventIds.map((_, i) => `$${i + 1}`).join(', ');
        const epcQuery = `SELECT event_id as "eventId", epc
           FROM epcis_event_epcs
           WHERE event_id IN (${epcEventIdParams})`;
        console.log(`[Pure SQL] EPC Query for ${allEventIds.length} event IDs`);
        const epcsRaw = await this.dataSource.query(epcQuery, allEventIds);
        
        for (const epcRow of epcsRaw) {
          if (!epcsByEventId.has(epcRow.event_id)) {
            epcsByEventId.set(epcRow.event_id, []);
          }
          epcsByEventId.get(epcRow.event_id)!.push(epcRow.epc);
        }
        
        this.logger.log(`[Pure SQL] Loaded EPCs for ${epcsByEventId.size} events`);
      }

      if (eventsRaw.length === 0) {
        console.warn(`[Pure SQL] WARNING: eventsRaw is empty! allEventIds had ${allEventIds.length} IDs`);
        console.warn(`[Pure SQL] allEventIds:`, allEventIds);
        debugInfo.step = 'events_raw_empty';
        debugInfo.allEventIdsCount = allEventIds.length;
        debugInfo.allEventIds = allEventIds;
        this.logger.warn(`[Pure SQL] No events found after query, falling back to legacy method`);
        const legacyResult = await this.getJourneyBySSCCLegacy(sscc);
        legacyResult._debug = { ...debugInfo, legacy: true };
        return legacyResult;
      }

      // Step 4: Transform raw SQL results into event data objects
      const manufacturer: any[] = [];
      const supplier: any[] = [];
      const userFacility: any[] = [];
      const eventDataMap = new Map<string, any>();

      for (const row of eventsRaw) {
        // Get EPCs from the map we built
        const epcs = epcsByEventId.get(row.event_id) || [];

        const eventData: any = {
          eventId: row.event_id,
          eventType: row.event_type,
          eventTime: new Date(row.eventTime),
          bizStep: row.bizStep,
          disposition: row.disposition,
          action: row.action,
          readPointId: row.readPointId,
          bizLocationId: row.bizLocationId,
          latitude: row.latitude,
          longitude: row.longitude,
          actor_type: row.actor_type,
          actor_user_id: row.actorUserId,
          actor_gln: row.actorGLN,
          actor_organization: row.actorOrganization || row.actorUserOrganization,
          epcs: epcs,
        };

        // Add shipment data if available
        if (row.shipment_id) {
          eventData.shipment = {
            id: row.shipment_id,
            customer: row.shipmentCustomer,
            carrier: row.shipmentCarrier,
            destination_address: row.shipmentDestination,
            pickup_location: row.shipmentPickupLocation,
          };
        }

        // Add actor user data if available
        if (row.actorUserId || row.actorUserTableId) {
          eventData.actorUser = {
            id: row.actorUserId || row.actorUserTableId,
            email: row.actorEmail,
            organization: row.actorUserOrganization,
            gln_number: row.actorUserGLN,
            role: row.actorUserRole,
          };
        }

        // Store in map for reuse
        eventDataMap.set(row.event_id, eventData);

        // Determine status key
        const isReturn = row.disposition?.includes('returned');
        const isShippingLike =
          row.bizStep === 'shipping' ||
          row.bizStep === 'dispensing' ||
          row.action === 'ADD';
        const statusKey: 'shipping' | 'receiving' | 'returns' = isReturn
          ? 'returns'
          : isShippingLike
            ? 'shipping'
            : 'receiving';

        // Group by actor type
        if (row.actor_type === 'manufacturer' || !row.actor_type) {
          if (!manufacturer.find((m) => m.statusKey === statusKey)) {
            manufacturer.push({ statusKey, events: [] });
          }
          manufacturer
            .find((m) => m.statusKey === statusKey)
            .events.push(eventData);
        } else if (row.actor_type === 'supplier' || row.actor_type === 'cpa') {
          if (!supplier.find((s) => s.statusKey === statusKey)) {
            supplier.push({ statusKey, events: [] });
          }
          supplier.find((s) => s.statusKey === statusKey).events.push(eventData);
        } else if (row.actor_type === 'facility' || row.actor_type === 'user_facility') {
          if (!userFacility.find((f) => f.statusKey === statusKey)) {
            userFacility.push({ statusKey, events: [] });
          }
          userFacility.find((f) => f.statusKey === statusKey).events.push(eventData);
        }
      }

      // Step 5: Build response in expected format
      const allEvents = eventsRaw.map((row: any) => eventDataMap.get(row.event_id)!);

      const result: any = {
        sscc,
        events: allEvents,
        manufacturer: {
          shipping: manufacturer.find((m) => m.statusKey === 'shipping')?.events || [],
          receiving: manufacturer.find((m) => m.statusKey === 'receiving')?.events || [],
          returns: manufacturer.find((m) => m.statusKey === 'returns')?.events || [],
        },
        supplier: {
          shipping: supplier.find((s) => s.statusKey === 'shipping')?.events || [],
          receiving: supplier.find((s) => s.statusKey === 'receiving')?.events || [],
          returns: supplier.find((s) => s.statusKey === 'returns')?.events || [],
        },
        userFacility: {
          shipping: userFacility.find((f) => f.statusKey === 'shipping')?.events || [],
          receiving: userFacility.find((f) => f.statusKey === 'receiving')?.events || [],
          returns: userFacility.find((f) => f.statusKey === 'returns')?.events || [],
        },
      };

      this.logger.log(`[Pure SQL] Successfully built journey response with ${allEvents.length} events`);
      result._debug = { ...debugInfo, step: 'success', eventsFound: allEvents.length };
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      const errorStack = error?.stack;
      
      this.logger.error(`Error in getJourneyBySSCC for SSCC ${sscc}: ${errorMessage}`, errorStack);
      console.error('=== JOURNEY SERVICE ERROR ===');
      console.error('SSCC:', sscc);
      console.error('Error message:', errorMessage);
      console.error('Error stack:', errorStack);
      console.error('Error name:', error?.name);
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      console.error('============================');
      
      // Fallback to legacy method on error
      try {
        console.error(`[Pure SQL] ERROR caught, falling back to legacy method for SSCC: ${sscc}`);
        this.logger.log(`Falling back to legacy method for SSCC: ${sscc}`);
        const legacyResult = await this.getJourneyBySSCCLegacy(sscc);
        // Legacy method now returns empty structure instead of throwing, so we're good
        legacyResult._debug = { error: errorMessage, step: 'error_fallback', legacy: true };
        return legacyResult;
      } catch (legacyError: any) {
        const legacyMessage = legacyError?.message || 'Unknown error';
        this.logger.error(`Legacy method also failed for SSCC ${sscc}: ${legacyMessage}`, legacyError?.stack);
        console.error('=== LEGACY METHOD ERROR ===');
        console.error('SSCC:', sscc);
        console.error('Error:', legacyMessage);
        console.error('Stack:', legacyError?.stack);
        console.error('==========================');
        
        // Return empty structure instead of throwing error
        // This prevents 500 errors when data doesn't exist
        return {
          sscc,
          events: [],
          manufacturer: {
            shipping: [],
            receiving: [],
            returns: [],
          },
          supplier: {
            shipping: [],
            receiving: [],
            returns: [],
          },
          userFacility: {
            shipping: [],
            receiving: [],
            returns: [],
          },
        };
      }
    }
  }

  /**
   * Legacy method: Get journey by SSCC from shipments table (fallback)
   */
  private async getJourneyBySSCCLegacy(sscc: string): Promise<any> {
    try {
      console.log(`[Legacy] Using legacy method for SSCC: ${sscc}`);
      this.logger.log(`Using legacy method for SSCC: ${sscc}`);
      
      const shipment = await this.shipmentRepo.findOne({
        where: { sscc_barcode: sscc, is_deleted: false },
        relations: [
          'packages',
          'packages.cases',
          'packages.cases.products',
          'packages.cases.products.batch',
          'packages.cases.products.batch.product',
          'packages.cases.products.product',
          'user',
        ],
      });

      if (!shipment) {
        this.logger.warn(`No shipment found for SSCC: ${sscc}`);
        // Return empty structure instead of throwing error
        return {
          sscc,
          events: [],
          manufacturer: {
            shipping: [],
            receiving: [],
            returns: [],
          },
          supplier: {
            shipping: [],
            receiving: [],
            returns: [],
          },
          userFacility: {
            shipping: [],
            receiving: [],
            returns: [],
          },
        };
      }

      this.logger.log(`Found shipment ${shipment.id} for SSCC: ${sscc}`);
      return {
        sscc,
        events: [],
        manufacturer: {
          ...shipment,
          userId: shipment.user,
          shipping: shipment.is_dispatched ? [{
            eventId: shipment.event_id || `shipment-${shipment.id}`,
            eventType: 'ObjectEvent',
            eventTime: shipment.created_at,
            bizStep: 'shipping',
            disposition: shipment.is_dispatched ? 'in_transit' : 'pending',
            actor_type: 'manufacturer',
            actor_organization: shipment.user?.organization,
          }] : [],
          receiving: [],
          returns: [],
        },
        supplier: {
          shipping: [],
          receiving: [],
          returns: [],
        },
        userFacility: {
          shipping: [],
          receiving: [],
          returns: [],
        },
      };
    } catch (error: any) {
      this.logger.error(`Error in legacy method for SSCC ${sscc}: ${error.message}`, error.stack);
      // Return empty structure instead of throwing
      return {
        sscc,
        events: [],
        manufacturer: {
          shipping: [],
          receiving: [],
          returns: [],
        },
        supplier: {
          shipping: [],
          receiving: [],
          returns: [],
        },
        userFacility: {
          shipping: [],
          receiving: [],
          returns: [],
        },
      };
    }
  }

  /**
   * Get consignment flow for Sankey diagram visualization
   * Shows flow from port/manufacturer → distributors → facilities
   * Uses consignmentID (not batch number) since a batch can appear in multiple consignments
   */
  async getConsignmentFlow(consignmentID: string): Promise<any> {
    try {
      this.logger.log(`Getting consignment flow for: ${consignmentID}`);
      
      // Find events linked to this consignment via:
      // 1. bizTransactionList (CONSIGNMENT transaction type)
      // 2. source_entity_type = 'consignment' and source_entity_id
      // 3. EPCs containing the consignment ID
      
      // Query ppb_batches table directly using raw SQL since we need consignment_ref_number
      // which is not in the Consignment entity
      const ppbBatchesRaw = await this.dataSource.query(
        `SELECT id FROM ppb_batches WHERE consignment_ref_number = $1 LIMIT 1`,
        [consignmentID]
      );

      if (ppbBatchesRaw.length === 0) {
        this.logger.warn(`Consignment not found: ${consignmentID}`);
        throw new NotFoundException(`Consignment ${consignmentID} not found`);
      }

      const consignment = { id: ppbBatchesRaw[0].id };
      this.logger.log(`Found consignment ${consignmentID} with ID: ${consignment.id}`);

      let eventIds: string[] = [];

      // Find events linked to this consignment via source_entity
      // Use raw SQL to completely bypass TypeORM entity metadata
      this.logger.log('Querying events via source_entity...');
      try {
        const sourceEventsRaw = await this.dataSource.query(
          `SELECT event_id as "eventId"
           FROM epcis_events
           WHERE source_entity_type = $1 AND source_entity_id = $2`,
          ['consignment', consignment.id]
        );
        this.logger.log(`Found ${sourceEventsRaw.length} events via source_entity`);
        eventIds.push(...sourceEventsRaw.map((e: any) => e.event_id));
      } catch (error: any) {
        this.logger.error(`Error querying source events: ${error.message}`, error.stack);
        throw error;
      }

      // Also find events via bizTransactionList (CONSIGNMENT type)
      // Use raw SQL to avoid entity metadata issues
      this.logger.log('Querying events via bizTransactionList...');
      try {
        const bizTxnsRaw = await this.dataSource.query(
          `SELECT event_id as "eventId"
           FROM epcis_event_biz_transactions
           WHERE transaction_type = $1 AND transaction_id = $2`,
          ['CONSIGNMENT', consignmentID]
        );
        this.logger.log(`Found ${bizTxnsRaw.length} events via bizTransactionList`);
        eventIds.push(...bizTxnsRaw.map((bt: any) => bt.event_id));
      } catch (error: any) {
        this.logger.error(`Error querying biz transactions: ${error.message}`, error.stack);
        throw error;
      }

      // Skip EPC pattern matching for now due to column mapping issues
      // We already have events from source_entity and bizTransactionList which should be sufficient
      // TODO: Fix EPC entity column mapping and re-enable this fallback
      this.logger.log('Skipping EPC pattern matching (using source_entity and bizTransactionList events only)');

      // Remove duplicates
      eventIds = [...new Set(eventIds)];
      this.logger.log(`Total unique event IDs: ${eventIds.length}`);

      if (eventIds.length === 0) {
        this.logger.warn(`No events found for consignment ${consignmentID}. Consignment exists but has no associated events.`);
        throw new NotFoundException(`No events found for consignment ${consignmentID}. The consignment exists but has no associated journey events.`);
      }

      // Get all events using raw SQL to completely bypass TypeORM entity metadata
      // This avoids any issues with entity relationships or column name mapping
      this.logger.log('Fetching events using raw SQL...');
      const placeholders = eventIds.map((_, i) => `$${i + 1}`).join(', ');
      const eventsRaw = await this.dataSource.query(
        `SELECT 
          e.id,
          e.event_id as "eventId",
          e.event_type as "eventType",
          e.event_time as "eventTime",
          e.biz_step as "bizStep",
          e.action,
          e.actor_type as "actorType",
          e.actor_organization as "actorOrganization",
          e.actor_gln as "actorGLN",
          -- Get quantity from quantityList first, then fall back to EPC count
          COALESCE(
            (SELECT SUM(CAST(quantity AS INTEGER)) FROM epcis_event_quantities WHERE event_id = e.event_id),
            (SELECT COUNT(*) FROM epcis_event_epcs WHERE event_id = e.event_id),
            1
          ) as quantity
        FROM epcis_events e
        WHERE e.event_id IN (${placeholders})
        ORDER BY e.event_time ASC`,
        eventIds
      );
      
      this.logger.log(`Retrieved ${eventsRaw.length} events from database`);
      
      // Map to entity-like objects (TypeORM will handle Date conversion)
      const events = eventsRaw.map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        eventType: row.event_type,
        eventTime: new Date(row.eventTime),
        bizStep: row.bizStep,
        action: row.action,
        actor_type: row.actor_type,
        actor_organization: row.actorOrganization,
        actor_gln: row.actorGLN,
        quantity: parseInt(row.quantity) || 1,
      }));

    // Build Sankey diagram data structure
    const nodes: Set<string> = new Set();
    const links: Array<{
      source: string;
      target: string;
      value: number;
      eventTime: Date;
      bizStep: string;
    }> = [];

    // Track previous event to build flow
    const eventFlow: Map<string, string> = new Map(); // eventId -> next event actor

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const actorOrg = event.actor_organization || event.actorGLN || 'Unknown';
      const actorType = event.actor_type || 'unknown';

      // Add node
      nodes.add(actorOrg);

      // Simple flow: if someone receives, connect from the matching shipper
      if (event.biz_step === 'receiving' || event.action === 'OBSERVE') {
        const recvQty = parseInt((event as any).quantity) || 1;
        
        // Look backward for shipping event with matching quantity from different org
        for (let j = i - 1; j >= 0; j--) {
          const shipEvent = events[j];
          if (shipEvent.bizStep !== 'shipping' && shipEvent.action !== 'ADD') continue;
          
          const shipOrg = shipEvent.actorOrganization || shipEvent.actorGLN || 'Unknown';
          if (shipOrg === actorOrg) continue; // Same organization, skip
          
          const shipQty = parseInt((shipEvent as any).quantity) || 1;
          if (shipQty !== recvQty) continue; // Quantity doesn't match, keep looking
          
          // Found matching ship! Connect and move on
          this.logger.log(`Creating link: ${shipOrg} -> ${actorOrg} with quantity: ${recvQty}`);
          links.push({
            source: shipOrg,
            target: actorOrg,
            value: recvQty,
            eventTime: event.event_time,
            bizStep: event.biz_step || '',
          });
          break; // Done, one link per receiving event
        }
      }
    }

    // Group by actor type for Sankey visualization
    const portNodes: string[] = [];
    const distributorNodes: string[] = [];
    const facilityNodes: string[] = [];

    for (const event of events) {
      const actorOrg = event.actor_organization || 'Unknown';
      const actorType = event.actor_type || 'unknown';

      if (actorType === 'manufacturer' || actorOrg.toLowerCase().includes('port')) {
        if (!portNodes.includes(actorOrg)) portNodes.push(actorOrg);
      } else if (actorType === 'supplier' || actorType === 'cpa') {
        if (!distributorNodes.includes(actorOrg)) distributorNodes.push(actorOrg);
      } else if (actorType === 'facility' || actorType === 'user_facility') {
        if (!facilityNodes.includes(actorOrg)) facilityNodes.push(actorOrg);
      }
    }

    return {
      consignmentID,
      nodes: Array.from(nodes).map((node, idx) => ({
        id: idx,
        name: node,
        type: portNodes.includes(node)
          ? 'port'
          : distributorNodes.includes(node)
            ? 'distributor'
            : facilityNodes.includes(node)
              ? 'facility'
              : 'unknown',
      })),
      links: links.map((link) => ({
        source: Array.from(nodes).indexOf(link.source),
        target: Array.from(nodes).indexOf(link.target),
        value: link.value,
        eventTime: link.eventTime,
        bizStep: link.bizStep,
      })),
      summary: {
        totalEvents: events.length,
        manufacturerCount: portNodes.length, // Renamed from portCount
        distributorCount: distributorNodes.length,
        facilityCount: facilityNodes.length,
        flowStages: ['manufacturer', 'distributor', 'facility'],
      },
    };
    } catch (error: any) {
      this.logger.error(`Error in getConsignmentFlow for consignment ${consignmentID}:`, {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      
      // If it's already a NotFoundException, re-throw it with the original message
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      // For other errors, throw a more descriptive error
      throw new NotFoundException(
        `Consignment flow not found for ${consignmentID}: ${error?.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Helper to get organization from location GLN
   */
  private async getOrganizationFromLocation(locationId: string): Promise<string | null> {
    // Extract GLN from location URN if possible
    // For now, try to find user by GLN
    if (locationId.includes('sgln:')) {
      const glnMatch = locationId.match(/sgln:([\d.]+)/);
      if (glnMatch) {
        const gln = glnMatch[1].replace(/\./g, '');
        const user = await this.userRepo.findOne({
          where: { gln_number: gln },
        });
        return user?.organization || null;
      }
    }
    return null;
  }

  /**
   * Get all journeys with pagination
   * Single query with joins - no HTTP calls!
   */
  async getAllJourneys(page = 1, limit = 10): Promise<any> {
    const [shipments, total] = await this.shipmentRepo.findAndCount({
      where: { is_dispatched: true, is_deleted: false },
      relations: [
        'packages',
        'packages.cases',
        'packages.cases.products',
        'packages.cases.products.batch',
        'packages.cases.products.batch.product',
        'packages.cases.products.product',
        'user',
      ],
      order: { id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const enriched = shipments.map((ship) => ({
      ...ship,
      userId: ship.user,
    }));

    return {
      data: enriched,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Helper to get user details - PURE SQL (no TypeORM entities!)
   */
  private async getUserDetails(userId: string): Promise<any | null> {
    try {
      const users = await this.dataSource.query(
        `SELECT id, email, organization, gln_number as "gln_number", role
         FROM users
         WHERE id = $1`,
        [userId]
      );
      return users.length > 0 ? users[0] : null;
    } catch (error: any) {
      this.logger.warn(`Failed to get user details for ${userId}: ${error.message}`);
      return null;
    }
  }
}

