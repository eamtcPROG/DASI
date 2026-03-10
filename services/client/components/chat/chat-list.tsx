"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface Chat {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
}

interface ChatListProps {
  chats: Chat[]
  selectedChat: string | null
  onSelectChat: (id: string) => void
}

export function ChatList({ chats, selectedChat, onSelectChat }: ChatListProps) {
  return (
    <div className="flex flex-col">
      {chats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={cn(
            "flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left",
            selectedChat === chat.id && "bg-accent"
          )}
        >
          <Avatar className="w-12 h-12 shrink-0">
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
              {chat.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground text-sm">{chat.name}</span>
              <span className="text-xs text-muted-foreground">{chat.time}</span>
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-sm text-muted-foreground truncate pr-2">
                {chat.lastMessage}
              </p>
              {chat.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0">
                  {chat.unread}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
