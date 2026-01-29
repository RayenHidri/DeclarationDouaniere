import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';
import { SaFamily } from '../sa/sa-family.entity';

describe('ArticlesService', () => {
  let svc: ArticlesService;
  const repo: any = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn(), query: jest.fn() };
  const familyRepo: any = { findOne: jest.fn() };

  beforeEach(async () => {
    const m: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getRepositoryToken(Article), useValue: repo },
        { provide: getRepositoryToken(SaFamily), useValue: familyRepo },
      ],
    }).compile();
    svc = m.get<ArticlesService>(ArticlesService);
    jest.clearAllMocks();
  });

  it('returns repo results when present', async () => {
    repo.find.mockResolvedValue([{ id: '1', product_ref: 'P1', label: 'L', family: { id: '10' } }]);
    const r = await svc.list('10');
    expect(r).toHaveLength(1);
    expect(repo.find).toHaveBeenCalled();
  });

  it('falls back to legacy sa_articles and maps code to product_ref', async () => {
    repo.find.mockResolvedValue([]);
    repo.query.mockResolvedValue([{ id: 100, family_id: 10, product_ref: null, code: 'C100', label: 'Legacy', is_active: 1 }]);
    const r = await svc.list('10');
    expect(r).toHaveLength(1);
    expect(r[0].product_ref).toBe('C100');
    expect(r[0].label).toBe('Legacy');
  });

  it('falls back to legacy when repo.find throws (missing articles table)', async () => {
    repo.find.mockRejectedValue(new Error('Invalid object name \"articles\"'));
    repo.query.mockResolvedValue([{ id: 200, family_id: 20, product_ref: null, code: 'C200', label: 'Legacy2', is_active: 1 }]);
    const r = await svc.list('20');
    expect(r).toHaveLength(1);
    expect(r[0].product_ref).toBe('C200');
    expect(r[0].label).toBe('Legacy2');
  });
});
