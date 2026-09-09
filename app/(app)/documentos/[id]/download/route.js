import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BUCKET } from '@/lib/documentos'

/**
 * GET /documentos/{id}/download
 * Verifica acesso (RLS) e redireciona para um signed URL de curta duração.
 * O bucket é privado — os ficheiros nunca são servidos diretamente.
 */
export async function GET(_request, { params }) {
  const { id } = await params

  const supabase = await createClient()

  // RLS garante que docs restritos só aparecem para super_admin
  const { data: doc, error } = await supabase
    .from('documentos')
    .select('storage_path, nome_ficheiro')
    .eq('id', id)
    .single()

  if (error || !doc) {
    return NextResponse.json({ erro: 'Documento não encontrado ou sem acesso.' }, { status: 404 })
  }

  const { data: assinado, error: erroAssinatura } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 60, {
      download: doc.nome_ficheiro, // força o nome original no download
    })

  if (erroAssinatura || !assinado?.signedUrl) {
    console.error('[download] falha ao assinar URL', erroAssinatura?.message)
    return NextResponse.json({ erro: 'Ficheiro indisponível.' }, { status: 500 })
  }

  return NextResponse.redirect(assinado.signedUrl)
}
