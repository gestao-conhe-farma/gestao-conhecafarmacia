/**
 * Estrutura comum da ata — usada pelos geradores DOCX e PDF.
 * Mantém a formatação num único sítio para os dois formatos saírem iguais.
 */
export function construirAta(reuniao) {
  const data = new Date(reuniao.data_hora)
  const quando = data.toLocaleString('pt-PT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const presencas = (reuniao.reuniao_participantes ?? []).map((p) => {
    const nome = p.pessoas?.nome ?? '—'
    const estado =
      p.presenca === 'presente'
        ? 'Presente'
        : p.presenca === 'ausente'
          ? 'Ausente'
          : p.presenca === 'justificado'
            ? 'Ausência justificada'
            : p.status === 'confirmado'
              ? 'Confirmado'
              : 'Convocado'
    return `${nome} — ${estado}`
  })

  const pontosPauta = (reuniao.pauta || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const planos = (reuniao.planos ?? []).map((plano) => {
    const votos = { favor: 0, contra: 0, abstencao: 0 }
    plano.reuniao_plano_votos?.forEach((v) => {
      if (votos[v.voto] !== undefined) votos[v.voto]++
    })
    const destino = plano.atividade_id
      ? ' → convertida em atividade/evento'
      : ''
    return {
      titulo: plano.titulo,
      descricao: plano.descricao || '',
      resultado:
        plano.decisao === 'aprovado'
          ? `Aprovado (${votos.favor} a favor, ${votos.contra} contra, ${votos.abstencao} abstenções)${destino}`
          : plano.decisao === 'rejeitado'
            ? `Rejeitado (${votos.favor} a favor, ${votos.contra} contra, ${votos.abstencao} abstenções)`
            : `Em votação (${votos.favor} a favor, ${votos.contra} contra, ${votos.abstencao} abstenções)`,
    }
  })

  return {
    titulo: reuniao.titulo,
    tipo: reuniao.tipo === 'urgente' ? 'Reunião urgente' : 'Reunião mensal',
    quando,
    local: reuniao.local || '—',
    convocou: reuniao.criado_por?.nome || '—',
    pontosPauta,
    presencas,
    notas: (reuniao.notas ?? []).map((n) => ({
      autor: n.autor?.nome || '—',
      data: new Date(n.criado_em).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      texto: n.conteudo,
    })),
    planos,
    resumo: reuniao.resumo || '',
    publicadaEm: reuniao.resumo_publicado_em
      ? new Date(reuniao.resumo_publicado_em).toLocaleDateString('pt-PT', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null,
  }
}
