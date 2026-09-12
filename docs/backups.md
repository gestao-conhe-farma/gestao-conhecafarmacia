# Backups da base de dados — como funciona

## O que está montado

Workflow do GitHub Actions (`.github/workflows/backup.yml`):

- **Quando:** todos os domingos às 04:00 UTC (05:00 em Portugal) — e sempre
  que alguém clicar em **Run workflow** na página de Actions.
- **O que guarda:** `pg_dump` completo em formato customizado comprimido
  (`gestao-YYYYMMDD-HHMM.dump`) — schema, dados, policies, funções.
  Verifica a integridade com `pg_restore --list` e exige ≥5 tabelas com
  dados, senão o run falha (backup suspeito nunca é guardado como bom).
- **Onde fica:** artefacto do run, com **retenção de 90 dias** — o GitHub
  apaga sozinho depois disso. Fica na página *Actions → Backup Supabase*.
- **Extra:** se o segredo `SUPABASE_SERVICE_ROLE_KEY` estiver definido,
  o run mostra também a contagem de ficheiros no bucket `documentos`.

## Configuração única (feita uma só vez)

Em `github.com/gestao-conhe-farma/gestao-conhecafarmacia` →
**Settings → Secrets and variables → Actions → New repository secret**:

| Segredo | Valor |
|---|---|
| `SUPABASE_DB_PASSWORD` | A password da base (secção SUPABASE do `credenciais.txt`) |
| `SUPABASE_SERVICE_ROLE_KEY` | *(opcional)* a service role key do `.env.local` |

## Restaurar (esperemos que nunca seja preciso)

```bash
pg_restore -h aws-1-eu-west-1.pooler.supabase.com \
  -U postgres.zmvqtawocfixphqikndn -d postgres \
  --clean --if-exists gestao-YYYYMMDD-HHMM.dump
```

(Password na variável `PGPASSWORD`. `--clean --if-exists` recria as tabelas
por cima das existentes — só usar numa base mesmo perdida.)

## Notas

- Ligação feita pelo **pooler de sessão IPv4** (`aws-1-eu-west-1.pooler
  .supabase.com`) — os runners do GitHub não chegam ao host direto
  `db.*.supabase.co`, que é só IPv6.
- O ficheiro de dump **nunca passa por third parties**: vive dentro do
  repositório privado do GitHub como artefacto do run.
- Storage (ficheiros do bucket `documentos`, atas em PDF/Word) continua a
  viver só no Supabase — a cópia de binários é uma fase posterior se for
  considerada necessária.
