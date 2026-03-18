"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BellDot, LogOut, MessageCircle, Plus, Search, ShieldCheck, Users } from "lucide-react"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getUserDisplayName, type UserDto } from "@/lib/auth"
import { CreateGroupModal } from "@/components/chat/create-group-modal"

type SidebarHeaderProps = {
  user: UserDto
  searchValue: string
  onSearchChange: (value: string) => void
  conversationCount: number
  onCreateGroup?: (data: {
    name: string
    description: string
    memberEmails: string[]
  }) => void
}

export function SidebarHeader({
  user,
  searchValue,
  onSearchChange,
  conversationCount,
  onCreateGroup,
}: SidebarHeaderProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
      })
    } finally {
      router.replace("/signin")
      router.refresh()
    }
  }

  return (
    <div className="border-b border-border/70 bg-sidebar/80 px-4 pb-4 pt-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <MessageCircle className="size-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Messenger</p>
            <p className="text-xs text-muted-foreground">Protected workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle className="rounded-xl border-border/70 bg-background/80" />
          <Button
            variant="outline"
            size="icon"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-xl border-border/70 bg-background/80"
            aria-label="Sign out"
          >
            {isSigningOut ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="mb-4 rounded-[24px] border border-border/70 bg-background/80 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{getUserDisplayName(user)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-foreground">
            <ShieldCheck className="size-3.5" />
            Secure
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <span>{conversationCount} conversations</span>
          <span className="inline-flex items-center gap-1">
            <BellDot className="size-3.5 text-primary" />
            Fresh updates
          </span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search people or messages"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-11 rounded-2xl border-border/70 bg-background/80 pl-9 text-foreground placeholder:text-muted-foreground"
        />
      </div>
      {onCreateGroup && (
        <CreateGroupModal onCreateGroup={onCreateGroup}>
          <Button
            className="w-full h-10 mt-4 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="size-4" />
            Create New Group
          </Button>
        </CreateGroupModal>
      )}
    </div>
  )
}
