"use client"

import { cn } from "@/lib/utils"
import { Check, CheckCheck } from "lucide-react"

interface Message {
  id: string
  content: string
  time: string
  sent: boolean
  read: boolean
}

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="flex flex-col gap-2 p-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex",
            message.sent ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "max-w-[75%] px-3 py-2 rounded-2xl",
              message.sent
                ? "bg-message-sent text-foreground rounded-br-md"
                : "bg-message-received text-foreground rounded-bl-md border border-border"
            )}
          >
            <p className="text-sm leading-relaxed">{message.content}</p>
            <div className={cn(
              "flex items-center gap-1 mt-1",
              message.sent ? "justify-end" : "justify-start"
            )}>
              <span className="text-[10px] text-muted-foreground">{message.time}</span>
              {message.sent && (
                message.read ? (
                  <CheckCheck className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-muted-foreground" />
                )
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
