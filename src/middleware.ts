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

export default function middleware(req: NextRequest) {
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
	if (isPublicPath(pathname)) {
		return NextResponse.next()
	}
	return authMiddleware(req)
}

export const config = {
	// Rodar em todas as rotas para permitir o rate limit do /api/auth
	matcher: '/(.*)',
}
