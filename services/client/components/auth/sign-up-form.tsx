"use client"

import { type FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  getResultMessage,
  type AuthDto,
  type CreateUserDto,
  type ResultObjectDto,
} from "@/lib/auth"

export function SignUpForm() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const payload: CreateUserDto = {
        email: email.trim(),
        password,
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
      }

      const response = await fetch("/api/auth/sign-up", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as ResultObjectDto<AuthDto>

      if (!response.ok || !result.object) {
        const message = getResultMessage(result, "Unable to create your account.")
        setError(message)
        toast.error(message)
        return
      }

      toast.success("Account created successfully.")
      router.replace("/chat")
      router.refresh()
    } catch {
      const message = "Unable to reach the server. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
        <p className="text-sm font-medium text-foreground">Set up your account</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Add a few details now so your inbox feels personalized the first time you open it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">First name</span>
          <Input
            type="text"
            placeholder="Jamie"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            className="h-12 rounded-2xl border-border/70 bg-background/90 px-4"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Last name</span>
          <Input
            type="text"
            placeholder="Rivera"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            className="h-12 rounded-2xl border-border/70 bg-background/90 px-4"
          />
        </label>
      </div>

      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">Email address</span>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            className="h-12 rounded-2xl border-border/70 bg-background/90 px-4"
            required
          />
        </label>

        <label className="block space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">Create password</span>
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowPassword((currentValue) => !currentValue)}
            >
              {showPassword ? "Hide password" : "Show password"}
            </button>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Choose a strong password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="h-12 rounded-2xl border-border/70 bg-background/90 px-4 pr-11"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowPassword((currentValue) => !currentValue)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Pick something memorable and strong so you can return to your workspace without friction.
          </p>
        </label>
      </div>

      {error ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle>Sign-up failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        className="h-12 w-full rounded-2xl font-medium shadow-lg shadow-primary/20"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Spinner className="size-4" />
            Creating account
          </>
        ) : (
          <>
            Get started
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        Your account is created through the gateway-backed sign-up flow and drops you straight into chat.
      </p>
    </form>
  )
}
