'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial auth state
    const checkAuthState = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      setLoading(false);
    };

    checkAuthState();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session?.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">Tabler</h1>

      <div className="flex items-center space-x-6">
        {/* Only show settings gear when user is logged in */}
        {!loading && isLoggedIn && (
          <Link href="/settings" className="hover:opacity-80">
            <Settings className="w-5 h-5" />
          </Link>
        )}
      </div>
    </nav>
  );
}