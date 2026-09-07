'use client'

import React, { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  Calendar, 
  Plus, 
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { useGlobalLoading } from '@/components/providers/loading-provider'

interface DashboardData {
  month: string
  cashIn: number
  cashOut: number
  netCashFlow: number
  expectedCashIn: number
  expectedCashOut: number
  expectedNetCashFlow: number
  retainedPercentage: number
  recurringIncome: number
  variableIncome: number
  fixedCommitments: number
  coverageRatio: number
  commitmentRatio: number
  cashInBreakdown: {
    name: string
    type: string
    amount: number
    isRecurring: boolean
    percentage: number
  }[]
  cashOutBreakdown: {
    name: string
    category: string
    amount: number
    percentage: number
  }[]
  upcomingPayments: {
    id: string
    name: string
    category: string
    dueDate: string
    amount: number
    status: string
  }[]
  history: {
    month: string
    monthLabel: string
    cashIn: number
    cashOut: number
    net: number
  }[]
}

export function DashboardView() {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { withLoading } = useGlobalLoading()
  const [isPending, startTransition] = useTransition()

  // Format month for display: e.g. "September 2026"
  const formattedMonthLabel = (() => {
    try {
      const [y, m] = selectedMonth.split('-').map(Number)
      return format(new Date(y, m - 1, 1), 'MMMM yyyy')
    } catch {
      return selectedMonth
    }
  })()

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const prev = subMonths(new Date(y, m - 1, 1), 1)
    setSelectedMonth(format(prev, 'yyyy-MM'))
  }

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const next = addMonths(new Date(y, m - 1, 1), 1)
    setSelectedMonth(format(next, 'yyyy-MM'))
  }

  const handleCurrentMonth = () => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'))
  }

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      setError(null)
      try {
        await withLoading(async () => {
          const res = await fetch(`/api/dashboard?month=${selectedMonth}`)
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}))
            throw new Error(errJson.error || 'Failed to load dashboard data')
          }
          const json = await res.json()
          if (isMounted) {
            setData(json)
          }
        })
      } catch (err: any) {
        if (isMounted) setError(err.message)
      }
    }

    fetchData()
    return () => {
      isMounted = false
    }
  }, [selectedMonth, withLoading])

  // Amounts
  const displayCashIn = data ? (data.cashIn > 0 ? data.cashIn : data.expectedCashIn) : 0
  const displayCashOut = data ? (data.cashOut > 0 ? data.cashOut : data.expectedCashOut) : 0
  const displayNet = data ? (data.cashIn > 0 ? data.netCashFlow : data.expectedNetCashFlow) : 0
  const isPositiveNet = displayNet >= 0

  const hasAnyData = displayCashIn > 0 || displayCashOut > 0 || (data?.upcomingPayments && data.upcomingPayments.length > 0)
  const isOnlyFutureProjections = data && data.cashIn === 0 && data.cashOut === 0 && (data.expectedCashIn > 0 || data.expectedCashOut > 0)

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-16">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Monthly Cash Flow
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
            Understand your money coming in, commitments going out, and what remains.
          </p>
        </div>

        {/* Minimal Month Picker */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto rounded-full border border-border/60 bg-card/80 p-1 shadow-xs backdrop-blur-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={handleCurrentMonth}
            className="flex-1 sm:flex-initial text-center px-3 py-1 text-xs font-semibold tracking-tight text-foreground hover:text-primary transition-colors cursor-pointer"
            title="Click to reset to current month"
          >
            {formattedMonthLabel}
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State when zero data exists */}
      {!hasAnyData && data && (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-6 sm:p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Let's set up your month</h3>
          <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm text-muted-foreground">
            Add your income streams and fixed commitments to see your live cash flow story and understand what remains.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link href="/income" className="w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto gap-1.5 rounded-full px-4 font-medium">
                <Plus className="h-4 w-4" />
                Add Income
              </Button>
            </Link>
            <Link href="/obligations" className="w-full sm:w-auto">
              <Button size="sm" variant="outline" className="w-full sm:w-auto gap-1.5 rounded-full px-4 font-medium">
                <Plus className="h-4 w-4" />
                Add Commitment
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Primary Connected Cash-Flow Story (Hero Flow) */}
      {hasAnyData && (
        <div className="space-y-6">
          {isOnlyFutureProjections && (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary">
              <span>Showing expected recurring commitments & income for this period</span>
            </div>
          )}

          {/* Visual Cash Flow Story Container */}
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-5 sm:p-8 md:p-10 shadow-xs backdrop-blur-xl">
            <div className="grid gap-4 md:gap-6 md:grid-cols-3 md:items-center">
              {/* Node 1: Cash In */}
              <div className="flex flex-col items-center text-center md:items-start md:text-left space-y-1 rounded-2xl md:rounded-none bg-background/50 md:bg-transparent p-4 md:p-0 border border-border/30 md:border-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  Money In
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground pt-1">
                  ₹{displayCashIn.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {data?.cashIn ? 'Actual received' : 'Expected incoming'}
                </p>
              </div>

              {/* Central Node: Retained / Your Month */}
              <div className="relative flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-background/90 p-5 sm:p-6 text-center shadow-lg transition-transform hover:scale-[1.01]">
                <div className="absolute -top-3">
                  <span className="rounded-full bg-foreground px-3 py-0.5 text-[10px] font-bold tracking-wider uppercase text-background shadow-xs">
                    Your Month
                  </span>
                </div>
                <div className="text-xs font-medium text-muted-foreground pt-2">
                  Money Retained
                </div>
                <div className={`text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight pt-1 ${
                  isPositiveNet ? 'text-foreground' : 'text-rose-500'
                }`}>
                  ₹{displayNet.toLocaleString('en-IN')}
                </div>
                <div className="mt-2.5 sm:mt-3 inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-foreground">
                  <span>{data?.retainedPercentage ?? 0}%</span>
                  <span className="text-muted-foreground">kept after obligations</span>
                </div>
              </div>

              {/* Node 3: Cash Out */}
              <div className="flex flex-col items-center text-center md:items-end md:text-right space-y-1 rounded-2xl md:rounded-none bg-background/50 md:bg-transparent p-4 md:p-0 border border-border/30 md:border-0">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Committed Out
                </div>
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground pt-1">
                  ₹{displayCashOut.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {data?.cashOut ? 'Paid obligations' : 'Committed monthly'}
                </p>
              </div>
            </div>

            {/* Visual Retained Percentage Bar */}
            <div className="mt-8 pt-6 border-t border-border/40">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-2">
                <span>Monthly Allocation</span>
                <span className="font-semibold text-foreground">
                  {data?.retainedPercentage ?? 0}% retained
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/70 flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, data?.retainedPercentage || 0))}%` }}
                  title={`Retained: ${data?.retainedPercentage}%`}
                />
                <div 
                  className="h-full bg-rose-400/80 transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, 100 - (data?.retainedPercentage || 0)))}%` }}
                  title={`Committed: ${100 - (data?.retainedPercentage || 0)}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                  Retained (₹{displayNet.toLocaleString('en-IN')})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400 inline-block" />
                  Committed Out (₹{displayCashOut.toLocaleString('en-IN')})
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Section: Cash In & Cash Out Side-by-Side */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Cash In Breakdown */}
            <div className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3">
                  <h3 className="text-base font-semibold text-foreground">Cash In Breakdown</h3>
                  <Link href="/income" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                    Manage Inflow →
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground pb-4">
                  Where your money comes from this month, distinguished by predictability.
                </p>

                {/* Recurring vs Variable Summary Chips */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Recurring (Predictable)
                    </div>
                    <div className="text-lg font-bold text-foreground mt-0.5">
                      ₹{(data?.recurringIncome || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-background/50 p-3">
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Variable (Fluctuating)
                    </div>
                    <div className="text-lg font-bold text-foreground mt-0.5">
                      ₹{(data?.variableIncome || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Sources list */}
                <div className="space-y-2.5">
                  {data?.cashInBreakdown && data.cashInBreakdown.length > 0 ? (
                    data.cashInBreakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.name}</span>
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {item.isRecurring ? 'Recurring' : 'Variable'}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No income streams recorded for this month.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Cash Out Breakdown */}
            <div className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3">
                  <h3 className="text-base font-semibold text-foreground">Cash Out Breakdown</h3>
                  <Link href="/obligations" className="text-xs font-medium text-muted-foreground hover:text-foreground">
                    Manage Commitments →
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground pb-4">
                  How much of your money is already committed to fixed obligations.
                </p>

                {/* Obligations List */}
                <div className="space-y-2.5">
                  {data?.cashOutBreakdown && data.cashOutBreakdown.length > 0 ? (
                    data.cashOutBreakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.name}</span>
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {item.category}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No fixed commitments added yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Total Committed Footer */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total Committed Out:</span>
                <span className="font-bold text-foreground">
                  ₹{displayCashOut.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Health & Upcoming Commitments Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Financial Health */}
            <div className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-md">
              <div className="flex items-center gap-2 pb-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <h3 className="text-base font-semibold text-foreground">Financial Health</h3>
              </div>
              <p className="text-xs text-muted-foreground pb-4">
                Measures how comfortably predictable income shields fixed obligations.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/40 bg-background/50 p-3.5">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                    Commitment Coverage
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {data?.coverageRatio ? `${data.coverageRatio}×` : '—'}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Recurring income covers fixed commitments {data?.coverageRatio || 0} times.
                  </p>
                </div>

                <div className="rounded-xl border border-border/40 bg-background/50 p-3.5">
                  <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                    Commitment Share
                  </div>
                  <div className="text-2xl font-bold text-foreground mt-1">
                    {data?.commitmentRatio ? `${data.commitmentRatio}%` : '0%'}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Fixed obligations consume {data?.commitmentRatio || 0}% of recurring income.
                  </p>
                </div>
              </div>
            </div>

            {/* Upcoming Payments */}
            <div className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Upcoming Payments</h3>
                </div>
                <Link href="/obligations" className="text-xs text-muted-foreground hover:text-foreground">
                  View all →
                </Link>
              </div>
              <p className="text-xs text-muted-foreground pb-4">
                Your next scheduled financial commitments.
              </p>

              <div className="space-y-2">
                {data?.upcomingPayments && data.upcomingPayments.length > 0 ? (
                  data.upcomingPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className="flex items-center justify-between rounded-xl border border-border/30 bg-background/40 px-3.5 py-2 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {pay.dueDate.slice(5)}
                        </span>
                        <span className="font-medium text-foreground">{pay.name}</span>
                      </div>
                      <span className="font-semibold text-foreground">
                        ₹{pay.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-xs text-muted-foreground">
                    No upcoming payments scheduled for this month.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 6-Month Trend Chart */}
          <div className="rounded-2xl border border-border/50 bg-card/60 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-base font-semibold text-foreground">6-Month Trend</h3>
                <p className="text-xs text-muted-foreground">
                  Am I improving or getting worse? Net cash flow retained over time.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  In
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  Out
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Net
                </span>
              </div>
            </div>

            <div className="h-56 w-full pt-4">
              {data?.history && data.history.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        borderColor: 'var(--border)',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      formatter={(value: any, name: any) => [
                        `₹${Number(value).toLocaleString('en-IN')}`,
                        name === 'cashIn' ? 'Cash In' : name === 'cashOut' ? 'Cash Out' : 'Net Cash Flow',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="cashIn"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      fillOpacity={0}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="cashOut"
                      stroke="#fb7185"
                      strokeWidth={1.5}
                      fillOpacity={0}
                      dot={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="net"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      fill="url(#colorNet)"
                      dot={{ r: 3, fill: 'var(--primary)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Not enough historical data yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
