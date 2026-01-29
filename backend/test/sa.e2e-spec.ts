import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SaController } from '../src/sa/sa.controller';
import { SaService } from '../src/sa/sa.service';
import { JwtAuthGuard } from '../src/auth/jwt.guard';
import { RolesGuard } from '../src/auth/roles.guard';

describe('SaController (e2e)', () => {
  let app: INestApplication;
  const mockSvc: any = { getForEa: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SaController],
      providers: [{ provide: SaService, useValue: mockSvc }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/sa/for-ea/5 (GET) returns prefilled dto', async () => {
    mockSvc.getForEa.mockResolvedValueOnce({ id: '5', sa_number: 'SA250005', max_export_quantity: 84.6 });

    await request(app.getHttpServer())
      .get('/sa/for-ea/5')
      .expect(200)
      .expect((res) => {
        if (res.body.id !== '5') throw new Error('unexpected id');
        if (typeof res.body.max_export_quantity !== 'number') throw new Error('missing max_export_quantity');
      });
  });
});
