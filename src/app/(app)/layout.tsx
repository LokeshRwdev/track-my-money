import AppSidebar from '@/components/layout/app-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (hidden on mobile) */}
      <AppSidebar />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile Navigation: Top bar & Bottom bar */}
        <MobileNav />

        {/* Desktop Header (hidden on mobile) */}
        <header className="hidden md:flex h-14 shrink-0 items-center justify-between border-b border-border/40 px-6 bg-card/40 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-foreground">Track My Money</span>
            <span className="text-muted-foreground/60 text-xs">•</span>
            <span className="text-xs text-muted-foreground font-medium">Cash Flow Journal</span>
          </div>
        </header>

        {/* Scrollable Main Area (with bottom padding for mobile navigation) */}
        <main className="flex-1 overflow-y-auto w-full min-w-0 bg-muted/10 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
