import { CabecalhoSkeleton } from '../../Skeletons'

/** Painel de formulário: linhas etiqueta + campo (partilhado no ficheiro). */
function CampoFormulario({ largura = '100%', alto = 44 }) {
  return (
    <div>
      <div className="skeleton h-3.5 w-24 rounded-full mb-2" />
      <div className="skeleton rounded-lg" style={{ width: largura, height: alto }} />
    </div>
  )
}

/**
 * Loading de /reunioes/nova — formulário de criação de reunião:
 * campos etiquetados, escolha de data/hora e botão de submissão.
 */
export default function Loading() {
  return (
    <div className="container-app max-w-2xl" aria-busy="true" aria-live="polite">
      <CabecalhoSkeleton kicker titulo={260} linhas={1} larguras={['55%']} />

      <div className="card p-6 md:p-7 mt-6 space-y-5">
        <CampoFormulario />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CampoFormulario />
          <CampoFormulario />
        </div>
        <CampoFormulario alto={110} />
        <div className="skeleton h-11 w-44 rounded-lg" />
      </div>
    </div>
  )
}
