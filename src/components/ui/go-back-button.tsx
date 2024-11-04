'use client'
import { useRouter } from 'next/navigation'
import { Button } from './button'

export function GoBackButton({ children }: { children: React.ReactNode }) {
	const router = useRouter()

	return (
		<Button variant="link" onClick={() => router.back()}>
			{children}
		</Button>
	)
}
