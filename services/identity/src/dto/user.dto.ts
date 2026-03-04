import { ApiProperty } from '@nestjs/swagger';
import { User } from '../models/user.model';

export class UserDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the user',
    type: 'number',
  })
  id: number;

  @ApiProperty({
    example: 'examplde@example.com',
    description: 'User email - unique in system',
    type: 'string',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'User name',
    type: 'string',
  })
  firstName: string | null;

  @ApiProperty({
    example: 'Doe',
    description: 'User name',
    type: 'string',
  })
  lastName: string | null;

  constructor(
    id: number,
    email: string,
    firstName?: string | null,
    lastName?: string | null,
  ) {
    this.id = id;
    this.email = email;
    this.firstName = firstName ?? null;
    this.lastName = lastName ?? null;
  }

  static fromEntity(entity: User): UserDto {
    return new UserDto(
      entity.id,
      entity.email,
      entity.firstName,
      entity.lastName,
    );
  }
}
