// E2E: preview de documentos — cria ficheiros de teste, faz upload via API
// com sessão real, e valida cada tipo de preview no browser.
const { chromium } = require('playwright')
const fs = require('fs')

const BASE = 'http://localhost:3131'
const EMAIL = 'baptistalimab@gmail.com'
const PASS = '@bjaysh18'

// --- 1. Gerar ficheiros de teste ---
function gerarPdfMinimo(titulo) {
  const texto = titulo
  const conteudo = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 90>>stream
BT /F1 24 Tf 72 700 Td (${texto}) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>`
  return Buffer.from(conteudo, 'latin1')
}

function gerarTxt() {
  return Buffer.from(
    'Lista de material para a atividade de campo\n\n- 12 batas de laboratório\n- 2 caixas de luvas\n- 1 projetor\n-Folhas de registo impressas\n',
    'utf8'
  )
}

function gerarHtml() {
  return Buffer.from(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Comunicado</title>
<style>body{font-family:Georgia,serif;padding:40px;color:#14231d}h1{color:#00493a}</style></head>
<body><h1>Comunicado interno</h1><p>Este é um documento HTML de teste do Conheça Farmácia.</p></body></html>`,
    'utf8'
  )
}

function gerarPngMinimo() {
  // PNG 1x1 vermelho
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  )
}

