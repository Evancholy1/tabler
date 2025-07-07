// src/app/layout-editor/LayoutEditor.tsx
'use client';

import { useState } from 'react';
import { Layout, Section, Table, LayoutEditorProps } from './types/layout';

export default function LayoutEditor({ 
  layout, 
  sections, 
  initialTables 
}: LayoutEditorProps) {
  
  // State to track all tables (starts with tables from database)
  const [tables, setTables] = useState<Table[]>(initialTables);
  
  // State to track which table is currently selected
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [isEditingTable, setIsEditingTable] = useState(false); 
  const [editingTableName, setEditingTableName] = useState('');

  // Function to add a new table at a specific position
  const addTable = (x: number, y: number) => {
    // Check if table already exists at this position
    const existingTable = tables.find(t => t.x_pos === x && t.y_pos === y);
    if (existingTable) {
      console.log('Table already exists at this position');
      return;
    }

    // Create new table object
    const newTable: Table = {
      id: `temp-${Date.now()}`, // Temporary ID until saved to database
      layout_id: layout.id,
      section_id: null,         // Unassigned initially
      x_pos: x,
      y_pos: y,
      name: null,               // No name initially
      is_taken: false,
      current_party_size: 0,
    };

    // Add to tables array
    setTables(prevTables => [...prevTables, newTable]);
  };

  // Function to check if a table exists at a position
  const getTableAt = (x: number, y: number): Table | undefined => {
    return tables.find(t => t.x_pos === x && t.y_pos === y);
  };

  const startEditingTable = (table: Table) => {
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
    
    if (table) {
      // There's a table at this position
      const displayName = table.name || `NA`; 
      const backgroundColor = getSectionColor(table.section_id)
      const isSelected = selectedTable?.id === table.id;


      return (
        <div
          key={`${x}-${y}`}
          className={`
            w-16 h-16 border-2 flex items-center justify-center cursor-pointer rounded-lg transition-all
            ${isSelected ? 'border-Black-500 shadow-lg' : 'border-gray-300'}
            hover:shadow-md
          `}
          style = {{ backgroundColor }}
          onClick = {() => setSelectedTable(table)}
          onDoubleClick={() => startEditingTable(table)}
        >
          <span className="text-xs font-medium text-center px-1 truncate">
          {displayName}
        </span>
      </div>
      );
    } else {
      // Empty cell - click to add table
      return (
        <div
          key={`${x}-${y}`}
          className="w-16 h-16 border border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded-lg transition-colors"
          onClick={() => addTable(x, y)}
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
        ? {...table, section_id: sectionId}
        :table
      )
    );

    if (selectedTable?.id === tableId) {
      setSelectedTable(prev => prev ? {...prev, section_id: sectionId} : null);
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

              {/* Table Details Panel */}
              {selectedTable && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-semibold mb-3">Selected Table</h4>
                  
                  {/* Table Name Editing */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Table Name</label>
                    {isEditingTable ? (
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={editingTableName}
                          onChange={(e) => setEditingTableName(e.target.value)}
                          className="flex-1 px-2 py-1 border rounded text-sm"
                          placeholder="Enter table name"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveTableName();
                            if (e.key === 'Escape') cancelEditing();
                          }}
                        />
                        <button
                          onClick={saveTableName}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                        >
                          ✓
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="px-2 py-1 border rounded text-sm cursor-pointer hover:bg-gray-50"
                        onClick={() => startEditingTable(selectedTable)}
                      >
                        {selectedTable.name || 'Click to name table'}
                      </div>
                    )}
                  </div>

                  {/* Section Assignment */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-1">Section</label>
                    <select
                      value={selectedTable.section_id || ''}
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

                  <div className="text-xs text-gray-500">
                    <div>Position: {selectedTable.x_pos}, {selectedTable.y_pos}</div>
                    <div>Double-click table to edit name</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}