# Proposta arquivada — Chat entre membros + chat geral

> Arquivado em setembro de 2026. Avaliação de valor a longo prazo e plano de
> implementação, para retomar quando a equipa decidir avançar. Não está no
> roteiro ativo (`melhorias.md`).

## Veredicto

**Sim, mas com um repto estratégico:** um chat *genérico* compete diretamente
com o WhatsApp, que a equipa já usa — e perde. Ninguém abre duas apps de
mensagens. O valor real de um chat **dentro** desta app é o que o WhatsApp não
tem: **contexto**. A mensagem nascida colada à atividade, à reunião, à
subtarefa — pesquisável, com histórico, sem se perder entre grupos pessoais.

| Modalidade | Valor a longo prazo | Risco |
|---|---|---|
| **Chat geral da equipa** | 🟡 Médio — substitui o grupo WhatsApp da coordenação; conveniente, mas não transformador | Ser pouco usado ("já temos WhatsApp") |
| **DMs entre membros** | 🟡 Médio — útil para coordenar sem sair da app | Igual ao de cima |
| **Discussão por atividade/reunião** | 🔴 **Alto — é a peça que falta** — comentários sobre a palestra, decisões da ata, links de vídeo da entrevista, tudo junto do trabalho | Baixo — não compete com nada, é um "comments" layer |

**Recomendação:** construir os três sobre a mesma infraestrutura, mas o
sucesso a longo prazo depende do terceiro. O chat geral e as DMs são a porta
de entrada; as discussões contextuais são o que faz a app ser, daqui a um ano,
a memória completa do trabalho.

## Como implementar

**Stack: Supabase Realtime — nada novo para introduzir.** O Realtime vem
incluído no Supabase (`postgres_changes` + `presence`), e o
`lib/supabase/browser.js` já existe. Uma tabela `mensagens` com RLS de
membros autenticados cobre tudo:

- `canal` = `geral` (chat da equipa), `dm:<pessoaA>:<pessoaB>` (ordenar ids),
  ou `atividade:<id>` / `reuniao:<id>` (contextual — criado à primeira mensagem)
- `autor_id`, `conteudo`, `criado_em`, `editado_em`
- Stream em tempo real com `supabase.channel(...).on('postgres_changes', ...)`
- **Fase 1**: chat geral + DMs, com presença (quem está online) e @menções
  (reusam o motor de notificações in-app que já existe)
- **Fase 2**: separador "Conversa" dentro de cada atividade/reunião — o canal
  `atividade:<id>` aparece colado à página; é aqui que o histórico ganha valor
- **Fase 3 (opcional)**: Web Push para mensagens quando a app está fechada —
  o `sw.js` do PWA é a base natural

## Ressalvas

- **Free tier do Supabase Realtime:** limites de conexões concorrentes e
  mensagens/minuto — folgado para uma equipa pequena, mas anotar para escalar.
- **Retenção:** o chat vira mais um arquivo de memória institucional — entra
  no mesmo barco dos backups (item 6 do roteiro).
- **Adoção:** o maior risco não é técnico. Lançar só o chat geral = morre.
  Lançar *com* as discussões por atividade tem razão para ser usado.

Estimativa: Fase 1 + @menções num único ciclo de trabalho (migration 0019+
quando chegar a vez).
