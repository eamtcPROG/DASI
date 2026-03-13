"use client"

import { useMemo, useState } from "react"
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
import { type UserDto } from "@/lib/auth"
import { cn } from "@/lib/utils"

const DEMO_CHATS = [
  {
    id: "1",
    name: "Sarah Wilson",
    lastMessage: "That sounds great! Let's share the final draft this afternoon.",
    time: "12:45",
    unread: 2,
    status: "Online",
    role: "Product design",
    pinned: true,
  },
  {
    id: "2",
    name: "Alex Chen",
    lastMessage: "See you tomorrow after stand-up.",
    time: "11:30",
    unread: 0,
    status: "In focus mode",
    role: "Engineering",
    pinned: false,
  },
  {
    id: "3",
    name: "Team Project",
    lastMessage: "Meeting at 3pm. Bring the updated dashboard screenshots.",
    time: "10:15",
    unread: 5,
    status: "5 people active",
    role: "Shared channel",
    pinned: true,
  },
  {
    id: "4",
    name: "John Smith",
    lastMessage: "Thanks for your help with the rollout plan.",
    time: "Yesterday",
    unread: 0,
    status: "Away",
    role: "Operations",
    pinned: false,
  },
  {
    id: "5",
    name: "Emma Davis",
    lastMessage: "Sure, I'll send it over with annotated comments.",
    time: "Yesterday",
    unread: 0,
    status: "Offline",
    role: "Marketing",
    pinned: false,
  },
]

const DEMO_MESSAGES: Record<
  string,
  { id: string; content: string; time: string; sent: boolean; read: boolean }[]
> = {
  "1": [
    { id: "1", content: "Hey! How are you?", time: "12:30", sent: false, read: true },
    { id: "2", content: "I'm good, thanks! Just finished my project.", time: "12:32", sent: true, read: true },
    { id: "3", content: "That's awesome! Want to grab coffee later?", time: "12:40", sent: false, read: true },
    { id: "4", content: "That sounds great!", time: "12:45", sent: false, read: true },
  ],
  "2": [
    { id: "1", content: "Are we still on for tomorrow?", time: "11:20", sent: true, read: true },
    { id: "2", content: "Yes! Looking forward to it", time: "11:25", sent: false, read: true },
    { id: "3", content: "See you tomorrow", time: "11:30", sent: false, read: true },
  ],
  "3": [
    { id: "1", content: "Don't forget the meeting today", time: "10:00", sent: false, read: true },
    { id: "2", content: "Got it, I'll be there", time: "10:05", sent: true, read: true },
    { id: "3", content: "Meeting at 3pm", time: "10:15", sent: false, read: true },
  ],
  "4": [
    { id: "1", content: "Could you help me with the report?", time: "Yesterday", sent: false, read: true },
    { id: "2", content: "Of course! Let me take a look", time: "Yesterday", sent: true, read: true },
    { id: "3", content: "Thanks for your help", time: "Yesterday", sent: false, read: true },
  ],
  "5": [
    { id: "1", content: "Do you have the files?", time: "Yesterday", sent: true, read: true },
    { id: "2", content: "Sure, I'll send it over", time: "Yesterday", sent: false, read: true },
  ],
}

type ChatPageProps = {
  user: UserDto
}

export function ChatPage({ user }: ChatPageProps) {
  const [selectedChat, setSelectedChat] = useState<string | null>("1")
  const [chats, setChats] = useState(DEMO_CHATS)
  const [messages, setMessages] = useState(DEMO_MESSAGES)
  const [search, setSearch] = useState("")

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return chats
    }

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
    if (!selectedChat) {
      return
    }

    const newMessage = {
      id: Date.now().toString(),
      content,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      sent: true,
      read: false,
    }

    setMessages((previousMessages) => ({
      ...previousMessages,
      [selectedChat]: [...(previousMessages[selectedChat] || []), newMessage],
    }))

    setChats((previousChats) =>
      previousChats.map((chat) =>
        chat.id === selectedChat ? { ...chat, lastMessage: content, time: "Now" } : chat,
      ),
    )
  }

  const handleSelectChat = (id: string) => {
    setSelectedChat(id)
    setChats((previousChats) =>
      previousChats.map((chat) => (chat.id === id ? { ...chat, unread: 0 } : chat)),
    )
  }

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
                status={selectedChatData.status}
                role={selectedChatData.role}
                unreadCount={selectedChatData.unread}
                showBackButton
                onBack={() => setSelectedChat(null)}
              />
              <div className="flex-1 overflow-y-auto">
                <MessageList messages={messages[selectedChat] || []} />
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
                    Open a chat from the left to see the refreshed header, cleaner message layout, and updated composer.
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
