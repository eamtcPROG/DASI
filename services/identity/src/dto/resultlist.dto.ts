import { ApiProperty } from '@nestjs/swagger';
import { MessageDto } from './message.dto';

export class ResultListDto<T> {
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
    example: [],
    description: 'Objects',
    type: 'array',
    items: {
      type: 'object',
    },
  })
  objects: T[];
  @ApiProperty({
    example: [],
    description: 'Messages',
    type: 'array',
    items: {
      type: 'object',
    },
  })
  messages: MessageDto[];
  @ApiProperty({
    example: 0,
    description: 'Total',
    type: 'number',
  })
  total: number;
  @ApiProperty({
    example: 0,
    description: 'Total pages',
    type: 'number',
  })
  totalpages: number;

  constructor(
    objects: T[],
    total: number,
    totalpages: number,
    error?: boolean,
    htmlcode?: number,
    messages?: MessageDto[],
  ) {
    this.error = error ?? false;
    this.htmlcode = htmlcode ?? 200;
    this.objects = objects ?? [];
    this.total = total ?? 0;
    this.totalpages = totalpages ?? 0;
    this.messages = messages ?? [];
  }
}
