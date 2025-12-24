import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  ImportPPBConsignmentDto,
  PPBHeaderDto,
  PPBItemDto,
  PPBConsignmentDto,
  ManufacturerDto,
  MAHDto,
  PartyDto,
  PartiesDto,
  LogisticsDto,
  PPBItemType,
} from './import-ppb-consignment.dto';

describe('ImportPPBConsignmentDto', () => {
  describe('PPBHeaderDto', () => {
    it('should validate a valid header with snake_case properties', async () => {
      const dto = plainToInstance(PPBHeaderDto, {
        event_id: 'EVT-2025-0001',
        event_type: 'REGULATORY_INSTANTIATION',
        event_timestamp: '2025-11-01T12:45:00Z',
        source_system: 'PPB',
        destination_system: 'TNT',
        version: '1.0',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.event_id).toBe('EVT-2025-0001');
      expect(dto.event_type).toBe('REGULATORY_INSTANTIATION');
    });

    it('should fail validation with missing required fields', async () => {
      const dto = plainToInstance(PPBHeaderDto, {
        event_id: 'EVT-2025-0001',
        // Missing event_type, event_timestamp, source_system, destination_system
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ManufacturerDto', () => {
    it('should validate with snake_case ppb_id', async () => {
      const dto = plainToInstance(ManufacturerDto, {
        ppb_id: '345345',
        gln: '61640056789012',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.ppb_id).toBe('345345');
    });

    it('should accept optional gln', async () => {
      const dto = plainToInstance(ManufacturerDto, {
        ppb_id: '345345',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.gln).toBeUndefined();
    });
  });

  describe('PPBItemDto', () => {
    it('should validate a batch item with snake_case properties', async () => {
      const dto = plainToInstance(PPBItemDto, {
        type: PPBItemType.BATCH,
        label: 'BATCH-001',
        sscc: '123456789012345681',
        parent_sscc: '123456789012345679',
        gtin: '61640056789012',
        product_name: 'Metformin 500mg Tablets',
        batch_no: '5343545',
        batch_status: 'Active',
        manufacture_date: '2024-09-16',
        expiry_date: '2027-09-16',
        quantity_approved: 5000,
        product_code: 'PH111D',
        permit_id: '18905',
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.parent_sscc).toBe('123456789012345679');
      expect(dto.batch_no).toBe('5343545');
      expect(dto.quantity_approved).toBe(5000);
    });

    it('should validate serialization object', async () => {
      const dto = plainToInstance(PPBItemDto, {
        type: PPBItemType.BATCH,
        label: 'BATCH-001',
        gtin: '61640056789012',
        batch_no: '5343545',
        serialization: {
          is_partial_approval: false,
          ranges: [
            { start: 'KE0010001', end: 'KE0010100', count: 100 },
          ],
          explicit: ['KE0010101'],
        },
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.serialization?.ranges?.length).toBe(1);
      expect(dto.serialization?.explicit?.length).toBe(1);
    });

    it('should fail for invalid enum type', async () => {
      const dto = plainToInstance(PPBItemDto, {
        type: 'invalid_type',
        label: 'BATCH-001',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('type');
    });
  });

  describe('PPBConsignmentDto', () => {
    it('should validate with snake_case properties', async () => {
      const dto = plainToInstance(PPBConsignmentDto, {
        consignment_id: 'CNS-2025-98765',
        shipment_date: '2025-10-25',
        country_of_origin: 'IN',
        destination_country: 'KE',
        registration_no: '12243324',
        total_quantity: 10000,
        items: [
          {
            type: PPBItemType.BATCH,
            label: 'BATCH-001',
            gtin: '61640056789012',
            batch_no: 'B123',
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.consignment_id).toBe('CNS-2025-98765');
      expect(dto.shipment_date).toBe('2025-10-25');
      expect(dto.country_of_origin).toBe('IN');
    });

    it('should support both new parties object and legacy fields', async () => {
      const dto = plainToInstance(PPBConsignmentDto, {
        consignment_id: 'CNS-2025-98765',
        shipment_date: '2025-10-25',
        country_of_origin: 'IN',
        destination_country: 'KE',
        registration_no: '12243324',
        parties: {
          manufacturer_party: { ppb_id: '345345', gln: '61640056789012' },
          mah_party: { ppb_id: '34234324' },
        },
        // Legacy fields
        manufacturer_ppb_id: '345345',
        mah_ppb_id: '34234324',
        items: [],
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.parties?.manufacturer_party?.ppb_id).toBe('345345');
      expect(dto.manufacturer_ppb_id).toBe('345345');
    });
  });

  describe('ImportPPBConsignmentDto (Full payload)', () => {
    it('should validate complete consignment with snake_case throughout', async () => {
      const payload = {
        header: {
          event_id: 'EVT-2025-0001',
          event_type: 'REGULATORY_INSTANTIATION',
          event_timestamp: '2025-11-01T12:45:00Z',
          source_system: 'PPB',
          destination_system: 'TNT',
          version: '1.0',
        },
        consignment: {
          consignment_id: 'CNS-2025-98765',
          shipment_date: '2025-10-25',
          country_of_origin: 'IN',
          destination_country: 'KE',
          registration_no: '12243324',
          total_quantity: 10000,
          parties: {
            manufacturer_party: {
              name: 'KEM Pharma Ltd',
              ppb_id: '345345',
              gln: '61640056789012',
              country: 'IN',
            },
            mah_party: {
              name: 'MAH Corp',
              ppb_id: '34234324',
              gln: '61640056789013',
              country: 'KE',
            },
            importer_party: {
              name: 'Importer Ltd',
              gln: '61640056789014',
              country: 'KE',
            },
            destination_party: {
              name: 'Pharmacy ABC',
              gln: '61640056789015',
              country: 'KE',
            },
          },
          logistics: {
            importer_label: 'Regional Warehouse A',
            destination_label: 'Pharmacy ABC - Nairobi',
          },
          items: [
            {
              type: PPBItemType.SHIPMENT,
              label: 'SHIPMENT-001',
              sscc: '123456789012345679',
              metadata: { carrier: 'DHL', customer: 'Pharmacy ABC' },
            },
            {
              type: PPBItemType.PACKAGE,
              label: 'PKG-001',
              sscc: '123456789012345680',
              parent_sscc: '123456789012345679',
              metadata: { packageType: 'pallet' },
            },
            {
              type: PPBItemType.CASE,
              label: 'CASE-001',
              sscc: '123456789012345681',
              parent_sscc: '123456789012345680',
            },
            {
              type: PPBItemType.BATCH,
              label: 'BATCH-001',
              parent_sscc: '123456789012345681',
              gtin: '61640056789012',
              product_name: 'Metformin 500mg Tablets',
              batch_no: '5343545',
              batch_status: 'Active',
              manufacture_date: '2024-09-16',
              expiry_date: '2027-09-16',
              quantity_approved: 5000,
              product_code: 'PH111D',
              permit_id: '18905',
              serialization: {
                is_partial_approval: false,
                ranges: [
                  { start: 'KE0010001', end: 'KE0015000', count: 5000 },
                ],
              },
              approval: {
                approval_status: true,
                approval_datestamp: '2025-11-01T12:00:00Z',
                quantities: {
                  declared_total: 5000,
                  declared_sent: 5000,
                },
              },
            },
          ],
        },
      };

      const dto = plainToInstance(ImportPPBConsignmentDto, payload);
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: false });

      expect(errors.length).toBe(0);
      expect(dto.header.event_id).toBe('EVT-2025-0001');
      expect(dto.consignment.consignment_id).toBe('CNS-2025-98765');
      expect(dto.consignment.items.length).toBe(4);
      expect(dto.consignment.items[3].batch_no).toBe('5343545');
      expect(dto.consignment.items[3].parent_sscc).toBe('123456789012345681');
      expect(dto.consignment.parties?.manufacturer_party?.ppb_id).toBe('345345');
    });

    it('should fail validation with missing required nested fields', async () => {
      const payload = {
        header: {
          event_id: 'EVT-2025-0001',
          // Missing other required fields
        },
        consignment: {
          consignment_id: 'CNS-2025-98765',
          // Missing shipment_date and other required fields
          items: [],
        },
      };

      const dto = plainToInstance(ImportPPBConsignmentDto, payload);
      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
    });
  });
});

