'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

/**
 * Cria o primeiro super_admin. Protegido: falha se já existir alguém
 * em pessoas (a página /setup já redireciona, isto é a segunda barreira).
 */
export async function criarPrimeiroSuperAdmin({ nome, email, password }) {
  const admin = await createAdminClient()

  // VERIFICAÇÃO VIA SERVICE_ROLE: com o cliente anon, a RLS devolve zero
  // linhas a quem não está autenticado — o count seria sempre 0 e qualquer
  // anónimo podia criar uma conta super_admin. O service_role ignora RLS
  // e vê o número real de registos.
  const { count } = await admin
    .from('pessoas')
    .select('id', { count: 'exact', head: true })

  if ((count ?? 0) > 0) {
    return { ok: false, erro: 'A configuração inicial já foi feita.' }
  }

  // Criar utilizador no Auth
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome },
  })

  if (error) {
    if (error.code === 'email_exists') {
      return {
        ok: false,
        erro:
          'Este email já existe no sistema de autenticação. Usa esse utilizador: cria-o em pessoas via SQL ou remove-o no Supabase Dashboard.',
      }
    }
    return { ok: false, erro: error.message }
  }

  const userId = data.user.id

  // Registar em pessoas com role super_admin
  const { error: erroPessoa } = await admin
    .from('pessoas')
    .insert({ id: userId, nome, email, role: 'super_admin' })

  if (erroPessoa) {
    // Rollback do utilizador Auth para não ficar órfão
    await admin.auth.admin.deleteUser(userId)
    return { ok: false, erro: 'Falha ao registar o utilizador: ' + erroPessoa.message }
  }

  // Sessão automática para o novo super_admin (cliente anon, com cookies)
  const supabase = await createClient()
  const { error: erroLogin } = await supabase.auth.signInWithPassword({ email, password })
  if (erroLogin) {
    return { ok: true, aviso: 'Conta criada. Faz login para continuar.' }
  }

  return { ok: true }
}
