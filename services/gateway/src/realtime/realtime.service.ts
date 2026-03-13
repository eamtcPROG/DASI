import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RealtimeService {
  private readonly connections = new Map<number, Set<string>>();

  constructor(private readonly configService: ConfigService) {}

  addConnection(userId: number, socketId: string) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(socketId);
  }

  removeConnection(userId: number, socketId: string) {
    const sockets = this.connections.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.connections.delete(userId);
      }
    }
  }

  isUserOnline(userId: number): boolean {
    return this.connections.has(userId);
  }

  getConnectedUsersCount(): number {
    return this.connections.size;
  }

  getTotalConnectionsCount(): number {
    let total = 0;
    for (const sockets of this.connections.values()) {
      total += sockets.size;
    }
    return total;
  }

  getStatus() {
    const redisHost = this.configService.get<string>("redis.host");
    const redisPort = this.configService.get<number>("redis.port");

    return {
      enabled: true,
      socketConnectionsManaged: true,
      connectedUsers: this.getConnectedUsersCount(),
      totalConnections: this.getTotalConnectionsCount(),
      redisConfigured: Boolean(redisHost && redisPort),
    };
  }
}
