// Smoke test visual: login + todas as páginas em desktop e mobile.
// Verifica overflow horizontal (o problema do /equipa) e tira screenshots.
const { chromium } = require('playwright')

const BASE = 'http://localhost:3128'
const PAGES = ['/', '/atividades', '/documentos', '/entrevistas', '/equipa', '/aprovacoes', '/definicoes', '/atividades/nova']
const EMAIL = 'baptistalimab@gmail.com'
const PASS = '@bjaysh18'

async function verificar(page, rota, label) {
  await page.goto(BASE + rota, { waitUntil: 'networkidle' })
  const url = page.url()
  if (url.includes('/login')) return `${label} ${rota} -> REDIRECT LOGIN (sessão falhou)`

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    const horiz = doc.scrollWidth - doc.clientWidth
    // encontrar os maiores culpados de overflow, se existir
    let culpados = []
    if (horiz > 2) {
      culpados = [...document.querySelectorAll('*')]
        .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 2)
        .slice(0, 3)
        .map((el) => `${el.tagName}.${String(el.className).split(' ')[0]} (+${Math.round(el.getBoundingClientRect().right - doc.clientWidth)}px)`)
    }
    return { horiz, culpados }
  })

  const estado = overflow.horiz > 2 ? `OVERFLOW +${overflow.horiz}px [${overflow.culpados.join(' | ')}]` : 'ok'
  const slug = rota === '/' ? 'home' : rota.replaceAll('/', '_')
  await page.screenshot({ path: `_design/shots/${label}${slug}.png`, fullPage: false })
  return `${label} ${rota} -> ${estado}`
}

;(async () => {
  const browser = await chromium.launch()

  // Desktop
  const desktop = await browser.newPage({ viewport: { width: 1366, height: 850 } })
  await desktop.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await desktop.fill('input[type="email"]', EMAIL)
  await desktop.fill('input[type="password"]', PASS)
  await desktop.click('button[type="submit"]')
  await desktop.waitForURL(BASE + '/', { timeout: 15000 })
  console.log('login desktop OK')

  for (const rota of PAGES) {
    console.log(await verificar(desktop, rota, 'desktop'))
  }

  // Mobile
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await mobile.goto(BASE + '/login', { waitUntil: 'networkidle' })
  await mobile.fill('input[type="email"]', EMAIL)
  await mobile.fill('input[type="password"]', PASS)
  await mobile.click('button[type="submit"]')
  await mobile.waitForURL(BASE + '/', { timeout: 15000 })
  console.log('login mobile OK')

  for (const rota of PAGES) {
    console.log(await verificar(mobile, rota, 'mobile'))
  }

  // Drawer mobile
  await mobile.goto(BASE + '/', { waitUntil: 'networkidle' })
  await mobile.click('button[aria-label="Abrir menu"]')
  await mobile.waitForTimeout(500)
  await mobile.screenshot({ path: '_design/shots/mobile_drawer.png' })
  console.log('drawer screenshot OK')

  await browser.close()
})()
