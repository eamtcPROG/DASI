import { Controller } from '@nestjs/common';
import { Ctx, RmqContext } from '@nestjs/microservices';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '../services/user.service';
import { AuthTokenPayload } from 'src/dto/auth.dto';
import { UserDto } from 'src/dto/user.dto';

type RmqChannel = { ack(message: unknown): void };

type ValidateTokenRequest = {
  token: string;
};

type ValidateTokenResponse = {
  isValid: boolean;
  user?: UserDto;
  error?: string;
};

@Controller()
export class AuthEventController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly service: UserService,
  ) {}

  @MessagePattern('validate_token')
  async handleValidateToken(
    @Payload() data: ValidateTokenRequest,
    @Ctx() context: RmqContext,
  ): Promise<ValidateTokenResponse> {
    const channel = context.getChannelRef() as RmqChannel;
    const originalMsg = context.getMessage() as unknown;
    let response: ValidateTokenResponse;
    const token = data?.token;

    if (!token) {
      response = { isValid: false, error: 'Missing token' };
      channel.ack(originalMsg);
      return response;
    }
    try {
      const payload =
        await this.jwtService.verifyAsync<AuthTokenPayload>(token);
      if (!payload?.email) {
        response = { isValid: false, error: 'Invalid payload' };
        channel.ack(originalMsg);
        return response;
      }
      const user = await this.service.findByEmail(payload.email);
      if (!user[0]) {
        response = { isValid: false, error: 'User not found' };
        channel.ack(originalMsg);
        return response;
      }
      response = {
        isValid: true,
        user: {
          id: user[0].id,
          email: user[0].email,
          firstName: user[0].firstName,
          lastName: user[0].lastName,
        },
      };
      channel.ack(originalMsg);
      return response;
    } catch {
      response = { isValid: false, error: 'Invalid token' };
      channel.ack(originalMsg);
      return response;
    }
  }
}
