import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthTokenPayload } from '../dto/auth.dto';
import { getJwtFromRequest } from '../tools/common.tools';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('Missing jwt.secret in configuration');
    }

    super({
      jwtFromRequest: getJwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: AuthTokenPayload): Promise<User> {
    const users = await this.userService.findByEmail(payload.email);
    if (!users.length) {
      throw new UnauthorizedException('Invalid or missing token');
    }
    return users[0];
  }
}
