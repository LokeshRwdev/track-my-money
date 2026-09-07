import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing account id', 400)

  try {
    const { data: account } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!account) return errorResponse('Account not found', 404)
    return successResponse(account)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch account', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing account id', 400)

  try {
    const body = await request.json()
    const updates: any = {}
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.account_type !== undefined) updates.account_type = body.account_type
    if (body.institution !== undefined) updates.institution = body.institution
    if (body.current_balance !== undefined) updates.current_balance = Number(body.current_balance)
    if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)

    const { data, error: updateError } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) throw updateError
    return successResponse(data)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update account', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { id } = await params
  if (!id) return errorResponse('Missing account id', 400)

  try {
    const { error: delError } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (delError) throw delError
    return successResponse({ deleted: true, id })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete account', 500)
  }
}
