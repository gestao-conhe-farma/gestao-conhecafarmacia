'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  List,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import { desativarConteudo, eliminarConteudo, publicarConteudo } from './actions'
import { CORES_ESTADO, CORES_PLATAFORMA, rotuloEstado, rotuloPlataforma } from './constants'
import FormConteudo from './FormConteudo'
import CalendarioConteudo from './CalendarioConteudo'

function dataCurta(iso) {
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`)
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

function semanaDe(iso) {
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`)
  const segunda = new Date(d)
  segunda.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  segunda.setHours(0, 0, 0, 0)
  const domingo = new Date(segunda)
  domingo.setDate(segunda.getDate() + 6)
  return { segunda, domingo }
}

function rotuloSemana(iso) {
  const { segunda, domingo } = semanaDe(iso)
  const mesmoMes = segunda.getMonth() === domingo.getMonth()
  const opt = { day: '2-digit', month: 'short' }
  return mesmoMes
    ? `${segunda.toLocaleDateString('pt-PT', { day: '2-digit' })}–${domingo.toLocaleDateString('pt-PT', opt)}`
    : `${segunda.toLocaleDateString('pt-PT', opt)} – ${domingo.toLocaleDateString('pt-PT', opt)}`
}

/**
 * Vista dupla do calendário editorial: Lista (agrupada por semana —
 * "os temas que vão sair nesta e nas próximas semanas") e Calendário
 * (mês com pontos por plataforma). Filtro de estado partilhado.
 */
