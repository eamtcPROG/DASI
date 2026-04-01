import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ChatService } from "../services/chat.service";
import { Message } from "../models/chat.model";

interface ChatMessageData {
  roomId: number;
  userId: number;
  content: string;
  messageType?: string;
  fileName?: string | null;
}

interface ChatRoomData {
  roomId: number;
  userId: number;
}

interface ChatSocket extends Socket {
  userId?: number;
  roomId?: number;
}

@WebSocketGateway({
  cors: {
    origin: ["*"],
    credentials: true,
  },
  maxHttpBufferSize: 10e6, // 10 MB — Base64 images can reach ~7 MB for a 5 MB file
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Method to broadcast messages from outside the WebSocket context
  broadcastMessage(roomId: number, message: Message) {
    this.server.to(`room:${roomId}`).emit("chat:new_message", {
      roomId: roomId,
      message: message,
    });
  }

  broadcastMessageEdited(roomId: number, message: Message) {
    this.server.to(`room:${roomId}`).emit("chat:message_edited", {
      roomId,
      message,
    });
  }

  broadcastMessageDeleted(roomId: number, messageId: number) {
    this.server.to(`room:${roomId}`).emit("chat:message_deleted", {
      roomId,
      messageId,
    });
  }

  handleConnection(client: ChatSocket) {
    console.log(`Chat client connected: ${client.id}`);
  }

  handleDisconnect(client: ChatSocket) {
    console.log(`Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage("chat:join_room")
  async handleJoinRoom(client: ChatSocket, @MessageBody() data: ChatRoomData) {
    try {
      // Join the room
      client.roomId = data.roomId;
      await client.join(`room:${data.roomId}`);

      // Get chat history for this room
      const history = await this.chatService.getRoomHistory(data.roomId);

      // Send history to the client
      client.emit("chat:history", {
        roomId: data.roomId,
        messages: history,
      });

      console.log(
        `User joined room ${data.roomId}, sent ${history.length} messages`,
      );
    } catch (error) {
      console.error("Error joining room:", error);
      client.emit("chat:error", { message: "Failed to join room" });
    }
  }

  @SubscribeMessage("chat:send_message")
  async handleSendMessage(
    client: ChatSocket,
    @MessageBody() data: ChatMessageData,
  ) {
    try {
      // Validate user is in the room
      if (client.roomId !== data.roomId) {
        client.emit("chat:error", { message: "You must join the room first" });
        return;
      }

      // Save message to database
      const message = await this.chatService.saveMessage({
        roomId: data.roomId,
        userId: data.userId,
        content: data.content,
        messageType: data.messageType,
        fileName: data.fileName,
      });

      // Broadcast message to all users in the room
      this.server.to(`room:${data.roomId}`).emit("chat:new_message", {
        roomId: data.roomId,
        message: message,
      });

      console.log(`Message saved and broadcasted to room ${data.roomId}`);
    } catch (error) {
      console.error("Error sending message:", error);
      client.emit("chat:error", { message: "Failed to send message" });
    }
  }

  @SubscribeMessage("chat:leave_room")
  async handleLeaveRoom(client: ChatSocket, @MessageBody() data: ChatRoomData) {
    try {
      // Leave the room
      client.roomId = undefined;
      await client.leave(`room:${data.roomId}`);

      // Remove user from room membership
      await this.chatService.leaveRoom(data.userId, data.roomId);

      client.emit("chat:left_room", { roomId: data.roomId });
      console.log(`User left room ${data.roomId}`);
    } catch (error) {
      console.error("Error leaving room:", error);
      client.emit("chat:error", { message: "Failed to leave room" });
    }
  }

  @SubscribeMessage("chat:create_room")
  async handleCreateRoom(
    client: ChatSocket,
    @MessageBody()
    data: {
      name: string;
      description: string | null;
      creatorId: number;
      memberEmails: string[];
    },
  ) {
    try {
      // Create the room
      const room = await this.chatService.createRoom(data);

      // Broadcast new room to all connected users
      this.server.emit("chat:room_created", {
        room: room,
        creatorId: data.creatorId,
        memberEmails: data.memberEmails,
      });
    } catch (error) {
      console.error("Error creating room:", error);
      client.emit("chat:error", { message: "Failed to create room" });
    }
  }
}
