'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .limit(100) // Default limit

  if (error) {
    console.error('Error fetching transactions:', error)
    return []
  }

  return data
}

export async function createTransaction(transaction: Omit<TransactionInsert, 'user_id'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('transactions')
    .insert({
      ...transaction,
      user_id: user.id,
    })

  if (error) throw new Error('Failed to create transaction: ' + error.message)

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/cash-flow')
}

export async function updateTransaction(id: string, updates: TransactionUpdate) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error('Failed to update transaction: ' + error.message)

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/cash-flow')
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Failed to delete transaction: ' + error.message)

  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/cash-flow')
}
