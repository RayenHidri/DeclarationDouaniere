import { DataSource } from 'typeorm';
import { getTypeOrmConfig } from './config/database.config';

export const AppDataSource = new DataSource(getTypeOrmConfig() as any);
