import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EaDeclaration } from './ea-declaration.entity';
import { SaDeclaration } from '../sa/sa-declaration.entity';
import { CreateEaDto } from './dto/create-ea.dto';
import { UpdateEaDto } from './dto/update-ea.dto';
import { User } from '../users/user.entity';
import { ApurementService } from '../appurement/apurement.service';
import { SaFamily } from '../sa/sa-family.entity';

@Injectable()
export class EaService implements OnModuleInit {
  constructor(
    @InjectRepository(EaDeclaration)
    private readonly eaRepo: Repository<EaDeclaration>,
    @InjectRepository(SaDeclaration)
    private readonly saRepo: Repository<SaDeclaration>,
    @InjectRepository(SaFamily)
    private readonly familyRepo: Repository<SaFamily>,
    private readonly apurementService: ApurementService,
  ) { }

  async onModuleInit() {
    console.log('--- EaService.onModuleInit: Checking for family_id column ---');
    try {
      // Pour SQL Server
      const query = `
        IF NOT EXISTS (
          SELECT * FROM sys.columns 
          WHERE object_id = OBJECT_ID('ea_declarations') 
          AND name = 'family_id'
        )
        BEGIN
          ALTER TABLE ea_declarations ADD family_id bigint NULL;
          PRINT 'Added family_id column to ea_declarations';
        END
      `;
      await this.eaRepo.query(query);
      console.log('--- EaService.onModuleInit: Schema check completed ---');
    } catch (err) {
      console.error('--- EaService.onModuleInit error:', err.message);
    }
  }

  async findAll(query?: { unique?: string | boolean }): Promise<any[]> {
    const isUnique = query?.unique === 'true' || query?.unique === true;

    const eas = await this.eaRepo.find({
      order: { export_date: 'DESC' },
    });

    if (isUnique) {
      return eas;
    }

    // Pour chaque EA, récupérer TOUTES les allocations et créer une ligne par allocation
    const allRows: any[] = [];

    for (const ea of eas) {
      const allocations = await this.apurementService.findByEaId(ea.id);

      if (allocations.length === 0) {
        // EA sans allocation : afficher une ligne normale avec quantité totale
        allRows.push({
          ...ea,
          allocation_id: null,
          sa_number: null,
          sa_supplier: null,
          allocated_quantity: null,
          allocated_scrap_quantity: null,
          sa_family_name: null,
        });
      } else {
        // EA avec allocations : créer une ligne par allocation
        for (const alloc of allocations) {
          allRows.push({
            ...ea,
            allocation_id: alloc.id,
            sa_number: alloc.sa?.sa_number ?? null,
            sa_supplier: alloc.sa?.supplier_name ?? null,
            allocated_quantity: alloc.quantity, // Quantité allouée à cette SA spécifique
            allocated_scrap_quantity: (alloc as any).scrap_quantity,
            sa_family_name: (alloc as any).sa?.family_name || null,
          });
        }
      }
    }

    return allRows;
  }

  async findOne(id: string): Promise<EaDeclaration> {
    const ea = await this.eaRepo.findOne({ where: { id } });
    if (!ea) {
      throw new NotFoundException('EA not found');
    }
    return ea;
  }

  async exportExcel(query: any): Promise<Buffer> {
    const where: any = {};
    if (query.customer_name) where.customer_name = query.customer_name;

    const items = await this.eaRepo.find({ where, order: { export_date: 'DESC' } });

    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('EA');

    ws.addRow([
      'N° EA',
      'Client',
      'Pays',
      'Date export',
      'Quantité',
      'Déchet (%)',
      'Déchet (Qté)',
      'Statut',
    ]);

    items.forEach((ea) => {
      ws.addRow([
        ea.ea_number,
        ea.customer_name,
        ea.destination_country ?? '',
        ea.export_date,
        `${Number(ea.total_quantity).toLocaleString('fr-FR')} ${ea.quantity_unit}`,
        ea.scrap_percent != null ? `${ea.scrap_percent} %` : '-',
        ea.scrap_quantity != null ? `${ea.scrap_quantity} ${ea.quantity_unit}` : '-',
        ea.status,
      ]);
    });

    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
  }

