'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  Users,
  CalendarCheck,
  Settings,
  FolderOpen,
  MessageCircle,
  Handshake,
  Stethoscope,
  Megaphone,
  ChevronDown,
} from 'lucide-react'

// Chaves de texto → componentes (ícones não podem atravessar a fronteira
// Server → Client Components, por isso o layout envia apenas a chave).
const ICONES = {
  inicio: LayoutDashboard,
  atividades: ClipboardList,
  aprovacoes: CheckCircle2,
  entrevistas: CalendarCheck,
  reunioes: CalendarCheck,
  documentos: FolderOpen,
  conversas: MessageCircle,
  entidades: Handshake,
  profissionais: Stethoscope,
  conteudo: Megaphone,
  equipa: Users,
  definicoes: Settings,
}

export default function NavLateral({ items }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto" aria-label="Navegação principal">
      {items.map((item) =>
        item.filhos?.length ? (
          <ItemGrupo key={item.href} item={item} pathname={pathname} />
        ) : (
          <ItemSimples key={item.href} item={item} pathname={pathname} />
        )
      )}
    </nav>
  )
}

/** Item de menu simples — link direto (comportamento anterior). */
function ItemSimples({ item, pathname }) {
  const { href, label, icon, badge, num } = item
  const Icone = ICONES[icon] ?? ClipboardList
  const ativo = href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <Link
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
}

/**
 * Item de grupo com submenu (ex.: Parcerias → Entidades + Profissionais).
 * O cabeçalho navega para o destino principal; a setinha abre/fecha.
 * Abre sozinho quando uma rota filha está ativa.
 */
function ItemGrupo({ item, pathname }) {
  const { href, label, icon, num, filhos } = item
  const Icone = ICONES[icon] ?? ClipboardList
  const grupoAtivo = filhos.some((f) => pathname.startsWith(f.href))
  const [aberto, setAberto] = useState(grupoAtivo)

  // Se o utilizador navegar para uma rota filha (ex.: link interno),
  // o grupo abre — nunca fecha sozinho ao navegar dentro dele.
  useEffect(() => {
    if (grupoAtivo) setAberto(true)
  }, [grupoAtivo])

  return (
    <div>
      <div
        className={`flex items-center gap-3 pl-3 pr-2 py-2.5 text-[13.5px] border-l-2 transition-colors rounded-r-lg ${
          grupoAtivo
            ? 'bg-white/[0.07] border-brand-accent text-white font-semibold'
            : 'border-transparent text-white/60 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        <span className="text-[10px] font-bold w-5 text-white/30 tabular-nums">{num}</span>
        <Icone size={16} className="shrink-0" />
        <Link href={href} className="flex-1 truncate" aria-current={grupoAtivo ? 'page' : undefined}>
          {label}
        </Link>
        <button
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
          aria-label={aberto ? `Fechar submenu de ${label}` : `Abrir submenu de ${label}`}
          className="w-6 h-6 grid place-items-center rounded text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0"
        >
          <ChevronDown size={14} className={`transition-transform duration-200 ${aberto ? '' : '-rotate-90'}`} />
        </button>
      </div>

      {aberto && (
        <div className="mt-0.5 mb-1">
          {filhos.map((f) => {
            const ativo = pathname.startsWith(f.href)
            return (
              <Link
                key={f.href}
                href={f.href}
                aria-current={ativo ? 'page' : undefined}
                className={`flex items-center gap-2.5 pl-14 pr-3 py-2 text-[13px] border-l-2 rounded-r-lg transition-colors ${
                  ativo
                    ? 'border-brand-accent text-white font-semibold bg-white/[0.05]'
                    : 'border-transparent text-white/55 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
