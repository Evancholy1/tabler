// src/app/app/components/TableView.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ViewProps, Section, Table } from '../types/dashboard';
import { Trash2 } from 'lucide-react';
import { X } from 'lucide-react';

// Use the same interface as RestaurantDashboard
interface ServiceHistoryEntry {
  id: string;
  tableId: string;
  tableName: string;
  sectionId: string;
  partySize: number;
  timestamp: string;
  isActive: boolean;
  status: 'active' | 'completed' | 'moved';
}

interface EditCustomerCountModalProps {
  isOpen: boolean;
  section: { id: string; name: string; customers_served: number; color: string } | null;
  onConfirm: (newCount: number) => void;
  onCancel: () => void;
}

interface EditServiceEntryModalProps {
  isOpen: boolean;
  serviceEntry: ServiceHistoryEntry | null;
  sections: Section[];
  tables: Table[]; 
  onConfirm: (updatedEntry: { 
    tableName: string; 
    partySize: number; 
    targetTableId: string; 
    targetSectionId: string; 
  }) => void;
  onDelete: () => void; 
  onCancel: () => void;
}

const EditCustomerCountModal = ({ isOpen, section, onConfirm, onCancel }: EditCustomerCountModalProps) => {
  const [inputValue, setInputValue] = useState('');

  // Update input value when section changes or modal opens
  useEffect(() => {
    if (section && isOpen) {
      setInputValue(section.customers_served.toString());
    }
  }, [section, isOpen]);

  if (!isOpen || !section) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCount = parseInt(inputValue, 10);
    if (!isNaN(newCount) && newCount >= 0) {
      onConfirm(newCount);
    }
  };

  const handleIncrement = () => {
    const current = parseInt(inputValue, 10) || 0;
    setInputValue((current + 1).toString());
  };

  const handleDecrement = () => {
    const current = parseInt(inputValue, 10) || 0;
    if (current > 0) {
      setInputValue((current - 1).toString());
    }
  };

  const currentValue = parseInt(inputValue, 10) || 0;
  const originalValue = section.customers_served;
  const difference = currentValue - originalValue;

  return (
    <div className="fixed inset-0 backdrop-brightness-75 backdrop-opacity-600 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b" style={{ backgroundColor: `${section.color}20` }}>
          <h3 className="text-xl font-semibold text-gray-900">Edit Customer Count</h3>
          <p className="text-sm text-gray-600 mt-1">
            Section: <span className="font-medium" style={{ color: section.color }}>{section.name}</span>
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Total Customers Served
            </label>
            
            {/* Counter Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold transition-colors"
                disabled={currentValue <= 0}
              >
                −
              </button>
              
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                min="0"
                className="w-24 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-400 focus:outline-none"
              />
              
              <button
                type="button"
                onClick={handleIncrement}
                className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Summary with change indicator */}
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-600 space-y-1">
              <div>
                <strong>Original:</strong> {originalValue} customers
              </div>
              <div>
                <strong>New:</strong> <span className="font-bold" style={{ color: section.color }}>{currentValue} customers</span>
              </div>
              {difference !== 0 && (
                <div className={`font-bold ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {difference > 0 ? '+' : ''}{difference} change
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
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
              disabled={currentValue < 0}
              className="flex-1 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              style={{ backgroundColor: currentValue < 0 ? undefined : section.color }}
            >
              Update Count
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditServiceEntryModal = ({ isOpen, serviceEntry, sections, tables, onConfirm, onDelete, onCancel }: EditServiceEntryModalProps) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [partySize, setPartySize] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasChanges = () => {
    if (!serviceEntry) return false;
    const tableChanged = selectedTable !== serviceEntry.tableId;
    const sectionChanged = selectedSection !== serviceEntry.sectionId;
    const partySizeChanged = parseInt(partySize, 10) !== serviceEntry.partySize;
    return tableChanged || sectionChanged || partySizeChanged;
  };

  const getAvailableTables = () => {
    return tables.filter(table => 
      (!table.is_taken || table.id === serviceEntry?.tableId)
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

  // Update input values when serviceEntry changes
  useEffect(() => {
    if (serviceEntry && isOpen) {
      setSelectedTable(serviceEntry.tableId);
      setSelectedSection(serviceEntry.sectionId);
      setPartySize(serviceEntry.partySize.toString());
      setShowDeleteConfirm(false);
    }
  }, [serviceEntry, isOpen]);


  if (!isOpen || !serviceEntry) return null;
  const currentSection = sections.find(s => s.id === serviceEntry?.sectionId);
  const selectedSectionData = sections.find(s => s.id === selectedSection);
  const selectedTableData = tables.find(t => t.id === selectedTable);
  const availableTables = getAvailableTables();
  const isSameTable = selectedTable === serviceEntry?.tableId;
  const isSameSection = selectedSection === serviceEntry?.sectionId;
  const isSamePartySize = parseInt(partySize, 10) === serviceEntry.partySize;



  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const newPartySize = parseInt(partySize, 10);
  if (!isNaN(newPartySize) && newPartySize > 0 && selectedTable && selectedSection && serviceEntry) {
    onConfirm({
      tableName: selectedTableData?.name || selectedTable.slice(-2) || '',
      partySize: newPartySize,
      targetTableId: selectedTable,
      targetSectionId: selectedSection
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
        <div className="p-6 border-b relative" style={{ backgroundColor: `${currentSection?.color}20` }}>
          <h3 className="text-xl font-semibold text-gray-900">Edit Service Entry</h3>

           <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
          >
             <X size={28} />
          </button>
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
              const sectionTables = availableTables.filter(table => table.section_id === section.id);
              if (sectionTables.length === 0) return null;
              
              return (
                <optgroup key={section.id} label={`${section.name} Tables`}>
                  {sectionTables.map(table => (
                    <option key={table.id} value={table.id}>
                      {table.name || table.id} 
                    </option>
                  ))}
                </optgroup>
              );
            })}

                  {/* Unassigned overflow tables */}
                  {(() => {
                    const unassignedTables = availableTables.filter(table => table.section_id === null);
                    if (unassignedTables.length === 0) return null;
                    
                    return (
                      <optgroup label="🚨 Overflow Tables (Unassigned)">
                        {unassignedTables.map(table => (
                          <option key={table.id} value={table.id}>
                            {table.name || table.id} (Capacity: {table.capacity || 4}) - Overflow
                            {table.id === serviceEntry?.tableId ? ' - Current' : ''}
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
            </>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            {/* Delete confirmation */}
            {showDeleteConfirm ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-center text-red-800 font-medium mb-3">
                  Delete this service entry?
                </div>
                <div className="text-center text-sm text-red-600 mb-4">
                  This will remove {partySize || serviceEntry?.partySize} customers from the section total and free the table.
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Keep Entry
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    Delete Entry
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Main action buttons */}
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={!selectedTable || !selectedSection || !partySize || parseInt(partySize, 10) <= 0 || !hasChanges()}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Update Entry
                  </button>
                </div>
                
                {/* Delete button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="flex-1 bg-red-600 text-white py-4 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
                  > 
                    <Trash2 size={16} />
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

// Extended interface to include the update callback
interface ExtendedTableViewProps extends ViewProps {
  serviceHistory: ServiceHistoryEntry[];
  onUpdateSection?: (sectionId: string, updates: Partial<Section>) => void;
  onUpdateServiceHistory?: (updatedServiceHistory: ServiceHistoryEntry[]) => void;
}

export default function TableView({ 
  layout, 
  sections, 
  tables, 
  partySize,
  user,
  onUpdateTable, 
  serviceHistory,
  onUpdateSection,
  onUpdateServiceHistory
}: ExtendedTableViewProps) {
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    section: { id: string; name: string; customers_served: number; color: string } | null;
  }>({ isOpen: false, section: null });

  const [editServiceModal, setEditServiceModal] = useState<{
    isOpen: boolean;
    serviceEntry: ServiceHistoryEntry | null;
  }>({ isOpen: false, serviceEntry: null });

  // Auto-scroll to bottom when service history updates
  useEffect(() => {
    sections.forEach(section => {
      const sectionElement = document.getElementById(`section-${section.id}-scroll`);
      if (sectionElement) {
        sectionElement.scrollTop = sectionElement.scrollHeight;
      }
    });
  }, [serviceHistory, sections]);

  // Get optimal section function (same logic as in RestaurantDashboard)
  const getOptimalSection = () => {
    const minCustomers = Math.min(...sections.map(s => s.customers_served || 0));
    const tiedSections = sections.filter(s => (s.customers_served || 0) === minCustomers); 

    return tiedSections.reduce((best, current) => 
      current.priority_rank < best.priority_rank ? current : best 
    );
  };

  const handleCustomerCountClick = (section: any) => {
    setEditModal({
      isOpen: true,
      section: {
        id: section.id,
        name: section.name,
        customers_served: section.customers_served || 0,
        color: section.color
      }
    });
  };

  const handleServiceEntryClick = (serviceEntry: ServiceHistoryEntry) => {
    setEditServiceModal({
      isOpen: true,
      serviceEntry
    });
  };

  const handleUpdateCustomerCount = async (newCount: number) => {
    if (!editModal.section) return;

    try {
      // Update the database
      const { error } = await supabase
        .from('sections')
        .update({ customers_served: newCount })
        .eq('id', editModal.section.id);

      if (error) {
        console.error('Error updating customer count:', error);
        alert('Failed to update customer count');
        return;
      }

      // Update local state using the parent's callback
      if (onUpdateSection) {
        onUpdateSection(editModal.section.id, { customers_served: newCount });
      }

      const difference = newCount - editModal.section.customers_served;
      console.log(`Updated section ${editModal.section.name} customer count: ${editModal.section.customers_served} → ${newCount} (${difference > 0 ? '+' : ''}${difference})`);
      
      // Close modal
      handleCloseModal();
      
    } catch (error) {
      console.error('Failed to update customer count:', error);
      alert('An error occurred while updating customer count');
    }
  };

const handleUpdateServiceEntry = async (updatedEntry: { 
  tableName: string; 
  partySize: number; 
  targetTableId: string; 
  targetSectionId: string; 
}) => {
  if (!editServiceModal.serviceEntry || !onUpdateServiceHistory) return;

  const originalEntry = editServiceModal.serviceEntry;
  const partySizeDifference = updatedEntry.partySize - originalEntry.partySize;
  const tableChanged = updatedEntry.targetTableId !== originalEntry.tableId;
  const sectionChanged = updatedEntry.targetSectionId !== originalEntry.sectionId;

  try {
    // 1. UPDATE the service_history entry in the database
    const { error: historyError } = await supabase
      .from('service_history')
      .update({
        table_name: updatedEntry.tableName,
        party_size: updatedEntry.partySize,
        table_id: updatedEntry.targetTableId,
        section_id: updatedEntry.targetSectionId
      })
      .eq('id', originalEntry.id);

    if (historyError) {
      console.error('Error updating service history:', historyError);
      alert('Failed to update service history');
      return;
    }

if (tableChanged) {
  const currentTable = tables.find(t => t.id === originalEntry.tableId);
  
  // Only proceed with table changes if the original table is still taken
  if (currentTable?.is_taken) {
    // Free the old table
    const isOldTableUnassigned = currentTable.section_id === null;

    const oldTableUpdate: any = {
      is_taken: false,
      current_party_size: 0
    };

    if (isOldTableUnassigned) {
      oldTableUpdate.current_section = null;
    } 

    await supabase
      .from('tables')
      .update(oldTableUpdate)
      .eq('id', originalEntry.tableId);
    
    onUpdateTable(originalEntry.tableId, oldTableUpdate);

    // Occupy the new table
    const newTableUpdate: any = {
      is_taken: true,
      current_party_size: updatedEntry.partySize,
      current_section: updatedEntry.targetSectionId,  
      assigned_at: new Date().toISOString()
    };

    await supabase
      .from('tables')
      .update(newTableUpdate)
      .eq('id', updatedEntry.targetTableId);
    
    onUpdateTable(updatedEntry.targetTableId, newTableUpdate);
  }
  // If table is not taken, only service history was updated (step 1)

} else if (sectionChanged) {
  // Same table, different section
  // Only update the table if it's still taken (active service)
  const currentTable = tables.find(t => t.id === originalEntry.tableId);
  
  if (currentTable?.is_taken) {
    // Table is still active, update its current_section
    await supabase
      .from('tables')
      .update({ current_section: updatedEntry.targetSectionId })
      .eq('id', originalEntry.tableId);
    
    onUpdateTable(originalEntry.tableId, { current_section: updatedEntry.targetSectionId });
  }
  // If table is not taken, we only update service history (already done in step 1)

} else if (partySizeDifference !== 0) {
  // Just update party size on the same table
  // Only update if table is still taken
  const currentTable = tables.find(t => t.id === originalEntry.tableId);
  
  if (currentTable?.is_taken) {
    await supabase
      .from('tables')
      .update({ current_party_size: updatedEntry.partySize })
      .eq('id', originalEntry.tableId);
    
    onUpdateTable(originalEntry.tableId, { current_party_size: updatedEntry.partySize });
  }
  // If table is not taken, we only update service history (already done in step 1)
}

    // 3. Update local service history state
    const updatedServiceHistory = serviceHistory.map(entry => 
      entry.id === originalEntry.id 
        ? { 
            ...entry, 
            tableName: updatedEntry.tableName, 
            partySize: updatedEntry.partySize,
            tableId: updatedEntry.targetTableId,
            sectionId: updatedEntry.targetSectionId
          }
          : entry
    );
    onUpdateServiceHistory(updatedServiceHistory);

    // 4. Update section customer counts
    if (sectionChanged && onUpdateSection) {
      // Subtract from old section
      const oldSection = sections.find(s => s.id === originalEntry.sectionId);
      if (oldSection) {
        const newOldCount = Math.max(0, (oldSection.customers_served || 0) - originalEntry.partySize);
        await supabase
          .from('sections')
          .update({ customers_served: newOldCount })
          .eq('id', originalEntry.sectionId);
        onUpdateSection(originalEntry.sectionId, { customers_served: newOldCount });
      }

      // Add to new section
      const newSection = sections.find(s => s.id === updatedEntry.targetSectionId);
      if (newSection) {
        const newNewCount = (newSection.customers_served || 0) + updatedEntry.partySize;
        await supabase
          .from('sections')
          .update({ customers_served: newNewCount })
          .eq('id', updatedEntry.targetSectionId);
        onUpdateSection(updatedEntry.targetSectionId, { customers_served: newNewCount });
      }
    } else if (partySizeDifference !== 0 && onUpdateSection) {
      // Only party size changed, same section
      const section = sections.find(s => s.id === originalEntry.sectionId);
      if (section) {
        const newCustomerCount = Math.max(0, (section.customers_served || 0) + partySizeDifference);
        await supabase
          .from('sections')
          .update({ customers_served: newCustomerCount })
          .eq('id', originalEntry.sectionId);
        onUpdateSection(originalEntry.sectionId, { customers_served: newCustomerCount });
      }
    }

    console.log(`Updated service entry: ${updatedEntry.tableName} in section ${updatedEntry.targetSectionId}`);
    handleCloseServiceModal();
    
  } catch (error) {
    console.error('Failed to update service entry:', error);
    alert('An error occurred while updating service entry');
  }
};


  const handleCloseModal = () => {
    setEditModal({ isOpen: false, section: null });
  };

  const handleCloseServiceModal = () => {
    setEditServiceModal({ isOpen: false, serviceEntry: null });
  };

  const optimalSection = getOptimalSection();

  const handleDeleteServiceEntry = async () => {
  if (!editServiceModal.serviceEntry || !onUpdateServiceHistory || !onUpdateSection) return;

  const entryToDelete = editServiceModal.serviceEntry;

  try {
    // 1. DELETE from service_history database
    const { error: deleteError } = await supabase
      .from('service_history')
      .delete()
      .eq('id', entryToDelete.id);

    if (deleteError) {
      console.error('Error deleting service history entry:', deleteError);
      alert('Failed to delete service history entry');
      return;
    }

    // 2. Update the table status - mark as not taken
    const table = tables.find(t => t.id === entryToDelete.tableId);
    const isUnassignedTable = table?.section_id === null;

    const tableUpdateData: any = {
      is_taken: false,
      current_party_size: 0
    };

    // If it's an unassigned table, reset current_section to null
    if (isUnassignedTable) {
      tableUpdateData.current_section = null;
    }

    const { error: tableError } = await supabase
      .from('tables')
      .update(tableUpdateData)
      .eq('id', entryToDelete.tableId);

    if (tableError) {
      console.error('Error updating table status:', tableError);
      alert('Failed to update table status');
      return;
    }

    // 3. Update local table state
    onUpdateTable(entryToDelete.tableId, tableUpdateData);

    // Remove from service history
    const updatedServiceHistory = serviceHistory.filter(entry => entry.id !== entryToDelete.id);
    onUpdateServiceHistory(updatedServiceHistory);

    // Subtract customers from section total
    const section = sections.find(s => s.id === entryToDelete.sectionId);
    if (section) {
      const newCustomerCount = Math.max(0, (section.customers_served || 0) - entryToDelete.partySize);
      
      // Update database
      const { error } = await supabase
        .from('sections')
        .update({ customers_served: newCustomerCount })
        .eq('id', entryToDelete.sectionId);

      if (error) {
        console.error('Error updating section customer count:', error);
        alert('Failed to update section customer count');
        return;
      }

      // Update local section state
      onUpdateSection(entryToDelete.sectionId, { customers_served: newCustomerCount });
    }

    console.log(`Deleted service entry: ${entryToDelete.tableName} (${entryToDelete.partySize} customers)`);
    
    // Close modal
    handleCloseServiceModal();
    
  } catch (error) {
    console.error('Failed to delete service entry:', error);
    alert('An error occurred while deleting service entry');
  }
};

  return (
    <>
      <div className="bg-white rounded-lg shadow flex flex-col w-full max-w-[95vw] mx-auto" style={{ height: 'calc(100vh - 200px)' }}>
        <h2 className="text-2xl font-bold p-6 pb-4 flex-shrink-0">Service History</h2>

        {/* T-Chart Layout - Fixed height container */}
        <div className="border-2 border-white flex-1 flex flex-col mx-6 mb-6 min-h-0">
          {/* Section Headers Row - Fixed height */}
          <div className="grid border-b-2 border-black flex-shrink-0 h-20" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
            {sections.map(section => (
              <div key={section.id} className="border-r-2 border-black last:border-r-0 p-4 flex items-center justify-center">
                <div className="text-3xl font-bold">{section.name}</div>
              </div>
            ))}
          </div>

          {/* Tables Content Row - Scrollable with fixed height */}
          <div className="grid flex-1 min-h-0" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
            {sections.map(section => {
              // Get service history entries for this section - exclude only moved services
              const sectionServices = serviceHistory
                ?.filter(service => service.sectionId === section.id && service.status !== 'moved')
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || [];
              
              return (
                <div key={section.id} className="border-r-2 border-black last:border-r-0 flex flex-col min-h-0">
                  {/* Scrollable container for service instances */}
                  <div 
                    id={`section-${section.id}-scroll`}
                    className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
                  >
                    {sectionServices.length === 0 ? (
                      <div className="text-center text-gray-400 text-2xl py-12">
                        No services yet
                      </div>
                    ) : (
                      sectionServices.map(service => (
                        <button
                          key={service.id}
                          onClick={() => handleServiceEntryClick(service)}
                          className="w-full text-center font-bold text-3xl py-3 px-3 rounded flex-shrink-0 bg-white hover:bg-gray-50 transition-colors cursor-pointer border-2 border-transparent hover:border-gray-200"
                          style={{ color: section.color }}
                          title={`Click to edit • ${service.isActive ? 'Currently serving' : 'Service completed'} at ${new Date(service.timestamp).toLocaleTimeString()}. Party size: ${service.partySize} customers.`}
                        >
                          {service.tableName} → {service.partySize}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals Row - Fixed height - CLICKABLE */}
          <div className="grid border-t-2 border-black flex-shrink-0 h-20" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
            {sections.map(section => {
              const currentCustomers = section.customers_served || 0;
              const isOptimal = section.id === optimalSection.id;
              
              return (
                <button
                  key={`total-${section.id}`}
                  onClick={() => handleCustomerCountClick(section)}
                  className={`border-r-2 border-black last:border-r-0 flex items-center justify-center transition-all hover:bg-gray-50 cursor-pointer ${
                    isOptimal ? 'bg-yellow-300 animate-pulse hover:bg-yellow-400' : ''
                  }`}
                  title="Click to edit customer count"
                >
                  <div className={`text-4xl font-bold ${isOptimal ? 'text-black' : ''}`} style={{ color: isOptimal ? 'black' : section.color }}>
                    {currentCustomers}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Customer Count Modal */}
      <EditCustomerCountModal
        isOpen={editModal.isOpen}
        section={editModal.section}
        onConfirm={handleUpdateCustomerCount}
        onCancel={handleCloseModal}
      />

      {/* Edit Service Entry Modal */}
      <EditServiceEntryModal
        isOpen={editServiceModal.isOpen}
        serviceEntry={editServiceModal.serviceEntry}
        sections={sections}
         tables={tables} 
        onConfirm={handleUpdateServiceEntry}
        onDelete={handleDeleteServiceEntry}
        onCancel={handleCloseServiceModal}
      />
    </>
  );
}
