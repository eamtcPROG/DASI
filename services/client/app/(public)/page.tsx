import Link from "next/link"
import {
  ArrowRight,
  Globe,
  MessageCircle,
  Shield,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <MessageCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">Messenger</span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
            <Link href="/signin">Sign in</Link>
          </Button>
          <Button asChild className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-6 py-20 text-center">
        <div className="absolute inset-0 -z-10">
          <svg
            className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-30 md:h-[1200px] md:w-[1200px]"
            viewBox="0 0 800 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="greenGradient1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="oklch(0.7 0.2 160)" stopOpacity="0.6" />
                <stop offset="50%" stopColor="oklch(0.6 0.15 160)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="oklch(0.5 0.1 160)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="greenGradient2" cx="30%" cy="70%" r="60%">
                <stop offset="0%" stopColor="oklch(0.75 0.18 150)" stopOpacity="0.5" />
                <stop offset="60%" stopColor="oklch(0.65 0.12 155)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="oklch(0.55 0.1 160)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="greenGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="oklch(0.8 0.15 145)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="oklch(0.5 0.12 170)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <ellipse cx="400" cy="400" rx="350" ry="300" fill="url(#greenGradient1)" />
            <ellipse cx="300" cy="500" rx="280" ry="250" fill="url(#greenGradient2)" />
            <ellipse cx="550" cy="250" rx="200" ry="180" fill="url(#greenGradient3)" />
            <path
              d="M100 350 Q200 300 300 350 T500 350 T700 350"
              stroke="oklch(0.6 0.15 160)"
              strokeWidth="2"
              strokeOpacity="0.2"
              fill="none"
            />
            <path
              d="M100 400 Q200 350 300 400 T500 400 T700 400"
              stroke="oklch(0.65 0.12 155)"
              strokeWidth="1.5"
              strokeOpacity="0.15"
              fill="none"
            />
            <path
              d="M100 450 Q200 400 300 450 T500 450 T700 450"
              stroke="oklch(0.55 0.1 165)"
              strokeWidth="1"
              strokeOpacity="0.1"
              fill="none"
            />
          </svg>
        </div>

        <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-tight text-foreground md:text-5xl lg:text-6xl">
          Simple, fast, secure messaging
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground text-pretty">
          Connect with friends and family instantly. No ads, no gimmicks, just pure communication.
        </p>
        <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="h-12 rounded-xl px-8 font-medium">
            <Link href="/signup">
              Start messaging
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-xl border-border px-8 font-medium text-foreground hover:bg-muted"
          >
            <Link href="/chat">Open inbox</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Zap className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Lightning fast</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Messages delivered instantly. No delays, no waiting. Your conversations flow naturally.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Shield className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Gateway protected</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              The chat experience stays behind an authenticated layout backed by the gateway and identity services.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
              <Globe className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Works everywhere</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              Use Messenger on any device. Your chats sync seamlessly across all platforms.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <MessageCircle className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">Messenger</span>
          </div>
          <p className="text-sm text-muted-foreground">Simple messaging for everyone.</p>
        </div>
      </footer>
    </main>
  )
}
