// src/app/register/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import RegisterForm from './RegisterForm'; // the Client Component (see next section)

export default async function RegisterPage() {
  // Initialize a Supabase client on the server, reading the auth cookie
  const supabaseServer = createServerComponentClient<Database>({ cookies });

  // Check if there is already a logged‐in session
  const {
    data: { session },
  } = await supabaseServer.auth.getSession();

  if (session) {
    // If the user is already logged in, send them back to "/" 
    // (which itself will forward them to /app or /setup-layout as needed)
    redirect('/');
  }

  // If no session exists, render the RegisterForm (Client Component)
  return <RegisterForm />;
}
