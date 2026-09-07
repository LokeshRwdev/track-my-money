import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing commitment id', 400)

  try {
    const { data: obligation } = await supabase
      .from('fixed_obligations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (obligation) return successResponse({ type: 'obligation', data: obligation })

    const { data: payment } = await supabase
      .from('obligation_payments')
      .select('*, fixed_obligations(name, category)')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (payment) return successResponse({ type: 'payment', data: payment })

    return errorResponse('Commitment resource not found', 404)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch commitment item', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing commitment id', 400)

  try {
    const body = await request.json()
    const { entity_type } = body

    if (entity_type === 'payment' || body.amount_paid !== undefined || body.status !== undefined && body.due_date !== undefined) {
      const updates: any = {}
      if (body.amount_due !== undefined) updates.amount_due = Number(body.amount_due)
      if (body.amount_paid !== undefined) updates.amount_paid = Number(body.amount_paid)
      if (body.due_date !== undefined) updates.due_date = body.due_date
      if (body.paid_date !== undefined) updates.paid_date = body.paid_date
      if (body.status !== undefined) updates.status = body.status
      if (body.notes !== undefined) updates.notes = body.notes

      const { data, error: updateError } = await supabase
        .from('obligation_payments')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      return successResponse(data)
    }

    // Default: update fixed obligation
    const updates: any = {}
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.current_amount !== undefined) updates.current_amount = Number(body.current_amount)
    if (body.category !== undefined) updates.category = body.category
    if (body.due_day !== undefined) updates.due_day = Number(body.due_day)
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.frequency !== undefined) updates.frequency = body.frequency

    const { data, error: updateError } = await supabase
      .from('fixed_obligations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) throw updateError
    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update commitment resource', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing commitment id', 400)

  try {
    const { count: payCount } = await supabase
      .from('obligation_payments')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id)

    if (payCount && payCount > 0) {
      return successResponse({ deleted: true, entity: 'payment', id })
    }

    const { error: delObsError } = await supabase
      .from('fixed_obligations')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id)

    if (delObsError) throw delObsError

    return successResponse({ deleted: true, entity: 'obligation', id })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete commitment resource', 500)
  }
}
