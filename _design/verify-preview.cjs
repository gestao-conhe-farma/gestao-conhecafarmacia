// E2E focado: PDF + DOCX — sessão via cookie, upload pelo formulário,
// preview no modal e limpeza no fim. Títulos únicos por execução.
const { chromium } = require('playwright')
const fs = require('fs')

const BASE = process.env.BASE || 'http://localhost:3131'
const JAR = '_design/jar.txt'
const MARCA = `prv${Date.now().toString().slice(-6)}`

function cookieDoJar() {
  const linhas = fs.readFileSync(JAR, 'utf8').split('\n')
  for (const l of linhas) {
    if (l.includes('auth-token') && !l.startsWith('#')) {
      const partes = l.trim().split('\t')
      return { name: partes[5], value: partes[6] }
    }
  }
  throw new Error('cookie auth-token não encontrado no jar')
}

;(async () => {
  const cookie = cookieDoJar()
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
  await ctx.addCookies([{ ...cookie, url: BASE }])
  const page = await ctx.newPage()

  const erros = []
  page.on('pageerror', (e) => erros.push('PAGEERROR: ' + e.message))
  page.on('dialog', (d) => d.accept().catch(() => {}))

  // --- Upload de cada ficheiro pelo formulário real ---
  const casos = [
    { ficheiro: '_design/testfiles/teste-valido.pdf', etiqueta: 'PDF' },
    { ficheiro: '_design/testfiles/teste-valido.docx', etiqueta: 'DOCX' },
  ]
  const criados = []

  for (const c of casos) {
    await page.goto(BASE + '/documentos/novo', {
      waitUntil: 'networkidle',
      timeout: 120000,
    })
    // setInputFiles pode disparar antes de o React hidratar o onChange —
    // confirmar que o nome aparece no botão; senão, repetir.
    const nomeFicheiro = c.ficheiro.split('/').pop()
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      await page.setInputFiles('input[type="file"]', c.ficheiro)
      try {
        await page.waitForSelector(`text=${nomeFicheiro}`, { timeout: 5000 })
        break
      } catch {
        if (tentativa === 3) throw new Error(`ficheiro ${nomeFicheiro} não ficou selecionado`)
      }
    }
    await page.fill('#doc-titulo', `${MARCA} ${c.etiqueta}`)
    await page.waitForTimeout(400)
    await page.click('button[type="submit"]')
    try {
      await page.waitForURL(/\/documentos$/, { timeout: 60000 })
    } catch {
      // capturar erro mostrado no formulário para diagnóstico
      const erro = await page.locator('p.text-red-600').textContent().catch(() => null)
      throw new Error(`upload ${c.etiqueta} não concluiu. Erro no form: ${erro ?? '(nenhum visível)'}`)
    }
    criados.push(`${MARCA} ${c.etiqueta}`)
    console.log(`upload ${c.etiqueta} OK`)
  }

  // --- Testar previews ---
  await page.goto(BASE + '/documentos', { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForTimeout(1200)

  let falhas = 0
  for (const titulo of criados) {
    const linha = page.locator('li', { hasText: titulo }).first()
    const botao = linha.locator('button[title="Pré-visualizar"]')
    if ((await botao.count()) === 0) {
      console.log(`preview ${titulo}: SEM BOTÃO ✗`)
      falhas++
      continue
    }
    await botao.click()
    const modal = page.locator('[role="dialog"]')
    await modal.waitFor({ state: 'visible', timeout: 15000 })
    await page.waitForTimeout(2500) // fetch + render

    const etiqueta = titulo.split(' ').pop()
    let ok = false
    let detalhe = ''
    if (etiqueta === 'PDF') {
      ok = (await modal.locator('iframe').count()) > 0
      detalhe = 'iframe'
    } else if (etiqueta === 'DOCX') {
      ok = (await modal.locator('.docx-wrapper').count()) > 0
      detalhe = 'docx-wrapper'
      if (!ok) {
        // fallback: verificar se o container tem conteúdo renderizado
        ok = (await modal.locator('[class*="docx"], section').count()) > 0
        detalhe += ' (fallback)'
      }
      if (!ok) {
        const html = await modal.innerHTML().catch(() => '(sem acesso)')
        console.log('DEBUG modal HTML (primeiros 1500):', String(html).slice(0, 1500))
      }
    }

    await page.screenshot({ path: `_design/shots/verify-${etiqueta.toLowerCase()}.png` })
    console.log(`preview ${etiqueta} (${detalhe}): ${ok ? 'OK ✓' : 'FALHOU ✗'}`)
    if (!ok) falhas++

    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
  }

  // --- Limpeza: apagar os documentos criados ---
  for (const titulo of criados) {
    try {
      const linha = page.locator('li', { hasText: titulo }).first()
      await linha.locator('button[title="Eliminar"]').click({ timeout: 5000 })
      await page.waitForTimeout(1500)
      console.log(`limpeza: ${titulo} apagado`)
    } catch {
      console.log(`limpeza: falhou apagar ${titulo} (apagar manualmente)`)
    }
  }

  console.log('erros de página:', erros.length ? erros.slice(0, 3) : 'nenhum')
  console.log(falhas === 0 ? 'VERIFICACAO PREVIEW: TUDO OK' : `VERIFICACAO PREVIEW: ${falhas} falha(s)`)
  await browser.close()
  process.exit(falhas === 0 ? 0 : 1)
})().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(2)
})
