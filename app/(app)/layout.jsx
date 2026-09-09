import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Settings, FolderOpen } from 'lucide-react'
import NavLateral from './NavLateral'
import DrawerMobile from './DrawerMobile'
import BotaoTema from './BotaoTema'
import BotaoSair from './BotaoSair'

export const metadata = { title: 'Início' }

export default async function AppLayout({ children }) {
  const { pessoa } = await getUtilizadorAtual()
  if (!pessoa) redirect('/login')

  const supabase = await createClient()

  // Contadores para os badges da navegação
  const [pendentes, convites] = await Promise.all([
    pessoa.role === 'super_admin'
      ? supabase
          .from('subtarefas')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pendente_aprovacao')
      : Promise.resolve({ count: 0 }),
    supabase
      .from('entrevista_participantes')
      .select('id', { count: 'exact', head: true })
      .eq('pessoa_id', pessoa.id)
      .eq('status', 'convidado'),
  ])

  const nPendentes = pendentes?.count ?? 0
  const nConvites = convites?.count ?? 0

  const items = [
    { href: '/', label: 'Início', icon: 'inicio' },
    { href: '/atividades', label: 'Atividades', icon: 'atividades' },
    ...(pessoa.role === 'super_admin'
      ? [{ href: '/aprovacoes', label: 'Aprovações', icon: 'aprovacoes', badge: nPendentes }]
      : []),
    { href: '/entrevistas', label: 'As minhas entrevistas', icon: 'entrevistas', badge: nConvites },
    { href: '/documentos', label: 'Documentos', icon: 'documentos' },
    { href: '/equipa', label: 'Equipa', icon: 'equipa', soSuper: true },
    { href: '/definicoes', label: 'Definições', icon: 'definicoes' },
  ].filter((i) => !i.soSuper || pessoa.role === 'super_admin')

  return (
    <div className="min-h-dvh bg-brand-bg-alt flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-brand-bg border-r border-brand-divider/60 sticky top-0 h-dvh">
        <div className="p-6">
          <Link href="/" className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/logo-principal-verde.svg" alt="Conheça Farmácia" className="h-10" />
          </Link>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-accent">
            Gestão Interna
          </p>
        </div>

        <NavLateral items={items} />

        <div className="p-4 mt-auto border-t border-brand-divider/60">
          {pessoa.role === 'super_admin' && (
            <Link href="/atividades/nova" className="btn btn-primary w-full mb-3">
              <Plus size={16} />
              Nova atividade
            </Link>
          )}
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-brand-primary text-white grid place-items-center font-bold text-sm shrink-0">
              {iniciais(pessoa.nome)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-deep truncate">{pessoa.nome}</p>
              <p className="text-xs text-brand-deep/50 truncate">
                {pessoa.role === 'super_admin' ? 'Coordenação' : 'Membro'}
              </p>
            </div>
            <BotaoSair />
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-40 bg-brand-bg border-b border-brand-divider/60 pl-2 pr-4 h-16 flex items-center gap-2">
          <DrawerMobile items={items} pessoa={pessoa} />
          <Link href="/" className="flex items-center flex-1 justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/logo-principal-verde.svg" alt="Conheça Farmácia" className="h-8" />
          </Link>
          <div className="flex items-center gap-1 w-18 justify-end">
            <BotaoTema />
            <BotaoSair />
          </div>
        </header>

        <main className="flex-1 py-8 px-4 md:px-8">{children}</main>

        <footer className="px-8 py-4 text-xs text-brand-deep/40">
          Conheça Farmácia · Plataforma de gestão interna
        </footer>
      </div>
    </div>
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
