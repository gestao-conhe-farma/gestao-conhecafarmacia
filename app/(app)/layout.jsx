import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
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
  const [pendentes, convites, reunioesPendentes] = await Promise.all([
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
    supabase
      .from('reuniao_participantes')
      .select('id', { count: 'exact', head: true })
      .eq('pessoa_id', pessoa.id)
      .eq('status', 'convidado'),
  ])

  const nPendentes = pendentes?.count ?? 0
  const nConvites = convites?.count ?? 0
  const nConvocorias = reunioesPendentes?.count ?? 0

  const items = [
    { href: '/', label: 'Início', icon: 'inicio' },
    { href: '/atividades', label: 'Atividades', icon: 'atividades' },
    ...(pessoa.role === 'super_admin'
      ? [{ href: '/aprovacoes', label: 'Aprovações', icon: 'aprovacoes', badge: nPendentes }]
      : []),
    { href: '/entrevistas', label: 'As minhas entrevistas', icon: 'entrevistas', badge: nConvites },
    { href: '/reunioes', label: 'Reuniões', icon: 'reunioes', badge: nConvocorias },
    { href: '/documentos', label: 'Documentos', icon: 'documentos' },
    { href: '/equipa', label: 'Equipa', icon: 'equipa', soSuper: true },
    { href: '/definicoes', label: 'Definições', icon: 'definicoes' },
  ]
    .filter((i) => !i.soSuper || pessoa.role === 'super_admin')
    // Numeração estrutural da direção A (01, 02, …)
    .map((i, idx) => ({ ...i, num: String(idx + 1).padStart(2, '0') }))

  return (
    <div className="min-h-dvh bg-brand-bg-alt flex">
      {/* Sidebar estrutural — sempre escura, nos dois temas */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-sidebar sticky top-0 h-dvh">
        <div className="px-6 pt-7 pb-6">
          <Link href="/" className="block" aria-label="Início">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/logo-principal-branco.svg" alt="Conheça Farmácia" className="h-8" />
          </Link>
          <p className="mt-2.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
            Gestão Interna
          </p>
        </div>

        <NavLateral items={items} />

        <div className="px-4 pb-5 mt-auto">
          {pessoa.role === 'super_admin' && (
            <Link href="/atividades/nova" className="btn btn-accent w-full mb-4">
              <Plus size={16} />
              Nova atividade
            </Link>
          )}
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <span className="w-9 h-9 rounded-full bg-white/10 text-white grid place-items-center font-bold text-xs shrink-0">
              {iniciais(pessoa.nome)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-white truncate">{pessoa.nome}</p>
              <p className="text-[11px] text-white/45 truncate">
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
        <header className="lg:hidden sticky top-0 z-40 bg-sidebar border-b border-white/10 pl-2 pr-4 h-16 flex items-center gap-2">
          <DrawerMobile items={items} pessoa={pessoa} />
          <Link href="/" className="flex items-center flex-1 justify-center" aria-label="Início">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/logo-principal-branco.svg" alt="Conheça Farmácia" className="h-7" />
          </Link>
          <div className="flex items-center gap-1">
            <BotaoTema />
            <BotaoSair />
          </div>
        </header>

        <main className="flex-1 py-8 md:py-10 px-5 md:px-10">{children}</main>

        <footer className="px-6 md:px-10 py-5 text-[11.5px] text-brand-deep/40 flex items-center justify-between border-t border-brand-divider/60">
          <span>Conheça Farmácia · Plataforma de gestão interna</span>
          <span className="hidden sm:inline">Acesso restrito à equipa</span>
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
