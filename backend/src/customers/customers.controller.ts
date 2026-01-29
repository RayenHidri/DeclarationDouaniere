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
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll() {
    return this.customersService.findAll();
  }

  @Post()
  @Roles('EXPORT', 'ADMIN')
  async create(
    @Body()
    body: {
      code: string;
      name: string;
      is_active?: boolean;
    },
  ) {
    return this.customersService.create(body);
  }

  @Patch(':id')
  @Roles('EXPORT', 'ADMIN')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      code?: string;
      name?: string;
      is_active?: boolean;
    },
  ) {
    return this.customersService.update(id, body);
  }

  @Delete(':id')
  @Roles('EXPORT', 'ADMIN')
  async remove(@Param('id') id: string) {
    await this.customersService.remove(id);
    return { success: true };
  }
}
