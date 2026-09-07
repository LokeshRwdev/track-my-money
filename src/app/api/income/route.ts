import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse, isValidMonth } from '@/lib/api-utils'
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
    // 1. Fetch all user income sources
    const { data: sources = [], error: sourcesError } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', user.id)
      .order('is_recurring', { ascending: false })
      .order('name', { ascending: true })

    if (sourcesError) throw sourcesError

    // 2. Fetch income records for this month
    const { data: records = [], error: recordsError } = await supabase
      .from('income_records')
      .select('*, income_sources(name, income_type, is_recurring)')
      .eq('user_id', user.id)
      .eq('month', month)
      .order('income_date', { ascending: false })

    if (recordsError) throw recordsError

    // Compute totals
    const actualCashIn = (records || [])
      .filter((r: any) => r.status === 'RECEIVED')
      .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)

    const expectedCashInRecords = (records || [])
      .filter((r: any) => r.status === 'EXPECTED' || r.status === 'RECEIVED')
      .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)

    const recurringSourceTotal = (sources || [])
      .filter((s: any) => s.is_active && s.is_recurring)
      .reduce((sum: number, s: any) => sum + Number(s.expected_amount || 0), 0)

    const expectedCashIn = expectedCashInRecords > 0 ? expectedCashInRecords : recurringSourceTotal

    return successResponse({
      month,
      actualCashIn,
      expectedCashIn,
      sources,
      records,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to retrieve income streams', 500)
  }
}

export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) {
    return errorResponse(error || 'Unauthorized', 401)
  }

  try {
    const body = await request.json()
    const { action = 'create_source' } = body

    if (action === 'create_record') {
      const { income_source_id, amount, income_date, month, status = 'RECEIVED', description, account_id } = body
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return errorResponse('Valid positive amount is required.', 400)
      }
      if (!income_date) {
        return errorResponse('Income date is required (YYYY-MM-DD).', 400)
      }

      const recMonth = month || income_date.slice(0, 7)
      if (!isValidMonth(recMonth)) {
        return errorResponse('Invalid month. Expected YYYY-MM.', 400)
      }

      const { data, error: insertError } = await supabase
        .from('income_records')
        .insert({
          user_id: user.id,
          income_source_id: income_source_id || null,
          account_id: account_id || null,
          amount: Number(amount),
          income_date,
          month: recMonth,
          description: description || null,
          status: status === 'EXPECTED' ? 'EXPECTED' : status === 'CANCELLED' ? 'CANCELLED' : 'RECEIVED',
        })
        .select()
        .single()

      if (insertError) throw insertError
      return successResponse(data, 201)
    }

    // Default: Create or register an income source stream
    const { name, income_type = 'SALARY', expected_amount, is_recurring = true, frequency = 'MONTHLY', description } = body
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return errorResponse('Income source name is required.', 400)
    }
    if (expected_amount === undefined || isNaN(Number(expected_amount)) || Number(expected_amount) < 0) {
      return errorResponse('Valid expected amount is required.', 400)
    }

    const validTypes = ['SALARY', 'BUSINESS', 'STOCK_MARKET', 'INVESTMENT', 'FREELANCE', 'OTHER']
    const type = validTypes.includes(income_type) ? income_type : 'OTHER'

    const { data: newSource, error: sourceInsertError } = await supabase
      .from('income_sources')
      .insert({
        user_id: user.id,
        name: name.trim(),
        income_type: type as any,
        expected_amount: Number(expected_amount),
        is_recurring: Boolean(is_recurring),
        frequency: frequency || 'MONTHLY',
        is_active: true,
        description: description || null,
      })
      .select()
      .single()

    if (sourceInsertError) throw sourceInsertError

    // If initial received amount or logging for current month is provided:
    if (body.initial_record) {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const currMonth = format(new Date(), 'yyyy-MM')
      await supabase.from('income_records').insert({
        user_id: user.id,
        income_source_id: newSource.id,
        account_id: null,
        amount: Number(expected_amount),
        income_date: body.initial_record_date || todayStr,
        month: currMonth,
        description: `Initial ${name.trim()} entry`,
        status: body.initial_record_status === 'EXPECTED' ? 'EXPECTED' : 'RECEIVED',
      })
    }

    return successResponse(newSource, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create income entry', 500)
  }
}
