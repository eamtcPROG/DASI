import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpForm } from "@/components/auth/sign-up-form"

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create account"
      description="Create your account to enter the updated inbox with clearer navigation and calmer focus."
      footerText="Already have an account?"
      footerHref="/signin"
      footerLabel="Sign in"
    >
      <SignUpForm />
    </AuthShell>
  )
}
