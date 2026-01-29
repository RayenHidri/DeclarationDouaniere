import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SaFamily } from '../../sa/sa-family.entity';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @ManyToOne(() => SaFamily, { nullable: false })
  @JoinColumn({ name: 'family_id' })
  family: SaFamily;

  @Column({ name: 'product_ref', type: 'nvarchar', length: 100 })
  product_ref: string;

  @Column({ type: 'nvarchar', length: 255 })
  label: string;

  @Column({ name: 'is_active', type: 'bit', default: true })
  is_active: boolean;
}
