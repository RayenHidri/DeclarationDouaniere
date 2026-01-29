import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('articles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArticlesController {
  constructor(private readonly svc: ArticlesService) {}

  @Get()
  @Roles('ACHAT', 'EXPORT', 'ADMIN', 'DGA')
  async list(@Query('family_id') familyId?: string) {
    return this.svc.list(familyId);
  }

  @Post()
  @Roles('ADMIN')
  async create(@Body() dto: any) {
    return this.svc.create(dto);
  }
}
