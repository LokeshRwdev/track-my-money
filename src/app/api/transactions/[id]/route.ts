import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing transaction id', 400)

  try {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*, accounts(name, account_type)')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!transaction) return errorResponse('Transaction not found', 404)
    return successResponse(transaction)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch transaction', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing transaction id', 400)

  try {
    const body = await request.json()
    const updates: any = {}
    if (body.account_id !== undefined) updates.account_id = body.account_id
    if (body.amount !== undefined) updates.amount = Number(body.amount)
    if (body.transaction_type !== undefined) updates.transaction_type = body.transaction_type
    if (body.transaction_date !== undefined) updates.transaction_date = body.transaction_date
    if (body.category !== undefined) updates.category = body.category
    if (body.description !== undefined) updates.description = body.description

    const { data, error: updateError } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) throw updateError
    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update transaction', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing transaction id', 400)

  try {
    const { error: delError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (delError) throw delError
    return successResponse({ deleted: true, id })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete transaction', 500)
  }
}
