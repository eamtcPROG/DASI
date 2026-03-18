import { redirect } from "next/navigation"

import { ChatPage } from "@/components/chat/chat-page"
import { getSessionFromCookie } from "@/lib/auth-server"

export default async function ProtectedChatPage() {
  const session = await getSessionFromCookie()

  if (!session) {
    redirect("/signin")
  }

  return <ChatPage user={session.user} token={session.access_token} />
}
