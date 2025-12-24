import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { FacilityReceiving } from '../../domain/entities/facility-receiving.entity';
import { FacilityDispensing } from '../../domain/entities/facility-dispensing.entity';
import { FacilityInventory } from '../../domain/entities/facility-inventory.entity';

@Injectable()
export class FacilityOperationsService {
  private readonly logger = new Logger(FacilityOperationsService.name);

  constructor(
    @InjectRepository(FacilityReceiving)
    private readonly receivingRepo: Repository<FacilityReceiving>,
    @InjectRepository(FacilityDispensing)
    private readonly dispensingRepo: Repository<FacilityDispensing>,
    @InjectRepository(FacilityInventory)
    private readonly inventoryRepo: Repository<FacilityInventory>,
  ) {}

  // ==================== Receiving Operations ====================

  async findAllReceiving(
    page: number = 1,
    limit: number = 50,
    facilityUserId?: string,
    shipmentId?: number,
    consignmentId?: number,
  ): Promise<{
    data: FacilityReceiving[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<FacilityReceiving> = {};

    if (facilityUserId) where.facilityUserId = facilityUserId;
    if (shipmentId) where.shipment_id = shipmentId;
    if (consignmentId) where.consignment_id = consignmentId;

    const [data, total] = await this.receivingRepo.findAndCount({
      where,
      relations: ['facility', 'shipment', 'consignment', 'receivedByUser'],
      order: { receivedDate: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOneReceiving(id: number): Promise<FacilityReceiving> {
    const receiving = await this.receivingRepo.findOne({
      where: { id },
      relations: ['facility', 'shipment', 'consignment', 'receivedByUser'],
    });

    if (!receiving) {
      throw new NotFoundException(`Receiving record with ID ${id} not found`);
    }

    return receiving;
  }

  async createReceiving(
    data: Partial<FacilityReceiving>,
  ): Promise<FacilityReceiving> {
    const receiving = this.receivingRepo.create(data);
    return await this.receivingRepo.save(receiving);
  }

  async updateReceiving(
    id: number,
    data: Partial<FacilityReceiving>,
  ): Promise<FacilityReceiving> {
    await this.findOneReceiving(id); // Verify exists
    await this.receivingRepo.update(id, data);
    return this.findOneReceiving(id);
  }

  // ==================== Dispensing Operations ====================

  async findAllDispensing(
    page: number = 1,
    limit: number = 50,
    facilityUserId?: string,
    productId?: number,
    batchId?: number,
    patientId?: string,
  ): Promise<{
    data: FacilityDispensing[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<FacilityDispensing> = {};

    if (facilityUserId) where.facilityUserId = facilityUserId;
    if (productId) where.product_id = productId;
    if (batchId) where.batch_id = batchId;
    if (patientId) where.patientId = patientId;

    const [data, total] = await this.dispensingRepo.findAndCount({
      where,
      relations: ['facility', 'product', 'batch', 'dispensedByUser'],
      order: { dispensingDate: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOneDispensing(id: number): Promise<FacilityDispensing> {
    const dispensing = await this.dispensingRepo.findOne({
      where: { id },
      relations: ['facility', 'product', 'batch', 'dispensedByUser'],
    });

    if (!dispensing) {
      throw new NotFoundException(`Dispensing record with ID ${id} not found`);
    }

    return dispensing;
  }

  async createDispensing(
    data: Partial<FacilityDispensing>,
  ): Promise<FacilityDispensing> {
    const dispensing = this.dispensingRepo.create(data);
    return await this.dispensingRepo.save(dispensing);
  }

  async updateDispensing(
    id: number,
    data: Partial<FacilityDispensing>,
  ): Promise<FacilityDispensing> {
    await this.findOneDispensing(id); // Verify exists
    await this.dispensingRepo.update(id, data);
    return this.findOneDispensing(id);
  }

  // ==================== Inventory Operations ====================

  async findAllInventory(
    page: number = 1,
    limit: number = 50,
    facilityUserId?: string,
    productId?: number,
    batchId?: number,
  ): Promise<{
    data: FacilityInventory[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<FacilityInventory> = {};

    if (facilityUserId) where.facilityUserId = facilityUserId;
    if (productId) where.product_id = productId;
    if (batchId) where.batch_id = batchId;

    const [data, total] = await this.inventoryRepo.findAndCount({
      where,
      relations: ['facility', 'product', 'batch'],
      order: { lastUpdated: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOneInventory(
    facilityUserId: string,
    productId: number,
    batchId: number,
  ): Promise<FacilityInventory> {
    const inventory = await this.inventoryRepo.findOne({
      where: { facilityUserId, productId, batchId },
      relations: ['facility', 'product', 'batch'],
    });

    if (!inventory) {
      throw new NotFoundException(
        `Inventory record not found for facility ${facilityUserId}, product ${productId}, batch ${batchId}`,
      );
    }

    return inventory;
  }

  async createOrUpdateInventory(
    data: Partial<FacilityInventory>,
  ): Promise<FacilityInventory> {
    const existing = await this.inventoryRepo.findOne({
      where: {
        facilityUserId: data.facilityUserId!,
        productId: data.product_id!,
        batchId: data.batch_id!,
      },
    });

    if (existing) {
      Object.assign(existing, data);
      existing.lastUpdated = new Date();
      return await this.inventoryRepo.save(existing);
    } else {
      const inventory = this.inventoryRepo.create(data);
      return await this.inventoryRepo.save(inventory);
    }
  }

  async updateInventory(
    facilityUserId: string,
    productId: number,
    batchId: number,
    data: Partial<FacilityInventory>,
  ): Promise<FacilityInventory> {
    await this.findOneInventory(facilityUserId, productId, batchId); // Verify exists
    await this.inventoryRepo.update(
      { facilityUserId, productId, batchId },
      { ...data, lastUpdated: new Date() },
    );
    return this.findOneInventory(facilityUserId, productId, batchId);
  }
}
