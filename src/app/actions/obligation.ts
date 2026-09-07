'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type Obligation = Database['public']['Tables']['fixed_obligations']['Row']
type ObligationInsert = Database['public']['Tables']['fixed_obligations']['Insert']
type ObligationUpdate = Database['public']['Tables']['fixed_obligations']['Update']

type ObligationPayment = Database['public']['Tables']['obligation_payments']['Row']
type ObligationPaymentInsert = Database['public']['Tables']['obligation_payments']['Insert']
type ObligationPaymentUpdate = Database['public']['Tables']['obligation_payments']['Update']

// --- Fixed Obligations ---

export async function getFixedObligations(): Promise<Obligation[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('fixed_obligations')
    .select('*')
    .order('due_day', { ascending: true })

  if (error) {
    console.error('Error fetching fixed obligations:', error)
    return []
  }

  return data
}

export async function createFixedObligation(obligation: Omit<ObligationInsert, 'user_id'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('fixed_obligations')
    .insert({
      ...obligation,
      user_id: user.id,
    })

  if (error) throw new Error('Failed to create obligation: ' + error.message)

  revalidatePath('/obligations')
  revalidatePath('/dashboard')
}

export async function updateFixedObligation(id: string, updates: ObligationUpdate) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('fixed_obligations')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error('Failed to update obligation: ' + error.message)

  revalidatePath('/obligations')
  revalidatePath('/dashboard')
}

export async function deleteFixedObligation(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('fixed_obligations')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Failed to delete obligation: ' + error.message)

  revalidatePath('/obligations')
  revalidatePath('/dashboard')
}

// --- Obligation Payments ---

export async function getObligationPayments(monthStart?: string, monthEnd?: string): Promise<(ObligationPayment & { fixed_obligations: { name: string, category: string } | null })[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('obligation_payments')
    .select('*, fixed_obligations(name, category)')
    .order('due_date', { ascending: true })

  if (monthStart && monthEnd) {
    query = query.gte('due_date', monthStart).lte('due_date', monthEnd)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching obligation payments:', error)
    return []
  }

  return data as any
}

export async function createObligationPayment(payment: Omit<ObligationPaymentInsert, 'user_id'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('obligation_payments')
    .insert({
      ...payment,
      user_id: user.id,
    })

  if (error) throw new Error('Failed to create obligation payment: ' + error.message)

  revalidatePath('/obligations')
  revalidatePath('/dashboard')
}

export async function updateObligationPayment(id: string, updates: ObligationPaymentUpdate) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('obligation_payments')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error('Failed to update obligation payment: ' + error.message)

  revalidatePath('/obligations')
  revalidatePath('/dashboard')
}

export async function deleteObligationPayment(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('obligation_payments')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Failed to delete obligation payment: ' + error.message)

  revalidatePath('/obligations')
  revalidatePath('/dashboard')
}
