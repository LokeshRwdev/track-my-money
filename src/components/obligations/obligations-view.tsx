'use client'

import React, { useEffect, useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpRight, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Calendar, 
  Building,
  CreditCard,
  Home,
  Shield,
  Tv,
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

interface FixedObligation {
  id: string
  name: string
  category: 'EMI' | 'CREDIT_CARD' | 'RENT' | 'INSURANCE' | 'SUBSCRIPTION' | 'UTILITY' | 'OTHER'
  current_amount: number
  due_day: number | null
  frequency: string
  is_active: boolean
  provider: string | null
  notes: string | null
}

interface ObligationPayment {
  id: string
  obligation_id: string
  due_date: string
  amount_due: number
  amount_paid: number | null
  status: 'UPCOMING' | 'DUE' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID' | 'SKIPPED'
  fixed_obligations?: {
    name: string
    category: string
  } | null
}

interface CashOutData {
  month: string
  totalCommittedCashOut: number
  actualPaidCashOut: number
  obligations: FixedObligation[]
  payments: ObligationPayment[]
}

export function ObligationsView() {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'))
  const [data, setData] = useState<CashOutData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { withLoading } = useGlobalLoading()

  // Form states
  const [name, setName] = useState('')
  const [category, setCategory] = useState('EMI')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('5')
  const [provider, setProvider] = useState('')
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
        const res = await fetch(`/api/cash-out?month=${selectedMonth}`)
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}))
          throw new Error(errJson.error || 'Failed to load cash out data')
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

  const handleCreateObligation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !amount) return

    try {
      await withLoading(async () => {
        const res = await fetch('/api/cash-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create_obligation',
            name,
            category,
            current_amount: Number(amount),
            due_day: Number(dueDay || 1),
            frequency: 'MONTHLY',
            is_active: true,
            provider: provider || null,
            notes: notes || null,
          }),
        })

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}))
          throw new Error(errJson.error || 'Failed to create commitment')
        }

        setIsDialogOpen(false)
        setName('')
        setAmount('')
        setProvider('')
        setNotes('')
        await loadData()
      })
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteObligation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fixed commitment?')) return
    try {
      await withLoading(async () => {
        const res = await fetch(`/api/cash-out/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete')
        await loadData()
      })
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleRecordPayment = async (obligation: FixedObligation, isAlreadyPaid: boolean, paymentId?: string) => {
    try {
      await withLoading(async () => {
        if (isAlreadyPaid && paymentId) {
          // Unmark / toggle back
          const res = await fetch(`/api/cash-out/${paymentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              entity_type: 'payment',
              status: 'UPCOMING',
              amount_paid: 0,
            }),
          })
          if (!res.ok) throw new Error('Failed to update payment status')
        } else {
          // Record payment
          const day = obligation.due_day || 1
          const dueDate = `${selectedMonth}-${String(day).padStart(2, '0')}`
          const res = await fetch('/api/cash-out', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'record_payment',
              obligation_id: obligation.id,
              due_date: dueDate,
              amount_due: obligation.current_amount,
              amount_paid: obligation.current_amount,
              status: 'PAID',
            }),
          })
          if (!res.ok) throw new Error('Failed to record payment')
        }
        await loadData()
      })
    } catch (err: any) {
      alert(err.message)
    }
  }

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'EMI':
        return <Building className="h-4 w-4" />
      case 'RENT':
        return <Home className="h-4 w-4" />
      case 'CREDIT_CARD':
        return <CreditCard className="h-4 w-4" />
      case 'INSURANCE':
        return <Shield className="h-4 w-4" />
      case 'SUBSCRIPTION':
        return <Tv className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const obligations = data?.obligations || []
  const payments = data?.payments || []

  // Map payments by obligation_id
  const paymentMap = new Map<string, ObligationPayment>()
  payments.forEach((p) => {
    if (p.obligation_id) paymentMap.set(p.obligation_id, p)
  })

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-16">
      {/* Header & Month Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Cash Out
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            Manage your fixed financial commitments — EMIs, credit cards, rent, insurance, and subscriptions.
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
            Add Commitment
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hero Outflow Card */}
      <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-card/80 to-card/40 p-6 sm:p-8 backdrop-blur-xl shadow-xs">
        <div className="text-xs font-semibold tracking-wider text-rose-500 uppercase">
          Total Fixed Cash Out
        </div>
        <div className="mt-1 text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          ₹{(data?.totalCommittedCashOut || 0).toLocaleString('en-IN')}
          <span className="text-lg sm:text-xl font-normal text-muted-foreground ml-2">/ month</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span>Actual paid this month: <strong className="text-foreground">₹{(data?.actualPaidCashOut || 0).toLocaleString('en-IN')}</strong></span>
          <span>•</span>
          <span>Remaining to pay: <strong className="text-foreground">₹{Math.max(0, (data?.totalCommittedCashOut || 0) - (data?.actualPaidCashOut || 0)).toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      {/* Commitments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Commitments & Payment Status</h2>
            <p className="text-xs text-muted-foreground">
              Click the checkmark to mark an obligation as paid for {formattedMonthLabel}.
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {obligations.length} Commitments
          </Badge>
        </div>

        {obligations.length > 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-md divide-y divide-border/30 overflow-hidden">
            {obligations.map((obs) => {
              const payment = paymentMap.get(obs.id)
              const isPaid = payment?.status === 'PAID'
              return (
                <div
                  key={obs.id}
                  className="flex items-center justify-between p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Mark as paid button */}
                    <button
                      onClick={() => handleRecordPayment(obs, isPaid, payment?.id)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-all cursor-pointer ${
                        isPaid
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'border border-border/80 text-muted-foreground hover:border-emerald-500 hover:text-emerald-500'
                      }`}
                      title={isPaid ? 'Paid! Click to unmark' : 'Click to mark as Paid'}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{obs.name}</span>
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {obs.category}
                        </span>
                        {obs.provider && (
                          <span className="text-[11px] text-muted-foreground/80">
                            ({obs.provider})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                        <span>Due {obs.due_day ? `${obs.due_day}th` : '1st'} of month</span>
                        <span>•</span>
                        <span className={isPaid ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                          {isPaid ? 'Paid this month' : 'Pending payment'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold text-foreground">
                      ₹{Number(obs.current_amount).toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleDeleteObligation(obs.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
                      title="Delete commitment"
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
            <p className="text-xs text-muted-foreground">No fixed financial commitments added yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="mt-3 gap-1.5 rounded-full"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Commitment
            </Button>
          </div>
        )}
      </div>

      {/* Add Commitment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateObligation}>
            <DialogHeader>
              <DialogTitle>Add Fixed Commitment</DialogTitle>
              <DialogDescription>
                Add an EMI, bill, rent, or subscription that consumes your income every month.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="obs-name">Commitment Name</Label>
                <Input
                  id="obs-name"
                  placeholder="e.g. Home EMI, Car Loan, Netflix, Rent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="obs-category">Category</Label>
                  <Select value={category} onValueChange={(val) => val && setCategory(val)}>
                    <SelectTrigger id="obs-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMI">EMI</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="RENT">Rent</SelectItem>
                      <SelectItem value="INSURANCE">Insurance</SelectItem>
                      <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="obs-amount">Monthly Amount (₹)</Label>
                  <Input
                    id="obs-amount"
                    type="number"
                    placeholder="35000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="obs-due">Due Day of Month</Label>
                  <Input
                    id="obs-due"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="5"
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="obs-provider">Provider / Bank (Optional)</Label>
                  <Input
                    id="obs-provider"
                    placeholder="e.g. HDFC Bank, Landlord"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Commitment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
