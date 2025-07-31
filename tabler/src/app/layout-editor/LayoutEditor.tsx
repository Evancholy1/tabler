// src/app/layout-editor/LayoutEditor.tsx
'use client';

import { useState } from 'react';
import { Layout, Section, Table, LayoutEditorProps } from './types/layout';
import { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react';

export default function LayoutEditor({ 
  layout, 
  sections, 
  initialTables 
}: LayoutEditorProps) {
  
  const router = useRouter()
  // State to track all tables (starts with tables from database)
  const [tables, setTables] = useState<Table[]>(initialTables);
  
  // State to track which table is currently selected
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [isEditingTable, setIsEditingTable] = useState(false); 
  const [editingTableName, setEditingTableName] = useState('');

  const [isLoading, setIsLoading] = useState(false);

 
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [newTablePosition, setNewTablePosition] = useState<{x: number, y: number} | null>(null);
  const [newTableName, setNewTableName] = useState('');
  const [newTableSection, setNewTableSection] = useState<string>('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  // saves all tables you created to database 
  const handleConfirmSetup = async () => {
    setIsLoading(true);
    
    try {
      // 1. Save all tables to database
      await saveAllTables();
      
      // 2. Mark user as setup complete
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ is_setup: true })
          .eq('id', user.id);
  
        if (userUpdateError) {
          console.error('Error updating user setup status:', userUpdateError);
          throw userUpdateError;
        }
      }
  
      // 3. Redirect to main app
      console.log('Setup completed successfully!');
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error confirming setup:', error);
      alert('Failed to save layout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  //
  const startTableCreation = (x: number, y: number) => {
    // Check if table already exists at this position
    const existingTable = tables.find(t => t.x_pos === x && t.y_pos === y);
    if (existingTable) {
      console.log('Table already exists at this position');
      return;
    }
  
    // Start creation mode
    setNewTablePosition({ x, y });
    setNewTableName('');
    setNewTableSection('');
    setIsCreatingTable(true);
    setSelectedTable(null); // Clear any selected table
  };

  const confirmTableCreation = () => {
    if (!newTablePosition || !newTableName.trim() || !newTableSection) {
      alert('Please provide a table name and select a section');
      return;
    }
  
    // Create new table object
    const newTable: Table = {
      id: `temp-${Date.now()}`,
      layout_id: layout.id,
      section_id: newTableSection,
      current_section: newTableSection,
      x_pos: newTablePosition.x,
      y_pos: newTablePosition.y,
      name: newTableName.trim(),
      is_taken: false,
      current_party_size: 0,
      assigned_at: new Date().toISOString()
    };
  
    // Add to tables array
    setTables(prevTables => [...prevTables, newTable]);
    
    // Reset creation state
    cancelTableCreation();
  };

  const cancelTableCreation = () => {
    setIsCreatingTable(false);
    setNewTablePosition(null);
    setNewTableName('');
    setNewTableSection('');
  };


  // Function to check if a table exists at a position
  const getTableAt = (x: number, y: number): Table | undefined => {
    return tables.find(t => t.x_pos === x && t.y_pos === y);
  };

  const startEditingTable = (table: Table) => {
    if (isCreatingTable) {
      cancelTableCreation();
    }

    setSelectedTable(table); 
    setEditingTableName(table.name || ''); 
    setIsEditingTable(true); 
  }

  const saveTableName = () => {
    if (selectedTable) {
      updateTableName(selectedTable.id, editingTableName);
      setIsEditingTable(false);
      setEditingTableName('');
    }
  };

  const cancelEditing = () => {
    setIsEditingTable(false);
    setEditingTableName('');
  };

  // Function to render a single grid cell
  const renderCell = (x: number, y: number) => {
    const table = getTableAt(x, y);
    const isCreationPosition = newTablePosition?.x === x && newTablePosition?.y === y;
    
    if (table) {
      // There's a table at this position
      const displayName = table.name || `+`; 
      const backgroundColor = getSectionColor(table.current_section)
      const isSelected = selectedTable?.id === table.id;
  
      return (
        <div
          key={`${x}-${y}`}
          className={`
            w-16 h-16 border-2 flex items-center justify-center cursor-pointer rounded-lg transition-all
            ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-300'}
            hover:shadow-md
          `}
          style={{ backgroundColor }}
          onClick={() => {
            setSelectedTable(table);
            startEditingTable(table); // Immediately enter editing mode
          }}
        >
          <span className="text-xs font-medium text-center px-1 truncate">
            {displayName}
          </span>
        </div>
      );
    } else if (isCreationPosition) {
      // Position being created - show preview
      const previewColor = newTableSection ? getSectionColor(newTableSection) : '#f3f4f6';
      
      return (
        <div
          key={`${x}-${y}`}
          className="w-16 h-16 border-2 border-dashed border-blue-500 flex items-center justify-center rounded-lg transition-all"
          style={{ backgroundColor: previewColor, opacity: 0.7 }}
        >
          <span className="text-xs font-medium text-center px-1">
            {newTableName || '?'}
          </span>
        </div>
      );
    } else {
      // Empty cell - click to start creation
      return (
        <div
          key={`${x}-${y}`}
          className="w-16 h-16 border border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded-lg transition-colors"
          onClick={() => startTableCreation(x, y)}
        >
          <span className="text-gray-400 text-xs">+</span>
        </div>
      );
    }
  };


  //function to assign a table to a section 

  const assignTableToSection = (tableId: string, sectionId: string | null) => {
    setTables(prevTables => 
      prevTables.map(table =>
        table.id === tableId
        ? {...table, current_section: sectionId}
        :table
      )
    );

    if (selectedTable?.id === tableId) {
      setSelectedTable(prev => prev ? {...prev, current_section: sectionId} : null);
    }
  };

  const updateTableName = (tableId: string, newName: string) => {
    setTables(prevTables => 
      prevTables.map(table =>
        table.id === tableId
        ? {...table, name : newName.trim() || null}
        :table
      )
    );

    if (selectedTable?.id === tableId) {
      setSelectedTable(prev => prev ? {...prev, name:newName.trim() || null} : null);
    }
  };

 


  const getSectionColor = (sectionId: string | null) : string => {
    if (!sectionId) return '#f3f4f6'; //unassigned

    const section = sections.find(s=> s.id === sectionId);
    return section?.color || '#f3f4f6'; 
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

  const saveAllTables = async () => {
    try {
      const unsavedTables = tables.filter(table => table.id.startsWith('temp-'))

      if (unsavedTables.length === 0) {
        console.log('No tables to save');
        return;
    }

    const tablesToSave = unsavedTables.map(table => ({
      layout_id: table.layout_id,
      section_id: table.section_id,
      current_section: table.current_section,
      x_pos: table.x_pos,
      y_pos: table.y_pos,
      name: table.name,
      is_taken: table.is_taken,
      current_party_size: table.current_party_size,
    }));

    const { data: savedTables, error } = await supabase
      .from('tables')
      .insert(tablesToSave)
      .select();

    if (error) {
      console.error('Error saving tables:', error);
      return;
    }
    setTables(prevTables => {
      const newTables = [...prevTables];
      
      // Replace temp tables with saved tables
      unsavedTables.forEach((tempTable, index) => {
        const tempIndex = newTables.findIndex(t => t.id === tempTable.id);
        if (tempIndex !== -1 && savedTables[index]) {
          newTables[tempIndex] = savedTables[index];
        }
      });
      
      return newTables;
  });

    console.log('All tables saved successfully!');
    
  } catch (error) {
    console.error('Failed to save tables:', error);
  }
  };  


// remove table from array
const deleteTable = (tableId: string) => {
  setTables(prevTables =>
    prevTables.filter(table => table.id !== tableId)
  );

  if (selectedTable?.id === tableId) {
    setSelectedTable(null);
  }
};

const confirmDelete = () => {
  if (tableToDelete) {
    deleteTable(tableToDelete.id);
    setShowDeleteConfirm(false);
    setTableToDelete(null);
  }
};

const cancelDelete = () => {
  setShowDeleteConfirm(false);
  setTableToDelete(null);
};


  return (
    <div className="min-h-screen bg-gray-50 p-4 rounded-2xl border">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Layout Editor</h1>
        
        <div className="flex gap-6">
          {/* Main Grid */}
          <div className="flex-1">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                {layout.name} ({layout.width}×{layout.height})
              </h2>
              
              <div 
                className="grid gap-2"
                style={{ 
                  gridTemplateColumns: `repeat(${layout.width}, 1fr)` 
                }}
              >
                {renderGrid()}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          {/* Sidebar */}
          <div className="w-64">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Sections</h3>
              
              {sections.map(section => (
                <div key={section.id} className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: section.color }}
                  />
                  <span>{section.name}</span>
                </div>
              ))}

              {/* Table Creation Panel */}
              {isCreatingTable && newTablePosition && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-semibold mb-3">Create New Table</h4>
                  
                  {/* Table Name Input */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Table Name</label>
                    <input
                      type="text"
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Enter table name"
                      autoFocus
                    />
                  </div>

                  {/* Section Assignment */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Section</label>
                    <select
                      value={newTableSection}
                      onChange={(e) => setNewTableSection(e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="">Select section</option>
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>
                          {section.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Position Info */}
                  <div className="mb-4 text-xs text-gray-500">
                    Position: {newTablePosition.x}, {newTablePosition.y}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={confirmTableCreation}
                      disabled={!newTableName.trim() || !newTableSection}
                      className="flex-1 bg-blue-500 text-white py-2 px-2 rounded-lg hover:bg-blue-700 disabled:opacity-100 disabled:cursor-not-allowed font-medium transition-colors text-sm"
                    >
                      Create
                    </button>
                    
                    <button
                      onClick={cancelTableCreation}
                      className="flex-1 bg-red-500 text-white py-2 px-2 rounded-lg hover:bg-gray-600 font-medium transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Table View Panel - when selected but not editing */}
            {selectedTable && !isCreatingTable && !isEditingTable && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold mb-3">Table Info</h4>
                
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Table Name</label>
                  <div className="px-2 py-1 border rounded text-sm bg-gray-50">
                    {selectedTable.name || 'Unnamed Table'}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <div className="px-2 py-1 border rounded text-sm bg-gray-50">
                    {sections.find(s => s.id === selectedTable.current_section)?.name || 'Unassigned'}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  <div>Position: {selectedTable.x_pos}, {selectedTable.y_pos}</div>
                </div>
              </div>
            )}

            {/* Table Editing Panel - when selected and editing */}
            {selectedTable && !isCreatingTable && isEditingTable && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-semibold mb-3">Edit Table</h4>
                
                {/* Table Name Editing */}
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Table Name</label>
                  <input
                    type="text"
                    value={editingTableName}
                    onChange={(e) => setEditingTableName(e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Enter table name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTableName();
                      if (e.key === 'Escape') cancelEditing();
                    }}
                  />
                </div>

                {/* Section Assignment */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <select
                    value={selectedTable.current_section || ''}
                    onChange={(e) => assignTableToSection(selectedTable.id, e.target.value || null)}
                    className="w-full px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Unassigned</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={saveTableName}
                    className="flex-1 bg-blue-600 text-white py-2 px-2 rounded-lg hover:bg-green-700 font-medium transition-colors text-sm"
                  >
                    Save
                  </button>
                  
                  <button
                    onClick={cancelEditing}
                    className="flex-1 bg-gray-500 text-white py-2 px-2 rounded-lg hover:bg-gray-600 font-medium transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>

                <button
                  onClick={() => {
                  setTableToDelete(selectedTable);
                  setShowDeleteConfirm(true);
                }}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium transition-colors text-sm flex items-center justify-center gap-2"
                >
              <Trash2 size={16} />
              Delete Table
              </button>
              {/* Custom Delete Confirmation Modal */}
                {showDeleteConfirm && tableToDelete && (
                  <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-100 p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
                      <h3 className="text-lg font-semibold mb-3">Delete Table</h3>
                      <p className="text-gray-600 mb-6">
                        Are you sure you want to delete "{tableToDelete.name || `Table ${tableToDelete.id.slice(-2)}`}"?
                      </p>
      
                      <div className="flex gap-3">
                        <button
                          onClick={cancelDelete}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmDelete}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <div>Position: {selectedTable.x_pos}, {selectedTable.y_pos}</div>
                </div>
              </div>
            )}

              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={handleConfirmSetup}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-wait font-medium transition-colors"
                >
                  {isLoading ? 'Saving Layout...' : 'Confirm Setup'}
                </button>
                
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {tables.length} table{tables.length !== 1 ? 's' : ''} created
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}