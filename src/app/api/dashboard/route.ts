import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse, isValidMonth, getMonthlyFinancialData } from '@/lib/api-utils'
import { format, subMonths, parseISO } from 'date-fns'

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
    // 1. Get primary monthly financial metrics & breakdowns
    const monthlyData = await getMonthlyFinancialData(user.id, month, supabase)

    // 2. Get Upcoming Payments
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const { data: upcomingPaymentsData = [] } = await supabase
      .from('obligation_payments')
      .select('id, due_date, amount_due, status, fixed_obligations(name, category)')
      .eq('user_id', user.id)
      .gte('due_date', todayStr)
      .neq('status', 'PAID')
      .neq('status', 'SKIPPED')
      .order('due_date', { ascending: true })
      .limit(5)

    let upcomingPayments = (upcomingPaymentsData || []).map((p: any) => ({
      id: p.id,
      name: p.fixed_obligations?.name || 'Obligation',
      category: p.fixed_obligations?.category || 'OTHER',
      dueDate: p.due_date,
      amount: Number(p.amount_due || 0),
      status: p.status,
    }))

    // If no individual payments are logged in obligation_payments yet, project from active fixed_obligations
    if (upcomingPayments.length === 0) {
      const { data: activeObligations = [] } = await supabase
        .from('fixed_obligations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('due_day', { ascending: true })

      const currentDay = new Date().getDate()
      upcomingPayments = (activeObligations || []).map((o: any) => {
        const dueDay = o.due_day || 1
        const dueMonth = dueDay >= currentDay ? month : format(new Date(), 'yyyy-MM')
        const formattedDueDate = `${dueMonth}-${String(dueDay).padStart(2, '0')}`
        return {
          id: o.id,
          name: o.name,
          category: o.category,
          dueDate: formattedDueDate,
          amount: Number(o.current_amount || 0),
          status: 'UPCOMING',
        }
      }).slice(0, 5)
    }

    // 3. 6-Month Historical Cash Flow Trend
    const history = []
    const [targetYear, targetMonth] = month.split('-').map(Number)
    const baseDate = new Date(targetYear, targetMonth - 1, 1)

    for (let i = 5; i >= 0; i--) {
      const histDate = subMonths(baseDate, i)
      const histMonthKey = format(histDate, 'yyyy-MM')
      const monthLabel = format(histDate, 'MMM')

      // Query actuals for that month
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

      const { data: histOutPayments = [] } = await supabase
        .from('obligation_payments')
        .select('amount_paid, amount_due, status')
        .eq('user_id', user.id)
        .gte('due_date', hStart)
        .lte('due_date', hEnd)
        .eq('status', 'PAID')

      let hIn = (histInRecords || []).reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)
      let hOut = (histOutPayments || []).reduce((sum: number, p: any) => sum + Number(p.amount_paid || p.amount_due || 0), 0)

      // If user is viewing the current month and has configured recurring streams but hasn't marked records as RECEIVED yet,
      // show expected numbers so the chart isn't a completely blank drop-off
      if (hIn === 0 && histMonthKey === month && monthlyData.expectedCashIn > 0) {
        hIn = monthlyData.expectedCashIn
      }
      if (hOut === 0 && histMonthKey === month && monthlyData.expectedCashOut > 0) {
        hOut = monthlyData.expectedCashOut
      }

      history.push({
        month: histMonthKey,
        monthLabel,
        cashIn: hIn,
        cashOut: hOut,
        net: hIn - hOut,
      })
    }

    return successResponse({
      ...monthlyData,
      upcomingPayments,
      history,
    })
  } catch (err: any) {
    console.error('Error generating dashboard data:', err)
    return errorResponse(err.message || 'Failed to retrieve dashboard data', 500)
  }
}
