import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class AuthDto {
  @ApiProperty({ description: 'The access token', example: '1234567890' })
  access_token: string;
  @ApiProperty({ description: 'The user', type: UserDto })
  user: UserDto;
  constructor(access_token: string, user: UserDto) {
    this.user = user;
    this.access_token = access_token;
  }
}

export type AuthTokenPayload = {
  sub: number;
  email: string;
  //   iat: number;
  //   exp: number;
};
