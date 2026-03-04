import { ApiProperty } from '@nestjs/swagger';

export enum MessageType {
  SUCCESS = 1,
  ERROR = 2,
  WARNING = 3,
}
export class MessageDto {
  @ApiProperty({
    example: 1,
    description: 'The type of the message',
    type: 'number',
  })
  type: number;
  @ApiProperty({
    example: 'Hello World',
    description: 'The message to be displayed',
    type: 'string',
  })
  message: string;

  constructor(message: string, type?: MessageType) {
    this.type = type ?? MessageType.ERROR;
    this.message = message;
  }
}
