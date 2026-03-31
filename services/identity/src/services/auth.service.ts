import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserService } from './user.service';
import { compare, genSalt, hash } from 'bcrypt';
import { SignInDto } from '../dto/sign-in.dto';
import { UserDto } from '../dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthDto, AuthTokenPayload } from '../dto/auth.dto';
import { User } from '../models/user.model';
import { PasswordResetCode } from '../models/password-reset-code.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly service: UserService,
    private jwtService: JwtService,
    @Inject('ANALYTICS_SERVICE') private readonly analyticsClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
    @InjectRepository(PasswordResetCode)
    private readonly resetCodeRepo: Repository<PasswordResetCode>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt: string = await genSalt();
    return await hash(password, salt);
  }

  async isCorrectPassword(password: string, hash: string): Promise<boolean> {
    return await compare(password, hash);
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

    this.analyticsClient
      .emit('analytics.event', {
        event: 'user.created',
        data: {
          userId: user.id,
          email: user.email,
          createdAt: new Date().toISOString(),
        },
      })
      .subscribe();

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

  async requestPasswordReset(email: string): Promise<void> {
    const users = await this.service.findByEmail(email);
    if (users.length === 0) {
      throw new BadRequestException('No account found with this email address');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.resetCodeRepo.delete({ email });

    await this.resetCodeRepo.save(
      this.resetCodeRepo.create({ email, code, expiresAt, usedAt: null }),
    );

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Reset your password</h2>
        <p>Use the code below to reset your DASI password. It expires in 15 minutes.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:24px;background:#f4f4f5;border-radius:12px;text-align:center">
          ${code}
        </div>
        <p style="color:#6b7280;font-size:14px;margin-top:16px">
          If you did not request a password reset, you can safely ignore this email.
        </p>
      </div>
    `;

    this.notificationClient
      .send('send_email', {
        to: email,
        subject: 'Your DASI password reset code',
        html,
        text: `Your DASI password reset code is: ${code}\n\nIt expires in 15 minutes.`,
      })
      .subscribe({
        error: (err) => console.error('Failed to send reset email', err),
      });
  }

  async confirmPasswordReset(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    const record = await this.resetCodeRepo.findOne({
      where: { email },
      order: { createdAt: 'DESC' },
    });

    if (!record || record.usedAt !== null) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Reset code has expired');
    }

    if (record.code !== code) {
      throw new BadRequestException('Invalid reset code');
    }

    record.usedAt = new Date();
    await this.resetCodeRepo.save(record);

    const users = await this.service.findByEmail(email);
    if (users.length === 0) {
      throw new BadRequestException('User not found');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.service.updatePassword(users[0].id, hashedPassword);
  }
}
