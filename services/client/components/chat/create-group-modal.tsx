"use client"

import { useState } from "react"
import { Plus, X, Users } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface CreateGroupModalProps {
  onCreateGroup: (data: {
    name: string
    description: string
    memberEmails: string[]
  }) => void
  children: React.ReactNode
}

export function CreateGroupModal({ onCreateGroup, children }: CreateGroupModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [memberEmails, setMemberEmails] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleAddEmail = () => {
    const email = emailInput.trim()
    console.log("➕ Adding email:", email, "Current emails:", memberEmails)
    if (email && !memberEmails.includes(email)) {
      setMemberEmails([...memberEmails, email])
      setEmailInput("")
    }
  }

  const handleRemoveEmail = (email: string) => {
    console.log("➖ Removing email:", email)
    setMemberEmails(memberEmails.filter(e => e !== email))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddEmail()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    console.log("📝 Form submission data:", {
      name: name.trim(),
      description: description.trim(),
      memberEmails,
      emailInput,
    })

    setIsLoading(true)
    try {
      await onCreateGroup({
        name: name.trim(),
        description: description.trim(),
        memberEmails,
      })
      setOpen(false)
      setName("")
      setDescription("")
      setMemberEmails([])
    } catch (error) {
      console.error("Failed to create group:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Create New Group
          </DialogTitle>
          <DialogDescription>
            Create a new chat group and add members by their email addresses.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Group Name *
            </label>
            <Input
              id="name"
              placeholder="Enter group name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </label>
            <Textarea
              id="description"
              placeholder="Enter group description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="emails" className="text-sm font-medium">
              Add Members (by email)
            </label>
            <div className="flex gap-2">
              <Input
                id="emails"
                type="email"
                placeholder="Enter email address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddEmail}
                disabled={!emailInput.trim()}
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {memberEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {memberEmails.map((email) => (
                  <Badge
                    key={email}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
