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

export interface Section {
  id: string;
  layout_id: string;
  name: string;
  color: string;
  priority_rank: number | null;
}

export interface Table {
  id: string;
  layout_id: string;
  section_id: string | null;
  x_pos: number;
  y_pos: number;
  name: string | null;
  is_taken: boolean;
  current_party_size: number;
}

export interface ViewProps {
  layout: Layout;
  sections: Section[];
  tables: Table[];
  partySize: number;
}