import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { SaModule } from '../sa/sa.module';
import { EaModule } from '../ea/ea.module';

@Module({
  imports: [SaModule, EaModule],
  controllers: [ExportController],
})
export class ExportModule {}
