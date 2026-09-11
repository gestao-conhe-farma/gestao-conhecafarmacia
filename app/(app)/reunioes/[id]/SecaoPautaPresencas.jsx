'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CalendarCheck, CalendarX, Check, Loader2, UserPlus, UserMinus, X } from 'lucide-react'
import { confirmarPresencaReuniao, desconfirmarPresencaReuniao, marcarPresenca, convocarParticipantes, removerParticipante } from '../actions'
import { useConfirmacao } from '@/components/CaixaConfirmacao'

const PRESENCAS = [
  { v: 'presente', l: 'Presente', cls: 'text-brand-accent border-brand-accent bg-brand-accent/10' },
  { v: 'ausente', l: 'Ausente', cls: 'text-red-600 border-red-500 bg-red-500/10' },
  { v: 'justificado', l: 'Justificado', cls: 'text-amber-600 border-amber-500 bg-amber-500/10' },
]

export default function SecaoPautaPresencas({
  reuniaoId,
  pauta,
  participantes,
  equipa,
  ehSuper,
  meuConvite,
  estado,
  num,
}) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(null)
  const [convocar, setConvocar] = useState(false)
  const [novos, setNovos] = useState([])
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

  const pontosPauta = (pauta || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const confirmados = participantes.filter((p) => p.status === 'confirmado').length
  const presentes = participantes.filter((p) => p.presenca === 'presente').length

  async function confirmar() {
    setAProcessar('eu')
    try {
      await confirmarPresencaReuniao(reuniaoId)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  function pedirDesconfirmar() {
    return pedirConfirmacao({
      titulo: 'Desconfirmar a tua presença?',
      descricao: 'Voltas a ficar como “aguarda confirmação”. Podes confirmar de novo a qualquer momento antes da reunião.',
      confirmarTxt: 'Desconfirmar',
      perigoso: true,
    }).then(async (ok) => {
      if (!ok) return
      setAProcessar('eu')
      try {
        await desconfirmarPresencaReuniao(reuniaoId)
        router.refresh()
      } finally {
        setAProcessar(null)
      }
    })
  }

  async function marcar(pessoaId, valor) {
    setAProcessar(pessoaId)
    try {
      await marcarPresenca(reuniaoId, pessoaId, valor)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  async function convocarSelecionados() {
    setAProcessar('conv')
    try {
      await convocarParticipantes(reuniaoId, novos)
      setConvocar(false)
      setNovos([])
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  async function retirarConvite(pessoaId, nome) {
    const ok = await pedirConfirmacao({
      titulo: `Retirar o convite de ${nome}?`,
      descricao: 'A pessoa deixa de ser convocada e de ver esta reunião como participante.',
      confirmarTxt: 'Retirar convite',
      perigoso: true,
    })
    if (!ok) return
    setAProcessar(pessoaId)
    try {
      await removerParticipante(reuniaoId, pessoaId)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  const idsConvocados = new Set(participantes.map((p) => p.pessoa_id))
  const podeConvocar = ehSuper && estado === 'agendada'

  return (
    <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
      <span className="sec-num">{num}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-deep tracking-tight">Pauta e presenças</h2>
          <span className="text-sm text-brand-deep/45 tabular-nums">
            <strong className="text-brand-deep">{confirmados}</strong> confirmaram
            {presentes > 0 && (
              <>
                {' '}· <strong className="text-brand-deep">{presentes}</strong> presentes
              </>
            )}
          </span>
        </div>

        {/* Pauta */}
        {pontosPauta.length > 0 ? (
          <ol className="mt-4 space-y-2.5 max-w-xl">
            {pontosPauta.map((p, i) => (
              <li key={i} className="flex gap-3 text-[14px] text-brand-deep/80">
                <span className="text-brand-accent font-bold tabular-nums shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {p}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-brand-deep/45 italic">Sem pauta definida.</p>
        )}              {/* Ação própria: confirmar / desconfirmar presença */}
        <div className="mt-5 flex flex-wrap gap-2">
          {meuConvite?.status === 'convidado' && estado === 'agendada' && (
            <button onClick={confirmar} disabled={aProcessar === 'eu'} className="btn btn-accent btn-small">
              {aProcessar === 'eu' ? <Loader2 size={14} className="animate-spin" /> : <CalendarCheck size={14} />}
              Confirmar a minha presença
            </button>
          )}
          {meuConvite?.status === 'confirmado' && estado === 'agendada' && (
            <button onClick={pedirDesconfirmar} disabled={aProcessar === 'eu'} className="btn btn-secondary btn-small">
              {aProcessar === 'eu' ? <Loader2 size={14} className="animate-spin" /> : <CalendarX size={14} />}
              Desconfirmar a minha presença
            </button>
          )}
        </div>

        {/* Lista de convocados */}
        <div className="mt-6 border border-brand-divider rounded-xl overflow-hidden">
          {participantes.length === 0 && (
            <p className="text-sm text-brand-deep/50 px-4 py-5">Nenhum convocado.</p>
          )}
          {participantes.map((p) => {
            const pessoa = p.pessoas
            const meu = p.pessoa_id === meuConvite?.pessoa_id
            return (
              <div
                key={p.pessoa_id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-brand-divider last:border-b-0"
              >
                <span className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary grid place-items-center font-bold text-[11px] shrink-0">
                  {pessoa?.nome?.split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-brand-deep truncate">
                    {pessoa?.nome}
                    {meu && <span className="text-brand-deep/40 font-normal"> (tu)</span>}
                  </p>
                  <p className="text-[11px] text-brand-deep/45">
                    {p.status === 'confirmado' ? 'Presença confirmada' : 'Aguarda confirmação'}
                    {p.presenca && ` · marcado ${p.presenca}`}
                  </p>
                </div>

                {/* Confirmação (o próprio, na sua linha) */}
                {meu && p.status === 'convidado' && estado === 'agendada' && (
                  <span className="text-xs text-brand-accent font-semibold">Aguarda a tua confirmação</span>
                )}
                {/* Retirar convite (superadmin, antes de presença/ata) */}
                {ehSuper && !meu && estado === 'agendada' && !p.presenca && (
                  <button
                    onClick={() => retirarConvite(p.pessoa_id, pessoa?.nome ?? 'membro')}
                    disabled={aProcessar === p.pessoa_id}
                    title={`Retirar convite de ${pessoa?.nome}`}
                    aria-label={`Retirar convite de ${pessoa?.nome}`}
                    className="w-8 h-8 grid place-items-center rounded-lg text-red-500/50 hover:text-red-600 hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    {aProcessar === p.pessoa_id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <UserMinus size={15} />
                    )}
                  </button>
                )}

                {/* Marcação de presença (superadmin, pós-reunião) */}
                {ehSuper && (
                  <div className="flex flex-wrap gap-1.5">
                    {PRESENCAS.map((op) => (
                      <button
                        key={op.v}
                        onClick={() => marcar(p.pessoa_id, p.presenca === op.v ? '' : op.v)}
                        disabled={aProcessar === p.pessoa_id}
                        title={`Marcar ${op.l.toLowerCase()}`}
                        className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold border transition-all ${
                          p.presenca === op.v
                            ? op.cls
                            : 'border-brand-divider text-brand-deep/45 hover:border-brand-accent/40'
                        }`}
                      >
                        {p.presenca === op.v && <Check size={11} className="inline mr-0.5" />}
                        {op.l}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Convocar mais (superadmin) */}
        {podeConvocar && (
          <div className="mt-4">
            {!convocar ? (
              <button onClick={() => setConvocar(true)} className="btn btn-small btn-ghost border border-brand-divider text-brand-deep/70">
                <UserPlus size={14} />
                Convocar mais pessoas
              </button>
            ) : (
              <div className="card p-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {equipa
                    .filter((p) => !idsConvocados.has(p.id))
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setNovos((atual) =>
                            atual.includes(p.id) ? atual.filter((x) => x !== p.id) : [...atual, p.id]
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                          novos.includes(p.id)
                            ? 'border-brand-accent bg-brand-accent/10 text-brand-accent font-semibold'
                            : 'border-brand-divider text-brand-deep/60 hover:border-brand-accent/50'
                        }`}
                      >
                        {p.nome}
                      </button>
                    ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={convocarSelecionados}
                    disabled={novos.length === 0 || aProcessar === 'conv'}
                    className="btn btn-accent btn-small"
                  >
                    {aProcessar === 'conv' ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                    Convocar ({novos.length})
                  </button>
                  <button onClick={() => setConvocar(false)} className="btn btn-small btn-ghost border border-brand-divider">
                    <X size={14} />
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {caixaConfirmacao}
    </section>
  )
}
