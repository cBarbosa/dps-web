'use client'
import { useRouter } from 'next/navigation'
import { Button } from './button'

export function GoBackButton({
	children,
	className,
}: {
	className?: string
	children: React.ReactNode
}) {
	const router = useRouter()

	return (
		<Button variant="link" onClick={() => router.back()} className={className}>
			{children}
		</Button>
	)
}
