'use client'

import React, { useState } from 'react'
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
  LogOut, 
  Menu, 
  X,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

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

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/auth/login')
  }

  const isMoreActive = secondaryNavItems.some(item => pathname === item.href || pathname.startsWith(item.href)) || pathname === '/settings'

  return (
    <>
      {/* Mobile Top App Bar (< md) */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-4 bg-card/75 backdrop-blur-xl md:hidden sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
            ₹
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-foreground">Track My Money</span>
            <span className="text-[10px] text-muted-foreground block -mt-0.5">Cash Flow Journal</span>
          </div>
        </Link>

        {/* Sheet Drawer Trigger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          } />
          <SheetContent side="left" className="w-[280px] p-0 flex flex-col justify-between bg-card">
            <div className="p-5 flex-1 flex flex-col">
              {/* Brand Header */}
              <div className="flex items-center gap-2.5 pb-6 border-b border-border/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  ₹
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">Track My Money</h2>
                  <p className="text-[10px] text-muted-foreground">Personal Cash Flow</p>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="space-y-6 pt-5 flex-1">
                <div>
                  <div className="px-2 mb-2 text-[10px] font-bold tracking-wider text-muted-foreground/70 uppercase">
                    Core Cash Flow
                  </div>
                  <nav className="space-y-1">
                    {primaryNavItems.map((item) => {
                      const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-foreground text-background font-semibold'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                          )}
                        >
                          <item.icon className="mr-3 h-4 w-4 shrink-0" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                <div>
                  <div className="px-2 mb-2 text-[10px] font-bold tracking-wider text-muted-foreground/60 uppercase">
                    Secondary
                  </div>
                  <nav className="space-y-1">
                    {secondaryNavItems.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href)
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex items-center rounded-xl px-3 py-2 text-xs font-medium transition-colors',
                            isActive
                              ? 'bg-muted text-foreground font-semibold'
                              : 'text-muted-foreground/80 hover:bg-muted/40 hover:text-foreground'
                          )}
                        >
                          <item.icon className="mr-3 h-3.5 w-3.5 shrink-0" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </nav>
                </div>
              </div>

              {/* Settings & Sign Out */}
              <div className="border-t border-border/40 pt-4 space-y-1 mt-auto">
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors',
                    pathname === '/settings' && 'bg-muted text-foreground font-semibold'
                  )}
                >
                  <Settings className="mr-3 h-3.5 w-3.5 shrink-0" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
                >
                  <LogOut className="mr-3 h-3.5 w-3.5 shrink-0" />
                  Sign out
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Mobile Bottom Navigation Bar (< md) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-border/40 bg-card/85 px-2 backdrop-blur-xl md:hidden">
        {primaryNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center py-1 text-center transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground/70 hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-all',
                  isActive ? 'bg-primary/10 text-primary font-bold' : ''
                )}
              >
                <item.icon className="h-4 w-4" />
              </div>
              <span className={cn('text-[10px] tracking-tight mt-0.5', isActive ? 'font-bold' : 'font-medium')}>
                {item.name}
              </span>
            </Link>
          )
        })}

        {/* More Tab opens Drawer */}
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center py-1 text-center transition-colors cursor-pointer',
            isMoreActive ? 'text-foreground' : 'text-muted-foreground/70 hover:text-foreground'
          )}
        >
          <div
            className={cn(
              'flex h-7 w-12 items-center justify-center rounded-full transition-all',
              isMoreActive ? 'bg-primary/10 text-primary font-bold' : ''
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </div>
          <span className={cn('text-[10px] tracking-tight mt-0.5', isMoreActive ? 'font-bold' : 'font-medium')}>
            More
          </span>
        </button>
      </nav>
    </>
  )
}
