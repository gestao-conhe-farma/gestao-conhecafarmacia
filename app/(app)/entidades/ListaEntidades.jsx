'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  CheckCircle2,
  Loader2,
  Pencil,
  Phone,
  Mail,
  Plus,
  Trash2,
  UserX,
  X,
} from 'lucide-react'
import {
  criarEntidade,
  editarEntidade,
  alternarAtivoEntidade,
  eliminarEntidade,
} from './actions'

const TIPOS = [
  { valor: 'parceiro', etiqueta: 'Parceiro' },
  { valor: 'patrocinador', etiqueta: 'Patrocinador' },
  { valor: 'instituicao', etiqueta: 'Instituição' },
  { valor: 'empresa', etiqueta: 'Empresa' },
]

const VAZIO = {
  nome: '',
  tipo: 'parceiro',
  area: '',
  contacto_nome: '',
  contacto_email: '',
  contacto_telefone: '',
  notas: '',
}

function etiquetaTipo(t) {
  return TIPOS.find((x) => x.valor === t)?.etiqueta ?? t
}

function Formulario({ inicial, onGuardar, onCancelar, aGuardar }) {
  const [f, setF] = useState(inicial)
  const set = (k) => (e) => setF((atual) => ({ ...atual, [k]: e.target.value }))

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <div className="form-group !mb-0">
          <label className="form-label">Nome *</label>
          <input className="form-input" value={f.nome} onChange={set('nome')} placeholder="Ordem dos Farmacêuticos" autoFocus />
        </div>
        <div className="form-group !mb-0">
          <label className="form-label">Tipo</label>
          <select className="form-input" value={f.tipo} onChange={set('tipo')}>
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
            ))}
          </select>
        </div>
        <div className="form-group !mb-0">
          <label className="form-label">Área / setor</label>
          <input className="form-input" value={f.area} onChange={set('area')} placeholder="Saúde, educação, indústria farmacêutica…" />
        </div>
        <div className="form-group !mb-0">
          <label className="form-label">Pessoa de contacto</label>
          <input className="form-input" value={f.contacto_nome} onChange={set('contacto_nome')} placeholder="Nome do contato" />
        </div>
        <div className="form-group !mb-0">
          <label className="form-label">Email de contacto</label>
          <input className="form-input" type="email" value={f.contacto_email} onChange={set('contacto_email')} placeholder="geral@entidade.com" />
        </div>
        <div className="form-group !mb-0">
          <label className="form-label">Telefone de contacto</label>
          <input className="form-input" value={f.contacto_telefone} onChange={set('contacto_telefone')} placeholder="+244 923 000 000" />
        </div>
      </div>
      <div className="form-group !mb-0">
        <label className="form-label">Notas</label>
        <textarea className="form-textarea" rows={2} value={f.notas} onChange={set('notas')} placeholder="Protocolo assinado em 2025; apoia eventos com materiais…" />
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={() => onGuardar(f)} disabled={aGuardar} className="btn btn-primary btn-small">
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

