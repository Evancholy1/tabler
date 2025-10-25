// src/app/app/components/GridView.tsx
'use client';

import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { Layout, Section, Table, ViewProps } from '../types/dashboard';
import { Trash2 } from 'lucide-react';


interface ManageTableModalProps {
  isOpen: boolean;
  table: Table | null;
  sections: Section[];
  tables: Table[];
  onConfirm: (updatedData: {
    targetTableId: string;
    targetSectionId: string;
    partySize: number;
  }) => void;
  onDelete: () => void;
  onCancel: () => void;
}

const ManageTableModal = ({
  isOpen,
  table,
  sections,
  tables,
  onConfirm,
  onDelete,
  onCancel
}: ManageTableModalProps) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [partySize, setPartySize] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasChanges = () => {
    if (!table) return false;
    const tableChanged = selectedTable !== table.id;
    const sectionChanged = selectedSection !== table.current_section;
    const partySizeChanged = parseInt(partySize, 10) !== table.current_party_size;
    return tableChanged || sectionChanged || partySizeChanged;
  };

  const getAvailableTables = () => {
    return tables.filter(t =>
      (!t.is_taken || t.id === table?.id) &&
      (t.capacity || 4) >= parseInt(partySize, 10)
    );
  };

  const handleTableChange = (tableId: string) => {
    setSelectedTable(tableId);
    const selectedTableData = tables.find(t => t.id === tableId);
    if (selectedTableData?.section_id) {
      setSelectedSection(selectedTableData.section_id);
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
  };

  // Update input values when table changes
  useEffect(() => {
    if (table && isOpen) {
      setSelectedTable(table.id);
      setSelectedSection(table.current_section || '');
      setPartySize(table.current_party_size.toString());
      setShowDeleteConfirm(false);
    }
  }, [table, isOpen]);

  if (!isOpen || !table) return null;

  const currentSection = sections.find(s => s.id === table.current_section);
  const selectedSectionData = sections.find(s => s.id === selectedSection);
  const selectedTableData = tables.find(t => t.id === selectedTable);
  const availableTables = getAvailableTables();
  const isSameTable = selectedTable === table.id;
  const isSameSection = selectedSection === table.current_section;
  const isSamePartySize = parseInt(partySize, 10) === table.current_party_size;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPartySize = parseInt(partySize, 10);
    if (!isNaN(newPartySize) && newPartySize > 0 && selectedTable && selectedSection) {
      onConfirm({
        targetTableId: selectedTable,
        targetSectionId: selectedSection,
        partySize: newPartySize
      });
    }
  };

  const handlePartySizeIncrement = () => {
    const current = parseInt(partySize, 10) || 0;
    setPartySize((current + 1).toString());
  };

  const handlePartySizeDecrement = () => {
    const current = parseInt(partySize, 10) || 0;
    if (current > 1) {
      setPartySize((current - 1).toString());
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 backdrop-brightness-75 backdrop-opacity-600 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b" style={{ backgroundColor: `${currentSection?.color}20` }}>
          <h3 className="text-xl font-semibold text-gray-900">Manage Table</h3>
          <p className="text-sm text-gray-600 mt-1">
            {table.name || `T${table.id.slice(-2)}`} - {table.current_party_size} {table.current_party_size === 1 ? 'customer' : 'customers'}
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {availableTables.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No available tables</p>
            </div>
          ) : (
            <>
              {/* Section Dropdown */}
              <div>
                <label className="block text-2xl font-bold text-gray-700 mb-4">
                  Section
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="w-full p-6 border-4 border-purple-200 rounded-2xl bg-white focus:border-purple-400 focus:outline-none text-2xl"
                >
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Table Dropdown */}
              <div>
                <label className="block text-2xl font-bold text-gray-700 mb-4">
                  Table
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => handleTableChange(e.target.value)}
                  className="w-full p-6 border-4 border-purple-200 rounded-2xl bg-white focus:border-purple-400 focus:outline-none text-2xl"
                >
                  {/* Show all available tables grouped by section */}
                  {sections.map(section => {
                    const sectionTables = availableTables.filter(t => t.section_id === section.id);
                    if (sectionTables.length === 0) return null;

                    return (
                      <optgroup key={section.id} label={`${section.name} Tables`}>
                        {sectionTables.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name || t.id}

                          </option>
                        ))}
                      </optgroup>
                    );
                  })}

                  {/* Unassigned overflow tables */}
                  {(() => {
                    const unassignedTables = availableTables.filter(t => t.section_id === null);
                    if (unassignedTables.length === 0) return null;

                    return (
                      <optgroup label="🚨 Overflow Tables (Unassigned)">
                        {unassignedTables.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name || t.id} (Capacity: {t.capacity || 4}) - Overflow
                            {t.id === table.id ? ' - Current' : ''}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })()}
                </select>
              </div>

              {/* Party Size Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Number of Customers
                </label>

                <div className="flex items-center justify-center space-x-4">
                  <button
                    type="button"
                    onClick={handlePartySizeDecrement}
                    className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold transition-colors"
                  >
                    −
                  </button>

                  <input
                    type="number"
                    value={partySize}
                    onChange={(e) => setPartySize(e.target.value)}
                    min="1"
                    className="w-24 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handlePartySizeIncrement}
                    className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>


              {/* Summary */}
              {(selectedTable && selectedSection) && (
                <div className="bg-green-50 p-8 rounded-2xl max-w-[100%] mx-auto">
                  <div className="text-center">
                    {/* Table Assignment */}
                    <div className="text-5xl font-bold text-black mb-4 whitespace-nowrap">
                      {table.name || table.id} → {selectedTableData?.name || selectedTable}
                    </div>

                    {/* Overflow table indicator */}
                    {selectedTableData?.section_id === null && (
                      <div className="text-2xl font-bold text-orange-600 mb-2">
                        🚨 OVERFLOW TABLE
                      </div>
                    )}

                    {/* Section and Customer Count Change */}
                    <div className="text-4xl font-bold text-green-600 mb-4">
                      {currentSection?.name}:{currentSection?.customers_served || 0} → {selectedSectionData?.name}:{(selectedSectionData?.customers_served || 0) + (isSameSection ? parseInt(partySize, 10) - table.current_party_size : parseInt(partySize, 10))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}



          {/* Buttons */}
          <div className="space-y-3">
            {/* Delete confirmation */}
            {showDeleteConfirm ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-center text-red-800 font-medium mb-3">
                  Remove all customers from this table?
                </div>
                <div className="text-center text-sm text-red-600 mb-4">
                  This will free {table.name || table.id} and remove {partySize} customers from the section.
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Keep Customers
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Remove Customers
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Main action buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedTable || !selectedSection || !partySize || parseInt(partySize, 10) <= 0 || !hasChanges()}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Update Table
                  </button>
                </div>

                {/* Delete button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-red-600 text-white py-4 px-10 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={22} />
                  </button>
                </div>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default function GridView({
  layout,
  sections,
  tables,
  partySize,
  user,
  onUpdateTable,
  onCreateServiceHistory,
  onCompleteService,
  onMoveService,
  onTriggerAutoAssign,
  onUpdateSection
}: ViewProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [manageModal, setManageModal] = useState<{
    isOpen: boolean;
    table: Table | null;
  }>({ isOpen: false, table: null });


  useEffect(() => {
    let isActive = true; // Flag to prevent updates after cleanup

    const createSubscriptions = () => {
      if (!isActive) return null;

      console.log('🔄 Creating realtime subscriptions...');

      const tablesSubscription = supabase
        .channel(`tables-changes-${Date.now()}`) // Unique channel name
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tables'
        }, (payload) => {
          if (!isActive) return; // Ignore if component unmounted

          console.log('🔥 Table change detected:', payload);

          if (payload.eventType === 'UPDATE') {
            const updatedTable = payload.new as Table;

            onUpdateTable(updatedTable.id, {
              is_taken: updatedTable.is_taken,
              current_party_size: updatedTable.current_party_size,
              current_section: updatedTable.current_section,
              assigned_at: updatedTable.assigned_at
            });

            console.log(`✅ Table ${updatedTable.id} updated via realtime`);
          }

          if (payload.eventType === 'INSERT') {
            console.log('➕ New table added:', payload.new);
          }

          if (payload.eventType === 'DELETE') {
            console.log('🗑️ Table deleted:', payload.old);
          }
        })
        .subscribe((status, err) => {
          console.log('📡 Tables subscription status:', status);

          if (status === 'SUBSCRIBED') {
            console.log(' Tables subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error(' Tables subscription error:', err);
          } else if (status === 'TIMED_OUT') {
            console.warn('⏰ Tables subscription timed out');
          } else if (status === 'CLOSED') {
            console.warn('🔒 Tables subscription closed');
          }
        });

      const sectionsSubscription = supabase
        .channel(`sections-changes-${Date.now()}`) // Unique channel name
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'sections'
        }, (payload) => {
          if (!isActive) return; // Ignore if component unmounted

          console.log(' Section change detected:', payload);
          const updatedSection = payload.new as Section;

          if (onUpdateSection) {
            onUpdateSection(updatedSection.id, {
              customers_served: updatedSection.customers_served
            });
          }
        })
        .subscribe((status, err) => {
          console.log('📡 Sections subscription status:', status);

          if (status === 'SUBSCRIBED') {
            console.log('Sections subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error(' Sections subscription error:', err);
          }
        });

      return { tablesSubscription, sectionsSubscription };
    };

    // Create initial subscriptions
    const subscriptions = createSubscriptions();

    // Cleanup function
    return () => {
      isActive = false; // Prevent any pending updates
      console.log('🧹 Cleaning up realtime subscriptions');

      if (subscriptions) {
        try {
          supabase.removeChannel(subscriptions.tablesSubscription);
          supabase.removeChannel(subscriptions.sectionsSubscription);
          console.log('✅ Subscriptions cleaned up successfully');
        } catch (error) {
          console.warn('⚠️ Error during cleanup:', error);
        }
      }
    };
  }, []);

  // Function to get table at specific position
  const getTableAt = (x: number, y: number): Table | undefined => {
    if (!tables || !Array.isArray(tables)) {
      return undefined;
    }
    return tables.find(t => t.x_pos === x && t.y_pos === y);
  };

  // Function to get section color (only show color if taken)
  const getSectionColor = (table: Table): string => {
    if (!table.is_taken) {
      // Show unassigned table styling even when empty
      if (table.section_id === null) {
        return '#fff2e6'; // Light orange for unassigned tables
      }
      return '#ffffff';
    }

    if (table.current_section && sections) {
      const section = sections.find(s => s.id === table.current_section);
      return section?.color || '#f3f4f6';
    }

    return '#f3f4f6';
  };

  // Only handle removing customers - no direct seating
  const toggleTableStatus = async (table: Table) => {
    try {
      // Only handle removing customers (is_taken = false)
      const { error } = await supabase
        .from('tables')
        .update({
          is_taken: false,
          current_party_size: 0
        })
        .eq('id', table.id);

      if (error) {
        console.error('Error updating table status:', error);
        return;
      }

      onUpdateTable(table.id, {
        is_taken: false,
        current_party_size: 0
      });

    } catch (error) {
      console.error('Failed to update table status:', error);
    }
  };

  // Move customers to another table
  const moveCustomers = async (sourceTable: Table, targetTableId: string, targetSectionId: string, newPartySize: number) => {
    try {
      const sourceSectionId = sourceTable.current_section;
      const sourceIsUnassigned = sourceTable.section_id === null;
      const targetTable = tables.find(t => t.id === targetTableId);
      const targetIsUnassigned = targetTable?.section_id === null;
      const isSameTable = sourceTable.id === targetTableId;
      const isSectionChange = sourceSectionId !== targetSectionId;
      const isPartySizeChange = newPartySize !== sourceTable.current_party_size;
      const partySizeDifference = newPartySize - sourceTable.current_party_size;

      // Case 1: Only section changed (same table)
      if (isSameTable && isSectionChange && !isPartySizeChange) {
        const { error } = await supabase
          .from('tables')
          .update({ current_section: targetSectionId })
          .eq('id', sourceTable.id);

        if (error) {
          console.error('Error updating table section:', error);
          return;
        }

        // Mark old service as moved and create new service entry
        if (onMoveService) {
          await onMoveService(sourceTable.id);
        }
        if (onCreateServiceHistory && targetSectionId) {
          await onCreateServiceHistory(sourceTable.id, targetSectionId, sourceTable.current_party_size);
        }

        // Update section counts
        if (sourceSectionId && targetSectionId && onUpdateSection) {
          const sourceSection = sections.find(s => s.id === sourceSectionId);
          if (sourceSection) {
            await supabase
              .from('sections')
              .update({
                customers_served: Math.max(0, (sourceSection.customers_served || 0) - sourceTable.current_party_size)
              })
              .eq('id', sourceSectionId);

            onUpdateSection(sourceSectionId, {
              customers_served: Math.max(0, (sourceSection.customers_served || 0) - sourceTable.current_party_size)
            });
          }

          const targetSection = sections.find(s => s.id === targetSectionId);
          if (targetSection) {
            await supabase
              .from('sections')
              .update({
                customers_served: (targetSection.customers_served || 0) + sourceTable.current_party_size
              })
              .eq('id', targetSectionId);

            onUpdateSection(targetSectionId, {
              customers_served: (targetSection.customers_served || 0) + sourceTable.current_party_size
            });
          }
        }

        // Update local table state
        onUpdateTable(sourceTable.id, { current_section: targetSectionId });

        console.log(`Changed section assignment for table ${sourceTable.id} from ${sourceSectionId} to ${targetSectionId}`);
        return;
      }

      // Case 2: Only party size changed (same table, same section)
      if (isSameTable && !isSectionChange && isPartySizeChange) {
        const { error } = await supabase
          .from('tables')
          .update({ current_party_size: newPartySize })
          .eq('id', sourceTable.id);

        if (error) {
          console.error('Error updating party size:', error);
          return;
        }

        if (onMoveService) {
          await onMoveService(sourceTable.id);
        }
        if (onCreateServiceHistory && sourceSectionId) {
          await onCreateServiceHistory(sourceTable.id, sourceSectionId, newPartySize);
        }


        // Update section count
        if (sourceSectionId && onUpdateSection) {
          const section = sections.find(s => s.id === sourceSectionId);
          if (section) {
            const newCustomerCount = Math.max(0, (section.customers_served || 0) + partySizeDifference);
            await supabase
              .from('sections')
              .update({ customers_served: newCustomerCount })
              .eq('id', sourceSectionId);

            onUpdateSection(sourceSectionId, { customers_served: newCustomerCount });
          }
        }

        // Update local table state
        onUpdateTable(sourceTable.id, { current_party_size: newPartySize });

        console.log(`Updated party size for table ${sourceTable.id} from ${sourceTable.current_party_size} to ${newPartySize}`);
        return;
      }

      // Case 3: Section AND party size changed (same table)
      if (isSameTable && isSectionChange && isPartySizeChange) {
        const { error } = await supabase
          .from('tables')
          .update({
            current_section: targetSectionId,
            current_party_size: newPartySize
          })
          .eq('id', sourceTable.id);

        if (error) {
          console.error('Error updating table:', error);
          return;
        }

        // Mark old service as moved and create new service entry
        if (onMoveService) {
          await onMoveService(sourceTable.id);
        }
        if (onCreateServiceHistory && targetSectionId) {
          await onCreateServiceHistory(sourceTable.id, targetSectionId, newPartySize);
        }

        // Update section counts
        if (sourceSectionId && targetSectionId && onUpdateSection) {
          const sourceSection = sections.find(s => s.id === sourceSectionId);
          if (sourceSection) {
            await supabase
              .from('sections')
              .update({
                customers_served: Math.max(0, (sourceSection.customers_served || 0) - sourceTable.current_party_size)
              })
              .eq('id', sourceSectionId);

            onUpdateSection(sourceSectionId, {
              customers_served: Math.max(0, (sourceSection.customers_served || 0) - sourceTable.current_party_size)
            });
          }

          const targetSection = sections.find(s => s.id === targetSectionId);
          if (targetSection) {
            await supabase
              .from('sections')
              .update({
                customers_served: (targetSection.customers_served || 0) + newPartySize
              })
              .eq('id', targetSectionId);

            onUpdateSection(targetSectionId, {
              customers_served: (targetSection.customers_served || 0) + newPartySize
            });
          }
        }

        // Update local table state
        onUpdateTable(sourceTable.id, {
          current_section: targetSectionId,
          current_party_size: newPartySize
        });

        console.log(`Updated table ${sourceTable.id}: section ${sourceSectionId} → ${targetSectionId}, party size ${sourceTable.current_party_size} → ${newPartySize}`);
        return;
      }

      // Case 4: Table changed (move to different table)
      if (!isSameTable) {
        // Update source table - free it
        const sourceUpdateData: any = {
          is_taken: false,
          current_party_size: 0
        };

        if (sourceIsUnassigned) {
          sourceUpdateData.current_section = null;
        }

        const { error: sourceError } = await supabase
          .from('tables')
          .update(sourceUpdateData)
          .eq('id', sourceTable.id);

        if (sourceError) {
          console.error('Error updating source table:', sourceError);
          alert('Failed to update source table');
          return;
        }

        // Update target table - occupy it
        const { error: targetError } = await supabase
          .from('tables')
          .update({
            is_taken: true,
            current_party_size: newPartySize,
            current_section: targetSectionId,
            assigned_at: new Date().toISOString()
          })
          .eq('id', targetTableId);

        if (targetError) {
          console.error('Error updating target table:', targetError);
          alert('Failed to update target table');
          return;
        }

        // Update service history
        if (onMoveService) {
          await onMoveService(sourceTable.id);
        }
        if (onCreateServiceHistory && targetSectionId) {
          await onCreateServiceHistory(targetTableId, targetSectionId, newPartySize);
        }

        // Update section customer counts if section changed
        if (sourceSectionId && targetSectionId && sourceSectionId !== targetSectionId && onUpdateSection) {
          const sourceSection = sections.find(s => s.id === sourceSectionId);
          if (sourceSection) {
            await supabase
              .from('sections')
              .update({
                customers_served: Math.max(0, (sourceSection.customers_served || 0) - sourceTable.current_party_size)
              })
              .eq('id', sourceSectionId);

            onUpdateSection(sourceSectionId, {
              customers_served: Math.max(0, (sourceSection.customers_served || 0) - sourceTable.current_party_size)
            });
          }

          const targetSection = sections.find(s => s.id === targetSectionId);
          if (targetSection) {
            await supabase
              .from('sections')
              .update({
                customers_served: (targetSection.customers_served || 0) + newPartySize
              })
              .eq('id', targetSectionId);

            onUpdateSection(targetSectionId, {
              customers_served: (targetSection.customers_served || 0) + newPartySize
            });
          }
        } else if (sourceSectionId === targetSectionId && isPartySizeChange && onUpdateSection) {
          // Same section but different party size
          const section = sections.find(s => s.id === sourceSectionId);
          if (section) {
            const newCustomerCount = Math.max(0, (section.customers_served || 0) + partySizeDifference);
            await supabase
              .from('sections')
              .update({ customers_served: newCustomerCount })
              .eq('id', sourceSectionId);

            onUpdateSection(sourceSectionId, { customers_served: newCustomerCount });
          }
        }

        // Update local table states
        const sourceLocalUpdate: any = {
          is_taken: false,
          current_party_size: 0
        };

        if (sourceIsUnassigned) {
          sourceLocalUpdate.current_section = null;
        }

        onUpdateTable(sourceTable.id, sourceLocalUpdate);
        onUpdateTable(targetTableId, {
          is_taken: true,
          current_party_size: newPartySize,
          current_section: targetSectionId,
          assigned_at: new Date().toISOString()
        });

        console.log(`Moved ${newPartySize} customers from ${sourceTable.id} to ${targetTableId} (section: ${targetSectionId})`);
      }

    } catch (error) {
      console.error('Failed to move customers:', error);
      alert('An error occurred while moving customers');
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);

    if (table.is_taken) {
      // Show confirmation modal for occupied tables
      setManageModal({ isOpen: true, table });
    } else {
      if (user?.strict_assign && table.section_id) {
        if (onTriggerAutoAssign) {
          onTriggerAutoAssign(table.id, table.section_id);
        }
      } else {
        if (onTriggerAutoAssign) {
          onTriggerAutoAssign(table.id);
        }
      }
    }
  };

  const handleManageTable = async (updatedData: {
    targetTableId: string;
    targetSectionId: string;
    partySize: number;
  }) => {
    if (!manageModal.table) return;

    // Call moveCustomers with the updated data
    await moveCustomers(
      manageModal.table,
      updatedData.targetTableId,
      updatedData.targetSectionId,
      updatedData.partySize
    );

    setManageModal({ isOpen: false, table: null });
  };

  const handleDeleteTable = async () => {
    if (!manageModal.table) return;

    await toggleTableStatus(manageModal.table);
    setManageModal({ isOpen: false, table: null });
  };

  const handleCloseManageModal = () => {
    setManageModal({ isOpen: false, table: null });
  };

  // Function to render a single grid cell
  const renderCell = (x: number, y: number) => {
    const table = getTableAt(x, y);

    if (table) {
      const displayName = table.name || `T${table.id.slice(-2)}`;
      const backgroundColor = getSectionColor(table);
      const isSelected = selectedTable?.id === table.id;

      return (
        <div
          key={`${x}-${y}`}
          className={`
            w-full h-full aspect-square
            border-2 flex flex-col items-center justify-center cursor-pointer rounded-lg transition-all
            ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
            ${table.is_taken ? 'shadow-md' : ''}
            ${table.section_id === null ? 'ring-2 ring-orange-400 ring-opacity-50' : ''} // Visual indicator for unassigned tables
            hover:shadow-md
          `}
          style={{
            backgroundColor
          }}
          onClick={() => handleTableClick(table)}
        >
          {/* Responsive text sizing */}
          <span className="text-xs sm:text-sm md:text-base font-bold text-center leading-tight text-black truncate px-1">
            {displayName}
          </span>

          {table.is_taken && table.current_party_size > 0 && (
            <span className="text-xs text-gray-700 leading-none mt-1">
              {table.current_party_size}
            </span>
          )}
        </div>
      );
    } else {
      // Empty cell
      return (
        <div
          key={`${x}-${y}`}
          className="w-full h-full aspect-square"
        />
      );
    }
  };

  // Render the grid
  const renderGrid = () => {
    const cells = [];

    for (let y = 1; y <= layout.height; y++) {
      for (let x = 1; x <= layout.width; x++) {
        cells.push(renderCell(x, y));
      }
    }

    return cells;
  };

  if (!layout) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center text-gray-500">Loading layout...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow w-full max-w-[90vw] flex items-center justify-center">
        {/* Main Grid Container */}
        <div
          className="grid gap-2 max-w-full max-h-[60vh]"
          style={{
            gridTemplateColumns: `repeat(${layout.width}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${layout.height}, minmax(0, 1fr))`,
            aspectRatio: `${layout.width} / ${layout.height}`,
            width: 'min(85vw, 60vh * ' + layout.width + ' / ' + layout.height + ')',
            height: 'min(60vh, 85vw * ' + layout.height + ' / ' + layout.width + ')'
          }}
        >
          {renderGrid()}
        </div>
      </div>
      <ManageTableModal
        isOpen={manageModal.isOpen}
        table={manageModal.table}
        sections={sections}
        tables={tables}
        onConfirm={handleManageTable}
        onDelete={handleDeleteTable}
        onCancel={handleCloseManageModal}
      />
    </>
  );
}