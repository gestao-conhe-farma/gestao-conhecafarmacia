'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Fingerprint, Loader2, LogIn } from 'lucide-react'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

function erroBiometria(error) {
  const nome = error?.name ?? ''
  if (nome === 'NotAllowedError') return null // cancelado pelo utilizador — silencioso
  if (nome === 'SecurityError')
    return 'O domínio atual não corresponde ao registo de biometria do projeto.'
  if (error?.code === 'webauthn_credential_not_found')
    return 'Este dispositivo não está registado em nenhuma conta — entra por email e registra-o nas Definições.'
  if (error?.code === 'passkey_disabled')
    return 'A biometria ainda não está ativada no servidor — entra por email e palavra-passe.'
  return 'A biometria falhou — entra por email e palavra-passe.'
}

export default function FormLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState(null)
  const [aCarregar, setACarregar] = useState(false)
  const [aBiometria, setABiometria] = useState(false)
  const [suporteBiometria, setSuporteBiometria] = useState(false)

  useEffect(() => {
    // Passkeys precisam de WebAuthn + contexto seguro (HTTPS, exceto localhost)
    if (typeof window !== 'undefined' && window.isSecureContext) {
      setSuporteBiometria(Boolean(window.PublicKeyCredential))
    }
  }, [])

  async function submeter(e) {
    e.preventDefault()
    setErro(null)
    setACarregar(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      // Lê o corpo como texto primeiro: se a resposta não for JSON
      // (ex.: HTML de um redirect/erro), o res.json() lançaria e
      // perderíamos a informação toda.
      const texto = await res.text()
      let data = null
      try {
        data = texto ? JSON.parse(texto) : null
      } catch {
        // corpo não-JSON — tratado abaixo
      }

      if (!res.ok) {
        // Sem debug na consola: o corpo podia incluir o email tentado e
        // detalhes internos — fica só a mensagem amigável na UI.
        setErro(
          data?.erro ||
            (data
              ? 'Resposta inesperada do servidor. Tenta novamente.'
              : `Erro do servidor (HTTP ${res.status}). Tenta novamente.`)
        )
        return
      }

      if (!data?.ok) {
        setErro('Resposta inesperada do servidor. Tenta novamente.')
        return
      }

      router.replace('/')
      router.refresh()
    } catch (errRede) {
      // Falha real de rede / DNS / abort — quase nunca acontece.
      setErro(`Erro de rede: ${errRede?.message ?? 'desconhecido'}`)
    } finally {
      setACarregar(false)
    }
  }

  async function entrarComBiometria() {
    setErro(null)
    setABiometria(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.auth.signInWithPasskey()
      if (error) {
        const msg = erroBiometria(error)
        if (msg) setErro(msg)
        return
      }

      // Sessão criada. Carimbar o instante do login para o limite de 4h
      // (o proxy expulsaria a sessão sem este cookie — ver /api/auth/sessao).
      await fetch('/api/auth/sessao', { method: 'POST' }).catch(() => null)

      // Se a conta tiver 2FA ativa, o proxy manda para /login/mfa —
      // basta seguir para a app e deixar o middleware decidir.
      router.replace('/')
      router.refresh()
    } catch (e) {
      const msg = erroBiometria(e)
      if (msg) setErro(msg)
    } finally {
      setABiometria(false)
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={submeter} className="space-y-5">
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className="form-input"
            placeholder="oteu.email@conhecafarmacia.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Palavra-passe
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {erro && (
          <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
            {erro}
          </p>
        )}

        <button type="submit" disabled={aCarregar} className="btn btn-primary w-full">
          {aCarregar ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
          {aCarregar ? 'A entrar…' : 'Entrar'}
        </button>
      </form>

      {suporteBiometria && (
        <>
          <div className="flex items-center gap-3 text-xs text-brand-deep/35">
            <span className="flex-1 border-t border-brand-divider" />
            ou
            <span className="flex-1 border-t border-brand-divider" />
          </div>
          <button
            type="button"
            onClick={entrarComBiometria}
            disabled={aBiometria || aCarregar}
            className="btn btn-secondary w-full"
          >
            {aBiometria ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Fingerprint size={18} />
            )}
            {aBiometria ? 'À espera da biometria…' : 'Entrar com biometria'}
          </button>
        </>
      )}
    </div>
  )
}
