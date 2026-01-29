import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EaDeclaration } from './ea-declaration.entity';
import { EaService } from './ea.service';
import { EaController } from './ea.controller';
import { ApurementModule } from '../appurement/apurement.module';

@Module({
  imports: [TypeOrmModule.forFeature([EaDeclaration]), ApurementModule],
  controllers: [EaController],
  providers: [EaService],
  exports: [EaService],
})
export class EaModule {}