'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Receipt, 
  Sparkles, 
  Wallet, 
  Settings, 
  LogOut 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

const primaryNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cash In', href: '/income', icon: ArrowDownLeft },
  { name: 'Cash Out', href: '/obligations', icon: ArrowUpRight },
]

const secondaryNavItems = [
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Projection', href: '/projection', icon: Sparkles },
  { name: 'Accounts', href: '/accounts', icon: Wallet },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="hidden md:flex h-full w-64 shrink-0 flex-col border-r border-border/40 bg-card/60 px-3 py-5 backdrop-blur-md">
      {/* Brand Header */}
      <div className="mb-8 px-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
            ₹
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Track My Money</h2>
            <p className="text-[11px] text-muted-foreground font-medium">Personal Cash Flow</p>
          </div>
        </Link>
      </div>

      {/* Primary Navigation */}
      <div className="space-y-6 flex-1">
        <div>
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
            Core Cash Flow
          </div>
          <nav className="space-y-1">
            {primaryNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-foreground text-background font-semibold shadow-sm'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-background' : 'text-muted-foreground group-hover:text-foreground'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Secondary Navigation */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-muted-foreground/60 uppercase">
            Secondary
          </div>
          <nav className="space-y-0.5">
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-muted text-foreground font-semibold'
                      : 'text-muted-foreground/80 hover:bg-muted/40 hover:text-foreground'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-3.5 w-3.5 shrink-0 transition-colors',
                      isActive ? 'text-foreground' : 'text-muted-foreground/70 group-hover:text-foreground'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Footer Navigation: Settings & Logout */}
      <div className="border-t border-border/40 pt-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors',
            pathname === '/settings' && 'bg-muted text-foreground font-semibold'
          )}
        >
          <Settings className="mr-3 h-3.5 w-3.5 shrink-0" />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
        >
          <LogOut className="mr-3 h-3.5 w-3.5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
