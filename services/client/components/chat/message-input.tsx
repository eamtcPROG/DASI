"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Paperclip, X } from "lucide-react"
import { EmojiPicker } from "./emoji-picker"

interface MessageInputProps {
  onSend: (message: string) => void
  onSendFile?: (base64: string, fileName: string) => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/gif,image/webp"

export function MessageInput({ onSend, onSendFile }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [imagePreview, setImagePreview] = useState<{ base64: string; name: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (imagePreview) {
      onSendFile?.(imagePreview.base64, imagePreview.name)
      setImagePreview(null)
      return
    }
    if (message.trim()) {
      onSend(message.trim())
      setMessage("")
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage((current) => current + emoji)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      alert("File size must be under 5 MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setImagePreview({ base64: result, name: file.name })
    }
    reader.readAsDataURL(file)

    // Reset input so the same file can be re-selected
    e.target.value = ""
  }

  const clearPreview = () => {
    setImagePreview(null)
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border/70 bg-background/85 px-4 py-4 backdrop-blur">
      <div className="mx-auto max-w-4xl rounded-[28px] border border-border/70 bg-card/85 p-3 shadow-lg shadow-primary/5">
        {imagePreview && (
          <div className="relative mb-3 inline-block">
            <img
              src={imagePreview.base64}
              alt={imagePreview.name}
              className="max-h-48 rounded-xl border border-border/70 object-contain"
            />
            <button
              type="button"
              onClick={clearPreview}
              className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90"
            >
              <X className="size-3.5" />
            </button>
            <p className="mt-1 text-xs text-muted-foreground truncate max-w-[200px]">{imagePreview.name}</p>
          </div>
        )}
        <div className="flex items-center gap-2">
          <EmojiPicker onSelect={handleEmojiSelect} />
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-2xl text-muted-foreground hover:text-foreground disabled:opacity-40"
            onClick={() => fileInputRef.current?.click()}
            disabled={!!imagePreview}
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
            disabled={!message.trim() && !imagePreview}
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
