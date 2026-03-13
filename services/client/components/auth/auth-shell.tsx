import type { ReactNode } from "react"
import Link from "next/link"
import { MessageCircle } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AuthShellProps = {
  title: string
  description: string
  footerText: string
  footerHref: string
  footerLabel: string
  children: ReactNode
}

export function AuthShell({
  title,
  description,
  footerText,
  footerHref,
  footerLabel,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center justify-center">
        <Card className="w-full border-border/60 bg-card/95 shadow-lg">
          <CardHeader className="items-center text-center">
            <Link href="/" className="mb-2 flex items-center gap-3 text-foreground">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                <MessageCircle className="h-7 w-7 text-primary-foreground" />
              </div>
            </Link>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
            <p className="text-center text-sm text-muted-foreground">
              {footerText}{" "}
              <Link href={footerHref} className="font-medium text-primary hover:underline">
                {footerLabel}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
