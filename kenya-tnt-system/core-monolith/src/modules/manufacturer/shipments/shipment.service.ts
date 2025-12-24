import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from '../../../shared/domain/entities/shipment.entity';
import { Package } from '../../../shared/domain/entities/package.entity';
import { User } from '../../../shared/domain/entities/user.entity';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { GS1Service, createBizTransaction, createSourceDestination, SourceDestinationType } from '../../../shared/gs1/gs1.service';
import { MasterDataService } from '../../shared/master-data/master-data.service';

/**
 * Shipment Service (Manufacturer Module)
 *
 * Creates shipments by aggregating packages.
 * - Uses GS1 Service for SSCC generation
 * - Uses GS1 Service for EPCIS events
 */
@Injectable()
export class ShipmentService {
  private readonly logger = new Logger(ShipmentService.name);

  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: Repository<Shipment>,
    @InjectRepository(Package)
    private readonly packageRepo: Repository<Package>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gs1Service: GS1Service,
    private readonly masterDataService: MasterDataService,
  ) {}

  /**
   * Create a shipment by aggregating packages
   */
  async create(
    userId: string,
    dto: CreateShipmentDto,
  ): Promise<Shipment> {
    // Validate all packages exist and are not dispatched
    const packages = [];
    for (const packageId of dto.package_ids) {
      const pkg = await this.packageRepo.findOne({
        where: { id: packageId, user_id: userId },
        relations: ['cases', 'cases.products'],
      });

      if (!pkg) {
        throw new NotFoundException(`Package ID ${packageId} not found`);
      }

      if (pkg.is_dispatched) {
        throw new BadRequestException(
          `Package ID ${packageId} is already dispatched`,
        );
      }

      packages.push(pkg);
    }

    // Get user's organization to retrieve GS1 prefix
    const user = await this.userRepo.findOne({ where: { id: userId } });
    let company_prefix: string | undefined;

    if (user?.organization) {
      const supplier = await this.masterDataService.getSupplierByEntityId(
        user.organization,
      );
      if (supplier?.gs1Prefix) {
        company_prefix = supplier.gs1Prefix;
        this.logger.log(
          `Using GS1 prefix ${company_prefix} for organization ${user.organization}`,
        );
      } else {
        this.logger.warn(
          `No GS1 prefix found for organization ${user.organization}`,
        );
      }
    }

    // Generate SSCC using GS1 Service (or use provided SSCC)
    let sscc = dto.sscc_barcode;
    if (!sscc || sscc.trim() === '') {
      sscc = await this.gs1Service.generateSSCC(
        company_prefix ? { company_prefix } : undefined,
      );
    } else {
      // Validate provided SSCC
      if (!this.gs1Service.validateSSCC(sscc)) {
        throw new BadRequestException(`Invalid SSCC format: ${sscc}`);
      }
      // Check if SSCC already exists
      const existingShipment = await this.shipmentRepo.findOne({
        where: { sscc_barcode: sscc },
      });
      if (existingShipment) {
        throw new BadRequestException(
          `SSCC ${sscc} is already assigned to shipment ${existingShipment.id}`,
        );
      }
    }

    // Resolve master data if IDs provided
    let customer: string | undefined;
    let pickup_location: string | undefined;
    let destination_address: string | undefined;
    let carrier: string | undefined;

    if (dto.supplier_id) {
      const supplier = await this.masterDataService.getSupplierById(dto.supplier_id);
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${dto.supplier_id} not found`);
      }
      customer = supplier.legalEntityName;
    } else {
      customer = dto.customer;
      if (!customer) {
        throw new BadRequestException('Either supplierId or customer must be provided');
      }
    }

    if (dto.premise_id) {
      const premise = await this.masterDataService.getPremiseById(dto.premise_id);
      if (!premise) {
        throw new NotFoundException(`Premise with ID ${dto.premise_id} not found`);
      }
      // V08: Use premise name and country (address fields moved to locations table)
      // TODO: Load premise.location relation and use address from there
      pickup_location = `${premise.premiseName}, ${premise.country}`;
      destination_address = pickup_location;
    } else {
      pickup_location = dto.pickup_location;
      destination_address = dto.destination_address;
      if (!pickup_location || !destination_address) {
        throw new BadRequestException('Either premiseId or both pickup_location and destination_address must be provided');
      }
    }

    if (dto.logistics_provider_id) {
      const lsp = await this.masterDataService.getLogisticsProviderById(dto.logistics_provider_id);
      if (!lsp) {
        throw new NotFoundException(`Logistics Provider with ID ${dto.logistics_provider_id} not found`);
      }
      carrier = lsp.name;
    } else {
      carrier = dto.carrier;
      if (!carrier) {
        throw new BadRequestException('Either logisticsProviderId or carrier must be provided');
      }
    }

    // Create shipment
    const shipment = this.shipmentRepo.create({
      customer,
      pickup_date: dto.pickup_date,
      expected_delivery_date: dto.expected_delivery_date,
      pickup_location,
      destination_address,
      carrier,
      user_id: userId,
      customer_id: dto.customer_id,
      is_dispatched: true,
      sscc_barcode: sscc,
      is_deleted: false,
      packages,
      // Master data references
      supplier_id: dto.supplier_id,
      premise_id: dto.premise_id,
      logistics_provider_id: dto.logistics_provider_id,
    });

    const savedShipment = await this.shipmentRepo.save(shipment);

    // Update packages to reference this shipment
    for (const pkg of packages) {
      pkg.shipment_id = savedShipment.id;
      pkg.is_dispatched = true;
      await this.packageRepo.save(pkg);
    }

    // Create EPCIS AggregationEvent using GS1 Service
    const packageEPCs = packages.map(
      (p) => `https://example.com/packages/${p.label.replace(/\s+/g, '')}`,
    );
    const shipmentEPC = `https://example.com/shipments/${sscc.replace(/\s+/g, '')}`;

    try {
      // Get user for actor context (already fetched above)
      // Get premise GLN if available for destination
      let premiseGLN: string | undefined;
      if (dto.premise_id) {
        const premise = await this.masterDataService.getPremiseById(dto.premise_id);
        premiseGLN = premise?.gln;
      }

      // Build destination list
      const destinationList = premiseGLN
        ? [createSourceDestination(SourceDestinationType.LOCATION, `urn:epc:id:sgln:${premiseGLN}.0.0`)]
        : destination_address
          ? [createSourceDestination(SourceDestinationType.LOCATION, `https://example.com/locations/${encodeURIComponent(destination_address)}`)]
          : undefined;

      const eventId = await this.gs1Service.createAggregationEvent(
        shipmentEPC,
        packageEPCs,
        {
          bizStep: 'shipping',
          disposition: 'in_transit',
          action: 'ADD', // Explicitly set
          // Business transaction: Link to shipment
          biz_transaction_list: [
            createBizTransaction('SHIPMENT', `SHIPMENT-${savedShipment.id}`),
          ],
          destination_list: destinationList,
          // Actor context (P0 - Critical for L5 TNT)
          actor_type: 'manufacturer',
          actor_user_id: userId,
          actor_gln: user?.gln_number,
          actor_organization: user?.organization,
          source_entity_type: 'shipment',
          source_entity_id: savedShipment.id,
        },
      );

      savedShipment.event_id = eventId;
      await this.shipmentRepo.save(savedShipment);
    } catch (error: any) {
      this.logger.error(
        `Failed to create EPCIS event for shipment ${savedShipment.id}`,
        error?.message,
      );
    }

    this.logger.log(`Shipment created: ${savedShipment.id} - SSCC: ${sscc}`);
    return savedShipment;
  }

  /**
   * Get all shipments for a user
   */
  async findAll(userId: string): Promise<Shipment[]> {
    return this.shipmentRepo.find({
      where: { user_id, is_deleted: false },
      relations: [
        'packages',
        'packages.cases',
        'packages.cases.products',
        'packages.cases.products.batch',
      ],
      order: { id: 'DESC' },
    });
  }

  /**
   * Get shipment by SSCC
   */
  async findBySSCC(sscc: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { sscc_barcode: sscc, is_deleted: false },
      relations: [
        'packages',
        'packages.cases',
        'packages.cases.products',
        'packages.cases.products.batch',
        'user',
      ],
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with SSCC ${sscc} not found`);
    }

    return shipment;
  }

  /**
   * Get shipment by ID
   */
  async findOne(id: number, user_id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id, user_id, is_deleted: false },
      relations: [
        'packages',
        'packages.cases',
        'packages.cases.products',
        'packages.cases.products.batch',
      ],
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with ID ${id} not found`);
    }

    return shipment;
  }
}

