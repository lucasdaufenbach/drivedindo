// Types gerados pelo Supabase CLI: npx supabase gen types typescript
// Este arquivo é um placeholder — execute o comando acima para gerar os tipos reais.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
        }
        Update: {
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
        }
      }
      vehicles: {
        Row: {
          id: string
          name: string
          plate: string
          model: string | null
          year: number | null
          color: string | null
          current_km: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          plate: string
          model?: string | null
          year?: number | null
          color?: string | null
          current_km?: number
          created_by: string
        }
        Update: {
          name?: string
          plate?: string
          model?: string | null
          year?: number | null
          color?: string | null
          current_km?: number
        }
      }
      vehicle_users: {
        Row: {
          id: string
          vehicle_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          vehicle_id: string
          user_id: string
          role?: 'owner' | 'member'
          is_active?: boolean
        }
        Update: {
          role?: 'owner' | 'member'
          is_active?: boolean
        }
      }
      trips: {
        Row: {
          id: string
          vehicle_id: string
          user_id: string
          km_start: number
          km_end: number | null
          km_driven: number | null
          started_at: string
          ended_at: string | null
          notes: string | null
          status: 'open' | 'closed'
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          user_id: string
          km_start: number
          km_end?: number | null
          started_at?: string
          notes?: string | null
          status?: 'open' | 'closed'
        }
        Update: {
          km_end?: number | null
          ended_at?: string | null
          notes?: string | null
          status?: 'open' | 'closed'
        }
      }
      expenses: {
        Row: {
          id: string
          vehicle_id: string
          category_id: string | null
          paid_by: string
          amount: number
          description: string | null
          receipt_url: string | null
          expense_date: string
          period_start: string | null
          period_end: string | null
          is_recurrent: boolean
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          category_id?: string | null
          paid_by: string
          amount: number
          description?: string | null
          receipt_url?: string | null
          expense_date?: string
          period_start?: string | null
          period_end?: string | null
          is_recurrent?: boolean
        }
        Update: {
          category_id?: string | null
          amount?: number
          description?: string | null
          receipt_url?: string | null
          expense_date?: string
        }
      }
      expense_participants: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          percentage: number
          amount_owed: number
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          percentage: number
          amount_owed: number
        }
        Update: never
      }
      pending_km: {
        Row: {
          id: string
          vehicle_id: string
          km_start: number
          km_end: number
          km_gap: number
          detected_at: string
          resolved_at: string | null
          resolved_by: string | null
          resolution_type: 'assigned_to_user' | 'split_equally' | 'assigned_to_trip' | 'ignored' | null
          trip_id: string | null
          notes: string | null
          status: 'pending' | 'resolved'
        }
        Insert: {
          id?: string
          vehicle_id: string
          km_start: number
          km_end: number
          resolved_by?: string | null
          resolution_type?: string | null
          trip_id?: string | null
          notes?: string | null
          status?: 'pending' | 'resolved'
        }
        Update: {
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_type?: string | null
          trip_id?: string | null
          notes?: string | null
          status?: 'pending' | 'resolved'
        }
      }
      settlements: {
        Row: {
          id: string
          vehicle_id: string
          paid_by: string
          paid_to: string
          amount: number
          notes: string | null
          settled_at: string
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          paid_by: string
          paid_to: string
          amount: number
          notes?: string | null
          settled_at?: string
        }
        Update: never
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          icon: string | null
          color: string | null
          is_recurrent: boolean
        }
        Insert: {
          id?: string
          name: string
          icon?: string | null
          color?: string | null
          is_recurrent?: boolean
        }
        Update: {
          name?: string
          icon?: string | null
          color?: string | null
          is_recurrent?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      vehicle_role: 'owner' | 'member'
    }
  }
}
