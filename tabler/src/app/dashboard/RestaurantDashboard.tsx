// src/app/app/RestaurantDashboard.tsx
'use client';

import { useState } from 'react';
import { Home, Table as TableIcon } from 'lucide-react';
import GridView from './components/GridView';
import TableView from './components/TableView';
import { Layout, Section, Table } from './types/dashboard';
import { supabase } from '@/lib/supabaseClient';

interface RestaurantDashboardProps {
  layout: Layout;
  sections: Section[];
  tables: Table[];
}

export default function RestaurantDashboard({ 
  layout, 
  sections, 
  tables 
}: RestaurantDashboardProps) {
  
  // State for view mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // State for party size
  const [partySize, setPartySize] = useState(1);

  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTable, setSelectedTable] = useState('');


const selectedSectionData = sections.find(s => s.id === selectedSection);
const sectionDisplayName = selectedSectionData?.name || selectedSection;
const currentCustomers = selectedSectionData?.customers_served || 0;

  const incrementPartySize = () => {
    setPartySize(prev => Math.min(prev + 1, 20)); // Max 20 people
  };

  const decrementPartySize = () => {
    setPartySize(prev => Math.max(prev - 1, 1)); // Min 1 person
  };

  //table filtering function returns a lists of tables based on pareameters/filters
 const getFilteredTables = (filters: {
  sectionId?: string; //returns tables of the same section
  availableOnly?: boolean; //returns available tables
  minCapacity?: number; //returns tables that are large enough 
  excludeSection?: boolean; //do we want to remove some sections? 
 }) => {
  return tables.filter(table => {
    if (filters.sectionId && !filters.excludeSection) { //if these filters are on:
      if (table.current_section !== filters.sectionId) return false;
    }

    //if we want all tables not in that section (for dropdown) 
    if (filters.excludeSection && filters.sectionId) {
      if (table.section_id === filters.sectionId) return false; 
    }

    //availability filter is on
    if (filters.availableOnly && table.is_taken) return false; 

    //table capacity 
    if (filters.minCapacity && (table.capacity || 4) < filters.minCapacity) return false; 

    return true; 
  });
 };


 const getOptimalSection = () => {
  const minCustomers = Math.min(...sections.map(s => s.customers_served));
  const tiedSections = sections.filter(s => s.customers_served === minCustomers); 

  return tiedSections.reduce((best, current) => 
    current.priority_rank < best.priority_rank ? current : best 
  );
};


// Auto-assign logic
const handleAutoAssign = () => {
  try {
    const optimalSection = getOptimalSection();
    
    // Try to find available tables in optimal section
    const availableInSection = getFilteredTables({ 
      sectionId: optimalSection.id, 
      availableOnly: true, 
      minCapacity: partySize 
    });
    
    let selectedTable;
    let assignedSection = optimalSection.id;

    if (availableInSection.length > 0) {
      // Use a table from the optimal section
      selectedTable = availableInSection[0];
    } else {
      // No tables available in optimal section, find any available table
      const allAvailable = getFilteredTables({ 
        availableOnly: true, 
        minCapacity: partySize 
      });
      
      if (allAvailable.length === 0) {
        alert('No tables available for a party of ' + partySize);
        return;
      }
      
      // Use first available table from any section
      selectedTable = allAvailable[0];
      // Keep the optimal section assignment (table will be temporarily moved)
    }

    setSelectedSection(assignedSection);
    setSelectedTable(selectedTable.id);
    setShowAssignPopup(true);

  } catch (error) {
    console.error('Error in auto-assign:', error);
    alert('Error occurred during auto-assignment. Please try again.');
  }
};


const handleSectionChange = (newSectionId: string) => {
  setSelectedSection(newSectionId); 

  const sectionTables = getFilteredTables({sectionId: newSectionId});
  if (sectionTables.length > 0 ) {
    setSelectedTable(sectionTables[0].id);
  }
};


const handleConfirmAssignment = async () => {
  try{
    const table = tables.find(t => t.id === selectedTable); 
  if (!table) {
    alert('Selected table not found');
    return;
  }

  if (table.current_section !== selectedSection) {
    const { error: tableUpdateError } = await supabase
      .from('tables')
      .update({ 
        current_section: selectedSection 
      })
      .eq('id', selectedTable);

    if (tableUpdateError) {
      console.error('Error updating table section:', tableUpdateError);
      alert('Failed to update table section');
      return;
    }
  }

  const { error: tableStatusError } = await supabase
      .from('tables')
      .update({
        is_taken: true,
        current_party_size: partySize,
        assigned_at: new Date().toISOString()
      })
      .eq('id', selectedTable);

    if (tableStatusError) {
      console.error('Error updating table status:', tableStatusError);
      alert('Failed to update table status');
      return;
    }

    const { error: sectionUpdateError } = await supabase
      .from('sections')
      .update({
        customers_served: (sections.find(s => s.id === selectedSection)?.customers_served || 0) + partySize
      })
      .eq('id', selectedSection);

    if (sectionUpdateError) {
      console.error('Error updating section count:', sectionUpdateError);
      alert('Failed to update section customer count');
      return;
    }

    console.log(`Successfully assigned ${partySize} people to table ${selectedTable} in section ${selectedSection}`);
    setShowAssignPopup(false);

    window.location.reload(); 

  } catch (error) {
    console.error('Could not assign properly error:', error);
    alert('an error occured while confirming the assignment');
  }
};

  //update section's customer_served count and table state

