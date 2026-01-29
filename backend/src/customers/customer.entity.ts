import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  code: string | null;

  @Column({ type: 'nvarchar', length: 200 })
  name: string;

  @Column({ type: 'bit', default: true })
  is_active: boolean;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  created_at: Date;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  updated_at: Date;
}
