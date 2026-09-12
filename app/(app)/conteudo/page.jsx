import { exigirUtilizador } from '@/lib/supabase/server'
import { listarConteudoRedes } from '@/lib/dados'
import ListaConteudo from './ListaConteudo'

export const metadata = { title: 'Conteúdo' }

/**
 * Calendário editorial das redes sociais (Facebook, Instagram, TikTok,
 * YouTube): os dias fixos que têm conteúdo e os temas que vão sair.
 * Equipa inteira consulta e atualiza; apagar é da coordenação (RLS).
 */
export default async function PaginaConteudo() {
  const { pessoa } = await exigirUtilizador()
  const conteudos = await listarConteudoRedes()

  return (
    <div className="container-app max-w-5xl">
      <div className="page-head">
        <p className="kicker">Comunicação</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Conteúdo das redes
        </h1>
        <p className="text-brand-deep/60 mt-2 leading-relaxed max-w-2xl">
          Calendário editorial do Facebook, Instagram, TikTok e YouTube — os
          temas que vão sair, esta semana e nas próximas. Toda a equipa
          alimenta e atualiza; o histórico fica guardado.
        </p>
      </div>

      <ListaConteudo iniciais={conteudos} ehSuper={pessoa.role === 'super_admin'} />
    </div>
  )
}
