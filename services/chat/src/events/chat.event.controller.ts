import { Controller } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from "@nestjs/microservices";
import { ChatService } from "../services/chat.service";
import { ResultObjectDto } from "../dto/resultobject.dto";
import { ChatGateway } from "../websocket/chat.gateway";

type GetChatPayload = {
  type:
    | "messages"
    | "users"
    | "general"
    | "rooms"
    | "leave"
    | "members"
    | "stats"
    | "message_times";
  payload?: {
    roomId?: number;
    userId?: number;
  };
};

type CreateRoomPayload = {
  name: string;
  description: string | null;
  creatorId: number;
  memberEmails: string[];
  memberUserIds?: number[];
};

type ChatEventPayload = {
  event:
    | "join_room"
    | "send_message"
    | "leave_room"
    | "create_room"
    | "edit_message"
    | "delete_message";
  payload: {
    roomId?: number;
    userId?: number;
    content?: string;
    messageType?: string;
    fileName?: string | null;
    name?: string;
    description?: string | null;
    creatorId?: number;
    memberEmails?: string[];
    memberUserIds?: number[];
    messageId?: number;
  };
};

type RmqChannel = {
  ack: (message: unknown) => void;
};

@Controller()
export class ChatEventController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @MessagePattern("get_chat")
  async handleGetChat(
    @Payload() data: GetChatPayload,
    @Ctx() context: RmqContext,
  ): Promise<ResultObjectDto<unknown>> {
    const channel = context.getChannelRef() as RmqChannel;
    const originalMsg = context.getMessage() as unknown;

    try {
      let chat: unknown;

      switch (data.type) {
        case "messages": {
          // Get room history for the specified room ID
          const roomId = data.payload?.roomId;
          if (roomId) {
            chat = await this.chatService.getRoomHistory(roomId);
          } else {
            chat = [];
          }
          break;
        }
        case "users":
          chat = await this.chatService.getUserChat();
          break;
        case "general":
          chat = await this.chatService.getGeneralChat();
          break;
        case "rooms": {
          const userId = data.payload?.userId;
          if (userId === undefined) {
            return new ResultObjectDto(null, true, 400, [
              { type: 2, message: "User ID is required" },
            ]);
          }

          chat = await this.chatService.getUserRooms(userId);
          break;
        }
        case "members": {
          const roomId = data.payload?.roomId;
          if (roomId === undefined) {
            return new ResultObjectDto(null, true, 400, [
              { type: 2, message: "Room ID is required" },
            ]);
          }

          chat = await this.chatService.getRoomMembers(roomId);
          break;
        }
        case "stats":
          chat = await this.chatService.getStats();
          break;
        case "message_times":
          chat = await this.chatService.getMessageTimes();
          break;
        case "leave":
          try {
            const userId = data.payload?.userId;
            const roomId = data.payload?.roomId;
            if (userId === undefined || roomId === undefined) {
              return new ResultObjectDto(null, true, 400, [
                { type: 2, message: "User ID and room ID are required" },
              ]);
            }

            await this.chatService.leaveRoom(userId, roomId);
            chat = null;
          } catch (error) {
            return new ResultObjectDto(null, true, 400, [
              { type: 2, message: this.getErrorMessage(error) },
            ]);
          }
          break;
        default:
          return new ResultObjectDto(null, true, 400, [
            { type: 2, message: "Invalid chat type" },
          ]);
      }

      return new ResultObjectDto(chat, false, 200);
    } finally {
      channel.ack(originalMsg);
    }
  }

  @MessagePattern("chat_event")
  async handleChatEvent(
    @Payload() data: ChatEventPayload,
    @Ctx() context: RmqContext,
  ): Promise<ResultObjectDto<unknown>> {
    const channel = context.getChannelRef() as RmqChannel;
    const originalMsg = context.getMessage() as unknown;

    try {
      let result: unknown;

      switch (data.event) {
        case "join_room":
          // Handle join room - this is handled by ChatGateway
          result = { success: true };
          break;
        case "send_message": {
          // Handle send message - save to database and broadcast
          const { roomId, userId, content, messageType, fileName } =
            data.payload;
          if (roomId === undefined || userId === undefined || !content) {
            return new ResultObjectDto(null, true, 400, [
              { type: 2, message: "Invalid send message payload" },
            ]);
          }

          const message = await this.chatService.saveMessage({
            roomId,
            userId,
            content,
            messageType,
            fileName,
          });

          // Broadcast message to all users in the room via ChatGateway
          this.chatGateway.broadcastMessage(roomId, message);

          result = { success: true, message };
          break;
        }
        case "leave_room": {
          const { userId, roomId } = data.payload;
          if (roomId === undefined || userId === undefined) {
            return new ResultObjectDto(null, true, 400, [
              { type: 2, message: "Invalid leave room payload" },
            ]);
          }

          await this.chatService.leaveRoom(userId, roomId);
          result = { success: true };
          break;
        }
        case "create_room": {
          // Handle create room - actually create the room!
          const { name, description, creatorId, memberEmails, memberUserIds } =
            data.payload;
          if (!name || creatorId === undefined) {
            return new ResultObjectDto(null, true, 400, [
              { type: 2, message: "Invalid create room payload" },
            ]);
          }

          result = await this.chatService.createRoom({
            name,
            description: description ?? null,
            creatorId,
            memberEmails: memberEmails ?? [],
            memberUserIds,
          } satisfies CreateRoomPayload);
          break;
        }
        case "edit_message": {
          const { messageId, userId, content } = data.payload;
          if (messageId === undefined || userId === undefined || !content) {
            return new ResultObjectDto(null, true, 400, [
              { type: 2, message: "Invalid edit message payload" },
            ]);
          }

          const edited = await this.chatService.editMessage({
            messageId,
            userId,
            content,
          });
          this.chatGateway.broadcastMessageEdited(edited.room_id, edited);
          result = { success: true, message: edited };
          break;
        }
        case "delete_message": {
          const { messageId, userId } = data.payload;
          if (messageId === undefined || userId === undefined) {
            return new ResultObjectDto(null, true, 400, [
              { type: 2, message: "Invalid delete message payload" },
            ]);
          }

          const { roomId } = await this.chatService.deleteMessage({
            messageId,
            userId,
          });
          this.chatGateway.broadcastMessageDeleted(roomId, messageId);
          result = { success: true };
          break;
        }
        default:
          return new ResultObjectDto(null, true, 400, [
            { type: 2, message: "Invalid chat event" },
          ]);
      }

      return new ResultObjectDto(result, false, 200);
    } catch (error) {
      console.error("ChatEventController error:", error);
      return new ResultObjectDto(null, true, 500, [
        { type: 2, message: this.getErrorMessage(error) },
      ]);
    } finally {
      channel.ack(originalMsg);
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return "Unexpected chat event error";
  }
}
