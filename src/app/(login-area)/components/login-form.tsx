'use client'

import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { email, minLength, object, string, pipe, InferInput } from 'valibot'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import LabeledSeparator from '@/components/ui/labeled-separator'
import { signIn } from 'next-auth/react'
import InputPassword from '@/components/ui/input-password'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import DialogAlertComp from '@/components/ui/alert-dialog-comp'

const loginSchema = object({
	email: pipe(
		string(),
		minLength(1, 'Campo obrigatório.'),
		email('Email inválido.')
	),
	password: pipe(string(), minLength(1, 'Campo obrigatório.')),
})

type LoginSchema = InferInput<typeof loginSchema>

export default function LoginForm() {
	const {
		handleSubmit,
		getValues,
		trigger,
		setValue,
		control,
		reset,
		formState: { isSubmitting, isSubmitted, ...formState },
	} = useForm<LoginSchema>({
		resolver: valibotResolver(loginSchema),
	})

	const router = useRouter()

	const params = useSearchParams()

	const [dialogState, setDialogState] = useState({
		open: false,
		message: '',
		title: '',
	})

	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		router.refresh()
	}, [router])

	async function onSubmit(v: LoginSchema) {
		setIsLoading(true)

		const cbParam = params.get('callbackUrl') || '/dashboard'

		const result = await signIn('credentials', {
			email: v.email,
			password: v.password,
			redirect: false,
			callbackUrl: cbParam,
		})

		if (result === undefined) {
			setDialogState({
				open: true,
				title: 'Ocorreu um erro ao autenticar',
				message: 'Tente novamente.',
			})
			setIsLoading(false)

			return
		}

		if (result.status === 401) {
			setDialogState({
				open: true,
				title: 'Login inválido',
				message: result.error || 'Email ou senha inválidos.',
			})
			setIsLoading(false)
			return
		}

		if (!result.ok) {
			console.log('ERRO AO AUTENTICAR')

			setDialogState({
				open: true,
				title: 'Ocorreu um erro ao autenticar',
				message: 'Tente novamente.',
			})
			setIsLoading(false)
			return
		}

		// Determina destino final
		let redirectPath = params.get('callbackUrl') || ''
		if (!redirectPath) {
			const url = result.url
			if (url && url !== 'null' && url !== 'undefined') {
				try {
					const u = new URL(url, window.location.origin)
					redirectPath = u.origin === window.location.origin ? (u.pathname + u.search) : '/dashboard'
				} catch {
					redirectPath = '/dashboard'
				}
			} else {
				redirectPath = '/dashboard'
			}
		}

		if (!redirectPath.startsWith('/') || redirectPath.startsWith('/logout') || redirectPath === '/') {
			redirectPath = '/dashboard'
		}

		router.push(redirectPath)
	}

	return (
		<div className="flex flex-col items-center gap-4 h-full w-full">
			<div className="flex w-full items-center justify-center grow">
				<form
					onSubmit={handleSubmit(onSubmit)}
					className="flex flex-col gap-6 w-full max-w-96"
				>
					<h2 className="text-2xl font-semibold">Entrar</h2>

					<Controller
						control={control}
						defaultValue=""
						name="email"
						render={({ field: { onChange, onBlur, value, ref } }) => (
							<div>
								<Input
									id="email"
									type="email"
									placeholder="Endereço de E-mail"
									className={cn(
										'px-4 py-6 rounded-lg',
										formState.errors?.email &&
											'border-red-500 focus-visible:border-red-500'
									)}
									autoComplete="username"
									disabled={isSubmitting}
									onChange={onChange}
									onBlur={onBlur}
									value={value}
									ref={ref}
								/>
								<div className="text-xs text-red-500">
									{formState.errors?.email?.message}
								</div>
							</div>
						)}
					/>

					<Controller
						control={control}
						defaultValue=""
						name="password"
						render={({
							field: { onChange, onBlur, value, ref },
							formState,
						}) => (
							<div>
								<InputPassword
									id="password"
									placeholder="Senha"
									className={cn(
										'px-4 py-6 rounded-lg',
										formState.errors.password &&
											'border-red-500 focus-visible:border-red-500'
									)}
									autoComplete="current-password"
									disabled={isSubmitting}
									onChange={onChange}
									onBlur={onBlur}
									value={value}
									ref={ref}
								/>
								<div className="text-xs text-red-500">
									{formState.errors.password?.message}
								</div>
							</div>
						)}
					/>

					<Link href={'/forgot-password'}>Esqueceu a senha?</Link>

					<Button
						type="submit"
						disabled={isSubmitting || isLoading}
						className="py-6 text-base font-semibold"
					>
						{isSubmitting || isLoading ? 'Carregando...' : 'Entrar'}
					</Button>

					{/* <LabeledSeparator label="OU" className="text-xs" />

					<Button
						disabled={isSubmitting}
						onClick={() => signIn('google')}
						variant="outline"
						className="py-6 font-semibold"
						hidden={true}
					>
						<Image
							src={'/static/icons/ic_google_logo.svg'}
							width={24}
							height={24}
							alt="Google logo"
							className="mr-2"
						/>
						Google
					</Button> */}
				</form>
			</div>
			<div className="p-3 my-3 text-sm text-slate-500">
				Protegido por reCAPTCHA e sujeito as normas de{' '}
				<Link href="/">Política de privacidade</Link> e{' '}
				<Link href={'/'}>Termos de uso</Link>
				<p>
					Copyright © 2024 Techtrail - Todos os direitos reservados
				</p>
			</div>

			<DialogAlertComp
				open={dialogState.open}
				title={dialogState.title}
				onOpenChange={open => setDialogState(prev => ({ ...prev, open: open }))}
			>
				{dialogState.message}
			</DialogAlertComp>
		</div>
	)
}
