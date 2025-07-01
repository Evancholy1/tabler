// The function essentially asks: "Is there a table at this grid position? If yes, show the table. If no, show an empty space." 🎯


// // Database: Only contains actual tables
// tables: [
//     { id: 1, x_pos: 2, y_pos: 3, section_id: 'A', name: 'Table 1' },
//     { id: 2, x_pos: 5, y_pos: 7, section_id: 'B', name: 'Window Table' },
//     // Only ~25 records for actual tables
//   ]
  
//   // UI: Grid shows empty cells + table cells
//   const renderCell = (x, y) => {
//     const table = tables.find(t => t.x_pos === x && t.y_pos === y);
//     return table ? <TableCell table={table} /> : <EmptyCell x={x} y={y} />;
//   };