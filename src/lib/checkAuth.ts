import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { getServerSession } from 'next-auth'
import { redirect, RedirectType } from 'next/navigation'

export default async function checkAuth() {
	'use server'
	const session = await getServerSession(authOptions)
	console.log('..............', session)

	if (session?.user) {
		const redirectPath = '/dashboard'
		redirect(redirectPath, RedirectType.push)
	}
}
