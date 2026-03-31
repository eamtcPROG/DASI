"use client"

import { type FormEvent, useState } from "react"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getResultMessage, type ResultObjectDto } from "@/lib/auth"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })

      const result = (await response.json()) as ResultObjectDto<null>

      if (!response.ok) {
        const message = getResultMessage(result, "Unable to process request.")
        setError(message)
        toast.error(message)
        return
      }

      setSubmitted(true)
    } catch {
      const message = "Unable to reach the server. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 p-6 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <div>
            <p className="font-medium text-foreground">Check your inbox</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              If an account exists for <strong>{email}</strong>, a 6-digit reset code has
              been sent.
            </p>
          </div>
        </div>
        <Link
          href={`/reset-password?email=${encodeURIComponent(email)}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
        >
          Enter reset code
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-center text-xs leading-5 text-muted-foreground">
          Didn&apos;t receive an email?{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => setSubmitted(false)}
          >
            Try again
          </button>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
        <p className="text-sm font-medium text-foreground">Enter your email address</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          We&apos;ll send a 6-digit code to reset your password.
        </p>
      </div>

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

      {error ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle>Request failed</AlertTitle>
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
            Sending code
          </>
        ) : (
          <>
            Send reset code
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  )
}
