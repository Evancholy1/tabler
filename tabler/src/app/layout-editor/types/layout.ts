//typescript interfaces define the shape of object/ structure that is in the database 

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
  
  // Define what a Section object looks like
  export interface Section {
    id: string;
    layout_id: string;
    name: string;
    color: string;
    priority_rank: number | null;
  }
  
  // Define what a Table object looks like
  export interface Table {
    id: string;
    layout_id: string;
    section_id: string | null;  // null means unassigned
    x_pos: number;
    y_pos: number;
    name: string | null;
    is_taken: boolean;
    current_party_size: number;
  }
  
  // Define props for components
  export interface LayoutEditorProps {
    layout: Layout;
    sections: Section[];
    initialTables: Table[];
  }