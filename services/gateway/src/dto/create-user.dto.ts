import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'example@example.com',
    description: 'User email - unique in system',
    type: 'string',
  })
  email: string;

  @ApiProperty({
    example: 'password',
    description: 'User password',
    type: 'string',
  })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    type: 'string',
  })
  firstName: string | null;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    type: 'string',
  })
  lastName: string | null;

  constructor(
    email: string,
    password: string,
    firstName?: string | null,
    lastName?: string | null,
  ) {
    this.email = email;
    this.password = password;
    this.firstName = firstName ?? null;
    this.lastName = lastName ?? null;
  }
}