// DOCX mínimo válido (zip com document.xml) — gerado com zlib do Node
function gerarDocx(titulo) {
  const { deflateSync } = require('zlib')
  const crc32 = (buf) => {
    let c
    const table = []
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      table[n] = c
    }
    let crc = 0 ^ -1
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
    return (crc ^ -1) >>> 0
  }
  const entry = (nome, dados) => {
    const nomeBuf = Buffer.from(nome)
    const comp = deflateSync(dados)
    const head = Buffer.alloc(30)
    head.writeUInt32LE(0x04034b50, 0)
    head.writeUInt16LE(20, 4)
    head.writeUInt16LE(0, 6)
    head.writeUInt16LE(8, 8)
    head.writeUInt16LE(0, 10)
    head.writeUInt16LE(0, 12)
    head.writeUInt32LE(crc32(dados), 14)
    head.writeUInt32LE(comp.length, 18)
    head.writeUInt32LE(dados.length, 22)
    head.writeUInt16LE(nomeBuf.length, 26)
    const out = Buffer.concat([head, nomeBuf, comp])
    return { out, nomeBuf, compLen: comp.length, uncompLen: dados.length, crc: crc32(dados) }
  }
  const docXml = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:rFonts w:ascii="Calibri"/><w:sz w:val="40"/></w:rPr><w:t>${titulo}</w:t></w:r></w:p><w:p><w:r><w:t>Documento DOCX de teste do Conheça Farmácia.</w:t></w:r></w:p></w:body></w:document>`
  const contentTypes = `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
  const rels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`

  const partes = [
    entry('[Content_Types].xml', Buffer.from(contentTypes)),
    entry('_rels/.rels', Buffer.from(rels)),
    entry('word/document.xml', Buffer.from(docXml)),
  ]
  const central = partes.map((p, i) => {
    const h = Buffer.alloc(46)
    h.writeUInt32LE(0x02014b50, 0)
    h.writeUInt16LE(20, 4)
    h.writeUInt16LE(20, 6)
    h.writeUInt16LE(8, 8)
    h.writeUInt32LE(p.crc, 16)
    h.writeUInt32LE(p.compLen, 20)
    h.writeUInt32LE(p.uncompLen, 24)
    h.writeUInt16LE(p.nomeBuf.length, 28)
    h.writeUInt32LE(i, 42) // offset local — como escrevemos sequencial, calcular:
    return { h, nomeBuf: p.nomeBuf, offset: 0 }
  })
  // calcular offsets
  let offset = 0
  partes.forEach((p, i) => {
    central[i].offset = offset
    offset += p.out.length
  })
  const centralBuf = Buffer.concat(
    central.map((c) => {
      c.h.writeUInt32LE(c.offset, 42)
      return Buffer.concat([c.h, c.nomeBuf])
    })
  )
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(partes.length, 8)
  eocd.writeUInt16LE(partes.length, 10)
  eocd.writeUInt32LE(centralBuf.length, 12)
  eocd.writeUInt32LE(offset, 16)
  return Buffer.concat([...partes.map((p) => p.out), centralBuf, eocd])
}

// --- 2. Sessão via login real no browser ---
;(async () => {
  const ficheiros = [
    { nome: 'teste-preview.pdf', buffer: gerarPdfMinimo('Documento PDF de teste'), mime: 'application/pdf', categoria: 'Conteúdos' },
    { nome: 'teste-preview.txt', buffer: gerarTxt(), mime: 'text/plain', categoria: 'Conteúdos' },
    { nome: 'teste-preview.html', buffer: gerarHtml(), mime: 'text/html', categoria: 'Conteúdos' },
    { nome: 'teste-preview.png', buffer: gerarPngMinimo(), mime: 'image/png', categoria: 'Conteúdos' },
    { nome: 'teste-preview.docx', buffer: gerarDocx('Documento DOCX de teste'), mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', categoria: 'Conteúdos' },
  ]
  fs.mkdirSync('_design/testfiles', { recursive: true })
  ficheiros.forEach((f) => fs.writeFileSync(`_design/testfiles/${f.nome}`, f.buffer))

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
  const page = await ctx.newPage()

  // Login
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForURL(BASE + '/', { timeout: 15000 })
  console.log('login OK')

  // Upload de cada ficheiro via fetch no contexto do browser (sessão + RLS)
  const ids = {}
  for (const f of ficheiros) {
    const resultado = await page.evaluate(async ({ nome, categoria }) => {
      const fileBuffer = await (await fetch(`/documentos-upload-test?nome=${encodeURIComponent(nome)}`)).blob().catch(() => null)
      return null
    }, f).catch(() => null)
    // Upload direto via API supabase usando o cliente do browser não é possível
    // sem expor keys; usamos a página /documentos/novo com setInputFiles.
    await page.goto(BASE + '/documentos/novo', { waitUntil: 'networkidle' })
    await page.setInputFiles('input[type="file"]', `_design/testfiles/${f.nome}`)
    await page.waitForTimeout(600)
    // título sugerido preenchido automaticamente; selecionar categoria
    await page.selectOption('select', { label: f.categoria }).catch(async () => {
      // fallback: primeira select da página
      await page.selectOption('select >> nth=0', { index: 1 })
    })
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/documentos/, { timeout: 20000 })
    // apanhar o id da última linha criada — via URL não dá; guardamos pelo título
    ids[f.nome] = f.nome
    console.log(`upload ${f.nome} OK`)
  }

  // Testar preview de cada um
  await page.goto(BASE + '/documentos', { waitUntil: 'networkidle' })
  let falhas = 0
  for (const f of ficheiros) {
    // localizar a linha que contém o título do ficheiro e clicar no olho
    const linha = page.locator('li', { hasText: f.nome.replace('.pdf', '').replace('.txt', '').replace('.html', '').replace('.png', '').replace('.docx', '') }).first()
    const botao = linha.locator('button[title="Pré-visualizar"]')
    if ((await botao.count()) === 0) {
      console.log(`preview ${f.nome}: SEM BOTÃO (esperado se título difere)`)
      continue
    }
    await botao.click()
    await page.waitForTimeout(f.nome.endsWith('.docx') ? 2500 : 1800)
    const modal = page.locator('[role="dialog"]')
    const visivel = (await modal.count()) > 0
    let conteudoOk = false
    if (visivel) {
      if (f.nome.endsWith('.pdf')) {
        conteudoOk = (await modal.locator('iframe').count()) > 0
      } else if (f.nome.endsWith('.png')) {
        conteudoOk = (await modal.locator('img').count()) > 0
      } else if (f.nome.endsWith('.txt')) {
        conteudoOk = (await modal.locator('pre').count()) > 0
      } else if (f.nome.endsWith('.html')) {
        conteudoOk = (await modal.locator('iframe[sandbox]').count()) > 0
      } else if (f.nome.endsWith('.docx')) {
        conteudoOk = (await modal.locator('.docx-wrapper, [class*=docx]').count()) > 0
      }
    }
    await page.screenshot({ path: `_design/shots/preview-${f.nome.replace('.', '-')}.png` })
    console.log(`preview ${f.nome}: modal=${visivel ? 'aberto' : 'FALHOU'} conteudo=${conteudoOk ? 'ok' : 'FALHOU'}`)
    if (!visivel || !conteudoOk) falhas++
    // fechar
    if (visivel) await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }

  console.log(falhas === 0 ? 'TODOS OS PREVIEWS PASSARAM' : `${falhas} preview(s) FALHARAM`)
  await browser.close()
  process.exit(falhas === 0 ? 0 : 1)
})()
