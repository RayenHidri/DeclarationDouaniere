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
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('suppliers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async findAll() {
    return this.suppliersService.findAll();
  }

  @Post()
  @Roles('ACHAT', 'ADMIN')
  async create(
    @Body()
    body: {
      code: string;
      name: string;
      is_active?: boolean;
    },
  ) {
    return this.suppliersService.create(body);
  }

  @Patch(':id')
  @Roles('ACHAT', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      code?: string;
      name?: string;
      is_active?: boolean;
    },
  ) {
    return this.suppliersService.update(id, body);
  }

  @Delete(':id')
  @Roles('ACHAT', 'ADMIN')
  async remove(@Param('id') id: string) {
    await this.suppliersService.remove(id);
    return { success: true };
  }
}
