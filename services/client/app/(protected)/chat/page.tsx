import { ChatPage } from "@/components/chat/chat-page"
import { requireUser } from "@/lib/auth-server"

export default async function ProtectedChatPage() {
  const user = await requireUser()

  return <ChatPage user={user} />
}
