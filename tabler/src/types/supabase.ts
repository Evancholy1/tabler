// src/types/supabase.ts

/**
 * A helper type for any JSON columns (if you add them in the future).
 */
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

/**
 * This is your “Database” interface. Supabase‐provided helpers (e.g. 
 * createServerComponentSupabaseClient<Database>) will use this to type‐check
 * your queries against the actual columns in “users.”
 */
export interface Database {
  public: {
    Tables: {
      users: {
        /** 
         * “Row” describes the shape returned by SELECT queries 
         * (one row in the “users” table).
         */
        Row: {
          id: number;                // int4
          email: string;             // text
          password_hash: string;     // text
          created_at: string;        // timestamp with time zone (returned as ISO string)
          updated_at: string;        // timestamp with time zone (returned as ISO string)
          is_setup: boolean;         // bool
        };
        /**
         * “Insert” describes which fields are required / optional
         * when you do .insert() into “users.”
         * • id is usually SERIAL (auto‐increment), so we don’t include it here.
         * • created_at / updated_at default to now(), so they can be omitted.
         * • email + password_hash + is_setup should be provided.
         */
        Insert: {
          email: string;
          password_hash: string;
          is_setup?: boolean;       // optional (defaults to false if your DB is set that way)
          created_at?: string;      // optional (will default to now())
          updated_at?: string;      // optional (will default to now())
          // id is auto‐generated, so we omit it here.
        };
        /**
         * “Update” describes which fields you can send in .update().
         * All columns are optional, and “id” is generally used in the .eq() clause.
         */
        Update: {
          email?: string;
          password_hash?: string;
          is_setup?: boolean;
          created_at?: string;
          updated_at?: string;
          id?: number;
        };
      };
      // If you add more tables later (e.g. “profiles”, “sections”, “tables”), define them here:
      // profiles: { Row: { … }, Insert: { … }, Update: { … } }
      // sections: { Row: { … }, Insert: { … }, Update: { … } }
      // tables: { Row: { … }, Insert: { … }, Update: { … } }
    };
    Views: {
      /** no views defined yet */
      [_ in never]: never;
    };
    Functions: {
      /** no Postgres functions defined yet */
      [_ in never]: never;
    };
    Enums: {
      /** no enum types defined yet */
      [_ in never]: never;
    };
    CompositeTypes: {
      /** no composite types defined yet */
      [_ in never]: never;
    };
  };
}
