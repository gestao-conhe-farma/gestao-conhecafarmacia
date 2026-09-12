'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LogOut, Menu, Moon, Plus, Sun, X, ChevronRight,
  LayoutDashboard, ClipboardList, CheckCircle2, Users, CalendarCheck, Settings, FolderOpen, MessageCircle,
  Handshake, Stethoscope, Megaphone,
} from 'lucide-react'
import { useTema } from '@/components/TemaProvider'

// Chaves de texto → componentes (ícones não atravessam a fronteira
// Server → Client Components).
const ICONES = {
  inicio: LayoutDashboard,
  atividades: ClipboardList,
  aprovacoes: CheckCircle2,
  entrevistas: CalendarCheck,
  reunioes: MessagesSquare,
  documentos: FolderOpen,
  conversas: MessageCircle,
  entidades: Handshake,
  profissionais: Stethoscope,
  conteudo: Megaphone,
  equipa: Users,
  definicoes: Settings,
}

/**
 * Drawer de navegação mobile: painel estrutural escuro (direção A),
 * overlay + slide com mola, fecha ao navegar, com Esc ou no overlay.
 * Focus preso dentro do painel enquanto aberto.
 */
export default function DrawerMobile({ items, pessoa }) {
  const [aberto, setAberto] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { tema, alternarTema } = useTema()
  const painelRef = useRef(null)
  const botaoRef = useRef(null)

  // Fecha automaticamente ao mudar de rota
  useEffect(() => {
    setAberto(false)
  }, [pathname])

  // Scroll lock + Esc + focus trap + devolver foco ao fechar
  useEffect(() => {
    if (!aberto) return

    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') {
        setAberto(false)
        return
      }
      if (e.key === 'Tab' && painelRef.current) {
        const focaveis = painelRef.current.querySelectorAll(
          'a[href], button:not([disabled])'
        )
        if (!focaveis.length) return
        const primeiro = focaveis[0]
        const ultimo = focaveis[focaveis.length - 1]
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primeiro.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)

    // Foco inicial no painel
    painelRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      // Devolve o foco ao hamburger
      botaoRef.current?.focus()
    }
  }, [aberto])

  async function sair() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <>
      {/* Hamburger (só mobile) */}
      <button
        ref={botaoRef}
        onClick={() => setAberto(true)}
        aria-label="Abrir menu"
        aria-expanded={aberto}
        aria-controls="menu-principal-mobile"
        className="lg:hidden w-10 h-10 grid place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
      >
        <Menu size={20} />
      </button>

      <AnimatePresence>
        {aberto && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setAberto(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/55 backdrop-blur-[2px]"
              aria-hidden="true"
            />

            {/* Painel escuro estrutural */}
            <motion.aside
              key="drawer"
              ref={painelRef}
              tabIndex={-1}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="lg:hidden fixed top-0 right-0 z-50 h-dvh w-[84%] max-w-sm flex flex-col
                bg-sidebar outline-none overflow-y-auto overscroll-contain"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
              id="menu-principal-mobile"
            >
              {/* Cabeçalho */}
              <div className="flex items-center justify-between px-5 pt-5">
                <Link href="/" aria-label="Início">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo/logo-principal-branco.svg"
                    alt="Conheça Farmácia"
                    className="h-8"
                  />
                </Link>
                <button
                  onClick={() => setAberto(false)}
                  aria-label="Fechar menu"
                  className="w-9 h-9 grid place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="px-5 mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
                Gestão Interna
              </p>

              {/* Ação principal */}
              {pessoa.role === 'super_admin' && (
                <div className="px-5 mt-5">
                  <Link href="/atividades/nova" className="btn btn-accent w-full">
                    <Plus size={16} />
                    Nova atividade
                  </Link>
                </div>
              )}

              {/* Navegação numerada */}
              <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Navegação mobile">
                {items.map(({ href, label, icon, badge, num }) => {
                  const Icone = ICONES[icon] ?? ClipboardList
                  const ativo = href === '/' ? pathname === '/' : pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={ativo ? 'page' : undefined}
                      className={`flex items-center gap-3 px-3 py-3 text-[14.5px] border-l-2 transition-colors rounded-r-lg ${
                        ativo
                          ? 'bg-white/[0.07] border-brand-accent text-white font-semibold'
                          : 'border-transparent text-white/65 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold w-5 text-white/30 tabular-nums">{num}</span>
                      <Icone size={17} className="shrink-0" />
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

              {/* Rodapé: tema + utilizador + sair */}
              <div className="border-t border-white/10 px-5 py-4 space-y-2">
                <button
                  onClick={alternarTema}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors"
                >
                  {tema === 'escuro' ? <Sun size={17} /> : <Moon size={17} />}
                  {tema === 'escuro' ? 'Tema claro' : 'Tema escuro'}
                </button>

                <div className="flex items-center gap-3 pt-2">
                  <span className="w-9 h-9 rounded-full bg-white/10 text-white grid place-items-center font-bold text-xs shrink-0">
                    {iniciais(pessoa.nome)}
                  </span>
                  <Link
                    href={`/equipa/${pessoa.id}`}
                    aria-label="Ver o meu perfil"
                    className="min-w-0 flex-1 flex items-center gap-1.5 rounded-lg px-1.5 -mx-1.5 py-1 hover:bg-white/[0.06] transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-white truncate">{pessoa.nome}</span>
                      <span className="block text-[11px] text-white/45 truncate">
                        {pessoa.role === 'super_admin' ? 'Coordenação' : 'Membro'}
                      </span>
                    </span>
                    <ChevronRight size={15} className="text-white/40 shrink-0" aria-hidden="true" />
                  </Link>
                  <button
                    onClick={sair}
                    aria-label="Terminar sessão"
                    className="w-9 h-9 grid place-items-center rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    <LogOut size={17} />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function iniciais(nome) {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}
