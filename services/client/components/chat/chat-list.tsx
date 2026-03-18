"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Pin } from "lucide-react"

interface Chat {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
  status: string
  description?: string
  pinned?: boolean
}

interface ChatListProps {
  chats: Chat[]
  selectedChat: string | null
  onSelectChat: (id: string) => void
}

export function ChatList({ chats, selectedChat, onSelectChat }: ChatListProps) {
  return (
    <div className="flex flex-col gap-2">
      {chats.map((chat) => (
        <button
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
          className={cn(
            "rounded-[24px] border border-transparent bg-background/65 p-3 text-left shadow-sm transition-all hover:border-border/70 hover:bg-background/90",
            selectedChat === chat.id &&
              "border-primary/25 bg-background shadow-lg shadow-primary/8 ring-1 ring-primary/10",
          )}
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarFallback className="bg-secondary text-sm font-medium text-secondary-foreground">
                {chat.name
                  .split(" ")
                  .map((namePart) => namePart[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  {chat.pinned ? <Pin className="size-3.5 text-primary" /> : null}
                  <span className="truncate text-sm font-medium text-foreground">{chat.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{chat.time}</span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{chat.lastMessage}</p>
                {chat.unread > 0 && (
                  <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
