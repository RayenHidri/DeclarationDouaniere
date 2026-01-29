import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async findAll(): Promise<Customer[]> {
    return this.customerRepo.find({
      order: { name: 'ASC' },
    });
  }

  async findOneById(idRaw: string): Promise<Customer> {
    if (!idRaw) {
      throw new BadRequestException('Customer id required');
    }

    const idNum = Number(idRaw);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      throw new BadRequestException('Invalid customer id');
    }

    const id = idNum.toString();

    const customer = await this.customerRepo.findOne({
      where: { id: id as any },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async create(data: { code: string; name: string; is_active?: boolean }) {
    const customer = this.customerRepo.create({
      code: data.code.trim(),
      name: data.name.trim(),
      is_active: data.is_active ?? true,
    });

    return this.customerRepo.save(customer);
  }

  async update(
    idRaw: string,
    data: { code?: string; name?: string; is_active?: boolean },
  ) {
    const customer = await this.findOneById(idRaw);

    if (data.code !== undefined) {
      customer.code = data.code.trim();
    }
    if (data.name !== undefined) {
      customer.name = data.name.trim();
    }
    if (data.is_active !== undefined) {
      customer.is_active = data.is_active;
    }

    return this.customerRepo.save(customer);
  }

  async remove(idRaw: string): Promise<void> {
    const customer = await this.findOneById(idRaw);
    await this.customerRepo.remove(customer);
  }
}
