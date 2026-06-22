import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
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

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key)

const tables = ['vendedores', 'propostas', 'ranking_vendedores']
let allOk = true

for (const table of tables) {
  const { error } = await supabase.from(table).select('*').limit(1)
  const status = error ? `ERRO: ${error.message}` : 'OK'
  console.log(`${table}: ${status}`)
  if (error) allOk = false
}

if (!allOk) {
  console.log('\nExecute supabase/schema.sql no SQL Editor do Supabase:')
  console.log('https://supabase.com/dashboard/project/ysaqcxgvefzfhkmmcxig/sql/new')
  process.exit(1)
}

console.log('\nTudo pronto para importar: npm run seed')
