'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  Users,
  CalendarCheck,
  Settings,
  FolderOpen,
  MessagesSquare,
  Handshake,
  Stethoscope,
} from 'lucide-react'

// Chaves de texto → componentes (ícones não podem atravessar a fronteira
// Server → Client Components, por isso o layout envia apenas a chave).
const ICONES = {
  inicio: LayoutDashboard,
  atividades: ClipboardList,
  aprovacoes: CheckCircle2,
  entrevistas: CalendarCheck,
  reunioes: MessagesSquare,
  documentos: FolderOpen,
  entidades: Handshake,
  profissionais: Stethoscope,
  equipa: Users,
  definicoes: Settings,
}

export default function NavLateral({ items }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto" aria-label="Navegação principal">
      {items.map(({ href, label, icon, badge, num }) => {
        const Icone = ICONES[icon] ?? ClipboardList
        const ativo = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 text-[13.5px] border-l-2 transition-colors rounded-r-lg ${
              ativo
                ? 'bg-white/[0.07] border-brand-accent text-white font-semibold'
                : 'border-transparent text-white/60 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <span className="text-[10px] font-bold w-5 text-white/30 tabular-nums">{num}</span>
            <Icone size={16} className="shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {badge > 0 && (
              <span className="min-w-5 h-5 px-1.5 grid place-items-center rounded-full bg-brand-accent text-white text-[10.5px] font-bold">
                {badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
