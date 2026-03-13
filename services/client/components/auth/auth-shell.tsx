import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react"

import { ThemeToggle } from "@/components/ui/theme-toggle"
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
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back home
          </Link>
          <ThemeToggle className="rounded-xl border-border/70 bg-background/70 backdrop-blur" />
        </div>

        <div className="grid min-h-[calc(100vh-7rem)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,460px)]">
          <section className="relative hidden overflow-hidden rounded-[32px] border border-border/70 bg-card/70 p-10 shadow-sm lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/15" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-primary" />
                Guided authentication flow
              </div>
              <h1 className="mt-6 max-w-xl text-5xl font-semibold tracking-tight text-foreground">
                Step into a calmer inbox with a more confident account experience.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                The updated client makes account access clearer, reduces friction, and prepares users for the
                protected workspace the moment they arrive.
              </p>
            </div>

            <div className="relative grid gap-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "Clear trust signals",
                  description: "A stronger shell and softer surfaces make the auth flow feel more reliable.",
                },
                {
                  icon: CheckCircle2,
                  title: "Focused form controls",
                  description: "Labels, guidance, and password visibility reduce input uncertainty.",
                },
              ].map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
                <div
                  key={itemTitle}
                  className="rounded-3xl border border-border/60 bg-background/75 p-5 shadow-sm backdrop-blur"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h2 className="font-medium text-foreground">{itemTitle}</h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{itemDescription}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm backdrop-blur">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <MessageCircle className="size-6" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Messenger workspace</p>
                    <p className="text-sm text-muted-foreground">Secure access. Faster scanning. Better focus.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md rounded-[32px] border-border/70 bg-card/92 shadow-2xl shadow-primary/8 backdrop-blur">
              <CardHeader className="items-center pb-4 text-center">
                <Link href="/" className="mb-3 flex items-center gap-3 text-foreground">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                    <MessageCircle className="h-7 w-7 text-primary-foreground" />
                  </div>
                </Link>
                <CardTitle className="text-3xl tracking-tight">{title}</CardTitle>
                <CardDescription className="max-w-sm text-sm leading-6">{description}</CardDescription>
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
        </div>
      </div>
    </main>
  )
}
