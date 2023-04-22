import { Product } from 'src/products/entities';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'users', schema: 'dbeteslo' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 100, unique: true })
  email: string;

  @Column('varchar', { length: 100, select: false })
  password: string;

  @Column({ type: 'varchar', length: 60 })
  fullName: string;

  @Column('bool', { default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 60, array: true, default: ['user'] })
  roles: string[];

  @OneToMany(() => Product, (product) => product.user)
  product: Product[];

  @BeforeInsert()
  checkFieldEmailInsert() {
    if (!this.email) {
      throw new Error('Email is required');
    }
    this.email = this.email.toLowerCase().trim();
  }

  @BeforeUpdate()
  checkFieldEmailUpdate() {
    this.checkFieldEmailInsert();
  }
}
