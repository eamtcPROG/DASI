import { AuthShell } from "@/components/auth/auth-shell"
import { SignUpForm } from "@/components/auth/sign-up-form"

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create account"
      description="Start messaging with the gateway-backed sign-up flow."
      footerText="Already have an account?"
      footerHref="/signin"
      footerLabel="Sign in"
    >
      <SignUpForm />
    </AuthShell>
  )
}
