import { ApiProperty } from '@nestjs/swagger';
import { MessageDto } from './message.dto';
import { MessageAnalyticsDto } from './message-analytics.dto';
import { UserAnalyticsDto } from './user-analytics.dto';
import { GeneralAnalyticsDto } from './general-analytics.dto';

/** Response wrapper for message analytics endpoint */
export class MessageAnalyticsResponseDto {
  @ApiProperty({ example: false, description: 'Error flag' })
  error: boolean;

  @ApiProperty({ example: 200, description: 'HTTP status code' })
  htmlcode: number;

  @ApiProperty({ type: MessageAnalyticsDto, nullable: true, description: 'Message analytics payload' })
  object: MessageAnalyticsDto | null;

  @ApiProperty({ type: [MessageDto], description: 'Optional messages' })
  messages: MessageDto[];
}

/** Response wrapper for user analytics endpoint */
export class UserAnalyticsResponseDto {
  @ApiProperty({ example: false, description: 'Error flag' })
  error: boolean;

  @ApiProperty({ example: 200, description: 'HTTP status code' })
  htmlcode: number;

  @ApiProperty({ type: UserAnalyticsDto, nullable: true, description: 'User analytics payload' })
  object: UserAnalyticsDto | null;

  @ApiProperty({ type: [MessageDto], description: 'Optional messages' })
  messages: MessageDto[];
}

/** Response wrapper for general analytics endpoint */
export class GeneralAnalyticsResponseDto {
  @ApiProperty({ example: false, description: 'Error flag' })
  error: boolean;

  @ApiProperty({ example: 200, description: 'HTTP status code' })
  htmlcode: number;

  @ApiProperty({ type: GeneralAnalyticsDto, nullable: true, description: 'General platform analytics payload' })
  object: GeneralAnalyticsDto | null;

  @ApiProperty({ type: [MessageDto], description: 'Optional messages' })
  messages: MessageDto[];
}
