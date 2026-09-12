'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Bell } from 'lucide-react'

/**
 * Sino de notificações (topbar mobile). O número vem do servidor no
 * primeiro render e é revalidado em cada mudança de rota — evita
 * polling e reflete as marcações-como-lidas ao voltar da página.
 */
export default function SinoNotificacoes({ inicial = 0 }) {
  const pathname = usePathname()
  const [naoLidas, setNaoLidas] = useState(inicial)

  useEffect(() => {
    let ativo = true
    fetch('/api/notificacoes/contador')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (ativo && d && typeof d.naoLidas === 'number') setNaoLidas(d.naoLidas)
      })
      .catch(() => null)
    return () => {
      ativo = false
    }
  }, [pathname])

  return (
    <Link
      href="/notificacoes"
      aria-label={naoLidas > 0 ? `${naoLidas} notificações por ler` : 'Notificações'}
      className="relative w-9 h-9 grid place-items-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white transition-colors"
    >
      <Bell size={18} />
      {naoLidas > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-brand-accent text-white text-[10px] font-bold leading-none">
          {naoLidas > 9 ? '9+' : naoLidas}
        </span>
      )}
    </Link>
  )
}
