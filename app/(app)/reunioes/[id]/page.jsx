import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileDown } from 'lucide-react'
import { exigirUtilizador } from '@/lib/supabase/server'
import {
  obterReuniao,
  listarNotasReuniao,
  listarPlanosReuniao,
  listarAnexosReuniao,
  listarEquipa,
} from '@/lib/dados'
import SecaoPautaPresencas from './SecaoPautaPresencas'
import EditarReuniao from './EditarReuniao'
import SecaoNotas from './SecaoNotas'
import SecaoPlanos from './SecaoPlanos'
import SecaoResumo from './SecaoResumo'
import SecaoAnexos from './SecaoAnexos'
import ControleVisibilidade from './ControleVisibilidade'

export const metadata = { title: 'Reunião' }

export default async function PaginaReuniao({ params }) {
  const { id } = await params
  const { pessoa } = await exigirUtilizador()
  const reuniao = await obterReuniao(id)
  if (!reuniao) notFound()

  const [notas, planos, anexos, equipa] = await Promise.all([
    listarNotasReuniao(id),
    listarPlanosReuniao(id),
    listarAnexosReuniao(id),
    listarEquipa(),
  ])

  const ehSuper = pessoa.role === 'super_admin'
  const meuConvite = reuniao.reuniao_participantes?.find((p) => p.pessoa_id === pessoa.id)
  const ataPublicada = Boolean(reuniao.resumo_publicado_em)

  return (
    <div className="container-app max-w-4xl">
      <Link
        href="/reunioes"
        className="inline-flex items-center gap-2 text-sm text-brand-deep/55 hover:text-brand-primary mb-7 transition-colors"
      >
        <ArrowLeft size={15} />
        Voltar às reuniões
      </Link>

      {/* Cabeçalho */}
      <header className="page-head">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className={`badge ${
              reuniao.tipo === 'urgente'
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-brand-primary/10 text-brand-primary'
            }`}
          >
            {reuniao.tipo === 'urgente' ? 'Urgente' : 'Mensal'}
          </span>
          {reuniao.estado === 'realizada' && (
            <span className="badge badge-status-concluida normal-case">Realizada</span>
          )}
          {reuniao.estado === 'cancelada' && (
            <span className="badge bg-red-500/10 text-red-600 normal-case">Cancelada</span>
          )}
          {ataPublicada && (
            <span className="badge badge-status-confirmado normal-case">Ata publicada</span>
          )}
          {reuniao.visibilidade === 'coordenacao' && (
            <span className="badge bg-brand-deep/5 text-brand-deep/60 normal-case border border-brand-divider">
              Privada — só coordenação
            </span>
          )}
        </div>

        <h1 className="text-2xl md:text-[34px] font-extrabold text-brand-deep leading-[1.15] tracking-tight">
          {reuniao.titulo}
        </h1>

        <div className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
          <div>
            <span className="meta-label">Quando</span>
            <span className="text-sm font-semibold text-brand-deep">
              {new Date(reuniao.data_hora).toLocaleString('pt-PT', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          {reuniao.local && (
            <div>
              <span className="meta-label">Local</span>
              <span className="text-sm font-semibold text-brand-deep">{reuniao.local}</span>
            </div>
          )}
          <div>
            <span className="meta-label">Convocou</span>
            <span className="text-sm font-semibold text-brand-deep">
              {reuniao.criado_por?.nome}
            </span>
          </div>
          <div>
            <span className="meta-label">Exportar ata</span>
            <span className="flex gap-2 mt-1">
              <a
                href={`/reunioes/${id}/ata?formato=docx`}
                className="btn btn-small btn-ghost border border-brand-divider text-brand-deep/70"
              >
                <FileDown size={13} />
                DOCX
              </a>
              <a
                href={`/reunioes/${id}/ata?formato=pdf`}
                className="btn btn-small btn-ghost border border-brand-divider text-brand-deep/70"
              >
                <FileDown size={13} />
                PDF
              </a>
            </span>
          </div>
        </div>

        {/* Visibilidade: coordenação alterna entre toda a equipa e privada */}
        {ehSuper && reuniao.estado === 'agendada' && (
          <div className="mt-4">
            <ControleVisibilidade reuniaoId={reuniao.id} visibilidade={reuniao.visibilidade} />
          </div>
        )}

        {/* Editar detalhes: coordenação, enquanto a reunião está agendada */}
        {ehSuper && reuniao.estado === 'agendada' && (
          <EditarReuniao
            reuniao={{
              id: reuniao.id,
              titulo: reuniao.titulo,
              tipo: reuniao.tipo,
              data_hora: reuniao.data_hora,
              local: reuniao.local,
              pauta: reuniao.pauta,
            }}
          />
        )}
      </header>

      {/* 01 — Pauta e presenças */}
      <SecaoPautaPresencas
        reuniaoId={id}
        pauta={reuniao.pauta}
        participantes={reuniao.reuniao_participantes ?? []}
        equipa={equipa}
        ehSuper={ehSuper}
        meuConvite={meuConvite ?? null}
        estado={reuniao.estado}
        num="01"
      />

      {/* 02 — Notas da equipa */}
      <SecaoNotas
        reuniaoId={id}
        notas={notas}
        pessoaAtualId={pessoa.id}
        ehSuper={ehSuper}
        ataPublicada={ataPublicada}
        num="02"
      />

      {/* 03 — Planos */}
      <SecaoPlanos
        reuniaoId={id}
        planos={planos}
        equipa={equipa}
        pessoaAtualId={pessoa.id}
        ehSuper={ehSuper}
        ataPublicada={ataPublicada}
        num="03"
      />

      {/* 04 — Resumo final */}
      <SecaoResumo
        reuniaoId={id}
        resumo={reuniao.resumo}
        ataPublicada={ataPublicada}
        estado={reuniao.estado}
        ehSuper={ehSuper}
        num="04"
      />

      {/* 05 — Anexos */}
      <SecaoAnexos
        reuniaoId={id}
        anexos={anexos}
        ehSuper={ehSuper}
        num="05"
      />
    </div>
  )
}
