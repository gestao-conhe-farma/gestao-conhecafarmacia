import { getUtilizadorAtual, createClient } from '@/lib/supabase/server'
import CartaoPerfil from './CartaoPerfil'
import CartaoPalavraPasse from './CartaoPalavraPasse'
import CartaoAparencia from './CartaoAparencia'
import CartaoSessao from './CartaoSessao'
import CartaoSeguranca from './CartaoSeguranca'

export const metadata = { title: 'Definições' }

/**
 * Definições em secções numeradas — linguagem editorial da direção A:
 * uma só régua forte por baixo do cabeçalho; cada secção separada por
 * régua fina, número à esquerda, sem cartões flutuantes.
 */
export default async function PaginaDefinicoes() {
  const { pessoa } = await getUtilizadorAtual()

  // Fatores 2FA do próprio (RLS/MFA API garante que só os seus vêm aqui)
  const supabase = await createClient()
  const { data: mfa } = await supabase.auth.mfa.listFactors()
  const fatores = mfa?.totp ?? []

  const secoes = [
    { num: '01', titulo: 'Perfil', descricao: 'O nome aparece no dashboard, nas atividades e nos documentos que crias.', corpo: <CartaoPerfil pessoa={pessoa} /> },
    { num: '02', titulo: 'Segurança (2FA)', descricao: 'Verificação em dois passos via app autenticadora — pede um código para além da palavra-passe.', corpo: <CartaoSeguranca fatores={fatores} /> },
    { num: '03', titulo: 'Palavra-passe', descricao: 'Ao alterar, as sessões noutros dispositivos são terminadas automaticamente.', corpo: <CartaoPalavraPasse /> },
    { num: '04', titulo: 'Aparência', descricao: 'O tema é guardado neste dispositivo.', corpo: <CartaoAparencia /> },
    { num: '05', titulo: 'Sessão', descricao: 'Termina a sessão neste dispositivo ou em todos os dispositivos onde a conta está ativa.', corpo: <CartaoSessao /> },
  ]

  return (
    <div className="container-app max-w-3xl">
      {/* Única régua forte da página */}
      <div className="page-head">
        <p className="kicker">Conta</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-brand-deep mt-2 tracking-tight">
          Definições
        </h1>
        <p className="text-brand-deep/60 mt-2 leading-relaxed">
          Gere a tua conta, segurança e preferências da plataforma.
        </p>
      </div>

      <div>
        {secoes.map((s, i) => (
          <section
            key={s.num}
            className={`grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider ${
              i === 0 ? '!border-t-2 !border-ink-strong' : ''
            }`}
          >
            <span className="sec-num">{s.num}</span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-brand-deep tracking-tight">
                {s.titulo}
              </h2>
              <p className="text-[13.5px] text-brand-deep/55 mt-1 leading-relaxed">
                {s.descricao}
              </p>
              <div className="mt-6">{s.corpo}</div>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
