import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUtilizadorAtual } from '@/lib/supabase/server'
import { listarEquipa } from '@/lib/dados'
import FormNovoMembro from './FormNovoMembro'
import ListaEquipa from './ListaEquipa'

export const metadata = { title: 'Equipa' }

/**
 * Directoria da equipa — visível para todos os membros. A coordenação
 * (super_admin) mantém as ações de gestão; os restantes veem a lista
 * em modo de leitura, com link para o perfil de cada pessoa.
 */
export default async function PaginaEquipa() {
  const { pessoa } = await getUtilizadorAtual()
  if (!pessoa) redirect('/login')

  const ehSuper = pessoa.role === 'super_admin'
  const equipa = await listarEquipa()

  return (
    <div className="container-app max-w-[1160px]">
      {/* Cabeçalho editorial com régua forte */}
      <div className="page-head">
        <p className="kicker">Equipa</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Equipa
        </h1>
        <p className="text-brand-deep/60 mt-2 max-w-xl leading-relaxed">
          {ehSuper
            ? 'Sem registo público: as contas são criadas aqui pela coordenação, já com o papel atribuído.'
            : 'Quem faz parte da equipa e como contactar cada pessoa. Toca no número para ligar ou no WhatsApp para conversar.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-10 items-start">
        {/* Membros: tabela editorial */}
        <section className="min-w-0">
          <div className={`table-head grid gap-4 items-center ${ehSuper ? 'grid-cols-[minmax(0,1fr)_120px_40px]' : 'grid-cols-[minmax(0,1fr)_auto]'}`}>
            <span>Membro</span>
            {ehSuper && (
              <>
                <span>Papel</span>
                <span className="text-right">Ações</span>
              </>
            )}
            {!ehSuper && <span className="text-right">Contactos</span>}
          </div>
          <ListaEquipa equipa={equipa} pessoaAtualId={pessoa.id} ehSuper={ehSuper} />
        </section>

        {/* Criar conta: painel em papel alt — só coordenação */}
        {ehSuper && (
          <aside className="panel p-6 md:p-7 lg:sticky lg:top-8 min-w-0">
            <h2 className="text-lg font-bold text-brand-deep tracking-tight">
              Criar conta
            </h2>
            <p className="text-[13px] text-brand-deep/55 mt-1.5 mb-6 leading-relaxed">
              A pessoa recebe estas credenciais e deve alterar a palavra-passe
              depois do primeiro login.
            </p>
            <FormNovoMembro />
          </aside>
        )}
      </div>
    </div>
  )
}
