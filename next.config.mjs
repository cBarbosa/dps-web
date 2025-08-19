/** @type {import('next').NextConfig} */
// CSP dinâmica via middleware (usa nonce por requisição). Mantemos apenas headers estáticos aqui.

const nextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Ajuste os domínios de imagem permitidos conforme o backend/CDN
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  // Headers de segurança básicos
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}

export default nextConfig;
