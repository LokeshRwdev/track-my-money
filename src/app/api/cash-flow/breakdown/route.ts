import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse, isValidMonth, getMonthlyFinancialData } from '@/lib/api-utils'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) {
    return errorResponse(error || 'Unauthorized', 401)
  }

  const { searchParams } = new URL(request.url)
  const currentMonth = format(new Date(), 'yyyy-MM')
  const month = searchParams.get('month') || currentMonth

  if (!isValidMonth(month)) {
    return errorResponse('Invalid month format. Expected YYYY-MM.', 400)
  }

  try {
    const data = await getMonthlyFinancialData(user.id, month, supabase)
    return successResponse({
      month: data.month,
      cashInTotal: data.cashIn > 0 ? data.cashIn : data.expectedCashIn,
      cashOutTotal: data.cashOut > 0 ? data.cashOut : data.expectedCashOut,
      recurringIncome: data.recurringIncome,
      variableIncome: data.variableIncome,
      cashInBreakdown: data.cashInBreakdown,
      cashOutBreakdown: data.cashOutBreakdown,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to retrieve breakdown', 500)
  }
}
