import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          filename: string;
          file_path: string;
          file_type: string;
          file_size: number;
          content: string | null;
          status: 'processing' | 'completed' | 'failed';
          created_at: string;
          updated_at: string;
          metadata: any;
        };
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['documents']['Insert']>;
      };
      document_summaries: {
        Row: {
          id: string;
          document_id: string;
          summary: string;
          summary_type: 'abstractive' | 'extractive';
          confidence: number | null;
          created_at: string;
        };
      };
      legal_entities: {
        Row: {
          id: string;
          document_id: string;
          entity_type: string;
          entity_value: string;
          context: string | null;
          confidence: number | null;
          created_at: string;
        };
      };
      qa_interactions: {
        Row: {
          id: string;
          user_id: string;
          document_id: string | null;
          question: string;
          answer: string;
          confidence: number | null;
          created_at: string;
        };
      };
      document_analytics: {
        Row: {
          id: string;
          document_id: string;
          views: number;
          qa_count: number;
          summary_generated: boolean;
          entities_extracted: boolean;
          last_accessed: string | null;
          updated_at: string;
        };
      };
    };
  };
};
