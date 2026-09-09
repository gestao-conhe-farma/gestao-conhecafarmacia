import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import FormLogin from './FormLogin'

export const metadata = { title: 'Entrar' }

export default function LoginPage() {
  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-brand-bg">
      {/* Painel de marca */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-primary to-[#006171] text-white p-12">
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/logo-principal-branco.svg" alt="Conheça Farmácia" className="h-12" />
        </Link>
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight">
            Plataforma de <span className="text-emerald-300">Gestão Interna</span>
          </h1>
          <p className="mt-4 text-white/70 leading-relaxed max-w-md">
            Atividades, tarefas, eventos e entrevistas da equipa — num só lugar,
            com fluxo de aprovação e responsáveis claros.
          </p>
        </div>
        <p className="text-white/40 text-sm">
          Uso interno · Conheça Farmácia © {new Date().getFullYear()}
        </p>
      </div>

      {/* Formulário */}
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/logo-principal-verde.svg" alt="Conheça Farmácia" className="h-12" />
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary">
              <ShieldCheck size={20} />
            </span>
            <h2 className="text-2xl font-bold text-brand-deep font-display">Entrar</h2>
          </div>
          <p className="text-sm text-brand-deep/60 mb-8">
            Acesso reservado à equipa. As contas são criadas pela coordenação —
            não existe registo público.
          </p>

          <FormLogin />
        </div>
      </div>
    </div>
  )
}
