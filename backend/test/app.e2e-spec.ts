import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('CityPay API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) - Root info endpoint', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    expect(res.body.name).toBe('CityPay API');
    expect(res.body.endpoints).toBeDefined();
  });

  it('/health (GET) - System & DB health check', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.services.database.status).toBe('ok');
    expect(res.body.services.database.engine).toBe('PostgreSQL (Neon)');
  });

  it('/services (GET) - Municipal services catalog', async () => {
    const res = await request(app.getHttpServer()).get('/services').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
    const slugs = res.body.map((s: any) => s.slug);
    expect(slugs).toContain('predial');
    expect(slugs).toContain('agua');
    expect(slugs).toContain('multas');
  });

  it('/users/me (GET) - Reject unauthenticated requests', async () => {
    const res = await request(app.getHttpServer()).get('/users/me').expect(401);
    expect(res.body.statusCode).toBe(401);
  });

  it('/reports (GET) - Reject unauthenticated requests', async () => {
    const res = await request(app.getHttpServer()).get('/reports').expect(401);
    expect(res.body.statusCode).toBe(401);
  });

  it('/payments (GET) - Reject unauthenticated requests', async () => {
    const res = await request(app.getHttpServer()).get('/payments').expect(401);
    expect(res.body.statusCode).toBe(401);
  });

  it('/reports (GET) - Reject invalid Bearer token', async () => {
    const res = await request(app.getHttpServer())
      .get('/reports')
      .set('Authorization', 'Bearer invalid_fake_jwt_token_here')
      .expect(401);
    expect(res.body.message).toContain('Token de autenticación');
  });

  it('/reports/:id/status (PATCH) - Reject unauthenticated status change', async () => {
    const res = await request(app.getHttpServer())
      .patch('/reports/a0000000-0000-0000-0000-000000000000/status')
      .send({ status: 'Resuelto' })
      .expect(401);
    expect(res.body.statusCode).toBe(401);
  });
});
