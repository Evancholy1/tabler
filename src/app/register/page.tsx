import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import RegisterForm from './RegisterForm';
import type { Database } from '@/types/supabase';



export default async function RegisterPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ✅ If logged in, check if user already exists in 'users' table
  if (user) {
    const { data: existingUser, error } = await supabase
      .from('users')
      .select('is_setup')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingUser?.is_setup) {
      redirect('/app'); // or wherever you send fully set-up users
    } else {
      redirect('/setup-layout'); // or keep on /register if still filling info
    }
  }

  return <RegisterForm />;
}
