import { ApiProperty } from "@nestjs/swagger";

export class RoomDto {
  @ApiProperty({ example: 1, description: "Room ID" })
  id: number;

  @ApiProperty({ example: "General Chat", description: "Room name" })
  name: string;

  @ApiProperty({
    example: "General discussion room",
    description: "Room description",
    required: false,
  })
  description: string | null;

  @ApiProperty({
    example: "Hello!",
    description: "Latest non-deleted message preview",
    required: false,
    nullable: true,
  })
  lastMessage?: string | null;

  @ApiProperty({
    example: "2026-03-29T12:00:00.000Z",
    description: "ISO time of latest message",
    required: false,
    nullable: true,
  })
  lastMessageAt?: string | null;
}

export class UserRoomsRequestDto {
  @ApiProperty({
    example: 123,
    description: "User ID extracted from JWT token",
  })
  userId: number;
}

export class LeaveRoomRequestDto {
  @ApiProperty({
    example: 123,
    description: "User ID extracted from JWT token",
  })
  userId: number;

  @ApiProperty({ example: 1, description: "Room ID to leave" })
  roomId: number;
}

export class CreateRoomRequestDto {
  @ApiProperty({ example: "General Discussion", description: "Room name" })
  name: string;

  @ApiProperty({
    example: "General chat room for team discussions",
    description: "Room description",
    required: false,
  })
  description: string | null;

  @ApiProperty({ example: 123, description: "ID of user creating the room" })
  creatorId: number;

  @ApiProperty({
    example: ["user1@example.com", "user2@example.com"],
    description: "List of member emails to add to the room",
  })
  memberEmails: string[];
}

export class CreateRoomResponseDto {
  @ApiProperty({
    example: {
      id: 1,
      name: "General Discussion",
      description: "General chat room",
    },
    description: "Created room info",
  })
  room: RoomDto;
}
