import { ApiProperty } from '@nestjs/swagger';

export class RoomDto {
  @ApiProperty({ example: 1, description: 'Room ID' })
  id: number;

  @ApiProperty({ example: 'General Chat', description: 'Room name' })
  name: string;

  @ApiProperty({ example: 'General discussion room', description: 'Room description', required: false })
  description: string | null;
}
