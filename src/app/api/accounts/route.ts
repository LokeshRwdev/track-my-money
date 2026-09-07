import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  try {
    const { data: accounts = [], error: accError } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (accError) throw accError
    return successResponse(accounts)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to retrieve accounts', 500)
  }
}

export async function POST(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  try {
    const body = await request.json()
    const {
      name,
      account_type = 'BANK',
      institution,
      opening_balance = 0,
      current_balance,
      is_active = true,
    } = body

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return errorResponse('Account name is required.', 400)
    }

    const openBal = Number(opening_balance || 0)
    const currBal = current_balance !== undefined ? Number(current_balance) : openBal

    const { data, error: insertError } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name: name.trim(),
        account_type: account_type as any,
        institution: institution || null,
        opening_balance: openBal,
        current_balance: currBal,
        is_active: Boolean(is_active),
      })
      .select()
      .single()

    if (insertError) throw insertError
    return successResponse(data, 201)
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to create account', 500)
  }
}
