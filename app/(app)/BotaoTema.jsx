'use client'

import { Moon, Sun } from 'lucide-react'
import { useTema } from '@/components/TemaProvider'

/**
 * Alternar tema. Duas variantes de estilo:
 *  - "topbar"  (padrão): sobre fundo claro
 *  - "sidebar": sobre o fundo escuro da sidebar
 */
export default function BotaoTema({ variante = 'topbar' }) {
  const { tema, alternarTema } = useTema()

  const classes =
    variante === 'sidebar'
      ? 'w-9 h-9 grid place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors shrink-0'
      : 'w-9 h-9 grid place-items-center rounded-lg text-brand-deep/60 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors'

  return (
    <button
      onClick={alternarTema}
      aria-label="Alternar tema"
      title={tema === 'escuro' ? 'Tema claro' : 'Tema escuro'}
      className={classes}
    >
      {tema === 'escuro' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
