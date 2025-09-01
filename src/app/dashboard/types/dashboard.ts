
//types/dashboard

export interface Layout {
  id: string;
  owner_user_id: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  is_setup: boolean; 
  strict_assign: boolean;
}

export interface Section {
  id: string;
  layout_id: string;
  name: string;
  color: string;
  priority_rank: number;
  customers_served: number;
}

export interface Table {
  id: string;
  layout_id: string;
  section_id: string | null;
  current_section: string | null;
  x_pos: number;
  y_pos: number;
  name: string | null;
  is_taken: boolean;
  current_party_size: number;
  assigned_at: string;
  capacity?: number;
}

export interface ViewProps {
  layout: Layout;
  sections: Section[];
  tables: Table[];
  partySize: number;
  user: User; 
  onUpdateTable: (tableId: string, updates: Partial<Table>) => void;
  onCreateServiceHistory?: (tableId: string, sectionId: string, partySize: number) => Promise<string>;
  onCompleteService?: (tableId: string) => Promise<void>;
  onMoveService?: (tableId: string) => Promise<void>; 
  onTriggerAutoAssign?: (preselectedTableId?: string, preselectedSectionId?: string) => void; // Updated signature
  onUpdateSection?: (sectionId: string, updates: Partial<Section>) => void;
}