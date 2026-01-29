// src/sa/sa-family.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaFamily } from './sa-family.entity';

@Injectable()
export class SaFamilyService {
  constructor(
    @InjectRepository(SaFamily)
    private readonly familyRepo: Repository<SaFamily>,
  ) {}

  async findAll(): Promise<SaFamily[]> {
    return this.familyRepo.find({
      order: { label: 'ASC' },
    });
  }
}
