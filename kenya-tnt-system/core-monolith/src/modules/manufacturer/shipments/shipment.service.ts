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
    for (const packageId of dto.packageIds) {
      const pkg = await this.packageRepo.findOne({
        where: { id: packageId, userId },
        relations: ['cases', 'cases.products'],
      });

      if (!pkg) {
        throw new NotFoundException(`Package ID ${packageId} not found`);
      }

      if (pkg.isDispatched) {
        throw new BadRequestException(
          `Package ID ${packageId} is already dispatched`,
        );
      }

      packages.push(pkg);
    }

    // Get user's organization to retrieve GS1 prefix
    const user = await this.userRepo.findOne({ where: { id: userId } });
    let companyPrefix: string | undefined;

    if (user?.organization) {
      const supplier = await this.masterDataService.getSupplierByEntityId(
        user.organization,
      );
      if (supplier?.gs1Prefix) {
        companyPrefix = supplier.gs1Prefix;
        this.logger.log(
          `Using GS1 prefix ${companyPrefix} for organization ${user.organization}`,
        );
      } else {
        this.logger.warn(
          `No GS1 prefix found for organization ${user.organization}`,
        );
      }
    }

    // Generate SSCC using GS1 Service (or use provided SSCC)
    let sscc = dto.ssccBarcode;
    if (!sscc || sscc.trim() === '') {
      sscc = await this.gs1Service.generateSSCC(
        companyPrefix ? { companyPrefix } : undefined,
      );
    } else {
      // Validate provided SSCC
      if (!this.gs1Service.validateSSCC(sscc)) {
        throw new BadRequestException(`Invalid SSCC format: ${sscc}`);
      }
      // Check if SSCC already exists
      const existingShipment = await this.shipmentRepo.findOne({
        where: { ssccBarcode: sscc },
      });
      if (existingShipment) {
        throw new BadRequestException(
          `SSCC ${sscc} is already assigned to shipment ${existingShipment.id}`,
        );
      }
    }

    // Resolve master data if IDs provided
    let customer: string | undefined;
    let pickupLocation: string | undefined;
    let destinationAddress: string | undefined;
    let carrier: string | undefined;

    if (dto.supplierId) {
      const supplier = await this.masterDataService.getSupplierById(dto.supplierId);
      if (!supplier) {
        throw new NotFoundException(`Supplier with ID ${dto.supplierId} not found`);
      }
      customer = supplier.legalEntityName;
    } else {
      customer = dto.customer;
      if (!customer) {
        throw new BadRequestException('Either supplierId or customer must be provided');
      }
    }

    if (dto.premiseId) {
      const premise = await this.masterDataService.getPremiseById(dto.premiseId);
      if (!premise) {
        throw new NotFoundException(`Premise with ID ${dto.premiseId} not found`);
      }
      // V08: Use premise name and country (address fields moved to locations table)
      // TODO: Load premise.location relation and use address from there
      pickupLocation = `${premise.premiseName}, ${premise.country}`;
      destinationAddress = pickupLocation;
    } else {
      pickupLocation = dto.pickupLocation;
      destinationAddress = dto.destinationAddress;
      if (!pickupLocation || !destinationAddress) {
        throw new BadRequestException('Either premiseId or both pickupLocation and destinationAddress must be provided');
      }
    }

    if (dto.logisticsProviderId) {
      const lsp = await this.masterDataService.getLogisticsProviderById(dto.logisticsProviderId);
      if (!lsp) {
        throw new NotFoundException(`Logistics Provider with ID ${dto.logisticsProviderId} not found`);
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
      pickupDate: dto.pickupDate,
      expectedDeliveryDate: dto.expectedDeliveryDate,
      pickupLocation,
      destinationAddress,
      carrier,
      userId,
      customerId: dto.customerId,
      isDispatched: true,
      ssccBarcode: sscc,
      isDeleted: false,
      packages,
      // Master data references
      supplierId: dto.supplierId,
      premiseId: dto.premiseId,
      logisticsProviderId: dto.logisticsProviderId,
    });

    const savedShipment = await this.shipmentRepo.save(shipment);

    // Update packages to reference this shipment
    for (const pkg of packages) {
      pkg.shipmentId = savedShipment.id;
      pkg.isDispatched = true;
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
      if (dto.premiseId) {
        const premise = await this.masterDataService.getPremiseById(dto.premiseId);
        premiseGLN = premise?.gln;
      }

      // Build destination list
      const destinationList = premiseGLN
        ? [createSourceDestination(SourceDestinationType.LOCATION, `urn:epc:id:sgln:${premiseGLN}.0.0`)]
        : destinationAddress
          ? [createSourceDestination(SourceDestinationType.LOCATION, `https://example.com/locations/${encodeURIComponent(destinationAddress)}`)]
          : undefined;

      const eventId = await this.gs1Service.createAggregationEvent(
        shipmentEPC,
        packageEPCs,
        {
          bizStep: 'shipping',
          disposition: 'in_transit',
          action: 'ADD', // Explicitly set
          // Business transaction: Link to shipment
          bizTransactionList: [
            createBizTransaction('SHIPMENT', `SHIPMENT-${savedShipment.id}`),
          ],
          destinationList,
          // Actor context (P0 - Critical for L5 TNT)
          actorType: 'manufacturer',
          actorUserId: userId,
          actorGLN: user?.glnNumber,
          actorOrganization: user?.organization,
          sourceEntityType: 'shipment',
          sourceEntityId: savedShipment.id,
        },
      );

      savedShipment.eventId = eventId;
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
      where: { userId, isDeleted: false },
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
      where: { ssccBarcode: sscc, isDeleted: false },
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
  async findOne(id: number, userId: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne({
      where: { id, userId, isDeleted: false },
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

