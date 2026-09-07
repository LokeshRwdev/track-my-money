import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)))
  const type = searchParams.get('type')

  try {
    let query = supabase
      .from('transactions')
      .select('*, accounts(name, account_type)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(limit)

    if (type && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) {
      query = query.eq('transaction_type', type)
    }

    const { data: transactions = [], error: txError } = await query
    if (txError) throw txError

    return successResponse(transactions)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to retrieve transactions', 500)
  }
}

export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  try {
    const body = await request.json()
    const {
      account_id,
      transaction_type = 'EXPENSE',
      amount,
      transaction_date,
      category,
      description,
      reference_type = 'NONE',
      reference_id,
    } = body

    if (!account_id) return errorResponse('Account ID is required.', 400)
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return errorResponse('Valid positive transaction amount is required.', 400)
    }
    if (!transaction_date) {
      return errorResponse('Transaction date is required (YYYY-MM-DD).', 400)
    }

    const { data, error: insertError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        account_id,
        transaction_type: transaction_type as any,
        amount: Number(amount),
        transaction_date,
        category: category || null,
        description: description || null,
        reference_type: reference_type as any,
        reference_id: reference_id || null,
      })
      .select()
      .single()

    if (insertError) throw insertError
    return successResponse(data, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create transaction', 500)
  }
}
