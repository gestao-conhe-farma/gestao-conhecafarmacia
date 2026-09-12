'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Pencil,
  Phone,
  Mail,
  Plus,
  Search,
  Trash2,
  UserX,
} from 'lucide-react'
import {
  criarProfissional,
  editarProfissional,
  alternarAtivoProfissional,
  eliminarProfissional,
} from './actions'

const VAZIO = {
  nome: '',
  profissao: '',
  instituicao: '',
  telefone: '',
  email: '',
  temasTexto: '',
  meiosTexto: '',
  disponibilidade: '',
  notas: '',
}

function doFormulario(f) {
  return {
    ...f,
    temas: (f.temasTexto ?? '').split(','),
    meios: (f.meiosTexto ?? '').split(','),
  }
}

function paraFormulario(p) {
  return {
    nome: p.nome ?? '',
    profissao: p.profissao ?? '',
    instituicao: p.instituicao ?? '',
    telefone: p.telefone ?? '',
    email: p.email ?? '',
    temasTexto: (p.temas ?? []).join(', '),
    meiosTexto: (p.meios ?? []).join(', '),
    disponibilidade: p.disponibilidade ?? '',
    notas: p.notas ?? '',
  }
}

function Formulario({ inicial, onGuardar, onCancelar, aGuardar }) {
  const [f, setF] = useState(inicial)
  const set = (k) => (e) => setF((atual) => ({ ...atual, [k]: e.target.value }))

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="form-group !mb-0">
          <label className="form-label">Nome *</label>
          <input className="form-input" value={f.nome} onChange={set('nome')} placeholder="Dr.a Ana Pereira" autoFocus />
        </div>
        <div className="form-group !mb-0">
          <label className="form-label">Profissão / especialidade</label>
          <input className="form-input" value={f.profissao} onChange={set('profissao')} placeholder="Farmacêutica comunitária" />
        </div>
        <div className="form-group !mb-0">
          <label className="form-label">Instituição</label>
          <input className="form-input" value={f.instituicao} onChange={set('instituicao')} placeholder="Farmácia Central / Hospital X" />
        </div>
        <div className="form-group !mb-0">
          <label className="form-label">Disponibilidade</label>
          <input className="form-input" value={f.disponibilidade} onChange={set('disponibilidade')} placeholder="Manhãs de terça · só online" />
        </div>
        <div className="form-group !mb-0">
          <label className="form-label">Telefone *</label>
          <input className="form-input" value={f.telefone} onChange={set('telefone')} placeholder="+244 923 000 000" />
        </div>
        <div className="form-group !mb-0">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={f.email} onChange={set('email')} placeholder="ana@exemplo.com" />
        </div>
      </div>
      <div className="form-group !mb-0">
        <label className="form-label">Temas de conforto (separados por vírgula)</label>
        <input className="form-input" value={f.temasTexto} onChange={set('temasTexto')} placeholder="automedicação, saúde materno-infantil" />
      </div>
      <div className="form-group !mb-0">
        <label className="form-label">Meios onde já participou (separados por vírgula)</label>
        <input className="form-input" value={f.meiosTexto} onChange={set('meiosTexto')} placeholder="Rádio Nacional, TV Zimbo" />
      </div>
      <div className="form-group !mb-0">
        <label className="form-label">Notas internas</label>
        <textarea className="form-textarea" rows={2} value={f.notas} onChange={set('notas')} placeholder="Excelente a explicar para leigos; já falou do tema X em 2025…" />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => onGuardar(doFormulario(f))} disabled={aGuardar} className="btn btn-primary btn-small">
          {aGuardar ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          Guardar
        </button>
        <button onClick={onCancelar} className="btn btn-ghost btn-small border border-brand-divider">
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function ListaProfissionais({ iniciais, filtroInicial, verInativos, ehSuper }) {
  const router = useRouter()
  const [q, setQ] = useState(filtroInicial)
  const [verTodos, setVerTodos] = useState(verInativos)
  const [aCriar, setACriar] = useState(false)
  const [idEditando, setIdEditando] = useState(null)
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState(null)

  function pesquisar(e) {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (verTodos) params.set('ver', 'todos')
    router.replace(`/profissionais${params.toString() ? `?${params}` : ''}`)
  }

  async function guardarNovo(f) {
    setAGuardar(true)
    setErro(null)
    try {
      const r = await criarProfissional(f)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setACriar(false)
      router.refresh()
    } finally {
      setAGuardar(false)
    }
  }

  async function guardarEdicao(id, f) {
    setAGuardar(true)
    setErro(null)
    try {
      const r = await editarProfissional(id, f)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setIdEditando(null)
      router.refresh()
    } finally {
      setAGuardar(false)
    }
  }

  async function alternarAtivo(p) {
    await alternarAtivoProfissional(p.id, !p.ativo)
    router.refresh()
  }

  async function eliminar(p) {
    if (!confirm(`Eliminar "${p.nome}" definitivamente? O histórico de entrevistas ligado a ele perde-se.`)) return
    const r = await eliminarProfissional(p.id)
    if (!r.ok) setErro(r.erro)
    else router.refresh()
  }

  return (
    <div>
      {/* Barra: pesquisa + ver inativos + adicionar */}
      <div className="flex flex-wrap gap-2 items-center mt-6">
        <form onSubmit={pesquisar} className="flex-1 min-w-[200px] relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-deep/35" />
          <input
            className="form-input !pl-9"
            placeholder="Procurar por nome, profissão, instituição…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        <button
          onClick={() => {
            const proximo = !verTodos
            setVerTodos(proximo)
            const params = new URLSearchParams()
            if (q.trim()) params.set('q', q.trim())
            if (proximo) params.set('ver', 'todos')
            router.replace(`/profissionais${params.toString() ? `?${params}` : ''}`)
          }}
          className={`btn btn-small ${verTodos ? 'btn-accent' : 'btn-ghost border border-brand-divider'}`}
        >
          <ChevronDown size={14} />
          {verTodos ? 'Só ativos' : 'Ver inativos'}
        </button>
        <button onClick={() => setACriar(true)} className="btn btn-primary btn-small">
          <Plus size={14} />
          Adicionar
        </button>
      </div>

      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mt-4" role="alert">
          {erro}
        </p>
      )}

      {/* Formulário de criação */}
      {aCriar && (
        <div className="card p-5 mt-4">
          <h3 className="text-sm font-bold text-brand-deep mb-3">Novo profissional</h3>
          <Formulario inicial={VAZIO} onGuardar={guardarNovo} onCancelar={() => setACriar(false)} aGuardar={aGuardar} />
        </div>
      )}

      {/* Lista */}
      <ul className="mt-4 space-y-3">
        {iniciais.map((p) => (
          <li key={p.id} className={`card p-4 ${p.ativo ? '' : 'opacity-60'}`}>
            {idEditando === p.id ? (
              <Formulario
                inicial={paraFormulario(p)}
                onGuardar={(f) => guardarEdicao(p.id, f)}
                onCancelar={() => setIdEditando(null)}
                aGuardar={aGuardar}
              />
            ) : (
              <div>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-deep text-[15px] flex items-center gap-2 flex-wrap">
                      {p.nome}
                      {!p.ativo && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-deep/10 text-brand-deep/60">
                          Indisponível
                        </span>
                      )}
                    </p>
                    {p.profissao && <p className="text-[13px] text-brand-deep/70">{p.profissao}{p.instituicao ? ` · ${p.instituicao}` : ''}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[12.5px] text-brand-deep/55">
                      {p.telefone && (
                        <a href={`tel:${p.telefone.replace(/\s/g, '')}`} className="flex items-center gap-1 hover:text-brand-primary">
                          <Phone size={12} /> {p.telefone}
                        </a>
                      )}
                      {p.email && (
                        <a href={`mailto:${p.email}`} className="flex items-center gap-1 hover:text-brand-primary">
                          <Mail size={12} /> {p.email}
                        </a>
                      )}
                    </div>
                    {p.temas?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.temas.map((t) => (
                          <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-primary/8 text-brand-primary font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.meios?.length > 0 && (
                      <p className="text-[11.5px] text-brand-deep/45 mt-1.5">Já participou: {p.meios.join(' · ')}</p>
                    )}
                    {p.disponibilidade && (
                      <p className="text-[11.5px] text-brand-deep/45 mt-0.5">Disponibilidade: {p.disponibilidade}</p>
                    )}
                    {p.notas && <p className="text-[12px] text-brand-deep/50 italic mt-2">{p.notas}</p>}
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => setIdEditando(p.id)} title="Editar" className="btn btn-ghost btn-small border border-brand-divider">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => alternarAtivo(p)}
                      title={p.ativo ? 'Marcar indisponível' : 'Reativar'}
                      className={`btn btn-ghost btn-small border border-brand-divider ${p.ativo ? 'text-brand-deep/60' : 'text-green-700'}`}
                    >
                      <UserX size={13} />
                    </button>
                    {ehSuper && (
                      <button onClick={() => eliminar(p)} title="Eliminar (coordenação)" className="btn btn-ghost btn-small border border-brand-divider text-red-600">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {!iniciais.length && !aCriar && (
        <div className="card p-10 text-center mt-4">
          <p className="text-sm text-brand-deep/50">
            {filtroInicial
              ? 'Nada encontrado com esse termo.'
              : 'Ainda não há profissionais na lista — adiciona o primeiro. Todos na equipa podem alimentar esta lista.'}
          </p>
        </div>
      )}
    </div>
  )
}
