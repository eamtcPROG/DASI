"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Check, CheckCheck, Pencil, Trash2, X } from "lucide-react"

interface Message {
  id: string
  content: string
  time: string
  sent: boolean
  read: boolean
  isEdited?: boolean
  senderName?: string
  senderId?: number
  messageType?: string
  fileName?: string | null
}

interface MessageListProps {
  messages: Message[]
  onEditMessage?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
}

export function MessageList({ messages, onEditMessage, onDeleteMessage }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startEdit = (message: Message) => {
    setEditingId(message.id)
    setEditContent(message.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent("")
  }

  const submitEdit = (messageId: string) => {
    const trimmed = editContent.trim()
    if (trimmed && onEditMessage) {
      onEditMessage(messageId, trimmed)
    }
    setEditingId(null)
    setEditContent("")
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 py-6 md:px-6">
      <div className="mx-auto rounded-full border border-border/70 bg-background/75 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
        Today
      </div>

      {messages.map((message) => (
        <div key={message.id} className={cn("group flex", message.sent ? "justify-end" : "justify-start")}>
          {/* Action buttons — only on own messages */}
          {message.sent && editingId !== message.id && (
            <div className="mr-2 flex items-center gap-1 self-center opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => startEdit(message)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Edit message"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                onClick={() => onDeleteMessage?.(message.id)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Delete message"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}

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

            {editingId === message.id ? (
              <div className="flex flex-col gap-2">
                <textarea
                  className="w-full resize-none rounded-lg bg-background/60 px-2 py-1 text-sm text-foreground outline-none ring-1 ring-border focus:ring-primary"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      submitEdit(message.id)
                    }
                    if (e.key === "Escape") cancelEdit()
                  }}
                  autoFocus
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                  >
                    <X className="size-3" /> Cancel
                  </button>
                  <button
                    onClick={() => submitEdit(message.id)}
                    className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground hover:bg-primary/90"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : message.messageType === "image" ? (
              <div className="space-y-1">
                <img
                  src={message.content}
                  alt={message.fileName || "Image"}
                  className="max-h-64 max-w-full rounded-xl object-contain cursor-pointer"
                  onClick={() => window.open(message.content, "_blank")}
                />
                {message.fileName && (
                  <p className="text-xs text-muted-foreground truncate">{message.fileName}</p>
                )}
              </div>
            ) : (
              <p className="text-sm leading-7">{message.content}</p>
            )}

            <div
              className={cn(
                "mt-2 flex items-center gap-1",
                message.sent ? "justify-end" : "justify-start",
              )}
            >
              {message.isEdited && (
                <span className="text-[10px] italic text-muted-foreground">(edited)</span>
              )}
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
