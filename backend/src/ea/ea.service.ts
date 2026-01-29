import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EaDeclaration } from './ea-declaration.entity';
import { CreateEaDto } from './dto/create-ea.dto';
import { UpdateEaDto } from './dto/update-ea.dto';
import { User } from '../users/user.entity';
import { ApurementService } from '../appurement/apurement.service';

@Injectable()
export class EaService {
  constructor(
    @InjectRepository(EaDeclaration)
    private readonly eaRepo: Repository<EaDeclaration>,
    private readonly apurementService: ApurementService,
  ) {}

  async findAll(): Promise<EaDeclaration[]> {
    return this.eaRepo.find({
      order: { export_date: 'DESC' },
    });
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
      'id',
      'ea_number',
      'export_date',
      'customer_name',
      'destination_country',
      'product_ref',
      'product_desc',
      'total_quantity',
      'quantity_unit',
      'status',
    ]);

    items.forEach((ea) => {
      ws.addRow([
        ea.id,
        ea.ea_number,
        ea.export_date,
        ea.customer_name,
        ea.destination_country,
        ea.product_ref,
        ea.product_desc,
        Number(ea.total_quantity),
        ea.quantity_unit,
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
    const totalQty = Number(dto.total_quantity);
    if (!Number.isFinite(totalQty) || totalQty <= 0) {
      throw new BadRequestException(
        'Total quantity must be a positive number.',
      );
    }

    const eaNumber = this.normalizeEaNumber(dto.ea_number);

    const ea = this.eaRepo.create({
      ea_number: eaNumber,
      regime_code: dto.regime_code ?? '362',
      export_date: dto.export_date,
      status: 'SUBMITTED',
      customer_name: dto.customer_name,
      destination_country: dto.destination_country ?? null,
      product_ref: dto.product_ref ?? null,
      product_desc: dto.product_desc ?? null,
      total_quantity: totalQty.toString(),
      quantity_unit: dto.quantity_unit,
      createdBy: user,
      created_by: user.id,
    });

    const saved = await this.eaRepo.save(ea);

    // Mode "EA liée directement à une SA" (optionnel)
    if (dto.linked_sa_id && dto.linked_quantity) {
      const q = Number(dto.linked_quantity);
      if (!Number.isFinite(q) || q <= 0) {
        throw new BadRequestException(
          'linked_quantity must be a positive number when linked_sa_id is provided.',
        );
      }

      try {
        await this.apurementService.createAllocation(
          {
            sa_id: dto.linked_sa_id,
            ea_id: saved.id,
            quantity: q,
          },
          user,
        );
      } catch (err) {
        // Si l'apurement échoue, on supprime l'EA créée pour rester cohérent
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