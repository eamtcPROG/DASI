import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { ConfigService } from "@nestjs/config";
import { DefaultEventsMap, Server, Socket } from "socket.io";
import { RealtimeService } from "./realtime.service";
import { AuthProxyService } from "../services/auth-proxy.service";
import { ChatProxyService } from "../services/chat-proxy.service";
import { AnalyticsEventsService } from "../services/analytics-events.service";
import { UserDto } from "../dto/user.dto";

const DEFAULT_SOCKET_CORS_ORIGINS = [
  "http://localhost:3100",
  "http://127.0.0.1:3100",
];

const SOCKET_CORS_ORIGINS = (
  process.env.SOCKET_CORS_ORIGINS ?? DEFAULT_SOCKET_CORS_ORIGINS.join(",")
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

type SocketData = { user?: UserDto };
type TypedSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

type ChatMessage = {
  user_id: number;
  [key: string]: unknown;
};

type ChatMessageWithUser = ChatMessage & {
  user: UserDto;
};

type SendMessageResult = {
  message?: ChatMessage;
};

@WebSocketGateway({
  cors: {
    origin: SOCKET_CORS_ORIGINS,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly identityServiceUrl: string;

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly authProxyService: AuthProxyService,
    private readonly chatProxyService: ChatProxyService,
    private readonly analyticsEvents: AnalyticsEventsService,
    private readonly configService: ConfigService,
  ) {
    this.identityServiceUrl =
      this.configService.get<string>("services.identityBaseUrl") ??
      "http://localhost:3001";
  }

  async handleConnection(client: TypedSocket) {
    const token = client.handshake.auth?.token as string | undefined;

    if (!token) {
      client.emit("connection:error", { message: "Authentication required" });
      client.disconnect();
      return;
    }

    const result = await this.authProxyService
      .validateToken(token)
      .catch(() => null);

    if (!result?.isValid || !result.user) {
      client.emit("connection:error", { message: "Invalid token" });
      client.disconnect();
      return;
    }

    client.data.user = result.user;
    await client.join(`user:${result.user.id}`);
    this.realtimeService.addConnection(result.user.id, client.id);
  }

  handleDisconnect(client: TypedSocket) {
    const userId = client.data.user?.id;
    if (userId !== undefined) {
      this.realtimeService.removeConnection(userId, client.id);
    }
  }

  private getSocketToken(client: TypedSocket): string | undefined {
    const auth = client.handshake.auth as { token?: unknown } | undefined;
    const token = auth?.token;
    return typeof token === "string" ? token : undefined;
  }

  private getAuthHeaders(token?: string): HeadersInit | undefined {
    if (!token) {
      return undefined;
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  }

  private async fetchIdentityUser(
    userId: number,
    token?: string,
  ): Promise<UserDto | null> {
    const identityResponse = await fetch(
      `${this.identityServiceUrl}/user/${userId}`,
      {
        headers: this.getAuthHeaders(token),
      },
    );

    if (!identityResponse.ok) {
      return null;
    }

    const userData = (await identityResponse.json()) as { object?: UserDto };
    return userData.object ?? null;
  }

  private async lookupUserIdsByEmail(
    emails: string[],
    token?: string,
  ): Promise<number[]> {
    const identityResponse = await fetch(
      `${this.identityServiceUrl}/user/lookup-emails`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.getAuthHeaders(token) ?? {}),
        },
        body: JSON.stringify({ emails }),
      },
    );

    if (!identityResponse.ok) {
      throw new Error("Failed to resolve room members");
    }

    const identityResult = (await identityResponse.json()) as {
      object?: Record<string, number>;
    };

    return Object.values(identityResult.object ?? {}).filter(
      (userId): userId is number => typeof userId === "number",
    );
  }

  private getFallbackUser(userId: number): UserDto {
    return new UserDto(userId, `user${userId}@example.com`, null, null);
  }

  @SubscribeMessage("message:send")
  handleMessageSend(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: { recipientId: number; content: string },
  ) {
    const sender = client.data.user;
    if (!sender || !payload?.recipientId || !payload?.content) return;

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      senderId: sender.id,
      senderEmail: sender.email,
      content: payload.content,
      timestamp: new Date().toISOString(),
    };

    this.server
      .to(`user:${payload.recipientId}`)
      .emit("message:receive", message);
    client.emit("message:sent", message);
  }

  @SubscribeMessage("message:typing")
  handleTyping(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: { recipientId: number; isTyping: boolean },
  ) {
    const sender = client.data.user;
    if (!sender || !payload?.recipientId) return;

    this.server.to(`user:${payload.recipientId}`).emit("message:typing", {
      senderId: sender.id,
      isTyping: payload.isTyping,
    });
  }

  @SubscribeMessage("chat:join_room")
  async handleChatJoinRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: { roomId: number },
  ) {
    const sender = client.data.user;
    if (!sender || !payload?.roomId) return;

    try {
      const token = this.getSocketToken(client);

      // Join the room in the Gateway WebSocket
      await client.join(`room:${payload.roomId}`);

      // Forward to Chat service via RabbitMQ to get history
      const response = await this.chatProxyService.getChat("messages", {
        roomId: payload.roomId,
      });

      // Enrich messages with user information
      if (response && response.object && Array.isArray(response.object)) {
        const messages = response.object as ChatMessage[];

        // Get unique user IDs from messages
        const userIds = [...new Set(messages.map((msg) => msg.user_id))];

        // Fetch user information from Identity service
        const userMap = new Map<number, UserDto>();
        for (const userId of userIds) {
          try {
            const user = await this.fetchIdentityUser(userId, token);
            if (user) {
              userMap.set(userId, user);
            }
          } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
          }
        }

        // Attach user information to messages
        const enrichedMessages: ChatMessageWithUser[] = messages.map((msg) => ({
          ...msg,
          user: userMap.get(msg.user_id) ?? this.getFallbackUser(msg.user_id),
        }));

        client.emit("chat:history", {
          roomId: payload.roomId,
          messages: enrichedMessages,
        });
      }
    } catch (error) {
      console.error("Error in chat:join_room:", error);
      client.emit("chat:error", { message: "Failed to join room" });
    }
  }

  @SubscribeMessage("chat:send_message")
  async handleChatSendMessage(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: { roomId: number; content: string },
  ) {
    const sender = client.data.user;
    if (!sender || !payload?.roomId || !payload?.content) return;

    try {
      const token = this.getSocketToken(client);

      // Forward to Chat service via RabbitMQ to save message
      const response = await this.chatProxyService.sendChatEvent(
        "send_message",
        {
          roomId: payload.roomId,
          userId: sender.id,
          content: payload.content,
        },
      );

      // Broadcast message to all users in the room except the sender
      if (response && response.object) {
        const messageData = response.object as SendMessageResult;
        const savedMessage = messageData.message;
        if (savedMessage) {
          await this.analyticsEvents.publish("message.created", {
            messageId:
              typeof (savedMessage as any).id === "number"
                ? (savedMessage as any).id
                : undefined,
            userId: savedMessage.user_id,
            roomId: payload.roomId,
            // Use gateway receive time to avoid DB timezone skew in short windows.
            occurredAt: new Date().toISOString(),
          });

          // Fetch user info for the message sender
          const user =
            (await this.fetchIdentityUser(savedMessage.user_id, token)) ??
            this.getFallbackUser(savedMessage.user_id);
          const enrichedMessage: ChatMessageWithUser = {
            ...savedMessage,
            user,
          };

          this.server
            .to(`room:${payload.roomId}`)
            .except(client.id)
            .emit("chat:new_message", {
              roomId: payload.roomId,
              message: enrichedMessage,
            });
        }
      }
    } catch (error) {
      console.error("Error in chat:send_message:", error);
      client.emit("chat:error", { message: "Failed to send message" });
    }
  }

  @SubscribeMessage("chat:leave_room")
  async handleChatLeaveRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: { roomId: number },
  ) {
    const sender = client.data.user;
    if (!sender || !payload?.roomId) return;

    try {
      const response = await this.chatProxyService.sendChatEvent("leave_room", {
        roomId: payload.roomId,
        userId: sender.id,
      });

      if (response?.error) {
        client.emit("chat:error", {
          message: response.messages?.[0]?.message ?? "Failed to leave room",
        });
        return response;
      }

      await client.leave(`room:${payload.roomId}`);
      client.emit("chat:left_room", { roomId: payload.roomId });
      return response;
    } catch (error) {
      console.error("Error in chat:leave_room:", error);
      client.emit("chat:error", { message: "Failed to leave room" });
    }
  }

  @SubscribeMessage("chat:create_room")
  async handleChatCreateRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody()
    payload: {
      name: string;
      description: string | null;
      creatorId?: number;
      memberEmails: string[];
    },
  ) {
    const sender = client.data.user;
    if (!sender || !payload?.name) {
      return;
    }

    try {
      const token = this.getSocketToken(client);
      const memberEmails = payload.memberEmails ?? [];
      const memberUserIds = (
        await this.lookupUserIdsByEmail(memberEmails, token)
      ).filter((userId) => userId !== sender.id);

      // Forward to chat service via RabbitMQ to create room
      const response = await this.chatProxyService.sendChatEvent(
        "create_room",
        {
          name: payload.name,
          description: payload.description,
          creatorId: sender.id,
          memberEmails,
          memberUserIds,
        },
      );

      // Send room_created event back to creator
      if (response && response.object) {
        await this.analyticsEvents.publish("room.created", {
          occurredAt: new Date().toISOString(),
        });

        client.emit("chat:room_created", {
          room: response.object,
          creatorId: sender.id,
          memberEmails,
        });

        // Notify invited members that they've been added to a new room
        for (const userId of memberUserIds) {
          this.server.to(`user:${userId}`).emit("chat:room_invitation", {
            room: response.object,
            invitedBy: sender.id,
            memberEmails,
          });
        }
      }
    } catch (error) {
      console.error("Error in chat:create_room:", error);
      client.emit("chat:error", { message: "Failed to create room" });
    }
  }
}
