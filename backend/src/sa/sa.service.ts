import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
  import { In, Repository } from 'typeorm';
  import { SaDeclaration } from './sa-declaration.entity';
  import { CreateSaDto } from './dto/create-sa.dto';
  import { UpdateSaDto } from './dto/update-sa.dto';
  import { User } from '../users/user.entity';
  import { SaEligibleDto } from './dto/sa-eligible.dto';
  import { SaFamily } from './sa-family.entity';
  import { Supplier } from '../suppliers/supplier.entity';

@Injectable()
export class SaService {
  constructor(
    @InjectRepository(SaDeclaration)
    private readonly saRepo: Repository<SaDeclaration>,
    @InjectRepository(SaFamily)
    private readonly familyRepo: Repository<SaFamily>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
  ) {}

  /* -------------------------
     LISTE SA
  ------------------------- */

  async findAll(): Promise<any[]> {
    const sas = await this.saRepo.find({
      relations: ['supplier', 'family'],
      order: { declaration_date: 'DESC', sa_number: 'ASC' },
    });

    return sas.map((sa) => this.mapSa(sa));
  }

  /* -------------------------
     DETAIL SA
  ------------------------- */

  async findOne(idRaw: string): Promise<any> {
    const id = this.normalizeIdParam(idRaw);

    const sa = await this.saRepo.findOne({
      where: { id: id as any },
      relations: ['supplier', 'family'],
    });

    if (!sa) {
      throw new NotFoundException('SA not found');
    }

    return this.mapSa(sa);
  }

  async findOneById(idRaw: string): Promise<SaDeclaration> {
    const id = this.normalizeIdParam(idRaw);

    const sa = await this.saRepo.findOne({
      where: { id: id as any },
      relations: ['supplier', 'family'],
    });

    if (!sa) {
      throw new NotFoundException('SA not found');
    }

    return sa;
  }

  /* -------------------------
     CREATE SA
  ------------------------- */

  async create(dto: CreateSaDto, user: User): Promise<any> {
    // 1) Numéro SA -> "SAxxxxxx"
    const saNumber = this.normalizeSaNumber(dto.sa_number);

    // 2) Quantité facturée (TONNES)
    const qtyInvoiced = Number(dto.quantity_invoiced_ton);
    if (!Number.isFinite(qtyInvoiced) || qtyInvoiced <= 0) {
      throw new BadRequestException(
        'La quantité facturée (TONNES) doit être un nombre positif.',
      );
    }

    // 3) Fournisseur
    let supplier: Supplier | null = null;
    let supplierName: string | null = null;
    if (dto.supplier_id) {
      supplier = await this.supplierRepo.findOne({
        where: { id: dto.supplier_id },
      });
      if (!supplier) {
        throw new NotFoundException('Fournisseur introuvable');
      }
      supplierName = supplier.name;
    }

    // 4) Famille -> droit de déchet
    let family: SaFamily | null = null;
    let scrapQtyTon: number | null = null;
    if (dto.family_id) {
      family = await this.familyRepo.findOne({
        where: { id: dto.family_id },
      });
      if (!family) {
        throw new NotFoundException('Famille SA introuvable');
      }
      const scrapPercent = Number(family.scrap_percent ?? 0);
      scrapQtyTon = Number(
        ((qtyInvoiced * scrapPercent) / 100).toFixed(3),
      );
    }

    // 5) Montant facture + taux → montant DS
    const invoiceAmount =
      dto.invoice_amount !== undefined ? Number(dto.invoice_amount) : null;
    const fxRate =
      dto.fx_rate !== undefined ? Number(dto.fx_rate) : null;

    let amountDs: number | null = null;
    if (
      invoiceAmount !== null &&
      !Number.isNaN(invoiceAmount) &&
      fxRate !== null &&
      !Number.isNaN(fxRate)
    ) {
      amountDs = Number((invoiceAmount * fxRate).toFixed(3));
    }

    // 6) Création entité
    const sa = this.saRepo.create({
      sa_number: saNumber,
      regime_code: dto.regime_code ?? '532',
      declaration_date: dto.declaration_date,
      due_date: dto.due_date,
      status: 'OPEN',

      quantity_initial: qtyInvoiced.toString(),
      quantity_unit: 'TONNE',

      scrap_quantity_ton:
        scrapQtyTon !== null ? scrapQtyTon.toString() : null,

      invoice_amount:
        invoiceAmount !== null ? invoiceAmount.toString() : null,
      currency_code: dto.currency_code ?? null,
      fx_rate: fxRate !== null ? fxRate.toString() : null,
      amount_ds: amountDs !== null ? amountDs.toString() : null,

      supplier,
      supplier_name: supplierName,
      family,

      description: dto.description ?? null,

      quantity_apured: '0',
      createdBy: user,
      created_by: user.id,
    });

    const saved = await this.saRepo.save(sa);
    return this.mapSa(saved);
  }

  /* -------------------------
     UPDATE (simple)
  ------------------------- */

