'use client'

import { useEffect, useOptimistic, useRef, useState, useTransition } from 'react'
import { Check, CheckCheck, Loader2, Pencil, Send, Trash2, X } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import { enviarMensagem, editarMensagem, apagarMensagem, marcarLido } from './actions'

function hora(iso) {
  return new Date(iso).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
}

function dia(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })
}

/**
 * Painel de conversa em tempo real (Supabase Realtime postgres_changes).
 * Reutilizado em três contextos: atividade/evento/entrevista, reunião
 * e DM entre membros — a visibilidade vem das policies RLS da migração
 * 0021, o componente não precisa de saber o contexto.
 */
export default function SecaoConversa({
  canal,
  mensagensIniciais,
  meuId,
  placeholder,
  marcarAoChegar = false,
  mostrarRecibos = false,
  lidosDoParceiro = [],
}) {
  const [mensagens, setMensagens] = useState(mensagensIniciais)
  const [texto, setTexto] = useState('')
  const [editando, setEditando] = useState(null)
  const [textoEdicao, setTextoEdicao] = useState('')
  const [aProcessar, setAProcessar] = useState(false)
  const [erro, setErro] = useState(null)
  // Ids das minhas mensagens que o parceiro já leu (DM). Só atualiza ao
  // abrir — os recibos do outro não propagam em tempo real.
  const [lidos, setLidos] = useState(() => new Set(lidosDoParceiro))
  const [optimistic, adicionarOptimistic] = useOptimistic(
    mensagens,
    (estado, msg) => [...estado, msg]
  )
  const [aEnviar, iniciarEnvio] = useTransition()
  const fimRef = useRef(null)

  // Realtime: novas mensagens de outros (as próprias já entram otimistas)
  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    const c = supabase
      .channel(`chat-${canal}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `canal=eq.${canal}` },
        (payload) => {
          setMensagens((atual) => {
            if (atual.some((m) => m.id === payload.new.id)) return atual
            return [...atual, payload.new]
          })
          // Painel aberto = mensagem vista: sobe o recibo (o badge da
          // navegação desce no próximo refresh da página).
          if (marcarAoChegar && payload.new.autor_id !== meuId) {
            marcarLido(canal)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(c)
    }
  }, [canal, marcarAoChegar, meuId])

  // Abrir o canal conta como ler o que já lá estava
  useEffect(() => {
    if (marcarAoChegar) marcarLido(canal)
  }, [canal, marcarAoChegar])

  // Auto-scroll para a última mensagem
  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [optimistic.length])

  function enviar(e) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    setTexto('')
    setErro(null)
    iniciarEnvio(async () => {
      adicionarOptimistic({
        id: `temp-${Date.now()}`,
        canal,
        autor_id: meuId,
        conteudo: t,
        criado_em: new Date().toISOString(),
        editado_em: null,
        apagada_em: null,
        _otimista: true,
      })
      const r = await enviarMensagem(canal, t)
      if (!r.ok) {
        setErro(r.erro || 'Não foi possível enviar.')
        setTexto(t) // devolve o texto ao campo
      } else {
        // Confirma já: adiciona a mensagem real (o eco do Realtime é
        // deduplicado pelo id no handler acima)
        setMensagens((atual) =>
          atual.some((m) => m.id === r.id)
            ? atual
            : [...atual, { id: r.id, canal, autor_id: meuId, conteudo: t, criado_em: new Date().toISOString(), editado_em: null, apagada_em: null }]
        )
      }
    })
  }

  async function guardarEdicao(e) {
    e.preventDefault()
    const t = textoEdicao.trim()
    if (!t) return
    setAProcessar(true)
    try {
      const r = await editarMensagem(editando, t)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setMensagens((atual) =>
        atual.map((m) => (m.id === editando ? { ...m, conteudo: t, editado_em: new Date().toISOString() } : m))
      )
      setEditando(null)
    } finally {
      setAProcessar(false)
    }
  }

  async function apagar(id) {
    if (!confirm('Apagar esta mensagem?')) return
    setMensagens((atual) => atual.map((m) => (m.id === id ? { ...m, apagada_em: new Date().toISOString(), conteudo: '' } : m)))
    const r = await apagarMensagem(id)
    if (!r.ok) alert(r.erro || 'Não foi possível apagar.')
  }

  // Separa em blocos por dia para os separadores de data
  let ultimoDia = null

  return (
    <div className="flex flex-col">
      <div className="max-h-[420px] overflow-y-auto px-1 py-2 space-y-0.5">
        {optimistic.length === 0 && (
          <p className="text-[13px] text-brand-deep/45 text-center py-8">
            Sem mensagens — começa a conversa.
          </p>
        )}

        {optimistic.map((m) => {
          const meu = m.autor_id === meuId
          const d = dia(m.criado_em)
          const mostraDia = d !== ultimoDia
          ultimoDia = d
          const tick =
            mostrarRecibos && meu && !m._otimista && !m.apagada_em
              ? lidos.has(m.id)
                ? 'read'
                : 'sent'
              : 'none'

          if (mostraDia) {
            return (
              <div key={`dia-${m.id}`}>
                <div className="flex items-center gap-3 py-2">
                  <span className="flex-1 border-t border-brand-divider" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-deep/40">
                    {d}
                  </span>
                  <span className="flex-1 border-t border-brand-divider" />
                </div>
                <LinhaMensagem
                  m={m}
                  meu={meu}
                  meuId={meuId}
                  tick={tick}
                  editando={editando}
                  textoEdicao={textoEdicao}
                  setTextoEdicao={setTextoEdicao}
                  aProcessar={aProcessar}
                  onEditar={() => {
                    setEditando(m.id)
                    setTextoEdicao(m.conteudo)
                  }}
                  onGuardarEdicao={guardarEdicao}
                  onCancelarEdicao={() => setEditando(null)}
                  onApagar={apagar}
                />
              </div>
            )
          }

          return (
            <LinhaMensagem
              key={m.id}
              m={m}
              meu={meu}
              meuId={meuId}
              tick={tick}
              editando={editando}
              textoEdicao={textoEdicao}
              setTextoEdicao={setTextoEdicao}
              aProcessar={aProcessar}
              onEditar={() => {
                setEditando(m.id)
                setTextoEdicao(m.conteudo)
              }}
              onGuardarEdicao={guardarEdicao}
              onCancelarEdicao={() => setEditando(null)}
              onApagar={apagar}
            />
          )
        })}
        <div ref={fimRef} />
      </div>

      {erro && (
        <p className="text-[13px] text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mt-1">
          {erro}
        </p>
      )}

      <form onSubmit={enviar} className="flex items-end gap-2 pt-3 mt-1 border-t border-brand-divider">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              enviar(e)
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder={placeholder || 'Escrever mensagem…'}
          className="form-input flex-1 resize-none min-h-[42px] max-h-32 py-2.5"
        />
        <button
          type="submit"
          disabled={!texto.trim() || aEnviar}
          className="btn btn-primary btn-small shrink-0 h-[42px] px-4 disabled:opacity-50"
          aria-label="Enviar mensagem"
        >
          {aEnviar ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  )
}

function LinhaMensagem({
  m,
  meu,
  tick = 'none',
  editando,
  textoEdicao,
  setTextoEdicao,
  aProcessar,
  onEditar,
  onGuardarEdicao,
  onCancelarEdicao,
  onApagar,
}) {
  const apagada = Boolean(m.apagada_em)

  if (editando === m.id) {
    return (
      <form onSubmit={onGuardarEdicao} className="py-1.5 flex items-center gap-2">
        <input
          value={textoEdicao}
          onChange={(e) => setTextoEdicao(e.target.value)}
          autoFocus
          className="form-input flex-1 py-2 text-sm"
        />
        <button type="submit" disabled={aProcessar || !textoEdicao.trim()} className="btn btn-small btn-primary">
          <Check size={14} />
        </button>
        <button type="button" onClick={onCancelarEdicao} className="btn btn-small btn-ghost border border-brand-divider">
          <X size={14} />
        </button>
      </form>
    )
  }

  return (
    <div className={`group flex flex-col py-1 ${meu ? 'items-end' : 'items-start'}`}>
      {!meu && (
        <span className="text-[11.5px] font-semibold text-brand-deep/55 px-1 mb-0.5">
          {m.autor?.nome ?? 'Membro'}
        </span>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug ${
          apagada
            ? 'bg-transparent border border-dashed border-brand-divider text-brand-deep/35 italic'
            : meu
              ? 'bg-brand-primary text-white rounded-br-md'
              : 'bg-brand-bg-alt border border-brand-divider text-brand-deep rounded-bl-md'
        }`}
      >
        {apagada ? (
          'mensagem removida'
        ) : (
          <>
            <span className="whitespace-pre-wrap break-words">{m.conteudo}</span>
            <span className={`ml-2 text-[10px] align-baseline ${meu ? 'text-white/60' : 'text-brand-deep/40'}`}>
              {m._otimista ? '·' : hora(m.criado_em)}
              {m.editado_em && ' · editada'}
              {tick === 'sent' && <Check size={11} className="inline ml-1 -mt-0.5" aria-label="enviada" />}
              {tick === 'read' && <CheckCheck size={11} className="inline ml-1 -mt-0.5" aria-label="lida" />}
            </span>
          </>
        )}
      </div>

      {!apagada && meu && !m._otimista && (
        <span className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-1">
          <button
            onClick={onEditar}
            aria-label="Editar mensagem"
            className="w-6 h-6 grid place-items-center rounded text-brand-deep/35 hover:text-brand-primary transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onApagar(m.id)}
            aria-label="Apagar mensagem"
            className="w-6 h-6 grid place-items-center rounded text-brand-deep/35 hover:text-red-500 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </span>
      )}
    </div>
  )
}
