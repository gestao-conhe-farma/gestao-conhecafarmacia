import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx'
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from 'pdf-lib'
import { construirAta } from './lib'

/**
 * GET /reunioes/{id}/ata?formato=docx|pdf
 * Exporta a ata da reunião (pauta, presenças, notas, planos e resumo).
 * Qualquer membro autenticado pode exportar — a RLS garante a visibilidade.
 */

const VERDE = rgb(0x00 / 255, 0x49 / 255, 0x3a / 255)
const CINZA = rgb(0.42, 0.45, 0.43)

async function obterAta(supabase, id) {
  const [reuniaoRes, notasRes, planosRes] = await Promise.all([
    supabase
      .from('reunioes')
      .select(
        `id, titulo, tipo, estado, data_hora, local, pauta, resumo, resumo_publicado_em,
         criado_por:pessoas!reunioes_criado_por_fkey(nome),
         reuniao_participantes(pessoa_id, status, presenca, pessoas(nome))`
      )
      .eq('id', id)
      .single(),
    supabase
      .from('reuniao_notas')
      .select('conteudo, criado_em, autor:pessoas!reuniao_notas_autor_id_fkey(nome)')
      .eq('reuniao_id', id)
      .order('criado_em', { ascending: true }),
    supabase
      .from('reuniao_planos')
      .select(
        `titulo, descricao, decisao,
         criado_por:pessoas!reuniao_planos_criado_por_fkey(nome),
         reuniao_plano_votos(pessoa_id, voto)`
      )
      .eq('reuniao_id', id)
      .order('criado_em', { ascending: true }),
  ])

  if (reuniaoRes.error || !reuniaoRes.data) return null
  return construirAta({
    ...reuniaoRes.data,
    notas: notasRes.data ?? [],
    planos: planosRes.data ?? [],
  })
}

// -------------------------------------------------------------
// DOCX
// -------------------------------------------------------------
function paragrafo(txt, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.espaco ?? 120 },
    children: [
      new TextRun({
        text: txt,
        bold: opts.negrito || false,
        size: opts.tamanho ?? 22,
        color: opts.cor ?? '1F2A26',
        font: 'Calibri',
      }),
    ],
  })
}

function tituloSecao(txt) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D8E0DB' } },
    children: [
      new TextRun({ text: txt, bold: true, size: 26, color: '00493A', font: 'Calibri' }),
    ],
  })
}

function gerarDocx(ata) {
  const filhos = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: 'CONHEÇA FARMÁCIA', bold: true, size: 20, color: '8AA398', font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({ text: ata.tipo.toUpperCase(), size: 20, color: '8AA398', font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: ata.titulo, bold: true, size: 40, color: '14231D', font: 'Calibri' }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
      children: [
        new TextRun({ text: `${ata.quando} · ${ata.local}`, size: 22, color: '6B7A72', font: 'Calibri' }),
      ],
    }),
  ]

  filhos.push(tituloSecao('Pauta'))
  if (ata.pontosPauta.length) {
    ata.pontosPauta.forEach((p, i) => filhos.push(paragrafo(`${i + 1}. ${p}`)))
  } else {
    filhos.push(paragrafo('Sem pauta definida.', { cor: '8A958E' }))
  }

  filhos.push(tituloSecao('Presenças'))
  if (ata.presencas.length) {
    ata.presencas.forEach((p) => filhos.push(paragrafo(`• ${p}`)))
  } else {
    filhos.push(paragrafo('Sem convocados registados.', { cor: '8A958E' }))
  }

  filhos.push(tituloSecao('Notas da equipa'))
  if (ata.notas.length) {
    ata.notas.forEach((n) => {
      filhos.push(
        paragrafo(`${n.autor} · ${n.data}`, { negrito: true, tamanho: 18, cor: '6B7A72' })
      )
      filhos.push(paragrafo(n.texto, { espaco: 200 }))
    })
  } else {
    filhos.push(paragrafo('Sem notas.', { cor: '8A958E' }))
  }

  filhos.push(tituloSecao('Planos'))
  if (ata.planos.length) {
    ata.planos.forEach((plano) => {
      filhos.push(paragrafo(plano.titulo, { negrito: true }))
      if (plano.descricao) filhos.push(paragrafo(plano.descricao))
      filhos.push(paragrafo(plano.resultado, { tamanho: 20, cor: '6B7A72', espaco: 240 }))
    })
  } else {
    filhos.push(paragrafo('Sem planos.', { cor: '8A958E' }))
  }

  filhos.push(tituloSecao('Resumo final'))
  if (ata.resumo) {
    filhos.push(paragrafo(ata.resumo))
    if (ata.publicadaEm) {
      filhos.push(
        paragrafo(`Ata publicada em ${ata.publicadaEm}.`, { tamanho: 18, cor: '8A958E' })
      )
    }
  } else {
    filhos.push(paragrafo('Resumo ainda não publicado.', { cor: '8A958E' }))
  }

  return new Document({
    creator: 'Conheça Farmácia',
    title: `Ata — ${ata.titulo}`,
    sections: [{ children: filhos }],
  })
}

// -------------------------------------------------------------
// PDF (pdf-lib, fontes standard — WinAnsi)
// -------------------------------------------------------------
function sanitizar(t) {
  // StandardFonts só cobre WinAnsi: substituir caracteres fora do conjunto
  return (t ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '-') // bullet não é Latin-1: saía cortado do PDF
    .replace(/\u00A0/g, ' ')
    // remover tudo o que não é Latin-1 imprimível
    .replace(/[^\x20-\x7E\u00A0-\u00FF\n]/g, '')
}

