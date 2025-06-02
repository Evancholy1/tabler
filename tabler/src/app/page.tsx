// src/app/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';

export default async function RootPageGatekeeper() {
  // 1) Initialize Supabase server‐side
  const supabaseServer = createServerComponentClient<Database>({ cookies });

  // 2) Check session
  const {
    data: { session },
  } = await supabaseServer.auth.getSession();

  if (!session) {
    // No session → redirect to /login BEFORE rendering any HTML
    redirect('/login');
  }

  // 3) Fetch is_setup from your `users` table
  const { data: userRow, error: userError } = await supabaseServer
    .from('users')
    .select('is_setup')
    .eq('id', session.user.id)
    .single();

  if (userError || !userRow) {
    // If something is wrong (no row), send to /register
    redirect('/register');
  }

  if (!userRow.is_setup) {
    // If they haven’t completed setup, send to /setup-layout
    redirect('/setup-layout');
  }

  // 4) Otherwise they are fully authenticated & set up → send to the real app
  redirect('/app');
}
