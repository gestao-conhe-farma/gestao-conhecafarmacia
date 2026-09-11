import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ShieldCheck } from 'lucide-react'
import FormMFA from './FormMFA'

export const metadata = { title: 'Verificação em dois passos' }

/**
 * Segundo passo do login quando a conta tem 2FA ativa.
 * A sessão fica "em desafio" (aal1) até o código ser verificado —
 * o middleware barra o resto da app enquanto isso.
 */
export default async function PaginaMFA() {
  const supabase = await createClient()
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  // Sem desafio pendente (já em aal2, ou conta sem 2FA) → nada a fazer aqui
  if (!aal || aal.nextLevel !== 'aal2' || aal.currentLevel === 'aal2') {
    redirect('/')
  }

  // O fator do desafio é o TOTP verificado da conta (o mesmo que a pessoa
  // ativou nas definições). pendingFactors só lista fatores de registo
  // por confirmar — não serve para o desafio de login.
  const { data: fatores } = await supabase.auth.mfa.listFactors()
  const fatorPendente = (fatores?.totp ?? []).find((f) => f.status === 'verified')
  if (!fatorPendente) redirect('/')

  return (
    <div className="min-h-dvh grid place-items-center bg-brand-bg px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/logo-principal-verde.svg" alt="Conheça Farmácia" className="h-12" />
        </div>
        <div className="card p-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="grid place-items-center w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary">
              <ShieldCheck size={19} />
            </span>
            <h1 className="text-2xl font-extrabold text-brand-deep tracking-tight">
              Verificação em dois passos
            </h1>
          </div>
          <p className="text-sm text-brand-deep/60 leading-relaxed mb-6">
            Insere o código de 6 dígitos da tua app autenticadora para
            concluíres o login.
          </p>
          <FormMFA factorId={fatorPendente.id} />
        </div>
      </div>
    </div>
  )
}
