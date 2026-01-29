import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmConfig } from './config/database.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { SaModule } from './sa/sa.module';
import { EaModule } from './ea/ea.module';
import { ApurementModule } from './appurement/apurement.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { CustomersModule } from './customers/customers.module';
import { ArticlesModule } from './articles/articles.module';
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => getTypeOrmConfig(),
    }),
    UsersModule,
    AuthModule,
    SaModule,
    EaModule,
    ApurementModule,
    SuppliersModule,
    CustomersModule,
    // Articles (SA family articles)
    ArticlesModule,
    // Export endpoints for SA/EA Excel
    ExportModule,
  ],
})
export class AppModule {}
