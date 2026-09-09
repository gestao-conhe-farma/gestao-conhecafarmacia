'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, CheckCircle2, Users, CalendarCheck, Settings, FolderOpen } from 'lucide-react'

// Chaves de texto → componentes (ícones não podem atravessar a fronteira
// Server → Client Components, por isso o layout envia apenas a chave).
const ICONES = {
  inicio: LayoutDashboard,
  atividades: ClipboardList,
  aprovacoes: CheckCircle2,
  entrevistas: CalendarCheck,
  documentos: FolderOpen,
  equipa: Users,
  definicoes: Settings,
}

export default function NavLateral({ items }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
      {items.map(({ href, label, icon, badge }) => {
        const Icone = ICONES[icon] ?? ClipboardList
        const ativo = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              ativo
                ? 'bg-brand-primary/10 text-brand-primary'
                : 'text-brand-deep/70 hover:bg-brand-primary/5 hover:text-brand-deep'
            }`}
          >
            <Icone size={18} className="shrink-0" />
            <span className="flex-1">{label}</span>
            {badge > 0 && (
              <span className="min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-brand-accent text-white text-[11px] font-bold">
                {badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
