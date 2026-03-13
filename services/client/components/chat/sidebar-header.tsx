"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getUserDisplayName, type UserDto } from "@/lib/auth"
import { LogOut, MessageCircle, Search } from "lucide-react"

type SidebarHeaderProps = {
  user: UserDto
}

export function SidebarHeader({ user }: SidebarHeaderProps) {
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
    <div className="p-3 border-b border-border bg-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">Messenger</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="gap-2 rounded-lg border-border/70 bg-background text-foreground hover:bg-muted"
          aria-label="Sign out"
        >
          {isSigningOut ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
          <span>{isSigningOut ? "Signing out" : "Sign out"}</span>
        </Button>
      </div>
      <div className="mb-3">
        <p className="text-sm font-medium text-foreground">{getUserDisplayName(user)}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search"
          className="pl-9 h-9 bg-muted border-0 rounded-lg text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}
