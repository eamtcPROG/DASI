import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtGuard } from "../auth/jwt.guard";
import { Public } from "../auth/public.decorator";
import { AuthDto } from "../dto/auth.dto";
import { CreateUserDto } from "../dto/create-user.dto";
import { ResultListDto } from "../dto/resultlist.dto";
import { ResultObjectDto } from "../dto/resultobject.dto";
import { SignInDto } from "../dto/sign-in.dto";
import { AuthenticatedUser, UserDto } from "../dto/user.dto";
import { AuthProxyService } from "../services/auth-proxy.service";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authProxyService: AuthProxyService) {}

  @Public()
  @ApiOperation({ summary: "Register a new user" })
  @ApiConsumes("application/json")
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({
    type: ResultObjectDto<AuthDto>,
    description: "User created",
  })
  @ApiBadRequestResponse({
    type: ResultObjectDto<null>,
    description: "Invalid sign-up payload",
  })
  @Post("sign-up")
  async signUp(@Body() body: CreateUserDto) {
    if (!body.email || !body.password) {
      throw new BadRequestException("Email and password are required");
    }

    const result = await this.authProxyService.signUp(body);
    return result;
  }

  @Public()
  @ApiOperation({ summary: "Sign in a user" })
  @ApiConsumes("application/json")
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({
    type: ResultObjectDto<AuthDto>,
    description: "User signed in",
  })
  @ApiBadRequestResponse({
    type: ResultObjectDto<null>,
    description: "Invalid credentials",
  })
  @Post("sign-in")
  @HttpCode(HttpStatus.OK)
  signIn(@Body() body: SignInDto) {
    if (!body.email || !body.password) {
      throw new BadRequestException("Email and password are required");
    }

    return this.authProxyService.signIn(body);
  }

  @ApiOperation({ summary: "Refresh access token" })
  @ApiOkResponse({
    type: ResultObjectDto<AuthDto>,
    description: "New access token and user",
  })
  @ApiUnauthorizedResponse({
    type: ResultObjectDto<null>,
    description: "Invalid or missing token",
  })
  @ApiBearerAuth("jwt")
  @UseGuards(JwtGuard)
  @Get("refresh")
  refresh(@CurrentUser() user: AuthenticatedUser | undefined) {
    return this.authProxyService.refreshToken(user?.token ?? "");
  }

  @ApiOperation({ summary: "Get a list of users" })
  @ApiOkResponse({
    type: ResultListDto<UserDto>,
    description: "List of users",
  })
  @ApiUnauthorizedResponse({
    type: ResultObjectDto<null>,
    description: "Invalid or missing token",
  })
  @ApiBearerAuth("jwt")
  @UseGuards(JwtGuard)
  @Get("users")
  getUsers(@Query("page") page?: string, @Query("onPage") onPage?: string) {
    const parsedPage = page ? Number(page) : 1;
    const parsedOnPage = onPage ? Number(onPage) : 10;

    if (
      !Number.isInteger(parsedPage) ||
      !Number.isInteger(parsedOnPage) ||
      parsedPage < 1 ||
      parsedOnPage < 1
    ) {
      throw new BadRequestException(
        "page and onPage must be positive integers",
      );
    }

    return this.authProxyService.getUsers(parsedPage, parsedOnPage);
  }
}
