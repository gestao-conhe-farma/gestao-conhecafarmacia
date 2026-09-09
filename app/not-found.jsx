import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center bg-brand-bg px-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-brand-primary font-display">404</p>
        <h1 className="mt-4 text-2xl font-bold text-brand-deep">Página não encontrada</h1>
        <p className="mt-2 text-brand-deep/60">
          A página que procuras não existe ou foi movida.
        </p>
        <Link href="/" className="btn btn-primary mt-8">
          <ArrowLeft size={16} />
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
