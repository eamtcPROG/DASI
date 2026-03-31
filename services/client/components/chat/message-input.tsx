"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip } from "lucide-react"
import { EmojiPicker } from "./emoji-picker"

interface MessageInputProps {
  onSend: (message: string) => void
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSend(message.trim())
      setMessage("")
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage((current) => current + emoji)
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border/70 bg-background/85 px-4 py-4 backdrop-blur">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-border/70 bg-card/85 p-3 shadow-lg shadow-primary/5">
        <div className="flex items-center gap-2">
          <EmojiPicker onSelect={handleEmojiSelect} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-2xl text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="size-5" />
          </Button>
          <Input
            type="text"
            placeholder="Write a message..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="h-11 flex-1 rounded-full border-border/70 bg-background px-4 text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90"
            disabled={!message.trim()}
          >
            <Send className="size-5" />
          </Button>
        </div>
        <p className="mt-2 px-2 text-xs text-muted-foreground">
          Press Enter to send.
        </p>
      </div>
    </form>
  )
}
