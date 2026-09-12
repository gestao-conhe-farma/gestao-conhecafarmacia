/** Plataformas, cores e rótulos do calendário de conteúdo — partilhados entre lista e calendário. */

export const PLATAFORMAS = ['facebook', 'instagram', 'tiktok', 'youtube']

export const CORES_PLATAFORMA = {
  facebook: { dot: 'bg-blue-600', chip: 'bg-blue-600/10 text-blue-700', label: 'Facebook' },
  instagram: { dot: 'bg-pink-500', chip: 'bg-pink-500/10 text-pink-700', label: 'Instagram' },
  tiktok: { dot: 'bg-neutral-900', chip: 'bg-neutral-900/10 text-neutral-700', label: 'TikTok' },
  youtube: { dot: 'bg-red-600', chip: 'bg-red-600/10 text-red-700', label: 'YouTube' },
}

export const CORES_ESTADO = {
  ideia: { chip: 'bg-slate-500/10 text-slate-600', label: 'Ideia' },
  planeado: { chip: 'bg-violet-500/10 text-violet-700', label: 'Planeado' },
  produzido: { chip: 'bg-amber-500/10 text-amber-700', label: 'Produzido' },
  agendado: { chip: 'bg-sky-500/10 text-sky-700', label: 'Agendado' },
  publicado: { chip: 'bg-emerald-500/10 text-emerald-700', label: 'Publicado' },
}

export function rotuloPlataforma(p) {
  return CORES_PLATAFORMA[p]?.label ?? p
}

export function rotuloEstado(e) {
  return CORES_ESTADO[e]?.label ?? e
}
