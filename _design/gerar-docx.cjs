// Gera um DOCX mínimo válido (zip com word/document.xml)
const { deflateSync } = require('zlib')
const fs = require('fs')

const tabelaCrc = (() => {
  const t = []
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
const crc32 = (buf) => {
  let c = 0 ^ -1
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ tabelaCrc[(c ^ buf[i]) & 0xff]
  return (c ^ -1) >>> 0
}

function entry(nome, dados) {
  const nb = Buffer.from(nome)
  const comp = deflateSync(dados)
  const h = Buffer.alloc(30)
  h.writeUInt32LE(0x04034b50, 0)
  h.writeUInt16LE(20, 4)
  h.writeUInt16LE(0, 6)
  h.writeUInt16LE(8, 8) // método deflate
  h.writeUInt32LE(crc32(dados), 14)
  h.writeUInt32LE(comp.length, 18)
  h.writeUInt32LE(dados.length, 22)
  h.writeUInt16LE(nb.length, 26)
  return { head: Buffer.concat([h, nb]), comp, nb, raw: dados }
}

const docXml =
  '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
  '<w:p><w:r><w:rPr><w:sz w:val="44"/></w:rPr><w:t>Documento DOCX de teste</w:t></w:r></w:p>' +
  '<w:p><w:r><w:t>Renderizado com docx-preview no Conheca Farmacia.</w:t></w:r></w:p>' +
  '</w:body></w:document>'
const ct =
  '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  '</Types>'
const rels =
  '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  '</Relationships>'

const partes = [
  entry('[Content_Types].xml', Buffer.from(ct)),
  entry('_rels/.rels', Buffer.from(rels)),
  entry('word/document.xml', Buffer.from(docXml)),
]

const locais = []
const central = []
let offset = 0
for (const p of partes) {
  locais.push(p.head, p.comp)
  const h = Buffer.alloc(46)
  h.writeUInt32LE(0x02014b50, 0)
  h.writeUInt16LE(20, 4)
  h.writeUInt16LE(20, 6)
  h.writeUInt32LE(crc32(p.raw), 16)
  h.writeUInt32LE(p.comp.length, 20)
  h.writeUInt32LE(p.raw.length, 24)
  h.writeUInt16LE(p.nb.length, 28)
  h.writeUInt32LE(offset, 42)
  central.push(Buffer.concat([h, p.nb]))
  offset += p.head.length + p.comp.length
}
const cd = Buffer.concat(central)
const eocd = Buffer.alloc(22)
eocd.writeUInt32LE(0x06054b50, 0)
eocd.writeUInt16LE(partes.length, 8)
eocd.writeUInt16LE(partes.length, 10)
eocd.writeUInt32LE(cd.length, 12)
eocd.writeUInt32LE(offset, 16)

const zip = Buffer.concat([...locais, cd, eocd])
fs.writeFileSync('_design/testfiles/teste-valido.docx', zip)
console.log('docx criado:', zip.length, 'bytes')
