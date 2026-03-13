"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { MessageCircleMore, SearchX } from "lucide-react"

import { SidebarHeader } from "@/components/chat/sidebar-header"
import { ChatList } from "@/components/chat/chat-list"
import { ChatHeader } from "@/components/chat/chat-header"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { type UserDto, getUserDisplayName } from "@/lib/auth"
import { getSocket, disconnectSocket } from "@/lib/socket"
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
  const typingTimeouts = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    fetch("/api/auth/users?onPage=50")
      .then((res) => res.json())
      .then((data) => {
        const users: UserDto[] = data?.objects ?? []
        const filtered = users.filter((u) => u.id !== user.id)
        setChats(
          filtered.map((u) => ({
            id: String(u.id),
            name: getUserDisplayName(u),
            lastMessage: "",
            time: "",
            unread: 0,
            status: "Offline",
            role: u.email,
            pinned: false,
          })),
        )
      })
      .catch(() => {})
  }, [user.id])

  useEffect(() => {
    const socket = getSocket(token)

    socket.on("message:receive", (msg: IncomingMessage) => {
      const chatId = String(msg.senderId)
      const newMessage: Message = {
        id: msg.id,
        content: msg.content,
        time: new Date(msg.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        sent: false,
        read: false,
      }

      setMessages((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] ?? []), newMessage],
      }))

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? { ...chat, lastMessage: msg.content, time: "Now", unread: chat.unread + 1 }
            : chat,
        ),
      )
    })

    socket.on("message:sent", (msg: IncomingMessage) => {
      const chatId = String(
        selectedChatRef.current ?? 0,
      )
      setMessages((prev) => {
        const existing = prev[chatId] ?? []
        return {
          ...prev,
          [chatId]: existing.map((m) =>
            m.id === `pending-${msg.id}` ? { ...m, id: msg.id, read: false } : m,
          ),
        }
      })
    })

    socket.on("message:typing", ({ senderId, isTyping }: { senderId: number; isTyping: boolean }) => {
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
      socket.off("message:receive")
      socket.off("message:sent")
      socket.off("message:typing")
      disconnectSocket()
    }
  }, [token])

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

  const handleSendMessage = (content: string) => {
    if (!selectedChat) return

    const socket = getSocket(token)
    const recipientId = Number(selectedChat)

    const pendingId = `pending-${Date.now()}`
    const optimisticMessage: Message = {
      id: pendingId,
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

    socket.emit("message:send", { recipientId, content })
  }

  const handleSelectChat = (id: string) => {
    setSelectedChat(id)
    setChats((prev) =>
      prev.map((chat) => (chat.id === id ? { ...chat, unread: 0 } : chat)),
    )
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
                role={selectedChatData.role}
                unreadCount={selectedChatData.unread}
                showBackButton
                onBack={() => setSelectedChat(null)}
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
    </div>
  )
}
