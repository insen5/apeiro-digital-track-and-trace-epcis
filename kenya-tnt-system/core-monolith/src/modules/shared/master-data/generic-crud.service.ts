import { Injectable, Logger } from '@nestjs/common';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';

/**
 * Generic CRUD Service
 * Handles common CRUD operations with pagination and search
 * Eliminates duplicate getXXX methods across different entity types
 */

export interface CrudConfig {
  entity_type: string;
  repository: Repository<any>;
  searchFields?: string[]; // Fields to search in (e.g., ['name', 'code'])
  defaultOrderBy?: { field: string; direction: 'ASC' | 'DESC' };
  relations?: string[]; // Related entities to load
  filterConditions?: any; // Additional where conditions (e.g., { status: 'Active' })
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class GenericCrudService {
  private readonly logger = new Logger(GenericCrudService.name);

  /**
   * Get paginated list with optional search
   * Replaces: getSuppliers, getPremises, getLogisticsProviders, getUatFacilities
   */
  async getPaginated<T>(
    config: CrudConfig,
    page: number = 1,
    limit: number = 50,
    search?: string
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * limit;
    const queryBuilder = config.repository.createQueryBuilder(config.entityType);

    // Add relations
    if (config.relations) {
      config.relations.forEach((relation) => {
        queryBuilder.leftJoinAndSelect(`${config.entityType}.${relation}`, relation);
      });
    }

    // Add filter conditions
    if (config.filterConditions) {
      Object.entries(config.filterConditions).forEach(([key, value], index) => {
        if (index === 0) {
          queryBuilder.where(`${config.entityType}.${key} = :${key}`, { [key]: value });
        } else {
          queryBuilder.andWhere(`${config.entityType}.${key} = :${key}`, { [key]: value });
        }
      });
    }

    // Add search
    if (search && config.searchFields && config.searchFields.length > 0) {
      const searchConditions = config.searchFields
        .map((field) => `${config.entityType}.${field} ILIKE :search`)
        .join(' OR ');
      
      if (config.filterConditions) {
        queryBuilder.andWhere(`(${searchConditions})`, { search: `%${search}%` });
      } else {
        queryBuilder.where(`(${searchConditions})`, { search: `%${search}%` });
      }
    }

    // Add ordering
    if (config.defaultOrderBy) {
      queryBuilder.orderBy(
        `${config.entityType}.${config.defaultOrderBy.field}`,
        config.defaultOrderBy.direction
      );
    }

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      data: data as T[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single entity by ID with relations
   * Replaces: getSupplierById, getPremiseById, getLogisticsProviderById
   */
  async getById<T>(config: CrudConfig, id: number): Promise<T | null> {
    return await config.repository.findOne({
      where: { id } as any,
      relations: config.relations || [],
    });
  }

  /**
   * Get all entities without pagination
   * Replaces: getAllProducts, etc.
   */
  async getAll<T>(config: CrudConfig): Promise<T[]> {
    const queryBuilder = config.repository.createQueryBuilder(config.entityType);

    // Add filter conditions
    if (config.filterConditions) {
      Object.entries(config.filterConditions).forEach(([key, value], index) => {
        if (index === 0) {
          queryBuilder.where(`${config.entityType}.${key} = :${key}`, { [key]: value });
        } else {
          queryBuilder.andWhere(`${config.entityType}.${key} = :${key}`, { [key]: value });
        }
      });
    }

    // Add ordering
    if (config.defaultOrderBy) {
      queryBuilder.orderBy(
        `${config.entityType}.${config.defaultOrderBy.field}`,
        config.defaultOrderBy.direction
      );
    }

    return await queryBuilder.getMany();
  }

  /**
   * Get stats for an entity type
   * Generic implementation for total count and last sync date
   */
  async getStats(
    config: CrudConfig,
    syncDateField: string = 'lastSyncedAt'
  ): Promise<{ total: number; lastSynced: Date | null }> {
    const queryBuilder = config.repository.createQueryBuilder(config.entityType);

    // Add filter conditions
    if (config.filterConditions) {
      Object.entries(config.filterConditions).forEach(([key, value]) => {
        queryBuilder.andWhere(`${config.entityType}.${key} = :${key}`, { [key]: value });
      });
    }

    const total = await queryBuilder.getCount();

    const lastSyncedEntity = await config.repository
      .createQueryBuilder(config.entityType)
      .select(`${config.entityType}.${syncDateField}`, syncDateField)
      .where(`${config.entityType}.${syncDateField} IS NOT NULL`)
      .orderBy(`${config.entityType}.${syncDateField}`, 'DESC')
      .limit(1)
      .getRawOne();

    return {
      total,
      lastSynced: lastSyncedEntity ? lastSyncedEntity[syncDateField] : null,
    };
  }
}
