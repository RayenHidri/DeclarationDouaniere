import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EaService } from './ea.service';
import { CreateEaDto } from './dto/create-ea.dto';
import { UpdateEaDto } from './dto/update-ea.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { User } from '../users/user.entity';

@Controller('ea')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EaController {
  constructor(private readonly eaService: EaService) {}

  @Get()
  async findAll() {
    return this.eaService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eaService.findOne(id);
  }

  @Post()
  @Roles('EXPORT', 'ADMIN')
  async create(@Body() dto: CreateEaDto, @CurrentUser() user: User) {
    return this.eaService.create(dto, user);
  }

  @Patch(':id')
  @Roles('EXPORT', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEaDto,
    @CurrentUser() user: User,
  ) {
    return this.eaService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('EXPORT', 'ADMIN')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.eaService.remove(id, user);
  }
}
