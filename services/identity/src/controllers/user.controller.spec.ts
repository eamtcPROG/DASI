import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserController } from './user.controller';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { User } from '../models/user.model';
import { AuthDto } from '../dto/auth.dto';
import { UserDto } from '../dto/user.dto';
import { ListDto } from '../dto/list.dto';

describe('UserController', () => {
  let controller: UserController;
  let authService: jest.Mocked<AuthService>;
  let userService: jest.Mocked<UserService>;

  const mockUser: User = {
    id: 1,
    email: 'a@b.com',
    password: 'p',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockAuthDto: AuthDto = {
    access_token: 'token',
    user: UserDto.fromEntity(mockUser),
  };

  const mockListDto = new ListDto<UserDto>(
    [UserDto.fromEntity(mockUser)],
    1,
    10,
  );

  beforeEach(async () => {
    const mockAuthService = {
      signUp: jest.fn(),
      signIn: jest.fn(),
      refreshToken: jest.fn(),
    };
    const mockUserService = {
      getList: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    authService = module.get(AuthService);
    userService = module.get(UserService);
  });

  describe('signUp', () => {
    it('throws BadRequestException when email is missing', () => {
      const body = { password: 'p' } as CreateUserDto;

      expect(() => controller.signUp(body)).toThrow(BadRequestException);
      expect(() => controller.signUp(body)).toThrow(
        'Email and password are required',
      );
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(authService.signUp).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when password is missing', () => {
      const body = { email: 'a@b.com' } as CreateUserDto;

      expect(() => controller.signUp(body)).toThrow(BadRequestException);
      expect(() => controller.signUp(body)).toThrow(
        'Email and password are required',
      );
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(authService.signUp).not.toHaveBeenCalled();
    });

    it('delegates to authService.signUp and returns result when body is valid', async () => {
      const body = {
        email: 'a@b.com',
        password: 'p',
        firstName: 'John',
        lastName: 'Doe',
      } as CreateUserDto;
      authService.signUp.mockResolvedValue(mockAuthDto);

      const result = await controller.signUp(body);

      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(authService.signUp).toHaveBeenCalledWith(body);
      expect(result).toEqual(mockAuthDto);
    });
  });

  describe('signIn', () => {
    it('throws BadRequestException when email is missing', () => {
      const body = { password: 'p' } as SignInDto;

      expect(() => controller.signIn(body)).toThrow(BadRequestException);
      expect(() => controller.signIn(body)).toThrow(
        'Email and password are required',
      );
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(authService.signIn).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when password is missing', () => {
      const body = { email: 'a@b.com' } as SignInDto;

      expect(() => controller.signIn(body)).toThrow(BadRequestException);
      expect(() => controller.signIn(body)).toThrow(
        'Email and password are required',
      );
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(authService.signIn).not.toHaveBeenCalled();
    });

    it('delegates to authService.signIn and returns result when body is valid', async () => {
      const body = { email: 'a@b.com', password: 'p' } as SignInDto;
      authService.signIn.mockResolvedValue(mockAuthDto);

      const result = await controller.signIn(body);

      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(authService.signIn).toHaveBeenCalledWith(body);
      expect(result).toEqual(mockAuthDto);
    });
  });

  describe('refresh', () => {
    it('delegates to authService.refreshToken with the given user', async () => {
      authService.refreshToken.mockResolvedValue(mockAuthDto);

      const result = await controller.refresh(mockUser);

      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthDto);
    });

    it('throws UnauthorizedException when token is expired or invalid (user undefined)', async () => {
      authService.refreshToken.mockRejectedValue(
        new UnauthorizedException('Invalid or missing token'),
      );

      await expect(controller.refresh(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.refresh(undefined)).rejects.toThrow(
        'Invalid or missing token',
      );
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(authService.refreshToken).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getList', () => {
    it('delegates to userService.getList(1, 10) and returns result', async () => {
      userService.getList.mockResolvedValue(mockListDto);

      const result = await controller.getList();

      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(userService.getList).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockListDto);
    });
  });
});
