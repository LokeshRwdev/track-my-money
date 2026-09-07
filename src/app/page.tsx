import Link from "next/link";
import { ArrowRight, ArrowDownLeft, ArrowUpRight, Sparkles, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-xs">
              ₹
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Track My Money
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/auth/login" 
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="text-xs font-semibold bg-foreground text-background px-4 py-2 rounded-full hover:opacity-90 transition-all active:scale-95 shadow-xs"
            >
              Open Journal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border/60 text-xs font-semibold text-foreground mb-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Personal Cash Flow Journal
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
          Money In. Committed Out. <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-primary to-teal-500">
            Know what you actually keep.
          </span>
        </h1>
        
        <p className="max-w-xl mx-auto text-base sm:text-lg text-muted-foreground mb-10 font-normal">
          Not another complex accounting panel. A calm, 5-second personal financial journal built around one simple truth:
          <span className="block font-mono font-medium text-foreground mt-2 text-sm sm:text-base">
            CASH IN − CASH OUT = NET CASH FLOW
          </span>
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 items-center mb-16">
          <Link
            href="/dashboard"
            className="group flex h-11 items-center justify-center gap-2 rounded-full bg-foreground text-background px-6 text-sm font-semibold transition-all hover:opacity-90 active:scale-95 w-full sm:w-auto shadow-sm"
          >
            Enter Dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/auth/login"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-border/80 bg-card px-6 text-sm font-medium text-foreground transition-all hover:bg-muted/60 active:scale-95 w-full sm:w-auto"
          >
            Sign in / Sign up
          </Link>
        </div>

        {/* Apple-like Cash Flow Story Preview */}
        <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-6 sm:p-10 shadow-xl backdrop-blur-xl max-w-3xl mx-auto text-left">
          <div className="grid gap-6 md:grid-cols-3 md:items-center">
            <div className="text-center md:text-left space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                <ArrowDownLeft className="h-3 w-3" />
                Cash In
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">₹2,45,000</div>
              <p className="text-[11px] text-muted-foreground">Salary & streams</p>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-background/90 p-5 text-center shadow-md">
              <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[9px] font-bold tracking-wider uppercase text-background mb-1">
                Your Month
              </span>
              <div className="text-[11px] text-muted-foreground font-medium">Retained</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground mt-0.5">
                ₹1,56,000
              </div>
              <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                64% remains after commitments
              </div>
            </div>

            <div className="text-center md:text-right space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-500">
                <ArrowUpRight className="h-3 w-3" />
                Cash Out
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">₹89,000</div>
              <p className="text-[11px] text-muted-foreground">EMIs, bills, rent</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
