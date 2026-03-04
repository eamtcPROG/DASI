import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserService } from './user.service';
import { hash, genSalt, compare } from 'bcrypt';
import { SignInDto } from '../dto/sign-in.dto';
import { UserDto } from '../dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthDto, AuthTokenPayload } from '../dto/auth.dto';
import { User } from '../models/user.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly service: UserService,
    private jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt: string = await genSalt();
    const hashed: string = await hash(password, salt);
    return hashed;
  }

  async isCorrectPassword(password: string, hash: string): Promise<boolean> {
    const isCorrect = await compare(password, hash);
    return isCorrect;
  }
  async signUp(object: CreateUserDto) {
    const existingUser = await this.service.findByEmail(object.email);
    if (existingUser.length > 0) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await this.hashPassword(object.password);
    const user = await this.service.create({
      ...object,
      password: hashedPassword,
    });

    const result = UserDto.fromEntity(user);
    return await this.signToken(result);
  }

  async signIn(object: SignInDto) {
    const user = await this.validate(object.email, object.password);
    return await this.signToken(user);
  }

  async validate(email: string, password: string) {
    const user = await this.service.findByEmail(email);
    if (user.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match: boolean = await this.isCorrectPassword(
      password,
      user[0].password,
    );
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return UserDto.fromEntity(user[0]);
  }

  async signToken(user: UserDto): Promise<AuthDto> {
    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return new AuthDto(access_token, user);
  }

  async getUserFromToken(token: string): Promise<User | null> {
    if (!token) return null;
    const payload = this.jwtService.decode<AuthTokenPayload>(token);
    if (!payload) return null;
    if (payload.email) {
      const user = await this.service.findByEmail(payload.email);
      if (!user[0]) return null;
      return user[0];
    }
    return null;
  }

  async refreshToken(user: User | undefined): Promise<AuthDto> {
    if (!user) {
      throw new UnauthorizedException('Invalid or missing token');
    }
    return this.signToken(UserDto.fromEntity(user));
  }
}
