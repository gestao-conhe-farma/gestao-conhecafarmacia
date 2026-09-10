'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowRight,
  Check,
  Loader2,
  Minus,
  Plus,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react'
import { criarPlano, votarPlano, retirarVoto, decidirPlano, converterPlano } from '../actions'
import { useConfirmacao, NotaFlutuante } from '@/components/CaixaConfirmacao'

const VOTOS = [
  { v: 'favor', l: 'A favor', icone: ThumbsUp, cls: 'text-brand-accent border-brand-accent bg-brand-accent/10' },
  { v: 'contra', l: 'Contra', icone: ThumbsDown, cls: 'text-red-600 border-red-500 bg-red-500/10' },
  { v: 'abstencao', l: 'Abstenção', icone: Minus, cls: 'text-amber-600 border-amber-500 bg-amber-500/10' },
]

export default function SecaoPlanos({ reuniaoId, planos, equipa, pessoaAtualId, ehSuper, ataPublicada, num }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(null)
  const [novoAberto, setNovoAberto] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [convertendo, setConvertendo] = useState(null) // planoId quando mini-form aberto
  const [aviso, setAviso] = useState(null)
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

  async function acao(fn, chave) {
    setAProcessar(chave)
    try {
      const r = await fn()
      if (!r?.ok) setAviso(r?.erro || 'Ocorreu um erro.')
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  async function criarNovo(e) {
    e.preventDefault()
    await acao(() => criarPlano(reuniaoId, { titulo, descricao }), 'novo')
    setNovoAberto(false)
    setTitulo('')
    setDescricao('')
  }

  return (
    <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
      <span className="sec-num">{num}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-deep tracking-tight">Planos</h2>
          {ehSuper && (
            <button
              onClick={() => setNovoAberto((v) => !v)}
              className="btn btn-small btn-ghost border border-brand-divider text-brand-deep/70"
            >
              {novoAberto ? <X size={14} /> : <Plus size={14} />}
              {novoAberto ? 'Cancelar' : 'Propor plano'}
            </button>
          )}
        </div>
        <p className="text-[13.5px] text-brand-deep/55 mt-1 max-w-xl">
          Planos propostos pela coordenação — a equipa vota e a coordenação decide.
          Aprovados podem tornar-se atividades ou eventos.
        </p>

        {/* Novo plano (superadmin) */}
        {novoAberto && ehSuper && (
          <form onSubmit={criarNovo} className="card p-4 mt-4 space-y-3 max-w-2xl">
            <input
              className="form-input"
              placeholder="Título do plano"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
            <textarea
              className="form-textarea text-sm"
              rows={3}
              placeholder="Descrição / contexto (opcional)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            <button type="submit" disabled={aProcessar === 'novo'} className="btn btn-primary btn-small">
              {aProcessar === 'novo' && <Loader2 size={14} className="animate-spin" />}
              Adicionar plano
            </button>
          </form>
        )}

        {/* Lista */}
        {planos.length === 0 ? (
          <p className="mt-5 text-sm text-brand-deep/45 italic">
            Sem planos nesta reunião.
          </p>
        ) : (
          <div className="mt-5 space-y-4 max-w-2xl">
            {planos.map((plano) => {
              const contagem = { favor: 0, contra: 0, abstencao: 0 }
              plano.reuniao_plano_votos?.forEach((v) => {
                if (contagem[v.voto] !== undefined) contagem[v.voto]++
              })
              const meuVoto = plano.reuniao_plano_votos?.find((v) => v.pessoa_id === pessoaAtualId)
              const decidido = plano.decisao !== 'pendente'

              return (
                <div key={plano.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-brand-deep text-[15px]">{plano.titulo}</p>
                      {plano.descricao && (
                        <p className="text-sm text-brand-deep/65 mt-1 whitespace-pre-line leading-relaxed">
                          {plano.descricao}
                        </p>
                      )}
                      <p className="text-[11px] text-brand-deep/40 mt-2">
                        proposto por {plano.criado_por?.nome}
                      </p>
                    </div>
                    <span
                      className={`badge shrink-0 normal-case ${
                        plano.decisao === 'aprovado'
                          ? 'badge-status-confirmado'
                          : plano.decisao === 'rejeitado'
                            ? 'bg-red-500/10 text-red-600'
                            : 'badge-status-pendente'
                      }`}
                    >
                      {plano.decisao === 'aprovado'
                        ? 'Aprovado'
                        : plano.decisao === 'rejeitado'
                          ? 'Rejeitado'
                          : 'Em votação'}
                    </span>
                  </div>

                  {/* Contagem + votação */}
                  <div className="mt-4 pt-4 border-t border-brand-divider/70 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-brand-deep/50 mr-2 tabular-nums">
                      {contagem.favor} a favor · {contagem.contra} contra · {contagem.abstencao} abstenções
                    </span>
                    {!decidido &&
                      VOTOS.map(({ v, l, icone: Icone, cls }) => (
                        <button
                          key={v}
                          onClick={() =>
                            meuVoto?.voto === v
                              ? acao(() => retirarVoto(plano.id), plano.id)
                              : acao(() => votarPlano(plano.id, v), plano.id)
                          }
                          disabled={aProcessar === plano.id}
                          className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold border transition-all ${
                            meuVoto?.voto === v ? cls : 'border-brand-divider text-brand-deep/45 hover:border-brand-accent/40'
                          }`}
                          title={meuVoto?.voto === v ? 'Retirar voto' : `Votar ${l.toLowerCase()}`}
                        >
                          <Icone size={11} className="inline mr-1" />
                          {l}
                        </button>
                      ))}
                  </div>

                  {/* Decisão (superadmin) */}
                  {ehSuper && !decidido && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => acao(() => decidirPlano(reuniaoId, plano.id, 'aprovado'), `d-${plano.id}`)}
                        disabled={aProcessar === `d-${plano.id}`}
                        className="btn btn-small btn-accent"
                      >
                        <Check size={13} />
                        Aprovar
                      </button>
                      <button
                        onClick={async () => {
                          const ok = await pedirConfirmacao({
                            titulo: `Rejeitar o plano “${plano.titulo}”?`,
                            confirmarTxt: 'Rejeitar',
                            perigoso: true,
                          })
                          if (!ok) return
                          acao(() => decidirPlano(reuniaoId, plano.id, 'rejeitado'), `d-${plano.id}`)
                        }}
                        disabled={aProcessar === `d-${plano.id}`}
                        className="btn btn-small btn-ghost border border-red-500/30 text-red-600"
                      >
                        <X size={13} />
                        Rejeitar
                      </button>
                    </div>
                  )}

                  {/* Conversão (mini-form) */}
                  {plano.decisao === 'aprovado' && (
                    <div className="mt-4 pt-4 border-t border-brand-divider/70">
                      {plano.atividade_id ? (
                        <Link
                          href={`/atividades/${plano.atividade_id}`}
                          className="text-sm font-semibold text-brand-accent hover:underline inline-flex items-center gap-1.5"
                        >
                          Tornou-se {plano.tipo_atividade === 'evento' ? 'evento' : 'atividade'} — abrir
                          <ArrowRight size={14} />
                        </Link>
                      ) : ehSuper ? (
                        convertendo === plano.id ? (
                          <MiniFormConversao
                            plano={plano}
                            equipa={equipa}
                            reuniaoId={reuniaoId}
                            onConcluido={() => setConvertendo(null)}
                            aProcessar={aProcessar}
                            setAProcessar={setAProcessar}
                            acao={acao}
                          />
                        ) : (
                          <button
                            onClick={() => setConvertendo(plano.id)}
                            className="btn btn-accent btn-small"
                          >
                            <Plus size={14} />
                            Tornar atividade/evento
                          </button>
                        )
                      ) : (
                        <p className="text-sm text-brand-deep/50 italic">
                          A aguardar conversão pela coordenação.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {caixaConfirmacao}
        {aviso && <NotaFlutuante mensagem={aviso} aoFechar={() => setAviso(null)} />}
      </div>
    </section>
  )
}

/** Mini-form: tipo + prazo + responsáveis → cria atividade/evento ligado. */
function MiniFormConversao({ plano, equipa, reuniaoId, onConcluido, aProcessar, setAProcessar, acao }) {
  const [tipo, setTipo] = useState('atividade')
  const [prazo, setPrazo] = useState('')
  const [responsaveis, setResponsaveis] = useState([])

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-deep/45">
        Converter em
      </p>
      <div className="flex gap-2">
        {['atividade', 'evento'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`filter-btn capitalize ${tipo === t ? 'active' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>
      <input
        type="datetime-local"
        className="form-input"
        value={prazo}
        onChange={(e) => setPrazo(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {equipa.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() =>
              setResponsaveis((atual) =>
                atual.includes(p.id) ? atual.filter((x) => x !== p.id) : [...atual, p.id]
              )
            }
            className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
              responsaveis.includes(p.id)
                ? 'border-brand-accent bg-brand-accent/10 text-brand-accent font-semibold'
                : 'border-brand-divider text-brand-deep/60 hover:border-brand-accent/50'
            }`}
          >
            {p.nome}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() =>
            acao(
              () => converterPlano(reuniaoId, plano.id, { tipo, prazo: prazo || null, responsaveis }),
              `c-${plano.id}`
            )
          }
          disabled={aProcessar === `c-${plano.id}`}
          className="btn btn-primary btn-small"
        >
          {aProcessar === `c-${plano.id}` ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          Criar
        </button>
        <button onClick={onConcluido} className="btn btn-small btn-ghost border border-brand-divider">
          Cancelar
        </button>
      </div>
    </div>
  )
}
