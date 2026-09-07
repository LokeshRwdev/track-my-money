'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type Account = Database['public']['Tables']['accounts']['Row']
type AccountInsert = Database['public']['Tables']['accounts']['Insert']
type AccountUpdate = Database['public']['Tables']['accounts']['Update']

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching accounts:', error)
    return []
  }

  return data
}

export async function createAccount(account: Omit<AccountInsert, 'user_id'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('accounts')
    .insert({
      ...account,
      user_id: user.id,
    })

  if (error) {
    throw new Error('Failed to create account: ' + error.message)
  }

  revalidatePath('/accounts')
}

export async function updateAccount(id: string, updates: AccountUpdate) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)

  if (error) {
    throw new Error('Failed to update account: ' + error.message)
  }

  revalidatePath('/accounts')
}

export async function deleteAccount(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error('Failed to delete account: ' + error.message)
  }

  revalidatePath('/accounts')
}
