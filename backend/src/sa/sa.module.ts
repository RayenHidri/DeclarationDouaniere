import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';

import { SaDeclaration } from './sa-declaration.entity';
import { SaFamily } from './sa-family.entity';
import { SaService } from './sa.service';
import { SaController } from './sa.controller';
import { SaFamilyController } from './sa-family.controller';
import { SaFamilyService } from './sa-family.service';

import { Supplier } from '../suppliers/supplier.entity';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([SaDeclaration, SaFamily, Supplier])],
  controllers: [SaController, SaFamilyController],
  providers: [
    SaService,
    SaFamilyService, 
    RolesGuard,
    Reflector, 
  ],
  exports: [
    SaService,
    SaFamilyService,
  ],
})
export class SaModule {}
