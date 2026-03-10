"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react"

interface ChatHeaderProps {
  name: string
  status: string
  onBack?: () => void
  showBackButton?: boolean
}

export function ChatHeader({ name, status, onBack, showBackButton }: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 p-3 border-b border-border bg-card">
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0 md:hidden text-muted-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      <Avatar className="w-10 h-10 shrink-0">
        <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
          {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h2 className="font-medium text-foreground text-sm">{name}</h2>
        <p className="text-xs text-muted-foreground">{status}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Video className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Phone className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}
