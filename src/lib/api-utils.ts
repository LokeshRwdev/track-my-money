import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { supabase, user: null, error: 'Unauthorized: Please log in.' }
  }

  return { supabase, user, error: null }
}

export function successResponse(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status = 400, details?: any) {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  )
}

export function isValidMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
}

export async function getMonthlyFinancialData(userId: string, month: string, supabase: any) {
  const [yearStr, monthStr] = month.split('-')
  const startDate = `${month}-01`
  // approximate month end date
  const lastDay = new Date(Number(yearStr), Number(monthStr), 0).getDate()
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

  // 1. Fetch Income Sources & Records
  const { data: incomeSources = [] } = await supabase
    .from('income_sources')
    .select('*')
    .eq('user_id', userId)

  const { data: incomeRecords = [] } = await supabase
    .from('income_records')
    .select('*, income_sources(name, income_type, is_recurring)')
    .eq('user_id', userId)
    .eq('month', month)

  // 2. Fetch Fixed Obligations & Payments
  const { data: fixedObligations = [] } = await supabase
    .from('fixed_obligations')
    .select('*')
    .eq('user_id', userId)

  const { data: obligationPayments = [] } = await supabase
    .from('obligation_payments')
    .select('*, fixed_obligations(name, category, current_amount)')
    .eq('user_id', userId)
    .gte('due_date', startDate)
    .lte('due_date', endDate)

  // Calculate Actual Cash In (RECEIVED status)
  const actualCashIn = (incomeRecords || [])
    .filter((r: any) => r.status === 'RECEIVED')
    .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)

  // Map records by recurring source id
  const sourceRecordMap = new Map<string, any[]>()
  ;(incomeRecords || []).forEach((r: any) => {
    if (r.income_source_id) {
      const list = sourceRecordMap.get(r.income_source_id) || []
      list.push(r)
      sourceRecordMap.set(r.income_source_id, list)
    }
  })

  // Calculate Expected Cash In:
  // For each active recurring stream:
  // - If record(s) exist for this month: sum of RECEIVED and EXPECTED records
  // - If no record exists yet: include the stream's expected_amount (still pending for this month)
  let expectedCashIn = 0
  const activeRecurringSources = (incomeSources || []).filter((s: any) => s.is_active && s.is_recurring)

  activeRecurringSources.forEach((s: any) => {
    const recs = sourceRecordMap.get(s.id)
    if (recs && recs.length > 0) {
      const sourceTotal = recs
        .filter((r: any) => r.status === 'RECEIVED' || r.status === 'EXPECTED')
        .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)
      expectedCashIn += sourceTotal
    } else {
      expectedCashIn += Number(s.expected_amount || 0)
    }
  })

  // Non-recurring records (one-time or variable) for this month
  const nonRecurringRecords = (incomeRecords || []).filter((r: any) => {
    if (!r.income_source_id) return true
    const src = (incomeSources || []).find((s: any) => s.id === r.income_source_id)
    return !src || !src.is_recurring
  })
  const nonRecurringExpected = nonRecurringRecords
    .filter((r: any) => r.status === 'RECEIVED' || r.status === 'EXPECTED')
    .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)

  expectedCashIn += nonRecurringExpected

  // Calculate Actual Cash Out (PAID status)
  const actualCashOut = (obligationPayments || [])
    .filter((p: any) => p.status === 'PAID')
    .reduce((sum: number, p: any) => sum + Number(p.amount_paid || p.amount_due || 0), 0)

  // Calculate Expected Cash Out
  const paymentsExpected = (obligationPayments || [])
    .filter((p: any) => p.status !== 'SKIPPED')
    .reduce((sum: number, p: any) => sum + Number(p.amount_due || 0), 0)

  const activeFixedObligationTotal = (fixedObligations || [])
    .filter((o: any) => o.is_active)
    .reduce((sum: number, o: any) => sum + Number(o.current_amount || 0), 0)

  const expectedCashOut = paymentsExpected > 0 ? paymentsExpected : activeFixedObligationTotal

  // Net Cash Flow: Actual Cash In - Actual Cash Out
  // If actualCashIn & actualCashOut are 0, we also calculate expected net
  const netCashFlow = actualCashIn - actualCashOut
  const expectedNetCashFlow = expectedCashIn - expectedCashOut

  // Retained Percentage: % of incoming money kept after obligations
  const effectiveIn = actualCashIn > 0 ? actualCashIn : expectedCashIn
  const effectiveOut = actualCashOut > 0 ? actualCashOut : expectedCashOut
  const effectiveNet = actualCashIn > 0 ? netCashFlow : expectedNetCashFlow

  const retainedPercentage = effectiveIn > 0 
    ? Math.max(0, Math.round(((effectiveIn - effectiveOut) / effectiveIn) * 100))
    : 0

  // Recurring vs Variable Income breakdown
  let recurringIncome = 0
  let variableIncome = 0

  const sourceMap = new Map<string, { name: string; type: string; amount: number; isRecurring: boolean; status?: string }>()

  // 1. Map all active recurring streams (guaranteeing each stream like paybyte & youngestMinds is represented)
  activeRecurringSources.forEach((s: any) => {
    const recs = sourceRecordMap.get(s.id)
    if (recs && recs.length > 0) {
      const sourceReceived = recs
        .filter((r: any) => r.status === 'RECEIVED')
        .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)
      const sourceTotal = recs
        .filter((r: any) => r.status === 'RECEIVED' || r.status === 'EXPECTED')
        .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)
      const amt = sourceTotal > 0 ? sourceTotal : Number(s.expected_amount || 0)
      recurringIncome += amt
      sourceMap.set(s.id, {
        name: s.name,
        type: s.income_type,
        amount: amt,
        isRecurring: true,
        status: sourceReceived > 0 ? 'RECEIVED' : 'EXPECTED',
      })
    } else {
      const amt = Number(s.expected_amount || 0)
      recurringIncome += amt
      sourceMap.set(s.id, {
        name: s.name,
        type: s.income_type,
        amount: amt,
        isRecurring: true,
        status: 'EXPECTED',
      })
    }
  })

  // 2. Map non-recurring / variable records
  nonRecurringRecords.forEach((r: any) => {
    const amt = Number(r.amount || 0)
    variableIncome += amt
    const key = r.income_source_id || r.id
    sourceMap.set(key, {
      name: r.income_sources?.name || r.description || 'Variable Inflow',
      type: r.income_sources?.income_type || 'OTHER',
      amount: amt,
      isRecurring: false,
      status: r.status,
    })
  })

  // Cash In Breakdown array with percentages
  const totalBreakdownIn = recurringIncome + variableIncome || 1
  const cashInBreakdown = Array.from(sourceMap.values()).map(item => ({
    ...item,
    percentage: Math.round((item.amount / totalBreakdownIn) * 100),
  }))

  // Cash Out Breakdown by commitment / category
  const commitmentMap = new Map<string, { name: string; category: string; amount: number }>()

  if (obligationPayments && obligationPayments.length > 0) {
    obligationPayments.forEach((p: any) => {
      const name = p.fixed_obligations?.name || 'Obligation'
      const category = p.fixed_obligations?.category || 'OTHER'
      const amt = Number(p.amount_paid || p.amount_due || 0)
      const existing = commitmentMap.get(p.obligation_id)
      if (existing) {
        existing.amount += amt
      } else {
        commitmentMap.set(p.obligation_id, { name, category, amount: amt })
      }
    })
  } else {
    (fixedObligations || []).forEach((o: any) => {
      if (!o.is_active) return
      commitmentMap.set(o.id, {
        name: o.name,
        category: o.category,
        amount: Number(o.current_amount || 0),
      })
    })
  }

  const totalBreakdownOut = Array.from(commitmentMap.values()).reduce((sum, c) => sum + c.amount, 0) || 1
  const cashOutBreakdown = Array.from(commitmentMap.values()).map(c => ({
    ...c,
    percentage: Math.round((c.amount / totalBreakdownOut) * 100),
  }))

  const fixedCommitmentsTotal = activeFixedObligationTotal || effectiveOut
  const activeRecurringSourceTotal = activeRecurringSources.reduce((sum: number, s: any) => sum + Number(s.expected_amount || 0), 0)
  const recurringIncomeTotal = recurringIncome || activeRecurringSourceTotal

  // Coverage Ratio: Recurring Income / Fixed Commitments (e.g. 1.69x)
  const coverageRatio = fixedCommitmentsTotal > 0
    ? Number((recurringIncomeTotal / fixedCommitmentsTotal).toFixed(2))
    : recurringIncomeTotal > 0 ? 999 : 0

  // Commitment Ratio: % of recurring income used by fixed commitments (e.g. 59%)
  const commitmentRatio = recurringIncomeTotal > 0
    ? Number(((fixedCommitmentsTotal / recurringIncomeTotal) * 100).toFixed(1))
    : 0

  return {
    month,
    cashIn: actualCashIn,
    cashOut: actualCashOut,
    netCashFlow,
    expectedCashIn,
    expectedCashOut,
    expectedNetCashFlow,
    retainedPercentage,
    recurringIncome: recurringIncomeTotal,
    variableIncome,
    fixedCommitments: fixedCommitmentsTotal,
    coverageRatio,
    commitmentRatio,
    cashInBreakdown,
    cashOutBreakdown,
  }
}
