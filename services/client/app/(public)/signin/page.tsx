import { AuthShell } from "@/components/auth/auth-shell"
import { SignInForm } from "@/components/auth/sign-in-form"

export default function SignInPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to pick up conversations instantly with the refreshed, protected workspace."
      footerText={"Don't have an account?"}
      footerHref="/signup"
      footerLabel="Sign up"
    >
      <SignInForm />
    </AuthShell>
  )
}
