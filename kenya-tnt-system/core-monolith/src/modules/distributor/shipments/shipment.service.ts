import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Shipment } from '../../../shared/domain/entities/shipment.entity';
import { Package } from '../../../shared/domain/entities/package.entity';
import { Case } from '../../../shared/domain/entities/case.entity';
import { User } from '../../../shared/domain/entities/user.entity';
import { ReceiveShipmentDto } from '../dto/receive-shipment.dto';
import { ForwardShipmentDto } from '../dto/forward-shipment.dto';
import { GS1Service, createBizTransaction, createSourceDestination, SourceDestinationType } from '../../../shared/gs1/gs1.service';
import { MasterDataService } from '../../shared/master-data/master-data.service';

/**
 * Shipment Service (Distributor Module)
 *
 * Handles receiving shipments from manufacturers and forwarding to facilities.
 * - Receives shipments by parent SSCC
 * - Forwards shipments with new SSCC
 * - Uses GS1 Service for SSCC generation and EPCIS events
 */
@Injectable()
export class DistributorShipmentService {
  private readonly logger = new Logger(DistributorShipmentService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(Case)
    private readonly caseRepo: Repository<Case>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gs1Service: GS1Service,
    private readonly masterDataService: MasterDataService,
  ) {}

  /**
   * Receive a shipment from manufacturer (by parent SSCC)
   * In single database, we can query directly - no HTTP call needed!
   */
  async receiveShipment(
    user_id: string,
    dto: ReceiveShipmentDto,
  ): Promise<Shipment> {
    // Check if shipment already received
    const existing = await this.shipmentRepo.findOne({
      where: {
        parent_sscc_barcode: dto.sscc_barcode,
        user_id,
        is_dispatched: false,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Shipment with parent SSCC ${dto.sscc_barcode} already received`,
      );
    }

    // Find parent shipment (from manufacturer) - direct DB query!
    const parentShipment = await this.shipmentRepo.findOne({
      where: {
        sscc_barcode: dto.sscc_barcode,
        is_deleted: false,
      },
      relations: ['packages', 'packages.cases'],
    });

    if (!parentShipment) {
      throw new NotFoundException(
        `Shipment with SSCC ${dto.sscc_barcode} not found`,
      );
    }

    // Create received shipment record
    const receivedShipment = this.shipmentRepo.create({
      customer: dto.customer,
      pickup_date: dto.pickup_date,
      expected_delivery_date: dto.expected_delivery_date,
      pickup_location: dto.pickup_location,
      destination_address: dto.destination_address,
      carrier: dto.carrier,
      user_id,
      is_dispatched: false,
      sscc_barcode: '', // Will be set when forwarding
      parent_sscc_barcode: dto.sscc_barcode,
      is_deleted: false,
    });

    const saved = await this.shipmentRepo.save(receivedShipment);

    // Copy packages from parent shipment (or create references)
    // For now, we'll create new packages that reference the same cases
    // In production, you might want to copy the entire structure

    // Create EPCIS receive event
    const parentEPC = `https://example.com/shipments/${dto.sscc_barcode.replace(/\s+/g, '')}`;
    const receiveEPC = `https://example.com/shipments/received/${saved.id}`;

    // Get user to determine actor_type based on role
    let actor_type = 'supplier'; // Default for distributor/supplier
    try {
      const user = await this.userRepo.findOne({ where: { id: user_id } });
      if (user) {
        // Map user roles to actor types
        if (user.role === 'manufacturer') {
          actor_type = 'manufacturer';
        } else if (user.role === 'cpa') {
          actor_type = 'cpa'; // CPA/Supplier/Distributor
        } else if (user.role === 'user_facility') {
          actor_type = 'user_facility';
        }
      }
    } catch (userError: any) {
      this.logger.warn(`Failed to fetch user ${user_id} for actor_type: ${userError.message}`);
    }

    try {
      const receive_event_id = await this.gs1Service.createAggregationEvent(
        receiveEPC,
        [parentEPC],
        {
          bizStep: 'receiving',
          disposition: 'in_progress',
          actor_user_id: user_id, // Add user context so journey shows organization
          actor_type, // Add actor type so it's counted in correct category
        },
      );

      saved.receive_event_id = receive_event_id;
      await this.shipmentRepo.save(saved);
    } catch (error: any) {
      this.logger.error(
        `Failed to create receive EPCIS event for shipment ${saved.id}`,
        error?.message,
      );
    }

    this.logger.log(
      `Shipment received: ${saved.id} from parent SSCC ${dto.sscc_barcode}`,
    );
    return saved;
  }

  /**
   * Forward a received shipment to a facility
   * Creates new shipment with new SSCC
   */
  async forwardShipment(
    user_id: string,
    dto: ForwardShipmentDto,
  ): Promise<Shipment> {
    // Find received shipment
    const receivedShipment = await this.shipmentRepo.findOne({
      where: {
        id: dto.received_shipment_id,
        user_id,
        is_dispatched: false,
      },
      relations: ['packages'],
    });

    if (!receivedShipment) {
      throw new NotFoundException(
        `Received shipment with ID ${dto.received_shipment_id} not found`,
      );
    }

    if (receivedShipment.is_dispatched) {
      throw new BadRequestException('Shipment already forwarded');
    }

    // Generate new SSCC using GS1 Service
    const newSSCC = await this.gs1Service.generateSSCC();

    // Create forwarded shipment
    const forwardedShipment = this.shipmentRepo.create({
      customer: dto.customer,
      pickup_date: dto.pickup_date,
      expected_delivery_date: dto.expected_delivery_date,
      pickup_location: dto.pickup_location,
      destination_address: dto.destination_address,
      carrier: dto.carrier,
      user_id,
      customer_id: dto.customer_id,
      is_dispatched: true,
      sscc_barcode: newSSCC,
      parent_sscc_barcode: receivedShipment.parent_sscc_barcode || receivedShipment.sscc_barcode,
      is_deleted: false,
      packages: receivedShipment.packages, // Reference same packages
    });

    const saved = await this.shipmentRepo.save(forwardedShipment);

    // Mark received shipment as dispatched
    receivedShipment.is_dispatched = true;
    await this.shipmentRepo.save(receivedShipment);

    // Create EPCIS forward event with complete actor and destination information
    // Use the parent SSCC as the child EPC (we're forwarding the received container)
    const parentSSCC = receivedShipment.parent_sscc_barcode || receivedShipment.sscc_barcode;
    const packageEPCs = parentSSCC 
      ? [`https://example.com/shipments/${parentSSCC.replace(/\s+/g, '')}`]
      : [];
    const shipmentEPC = `https://example.com/shipments/${newSSCC.replace(/\s+/g, '')}`;

    try {
      // Get user for actor context
      const user = await this.userRepo.findOne({ where: { id: user_id } });
      
      // Check if destination_address is a GLN (13 digits) for proper EPCIS formatting
      let premiseGLN: string | undefined;
      if (dto.destination_address && /^\d{13}$/.test(dto.destination_address)) {
        premiseGLN = dto.destination_address;
      }

      // Build destination list with proper GLN format
      const destination_list = premiseGLN
        ? [createSourceDestination(SourceDestinationType.LOCATION, `urn:epc:id:sgln:${premiseGLN}.0.0`)]
        : dto.destination_address
          ? [createSourceDestination(SourceDestinationType.LOCATION, `https://example.com/locations/${encodeURIComponent(dto.destination_address)}`)]
          : undefined;

      const eventId = await this.gs1Service.createAggregationEvent(
        shipmentEPC,
        packageEPCs,
        {
          bizStep: 'shipping',
          disposition: 'in_transit',
          action: 'ADD', // Explicitly set action
          // Business transaction: Link to shipment
          biz_transaction_list: [
            createBizTransaction('SHIPMENT', `SHIPMENT-${saved.id}`),
          ],
          destination_list,
          // Actor context (Critical for L5 TNT journey tracking)
          actor_type: 'distributor',
          actor_user_id: user_id,
          actor_gln: user?.gln_number,
          actor_organization: user?.organization || 'Distributor',
          source_entity_type: 'shipment',
          source_entity_id: saved.id,
        },
      );

      saved.event_id = eventId;
      await this.shipmentRepo.save(saved);
      this.logger.log(`Created EPCIS event ${eventId} for forward shipment ${saved.id}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to create forward EPCIS event for shipment ${saved.id}`,
        error?.message,
      );
    }

    this.logger.log(
      `Shipment forwarded: ${saved.id} - New SSCC: ${newSSCC}`,
    );
    return saved;
  }

  /**
   * Get all received shipments for a user
   */
  async getReceivedShipments(userId: string): Promise<Shipment[]> {
    try {
      return await this.shipmentRepo.find({
        where: {
          user_id,
          parent_sscc_barcode: Not(null),
          is_deleted: false,
        },
        relations: ['packages', 'packages.cases'],
        order: { id: 'DESC' },
      });
    } catch (error: any) {
      this.logger.error(`Failed to get received shipments: ${error.message}`, error.stack);
      // Return empty array if there's an error (e.g., DB connection issue)
      return [];
    }
  }

  /**
   * Get forwardable received shipments (received but not yet dispatched/forwarded)
   * These are shipments the distributor has received and can now forward to facilities
   */
  async getForwardableShipments(userId: string): Promise<Shipment[]> {
    try {
      // Use createQueryBuilder for proper IS NOT NULL check
      return await this.shipmentRepo
        .createQueryBuilder('shipment')
        .leftJoinAndSelect('shipment.packages', 'packages')
        .leftJoinAndSelect('packages.cases', 'cases')
        .where('shipment.user_id = :user_id', { user_id })
        .andWhere('shipment.parent_sscc_barcode IS NOT NULL')
        .andWhere('shipment.is_dispatched = :is_dispatched', { is_dispatched: false })
        .andWhere('shipment.is_deleted = :is_deleted', { is_deleted: false })
        .orderBy('shipment.id', 'DESC')
        .getMany();
    } catch (error: any) {
      this.logger.error(`Failed to get forwardable shipments: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get shipment by parent SSCC
   */
  async findByParentSSCC(
    parentSSCC: string,
    user_id: string,
  ): Promise<Shipment[]> {
    return this.shipmentRepo.find({
      where: {
        parent_sscc_barcode: parentSSCC,
        user_id,
        is_deleted: false,
      },
      relations: ['packages', 'packages.cases'],
    });
  }

  /**
   * Get pending shipments for distributor (shipments dispatched but not yet received)
   * Matches shipments by destination address or GLN
   * Returns shipments with GS1-compliant information
   * Excludes shipments that have already been received (have a received shipment record)
   */
  async getPendingShipments(userId: string): Promise<Shipment[]> {
    try {
      // Get user to find their organization/GLN
      const user = await this.userRepo.findOne({ where: { id: user_id } });
      
      if (!user) {
        return [];
      }

      // Get supplier/distributor by user's organization (entityId)
      const supplier = await this.masterDataService.getSupplierByEntityId(user.organization);
      
      // Build query for pending shipments (dispatched but not received)
      // Exclude shipments that have already been received by checking if there's a received shipment
      // with the same parent_sscc_barcode
      const queryBuilder = this.shipmentRepo
        .createQueryBuilder('shipment')
        .leftJoinAndSelect('shipment.packages', 'packages')
        .leftJoinAndSelect('packages.cases', 'cases')
        .leftJoin(
          'shipment',
          'received',
          'received.parent_sscc_barcode = shipment.sscc_barcode AND received.user_id = :user_id AND received.is_deleted = false',
          { user_id }
        )
        .where('shipment.is_dispatched = :is_dispatched', { is_dispatched: true })
        .andWhere('shipment.parent_sscc_barcode IS NULL') // Original shipment, not a received copy
        .andWhere('shipment.is_deleted = :is_deleted', { is_deleted: false })
        .andWhere('received.id IS NULL'); // Not yet received by this distributor

      // Match by destination address or GLN
      // IMPORTANT: Match organization name, GLN, or SGLN patterns
      const conditions: string[] = [];
      const params: any = {};

      // Match by organization name (e.g., "KEMSA")
      if (user.organization) {
        // Extract key parts of organization name (e.g., "KEMSA" from "KEMSA (Kenya Medical Supplies Authority)")
        const orgParts = user.organization.split(/[\s()]+/).filter(part => part.length > 2);
        orgParts.forEach((part, index) => {
          conditions.push(`shipment.destination_address ILIKE :orgPart${index}`);
          params[`orgPart${index}`] = `%${part}%`;
        });
      }

      // Match by GLN (in various formats)
      if (user.gln_number) {
        // Match GLN directly
        conditions.push('shipment.destination_address ILIKE :userGLN');
        params.userGLN = `%${user.gln_number}%`;
        
        // Match SGLN format: urn:epc:id:sgln:061414100.00013.0
        // GLN 0614141000013 becomes 061414100.00013 in SGLN
        const glnFormatted = user.gln_number.substring(0, 9) + '.' + user.gln_number.substring(9);
        conditions.push('shipment.destination_address ILIKE :sglnFormat');
        params.sglnFormat = `%${glnFormatted}%`;
      }

      if (supplier) {
        // Match by supplier's GLN (V08: address fields removed)
        // if (supplier.hqLocation?.addressLine1) {
        //   conditions.push('shipment.destination_address ILIKE :hqAddress');
        //   params.hqAddress = `%${supplier.hqLocation.addressLine1}%`;
        // }
        if (supplier.hqGLN) {
          conditions.push('shipment.destination_address ILIKE :hqGLN');
          params.hqGLN = `%${supplier.hqGLN}%`;
        }
        if (supplier.legalEntityGLN) {
          conditions.push('shipment.destination_address ILIKE :legalGLN');
          params.legalGLN = `%${supplier.legalEntityGLN}%`;
        }
        // Match by supplier legal entity name
        if (supplier.legalEntityName) {
          conditions.push('shipment.destination_address ILIKE :supplierName');
          params.supplierName = `%${supplier.legalEntityName}%`;
        }
      }

      // If we have conditions, add them
      if (conditions.length > 0) {
        queryBuilder.andWhere(`(${conditions.join(' OR ')})`, params);
      } else {
        // Fallback: show all pending shipments for this user
        this.logger.warn(`No matching conditions for user ${user_id}, showing all pending shipments`);
      }

      return await queryBuilder
        .orderBy('shipment.pickup_date', 'DESC')
        .getMany();
    } catch (error: any) {
      this.logger.error(`Failed to get pending shipments: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Assign SSCC to a package (pallet) - for distributor re-cartonization
   * @deprecated Use shared PackageService.assignSSCC() instead
   * This method is kept for backward compatibility but should be removed.
   */
  async assignSSCCToPackage(
    packageId: number,
    user_id: string,
    sscc?: string,
  ): Promise<Package> {
    // This method is deprecated - use PackageService.assignSSCC() instead
    // Keeping for backward compatibility during migration
    throw new BadRequestException(
      'This method is deprecated. Use PackageService.assignSSCC() from shared/packages module instead.',
    );
  }

  /**
   * Assign SSCC to a case (carton) - for distributor re-cartonization
   * @deprecated Use shared CaseService.assignSSCC() instead
   * This method is kept for backward compatibility but should be removed.
   */
  async assignSSCCToCase(
    caseId: number,
    user_id: string,
    sscc?: string,
  ): Promise<Case> {
    // This method is deprecated - use CaseService.assignSSCC() instead
    // Keeping for backward compatibility during migration
    throw new BadRequestException(
      'This method is deprecated. Use CaseService.assignSSCC() from shared/cases module instead.',
    );
  }
}

