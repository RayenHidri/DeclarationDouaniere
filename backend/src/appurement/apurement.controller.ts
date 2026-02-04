import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApurementService } from './apurement.service';
import { CreateAllocationDto } from './dto/create-allocation.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/user.decorator';
import { User } from '../users/user.entity';

@Controller('apurement')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApurementController {
  constructor(private readonly apurementService: ApurementService) { }

  @Post()
  @Roles('EXPORT', 'ADMIN')
  async createAllocation(
    @Body() dto: CreateAllocationDto,
    @CurrentUser() user: User,
  ) {
    return this.apurementService.createAllocation(dto, user);
  }

  @Get('sa/:saId')
  async getBySa(@Param('saId') saId: string) {
    return this.apurementService.findBySaId(saId);
  }

  @Get('ea/:eaId')
  async getByEa(@Param('eaId') eaId: string) {
    return this.apurementService.findByEaId(eaId);
  }
}
