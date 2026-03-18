"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Check, CheckCheck } from "lucide-react"

interface Message {
  id: string
  content: string
  time: string
  sent: boolean
  read: boolean
  senderName?: string
  senderId?: number
}

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 py-6 md:px-6">
      <div className="mx-auto rounded-full border border-border/70 bg-background/75 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
        Today
      </div>

      {messages.map((message) => (
        <div key={message.id} className={cn("flex", message.sent ? "justify-end" : "justify-start")}>
          <div
            className={cn(
              "max-w-[80%] rounded-3xl px-4 py-3 shadow-sm md:max-w-[70%]",
              message.sent
                ? "rounded-br-md bg-message-sent text-foreground"
                : "rounded-bl-md border border-border/70 bg-message-received text-foreground",
            )}
          >
            {/* Show sender name for received messages */}
            {!message.sent && message.senderName && (
              <div className="mb-1 text-xs font-medium text-primary">
                {message.senderName}
              </div>
            )}
            
            <p className="text-sm leading-7">{message.content}</p>
            <div
              className={cn(
                "mt-2 flex items-center gap-1",
                message.sent ? "justify-end" : "justify-start",
              )}
            >
              <span className="text-[10px] text-muted-foreground">{message.time}</span>
              {message.sent ? (
                message.read ? (
                  <CheckCheck className="size-3.5 text-primary" />
                ) : (
                  <Check className="size-3.5 text-muted-foreground" />
                )
              ) : null}
            </div>
          </div>
        </div>
      ))}
      
      {/* Hidden element to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  )
}