//get the dropdown menu options
const getTablesForPopup = (sectionId: string) => {
  const sectionTables = getFilteredTables({ sectionId });
  const otherTables = getFilteredTables({ sectionId, excludeSection: true });
  return { sectionTables, otherTables };
};

return (
  <div className="min-h-screen bg-gray-50">
    {/* Header with view toggle */}
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-center gap-4">
          {/* View Toggle Icons */}
          <button
            onClick={() => setViewMode('grid')}
            className={`
              p-3 rounded-full transition-all
              ${viewMode === 'grid' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }
            `}
          >
            <Home size={24} />
          </button>
          
          <button
            onClick={() => setViewMode('list')}
            className={`
              p-3 rounded-full transition-all
              ${viewMode === 'list' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }
            `}
          >
            <TableIcon size={24} />
          </button>
        </div>
      </div>
    </div>

    {/* Main Content Area */}
    <div className="max-w-6xl mx-auto p-4">
      {viewMode === 'grid' ? (
        <GridView 
          layout={layout}
          sections={sections}
          tables={tables}
          partySize={partySize}
        />
      ) : (
        <TableView 
          layout={layout}
          sections={sections}
          tables={tables}
          partySize={partySize}
        />
      )}
    </div>

    {/* Bottom Controls */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between">
          {/* Party Size Controls */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600">
              Number of People
            </span>
            
            <div className="flex items-center gap-3">
              <button
                onClick={decrementPartySize}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl font-medium">−</span>
              </button>
              
              <div className="w-16 h-10 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white">
                <span className="text-lg font-medium">{partySize}</span>
              </div>
              
              <button
                onClick={incrementPartySize}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl font-medium">+</span>
              </button>
            </div>
          </div>

          {/* Auto Assign Button */}
          <button
            onClick={handleAutoAssign}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            Auto Assign
          </button>
        </div>
      </div>
    </div>

    {/* Assignment Popup */}
    {showAssignPopup && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
          {/* Header */}

          {/* Content */}
          <div className="p-6 space-y-6">
            
            

            {/* Section Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => handleSectionChange(e.target.value)}
                className="w-full p-3 border-2 border-purple-200 rounded-lg bg-white focus:border-purple-400 focus:outline-none"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Table</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full p-3 border-2 border-purple-200 rounded-lg bg-white focus:border-purple-400 focus:outline-none"
              >
                {/* Tables in selected section first */}
                {getTablesForPopup(selectedSection).sectionTables.length > 0 && (
                  <optgroup label={`Section ${selectedSection} Tables`}>
                    {getTablesForPopup(selectedSection).sectionTables.map(table => (
                      <option key={table.id} value={table.id}>
                        {table.name || table.id} 
                      </option>
                    ))}
                  </optgroup>
                )}
                
                {/* Other tables */}
                {getTablesForPopup(selectedSection).otherTables.length > 0 && (
                  <optgroup label="Other Section Tables">
                    {getTablesForPopup(selectedSection).otherTables.map(table => (
                      <option key={table.id} value={table.id}>
                        {table.name || table.id} 
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">People: {partySize}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={decrementPartySize}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  <span className="text-lg font-medium">−</span>
                </button>
                <span className="text-xl font-bold w-8 text-center">{partySize}</span>
                <button
                  onClick={incrementPartySize}
                  className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                >
                  <span className="text-lg font-medium">+</span>
                </button>
              </div>
            </div>

            {/* Assignment Summary */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                      {sectionDisplayName}:{currentCustomers} → {sectionDisplayName}:{currentCustomers + partySize}
                  </div>
                <div className="text-sm text-gray-600">
                  Table {tables.find(t => t.id === selectedTable)?.name || selectedTable} • {partySize} {partySize === 1 ? 'person' : 'people'}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex space-x-4 p-6 bg-gray-50">
            <button
              onClick={() => setShowAssignPopup(false)}
              className="flex-1 bg-red-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAssignment}
              className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-600 transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
}