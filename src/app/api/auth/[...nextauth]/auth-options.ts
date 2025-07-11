import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions: NextAuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
		CredentialsProvider({
			type: 'credentials',
			name: 'Credenciais',
			credentials: {},
			async authorize(credentials, req) {
				const { email, password } = credentials as {
					email: string
					password: string
				}

				const response = await fetch(
					process.env.NEXT_PUBLIC_API_BASE_URL + 'v1/Auth',
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							UserName: email,
							Password: password,
						}),
					}
				)

				if (response.status === 401) {
					throw new Error('Email ou senha inválido')
				}

				if (!response.ok) {
					throw new Error('Ocorreu um erro ao autenticar')
				}

				const json = await response.json()

				if (json.success) {
					return {
						id: 'x',
						email: json.data.userData.email,
						name: json.data.userData.name,
						accessToken: json.data.accessToken,
						role: json.data.role,
						expires: json.data.expires,
					};
				}

				return null;
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token = Object.assign({}, token, {
					accessToken: (user as any).accessToken,
					role: (user as any).role,
					expires: (user as any).expires,
				})
			}
			return token
		},
		async session({ session, token }) {

			if (new Date(token.expires as string) < new Date()) {

				return {
					user: undefined,
					expires: (token.expires as string) ?? '',
				}
			}
			session = Object.assign({}, session, {
				accessToken: token.accessToken,
				role: token.role,
				// expires: token.expires,
			})
			return session;
		},
	},
	pages: {
		signIn: '/login',
	},
}
