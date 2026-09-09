import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import FormLogin from './FormLogin'

export const metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-brand-bg">
      {/* Painel estrutural escuro */}
      <div className="hidden lg:flex flex-col justify-between bg-sidebar text-white p-12">
        <Link href="/" aria-label="Conheça Farmácia">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/logo-principal-branco.svg" alt="Conheça Farmácia" className="h-10" />
        </Link>
        <div>
          <p className="text-[10.5px] tracking-[0.24em] uppercase font-bold text-brand-accent mb-4">
            Plataforma interna
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight">
            Gestão da equipa,
            <br />
            com clareza e rigor.
          </h1>
          <p className="mt-5 text-white/55 leading-relaxed max-w-md text-[15px]">
            Atividades, tarefas, eventos e entrevistas — com fluxo de aprovação
            e responsáveis claros, num só lugar.
          </p>
        </div>
        <div className="flex items-center justify-between text-white/35 text-xs">
          <span>Conheça Farmácia</span>
          <span>Uso interno</span>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10 flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/logo-principal-verde.svg" alt="Conheça Farmácia" className="h-10" />
            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-accent">
              Gestão Interna
            </p>
          </div>

          <div className="page-head">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary">
                <ShieldCheck size={19} />
              </span>
              <h2 className="text-2xl font-extrabold text-brand-deep tracking-tight">Entrar</h2>
            </div>
            <p className="text-sm text-brand-deep/55 mt-3">
              Acesso reservado à equipa. As contas são criadas pela coordenação —
              não existe registo público.
            </p>
          </div>

          <FormLogin />
        </div>
      </div>
    </div>
  )
}
