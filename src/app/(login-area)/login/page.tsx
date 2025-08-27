import Link from 'next/link'
import LoginForm from '../components/login-form'
import checkAuth from '@/lib/checkAuth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LoginPage({
	searchParams,
}: {
	searchParams?: { callbackUrl?: string }
}) {
	await checkAuth(searchParams?.callbackUrl)
	return (
		<>
			<div className="w-full flex justify-end text-sm">
				<div className='hidden'>
					Ainda não possui conta? <Link href="/">Registrar-se</Link>
				</div>
			</div>
			<LoginForm />
		</>
	)
}
