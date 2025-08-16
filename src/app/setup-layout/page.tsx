// src/app/setup-layout/page.tsx - FIXED VERSION
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SetupLayoutForm from './SetupLayoutForm';

export default async function SetupLayoutPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
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
            // Ignore if called from Server Component
          }
        },
      },
    }
  );

  // ✅ FIX: Use getUser() instead of getSession()
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  console.log('🎨 Setup page - User check:', user ? 'EXISTS' : 'NONE');
  
  if (authError || !user) {
    console.log('➡️ Setup page - No user, redirecting to /login');
    redirect('/login');
  }

  // Check if the user is set up 
  const { data: userData, error: dbError } = await supabase 
    .from('users')
    .select('is_setup')
    .eq('id', user.id)
    .maybeSingle();

  console.log('📊 Setup page - Database User:', userData);

  if (dbError) {
    console.error('Setup page - Database error:', dbError);
    redirect('/login');
  }

  if (!userData) {
    console.log('➡️ Setup page - No database record, redirecting to /register');
    redirect('/register');
  }

  if (userData.is_setup) {
    console.log('✅ Setup page - Already setup, redirecting to /app');
    redirect('/app'); 
  }

  console.log('📝 Setup page - Showing form');
  return <SetupLayoutForm />;
}