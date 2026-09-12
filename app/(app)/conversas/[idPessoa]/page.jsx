import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { exigirUtilizador } from '@/lib/supabase/server'
import { obterPessoa, listarMensagens, canalDM } from '@/lib/dados'
import SecaoConversa from '../../chats/SecaoConversa'

export const metadata = { title: 'Conversa' }

/**
 * Conversa direta entre o membro atual e um colega. O canal é
 * dm:<meuId>:<idPessoa> (ids ordenados) — visível apenas aos dois,
 * imposto por RLS (pode_ver_canal). Se o colega não existir ou estiver
 * desativado, a conversa continua legível (histórico) mas o parceiro
 * aparece como ex-membro.
 */
export default async function PaginaConversa({ params }) {
  const { idPessoa } = await params
  const { pessoa: atual } = await exigirUtilizador()

  const parceiro = await obterPessoa(idPessoa)
  if (!parceiro) notFound()
  if (idPessoa === atual.id) {
    // Conversa consigo próprio não existe — volta ao hub
    return <ConversaInvalida />
  }

  const canal = canalDM(atual.id, idPessoa)
  const mensagens = await listarMensagens(canal).catch(() => [])

  return (
    <div className="container-app max-w-3xl">
      <Link
        href="/conversas"
        className="inline-flex items-center gap-2 text-sm text-brand-deep/55 hover:text-brand-primary mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Todas as conversas
      </Link>

      <header className="flex items-center gap-4 mb-7">
        <span
          className={`w-12 h-12 rounded-full grid place-items-center font-bold text-sm shrink-0 ${
            parceiro.role === 'super_admin'
              ? 'bg-brand-primary text-white'
              : 'bg-brand-bg-alt border border-brand-divider text-brand-deep'
          }`}
          aria-hidden="true"
        >
          {parceiro.nome.split(/\s+/).slice(0, 2).map((x) => x[0].toUpperCase()).join('')}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-brand-deep tracking-tight leading-tight flex items-center gap-2.5">
            {parceiro.nome}
            <span className={`role-pill ${parceiro.role === 'super_admin' ? 'role-super' : 'role-membro'}`}>
              {parceiro.role === 'super_admin' ? 'Coordenação' : 'Membro'}
            </span>
            {!parceiro.ativo && (
              <span className="role-pill bg-red-500/10 text-red-600 normal-case">Ex-membro</span>
            )}
          </h1>
          <p className="text-[13px] text-brand-deep/50 mt-0.5">
            {parceiro.ativo
              ? 'Só vocês dois vêem esta conversa.'
              : 'Membro desativado — a conversa fica como histórico.'}
          </p>
        </div>
      </header>

      <div className="card p-4 md:p-5">
        <SecaoConversa
          canal={canal}
          mensagensIniciais={mensagens}
          meuId={atual.id}
          placeholder={`Mensagem para ${parceiro.nome.split(' ')[0]}…`}
        />
      </div>
    </div>
  )
}

function ConversaInvalida() {
  return (
    <div className="container-app max-w-3xl">
      <Link
        href="/conversas"
        className="inline-flex items-center gap-2 text-sm text-brand-deep/55 hover:text-brand-primary mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Todas as conversas
      </Link>
      <div className="card empty-state border-dashed">
        <p className="font-semibold text-brand-deep">Não é possível abrir esta conversa.</p>
        <p className="text-sm mt-1">Escolhe um membro da equipa na lista de conversas.</p>
      </div>
    </div>
  )
}
