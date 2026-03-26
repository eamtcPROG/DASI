import { ApiProperty } from "@nestjs/swagger";

export class MessageChatDto {
  @ApiProperty({
    example: 0,
    description: "Total number of messages",
    type: "number",
  })
  totalMessages: number;

  @ApiProperty({
    example: 0,
    description: "Average number of messages per day",
    type: "number",
  })
  messagesPerDay: number;

  @ApiProperty({
    example: 0,
    description: "Average length of messages in characters",
    type: "number",
  })
  averageMessageLength: number;
}
