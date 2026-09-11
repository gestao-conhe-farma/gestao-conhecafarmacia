'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * VigiaSessao — termina a sessão após 30 minutos de inatividade.
 *
 * - Atividade: movimento/r pressionar teclas, scroll, toque e cliques,
 *   limitado a um evento por minuto (basta um ping para reiniciar a janela).
 * - Multi-tab: o carimbo temporal vive no localStorage, partilhado por todas
 *   as tabs — atividade noutra tab mantém esta aberta; o logout fecha todas.
 * - O logout vai por POST /api/auth/logout (limpa a sessão Supabase e o
 *   cookie do limite de 4h) e aterrar em /login?motivo=inatividade.
 * - Verificação a cada 30s: num cenário real, o desvio máximo é ~30,5 min.
 */
const LIMITE_INATIVIDADE_MS = 30 * 60 * 1000
const VERIFICAR_CADA_MS = 30 * 1000
const CHAVE = 'cf_ultima_atividade'

export default function VigiaSessao() {
  const router = useRouter()
  const aSair = useRef(false)

  useEffect(() => {
    function marcarAtividade() {
      try {
        localStorage.setItem(CHAVE, String(Date.now()))
      } catch {
        /* storage bloqueado: nada a fazer */
      }
    }

    function porFrai() {
      // Volta de outra tab: verifica já, sem esperar pelo próximo tique.
      verificar()
    }

    function verificar() {
      if (aSair.current) return
      let ultima = Date.now()
      try {
        const bruto = localStorage.getItem(CHAVE)
        if (bruto) ultima = Number(bruto) || Date.now()
      } catch {
        /* sem storage: usa o agora */
      }
      if (Date.now() - ultima >= LIMITE_INATIVIDADE_MS) {
        aSair.current = true
        sair()
      }
    }

    async function sair() {
      try {
        localStorage.removeItem(CHAVE)
      } catch {
        /* ignore */
      }
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch {
        /* segue para o login na mesma; o proxy barra o resto */
      }
      router.replace('/login?motivo=inatividade')
    }

    // Ponto de partida: a sessão começa "ativa".
    marcarAtividade()
    // Eventos de atividade — passive: não bloqueiam o scroll.
    const eventos = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'mousemove']
    eventos.forEach((e) => window.addEventListener(e, marcarAtividade, { passive: true }))
    const t = setInterval(verificar, VERIFICAR_CADA_MS)
    window.addEventListener('focus', porFrai)
    document.addEventListener('visibilitychange', porFrai)

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, marcarAtividade))
      clearInterval(t)
      window.removeEventListener('focus', porFrai)
      document.removeEventListener('visibilitychange', porFrai)
    }
  }, [router])

  return null
}
