'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type IncomeSource = Database['public']['Tables']['income_sources']['Row']
type IncomeSourceInsert = Database['public']['Tables']['income_sources']['Insert']
type IncomeSourceUpdate = Database['public']['Tables']['income_sources']['Update']

type IncomeRecord = Database['public']['Tables']['income_records']['Row']
type IncomeRecordInsert = Database['public']['Tables']['income_records']['Insert']
type IncomeRecordUpdate = Database['public']['Tables']['income_records']['Update']

// --- Income Sources ---

export async function getIncomeSources(): Promise<IncomeSource[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('income_sources')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching income sources:', error)
    return []
  }

  return data
}

export async function createIncomeSource(source: Omit<IncomeSourceInsert, 'user_id'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('income_sources')
    .insert({
      ...source,
      user_id: user.id,
    })

  if (error) throw new Error('Failed to create income source: ' + error.message)

  revalidatePath('/income')
}

export async function updateIncomeSource(id: string, updates: IncomeSourceUpdate) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('income_sources')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error('Failed to update income source: ' + error.message)

  revalidatePath('/income')
}

export async function deleteIncomeSource(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('income_sources')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Failed to delete income source: ' + error.message)

  revalidatePath('/income')
}

// --- Income Records ---

export async function getIncomeRecords(month?: string): Promise<(IncomeRecord & { income_sources: { name: string, income_type: string } | null })[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('income_records')
    .select('*, income_sources(name, income_type)')
    .order('income_date', { ascending: false })

  if (month) {
    query = query.eq('month', month)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching income records:', error)
    return []
  }

  return data as any
}

export async function createIncomeRecord(record: Omit<IncomeRecordInsert, 'user_id'>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('income_records')
    .insert({
      ...record,
      user_id: user.id,
    })

  if (error) throw new Error('Failed to create income record: ' + error.message)

  // Wait, if it's RECEIVED, maybe we also insert a Transaction?
  // Or we handle Transactions separately or via triggers.
  // The plan said "Unified ledger for transfers... and income not tracked via sources" or similar.
  // Actually, keeping the source of truth explicit is better.

  revalidatePath('/income')
  revalidatePath('/dashboard')
}

export async function updateIncomeRecord(id: string, updates: IncomeRecordUpdate) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('income_records')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error('Failed to update income record: ' + error.message)

  revalidatePath('/income')
  revalidatePath('/dashboard')
}

export async function deleteIncomeRecord(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('income_records')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Failed to delete income record: ' + error.message)

  revalidatePath('/income')
  revalidatePath('/dashboard')
}
