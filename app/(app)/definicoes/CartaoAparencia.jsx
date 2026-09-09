'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useTema } from '@/components/TemaProvider'

export default function CartaoAparencia() {
  const { tema, alternarTema } = useTema()
  const escuro = tema === 'escuro'

  return (
    <div className="card p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary grid place-items-center">
          {escuro ? <Moon size={20} /> : <Sun size={20} />}
        </span>
        <h2 className="font-display text-xl font-bold text-brand-deep">Aparência</h2>
      </div>

      <button
        onClick={alternarTema}
        className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-brand-divider/60 hover:border-brand-accent/50 transition-colors"
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
