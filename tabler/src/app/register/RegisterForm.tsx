// src/app/register/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 🔍 STEP 1: Validate passwords match
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // 🔐 STEP 2: Create user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }

      const user = data.user;

      if (user) {
        // 💾 STEP 3: Add user to YOUR database
        // ✅ FIXED: Now using correct column names from your schema
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,        // ✅ TEXT UUID from Supabase
            email: user.email,  // ✅ TEXT email
            is_setup: false,    // ✅ BOOLEAN setup status
          });

        if (insertError) {
          console.error('Database insert error:', insertError);
          setErrorMsg(`Database error: ${insertError.message}`);
          setIsLoading(false);
          return;
        }

        console.log('✅ User created successfully!');

        await supabase.auth.signOut();
        
        // Show success message and redirect to login
        alert('Registration successful! Please log in with your credentials.');

    
        
        // 🚀 STEP 4: Redirect to login page (no auto-login)
        router.push('/login');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setErrorMsg('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>

        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-2 mb-4 rounded">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Registering…' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}

/*
🎓 KEY CHANGES EXPLAINED:

1. **Fixed Database Insert:**
   OLD: user_id: parseInt(user.id) ❌ 
   NEW: id: user.id ✅
   
   - Your database 'id' column is TEXT, not INT
   - Supabase user.id is already a string UUID
   - No conversion needed!

2. **Proper Error Handling:**
   - Try/catch blocks for unexpected errors
   - Proper loading state management
   - Clear error messages

3. **Database Schema Match:**
   - id: TEXT (matches Supabase user.id)
   - email: TEXT 
   - is_setup: BOOLEAN
   - created_at, updated_at: auto-generated

4. **Registration Flow:**
   1. User fills form
   2. Create Supabase auth user
   3. Create record in YOUR users table
   4. Redirect to login page
   5. User confirms email
   6. User can then login
*/