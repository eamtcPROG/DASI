import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { UserDto } from '../dto/user.dto';
import { User } from '../models/user.model';
import { AuthDto } from '../dto/auth.dto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { genSalt, hash, compare } from 'bcrypt';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PasswordResetCode } from '../models/password-reset-code.model';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn<Promise<boolean>, [string, string]>(),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let analyticsClient: jest.Mocked<Pick<ClientProxy, 'emit'>>;

  const fakeToken = 'fake-jwt';
  const testUser: User = {
    id: 1,
    email: 'a@b.com',
    password: 'hashed',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeEach(async () => {
    const mockUserService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue(fakeToken),
      decode: jest.fn(),
    };
    const mockAnalyticsClient = {
      emit: jest.fn().mockReturnValue(of(true)),
    };
    const mockNotificationClient = {
      emit: jest.fn().mockReturnValue(of(true)),
    };
    const mockResetCodeRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: 'ANALYTICS_SERVICE', useValue: mockAnalyticsClient },
        { provide: 'NOTIFICATION_SERVICE', useValue: mockNotificationClient },
        {
          provide: getRepositoryToken(PasswordResetCode),
          useValue: mockResetCodeRepo,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    analyticsClient = module.get('ANALYTICS_SERVICE');

    (compare as jest.Mock<Promise<boolean>>).mockResolvedValue(true);
  });

  describe('hashPassword', () => {
    it('returns the value from mocked hash', async () => {
      const result = await authService.hashPassword('password');
      expect(result).toBe('hashed');
    });

    it('calls genSalt and hash with the given password', async () => {
      await authService.hashPassword('myPassword');
      expect(genSalt).toHaveBeenCalled();
      expect(hash).toHaveBeenCalledWith('myPassword', 'salt');
    });
  });

  describe('isCorrectPassword', () => {
    it('returns true when compare resolves to true', async () => {
      (compare as jest.Mock<Promise<boolean>>).mockResolvedValue(true);
      const result = await authService.isCorrectPassword('pass', 'hashed');
      expect(result).toBe(true);
      expect(compare).toHaveBeenCalledWith('pass', 'hashed');
    });

    it('returns false when compare resolves to false', async () => {
      (compare as jest.Mock<Promise<boolean>>).mockResolvedValue(false);
      const result = await authService.isCorrectPassword('wrong', 'hashed');
      expect(result).toBe(false);
    });
  });

  describe('signToken', () => {
    it('calls signAsync with payload { sub, email } and returns AuthDto', async () => {
      const userDto = UserDto.fromEntity(testUser);
      const result = await authService.signToken(userDto);

      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: userDto.id,
        email: userDto.email,
      });
      expect(result.access_token).toBe(fakeToken);
      expect(result.user).toEqual(userDto);
      expect(result).toBeInstanceOf(AuthDto);
    });
  });

  describe('signUp', () => {
    const createDto: CreateUserDto = {
      email: 'new@b.com',
      password: 'plain',
      firstName: 'Jane',
      lastName: 'Doe',
    } as CreateUserDto;

    it('throws BadRequestException when email already in use', async () => {
      userService.findByEmail.mockResolvedValue([testUser]);

      await expect(authService.signUp(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(authService.signUp(createDto)).rejects.toThrow(
        'Email already in use',
      );
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('creates user with hashed password and returns AuthDto on success', async () => {
      userService.findByEmail.mockResolvedValue([]);
      const createdUser = { ...testUser, id: 2, email: createDto.email };
      userService.create.mockResolvedValue(createdUser);

      const result = await authService.signUp(createDto);

      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(userService.findByEmail).toHaveBeenCalledWith(createDto.email);
      /* eslint-disable-next-line @typescript-eslint/unbound-method */
      expect(userService.create).toHaveBeenCalledWith({
        ...createDto,
        password: 'hashed',
      });
      expect(result.access_token).toBe(fakeToken);
      expect(result.user).toEqual(UserDto.fromEntity(createdUser));
      expect(analyticsClient.emit).toHaveBeenCalledWith(
        'analytics.event',
        expect.objectContaining({
          event: 'user.created',
        }),
      );

      const emitPayload = analyticsClient.emit.mock.calls[0]?.[1] as {
        event: string;
        data: {
          userId: number;
          email: string;
          createdAt: string;
        };
      };
      expect(emitPayload.event).toBe('user.created');
      expect(emitPayload.data.userId).toBe(createdUser.id);
      expect(emitPayload.data.email).toBe(createdUser.email);
      expect(typeof emitPayload.data.createdAt).toBe('string');
    });
  });

  describe('validate', () => {
    it('throws UnauthorizedException when no user found', async () => {
      userService.findByEmail.mockResolvedValue([]);

      await expect(authService.validate('a@b.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.validate('a@b.com', 'password')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('throws UnauthorizedException when password does not match', async () => {
      userService.findByEmail.mockResolvedValue([testUser]);
      (compare as jest.Mock<Promise<boolean>>).mockResolvedValue(false);

      await expect(authService.validate('a@b.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.validate('a@b.com', 'wrong')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('returns UserDto when credentials are valid', async () => {
      userService.findByEmail.mockResolvedValue([testUser]);
      (compare as jest.Mock<Promise<boolean>>).mockResolvedValue(true);

      const result = await authService.validate('a@b.com', 'password');

      expect(result).toEqual(UserDto.fromEntity(testUser));
    });
  });

  describe('signIn', () => {
    it('returns AuthDto when validate succeeds', async () => {
      userService.findByEmail.mockResolvedValue([testUser]);
      (compare as jest.Mock<Promise<boolean>>).mockResolvedValue(true);

      const signInDto: SignInDto = {
        email: 'a@b.com',
        password: 'password',
      } as SignInDto;
      const result = await authService.signIn(signInDto);

      expect(result.access_token).toBe(fakeToken);
      expect(result.user).toEqual(UserDto.fromEntity(testUser));
    });
  });

  describe('getUserFromToken', () => {
    it('returns null for empty token', async () => {
      expect(await authService.getUserFromToken('')).toBeNull();
      expect(
        await authService.getUserFromToken(null as unknown as string),
      ).toBeNull();
    });

    it('returns null when decode returns null', async () => {
      jwtService.decode.mockReturnValue(null);
      expect(await authService.getUserFromToken('any-token')).toBeNull();
    });

    it('returns null when payload has no email', async () => {
      jwtService.decode.mockReturnValue({ sub: 1 } as never);
      expect(await authService.getUserFromToken('any-token')).toBeNull();
    });

    it('returns null when findByEmail returns empty', async () => {
      jwtService.decode.mockReturnValue({ sub: 1, email: 'a@b.com' } as never);
      userService.findByEmail.mockResolvedValue([]);
      expect(await authService.getUserFromToken('any-token')).toBeNull();
    });

    it('returns user when decode has email and user exists', async () => {
      jwtService.decode.mockReturnValue({ sub: 1, email: 'a@b.com' } as never);
      userService.findByEmail.mockResolvedValue([testUser]);
      const result = await authService.getUserFromToken('valid-token');
      expect(result).toEqual(testUser);
    });
  });

  describe('refreshToken', () => {
    it('throws UnauthorizedException when user is undefined', async () => {
      await expect(authService.refreshToken(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(authService.refreshToken(undefined)).rejects.toThrow(
        'Invalid or missing token',
      );
    });

    it('returns AuthDto when user is valid', async () => {
      const result = await authService.refreshToken(testUser);

      expect(result.access_token).toBe(fakeToken);
      expect(result.user).toEqual(UserDto.fromEntity(testUser));
    });
  });
});
