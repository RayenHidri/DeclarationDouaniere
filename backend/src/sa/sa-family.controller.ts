import { Controller, Get, UseGuards } from '@nestjs/common';
import { SaFamilyService } from './sa-family.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('sa-families')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SaFamilyController {
  constructor(private readonly familyService: SaFamilyService) {}

  @Get()
  async findAll() {
    // lecture simple, tous les utilisateurs authentifiés peuvent voir
    return this.familyService.findAll();
  }
}