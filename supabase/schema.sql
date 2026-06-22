-- Schema do Ranking SouBlu
-- Execute no SQL Editor do Supabase: https://supabase.com/dashboard

create extension if not exists "pgcrypto";

-- Vendedores
create table if not exists public.vendedores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  foto_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Propostas (dados do CSV)
create table if not exists public.propostas (
  id uuid primary key default gen_random_uuid(),
  numero_proposta text,
  id_sistema text,
  vendedor_id uuid references public.vendedores(id) on delete set null,
  vendedor_nome text not null,
  cliente text,
  cpf text,
  produto text,
  convenio text,
  entidade text,
  matricula text,
  protocolo text,
  banco_comprado text,
  banco_digitado text,
  valor_proposta numeric(14, 2) not null default 0,
  desconto numeric(14, 2) not null default 0,
  valor_final numeric(14, 2) not null default 0,
  tabela text,
  status text,
  situacao_vendedor text,
  observacoes text,
  fases text,
  data_criacao timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists propostas_vendedor_id_idx on public.propostas (vendedor_id);
create index if not exists propostas_status_idx on public.propostas (status);
create index if not exists propostas_situacao_idx on public.propostas (situacao_vendedor);

-- View do ranking (propostas pagas)
create or replace view public.ranking_vendedores as
select
  v.id,
  v.slug,
  v.nome,
  v.foto_url,
  count(p.id)::int as propostas_pagas,
  coalesce(sum(p.valor_final), 0)::numeric(14, 2) as valor_total
from public.vendedores v
left join public.propostas p on p.vendedor_id = v.id
  and (
    upper(coalesce(p.status, '')) = 'PAGO'
    or lower(coalesce(p.situacao_vendedor, '')) = 'pago'
  )
group by v.id, v.slug, v.nome, v.foto_url
having count(p.id) > 0
order by valor_total desc;

-- Atualiza updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vendedores_updated_at on public.vendedores;
create trigger vendedores_updated_at
before update on public.vendedores
for each row execute function public.set_updated_at();

-- Storage para fotos
insert into storage.buckets (id, name, public)
values ('vendedores-fotos', 'vendedores-fotos', true)
on conflict (id) do update set public = true;

-- RLS
alter table public.vendedores enable row level security;
alter table public.propostas enable row level security;

drop policy if exists "Leitura publica vendedores" on public.vendedores;
create policy "Leitura publica vendedores"
on public.vendedores for select
using (true);

drop policy if exists "Atualizar fotos vendedores" on public.vendedores;
create policy "Atualizar fotos vendedores"
on public.vendedores for update
using (true)
with check (true);

drop policy if exists "Leitura publica propostas" on public.propostas;
create policy "Leitura publica propostas"
on public.propostas for select
using (true);

drop policy if exists "Storage leitura fotos" on storage.objects;
create policy "Storage leitura fotos"
on storage.objects for select
using (bucket_id = 'vendedores-fotos');

drop policy if exists "Storage upload fotos" on storage.objects;
create policy "Storage upload fotos"
on storage.objects for insert
with check (bucket_id = 'vendedores-fotos');

drop policy if exists "Storage atualizar fotos" on storage.objects;
create policy "Storage atualizar fotos"
on storage.objects for update
using (bucket_id = 'vendedores-fotos');

drop policy if exists "Storage remover fotos" on storage.objects;
create policy "Storage remover fotos"
on storage.objects for delete
using (bucket_id = 'vendedores-fotos');

drop policy if exists "Inserir vendedores" on public.vendedores;
create policy "Inserir vendedores"
on public.vendedores for insert
with check (true);

drop policy if exists "Inserir propostas" on public.propostas;
create policy "Inserir propostas"
on public.propostas for insert
with check (true);

drop policy if exists "Excluir propostas" on public.propostas;
create policy "Excluir propostas"
on public.propostas for delete
using (true);

grant insert on public.vendedores to anon, authenticated, service_role;
grant insert, delete on public.propostas to anon, authenticated, service_role;
