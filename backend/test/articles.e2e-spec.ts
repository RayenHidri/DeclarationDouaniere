import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ArticlesController } from '../src/articles/articles.controller';
import { ArticlesService } from '../src/articles/articles.service';
import { JwtAuthGuard } from '../src/auth/jwt.guard';
import { RolesGuard } from '../src/auth/roles.guard';

describe('ArticlesController (e2e)', () => {
  let app: INestApplication;
  const mockSvc = { list: jest.fn() } as any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [{ provide: ArticlesService, useValue: mockSvc }],
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

  it('/articles?family_id=2 (GET) returns list from service', async () => {
    mockSvc.list.mockResolvedValueOnce([
      { id: '1', product_ref: 'P1', label: 'X', family: { id: '2' } },
    ]);

    await request(app.getHttpServer())
      .get('/articles?family_id=2')
      .expect(200)
      .expect((res) => {
        if (!Array.isArray(res.body)) throw new Error('expected array');
        if (res.body.length !== 1) throw new Error('wrong length');
      });
  });
});
