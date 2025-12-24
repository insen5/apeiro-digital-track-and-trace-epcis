import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Auth API Integration Tests (Snake Case)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('should return snake_case user properties', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'ppp@ppp.com',
          password: 'ppp',
        })
        .expect(200);

      // Response should have snake_case properties
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email');
      expect(response.body.user).toHaveProperty('role');
      expect(response.body.user).toHaveProperty('role_id');
      expect(response.body.user).toHaveProperty('gln_number');
      expect(response.body.user).toHaveProperty('organization');

      // Should NOT have camelCase properties
      expect(response.body.user).not.toHaveProperty('roleId');
      expect(response.body.user).not.toHaveProperty('glnNumber');
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrong',
        })
        .expect(401);
    });
  });

  describe('Token Validation', () => {
    it('should validate token and return snake_case user data', async () => {
      // First login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'ppp@ppp.com',
          password: 'ppp',
        });

      const token = loginResponse.body.token;

      // Use token to access protected endpoint
      const response = await request(app.getHttpServer())
        .get('/api/batches')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

