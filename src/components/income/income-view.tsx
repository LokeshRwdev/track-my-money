'use client'

import React, { useEffect, useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowDownLeft, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Briefcase, 
  Building2, 
  CheckCircle2, 
  Clock, 
  Trash2,
  AlertCircle
} from 'lucide-react'
import { format, addMonths, subMonths } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGlobalLoading } from '@/components/providers/loading-provider'

interface IncomeSource {
  id: string
  name: string
  income_type: 'SALARY' | 'BUSINESS' | 'STOCK_MARKET' | 'INVESTMENT' | 'FREELANCE' | 'OTHER'
  expected_amount: number
  is_recurring: boolean
  frequency: string | null
  is_active: boolean
  description: string | null
}

interface IncomeRecord {
  id: string
  income_source_id: string | null
  amount: number
  income_date: string
  month: string
  description: string | null
  status: 'EXPECTED' | 'RECEIVED' | 'CANCELLED'
  income_sources?: {
    name: string
    income_type: string
    is_recurring: boolean
  } | null
}

interface IncomeData {
  month: string
  actualCashIn: number
  expectedCashIn: number
  sources: IncomeSource[]
  records: IncomeRecord[]
}

export function IncomeView() {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<IncomeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { withLoading } = useGlobalLoading()

  // Form states
  const [name, setName] = useState('')
  const [type, setType] = useState('SALARY')
  const [amount, setAmount] = useState('')
  const [frequencyType, setFrequencyType] = useState<'RECURRING' | 'VARIABLE' | 'ONE_TIME'>('RECURRING')
  const [status, setStatus] = useState<'RECEIVED' | 'EXPECTED'>('RECEIVED')
  const [incomeDate, setIncomeDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')

  const formattedMonthLabel = (() => {
    try {
      const [y, m] = selectedMonth.split('-').map(Number)
      return format(new Date(y, m - 1, 1), 'MMMM yyyy')
    } catch {
      return selectedMonth
    }
  })()

  const loadData = async () => {
    setError(null)
    try {
      await withLoading(async () => {
        const res = await fetch(`/api/income?month=${selectedMonth}`)
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}))
          throw new Error(errJson.error || 'Failed to load income data')
        }
        const json = await res.json()
        setData(json)
      })
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth])

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    setSelectedMonth(format(subMonths(new Date(y, m - 1, 1), 1), 'yyyy-MM'))
  }

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    setSelectedMonth(format(addMonths(new Date(y, m - 1, 1), 1), 'yyyy-MM'))
  }

  const handleCreateIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount) return

    try {
      await withLoading(async () => {
        if (frequencyType === 'VARIABLE' || frequencyType === 'ONE_TIME') {
          // Log as a direct record
          const res = await fetch('/api/income', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create_record',
              description: name,
              amount: Number(amount),
              income_date: incomeDate,
              month: selectedMonth,
              status,
            }),
          })
          if (!res.ok) throw new Error('Failed to record income')
        } else {
          // Recurring Source + Initial record if RECEIVED
          const res = await fetch('/api/income', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create_source',
              name,
              income_type: type,
              expected_amount: Number(amount),
              is_recurring: true,
              frequency: 'MONTHLY',
              description: notes || null,
              initial_record: true,
              initial_record_date: incomeDate,
              initial_record_status: status,
            }),
          })
          if (!res.ok) throw new Error('Failed to create income source')
        }

        setIsDialogOpen(false)
        setName('')
        setAmount('')
        setNotes('')
        await loadData()
      })
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income stream?')) return
    try {
      await withLoading(async () => {
        const res = await fetch(`/api/income/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete')
        await loadData()
      })
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleToggleStatus = async (record: IncomeRecord) => {
    const nextStatus = record.status === 'RECEIVED' ? 'EXPECTED' : 'RECEIVED'
    try {
      await withLoading(async () => {
        const res = await fetch(`/api/income/${record.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: 'record',
            status: nextStatus,
          }),
        })
        if (!res.ok) throw new Error('Failed to update status')
        await loadData()
      })
    } catch (err: any) {
      alert(err.message)
    }
  }

  const recurringSources = data?.sources.filter((s) => s.is_recurring) || []
  const recordsThisMonth = data?.records || []

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Header & Month Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Cash In
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Manage your incoming money streams — both predictable salary and fluctuating income.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          {/* Month Selector */}
          <div className="flex items-center justify-between sm:justify-start gap-1 rounded-full border border-border/60 bg-card/80 p-1 shadow-xs backdrop-blur-md">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex-1 sm:flex-initial text-center px-3 py-1 text-xs font-semibold text-foreground">
              {formattedMonthLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={() => setIsDialogOpen(true)}
            size="sm"
            className="w-full sm:w-auto gap-1.5 rounded-full px-4 font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Income
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Inflow Card */}
      <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs">
        <div className="text-xs font-semibold tracking-wider text-emerald-600 uppercase">
          Total Cash In This Month
        </div>
        <div className="mt-1 text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          ₹{(data?.actualCashIn || 0).toLocaleString('en-IN')}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>Actual received: <strong className="text-foreground">₹{(data?.actualCashIn || 0).toLocaleString('en-IN')}</strong></span>
          <span>•</span>
          <span>Expected incoming: <strong className="text-foreground">₹{(data?.expectedCashIn || 0).toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* Recurring Income Streams (Predictable) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recurring Streams</h2>
            <p className="text-xs text-muted-foreground">
              Predictable, monthly recurring income (e.g. Salary).
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {recurringSources.length} Active
          </Badge>
        </div>

        {recurringSources.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {recurringSources.map((source) => (
              <div
                key={source.id}
                className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-md transition-all hover:border-border"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {source.income_type}
                    </span>
                    <h3 className="text-base font-semibold text-foreground mt-0.5">
                      {source.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(source.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                    title="Delete source"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-baseline justify-between border-t border-border/30 pt-3">
                  <span className="text-xs text-muted-foreground">Monthly Expected</span>
                  <span className="text-lg font-bold text-foreground">
                    ₹{Number(source.expected_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center">
            <p className="text-xs text-muted-foreground">No recurring streams configured yet.</p>
          </div>
        )}
      </div>

      {/* Received Records for the Month */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Income Records for {formattedMonthLabel}</h2>
            <p className="text-xs text-muted-foreground">
              Actual received entries and variable streams for this month.
            </p>
          </div>
        </div>

        {recordsThisMonth.length > 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md divide-y divide-border/30 overflow-hidden">
            {recordsThisMonth.map((rec) => {
              const isReceived = rec.status === 'RECEIVED'
              const title = rec.income_sources?.name || rec.description || 'Income Entry'
              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleStatus(rec)}
                      className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
                        isReceived
                          ? 'bg-emerald-500 text-white'
                          : 'border border-border text-muted-foreground hover:border-foreground'
                      }`}
                      title="Click to toggle Expected / Received"
                    >
                      {isReceived ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-3.5 w-3.5" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{title}</span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                          isReceived ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {rec.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {rec.income_date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold text-foreground">
                      ₹{Number(rec.amount).toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleDeleteItem(rec.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center">
            <p className="text-xs text-muted-foreground">
              Nothing coming in yet for {formattedMonthLabel}.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="mt-3 gap-1.5 rounded-full"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Income
            </Button>
          </div>
        )}
      </div>

      {/* Add Income Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateIncome}>
            <DialogHeader>
              <DialogTitle>Add Income</DialogTitle>
              <DialogDescription>
                Record an incoming money stream or log variable earnings.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="income-name">Source Name</Label>
                <Input
                  id="income-name"
                  placeholder="e.g. Monthly Salary, Zerodha Dividends"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="income-type">Category</Label>
                  <Select value={type} onValueChange={(val) => val && setType(val)}>
                    <SelectTrigger id="income-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SALARY">Salary</SelectItem>
                      <SelectItem value="STOCK_MARKET">Stock Market</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                      <SelectItem value="FREELANCE">Freelance</SelectItem>
                      <SelectItem value="INVESTMENT">Investment</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="frequency-type">Frequency</Label>
                  <Select
                    value={frequencyType}
                    onValueChange={(val: any) => setFrequencyType(val)}
                  >
                    <SelectTrigger id="frequency-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECURRING">Recurring (Monthly)</SelectItem>
                      <SelectItem value="VARIABLE">Variable (Fluctuating)</SelectItem>
                      <SelectItem value="ONE_TIME">One-Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="income-amount">Amount (₹)</Label>
                  <Input
                    id="income-amount"
                    type="number"
                    placeholder="150000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="income-status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val: any) => setStatus(val)}
                  >
                    <SelectTrigger id="income-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEIVED">Received</SelectItem>
                      <SelectItem value="EXPECTED">Expected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="income-date">Date Received / Expected</Label>
                <Input
                  id="income-date"
                  type="date"
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Income</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
