import Link from 'next/link'
import { WalletCards, ArrowLeft } from 'lucide-react'
import { AuthCard } from './auth-card'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const error = resolvedSearchParams?.error as string | undefined
  const message = resolvedSearchParams?.message as string | undefined
  const tab = resolvedSearchParams?.tab as string | undefined

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-muted/30 to-background p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Top Brand Header */}
        <div className="flex flex-col items-center space-y-2.5 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Home
          </Link>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background font-bold text-lg shadow-md">
            ₹
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Track My Money
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xs">
            Simple, calm personal cash flow tracking.
          </p>
        </div>

        {/* Dynamic Auth Card (Sign In & Sign Up) */}
        <AuthCard initialTab={tab} error={error} message={message} />

        {/* Footer info */}
        <p className="text-center text-[11px] text-muted-foreground">
          By continuing, you agree to keep your financial records accurate and private.
        </p>
      </div>
    </div>
  )
}
