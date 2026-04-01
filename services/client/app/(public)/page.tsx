import Link from "next/link"
import Image from "next/image"
import {
  ArrowUpRight,
  ArrowRight,
  CheckCircle2,
  Globe,
  MessageCircle,
  ShieldCheck,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react"

import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center justify-center">
                <Image src="/web-app-manifest-512x512.png" alt="Logo" width={40} height={40} className="size-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Converso</p>
              <p className="text-xs text-muted-foreground">Protected conversations</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#experience" className="transition-colors hover:text-foreground">
              Experience
            </a>
            <a href="#cta" className="transition-colors hover:text-foreground">
              Get started
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle className="rounded-xl border-border/70 bg-background/80" />
            <Button asChild variant="ghost" className="hidden rounded-xl sm:inline-flex">
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button asChild className="rounded-xl px-5 shadow-lg shadow-primary/20">
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-14 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_480px] lg:items-center lg:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <Sparkles className="size-4 text-primary" />
            Redesigned inbox, smarter onboarding, better focus
          </div>

          <h1 className="mt-6 max-w-3xl text-balance text-5xl font-semibold tracking-tight text-foreground md:text-6xl xl:text-7xl">
            Messaging that feels calm, clear, and ready for real work.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Messenger now guides people from sign-up to conversation with a cleaner visual hierarchy,
            safer account flow, and a chat workspace built for quick scanning.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-xl px-7 shadow-lg shadow-primary/20">
              <Link href="/signup">
                Start messaging
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-xl border-border/70 bg-background/80 px-7"
            >
              <Link href="/signin">
                Explore the sign-in flow
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {[
              "Protected by gateway-auth session checks",
              "Responsive layout from landing page to chat",
              "Dark mode ready with one tap",
            ].map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-muted-foreground shadow-sm"
              >
                <CheckCircle2 className="size-4 text-primary" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { value: "3x", label: "clearer content hierarchy" },
              { value: "1 tap", label: "theme switching" },
              { value: "0 clutter", label: "focused inbox layout" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-border/70 bg-card/75 p-5 shadow-sm">
                <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[32px] bg-primary/10 blur-3xl" />
          <div className="overflow-hidden rounded-[32px] border border-border/70 bg-card/85 p-4 shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="rounded-[26px] border border-border/70 bg-background/90 p-4">
              <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <MessageCircle className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Inbox overview</p>
                    <p className="text-sm text-muted-foreground">Search, scan, and reply with less effort.</p>
                  </div>
                </div>
                <div className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                  Live
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-3 rounded-3xl border border-border/60 bg-muted/40 p-3">
                  {[
                    { name: "Sarah Wilson", message: "The redesign looks great.", active: true, unread: 2 },
                    { name: "Team Project", message: "Feedback is ready for review.", active: false, unread: 5 },
                    { name: "Alex Chen", message: "Can we sync at 2pm?", active: false, unread: 0 },
                  ].map((chat) => (
                    <div
                      key={chat.name}
                      className={`rounded-2xl border px-3 py-3 ${
                        chat.active
                          ? "border-primary/30 bg-background shadow-sm"
                          : "border-transparent bg-background/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{chat.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{chat.message}</p>
                        </div>
                        {chat.unread > 0 ? (
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                            {chat.unread}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-border/60 bg-muted/35 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Sarah Wilson</p>
                      <p className="text-sm text-muted-foreground">Online now</p>
                    </div>
                    <div className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                      Reply in seconds
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="max-w-[80%] rounded-3xl rounded-bl-md border border-border/70 bg-background px-4 py-3 text-sm text-foreground shadow-sm">
                      The updated inbox is much easier to skim. I can find people immediately.
                    </div>
                    <div className="ml-auto max-w-[80%] rounded-3xl rounded-br-md bg-message-sent px-4 py-3 text-sm text-foreground shadow-sm">
                      Great. The new composer and status panels also reduce the noise.
                    </div>
                    <div className="max-w-[80%] rounded-3xl rounded-bl-md border border-border/70 bg-background px-4 py-3 text-sm text-foreground shadow-sm">
                      Perfect. Let&apos;s ship it.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-8 md:py-12">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Why it feels better</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            UI polish that improves speed, confidence, and readability.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[28px] border border-border/70 bg-card/80 p-7 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Faster visual scanning</h3>
            <p className="mt-3 leading-7 text-muted-foreground">
              The refreshed spacing, cards, and conversation hierarchy make it easier to spot unread
              items, active chats, and key actions without hunting.
            </p>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-card/80 p-7 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Clearer onboarding</h3>
            <p className="mt-3 leading-7 text-muted-foreground">
              Sign-in and sign-up now feel more trustworthy with stronger framing, clearer labels, and
              better feedback during account actions.
            </p>
          </div>

          <div className="rounded-[28px] border border-border/70 bg-card/80 p-7 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Consistent everywhere</h3>
            <p className="mt-3 leading-7 text-muted-foreground">
              The new theme support and shared visual system carry across public marketing, auth, and
              the protected chat workspace.
            </p>
          </div>
        </div>
      </section>

      <section id="experience" className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[32px] border border-border/70 bg-card/75 p-8 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Experience flow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              From landing page to first reply, each screen does more with less.
            </h2>
            <div className="mt-8 space-y-6">
              {[
                {
                  icon: ShieldCheck,
                  title: "Safer first impression",
                  description: "Visitors immediately see secure auth, clear next steps, and a trustworthy product frame.",
                },
                {
                  icon: Sparkles,
                  title: "Smoother account flow",
                  description: "Forms now add clearer grouping, password visibility, and better success feedback.",
                },
                {
                  icon: MessageCircle,
                  title: "Focused conversation workspace",
                  description: "Users can search faster, scan status more easily, and compose messages in a calmer layout.",
                },
              ].map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-border/70 bg-gradient-to-br from-card to-muted/60 p-8 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">What changed</p>
            <div className="mt-6 space-y-5 text-sm leading-7 text-muted-foreground">
              <p>
                The redesign raises contrast where decisions matter, softens secondary chrome, and gives each
                screen a stronger sense of structure.
              </p>
              <p>
                Instead of treating the client as separate pages, the update uses one shared visual language so
                the product feels intentional from the first visit through the protected inbox.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="cta" className="px-6 pb-20 pt-4">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[32px] border border-border/70 bg-card/80 p-8 shadow-sm md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Ready to try it</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
              Open the refreshed experience and start a conversation.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Create an account or sign in to see the updated inbox, composer, and message layout.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-xl px-6">
              <Link href="/signup">Create account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl px-6">
              <Link href="/signin">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                  <Image src="/web-app-manifest-512x512.png" alt="Logo" width={40} height={40} className="size-8" />
              </div>
            <div>
              <p className="font-medium text-foreground">Converso</p>
              <p className="text-sm text-muted-foreground">Calmer messaging for modern teams.</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Built for a cleaner UI and a faster first reply.</p>
        </div>
      </footer>
    </main>
  )
}
