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
              .filter(service => service.sectionId === section.id)
              .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            return (
              <div key={section.id} className="border-r-2 border-black last:border-r-0 flex flex-col min-h-0">
                {/* Scrollable container for service instances - This is the key fix */}
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

        {/* Totals Row - Fixed height */}
        <div className="grid border-t-2 border-black flex-shrink-0 h-20" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map(section => {
            const currentCustomers = section.customers_served || 0;
            const isOptimal = section.id === optimalSection.id;
            
            return (
              <div key={`total-${section.id}`} className={`border-r-2 border-black last:border-r-0 flex items-center justify-center ${
                isOptimal ? 'bg-yellow-300 animate-pulse' : ''
              }`}>
                <div className={`text-4xl font-bold ${isOptimal ? 'text-black' : ''}`} style={{ color: isOptimal ? 'black' : section.color }}>
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