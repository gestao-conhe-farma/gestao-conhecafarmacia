import { Inter, Fraunces } from 'next/font/google'
import '@/styles/globals.css'
import { TemaProvider } from '@/components/TemaProvider'
import RegistaSW from './RegistaSW'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  variable: '--font-inter',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  variable: '--font-fraunces',
})

export const metadata = {
  title: {
    default: 'Gestão — Conheça Farmácia',
    template: '%s | Gestão · Conheça Farmácia',
  },
  description:
    'Plataforma interna de gestão de atividades, tarefas, eventos e entrevistas da equipa Conheça Farmácia.',
  robots: { index: false, follow: false },
  icons: {
    icon: '/icon.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

// PWA: barra do sistema na cor da marca (o manifest é injetado
// automaticamente pelo Next a partir de app/manifest.js)
export const viewport = {
  themeColor: '#003528',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt" suppressHydrationWarning className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        {/* Anti-FOUC: aplica o tema guardado antes da hidratação */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
        <TemaProvider>
          <RegistaSW />
          {children}
        </TemaProvider>
      </body>
    </html>
  )
}