  async update(
    idRaw: string,
    dto: UpdateSaDto,
    user: User,
  ): Promise<any> {
    const id = this.normalizeIdParam(idRaw);

    const sa = await this.saRepo.findOne({
      where: { id: id as any },
      relations: ['supplier', 'family'],
    });

    if (!sa) {
      throw new NotFoundException('SA not found');
    }

    if (dto.sa_number !== undefined) {
      sa.sa_number = this.normalizeSaNumber(dto.sa_number);
    }
    if (dto.declaration_date !== undefined) {
      sa.declaration_date = dto.declaration_date;
    }
    if (dto.due_date !== undefined) {
      sa.due_date = dto.due_date;
    }
    if (dto.description !== undefined) {
      sa.description = dto.description ?? null;
    }

    // (si tu veux plus tard : update fournisseur, famille, montants, etc.)

    sa.updatedBy = user;
    sa.updated_by = user.id;
    sa.updated_at = new Date();

    const saved = await this.saRepo.save(sa);
    return this.mapSa(saved);
  }

  /* -------------------------
     SA ÉLIGIBLES POUR AFFECTATION
  ------------------------- */

  async getEligibleForAllocation(): Promise<SaEligibleDto[]> {
    const items = await this.saRepo.find({
      where: { status: In(['OPEN', 'PARTIALLY_APURED']) as any },
      relations: ['family', 'supplier'],
      order: { due_date: 'ASC' },
    });

    return items.map((sa) => {
      const initial = Number(sa.quantity_initial ?? 0);

      // quantité déjà apurée (arrondie à 3 décimales)
      const apuredRaw = Number(sa.quantity_apured ?? 0);
      const apured = Number(apuredRaw.toFixed(3));

      // reste SA (arrondi à 3 décimales)
      const saRemainingRaw = Math.max(initial - apured, 0);
      const saRemaining = Number(saRemainingRaw.toFixed(3));

      // pourcentage famille (5, 6, 8…)
      const scrapRaw =
        (sa as any).family && (sa as any).family.scrap_percent !== undefined
          ? Number((sa as any).family.scrap_percent)
          : 0;

      const scrapPercent = Number.isFinite(scrapRaw) ? scrapRaw : 0;
      const coef = 1 + scrapPercent / 100; // 1.05, 1.06, 1.08…

      // quantité EA max encore imputable (reste SA / coef)
      const eaRemaining =
        coef > 0
          ? Number((saRemaining / coef).toFixed(3))
          : saRemaining;

      // due_date → string yyyy-mm-dd
      const rawDue: any = (sa as any).due_date;
      const dueDate =
        rawDue instanceof Date
          ? rawDue.toISOString().slice(0, 10)
          : String(rawDue);

      const supplierName =
        (sa as any).supplier?.name ?? sa.supplier_name ?? null;

      return {
        id: sa.id,
        sa_number: sa.sa_number,
        supplier_name: supplierName,
        due_date: dueDate,
        quantity_initial: initial,
        quantity_apured: apured,      // arrondi
        sa_remaining: saRemaining,    // arrondi
        remaining_quantity: eaRemaining,
        quantity_unit: sa.quantity_unit,
        scrap_percent: scrapPercent,
      };
    });
  }

  /* -------------------------
     HELPERS
  ------------------------- */

  // Vérifie et normalise l'ID (évite 'undefined' → BIGINT)
  private normalizeIdParam(idRaw: string): string {
    if (!idRaw || idRaw === 'undefined' || idRaw === 'null') {
      throw new BadRequestException('SA id is required');
    }

    const idNumber = Number(idRaw);
    if (!Number.isFinite(idNumber) || idNumber <= 0) {
      throw new BadRequestException('Invalid SA id');
    }

    // SQL Server BIGINT → string OK pour TypeORM
    return idNumber.toString();
  }

  private normalizeSaNumber(input: string): string {
    if (!input) {
      throw new BadRequestException('Numéro SA obligatoire');
    }

    let trimmed = input.trim().toUpperCase();

    // on enlève un éventuel "SA" devant
    if (trimmed.startsWith('SA')) {
      trimmed = trimmed.substring(2);
    }

    if (!/^\d{6}$/.test(trimmed)) {
      throw new BadRequestException(
        'Le numéro SA doit contenir 6 chiffres (ex: 250001).',
      );
    }

    return `SA${trimmed}`;
  }

  private mapSa(sa: SaDeclaration) {
    const qtyInitial = Number(sa.quantity_initial);
    const scrapQty = sa.scrap_quantity_ton
      ? Number(sa.scrap_quantity_ton)
      : null;
    const qtyApured = Number(sa.quantity_apured ?? 0);
    const invoiceAmount = sa.invoice_amount
      ? Number(sa.invoice_amount)
      : null;
    const fxRate = sa.fx_rate ? Number(sa.fx_rate) : null;
    const amountDs = sa.amount_ds ? Number(sa.amount_ds) : null;

    return {
      id: sa.id,
      sa_number: sa.sa_number,
      regime_code: sa.regime_code,
      declaration_date: sa.declaration_date,
      due_date: sa.due_date,
      status: sa.status,

      quantity_initial: qtyInitial,
      quantity_unit: sa.quantity_unit,
      scrap_quantity_ton: scrapQty,
      quantity_apured: qtyApured,

      invoice_amount: invoiceAmount,
      currency_code: sa.currency_code,
      fx_rate: fxRate,
      amount_ds: amountDs,

      supplier_id: sa.supplier ? sa.supplier.id : null,
      supplier_name:
        sa.supplier_name ??
        sa.supplier?.name ??
        null,

      family_id: sa.family ? sa.family.id : null,
      family_label: sa.family?.label ?? null,
      scrap_percent: sa.family
        ? Number(sa.family.scrap_percent)
        : null,

      description: sa.description,
      created_by: sa.created_by,
      created_at: sa.created_at,
      updated_by: sa.updated_by,
      updated_at: sa.updated_at,
    };
  }
}
