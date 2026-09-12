import { ArrowRight, Megaphone } from 'lucide-react'
import { exigirUtilizador } from '@/lib/supabase/server'
import { listarAnuncios, formatarData } from '@/lib/dados'
import FormAnuncio, { BotaoRemoverAnuncio } from './FormAnuncio'

export const metadata = { title: 'Anúncios' }

/**
 * Anúncios da coordenação para toda a equipa: comunicados gerais e
 * resumos de reuniões publicados como anúncio. Histórico do mais
 * recente para o mais antigo (os desativados ficam fora — a coordenação
 * remove-os daqui com o botão).
 */
export default async function PaginaAnuncios() {
  const { pessoa } = await exigirUtilizador()
  const ehSuper = pessoa.role === 'super_admin'

  const anuncios = await listarAnuncios().catch(() => [])

  return (
    <div className="container-app max-w-3xl">
      <div className="page-head">
        <p className="kicker">Equipa</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Anúncios
        </h1>
        <p className="text-brand-deep/60 mt-2 max-w-xl leading-relaxed">
          Comunicados da coordenação para toda a equipa — e os resumos das
          reuniões que a coordenação destacar.
        </p>
      </div>

      {ehSuper && <FormAnuncio />}

      {anuncios.length === 0 ? (
        <div className="card empty-state border-dashed mt-6">
          <Megaphone size={34} className="mx-auto mb-3 text-brand-accent/50" />
          <p className="font-semibold text-brand-deep">Sem anúncios de momento</p>
          <p className="text-sm mt-1">
            {ehSuper
              ? 'Usa o formulário acima para comunicar algo a toda a equipa.'
              : 'Quando a coordenação publicar um comunicado, aparece aqui.'}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {anuncios.map((a, i) => (
            <li key={a.id} className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10.5px] font-bold tracking-[0.16em] uppercase text-brand-accent flex items-center gap-2">
                    <span className="text-[11px] font-bold tabular-nums opacity-60">
                      {String(anuncios.length - i).padStart(2, '0')}
                    </span>
                    {a.reuniao ? 'Resumo de reunião' : 'Comunicado'}
                  </p>
                  <h2 className="text-lg font-bold text-brand-deep mt-1.5 tracking-tight">
                    {a.titulo}
                  </h2>
                </div>
                {ehSuper && <BotaoRemoverAnuncio anuncioId={a.id} />}
              </div>

              <p className="text-sm leading-relaxed text-brand-deep/85 whitespace-pre-line mt-3">
                {a.corpo}
              </p>

              {a.link && (
                <a
                  href={a.link}
                  className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-brand-accent hover:underline mt-3"
                >
                  Clica aqui para ver mais
                  <ArrowRight size={14} />
                </a>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-brand-deep/45 mt-4">
                <span>{a.autor?.nome ?? 'Coordenação'}</span>
                <span aria-hidden="true">·</span>
                <span>{formatarData(a.criado_em)}</span>
                {a.reuniao?.id && (
                  <>
                    <span aria-hidden="true">·</span>
                    <a
                      href={`/reunioes/${a.reuniao.id}`}
                      className="font-semibold text-brand-accent hover:underline"
                    >
                      Ver reunião: {a.reuniao.titulo}
                    </a>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
