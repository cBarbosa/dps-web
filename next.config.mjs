/** @type {import('next').NextConfig} */
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
let apiOrigin = ''
try {
  if (apiBase) {
    apiOrigin = new URL(apiBase).origin
  }
} catch {}

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  // Removido 'unsafe-inline', 'unsafe-eval' e curinga https: para scripts
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https:",
  `connect-src 'self' ${apiOrigin} https:`,
].join('; ')

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
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ]
  },
}

export default nextConfig;
