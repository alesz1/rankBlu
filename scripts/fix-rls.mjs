import { readFileSync, existsSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import dns from 'dns'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const projectRef = 'ysaqcxgvefzfhkmmcxig'

dns.setDefaultResultOrder('ipv4first')

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

const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD

if (!dbPassword && !process.env.DATABASE_URL) {
  console.error('Defina DATABASE_URL ou SUPABASE_DB_PASSWORD no .env')
  process.exit(1)
}

const sql = readFileSync(resolve(root, 'supabase/rls-policies.sql'), 'utf8')

async function tryConnect(config, label) {
  console.log(`Tentando conexão: ${label}`)
  const client = new pg.Client({
    ...config,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  })

  try {
    await client.connect()
    console.log('Conectado. Aplicando politicas RLS...')
    await client.query(sql)
    console.log('Politicas RLS aplicadas com sucesso!')
    await client.end()
    return true
  } catch (error) {
    console.error(`Falhou: ${error.message}`)
    try {
      await client.end()
    } catch {
      // ignore
    }
    return false
  }
}

const regions = ['sa-east-1', 'us-east-1', 'us-west-1', 'eu-west-1', 'eu-central-1', 'ap-southeast-1']
const attempts = []

if (process.env.DATABASE_URL) {
  attempts.push({ connectionString: process.env.DATABASE_URL, label: 'DATABASE_URL' })
}

if (process.env.SUPABASE_DB_PASSWORD) {
  attempts.push({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    label: `db.${projectRef}.supabase.co:5432`,
  })

  for (const region of regions) {
    for (const awsPrefix of ['aws-0', 'aws-1']) {
      attempts.push({
        host: `${awsPrefix}-${region}.pooler.supabase.com`,
        port: 6543,
        user: `postgres.${projectRef}`,
        password: process.env.SUPABASE_DB_PASSWORD,
        database: 'postgres',
        label: `${awsPrefix}-${region}.pooler:6543`,
      })
      attempts.push({
        host: `${awsPrefix}-${region}.pooler.supabase.com`,
        port: 5432,
        user: `postgres.${projectRef}`,
        password: process.env.SUPABASE_DB_PASSWORD,
        database: 'postgres',
        label: `${awsPrefix}-${region}.pooler:5432`,
      })
    }
  }
}

for (const attempt of attempts) {
  const { label, ...config } = attempt
  const ok = await tryConnect(config, label)
  if (ok) process.exit(0)
}

console.error('\nNão foi possível conectar ao banco automaticamente.')
console.error('Execute supabase/rls-policies.sql manualmente no SQL Editor do Supabase.')
process.exit(1)
