import Link from 'next/link'
import { CalendarDays, Plus, Settings, Zap } from 'lucide-react'
import { exigirUtilizador } from '@/lib/supabase/server'
import { listarReunioes, obterConfiguracaoReunioes } from '@/lib/dados'
import ListaReunioes from './ListaReunioes'
import PainelRecorrencia from './PainelRecorrencia'
import AbasVisibilidade from './AbasVisibilidade'

export const metadata = { title: 'Reuniões' }

export default async function PaginaReunioes({ searchParams }) {
  const { pessoa } = await exigirUtilizador()
  const ehSuper = pessoa.role === 'super_admin'

  const [reunioes, config, params] = await Promise.all([
    listarReunioes(),
    obterConfiguracaoReunioes(),
    searchParams,
  ])

  // Abas de visibilidade — só a coordenação as vê/usa
  const abaVis = ehSuper && ['equipa', 'coordenacao'].includes(params?.vis)
    ? params.vis
    : 'todas'

  const agora = new Date()
  const visiveis = abaVis === 'todas'
    ? reunioes
    : reunioes.filter((r) => (r.visibilidade ?? 'equipa') === abaVis)
  const futuras = visiveis
    .filter((r) => r.estado === 'agendada' && new Date(r.data_hora) >= agora)
    .reverse()
  const passadas = visiveis.filter(
    (r) => r.estado !== 'agendada' || new Date(r.data_hora) < agora
  )

  return (
    <div className="container-app">
      <div className="page-head">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Equipa</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
              Reuniões
            </h1>
            <p className="text-brand-deep/60 mt-2 max-w-xl leading-relaxed">
              Mensais e urgentes — pauta, presenças, notas da equipa, planos
              votados e ata final.
            </p>
          </div>
          {ehSuper && (
            <div className="flex gap-2 shrink-0">
              <Link href="#recorrencia" className="btn btn-small btn-ghost border border-brand-divider">
                <Settings size={15} />
                Regra mensal
              </Link>
              <Link href="/reunioes/nova" className="btn btn-primary">
                <Plus size={16} />
                Nova reunião
              </Link>
            </div>
          )}
        </div>
      </div>

      {ehSuper && (
        <div id="recorrencia" className="mt-2 scroll-mt-24">
          <PainelRecorrencia config={config} />
        </div>
      )}

      {/* Abas de visibilidade — só coordenação */}
      {ehSuper && (
        <div className="mt-2">
          <AbasVisibilidade atual={abaVis} />
        </div>
      )}

      {/* Próximas */}
      <section className="mt-9">
        <h2 className="text-lg font-bold text-brand-deep mb-3">
          <span className="text-brand-accent text-[11px] font-bold tracking-[0.14em] mr-2.5">01</span>
          Próximas
        </h2>
        {futuras.length === 0 ? (
          <div className="card empty-state border-dashed">
            <CalendarDays size={34} className="mx-auto mb-3 text-brand-accent/50" />
            <p className="font-semibold text-brand-deep">
              {abaVis === 'coordenacao' ? 'Sem reuniões privadas' : 'Sem reuniões agendadas'}
            </p>
            <p className="text-sm mt-1">
              {abaVis === 'coordenacao'
                ? 'Cria uma reunião com a visibilidade “Só coordenação” para a ver aqui.'
                : ehSuper
                  ? 'Define a regra mensal ou cria a primeira reunião.'
                  : 'Quando a coordenação convocar uma reunião, aparece aqui.'}
            </p>
          </div>
        ) : (
          <ListaReunioes reunioes={futuras} pessoaAtualId={pessoa.id} ehSuper={ehSuper} futuras />
        )}
      </section>

      {/* Passadas */}
      <section className="mt-10">
        <h2 className="text-lg font-bold text-brand-deep mb-3">
          <span className="text-brand-accent text-[11px] font-bold tracking-[0.14em] mr-2.5">02</span>
          Histórico
        </h2>
        {passadas.length === 0 ? (
          <p className="text-sm text-brand-deep/50 py-4">
            Ainda não há reuniões realizadas.
          </p>
        ) : (
          <ListaReunioes reunioes={passadas} pessoaAtualId={pessoa.id} ehSuper={ehSuper} />
        )}
      </section>

      {/* Urgentes — atalho visual para a coordenação */}
      {ehSuper && (
        <p className="mt-8 text-xs text-brand-deep/45 flex items-center gap-2">
          <Zap size={13} className="text-amber-500" />
          Precisas de uma reunião urgente? Usa “Nova reunião” e escolhe o tipo urgente.
        </p>
      )}
    </div>
  )
}
