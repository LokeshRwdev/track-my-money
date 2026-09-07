import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, errorResponse } from '@/lib/api-utils'
import { generateProjections } from '@/lib/projection'

export async function GET(request: NextRequest) {
  const { supabase, user, error } = await getAuthUser()
  if (error || !user) return errorResponse(error || 'Unauthorized', 401)

  const { searchParams } = new URL(request.url)
  const monthsCount = Math.min(24, Math.max(1, Number(searchParams.get('months') || 6)))

  try {
    const { data: incomeSources = [] } = await supabase
      .from('income_sources')
      .select('*')
      .eq('user_id', user.id)

    const { data: obligations = [] } = await supabase
      .from('fixed_obligations')
      .select('*')
      .eq('user_id', user.id)

    const projections = generateProjections(monthsCount, incomeSources || [], obligations || [])

    return successResponse({
      monthsCount,
      projections,
    })
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to generate projections', 500)
  }
}
