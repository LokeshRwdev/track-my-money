'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/auth/login?error=' + encodeURIComponent('Please enter both email and password.'))
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/auth/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/auth/login?tab=signup&error=' + encodeURIComponent('Please enter both email and password.'))
  }

  if (password.length < 6) {
    redirect('/auth/login?tab=signup&error=' + encodeURIComponent('Password must be at least 6 characters long.'))
  }

  // Determine origin for Supabase email redirect URL
  let emailRedirectTo: string | undefined = undefined
  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') || 'http'
    if (host) {
      emailRedirectTo = `${proto}://${host}/auth/callback`
    }
  } catch {
    // If headers resolution fails, Supabase will use default configured site URL
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  })

  if (error) {
    redirect('/auth/login?tab=signup&error=' + encodeURIComponent(error.message))
  }

  // Case 1: Session is directly available (auto-confirm enabled or email verification disabled)
  if (authData.session) {
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }

  // Case 2: Account already exists in Supabase
  // When email confirmation is enabled, Supabase returns user with empty identities and no session
  if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
    redirect('/auth/login?error=' + encodeURIComponent('An account with this email already exists. Please log in with your password.'))
  }

  // Case 3: Email confirmation required
  redirect(
    '/auth/login?message=' +
      encodeURIComponent('Account created! Please check your email to confirm your account before logging in.')
  )
}
