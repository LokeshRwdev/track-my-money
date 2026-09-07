import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing resource id', 400)

  try {
    // Check if it is a source
    const { data: source } = await supabase
      .from('income_sources')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (source) return successResponse({ type: 'source', data: source })

    // Check if it is a record
    const { data: record } = await supabase
      .from('income_records')
      .select('*, income_sources(name, income_type)')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (record) return successResponse({ type: 'record', data: record })

    return errorResponse('Income resource not found', 404)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch income item', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing resource id', 400)

  try {
    const body = await request.json()
    const { entity_type } = body

    if (entity_type === 'record' || body.amount !== undefined && body.income_date !== undefined) {
      // Update record
      const updates: any = {}
      if (body.amount !== undefined) updates.amount = Number(body.amount)
      if (body.income_date !== undefined) {
        updates.income_date = body.income_date
        updates.month = body.income_date.slice(0, 7)
      }
      if (body.status !== undefined) updates.status = body.status
      if (body.description !== undefined) updates.description = body.description

      const { data, error: updateError } = await supabase
        .from('income_records')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError
      return successResponse(data)
    }

    // Default: update source
    const updates: any = {}
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.income_type !== undefined) updates.income_type = body.income_type
    if (body.expected_amount !== undefined) updates.expected_amount = Number(body.expected_amount)
    if (body.is_recurring !== undefined) updates.is_recurring = Boolean(body.is_recurring)
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)
    if (body.description !== undefined) updates.description = body.description

    const { data, error: updateError } = await supabase
      .from('income_sources')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) throw updateError
    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update income resource', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing resource id', 400)

  try {
    // Attempt delete from records first
    const { error: delRecordError, count: recCount } = await supabase
      .from('income_records')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id)

    if (recCount && recCount > 0) {
      return successResponse({ deleted: true, entity: 'record', id })
    }

    // Attempt delete from sources
    const { error: delSourceError, count: srcCount } = await supabase
      .from('income_sources')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id)

    if (delSourceError) throw delSourceError

    return successResponse({ deleted: true, entity: 'source', id })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete income resource', 500)
  }
}
