'use server'

import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'
import { redirect, RedirectType } from 'next/navigation'

export default async function checkAuth() {
	const session = await getServerSession(authOptions)
	console.log('..............', session)

	if (session?.user) {
		const redirectPath = '/dashboard'
		// revalidatePath(redirectPath)
		redirect(redirectPath, RedirectType.push)
	}
}
