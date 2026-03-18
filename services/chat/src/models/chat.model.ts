import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => RoomMember, roomMember => roomMember.room)
  roomMembers: RoomMember[];

  @OneToMany(() => Message, message => message.room)
  messages: Message[];
}

@Entity()
export class RoomMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  room_id: number;

  @Column()
  user_id: number; // References Identity service user.id (number type)

  @Column({ type: 'int', default: 1 })
  role: number; // 0 = banned, 1 = member, 2 = moderator

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;

  @ManyToOne(() => Room, room => room.roomMembers)
  @JoinColumn({ name: 'room_id' })
  room: Room;
}

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  room_id: number;

  @Column()
  user_id: number; // References Identity service user.id (number type)

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted: boolean;

  @ManyToOne(() => Room, room => room.messages)
  @JoinColumn({ name: 'room_id' })
  room: Room;
}

// Import User type from Identity service for type safety (as interface only)
interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}
