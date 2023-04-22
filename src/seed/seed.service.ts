import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ProductsService } from 'src/products/products.service';
import { User } from 'src/auth/entities/user.entity';
import { initialData } from './data/seed';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly productsService: ProductsService,
  ) {}

  async runSeed() {
    await this.deleteTables();
    const seedUser = await this.insertNewUsers();
    await this.insertNewProducts(seedUser);

    return 'Seed Executed!';
  }

  private async deleteTables() {
    await this.productsService.deleteAllProducts();
    // await this.userRepository.delete({});
    const queryBuilder = this.userRepository.createQueryBuilder();
    await queryBuilder.delete().where({}).execute();
  }

  private async insertNewUsers() {
    const seedUsers = initialData.users;
    const users: User[] = [];
    seedUsers.forEach((user) => {
      users.push(this.userRepository.create(user));
    });
    const dbUsers = await this.userRepository.save(users);
    return dbUsers[0];
  }

  private async insertNewProducts(seedUser: User) {
    const seedProducts = initialData.products;
    const insertPromises = [];
    seedProducts.forEach((product) => {
      insertPromises.push(this.productsService.create(product, seedUser));
    });

    await Promise.all(insertPromises);
    return true;
  }
}
