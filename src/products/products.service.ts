import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { Repository } from 'typeorm';

import { CreateProductDto, UpdateProductDto } from './dto';
import { PaginationDto } from 'src/common/dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private defaultLimit: number;
  private defaultOffset: number;

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly configService: ConfigService,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit');
    this.defaultOffset = this.configService.get<number>('defaultOffset');
  }

  async create(createProductDto: CreateProductDto) {
    try {
      const producto = this.productsRepository.create(createProductDto);
      await this.productsRepository.save(producto);
      return producto;
    } catch (error) {
      this.handleDBException(error);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = this.defaultLimit, offset = this.defaultOffset } =
      paginationDto;

    // return this.productsRepository
    //   .createQueryBuilder('products')
    //   .take(limit)
    //   .offset(offset)
    //   .getMany();
    return this.productsRepository.find({
      take: limit,
      skip: offset,
    });
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {
      product = await this.productsRepository.findOneBy({ id: term });
    } else {
      const queryBuilder =
        this.productsRepository.createQueryBuilder('products');
      product = await queryBuilder
        .where('UPPER(title) =:title or LOWER(slug) =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .getOne();
    }
    // if (!product && isString(term)) {
    //   product = await this.productsRepository.findOneBy({ slug: term });
    // }
    if (!product) {
      throw new NotFoundException(`Product ${term} not found!`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productsRepository.preload({
      id: id,
      ...updateProductDto,
    });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found!`);
    }

    try {
      await this.productsRepository.save(product);
    } catch (error) {
      this.handleDBException(error);
    }

    return product;
  }

  async remove(term: string) {
    const product = await this.findOne(term);
    await this.productsRepository.remove(product);
  }

  private handleDBException(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check server logs',
    );
  }
}
