"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MessageCircleMore, SearchX } from "lucide-react"

import { SidebarHeader } from "@/components/chat/sidebar-header"
import { ChatList } from "@/components/chat/chat-list"
import { ChatHeader } from "@/components/chat/chat-header"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { RoomMembersModal } from "@/components/chat/room-members-modal"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { type UserDto, getUserDisplayName } from "@/lib/auth"
import { getSocket, disconnectSocket, getSocketStatus } from "@/lib/socket"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  content: string
  time: string
  sent: boolean
  read: boolean
}

type Chat = {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
  status: string
  role: string
  pinned: boolean
}

type IncomingMessage = {
  id: string
  senderId: number
  senderEmail: string
  content: string
  timestamp: string
}

type ChatPageProps = {
  user: UserDto
  token: string
}

export function ChatPage({ user, token }: ChatPageProps) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [search, setSearch] = useState("")
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set())
  const [showMembersModal, setShowMembersModal] = useState(false)
  const typingTimeouts = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const loadUserRooms = async () => {
      try {
        const response = await fetch("/api/chat/rooms")

        const data = await response.json()
        
        const rooms = data?.object ?? []

        setChats(
          rooms.map((room: any) => ({
            id: String(room.id),
            name: room.name,
            lastMessage: "",
            time: "",
            unread: 0,
            status: "Offline",
            description: room.description,
            pinned: false,
          }))
        )
        
        // Automatically select the first room if none is selected
        if (rooms.length > 0 && !selectedChat) {
          setSelectedChat(String(rooms[0].id))
        }
      } catch (error) {
        console.error("❌ Error loading user rooms:", error)
      }
    }

    loadUserRooms()
  }, [user.id])

  // Auto-load room history when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      const socket = getSocket(token)
      // Emit join room event to load history
      socket.emit("chat:join_room", { roomId: Number(selectedChat) })
    }
  }, [selectedChat, token])

  // Auto-join all rooms to receive real-time messages
  useEffect(() => {
    const socket = getSocket(token)
    if (chats.length > 0) {
      chats.forEach(chat => {
        socket.emit("chat:join_room", { roomId: Number(chat.id) })
      })
    }
  }, [chats, token])

  useEffect(() => {
    // Connect to WebSocket immediately when page loads
    const socket = getSocket(token)

    socket.on("chat:new_message", (data) => {
      const { roomId, message } = data
      const chatId = String(roomId)
      const newMessage: Message = {
        id: String(message.id),
        content: message.content,
        time: new Date(message.created_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        sent: message.user_id === user.id,
        read: false,
        senderName: message.user_id === user.id ? undefined : (
          message.user?.firstName && message.user?.lastName 
            ? `${message.user.firstName} ${message.user.lastName}`
            : message.user?.firstName || message.user?.lastName || message.user?.email || `User ${message.user_id}`
        ),
        senderId: message.user_id,
      }

      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] ?? []), newMessage],
      }))

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { 
                ...chat, 
                lastMessage: message.content, 
                time: "Now", 
                unread: selectedChatRef.current === chatId ? chat.unread : chat.unread + 1 
              }
            : chat,
        ),
      )
    })

    socket.on("chat:history", (data) => {
      const { roomId, messages: historyMessages } = data
      const chatId = String(roomId)
      
      const formattedMessages = historyMessages.map((msg: any) => ({
        id: String(msg.id),
        content: msg.content,
        time: new Date(msg.created_at).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        sent: msg.user_id === user.id,
        read: false,
        senderName: msg.user_id === user.id ? undefined : (
          msg.user?.firstName && msg.user?.lastName 
            ? `${msg.user.firstName} ${msg.user.lastName}`
            : msg.user?.firstName || msg.user?.lastName || msg.user?.email || `User ${msg.user_id}`
        ),
        senderId: msg.user_id,
      }))
      
      setMessages((prev) => ({
        ...prev,
        [chatId]: formattedMessages,
      }))
    })

    socket.on("chat:room_created", (data) => {
      const { room } = data
      const newRoom = {
        id: String(room.id),
        name: room.name,
        lastMessage: "",
        time: new Date().toLocaleTimeString(),
        unread: 0,
        status: "active",
        description: room.description,
        pinned: false
      }

      setChats((prev) => [newRoom, ...prev])
      setSelectedChat(String(room.id))
    })

    socket.on("chat:room_invitation", (data) => {
      const { room, invitedBy } = data
      const newRoom = {
        id: String(room.id),
        name: room.name,
        lastMessage: "",
        time: new Date().toLocaleTimeString(),
        unread: 1,
        status: "active",
        description: room.description,
        pinned: false
      }

      setChats((prev) => {
        const existing = prev.find(chat => chat.id === String(room.id))
        if (existing) {
          return prev.map(chat => 
            chat.id === String(room.id) 
              ? { ...chat, unread: chat.unread + 1 }
              : chat
          )
        } else {
          return [newRoom, ...prev]
        }
      })
    })

    socket.on("chat:typing", ({ senderId, isTyping }: { senderId: number; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev)
        if (isTyping) {
          next.add(senderId)
          const existing = typingTimeouts.current.get(senderId)
          if (existing) clearTimeout(existing)
          typingTimeouts.current.set(
            senderId,
            setTimeout(() => {
              setTypingUsers((s) => {
                const n = new Set(s)
                n.delete(senderId)
                return n
              })
            }, 3000),
          )
        } else {
          next.delete(senderId)
        }
        return next
      })

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === String(senderId)
            ? { ...chat, status: isTyping ? "Typing..." : "Online" }
            : chat,
        ),
      )
    })

    return () => {
      console.log("🧹 Cleaning up WebSocket listeners...")
      socket.off("chat:new_message")
      socket.off("chat:history")
      socket.off("chat:room_created")
      socket.off("chat:room_invitation")
      socket.off("chat:typing")
      disconnectSocket()
    }
  }, [token, user.id])

  const selectedChatRef = useRef<string | null>(null)
  selectedChatRef.current = selectedChat

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return chats
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(query) || chat.lastMessage.toLowerCase().includes(query),
    )
  }, [chats, search])

  const pinnedChats = search ? [] : filteredChats.filter((chat) => chat.pinned)
  const recentChats = search ? filteredChats : filteredChats.filter((chat) => !chat.pinned)
  const selectedChatData = chats.find((chat) => chat.id === selectedChat)
  const hasSearchResults = filteredChats.length > 0

  const handleLeaveRoom = async () => {
    if (!selectedChat) return

    try {
      const response = await fetch("/api/chat/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: Number(selectedChat) })
      })

      const data = await response.json()

      if (response.ok && !data.error) {
        // Remove the chat from the list and deselect it
        setChats((prev) => prev.filter((chat) => chat.id !== selectedChat))
        setSelectedChat(null)
      } else {
        console.error("Failed to leave room:", data.messages?.[0]?.message || "Unknown error")
      }
    } catch (error) {
      console.error("❌ Error leaving room:", error)
    }
  }

  const handleSendMessage = (content: string) => {
    if (!selectedChat) return

    const socket = getSocket(token)
    const roomId = Number(selectedChat)

    const optimisticMessage: Message = {
      id: `pending-${Date.now()}`,
      content,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      sent: true,
      read: false,
    }

    setMessages((prev) => ({
      ...prev,
      [selectedChat]: [...(prev[selectedChat] ?? []), optimisticMessage],
    }))

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChat ? { ...chat, lastMessage: content, time: "Now" } : chat,
      ),
    )

    socket.emit("chat:send_message", {
      roomId,
      userId: user.id,
      content
    })
  }

  const handleCreateGroup = async (data: {
    name: string
    description: string
    memberEmails: string[]
  }) => {
    const socket = getSocket(token)
    
    // Use WebSocket to create room
    socket.emit("chat:create_room", {
      name: data.name,
      description: data.description,
      creatorId: user.id,
      memberEmails: data.memberEmails,
    })
  }

  const handleShowMembers = () => {
    setShowMembersModal(true)
  }

  const handleSelectChat = (id: string) => {
    setSelectedChat(id)
    setChats((prev) =>
      prev.map((chat) => (chat.id === id ? { ...chat, unread: 0 } : chat)),
    )
    
    // Join the room to get history
    const socket = getSocket(token)
    socket.emit("chat:join_room", {
      roomId: Number(id),
      userId: user.id
    })
  }

  const selectedChatTyping =
    selectedChat !== null && typingUsers.has(Number(selectedChat))

  return (
    <div className="min-h-screen p-3 md:p-4">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] max-w-[1500px] overflow-hidden rounded-[32px] border border-border/70 bg-card/75 shadow-2xl shadow-primary/10 backdrop-blur md:h-[calc(100vh-2rem)]">
        <aside
          className={cn(
            "flex w-full shrink-0 flex-col border-r border-border/70 bg-sidebar/90 md:w-[360px] lg:w-[400px]",
            selectedChat && "hidden md:flex",
          )}
        >
          <SidebarHeader
            user={user}
            searchValue={search}
            onSearchChange={setSearch}
            conversationCount={chats.length}
            onCreateGroup={handleCreateGroup}
          />
          <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
            {hasSearchResults ? (
              <>
                {pinnedChats.length > 0 ? (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between pt-1">
                      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Pinned
                      </h2>
                      <span className="text-xs text-muted-foreground">{pinnedChats.length}</span>
                    </div>
                    <ChatList
                      chats={pinnedChats}
                      selectedChat={selectedChat}
                      onSelectChat={handleSelectChat}
                    />
                  </section>
                ) : null}

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {search ? "Search results" : "Recent conversations"}
                    </h2>
                    <span className="text-xs text-muted-foreground">{recentChats.length}</span>
                  </div>
                  <ChatList
                    chats={recentChats}
                    selectedChat={selectedChat}
                    onSelectChat={handleSelectChat}
                  />
                </section>
              </>
            ) : (
              <Empty className="mt-8 rounded-[28px] border border-dashed border-border/80 bg-background/60 py-14">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-12 rounded-2xl bg-primary/12 text-primary">
                    <SearchX className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>No conversations match</EmptyTitle>
                  <EmptyDescription>
                    Try a different name or keyword to find the message you want faster.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </aside>

        <main
          className={cn(
            "relative flex flex-1 flex-col bg-background/70",
            !selectedChat && "hidden md:flex",
          )}
        >
          {selectedChat && selectedChatData ? (
            <>
              <ChatHeader
                name={selectedChatData.name}
                status={selectedChatTyping ? "Typing..." : selectedChatData.status}
                description={selectedChatData.description}
                unreadCount={selectedChatData.unread}
                showBackButton
                onBack={() => setSelectedChat(null)}
                onLeaveRoom={handleLeaveRoom}
                onShowMembers={handleShowMembers}
              />
              <div className="flex-1 overflow-y-auto">
                <MessageList messages={messages[selectedChat] ?? []} />
              </div>
              <MessageInput onSend={handleSendMessage} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <Empty className="max-w-xl rounded-[32px] border border-dashed border-border/80 bg-card/65 py-16">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="size-14 rounded-2xl bg-primary/12 text-primary">
                    <MessageCircleMore className="size-7" />
                  </EmptyMedia>
                  <EmptyTitle>Select a conversation</EmptyTitle>
                  <EmptyDescription>
                    Open a chat from the left to start messaging.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </main>
      </div>

      {/* Room Members Modal */}
      {selectedChat && selectedChatData && (
        <RoomMembersModal
          isOpen={showMembersModal}
          onClose={() => setShowMembersModal(false)}
          roomId={Number(selectedChat)}
          roomName={selectedChatData.name}
        />
      )}
    </div>
  )
}
