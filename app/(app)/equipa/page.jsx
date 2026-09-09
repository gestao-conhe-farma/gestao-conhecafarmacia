import { redirect } from 'next/navigation'
import { getUtilizadorAtual } from '@/lib/supabase/server'
import { listarEquipa } from '@/lib/dados'
import FormNovoMembro from './FormNovoMembro'
import ListaEquipa from './ListaEquipa'

export const metadata = { title: 'Equipa' }

export default async function PaginaEquipa() {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') redirect('/')

  const equipa = await listarEquipa()

  return (
    <div className="container-app max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-brand-deep mb-2">Equipa</h1>
      <p className="text-brand-deep/60 mb-8">
        Sem registo público: as contas são criadas aqui pela coordenação, já com o
        papel atribuído.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <div className="card p-6 md:p-8">
            <h2 className="font-display text-xl font-bold text-brand-deep mb-4">
              Membros ({equipa.length})
            </h2>
            <ListaEquipa equipa={equipa} pessoaAtualId={pessoa.id} />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card p-6 md:p-8">
            <h2 className="font-display text-xl font-bold text-brand-deep mb-1">
              Criar conta
            </h2>
            <p className="text-sm text-brand-deep/55 mb-5">
              A pessoa recebe estas credenciais e deve alterar a palavra-passe
              depois do primeiro login.
            </p>
            <FormNovoMembro />
          </div>
        </div>
      </div>
    </div>
  )
}
