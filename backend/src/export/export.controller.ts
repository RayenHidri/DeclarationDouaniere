import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { SaService } from '../sa/sa.service';
import { EaService } from '../ea/ea.service';
import { Response } from 'express';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly saService: SaService, private readonly eaService: EaService) {}

  @Get('sa')
  @Roles('ACHAT', 'ADMIN', 'DGA')
  async exportSa(@Query() query: any, @Res() res: Response) {
    const buffer = await this.saService.exportExcel(query);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="sa_export.xlsx"`);
    res.send(buffer);
  }

  @Get('ea')
  @Roles('EXPORT', 'ADMIN', 'DGA')
  async exportEa(@Query() query: any, @Res() res: Response) {
    const buffer = await this.eaService.exportExcel(query);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ea_export.xlsx"`);
    res.send(buffer);
  }
}