export default function ListaEntidades({ iniciais, tipoInicial, verInativas, ehSuper }) {
  const router = useRouter()
  const [tipo, setTipo] = useState(tipoInicial)
  const [verTodos, setVerTodos] = useState(verInativas)
  const [aCriar, setACriar] = useState(false)
  const [idEditando, setIdEditando] = useState(null)
  const [aGuardar, setAGuardar] = useState(false)
  const [erro, setErro] = useState(null)

  function aplicarFiltro(novoTipo, novoVer) {
    const params = new URLSearchParams()
    if (novoTipo) params.set('tipo', novoTipo)
    if (novoVer) params.set('ver', 'todos')
    router.replace(`/entidades${params.toString() ? `?${params}` : ''}`)
  }

  async function guardarNovo(f) {
    setAGuardar(true)
    setErro(null)
    try {
      const r = await criarEntidade(f)
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
      const r = await editarEntidade(id, f)
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

  async function alternarAtivo(ent) {
    await alternarAtivoEntidade(ent.id, !ent.ativo)
    router.refresh()
  }

  async function eliminar(ent) {
    if (!confirm(`Eliminar "${ent.nome}" definitivamente? As ligações a atividades perdem-se.`)) return
    const r = await eliminarEntidade(ent.id)
    if (!r.ok) setErro(r.erro)
    else router.refresh()
  }

  return (
    <div>
      {/* Filtros + adicionar */}
      <div className="flex flex-wrap gap-2 items-center mt-6">
        <button
          onClick={() => {
            setTipo(null)
            aplicarFiltro(null, verTodos ? 'todos' : null)
          }}
          className={`btn btn-small ${!tipo ? 'btn-accent' : 'btn-ghost border border-brand-divider'}`}
        >
          Todas
        </button>
        {TIPOS.map((t) => (
          <button
            key={t.valor}
            onClick={() => {
              setTipo(t.valor)
              aplicarFiltro(t.valor, verTodos ? 'todos' : null)
            }}
            className={`btn btn-small ${tipo === t.valor ? 'btn-accent' : 'btn-ghost border border-brand-divider'}`}
          >
            {t.etiqueta}
          </button>
        ))}
        <span className="flex-1" />
        <button
          onClick={() => {
            const proximo = !verTodos
            setVerTodos(proximo)
            aplicarFiltro(tipo, proximo ? 'todos' : null)
          }}
          className={`btn btn-small ${verTodos ? 'btn-accent' : 'btn-ghost border border-brand-divider'}`}
        >
          {verTodos ? 'Só ativas' : 'Ver inativas'}
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

      {aCriar && (
        <div className="card p-5 mt-4">
          <h3 className="text-sm font-bold text-brand-deep mb-3">Nova entidade</h3>
          <Formulario inicial={VAZIO} onGuardar={guardarNovo} onCancelar={() => setACriar(false)} aGuardar={aGuardar} />
        </div>
      )}

      <ul className="mt-4 grid md:grid-cols-2 gap-3">
        {iniciais.map((ent) => (
          <li key={ent.id} className={`card p-4 ${ent.ativo ? '' : 'opacity-60'}`}>
            {idEditando === ent.id ? (
              <Formulario
                inicial={{
                  ...VAZIO,
                  nome: ent.nome ?? '',
                  tipo: ent.tipo ?? 'parceiro',
                  area: ent.area ?? '',
                  contacto_nome: ent.contacto_nome ?? '',
                  contacto_email: ent.contacto_email ?? '',
                  contacto_telefone: ent.contacto_telefone ?? '',
                  notas: ent.notas ?? '',
                }}
                onGuardar={(f) => guardarEdicao(ent.id, f)}
                onCancelar={() => setIdEditando(null)}
                aGuardar={aGuardar}
              />
            ) : (
              <div>
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
                    <Building2 size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-deep text-[15px] flex items-center gap-2 flex-wrap">
                      {ent.nome}
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-primary/8 text-brand-primary">
                        {etiquetaTipo(ent.tipo)}
                      </span>
                      {!ent.ativo && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-brand-deep/10 text-brand-deep/60">
                          Inativa
                        </span>
                      )}
                    </p>
                    {ent.area && <p className="text-[13px] text-brand-deep/70">{ent.area}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-[12.5px] text-brand-deep/55">
                      {ent.contacto_nome && <span>{ent.contacto_nome}</span>}
                      {ent.contacto_telefone && (
                        <a href={`tel:${ent.contacto_telefone.replace(/\s/g, '')}`} className="flex items-center gap-1 hover:text-brand-primary">
                          <Phone size={12} /> {ent.contacto_telefone}
                        </a>
                      )}
                      {ent.contacto_email && (
                        <a href={`mailto:${ent.contacto_email}`} className="flex items-center gap-1 hover:text-brand-primary">
                          <Mail size={12} /> {ent.contacto_email}
                        </a>
                      )}
                    </div>
                    {ent.notas && <p className="text-[12px] text-brand-deep/50 italic mt-2">{ent.notas}</p>}
                  </div>

                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => setIdEditando(ent.id)} title="Editar" className="btn btn-ghost btn-small border border-brand-divider">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => alternarAtivo(ent)}
                      title={ent.ativo ? 'Marcar inativa' : 'Reativar'}
                      className={`btn btn-ghost btn-small border border-brand-divider ${ent.ativo ? 'text-brand-deep/60' : 'text-green-700'}`}
                    >
                      <UserX size={13} />
                    </button>
                    {ehSuper && (
                      <button onClick={() => eliminar(ent)} title="Eliminar (coordenação)" className="btn btn-ghost btn-small border border-brand-divider text-red-600">
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
            Nenhuma entidade aqui{tipo ? ' com este filtro' : ''} — adiciona a
            primeira parceria ou patrocínio.
          </p>
        </div>
      )}
    </div>
  )
}
