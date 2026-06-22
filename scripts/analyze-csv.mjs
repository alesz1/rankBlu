import fs from 'fs'

const text = fs.readFileSync(
  'c:/Users/Alejandro/Downloads/propostas_soublu_2026-06-22 (1).csv',
  'utf8',
)
const lines = text.split(/\r?\n/).filter(Boolean)
const header = lines[0].split(';').map((h) => h.replace(/"/g, ''))
const idx = {
  vendedor: header.indexOf('Vendedor'),
  valorFinal: header.indexOf('Valor Final (R$)'),
  status: header.indexOf('Status'),
  situacao: header.indexOf('Situação vendedor'),
}

function parseLine(line) {
  const cols = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQ = !inQ
      continue
    }
    if (c === ';' && !inQ) {
      cols.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  cols.push(cur)
  return cols
}

const map = new Map()
for (const line of lines.slice(1)) {
  const cols = parseLine(line)
  const status = (cols[idx.status] || '').trim()
  const situacao = (cols[idx.situacao] || '').trim()
  const isPaid = status.toUpperCase() === 'PAGO' || situacao.toLowerCase() === 'pago'
  if (!isPaid) continue
  const name = (cols[idx.vendedor] || '').trim()
  if (!name) continue
  const val = parseFloat((cols[idx.valorFinal] || '0').replace(',', '.')) || 0
  const cur = map.get(name) || { count: 0, total: 0 }
  cur.count++
  cur.total += val
  map.set(name, cur)
}

const sorted = [...map.entries()].sort((a, b) => b[1].total - a[1].total)
console.log('sellers', sorted.length)
console.log(
  'top10',
  sorted.slice(0, 10).map(([n, d]) => `${n}: R$${d.total.toFixed(2)} (${d.count})`),
)
