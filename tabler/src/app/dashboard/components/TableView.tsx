// src/app/app/components/TableView.tsx
import { ViewProps } from '../types/dashboard';

export default function TableView({ layout, sections, tables, partySize }: ViewProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Table Overview</h2>
      
      <div className="mb-4">
        <p className="text-gray-600">
          Looking for table for {partySize} {partySize === 1 ? 'person' : 'people'}
        </p>
      </div>

      {/* Sections list */}
      <div className="space-y-4">
        {sections.map(section => {
          const sectionTables = tables.filter(table => table.section_id === section.id);
          
          return (
            <div key={section.id} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: section.color }}
                />
                <h3 className="font-semibold text-lg">Section {section.name}</h3>
              </div>
              
              <p className="text-gray-600 text-sm">
                {sectionTables.length} tables in this section
              </p>
              
              {/* Tables list for this section */}
              <div className="mt-2 grid grid-cols-4 gap-2">
                {sectionTables.map(table => (
                  <div 
                    key={table.id}
                    className="p-2 border rounded text-center text-sm"
                    style={{ backgroundColor: section.color, opacity: 0.7 }}
                  >
                    {table.name || `T${table.id.slice(-3)}`}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Total: {sections.length} sections, {tables.length} tables
      </div>
    </div>
  );
}