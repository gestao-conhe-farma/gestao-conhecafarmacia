'use client'

import { Monitor } from 'lucide-react'
import { useTema } from '@/components/TemaProvider'

export default function CartaoAparencia() {
  const { tema, alternarTema } = useTema()
  const escuro = tema === 'escuro'

  return (
    <div>
      <button
        onClick={alternarTema}
        className="w-full flex items-center justify-between p-4 rounded-xl border border-brand-divider bg-brand-card hover:border-brand-accent/50 transition-colors max-w-md"
      >
        <span className="flex items-center gap-3">
          {escuro ? <Moon size={18} className="text-brand-accent" /> : <Sun size={18} className="text-amber-500" />}
          <span className="font-semibold text-brand-deep text-sm">
            Tema {escuro ? 'escuro' : 'claro'}
          </span>
        </span>
        <span
          className={`relative w-11 h-6 rounded-full transition-colors ${escuro ? 'bg-brand-accent' : 'bg-brand-divider'}`}
          role="switch"
          aria-checked={escuro}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
              escuro ? 'left-[22px]' : 'left-0.5'
            }`}
          />
        </span>
      </button>

      <p className="text-xs text-brand-deep/45 mt-3 flex items-center gap-1.5">
        <Monitor size={13} />
        A preferência fica guardada neste dispositivo.
      </p>
    </div>
  )
}
