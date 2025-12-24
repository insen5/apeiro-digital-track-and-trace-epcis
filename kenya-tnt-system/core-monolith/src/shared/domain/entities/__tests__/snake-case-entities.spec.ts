import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../user.entity';
import { Batch } from '../batch.entity';
import { Consignment } from '../consignment.entity';
import { SerialNumber } from '../serial-number.entity';
import { Package } from '../package.entity';
import { Shipment } from '../shipment.entity';
import { Case } from '../case.entity';
import { PPBProduct } from '../ppb-product.entity';

describe('Snake Case Entity Migration Tests', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5433'),
          username: process.env.DB_USERNAME || 'tnt_user',
          password: process.env.DB_PASSWORD || 'tnt_password',
          database: process.env.DB_DATABASE || 'kenya_tnt_db',
          entities: [User, Batch, Consignment, SerialNumber, Package, Shipment, Case, PPBProduct],
          synchronize: false,
        }),
      ],
    }).compile();

    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (dataSource) {
      await dataSource.destroy();
    }
  });

  describe('User Entity', () => {
    it('should have snake_case column names in metadata', () => {
      const metadata = dataSource.getMetadata(User);
      
      const roleIdColumn = metadata.findColumnWithPropertyPath('role_id');
      expect(roleIdColumn).toBeDefined();
      expect(roleIdColumn?.databaseName).toBe('role_id');

      const glnNumberColumn = metadata.findColumnWithPropertyPath('gln_number');
      expect(glnNumberColumn).toBeDefined();
      expect(glnNumberColumn?.databaseName).toBe('gln_number');

      const isDeletedColumn = metadata.findColumnWithPropertyPath('is_deleted');
      expect(isDeletedColumn).toBeDefined();
      expect(isDeletedColumn?.databaseName).toBe('is_deleted');

      const createdAtColumn = metadata.findColumnWithPropertyPath('created_at');
      expect(createdAtColumn).toBeDefined();
      expect(createdAtColumn?.databaseName).toBe('created_at');
    });

    it('should map snake_case properties correctly', () => {
      const user = new User();
      user.role_id = 1;
      user.gln_number = '1234567890123';
      user.is_deleted = false;
      
      expect(user.role_id).toBe(1);
      expect(user.gln_number).toBe('1234567890123');
      expect(user.is_deleted).toBe(false);
    });
  });

  describe('Batch Entity', () => {
    it('should have snake_case column names', () => {
      const metadata = dataSource.getMetadata(Batch);
      
      const productIdColumn = metadata.findColumnWithPropertyPath('product_id');
      expect(productIdColumn).toBeDefined();
      expect(productIdColumn?.databaseName).toBe('product_id');

      const batchNoColumn = metadata.findColumnWithPropertyPath('batch_no');
      expect(batchNoColumn).toBeDefined();
      expect(batchNoColumn?.databaseName).toBe('batch_no');

      const sentQtyColumn = metadata.findColumnWithPropertyPath('sent_qty');
      expect(sentQtyColumn).toBeDefined();
      expect(sentQtyColumn?.databaseName).toBe('sent_qty');

      const isEnabledColumn = metadata.findColumnWithPropertyPath('is_enabled');
      expect(isEnabledColumn).toBeDefined();
      expect(isEnabledColumn?.databaseName).toBe('is_enabled');
    });

    it('should map batch properties correctly', () => {
      const batch = new Batch();
      batch.product_id = 123;
      batch.batch_no = 'BATCH-001';
      batch.qty = 1000;
      batch.sent_qty = 100;
      batch.is_enabled = true;
      
      expect(batch.product_id).toBe(123);
      expect(batch.batch_no).toBe('BATCH-001');
      expect(batch.sent_qty).toBe(100);
      expect(batch.is_enabled).toBe(true);
    });
  });

  describe('Consignment Entity', () => {
    it('should have snake_case column names', () => {
      const metadata = dataSource.getMetadata(Consignment);
      
      const eventIdColumn = metadata.findColumnWithPropertyPath('event_id');
      expect(eventIdColumn).toBeDefined();
      
      const consignmentIdColumn = metadata.findColumnWithPropertyPath('consignment_id');
      expect(consignmentIdColumn).toBeDefined();
      
      const manufacturerPpbIdColumn = metadata.findColumnWithPropertyPath('manufacturer_ppb_id');
      expect(manufacturerPpbIdColumn).toBeDefined();
    });

    it('should map consignment properties correctly', () => {
      const consignment = new Consignment();
      consignment.event_id = 'EVT-001';
      consignment.event_type = 'REGULATORY_INSTANTIATION';
      consignment.consignment_id = 'CNS-001';
      consignment.manufacturer_ppb_id = '12345';
      consignment.registration_no = 'REG-001';
      
      expect(consignment.event_id).toBe('EVT-001');
      expect(consignment.consignment_id).toBe('CNS-001');
      expect(consignment.manufacturer_ppb_id).toBe('12345');
    });
  });

  describe('SerialNumber Entity', () => {
    it('should have snake_case column names', () => {
      const metadata = dataSource.getMetadata(SerialNumber);
      
      const batchIdColumn = metadata.findColumnWithPropertyPath('batch_id');
      expect(batchIdColumn).toBeDefined();
      expect(batchIdColumn?.databaseName).toBe('batch_id');

      const serialNumberColumn = metadata.findColumnWithPropertyPath('serial_number');
      expect(serialNumberColumn).toBeDefined();
      expect(serialNumberColumn?.databaseName).toBe('serial_number');
    });
  });

  describe('Package Entity', () => {
    it('should have snake_case column names', () => {
      const metadata = dataSource.getMetadata(Package);
      
      const shipmentIdColumn = metadata.findColumnWithPropertyPath('shipment_id');
      expect(shipmentIdColumn).toBeDefined();

      const isDispatchedColumn = metadata.findColumnWithPropertyPath('is_dispatched');
      expect(isDispatchedColumn).toBeDefined();

      const ssccBarcodeColumn = metadata.findColumnWithPropertyPath('sscc_barcode');
      expect(ssccBarcodeColumn).toBeDefined();
    });
  });

  describe('Shipment Entity', () => {
    it('should have snake_case column names', () => {
      const metadata = dataSource.getMetadata(Shipment);
      
      const pickupDateColumn = metadata.findColumnWithPropertyPath('pickup_date');
      expect(pickupDateColumn).toBeDefined();

      const expectedDeliveryDateColumn = metadata.findColumnWithPropertyPath('expected_delivery_date');
      expect(expectedDeliveryDateColumn).toBeDefined();

      const isDispatchedColumn = metadata.findColumnWithPropertyPath('is_dispatched');
      expect(isDispatchedColumn).toBeDefined();
    });
  });

  describe('Case Entity', () => {
    it('should have snake_case column names', () => {
      const metadata = dataSource.getMetadata(Case);
      
      const packageIdColumn = metadata.findColumnWithPropertyPath('package_id');
      expect(packageIdColumn).toBeDefined();

      const ssccBarcodeColumn = metadata.findColumnWithPropertyPath('sscc_barcode');
      expect(ssccBarcodeColumn).toBeDefined();
    });
  });

  describe('BaseEntity Inheritance', () => {
    it('should have snake_case timestamps on all entities', () => {
      const entities = [User, Batch, Package, Shipment, Case];
      
      entities.forEach((EntityClass) => {
        const metadata = dataSource.getMetadata(EntityClass);
        
        const createdAtColumn = metadata.findColumnWithPropertyPath('created_at');
        const updatedAtColumn = metadata.findColumnWithPropertyPath('updated_at');
        
        expect(createdAtColumn).toBeDefined();
        expect(updatedAtColumn).toBeDefined();
        
        expect(createdAtColumn?.databaseName).toBe('created_at');
        expect(updatedAtColumn?.databaseName).toBe('updated_at');
      });
    });
  });
});

