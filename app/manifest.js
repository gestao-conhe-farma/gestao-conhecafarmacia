// PWA instalável — o Next serve isto em /manifest.webmanifest e injeta
// sozinho o <link rel="manifest"> no HTML das páginas.
export default function manifest() {
  return {
    name: 'Gestão — Conheça Farmácia',
    short_name: 'Gestão CF',
    description:
      'Plataforma interna de gestão de atividades, tarefas, eventos e entrevistas da equipa Conheça Farmácia.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#003528',
    theme_color: '#003528',
    lang: 'pt',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      // Maskable: preenche o espaço do ícone adaptativo do Android
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
