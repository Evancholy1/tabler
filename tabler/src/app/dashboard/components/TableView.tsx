// src/app/app/components/TableView.tsx
import { ViewProps } from '../types/dashboard';

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

export default function TableView({ layout, sections, tables, partySize, serviceHistory }: ViewProps & { serviceHistory: ServiceHistoryEntry[] }) {
  
  // Get optimal section function (same logic as in RestaurantDashboard)
  const getOptimalSection = () => {
    const minCustomers = Math.min(...sections.map(s => s.customers_served || 0));
    const tiedSections = sections.filter(s => (s.customers_served || 0) === minCustomers); 

    return tiedSections.reduce((best, current) => 
      current.priority_rank < best.priority_rank ? current : best 
    );
  };

  const optimalSection = getOptimalSection();

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Service History</h2>

      {/* T-Chart Layout */}
      <div className="border-2 border-white h-[500px] flex flex-col">
        {/* Section Headers Row */}
        <div className="grid border-b-2 border-black flex-shrink-0" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map(section => (
            <div key={section.id} className="border-r-2 border-black last:border-r-0 p-4 text-center">
              <div className="text-2xl font-bold">{section.name}</div>
            </div>
          ))}
        </div>

        {/* Tables Content Row - Scrollable */}
        <div className="grid flex-1 overflow-hidden" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map(section => {
            // Get all service history entries for this section, sorted by timestamp
            const sectionServices = serviceHistory
              .filter(service => service.sectionId === section.id)
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            return (
              <div key={section.id} className="border-r-2 border-black last:border-r-0 p-4 flex flex-col overflow-hidden">
                {/* Scrollable container for service instances */}
                <div className="flex-1 overflow-y-auto space-y-2">
                  {sectionServices.length === 0 ? (
                    <div className="text-center text-gray-400 text-lg py-8">
                      No services yet
                    </div>
                  ) : (
                    sectionServices.map(service => (
                      <div 
                        key={service.id}
                        className="text-center font-bold text-xl py-2 px-2 rounded flex-shrink-0 bg-white"
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

        {/* Totals Row - Highlight optimal section */}
        <div className="grid border-t-2 border-black flex-shrink-0" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map(section => {
            const currentCustomers = section.customers_served || 0;
            const isOptimal = section.id === optimalSection.id;
            
            return (
              <div key={`total-${section.id}`} className={`border-r-2 border-black last:border-r-0 p-4 text-center ${
                isOptimal ? 'bg-yellow-300 animate-pulse' : ''
              }`}>
                <div className={`text-2xl font-bold ${isOptimal ? 'text-black' : ''}`} style={{ color: isOptimal ? 'black' : section.color }}>
                  {currentCustomers}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}