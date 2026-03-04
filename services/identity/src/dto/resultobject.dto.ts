import { ApiProperty } from '@nestjs/swagger';
import { MessageDto } from './message.dto';

export class ResultObjectDto<T> {
  @ApiProperty({
    example: false,
    description: 'Error flag',
    type: 'boolean',
  })
  error: boolean;
  @ApiProperty({
    example: 200,
    description: 'HTML code',
    type: 'number',
  })
  htmlcode: number;
  @ApiProperty({
    example: {},
    description: 'Object',
    type: 'object',
    additionalProperties: false,
  })
  object: T | null;
  @ApiProperty({
    example: [],
    description: 'Messages',
    type: 'array',
    items: {
      type: 'object',
    },
  })
  messages: MessageDto[];

  constructor(
    object: T | null,
    error?: boolean,
    htmlcode?: number,
    messages?: MessageDto[],
  ) {
    this.error = error ?? false;
    this.htmlcode = htmlcode ?? 200;
    this.object = object ?? null;
    this.messages = messages ?? [];
  }
}
