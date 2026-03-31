import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

type ResetPasswordPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { email } = await searchParams

  return (
    <AuthShell
      title="Reset password"
      description="Enter the 6-digit code from your email and choose a new password."
      footerText="Remember your password?"
      footerHref="/signin"
      footerLabel="Sign in"
    >
      <ResetPasswordForm initialEmail={email ?? ""} />
    </AuthShell>
  )
}
