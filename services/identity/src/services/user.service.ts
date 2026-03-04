import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.model';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListDto } from '../dto/list.dto';
import { UserDto } from '../dto/user.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(object: CreateUserDto) {
    object.email = object.email.toLowerCase();
    const user = this.repo.create(object);
    return this.repo.save(user);
  }

  findByEmail(email: string) {
    return this.repo.find({ where: { email: email.toLowerCase() } });
  }

  async getList(page: number, onPage: number): Promise<ListDto<UserDto>> {
    const [users, total] = await this.repo.findAndCount({
      skip: ListDto.skip(page, onPage),
      take: onPage,
    });
    const objects = users.map((user) => UserDto.fromEntity(user));
    return new ListDto<UserDto>(objects, total, onPage);
  }
}
