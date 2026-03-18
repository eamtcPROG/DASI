import { ApiProperty } from '@nestjs/swagger';

export class UserChatDto {
  @ApiProperty({
    example: 0,
    description: 'Total number of users',
    type: 'number',
  })
  totalUsers: number;

  @ApiProperty({
    example: 0,
    description: 'Number of active users',
    type: 'number',
  })
  activeUsers: number;

  @ApiProperty({
    example: 0,
    description: 'Number of new users registered this month',
    type: 'number',
  })
  newUsersThisMonth: number;
}
