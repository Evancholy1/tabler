// src/app/app/components/TableView.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ViewProps, Section } from '../types/dashboard';

// Use the same interface as RestaurantDashboard
interface ServiceHistoryEntry {
  id: string;
  tableId: string;
  tableName: string;
  sectionId: string;
  partySize: number;
  timestamp: string;
  isActive: boolean;
}

interface EditCustomerCountModalProps {
  isOpen: boolean;
  section: { id: string; name: string; customers_served: number; color: string } | null;
  onConfirm: (newCount: number) => void;
  onCancel: () => void;
}

const EditCustomerCountModal = ({ isOpen, section, onConfirm, onCancel }: EditCustomerCountModalProps) => {
  const [inputValue, setInputValue] = useState('');

  // Update input value when section changes
  useState(() => {
    if (section) {
      setInputValue(section.customers_served.toString());
    }
  });

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              Number of Customers Served
            </label>
            
            {/* Counter Controls */}
            <div className="flex items-center justify-center space-x-4">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-12 h-12 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xl font-bold transition-colors"
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

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-600">
              Current: <span className="font-bold">{section.customers_served}</span> → 
              New: <span className="font-bold" style={{ color: section.color }}>{inputValue || '0'}</span>
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
              className="flex-1 text-white py-3 px-6 rounded-lg font-medium transition-colors"
              style={{ backgroundColor: section.color }}
            >
              Update Count
            </button>
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
}

export default function TableView({ 
  layout, 
  sections, 
  tables, 
  partySize, 
  onUpdateTable, 
  serviceHistory,
  onUpdateSection 
}: ExtendedTableViewProps) {
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    section: { id: string; name: string; customers_served: number; color: string } | null;
  }>({ isOpen: false, section: null });

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

      console.log(`Updated section ${editModal.section.name} customer count to ${newCount}`);
      
      // Close modal
      handleCloseModal();
      
    } catch (error) {
      console.error('Failed to update customer count:', error);
      alert('An error occurred while updating customer count');
    }
  };

  const handleCloseModal = () => {
    setEditModal({ isOpen: false, section: null });
  };

  const optimalSection = getOptimalSection();

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
              // Get all service history entries for this section, sorted by timestamp
              const sectionServices = serviceHistory
                ?.filter(service => service.sectionId === section.id)
                .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || [];
              
              return (
                <div key={section.id} className="border-r-2 border-black last:border-r-0 flex flex-col min-h-0">
                  {/* Scrollable container for service instances */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                    {sectionServices.length === 0 ? (
                      <div className="text-center text-gray-400 text-2xl py-12">
                        No services yet
                      </div>
                    ) : (
                      sectionServices.map(service => (
                        <div 
                          key={service.id}
                          className="text-center font-bold text-3xl py-3 px-3 rounded flex-shrink-0 bg-white"
                          style={{ color: section.color }}
                          title={`${service.isActive ? 'Currently serving' : 'Service completed'} at ${new Date(service.timestamp).toLocaleTimeString()}. Party size: ${service.partySize} customers.`}
                        >
                          {service.tableName} → {service.partySize}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals Row - Fixed height - NOW CLICKABLE */}
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
    </>
  );
}