import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { DefaultEventsMap, Server, Socket } from "socket.io";
import { RealtimeService } from "./realtime.service";
import { AuthProxyService } from "../services/auth-proxy.service";
import { ChatProxyService } from "../services/chat-proxy.service";
import { UserDto } from "../dto/user.dto";

type SocketData = { user?: UserDto };
type TypedSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SocketData
>;

@WebSocketGateway({
  cors: {
    origin: ["http://localhost:3100", "http://127.0.0.1:3100"],
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly authProxyService: AuthProxyService,
    private readonly chatProxyService: ChatProxyService,
  ) {}

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
      // Join the room in the Gateway WebSocket
      await client.join(`room:${payload.roomId}`);

      // Forward to Chat service via RabbitMQ to get history
      const response = await this.chatProxyService.getChat('messages', { roomId: payload.roomId });

      // Enrich messages with user information
      if (response && response.object && Array.isArray(response.object)) {
        const messages = response.object;
        
        // Get unique user IDs from messages
        const userIds = [...new Set(messages.map((msg: any) => msg.user_id))];
        
        // Fetch user information from Identity service
        const userMap = new Map<number, any>();
        for (const userId of userIds) {
          try {
            const identityResponse = await fetch(`http://identity-service:3001/user/${userId}`, {
              headers: {
                'Authorization': `Bearer ${client.handshake.auth?.token}`,
              },
            });
            if (identityResponse.ok) {
              const userData = await identityResponse.json();
              userMap.set(userId, userData.object);
            }
          } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
          }
        }

        // Attach user information to messages
        const enrichedMessages = messages.map((msg: any) => ({
          ...msg,
          user: userMap.get(msg.user_id) || {
            id: msg.user_id,
            email: `user${msg.user_id}@example.com`,
            firstName: null,
            lastName: null,
          }
        }));

        client.emit('chat:history', {
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
      // Forward to Chat service via RabbitMQ to save message
      const response = await this.chatProxyService.sendChatEvent('send_message', {
        roomId: payload.roomId,
        userId: sender.id,
        content: payload.content,
      });

      // Broadcast message to all users in the room except the sender
      if (response && response.object) {
        const messageData = response.object as { message?: any };
        if (messageData.message) {
          // Fetch user info for the message sender
          let enrichedMessage = messageData.message;
          try {
            const identityResponse = await fetch(`http://identity-service:3001/user/${messageData.message.user_id}`, {
              headers: {
                'Authorization': `Bearer ${client.handshake.auth?.token}`,
              },
            });
            if (identityResponse.ok) {
              const userData = await identityResponse.json();
              enrichedMessage = {
                ...messageData.message,
                user: userData.object || {
                  id: messageData.message.user_id,
                  email: `user${messageData.message.user_id}@example.com`,
                  firstName: null,
                  lastName: null,
                }
              };
            }
          } catch (error) {
            console.error(`Failed to fetch user ${messageData.message.user_id}:`, error);
          }

          this.server.to(`room:${payload.roomId}`).except(client.id).emit('chat:new_message', {
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

    // Forward to Chat service via RabbitMQ
    return this.chatProxyService.sendChatEvent('leave_room', {
      roomId: payload.roomId,
      userId: sender.id,
    });
  }

  @SubscribeMessage("chat:create_room")
  async handleChatCreateRoom(
    @ConnectedSocket() client: TypedSocket,
    @MessageBody() payload: { name: string; description: string | null; creatorId: number; memberEmails: string[] },
  ) {
    const sender = client.data.user;
    if (!sender || !payload?.name) {
      return;
    }

    try {
      // Call Identity service to get user IDs from emails
      const identityResponse = await fetch('http://identity-service:3001/user/lookup-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${client.handshake.auth?.token}`,
        },
        body: JSON.stringify({ emails: payload.memberEmails }),
      });

      const identityResult = await identityResponse.json();

      // Forward to chat service via RabbitMQ to create room
      const response = await this.chatProxyService.sendChatEvent('create_room', {
        name: payload.name,
        description: payload.description,
        creatorId: payload.creatorId,
        memberEmails: payload.memberEmails,
        memberUserIds: identityResult.object ? Object.values(identityResult.object) : []
      });

      // Send room_created event back to creator
      if (response && response.object) {
        client.emit("chat:room_created", { 
          room: response.object, 
          creatorId: payload.creatorId, 
          memberEmails: payload.memberEmails 
        });
        
        // Notify invited members that they've been added to a new room
        const memberUserIds = identityResult.object ? Object.values(identityResult.object) : [];
        for (const userId of memberUserIds) {
          // Find all connected clients for this user and notify them
          const connectedSockets = Array.from(this.server.sockets.sockets.values())
            .filter(socket => socket.data.user?.id === userId);
            
          for (const socket of connectedSockets) {
            socket.emit("chat:room_invitation", {
              room: response.object,
              invitedBy: payload.creatorId,
              memberEmails: payload.memberEmails
            });
          }
        }
      }
    } catch (error) {
      console.error("Error in chat:create_room:", error);
      client.emit("chat:error", { message: "Failed to create room" });
    }
  }
}
