'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import {
  iniciarAtivacao2FA,
  confirmarAtivacao2FA,
  desativar2FA,
} from './actions'

/**
 * Cartão 2FA/TOTP: ativação com QR + código de 6 dígitos, e desativação
 * com prova de posse. O estado (ativo/inativo) vem do servidor.
 */
export default function CartaoSeguranca({ fatores }) {
  const router = useRouter()
  const fatorAtivo = (fatores ?? []).find((f) => f.status === 'verified')
  const ativo = Boolean(fatorAtivo)

  // Ativação
  const [fase, setFase] = useState('parado') // parado | qr | aConfirmar
  const [qr, setQr] = useState(null)
  const [segredo, setSegredo] = useState(null)
  const [factorId, setFactorId] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState(null)
  const [aProcessar, setAProcessar] = useState(false)

  // Desativação
  const [aDesativar, setADesativar] = useState(false)
  const [codigoDesativar, setCodigoDesativar] = useState('')
  const [erroDesativar, setErroDesativar] = useState(null)

  async function comecar() {
    setErro(null)
    setAProcessar(true)
    try {
      const r = await iniciarAtivacao2FA()
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setQr(r.qr)
      setSegredo(r.segredo)
      setFactorId(r.factorId)
      setFase('qr')
    } finally {
      setAProcessar(false)
    }
  }

  async function confirmar(e) {
    e?.preventDefault()
    setErro(null)
    setAProcessar(true)
    try {
      const r = await confirmarAtivacao2FA(factorId, codigo)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setFase('parado')
      setCodigo('')
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  async function desativar(e) {
    e?.preventDefault()
    setErroDesativar(null)
    setAProcessar(true)
    try {
      const r = await desativar2FA(fatorAtivo?.id, codigoDesativar)
      if (!r.ok) {
        setErroDesativar(r.erro)
        return
      }
      setADesativar(false)
      setCodigoDesativar('')
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-brand-deep/55 mb-5 max-w-md leading-relaxed">
        A verificação em dois passos pede um código da tua app autenticadora
        (Google Authenticator, Authy, 1Password…) para além da palavra-passe.
        {ativo
          ? ' Está ATIVA nesta conta.'
          : ' Recomendado para todas as contas — obrigatório para a coordenação.'}
      </p>

      {ativo ? (
        /* ---------------- 2FA ativo ---------------- */
        !aDesativar ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg bg-brand-accent/10 text-brand-accent px-3 py-1.5 text-sm font-semibold">
              <ShieldCheck size={16} />
              2FA ativa
            </span>
            <button onClick={() => setADesativar(true)} className="btn btn-secondary btn-small">
              <ShieldOff size={14} />
              Desativar…
            </button>
          </div>
        ) : (
          <form onSubmit={desativar} className="max-w-sm space-y-3">
            <label className="form-label">Código atual da app (6 dígitos)</label>
            <input
              className="form-input font-mono tracking-[0.3em] text-center"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              placeholder="000000"
              value={codigoDesativar}
              onChange={(e) => setCodigoDesativar(e.target.value.replace(/[^0-9]/g, ''))}
            />
            {erroDesativar && <p className="text-sm text-red-600">{erroDesativar}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={aProcessar || codigoDesativar.length !== 6} className="btn btn-danger btn-small">
                {aProcessar ? <Loader2 size={14} className="animate-spin" /> : <ShieldOff size={14} />}
                Desativar 2FA
              </button>
              <button type="button" onClick={() => setADesativar(false)} className="btn btn-ghost btn-small border border-brand-divider">
                Cancelar
              </button>
            </div>
          </form>
        )
      ) : (
        /* ---------------- 2FA inativo: ativação ---------------- */
        fase === 'parado' && (
          <button onClick={comecar} disabled={aProcessar} className="btn btn-accent">
            {aProcessar ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
            Ativar verificação em dois passos
          </button>
        )
      )}

      {fase === 'qr' && (
          <div className="max-w-sm space-y-4">
            <ol className="text-sm text-brand-deep/70 space-y-1.5 list-decimal list-inside">
              <li>Abre a tua app autenticadora</li>
              <li>Lê o código QR abaixo</li>
              <li>Insere o código de 6 dígitos que ela mostrar</li>
            </ol>
            <div className="bg-white p-3 rounded-xl w-fit border border-brand-divider">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Código QR da app autenticadora" className="w-44 h-44" />
            </div>
            {segredo && (
              <p className="text-xs text-brand-deep/50 break-all">
                Não consegues ler QR? Insere a chave manual:{' '}
                <code className="font-mono text-brand-deep/70 select-all">{segredo}</code>
              </p>
            )}
            <form onSubmit={confirmar} className="space-y-3">
              <label className="form-label">Código de 6 dígitos</label>
              <input
                className="form-input font-mono tracking-[0.3em] text-center"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                autoFocus
                placeholder="000000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/[^0-9]/g, ''))}
              />
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={aProcessar || codigo.length !== 6} className="btn btn-accent btn-small">
                  {aProcessar ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  Confirmar e ativar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFase('parado')
                    setErro(null)
                    setCodigo('')
                  }}
                  className="btn btn-ghost btn-small border border-brand-divider"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
    </div>
  )
}
