import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvFile(path) {
  if (!existsSync(path)) return

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile(resolve(root, '.env'))
loadEnvFile(resolve(root, '.env.local'))

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function parseCsvLine(line) {
  const cols = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === ';' && !inQuotes) {
      cols.push(cur)
      cur = ''
      continue
    }
    cur += char
  }

  cols.push(cur)
  return cols
}

function parseNumber(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return 0

  if (trimmed.includes(',')) {
    const normalized = trimmed.replace(/\./g, '').replace(',', '.')
    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const parsed = Number.parseFloat(trimmed)
  return Number.isFinite(parsed) ? parsed : 0
}

function titleCase(name) {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizeKey(name) {
  return titleCase(name).toLowerCase()
}

function normalizeStatus(status, situacao) {
  if (String(status ?? '').toUpperCase() === 'PAGO') return 'PAGO'
  if (String(situacao ?? '').toLowerCase() === 'pago') return 'PAGO'
  return (status ?? situacao ?? '').trim() || null
}

function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

const csvArg = process.argv[2]
const csvPath = csvArg
  ? resolve(csvArg)
  : resolve(root, 'public/data/propostas.csv')

if (!existsSync(csvPath)) {
  console.error(`CSV não encontrado: ${csvPath}`)
  process.exit(1)
}

const csvText = readFileSync(csvPath, 'utf8')
const lines = csvText.split(/\r?\n/).filter((line) => line.trim())
const header = parseCsvLine(lines[0]).map((col) => col.replace(/"/g, '').trim())

const indexes = {
  vendedor: header.indexOf('Vendedor'),
  cliente: header.indexOf('Cliente'),
  valorFinal: header.indexOf('Valor Final (R$)'),
  status: header.indexOf('Status'),
  situacao: header.indexOf('Situação vendedor'),
}

console.log('Lendo CSV:', csvPath)
console.log('Linhas:', lines.length - 1)

const sellerNames = new Map()
for (const line of lines.slice(1)) {
  const cols = parseCsvLine(line)
  const name = titleCase(cols[indexes.vendedor] ?? '')
  if (name) sellerNames.set(normalizeKey(name), name)
}

console.log('Vendedores únicos:', sellerNames.size)

const { data: existingVendedores, error: existingError } = await supabase
  .from('vendedores')
  .select('id, nome, foto')

if (existingError) {
  console.error('Erro ao buscar vendedores:', existingError.message)
  process.exit(1)
}

const vendedorIdByName = new Map(
  (existingVendedores ?? []).map((row) => [normalizeKey(row.nome), row.id]),
)
const fotoById = new Map(
  (existingVendedores ?? []).map((row) => [row.id, row.foto]),
)

const novosVendedores = [...sellerNames.entries()]
  .filter(([key]) => !vendedorIdByName.has(key))
  .map(([, nome]) => ({ nome }))

if (novosVendedores.length > 0) {
  const { error: insertVendedoresError } = await supabase
    .from('vendedores')
    .insert(novosVendedores)

  if (insertVendedoresError) {
    console.error('Erro ao inserir vendedores:', insertVendedoresError.message)
    process.exit(1)
  }
}

const { data: vendedores, error: vendedoresError } = await supabase
  .from('vendedores')
  .select('id, nome, foto')

if (vendedoresError || !vendedores) {
  console.error('Erro ao carregar vendedores:', vendedoresError?.message)
  process.exit(1)
}

for (const vendedor of vendedores) {
  vendedorIdByName.set(normalizeKey(vendedor.nome), vendedor.id)
}

console.log('Limpando propostas antigas...')
const { error: deleteError } = await supabase
  .from('propostas')
  .delete()
  .neq('id', '00000000-0000-0000-0000-000000000000')

if (deleteError) {
  console.error('Erro ao limpar propostas:', deleteError.message)
  process.exit(1)
}

const propostas = []

for (const line of lines.slice(1)) {
  const cols = parseCsvLine(line)
  const vendedorNome = titleCase(cols[indexes.vendedor] ?? '')
  if (!vendedorNome) continue

  const vendedorId = vendedorIdByName.get(normalizeKey(vendedorNome))
  if (!vendedorId) continue

  propostas.push({
    vendedor_id: vendedorId,
    cliente: cols[indexes.cliente] ?? null,
    valor: parseNumber(cols[indexes.valorFinal]),
    status: normalizeStatus(cols[indexes.status], cols[indexes.situacao]),
  })
}

console.log('Importando propostas:', propostas.length)

for (const [index, batch] of chunk(propostas, 200).entries()) {
  const { error } = await supabase.from('propostas').insert(batch)
  if (error) {
    console.error(`Erro no lote ${index + 1}:`, error.message)
    process.exit(1)
  }
  console.log(`Lote ${index + 1}/${Math.ceil(propostas.length / 200)} OK`)
}

const paidCount = propostas.filter((p) => p.status === 'PAGO').length

console.log('\nImportação concluída!')
console.log(`- ${vendedores.length} vendedores`)
console.log(`- ${propostas.length} propostas`)
console.log(`- ${paidCount} propostas pagas (no ranking)`)
console.log(`- ${[...fotoById.values()].filter(Boolean).length} fotos preservadas`)
