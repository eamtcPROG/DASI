"use client"

import { Smile } from "lucide-react"
import EmojiPickerLib, { type EmojiClickData, Theme } from "emoji-picker-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTheme } from "next-themes"

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const { resolvedTheme } = useTheme()

  const handleClick = (data: EmojiClickData) => {
    onSelect(data.emoji)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-2xl text-muted-foreground hover:text-foreground"
          aria-label="Open emoji picker"
        >
          <Smile className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-auto border-none p-0" sideOffset={8}>
        <EmojiPickerLib
          onEmojiClick={handleClick}
          theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
          lazyLoadEmojis
        />
      </PopoverContent>
    </Popover>
  )
}
