import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from '../models/user.model';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserDto } from '../dto/user.dto';
import { ListDto } from '../dto/list.dto';

describe('UserService', () => {
  let userService: UserService;
  let repo: jest.Mocked<
    Pick<Repository<User>, 'create' | 'save' | 'find' | 'findAndCount'>
  >;

  const testUser: User = {
    id: 1,
    email: 'a@b.com',
    password: 'p',
    firstName: 'John',
    lastName: 'Doe',
  };

  const testUser2: User = {
    id: 2,
    email: 'b@c.com',
    password: 'p2',
    firstName: 'Jane',
    lastName: 'Doe',
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockRepo },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    repo = module.get(getRepositoryToken(User));
  });

  describe('create', () => {
    it('lowercases email, calls create and save, returns saved entity', async () => {
      const dto: CreateUserDto = {
        email: 'A@B.COM',
        password: 'p',
        firstName: 'J',
        lastName: 'D',
      } as CreateUserDto;
      const created = { ...testUser, ...dto, email: 'a@b.com' };
      repo.create.mockReturnValue(created as User);
      repo.save.mockResolvedValue(created as User);

      const result = await userService.create(dto);

      expect(dto.email).toBe('a@b.com');
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toEqual(created);
    });
  });

  describe('findByEmail', () => {
    it('lowercases email and returns find result', async () => {
      repo.find.mockResolvedValue([testUser]);

      const result = await userService.findByEmail('X@Y.COM');

      expect(repo.find).toHaveBeenCalledWith({
        where: { email: 'x@y.com' },
      });
      expect(result).toEqual([testUser]);
    });

    it('returns empty array when no user found', async () => {
      repo.find.mockResolvedValue([]);

      const result = await userService.findByEmail('nobody@example.com');

      expect(repo.find).toHaveBeenCalledWith({
        where: { email: 'nobody@example.com' },
      });
      expect(result).toEqual([]);
    });
  });

  describe('getList', () => {
    it('calls findAndCount with skip/take and returns ListDto with UserDtos', async () => {
      const users = [testUser, testUser2];
      const total = 2;
      repo.findAndCount.mockResolvedValue([users, total]);

      const result = await userService.getList(2, 10);

      expect(repo.findAndCount).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
      });
      expect(result).toBeInstanceOf(ListDto);
      expect(result.objects).toEqual([
        UserDto.fromEntity(testUser),
        UserDto.fromEntity(testUser2),
      ]);
      expect(result.total).toBe(2);
      expect(result.totalpages).toBe(1);
    });

    it('returns empty ListDto when no users and total 0', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      const result = await userService.getList(1, 5);

      expect(repo.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 5,
      });
      expect(result.objects).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalpages).toBe(0);
    });
  });
});
