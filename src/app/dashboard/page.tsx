import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RestaurantDashboard from './RestaurantDashboard';

export default async function AppPage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user's layout data
  const { data: layout } = await supabase
    .from('layouts')
    .select('*')
    .eq('owner_user_id', user.id)
    .single();

  if (!layout) {
    redirect('/setup-layout');
  }

  // Fetch sections and tables
  const { data: sections } = await supabase
    .from('sections')
    .select('*')
    .eq('layout_id', layout.id)
    .order('priority_rank');

  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .eq('layout_id', layout.id);

  return (
    <RestaurantDashboard 
      layout={layout}
      sections={sections || []}
      tables={tables || []}
    />
  );
}