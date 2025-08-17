// src/app/app/components/GridView.tsx
'use client';

import { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabaseClient';
import { Layout, Section, Table, ViewProps } from '../types/dashboard';


interface ConfirmationModalProps {
  isOpen: boolean;
  tableName: string;
  onConfirm: () => void;
  onCancel: () => void;
  onMove: () => void;
}

interface MoveCustomersModalProps {
  isOpen: boolean;
  sourceTable: Table | null;
  sections: Section[];
  tables: Table[];
  onConfirm: (targetTableId: string, targetSectionId: string, keepOriginalSection: boolean) => void;
  onCancel: () => void;
}

const ConfirmationModal = ({ isOpen, tableName, onConfirm, onCancel, onMove }: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-brightness-75 backdrop-opacity-600 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Manage Table: {tableName}
        </h3>
        <p className="text-gray-600 mb-6">
          What would you like to do with the customers at <strong>{tableName}</strong>?
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onMove}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Move/Change Section
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
          >
            Remove Customers
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const MoveCustomersModal = ({ 
  isOpen, 
  sourceTable, 
  sections, 
  tables, 
  onConfirm, 
  onCancel 
}: MoveCustomersModalProps) => {
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [keepOriginalSection, setKeepOriginalSection] = useState(false);

  const hasChanges = () => {
    if (!sourceTable) return false;
    
    const tableChanged = selectedTable !== sourceTable.id;
    const sectionChanged = !keepOriginalSection && selectedSection !== sourceTable.current_section;
    const keepOriginalChanged = keepOriginalSection && selectedSection !== sourceTable.current_section;
    
    return tableChanged || sectionChanged || keepOriginalChanged;
  };

  useEffect(() => {
    if (isOpen && sourceTable) {
      setSelectedTable(sourceTable.id);
      setSelectedSection(sourceTable.current_section || '');
      setKeepOriginalSection(false);
    }
  }, [isOpen, sourceTable]);

  // Get available tables (not taken and not the source table)
  const getAvailableTables = () => {
    return tables.filter(table => 
      (!table.is_taken || table.id === sourceTable?.id) && // Include current table
      (table.capacity || 4) >= (sourceTable?.current_party_size || 1)
    );
  };

  // Handle table selection - auto-set section based on table's section_id unless keeping original
  const handleTableChange = (tableId: string) => {
    setSelectedTable(tableId);
    if (!keepOriginalSection) {
      const selectedTableData = tables.find(t => t.id === tableId);
      if (selectedTableData) {
        if (selectedTableData.section_id) {
          // Regular section table
          setSelectedSection(selectedTableData.section_id);
        } else {
          // Unassigned table - need to select a section for assignment
          setSelectedSection('');
        }
      }
    }
  };

  // Handle section change - filter tables by section
  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    // Clear table selection when section changes
    // setSelectedTable('');
  };

  // Handle keep original section toggle
  const handleKeepOriginalToggle = (checked: boolean) => {
    setKeepOriginalSection(checked);
    if (checked && sourceTable?.current_section) {
      setSelectedSection(sourceTable.current_section);
    } else if (selectedTable) {
      // Reset to table's default section
      const selectedTableData = tables.find(t => t.id === selectedTable);
      if (selectedTableData && selectedTableData.section_id) {
        setSelectedSection(selectedTableData.section_id);
      }
    }
  };

  if (!isOpen || !sourceTable) return null;

  const availableTables = getAvailableTables();
  const sourceSection = sections.find(s => s.id === sourceTable.current_section);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 p-4 border-b">
          <h3 className="text-xl font-semibold text-blue-900">Move Customers</h3>
          <p className="text-sm text-blue-700">
            Moving {sourceTable.current_party_size} {sourceTable.current_party_size === 1 ? 'person' : 'people'} from {sourceTable.name || sourceTable.id}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {availableTables.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No available tables with sufficient capacity</p>
            </div>
          ) : (
            <>
              {/* Keep Original Section Toggle */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepOriginalSection}
                    onChange={(e) => handleKeepOriginalToggle(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-yellow-800">
                    Keep customers in original section ({sourceSection?.name})
                  </span>
                </label>
                <p className="text-xs text-yellow-700 mt-1 ml-7">
                  Move to different table but keep section
                </p>
              </div>

              {/* Section Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {keepOriginalSection ? 'Section Assignment (Fixed)' : 'Target Section'}
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  disabled={keepOriginalSection}
                  className={`w-full p-3 border-2 rounded-lg bg-white focus:outline-none ${
                    keepOriginalSection 
                      ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed' 
                      : 'border-blue-200 focus:border-blue-400'
                  }`}
                >
                  <option value="">Select a section...</option>
                  {sections.map(section => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Table Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2"> 
                  Target Table
                </label>
                <select
                  value={selectedTable}
                  onChange={(e) => handleTableChange(e.target.value)}
                  className="w-full p-3 border-2 border-blue-200 rounded-lg bg-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="">Select a table...</option>
                  
                  {/* Show all available tables grouped by section */}
                  {sections.map(section => {
                    const sectionTables = getAvailableTables().filter(table => table.section_id === section.id);
                    if (sectionTables.length === 0) return null;
                    
                    return (
                      <optgroup key={section.id} label={`${section.name} Tables`}>
                        {sectionTables.map(table => (
                          <option key={table.id} value={table.id}>
                            {table.name || table.id} (Capacity: {table.capacity || 4})
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}

                  {/* Unassigned overflow tables */}
                  {(() => {
                    const unassignedTables = getAvailableTables().filter(table => table.section_id === null);
                    if (unassignedTables.length === 0) return null;
                    
                    return (
                      <optgroup label="🚨 Overflow Tables (Unassigned)">
                        {unassignedTables.map(table => (
                          <option key={table.id} value={table.id}>
                            {table.name || table.id} (Capacity: {table.capacity || 4}) - Overflow
                          </option>
                        ))}
                      </optgroup>
                    );
                  })()}
                </select>
              </div>

              {/* Move Summary */}
              {selectedTable && selectedSection && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600 mb-2">
                      Change Summary
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div>
                        <strong>Table Change</strong> {sourceTable.name || sourceTable.id} → {tables.find(t => t.id === selectedTable)?.name || selectedTable}
                      </div>
                      <div>
                        <strong>Section Change</strong> {sourceSection?.name} → {sections.find(s => s.id === selectedSection)?.name}
                        {keepOriginalSection && <span className="text-yellow-600 font-medium"> (No Change)</span>}
                        {tables.find(t => t.id === selectedTable)?.section_id === null && (
                          <span className="text-orange-600 font-medium"> (Overflow Table)</span>
                        )}
                      </div>
                      <div>
                        <strong>Party Size:</strong> {sourceTable.current_party_size} {sourceTable.current_party_size === 1 ? 'person' : 'people'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex space-x-4 p-6 bg-gray-50">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selectedTable, selectedSection, keepOriginalSection)}
            disabled={!selectedTable || !selectedSection || availableTables.length === 0 || !hasChanges()}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirm 
          </button>
        </div>
      </div>
    </div>
  );
};

export default function GridView({ 
  layout, 
  sections, 
  tables,
  partySize, 
  onUpdateTable,
  onCreateServiceHistory,
  onCompleteService,
  onMoveService,
  onTriggerAutoAssign,
  onUpdateSection
}: ViewProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    table: Table | null;
  }>({ isOpen: false, table: null });
  
  const [moveModal, setMoveModal] = useState<{
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

      // Update parent state
      onUpdateTable(table.id, {
        is_taken: false,
        current_party_size: 0
      });

    } catch (error) {
      console.error('Failed to update table status:', error);
    }
  };

  // Move customers to another table
  const moveCustomers = async (sourceTable: Table, targetTableId: string, targetSectionId: string, keepOriginalSection: boolean) => {
    try {
      // Determine the final section assignment
      const finalSectionId = keepOriginalSection ? sourceTable.current_section : targetSectionId;
      const sourceSectionId = sourceTable.current_section;
      const sourceIsUnassigned = sourceTable.section_id === null;
      const targetTable = tables.find(t => t.id === targetTableId);
      const targetIsUnassigned = targetTable?.section_id === null;
      //to change secton only
      const isSameTable = sourceTable.id === targetTableId;
      const isSectionChange = sourceSectionId !== finalSectionId;


      //when changing only sectionc
      if (isSameTable && isSectionChange) {
        const { error } = await supabase
          .from('tables')
          .update({
            current_section: finalSectionId
          })
          .eq('id', sourceTable.id);
      
        if (error) {
          console.error('Error updating table section:', error);
          return;
        }
      
        // Mark old service as moved and create new service entry
        if (onMoveService) {
          await onMoveService(sourceTable.id);
        }
        if (onCreateServiceHistory && finalSectionId) {
          await onCreateServiceHistory(sourceTable.id, finalSectionId, sourceTable.current_party_size);
        }

        if (sourceSectionId && finalSectionId && onUpdateSection) {
          // Subtract from source section
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
      
          // Add to target section
          const targetSection = sections.find(s => s.id === finalSectionId);
          if (targetSection) {
            await supabase
              .from('sections')
              .update({
                customers_served: (targetSection.customers_served || 0) + sourceTable.current_party_size
              })
              .eq('id', finalSectionId);
      
            onUpdateSection(finalSectionId, {
              customers_served: (targetSection.customers_served || 0) + sourceTable.current_party_size
            });
          }
        }
      
        // Update section counts and local state...
        // (same section count logic as before)
        
        onUpdateTable(sourceTable.id, { current_section: finalSectionId });
        console.log(`Changed section assignment for table ${sourceTable.id} from ${sourceSectionId} to ${finalSectionId}`);
        return;
      }
      
          

      // Update source table - remove customers and reset current_section if it's unassigned
      const sourceUpdateData: any = { 
        is_taken: false,
        current_party_size: 0
      };
      
      // If source is unassigned table, reset current_section to null
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

      // Update target table - add customers and set section
      const { error: targetError } = await supabase
        .from('tables')
        .update({
          is_taken: true,
          current_party_size: sourceTable.current_party_size,
          current_section: finalSectionId,
          assigned_at: new Date().toISOString()
        })
        .eq('id', targetTableId);

      if (targetError) {
        console.error('Error updating target table:', targetError);
        alert('Failed to update target table');
        return;
      }

      // Update service history - mark old service as moved and create new one
      if (onMoveService) {
        await onMoveService(sourceTable.id);
      }
      if (onCreateServiceHistory && finalSectionId) {
        await onCreateServiceHistory(targetTableId, finalSectionId, sourceTable.current_party_size);
      }

      // Update section customer counts only if section assignment changed
      if (sourceSectionId && finalSectionId && sourceSectionId !== finalSectionId && onUpdateSection) {
        // Subtract from source section
        const sourceSection = sections.find(s => s.id === sourceSectionId);
        if (sourceSection) {
          await supabase
            .from('sections')
            .update({
              customers_served: Math.max(0, (sourceSection.customers_served || 0) - sourceTable.current_party_size)
            })
            .eq('id', sourceSectionId);

          // Update local state
          onUpdateSection(sourceSectionId, {
            customers_served: Math.max(0, (sourceSection.customers_served || 0) - sourceTable.current_party_size)
          });
        }

        // Add to target section
        const targetSection = sections.find(s => s.id === finalSectionId);
        if (targetSection) {
          await supabase
            .from('sections')
            .update({
              customers_served: (targetSection.customers_served || 0) + sourceTable.current_party_size
            })
            .eq('id', finalSectionId);

          // Update local state
          onUpdateSection(finalSectionId, {
            customers_served: (targetSection.customers_served || 0) + sourceTable.current_party_size
          });
        }
      }

      // Update local table state
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
        current_party_size: sourceTable.current_party_size,
        current_section: finalSectionId,
        assigned_at: new Date().toISOString()
      });

      const sourceType = sourceIsUnassigned ? 'overflow table' : 'section table';
      const targetType = targetIsUnassigned ? 'overflow table' : 'section table';
      const actionDescription = keepOriginalSection 
        ? `moved to different physical table but kept in same section`
        : `moved to different table and section`;

      console.log(`Successfully ${actionDescription}: ${sourceTable.current_party_size} customers from ${sourceType} ${sourceTable.id} to ${targetType} ${targetTableId} (section: ${finalSectionId})`);

    } catch (error) {
      console.error('Failed to move customers:', error);
      alert('An error occurred while moving customers');
    }
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);

    if (table.is_taken) {
      // Show confirmation modal for occupied tables
      setConfirmationModal({ isOpen: true, table });
    } else {
      // Trigger auto-assign popup with this table preselected
      if (onTriggerAutoAssign) {
        onTriggerAutoAssign(table.id);
      }
    }
  };

  const handleConfirmRemoval = async () => {
    if (confirmationModal.table) {
      await toggleTableStatus(confirmationModal.table);
    }
    setConfirmationModal({ isOpen: false, table: null });
  };

  const handleShowMove = () => {
    setMoveModal({ isOpen: true, table: confirmationModal.table });
    setConfirmationModal({ isOpen: false, table: null });
  };

  const handleConfirmMove = async (targetTableId: string, targetSectionId: string, keepOriginalSection: boolean) => {
    if (moveModal.table && targetTableId && targetSectionId) {
      await moveCustomers(moveModal.table, targetTableId, targetSectionId, keepOriginalSection);
    }
    setMoveModal({ isOpen: false, table: null });
  };

  const handleCancelAction = () => {
    setConfirmationModal({ isOpen: false, table: null });
    setMoveModal({ isOpen: false, table: null });
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        tableName={confirmationModal.table?.name || `T${confirmationModal.table?.id?.slice(-2)}` || ''}
        onConfirm={handleConfirmRemoval}
        onCancel={handleCancelAction}
        onMove={handleShowMove}
      />

      {/* Move Customers Modal */}
      <MoveCustomersModal
        isOpen={moveModal.isOpen}
        sourceTable={moveModal.table}
        sections={sections}
        tables={tables}
        onConfirm={handleConfirmMove}
        onCancel={handleCancelAction}
        

        

      />
    </>
  );
}