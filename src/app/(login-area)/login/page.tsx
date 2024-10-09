import Link from 'next/link'
import LoginForm from '../components/login-form'
import checkAuth from '@/lib/checkAuth'

export default async function LoginPage() {
	await checkAuth()
	return (
		<>
			<div className="w-full flex justify-end text-sm">
				<div>
					Ainda não possui conta? <Link href="/">Registrar-se</Link>
				</div>
			</div>
			<LoginForm />
		</>
	)
}
