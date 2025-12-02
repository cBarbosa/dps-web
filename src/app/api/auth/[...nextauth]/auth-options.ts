import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { AuthResponse } from '@/types/sales-channel'

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

				const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL
				const isValidBase = !!rawApiBase && /^https?:\/\//i.test(rawApiBase) && rawApiBase !== 'null' && rawApiBase !== 'undefined'
				const apiBase = isValidBase ? rawApiBase.replace(/\/$/, '') : null
				if (!apiBase) {
					if (process.env.DEBUG_AUTH === '1') {
						console.error('Auth configuration error: invalid NEXT_PUBLIC_API_BASE_URL', { rawApiBase })
					}
					throw new Error('Configuração de autenticação inválida')
				}
				const url = `${apiBase}/v1/Auth`

				try {
					const response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({ UserName: email, Password: password }),
					})

					if (response.status === 401) {
						throw new Error('Email ou senha inválido')
					}

					if (!response.ok) {
						const text = await response.text()
						if (process.env.DEBUG_AUTH === '1') {
							console.error('Auth error', { status: response.status, text })
						}
						throw new Error('Ocorreu um erro ao autenticar')
					}

					const json: AuthResponse = await response.json()

					if (json.success) {
						return {
							id: 'x',
							email: json.data.userData.email,
							name: json.data.userData.name,
							accessToken: json.data.accessToken,
							role: json.data.role,
							expires: json.data.expires,
							channels: json.data.userData.channels || [],
							lastChannel: json.data.userData.lastChannel || null,
						}
					}

					return null
				} catch (e) {
					if (process.env.DEBUG_AUTH === '1') {
						console.error('Authorize exception', { error: (e as Error).message, endpoint: url, email })
					}
					throw e
				}
			},
		}),
	],
	callbacks: {
		async jwt({ token, user, trigger, session }) {
			if (user) {
				token = Object.assign({}, token, {
					accessToken: (user as any).accessToken,
					role: (user as any).role,
					expires: (user as any).expires,
					channels: (user as any).channels || [],
					lastChannel: (user as any).lastChannel || null,
				})
			}
			
			// Se update() foi chamado com novos dados (ex: após trocar canal)
			if (trigger === 'update' && session) {
				// Atualizar token com os dados fornecidos no update()
				if ((session as any).accessToken) {
					token.accessToken = (session as any).accessToken
				}
				if ((session as any).expires) {
					token.expires = (session as any).expires
				}
				if ((session as any).role) {
					token.role = (session as any).role
				}
				if ((session as any).channels !== undefined) {
					token.channels = (session as any).channels || []
				}
				if ((session as any).lastChannel !== undefined) {
					token.lastChannel = (session as any).lastChannel || null
				}
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
				channels: (token.channels as any) || [],
				lastChannel: (token.lastChannel as any) || null,
				// expires: token.expires,
			})
			return session;
		},
	},
	pages: {
		signIn: '/login',
	},
}
