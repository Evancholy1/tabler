// src/app/app/components/GridView.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Layout, Section, Table, ViewProps } from '../types/dashboard';

export default function GridView({ layout, sections, tables: initialTables, partySize }: ViewProps) {
  // Add safety check - use empty array if initialTables is undefined
  const [tables, setTables] = useState<Table[]>(initialTables || []);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Function to get table at specific position
  const getTableAt = (x: number, y: number): Table | undefined => {
    // Add safety check
    if (!tables || !Array.isArray(tables)) {
      return undefined;
    }
    return tables.find(t => t.x_pos === x && t.y_pos === y);
  };

  // Function to get section color (only show color if taken)
  const getSectionColor = (table: Table): string => {
    // If table is not taken, always return white
    if (!table.is_taken) {
      return '#ffffff';
    }
    
    // If taken and has section, return section color
    if (table.section_id && sections) {
      const section = sections.find(s => s.id === table.section_id);
      return section?.color || '#f3f4f6';
    }
    
    // If taken but no section, return light gray
    return '#f3f4f6';
  };
  //set table status to what it is NOT 
  const toggleTableStatus = async (table: Table) => {
    try {
      const newStatus = !table.is_taken;
      const newPartySize = newStatus ? partySize : 0;
      
      // Update database
      const { error } = await supabase
        .from('tables')
        .update({ 
          is_taken: newStatus,
          current_party_size: newPartySize
        })
        .eq('id', table.id);

      if (error) {
        console.error('Error updating table status:', error);
        return;
      }

      setTables(prevTables =>
        (prevTables || []).map(t =>
          t.id === table.id
            ? { ...t, is_taken: newStatus, current_party_size: newPartySize }
            : t
        )
      );

    } catch (error) {
      console.error('Failed to update table status:', error);
    }
  };


  // Function to render a single grid cell
  const renderCell = (x: number, y: number) => {
    const table = getTableAt(x, y);
    
    if (table) {
      // There's a table at this position
      const displayName = table.name || `T${table.id.slice(-2)}`; 
      const backgroundColor = getSectionColor(table);
      const isSelected = selectedTable?.id === table.id;
      const section = sections?.find(s => s.id === table.section_id);

      return (
        <div
          key={`${x}-${y}`}
          className={`
            w-20 h-20 border-4 border-black flex flex-col items-center justify-center cursor-pointer rounded-lg transition-all
            ${isSelected ? 'border-blue-500 shadow-lg' : ''}
            ${table.is_taken ? 'shadow-md' : ''}
            hover:shadow-md
          `}
          style={{ backgroundColor }}
          onClick={() => {
            setSelectedTable(table);
            

            if (table.is_taken) {
              if (confirm(`Remove customers from ${displayName}?`)) {
                toggleTableStatus(table); 
              }
            }
          }}
        >
          {/* Table Name */}
          <span className="text-base font-bold text-center leading-tight text-black">
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
      // Empty cell - no table here (invisible)
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

  // Add loading state if no data
  if (!layout) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center text-gray-500">Loading layout...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow min-h-screen flex flex-col">
      {/* Main Grid - Flex grow to take available space */}
      <div className="flex-1 flex items-center justify-center">
        <div 
          className="grid gap-3"
          style={{ 
            gridTemplateColumns: `repeat(${layout.width}, 1fr)`,
            // maxWidth: `${layout.width * 68}px` // 64px + 4px gap
            maxWidth: `${layout.width * 88}px` // 80px + 8px gap
          }}
        >
          {renderGrid()}
        </div>
      </div>
  
      {/* Stats - Pinned to bottom */}
      <div className="text-center text-gray-500 text-sm mt-auto">
        {sections?.length || 0} sections, {tables?.length || 0} tables
      </div>
    </div>
  );
}
