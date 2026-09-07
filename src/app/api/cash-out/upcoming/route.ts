import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-utils'
import { format, addDays } from 'date-fns'

export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const days = Math.max(1, Number(searchParams.get('days') || 30))
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const futureLimitStr = format(addDays(today, days), 'yyyy-MM-dd')

  try {
    // 1. Fetch obligation_payments
    const { data: payments = [] } = await supabase
      .from('obligation_payments')
      .select('id, due_date, amount_due, status, notes, fixed_obligations(name, category)')
      .eq('user_id', user.id)
      .gte('due_date', todayStr)
      .lte('due_date', futureLimitStr)
      .neq('status', 'PAID')
      .neq('status', 'SKIPPED')
      .order('due_date', { ascending: true })

    let upcoming = (payments || []).map((p: any) => ({
      id: p.id,
      name: p.fixed_obligations?.name || 'Fixed Payment',
      category: p.fixed_obligations?.category || 'OTHER',
      dueDate: p.due_date,
      amount: Number(p.amount_due || 0),
      status: p.status,
      notes: p.notes,
    }))

    // Fallback: If no explicit payments generated yet, project from active fixed_obligations
    if (upcoming.length === 0) {
      const { data: obligations = [] } = await supabase
        .from('fixed_obligations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('due_day', { ascending: true })

      const currentDay = today.getDate()
      const currentMonthStr = format(today, 'yyyy-MM')

      upcoming = (obligations || []).map((o: any) => {
        const dueDay = o.due_day || 1
        const dueMonth = dueDay >= currentDay ? currentMonthStr : format(addDays(today, 25), 'yyyy-MM')
        const dueDate = `${dueMonth}-${String(dueDay).padStart(2, '0')}`
        return {
          id: o.id,
          name: o.name,
          category: o.category,
          dueDate,
          amount: Number(o.current_amount || 0),
          status: 'UPCOMING',
          notes: o.notes,
        }
      }).filter((item: any) => item.dueDate >= todayStr && item.dueDate <= futureLimitStr)
    }

    return successResponse({
      count: upcoming.length,
      upcoming,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to retrieve upcoming payments', 500)
  }
}
