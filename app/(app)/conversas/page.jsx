import Link from 'next/link'
import { MessageSquare, Users } from 'lucide-react'
import { exigirUtilizador } from '@/lib/supabase/server'
import { listarConversasDM, listarEquipa, naoLidasDM } from '@/lib/dados'

export const metadata = { title: 'Conversas' }

/**
 * Hub de mensagens diretas entre membros: conversas existentes (última
 * mensagem à frente) e a equipa toda para iniciar novas. Sem chat geral
 * — por decisão, esse papel fica no WhatsApp; aqui é contexto de
 * trabalho: DMs + conversas coladas a atividades e reuniões.
 */
export default async function PaginaConversas() {
  const { pessoa } = await exigirUtilizador()

  const [conversas, equipa, naoLidas] = await Promise.all([
    listarConversasDM(pessoa.id).catch(() => []),
    listarEquipa(),
    naoLidasDM(pessoa.id).catch(() => new Map()),
  ])

  const comConversa = new Set(conversas.map((c) => c.parceiroId))
  const semConversa = equipa.filter((p) => p.id !== pessoa.id && !comConversa.has(p.id))

  return (
    <div className="container-app max-w-3xl">
      <div className="page-head">
        <p className="kicker">Equipa</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Conversas
        </h1>
        <p className="text-brand-deep/60 mt-2 max-w-xl leading-relaxed">
          Mensagens diretas entre membros. Para conversar sobre um trabalho
          concreto, usa a secção “Conversa” dentro da atividade ou reunião.
        </p>
      </div>

      {/* Conversas em curso */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-brand-deep mb-3">
          <span className="text-brand-accent text-[11px] font-bold tracking-[0.14em] mr-2.5">01</span>
          Em curso
        </h2>

        {conversas.length === 0 ? (
          <div className="card empty-state border-dashed">
            <MessageSquare size={34} className="mx-auto mb-3 text-brand-accent/50" />
            <p className="font-semibold text-brand-deep">Sem conversas ainda</p>
            <p className="text-sm mt-1">
              Escolhe um membro da equipa abaixo para começar.
            </p>
          </div>
        ) : (
          <ul className="border-t border-brand-divider">
            {conversas.map((c) => (
              <li key={c.canal} className="border-b border-brand-divider">
                <Link
                  href={`/conversas/${c.parceiroId}`}
                  className="flex items-center gap-4 py-3.5 px-1 -mx-1 hover:bg-brand-primary/[0.03] transition-colors"
                >
                  <Iniciais nome={c.parceiro.nome} role={c.parceiro.role} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[14.5px] font-semibold text-brand-deep truncate">
                        {c.parceiro.nome}
                      </span>
                      {!c.parceiro.ativo && (
                        <span className="text-[11px] font-normal text-brand-deep/40">ex-membro</span>
                      )}
                      {(naoLidas.get(c.canal) ?? 0) > 0 && (
                        <span
                          title={`${naoLidas.get(c.canal)} não lida(s)`}
                          className="w-2 h-2 rounded-full bg-teal-500 shrink-0"
                        />
                      )}
                    </span>
                    <span className="block text-[13px] text-brand-deep/50 truncate mt-0.5">
                      {c.ultima.apagada_em
                        ? 'mensagem removida'
                        : `${c.ultima.autor_id === pessoa.id ? 'Tu: ' : ''}${c.ultima.conteudo}`}
                    </span>
                  </span>
                  <span className="text-[11px] text-brand-deep/40 shrink-0 tabular-nums">
                    {new Date(c.ultima.criado_em).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Começar nova conversa */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-brand-deep mb-3">
          <span className="text-brand-accent text-[11px] font-bold tracking-[0.14em] mr-2.5">02</span>
          Nova conversa
        </h2>

        {semConversa.length === 0 ? (
          <p className="text-sm text-brand-deep/50 py-4">
            Já tens conversas com toda a equipa ativa.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {semConversa.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/conversas/${p.id}`}
                  className="panel px-4 py-3 flex items-center gap-3.5 hover:border-brand-accent/50 transition-colors"
                >
                  <Iniciais nome={p.nome} role={p.role} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-brand-deep truncate">{p.nome}</span>
                    <span className="block text-[12px] text-brand-deep/45">
                      {p.role === 'super_admin' ? 'Coordenação' : 'Membro'}
                    </span>
                  </span>
                  <MessageSquare size={15} className="text-brand-deep/30 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-xs text-brand-deep/45 flex items-start gap-2">
        <Users size={13} className="mt-0.5 shrink-0 text-brand-accent" />
        As conversas sobre atividades e reuniões vivem nas respetivas páginas —
        com histórico, ligações a quem trabalha e visibilidade certa.
      </p>
    </div>
  )
}

function Iniciais({ nome, role }) {
  return (
    <span
      className={`w-10 h-10 rounded-full grid place-items-center font-bold text-xs shrink-0 ${
        role === 'super_admin'
          ? 'bg-brand-primary text-white'
          : 'bg-brand-bg-alt border border-brand-divider text-brand-deep'
      }`}
      aria-hidden="true"
    >
      {nome.split(/\s+/).slice(0, 2).map((x) => x[0].toUpperCase()).join('')}
    </span>
  )
}
