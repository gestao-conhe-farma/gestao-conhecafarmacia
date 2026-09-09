'use client'

import { Moon, Sun } from 'lucide-react'
import { useTema } from '@/components/TemaProvider'

export default function BotaoTema() {
  const { tema, alternarTema } = useTema()

  return (
    <button
      onClick={alternarTema}
      aria-label="Alternar tema"
      className="w-9 h-9 grid place-items-center rounded-lg text-brand-deep/60 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
    >
      {tema === 'escuro' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
