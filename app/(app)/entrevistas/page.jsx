import { Check, CalendarCheck } from 'lucide-react'
import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import CartaoEntrevista from './CartaoEntrevista'

export const metadata = { title: 'As minhas entrevistas' }

export default async function PaginaEntrevistas() {
  const { pessoa } = await getUtilizadorAtual()
  const supabase = await createClient()

  const { data: convites } = await supabase
    .from('entrevista_participantes')
    .select(
      `status,
       atividades(id, titulo, descricao, prazo, criado_em,
         atividade_responsaveis(pessoa_id, pessoas(nome)))`
    )
    .eq('pessoa_id', pessoa.id)
    .order('atividade_id')

  const entrevistas = (convites ?? [])
    .filter((c) => c.atividades)
    .map((c) => ({ ...c.atividades, meu_status: c.status }))

  return (
    <div className="container-app max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-brand-deep mb-2">
        As minhas entrevistas
      </h1>
      <p className="text-brand-deep/60 mb-8">
        Convites de entrevista da coordenação — confirma a tua presença nas que
        vais participar.
      </p>

      {entrevistas.length === 0 ? (
        <div className="card empty-state">
          <CalendarCheck size={36} className="mx-auto mb-3 text-brand-accent/50" />
          <p className="font-semibold text-brand-deep">Sem convites de momento</p>
          <p className="text-sm mt-1">
            Quando a coordenação te convidar para uma entrevista, ela aparece aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entrevistas.map((e) => (
            <CartaoEntrevista key={e.id} entrevista={e} />
          ))}
        </div>
      )}
    </div>
  )
}
