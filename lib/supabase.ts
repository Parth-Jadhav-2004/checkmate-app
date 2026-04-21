import { createClient } from '@supabase/supabase-js';

// Supabase client for client-side operations (browser)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing from environment variables');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client
// This will only work in API routes and server components
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing');
  }
  
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
  }
  
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      syllabus: {
        Row: {
          id: string;
          course_name: string;
          course_code: string;
          semester: string;
          file_name: string;
          file_path: string;
          file_url: string | null;
          file_size: number;
          file_type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_name: string;
          course_code: string;
          semester: string;
          file_name: string;
          file_path: string;
          file_url?: string | null;
          file_size: number;
          file_type: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_name?: string;
          course_code?: string;
          semester?: string;
          file_name?: string;
          file_path?: string;
          file_url?: string | null;
          file_size?: number;
          file_type?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type Syllabus = Database['public']['Tables']['syllabus']['Row'];
export type SyllabusInsert = Database['public']['Tables']['syllabus']['Insert'];
export type SyllabusUpdate = Database['public']['Tables']['syllabus']['Update'];

// Question Paper types
export type QuestionPaper = {
  id: string;
  syllabus_id: string;
  title: string;
  exam_date: string | null;
  total_marks: number | null;
  file_name: string;
  file_path: string;
  file_url: string | null;
  file_size: number;
  file_type: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type Question = {
  id: string;
  question_paper_id: string;
  question_number: string;
  question_text: string;
  marks: number;
  question_type: string | null;
  created_at: string;
  updated_at: string;
};

export type IdealAnswer = {
  id: string;
  question_id: string;
  answer_text: string;
  key_points: string[] | null;
  generated_by: string;
  is_approved: boolean;
  teacher_edited: boolean;
  created_at: string;
  updated_at: string;
};
