import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supplier } from '../suppliers/supplier.entity';
import { SaFamily } from './sa-family.entity';
import { User } from '../users/user.entity';

@Entity('sa_declarations')
export class SaDeclaration {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  // Numéro SA final, ex: "SA250001"
  @Column({ type: 'nvarchar', length: 20, unique: true })
  sa_number: string;

  @Column({ type: 'nvarchar', length: 10, nullable: true })
  regime_code: string | null;

  @Column({ type: 'date' })
  declaration_date: string;

  @Column({ type: 'date' })
  due_date: string;

  @Column({ type: 'nvarchar', length: 30, default: 'OPEN' })
  status: string;

  /**
   * Quantité facturée en TONNES.
   * On réutilise la colonne quantity_initial.
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 3,
    name: 'quantity_initial',
  })
  quantity_initial: string;

  @Column({ type: 'nvarchar', length: 10, default: 'TONNE' })
  quantity_unit: string;

  /**
   * Droit de déchet (TONNES) = quantité_facturée * (pourcentage famille / 100)
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 3,
    nullable: true,
  })
  scrap_quantity_ton: string | null;

  /**
   * Montant facture dans la devise d'origine.
   * On réutilise la colonne value_amount.
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 3,
    name: 'value_amount',
    nullable: true,
  })
  invoice_amount: string | null;

  @Column({ type: 'nvarchar', length: 3, nullable: true })
  currency_code: string | null;

  /**
   * Taux de change vers la devise société.
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 6,
    nullable: true,
  })
  fx_rate: string | null;

  /**
   * Montant en devise société DS = invoice_amount * fx_rate
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 3,
    nullable: true,
  })
  amount_ds: string | null;

  /**
   * Relation vers le fournisseur.
   */
  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier | null;

  /**
   * On garde supplier_name pour affichage/historique.
   */
  @Column({ type: 'nvarchar', length: 200, nullable: true })
  supplier_name: string | null;

  /**
   * Relation vers la famille.
   */
  @ManyToOne(() => SaFamily, { nullable: true })
  @JoinColumn({ name: 'family_id' })
  family: SaFamily | null;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  description: string | null;

  /**
   * Quantité déjà apurée (somme des apurements SA/EA).
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 3,
    default: 0,
  })
  quantity_apured: string;

  /* --- Audit --- */

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User | null;

  @Column({ type: 'bigint', nullable: true })
  created_by: string | null;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  created_at: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;

  @Column({ type: 'bigint', nullable: true })
  updated_by: string | null;

  @Column({
    type: 'datetime2',
    default: () => 'SYSUTCDATETIME()',
  })
  updated_at: Date;
}
