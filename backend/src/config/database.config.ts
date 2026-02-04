import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getTypeOrmConfig(): TypeOrmModuleOptions {
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    type: 'mssql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '1433', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false,
    logging: isDev,
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    options: {
      encrypt: false,
      trustServerCertificate: true
    },
  };
}