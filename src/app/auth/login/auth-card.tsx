'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

function SubmitButton({
  children,
  loadingText,
}: {
  children: React.ReactNode
  loadingText: string
}) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full h-10 font-medium transition-all active:scale-[0.98] shadow-xs cursor-pointer"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {children}
          <ArrowRight className="ml-1.5 h-4 w-4 opacity-70" />
        </>
      )}
    </Button>
  )
}

interface AuthCardProps {
  initialTab?: string
  error?: string
  message?: string
}

export function AuthCard({ initialTab = 'login', error, message }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(
    initialTab === 'signup' ? 'signup' : 'login'
  )
  const [showPassword, setShowPassword] = useState(false)
  const [dismissedAlert, setDismissedAlert] = useState(false)

  return (
    <Card className="border-border/60 shadow-lg backdrop-blur-xs bg-card/95 transition-all">
      {/* Segmented Tab Switcher */}
      <div className="p-4 pb-0">
        <div className="grid grid-cols-2 p-1 bg-muted/80 rounded-xl border border-border/50 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login')
              setDismissedAlert(false)
            }}
            className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup')
              setDismissedAlert(false)
            }}
            className={`py-2 px-3 rounded-lg text-center transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create Account
          </button>
        </div>
      </div>

      <CardHeader className="pt-5 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight">
          {activeTab === 'login' ? 'Welcome Back' : 'Create an Account'}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {activeTab === 'login'
            ? 'Enter your email and password to access your financial journal.'
            : 'Get started tracking your cash flow in just a few seconds.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && !dismissedAlert && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive transition-all">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block mb-0.5">Authentication issue</span>
              {error}
            </div>
            <button
              type="button"
              onClick={() => setDismissedAlert(true)}
              className="text-destructive/70 hover:text-destructive text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success / Message Alert */}
        {message && !dismissedAlert && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 transition-all">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold block mb-0.5 text-emerald-700 dark:text-emerald-300">
                Action Required
              </span>
              {message}
            </div>
            <button
              type="button"
              onClick={() => setDismissedAlert(true)}
              className="text-emerald-700/70 hover:text-emerald-700 dark:text-emerald-300/70 dark:hover:text-emerald-300 text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Sign In Form */}
        {activeTab === 'login' && (
          <form action={login} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email" className="text-xs font-semibold text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="pl-9 h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-xs font-semibold text-foreground">
                  Password
                </Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="pl-9 pr-10 h-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <SubmitButton loadingText="Logging in...">Sign In</SubmitButton>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup')
                    setDismissedAlert(false)
                  }}
                  className="font-semibold text-foreground hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            </div>
          </form>
        )}

        {/* Sign Up Form */}
        {activeTab === 'signup' && (
          <form action={signup} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="signup-email" className="text-xs font-semibold text-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="pl-9 h-10 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="signup-password" className="text-xs font-semibold text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="signup-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className="pl-9 pr-10 h-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Must be at least 6 characters long.
              </p>
            </div>

            <div className="pt-2">
              <SubmitButton loadingText="Creating account...">
                Create Account
              </SubmitButton>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login')
                    setDismissedAlert(false)
                  }}
                  className="font-semibold text-foreground hover:underline cursor-pointer"
                >
                  Sign in instead
                </button>
              </p>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
