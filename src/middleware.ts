import { withAuth } from 'next-auth/middleware'

export default withAuth({
	// Matches the pages config in `[...nextauth]`
	pages: {
		signIn: '/login',
	},

	callbacks: {
		// Called when the user is authenticated
		// Deny access if custom token expiration is reached
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

export const config = {
	// Exclui rotas públicas e as rotas internas do NextAuth para não bloquear o fluxo de login
	matcher: '/((?!api/auth|login|forgot-password|external|static|favicon.ico).*)',
}
