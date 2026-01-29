import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { SaFamily } from '../sa/sa-family.entity';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article) private readonly repo: Repository<Article>,
    @InjectRepository(SaFamily) private readonly familyRepo: Repository<SaFamily>,
  ) {}

  async list(familyId?: string) {
    const where = familyId ? { family: { id: familyId } } : {};
    let items: any[] = [];
    try {
      items = await this.repo.find({ where: where as any, relations: ['family'], order: { product_ref: 'ASC' as any } });
      if (items && items.length) return items;
    } catch (err) {
      // If the 'articles' table doesn't exist or query fails, fall back to legacy table below
      // (we don't rethrow so the UI can still obtain data from the legacy `sa_articles` table)
      items = [];
    }

    // Legacy fallback: some DBs use `sa_articles` table and `code` column
    try {
      const sql = familyId
        ? 'SELECT id, family_id, product_ref, code, label, is_active FROM sa_articles WHERE family_id = @0 ORDER BY COALESCE(product_ref, code)'
        : 'SELECT id, family_id, product_ref, code, label, is_active FROM sa_articles ORDER BY COALESCE(product_ref, code)';
      const raw: any[] = await (this.repo as any).query(sql, familyId ? [familyId] : []);
      return raw.map(r => ({
        id: String(r.id),
        family: { id: String(r.family_id) },
        product_ref: r.product_ref ?? r.code,
        label: r.label,
        is_active: !!r.is_active,
      }));
    } catch (err) {
      return items; // table missing or query failed — return empty
    }
  }

  async create(dto: { family_id: string; product_ref: string; label: string }) {
    const family = await this.familyRepo.findOne({ where: { id: dto.family_id } });
    if (!family) throw new BadRequestException('Family not found');

    // Check existing in new table
    const exists = await this.repo.findOne({ where: { family: { id: family.id }, product_ref: dto.product_ref } as any });
    if (exists) throw new BadRequestException('Article already exists for this family');

    // Also check legacy table
    try {
      const legacy = await (this.repo as any).query('SELECT 1 as found FROM sa_articles WHERE family_id = @0 AND (product_ref = @1 OR code = @1)', [family.id, dto.product_ref]);
      if (legacy && legacy.length) throw new BadRequestException('Article already exists for this family');
    } catch (e) {
      // ignore if legacy table absent
    }

    const a = this.repo.create({ family, product_ref: dto.product_ref, label: dto.label, is_active: true } as any);
    return this.repo.save(a as any);
  }
}
