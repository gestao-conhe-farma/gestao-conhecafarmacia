# Auditoria de segurança — O Sentinela (setembro 2026, re-visita)

Segunda vistoria completa, focada nas superfícies adicionadas desde a última
auditoria: notificações + email (Resend), pipeline de conteúdo (`/conteudo`),
PWA/service worker, passkeys + 2FA, conclusão de atividades (migration 0019)
e o workflow de backups. As secções antigas (auth, sessões, RLS base) foram
re-confirmadas rapidamente — nada regrediu.

## Falhas encontradas e corrigidas neste ciclo

### 1. Injeção de HTML nos emails de notificação — 🟠 ALTO (corrigido)

- **O problema:** `lib/emails-templates.js` interpolava `titulo`, `corpo` e
  o nome do destinatário diretamente no HTML do email, sem escapar. Os
  títulos vêm de texto livre escrito por membros (título de reunião,
  atividade, subtarefa).
- **Cenário de ataque:** um membro (conta comprometida ou brincadeira)
  cria uma reunião intitulada `<img src=x onerror=...>` ou texto com
  `<style>` que reescreve o botão "Abrir na app" para um domínio de phishing.
  O email chega a toda a equipa com o payload renderizado — clientes de
  email executam HTML e o domínio da marca estava a emprestar a confiança.
- **Correção:** helper `esc()` aplicado a todo o texto interpolado (kicker,
  título, corpo, nome no rodapé, href do botão) + `assuntoSeguro()` que
  remove quebras de linha dos assuntos (injeção de headers SMTP).
  Ficheiro: `lib/emails-templates.js`.

### 2. `link_publicacao` sem validação de esquema — 🟡 MÉDIO (corrigido)

- **O problema:** o campo "link da publicação" em `/conteudo` era gravado e
  renderizado como `href` sem restrição de esquema — `javascript:` passava.
- **Cenário de ataque:** qualquer membro grava um tema com
  `link_publicacao = "javascript:fetch('/api/...')"`; quem clicar no link da
  publicação executa código no contexto da sessão (a app usa cookies de
  sessão httpOnly, mas o DOM e as rotas /api ficam ao alcance).
- **Correção:** `validar()` em `app/(app)/conteudo/actions.js` agora só
  aceita `http:`/`https:` via `new URL()` — rejeita `javascript:`, `data:`,
  `vbscript:` e strings inválidas, no servidor (não só no form).

### 3. `if: secrets.*` no workflow de backup — 🔵 BAIXO (corrigido)

- **O problema:** `backup.yml` usava `if: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY != '' }}`.
  O contexto `secrets` não está disponível em `if:` de job/step — a condição
  avalia sempre a falso, e o passo nunca correria.
- **Correção:** passo "Detetar se a key de storage está disponível" escreve
  `TEM_KEY` em `GITHUB_ENV` e o passo seguinte condiciona em `env.TEM_KEY`.
  Aproveitado para corrigir a chamada à API de storage para a forma
  documentada (POST com corpo JSON em vez de GET com query params).

## Verificado e saudável (sem ação)

- **Autenticação/sessão:** middleware renova tokens e impõe 4h absolutas;
  `/api/*` nunca redireciona (renova só); 2FA barrado no proxy quando
  `nextLevel = aal2`; `/api/auth/sessao` só carimba o início com sessão
  válida — não concede nada.
- **Rate limiting:** `/api/auth/login` consulta `login_falhas` e bloqueia
  por conta (15 min); logs com IP para investigação.
- **Mensagens de erro de login genéricas** (sem enumeração de contas).
- **RLS de storage:** bucket privado; escrita/leitura de `documentos` e
  anexos `reunioes/` limitadas a super_admin e a registos na BD —
  um ficheiro órfão no bucket não é legível por ninguém via API.
- **RLS 0019 (conclusão por responsável):** correta — `USING` verifica
  pertença em `atividade_responsaveis`; a app limita o que o responsável
  muda; `WITH CHECK` implícito = mesmo predicado (sem escrita em nome
  de outrem).
- **RLS `/conteudo`:** escrita da equipa inteira é decisão de produto
  (todos alimentam o calendário), apagar só coordenação. Risco aceite e
  documentado.
- **Server actions novas (concluir/reabrir):** revalidam papel/pertença no
  servidor antes de escrever — a UI não é o controlo de acesso.
- **Env públicas:** só `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` (seguras
  *porque* a RLS fecha) e `NEXT_PUBLIC_APP_URL` (apenas domínio público).
  Service role só no servidor; `credenciais.txt` fora do git.
- **Headers de segurança:** X-Frame-Options DENY, nosniff, HSTS preload
  2 anos, Referrer-Policy, Permissions-Policy — todos em `next.config.mjs`.
- **SW do PWA:** cacheia só assets imutáveis; HTML/API ficam sempre na
  rede — não expõe nem serve dados velhos.
- **Backups:** o `.dump` vive como artefacto privado do repositório;
  a password da base entra só como segredo do Actions, nunca no log
  (passada por env do passo, não por argumento visível).

## Secções não aplicáveis a este projeto

- **I. Pagamentos** — não há checkout nem webhooks; nenhuma chave de
  pagamento existe no código.
- **K. Conteúdo restrito/vídeo** — não há vídeo pago; os PDFs/atas usam
  URLs assinadas de curta duração geradas no servidor.
- **L. Formulários públicos** — não existem: a única superfície anónima é
  o login (com rate limiting). Se um dia houver formulário de contacto
  público, aqui entra CAPTCHA/honeypot.

## Recomendações contínuas

1. `npm audit` periódico (ou Dependabot no repositório).
2. Quando houver chat/mensagens entre membros (proposta arquivada), a
   camada de escaping criada nos emails deve ser replicada na renderização
   das mensagens.
3. Revisitar a lista de super_admins regularmente — é a conta que tudo vê.
