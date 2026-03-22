import { ApiProperty } from "@nestjs/swagger";

export class GeneralChatDto {
  @ApiProperty({
    example: 0,
    description: "Total number of messages on the platform",
    type: "number",
  })
  totalMessages: number;

  @ApiProperty({
    example: 0,
    description: "Total number of users on the platform",
    type: "number",
  })
  totalUsers: number;

  @ApiProperty({
    example: 0,
    description: "Platform uptime in seconds",
    type: "number",
  })
  platformUptime: number;
}
