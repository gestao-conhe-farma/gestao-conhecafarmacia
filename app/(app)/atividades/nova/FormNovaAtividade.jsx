'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus } from 'lucide-react'
import { criarAtividade } from '../actions'

export default function FormNovaAtividade({ equipa, pessoaAtualId, eventos }) {
  const router = useRouter()
  const [tipo, setTipo] = useState('atividade')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [prazo, setPrazo] = useState('')
  const [responsaveis, setResponsaveis] = useState([pessoaAtualId])
  const [parent, setParent] = useState('')
  const [participantes, setParticipantes] = useState([])
  const [localEvento, setLocalEvento] = useState('')
  const [materiais, setMateriais] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [publicoAlvo, setPublicoAlvo] = useState('')
  const [publicoEsperado, setPublicoEsperado] = useState('')
  const [aCarregar, setACarregar] = useState(false)
  const [erro, setErro] = useState(null)

  function alternarPessoa(id, lista, setLista) {
    setLista((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]
    )
  }

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setACarregar(true)
    try {
      const payload = {
        tipo,
        titulo,
        descricao: descricao || null,
        prazo: prazo || null,
        responsaveis,
        parent_id: parent || null,
        participantes: tipo === 'entrevista' ? participantes : [],
        local: localEvento || null,
        materiais: materiais || null,
        orcamento: orcamento === '' ? null : orcamento,
        publico_alvo: publicoAlvo || null,
        publico_esperado: publicoEsperado === '' ? null : publicoEsperado,
      }
      const r = await criarAtividade(payload)
      if (!r.ok) {
        setErro(r.erro || 'Não foi possível criar a atividade.')
        return
      }
      router.push(`/atividades/${r.id}`)
    } finally {
      setACarregar(false)
    }
  }

  return (
    <form onSubmit={submeter} className="space-y-6">
      {/* Tipo */}
      <div className="form-group">
        <span className="form-label">Tipo</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {['atividade', 'evento', 'entrevista'].map((t) => (
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
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="titulo">Título</label>
        <input
          id="titulo"
          className="form-input"
          required
          placeholder="Ex.: Campanha de rastreio de tensão arterial"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="descricao">Descrição</label>
        <textarea
          id="descricao"
          className="form-textarea"
          placeholder="Contexto, objetivos, notas…"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label" htmlFor="prazo">Prazo (opcional)</label>
          <input
            id="prazo"
            type="datetime-local"
            className="form-input"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
          />
        </div>

        {/* Subordinar a um evento */}
        <div className="form-group">
          <label className="form-label" htmlFor="parent">
            Subordinar a evento (opcional)
          </label>
          <select
            id="parent"
            className="form-select"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
          >
            <option value="">— Nenhum —</option>
            {eventos?.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.titulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Detalhes do evento/entrevista */}
      {(tipo === 'evento' || tipo === 'entrevista') && (
        <div className="form-group">
          <label className="form-label" htmlFor="local-ev">Local</label>
          <input
            id="local-ev"
            className="form-input"
            placeholder="Sala, endereço ou link da videochamada"
            value={localEvento}
            onChange={(e) => setLocalEvento(e.target.value)}
          />
        </div>
      )}

      {tipo === 'evento' && (
        <>
          <div className="form-group">
            <span className="form-label">
              Materiais necessários{' '}<span className="text-brand-deep/40 font-normal">(opcional — um por linha)</span>
            </span>
            <textarea
              id="materiais-ev"
              className="form-textarea"
              rows={3}
              placeholder={'Ex.:\nTensiómetros × 4\nÁlcool e algodão\nCartazes A3'}
              value={materiais}
              onChange={(e) => setMateriais(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="orcamento-ev">
                Orçamento estimado <span className="text-brand-deep/40 font-normal">(MZN, opcional)</span>
              </label>
              <input
                id="orcamento-ev"
                type="number"
                min="0"
                step="0.01"
                className="form-input"
                placeholder="0,00"
                value={orcamento}
                onChange={(e) => setOrcamento(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="publico-esperado-ev">
                Participantes esperados <span className="text-brand-deep/40 font-normal">(opcional)</span>
              </label>
              <input
                id="publico-esperado-ev"
                type="number"
                min="0"
                className="form-input"
                placeholder="Ex.: 120"
                value={publicoEsperado}
                onChange={(e) => setPublicoEsperado(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="publico-alvo-ev">
              Público-alvo <span className="text-brand-deep/40 font-normal">(opcional)</span>
            </label>
            <input
              id="publico-alvo-ev"
              className="form-input"
              placeholder="Ex.: Residentes do bairro Polana Caniço"
              value={publicoAlvo}
              onChange={(e) => setPublicoAlvo(e.target.value)}
            />
          </div>
        </>
      )}

      {/* Responsáveis */}
      <div className="form-group">
        <span className="form-label">Responsáveis</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {equipa.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => alternarPessoa(p.id, responsaveis, setResponsaveis)}
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
      </div>

      {/* Participantes da entrevista */}
      {tipo === 'entrevista' && (
        <div className="form-group">
          <span className="form-label">Participantes convidados</span>
          <p className="text-xs text-brand-deep/50 mt-0.5 mb-2">
            Os convidados recebem a entrevista em “As minhas entrevistas” e
            confirmam presença.
          </p>
          <div className="flex flex-wrap gap-2">
            {equipa.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => alternarPessoa(p.id, participantes, setParticipantes)}
                className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                  participantes.includes(p.id)
                    ? 'border-[#ff6c23] bg-[#ff6c23]/10 text-[#ff6c23] font-semibold'
                    : 'border-brand-divider text-brand-deep/60 hover:border-[#ff6c23]/50'
                }`}
              >
                {p.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          {erro}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={aCarregar} className="btn btn-primary">
          {aCarregar ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          {aCarregar ? 'A criar…' : 'Criar atividade'}
        </button>
      </div>
    </form>
  )
}
