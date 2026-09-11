'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { terminarTodasSessoes } from './actions'
import { useConfirmacao } from '@/components/CaixaConfirmacao'

export default function CartaoSessao() {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(false)
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

  async function terminarAqui() {
    setAProcessar(true)
    try {
      // POST via fetch: a rota de logout só aceita POST — uma navegação
      // <a href> fazia GET e recebia 405 sem qualquer erro visível.
      await fetch('/api/auth/logout', { method: 'POST' })
      router.replace('/login')
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  async function terminar() {
    const ok = await pedirConfirmacao({
      titulo: 'Terminar todas as sessões?',
      descricao:
        'A sessão é terminada em TODOS os dispositivos onde tens sessão iniciada.',
      confirmarTxt: 'Terminar sessões',
      perigoso: true,
    })
    if (!ok) return
    setAProcessar(true)
    try {
      await terminarTodasSessoes()
      router.replace('/login')
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-brand-deep/55 mb-5 max-w-md leading-relaxed">
        Podes terminar a sessão em todos os dispositivos de uma vez — útil se
        suspeitares que alguém acedeu à tua conta.
      </p>

      <div className="flex flex-wrap gap-3">
        <button onClick={terminarAqui} disabled={aProcessar} className="btn btn-secondary">
          <LogOut size={16} />
          Terminar sessão aqui
        </button>
        <button onClick={terminar} disabled={aProcessar} className="btn btn-danger">
          {aProcessar ? <Loader2 className="animate-spin" size={17} /> : <LogOut size={17} />}
          {aProcessar ? 'A terminar…' : 'Terminar todas as sessões'}
        </button>
      </div>

      {caixaConfirmacao}
    </div>
  )
}
