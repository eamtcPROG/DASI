import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TimeoutError, firstValueFrom, timeout } from 'rxjs';
import { AuthDto, ValidateTokenResponse } from '../dto/auth.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { ResultListDto } from '../dto/resultlist.dto';
import { ResultObjectDto } from '../dto/resultobject.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { UserDto } from '../dto/user.dto';

@Injectable()
export class AuthProxyService {
  constructor(
    @Inject('IDENTITY_SERVICE') private readonly identityClient: ClientProxy,
  ) {}

  signUp(body: CreateUserDto) {
    return this.request<ResultObjectDto<AuthDto>>('sign_up', body);
  }

  signIn(body: SignInDto) {
    return this.request<ResultObjectDto<AuthDto>>('sign_in', body);
  }

  refreshToken(token: string) {
    return this.request<ResultObjectDto<AuthDto>>('refresh_token', { token });
  }

  getUsers(page = 1, onPage = 10) {
    return this.request<ResultListDto<UserDto>>('list_users', { page, onPage });
  }

  validateToken(token: string) {
    return this.request<ValidateTokenResponse>('validate_token', { token });
  }

  private async request<T>(pattern: string, payload: unknown): Promise<T> {
    try {
      return await firstValueFrom(
        this.identityClient.send<T, unknown>(pattern, payload).pipe(timeout(5000)),
      );
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw new ServiceUnavailableException('Identity service timeout');
      }

      if (error instanceof Error) {
        throw new ServiceUnavailableException(error.message);
      }

      throw new ServiceUnavailableException('Identity service unavailable');
    }
  }
}
