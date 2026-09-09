# Conheça Farmácia — Plataforma de Gestão Interna

Ferramenta interna da equipa **Conheça Farmácia** para substituir a coordenação
por WhatsApp: atividades, subtarefas com fluxo de aprovação, eventos com
conclusão manual e entrevistas com confirmação de presença.

> Projeto **separado** do site público conhecafarmacia.com — base de dados,
> auth e deploy independentes, para isolar dados internos de públicos.

## Stack

- **Next.js 16** (App Router) + React 19 — JS (sem TypeScript), como o site público
- **Tailwind CSS v4** com a identidade visual do site público
  (verde `#00493a`, accent `#0a844f`, Fraunces + Inter, dark mode)
- **Supabase** (projeto próprio: `zmvqtawocfixphqikndn` — conhe-farma-gestao)
- **Vercel** para deploy
- framer-motion (animações) + lucide-react (ícones)

## Estrutura

```
app/
  login/            → entrada (sem self-signup)
  setup/            → bootstrap do 1º super_admin (desativa-se sozinho)
  (app)/            → área autenticada (sidebar)
    page.jsx        → tela inicial com filtros por tipo
    atividades/     → lista, nova (super_admin), detalhe
    aprovacoes/     → ecrã de aprovação (super_admin)
    entrevistas/    → os meus convites + confirmar presença
    equipa/         → gestão de contas (super_admin)
  api/auth/         → login/logout
lib/supabase/       → clients (browser/server/admin)
supabase/migrations → schema + RLS
proxy.js            → renovação de sessão + proteção de rotas
```

## Papéis

| BD | UI | Pode |
|---|---|---|
| `super_admin` | **Coordenação** | Tudo: criar atividades/eventos/entrevistas de topo, aprovar/rejeitar subtarefas, convidar para entrevistas, concluir eventos, gerir a equipa |
| `admin` | **Membro** | Ver o aprovado, criar subtarefas (passam por aprovação), confirmar entrevistas em que foi convidado |

> Na base de dados os papéis mantêm os nomes do briefing (`admin`/`super_admin`);
> na interface são apresentados como **Membro** e **Coordenação** para evitar a
> confusão de "admin" ser o papel de menor privilégio.

## Fluxos-chave

- **Aprovação:** subtarefas nascem `pendente_aprovacao`; só ficam visíveis na
  tela inicial quando `aprovada`/`concluida` (RLS impõe isto na base de dados).
- **Eventos:** a conclusão é **sempre manual** (nunca calculada), para permitir
  comparar subtarefas concluídas vs. pendentes por responsável no encerramento.
- **Entrevistas:** coordenação convida → convidado confirma em
  "As minhas entrevistas". Só confirmações contam como presença garantida.
- **Contas:** criadas no ecrã **Equipa** pela coordenação (Admin API +
  `pessoas`, que é a fonte da verdade do papel). Não existe registo público.

## Arrancar em local

```bash
npm install
cp .env.example .env.local   # preencher as chaves
npm run dev                  # http://localhost:3000
```

Primeira utilização: abre `/setup` para criar a conta de coordenação
(só funciona enquanto a tabela `pessoas` estiver vazia).

## Base de dados

```bash
supabase link --project-ref zmvqtawocfixphqikndn
supabase db push             # aplica supabase/migrations/
```

## Deploy (Vercel)

1. Importar o repositório na Vercel (framework: Next.js, sem config extra).
2. Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (⚠️ nunca exposta ao browser; usada apenas
     nos server actions da gestão de contas)
3. Recomendado: domínio próprio tipo `gestao.conhecafarmacia.ao`.
4. Depois do primeiro deploy, adicionar o URL de produção a
   `Authentication → URL Configuration` no Supabase (redirect/allow list).
