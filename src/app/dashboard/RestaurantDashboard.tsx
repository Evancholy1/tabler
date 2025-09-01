// src/app/app/RestaurantDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Home, Table as TableIcon } from 'lucide-react';
import GridView from './components/GridView';
import TableView from './components/TableView';
import { Layout, Section, Table, User } from './types/dashboard';
import { supabase } from '@/lib/supabaseClient';

// Service history entry type
interface ServiceHistoryEntry {
  id: string;
  tableId: string;
  tableName: string;
  sectionId: string;
  partySize: number; // Individual party size for this service (not cumulative)
  timestamp: string;
  isActive: boolean;
  status: 'active' | 'completed' | 'moved'; // ADD THIS
}

interface RestaurantDashboardProps {
  layout: Layout;
  sections: Section[];
  tables: Table[];
  user: User; 
}

interface ErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const ErrorModal = ({ isOpen, title, message, onClose }: ErrorModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 p-4 border-b border-red-200">
          <h3 className="text-xl font-semibold text-red-900">{title}</h3>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Warning Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 19c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            {/* Message */}
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RestaurantDashboard({ 
  layout, 
  sections: initialSections, 
  tables: initialTables,
  user
}: RestaurantDashboardProps) {
  
  // Move tables and sections to local state
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [sections, setSections] = useState<Section[]>(initialSections);
  
  // Service history state
  const [serviceHistory, setServiceHistory] = useState<ServiceHistoryEntry[]>([]);
  
  // State for view mode
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // State for party size
  const [partySize, setPartySize] = useState(1);

  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTable, setSelectedTable] = useState('');


  const [nextPersonInfo, setNextPersonInfo] = useState <{
    sectionName: string;
    sectionColor: string;
  } | null >(null);
  
  useEffect(() => {

  const optimalSection = getOptimalSection();

  if (optimalSection) {
    setNextPersonInfo({
      sectionName: optimalSection.name,
      sectionColor: optimalSection.color 
    });
  } else {
    setNextPersonInfo(null);
  }

}, [sections, partySize]);

  const [isAssigning, setIsAssigning] = useState(false);
  const selectedSectionData = sections.find(s => s.id === selectedSection);
  const sectionDisplayName = selectedSectionData?.name || selectedSection;
  const currentCustomers = selectedSectionData?.customers_served || 0;


  // Load service history on component mount
  useEffect(() => {
    loadServiceHistory();
  }, []);

  // Function to load service history from database
  const loadServiceHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('service_history')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error loading service history:', error);
        return;
      }

      // Convert database format to component format
      const formattedHistory: ServiceHistoryEntry[] = data.map(entry => ({
        id: entry.id,
        tableId: entry.table_id,
        tableName: entry.table_name,
        sectionId: entry.section_id,
        partySize: entry.party_size,
        timestamp: entry.timestamp,
        isActive: entry.is_active,
        status: entry.status || (entry.is_active ? 'active' : 'completed') // Handle existing data
      }));

      setServiceHistory(formattedHistory);
      console.log(`Loaded ${formattedHistory.length} service history entries`);
    } catch (error) {
      console.error('Failed to load service history:', error);
    }
  };

  useEffect(() => {
  if (viewMode === 'list') {
    setTimeout(() => {
      window.scrollTo({
        top: window.innerHeight * 0.15,
        behavior: 'smooth'
      });
    }, 100);
  }
}, [viewMode]);

  // Function to create new service history entry (individual instances)
  const addServiceHistoryEntry = async (tableId: string, sectionId: string, partySize: number) => {
    const table = tables.find(t => t.id === tableId);
    
    const newEntryId = `${tableId}-${Date.now()}`;
    const newEntry: ServiceHistoryEntry = {
      id: newEntryId,
      tableId,
      tableName: table?.name || table?.id.slice(-2) || '',
      sectionId,
      partySize,
      timestamp: new Date().toISOString(),
      isActive: true,
      status: 'active'
    };

    try {
      // Save to database
      const { error } = await supabase
        .from('service_history')
        .insert({
          id: newEntry.id,
          table_id: newEntry.tableId,
          table_name: newEntry.tableName,
          section_id: newEntry.sectionId,
          party_size: newEntry.partySize,
          timestamp: newEntry.timestamp,
          is_active: newEntry.isActive,
          status: newEntry.status
        });

      if (error) {
        console.error('Error saving service history:', error);
        alert('Failed to save service history');
        return newEntry.id;
      }

      // Update local state
      setServiceHistory(prev => [...prev, newEntry]);
      console.log(`Added service history entry: ${newEntry.tableName} → ${newEntry.partySize}`);
      return newEntry.id;
    } catch (error) {
      console.error('Failed to add service history entry:', error);
      return newEntry.id;
    }
  };

  // Function to mark service as completed (customers left)
  const completeService = async (tableId: string) => {
    try {
      const table = tables.find(t => t.id === tableId);
      const isUnassignedTable = table?.section_id === null;

      console.log(`Completing service for ${isUnassignedTable ? 'overflow' : 'section'} table ${tableId}`);

      // Update database - mark as completed
      const updateData: any = { 
        is_taken: false,
        current_party_size: 0
      };

      // If it's an unassigned table, reset current_section to null
      if (isUnassignedTable) {
        updateData.current_section = null;
      }

      const { error } = await supabase
        .from('tables')
        .update(updateData)
        .eq('id', tableId);

      if (error) {
        console.error('Error completing service:', error);
        return;
      }

      // Update service history
      const { error: historyError } = await supabase
        .from('service_history')
        .update({ 
          is_active: false,
          status: 'completed'
        })
        .eq('table_id', tableId)
        .eq('is_active', true);

      if (historyError) {
        console.error('Error completing service history:', historyError);
        return;
      }

      // Update local state WITHOUT calling updateTable to prevent loop
      setTables(prevTables =>
        prevTables.map(t =>
          t.id === tableId ? { 
            ...t, 
            is_taken: false,
            current_party_size: 0,
            current_section: isUnassignedTable ? null : t.current_section
          } : t
        )
      );

      setServiceHistory(prev => 
        prev.map(entry => 
          entry.tableId === tableId && entry.isActive
            ? { ...entry, isActive: false, status: 'completed' as const }
            : entry
        )
      );

      const tableType = isUnassignedTable ? 'overflow table' : 'section table';
      console.log(`Completed service for ${tableType} ${tableId}`);
    } catch (error) {
      console.error('Failed to complete service:', error);
    }
  };

  // NEW: Function to mark service as moved (for customer moves)
  const moveService = async (tableId: string) => {
    try {
      // Update database - mark as moved
      const { error } = await supabase
        .from('service_history')
        .update({ 
          is_active: false,
          status: 'moved'
        })
        .eq('table_id', tableId)
        .eq('is_active', true);

      if (error) {
        console.error('Error marking service as moved:', error);
        return;
      }

      // Update local state
      setServiceHistory(prev => 
        prev.map(entry => 
          entry.tableId === tableId && entry.isActive
            ? { ...entry, isActive: false, status: 'moved' as const }
            : entry
        )
      );
      console.log(`Marked service as moved for table ${tableId}`);
    } catch (error) {
      console.error('Failed to mark service as moved:', error);
    }
  };

  // Updated updateServiceHistory function to persist changes
  const updateServiceHistory = async (updatedServiceHistory: ServiceHistoryEntry[]) => {
    // Find what changed by comparing with current state
    const currentEntry = serviceHistory.find(entry => {
      const updatedEntry = updatedServiceHistory.find(updated => updated.id === entry.id);
      return updatedEntry && (
        updatedEntry.tableName !== entry.tableName || 
        updatedEntry.partySize !== entry.partySize
      );
    });

    if (currentEntry) {
      const updatedEntry = updatedServiceHistory.find(entry => entry.id === currentEntry.id);
      if (updatedEntry) {
        try {
          // Update database
          const { error } = await supabase
            .from('service_history')
            .update({
              table_name: updatedEntry.tableName,
              party_size: updatedEntry.partySize
            })
            .eq('id', updatedEntry.id);

          if (error) {
            console.error('Error updating service history:', error);
            alert('Failed to update service history');
            return;
          }

          console.log(`Updated service history: ${currentEntry.tableName} → ${updatedEntry.tableName}, ${currentEntry.partySize} → ${updatedEntry.partySize}`);
        } catch (error) {
          console.error('Failed to update service history:', error);
          alert('An error occurred while updating service history');
          return;
        }
      }
    }

    // Update local state
    setServiceHistory(updatedServiceHistory);
  };

  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  const showError = (title: string, message: string) => {
    setErrorModal({ isOpen: true, title, message });
  };

  // Table update function for child components
  const updateTable = (tableId: string, updates: Partial<Table>) => {
    setTables(prevTables =>
      prevTables.map(t =>
        t.id === tableId ? { ...t, ...updates } : t
      )
    );


    
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(prevSections =>
      prevSections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      )
    );
  };

  const incrementPartySize = () => {
    setPartySize(prev => Math.min(prev + 1, 20)); // Max 20 people
  };

  const decrementPartySize = () => {
    setPartySize(prev => Math.max(prev - 1, 1)); // Min 1 person
  };

  // Updated table filtering function
  const getFilteredTables = (filters: {
    sectionId?: string; // returns tables of the same section
    availableOnly?: boolean; // returns available tables
    minCapacity?: number; // returns tables that are large enough 
    excludeSection?: boolean; // do we want to remove some sections? 
  }) => {
    return tables.filter(table => {
      if (filters.sectionId && !filters.excludeSection) {
        // Check against section_id (table's home section), not current_section
        if (table.section_id !== filters.sectionId) return false;
      }

      // if we want all tables not in that section (for dropdown) 
      if (filters.excludeSection && filters.sectionId) {
        if (table.section_id === filters.sectionId) return false; 
      }

      // availability filter is on
      if (filters.availableOnly && table.is_taken) return false; 

      // table capacity 
      if (filters.minCapacity && (table.capacity || 4) < filters.minCapacity) return false; 

      return true; 
    });
  };

  // Helper function to get available tables by category
  const getAvailableTablesByCategory = () => {
    const sectionTables = getFilteredTables({ 
      availableOnly: true, 
      minCapacity: partySize 
    }).filter(table => table.section_id !== null); // Tables that belong to sections

    const unassignedTables = getFilteredTables({ 
      availableOnly: true, 
      minCapacity: partySize 
    }).filter(table => table.section_id === null); // Unassigned overflow tables

    return { sectionTables, unassignedTables };
  };

  const getOptimalSection = () => {
    const minCustomers = Math.min(...sections.map(s => s.customers_served || 0));
    const tiedSections = sections.filter(s => (s.customers_served || 0) === minCustomers); 

    return tiedSections.reduce((best, current) => 
      current.priority_rank < best.priority_rank ? current : best 
    );
  };

  // Updated auto-assign logic prioritizes tables near entrance and to the right specific to pho cafe 
  const handleAutoAssign = () => {
    try {
      const { sectionTables, unassignedTables } = getAvailableTablesByCategory();
      
      // First, try to assign to section tables
      if (sectionTables.length > 0) {
        const optimalSection = getOptimalSection();
        
        // Helper function to sort tables by priority: right first (high x), then front (low y)
        const sortTablesByPriority = (tables: Table[]) => {
          return tables.sort((a, b) => {
            // First priority: higher x_pos (more to the right)
            if (a.x_pos !== b.x_pos) {
              return b.x_pos - a.x_pos;
            }
            // Second priority: lower y_pos (closer to front)
            return a.y_pos - b.y_pos;
          });
        };

        // Enhanced sorting that prioritizes section optimality first
        const sortTablesBySectionThenPosition = (tables: Table[]) => {
          return tables.sort((a, b) => {
            // First priority: is the table in the optimal section?
            const aInOptimal = a.section_id === optimalSection.id;
            const bInOptimal = b.section_id === optimalSection.id;
            
            if (aInOptimal !== bInOptimal) {
              return bInOptimal ? 1 : -1; // Optimal section tables come first
            }
            
            // If both are in same section type (optimal or not), sort by position
            // Higher x_pos first
            if (a.x_pos !== b.x_pos) {
              return b.x_pos - a.x_pos;
            }
            // Then lower y_pos
            return a.y_pos - b.y_pos;
          });
        };
        
        // Try to find available tables that BELONG to the optimal section
        const availableInSection = sectionTables.filter(table => table.section_id === optimalSection.id);
        
        let selectedTable;
        let assignedSection = optimalSection.id;

        if (availableInSection.length > 0) {
          // Sort by priority and use the best positioned table in optimal section
          const prioritizedTables = sortTablesByPriority(availableInSection);
          selectedTable = prioritizedTables[0];
        } else {
          // No tables available in optimal section, find any available section table
          // Use section-aware sorting
          const prioritizedTables = sortTablesBySectionThenPosition(sectionTables);
          selectedTable = prioritizedTables[0];
          // Keep the optimal section assignment (table will be temporarily moved)
        }

        setSelectedSection(assignedSection);
        setSelectedTable(selectedTable.id);
        setShowAssignPopup(true);

      } else if (unassignedTables.length > 0) {
        // All section tables are full, use unassigned tables
        const optimalSection = getOptimalSection();
        
        // Sort unassigned tables by position
        const sortedUnassignedTables = unassignedTables.sort((a, b) => {
          if (a.x_pos !== b.x_pos) {
            return b.x_pos - a.x_pos;
          }
          return a.y_pos - b.y_pos;
        });
        
        const selectedTable = sortedUnassignedTables[0];
        
        // Assign to optimal section (the table will temporarily take on this section)
        setSelectedSection(optimalSection.id);
        setSelectedTable(selectedTable.id);
        setShowAssignPopup(true);

      } else {
        // No tables available at all
        showError(
          'No Tables Available',
          `All tables are currently occupied. No tables are available for a party of ${partySize} ${partySize === 1 ? 'person' : 'people'}.`
        );
        return;
      }

    } catch (error) {
      console.error('Error in auto-assign:', error);
      showError('Assignment Error', 'An error occurred during auto-assignment. Please try again.');
    }
  };

   const handleTriggerAutoAssignFromGrid = (preselectedTableId?: string, preselectedSectionId?: string) => {
    let targetSectionId: string;
    
    if (preselectedSectionId) {
      // Strict assign mode - use the provided section ID
      targetSectionId = preselectedSectionId;
    } else {
      // Normal mode - use optimal section
      const optimalSection = getOptimalSection();
      targetSectionId = optimalSection.id;
    }
    
    setSelectedSection(targetSectionId);
    
    if (preselectedTableId) {
      setSelectedTable(preselectedTableId);
    } else {
      // Find first available table in target section
      const availableInSection = getFilteredTables({ 
        sectionId: targetSectionId, 
        availableOnly: true, 
        minCapacity: partySize 
      });
      
      if (availableInSection.length > 0) {
        setSelectedTable(availableInSection[0].id);
      }
    }
    
    setShowAssignPopup(true);
  };

  const handleSectionChange = (newSectionId: string) => {
    setSelectedSection(newSectionId); 
  };

  // Updated getTablesForPopup to include unassigned tables
  const getTablesForPopup = (sectionId: string) => {
    const sectionTables = getFilteredTables({ sectionId });
    const otherSectionTables = getFilteredTables({ sectionId, excludeSection: true }).filter(table => table.section_id !== null);
    const unassignedTables = getFilteredTables({}).filter(table => table.section_id === null);
    
    return { sectionTables, otherSectionTables, unassignedTables };
  };

  // Updated handleConfirmAssignment to handle unassigned tables
  const handleConfirmAssignment = async () => {
  if (isAssigning) {
    console.log('Assignment already in progress, ignoring click');
    return;
  }

  try {
    setIsAssigning(true);
    const table = tables.find(t => t.id === selectedTable); 
    if (!table) {
      alert('Selected table not found');
      return;
    }

    const tableCapacity = table.capacity || 4;
    if(partySize > tableCapacity) {
      showError(
        'Table Capacity Exceeded',
        `This table can only seat ${tableCapacity} ${tableCapacity === 1 ? 'person' : 'people'}, but you're trying to assign ${partySize} ${partySize === 1 ? 'person' : 'people'}. Please select a larger table or reduce the party size.`
      );
      return; 
    }

    if (table.is_taken) {
      showError(
        'Table Already Occupied',
        `This table is currently occupied by ${table.current_party_size} ${table.current_party_size === 1 ? 'person' : 'people'}. Please select an available table or wait for this table to become free.`
      );
      return;
    }

    // Prepare update data
    const updateData = {
      is_taken: true,
      current_party_size: partySize,
      current_section: selectedSection,
      assigned_at: new Date().toISOString()
    };

    console.log('Starting assignment:', {
      tableId: selectedTable,
      tableName: table.name,
      updateData,
      sectionId: selectedSection
    });

    // 1. Update table in database
    const { error: tableStatusError } = await supabase
      .from('tables')
      .update(updateData)
      .eq('id', selectedTable);

    if (tableStatusError) {
      console.error('Error updating table status:', tableStatusError);
      throw new Error(`Failed to update table: ${tableStatusError.message}`);
    }

    // 2. Update table locally immediately (for your own UI)
    updateTable(selectedTable, updateData);
    console.log(' Table updated locally');

    // 3. Create service history
    await addServiceHistoryEntry(selectedTable, selectedSection, partySize);
    console.log(' Service history created');

    // 4. Update section customer count in database
    const currentSectionCustomers = sections.find(s => s.id === selectedSection)?.customers_served || 0;
    const newSectionCustomers = currentSectionCustomers + partySize;

    const { error: sectionUpdateError } = await supabase
      .from('sections')
      .update({
        customers_served: newSectionCustomers
      })
      .eq('id', selectedSection);

    if (sectionUpdateError) {
      console.error('Error updating section count:', sectionUpdateError);
      throw new Error(`Failed to update section: ${sectionUpdateError.message}`);
    }

    // 5. Update section locally immediately
    setSections(prevSections =>
      prevSections.map(s =>
        s.id === selectedSection
          ? { ...s, customers_served: newSectionCustomers }
          : s
      )
    );
    console.log(' Section updated locally');

    // 6. Success - close popup and reset
    const tableType = table.section_id ? 'section table' : 'overflow table';
    console.log(`🎉 Successfully assigned ${partySize} people to ${tableType} ${selectedTable} in section ${selectedSection}`);
    setViewMode('grid');
    setShowAssignPopup(false);
    setPartySize(1);

  } catch (error) {
    console.error(' Assignment failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    alert('Assignment failed: ' + errorMessage);
  } finally {
    setIsAssigning(false);
  }
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
                p-4 rounded-full transition-all
                ${viewMode === 'grid' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }
              `}
            >
              <Home size={28} />
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`
                p-4 rounded-full transition-all
                ${viewMode === 'list' 
                  ? 'bg-gray-800 text-white' 
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }
              `}
            >
              <TableIcon size={28} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content-area flex-1 flex flex-col items-center justify-center p-4 pb-24">
        {viewMode === 'grid' ? (
          <>
           {/* Next Person Indicator */}
          {nextPersonInfo && (
             <div 
              className="text-white p-4 rounded-lg shadow-lg mb-4 max-w-[90vw] border-3 border-black animate-pulse-opacity"
              style={{ 
               background: `linear-gradient(to right, ${nextPersonInfo.sectionColor || '#3b82f6'}, ${nextPersonInfo.sectionColor || '#2563eb'})` 
              }}
            >
              <div className="text-center">
                <div className="text-xl font-bold">{nextPersonInfo.sectionName}'s turn</div>
              </div>
            </div>
          )}
          <GridView 
            user = {user}
            layout={layout}
            sections={sections}
            tables={tables}
            partySize={partySize}
            onUpdateTable={updateTable}
            onCreateServiceHistory={addServiceHistoryEntry}
            onCompleteService={completeService}
            onMoveService={moveService}
            onTriggerAutoAssign={handleTriggerAutoAssignFromGrid}
            onUpdateSection={updateSection}
          />
          </>
        ) : (
          <TableView 
            layout={layout}
            sections={sections}
            tables={tables}
            partySize={partySize}
            user={user} // Add this line
            onUpdateTable={updateTable}
            onUpdateSection={updateSection}
            serviceHistory={serviceHistory}
            onUpdateServiceHistory={updateServiceHistory}
          />
        )}
      </div>

      {/* Bottom Controls - Fixed height footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg h-20">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Party Size Controls */}
          <div className="flex items-center gap-6">
            <span className="text-lg font-semibold text-gray-700">
              Number of People
            </span>
            
            <div className="flex items-center gap-3">
              <button
                onClick={decrementPartySize}
                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl font-bold">−</span>
              </button>
              
              <div className="w-16 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white">
                <span className="text-xl font-bold">{partySize}</span>
              </div>
              
              <button
                onClick={incrementPartySize}
                className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>
          </div>

          {/* Auto Assign Button */}
          <button
            onClick={handleAutoAssign}
            className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold text-lg transition-colors"
          >
            Auto Assign
          </button>
        </div>
      </div>

      {/* Assignment Popup */}
      {showAssignPopup && (
        <div className="fixed inset-0 backdrop-brightness-75 backdrop-opacity-600 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full mx-8 overflow-hidden">
            {/* Content */}
            <div className="p-8 space-y-8">
              {/* Section Dropdown */}
              <div>
                <label className="block text-2xl font-bold text-gray-700 mb-4">Section</label>
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
                <label className="block text-2xl font-bold text-gray-700 mb-4">Table</label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full p-6 border-4 border-purple-200 rounded-2xl bg-white focus:border-purple-400 focus:outline-none text-2xl"
                >
                  {/* Tables in selected section first */}
                  {getTablesForPopup(selectedSection).sectionTables.length > 0 && (
                   <optgroup label={`${sections.find(s => s.id === selectedSection)?.name || selectedSection}'s Tables`}>
                      {getTablesForPopup(selectedSection).sectionTables.map(table => (
                        <option key={table.id} value={table.id}>
                          {table.name || table.id} 
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* Other section tables */}
                  {getTablesForPopup(selectedSection).otherSectionTables.length > 0 && (
                    <optgroup label="Other Section Tables">
                      {getTablesForPopup(selectedSection).otherSectionTables.map(table => (
                        <option key={table.id} value={table.id}>
                          {table.name || table.id} ({sections.find(s => s.id === table.section_id)?.name})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* Unassigned overflow tables */}
                  {getTablesForPopup(selectedSection).unassignedTables.length > 0 && (
                    <optgroup label="🚨 Overflow Tables (All sections full)">
                      {getTablesForPopup(selectedSection).unassignedTables.map(table => (
                        <option key={table.id} value={table.id}>
                          {table.name || table.id} (Overflow)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-2xl text-gray-600">People: {partySize}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={decrementPartySize}
                    className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    <span className="text-3xl font-bold">−</span>
                  </button>
                  <span className="text-4xl font-bold w-16 text-center">{partySize}</span>
                  <button
                    onClick={incrementPartySize}
                    className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                  >
                    <span className="text-3xl font-bold">+</span>
                  </button>
                </div>
              </div>

              {/* Assignment Summary */}
              <div className="bg-green-50 p-8 rounded-2xl">
                <div className="text-center">
                  <div className="text-6xl font-bold text-black-600 mb-4">
                      {tables.find(t => t.id === selectedTable)?.name || selectedTable} 
                    </div>
                    {/* Show if it's an overflow table */}
                    {tables.find(t => t.id === selectedTable)?.section_id === null && (
                      <div className="text-2xl font-bold text-orange-600 mb-2">
                        🚨 OVERFLOW TABLE
                      </div>
                    )}
                    <div className="text-4xl font-bold text-green-600 mb-4">
                        {sectionDisplayName}:{currentCustomers} → {sectionDisplayName}:{currentCustomers + partySize}
                    </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex space-x-6 p-8 bg-gray-50">
              <button
                onClick={() => setShowAssignPopup(false)}
                className="flex-1 bg-red-500 text-white py-6 px-8 rounded-2xl font-bold text-2xl hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                className="flex-1 bg-green-500 text-white py-6 px-8 rounded-2xl font-bold text-2xl hover:bg-green-600 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      <ErrorModal
        isOpen={errorModal.isOpen}
        title={errorModal.title}
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
      />
    </div>
  );
}