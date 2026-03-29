import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Room, RoomMember, Message } from "../models/chat.model";
import { RoomDto } from "../dto/chat.dto";

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomMember)
    private readonly roomMemberRepository: Repository<RoomMember>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  /**
   * Get rooms where a user is a member (not banned)
   */
  async getUserRooms(userId: number): Promise<RoomDto[]> {
    const roomMembers = await this.roomMemberRepository.find({
      where: {
        user_id: userId,
        role: In([1, 2]), // Include both members (role 1) and moderators (role 2), not banned (role 0)
      },
      relations: ["room"],
    });

    return roomMembers.map((roomMember) => ({
      id: roomMember.room.id,
      name: roomMember.room.name,
      description: roomMember.room.description,
    }));
  }

  /**
   * Get members of a specific room
   */
  async getRoomMembers(roomId: number): Promise<any[]> {
    const roomMembers = await this.roomMemberRepository.find({
      where: {
        room_id: roomId,
        role: In([1, 2]), // Include both members (role 1) and moderators (role 2), not banned (role 0)
      },
      relations: ["room"],
    });

    // Return just user IDs - gateway will fetch user details from identity service
    return roomMembers.map((member) => ({
      userId: member.user_id,
      role: member.role,
      joinedAt: member.joined_at.toISOString(),
    }));
  }

  /**
   * Remove a user from a room
   */
  async leaveRoom(userId: number, roomId: number): Promise<void> {
    const roomMember = await this.roomMemberRepository.findOne({
      where: { user_id: userId, room_id: roomId },
    });

    if (!roomMember) {
      throw new Error("User is not a member of this room");
    }

    // Remove the user from the room
    await this.roomMemberRepository.remove(roomMember);

    // Check if this was the last member and delete the room if empty
    const remainingMembers = await this.roomMemberRepository.count({
      where: { room_id: roomId },
    });

    if (remainingMembers === 0) {
      // Delete all messages in the room first (foreign key constraint)
      await this.messageRepository.delete({ room_id: roomId });

      // Delete the room itself
      await this.roomRepository.delete({ id: roomId });
    }
  }

  /**
   * Get chat history for a specific room
   */
  async getRoomHistory(roomId: number): Promise<Message[]> {
    // No relations: avoids bloated payloads and JSON cycles over RabbitMQ.
    return this.messageRepository.find({
      where: { room_id: roomId, is_deleted: false },
      order: { created_at: "ASC" },
    });
  }

  /**
   * Save a new message to the database
   */
  async saveMessage(data: {
    roomId: number;
    userId: number;
    content: string;
  }): Promise<Message> {
    const message = this.messageRepository.create({
      room_id: data.roomId,
      user_id: data.userId,
      content: data.content,
    });

    return this.messageRepository.save(message);
  }

  /**
   * Edit an existing message (only by its owner)
   */
  async editMessage(data: {
    messageId: number;
    userId: number;
    content: string;
  }): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: data.messageId, user_id: data.userId, is_deleted: false },
    });

    if (!message) {
      throw new Error("Message not found or not owned by user");
    }

    message.content = data.content;
    message.is_edited = true;
    message.updated_at = new Date();
    return this.messageRepository.save(message);
  }

  /**
   * Hard-delete a message (only by its owner)
   */
  async deleteMessage(data: {
    messageId: number;
    userId: number;
  }): Promise<{ roomId: number }> {
    const message = await this.messageRepository.findOne({
      where: { id: data.messageId, user_id: data.userId, is_deleted: false },
    });

    if (!message) {
      throw new Error("Message not found or not owned by user");
    }

    const roomId = message.room_id;
    await this.messageRepository.remove(message);
    return { roomId };
  }

  async getMessageTimes(): Promise<string[]> {
    const rows = await this.messageRepository
      .createQueryBuilder("m")
      .select("m.created_at", "createdAt")
      .where("m.is_deleted = :deleted", { deleted: false })
      .orderBy("m.created_at", "ASC")
      .getRawMany<{ createdAt: Date | string | null }>();

    return rows
      .map((row) => {
        if (!row?.createdAt) return null;
        const date = new Date(row.createdAt);
        return Number.isNaN(date.getTime()) ? null : date.toISOString();
      })
      .filter((value): value is string => value !== null);
  }

  /**
   * Create a new room with members
   */
  async createRoom(data: {
    name: string;
    description: string | null;
    creatorId: number;
    memberEmails: string[];
    memberUserIds?: number[];
  }): Promise<RoomDto> {
    // Create the room
    const room = this.roomRepository.create({
      name: data.name,
      description: data.description,
      created_at: new Date(),
      is_active: true,
    });

    const savedRoom = await this.roomRepository.save(room);

    // Add creator as moderator
    await this.roomMemberRepository.save({
      room_id: savedRoom.id,
      user_id: data.creatorId,
      role: 2, // Moderator
      joined_at: new Date(),
    });

    // Add other members (if any)
    if (data.memberEmails && data.memberEmails.length > 0) {
      // Note: memberEmails should already be resolved to user IDs by the gateway
      // For now, we'll just add them as members with the provided IDs
      if (data.memberUserIds && data.memberUserIds.length > 0) {
        for (const userId of data.memberUserIds) {
          await this.roomMemberRepository.save({
            room_id: savedRoom.id,
            user_id: userId,
            role: 1, // Regular member
            joined_at: new Date(),
          });
        }
      }
    }

    return {
      id: savedRoom.id,
      name: savedRoom.name,
      description: savedRoom.description,
    };
  }
  /**
   * Get real stats from DB (total messages, rooms, avg length, first message date).
   */
  async getStats(): Promise<{
    totalMessages: number;
    totalRooms: number;
    averageMessageLength: number;
    firstMessageAt: Date | null;
  }> {
    const totalMessages = await this.messageRepository.count();
    const totalRooms = await this.roomRepository.count();

    const avgRaw = await this.messageRepository
      .createQueryBuilder("m")
      .select("AVG(LENGTH(m.content))", "avg")
      .where("m.is_deleted = :deleted", { deleted: false })
      .getRawOne<{ avg: string | null }>();
    const averageMessageLength = avgRaw?.avg
      ? Math.round(Number(avgRaw.avg))
      : 0;

    const firstRaw = await this.messageRepository
      .createQueryBuilder("m")
      .select("MIN(m.created_at)", "min")
      .where("m.is_deleted = :deleted", { deleted: false })
      .getRawOne<{ min: Date | null }>();
    const firstMessageAt = firstRaw?.min ?? null;

    return {
      totalMessages,
      totalRooms,
      averageMessageLength,
      firstMessageAt,
    };
  }

  /**
   * Get chat about messages (delegates to stats for real counts).
   */
  async getMessageChat(): Promise<{
    totalMessages: number;
    messagesPerDay: number;
    averageMessageLength: number;
  }> {
    const stats = await this.getStats();
    const daysSinceFirst =
      stats.firstMessageAt == null
        ? 1
        : Math.max(
            1,
            (Date.now() - new Date(stats.firstMessageAt).getTime()) /
              86_400_000,
          );
    return {
      totalMessages: stats.totalMessages,
      messagesPerDay: stats.totalMessages / daysSinceFirst,
      averageMessageLength: stats.averageMessageLength,
    };
  }

  /**
   * Get chat about users
   * TODO: Implement user chat
   */
  getUserChat(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
  }> {
    return Promise.resolve({
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
    });
  }

  /**
   * Get general platform chat
   * TODO: Implement general chat
   */
  getGeneralChat(): Promise<{
    totalMessages: number;
    totalUsers: number;
    platformUptime: number;
  }> {
    return Promise.resolve({
      totalMessages: 0,
      totalUsers: 0,
      platformUptime: 0,
    });
  }
}
