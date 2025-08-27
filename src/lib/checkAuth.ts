import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { getServerSession } from 'next-auth'
import { redirect, RedirectType } from 'next/navigation'

function isSafeInternalPath(p?: string | null) {
	if (!p) return false
	if (p === 'null' || p === 'undefined') return false
	if (/^https?:\/\//i.test(p)) return false
	if (!p.startsWith('/')) return false
	if (p.startsWith('/logout') || p.startsWith('/login')) return false
	return true
}

export default async function checkAuth(callbackUrl?: string) {
	'use server'
	const session = await getServerSession(authOptions)

	if (session?.user) {
		const redirectPath = isSafeInternalPath(callbackUrl)
			? (callbackUrl as string)
			: '/dashboard'
		redirect(redirectPath, RedirectType.push)
	}
}
