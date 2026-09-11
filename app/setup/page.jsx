import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FormSetup from './FormSetup'

export const metadata = { title: 'Configuração inicial' }

export default async function SetupPage() {
  // Só disponível enquanto não existir ninguém em pessoas.
  // Service_role: com o cliente anon, a RLS esconde TODAS as linhas de
  // quem não está autenticado — o count seria sempre 0 e a página nunca
  // se desativava. (Ver o mesmo fix em actions.js.)
  const admin = await createAdminClient()
  const { count } = await admin
    .from('pessoas')
    .select('id', { count: 'exact', head: true })

  if ((count ?? 0) > 0) {
    redirect('/login')
  }

  // Verificar se já existe algum utilizador no Auth (evita duplicar)
  const { data: { users } } = await admin.auth.admin.listUsers({ page: 1, perPage: 10 })
  const emailSugerido = users?.length === 1 ? users[0].email : ''

  return (
    <div className="min-h-dvh grid place-items-center bg-brand-bg px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/logo-principal-verde.svg" alt="Conheça Farmácia" className="h-12" />
        </div>
        <div className="card p-8">
          <h1 className="font-display text-2xl font-bold text-brand-deep">
            Configuração inicial
          </h1>
          <p className="mt-2 text-sm text-brand-deep/60">
            A plataforma ainda não tem utilizadores. Cria aqui a conta de
            <strong className="text-brand-deep"> coordenação (super_admin)</strong> que
            vai gerir a equipa. Esta página desativa-se automaticamente depois.
          </p>
          <FormSetup emailSugerido={emailSugerido} />
        </div>
      </div>
    </div>
  )
}
