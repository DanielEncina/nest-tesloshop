import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { isUUID } from 'class-validator';

import { CreateProductDto, UpdateProductDto } from './dto';
import { PaginationDto } from 'src/common/dto';
import { Product, ProductImage } from './entities';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private defaultLimit: number;
  private defaultOffset: number;

  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productsImagesRepository: Repository<ProductImage>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.defaultLimit = this.configService.get<number>('defaultLimit');
    this.defaultOffset = this.configService.get<number>('defaultOffset');
  }

  async create(createProductDto: CreateProductDto, user: User) {
    try {
      const { images = [], ...productDetails } = createProductDto;
      const producto = this.productsRepository.create({
        ...productDetails,
        user,
        images: images.map((image) =>
          this.productsImagesRepository.create({ url: image }),
        ),
      });
      await this.productsRepository.save(producto);
      return { ...producto, images };
    } catch (error) {
      this.handleDBException(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = this.defaultLimit, offset = this.defaultOffset } =
      paginationDto;

    // return this.productsRepository
    //   .createQueryBuilder('products')
    //   .take(limit)
    //   .offset(offset)
    //   .getMany();
    const products = await this.productsRepository.find({
      take: limit,
      skip: offset,
      relations: ['images'],
    });

    return products.map(({ images, ...rest }) => ({
      ...rest,
      images: images.map((image) => image.url),
    }));
  }

  async findOne(term: string) {
    let product: Product;

    if (isUUID(term)) {
      // product = await this.productsRepository.findOne({
      //   where: { id: term },
      //   relations: { images: true },
      // });
      product = await this.productsRepository.findOneBy({ id: term });
    } else {
      const queryBuilder =
        this.productsRepository.createQueryBuilder('products');
      product = await queryBuilder
        .where('UPPER(title) =:title or LOWER(slug) =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('products.images', 'images')
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

  async findOnePlain(term: string) {
    const { images = [], ...rest } = await this.findOne(term);
    return {
      ...rest,
      images: images.map((image) => image.url),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    const { images = [], ...toUpdate } = updateProductDto;

    const product = await this.productsRepository.preload({
      id,
      ...toUpdate,
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found!`);
    }
    // create queryRunner
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // start transaction
    await queryRunner.startTransaction();

    try {
      if (images) {
        await queryRunner.manager.delete(ProductImage, { product: { id } });
        product.images = images.map((image) =>
          this.productsImagesRepository.create({ url: image }),
        );
      }

      // await this.productsRepository.save(product);
      product.user = user;

      await queryRunner.manager.save(product);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      // return product;
      return this.findOnePlain(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.handleDBException(error);
    }
  }

  async remove(term: string) {
    const product = await this.findOne(term);
    await this.productsRepository.remove(product);
  }

  async deleteAllProducts() {
    // await this.productsRepository.delete({});
    const queryBuilder = this.productsRepository.createQueryBuilder();
    try {
      return await queryBuilder.delete().where({}).execute();
    } catch (error) {
      this.handleDBException(error);
    }
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
