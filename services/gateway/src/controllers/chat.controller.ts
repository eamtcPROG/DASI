import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBody,
} from "@nestjs/swagger";
import { JwtGuard } from "../auth/jwt.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthenticatedUser } from "../dto/user.dto";
import { ResultObjectDto } from "../dto/resultobject.dto";
import { ChatProxyService } from "../services/chat-proxy.service";
import { AuthProxyService } from "../services/auth-proxy.service";
import { AnalyticsEventsService } from "../services/analytics-events.service";
import {
  RoomDto,
  UserRoomsRequestDto,
  LeaveRoomRequestDto,
  LeaveRoomClientRequestDto,
  CreateRoomRequestDto,
  CreateRoomResponseDto,
  GetRoomMembersRequestDto,
  RoomMemberDto,
} from "../dto/chat.dto";

@ApiTags("Chat")
@ApiBearerAuth("jwt")
@ApiUnauthorizedResponse({
  type: ResultObjectDto<null>,
  description: "Invalid or missing token",
})
@UseGuards(JwtGuard)
@Controller("chat")
export class ChatController {
  constructor(
    private readonly chatProxyService: ChatProxyService,
    private readonly authProxyService: AuthProxyService,
    private readonly analyticsEvents: AnalyticsEventsService,
  ) {}

  @HttpCode(200)
  @Post("join")
  @ApiOperation({ summary: "Create room and add members" })
  @ApiBody({ type: CreateRoomRequestDto, description: "Create room request" })
  @ApiOkResponse({
    type: ResultObjectDto<CreateRoomResponseDto>,
    description: "Create room response",
  })
  async createRoom(
    @Body() body: CreateRoomRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const result = await this.chatProxyService.sendChatEvent("create_room", {
      ...body,
      creatorId: user.id,
    });
    if (!result?.error && result?.object) {
      await this.analyticsEvents.publish("room.created", {
        occurredAt: new Date().toISOString(),
      });
    }
    return result;
  }

  @Get("rooms")
  @ApiOperation({ summary: "Get user rooms" })
  @ApiOkResponse({
    type: ResultObjectDto<RoomDto[]>,
    description: "User rooms response",
  })
  getChatRooms(@CurrentUser() user: AuthenticatedUser) {
    const roomsRequest: UserRoomsRequestDto = {
      userId: user.id,
    };
    return this.chatProxyService.getChat("rooms", roomsRequest);
  }

  @Post("members")
  @ApiOperation({ summary: "Get room members" })
  @ApiBody({ type: GetRoomMembersRequestDto, description: "Room ID request" })
  @ApiOkResponse({
    type: ResultObjectDto<RoomMemberDto[]>,
    description: "Room members response",
  })
  async getRoomMembers(@Body() body: GetRoomMembersRequestDto) {
    // Get room members with user IDs from chat service
    const chatResponse = await this.chatProxyService.getChat("members", {
      roomId: body.roomId,
    });

    if (chatResponse.error) {
      return chatResponse;
    }

    const roomMembers = chatResponse.object as Array<{
      userId: number;
      role: number;
      joinedAt: string;
    }>;

    // Extract user IDs to fetch from identity service
    const userIds = roomMembers.map((member) => member.userId);

    // Get user details from identity service
    const usersResponse = await this.authProxyService.getUsersByIds(userIds);

    if (usersResponse.error) {
      return usersResponse;
    }

    const users = usersResponse.object as Array<{
      id: number;
      email: string;
      firstName: string | null;
      lastName: string | null;
    }>;

    // Combine room member data with user details
    const enrichedMembers = roomMembers.map((roomMember) => {
      const user = users.find((u) => u.id === roomMember.userId);
      return {
        userId: roomMember.userId,
        role: roomMember.role,
        joinedAt: roomMember.joinedAt,
        email: user?.email || `user${roomMember.userId}@example.com`,
        displayName:
          user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.firstName || user?.lastName || `User ${roomMember.userId}`,
      };
    });

    return {
      error: false,
      htmlcode: 200,
      object: enrichedMembers,
      messages: [],
    };
  }

  @HttpCode(200)
  @Post("leave")
  @ApiOperation({ summary: "Leave chat room" })
  @ApiBody({
    type: LeaveRoomClientRequestDto,
    description: "Leave room request (userId extracted from JWT)",
  })
  @ApiOkResponse({
    type: ResultObjectDto<null>,
    description: "Leave room response",
  })
  leaveChat(
    @Body() body: LeaveRoomClientRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const leaveRequest: LeaveRoomRequestDto = {
      userId: user.id,
      roomId: body.roomId,
    };
    return this.chatProxyService.getChat("leave", leaveRequest);
  }
}
