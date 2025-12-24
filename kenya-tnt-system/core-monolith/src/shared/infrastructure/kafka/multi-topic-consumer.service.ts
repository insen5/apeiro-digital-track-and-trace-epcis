import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { MasterDataService } from '../../../modules/shared/master-data/master-data.service';
import { ConsignmentService } from '../../../modules/shared/consignments/consignment.service';
import { ImportPPBConsignmentDto } from '../../../modules/shared/consignments/dto/import-ppb-consignment.dto';

interface TopicHandler {
  topic: string;
  handler: (message: any, headers?: any) => Promise<void>;
}

@Injectable()
export class MultiTopicConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MultiTopicConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private topicHandlers: Map<string, TopicHandler['handler']> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly masterDataService: MasterDataService,
    private readonly consignmentService: ConsignmentService,
  ) {
    const brokers = this.configService
      .get<string>('KAFKA_BROKERS', 'localhost:9092')
      .split(',');

    this.kafka = new Kafka({
      clientId: 'ppb-master-data-consumer',
      brokers,
      retry: {
        retries: 8,
        initialRetryTime: 100,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: this.configService.get<string>(
        'KAFKA_CONSUMER_GROUP_ID',
        'ppb-master-data-consumer-group',
      ),
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });

    // Register topic handlers
    this.registerTopicHandlers();
  }

  private registerTopicHandlers() {
    // NOTE: PPB only sends full consignment JSON (not individual batches)
    // All PPB data comes via ppb.consignment.instantiation topic
    
    // PPB Consignment Instantiation Handler
    // Processes full consignment JSON with header, consignment, and items (batches, cases, packages, shipments)
    this.topicHandlers.set('ppb.consignment.instantiation', async (message, headers) => {
      await this.handleConsignmentInstantiation(message, headers);
    });

    // REMOVED: ppb.batch.data handler - PPB only sends full consignment JSON
    // All batch data comes as part of consignment JSON via ppb.consignment.instantiation

    // Manufacturer Data Handler
    this.topicHandlers.set('manufacturer.data', async (message, headers) => {
      await this.handleManufacturerData(message, headers);
    });

    // Premise Data Handler
    this.topicHandlers.set('premise.data', async (message, headers) => {
      await this.handlePremiseData(message, headers);
    });

    // Supplier Data Handler
    this.topicHandlers.set('supplier.data', async (message, headers) => {
      await this.handleSupplierData(message, headers);
    });
  }

  async onModuleInit() {
    const topics = Array.from(this.topicHandlers.keys());

    // Skip Kafka connection if KAFKA_DISABLED is set (useful for bootstrap scripts)
    if (process.env.KAFKA_DISABLED === 'true') {
      this.logger.warn('Kafka is disabled via KAFKA_DISABLED environment variable');
      return;
    }

    try {
      await this.consumer.connect();
      this.logger.log(`Connected to Kafka broker`);

      // Subscribe to all topics
      await this.consumer.subscribe({
        topics,
        fromBeginning: false, // Only consume new messages
      });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.logger.log(`Subscribed to topics: ${topics.join(', ')}`);
    } catch (error) {
      this.logger.error(
        `Failed to connect to Kafka: ${error.message}`,
        error.stack,
      );
      // Don't throw - allow app to continue without Kafka (useful for bootstrap scripts)
      // Only throw in production if explicitly configured
      if (process.env.KAFKA_REQUIRED === 'true') {
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
      this.logger.log('Disconnected from Kafka');
    } catch (error) {
      this.logger.error(`Error disconnecting from Kafka: ${error.message}`);
    }
  }

  private async handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;
    const messageValue = message.value?.toString();

    if (!messageValue) {
      this.logger.warn(
        `Received empty message from topic ${topic}, partition ${partition}, offset ${message.offset}`,
      );
      return;
    }

    try {
      this.logger.debug(
        `Processing message from ${topic}[${partition}]:${message.offset}`,
      );

      // Get handler for this topic
      const handler = this.topicHandlers.get(topic);

      if (!handler) {
        this.logger.warn(`No handler registered for topic: ${topic}`);
        return;
      }

      // Parse message
      const parsedMessage = this.parseMessage(messageValue, message.headers);

      // Route to appropriate handler
      await handler(parsedMessage, message.headers);

      this.logger.log(
        `Successfully processed message from ${topic}[${partition}]:${message.offset}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing message from ${topic}[${partition}]:${message.offset}`,
        error.stack,
      );
      // TODO: Implement dead letter queue
    }
  }

  /**
   * Parse message based on source (Debezium, JDBC Connector, or Direct)
   */
  private parseMessage(
    messageValue: string,
    headers?: any,
  ): any {
    const rawData = JSON.parse(messageValue);

    // Check if it's a Debezium message
    if (rawData.schema && rawData.payload) {
      return this.parseDebeziumMessage(rawData);
    }

    // Check if it's a JDBC Connector message
    if (rawData.key && rawData.value) {
      return rawData.value;
    }

    // Assume direct JSON
    return rawData;
  }

  /**
   * Parse Debezium CDC message
   */
  private parseDebeziumMessage(debeziumMessage: any): any {
    const { payload } = debeziumMessage;
    const operation = payload.op; // 'c' = create, 'u' = update, 'd' = delete

    if (operation === 'd') {
      this.logger.warn('Received delete operation from Debezium - skipping');
      throw new Error('Delete operations not supported');
    }

    // Use 'after' for create/update
    return payload.after || payload.before;
  }

  // ============================================
  // Topic Handlers
  // ============================================

  /**
   * Handle Manufacturer Data
   * Note: Manufacturers are stored as Suppliers with actor_type='manufacturer'
   */
  private async handleManufacturerData(
    message: any,
    headers?: any,
  ): Promise<void> {
    try {
      const manufacturerData = this.transformManufacturerMessage(message);

      // Use MasterDataService to sync manufacturer (as supplier with actor_type='manufacturer')
      await this.masterDataService.syncSupplier({
        ...manufacturerData,
        actor_type: 'manufacturer', // Ensure it's marked as manufacturer
      });

      this.logger.log(
        `Processed manufacturer: ${manufacturerData.entityId || manufacturerData.legalEntityName || 'unknown'}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing manufacturer data: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle Premise Data
   */
  private async handlePremiseData(
    message: any,
    headers?: any,
  ): Promise<void> {
    try {
      const premiseData = this.transformPremiseMessage(message);

      // Need supplier entityId to find supplier
      const supplierEntityId = premiseData.supplierEntityId || premiseData.supplier_entity_id;

      if (!supplierEntityId) {
        throw new Error('Premise message missing supplierEntityId');
      }

      // Use MasterDataService to sync premise
      await this.masterDataService.syncPremiseByEntityId(
        supplierEntityId,
        premiseData,
      );

      this.logger.log(
        `Processed premise: ${premiseData.premise_id || premiseData.premise_name || 'unknown'}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing premise data: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle PPB Consignment Instantiation (Option A)
   */
  private async handleConsignmentInstantiation(
    message: any,
    headers?: any,
  ): Promise<void> {
    try {
      // Parse message - should be in ImportPPBConsignmentDto format
      const consignmentData = this.parseMessage(message, headers);
      
      // Validate structure
      if (!consignmentData.header || !consignmentData.consignment) {
        throw new Error('Invalid consignment message structure. Missing header or consignment.');
      }

      // Process consignment import (system user for Kafka messages)
      const systemUserId = '00000000-0000-0000-0000-000000000001';
      await this.consignmentService.importFromPPB(systemUserId, consignmentData as ImportPPBConsignmentDto);
      
      this.logger.log(
        `Processed PPB consignment instantiation: ${consignmentData.consignment.consignment_id || 'unknown'}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing PPB consignment instantiation: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Handle Supplier Data
   */
  private async handleSupplierData(
    message: any,
    headers?: any,
  ): Promise<void> {
    try {
      const supplierData = this.transformSupplierMessage(message);

      // Use MasterDataService to sync supplier
      await this.masterDataService.syncSupplier({
        ...supplierData,
        actor_type: supplierData.actor_type || 'supplier',
      });

      this.logger.log(
        `Processed supplier: ${supplierData.entityId || supplierData.legalEntityName || 'unknown'}`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing supplier data: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // ============================================
  // Message Transformers
  // ============================================

  /**
   * Transform Manufacturer message
   */
  private transformManufacturerMessage(message: any): any {
    // If already in expected format, return as-is
    if (message.entityId || message.legalEntityName) {
      return message;
    }

    // Transform from Debezium format
    return {
      entity_id: message.entity_id || message.entityId,
      legalEntityName: message.legal_entity_name || message.legalEntityName,
      actor_type: 'manufacturer',
      roles: message.roles || [],
      ownershipType: message.ownership_type || message.ownershipType,
      identifiers: {
        ppbLicenseNumber: message.ppb_license_number || message.ppbLicenseNumber,
        ppbCode: message.ppb_code || message.ppbCode,
        gs1Prefix: message.gs1_prefix || message.gs1Prefix,
        legalEntityGLN: message.legal_entity_gln || message.legalEntityGLN,
      },
      hq: {
        name: message.hq_name || message.hqName,
        gln: message.hq_gln || message.hqGLN,
        location: {
          addressLine1: message.hq_address_line1 || message.hqAddressLine1,
          addressLine2: message.hq_address_line2 || message.hqAddressLine2,
          county: message.hq_county || message.hqCounty,
          constituency: message.hq_constituency || message.hqConstituency,
          ward: message.hq_ward || message.hqWard,
          postalCode: message.hq_postal_code || message.hqPostalCode,
          country: message.hq_country || message.hqCountry || 'KE',
        },
      },
      contact: {
        contactPersonName: message.contact_person_name || message.contactPersonName,
        contactPersonTitle: message.contact_person_title || message.contactPersonTitle,
        email: message.contact_email || message.contactEmail,
        phone: message.contact_phone || message.contactPhone,
        website: message.contact_website || message.contactWebsite,
      },
      status: message.status || 'Active',
    };
  }

  /**
   * Transform Premise message
   */
  private transformPremiseMessage(message: any): any {
    // If already in expected format, return as-is
    if (message.premise_id || message.premise_name) {
      return message;
    }

    // Transform from Debezium format
    return {
      premise_id: message.premise_id || message.premise_id,
      legacyPremiseId: message.legacy_premise_id || message.legacyPremiseId,
      premiseName: message.premise_name || message.premiseName,
      gln: message.gln,
      businessType: message.business_type || message.businessType,
      premiseClassification:
        message.premise_classification || message.premiseClassification,
      ownership: message.ownership,
      superintendent: {
        name: message.superintendent_name || message.superintendentName,
        cadre: message.superintendent_cadre || message.superintendentCadre,
        registrationNumber:
          message.superintendent_registration_number ||
          message.superintendentRegistrationNumber,
      },
      license: {
        ppbLicenseNumber:
          message.ppb_license_number || message.ppbLicenseNumber,
        validUntil: message.license_valid_until || message.licenseValidUntil,
        validityYear:
          message.license_validity_year || message.licenseValidityYear,
        status: message.license_status || message.licenseStatus,
      },
      location: {
        addressLine1: message.address_line1 || message.addressLine1,
        addressLine2: message.address_line2 || message.addressLine2,
        county: message.county,
        constituency: message.constituency,
        ward: message.ward,
        postalCode: message.postal_code || message.postalCode,
        country: message.country || 'KE',
      },
      status: message.status || 'Active',
      supplierEntityId: message.supplier_entity_id || message.supplierEntityId,
    };
  }

  /**
   * Transform Supplier message
   */
  private transformSupplierMessage(message: any): any {
    // Same as manufacturer transformation, but actorType defaults to 'supplier'
    const transformed = this.transformManufacturerMessage(message);
    return {
      ...transformed,
      actor_type: message.actor_type || message.actor_type || 'supplier',
    };
  }
}

