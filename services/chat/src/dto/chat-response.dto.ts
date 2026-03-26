import { ApiProperty } from "@nestjs/swagger";
import { MessageDto } from "./message.dto";
import { MessageChatDto } from "./message-chat.dto";
import { UserChatDto } from "./user-chat.dto";
import { GeneralChatDto } from "./general-chat.dto";

/** Response wrapper for message chat endpoint */
export class MessageChatResponseDto {
  @ApiProperty({ example: false, description: "Error flag" })
  error: boolean;

  @ApiProperty({ example: 200, description: "HTTP status code" })
  htmlcode: number;

  @ApiProperty({
    type: MessageChatDto,
    nullable: true,
    description: "Message chat payload",
  })
  object: MessageChatDto | null;

  @ApiProperty({ type: [MessageDto], description: "Optional messages" })
  messages: MessageDto[];
}

/** Response wrapper for user chat endpoint */
export class UserChatResponseDto {
  @ApiProperty({ example: false, description: "Error flag" })
  error: boolean;

  @ApiProperty({ example: 200, description: "HTTP status code" })
  htmlcode: number;

  @ApiProperty({
    type: UserChatDto,
    nullable: true,
    description: "User chat payload",
  })
  object: UserChatDto | null;

  @ApiProperty({ type: [MessageDto], description: "Optional messages" })
  messages: MessageDto[];
}

/** Response wrapper for general chat endpoint */
export class GeneralChatResponseDto {
  @ApiProperty({ example: false, description: "Error flag" })
  error: boolean;

  @ApiProperty({ example: 200, description: "HTTP status code" })
  htmlcode: number;

  @ApiProperty({
    type: GeneralChatDto,
    nullable: true,
    description: "General platform chat payload",
  })
  object: GeneralChatDto | null;

  @ApiProperty({ type: [MessageDto], description: "Optional messages" })
  messages: MessageDto[];
}
