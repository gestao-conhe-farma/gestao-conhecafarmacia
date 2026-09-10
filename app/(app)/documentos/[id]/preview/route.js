import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BUCKET } from '@/lib/documentos'

/**
 * GET /documentos/{id}/preview
 * Igual ao download, mas serve o ficheiro INLINE (sem attachment) para
 * poder ser renderizado no visualizador: PDF e imagens no viewer nativo
 * do browser, HTML/TXT/DOCX lidos pelo cliente via fetch.
 * O bucket continua privado — acesso sempre validado por RLS.
 */
export async function GET(_request, { params }) {
  const { id } = await params

  const supabase = await createClient()

  // RLS garante que docs restritos só aparecem para super_admin
  const { data: doc, error } = await supabase
    .from('documentos')
    .select('storage_path, mime_type')
    .eq('id', id)
    .single()

  if (error || !doc) {
    return NextResponse.json({ erro: 'Documento não encontrado ou sem acesso.' }, { status: 404 })
  }

  // 90s: tempo suficiente para o modal abrir e renderizar, curto o
  // suficiente para o URL não ficar reutilizável durante horas.
  const { data: assinado, error: erroAssinatura } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, 90)

  if (erroAssinatura || !assinado?.signedUrl) {
    console.error('[preview] falha ao assinar URL', erroAssinatura?.message)
    return NextResponse.json({ erro: 'Ficheiro indisponível.' }, { status: 500 })
  }

  // Busca o conteúdo e faz stream com Content-Disposition: inline.
  // Não usamos redirect: alguns browsers bloqueiam PDFs em iframes
  // que responderam com redirect entre origens.
  const upstream = await fetch(assinado.signedUrl)
  if (!upstream.ok || !upstream.body) {
    console.error('[preview] storage devolveu', upstream.status)
    return NextResponse.json({ erro: 'Ficheiro indisponível no armazenamento.' }, { status: 500 })
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': doc.mime_type || 'application/octet-stream',
      'Content-Disposition': 'inline',
      // URL de origem igual ao da app — evita problemas de cookies/cache entre origens
      'Cache-Control': 'private, max-age=60',
    },
  })
}
