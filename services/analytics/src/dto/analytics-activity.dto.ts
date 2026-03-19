import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsActivityDto {
  @ApiProperty({ example: '5m' })
  bucket!: string;

  @ApiProperty({ example: 12 })
  messages!: number;

  @ApiProperty({ example: 2 })
  users!: number;

  @ApiProperty({ example: 1 })
  chats!: number;
}

