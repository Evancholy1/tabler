// src/app/app/RestaurantDashboard.tsx
'use client';

import { useState } from 'react';
import { LayoutGrid, Grid3x3 } from 'lucide-react';
import GridView from './components/GridView';
import TableView from './components/TableView';
import { Layout, Section, Table } from './types/dashboard';

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

  const incrementPartySize = () => {
    setPartySize(prev => Math.min(prev + 1, 20)); // Max 20 people
  };

  const decrementPartySize = () => {
    setPartySize(prev => Math.max(prev - 1, 1)); // Min 1 person
  };

  const handleAutoAssign = () => {
    // TODO: Implement auto-assignment logic
    console.log(`Auto assigning table for ${partySize} people`);
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
              <LayoutGrid size={24} />
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
              <Grid3x3 size={24} />
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
    </div>
  );
}