async function gerarPdf(ata) {
  // PDFDocument.create é ASSÍNCRONO — sem await, doc era uma Promise,
  // embedFont rebentava dentro do try/catch e a rota devolvia 500:
  // o download de PDF nunca chegava (o DOCX funcionava porque é síncrono).
  const doc = await PDFDocument.create()
  let fontRegular, fontBold
  try {
    fontRegular = doc.embedFont(StandardFonts.Helvetica)
    fontBold = doc.embedFont(StandardFonts.HelveticaBold)
  } catch {
    // improvável — mas mantém o fluxo seguro
    throw new Error('Falha ao carregar fontes PDF')
  }

  const A4 = { w: 595.28, h: 841.89 }
  const margem = 56
  let pagina = doc.addPage([A4.w, A4.h])
  let y = A4.h - margem

  const novoParagrafo = (txt, { size = 10.5, bold = false, cor = CINZA_ESCURO, spacing = 6 } = {}) => {
    const font = bold ? fontBold : fontRegular
    const linhas = wrapText(sanitizar(txt), font, size, A4.w - margem * 2)
    for (const linha of linhas) {
      if (y < margem + 40) {
        pagina = doc.addPage([A4.w, A4.h])
        y = A4.h - margem
      }
      pagina.drawText(linha, { x: margem, y, size, font, color: cor })
      y -= size * 1.45
    }
    y -= spacing
  }

  const secao = (txt) => {
    y -= 14
    novoParagrafo(txt.toUpperCase(), { size: 11.5, bold: true, cor: VERDE, spacing: 8 })
    // régua
    if (y < margem + 40) {
      pagina = doc.addPage([A4.w, A4.h])
      y = A4.h - margem
    }
    pagina.drawLine({
      start: { x: margem, y: y + 10 },
      end: { x: A4.w - margem, y: y + 10 },
      thickness: 0.7,
      color: rgb(0.85, 0.88, 0.86),
    })
  }

  // Cabeçalho
  novoParagrafo('CONHEÇA FARMÁCIA', { size: 9, bold: true, cor: CINZA, spacing: 2 })
  novoParagrafo(ata.tipo, { size: 9, cor: CINZA, spacing: 10 })
  novoParagrafo(ata.titulo, { size: 19, bold: true, cor: VERDE, spacing: 4 })
  novoParagrafo(`${ata.quando} · ${ata.local}`, { size: 10.5, cor: CINZA, spacing: 14 })

  secao('Pauta')
  if (ata.pontosPauta.length) {
    ata.pontosPauta.forEach((p, i) => novoParagrafo(`${i + 1}. ${p}`))
  } else {
    novoParagrafo('Sem pauta definida.')
  }

  secao('Presenças')
  if (ata.presencas.length) {
    ata.presencas.forEach((p) => novoParagrafo(`• ${p}`))
  } else {
    novoParagrafo('Sem convocados registados.')
  }

  secao('Notas da equipa')
  if (ata.notas.length) {
    ata.notas.forEach((n) => {
      novoParagrafo(`${n.autor} · ${n.data}`, { size: 8.5, bold: true, cor: CINZA, spacing: 2 })
      novoParagrafo(n.texto, { spacing: 10 })
    })
  } else {
    novoParagrafo('Sem notas.')
  }

  secao('Planos')
  if (ata.planos.length) {
    ata.planos.forEach((plano) => {
      novoParagrafo(plano.titulo, { bold: true, cor: CINZA_ESCURO })
      if (plano.descricao) novoParagrafo(plano.descricao)
      novoParagrafo(plano.resultado, { size: 9.5, cor: CINZA, spacing: 10 })
    })
  } else {
    novoParagrafo('Sem planos.')
  }

  secao('Resumo final')
  if (ata.resumo) {
    novoParagrafo(ata.resumo)
    if (ata.publicadaEm) novoParagrafo(`Ata publicada em ${ata.publicadaEm}.`, { size: 8.5, cor: CINZA })
  } else {
    novoParagrafo('Resumo ainda não publicado.')
  }

  return doc
}

const CINZA_ESCURO = rgb(0.12, 0.16, 0.14)

function wrapText(txt, font, size, maxWidth) {
  const linhas = []
  for (const bruta of String(txt ?? '').split('\n')) {
    const palavras = bruta.split(/\s+/).filter(Boolean)
    if (palavras.length === 0) {
      linhas.push('')
      continue
    }
    let atual = ''
    for (const p of palavras) {
      const teste = atual ? `${atual} ${p}` : p
      try {
        if (font.widthOfTextAtSize(teste, size) <= maxWidth) {
          atual = teste
        } else {
          if (atual) linhas.push(atual)
          atual = p
        }
      } catch {
        // caractere fora da fonte: ignora a palavra problemática
        continue
      }
    }
    if (atual) linhas.push(atual)
  }
  return linhas
}

// -------------------------------------------------------------
// Handler
// -------------------------------------------------------------
export async function GET(request, { params }) {
  const { id } = await params
  const formato = (new URL(request.url).searchParams.get('formato') || 'docx').toLowerCase()

  const supabase = await createClient()
  const ata = await obterAta(supabase, id)
  if (!ata) {
    return NextResponse.json({ erro: 'Reunião não encontrada ou sem acesso.' }, { status: 404 })
  }

  const nomeFicheiro = `ata-${ata.titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)}.docx`.replace('.docx', formato === 'pdf' ? '.pdf' : '.docx')

  if (formato === 'pdf') {
    const pdf = await gerarPdf(ata)
    const bytes = await pdf.save()
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeFicheiro}"`,
      },
    })
  }

  const docx = await Packer.toBuffer(gerarDocx(ata))
  return new NextResponse(Buffer.from(docx), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${nomeFicheiro}"`,
    },
  })
}
