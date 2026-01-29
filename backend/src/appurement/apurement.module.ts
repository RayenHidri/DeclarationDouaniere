import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaEaAllocation } from './sa-ea-allocation.entity';
import { SaDeclaration } from '../sa/sa-declaration.entity';
import { EaDeclaration } from '../ea/ea-declaration.entity';
import { ApurementService } from './apurement.service';
import { ApurementController } from './apurement.controller';
import { RolesGuard } from '../auth/roles.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([SaEaAllocation, SaDeclaration, EaDeclaration]),
  ],
  controllers: [ApurementController],
  exports: [ApurementService], 
  providers: [ApurementService, RolesGuard, Reflector],
})

export class ApurementModule {}
