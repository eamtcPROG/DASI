import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { UserService } from '../services/user.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ResultObjectDto } from '../dto/resultobject.dto';
import { UserDto } from '../dto/user.dto';
import { ResultListDto } from '../dto/resultlist.dto';
import { JwtGuard } from '../guards/jwt.guard';
import { AuthDto } from '../dto/auth.dto';
import { CurrentUser } from '../decorators/current-user.decorator';
import { User } from '../models/user.model';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiConsumes('application/json')
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({
    type: ResultObjectDto<UserDto>,
    description: 'User created',
  })
  @ApiNotFoundResponse({
    type: ResultObjectDto<null>,
    description: 'User not found',
  })
  @Post('/sign-up')
  signUp(@Body() body: CreateUserDto) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    return this.authService.signUp(body);
  }

  @ApiOperation({ summary: 'Sign in a user' })
  @ApiConsumes('application/json')
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({
    type: ResultObjectDto<UserDto>,
    description: 'User signed in',
  })
  @ApiBadRequestResponse({
    type: ResultObjectDto<null>,
    description: 'Invalid credentials',
  })
  @Post('/sign-in')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() body: SignInDto) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    return this.authService.signIn(body);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({
    type: ResultObjectDto<AuthDto>,
    description: 'New access token and user',
  })
  @ApiUnauthorizedResponse({
    type: ResultObjectDto<null>,
    description: 'Invalid or missing token',
  })
  @ApiBearerAuth('jwt')
  @UseGuards(JwtGuard)
  @Get('/refresh')
  refresh(@CurrentUser() user: User | undefined): Promise<AuthDto> {
    return this.authService.refreshToken(user);
  }

  @ApiOperation({ summary: 'Get a list of users' })
  @ApiConsumes('application/json')
  @ApiOkResponse({
    type: ResultListDto<UserDto>,
    description: 'List of users',
  })
  @ApiBearerAuth('jwt')
  @UseGuards(JwtGuard)
  @Get('/')
  getList() {
    return this.userService.getList(1, 10);
  }
}
