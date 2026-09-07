import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-utils'
import { format, subMonths } from 'date-fns'

export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) {
    return errorResponse(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const monthsCount = Math.min(12, Math.max(1, Number(searchParams.get('months') || 6)))
  const baseMonth = searchParams.get('month') || format(new Date(), 'yyyy-MM')

  try {
    const history = []
    const [targetYear, targetMonth] = baseMonth.split('-').map(Number)
    const baseDate = new Date(targetYear, targetMonth - 1, 1)

    for (let i = monthsCount - 1; i >= 0; i--) {
      const histDate = subMonths(baseDate, i)
      const histMonthKey = format(histDate, 'yyyy-MM')
      const monthLabel = format(histDate, 'MMM yyyy')

      // Query actual income
      const { data: histInRecords = [] } = await supabase
        .from('income_records')
        .select('amount, status')
        .eq('user_id', user.id)
        .eq('month', histMonthKey)
        .eq('status', 'RECEIVED')

      const [hYear, hMonth] = histMonthKey.split('-')
      const hLastDay = new Date(Number(hYear), Number(hMonth), 0).getDate()
      const hStart = `${histMonthKey}-01`
      const hEnd = `${histMonthKey}-${String(hLastDay).padStart(2, '0')}`

      // Query actual payments
      const { data: histOutPayments = [] } = await supabase
        .from('obligation_payments')
        .select('amount_paid, amount_due, status')
        .eq('user_id', user.id)
        .gte('due_date', hStart)
        .lte('due_date', hEnd)
        .eq('status', 'PAID')

      const hIn = (histInRecords || []).reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)
      const hOut = (histOutPayments || []).reduce((sum: number, p: any) => sum + Number(p.amount_paid || p.amount_due || 0), 0)

      history.push({
        month: histMonthKey,
        monthLabel,
        cashIn: hIn,
        cashOut: hOut,
        netCashFlow: hIn - hOut,
      })
    }

    return successResponse({ months: monthsCount, history })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to retrieve historical cash flow', 500)
  }
}
