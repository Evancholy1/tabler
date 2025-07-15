// src/app/app/components/TableView.tsx
import { ViewProps } from '../types/dashboard';

export default function TableView({ layout, sections, tables, partySize }: ViewProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Table Overview</h2>
      
      {/* <div className="mb-4">
        <p className="text-gray-600">
          Looking for table for {partySize} {partySize === 1 ? 'person' : 'people'}
        </p>
      </div> */}

      {/* Sections list */}
      {/* T-Chart Layout */}
<div className="border-2 border-white">
  {/* Section Headers Row */}
  <div className="grid border-b-2 border-black" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
    {sections.map(section => (
      <div key={section.id} className="border-r-2 border-black last:border-r-0 p-4 text-center">
        <div className="text-2xl font-bold">{section.name}</div>
      </div>
    ))}
  </div>

  {/* Tables Content Row */}
  <div className="grid min-h-[400px]" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
    {sections.map(section => {
      const sectionTables = tables.filter(table => table.section_id === section.id && table.is_taken === true
    );
      
      return (
        <div key={section.id} className="border-r-2 border-black last:border-r-0 p-4">
          {/* Tables in this section */}
          <div className="space-y-3">
            {sectionTables.map(table => (
              <div 
                key={table.id}
                className="text-center font-bold text-lg py-1"
                style={{ color: section.color }}
              >
                {table.name || table.id.slice(-1)}
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
</div>

      <div className="mt-4 text-sm text-gray-500">
        Total: {sections.length} sections, {tables.length} tables
      </div>
    </div>
  );
}