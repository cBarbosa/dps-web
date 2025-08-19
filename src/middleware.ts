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
	/^\/forgot-password(?:\/|$)/,
	/^\/external(?:\/|$)/,
	/^\/static\//,
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
		// Garante uma resposta mesmo se withAuth não retornar
		res = maybeRes ?? NextResponse.next()
	}

	// CSP dinâmica com nonce por requisição
	const nonce = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2))
	res.headers.set('x-nonce', nonce)

	const connectOrigins: string[] = []
	const raw = process.env.NEXT_PUBLIC_API_BASE_URL
	if (raw && raw !== 'null' && raw !== 'undefined' && /^https?:\/\//i.test(raw)) {
		try {
			connectOrigins.push(new URL(raw).origin)
		} catch {}
	}

	const csp = [
		"default-src 'self'",
		"base-uri 'self'",
		"frame-ancestors 'self'",
		"form-action 'self'",
		"object-src 'none'",
		"img-src 'self' data: blob: https:",
		"font-src 'self' data: https:",
		// Permite scripts somente com nonce gerado por requisição e 'self'
		`script-src 'self' 'nonce-${nonce}'`,
		"style-src 'self' 'unsafe-inline' https:",
		`connect-src 'self' ${connectOrigins.join(' ')} https:`,
	].join('; ')

	res.headers.set('Content-Security-Policy', csp)

	return res
}

export const config = {
	// Rodar em todas as rotas para permitir o rate limit do /api/auth
	matcher: '/(.*)',
}
