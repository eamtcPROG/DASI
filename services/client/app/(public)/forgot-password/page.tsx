import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      description="Enter your email and we'll send you a 6-digit code to reset your password."
      footerText="Remember your password?"
      footerHref="/signin"
      footerLabel="Sign in"
    >
      <ForgotPasswordForm />
    </AuthShell>
  )
}
