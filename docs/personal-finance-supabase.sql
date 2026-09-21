-- Execute este arquivo no SQL Editor do seu projeto Supabase.
-- A tabela guarda um estado JSON por pessoa autenticada.
create table if not exists public.finance_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{"months": {}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.finance_states enable row level security;

drop policy if exists "Usuário lê apenas seus dados" on public.finance_states;
create policy "Usuário lê apenas seus dados"
on public.finance_states for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Usuário cria apenas seus dados" on public.finance_states;
create policy "Usuário cria apenas seus dados"
on public.finance_states for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Usuário altera apenas seus dados" on public.finance_states;
create policy "Usuário altera apenas seus dados"
on public.finance_states for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Usuário exclui apenas seus dados" on public.finance_states;
create policy "Usuário exclui apenas seus dados"
on public.finance_states for delete
to authenticated
using ((select auth.uid()) = user_id);
