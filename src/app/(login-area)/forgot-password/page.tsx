import Link from 'next/link'
import ForgotPasswordForm from '../components/forgot-password-form'

export default function ForgotPasswordPage() {
	return (
		<div className="flex flex-row w-full h-screen min-h-min p-5">
			<div className="grow basis-1/3">
				<div className="flex h-full flex-col justify-between items-start">
					<div>Logo</div>
					<h2 className="text-4xl font-bold">
						Sistema de Emissão de Declaração Pessoal
					</h2>
				</div>
			</div>
			<div className="grow basis-2/3">
				<div className="w-full flex justify-end text-sm">
					<div>
						Ainda não possui conta? <Link href="/">Registrar-se</Link>
					</div>
				</div>
				<ForgotPasswordForm />
			</div>
		</div>
	)
}
