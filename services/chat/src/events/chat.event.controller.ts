import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, Ctx } from '@nestjs/microservices';
import { ChatService } from '../services/chat.service';
import { ResultObjectDto } from '../dto/resultobject.dto';
import { ChatGateway } from '../websocket/chat.gateway';

@Controller()
export class ChatEventController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @MessagePattern('get_chat')
  async handleGetChat(
    @Payload()
    data: {
      type: 'messages' | 'users' | 'general' | 'rooms' | 'leave' | 'members';
      payload?: any;
    },
    @Ctx() context: any,
  ): Promise<ResultObjectDto<unknown>> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    let chat: unknown;

    switch (data.type) {
      case 'messages':
        // Get room history for the specified room ID
        const roomId = data.payload?.roomId;
        if (roomId) {
          chat = await this.chatService.getRoomHistory(roomId);
        } else {
          chat = [];
        }
        break;
      case 'users':
        chat = await this.chatService.getUserChat();
        break;
      case 'general':
        chat = await this.chatService.getGeneralChat();
        break;
      case 'rooms':
        chat = await this.chatService.getUserRooms(data.payload?.userId);
        break;
      case 'members':
        chat = await this.chatService.getRoomMembers(data.payload?.roomId);
        break;
      case 'leave':
        try {
          await this.chatService.leaveRoom(data.payload?.userId, data.payload?.roomId);
          chat = null;
        } catch (error) {
          return new ResultObjectDto(null, true, 400, [
            { type: 2, message: error.message },
          ]);
        }
        break;
      default:
        return new ResultObjectDto(null, true, 400, [
          { type: 2, message: 'Invalid chat type' },
        ]);
    }

    channel.ack(originalMsg);
    return new ResultObjectDto(chat, false, 200);
  }

  @MessagePattern('chat_event')
  async handleChatEvent(
    @Payload() data: { event: string; payload: any },
    @Ctx() context: any,
  ): Promise<ResultObjectDto<unknown>> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    let result: unknown;

    try {
      switch (data.event) {
        case 'join_room':
          // Handle join room - this is handled by ChatGateway
          result = { success: true };
          break;
        case 'send_message':
          // Handle send message - save to database and broadcast
          const message = await this.chatService.saveMessage({
            roomId: data.payload.roomId,
            userId: data.payload.userId,
            content: data.payload.content,
          });
          
          // Broadcast message to all users in the room via ChatGateway
          this.chatGateway.broadcastMessage(data.payload.roomId, message);
          
          result = { success: true, message };
          break;
        case 'leave_room':
          await this.chatService.leaveRoom(
            data.payload.userId,
            data.payload.roomId,
          );
          result = { success: true };
          break;
        case 'create_room':
          // Handle create room - actually create the room!
          const room = await this.chatService.createRoom(data.payload);
          result = room;
          break;
        default:
          return new ResultObjectDto(null, true, 400, [
            { type: 2, message: 'Invalid chat event' },
          ]);
      }

      channel.ack(originalMsg);
      return new ResultObjectDto(result, false, 200);
    } catch (error) {
      console.error('ChatEventController error:', error);
      channel.ack(originalMsg);
      return new ResultObjectDto(null, true, 500, [
        { type: 2, message: error.message },
      ]);
    }
  }
}
