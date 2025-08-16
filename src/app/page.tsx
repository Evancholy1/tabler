// src/app/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
// Remove this line - you don't need it:
// import { supabase } from '@/lib/supabaseClient';

export default async function RootPageGatekeeper() {
  const cookieStore = await cookies();
  
  // ✅ FIX: Add the actual parameters
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

    // ✅ FIX 1: Use getUser() instead of getSession()
    const { data: { user }, error: authError } = await supabase.auth.getUser();
  
    console.log('🔍 Root page - User check:', user ? 'EXISTS' : 'NONE');
    
    if (authError || !user) {
      console.log('➡️ No user, redirecting to /login');
      redirect('/login');
    }
  
    // Now check YOUR database for this user
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .select('id, is_setup')
      .eq('id', user.id)
      .maybeSingle();
  
    console.log('👤 Root page - User:', user.id);
    console.log('📊 Root page - Database User:', userData);
  
    if (dbError) {
      console.error('Database error:', dbError);
      redirect('/login');
    }
  
    if (!userData) {
      console.log('➡️ No database record, redirecting to /register');
      redirect('/register');
    }
  
    if (!userData.is_setup) {
      // Check if they have a layout (completed setup form)
      const { data: layout } = await supabase
        .from('layouts')
        .select('id')
        .eq('owner_user_id', user.id)
        .single();
        
      if (!layout) {
        redirect('/setup-layout');  // No layout = need setup form
      } else {
        redirect('/layout-editor'); // Has layout = need to complete editor
      }
    }
  
    console.log('➡️ All good, redirecting to /app');
    redirect('/dashboard');
  }