import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { ProductVerifications } from '../../domain/entities/product-verifications.entity';

@Injectable()
export class ProductVerificationsService {
  private readonly logger = new Logger(ProductVerificationsService.name);

  constructor(
    @InjectRepository(ProductVerifications)
    private readonly verificationsRepo: Repository<ProductVerifications>,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 50,
    sgtin?: string,
    productId?: number,
    batchId?: number,
    verificationResult?: string,
    verifierUserId?: string,
    isConsumerVerification?: boolean,
  ): Promise<{
    data: ProductVerifications[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const where: FindOptionsWhere<ProductVerifications> = {};

    if (sgtin) where.sgtin = Like(`%${sgtin}%`);
    if (productId) where.productId = productId;
    if (batchId) where.batchId = batchId;
    if (verificationResult) where.verificationResult = verificationResult;
    if (verifierUserId) where.verifierUserId = verifierUserId;
    if (isConsumerVerification !== undefined)
      where.isConsumerVerification = isConsumerVerification;

    const [data, total] = await this.verificationsRepo.findAndCount({
      where,
      relations: ['product', 'batch', 'verifier'],
      order: { verificationTimestamp: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<ProductVerifications> {
    const verification = await this.verificationsRepo.findOne({
      where: { id },
      relations: ['product', 'batch', 'verifier'],
    });

    if (!verification) {
      throw new NotFoundException(
        `Verification record with ID ${id} not found`,
      );
    }

    return verification;
  }

  async findBySGTIN(sgtin: string): Promise<ProductVerifications[]> {
    return await this.verificationsRepo.find({
      where: { sgtin },
      relations: ['product', 'batch', 'verifier'],
      order: { verificationTimestamp: 'DESC' },
    });
  }

  async create(
    data: Partial<ProductVerifications>,
  ): Promise<ProductVerifications> {
    const verification = this.verificationsRepo.create(data);
    return await this.verificationsRepo.save(verification);
  }

  async update(
    id: number,
    data: Partial<ProductVerifications>,
  ): Promise<ProductVerifications> {
    await this.findOne(id); // Verify exists
    await this.verificationsRepo.update(id, data);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.findOne(id); // Verify exists
    await this.verificationsRepo.delete(id);
  }

  async getVerificationStats(): Promise<{
    total: number;
    valid: number;
    invalid: number;
    counterfeit: number;
    expired: number;
    consumerVerifications: number;
  }> {
    const [total, valid, invalid, counterfeit, expired, consumerVerifications] =
      await Promise.all([
        this.verificationsRepo.count(),
        this.verificationsRepo.count({
          where: { verificationResult: 'VALID' },
        }),
        this.verificationsRepo.count({
          where: { verificationResult: 'INVALID' },
        }),
        this.verificationsRepo.count({
          where: { verificationResult: 'COUNTERFEIT' },
        }),
        this.verificationsRepo.count({
          where: { verificationResult: 'EXPIRED' },
        }),
        this.verificationsRepo.count({
          where: { isConsumerVerification: true },
        }),
      ]);

    return {
      total,
      valid,
      invalid,
      counterfeit,
      expired,
      consumerVerifications,
    };
  }
}
