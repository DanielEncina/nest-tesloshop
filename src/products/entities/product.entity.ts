import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
import { User } from 'src/auth/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'products', schema: 'dbeteslo' })
export class Product {
  @ApiProperty({
    example: '0446c7c4-f142-4d22-bf7d-307bbef94dbe',
    description: 'Product ID',
    uniqueItems: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Nike Air Max 270 React',
    description: 'Product title',
    uniqueItems: false,
  })
  @Column('varchar', { length: 60, unique: true })
  title: string;

  @ApiProperty({
    example: 100,
    description: 'Product price',
    uniqueItems: false,
  })
  @Column('float', { default: 0 })
  price: number;

  @ApiProperty({
    example: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    description: 'Product description',
    uniqueItems: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    example: 'nike_air_max_270_react',
    description: 'Product slug',
    uniqueItems: true,
  })
  @Column({ type: 'varchar', length: 60, unique: true })
  slug: string;

  @ApiProperty({
    example: 10,
    description: 'Product stock',
    uniqueItems: false,
  })
  @Column({ type: 'int', default: 0 })
  stock: number;

  @ApiProperty({
    example: ['S', 'M', 'L', 'XL'],
    description: 'Product sizes',
    uniqueItems: false,
  })
  @Column({ type: 'text', array: true })
  sizes: string[];

  @ApiProperty({
    example: 'women',
    description: 'gender',
    uniqueItems: false,
  })
  @Column({ type: 'varchar', length: 50 })
  gender: string;

  @ApiProperty({
    example: ['nike', 'air', 'max', '270', 'react'],
    description: 'Product tags',
    uniqueItems: false,
  })
  @Column({ type: 'varchar', length: 50, array: true, default: [] })
  tags: string[];

  @ApiProperty({
    example: 'https://www.google.com',
    description: 'Product link',
    uniqueItems: false,
  })
  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    eager: true,
  })
  images?: ProductImage[];

  @ManyToOne(() => User, (user) => user.product, { eager: true })
  user: User;

  @BeforeInsert()
  checkSlugInsert() {
    if (!this.slug) {
      this.slug = this.title;
    }

    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }

  @BeforeUpdate()
  checkSlugUpdate() {
    this.slug = this.slug
      .toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll("'", '');
  }
}
