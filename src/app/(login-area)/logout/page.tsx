'use client'
import { LoaderIcon } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LogoutPage() {
	const { status: sessionStatus } = useSession()
	const router = useRouter()

	useEffect(() => {
		if (sessionStatus === 'authenticated') signOut()
		else router.push('/login')
	}, [sessionStatus, router])

	return (
		<div className="flex w-screen h-screen justify-center items-center">
			<LoaderIcon className="animate-spin" />
		</div>
	)
}
