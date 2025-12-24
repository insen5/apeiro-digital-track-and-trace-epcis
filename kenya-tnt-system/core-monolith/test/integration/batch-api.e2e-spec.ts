import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Batch API Integration Tests (Snake Case)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'ppp@ppp.com',
        password: 'ppp',
      });

    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/batches (Create Batch)', () => {
    it('should accept snake_case DTO properties', async () => {
      const createBatchDto = {
        product_id: 1,
        batch_no: 'TEST-BATCH-001',
        expiry: '2027-12-31',
        qty: 1000,
      };

      const response = await request(app.getHttpServer())
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createBatchDto)
        .expect(201);

      // Response should have snake_case properties
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('product_id');
      expect(response.body).toHaveProperty('batch_no');
      expect(response.body).toHaveProperty('user_id');
      expect(response.body).toHaveProperty('sent_qty');
      expect(response.body).toHaveProperty('is_enabled');
      expect(response.body).toHaveProperty('created_at');
      expect(response.body).toHaveProperty('updated_at');

      expect(response.body.product_id).toBe(createBatchDto.product_id);
      expect(response.body.batch_no).toBe(createBatchDto.batch_no);
      expect(response.body.sent_qty).toBe(0);
      expect(response.body.is_enabled).toBe(true);
    });

    it('should auto-generate batch_no if not provided', async () => {
      const createBatchDto = {
        product_id: 1,
        expiry: '2027-12-31',
        qty: 1000,
      };

      const response = await request(app.getHttpServer())
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createBatchDto)
        .expect(201);

      expect(response.body).toHaveProperty('batch_no');
      expect(response.body.batch_no).toMatch(/^BATCH-/);
    });

    it('should reject camelCase DTO properties', async () => {
      const createBatchDto = {
        productId: 1, // ❌ camelCase - should fail
        batchno: 'TEST-001',
        expiry: '2027-12-31',
        qty: 1000,
      };

      await request(app.getHttpServer())
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createBatchDto)
        .expect(400); // Validation should fail
    });
  });

  describe('GET /api/batches (List Batches)', () => {
    it('should return batches with snake_case properties', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        const batch = response.body[0];
        expect(batch).toHaveProperty('product_id');
        expect(batch).toHaveProperty('batch_no');
        expect(batch).toHaveProperty('user_id');
        expect(batch).toHaveProperty('sent_qty');
        expect(batch).toHaveProperty('is_enabled');
        expect(batch).toHaveProperty('created_at');
        expect(batch).toHaveProperty('updated_at');
        
        // Should NOT have camelCase properties
        expect(batch).not.toHaveProperty('productId');
        expect(batch).not.toHaveProperty('batchno');
        expect(batch).not.toHaveProperty('userId');
        expect(batch).not.toHaveProperty('sentQty');
        expect(batch).not.toHaveProperty('isEnabled');
        expect(batch).not.toHaveProperty('createdAt');
      }
    });
  });

  describe('GET /api/batches/:id (Get Batch)', () => {
    it('should return single batch with snake_case properties', async () => {
      // First create a batch
      const createResponse = await request(app.getHttpServer())
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          product_id: 1,
          expiry: '2027-12-31',
          qty: 1000,
        });

      const batchId = createResponse.body.id;

      // Then fetch it
      const response = await request(app.getHttpServer())
        .get(`/api/batches/${batchId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', batchId);
      expect(response.body).toHaveProperty('product_id');
      expect(response.body).toHaveProperty('batch_no');
      expect(response.body).toHaveProperty('user_id');
      expect(response.body).toHaveProperty('created_at');
    });
  });
});

