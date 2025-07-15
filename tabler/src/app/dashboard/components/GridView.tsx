// src/app/app/components/GridView.tsx
import { ViewProps } from '../types/dashboard';

export default function GridView({ layout, sections, tables, partySize }: ViewProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        {layout.name} ({layout.width}×{layout.height})
      </h2>
      
      <div className="mb-4">
        <p className="text-gray-600">
          Looking for table for {partySize} {partySize === 1 ? 'person' : 'people'}
        </p>
      </div>

      {/* Grid will go here */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${layout.width}, 1fr)` }}>
        {/* Grid cells will be rendered here */}
        <p className="col-span-full text-center text-gray-500 py-8">
          Grid view coming soon...
        </p>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {sections.length} sections, {tables.length} tables
      </div>
    </div>
  );
}