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

    // Map records by recurring source id
    const sourceRecordMap = new Map<string, any[]>()
    ;(records || []).forEach((r: any) => {
      if (r.income_source_id) {
        const list = sourceRecordMap.get(r.income_source_id) || []
        list.push(r)
        sourceRecordMap.set(r.income_source_id, list)
      }
    })

    // Expected Cash In:
    // For each active recurring stream:
    // - If record(s) exist for this month: sum of RECEIVED and EXPECTED records
    // - If no record exists yet: include the stream's expected_amount (still pending for this month)
    let expectedCashIn = 0
    const activeRecurringSources = (sources || []).filter((s: any) => s.is_active && s.is_recurring)

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
    const nonRecurringRecords = (records || []).filter((r: any) => {
      if (!r.income_source_id) return true
      const src = (sources || []).find((s: any) => s.id === r.income_source_id)
      return !src || !src.is_recurring
    })
    const nonRecurringExpected = nonRecurringRecords
      .filter((r: any) => r.status === 'RECEIVED' || r.status === 'EXPECTED')
      .reduce((sum: number, r: any) => sum + Number(r.amount || 0), 0)

    expectedCashIn += nonRecurringExpected
    const pendingCashIn = Math.max(0, expectedCashIn - actualCashIn)

    return successResponse({
      month,
      actualCashIn,
      expectedCashIn,
      pendingCashIn,
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

    // 1. Quick record income for an existing stream in a given month
    if (action === 'record_monthly_income') {
      const { income_source_id, month, amount, income_date, status = 'RECEIVED' } = body
      if (!income_source_id) {
        return errorResponse('Income source ID is required.', 400)
      }

      const { data: src, error: srcErr } = await supabase
        .from('income_sources')
        .select('*')
        .eq('id', income_source_id)
        .eq('user_id', user.id)
        .single()

      if (srcErr || !src) {
        return errorResponse('Income source not found.', 404)
      }

      const recMonth = month || (income_date ? income_date.slice(0, 7) : format(new Date(), 'yyyy-MM'))
      if (!isValidMonth(recMonth)) {
        return errorResponse('Invalid month. Expected YYYY-MM.', 400)
      }

      const recDate = income_date || `${recMonth}-01`
      const recAmount = amount !== undefined && !isNaN(Number(amount)) && Number(amount) > 0
        ? Number(amount)
        : Number(src.expected_amount)

      const { data, error: insertError } = await supabase
        .from('income_records')
        .insert({
          user_id: user.id,
          income_source_id: src.id,
          account_id: null,
          amount: recAmount,
          income_date: recDate,
          month: recMonth,
          description: `${src.name} monthly entry`,
          status: status === 'EXPECTED' ? 'EXPECTED' : 'RECEIVED',
        })
        .select()
        .single()

      if (insertError) throw insertError
      return successResponse(data, 201)
    }

    // 2. Create custom direct record
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

    // 3. Default: Create or register an income source stream
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

    // If initial received amount or logging for month is provided:
    if (body.initial_record) {
      const recDate = body.initial_record_date || format(new Date(), 'yyyy-MM-dd')
      const recMonth = body.month || recDate.slice(0, 7)
      await supabase.from('income_records').insert({
        user_id: user.id,
        income_source_id: newSource.id,
        account_id: null,
        amount: Number(expected_amount),
        income_date: recDate,
        month: recMonth,
        description: `Initial ${name.trim()} entry`,
        status: body.initial_record_status === 'EXPECTED' ? 'EXPECTED' : 'RECEIVED',
      })
    }

    return successResponse(newSource, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create income entry', 500)
  }
}
