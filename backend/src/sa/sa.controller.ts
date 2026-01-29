import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SaService } from './sa.service';
import { CreateSaDto } from './dto/create-sa.dto';
import { UpdateSaDto } from './dto/update-sa.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { User } from '../users/user.entity';
import { SaEligibleDto } from './dto/sa-eligible.dto';

@Controller('sa')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SaController {
  constructor(private readonly saService: SaService) {}

  @Get()
  async findAll() {
    // Tous les users authentifiés peuvent consulter les SA
    return this.saService.findAll(); // renvoie déjà des objets mappés
  }

  @Get('eligible')
  async findEligible(): Promise<SaEligibleDto[]> {
    return this.saService.getEligibleForAllocation();
  }

  @Get('for-ea/:id')
  async getForEa(@Param('id') id: string) {
    return this.saService.getForEa(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // on utilise la version mappée (avec scrap, montant DS, etc.)
    return this.saService.findOne(id);
  }

  @Post()
  @Roles('ACHAT', 'ADMIN')
  async create(@Body() dto: CreateSaDto, @CurrentUser() user: User) {
    return this.saService.create(dto, user);
  }

  @Patch(':id')
  @Roles('ACHAT', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSaDto,
    @CurrentUser() user: User,
  ) {
    return this.saService.update(id, dto, user);
  }
}