// // src/app/app/components/TableView.tsx
// import { ViewProps } from '../types/dashboard';

// export default function TableView({ layout, sections, tables, partySize }: ViewProps) {
//   return (
//     <div className="bg-white p-6 rounded-lg shadow">
//       <h2 className="text-xl font-semibold mb-4">Table Overview</h2>

//       {/* Sections list */}
//       {/* T-Chart Layout */}
// <div className="border-2 border-white">
//   {/* Section Headers Row */}
//   <div className="grid border-b-2 border-black" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
//     {sections.map(section => (
//       <div key={section.id} className="border-r-2 border-black last:border-r-0 p-4 text-center">
//         <div className="text-2xl font-bold">{section.name}</div>
//       </div>
//     ))}
//   </div>

//   {/* Tables Content Row */}
//   <div className="grid min-h-[400px]" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
//     {sections.map(section => {
//       const sectionTables = tables.filter(table => table.section_id === section.id && table.is_taken === true
//     );
      
//       return (
//         <div key={section.id} className="border-r-2 border-black last:border-r-0 p-4">
//           {/* Tables in this section */}
//           <div className="space-y-3">
//             {sectionTables.map(table => (
//               <div 
//                 key={table.id}
//                 className="text-center font-bold text-lg py-1"
//                 style={{ color: section.color }}
//               >
//                 {table.name || table.id.slice(-1)} → {table.current_party_size}
//               </div>
//             ))}
//           </div>
//         </div>
//       );
//     })}
//   </div>
// </div>

// {/* Totals Row */}
//         <div className="grid border-t-2 border-black" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
//           {sections.map(section => {
//             // Use the same logic as assignment popup - section.customers_served from database
//             const currentCustomers = section.customers_served = 0;
//             const sectionDisplayName = section.name;
            
//             return (
//               <div key={`total-${section.id}`} className="border-r-2 border-black last:border-r-0 p-4 text-center bg-gray-50">
//                 <div className="text-lg font-bold" style={{ color: section.color }}>
//                   {sectionDisplayName}:{currentCustomers + partySize}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
// );
// }

// src/app/app/components/TableView.tsx
import { ViewProps } from '../types/dashboard';

export default function TableView({ layout, sections, tables, partySize }: ViewProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Table Overview</h2>

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
        <div className="grid min-h-[300px]" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map(section => {
            const sectionTables = tables.filter(table => table.current_section === section.id && table.is_taken === true);
            
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
                      {table.name || table.id.slice(-1)} → {table.current_party_size}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Totals Row - MOVED INSIDE the border div */}
        <div className="grid border-t-2 border-black" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map(section => {
            const currentCustomers = section.customers_served || 0;
            const sectionDisplayName = section.name;
            
            return (
              <div key={`total-${section.id}`} className="border-r-2 border-black last:border-r-0 p-4 text-center">
                <div className="text-lg font-bold" style={{ color: section.color }}>
                  {"Total Cutomers: "}{currentCustomers}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}