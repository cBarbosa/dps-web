'use client'
import { LoaderIcon } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function LogoutPage() {
	const { status: sessionStatus } = useSession()
	const router = useRouter()
	const params = useSearchParams()
	let cb = params.get('callbackUrl') || '/dashboard'
	if (cb === '/' || cb === 'null' || cb === 'undefined') cb = '/dashboard'
	if (!cb.startsWith('/')) cb = '/dashboard'

	useEffect(() => {
		const loginWithCb = `/login?callbackUrl=${encodeURIComponent(cb)}`
		if (sessionStatus === 'authenticated') {
			// Evita depender de NEXTAUTH_URL no servidor
			signOut({ redirect: false }).finally(() => {
				router.replace(loginWithCb)
			})
		} else if (sessionStatus === 'unauthenticated') {
			router.replace(loginWithCb)
		}
	}, [sessionStatus, router, cb])

	return (
		<div className="flex w-screen h-screen justify-center items-center">
			<LoaderIcon className="animate-spin" />
		</div>
	)
}
