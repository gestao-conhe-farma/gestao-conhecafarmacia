import { getUtilizadorAtual } from '@/lib/supabase/server'
import CartaoPerfil from './CartaoPerfil'
import CartaoPalavraPasse from './CartaoPalavraPasse'
import CartaoAparencia from './CartaoAparencia'
import CartaoSessao from './CartaoSessao'

export const metadata = { title: 'Definições' }

export default async function PaginaDefinicoes() {
  const { pessoa } = await getUtilizadorAtual()

  return (
    <div className="container-app max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-brand-deep mb-2">Definições</h1>
      <p className="text-brand-deep/60 mb-8">
        Gere a tua conta, segurança e preferências da plataforma.
      </p>

      <div className="space-y-6">
        <CartaoPerfil pessoa={pessoa} />
        <CartaoPalavraPasse />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CartaoAparencia />
          <CartaoSessao />
        </div>
      </div>
    </div>
  )
}
