'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, MessageCircle, Phone, Trash2 } from 'lucide-react'
import { alterarRole, removerMembro } from './actions'
import { linkTelefone, linkWhatsapp } from '@/lib/contactos'
import { useConfirmacao } from '@/components/CaixaConfirmacao'

/**
 * Lista da equipa. Em modo coordenação (ehSuper) mantém a gestão de
 * papéis e remoção; para os restantes membros é uma directoria de
 * leitura. Clicar numa linha abre o perfil; os números ficam sempre
 * tocáveis — ligação ou conversa WhatsApp.
 */
export default function ListaEquipa({ equipa, pessoaAtualId, ehSuper = false }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(null)
  const [erro, setErro] = useState(null)
  const [pedirConfirmacao, caixaConfirmacao] = useConfirmacao()

  async function mudarRole(id, role) {
    setAProcessar(id)
    setErro(null)
    try {
      const r = await alterarRole(id, role)
      if (!r.ok) setErro(r.erro)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  async function remover(id, nome) {
    const ok = await pedirConfirmacao({
      titulo: `Remover o acesso de ${nome}?`,
      descricao:
        'A conta é desativada — sem login — e a pessoa sai da equipa. O histórico (notas, atividades) continua a mostrar o nome. Para reativar, cria conta com o mesmo email.',
      confirmarTxt: 'Remover acesso',
      perigoso: true,
    })
    if (!ok) return
    setAProcessar(id)
    setErro(null)
    try {
      const r = await removerMembro(id)
      if (!r.ok) setErro(r.erro)
      router.refresh()
    } finally {
      setAProcessar(null)
    }
  }

  return (
    <div>
      {erro && (
        <p className="text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mt-4">
          {erro}
        </p>
      )}
      <ul>
        {equipa.map((p) => {
          const souEu = p.id === pessoaAtualId
          return (
            <li
              key={p.id}
              className="border-b border-brand-divider py-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2.5 items-center hover:bg-brand-primary/[0.03] transition-colors"
            >
              {/* Quem — a linha abre o perfil */}
              <Link
                href={`/equipa/${p.id}`}
                className="flex items-center gap-3 min-w-0 group"
                aria-label={`Ver perfil de ${p.nome}`}
              >
                <span
                  className={`w-10 h-10 rounded-full grid place-items-center font-bold text-[13px] shrink-0 ${
                    p.role === 'super_admin'
                      ? 'bg-brand-primary text-white'
                      : 'bg-brand-bg-alt border border-brand-divider text-brand-deep'
                  }`}
                  aria-hidden="true"
                >
                  {p.nome.split(/\s+/).slice(0, 2).map((x) => x[0].toUpperCase()).join('')}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-brand-deep text-[14.5px] truncate group-hover:text-brand-primary transition-colors">
                    {p.nome}
                    {souEu && (
                      <span className="ml-2 text-xs font-normal text-brand-deep/40">(tu)</span>
                    )}
                  </p>
                  <p className="text-[12.5px] text-brand-deep/50 truncate">{p.email}</p>
                </div>
              </Link>

              {/* Papel + ações (só coordenação) */}
              {ehSuper ? (
                aProcessar === p.id ? (
                  <Loader2 size={18} className="animate-spin text-brand-accent" />
                ) : souEu ? (
                  <span className={`role-pill ${p.role === 'super_admin' ? 'role-super' : 'role-membro'}`}>
                    {p.role === 'super_admin' ? 'Coordenação' : 'Membro'}
                  </span>
                ) : (
                  <div className="flex items-center gap-2 justify-end">
                    <select
                      value={p.role}
                      onChange={(e) => mudarRole(p.id, e.target.value)}
                      aria-label={`Papel de ${p.nome}`}
                      className="form-select !w-auto !py-1.5 !pr-8 text-[13px]"
                    >
                      <option value="admin">Membro</option>
                      <option value="super_admin">Coordenação</option>
                    </select>
                    <button
                      onClick={() => remover(p.id, p.nome)}
                      title="Remover acesso"
                      aria-label={`Remover acesso de ${p.nome}`}
                      className="w-8 h-8 grid place-items-center rounded-lg text-red-500/60 hover:text-red-600 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-1.5 justify-end">
                  {p.telefone && (
                    <a
                      href={linkTelefone(p.telefone)}
                      title={`Ligar para ${p.nome}`}
                      aria-label={`Ligar para ${p.nome}`}
                      className="w-8 h-8 grid place-items-center rounded-lg text-brand-deep/45 hover:text-brand-primary hover:bg-brand-primary/10 transition-colors"
                    >
                      <Phone size={15} />
                    </a>
                  )}
                  {p.whatsapp && (
                    <a
                      href={linkWhatsapp(p.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`WhatsApp de ${p.nome}`}
                      aria-label={`Abrir WhatsApp de ${p.nome}`}
                      className="w-8 h-8 grid place-items-center rounded-lg text-brand-deep/45 hover:text-brand-accent hover:bg-brand-accent/10 transition-colors"
                    >
                      <MessageCircle size={15} />
                    </a>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {caixaConfirmacao}
    </div>
  )
}
