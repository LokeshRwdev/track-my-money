'use client'

import React, { useEffect, useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trash2,
  AlertCircle,
  Pencil,
  Pause,
  Play,
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
  pendingCashIn?: number
  sources: IncomeSource[]
  records: IncomeRecord[]
}

export function IncomeView() {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<IncomeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { withLoading } = useGlobalLoading()

  // Create Form states
  const [name, setName] = useState('')
  const [type, setType] = useState('SALARY')
  const [amount, setAmount] = useState('')
  const [frequencyType, setFrequencyType] = useState<'RECURRING' | 'VARIABLE' | 'ONE_TIME'>('RECURRING')
  const [status, setStatus] = useState<'RECEIVED' | 'EXPECTED'>('RECEIVED')
  const [incomeDate, setIncomeDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')

  // Edit Stream Form states
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('SALARY')
  const [editAmount, setEditAmount] = useState('')
  const [editIsActive, setEditIsActive] = useState(true)
  const [editDescription, setEditDescription] = useState('')

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

  const handleOpenAddStream = () => {
    setFrequencyType('RECURRING')
    setName('')
    setAmount('')
    setNotes('')
    setStatus('RECEIVED')
    setIsDialogOpen(true)
  }

  const handleCreateIncome = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount) return

    try {
      await withLoading(async () => {
        if (frequencyType === 'VARIABLE' || frequencyType === 'ONE_TIME') {
          // Direct record
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
          // Recurring Source + Initial record for selectedMonth
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
              month: selectedMonth,
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

  const handleOpenEdit = (source: IncomeSource) => {
    setEditingSource(source)
    setEditName(source.name)
    setEditType(source.income_type)
    setEditAmount(String(source.expected_amount))
    setEditIsActive(source.is_active)
    setEditDescription(source.description || '')
    setIsEditDialogOpen(true)
  }

  const handleUpdateStream = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSource || !editName || !editAmount) return

    try {
      await withLoading(async () => {
        const res = await fetch(`/api/income/${editingSource.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: 'source',
            name: editName.trim(),
            income_type: editType,
            expected_amount: Number(editAmount),
            is_active: editIsActive,
            description: editDescription || null,
          }),
        })
        if (!res.ok) throw new Error('Failed to update recurring stream')
        setIsEditDialogOpen(false)
        setEditingSource(null)
        await loadData()
      })
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleToggleStreamActive = async (source: IncomeSource) => {
    try {
      await withLoading(async () => {
        const res = await fetch(`/api/income/${source.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity_type: 'source',
            is_active: !source.is_active,
          }),
        })
        if (!res.ok) throw new Error('Failed to update stream status')
        await loadData()
      })
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleMarkStreamReceived = async (source: IncomeSource) => {
    try {
      await withLoading(async () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        const targetDate = today.startsWith(selectedMonth) ? today : `${selectedMonth}-01`

        const res = await fetch('/api/income', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'record_monthly_income',
            income_source_id: source.id,
            month: selectedMonth,
            income_date: targetDate,
            amount: Number(source.expected_amount),
            status: 'RECEIVED',
          }),
        })
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}))
          throw new Error(errJson.error || 'Failed to mark income as received')
        }
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
  const expectedTotal = data?.expectedCashIn || 0
  const actualReceived = data?.actualCashIn || 0
  const pendingInflow = Math.max(0, expectedTotal - actualReceived)
  const percentReceived = expectedTotal > 0 ? Math.min(100, Math.round((actualReceived / expectedTotal) * 100)) : 0

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
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
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
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={() => {
              setFrequencyType('RECURRING')
              setIsDialogOpen(true)
            }}
            size="sm"
            className="w-full sm:w-auto gap-1.5 rounded-full px-4 font-medium cursor-pointer"
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
      <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-wider text-emerald-600 uppercase flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Total Projected Cash In ({formattedMonthLabel})
            </div>
            <div className="mt-1 text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
              ₹{expectedTotal.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
              {percentReceived}% Received
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted/70 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentReceived}%` }}
          />
        </div>

        {/* Breakdown Badges */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Actual Received:</span>
            <strong className="text-foreground">₹{actualReceived.toLocaleString('en-IN')}</strong>
          </div>
          <span className="text-muted-foreground/40">•</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Pending Inflow:</span>
            <strong className="text-foreground">₹{pendingInflow.toLocaleString('en-IN')}</strong>
          </div>
          <span className="text-muted-foreground/40">•</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary/60" />
            <span className="text-muted-foreground">Total Expected:</span>
            <strong className="text-foreground">₹{expectedTotal.toLocaleString('en-IN')}</strong>
          </div>
        </div>
      </div>

      {/* Recurring Income Streams (Predictable) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recurring Streams</h2>
            <p className="text-xs text-muted-foreground">
              Predictable monthly incoming streams with quick monthly status tracking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {recurringSources.length} Active
            </Badge>
            <Button
              onClick={handleOpenAddStream}
              size="sm"
              variant="outline"
              className="h-8 gap-1 rounded-full text-xs font-medium cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Stream
            </Button>
          </div>
        </div>

        {recurringSources.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {recurringSources.map((source) => {
              const streamRecords = recordsThisMonth.filter(
                (r) => r.income_source_id === source.id
              )
              const isReceivedThisMonth = streamRecords.some(
                (r) => r.status === 'RECEIVED'
              )
              const receivedRec = streamRecords.find((r) => r.status === 'RECEIVED')

              return (
                <div
                  key={source.id}
                  className={`group flex flex-col justify-between rounded-2xl border p-5 backdrop-blur-md transition-all shadow-xs ${
                    !source.is_active
                      ? 'border-border/40 bg-card/30 opacity-60'
                      : isReceivedThisMonth
                      ? 'border-emerald-500/30 bg-card/80 hover:border-emerald-500/50'
                      : 'border-border/60 bg-card/60 hover:border-border'
                  }`}
                >
                  <div>
                    {/* Header with Type, Pause/Play, Edit, and Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {source.income_type}
                        </span>
                        {!source.is_active && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Paused
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Edit button */}
                        <button
                          onClick={() => handleOpenEdit(source)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted cursor-pointer"
                          title="Edit stream details"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {/* Pause / Resume toggle */}
                        <button
                          onClick={() => handleToggleStreamActive(source)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted cursor-pointer"
                          title={source.is_active ? 'Pause stream' : 'Resume stream'}
                        >
                          {source.is_active ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteItem(source.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10 cursor-pointer"
                          title="Delete stream"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-foreground mt-1.5">
                      {source.name}
                    </h3>
                    {source.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {source.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 border-t border-border/30 pt-3 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground font-medium">Monthly Expected</span>
                      <span className="text-lg font-bold text-foreground">
                        ₹{Number(source.expected_amount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Monthly Status & Quick Action Button */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {isReceivedThisMonth ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Received for {formattedMonthLabel}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                          <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          <span>Pending for {formattedMonthLabel}</span>
                        </div>
                      )}

                      {!isReceivedThisMonth && (
                        <Button
                          onClick={() => handleMarkStreamReceived(source)}
                          size="xs"
                          className="gap-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium cursor-pointer shadow-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Mark Received
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center">
            <p className="text-xs text-muted-foreground">No recurring streams configured yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAddStream}
              className="mt-3 gap-1.5 rounded-full"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Recurring Stream
            </Button>
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
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md divide-y divide-border/30 overflow-hidden shadow-xs">
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
                      className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors cursor-pointer ${
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
                      className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/10 cursor-pointer"
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
              Nothing recorded yet for {formattedMonthLabel}.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="mt-3 gap-1.5 rounded-full"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Income Entry
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
                  placeholder="e.g. Monthly Salary, Freelance Client"
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
                    placeholder="50000"
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

              <div className="grid gap-2">
                <Label htmlFor="income-notes">Notes / Description (Optional)</Label>
                <Input
                  id="income-notes"
                  placeholder="Optional details or client note"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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

      {/* Edit Recurring Stream Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUpdateStream}>
            <DialogHeader>
              <DialogTitle>Edit Recurring Stream</DialogTitle>
              <DialogDescription>
                Update the expected amount, category, or status of this stream.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-stream-name">Stream Name</Label>
                <Input
                  id="edit-stream-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="edit-stream-type">Category</Label>
                  <Select value={editType} onValueChange={(val) => val && setEditType(val)}>
                    <SelectTrigger id="edit-stream-type">
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
                  <Label htmlFor="edit-stream-amount">Monthly Expected (₹)</Label>
                  <Input
                    id="edit-stream-amount"
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-stream-status">Active Status</Label>
                <Select
                  value={editIsActive ? 'ACTIVE' : 'PAUSED'}
                  onValueChange={(val) => setEditIsActive(val === 'ACTIVE')}
                >
                  <SelectTrigger id="edit-stream-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active (Included in monthly projections)</SelectItem>
                    <SelectItem value="PAUSED">Paused (Temporarily inactive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-stream-desc">Description (Optional)</Label>
                <Input
                  id="edit-stream-desc"
                  placeholder="Optional notes"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Stream</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
