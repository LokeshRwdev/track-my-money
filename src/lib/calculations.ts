import type { Database } from '@/types/database'

type IncomeRecord = Database['public']['Tables']['income_records']['Row']
type ObligationPayment = Database['public']['Tables']['obligation_payments']['Row']
type FixedObligation = Database['public']['Tables']['fixed_obligations']['Row']

export function calculateMonthlyCashIn(records: IncomeRecord[]): number {
  return records
    .filter(r => r.status === 'RECEIVED')
    .reduce((sum, record) => sum + Number(record.amount), 0)
}

export function calculateExpectedMonthlyCashIn(records: IncomeRecord[]): number {
  return records
    .filter(r => r.status === 'EXPECTED' || r.status === 'RECEIVED')
    .reduce((sum, record) => sum + Number(record.amount), 0)
}

export function calculateMonthlyCashOut(payments: ObligationPayment[]): number {
  return payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, payment) => sum + Number(payment.amount_paid || 0), 0)
}

export function calculateExpectedMonthlyCashOut(payments: ObligationPayment[]): number {
  return payments
    .filter(p => p.status !== 'SKIPPED')
    .reduce((sum, payment) => sum + Number(payment.amount_due), 0)
}

export function calculateNetCashFlow(cashIn: number, cashOut: number): number {
  return cashIn - cashOut
}

export function calculateFixedCommitmentRatio(cashIn: number, fixedCashOut: number): number {
  if (cashIn <= 0) return 0
  return (fixedCashOut / cashIn) * 100
}

export function calculateCashFlowMargin(cashIn: number, netCashFlow: number): number {
  if (cashIn <= 0) return 0
  return (netCashFlow / cashIn) * 100
}
