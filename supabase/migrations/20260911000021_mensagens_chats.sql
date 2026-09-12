-- =============================================================
-- Migration 0021: Mensagens — chats contextuais e DMs
--
-- Uma tabela única serve três famílias de canais (sem chat geral,
-- por decisão — o WhatsApp cobre esse papel):
--
--   atividade:<id>   — conversa colada a uma atividade/evento/entrevista
--   reuniao:<id>     — conversa colada a uma reunião
--   dm:<a>:<b>       — mensagem direta entre dois membros (ids ordenados)
--
-- Visibilidade espelha EXATAMENTE a do objeto pai:
--   - atividades: visíveis a todos os autenticados (policy "ler atividades")
--   - reuniões:   private (visibilidade 'coordenacao') → chat privado
--                 também — reusa pode_ver_reuniao da migração 0020
--   - DMs:        só os dois participantes
--
-- IMPORTANTE (recursão RLS): as policies usam o helper security definer
-- pode_ver_canal(), que nunca lê a própria tabela mensagens — padrão da
-- migração 0011/0020, para evitar "infinite recursion detected in policy".
-- =============================================================

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  canal text not null,               -- 'atividade:<uuid>' | 'reuniao:<uuid>' | 'dm:<uuid>:<uuid>'
  autor_id uuid references public.pessoas(id) on delete cascade not null,
  conteudo text not null check (char_length(conteudo) between 1 and 4000),
  editado_em timestamptz,
  apagada_em timestamptz,            -- soft delete: "mensagem removida" mantém a thread coerente
  criado_em timestamptz not null default now()
);

-- 1) Helper de visibilidade (security definer → sem recursão)
create or replace function public.pode_ver_canal(p_canal text)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  prefixo text;
  alvo uuid;
  a uuid;
  b uuid;
begin
  prefixo := split_part(p_canal, ':', 1);

  if prefixo = 'atividade' then
    -- Atividades são visíveis a todos os autenticados (policy "ler atividades")
    alvo := split_part(p_canal, ':', 2)::uuid;
    return exists (select 1 from public.atividades at where at.id = alvo);

  elsif prefixo = 'reuniao' then
    -- Reuniões respeitam a visibilidade (0020): 'equipa' → todos,
    -- 'coordenacao' → só super_admins. Reutiliza pode_ver_reuniao.
    alvo := split_part(p_canal, ':', 2)::uuid;
    return public.pode_ver_reuniao(alvo);

  elsif prefixo = 'dm' then
    -- DM: só os dois participantes. Formato dm:<a>:<b> com a < b.
    a := split_part(p_canal, ':', 2)::uuid;
    b := split_part(p_canal, ':', 3)::uuid;
    return auth.uid() = a or auth.uid() = b;

  else
    return false;
  end if;
end;
$$;

revoke all on function public.pode_ver_canal(text) from public;
grant execute on function public.pode_ver_canal(text) to authenticated;

-- 2) RLS
alter table public.mensagens enable row level security;

-- Ler: quem pode ver o canal pode ler as mensagens dele
create policy "ler mensagens do canal"
  on public.mensagens
  for select
  using (public.pode_ver_canal(canal));

-- Enviar: tem de ser o próprio autor E poder ver o canal
create policy "enviar no canal"
  on public.mensagens
  for insert
  with check (
    autor_id = auth.uid()
    and public.pode_ver_canal(canal)
  );

-- Editar: só o autor, enquanto não apagou
create policy "autor edita a propria mensagem"
  on public.mensagens
  for update
  using (
    autor_id = auth.uid()
    and apagada_em is null
  )
  with check (
    autor_id = auth.uid()
    and public.pode_ver_canal(canal)
  );

-- Apagar: só o autor (soft delete — a linha permanece)
create policy "autor apaga a propria mensagem"
  on public.mensagens
  for delete
  using (autor_id = auth.uid());

-- 3) Realtime: publicar a tabela (postgres_changes consome isto)
alter publication supabase_realtime add table public.mensagens;

-- 4) Índices — a leitura é sempre "por canal, cronológico"
create index if not exists idx_mensagens_canal
  on public.mensagens(canal, criado_em);
create index if not exists idx_mensagens_autor
  on public.mensagens(autor_id);
