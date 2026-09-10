import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, MessageCircle, Phone } from 'lucide-react'
import { getUtilizadorAtual } from '@/lib/supabase/server'
import { obterPessoa, listarCargaMembro, formatarData } from '@/lib/dados'
import { linkTelefone, linkWhatsapp } from '@/lib/contactos'
import FormContactos from './FormContactos'

export const metadata = { title: 'Perfil' }

/**
 * Perfil de um membro da equipa: identidade (nome, email, papel),
 * contactos tocáveis — telefone abre o teclado de chamadas, WhatsApp
 * abre a conversa — e carga de trabalho. No próprio perfil, os
 * contactos são editáveis.
 */
export default async function PaginaPerfil({ params }) {
  const { id } = await params
  const { pessoa: atual } = await getUtilizadorAtual()
  const pessoa = await obterPessoa(id)
  if (!pessoa) notFound()

  const souEu = pessoa.id === atual.id
  const { atividades, subtarefas } = await listarCargaMembro(pessoa.id)

  const concluidas = subtarefas.filter((s) => s.status === 'concluida').length
  const semContactos = !pessoa.telefone && !pessoa.whatsapp

  return (
    <div className="container-app max-w-4xl">
      <Link
        href="/equipa"
        className="inline-flex items-center gap-2 text-sm text-brand-deep/55 hover:text-brand-primary mb-7 transition-colors"
      >
        <ArrowLeft size={15} />
        Voltar à equipa
      </Link>

      {/* Cabeçalho editorial: sem cartão, régua forte */}
      <header className="page-head">
        <div className="flex items-center gap-5">
          <span
            className={`w-16 h-16 rounded-full grid place-items-center font-bold text-xl shrink-0 ${
              pessoa.role === 'super_admin'
                ? 'bg-brand-primary text-white'
                : 'bg-brand-bg-alt border border-brand-divider text-brand-deep'
            }`}
            aria-hidden="true"
          >
            {pessoa.nome.split(/\s+/).slice(0, 2).map((x) => x[0].toUpperCase()).join('')}
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-[34px] font-extrabold text-brand-deep tracking-tight leading-[1.15] flex flex-wrap items-center gap-x-3 gap-y-1">
              {pessoa.nome}
              {souEu && (
                <span className="text-sm font-normal text-brand-deep/40">(tu)</span>
              )}
            </h1>
            <p className="text-brand-deep/55 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <a
                href={`mailto:${pessoa.email}`}
                className="inline-flex items-center gap-1.5 hover:text-brand-primary transition-colors"
              >
                <Mail size={14} />
                {pessoa.email}
              </a>
              <span className={`role-pill ${pessoa.role === 'super_admin' ? 'role-super' : 'role-membro'}`}>
                {pessoa.role === 'super_admin' ? 'Coordenação' : 'Membro'}
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* 01 · Contactos */}
      <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
        <span className="sec-num">01</span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-brand-deep tracking-tight">Contactos</h2>
          <p className="text-[13.5px] text-brand-deep/55 mt-1 leading-relaxed">
            {souEu
              ? 'Adiciona o teu número para a equipa te poder ligar ou enviar mensagem.'
              : 'Toca no número para ligar ou no WhatsApp para abrir a conversa.'}
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            {/* Telefone → teclado de chamadas */}
            {pessoa.telefone ? (
              <a
                href={linkTelefone(pessoa.telefone)}
                className="panel px-4 py-3.5 flex items-center gap-3.5 hover:border-brand-accent/50 transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary grid place-items-center shrink-0">
                  <Phone size={16} />
                </span>
                <span className="min-w-0">
                  <span className="meta-label !mb-0">Telefone</span>
                  <span className="block text-sm font-semibold text-brand-deep truncate">
                    {pessoa.telefone}
                  </span>
                </span>
              </a>
            ) : (
              <div className="panel px-4 py-3.5 flex items-center gap-3.5 opacity-60">
                <span className="w-9 h-9 rounded-lg bg-brand-primary/5 text-brand-deep/40 grid place-items-center shrink-0">
                  <Phone size={16} />
                </span>
                <span className="min-w-0">
                  <span className="meta-label !mb-0">Telefone</span>
                  <span className="block text-sm text-brand-deep/50">
                    {souEu ? 'Ainda sem número' : 'Não partilhado'}
                  </span>
                </span>
              </div>
            )}

            {/* WhatsApp → conversa no aplicativo */}
            {pessoa.whatsapp ? (
              <a
                href={linkWhatsapp(pessoa.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="panel px-4 py-3.5 flex items-center gap-3.5 hover:border-brand-accent/50 transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-brand-accent/10 text-brand-accent grid place-items-center shrink-0">
                  <MessageCircle size={16} />
                </span>
                <span className="min-w-0">
                  <span className="meta-label !mb-0">WhatsApp</span>
                  <span className="block text-sm font-semibold text-brand-deep truncate">
                    {pessoa.whatsapp}
                  </span>
                </span>
              </a>
            ) : (
              <div className="panel px-4 py-3.5 flex items-center gap-3.5 opacity-60">
                <span className="w-9 h-9 rounded-lg bg-brand-accent/5 text-brand-deep/40 grid place-items-center shrink-0">
                  <MessageCircle size={16} />
                </span>
                <span className="min-w-0">
                  <span className="meta-label !mb-0">WhatsApp</span>
                  <span className="block text-sm text-brand-deep/50">
                    {souEu ? 'Ainda sem número' : 'Não partilhado'}
                  </span>
                </span>
              </div>
            )}
          </div>

          {semContactos && souEu && (
            <p className="text-[13px] text-brand-deep/45 mt-3">
              Adiciona o teu número abaixo — fica visível para toda a equipa.
            </p>
          )}

          {/* Edição: só o próprio */}
          {souEu && (
            <div className="mt-7">
              <FormContactos pessoa={pessoa} />
            </div>
          )}
        </div>
      </section>

      {/* 02 · Atividades e eventos — só as de topo, responsável */}
      <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
        <span className="sec-num">02</span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-brand-deep tracking-tight">
            Atividades e eventos
          </h2>
          <p className="text-[13.5px] text-brand-deep/55 mt-1">
            {atividades.length === 0
              ? 'Sem atividades de topo atribuídas.'
              : `${atividades.length} em que ${souEu ? 'és' : 'é'} responsável.`}
          </p>

          {atividades.length > 0 && (
            <ul className="mt-4">
              {atividades.map((a) => (
                <li key={a.id} className="border-b border-brand-divider py-3">
                  <Link
                    href={`/atividades/${a.id}`}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 group"
                  >
                    <span className={`badge ${classeTipo(a.tipo)}`}>{rotuloTipo(a.tipo)}</span>
                    <span className="font-semibold text-brand-deep text-[14.5px] group-hover:text-brand-primary transition-colors">
                      {a.titulo}
                    </span>
                    {a.prazo && (
                      <span className="text-[12.5px] text-brand-deep/45 tabular-nums ml-auto">
                        {formatarData(a.prazo)}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 03 · Subtarefas atribuídas */}
      <section className="grid grid-cols-[44px_minmax(0,1fr)] gap-x-5 gap-y-4 py-9 border-t border-brand-divider">
        <span className="sec-num">03</span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-brand-deep tracking-tight">Subtarefas</h2>
            {subtarefas.length > 0 && (
              <span className="text-sm text-brand-deep/45 tabular-nums">
                <strong className="text-brand-deep">{concluidas}</strong>
                /{subtarefas.length} concluídas
              </span>
            )}
          </div>

          {subtarefas.length === 0 ? (
            <p className="text-[13.5px] text-brand-deep/55 mt-1">
              Sem subtarefas atribuídas.
            </p>
          ) : (
            <ul className="mt-4">
              {subtarefas.map((s) => (
                <li key={s.id} className="border-b border-brand-divider py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={`badge ${classeStatus(s.status)} normal-case`}>
                    {rotuloStatus(s.status)}
                  </span>
                  <span className="font-medium text-brand-deep text-[14px] min-w-0 truncate">
                    {s.titulo}
                  </span>
                  {s.atividade_id && (
                    <Link
                      href={`/atividades/${s.atividade_id}`}
                      className="text-[12.5px] text-brand-deep/45 hover:text-brand-primary transition-colors ml-auto shrink-0"
                    >
                      ver atividade
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function classeTipo(tipo) {
  return { atividade: 'badge-tipo-atividade', evento: 'badge-tipo-evento', entrevista: 'badge-tipo-entrevista' }[tipo]
}
function rotuloTipo(tipo) {
  return { atividade: 'Atividade', evento: 'Evento', entrevista: 'Entrevista' }[tipo]
}
function classeStatus(status) {
  return {
    pendente_aprovacao: 'badge-status-pendente',
    aprovada: 'badge-status-aprovada',
    rejeitada: 'badge-status-rejeitada',
    concluida: 'badge-status-concluida',
  }[status] ?? 'badge-status-pendente'
}
function rotuloStatus(status) {
  return {
    pendente_aprovacao: 'Pendente',
    aprovada: 'Aprovada',
    rejeitada: 'Rejeitada',
    concluida: 'Concluída',
  }[status] ?? status
}
