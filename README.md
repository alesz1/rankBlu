# Ranking de Vendas — SouBlu

Dashboard de ranking com dados no **Supabase**.

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. No **SQL Editor**, execute o arquivo `supabase/schema.sql`
3. Em **Settings → API**, copie:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` public key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` (apenas para importação)

## 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 3. Importar dados do CSV

```bash
npm install
npm run seed
```

Isso importa todas as propostas do arquivo `public/data/propostas.csv` para o Supabase.

Para usar outro CSV:

```bash
npm run seed -- "C:\caminho\propostas.csv"
```

## 4. Rodar o app

```bash
npm run dev
```

## Estrutura no Supabase

| Tabela/View | Descrição |
|-------------|-----------|
| `vendedores` | Nome, slug e URL da foto |
| `propostas` | Todas as propostas do CSV |
| `ranking_vendedores` | View com ranking (propostas pagas) |
| Storage `vendedores-fotos` | Fotos dos vendedores |

## Fotos

Clique em **🖼** na sidebar para importar fotos. Elas são salvas no **Supabase Storage** e vinculadas ao vendedor.
