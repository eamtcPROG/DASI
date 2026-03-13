import type { ReactNode } from "react"

import { redirectIfAuthenticated } from "@/lib/auth-server"

type PublicLayoutProps = {
  children: ReactNode
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  await redirectIfAuthenticated()

  return children
}
