"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react"

interface ChatHeaderProps {
  name: string
  status: string
  role: string
  unreadCount: number
  onBack?: () => void
  showBackButton?: boolean
}

export function ChatHeader({
  name,
  status,
  role,
  unreadCount,
  onBack,
  showBackButton,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-border/70 bg-background/85 px-4 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        {showBackButton ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 rounded-xl text-muted-foreground md:hidden"
          >
            <ArrowLeft className="size-5" />
          </Button>
        ) : null}

        <Avatar className="h-11 w-11 shrink-0">
          <AvatarFallback className="bg-secondary text-sm font-medium text-secondary-foreground">
            {name
              .split(" ")
              .map((namePart) => namePart[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground md:text-base">{name}</h2>
            <span className="inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
              {role}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex size-2 rounded-full bg-primary" />
            <span>{status}</span>
            {unreadCount > 0 ? (
              <>
                <span className="text-border">•</span>
                <span>{unreadCount} unread</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-xl border-border/70 bg-background/80">
            <Video className="size-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl border-border/70 bg-background/80">
            <Phone className="size-5" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-xl border-border/70 bg-background/80">
            <MoreVertical className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
