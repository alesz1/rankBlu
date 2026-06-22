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
      vendedores: {
        Row: {
          id: string
          slug: string
          nome: string
          foto_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          nome: string
          foto_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          nome?: string
          foto_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      propostas: {
        Row: {
          id: string
          numero_proposta: string | null
          id_sistema: string | null
          vendedor_id: string | null
          vendedor_nome: string
          cliente: string | null
          cpf: string | null
          produto: string | null
          convenio: string | null
          entidade: string | null
          matricula: string | null
          protocolo: string | null
          banco_comprado: string | null
          banco_digitado: string | null
          valor_proposta: number
          desconto: number
          valor_final: number
          tabela: string | null
          status: string | null
          situacao_vendedor: string | null
          observacoes: string | null
          fases: string | null
          data_criacao: string | null
          created_at: string
        }
        Insert: {
          id?: string
          numero_proposta?: string | null
          id_sistema?: string | null
          vendedor_id?: string | null
          vendedor_nome: string
          cliente?: string | null
          cpf?: string | null
          produto?: string | null
          convenio?: string | null
          entidade?: string | null
          matricula?: string | null
          protocolo?: string | null
          banco_comprado?: string | null
          banco_digitado?: string | null
          valor_proposta?: number
          desconto?: number
          valor_final?: number
          tabela?: string | null
          status?: string | null
          situacao_vendedor?: string | null
          observacoes?: string | null
          fases?: string | null
          data_criacao?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['propostas']['Insert']>
      }
    }
    Views: {
      ranking_vendedores: {
        Row: {
          id: string
          slug: string
          nome: string
          foto_url: string | null
          propostas_pagas: number
          valor_total: number
        }
      }
    }
  }
}
