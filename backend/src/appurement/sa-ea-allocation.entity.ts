import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
  import { SaDeclaration } from '../sa/sa-declaration.entity';
  import { EaDeclaration } from '../ea/ea-declaration.entity';
  import { User } from '../users/user.entity';
  
  @Entity({ name: 'sa_ea_allocations' })
  export class SaEaAllocation {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;
  
    @ManyToOne(() => SaDeclaration, { nullable: false })
    @JoinColumn({ name: 'sa_id' })
    sa: SaDeclaration;
  
    @Column({ type: 'bigint' })
    sa_id: string;
  
    @ManyToOne(() => EaDeclaration, { nullable: false })
    @JoinColumn({ name: 'ea_id' })
    ea: EaDeclaration;
  
    @Column({ type: 'bigint' })
    ea_id: string;
  
    @Column({ type: 'decimal', precision: 18, scale: 3 })
    quantity: string;
  
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'created_by' })
    createdBy: User;
  
    @Column({ type: 'bigint' })
    created_by: string;
  
    @CreateDateColumn({ type: 'datetime2' })
    created_at: Date;
  }
  