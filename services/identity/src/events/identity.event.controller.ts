import {
  BadRequestException,
  Controller,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { AuthDto, AuthTokenPayload } from 'src/dto/auth.dto';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { ListDto } from 'src/dto/list.dto';
import { MessageDto, MessageType } from 'src/dto/message.dto';
import { ResultListDto } from 'src/dto/resultlist.dto';
import { ResultObjectDto } from 'src/dto/resultobject.dto';
import { SignInDto } from 'src/dto/sign-in.dto';
import { UserDto } from 'src/dto/user.dto';
import { AuthService } from 'src/services/auth.service';
import { UserService } from 'src/services/user.service';

type RefreshTokenRequest = {
  token: string;
};

type UserListRequest = {
  page?: number;
  onPage?: number;
};

type UsersByIdsRequest = {
  userIds: number[];
};

@Controller()
export class IdentityEventController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @MessagePattern('sign_up')
  async handleSignUp(
    @Payload() data: CreateUserDto,
    @Ctx() context: RmqContext,
  ): Promise<ResultObjectDto<AuthDto | null>> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const auth = await this.authService.signUp(data);
      return new ResultObjectDto(auth, false, HttpStatus.CREATED);
    } catch (error) {
      return this.toErrorResult(error);
    } finally {
      channel.ack(originalMsg);
    }
  }

  @MessagePattern('sign_in')
  async handleSignIn(
    @Payload() data: SignInDto,
    @Ctx() context: RmqContext,
  ): Promise<ResultObjectDto<AuthDto | null>> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const auth = await this.authService.signIn(data);
      return new ResultObjectDto(auth, false, HttpStatus.OK);
    } catch (error) {
      return this.toErrorResult(error);
    } finally {
      channel.ack(originalMsg);
    }
  }

  @MessagePattern('refresh_token')
  async handleRefreshToken(
    @Payload() data: RefreshTokenRequest,
    @Ctx() context: RmqContext,
  ): Promise<ResultObjectDto<AuthDto | null>> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      if (!data?.token) {
        throw new UnauthorizedException('Invalid or missing token');
      }

      const payload =
        await this.jwtService.verifyAsync<AuthTokenPayload>(data.token);
      const users = await this.userService.findByEmail(payload.email);
      if (!users[0]) {
        throw new UnauthorizedException('Invalid or missing token');
      }

      const auth = await this.authService.refreshToken(users[0]);
      return new ResultObjectDto(auth, false, HttpStatus.OK);
    } catch (error) {
      return this.toErrorResult(error);
    } finally {
      channel.ack(originalMsg);
    }
  }

  @MessagePattern('list_users')
  async handleListUsers(
    @Payload() data: UserListRequest,
    @Ctx() context: RmqContext,
  ): Promise<ResultListDto<UserDto>> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const page = data?.page && data.page > 0 ? data.page : 1;
      const onPage = data?.onPage && data.onPage > 0 ? data.onPage : 10;
      const users: ListDto<UserDto> = await this.userService.getList(page, onPage);
      return new ResultListDto(
        users.objects,
        users.total,
        users.totalpages,
        false,
        HttpStatus.OK,
      );
    } catch (error) {
      return new ResultListDto(
        [],
        0,
        0,
        true,
        this.extractStatus(error),
        [new MessageDto(this.extractMessage(error), MessageType.ERROR)],
      );
    } finally {
      channel.ack(originalMsg);
    }
  }

  @MessagePattern('get_users_by_ids')
  async handleGetUsersByIds(
    @Payload() data: UsersByIdsRequest,
    @Ctx() context: RmqContext,
  ): Promise<ResultObjectDto<UserDto[]>> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      if (!data?.userIds || !Array.isArray(data.userIds)) {
        throw new BadRequestException('User IDs array is required');
      }

      const users = await this.userService.findByIds(data.userIds);
      return new ResultObjectDto(users, false, HttpStatus.OK);
    } catch (error) {
      return new ResultObjectDto(
        [],
        true,
        this.extractStatus(error),
        [new MessageDto(this.extractMessage(error), MessageType.ERROR)],
      );
    } finally {
      channel.ack(originalMsg);
    }
  }

  private toErrorResult(
    error: unknown,
  ): ResultObjectDto<AuthDto | null> {
    return new ResultObjectDto<AuthDto | null>(
      null,
      true,
      this.extractStatus(error),
      [new MessageDto(this.extractMessage(error), MessageType.ERROR)],
    );
  }

  private extractStatus(error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private extractMessage(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();
      if (typeof response === 'string') {
        return response;
      }

      if (typeof response === 'object' && response !== null) {
        const payload = response as Record<string, unknown>;
        const extracted = payload['message'] ?? payload['error'] ?? error.message;
        if (Array.isArray(extracted)) {
          return extracted.map((message) => String(message)).join(', ');
        }

        if (typeof extracted === 'string') {
          return extracted;
        }
      }

      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Internal server error';
  }
}
