import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaEaAllocation } from './sa-ea-allocation.entity';
import { SaDeclaration } from '../sa/sa-declaration.entity';
import { EaDeclaration } from '../ea/ea-declaration.entity';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { User } from '../users/user.entity';

@Injectable()
export class ApurementService {
  constructor(
    @InjectRepository(SaEaAllocation)
    private readonly allocRepo: Repository<SaEaAllocation>,

    @InjectRepository(SaDeclaration)
    private readonly saRepo: Repository<SaDeclaration>,

    @InjectRepository(EaDeclaration)
    private readonly eaRepo: Repository<EaDeclaration>,
  ) { }

  /**
   * dto.quantity = quantité EA (en TONNES) à affecter sur cette SA
   * On consomme sur la SA : qte_EA * coef_famille (ex: 1.05 pour 5 %)
   */
  async createAllocation(
    dto: CreateAllocationDto,
    user: User,
  ): Promise<SaEaAllocation> {
    // Charger la SA avec sa famille pour connaître le pourcentage
    const sa = await this.saRepo.findOne({
      where: { id: dto.sa_id },
      relations: ['family'],
    });
    if (!sa) {
      throw new NotFoundException('SA not found');
    }

    const ea = await this.eaRepo.findOne({ where: { id: dto.ea_id } });
    if (!ea) {
      throw new NotFoundException('EA not found');
    }

    const rawQuantity = Number(dto.quantity);
    if (!Number.isFinite(rawQuantity) || rawQuantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const scrapPercent = sa.family
      ? Number(sa.family.scrap_percent ?? 0)
      : 0;

    const t = scrapPercent / 100;
    if (t >= 1) {
      throw new BadRequestException('Invalid scrap percent for SA family');
    }

    // Quantité SA consommée en billettes = quantité EA nette / (1 - t)
    const coef = 1 / (1 - t); // ex : 1 / 0.95 = 1.052631...
    const consumedOnSa = Number((rawQuantity * coef).toFixed(3));

    // Vérifier qu'on ne dépasse pas la quantité initiale SA
    const currentAllocated = await this.getTotalAllocatedForSa(sa.id);
    const newTotal = currentAllocated + consumedOnSa;

    const quantityInitial = Number(sa.quantity_initial);

    if (newTotal > quantityInitial + 0.0001) {
      throw new BadRequestException(
        `Allocated quantity (${newTotal}) exceeds SA initial quantity (${quantityInitial})`,
      );
    }

    // On stocke dans l'allocation la quantité CONSOMMÉE SA
    const allocation = this.allocRepo.create({
      sa,
      sa_id: sa.id,
      ea,
      ea_id: ea.id,
      quantity: consumedOnSa.toString(), // quantité côté SA, pas la quantité EA brute
      createdBy: user,
      created_by: user.id,
    });

    const saved = await this.allocRepo.save(allocation);

    // Recalculer l'apurement de la SA (somme des consommations SA)
    await this.recalculateSaApurement(sa.id);

    return saved;
  }

  async getAllocationsForSa(saId: string): Promise<SaEaAllocation[]> {
    return this.allocRepo.find({
      where: { sa_id: saId },
      relations: ['ea'],
      order: { created_at: 'ASC' },
    });
  }

  async getAllocationsForEa(eaId: string): Promise<SaEaAllocation[]> {
    return this.allocRepo.find({
      where: { ea_id: eaId },
      relations: ['sa'],
      order: { created_at: 'ASC' },
    });
  }

  /** Somme des quantités consommées sur la SA (en TONNES) */
  private async getTotalAllocatedForSa(saId: string): Promise<number> {
    const rows = await this.allocRepo.find({
      where: { sa_id: saId },
    });

    return rows.reduce(
      (sum, row) => sum + Number(row.quantity ?? 0),
      0,
    );
  }

  /** Met à jour quantity_apured + status de la SA */
  private async recalculateSaApurement(saId: string): Promise<void> {
    const sa = await this.saRepo.findOne({ where: { id: saId } });
    if (!sa) {
      return;
    }

    const totalAllocated = await this.getTotalAllocatedForSa(saId);
    const initial = Number(sa.quantity_initial);

    sa.quantity_apured = totalAllocated.toString();

    if (totalAllocated <= 0) {
      sa.status = 'OPEN';
    } else if (totalAllocated + 0.0001 < initial) {
      sa.status = 'PARTIALLY_APURED';
    } else {
      sa.status = 'FULLY_APURED';
    }

    await this.saRepo.save(sa);
  }

  /** Liste des allocations pour une SA (quantité = consommée SA) */
  async findBySaId(saIdRaw: string) {
    const saId = Number(saIdRaw);
    if (!Number.isFinite(saId) || saId <= 0) {
      throw new Error('Invalid SA id');
    }

    const allocations = await this.allocRepo.find({
      where: { sa_id: saId.toString() as any },
      relations: ['ea'],
      order: { created_at: 'ASC' },
    });

    return allocations.map((a) => ({
      id: a.id,
      quantity: Number(a.quantity), // quantité consommée sur SA
      created_at: a.created_at,
      ea: a.ea && {
        id: a.ea.id,
        ea_number: a.ea.ea_number,
        export_date: a.ea.export_date,
        customer_name: a.ea.customer_name,
        total_quantity: Number(a.ea.total_quantity),
        quantity_unit: a.ea.quantity_unit,
      },
    }));
  }

  /** Liste des allocations pour une EA (quantité = consommée SA) */
  async findByEaId(eaIdRaw: string) {
    const eaId = Number(eaIdRaw);
    if (!Number.isFinite(eaId) || eaId <= 0) {
      throw new Error('Invalid EA id');
    }

    const allocations = await this.allocRepo.find({
      where: { ea_id: eaId.toString() as any },
      relations: ['sa', 'sa.family'],
      order: { created_at: 'ASC' },
    });

    return allocations.map((a) => {
      const quantity = Number(a.quantity);
      let scrapPercent = 0;
      if (a.sa?.family?.scrap_percent) {
        scrapPercent = Number(a.sa.family.scrap_percent);
      }

      // Calcul du déchet pour cette allocation spécifique
      const scrapQuantity = scrapPercent > 0
        ? (quantity * (scrapPercent / 100)) / (1 - scrapPercent / 100)
        : 0;

      return {
        id: a.id,
        quantity, // quantité consommée sur SA
        scrap_quantity: Number(scrapQuantity.toFixed(3)),
        created_at: a.created_at,
        sa: a.sa && {
          id: a.sa.id,
          sa_number: a.sa.sa_number,
          supplier_name: a.sa.supplier_name,
          due_date: a.sa.due_date,
          quantity_initial: Number(a.sa.quantity_initial),
          quantity_apured: Number(a.sa.quantity_apured),
          quantity_unit: a.sa.quantity_unit,
          description: a.sa.description,
          family_id: a.sa.family?.id || null,
          family_name: a.sa.family?.label || null,
        },
      };
    });
  }

  async hasAllocationsForEa(eaIdRaw: string): Promise<boolean> {
    const eaId = eaIdRaw.toString();
    const count = await this.allocRepo.count({
      where: { ea_id: eaId as any },
    });
    return count > 0;
  }

  /** Récupère la première allocation pour une EA (pour affichage dans la liste) */
  async getFirstAllocationForEa(eaId: string) {
    const allocation = await this.allocRepo.findOne({
      where: { ea_id: eaId as any },
      relations: ['sa', 'sa.supplier'],
      order: { created_at: 'ASC' },
    });

    if (!allocation) return null;

    return {
      id: allocation.id,
      quantity: Number(allocation.quantity),
      created_at: allocation.created_at,
      sa: allocation.sa && {
        id: allocation.sa.id,
        sa_number: allocation.sa.sa_number,
        supplier_name: allocation.sa.supplier?.name ?? allocation.sa.supplier_name,
        due_date: allocation.sa.due_date,
        quantity_initial: Number(allocation.sa.quantity_initial),
        quantity_apured: Number(allocation.sa.quantity_apured),
        quantity_unit: allocation.sa.quantity_unit,
      },
    };
  }
}