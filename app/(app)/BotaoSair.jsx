'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function BotaoSair() {
  const router = useRouter()

  async function sair() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <button
      onClick={sair}
      aria-label="Terminar sessão"
      title="Terminar sessão"
      className="w-9 h-9 grid place-items-center rounded-lg text-brand-deep/50 hover:text-red-600 hover:bg-red-500/10 transition-colors shrink-0"
    >
      <LogOut size={17} />
    </button>
  )
}
