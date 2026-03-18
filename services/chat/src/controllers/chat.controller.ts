import { Controller, Post, Body, HttpCode } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags, ApiBody } from "@nestjs/swagger";
import { ChatService } from "../services/chat.service";
import { ResultObjectDto } from "../dto/resultobject.dto";
import { RoomDto, UserRoomsRequestDto, LeaveRoomRequestDto, CreateRoomRequestDto, CreateRoomResponseDto } from "../dto/chat.dto";

@ApiTags("Chat")
@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  
  @HttpCode(200)
  @Post("join")
  @ApiOperation({ summary: "Create room and add members" })
  @ApiBody({ type: CreateRoomRequestDto, description: "Create room request" })
  @ApiOkResponse({
    type: ResultObjectDto<CreateRoomResponseDto>,
    description: "Create room response",
  })
  async createRoom(@Body() body: CreateRoomRequestDto) {
    try {
      const room = await this.chatService.createRoom(body);
      return { error: false, htmlcode: 200, object: room, messages: [] };
    } catch (error) {
      return { error: true, htmlcode: 500, object: null, messages: [{ type: 2, message: error.message }] };
    }
  }

  @HttpCode(200)
  @Post("rooms")
  @ApiOperation({ summary: "Get user rooms" })
  @ApiBody({ type: UserRoomsRequestDto, description: "User ID request" })
  @ApiOkResponse({
    type: ResultObjectDto<RoomDto[]>,
    description: "User rooms response",
  })
  async getChatRooms(@Body() body: UserRoomsRequestDto) {
    try {
      const rooms = await this.chatService.getUserRooms(body.userId);
      return { error: false, htmlcode: 200, object: rooms, messages: [] };
    } catch (error) {
      return { error: true, htmlcode: 500, object: null, messages: [{ type: 2, message: error.message }] };
    }
  }

  @HttpCode(200)
  @Post("members")
  @ApiOperation({ summary: 'Get room members' })
  @ApiBody({ description: 'Room ID request' })
  @ApiOkResponse({
    type: ResultObjectDto<any[]>,
    description: 'Room members response',
  })
  async getRoomMembers(@Body() body: { roomId: number }) {
    return this.chatService.getRoomMembers(body.roomId);
  }

  @HttpCode(200)
  @Post("leave")
  @ApiOperation({ summary: "Leave chat room" })
  @ApiBody({ type: LeaveRoomRequestDto, description: "Leave room request" })
  @ApiOkResponse({
    type: ResultObjectDto<null>,
    description: "Leave room response",
  })
  async leaveChat(@Body() body: LeaveRoomRequestDto) {
    try {
      await this.chatService.leaveRoom(body.userId, body.roomId);
      return { error: false, htmlcode: 200, object: null, messages: [] };
    } catch (error) {
      return { error: true, htmlcode: 400, object: null, messages: [{ type: 2, message: error.message }] };
    }
  }
}
