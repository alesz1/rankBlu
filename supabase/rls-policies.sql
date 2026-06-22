-- Politicas de leitura publica para o dashboard (schema simplificado)

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

grant select on public.vendedores to anon, authenticated;
grant select on public.propostas to anon, authenticated;
grant update on public.vendedores to anon, authenticated;
