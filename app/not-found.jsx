import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * 404 com tema de farmácia: a "receita" (℞) não foi encontrada.
 * Carimbo rodado tipo selo de farmácia, monograma gigante em fundo e
 * a linguagem editorial da marca. As animações desligam-se sozinhas
 * com prefers-reduced-motion (regra global no globals.css).
 */
export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center bg-brand-bg px-6 py-16 relative overflow-hidden">
      {/* Monograma CF gigante em fundo, quase imperceptível */}
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute -right-10 -bottom-24 text-[26rem] leading-none font-extrabold text-brand-primary/[0.045] tracking-tighter"
      >
        CF
      </span>

      <div className="relative text-center max-w-md">
        {/* Carimbo da receita */}
        <div className="mx-auto w-36 h-36 rounded-full border-[3px] border-dashed border-brand-primary/35 grid place-items-center rotate-[-8deg] mb-10 relative">
          <div className="text-center">
            <p className="text-5xl font-extrabold text-brand-primary tracking-tight" aria-hidden="true">
              ℞
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-brand-primary/50 mt-1">
              Receita n.º 404
            </p>
          </div>
          {/* Marca de "não dispensado" */}
          <span
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center text-red-600/70 font-extrabold text-xl tracking-[0.3em] uppercase rotate-[12deg]"
          >
            <span className="border-y-[3px] border-red-600/70 py-1 px-3">Anulada</span>
          </span>
        </div>

        <p className="kicker">Erro 404 — Receita não encontrada</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-3 tracking-tight leading-tight">
          A página que procuras não existe nesta farmácia.
        </h1>
        <p className="text-brand-deep/60 mt-4 leading-relaxed">
          O endereço pode ter mudado, a receita pode ter caducado, ou alguém
          escreveu mal a prescrição. De qualquer forma, o farmacêutico
          recomenda voltar ao balcão.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link href="/" className="btn btn-primary">
            <ArrowLeft size={16} />
            Voltar ao balcão
          </Link>
          <Link href="/atividades" className="btn btn-secondary">
            Ver atividades
          </Link>
        </div>

        <p className="text-[11px] text-brand-deep/35 mt-10 tracking-wide">
          Conheça Farmácia · Plataforma de gestão interna
        </p>
      </div>
    </div>
  )
}
