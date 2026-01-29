import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from './supplier.entity';
import { SaDeclaration } from '../sa/sa-declaration.entity';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,

    @InjectRepository(SaDeclaration)
    private readonly saRepo: Repository<SaDeclaration>,
  ) {}

  async findAll(): Promise<Supplier[]> {
    return this.supplierRepo.find({
      order: { name: 'ASC' },
    });
  }

  async findOneById(idRaw: string): Promise<Supplier> {
    if (!idRaw) {
      throw new BadRequestException('Supplier id required');
    }

    const idNum = Number(idRaw);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      throw new BadRequestException('Invalid supplier id');
    }

    const id = idNum.toString();

    const supplier = await this.supplierRepo.findOne({
      where: { id: id as any },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async create(data: { code: string; name: string; is_active?: boolean }) {
    const supplier = this.supplierRepo.create({
      code: data.code.trim(),
      name: data.name.trim(),
      is_active: data.is_active ?? true,
    });

    return this.supplierRepo.save(supplier);
  }

  async update(
    idRaw: string,
    data: { code?: string; name?: string; is_active?: boolean },
  ) {
    const supplier = await this.findOneById(idRaw);

    if (data.code !== undefined) {
      supplier.code = data.code.trim();
    }
    if (data.name !== undefined) {
      supplier.name = data.name.trim();
    }
    if (data.is_active !== undefined) {
      supplier.is_active = data.is_active;
    }

    return this.supplierRepo.save(supplier);
  }

  async remove(idRaw: string): Promise<void> {
    const supplier = await this.findOneById(idRaw);

    // 🔍 vérifier s'il existe des SA qui pointent sur ce fournisseur
    const saCount = await this.saRepo.count({
      where: {
        supplier: { id: supplier.id as any }, // on passe par la relation
      },
    });

    if (saCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce fournisseur : il est utilisé dans ${saCount} déclaration(s) SA.`,
      );
    }

    await this.supplierRepo.remove(supplier);
  }
}