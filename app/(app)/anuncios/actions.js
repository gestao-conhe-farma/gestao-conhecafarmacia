'use server'

import { notificar } from '@/lib/notificacoes'

import { createClient, getUtilizadorAtual } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Anúncios da coordenação — avisos para toda a equipa. Também usados
 * pelo resumo final da reunião ("publicar também como anúncio").
 * Escrita: só super_admin (RLS da 0023 + revalidação aqui).
 * A notificação é a única que vai também por EMAIL — anúncio é para
 * ser visto por todos, não é conversa de trabalho.
 */

function tituloValido(t) {
  const v = (t ?? '').trim()
  if (!v) return null
  return v.slice(0, 200)
}

function corpoValido(t) {
  const v = (t ?? '').trim()
  if (!v) return null
  return v.slice(0, 4000)
}

/** Criar anúncio e avisar toda a equipa ativa (in-app + email). */
export async function criarAnuncio(titulo, corpo, reuniaoId = null) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const t = tituloValido(titulo)
  const c = corpoValido(corpo)
  if (!t) return { ok: false, erro: 'O anúncio precisa de um título.' }
  if (!c) return { ok: false, erro: 'O anúncio está vazio.' }

  const supabase = await createClient()

  // Reunião opcional: tem de existir (RLS já filtra as privadas para
  // quem não pode vê-las — um super_admin vê-as todas)
  if (reuniaoId) {
    const { data: r } = await supabase
      .from('reunioes')
      .select('id')
      .eq('id', reuniaoId)
      .maybeSingle()
    if (!r) return { ok: false, erro: 'Reunião não encontrada.' }
  }

  const { data: anuncio, error } = await supabase
    .from('anuncios')
    .insert({ titulo: t, corpo: c, reuniao_id: reuniaoId || null, criado_por: pessoa.id })
    .select('id')
    .single()
  if (error) return { ok: false, erro: error.message }

  // Toda a equipa ativa (exceto o autor, que acabou de a escrever)
  try {
    const { data: equipa } = await supabase
      .from('pessoas')
      .select('id')
      .eq('ativo', true)
    await notificar((equipa ?? []).map((p) => p.id).filter((id) => id !== pessoa.id), {
      tipo: 'anuncio_novo',
      titulo: `Anúncio: ${t}`,
      corpo: c.slice(0, 160),
      link: '/anuncios',
    })
  } catch (e) {
    console.error('[anuncios] notificação falhou', e?.message)
  }

  revalidatePath('/anuncios')
  revalidatePath('/')
  return { ok: true, id: anuncio.id }
}

/** Desativar anúncio (deixa de aparecer; histórico mantém). */
export async function apagarAnuncio(anuncioId) {
  const { pessoa } = await getUtilizadorAtual()
  if (pessoa.role !== 'super_admin') return { ok: false, erro: 'Sem permissão.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('anuncios')
    .update({ ativo: false })
    .eq('id', anuncioId)

  if (error) return { ok: false, erro: error.message }
  revalidatePath('/anuncios')
  revalidatePath('/')
  return { ok: true }
}
