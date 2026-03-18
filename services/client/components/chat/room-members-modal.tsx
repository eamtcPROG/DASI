"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Crown, Ban } from "lucide-react"

type RoomMember = {
  userId: number
  email: string
  displayName: string
  role: number
  joinedAt: string
}

interface RoomMembersModalProps {
  isOpen: boolean
  onClose: () => void
  roomId: number
  roomName: string
}

export function RoomMembersModal({ isOpen, onClose, roomId, roomName }: RoomMembersModalProps) {
  const [members, setMembers] = useState<RoomMember[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && roomId) {
      loadMembers()
    }
  }, [isOpen, roomId])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/chat/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId })
      })

      const data = await response.json()

      if (response.ok && !data.error) {
        setMembers(data.object || [])
      } else {
        console.error("❌ Failed to load room members:", data.messages?.[0]?.message)
      }
    } catch (error) {
      console.error("❌ Error loading room members:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: number) => {
    switch (role) {
      case 0:
        return <Badge variant="destructive" className="text-xs">Banned</Badge>
      case 1:
        return <Badge variant="secondary" className="text-xs">Member</Badge>
      case 2:
        return <Badge variant="default" className="text-xs"><Crown className="w-3 h-3 mr-1" />Moderator</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {roomName} Members
          </DialogTitle>
          <DialogDescription>
            View all members currently in this room
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading members...</div>
            </div>
          ) : members.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">No members found</div>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {members.map((member) => (
                <div key={member.userId} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-secondary text-sm font-medium">
                      {member.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {member.displayName}
                      </p>
                      {getRoleBadge(member.role)}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(member.joinedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
