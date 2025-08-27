import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from 'next-auth/middleware'

const WINDOW_MS = 60_000
const MAX_REQ = 10
const rateStore = new Map<string, { count: number; expires: number }>()

const authMiddleware = withAuth({
	pages: {
		signIn: '/login',
	},
	callbacks: {
		authorized: ({ token }) => {
			if (!token) return false
			const expires = (token as unknown as { expires?: string }).expires
			if (!expires) return true
			try {
				return new Date(expires) > new Date()
			} catch {
				return true
			}
		},
	},
})

const PUBLIC_PATHS = [
	/^\/api\/auth(?:\/|$)/,
	/^\/login(?:\/|$)/,
	/^\/logout(?:\/|$)/,
	/^\/forgot-password(?:\/|$)/,
	/^\/external(?:\/|$)/,
	/^\/static\//,
	/^\/_next\//,
	/^\/favicon\.ico$/i,
]

function isPublicPath(pathname: string) {
	return PUBLIC_PATHS.some(rx => rx.test(pathname))
}

export default async function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl

	// Rate limit somente para tentativas de login (NextAuth)
	if (pathname.startsWith('/api/auth') && req.method === 'POST') {
		const ip =
			req.ip ||
			req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			'unknown'
		const now = Date.now()
		const entry = rateStore.get(ip)
		if (!entry || entry.expires < now) {
			rateStore.set(ip, { count: 1, expires: now + WINDOW_MS })
		} else if (entry.count >= MAX_REQ) {
			const retryAfter = Math.max(1, Math.ceil((entry.expires - now) / 1000))
			const res = new NextResponse(
				JSON.stringify({ error: 'Too Many Requests' }),
				{
					status: 429,
				}
			)
			res.headers.set('Content-Type', 'application/json')
			res.headers.set('Retry-After', String(retryAfter))
			return res
		} else {
			entry.count += 1
			rateStore.set(ip, entry)
		}
	}

	// Pula auth nas rotas públicas; aplica auth nas demais
	let res: NextResponse | undefined
	if (isPublicPath(pathname)) {
		res = NextResponse.next()
	} else {
		const maybeRes = await (authMiddleware as unknown as (req: NextRequest) => NextResponse | undefined | Promise<NextResponse | undefined>)(req)

		// Se houve redirect para /login por falta/expiração de sessão,
		// direciona para /logout preservando callbackUrl para limpar cookies.
		const location = maybeRes?.headers.get('Location') || ''
		const isRedirect = (maybeRes?.status ?? 0) >= 300 && (maybeRes?.status ?? 0) < 400
		const isToLogin = /\/login(?:\?|$)/.test(location)

		if (isRedirect && isToLogin && req.method === 'GET' && !pathname.startsWith('/api')) {
			const cb = req.nextUrl.pathname + req.nextUrl.search
			const logoutUrl = new URL(`/logout?callbackUrl=${encodeURIComponent(cb)}`, req.url)
			return NextResponse.redirect(logoutUrl)
		}

		// Garante uma resposta mesmo se withAuth não retornar
		res = maybeRes ?? NextResponse.next()
	}

	// CSP
	const connectOrigins: string[] = []
	const raw = process.env.NEXT_PUBLIC_API_BASE_URL
	if (raw && raw !== 'null' && raw !== 'undefined' && /^https?:\/\//i.test(raw)) {
		try {
			connectOrigins.push(new URL(raw).origin)
		} catch {}
	}

	// Configuração única para todos os ambientes
	const scriptSrc = "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:"

	const csp = [
		"default-src 'self' blob: data:",
		"base-uri 'self'",
		"frame-ancestors 'self'",
		"form-action 'self'",
		"object-src 'none'",
		"img-src 'self' data: blob: https:",
		"font-src 'self' data: https:",
		scriptSrc,
		// Permite iframes para visualização de PDFs gerados via blob:
		"frame-src 'self' blob: data:",
		// Compatibilidade com navegadores que ainda respeitam child-src
		"child-src 'self' blob: data:",
		// Opcional: caso haja uso de web workers carregados via blob:
		"worker-src 'self' blob:",
		// Permite estilos inline (necessário para Tailwind/Next) e de origens HTTPS
		"style-src 'self' 'unsafe-inline' https:",
		`connect-src 'self' ${connectOrigins.join(' ')} https: ws: wss:`,
	].join('; ')

	res.headers.set('Content-Security-Policy', csp)

	return res
}

export const config = {
	// Rodar em todas as rotas para permitir o rate limit do /api/auth
	matcher: '/(.*)',
}
