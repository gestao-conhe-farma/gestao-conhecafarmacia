-- =============================================================
-- Migration 0003: Reuniões
-- Reuniões mensais (recorrência configurável) e urgentes, com
-- pauta, presenças, notas da equipa, planos votados pela equipa
-- e convertíveis em atividades/eventos, anexos e ata final.
-- =============================================================

-- Reuniões
create table if not exists public.reunioes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'mensal' check (tipo in ('mensal', 'urgente')),
  estado text not null default 'agendada'
    check (estado in ('agendada', 'realizada', 'cancelada')),
  data_hora timestamptz not null,
  local text,
  pauta text, -- um ponto por linha
  resumo text, -- ata final — só super_admin escreve
  resumo_publicado_em timestamptz, -- preenchido ao publicar → congela notas
  criado_por uuid references public.pessoas(id) not null,
  criado_em timestamptz default now()
);

-- Convocados: confirmam presença antes; super_admin marca depois
create table if not exists public.reuniao_participantes (
  reuniao_id uuid references public.reunioes(id) not null,
  pessoa_id uuid references public.pessoas(id) not null,
  status text not null default 'convidado' check (status in ('convidado', 'confirmado')),
  presenca text check (presenca in ('presente', 'ausente', 'justificado')),
  primary key (reuniao_id, pessoa_id)
);

-- Notas da equipa (todos escrevem; congelam quando a ata é publicada)
create table if not exists public.reuniao_notas (
  id uuid primary key default gen_random_uuid(),
  reuniao_id uuid references public.reunioes(id) not null,
  autor_id uuid references public.pessoas(id) not null,
  conteudo text not null,
  criado_em timestamptz default now(),
  editado_em timestamptz
);

-- Planos propostos pela coordenação (decididos após voto da equipa)
create table if not exists public.reuniao_planos (
  id uuid primary key default gen_random_uuid(),
  reuniao_id uuid references public.reunioes(id) not null,
  titulo text not null,
  descricao text,
  decisao text not null default 'pendente'
    check (decisao in ('pendente', 'aprovado', 'rejeitado')),
  decidido_por uuid references public.pessoas(id),
  decidido_em timestamptz,
  atividade_id uuid, -- atividade/evento gerado (preenchido na conversão)
  criado_por uuid references public.pessoas(id) not null,
  criado_em timestamptz default now()
);

-- Voto da equipa nos planos: favor / contra / abstenção
create table if not exists public.reuniao_plano_votos (
  plano_id uuid references public.reuniao_planos(id) not null,
  pessoa_id uuid references public.pessoas(id) not null,
  voto text not null check (voto in ('favor', 'contra', 'abstencao')),
  votado_em timestamptz default now(),
  primary key (plano_id, pessoa_id)
);

-- Anexos da reunião (ficheiros no bucket privado 'documentos', prefixo reunioes/)
create table if not exists public.reuniao_anexos (
  id uuid primary key default gen_random_uuid(),
  reuniao_id uuid references public.reunioes(id) not null,
  storage_path text not null unique,
  nome_ficheiro text not null,
  mime_type text,
  tamanho_bytes bigint,
  criado_por uuid references public.pessoas(id) not null,
  criado_em timestamptz default now()
);

-- Configuração da recorrência mensal (linha única, id = 1)
create table if not exists public.reuniao_configuracao (
  id int primary key default 1 check (id = 1),
  ativa boolean not null default true,
  -- Modo A: n.ª ocorrência do dia da semana (ex.: 1.ª segunda-feira)
  semana_do_mes int check (semana_do_mes between 1 and 4),
  dia_semana int check (dia_semana between 0 and 6), -- 0 = domingo
  -- Modo B: dia fixo do mês
  dia_do_mes int check (dia_do_mes between 1 and 31),
  hora time not null default '18:00',
  local text,
  atualizado_em timestamptz default now(),
  -- exatamente um modo ativo
  constraint modo_unico check ((semana_do_mes is null) <> (dia_do_mes is null))
);

-- Seed: 1.ª segunda-feira de cada mês às 18:00
insert into public.reuniao_configuracao (id, semana_do_mes, dia_semana, hora)
values (1, 1, 1, '18:00')
on conflict (id) do nothing;

-- Ligação de atividades/eventos gerados a partir de planos de reunião
alter table public.atividades
  add column if not exists reuniao_origem uuid references public.reunioes(id);

-- =============================================================
-- RLS
-- =============================================================
alter table public.reunioes enable row level security;
alter table public.reuniao_participantes enable row level security;
alter table public.reuniao_notas enable row level security;
alter table public.reuniao_planos enable row level security;
alter table public.reuniao_plano_votos enable row level security;
alter table public.reuniao_anexos enable row level security;
alter table public.reuniao_configuracao enable row level security;

-- --- reunioes: todos veem; coordenação gere ---
create policy "ler reunioes" on public.reunioes
  for select using (auth.uid() is not null);

create policy "super_admin cria reunioes" on public.reunioes
  for insert with check (public.minha_role() = 'super_admin');

