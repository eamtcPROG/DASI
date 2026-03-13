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
}
