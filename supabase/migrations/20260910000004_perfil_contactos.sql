-- =============================================================
-- Migration 0004: Perfil da equipa — contactos
-- Telefone e WhatsApp (E.164) em pessoas; a lista da equipa passa
-- a ser legível por todos os membros autenticados (directoria),
-- mantendo a escrita reservada à Admin API (service_role).
-- =============================================================

alter table public.pessoas
  add column if not exists telefone text,
  add column if not exists whatsapp text;

-- Formato internacional obrigatório: +[1-9] seguido de 8–14 dígitos
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pessoas_telefone_e164') then
    alter table public.pessoas
      add constraint pessoas_telefone_e164
      check (telefone is null or telefone ~ '^\+[1-9][0-9]{8,14}$');
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pessoas_whatsapp_e164') then
    alter table public.pessoas
      add constraint pessoas_whatsapp_e164
      check (whatsapp is null or whatsapp ~ '^\+[1-9][0-9]{8,14}$');
  end if;
end
$$;

-- -------------------------------------------------------------
-- Directoria da equipa: todos os autenticados leem todos os
-- membros (nome, email, papel e contactos). Substitui a policy
-- anterior, que só permitia ler o próprio registo. A escrita
-- continua fechada: contas e edições passam pela Admin API
-- (service_role) nas server actions.
-- -------------------------------------------------------------
drop policy if exists "ler propria pessoa" on public.pessoas;

create policy "ler equipa" on public.pessoas
  for select using (auth.uid() is not null);
