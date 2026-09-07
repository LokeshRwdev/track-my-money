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

  const [yearStr, monthStr] = month.split('-')
  const startDate = `${month}-01`
  const lastDay = new Date(Number(yearStr), Number(monthStr), 0).getDate()
  const endDate = `${month}-${String(lastDay).padStart(2, '0')}`

  try {
    // 1. Fetch all fixed obligations
    const { data: obligations = [], error: obsError } = await supabase
      .from('fixed_obligations')
      .select('*')
      .eq('user_id', user.id)
      .order('due_day', { ascending: true })

    if (obsError) throw obsError

    // 2. Fetch payments for this month
    const { data: payments = [], error: payError } = await supabase
      .from('obligation_payments')
      .select('*, fixed_obligations(name, category)')
      .eq('user_id', user.id)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .order('due_date', { ascending: true })

    if (payError) throw payError

    // Compute monthly committed cash out
    const totalCommitted = (obligations || [])
      .filter((o: any) => o.is_active)
      .reduce((sum: number, o: any) => sum + Number(o.current_amount || 0), 0)

    const actualPaid = (payments || [])
      .filter((p: any) => p.status === 'PAID')
      .reduce((sum: number, p: any) => sum + Number(p.amount_paid || p.amount_due || 0), 0)

    return successResponse({
      month,
      totalCommittedCashOut: totalCommitted,
      actualPaidCashOut: actualPaid,
      obligations,
      payments,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to retrieve cash out commitments', 500)
  }
}

export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) {
    return errorResponse(error || 'Unauthorized', 401)
  }

  try {
    const body = await request.json()
    const { action = 'create_obligation' } = body

    if (action === 'record_payment') {
      const { obligation_id, due_date, amount_due, amount_paid, paid_date, status = 'PAID', notes } = body
      if (!obligation_id) return errorResponse('Obligation ID is required.', 400)
      if (!due_date) return errorResponse('Due date is required.', 400)

      const { data, error: payInsertError } = await supabase
        .from('obligation_payments')
        .insert({
          user_id: user.id,
          obligation_id,
          due_date,
          amount_due: Number(amount_due || amount_paid || 0),
          amount_paid: amount_paid !== undefined ? Number(amount_paid) : Number(amount_due || 0),
          paid_date: paid_date || (status === 'PAID' ? format(new Date(), 'yyyy-MM-dd') : null),
          status: status as any,
          payment_account_id: body.payment_account_id || null,
          notes: notes || null,
        })
        .select()
        .single()

      if (payInsertError) throw payInsertError
      return successResponse(data, 201)
    }

    // Default: Create a fixed commitment
    const {
      name,
      amount,
      current_amount,
      category = 'OTHER',
      due_day,
      frequency = 'MONTHLY',
      is_active = true,
      notes,
      provider,
      start_date,
      end_date,
      total_installments,
      interest_rate,
      account_id,
    } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return errorResponse('Commitment name is required.', 400)
    }

    const commitmentAmount = Number(current_amount || amount || 0)
    if (isNaN(commitmentAmount) || commitmentAmount <= 0) {
      return errorResponse('Valid commitment amount is required.', 400)
    }

    const validCategories = ['EMI', 'CREDIT_CARD', 'RENT', 'INSURANCE', 'SUBSCRIPTION', 'UTILITY', 'OTHER']
    const cat = validCategories.includes(category) ? category : 'OTHER'

    const { data: newObligation, error: obsInsertError } = await supabase
      .from('fixed_obligations')
      .insert({
        user_id: user.id,
        name: name.trim(),
        category: cat as any,
        account_id: account_id || null,
        current_amount: commitmentAmount,
        original_amount: body.original_amount ? Number(body.original_amount) : commitmentAmount,
        due_day: due_day ? Number(due_day) : 1,
        frequency: frequency || 'MONTHLY',
        is_active: Boolean(is_active),
        notes: notes || null,
        provider: provider || null,
        start_date: start_date || null,
        end_date: end_date || null,
        total_installments: total_installments ? Number(total_installments) : null,
        remaining_installments: body.remaining_installments ? Number(body.remaining_installments) : null,
        interest_rate: interest_rate ? Number(interest_rate) : null,
      })
      .select()
      .single()

    if (obsInsertError) throw obsInsertError

    return successResponse(newObligation, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create commitment', 500)
  }
}
