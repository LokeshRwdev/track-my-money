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
      cashIn: data.cashIn,
      cashOut: data.cashOut,
      netCashFlow: data.netCashFlow,
      expectedCashIn: data.expectedCashIn,
      expectedCashOut: data.expectedCashOut,
      expectedNetCashFlow: data.expectedNetCashFlow,
      retainedPercentage: data.retainedPercentage,
      recurringIncome: data.recurringIncome,
      variableIncome: data.variableIncome,
      fixedCommitments: data.fixedCommitments,
      coverageRatio: data.coverageRatio,
      commitmentRatio: data.commitmentRatio,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to retrieve monthly cash flow', 500)
  }
}
