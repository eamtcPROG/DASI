"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip, Smile } from "lucide-react"

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

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border bg-card">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <Paperclip className="w-5 h-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <Smile className="w-5 h-5" />
      </Button>
      <Input
        type="text"
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 h-10 bg-muted border-0 rounded-full px-4 text-foreground placeholder:text-muted-foreground"
      />
      <Button
        type="submit"
        size="icon"
        className="shrink-0 w-10 h-10 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
        disabled={!message.trim()}
      >
        <Send className="w-5 h-5" />
      </Button>
    </form>
  )
}
