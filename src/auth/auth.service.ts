import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { LoginUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user = this.usersRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });

      await this.usersRepository.save(user);
      delete user.password;

      return {
        ...user,
        token: this.getJwtToket({ id: user.id }),
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    const user = await this.usersRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true },
    });
    if (!user) this.handleErrorAuthenticating('email');

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) this.handleErrorAuthenticating('password');

    return {
      ...user,
      token: this.getJwtToket({ id: user.id }),
    };
  }

  checkAuthStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToket({ id: user.id }),
    };
  }

  private getJwtToket(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    console.log(error);
    throw new InternalServerErrorException('Internal Error please check logs');
  }

  private handleErrorAuthenticating(term: string): never {
    throw new UnauthorizedException(`Invalid credentials (${term})`);
  }
}
