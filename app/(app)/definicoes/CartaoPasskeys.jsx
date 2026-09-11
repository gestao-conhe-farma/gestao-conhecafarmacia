'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Fingerprint,
  Loader2,
  Pencil,
  Plus,
  Smartphone,
  Trash2,
  X,
} from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'
import {
  registarEventoPasskey,
  renomearPasskey,
  eliminarPasskey,
} from './actions'

/** Mensagens amigáveis para os erros WebAuthn mais comuns (lado browser). */
function erroAmigavel(error) {
  const nome = error?.name ?? ''
  const codigo = error?.code ?? ''
  if (nome === 'NotAllowedError')
    return 'Pedido de biometria cancelado ou expirou — tenta outra vez.'
  if (nome === 'InvalidStateError')
    return 'Este dispositivo já está registado nesta conta.'
  if (nome === 'SecurityError')
    return 'O domínio atual não corresponde ao registo de biometria do projeto.'
  if (codigo === 'webauthn_credential_exists')
    return 'Este dispositivo já está registado nesta conta.'
  if (codigo === 'too_many_passkeys')
    return 'A conta chegou ao limite de dispositivos registados — remove um antes de adicionar outro.'
  if (codigo === 'passkey_disabled')
    return 'A biometria ainda não está ativada no servidor — pede à coordenação para a ativar (Authentication → Passkeys no Supabase).'
  return error?.message || 'Não foi possível completar a operação. Tenta novamente.'
}

function formatarData(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

/**
 * Cartão de passkeys (biometria): registar este dispositivo, listar os
 * registados, renomear e revogar. A cerimónia WebAuthn corre toda no
 * browser (registerPasskey); renomear/eliminar passam pelas server
 * actions para ficarem na trilha de auditoria.
 */
export default function CartaoPasskeys({ passkeysIniciais = [] }) {
  const router = useRouter()

  const [suporte, setSuporte] = useState('a-verificar') // a-verificar | sim | nao | inseguro
  const [aRegistar, setARegistar] = useState(false)
  const [erro, setErro] = useState(null)

  // Renomear inline
  const [idRenomear, setIDRenomear] = useState(null)
  const [novoNome, setNovoNome] = useState('')
  const [aGuardarNome, setAGuardarNome] = useState(false)

  // Eliminar com confirmação inline
  const [idEliminar, setIDEliminar] = useState(null)
  const [aEliminar, setAEliminar] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.isSecureContext) {
      setSuporte('inseguro')
      return
    }
    setSuporte(window.PublicKeyCredential ? 'sim' : 'nao')
  }, [])

  async function registar() {
    setErro(null)
    setARegistar(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.auth.registerPasskey()
      if (error) {
        setErro(erroAmigavel(error))
        return
      }
      // Trilha de auditoria (best-effort) + refrescar a lista do servidor
      if (data?.id) await registarEventoPasskey(data.id)
      router.refresh()
    } catch (e) {
      setErro(erroAmigavel(e))
    } finally {
      setARegistar(false)
    }
  }

  async function guardarNome(e) {
    e?.preventDefault()
    if (!novoNome.trim()) return
    setErro(null)
    setAGuardarNome(true)
    try {
      const r = await renomearPasskey(idRenomear, novoNome)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setIDRenomear(null)
      setNovoNome('')
      router.refresh()
    } finally {
      setAGuardarNome(false)
    }
  }

  async function eliminar(id) {
    setErro(null)
    setAEliminar(true)
    try {
      const r = await eliminarPasskey(id)
      if (!r.ok) {
        setErro(r.erro)
        return
      }
      setIDEliminar(null)
      router.refresh()
    } finally {
      setAEliminar(false)
    }
  }

  const total = passkeysIniciais.length

  return (
    <div>
      <p className="text-sm text-brand-deep/55 mb-5 max-w-md leading-relaxed">
        Regista este dispositivo para entrares com a impressão digital
        (Android), Face ID ou Touch ID (iPhone) — sem escrever palavra-passe.
        A biometria nunca sai do teu dispositivo: o que fica registado é uma
        chave criptográfica única deste aparelho.
      </p>

      {suporte === 'inseguro' && (
        <p className="text-sm text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-4">
          A biometria precisa de uma ligação segura (HTTPS). Abre o site em{' '}
          <strong>gestao.conhecafarmacia.com</strong> para registar o dispositivo.
        </p>
      )}

      {suporte === 'nao' && (
        <p className="text-sm text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-4">
          Este navegador não suporta passkeys/biometria. Usa um navegador
          atualizado (Chrome, Safari, Edge) num telemóvel ou computador recente.
        </p>
      )}

      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4" role="alert">
          {erro}
        </p>
      )}

      {/* Lista de dispositivos registados */}
      {total > 0 && (
        <ul className="divide-y divide-brand-divider border border-brand-divider rounded-xl overflow-hidden mb-5">
          {passkeysIniciais.map((pk) => (
            <li key={pk.id} className="px-4 py-3.5 bg-brand-bg/40">
              {idRenomear === pk.id ? (
                /* -------- renomear inline -------- */
                <form onSubmit={guardarNome} className="flex items-center gap-2">
                  <input
                    className="form-input flex-1 !py-1.5 text-sm"
                    maxLength={120}
                    autoFocus
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex.: iPhone da Maria"
                  />
                  <button
                    type="submit"
                    disabled={aGuardarNome || !novoNome.trim()}
                    className="btn btn-accent btn-small"
                  >
                    {aGuardarNome ? <Loader2 size={14} className="animate-spin" /> : null}
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIDRenomear(null)
                      setNovoNome('')
                    }}
                    className="btn btn-ghost btn-small border border-brand-divider"
                  >
                    <X size={14} />
                  </button>
                </form>
              ) : idEliminar === pk.id ? (
                /* -------- confirmar eliminação -------- */
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-brand-deep/70">
                    Remover <strong>{pk.friendly_name || 'este dispositivo'}</strong>? Deixa de
                    poder entrar com ele.
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => eliminar(pk.id)}
                      disabled={aEliminar}
                      className="btn btn-danger btn-small"
                    >
                      {aEliminar ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Remover
                    </button>
                    <button
                      onClick={() => setIDEliminar(null)}
                      className="btn btn-ghost btn-small border border-brand-divider"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* -------- linha normal -------- */
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary shrink-0">
                    <Smartphone size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-deep truncate">
                      {pk.friendly_name || 'Dispositivo sem nome'}
                    </p>
                    <p className="text-xs text-brand-deep/50">
                      Registado {formatarData(pk.created_at)}
                      {pk.last_used_at ? ` · última utilização ${formatarData(pk.last_used_at)}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setIDRenomear(pk.id)
                        setNovoNome(pk.friendly_name ?? '')
                      }}
                      title="Renomear"
                      className="btn btn-ghost btn-small border border-brand-divider"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setIDEliminar(pk.id)}
                      title="Remover"
                      className="btn btn-ghost btn-small border border-brand-divider text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Registar novo dispositivo */}
      {suporte === 'sim' && (
        <button onClick={registar} disabled={aRegistar} className="btn btn-accent">
          {aRegistar ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          {total === 0 ? 'Registar este dispositivo' : 'Registar outro dispositivo'}
        </button>
      )}

      {total === 0 && suporte === 'sim' && (
        <p className="flex items-center gap-2 text-xs text-brand-deep/45 mt-3">
          <Fingerprint size={13} />
          Nenhum dispositivo registado ainda — o login continua por email e
          palavra-passe.
        </p>
      )}
    </div>
  )
}
