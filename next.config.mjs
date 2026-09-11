/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: import.meta.dirname,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Clickjacking: o painel nunca deve ser embutido em iframes
          { key: 'X-Frame-Options', value: 'DENY' },
          // Impede o browser de adivinhar MIME types (amplifica XSS)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Não vazar URLs internos (tokens, ids) via Referer
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // HTTPS obrigatório por 2 anos, incl. subdomínios
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // A app não usa câmara/micro/geolocalização
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
