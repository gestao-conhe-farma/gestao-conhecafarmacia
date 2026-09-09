'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { terminarTodasSessoes } from './actions'

export default function CartaoSessao() {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(false)

  async function terminar() {
    if (!confirm('Terminar a sessão em TODOS os dispositivos onde tens sessão iniciada?')) {
      return
    }
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
    <div className="card p-6 md:p-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary grid place-items-center">
          <LogOut size={20} />
        </span>
        <h2 className="font-display text-xl font-bold text-brand-deep">Sessão</h2>
      </div>
      <p className="text-sm text-brand-deep/55 mb-6">
        Podes terminar a sessão em todos os dispositivos de uma vez — útil se
        suspeitares que alguém acedeu à tua conta.
      </p>

      <button onClick={terminar} disabled={aProcessar} className="btn btn-danger w-full">
        {aProcessar ? <Loader2 className="animate-spin" size={17} /> : <LogOut size={17} />}
        {aProcessar ? 'A terminar…' : 'Terminar todas as sessões'}
      </button>
    </div>
  )
}
