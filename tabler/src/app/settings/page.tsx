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
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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
    setIsResetting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's layout IDs first
      const { data: layouts } = await supabase
        .from('layouts')
        .select('id')
        .eq('owner_user_id', user.id);

      const layoutIds = layouts?.map(l => l.id) || [];

      if (layoutIds.length > 0) {
        // 1. Delete tables first (they reference layouts)
        await supabase
          .from('tables')
          .delete()
          .in('layout_id', layoutIds);

        // 2. Delete sections (they also reference layouts)
        await supabase
          .from('sections')
          .delete()
          .in('layout_id', layoutIds);

        // 3. Now delete layouts
        await supabase
          .from('layouts')
          .delete()
          .eq('owner_user_id', user.id);
      }

      // 4. Set is_setup = false
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_setup: false })
        .eq('id', user.id);

      if (updateError) {
        alert('Layout reset failed.');
        console.error(updateError);
        return;
      }

      // 5. Update local state
      setUserData(prev => prev ? { ...prev, is_setup: false } : prev);
      setSections([]); // Clear sections from UI

      // 6. Close confirmation modal
      setShowResetConfirm(false);

      // 7. Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error resetting layout:', error);
      alert('Layout reset failed. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    router.push('/dashboard');
  };

  const cancelReset = () => {
    setShowResetConfirm(false);
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!userData) return <div className="p-6 text-red-500">User not found.</div>;

  return (
    <div className="p-6 min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xl font-bold">Settings</p>
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
            onClick={() => setShowResetConfirm(true)}
            className="text-red-600 border border-red-600 px-4 py-2 rounded hover:bg-red-50 transition"
            disabled={isResetting}
          >
            {isResetting ? 'Resetting...' : 'Reset Layout'}
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

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Reset Layout</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to reset your layout? This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 mb-6 ml-4 space-y-1">
                <li>• All tables and their positions</li>
                <li>• All sections and their configurations</li>
                <li>• Your entire restaurant layout</li>
              </ul>
              <p className="text-red-600 text-sm mb-6 font-medium">
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelReset}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isResetting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetLayout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isResetting}
                >
                  {isResetting ? 'Resetting...' : 'Reset Layout'}
                </button>
              </div>
            </div>
          </div>
        )}
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