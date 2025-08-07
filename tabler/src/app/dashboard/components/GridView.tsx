// src/app/app/components/GridView.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Layout, Section, Table, ViewProps } from '../types/dashboard';

interface ConfirmationModalProps {
  isOpen: boolean;
  tableName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal = ({ isOpen, tableName, onConfirm, onCancel }: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Remove Customers
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to remove customers from <strong>{tableName}</strong>?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

// Extended ViewProps to include service history callback with cumulative tracking
interface ExtendedViewProps extends ViewProps {
  onCreateServiceHistory?: (tableId: string, sectionId: string, partySize: number) => void;
}

export default function GridView({ 
  layout, 
  sections, 
  tables, 
  partySize, 
  onUpdateTable,
  onCreateServiceHistory
}: ExtendedViewProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    table: Table | null;
  }>({ isOpen: false, table: null });

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
      return '#ffffff';
    }
    
    if (table.section_id && sections) {
      const section = sections.find(s => s.id === table.current_section);
      return section?.color || '#f3f4f6';
    }
    
    return '#f3f4f6';
  };

  // UPDATED: Simple toggle without accumulation + service history creation
  const toggleTableStatus = async (table: Table) => {
    try {
      const newStatus = !table.is_taken;
      
      const updates: any = {
        is_taken: newStatus
      };

      // When seating customers (clicking empty table), set current party size
      if (newStatus) {
        updates.current_party_size = partySize; // Just current service, no accumulation
      }
      // When removing customers, don't change party size (keeps last service size)
      
      // Update database
      const { error } = await supabase
        .from('tables')
        .update(updates)
        .eq('id', table.id);

      if (error) {
        console.error('Error updating table status:', error);
        return;
      }

      // Update parent state
      const stateUpdates: any = {
        is_taken: newStatus
      };

      if (newStatus) {
        stateUpdates.current_party_size = partySize;
        
        // CREATE SERVICE HISTORY ENTRY when seating customers
        if (onCreateServiceHistory) {
          onCreateServiceHistory(table.id, table.current_section || '', partySize);
        }
      }

      onUpdateTable(table.id, stateUpdates);

    } catch (error) {
      console.error('Failed to update table status:', error);
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);

    if (table.is_taken) {
      setConfirmationModal({ isOpen: true, table });
    } else {
      // Directly seat customers if table is empty
      toggleTableStatus(table);
    }
  };

  const handleConfirmRemoval = async () => {
    if (confirmationModal.table) {
      await toggleTableStatus(confirmationModal.table);
    }
    setConfirmationModal({ isOpen: false, table: null });
  };

  const handleCancelRemoval = () => {
    setConfirmationModal({ isOpen: false, table: null });
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
            w-16 h-16 border-2 flex flex-col items-center justify-center cursor-pointer rounded-lg transition-all
            ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
            ${table.is_taken ? 'shadow-md' : ''}
            hover:shadow-md
          `}
          style={{ backgroundColor }}
          onClick={() => handleTableClick(table)}
        >
          {/* Table Name */}
          <span className="text-xs font-medium text-center leading-tight text-black">
            {displayName}
          </span>
          
          {/* Party Size (if taken) */}
          {table.is_taken && table.current_party_size > 0 && (
            <span className="text-xs text-gray-700 leading-none">
              {table.current_party_size}
            </span>
          )}
        </div>
      );
    } else {
      // Empty cell - no table here
      return (
        <div
          key={`${x}-${y}`}
          className="w-16 h-16"
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
      <div className="bg-white p-6 rounded-lg shadow min-h-screen flex flex-col">
        {/* Main Grid */}
        <div className="flex-1 flex items-center justify-center">
          <div 
            className="grid gap-2"
            style={{ 
              gridTemplateColumns: `repeat(${layout.width}, 1fr)`,
              maxWidth: `${layout.width * 68}px`
            }}
          >
            {renderGrid()}
          </div>
        </div>
    
        {/* Stats */}
        <div className="text-center text-gray-500 text-sm mt-auto">
          {sections?.length || 0} sections, {tables?.length || 0} tables
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        tableName={confirmationModal.table?.name || `T${confirmationModal.table?.id?.slice(-2)}` || ''}
        onConfirm={handleConfirmRemoval}
        onCancel={handleCancelRemoval}
      />
    </>
  );
}