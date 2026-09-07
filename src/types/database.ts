export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          currency: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          account_type: 'BANK' | 'CASH' | 'CREDIT_CARD' | 'BROKERAGE' | 'INVESTMENT' | 'OTHER'
          institution: string | null
          opening_balance: number
          current_balance: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['accounts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['accounts']['Insert']>
      }
      income_sources: {
        Row: {
          id: string
          user_id: string
          name: string
          income_type: 'SALARY' | 'BUSINESS' | 'STOCK_MARKET' | 'INVESTMENT' | 'FREELANCE' | 'OTHER'
          description: string | null
          is_recurring: boolean
          expected_amount: number
          frequency: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['income_sources']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['income_sources']['Insert']>
      }
      income_records: {
        Row: {
          id: string
          user_id: string
          income_source_id: string
          account_id: string | null
          amount: number
          income_date: string
          month: string
          description: string | null
          status: 'EXPECTED' | 'RECEIVED' | 'CANCELLED'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['income_records']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['income_records']['Insert']>
      }
      fixed_obligations: {
        Row: {
          id: string
          user_id: string
          name: string
          category: 'EMI' | 'CREDIT_CARD' | 'RENT' | 'INSURANCE' | 'SUBSCRIPTION' | 'UTILITY' | 'OTHER'
          provider: string | null
          account_id: string | null
          original_amount: number | null
          current_amount: number
          frequency: string
          due_day: number | null
          start_date: string | null
          end_date: string | null
          total_installments: number | null
          remaining_installments: number | null
          interest_rate: number | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['fixed_obligations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['fixed_obligations']['Insert']>
      }
      obligation_payments: {
        Row: {
          id: string
          user_id: string
          obligation_id: string
          due_date: string
          amount_due: number
          amount_paid: number | null
          paid_date: string | null
          status: 'UPCOMING' | 'DUE' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID' | 'SKIPPED'
          payment_account_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['obligation_payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['obligation_payments']['Insert']>
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
          amount: number
          transaction_date: string
          category: string | null
          description: string | null
          reference_type: 'INCOME_RECORD' | 'OBLIGATION_PAYMENT' | 'NONE'
          reference_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['transactions']['Insert']>
      }
    }
  }
}
