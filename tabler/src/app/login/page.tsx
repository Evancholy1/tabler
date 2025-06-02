// src/app/login/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import LoginForm from './LoginForm'; // a pure Client Component for the form
import type { Database } from '@/types/supabase';

export default async function LoginPage() {
  const supabaseServer = createServerComponentClient<Database>({ cookies });
  const {
    data: { session },
  } = await supabaseServer.auth.getSession();

  // If already logged in, send them to `/` (which will forward to /app or /setup-layout)
  if (session) {
    redirect('/');
  }

  // Otherwise, render the login form (Client Component)
  return <LoginForm />;
}
