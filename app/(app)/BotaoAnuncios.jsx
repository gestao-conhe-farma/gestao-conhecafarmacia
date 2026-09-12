'use client'

import Link from 'next/link'
import { Megaphone } from 'lucide-react'

/**
 * Botão de anúncios para a topbar (a equipa decidiu: fora do
 * sidebar/drawer, que já está cheio). Mostra um contador com os
 * anúncios publicados nos últimos 7 dias — depois desse prazo o ícone
 * fica sem marca (o histórico completo vive em /anuncios e a homepage
 * destaca sempre o mais recente).
 *
 * Variantes de estilo iguais às do sino: "escuro" (topbar mobile) e
 * "claro" (topbar desktop).
 */
export default function BotaoAnuncios({ inicial = 0, variante = 'escuro' }) {
  const classes =
    variante === 'claro'
      ? 'relative w-9 h-9 grid place-items-center rounded-lg text-brand-deep/60 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors'
      : 'relative w-9 h-9 grid place-items-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white transition-colors'

  return (
    <Link
      href="/anuncios"
      aria-label={inicial > 0 ? `${inicial} anúncio(s) recente(s)` : 'Anúncios'}
      className={classes}
    >
      <Megaphone size={18} />
      {inicial > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-brand-accent text-white text-[10px] font-bold leading-none">
          {inicial > 9 ? '9+' : inicial}
        </span>
      )}
    </Link>
  )
}
