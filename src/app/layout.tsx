import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import AppSessionProvider from '@/components/app-session-provider'
import ThemeProvider from '@/components/theme-provider'
import getServerSessionAuthorization from '@/hooks/getServerSessionAuthorization'

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
	title: 'Subscrição Inteligente',
	description: 'Módulo de Subscrição de Riscos',
	referrer: 'no-referrer',
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const { session, granted } = await getServerSessionAuthorization()

	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<AppSessionProvider session={session}>
					<ThemeProvider role={session?.role}>{children}</ThemeProvider>
				</AppSessionProvider>
			</body>
		</html>
	)
}
