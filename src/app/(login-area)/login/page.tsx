import Link from 'next/link'
import LoginForm from '../components/login-form'

export default function LoginPage() {
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
