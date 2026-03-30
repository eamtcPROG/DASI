"use client"

import { type FormEvent, useState } from "react"
import { ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getResultMessage, type ResultObjectDto } from "@/lib/auth"

type ResetPasswordFormProps = {
  initialEmail?: string
}

export function ResetPasswordForm({ initialEmail = "" }: ResetPasswordFormProps) {
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        }),
      })

      const result = (await response.json()) as ResultObjectDto<null>

      if (!response.ok) {
        const message = getResultMessage(result, "Unable to reset password.")
        setError(message)
        toast.error(message)
        return
      }

      setSuccess(true)
      toast.success("Password reset successfully.")
    } catch {
      const message = "Unable to reach the server. Please try again."
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-muted/35 p-6 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <div>
            <p className="font-medium text-foreground">Password updated</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Your password has been reset. You can now sign in with your new password.
            </p>
          </div>
        </div>
        <Link
          href="/signin"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
        <p className="text-sm font-medium text-foreground">Enter your reset code</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Check your email for the 6-digit code and set a new password below.
        </p>
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
          <span className="text-sm font-medium text-foreground">Reset code</span>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="123456"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            autoComplete="one-time-code"
            className="h-12 rounded-2xl border-border/70 bg-background/90 px-4 text-center font-mono text-xl tracking-widest"
            maxLength={6}
            required
          />
        </label>

        <label className="block space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">New password</span>
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              className="h-12 rounded-2xl border-border/70 bg-background/90 px-4 pr-11"
              minLength={8}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>
      </div>

      {error ? (
        <Alert variant="destructive" className="rounded-2xl">
          <AlertTitle>Reset failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="submit"
        className="h-12 w-full rounded-2xl font-medium shadow-lg shadow-primary/20"
        disabled={isSubmitting || code.length !== 6}
      >
        {isSubmitting ? (
          <>
            <Spinner className="size-4" />
            Resetting password
          </>
        ) : (
          <>
            Reset password
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        Didn&apos;t receive a code?{" "}
        <Link href="/forgot-password" className="font-medium text-primary hover:underline">
          Request a new one
        </Link>
      </p>
    </form>
  )
}
