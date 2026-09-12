// Gera os ícones do PWA a partir do logo oficial (public/logo/logo_branco.png).
// Executar: node scripts/gerar-icones-pwa.mjs   (requer: npm i -D sharp — já instalado)
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { dirname, join, dirname as pathDirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const origem = join(raiz, 'public', 'logo', 'logo_branco.png')
const destinoDir = join(raiz, 'public', 'icons')
mkdirSync(destinoDir, { recursive: true })

// Fundo verde-escuro da marca (--color-sidebar: #003528) — o logo é branco
// e fica correto sobre ele, em claro e escuro.
const FUNDO = { r: 0, g: 53, b: 40, alpha: 1 }

const icones = [
  { nome: 'icon-192.png', tamanho: 192 },
  { nome: 'icon-512.png', tamanho: 512 },
  { nome: 'icon-maskable-192.png', tamanho: 192, maskable: true },
  { nome: 'icon-maskable-512.png', tamanho: 512, maskable: true },
  { nome: 'apple-touch-icon.png', tamanho: 180 },
]

for (const { nome, tamanho, maskable = false } of icones) {
  // Maskable: arte em 80% da área (safe zone), resto é fundo sólido
  const conteudo = Math.round(tamanho * (maskable ? 0.8 : 0.92))
  const margem = Math.round((tamanho - conteudo) / 2)

  await sharp(origem)
    .resize(conteudo, conteudo, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
    .then((buf) =>
      sharp({
        create: {
          width: tamanho,
          height: tamanho,
          channels: 4,
          background: maskable ? FUNDO : { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([{ input: buf, top: maskable ? margem : Math.round(tamanho * 0.04), left: margem }])
        .png()
        .toFile(join(destinoDir, nome))
    )
  console.log('✓', nome)
}
console.log('Ícones do PWA gerados em public/icons/')
