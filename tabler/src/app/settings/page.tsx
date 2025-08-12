'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

type UserRecord = {
  id: string;
  email: string;
  is_setup: boolean;
};

type Section = {
  id: string;
  name: string;
  color: string;
};

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserRecord | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        setLoading(false);
        return;
      }

      // Get user info
      const { data: userRow } = await supabase
        .from('users')
        .select('id, email, is_setup')
        .eq('id', user.id)
        .single();

      setUserData(userRow);

      // Get layout IDs owned by user
      const { data: layouts } = await supabase
        .from('layouts')
        .select('id')
        .eq('owner_user_id', user.id);

      const layoutIds = layouts?.map(l => l.id) || [];

      if (layoutIds.length > 0) {
        // Get section names and colors
        const { data: sectionRows } = await supabase
          .from('sections')
          .select('id, name, color')
          .in('layout_id', layoutIds);

        setSections(sectionRows || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleResetLayout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Delete layouts
    await supabase
      .from('layouts')
      .delete()
      .eq('owner_user_id', user.id);

    // 2. Set is_setup = false
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_setup: false })
      .eq('id', user.id);

    if (updateError) {
      alert('Layout reset failed.');
      console.error(updateError);
      return;
    }

    // 3. Update local state
    setUserData(prev => prev ? { ...prev, is_setup: false } : prev);

    // 4. Redirect to home
    router.push('/dashboard');
  };

  const handleClose = () => {
    router.push('/dashboard');
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!userData) return <div className="p-6 text-red-500">User not found.</div>;

  return (
    <div className="p-6 min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xl font-bold">Pho Cafe</p>
            <p className="text-sm text-gray-500">{userData.email}</p>
          </div>
          <button 
            onClick={handleClose}
            className="text-2xl text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <hr />

        {/* User Info */}
        <div className="space-y-6 text-sm">
          <SettingRow label="User ID" value={userData.id} />
          <SettingRow label="Email account" value={userData.email} />
          <SettingRow label="Layout Setup Complete" value={userData.is_setup ? 'Yes' : 'No'} />
        </div>

        {/* Section List */}
        <div>
          <h2 className="text-md font-medium mt-4 mb-2">Sections</h2>
          {sections.length > 0 ? (
            <ul className="space-y-2">
              {sections.map(section => (
                <li key={section.id} className="flex items-center space-x-3 text-sm text-gray-700">
                  <span
                    className="w-3 h-3 rounded-full inline-block border"
                    style={{ backgroundColor: section.color }}
                  ></span>
                  <span>{section.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No sections found.</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={handleResetLayout}
            className="text-red-600 border border-red-600 px-4 py-2 rounded hover:bg-red-50 transition"
          >
            Reset Layout
          </button>
          <button
            onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const { error } = await supabase
                .from('users')
                .update({ is_setup: false })
                .eq('id', user.id);

              if (error) {
                alert('Failed to update setup status.');
                console.error(error);
                return;
              }

              // Optionally update local state
              setUserData(prev => prev ? { ...prev, is_setup: false } : prev);

              router.push('/layout-editor');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Edit Sections
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility row component
function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-gray-700 font-medium">{label}</span>
      <span className="text-gray-600 text-right break-all">{value}</span>
    </div>
  );
}