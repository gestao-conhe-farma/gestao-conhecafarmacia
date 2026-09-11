import { createAdminClient } from '@/lib/supabase/server'

/**
 * Trilha de auditoria — escreve um evento na tabela auditoria.
 *
 * - Escrito SEMPRE via service_role: o autor da ação não precisa de
 *   (nem deve ter) permissão para inserir na trilha via RLS normal.
 * - Best-effort: uma falha de log NUNCA deve bloquear a ação do
 *   utilizador — fica registada no console para investigação.
 * - Contexto: quem (pessoa_id), o quê (acao), detalhes (jsonb),
 *   quando (criado_em, default now()).
 *
 * Uso: await registarEvento('membro.removido', { pessoa_id: alvo }, autorId)
 */
export async function registarEvento(acao, detalhes = {}, pessoaId = null) {
  try {
    const admin = await createAdminClient()
    const { error } = await admin.from('auditoria').insert({
      acao,
      detalhes,
      pessoa_id: pessoaId,
    })
    if (error) {
      console.error('[auditoria] falha ao registar evento', acao, error.message)
    }
  } catch (err) {
    console.error('[auditoria] exceção ao registar evento', acao, err?.message)
  }
}
