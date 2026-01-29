import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { User } from '../users/user.entity';
  
  @Entity({ name: 'ea_declarations' })
  export class EaDeclaration {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;
  
    @Column({ type: 'nvarchar', length: 50, unique: true })
    ea_number: string;
  
    @Column({ type: 'nvarchar', length: 10, default: '362' })
    regime_code: string;
  
    @Column({ type: 'date' })
    export_date: string;
  
    @Column({ type: 'nvarchar', length: 30, default: 'SUBMITTED' })
    status: string; // SUBMITTED, CANCELLED
  
    @Column({ type: 'nvarchar', length: 255 })
    customer_name: string;
  
    @Column({ type: 'nvarchar', length: 100, nullable: true })
    destination_country: string | null;
  
    @Column({ type: 'nvarchar', length: 100, nullable: true })
    product_ref: string | null;
  
    @Column({ type: 'nvarchar', nullable: true })
    product_desc: string | null;
  
    @Column({ type: 'decimal', precision: 18, scale: 3 })
    total_quantity: string;
  
    @Column({ type: 'nvarchar', length: 20 })
    quantity_unit: string;
  
    // created_by
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;
  
    @Column({ type: 'bigint' })
    created_by: string;
  
    @CreateDateColumn({ type: 'datetime2' })
    created_at: Date;
  
    // updated_by
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'updated_by' })
    updatedBy: User | null;
  
    @Column({ type: 'bigint', nullable: true })
    updated_by: string | null;
  
    @UpdateDateColumn({ type: 'datetime2' })
    updated_at: Date;
  }
  