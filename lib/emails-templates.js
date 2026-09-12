/**
 * Templates de email para as notificações — em português e com a
 * identidade da marca (verde araucária #00493a sobre fundo neutro).
 *
 * HTML todo em tabelas/estilos inline: clientes de email (Outlook,
 * Gmail, apps móveis) não suportam CSS externo nem flexbox de fiável.
 * Cada tipo tem assunto próprio, parágrafo de contexto e CTA — o
 * fallback `default` cobre tipos futuros sem esquecer ninguém.
 */

const CORES = {
  verde: '#00493a',
  verdeSuave: '#8aa398',
  texto: '#1f2a26',
  textoSuave: '#3d4a44',
  fundo: '#f4f6f5',
  cartao: '#ffffff',
  borda: '#e3e8e5',
  accao: '#00493a',
}

/**
 * Escapar HTML — títulos, motivos e nomes vêm de texto escrito por
 * membros e entram no HTML do email. Sem isto, um título com <script>
 * ou atributos injetados renderizaria como HTML nos clientes de email.
 */
const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

/** Assunto é header, não HTML: remove quebras (injeção de headers). */
const assuntoSeguro = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ')

function base({ kicker, titulo, corpoHtml, ctaHtml, nomeDestinatario, appUrl }) {
  return `<!doctype html>
<html lang="pt">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${CORES.fundo};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CORES.fundo};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
        <tr><td style="padding:0 4px 14px;">
          <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${CORES.verdeSuave};">Conheça Farmácia · Gestão Interna</p>
        </td></tr>
        <tr><td style="background:${CORES.cartao};border:1px solid ${CORES.borda};border-radius:12px;padding:28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding-bottom:6px;">
              <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${CORES.verdeSuave};">${esc(kicker)}</p>
            </td></tr>
            <tr><td style="padding-bottom:14px;">
              <h1 style="margin:0;font-size:19px;line-height:1.35;color:${CORES.verde};">${esc(titulo)}</h1>
            </td></tr>
            <tr><td style="padding-bottom:22px;">
              <p style="margin:0;font-size:14px;line-height:1.65;color:${CORES.textoSuave};">${corpoHtml}</p>
            </td></tr>
            ${ctaHtml}
          </table>
        </td></tr>
        <tr><td style="padding:14px 4px 0;">
          <p style="margin:0;font-size:11px;line-height:1.5;color:#9aa8a1;">
            Olá ${esc(nomeDestinatario)}, é a plataforma interna da equipa.<br/>
            Acesso restrito — recebeu este email por ser membro da Conheça Farmácia.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function botao(url) {
  // O URL entra num atributo href — escapado para não fechar a âncora
  // cedo nem injetar atributos; a construção server-side só gera
  // http(s) (appUrl + caminho interno).
  return `<tr><td>
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background:${CORES.accao};border-radius:8px;">
        <a href="${esc(url)}" style="display:inline-block;padding:11px 20px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">Abrir na app</a>
      </td>
    </tr></table>
  </td></tr>`
}

/**
 * Devolve { assunto, html } para um evento de notificação.
 * `evento`: { tipo, titulo, corpo, link } · `pessoa`: { nome }
 */
export function construirEmail(evento, { appUrl, nomeDestinatario }) {
  const url = evento.link ? `${appUrl}${evento.link}` : appUrl
  const comLink = Boolean(evento.link)
  const cta = comLink ? botao(url) : ''

  switch (evento.tipo) {
    case 'reuniao_convite':
      return {
        assunto: assuntoSeguro(`Convite: ${evento.titulo.replace(/^Convite: /, '')}`),
        html: base({
          kicker: 'Reunião',
          titulo: evento.titulo.replace(/^Convite: /, ''),
          corpoHtml: `Foste convocado para uma reunião da equipa.${evento.corpo ? `<br/><strong>${esc(evento.corpo)}</strong>` : ''}${comLink ? '<br/><br/>Confirma a tua presença na página da reunião.' : ''}`,
          ctaHtml: cta,
          nomeDestinatario,
          appUrl,
        }),
      }

    case 'reuniao_cancelada':
      return {
        assunto: 'Reunião cancelada',
        html: base({
          kicker: 'Reunião',
          titulo: 'A reunião foi cancelada',
          corpoHtml: 'A reunião para que foste convocado foi cancelada pela coordenação. Fica atento a novas datas.',
          ctaHtml: cta,
          nomeDestinatario,
          appUrl,
        }),
      }

    case 'anuncio_novo':
      return {
        assunto: assuntoSeguro(`Anúncio: ${evento.titulo.replace(/^Anúncio: /, '')}`),
        html: base({
          kicker: 'Anúncio',
          titulo: evento.titulo.replace(/^Anúncio: /, ''),
          corpoHtml: `${evento.corpo ? `${esc(evento.corpo)}<br/><br/>` : ''}${
            evento.link
              ? `<a href="${esc(`${appUrl}${evento.link}`)}" style="color:${CORES.verde};font-weight:600;">${
                  evento.link === '/guia'
                    ? 'Clica aqui para ver o guia completo →'
                    : 'Clica aqui para abrir na app →'
                }</a>`
              : comLink
                ? 'Lê o anúncio completo na app.'
                : ''
          }`,
          ctaHtml: cta,
          nomeDestinatario,
          appUrl,
        }),
      }

    case 'ata_publicada':
      return {
        assunto: 'Ata publicada',
        html: base({
          kicker: 'Reunião',
          titulo: 'A ata já está publicada',
          corpoHtml: 'O resumo final da reunião foi publicado — decisões, encaminhamentos e presenças já podem ser consultados.',
          ctaHtml: cta,
          nomeDestinatario,
          appUrl,
        }),
      }

    case 'entrevista_convite':
      return {
        assunto: assuntoSeguro(`Convite para entrevista: ${evento.titulo.replace(/^Convite para entrevista: /, '')}`),
        html: base({
          kicker: 'Entrevista',
          titulo: evento.titulo.replace(/^Convite para entrevista: /, ''),
          corpoHtml: `Foste convidado para uma entrevista (TV, rádio ou media).${evento.corpo ? `<br/><strong>${esc(evento.corpo)}</strong>` : ''}${comLink ? '<br/><br/>Confirma a tua disponibilidade na página da atividade.' : ''}`,
          ctaHtml: cta,
          nomeDestinatario,
          appUrl,
        }),
      }

    case 'subtarefa_atribuida':
      return {
        assunto: assuntoSeguro(`Nova tarefa: ${evento.titulo.replace(/^Nova tarefa: /, '')}`),
        html: base({
          kicker: 'Tarefa',
          titulo: evento.titulo.replace(/^Nova tarefa: /, ''),
          corpoHtml: `Foste atribuído a uma subtarefa pela equipa.${comLink ? '<br/><br/>Abre a atividade para veres os detalhes e o prazo.' : ''}`,
          ctaHtml: cta,
          nomeDestinatario,
          appUrl,
        }),
      }

    default:
      return {
        assunto: assuntoSeguro(evento.titulo),
        html: base({
          kicker: 'Notificação',
          titulo: evento.titulo,
          corpoHtml: esc(evento.corpo || ''),
          ctaHtml: cta,
          nomeDestinatario,
          appUrl,
        }),
      }
  }
}
