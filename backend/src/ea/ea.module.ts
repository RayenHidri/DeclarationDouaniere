import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EaDeclaration } from './ea-declaration.entity';
import { SaDeclaration } from '../sa/sa-declaration.entity';
import { SaFamily } from '../sa/sa-family.entity';
import { EaService } from './ea.service';
import { EaController } from './ea.controller';
import { ApurementModule } from '../appurement/apurement.module';

@Module({
  imports: [TypeOrmModule.forFeature([EaDeclaration, SaDeclaration, SaFamily]), ApurementModule],
  controllers: [EaController],
  providers: [EaService],
  exports: [EaService],
})
export class EaModule { }