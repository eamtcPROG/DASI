import Link from "next/link"
import { redirect } from "next/navigation"

import { getSessionFromCookie } from "@/lib/auth-server"
import { AnalyticsPageClient } from "./analytics-page-client"

export default async function AnalyticsPage() {
  const session = await getSessionFromCookie()
  if (!session) {
    redirect("/signin")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-sidebar/80 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
          <Link
            href="/chat"
            className="rounded-xl border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/60"
          >
            Back to Chat
          </Link>
        </div>
      </header>
      <main className="p-4 md:p-6">
        <AnalyticsPageClient />
      </main>
    </div>
  )
}

