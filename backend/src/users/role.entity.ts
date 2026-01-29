import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import {User} from './user.entity';
@Entity({ name : 'roles'})
export class Role {
    @PrimaryGeneratedColumn({ type: 'bigint'})
    id: string;

    @Column({ type: 'nvarchar', length: 50, unique: true })
    code: string;

    @Column({type : 'nvarchar' , length : 50})
    label: string;

    @CreateDateColumn({ type: 'datetime2' })
    created_at: Date;

    @ManyToMany (() => User, (user) => user.roles)
    users: User[];

}