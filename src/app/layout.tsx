import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import AppSessionProvider from '@/components/app-session-provider'
import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/auth-options'

const geistSans = localFont({
	src: './fonts/GeistVF.woff',
	variable: '--font-geist-sans',
	weight: '100 900',
})
const geistMono = localFont({
	src: './fonts/GeistMonoVF.woff',
	variable: '--font-geist-mono',
	weight: '100 900',
})

export const metadata: Metadata = {
	title: 'DPS Inteligente',
	description: 'Sistema de Emissão de Declaração Pessoal',
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const session = await getServerSession(authOptions)

	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<AppSessionProvider session={session}>{children}</AppSessionProvider>
			</body>
		</html>
	)
}
