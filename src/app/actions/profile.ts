'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error)
    return null
  }

  // If no profile exists, create one
  if (!data) {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        currency: 'INR',
        timezone: 'Asia/Kolkata',
      })
      .select()
      .single()
      
    if (insertError) {
      console.error('Error creating profile:', insertError)
      return null
    }
    return newProfile
  }

  return data
}

export async function updateProfile(updates: ProfileUpdate) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id)

  if (error) {
    throw new Error('Failed to update profile')
  }

  revalidatePath('/settings')
}