create policy "super_admin edita reunioes" on public.reunioes
  for update using (public.minha_role() = 'super_admin');

create policy "super_admin apaga reunioes" on public.reunioes
  for delete using (public.minha_role() = 'super_admin');

-- --- participantes ---
create policy "ler participantes reuniao" on public.reuniao_participantes
  for select using (auth.uid() is not null);

create policy "super_admin convoca" on public.reuniao_participantes
  for insert with check (public.minha_role() = 'super_admin');

-- super_admin marca presenças; o próprio confirma
create policy "confirmar ou marcar presenca" on public.reuniao_participantes
  for update using (
    public.minha_role() = 'super_admin' or pessoa_id = auth.uid()
  );

create policy "super_admin remove convites" on public.reuniao_participantes
  for delete using (public.minha_role() = 'super_admin');

-- --- notas: todos leem; autor escreve enquanto a ata não saiu ---
create policy "ler notas" on public.reuniao_notas
  for select using (auth.uid() is not null);

create policy "autor cria nota" on public.reuniao_notas
  for insert with check (auth.uid() is not null and autor_id = auth.uid());

create policy "autor edita nota enquanto aberta" on public.reuniao_notas
  for update using (
    public.minha_role() = 'super_admin'
    or (
      autor_id = auth.uid()
      and not exists (
        select 1 from public.reunioes r
        where r.id = reuniao_id and r.resumo_publicado_em is not null
      )
    )
  );

create policy "autor ou super_admin apaga nota" on public.reuniao_notas
  for delete using (
    public.minha_role() = 'super_admin'
    or (
      autor_id = auth.uid()
      and not exists (
        select 1 from public.reunioes r
        where r.id = reuniao_id and r.resumo_publicado_em is not null
      )
    )
  );

-- --- planos: todos veem; coordenação gere ---
create policy "ler planos" on public.reuniao_planos
  for select using (auth.uid() is not null);

create policy "super_admin cria planos" on public.reuniao_planos
  for insert with check (public.minha_role() = 'super_admin');

create policy "super_admin decide planos" on public.reuniao_planos
  for update using (public.minha_role() = 'super_admin');

create policy "super_admin apaga planos" on public.reuniao_planos
  for delete using (public.minha_role() = 'super_admin');

-- --- votos: um por pessoa; muda ou retira enquanto quiser ---
create policy "ler votos" on public.reuniao_plano_votos
  for select using (auth.uid() is not null);

create policy "pessoa vota" on public.reuniao_plano_votos
  for insert with check (pessoa_id = auth.uid());

create policy "pessoa muda voto" on public.reuniao_plano_votos
  for update using (pessoa_id = auth.uid());

create policy "pessoa retira voto" on public.reuniao_plano_votos
  for delete using (pessoa_id = auth.uid() or public.minha_role() = 'super_admin');

-- --- anexos ---
create policy "ler anexos" on public.reuniao_anexos
  for select using (auth.uid() is not null);

create policy "super_admin anexa" on public.reuniao_anexos
  for insert with check (public.minha_role() = 'super_admin');

create policy "super_admin remove anexo" on public.reuniao_anexos
  for delete using (public.minha_role() = 'super_admin');

-- --- configuração: todos leem (mostra a regra); coordenação edita ---
create policy "ler configuracao" on public.reuniao_configuracao
  for select using (auth.uid() is not null);

create policy "super_admin configura" on public.reuniao_configuracao
  for update using (public.minha_role() = 'super_admin');

create policy "super_admin define configuracao" on public.reuniao_configuracao
  for insert with check (public.minha_role() = 'super_admin');

-- =============================================================
-- Storage: anexos de reuniões vivem no bucket 'documentos'
-- sob o prefixo 'reunioes/'. A policy de leitura existente só
-- cobre ficheiros registados em documentos — esta cobre os anexos.
-- =============================================================
create policy "super_admin carrega anexos reunioes" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documentos'
    and (name like 'reunioes/%')
    and public.minha_role() = 'super_admin'
  );

create policy "super_admin apaga anexos reunioes" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documentos'
    and (name like 'reunioes/%')
    and public.minha_role() = 'super_admin'
  );

create policy "ler anexos reunioes" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documentos'
    and (name like 'reunioes/%')
    and exists (
      select 1 from public.reuniao_anexos a
      where a.storage_path = objects.name
    )
  );

-- =============================================================
-- Índices
-- =============================================================
create index if not exists idx_reunioes_data on public.reunioes(data_hora);
create index if not exists idx_reunioes_estado on public.reunioes(estado);
create index if not exists idx_reuniao_partic_pessoa on public.reuniao_participantes(pessoa_id);
create index if not exists idx_reuniao_notas_reuniao on public.reuniao_notas(reuniao_id);
create index if not exists idx_reuniao_planos_reuniao on public.reuniao_planos(reuniao_id);
create index if not exists idx_reuniao_votos_plano on public.reuniao_plano_votos(plano_id);
create index if not exists idx_reuniao_anexos_reuniao on public.reuniao_anexos(reuniao_id);
create index if not exists idx_atividades_reuniao_origem on public.atividades(reuniao_origem);
