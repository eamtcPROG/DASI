import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Room, RoomMember, Message } from '../models/chat.model';
import { RoomDto, UserRoomsRequestDto, LeaveRoomRequestDto } from '../dto/chat.dto';

// Import User type from Identity service for type safety (as interface only)
interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

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
        role: In([1, 2]) // Include both members (role 1) and moderators (role 2), not banned (role 0)
      },
      relations: ['room'],
    });

    return roomMembers.map(roomMember => ({
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
        role: In([1, 2]) // Include both members (role 1) and moderators (role 2), not banned (role 0)
      },
      relations: ['room'],
    });

    // Return just user IDs - gateway will fetch user details from identity service
    return roomMembers.map(member => ({
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
      throw new Error('User is not a member of this room');
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
    return this.messageRepository.find({
      where: { room_id: roomId, is_deleted: false },
      order: { created_at: 'ASC' },
      relations: ['room'],
    });
  }

  /**
   * Save a new message to the database
   */
  async saveMessage(data: { roomId: number; userId: number; content: string }): Promise<Message> {
    const message = this.messageRepository.create({
      room_id: data.roomId,
      user_id: data.userId,
      content: data.content,
    });
    
    return this.messageRepository.save(message);
  }

  /**
   * Create a new room with members
   */
  async createRoom(data: { name: string; description: string | null; creatorId: number; memberEmails: string[]; memberUserIds?: number[] }): Promise<RoomDto> {
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
   * Get chat about messages
   * TODO: Implement message chat
   */
  async getMessageChat(): Promise<{
    totalMessages: number;
    messagesPerDay: number;
    averageMessageLength: number;
  }> {
    // Placeholder implementation
    return {
      totalMessages: 0,
      messagesPerDay: 0,
      averageMessageLength: 0,
    };
  }

  /**
   * Get chat about users
   * TODO: Implement user chat
   */
  async getUserChat(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
  }> {
    // Placeholder implementation
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
    };
  }

  /**
   * Get general platform chat
   * TODO: Implement general chat
   */
  async getGeneralChat(): Promise<{
    totalMessages: number;
    totalUsers: number;
    platformUptime: number;
  }> {
    // Placeholder implementation
    return {
      totalMessages: 0,
      totalUsers: 0,
      platformUptime: 0,
    };
  }
}
