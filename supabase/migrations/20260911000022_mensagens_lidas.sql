-- =============================================================
-- Migration 0022: Mensagens lidas — recibos de leitura do chat.
--
-- Uma linha por (canal, pessoa): guarda QUANDO cada membro leu cada
-- canal pela última vez. Todas as mensagens posteriores a esse instante
-- contam como não lidas. Vantagens:
--   - uma linha por canal (não uma por mensagem) — barato de manter
--   - o badge de /conversas e os ticks do painel derivam por comparação
--     de timestamps, sem reescrever N linhas
--   - abrir a conversa atualiza o instante → tudo "lido" de imediato
--
-- Escrita: só a própria pessoa (RLS), via actions do servidor.
-- Leitura: apenas as próprias linhas — recibos são pessoais.
-- =============================================================

create table if not exists public.mensagens_lidas (
  canal text not null,
  pessoa_id uuid references public.pessoas(id) on delete cascade not null,
  lido_em timestamptz not null default now(),
  primary key (canal, pessoa_id)
);

alter table public.mensagens_lidas enable row level security;

-- Cada um vê e mantém apenas os seus recibos
create policy "cada um le os seus recibos" on public.mensagens_lidas
  for select using (pessoa_id = auth.uid());

create policy "cada um cria o seu recibo" on public.mensagens_lidas
  for insert with check (pessoa_id = auth.uid());

create policy "cada um edita o seu recibo" on public.mensagens_lidas
  for update using (pessoa_id = auth.uid()) with check (pessoa_id = auth.uid());

create index if not exists idx_mensagens_lidas_pessoa
  on public.mensagens_lidas(pessoa_id);
