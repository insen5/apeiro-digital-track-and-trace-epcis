import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBatchDto } from './create-batch.dto';

describe('CreateBatchDto', () => {
  it('should validate a valid batch DTO with snake_case properties', async () => {
    const dto = plainToInstance(CreateBatchDto, {
      product_id: 123,
      batch_no: 'B2024001',
      expiry: '2027-12-31',
      qty: 5000,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.product_id).toBe(123);
    expect(dto.batch_no).toBe('B2024001');
    expect(dto.qty).toBe(5000);
  });

  it('should accept optional batch_no (will be auto-generated)', async () => {
    const dto = plainToInstance(CreateBatchDto, {
      product_id: 123,
      expiry: '2027-12-31',
      qty: 5000,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.batch_no).toBeUndefined();
  });

  it('should fail validation with missing required product_id', async () => {
    const dto = plainToInstance(CreateBatchDto, {
      batch_no: 'B2024001',
      expiry: '2027-12-31',
      qty: 5000,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'product_id')).toBe(true);
  });

  it('should fail validation with missing required expiry', async () => {
    const dto = plainToInstance(CreateBatchDto, {
      product_id: 123,
      batch_no: 'B2024001',
      qty: 5000,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'expiry')).toBe(true);
  });

  it('should fail validation with missing required qty', async () => {
    const dto = plainToInstance(CreateBatchDto, {
      product_id: 123,
      batch_no: 'B2024001',
      expiry: '2027-12-31',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'qty')).toBe(true);
  });

  it('should fail validation with invalid expiry date format', async () => {
    const dto = plainToInstance(CreateBatchDto, {
      product_id: 123,
      batch_no: 'B2024001',
      expiry: 'not-a-date',
      qty: 5000,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'expiry')).toBe(true);
  });

  it('should fail validation with non-number product_id', async () => {
    const dto = plainToInstance(CreateBatchDto, {
      product_id: 'not-a-number' as any,
      batch_no: 'B2024001',
      expiry: '2027-12-31',
      qty: 5000,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with non-number qty', async () => {
    const dto = plainToInstance(CreateBatchDto, {
      product_id: 123,
      batch_no: 'B2024001',
      expiry: '2027-12-31',
      qty: 'not-a-number' as any,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

