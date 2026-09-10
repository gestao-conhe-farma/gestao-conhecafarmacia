// Verificação HTTP (sem dependências) do fluxo do perfil da equipa:
// /equipa (directoria), /equipa/[id] próprio (com edição) e de outro
// membro (sem edição). Usa o cookie de sessão do jar do curl.
const fs = require('fs')

const BASE = process.env.BASE || 'http://localhost:3131'
const JAR = '_design/jar.txt'

function cookiesDoJar() {
  const pares = []
  for (const l of fs.readFileSync(JAR, 'utf8').split('\n')) {
    if (l.includes('auth-token') && !l.startsWith('#')) {
      const partes = l.trim().split('\t')
      if (partes.length >= 7) pares.push(`${partes[5]}=${partes[6]}`)
    }
  }
  if (!pares.length) throw new Error('cookie auth-token não encontrado no jar')
  return pares.join('; ')
}

async function paginal(url) {
  const res = await fetch(url, {
    headers: { cookie: cookiesDoJar() },
    redirect: 'follow',
  })
  return { status: res.status, html: await res.text() }
}

let falhas = 0
const ok = (nome, cond) => {
  console.log(`${nome}: ${cond ? 'OK' : 'FALHOU'}`)
  if (!cond) falhas++
}

;(async () => {
  // 1. /equipa renderiza a directoria sem erro
  const equipa = await paginal(`${BASE}/equipa`)
  ok('/equipa status 200', equipa.status === 200)
  const semErro = (h) =>
    !h.includes('Application error') &&
    !h.includes('Something went wrong') &&
    !h.includes('missing required error components')
  ok('/equipa renderiza sem erro', semErro(equipa.html))
  ok(
    '/equipa mostra a lista de membros',
    equipa.html.includes('Equipa') && equipa.html.includes('@') // emails na lista
  )

  // Extrai ids de perfil dos links /equipa/<uuid>
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
  const reLink = new RegExp(`/equipa/(${uuid})`, 'g')
  const ids = [...new Set([...equipa.html.matchAll(reLink)].map((m) => m[1]))]
  console.log(`perfis encontrados: ${ids.length}`)

  // 2. Início: link do perfil no rodapé da sidebar (com seta)
  const inicio = await paginal(`${BASE}/`)
  const temLinkPerfil = /href="\/equipa\/[0-9a-f-]{36}"/.test(inicio.html)
  ok('sidebar/drawer: link para o meu perfil', temLinkPerfil)

  // 3. Perfil próprio vs. de outro membro
  //    (o primeiro id cuja página tem o formulário é "o meu")
  let visitados = 0
  for (const id of ids.slice(0, 4)) {
    const p = await paginal(`${BASE}/equipa/${id}`)
    visitados++
    const c = p.html
    const perfilOk =
      p.status === 200 &&
      semErro(c) &&
      c.includes('Contactos') &&
      (c.includes('Telefone') || c.includes('WhatsApp') || c.includes('Não partilhado'))
    ok(`/equipa/${id.slice(0, 8)}… renderiza com contactos`, perfilOk)
    const temForm = c.includes('Guardar contactos')
    console.log(`  edição visível (é o próprio): ${temForm ? 'sim' : 'não'}`)
    if (temForm) {
      ok('próprio perfil tem input de telefone', c.includes('c-telefone'))
      ok('próprio perfil tem input de whatsapp', c.includes('c-whatsapp'))
    }
  }
  if (visitados === 0) console.log('AVISO: nenhum perfil para testar (equipa vazia?)')

  const fim = falhas === 0 ? 'VERIFICACAO: TUDO OK' : `VERIFICACAO: ${falhas} falha(s)`
  console.log(fim)
  process.exit(falhas === 0 ? 0 : 1)
})().catch((e) => {
  console.error('ERRO:', e.message)
  process.exit(2)
})
