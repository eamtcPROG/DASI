import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageCircle, ArrowRight, Shield, Zap, Globe } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground text-lg">Messenger</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/signin">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 max-w-6xl mx-auto text-center relative overflow-hidden">
        {/* Green Gradient Vector Background */}
        <div className="absolute inset-0 -z-10">
          <svg
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] md:w-[1200px] md:h-[1200px] opacity-30"
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
            {/* Large center blob */}
            <ellipse cx="400" cy="400" rx="350" ry="300" fill="url(#greenGradient1)" />
            {/* Offset blob */}
            <ellipse cx="300" cy="500" rx="280" ry="250" fill="url(#greenGradient2)" />
            {/* Top accent */}
            <ellipse cx="550" cy="250" rx="200" ry="180" fill="url(#greenGradient3)" />
            {/* Wavy lines */}
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

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-tight text-balance max-w-3xl mx-auto relative">
          Simple, fast, secure messaging
        </h1>
        <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto text-pretty relative">
          Connect with friends and family instantly. No ads, no gimmicks, just pure communication.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 relative">
          <Link href="/signup">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 px-8 font-medium">
              Start Messaging
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/chat">
            <Button size="lg" variant="outline" className="rounded-xl h-12 px-8 font-medium border-border text-foreground hover:bg-muted">
              Try Demo
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Lightning Fast</h3>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              Messages delivered instantly. No delays, no waiting. Your conversations flow naturally.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">End-to-End Encrypted</h3>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              Your conversations are private. Only you and the recipient can read your messages.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Works Everywhere</h3>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              Use Messenger on any device. Your chats sync seamlessly across all platforms.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">Messenger</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Simple messaging for everyone.
          </p>
        </div>
      </footer>
    </main>
  )
}