export default function ListaConteudo({ iniciais, ehSuper }) {
  const router = useRouter()
  const [vista, setVista] = useState('lista')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [diaSelecionado, setDiaSelecionado] = useState(null)
  const [aCriar, setACriar] = useState(false)
  const [idEditando, setIdEditando] = useState(null)
  const [idPublicando, setIdPublicando] = useState(null)
  const [linkPublicacao, setLinkPublicacao] = useState('')
  const [aProcessar, setAProcessar] = useState(false)
  const [erro, setErro] = useState(null)

  const visiveis = useMemo(() => {
    let lista = iniciais.filter((c) => c.ativo)
    if (estadoFiltro !== 'todos') lista = lista.filter((c) => c.estado === estadoFiltro)
    if (diaSelecionado) lista = lista.filter((c) => String(c.data_publicacao).slice(0, 10) === diaSelecionado)
    return lista
  }, [iniciais, estadoFiltro, diaSelecionado])

  // Agrupamento por semana (segunda → domingo), do mais próximo ao mais distante
  const semanas = useMemo(() => {
    const mapa = new Map()
    for (const c of visiveis) {
      const chave = semanaDe(c.data_publicacao).segunda.toISOString().slice(0, 10)
      ;(mapa.get(chave) ?? mapa.set(chave, []).get(chave)).push(c)
    }
    return [...mapa.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([segunda, itens]) => ({
        chave: segunda,
        rotulo: rotuloSemana(`${segunda}T12:00:00`),
        estaSemana: chaveEstaSemana(segunda),
        itens,
      }))
  }, [visiveis])

  // Temas que saem nesta semana — destaque no topo da lista
  const destaSemana = useMemo(
    () => semanas.find((s) => s.estaSemana)?.itens ?? [],
    [semanas]
  )

  const totalPorEstado = useMemo(() => {
    const conta = { todos: 0 }
    for (const c of iniciais.filter((x) => x.ativo)) {
      conta.todos += 1
      conta[c.estado] = (conta[c.estado] ?? 0) + 1
    }
    return conta
  }, [iniciais])

  async function marcarPublicado(id) {
    setAProcessar(true)
    setErro(null)
    try {
      const r = await publicarConteudo(id, linkPublicacao)
      if (!r.ok) setErro(r.erro)
      else {
        setIdPublicando(null)
        setLinkPublicacao('')
        router.refresh()
      }
    } finally {
      setAProcessar(false)
    }
  }

  async function alternarAtivo(c) {
    const r = await desativarConteudo(c.id, !c.ativo)
    if (!r.ok) setErro(r.erro)
    else router.refresh()
  }

  async function eliminar(c) {
    if (!confirm(`Apagar "${c.titulo}" definitivamente? Esta ação não tem volta.`)) return
    const r = await eliminarConteudo(c.id)
    if (!r.ok) setErro(r.erro)
    else router.refresh()
  }

  function itemCard(c) {
    const plataforma = CORES_PLATAFORMA[c.plataforma] ?? CORES_PLATAFORMA.instagram
    const estado = CORES_ESTADO[c.estado] ?? CORES_ESTADO.ideia
    const passou = new Date(`${String(c.data_publicacao).slice(0, 10)}T23:59:59`) < new Date()

    return (
      <li key={c.id} className="py-3.5 flex items-start gap-3">
        <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${plataforma.dot}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded ${plataforma.chip}`}>
              {plataforma.label}
            </span>
            <span className="text-[11px] font-semibold text-brand-deep/45 tabular-nums">
              {dataCurta(c.data_publicacao)}
            </span>
            <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded ${estado.chip}`}>
              {estado.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-brand-deep mt-1">{c.titulo}</p>
          {c.descricao && <p className="text-[12px] text-brand-deep/50 mt-0.5 line-clamp-2">{c.descricao}</p>}
          {c.link_publicacao && (
            <a
              href={c.link_publicacao}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11.5px] text-brand-accent hover:underline mt-1"
            >
              <ExternalLink size={11} /> Ver publicação
            </a>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {c.estado !== 'publicado' && (
            <button
              onClick={() => {
                setIdPublicando(idPublicando === c.id ? null : c.id)
                setLinkPublicacao(c.link_publicacao ?? '')
              }}
              title="Marcar como publicado"
              className="btn btn-ghost btn-small border border-brand-divider text-brand-accent"
            >
              <CheckCircle2 size={13} />
            </button>
          )}
          <button
            onClick={() => setIdEditando(idEditando === c.id ? null : c.id)}
            title="Editar"
            className="btn btn-ghost btn-small border border-brand-divider"
          >
            <Pencil size={13} />
          </button>
          <button onClick={() => alternarAtivo(c)} title="Arquivar" className="btn btn-ghost btn-small border border-brand-divider text-brand-deep/50">
            <RotateCcw size={13} />
          </button>
          {ehSuper && (
            <button onClick={() => eliminar(c)} title="Apagar (coordenação)" className="btn btn-ghost btn-small border border-brand-divider text-red-600">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </li>
    )
  }

  return (
    <div>
      {/* Barra: vista + filtro de estado + novo */}
      <div className="flex flex-wrap gap-2 items-center mt-6">
        <div className="flex rounded-lg border border-brand-divider overflow-hidden">
          <button
            onClick={() => setVista('lista')}
            className={`px-3 py-2 text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors ${
              vista === 'lista' ? 'bg-brand-primary text-white' : 'text-brand-deep/60 hover:bg-brand-primary/5'
            }`}
          >
            <List size={14} /> Lista
          </button>
          <button
            onClick={() => setVista('calendario')}
            className={`px-3 py-2 text-[12.5px] font-semibold flex items-center gap-1.5 transition-colors ${
              vista === 'calendario' ? 'bg-brand-primary text-white' : 'text-brand-deep/60 hover:bg-brand-primary/5'
            }`}
          >
            <CalendarDays size={14} /> Calendário
          </button>
        </div>

        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value)}
          className="form-input !w-auto !py-2 text-[12.5px]"
          aria-label="Filtrar por estado"
        >
          <option value="todos">Todos os estados ({totalPorEstado.todos})</option>
          {Object.entries(CORES_ESTADO).map(([valor, { label }]) => (
            <option key={valor} value={valor}>
              {label} ({totalPorEstado[valor] ?? 0})
            </option>
          ))}
        </select>

        {diaSelecionado && (
          <button
            onClick={() => setDiaSelecionado(null)}
            className="btn btn-ghost btn-small border border-brand-divider text-brand-accent"
          >
            Dia: {dataCurta(diaSelecionado)} ✕
          </button>
        )}

        <button onClick={() => setACriar(true)} className="btn btn-primary btn-small ml-auto">
          <Plus size={14} />
          Novo tema
        </button>
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mt-4" role="alert">
          {erro}
        </p>
      )}

      {/* Formulário de criação */}
      {aCriar && (
        <div className="mt-4">
          <FormConteudo
            dataSugerida={diaSelecionado}
            onFechar={() => setACriar(false)}
          />
        </div>
      )}

      {/* Vista lista: semanas */}
      {vista === 'lista' && (
        <div className="mt-6">
          {visiveis.length === 0 && !aCriar ? (
            <div className="card p-10 text-center">
              <p className="text-sm text-brand-deep/50">
                {estadoFiltro !== 'todos' || diaSelecionado
                  ? 'Nada com este filtro.'
                  : 'O calendário está vazio — adiciona o primeiro tema. Toda a equipa pode alimentar.'}
              </p>
            </div>
          ) : (
            <>
              {/* Destaque: o que sai esta semana */}
              {destaSemana.length > 0 && (
                <div className="card p-5 border-l-4 border-l-brand-accent mb-6">
                  <h3 className="text-sm font-bold text-brand-deep flex items-center gap-2">
                    Sai esta semana
                    <span className="badge badge-status-aprovada normal-case">{destaSemana.length}</span>
                  </h3>
                  <ul className="divide-y divide-brand-divider/70 mt-1">
                    {destaSemana.map(itemCard)}
                  </ul>
                </div>
              )}

              {/* Próximas semanas */}
              <ul className="space-y-5">
                {semanas
                  .filter((s) => !s.estaSemana)
                  .map((s) => (
                    <li key={s.chave}>
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-deep/40 mb-1">
                        Semana de {s.rotulo}
                      </p>
                      <ul className="divide-y divide-brand-divider/70">{s.itens.map(itemCard)}</ul>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Vista calendário */}
      {vista === 'calendario' && (
        <div className="mt-6 card p-5">
          <CalendarioConteudo
            conteudos={iniciais.filter((c) => c.ativo)}
            onSelecionarDia={setDiaSelecionado}
            diaSelecionado={diaSelecionado}
          />
          {diaSelecionado && (
            <div className="mt-5 pt-4 border-t border-brand-divider/70">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-deep/40 mb-1">
                {dataCurta(diaSelecionado)}
              </p>
              {visiveis.length === 0 ? (
                <p className="text-sm text-brand-deep/50 py-4 text-center">Nada marcado neste dia.</p>
              ) : (
                <ul className="divide-y divide-brand-divider/70">{visiveis.map(itemCard)}</ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edição inline */}
      {idEditando && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-brand-bg w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[90dvh] overflow-y-auto">
            <FormConteudo
              inicial={iniciais.find((c) => c.id === idEditando)}
              onFechar={() => setIdEditando(null)}
            />
          </div>
          <button className="hidden" aria-hidden="true" />
        </div>
      )}

      {/* Publicar: pedir o link */}
      {idPublicando && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-brand-bg w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5">
            <p className="text-sm font-bold text-brand-deep">Marcar como publicado</p>
            <p className="text-[12.5px] text-brand-deep/55 mt-1">
              Cola o link da publicação (fica como arquivo do tema).
            </p>
            <input
              value={linkPublicacao}
              onChange={(e) => setLinkPublicacao(e.target.value)}
              placeholder="https://…"
              className="form-input mt-3 w-full"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIdPublicando(null)} className="btn btn-ghost btn-small border border-brand-divider">
                Cancelar
              </button>
              <button
                onClick={() => marcarPublicado(idPublicando)}
                disabled={aProcessar}
                className="btn btn-primary btn-small"
              >
                {aProcessar && <Loader2 size={13} className="animate-spin" />}
                Publicado
              </button>
            </div>
          </div>
          <button className="hidden" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}

function chaveEstaSemana(chaveSegunda) {
  const agora = new Date()
  const segunda = new Date(`${chaveSegunda}T12:00:00`)
  const ref = new Date(agora)
  ref.setDate(agora.getDate() - ((agora.getDay() + 6) % 7))
  ref.setHours(12, 0, 0, 0)
  return segunda.getTime() === ref.getTime()
}
