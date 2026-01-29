import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sa_families')
export class SaFamily {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  // Libellé de la famille (ex: "Rond à béton")
  @Column({ type: 'nvarchar', length: 100 })
  label: string;

  // Pourcentage de droit de déchet, exemple 5.00 pour 5 %
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  scrap_percent: string;

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