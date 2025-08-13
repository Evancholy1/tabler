'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import ColorPicker from '@/app/setup-layout/components/ColorPicker';

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
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);
  const [updatingColorId, setUpdatingColorId] = useState<string | null>(null);
  const [showHistoryResetConfirm, setShowHistoryResetConfirm] = useState(false);
  const [isResettingHistory, setIsResettingHistory] = useState(false);
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

      console.log('Starting reset for user:', user.id);

      // Alternative approach: Use RPC (Remote Procedure Call) to handle complex deletions
      // First, let's try to reset sections by clearing their references
      
      // Get user's layout IDs first
      const { data: layouts, error: layoutFetchError } = await supabase
        .from('layouts')
        .select('id')
        .eq('owner_user_id', user.id);

      if (layoutFetchError) {
        console.error('Error fetching layouts:', layoutFetchError);
        alert(`Error fetching layouts: ${layoutFetchError.message}`);
        return;
      }

      const layoutIds = layouts?.map(l => l.id) || [];
      console.log('Found layout IDs:', layoutIds);

      if (layoutIds.length === 0) {
        console.log('No layouts found to delete');
        // Still update user setup status
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_setup: false })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating user:', updateError);
          alert(`Error updating user: ${updateError.message}`);
          return;
        }

        setUserData(prev => prev ? { ...prev, is_setup: false } : prev);
        setShowResetConfirm(false);
        router.push('/setup-layout');
        return;
      }

      // Get section IDs for this layout
      const { data: sectionsData, error: sectionsFetchError } = await supabase
        .from('sections')
        .select('id')
        .in('layout_id', layoutIds);

      if (sectionsFetchError) {
        console.error('Error fetching sections:', sectionsFetchError);
        alert(`Error fetching sections: ${sectionsFetchError.message}`);
        return;
      }

      const sectionIds = sectionsData?.map(s => s.id) || [];
      console.log('Found section IDs:', sectionIds);

      // 1. Clear waiter assignments from sections (set waiter_id to null)
      if (sectionIds.length > 0) {
        console.log('Clearing waiter assignments from sections...');
        const { error: clearWaitersError } = await supabase
          .from('sections')
          .update({ waiter_id: null })
          .in('id', sectionIds);

        if (clearWaitersError) {
          console.error('Error clearing waiter assignments:', clearWaitersError);
          alert(`Error clearing waiter assignments: ${clearWaitersError.message}`);
          return;
        }
        console.log('Waiter assignments cleared');
      }

      // 2. Delete service history (references sections)
      if (sectionIds.length > 0) {
        console.log('Deleting service history...');
        const { error: serviceHistoryError, count: deletedServiceHistory } = await supabase
          .from('service_history')
          .delete({ count: 'exact' })
          .in('section_id', sectionIds);

        if (serviceHistoryError) {
          console.error('Error deleting service history:', serviceHistoryError);
          alert(`Error deleting service history: ${serviceHistoryError.message}`);
          return;
        }
        console.log(`Successfully deleted ${deletedServiceHistory || 0} service history records`);
      }

      // 3. Delete tables (they reference layouts via layout_id)
      console.log('Deleting tables...');
      const { error: tablesError, count: deletedTables } = await supabase
        .from('tables')
        .delete({ count: 'exact' })
        .in('layout_id', layoutIds);

      if (tablesError) {
        console.error('Error deleting tables:', tablesError);
        alert(`Error deleting tables: ${tablesError.message}`);
        return;
      }
      console.log(`Successfully deleted ${deletedTables || 0} tables`);

      // 4. Now try to delete sections again
      console.log('Deleting sections...');
      const { error: sectionsError, count: deletedSections } = await supabase
        .from('sections')
        .delete({ count: 'exact' })
        .in('layout_id', layoutIds);

      if (sectionsError) {
        console.error('Error deleting sections:', sectionsError);
        console.error('Section error details:', sectionsError);
        alert(`Error deleting sections: ${sectionsError.message}`);
        return;
      }
      console.log(`Successfully deleted ${deletedSections || 0} sections`);

      // 5. Finally delete layouts
      console.log('Deleting layouts...');
      const { error: layoutsError, count: deletedLayouts } = await supabase
        .from('layouts')
        .delete({ count: 'exact' })
        .eq('owner_user_id', user.id);

      if (layoutsError) {
        console.error('Error deleting layouts:', layoutsError);
        alert(`Error deleting layouts: ${layoutsError.message}`);
        return;
      }
      console.log(`Successfully deleted ${deletedLayouts || 0} layouts`);

      // 6. Set is_setup = false
      console.log('Updating user setup status...');
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_setup: false })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        alert(`Error updating user: ${updateError.message}`);
        return;
      }
      console.log('User setup status updated successfully');

      // 7. Update local state
      setUserData(prev => prev ? { ...prev, is_setup: false } : prev);
      setSections([]); // Clear sections from UI

      // 8. Close confirmation modal
      setShowResetConfirm(false);

      console.log('Layout reset completed successfully');
      
      // 9. Redirect to setup-layout
      router.push('/setup-layout');
      
    } catch (error) {
      console.error('Unexpected error resetting layout:', error);
      //alert(`Unexpected error: ${error.message || 'Unknown error'}`);
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

  const startEditingSectionName = (section: Section) => {
    setEditingSectionId(section.id);
    setEditingSectionName(section.name);
  };

  const cancelEditingSectionName = () => {
    setEditingSectionId(null);
    setEditingSectionName('');
  };

  const saveSectionName = async (sectionId: string) => {
    if (!editingSectionName.trim()) {
      alert('Section name cannot be empty');
      return;
    }

    setSavingSectionId(sectionId);
    
    try {
      const { error } = await supabase
        .from('sections')
        .update({ name: editingSectionName.trim() })
        .eq('id', sectionId);

      if (error) {
        console.error('Error updating section name:', error);
        alert('Failed to update section name');
        return;
      }

      // Update local state
      setSections(prevSections =>
        prevSections.map(section =>
          section.id === sectionId
            ? { ...section, name: editingSectionName.trim() }
            : section
        )
      );

      // Reset editing state
      setEditingSectionId(null);
      setEditingSectionName('');

    } catch (error) {
      console.error('Unexpected error updating section:', error);
      alert('Failed to update section name');
    } finally {
      setSavingSectionId(null);
    }
  };

  const updateSectionColor = async (sectionId: string, newColor: string) => {
    setUpdatingColorId(sectionId);
    
    try {
      const { error } = await supabase
        .from('sections')
        .update({ color: newColor })
        .eq('id', sectionId);

      if (error) {
        console.error('Error updating section color:', error);
        alert('Failed to update section color');
        return;
      }

      // Update local state
      setSections(prevSections =>
        prevSections.map(section =>
          section.id === sectionId
            ? { ...section, color: newColor }
            : section
        )
      );

    } catch (error) {
      console.error('Unexpected error updating section color:', error);
      alert('Failed to update section color');
    } finally {
      setUpdatingColorId(null);
    }
  };

  const handleResetCustomerHistory = async () => {
    setIsResettingHistory(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Starting customer history reset for user:', user.id);

      // Get user's layout IDs
      const { data: layouts, error: layoutFetchError } = await supabase
        .from('layouts')
        .select('id')
        .eq('owner_user_id', user.id);

      if (layoutFetchError) {
        console.error('Error fetching layouts:', layoutFetchError);
        alert(`Error fetching layouts: ${layoutFetchError.message}`);
        return;
      }

      const layoutIds = layouts?.map(l => l.id) || [];
      console.log('Found layout IDs:', layoutIds);

      if (layoutIds.length === 0) {
        console.log('No layouts found');
        setShowHistoryResetConfirm(false);
        return;
      }

      // Get section IDs for this layout
      const { data: sectionsData, error: sectionsFetchError } = await supabase
        .from('sections')
        .select('id')
        .in('layout_id', layoutIds);

      if (sectionsFetchError) {
        console.error('Error fetching sections:', sectionsFetchError);
        alert(`Error fetching sections: ${sectionsFetchError.message}`);
        return;
      }

      const sectionIds = sectionsData?.map(s => s.id) || [];
      console.log('Found section IDs:', sectionIds);

      // 1. Clear service history
      if (sectionIds.length > 0) {
        console.log('Clearing service history...');
        const { error: serviceHistoryError, count: deletedServiceHistory } = await supabase
          .from('service_history')
          .delete({ count: 'exact' })
          .in('section_id', sectionIds);

        if (serviceHistoryError) {
          console.error('Error clearing service history:', serviceHistoryError);
          alert(`Error clearing service history: ${serviceHistoryError.message}`);
          return;
        }
        console.log(`Successfully cleared ${deletedServiceHistory || 0} service history records`);

        // 2. Reset customers_served to 0 for all sections
        console.log('Resetting customers served count...');
        const { error: sectionsResetError } = await supabase
          .from('sections')
          .update({ customers_served: 0 })
          .in('id', sectionIds);

        if (sectionsResetError) {
          console.error('Error resetting customers served:', sectionsResetError);
          alert(`Error resetting customers served: ${sectionsResetError.message}`);
          return;
        }
        console.log('Successfully reset customers served count');
      }

      // 3. Mark all tables as available
      console.log('Marking all tables as available...');
      const { error: tablesResetError } = await supabase
        .from('tables')
        .update({ 
          is_taken: false,
          current_party_size: 0,
          assigned_at: null
        })
        .in('layout_id', layoutIds);

      if (tablesResetError) {
        console.error('Error resetting tables:', tablesResetError);
        alert(`Error resetting tables: ${tablesResetError.message}`);
        return;
      }
      console.log('Successfully marked all tables as available');

      // 4. Update local sections state to reflect customers_served reset
      setSections(prevSections =>
        prevSections.map(section => ({ ...section, customers_served: 0 }))
      );

      // 5. Close confirmation modal
      setShowHistoryResetConfirm(false);

      console.log('Customer history reset completed successfully');
      alert('Customer history has been reset successfully! All tables are now available and customer counts have been cleared.');
      
    } catch (error) {
      console.error('Unexpected error resetting customer history:', error);
      //alert(`Unexpected error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsResettingHistory(false);
    }
  };

  const cancelHistoryReset = () => {
    setShowHistoryResetConfirm(false);
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
          
        </div>

        {/* Section List */}
        <div>
          <h2 className="text-md font-medium mt-4 mb-2">Sections</h2>
          {sections.length > 0 ? (
            <div className="space-y-2">
              {sections.map(section => (
                <div key={section.id} className="flex items-center space-x-3 text-sm text-gray-700 group">
                  {/* Color Picker */}
                  <div className="flex-shrink-0">
                    <ColorPicker
                      color={section.color}
                      onChange={(newColor) => updateSectionColor(section.id, newColor)}
                      sectionName={section.name}
                    />
                  </div>
                  
                  {editingSectionId === section.id ? (
                    // Edit mode
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="text"
                        value={editingSectionName}
                        onChange={(e) => setEditingSectionName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveSectionName(section.id);
                          if (e.key === 'Escape') cancelEditingSectionName();
                        }}
                        disabled={savingSectionId === section.id}
                      />
                      <button
                        onClick={() => saveSectionName(section.id)}
                        disabled={savingSectionId === section.id}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingSectionId === section.id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEditingSectionName}
                        disabled={savingSectionId === section.id}
                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between flex-1">
                      <span className="flex-1">{section.name}</span>
                      <div className="flex items-center space-x-2">
                        {updatingColorId === section.id && (
                          <span className="text-xs text-gray-500">Updating...</span>
                        )}
                        <button
                          onClick={() => startEditingSectionName(section)}
                          className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:text-blue-800 transition-opacity"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No sections found.</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex gap-3">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="text-red-600 border border-red-600 px-4 py-2 rounded hover:bg-red-50 transition"
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : 'Reset Layout'}
            </button>
            <button
              onClick={() => setShowHistoryResetConfirm(true)}
              className="text-orange-600 border border-orange-600 px-4 py-2 rounded hover:bg-orange-50 transition"
              disabled={isResettingHistory}
            >
              {isResettingHistory ? 'Resetting...' : 'Reset Customer History'}
            </button>
          </div>
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

        {/* Customer History Reset Confirmation Modal */}
        {showHistoryResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900">Reset Customer History</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to reset the customer history? This is typically done at the end of each business day. This will:
              </p>
              <ul className="text-sm text-gray-600 mb-6 ml-4 space-y-1">
                <li>• Clear all service history records</li>
                <li>• Reset customer counts to 0 for all sections</li>
                <li>• Mark all tables as available</li>
                <li>• Clear current party sizes from tables</li>
              </ul>
              <p className="text-orange-600 text-sm mb-6 font-medium">
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelHistoryReset}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isResettingHistory}
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetCustomerHistory}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isResettingHistory}
                >
                  {isResettingHistory ? 'Resetting...' : 'Reset History'}
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