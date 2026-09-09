'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, Menu, Moon, Plus, Sun, X, LayoutDashboard, ClipboardList, CheckCircle2, Users, CalendarCheck, Settings, FolderOpen } from 'lucide-react'
import { useTema } from '@/components/TemaProvider'

// Chaves de texto → componentes (ícones não atravessam a fronteira
// Server → Client Components).
const ICONES = {
  inicio: LayoutDashboard,
  atividades: ClipboardList,
  aprovacoes: CheckCircle2,
  entrevistas: CalendarCheck,
  documentos: FolderOpen,
  equipa: Users,
  definicoes: Settings,
}

/**
 * Drawer de navegação mobile (estilo do site público): hamburger na topbar,
 * overlay + painel deslizante da direita, fecha ao navegar, com Esc ou no overlay.
 */
export default function DrawerMobile({ items, pessoa }) {
  const [aberto, setAberto] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { tema, alternarTema } = useTema()

  // Fecha automaticamente ao mudar de rota
  useEffect(() => {
    setAberto(false)
  }, [pathname])

  // Bloqueia o scroll do body enquanto aberto + tecla Esc
  useEffect(() => {
    document.body.style.overflow = aberto ? 'hidden' : ''
    if (!aberto) return
    const onKey = (e) => {
      if (e.key === 'Escape') setAberto(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
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
        onClick={() => setAberto(true)}
        aria-label="Abrir menu"
        aria-expanded={aberto}
        className="lg:hidden w-9 h-9 grid place-items-center rounded-lg text-brand-deep/70 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
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
              className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px]"
            />

            {/* Painel */}
            <motion.aside
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="lg:hidden fixed top-0 right-0 z-50 h-dvh w-[82%] max-w-sm flex flex-col
                bg-gradient-to-b from-brand-bg-alt to-brand-bg
                shadow-[-8px_0_30px_rgba(0,42,50,0.15)]
                overscroll-contain overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Menu de navegação"
            >
              {/* Cabeçalho */}
              <div className="flex items-center justify-between px-5 pt-5">
                <Link href="/" aria-label="Início">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo/logo-principal-verde.svg"
                    alt="Conheça Farmácia"
                    className="h-9"
                  />
                </Link>
                <button
                  onClick={() => setAberto(false)}
                  aria-label="Fechar menu"
                  className="w-9 h-9 grid place-items-center rounded-full text-brand-deep/60 hover:bg-brand-primary/10 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="px-5 mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-accent">
                Gestão Interna
              </p>

              {/* Ação principal */}
              {pessoa.role === 'super_admin' && (
                <div className="px-5 mt-5">
                  <Link href="/atividades/nova" className="btn btn-primary w-full">
                    <Plus size={16} />
                    Nova atividade
                  </Link>
                </div>
              )}

              {/* Navegação */}
              <nav className="flex-1 px-3 py-4 space-y-1">
                {items.map(({ href, label, icon, badge }) => {
                  const Icone = ICONES[icon] ?? ClipboardList
                  const ativo = href === '/' ? pathname === '/' : pathname.startsWith(href)
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                        ativo
                          ? 'bg-brand-primary/10 text-brand-primary'
                          : 'text-brand-deep/75 hover:bg-brand-primary/5 hover:text-brand-deep'
                      }`}
                    >
                      <Icone size={19} className="shrink-0" />
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

              {/* Rodapé: tema + utilizador + sair */}
              <div className="border-t border-brand-divider/60 px-5 py-4 space-y-3">
                <button
                  onClick={alternarTema}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-brand-deep/75 hover:bg-brand-primary/5 transition-colors"
                >
                  {tema === 'escuro' ? <Sun size={18} /> : <Moon size={18} />}
                  {tema === 'escuro' ? 'Tema claro' : 'Tema escuro'}
                </button>

                <div className="flex items-center gap-3 pt-1">
                  <span className="w-9 h-9 rounded-full bg-brand-primary text-white grid place-items-center font-bold text-sm shrink-0">
                    {iniciais(pessoa.nome)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-brand-deep truncate">
                      {pessoa.nome}
                    </p>
                    <p className="text-xs text-brand-deep/50 truncate">
                      {pessoa.role === 'super_admin' ? 'Coordenação' : 'Membro'}
                    </p>
                  </div>
                  <button
                    onClick={sair}
                    aria-label="Terminar sessão"
                    title="Terminar sessão"
                    className="w-9 h-9 grid place-items-center rounded-lg text-brand-deep/50 hover:text-red-600 hover:bg-red-500/10 transition-colors shrink-0"
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
