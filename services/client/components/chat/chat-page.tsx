"use client"

import { useState } from "react"

import { SidebarHeader } from "@/components/chat/sidebar-header"
import { ChatList } from "@/components/chat/chat-list"
import { ChatHeader } from "@/components/chat/chat-header"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { type UserDto } from "@/lib/auth"
import { cn } from "@/lib/utils"

const DEMO_CHATS = [
  { id: "1", name: "Sarah Wilson", lastMessage: "That sounds great!", time: "12:45", unread: 2 },
  { id: "2", name: "Alex Chen", lastMessage: "See you tomorrow", time: "11:30", unread: 0 },
  { id: "3", name: "Team Project", lastMessage: "Meeting at 3pm", time: "10:15", unread: 5 },
  { id: "4", name: "John Smith", lastMessage: "Thanks for your help", time: "Yesterday", unread: 0 },
  { id: "5", name: "Emma Davis", lastMessage: "Sure, I'll send it over", time: "Yesterday", unread: 0 },
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

  const selectedChatData = chats.find((chat) => chat.id === selectedChat)

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
    <div className="flex h-screen bg-background">
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-r border-border bg-card md:w-80 lg:w-96",
          selectedChat && "hidden md:flex",
        )}
      >
        <SidebarHeader user={user} />
        <div className="flex-1 overflow-y-auto">
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
          />
        </div>
      </aside>

      <main className={cn("flex flex-1 flex-col", !selectedChat && "hidden md:flex")}>
        {selectedChat && selectedChatData ? (
          <>
            <ChatHeader
              name={selectedChatData.name}
              status="online"
              showBackButton
              onBack={() => setSelectedChat(null)}
            />
            <div className="flex-1 overflow-y-auto bg-background">
              <MessageList messages={messages[selectedChat] || []} />
            </div>
            <MessageInput onSend={handleSendMessage} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-muted/30">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <svg
                  className="h-8 w-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground">Select a conversation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a chat to start messaging
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
