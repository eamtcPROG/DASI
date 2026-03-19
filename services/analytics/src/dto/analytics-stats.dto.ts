import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsStatsDto {
  @ApiProperty({ example: 12 })
  totalUsers!: number;

  @ApiProperty({ example: 345 })
  totalMessages!: number;

  @ApiProperty({ example: 24 })
  totalChats!: number;

  @ApiProperty({ example: '2026-03-19T12:34:56.789Z' })
  updatedAt!: string;

  @ApiProperty({ example: '2026-03-19T12:35:10.000Z', nullable: true })
  lastMessageAt!: string | null;
}

