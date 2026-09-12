'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { mudarVisibilidadeReuniao } from '../actions'

/**
 * Alterna a visibilidade de uma reunião já criada: toda a equipa ↔
 * só coordenação. Ao tornar privada, os convites de membros não-
 * coordenadores são retirados (aviso ao utilizador antes de confirmar).
 */
export default function ControleVisibilidade({ reuniaoId, visibilidade }) {
  const router = useRouter()
  const [aProcessar, setAProcessar] = useState(false)

  async function alternar() {
    const destino = visibilidade === 'coordenacao' ? 'equipa' : 'coordenacao'
    const msg =
      destino === 'coordenacao'
        ? 'Tornar esta reunião privada? Os convites de membros fora da coordenação serão retirados.'
        : 'Abrir esta reunião a toda a equipa?'
    if (!confirm(msg)) return

    setAProcessar(true)
    try {
      const r = await mudarVisibilidadeReuniao(reuniaoId, destino)
      if (!r.ok) alert(r.erro || 'Não foi possível mudar a visibilidade.')
      router.refresh()
    } finally {
      setAProcessar(false)
    }
  }

  if (visibilidade === 'coordenacao') {
    return (
      <button
        onClick={alternar}
        disabled={aProcessar}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-deep/50 hover:text-brand-primary transition-colors disabled:opacity-50"
      >
        {aProcessar ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
        Tornar visível a toda a equipa
      </button>
    )
  }

  return (
    <button
      onClick={alternar}
      disabled={aProcessar}
      className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-deep/50 hover:text-brand-primary transition-colors disabled:opacity-50"
    >
      {aProcessar ? <Loader2 size={13} className="animate-spin" /> : <EyeOff size={13} />}
      Tornar privada (só coordenação)
    </button>
  )
}
