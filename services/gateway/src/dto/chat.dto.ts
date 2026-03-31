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

export class LeaveRoomClientRequestDto {
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

  @ApiProperty({
    example: ["user1@example.com", "user2@example.com"],
    description: "List of member emails to add",
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

export class GetRoomMembersRequestDto {
  @ApiProperty({ example: 1, description: "Room ID" })
  roomId: number;
}

export class RoomMemberDto {
  @ApiProperty({ example: 123, description: "User ID" })
  userId: number;

  @ApiProperty({
    example: 1,
    description: "User role in room (0=banned, 1=member, 2=moderator)",
  })
  role: number;

  @ApiProperty({
    example: "2024-01-15T10:30:00Z",
    description: "When user joined room",
  })
  joinedAt: string;
}
