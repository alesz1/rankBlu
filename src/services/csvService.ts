import Papa from 'papaparse'
import { getSupabase } from '../lib/supabase'

interface CsvRow {
  Vendedor?: string
  vendedor?: string
  Nome?: string
  nome?: string
  
  Valor?: string | number
  valor?: string | number
  
  Status?: string
  status?: string
}

export async function processCsvFile(file: File, wipeOld: boolean, onProgress: (msg: string) => void): Promise<void> {
  const supabase = getSupabase()

  onProgress('Lendo o arquivo CSV...')
  
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data
          if (rows.length === 0) {
            throw new Error('O arquivo CSV está vazio.')
          }

          onProgress('Buscando vendedores no banco...')
          const { data: existingVendedores, error: vError } = await supabase.from('vendedores').select('id, nome')
          
          if (vError) throw new Error(`Erro ao buscar vendedores: ${vError.message}`)
            
          const vendedorMap = new Map<string, string>()
          for (const v of existingVendedores || []) {
            vendedorMap.set(v.nome.trim().toLowerCase(), v.id)
          }

          if (wipeOld) {
            onProgress('Apagando propostas antigas...')
            // O Supabase exige um filtro para delete, então usamos um filtro que sempre é verdadeiro
            const { error: delError } = await supabase.from('propostas').delete().not('status', 'is', null)
            // Caso o status possa ser nulo, podemos deletar por valor não ser nulo, ou apenas ignorar erros se não deletar tudo
            if (delError) {
              console.warn('Aviso ao apagar antigas:', delError)
            }
          }

          const novasPropostas: any[] = []

          onProgress('Processando linhas do CSV...')
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const vendedorName = (row.Vendedor || row.vendedor || row.Nome || row.nome || '').trim()
            let valorRaw = row.Valor || row.valor || 0
            const status = (row.Status || row.status || 'Pago').trim()

            if (!vendedorName) continue

            // Converte valor de string para numero se necessario (trata vírgula e ponto)
            let valorNum = typeof valorRaw === 'string' ? parseFloat(valorRaw.replace(',', '.')) : valorRaw
            if (isNaN(valorNum)) valorNum = 0

            const normalizedName = vendedorName.toLowerCase()
            let vendedorId = vendedorMap.get(normalizedName)

            // Se não existe, cria o vendedor
            if (!vendedorId) {
              onProgress(`Criando novo vendedor: ${vendedorName}...`)
              const { data: newVendedor, error: insertVError } = await supabase
                .from('vendedores')
                .insert([{ nome: vendedorName }])
                .select('id')
                .single()

              if (insertVError || !newVendedor) {
                console.warn(`Erro ao criar vendedor ${vendedorName}`, insertVError)
                continue // Pula a proposta se não conseguir criar vendedor
              }
              vendedorId = newVendedor.id as string
              vendedorMap.set(normalizedName, vendedorId)
            }

            novasPropostas.push({
              vendedor_id: vendedorId,
              valor: valorNum,
              status: status
            })
          }

          if (novasPropostas.length > 0) {
            onProgress(`Inserindo ${novasPropostas.length} propostas no banco...`)
            
            // Inserir em lotes para evitar sobrecarga (batch de 500)
            const BATCH_SIZE = 500
            for (let i = 0; i < novasPropostas.length; i += BATCH_SIZE) {
              const batch = novasPropostas.slice(i, i + BATCH_SIZE)
              const { error: pError } = await supabase.from('propostas').insert(batch)
              if (pError) throw new Error(`Erro ao inserir lote de propostas: ${pError.message}`)
            }
          }

          onProgress('Concluído com sucesso!')
          resolve()
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(new Error(`Erro ao ler CSV: ${error.message}`))
      }
    })
  })
}