  /**
   * Création d'une EA.
   * - Création simple d'EA
   * - SI linked_sa_id + linked_quantity : création d'une allocation SA/EA en plus.
   */
  async create(dto: CreateEaDto, user: User): Promise<EaDeclaration> {
    console.log('--- EaService.create DEBUG ---');
    console.log('DTO received:', JSON.stringify(dto));
    const totalQty = Number(dto.total_quantity);
    if (!Number.isFinite(totalQty) || totalQty <= 0) {
      throw new BadRequestException(
        'Total quantity must be a positive number.',
      );
    }

    const eaNumber = this.normalizeEaNumber(dto.ea_number);

    // Par défaut, scrap_percent du DTO (si fourni)
    let scrapPercent: string | null = dto.scrap_percent != null ? String(dto.scrap_percent) : null;
    let scrapQuantity: string | null = null;
    let familyId: string | null = dto.family_id || null;

    // Si on a un family_id, on récupère le scrap_percent de la famille
    if (familyId) {
      const family = await this.familyRepo.findOne({ where: { id: familyId } });
      if (family && family.scrap_percent) {
        scrapPercent = String(family.scrap_percent);
      }
    } else if (!scrapPercent) {
      // Fallback: chercher via la première SA si family_id non fourni
      let saIdToCheck: string | null = null;
      if (dto.linked_sas && dto.linked_sas.length > 0) {
        saIdToCheck = dto.linked_sas[0].sa_id;
      } else if (dto.linked_sa_id) {
        saIdToCheck = dto.linked_sa_id;
      }

      if (saIdToCheck) {
        const sa = await this.saRepo.findOne({
          where: { id: saIdToCheck },
          relations: ['family']
        });
        if (sa && sa.family) {
          familyId = sa.family.id;
          if (sa.family.scrap_percent) {
            scrapPercent = String(sa.family.scrap_percent);
          }
        }
      }
    }

    // Calcul de la quantité de déchet si possible
    if (scrapPercent != null && !isNaN(Number(scrapPercent))) {
      const percent = Number(scrapPercent);
      const q = Number(totalQty);
      if (q > 0 && percent > 0) {
        scrapQuantity = ((q * (percent / 100)) / (1 - percent / 100)).toFixed(3);
      }
    }

    // On garde la description fournie par le front (libellé de l'article choisi)
    const productDesc = dto.product_desc || null;

    const ea = this.eaRepo.create({
      ea_number: eaNumber,
      regime_code: dto.regime_code ?? '362',
      export_date: dto.export_date,
      status: 'SUBMITTED',
      customer_name: dto.customer_name,
      destination_country: dto.destination_country ?? null,
      family_id: familyId,
      product_ref: dto.product_ref ?? null,
      product_desc: productDesc,
      total_quantity: totalQty.toString(),
      quantity_unit: dto.quantity_unit,
      createdBy: user,
      created_by: user.id,
      scrap_percent: scrapPercent,
      scrap_quantity: scrapQuantity,
    });

    const saved = await this.eaRepo.save(ea);

    // Mode "EA liée directement à une SA" (optionnel) - OBSOLETE mais supporté
    if (dto.linked_sa_id && dto.linked_quantity) {
      if (!dto.linked_sas) dto.linked_sas = [];
      dto.linked_sas.push({
        sa_id: dto.linked_sa_id,
        quantity: dto.linked_quantity,
      });
    }

    // Traitement des allocations multiples
    if (dto.linked_sas && dto.linked_sas.length > 0) {
      try {
        for (const item of dto.linked_sas) {
          const q = Number(item.quantity);
          if (!Number.isFinite(q) || q <= 0) {
            throw new BadRequestException(
              'linked_quantity must be a positive number for each SA.',
            );
          }

          await this.apurementService.createAllocation(
            {
              sa_id: item.sa_id,
              ea_id: saved.id,
              quantity: q,
            },
            user,
          );
        }
      } catch (err) {
        // Si un apurement échoue, on supprime l'EA créée pour rester cohérent (transaction manuelle approx)
        await this.eaRepo.delete(saved.id);
        throw err;
      }
    }

    return saved;
  }

  /**
   * Mise à jour d'une EA.
   * Verrouillage : si l'EA a déjà des apurements, on interdit la modification.
   */
  async update(
    id: string,
    dto: UpdateEaDto,
    user: User,
  ): Promise<EaDeclaration> {
    const ea = await this.eaRepo.findOne({ where: { id } });
    if (!ea) {
      throw new NotFoundException('EA not found');
    }

    // 🔒 Verrouillage si déjà apurée
    const hasAlloc = await this.apurementService.hasAllocationsForEa(id);
    if (hasAlloc) {
      throw new BadRequestException(
        "Impossible de modifier cette EA : elle est déjà utilisée dans un apurement. Annulez d'abord les apurements.",
      );
    }

    if (dto.ea_number !== undefined) {
      ea.ea_number = dto.ea_number;
    }
    if (dto.export_date !== undefined) {
      ea.export_date = dto.export_date;
    }
    if (dto.customer_name !== undefined) {
      ea.customer_name = dto.customer_name;
    }
    if (dto.destination_country !== undefined) {
      ea.destination_country = dto.destination_country ?? null;
    }
    if (dto.product_ref !== undefined) {
      ea.product_ref = dto.product_ref ?? null;
    }
    if (dto.product_desc !== undefined) {
      ea.product_desc = dto.product_desc ?? null;
    }
    if (dto.total_quantity !== undefined) {
      const q = Number(dto.total_quantity);
      if (!Number.isFinite(q) || q <= 0) {
        throw new BadRequestException(
          'total_quantity must be a positive number.',
        );
      }
      ea.total_quantity = q.toString();
    }
    if (dto.quantity_unit !== undefined) {
      ea.quantity_unit = dto.quantity_unit;
    }
    if (dto.regime_code !== undefined) {
      ea.regime_code = dto.regime_code ?? '362';
    }

    // On ignore linked_sa_id / linked_quantity en update

    ea.updatedBy = user;
    ea.updated_by = user.id;
    ea.updated_at = new Date();

    return this.eaRepo.save(ea);
  }

  /**
   * Suppression d'une EA.
   * Verrouillage : si l'EA a déjà des apurements, on interdit la suppression.
   */
  async remove(id: string, _user: User): Promise<void> {
    const ea = await this.eaRepo.findOne({ where: { id } });
    if (!ea) {
      throw new NotFoundException('EA not found');
    }

    const hasAlloc = await this.apurementService.hasAllocationsForEa(id);
    if (hasAlloc) {
      throw new BadRequestException(
        "Impossible de supprimer cette EA : elle est déjà utilisée dans un apurement. Annulez d'abord les apurements.",
      );
    }

    await this.eaRepo.delete(id);
  }

  private normalizeEaNumber(input: string): string {
    if (!input) {
      throw new BadRequestException('Numéro EA obligatoire');
    }

    let trimmed = input.trim().toUpperCase();

    if (trimmed.startsWith('EA')) {
      trimmed = trimmed.substring(2);
    }

    if (!/^\d{6}$/.test(trimmed)) {
      throw new BadRequestException(
        'Le numéro EA doit contenir 6 chiffres (ex: 250001).',
      );
    }

    return `EA${trimmed}`;
  }
}