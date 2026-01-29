import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    JoinTable,
  } from 'typeorm';
  import { Role } from './role.entity';
  
  @Entity({ name: 'users' })
  export class User {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;
  
    @Column({ type: 'nvarchar', length: 150 })
    full_name: string;
  
    @Column({ type: 'nvarchar', length: 200, unique: true })
    email: string;
  
    @Column({ type: 'nvarchar', length: 255 })
    password_hash: string;
  
    @Column({ type: 'bit', default: true })
    is_active: boolean;
  
    @CreateDateColumn({ type: 'datetime2' })
    created_at: Date;
  
    @UpdateDateColumn({ type: 'datetime2' })
    updated_at: Date;
  
    @ManyToMany(() => Role, (role) => role.users, { eager: true })
    @JoinTable({
      name: 'user_roles',
      joinColumn: {
        name: 'user_id',
        referencedColumnName: 'id',
      },
      inverseJoinColumn: {
        name: 'role_id',
        referencedColumnName: 'id',
      },
    })
    roles: Role[];
  }
  